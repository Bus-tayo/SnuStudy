'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

import PlannerHeader from './PlannerHeader';
import TaskChecklist from './TaskChecklist';

import { getMenteeIdFromStorage } from '@/lib/utils/menteeSession';
import { fetchDailyPlanner } from '@/lib/repositories/plannerRepo';
import { fetchTasksByDate, fetchTasksByRange } from '@/lib/repositories/tasksRepo';
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from '@/lib/repositories/timeLogsRepo';
import { fetchCalendarEventsByRange } from '@/lib/repositories/calendarEventsRepo';

const MENTOR_ID = 100; // mentor는 무조건 mentor1

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

  const [calendarTasks, setCalendarTasks] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);

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
