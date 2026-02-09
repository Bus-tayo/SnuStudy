"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

import { CalendarRoot } from "@/components/calendar/CalendarRoot";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from "@/lib/repositories/timeLogsRepo";
import { fetchDailyPlanner } from "@/lib/repositories/plannerRepo";

import TaskChecklist from "./TaskChecklist";
import TimeTableContainer from "@/components/timetable/TimeTableContainer";

export default function CalendarPlannerScreen() {
  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [tasksForCalendar, setTasksForCalendar] = useState([]);
  const [tasksForDay, setTasksForDay] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());
  const [viewMode, setViewMode] = useState("week");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [err, setErr] = useState("");

  const [isTaskListLoading, setIsTaskListLoading] = useState(false);
  const [todayComment, setTodayComment] = useState("");

  const inflightRef = useRef(0);

  async function loadRange(date, mode) {
    if (!menteeId) return [];
    const start = mode === "month" ? startOfMonth(date) : startOfWeek(date);
    const end = mode === "month" ? endOfMonth(date) : endOfWeek(date);
    const days = eachDayOfInterval({ start, end });

    const results = await Promise.all(
      days.map((d) => fetchTasksByDate({ menteeId, date: d }).catch(() => []))
    );
    return results.flat();
  }

  async function loadDay(date) {
    if (!menteeId) return { tasks: [], secondsByTaskId: new Map() };

    const t = await fetchTasksByDate({ menteeId, date }).catch(() => []);
    const ids = t.map((x) => x.id);

    const logs =
      ids.length > 0
        ? await fetchTimeLogsForTasksInDay({ taskIds: ids, date }).catch(() => [])
        : [];

    return { tasks: t, secondsByTaskId: sumSecondsByTaskId(logs) };
  }

  async function reloadAll(date, mode) {
    const ticket = ++inflightRef.current;

    setIsTaskListLoading(true);
    try {
      setErr("");
      if (!menteeId) return;

      const [rangeTasks, dayBundle, planner] = await Promise.all([
        loadRange(date, mode),
        loadDay(date),
        fetchDailyPlanner({ menteeId, date }).catch(() => null),
      ]);

      if (inflightRef.current !== ticket) return;

      setTasksForCalendar(rangeTasks);
      setTasksForDay(dayBundle.tasks);
      setSecondsByTaskId(dayBundle.secondsByTaskId);
      setTodayComment(planner?.header_note ?? "");
    } catch (e) {
      if (inflightRef.current !== ticket) return;
      setErr(e?.message || "캘린더 데이터를 불러오지 못했습니다.");
    } finally {
      if (inflightRef.current === ticket) setIsTaskListLoading(false);
    }
  }

  useEffect(() => {
    if (!menteeId) return;
    reloadAll(anchorDate, viewMode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menteeId, anchorDate, viewMode]);

  // ✅ 하단 고정 네비 높이(대략). “캘린더 아래~nav 위”를 딱 채우기 위해 뺌.
  // 실제와 다르면 이 값만 조절하면 됨.
  const NAV_PX = 96;

  return (
    <div
      className="w-full overflow-hidden flex flex-col"
      style={{ height: `calc(100dvh - ${NAV_PX}px - env(safe-area-inset-bottom))` }}
    >
      {err ? <div className="p-4 text-sm text-red-600">{err}</div> : null}

      {/* 캘린더는 고정 높이(420px) */}
      <div className="w-full overflow-x-hidden shrink-0">
        <CalendarRoot
          tasks={tasksForCalendar}
          title="플래너"
          height={"420px"}
          onDateClick={(d) => setAnchorDate(d)}
        />
      </div>

      {/* ✅ 캘린더 아래 영역을 남은 높이로 딱 채움 */}
      {/* ✅ 캘린더 아래 영역 */}
<div className="mt-4 flex flex-1 min-h-0 w-full flex-row gap-2 px-2 overflow-hidden">
  {/* ✅ 왼쪽: 할일목록은 스크롤 가능 */}
  <div className="basis-0 flex-1 min-w-0 min-h-0 bg-white/50 rounded-2xl border border-white/20 p-4 overflow-hidden">
    <div className="h-full min-h-0 overflow-y-auto pr-2 custom-scrollbar scrollbar-hide">
      <TaskChecklist
        menteeId={menteeId}
        date={anchorDate}
        tasks={tasksForDay}
        secondsByTaskId={secondsByTaskId}
        onMutated={() => reloadAll(anchorDate, viewMode)}
        mode="view"
        title="오늘의 할 일"
        comment={todayComment}
        loading={isTaskListLoading}
      />
    </div>
  </div>

  {/* ✅ 오른쪽: 타임테이블은 스크롤 없음(부모 높이를 꽉 채움) */}
  <div className="basis-0 flex-1 min-w-0 min-h-0 overflow-hidden relative">
    <TimeTableContainer selectedDate={anchorDate} />
  </div>
</div>

    </div>
  );
}
