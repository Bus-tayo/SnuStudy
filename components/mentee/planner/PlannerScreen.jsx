'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import PlannerHeader from './PlannerHeader';
import WeekMiniCalendar from './WeekMiniCalendar';
import TaskChecklist from './TaskChecklist';

import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';
import { fetchDailyPlanner } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';

const MENTOR_ID = 100;

export default function PlannerScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [menteeId, setMenteeId] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [headerNote, setHeaderNote] = useState('');

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

  async function loadTasks(date, mid) {
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
      const [planner, dayBundle] = await Promise.all([
        fetchDailyPlanner({ menteeId: mid, date }),
        loadTasks(date, mid),
      ]);

      if (inflightRef.current !== ticket) return;

      setHeaderNote(planner?.header_note ?? '');
      setTasksForDay(dayBundle.tasks);
      setSecondsByTaskId(dayBundle.secondsByTaskId);
      setErrorMsg('');
    } catch (e) {
      console.error('[PlannerScreen/reloadAll]', e);
      if (inflightRef.current !== ticket) return;
      setErrorMsg(e?.message ?? '플래너 데이터를 불러오지 못했습니다.');
    } finally {
      if (inflightRef.current === ticket) setIsTaskListLoading(false);
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
    <div className="w-full overflow-x-hidden flex flex-col gap-4 px-4 py-4">
      <PlannerHeader
        menteeId={menteeId}
        mentorId={MENTOR_ID}
        date={selectedDate}
        headerNote={headerNote}
        onChangeHeaderNote={setHeaderNote}
        onChangeDate={setSelectedDate}
        onSaved={() => reloadAll(selectedDate, menteeId)}
      />

      <WeekMiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      <div className="w-full min-w-0 overflow-x-hidden bg-white/50 rounded-2xl border border-white/20 p-4">
        <TaskChecklist
          menteeId={menteeId}
          date={selectedDate}
          tasks={tasksForDay}
          secondsByTaskId={secondsByTaskId}
          onMutated={() => reloadAll(selectedDate, menteeId)}
          mode="manage"
          title="할 일 관리"
          comment={headerNote}
          loading={isTaskListLoading}
        />
      </div>
    </div>
  );
}
