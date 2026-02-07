"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchTaskById } from "@/lib/repositories/taskDetailRepo";
import { fetchTaskPdfMaterial } from "@/lib/repositories/taskMaterialsRepo";
import { fetchTaskSubmissions, createTaskSubmission } from "@/lib/repositories/taskSubmissionsRepo";
import { uploadTaskSubmissionImageJpg } from "@/lib/storage/taskSubmissionStorage";

import { fetchTaskFeedback } from "@/lib/repositories/taskFeedbacksRepo";
import { fetchAllTags, upsertTagByName } from "@/lib/repositories/tagsRepo";
import { fetchFeedbackTags, syncManualTags } from "@/lib/repositories/taskFeedbackTagsRepo";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import TaskDetailTopBar from "./parts/TaskDetailTopBar";
import TaskPdfSection from "./parts/TaskPdfSection";
import SubmissionCarousel from "./parts/SubmissionCarousel";
import SubmissionUploadBar from "./parts/SubmissionUploadBar";
import NoteInput from "./parts/NoteInput";

function difficultyLabel(v) {
  if (v === "DIAMOND") return "다이아";
  if (v === "PLATINUM") return "플래티넘";
  if (v === "GOLD") return "골드";
  if (v === "SILVER") return "실버";
  if (v === "BRONZE") return "브론즈";
  return "";
}

export default function TaskDetailScreen({ taskId }) {
  const router = useRouter();

  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [task, setTask] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [feedback, setFeedback] = useState(null);

  const [allTags, setAllTags] = useState([]);
  const [tagRows, setTagRows] = useState([]); // join rows
  const [manualTagIds, setManualTagIds] = useState([]);
  const [newTagName, setNewTagName] = useState("");

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const inputRef = useRef(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        setErrMsg("");
        if (!menteeId) {
          setErrMsg("로그인이 필요합니다.");
          return;
        }
        if (!Number.isFinite(taskId) || taskId <= 0) {
          setErrMsg("잘못된 taskId 입니다.");
          return;
        }

        const [t, p, s, f, tags] = await Promise.all([
          fetchTaskById({ taskId }),
          fetchTaskPdfMaterial({ taskId }).catch(() => null),
          fetchTaskSubmissions({ taskId, menteeId }).catch(() => []),
          fetchTaskFeedback({ taskId }).catch(() => null),
          fetchAllTags().catch(() => []),
        ]);

        if (!alive) return;

        setTask(t);
        setPdf(p);
        setSubmissions(Array.isArray(s) ? s : []);
        setActiveIndex(0);
        setFeedback(f);
        setAllTags(tags);

        if (f?.id) {
          const rows = await fetchFeedbackTags({ taskFeedbackId: f.id });
          setTagRows(rows);
          setManualTagIds(rows.filter((x) => x.source === "MANUAL").map((x) => x.tag_id));
        } else {
          setTagRows([]);
          setManualTagIds([]);
        }
      } catch (e) {
        if (!alive) return;
        setErrMsg(e?.message || "불러오기에 실패했습니다.");
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [taskId, menteeId]);

  const activeSubmission = submissions?.[activeIndex] ?? null;

  const openPicker = () => {
    setErrMsg("");
    inputRef.current?.click();
  };

  const onPickFile = async (file) => {
    if (!file) return;
    setErrMsg("");

    try {
      setBusy(true);

      if (!menteeId) throw new Error("로그인이 필요합니다.");

      const { publicUrl } = await uploadTaskSubmissionImageJpg({
        file,
        taskId,
        menteeId,
      });

      const inserted = await createTaskSubmission({
        taskId,
        menteeId,
        imageUrl: publicUrl,
        note: note?.trim() ? note.trim() : null,
      });

      const next = [inserted, ...submissions];
      setSubmissions(next);
      setActiveIndex(0);
      setNote("");
    } catch (e) {
      setErrMsg(e?.message || "업로드에 실패했습니다.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const resolvedTags = useMemo(() => {
    const map = new Map((allTags ?? []).map((t) => [t.id, t]));
    return (tagRows ?? [])
      .map((r) => ({ ...r, tag: map.get(r.tag_id) }))
      .filter((x) => x.tag?.name);
  }, [allTags, tagRows]);

  const onAddManualTag = async () => {
    if (!feedback?.id) {
      setErrMsg("피드백이 아직 없어서 태그를 달 수 없어요.");
      return;
    }
    const name = newTagName.trim();
    if (!name) return;

    try {
      setErrMsg("");
      const tag = await upsertTagByName({ name });
      const next = Array.from(new Set([...(manualTagIds ?? []), tag.id]));
      setManualTagIds(next);

      await syncManualTags({
        taskFeedbackId: feedback.id,
        tagIds: next,
        actorUserId: menteeId, // ✅ 멘티도 수동 태그 가능
      });

      const rows = await fetchFeedbackTags({ taskFeedbackId: feedback.id });
      setTagRows(rows);
      setNewTagName("");
    } catch (e) {
      setErrMsg(e?.message ?? "태그 추가 실패");
    }
  };

  const onRemoveManualTag = async (tagId) => {
    if (!feedback?.id) return;
    try {
      const next = (manualTagIds ?? []).filter((x) => x !== tagId);
      setManualTagIds(next);
      await syncManualTags({
        taskFeedbackId: feedback.id,
        tagIds: next,
        actorUserId: menteeId,
      });
      const rows = await fetchFeedbackTags({ taskFeedbackId: feedback.id });
      setTagRows(rows);
    } catch (e) {
      setErrMsg(e?.message ?? "태그 삭제 실패");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TaskDetailTopBar
        title={task?.title ?? "과제"}
        subtitle={task?.date ? `${task.date} · ${task.subject}` : (task?.subject ?? "")}
        onBack={() => router.back()}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3 space-y-4">
        {errMsg ? <div className="text-sm text-red-600">{errMsg}</div> : null}

        <TaskPdfSection pdf={pdf} />

        {/* ✅ 멘토 피드백 */}
        <div className="card-base p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold">멘토 피드백</div>
            {feedback?.difficulty ? (
              <div className="badge-base bg-secondary text-secondary-foreground border-border">
                난이도 · {difficultyLabel(feedback.difficulty)}
              </div>
            ) : (
              <div className="text-xs text-foreground/60">아직 피드백이 없어요</div>
            )}
          </div>

          {feedback?.body ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {feedback.body}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-sm text-foreground/60">멘토가 피드백을 남기면 여기에 표시돼요.</div>
          )}

          {/* 태그 표시 */}
          <div className="pt-2 space-y-2">
            <div className="text-xs text-foreground/60">태그</div>
            <div className="flex flex-wrap gap-2">
              {resolvedTags.length === 0 ? (
                <div className="text-xs text-foreground/60">태그 없음</div>
              ) : (
                resolvedTags.map((r) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-full text-xs border border-border bg-background"
                  >
                    #{r.tag.name}{r.source === "AUTO" ? "" : " · 수동"}
                  </span>
                ))
              )}
            </div>

            {/* ✅ 멘티도 수동 태그 추가/삭제 가능 */}
            <div className="flex items-center gap-2">
              <input
                className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background"
                placeholder="수동 태그 추가 (예: 적분)"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
              />
              <button className="btn-secondary" onClick={onAddManualTag}>
                추가
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {(manualTagIds ?? []).map((id) => {
                const t = (allTags ?? []).find((x) => x.id === id);
                if (!t) return null;
                return (
                  <button
                    key={id}
                    type="button"
                    className="px-2.5 py-1 rounded-full text-xs border border-border bg-secondary text-secondary-foreground"
                    onClick={() => onRemoveManualTag(id)}
                  >
                    #{t.name} ✕
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <NoteInput value={note} onChange={setNote} />

        <SubmissionCarousel
          submissions={submissions}
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
        />

        {activeSubmission?.submitted_at ? (
          <div className="text-xs text-foreground/60">
            최근 제출: {String(activeSubmission.submitted_at).replace("T", " ").slice(0, 19)}
          </div>
        ) : null}
      </div>

      <SubmissionUploadBar busy={busy} onCameraOrUpload={openPicker} />

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg"
        className="hidden"
        onChange={(e) => onPickFile(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}
