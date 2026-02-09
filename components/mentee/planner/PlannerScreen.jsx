'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";

import { CalendarRoot } from "@/components/calendar/CalendarRoot";
import TaskChecklist from './TaskChecklist';

import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';
import { fetchDailyPlanner, upsertDailyPlannerHeader } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';

export default function PlannerScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menteeId, setMenteeId] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [headerNote, setHeaderNote] = useState('');
  const [tasksForCalendar, setTasksForCalendar] = useState([]); // For Calendar Dots
  const [tasksForDay, setTasksForDay] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());
  const [isTaskListLoading, setIsTaskListLoading] = useState(false);

  const inflightRef = useRef(0);

  useEffect(() => {
    const mid = getMenteeIdFromStorage();
    if (!mid) {
      router.replace('/login');
      return;
    }
    setMenteeId(mid);
    setBootstrapped(true);
  }, [router]);

  async function loadRange(date, mid) {
    if (!mid) return [];
    // 기본적으로 Week view로 로딩 (Home screen과 동일)
    const start = startOfWeek(date);
    const end = endOfWeek(date);
    const days = eachDayOfInterval({ start, end });

    const results = await Promise.all(
      days.map((d) => fetchTasksByDate({ menteeId: mid, date: d }).catch(() => []))
    );
    return results.flat();
  }

  async function loadDayTasks(date, mid) {
    const t = await fetchTasksByDate({ menteeId: mid, date }).catch(() => []);
    const ids = t.map((x) => x.id);
    const logs =
      ids.length > 0
        ? await fetchTimeLogsForTasksInDay({ taskIds: ids, date }).catch(() => [])
        : [];
    return { tasks: t, secondsByTaskId: sumSecondsByTaskId(logs) };
  }

  async function reloadAll(date, mid) {
    const ticket = ++inflightRef.current;
    setIsTaskListLoading(true);

    try {
      const [planner, dayBundle, rangeTasks] = await Promise.all([
        fetchDailyPlanner({ menteeId: mid, date }),
        loadDayTasks(date, mid),
        loadRange(date, mid),
      ]);

      if (inflightRef.current !== ticket) return;

      setHeaderNote(planner?.header_note ?? '');
      setTasksForDay(dayBundle.tasks);
      setSecondsByTaskId(dayBundle.secondsByTaskId);
      setTasksForCalendar(rangeTasks);
      setErrorMsg('');
    } catch (e) {
      console.error('[PlannerScreen/reloadAll]', e);
      if (inflightRef.current !== ticket) return;
      setErrorMsg(e?.message ?? '플래너 데이터를 불러오지 못했습니다.');
    } finally {
      if (inflightRef.current === ticket) setIsTaskListLoading(false);
    }
  }

  async function handleSaveHeaderNote() {
    if (!menteeId) return;
    try {
      await upsertDailyPlannerHeader({
        menteeId,
        date: selectedDate,
        headerNote: headerNote?.trim() ?? '',
      });
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    if (!bootstrapped || !menteeId) return;
    reloadAll(selectedDate, menteeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, menteeId, selectedDate]);

  if (errorMsg) return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  if (!bootstrapped || !menteeId) return null;

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-50">
      {/* Calendar Area: Fixed Height (similar to Home) */}
      <div className="w-full shrink-0 bg-white border-b border-border/60">
        <CalendarRoot
          tasks={tasksForCalendar}
          title="플래너"
          height="420px" // Fixed height to match Home screen
          onDateClick={(d) => setSelectedDate(d)}
        />
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 custom-scrollbar">
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
          <TaskChecklist
            menteeId={menteeId}
            date={selectedDate}
            tasks={tasksForDay}
            secondsByTaskId={secondsByTaskId}
            onMutated={() => reloadAll(selectedDate, menteeId)}
            mode="manage"
            title="오늘의 할 일"
            comment={headerNote}
            loading={isTaskListLoading}
            isEditable={true}
            onCommentChange={setHeaderNote}
            onCommentBlur={handleSaveHeaderNote}
          />
        </div>
      </div>
    </div>
  );
}
