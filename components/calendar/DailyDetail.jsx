"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay } from "date-fns";
import { useCalendar } from "./CalendarContext";
import { updateTaskStatus } from "@/lib/repositories/tasksRepo";

function normalizeToDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isDone(task) {
  return String(task?.status || "").toUpperCase() === "DONE";
}

export function DailyDetail() {
  const router = useRouter();
  const { selectedDate, tasks } = useCalendar();

  const [localTasks, setLocalTasks] = useState([]);
  useEffect(() => {
    setLocalTasks(Array.isArray(tasks) ? tasks : []);
  }, [tasks]);

  const dailyTasks = useMemo(() => {
    return localTasks.filter((t) => {
      const td = normalizeToDate(t?.date);
      return td ? isSameDay(td, selectedDate) : false;
    });
  }, [localTasks, selectedDate]);

  const [busyId, setBusyId] = useState(null);

  const toggle = async (task) => {
    const tid = task?.id;
    if (!Number.isFinite(tid)) return;

    const prevDone = isDone(task);
    const nextStatus = prevDone ? "TODO" : "DONE";

    setLocalTasks((prev) => prev.map((t) => (t?.id === tid ? { ...t, status: nextStatus } : t)));

    try {
      setBusyId(tid);
      await updateTaskStatus({ taskId: tid, status: nextStatus });
    } catch (e) {
      setLocalTasks((prev) => prev.map((t) => (t?.id === tid ? { ...t, status: prevDone ? "DONE" : "TODO" } : t)));
      alert(e?.message || "상태 변경 실패");
    } finally {
      setBusyId(null);
    }
  };

  const goDetail = (task) => {
    const tid = task?.id;
    if (!Number.isFinite(tid)) {
      alert("이 task에는 id가 없습니다. (캘린더에 주입되는 tasks 데이터에 id 포함 필요)");
      return;
    }
    router.push(`/mentee/tasks/${tid}`);
  };

  return (
    <div className="p-6 border-t border-gray-200 bg-white">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{format(selectedDate, "yyyy-MM-dd")}</h3>

      {dailyTasks.length === 0 ? (
        <p className="text-gray-400 italic">과제가 없습니다.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dailyTasks.map((task) => {
            const tid = task?.id;
            const done = isDone(task);
            const title = task?.title ?? "(제목 없음)";
            const subject = task?.subject ?? "";
            const disabled = busyId === tid;

            return (
              <div key={String(tid)} className="p-4 rounded-xl border border-gray-200 bg-slate-50 hover:bg-slate-100 transition">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 accent-blue-500"
                    checked={done}
                    disabled={disabled}
                    onChange={() => toggle(task)}
                  />

                  <button type="button" className="flex-1 text-left" onClick={() => goDetail(task)}>
                    <div className={`font-medium ${done ? "line-through text-gray-400" : "text-gray-800"}`}>{title}</div>
                    {subject ? <div className="text-xs text-gray-500 mt-1">{subject}</div> : null}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
