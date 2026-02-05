"use client";

import React from 'react';
import { useCalendar } from './CalendarContext';
import { format, isSameDay, isWithinInterval } from 'date-fns';

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

function inEventRange(day, ev) {
  const s = normalizeToDate(ev?.start_date);
  const e = normalizeToDate(ev?.end_date) || s;
  if (!s) return false;
  return isWithinInterval(day, { start: s, end: e });
}

export function DailyDetail() {
  const { selectedDate, tasks, events } = useCalendar();

  const dailyTasks = (tasks ?? []).filter((t) => {
    const td = normalizeToDate(t?.date);
    return td ? isSameDay(td, selectedDate) : false;
  });

  const dailyEvents = (events ?? []).filter((ev) => inEventRange(selectedDate, ev));

  return (
    <div className="p-6 border-t border-gray-200 bg-white flex-1">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{format(selectedDate, 'yyyy-MM-dd')}</h3>

      {dailyEvents.length > 0 && (
        <div className="mb-4">
          <div className="text-sm font-semibold text-slate-700 mb-2">일정</div>
          <div className="flex flex-col gap-2">
            {dailyEvents.map((ev) => (
              <div key={ev.id} className="p-3 rounded border bg-slate-50">
                <div className="text-sm font-medium">{ev.title}</div>
                <div className="text-xs text-gray-500">{ev.subject || 'ETC'}</div>
                {ev.description ? <div className="text-xs text-gray-600 mt-1">{ev.description}</div> : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {dailyTasks.length === 0 ? (
        <p className="text-gray-400 italic">No tasks scheduled for this day.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dailyTasks.map((task) => {
            const isDone = task?.status === 'DONE';
            return (
              <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50">
                <div className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={isDone} readOnly className="accent-blue-500" />
                  <span className={isDone ? 'line-through text-gray-400' : 'text-gray-800'}>{task.title}</span>
                </div>
                <div className="text-xs text-gray-500">{task.subject}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
