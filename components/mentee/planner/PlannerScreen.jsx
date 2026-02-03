'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import PlannerHeader from './PlannerHeader';
import WeekMiniCalendar from './WeekMiniCalendar';
import TaskChecklist from './TaskChecklist';

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from '@/lib/auth/session';
import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';

import { fetchDailyPlanner } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';

export default function PlannerScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [headerNote, setHeaderNote] = useState('');
  const [tasks, setTasks] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());

  // storage 기반 menteeId (AuthGate가 보통 채워줌)
  const menteeIdFromStorage = useMemo(() => getMenteeIdFromStorage(), []);

  const [menteeId, setMenteeId] = useState(menteeIdFromStorage);

  // ✅ 1) 혹시 storage가 비었거나 잘못됐으면 세션으로 보정
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (menteeId && Number.isFinite(Number(menteeId))) {
          setLoading(false);
          return;
        }

        const { session } = await getAuthSession();
        if (!session) {
          router.replace('/login');
          return;
        }

        const appUser = await resolveAppUserFromSession(session);
        persistAppUserToStorage(appUser);

        if (appUser.role !== 'MENTEE') {
          router.replace('/login');
          return;
        }

        if (alive) {
          setMenteeId(Number(appUser.appUserId));
          setLoading(false);
        }
      } catch (e) {
        console.error('[PlannerScreen]', e);
        setErrorMsg(e?.message ?? '세션 정보를 확인하지 못했습니다.');
        router.replace('/login');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, menteeId]);

  async function reloadAll(date, mid) {
    setLoading(true);
    setErrorMsg('');

    try {
      const planner = await fetchDailyPlanner({ menteeId: mid, date });
      setHeaderNote(planner?.header_note ?? '');

      const t = await fetchTasksByDate({ menteeId: mid, date });
      setTasks(t);

      const ids = t.map((x) => x.id);
      const logs = await fetchTimeLogsForTasksInDay({ taskIds: ids, date });
      setSecondsByTaskId(sumSecondsByTaskId(logs));
    } catch (e) {
      setErrorMsg(e?.message ?? '플래너 데이터를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }

  // ✅ 2) menteeId 확정되면 날짜 기준으로 fetch
  useEffect(() => {
    if (!menteeId) return;
    reloadAll(selectedDate, menteeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, menteeId]);

  if (errorMsg) {
    return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  }

  // 첫 진입/보정 중
  if (!menteeId && loading) return null;

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      <PlannerHeader
        menteeId={menteeId}
        date={selectedDate}
        headerNote={headerNote}
        onChangeHeaderNote={setHeaderNote}
        onChangeDate={setSelectedDate}
        onSaved={() => reloadAll(selectedDate, menteeId)}
      />

      <WeekMiniCalendar selectedDate={selectedDate} onSelectDate={setSelectedDate} />

      {loading ? (
        <div className="text-sm text-gray-500">로딩중...</div>
      ) : (
        <TaskChecklist
          menteeId={menteeId}
          date={selectedDate}
          tasks={tasks}
          secondsByTaskId={secondsByTaskId}
          onMutated={() => reloadAll(selectedDate, menteeId)}
        />
      )}
    </div>
  );
}
