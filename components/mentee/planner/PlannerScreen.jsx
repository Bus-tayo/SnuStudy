'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

import PlannerHeader from './PlannerHeader';
import WeekMiniCalendar from './WeekMiniCalendar';
import TaskChecklist from './TaskChecklist';

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from '@/lib/auth/session';
import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';

import { fetchDailyPlanner } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';

const MENTOR_ID = 100; // ✅ 요구사항: mentor는 무조건 mentor1

export default function PlannerScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [menteeId, setMenteeId] = useState(() => getMenteeIdFromStorage());
  const [bootstrapped, setBootstrapped] = useState(false); // ✅ 초기 1회 로딩 완료 여부(화면 출력 결정)
  const [errorMsg, setErrorMsg] = useState('');

  const [headerNote, setHeaderNote] = useState('');
  const [tasks, setTasks] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());

  const inflightRef = useRef(0);

  // 1) menteeId가 없으면 세션으로 보정 (UI 로딩표시 없음, 최초엔 null 리턴)
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        if (menteeId && Number.isFinite(Number(menteeId))) {
          if (alive) setBootstrapped(true);
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
          setBootstrapped(true);
        }
      } catch (e) {
        console.error('[PlannerScreen/bootstrap]', e);
        setErrorMsg(e?.message ?? '세션 정보를 확인하지 못했습니다.');
        router.replace('/login');
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, menteeId]);

  async function reloadAll(date, mid) {
    const ticket = ++inflightRef.current; // 최신 요청만 반영
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

  // 2) bootstrapped + menteeId 준비되면 최초/날짜 변경마다 fetch (UI 로딩 표시 없음)
  useEffect(() => {
    if (!bootstrapped || !menteeId) return;
    reloadAll(selectedDate, menteeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, menteeId, selectedDate]);

  if (errorMsg) {
    return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  }

  // ✅ 로딩 문구 없이: 초기 로딩 중엔 화면을 비움
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
      />
    </div>
  );
}
