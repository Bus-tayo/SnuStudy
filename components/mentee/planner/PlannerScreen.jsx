'use client';

import { useEffect, useState, useRef } from 'react';
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
  const [tasks, setTasks] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());

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

  async function reloadAll(date, mid) {
    const ticket = ++inflightRef.current;
    try {
      const planner = await fetchDailyPlanner({ menteeId: mid, date });
      if (inflightRef.current !== ticket) return;
      setHeaderNote(planner?.header_note ?? '');

      const t = await fetchTasksByDate({ menteeId: mid, date });
      if (inflightRef.current !== ticket) return;
      setTasks(t);

      const ids = t.map((x) => x.id);
      const logs = await fetchTimeLogsForTasksInDay({ taskIds: ids, date });
      if (inflightRef.current !== ticket) return;
      setSecondsByTaskId(sumSecondsByTaskId(logs));

      setErrorMsg('');
    } catch (e) {
      console.error('[PlannerScreen/reloadAll]', e);
      setErrorMsg(e?.message ?? '플래너 데이터를 불러오지 못했습니다.');
    }
  }

  async function handleDeleteSelectedTasks(taskIds) {
    if (!taskIds || taskIds.length === 0) return;
    
    if (!confirm(`${taskIds.length}개의 할 일을 삭제하시겠습니까?`)) return;

    try {
      // API 호출 (여러 ID를 배열로 받아 처리한다고 가정)
      await deleteTasks(taskIds); 
      // 삭제 후 데이터 갱신
      await reloadAll(selectedDate, menteeId);
    } catch (e) {
      console.error('[PlannerScreen/handleDeleteSelectedTasks]', e);
      alert('삭제 중 오류가 발생했습니다.');
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
    <div className="flex flex-col gap-4 px-4 py-4">
      
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

      <TaskChecklist
        menteeId={menteeId}
        mentorId={MENTOR_ID}
        date={selectedDate}
        tasks={tasks}
        secondsByTaskId={secondsByTaskId}
        onMutated={() => reloadAll(selectedDate, menteeId)}
        // 삭제 함수를 props로 전달
        onDeleteTasks={handleDeleteSelectedTasks} 
      />
    </div>
  );
}
