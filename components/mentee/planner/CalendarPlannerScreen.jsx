"use client";

import { useEffect, useMemo, useState } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

import { CalendarRoot } from "@/components/calendar/CalendarRoot";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";

import TimeTableContainer from "@/components/timetable/TimeTableContainer";

export default function CalendarPlannerScreen() {
  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [tasks, setTasks] = useState([]);
  const [viewMode, setViewMode] = useState("week"); // CalendarContext 기본이 week라 맞춤
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [err, setErr] = useState("");

  async function loadRange(date, mode) {
    if (!menteeId) return;

    const start = mode === "month" ? startOfMonth(date) : startOfWeek(date);
    const end = mode === "month" ? endOfMonth(date) : endOfWeek(date);
    const days = eachDayOfInterval({ start, end });

    const results = await Promise.all(
      days.map((d) => fetchTasksByDate({ menteeId, date: d }).catch(() => []))
    );

    return results.flat();
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        if (!menteeId) return;
        const all = await loadRange(anchorDate, viewMode);
        if (!alive) return;
        setTasks(all);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "캘린더 데이터를 불러오지 못했습니다.");
      }
    })();
    return () => { alive = false; };
  }, [menteeId, anchorDate, viewMode]);

  return (
    <div className="h-full">
      {err ? <div className="p-4 text-sm text-red-600">{err}</div> : null}

      <CalendarRoot
        tasks={tasks}
        title="플래너"
        height={"420px"}
        onDateClick={(d) => {
          // 날짜 클릭 시: 일단 anchorDate를 그 날짜로 맞춰서 주간/월간 fetch 기준도 같이 자연스럽게 움직이게 함
          setAnchorDate(d);
        }}
      />

      {/* viewMode는 CalendarHeader에서 바뀌는 구조라면 CalendarContext 쪽에 setViewMode 연결이 필요함.
          지금은 기본 week로만이라도 동작하게 해둠. */}
      {/* 하단 영역: 좌측 = Task List, 우측 = TimeTable */}
      <div className="flex-1 flex flex-row gap-2 px-2 pb-20 mt-4">
        {/* 좌측: Task List Area */}
        <div className="w-1/2 bg-white/50 rounded-2xl border border-white/20 p-4 min-h-[300px]">
          <p className="text-slate-400 text-center mt-10">Task List Area</p>
        </div>

        {/* 우측: TimeTable */}
        <div className="w-1/2 overflow-hidden relative">
          <TimeTableContainer selectedDate={anchorDate} />
        </div>
      </div>
    </div>
  );
}
