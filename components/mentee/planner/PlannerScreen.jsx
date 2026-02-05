'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

import PlannerHeader from './PlannerHeader';
import TaskChecklist from './TaskChecklist';

import { CalendarRoot } from '@/components/calendar/CalendarRoot';

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from '@/lib/auth/session';
import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';

import { fetchDailyPlanner } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate, fetchTasksByRange } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';
import { fetchCalendarEventsByRange } from '@/lib/repositories/calendarEventsRepo';

const MENTOR_ID = 100; // mentor는 무조건 mentor1

function normalizeToDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(`${v}T00:00:00`);
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

function eventCoversDay(ev, day) {
  const s = normalizeToDate(ev?.start_date);
  const e = normalizeToDate(ev?.end_date) || s;
  if (!s) return false;
  return isWithinInterval(day, { start: s, end: e });
}

export default function PlannerScreen() {
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [menteeId, setMenteeId] = useState(() => getMenteeIdFromStorage());
  const [bootstrapped, setBootstrapped] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [headerNote, setHeaderNote] = useState('');
  const [tasks, setTasks] = useState([]);
  const [secondsByTaskId, setSecondsByTaskId] = useState(new Map());

  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const inflightRef = useRef(0);

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

  async function reloadDayBundle(date, mid, ticket) {
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
  }

  async function reloadCalendarBundle(date, mid, ticket) {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);

    const rangeStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const rangeEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const [rangeTasks, rangeEvents] = await Promise.all([
      fetchTasksByRange({ menteeId: mid, from: rangeStart, to: rangeEnd }),
      fetchCalendarEventsByRange({ menteeId: mid, from: rangeStart, to: rangeEnd }),
    ]);

    if (inflightRef.current !== ticket) return;

    setCalendarTasks(rangeTasks);
    setCalendarEvents(rangeEvents);
  }

  async function reloadAll(date, mid) {
    const ticket = ++inflightRef.current;
    try {
      await Promise.all([reloadDayBundle(date, mid, ticket), reloadCalendarBundle(date, mid, ticket)]);
      if (inflightRef.current !== ticket) return;
      setErrorMsg('');
    } catch (e) {
      console.error('[PlannerScreen/reloadAll]', e);
      setErrorMsg(e?.message ?? '플래너 데이터를 불러오지 못했습니다.');
    }
  }

  useEffect(() => {
    if (!bootstrapped || !menteeId) return;
    reloadAll(selectedDate, menteeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, menteeId, selectedDate]);

  const selectedDayEvents = useMemo(() => {
    if (!Array.isArray(calendarEvents)) return [];
    return calendarEvents.filter((ev) => eventCoversDay(ev, selectedDate));
  }, [calendarEvents, selectedDate]);

  if (errorMsg) {
    return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  }

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

      <CalendarRoot
        title="캘린더"
        tasks={calendarTasks}
        events={calendarEvents}
        height="260px"
        onDateClick={(d) => setSelectedDate(d)}
      />

      {selectedDayEvents.length > 0 && (
        <div className="border rounded p-3">
          <div className="text-sm font-semibold mb-2">오늘 일정</div>
          <div className="flex flex-col gap-2">
            {selectedDayEvents.map((ev) => (
              <div key={ev.id} className="text-sm">
                <div className="font-medium">{ev.title}</div>
                <div className="text-xs text-gray-500">{ev.subject || 'ETC'}</div>
                {ev.description ? <div className="text-xs text-gray-600 mt-1">{ev.description}</div> : null}
              </div>
            ))}
          </div>
        </div>
      )}

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
