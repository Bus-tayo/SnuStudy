"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchTaskById } from "@/lib/repositories/taskDetailRepo";
import { fetchTaskPdfMaterial } from "@/lib/repositories/taskMaterialsRepo";
import { fetchTaskSubmissions, createTaskSubmission } from "@/lib/repositories/taskSubmissionsRepo";
import { uploadTaskSubmissionImageJpg } from "@/lib/storage/taskSubmissionStorage";

import TaskDetailTopBar from "./parts/TaskDetailTopBar";
import TaskPdfSection from "./parts/TaskPdfSection";
import SubmissionCarousel from "./parts/SubmissionCarousel";
import SubmissionUploadBar from "./parts/SubmissionUploadBar";
import NoteInput from "./parts/NoteInput";

export default function TaskDetailScreen({ taskId }) {
  const router = useRouter();

  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [task, setTask] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);

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

        const [t, p, s] = await Promise.all([
          fetchTaskById({ taskId }),
          fetchTaskPdfMaterial({ taskId }).catch(() => null),
          fetchTaskSubmissions({ taskId, menteeId }).catch(() => []),
        ]);

        if (!alive) return;

        setTask(t);
        setPdf(p);
        setSubmissions(Array.isArray(s) ? s : []);
        setActiveIndex(0);
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

  return (
    <div className="flex flex-col h-full">
      <TaskDetailTopBar
        title={task?.title ?? "과제"}
        subtitle={task?.date ? `${task.date} · ${task.subject}` : (task?.subject ?? "")}
        onBack={() => router.back()}
      />

      <div className="flex-1 overflow-y-auto px-4 pb-28 pt-3 space-y-4">
        {errMsg ? (
          <div className="text-sm text-red-600">{errMsg}</div>
        ) : null}

        <TaskPdfSection pdf={pdf} />

        <NoteInput value={note} onChange={setNote} />

        <SubmissionCarousel
          submissions={submissions}
          activeIndex={activeIndex}
          onChangeIndex={setActiveIndex}
        />

        {activeSubmission?.submitted_at ? (
          <div className="text-xs text-neutral-500">
            최근 제출: {String(activeSubmission.submitted_at).replace("T", " ").slice(0, 19)}
          </div>
        ) : null}
      </div>

      <SubmissionUploadBar
        busy={busy}
        onCameraOrUpload={openPicker}
      />

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
