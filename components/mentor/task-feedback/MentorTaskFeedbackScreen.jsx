"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getAuthSession,
  resolveAppUserFromSession,
  persistAppUserToStorage,
} from "@/lib/auth/session";

import { fetchTaskById } from "@/lib/repositories/taskDetailRepo";
import { fetchTaskFeedback, upsertTaskFeedback } from "@/lib/repositories/taskFeedbacksRepo";
import { fetchTaskSubmissions } from "@/lib/repositories/taskSubmissionsRepo";

import { fetchAllTags, upsertTagByName } from "@/lib/repositories/tagsRepo";
import { fetchFeedbackTags, syncAutoTags, syncManualTags } from "@/lib/repositories/taskFeedbackTagsRepo";
import { fetchTaskPdfMaterials, uploadTaskMaterialPdf, deleteTaskMaterial } from "@/lib/repositories/taskMaterialsRepo";

import { addPointLedger } from "@/lib/repositories/pointsRepo";

import DifficultyPicker from "./DifficultyPicker";
import MarkdownEditor from "./MarkdownEditor";
import TagPicker from "./TagPicker";
import MarkdownViewer from "./MarkdownViewer";
import SubmissionCarousel from "@/components/mentee/tasks/parts/SubmissionCarousel";

function difficultyPoints(tier) {
  if (tier === "DIAMOND") return 50;
  if (tier === "PLATINUM") return 35;
  if (tier === "GOLD") return 25;
  if (tier === "SILVER") return 15;
  return 8; // BRONZE
}

function extractAutoTagIds({ body, tags }) {
  const text = String(body ?? "");
  if (!text.trim()) return [];

  const lowered = text.toLowerCase();
  const matched = [];

  for (const t of tags ?? []) {
    const name = String(t?.name ?? "");
    const aliases = Array.isArray(t?.aliases) ? t.aliases : [];
    const candidates = [name, ...aliases].filter(Boolean).map((x) => String(x));

    const hit = candidates.some((c) => {
      const needle = c.toLowerCase();
      return needle && lowered.includes(needle);
    });

    if (hit) matched.push(t.id);
  }

  return Array.from(new Set(matched));
}

export default function MentorTaskFeedbackScreen({ taskId }) {
  const router = useRouter();

  // ✅ 핵심: prop이 string으로 들어와도 항상 number로 고정
  const taskIdNum = useMemo(() => Number(taskId), [taskId]);

  const [boot, setBoot] = useState(false);
  const [mentorId, setMentorId] = useState(null);

  const [task, setTask] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const [difficulty, setDifficulty] = useState("BRONZE");
  const [body, setBody] = useState("");

  const [allTags, setAllTags] = useState([]);
  const [autoTagIds, setAutoTagIds] = useState([]);
  const [manualTagIds, setManualTagIds] = useState([]);

  const [saving, setSaving] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [deletingPdf, setDeletingPdf] = useState(false);
  const [err, setErr] = useState("");
  const [pdfErr, setPdfErr] = useState("");

  // auth bootstrap
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { session } = await getAuthSession();
        if (!session) {
          router.replace("/login");
          return;
        }
        const appUser = await resolveAppUserFromSession(session);
        persistAppUserToStorage(appUser);

        if (appUser.role !== "MENTOR") {
          router.replace("/login");
          return;
        }
        if (!alive) return;

        setMentorId(appUser.appUserId);
        setBoot(true);
      } catch (e) {
        console.error("[MentorTaskFeedbackScreen/bootstrap]", e);
        router.replace("/login");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // data load
  useEffect(() => {
    if (!boot || !mentorId) return;

    if (!Number.isFinite(taskIdNum) || taskIdNum <= 0) {
      setErr("잘못된 taskId 입니다.");
      return;
    }

    let alive = true;
    (async () => {
      try {
        setErr("");

        const t = await fetchTaskById({ taskId: taskIdNum });
        setTask(t);

        if (!alive) return;
        const [f, tags, pList, subList] = await Promise.all([
          fetchTaskFeedback({ taskId: taskIdNum }).catch(() => null),
          fetchAllTags().catch(() => []),
          fetchTaskPdfMaterials({ taskId: taskIdNum }).catch(() => []),
          fetchTaskSubmissions({ taskId: taskIdNum, menteeId: t.mentee_id }).catch(() => []),
        ]);

        if (!alive) return;

        setFeedback(f);
        setPdfs(pList);
        setSubmissions(subList);
        setActiveIndex(0);

        setBody(f?.body ?? "");
        setDifficulty(f?.difficulty ?? "BRONZE");

        setAllTags(tags ?? []);

        if (f?.id) {
          const ft = await fetchFeedbackTags({ taskFeedbackId: f.id });
          const auto = ft.filter((x) => x.source === "AUTO").map((x) => x.tag_id);
          const manual = ft.filter((x) => x.source === "MANUAL").map((x) => x.tag_id);
          setAutoTagIds(auto);
          setManualTagIds(manual);
        } else {
          setAutoTagIds([]);
          setManualTagIds([]);
        }
      } catch (e) {
        console.error("[MentorTaskFeedbackScreen/load]", e);
        if (!alive) return;
        setErr(e?.message ?? "불러오기에 실패했습니다.");
      }
    })();

    return () => {
      alive = false;
    };
  }, [boot, mentorId, taskIdNum]);

  // auto-tags preview update (local)
  useEffect(() => {
    const next = extractAutoTagIds({ body, tags: allTags });
    setAutoTagIds(next);
  }, [body, allTags]);

  const headerSubtitle = useMemo(() => {
    if (!task) return "";
    return `${task.date ?? ""} · ${task.subject ?? ""}`;
  }, [task]);

  const onAddManualTagByName = async (name) => {
    const trimmed = String(name ?? "").trim();
    if (!trimmed) return;

    const tag = await upsertTagByName({ name: trimmed });
    setAllTags((prev) => {
      const exists = prev.some((x) => x.id === tag.id);
      return exists ? prev : [...prev, tag];
    });
    setManualTagIds((prev) => Array.from(new Set([...prev, tag.id])));
  };

  const onSave = async () => {
    // ✅ 조용히 return 금지: 에러를 화면에 보여줌
    if (!Number.isFinite(taskIdNum) || taskIdNum <= 0) {
      setErr("잘못된 taskId 입니다.");
      return;
    }
    if (!mentorId) {
      setErr("멘토 정보가 없습니다. 다시 로그인 해주세요.");
      return;
    }
    if (!task?.id) {
      setErr("할 일을 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    try {
      setSaving(true);
      setErr("");

      const menteeId = task.mentee_id;

      // ✅ 여기서부터는 네트워크 요청 반드시 발생
      const saved = await upsertTaskFeedback({
        taskId: task.id,
        menteeId,
        mentorId,
        difficulty,
        body,
      });

      const autoIds = extractAutoTagIds({ body, tags: allTags });
      await syncAutoTags({ taskFeedbackId: saved.id, tagIds: autoIds });
      await syncManualTags({
        taskFeedbackId: saved.id,
        tagIds: manualTagIds,
        actorUserId: mentorId,
      });

      await addPointLedger({
        menteeId,
        sourceType: "DIFFICULTY_REWARD",
        points: difficultyPoints(difficulty),
        sourceId: task.id,
        sourceKey: `DIFFICULTY:${task.id}`,
      });

      setFeedback(saved);
      setAutoTagIds(autoIds);
    } catch (e) {
      console.error("[MentorTaskFeedbackScreen/save]", e);
      setErr(e?.message ?? "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const onUploadPdf = async (file) => {
    if (!file) return;
    if (!mentorId) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("파일 크기는 10MB 이하여야 합니다.");
      return;
    }

    try {
      setUploadingPdf(true);
      setPdfErr("");

      const newPdf = await uploadTaskMaterialPdf({
        taskId: taskIdNum,
        file,
        uploaderId: mentorId,
      });
      setPdfs((prev) => [newPdf, ...prev]);
    } catch (e) {
      console.error("[MentorTaskFeedbackScreen/uploadPdf]", e);
      setPdfErr(e?.message ?? "PDF 업로드 실패");
    } finally {
      setUploadingPdf(false);
    }
  };

  const onDeletePdf = async (materialId) => {
    if (!mentorId) return;
    if (!confirm("정말 이 자료를 삭제하시겠습니까?")) return;

    try {
      setDeletingPdf(true);
      setPdfErr("");
      await deleteTaskMaterial({ materialId, uploaderId: mentorId });
      setPdfs((prev) => prev.filter((x) => x.id !== materialId));
    } catch (e) {
      console.error("[MentorTaskFeedbackScreen/deletePdf]", e);
      setPdfErr(e?.message ?? "자료 삭제 실패");
    } finally {
      setDeletingPdf(false);
    }
  };

  if (!boot) return null;

  const saveDisabled = saving || !task?.id;

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 w-full max-w-[430px] mx-auto shadow-xl">
      <header className="px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-10 flex items-center justify-between">
        <div>
          <div className="text-xs text-foreground/60">{headerSubtitle}</div>
          <div className="text-lg font-extrabold">{task?.title ?? "피드백 작성"}</div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={() => router.back()}>
            뒤로
          </button>
          <button
            type="button"
            className="btn-primary disabled:opacity-60"
            onClick={onSave}
            disabled={saveDisabled}
          >
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        {err ? <div className="text-sm text-red-600">{err}</div> : null}

        <div className="card-base p-3 space-y-3">
          <div className="text-sm font-extrabold">난이도</div>
          <DifficultyPicker value={difficulty} onChange={setDifficulty} />
        </div>

        <SubmissionCarousel
          submissions={submissions}
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
        />

        <div className="card-base p-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-extrabold">피드백 (Markdown)</div>
            <div className="text-xs text-foreground/60">멘티에게 그대로 보여요</div>
          </div>
          <MarkdownEditor value={body} onChange={setBody} />
        </div>

        <div className="card-base p-3 space-y-3">
          <div className="text-sm font-extrabold">학습 자료 (PDF)</div>

          {pdfErr ? <div className="text-xs text-red-600 bg-red-50 p-2 rounded">{pdfErr}</div> : null}

          {pdfs.length > 0 ? (
            <div className="space-y-2">
              {pdfs.map((pdf) => (
                <div key={pdf.id} className="flex items-center justify-between border p-2 rounded bg-neutral-50 px-3">
                  <a
                    href={pdf.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-blue-600 underline truncate flex-1 min-w-0 mr-2"
                  >
                    {pdf.title}
                  </a>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 whitespace-nowrap">등록됨</span>
                    <button
                      type="button"
                      onClick={() => onDeletePdf(pdf.id)}
                      className="text-xs text-red-500 hover:opacity-80 font-bold px-1"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">등록된 PDF가 없습니다.</div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="file"
              accept="application/pdf"
              disabled={uploadingPdf}
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onUploadPdf(e.target.files[0]);
                  e.target.value = ""; // reset
                }
              }}
              className="text-sm w-full file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-90 transition-opacity"
            />
          </div>
          {uploadingPdf && <div className="text-xs text-blue-500">업로드 중...</div>}
        </div>


        <div className="card-base p-3 space-y-2">
          <div className="text-sm font-extrabold">태그</div>
          <TagPicker
            allTags={allTags}
            autoTagIds={autoTagIds}
            manualTagIds={manualTagIds}
            onChangeManual={setManualTagIds}
            onCreateTag={onAddManualTagByName}
          />
        </div>

        <div className="card-base p-3 space-y-2">
          <div className="text-sm font-extrabold">미리보기</div>
          <MarkdownViewer markdown={body} />
        </div>
      </main>
    </div>
  );
}
