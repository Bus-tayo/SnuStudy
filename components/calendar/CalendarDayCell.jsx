import React from 'react';
import { format, isSameDay, isToday, getDay, isWithinInterval } from 'date-fns';
import { Calculator, BookOpen, Languages, FlaskConical, FileText, Calendar as CalIcon } from 'lucide-react';

function normalizeToDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string') {
    // 'YYYY-MM-DD' or ISO
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

export function CalendarDayCell({ day, selectedDate, tasks, events, onDayClick, isOtherMonth = false }) {
  const isSelected = isSameDay(day, selectedDate);
  const isCurrentDay = isToday(day);
  const dayOfWeek = getDay(day);

  let textColorClass = 'text-gray-700';
  if (dayOfWeek === 0) textColorClass = 'text-red-500';
  if (dayOfWeek === 6) textColorClass = 'text-blue-500';
  if (isOtherMonth) textColorClass = 'text-slate-300 pointer-events-none opacity-50 bg-slate-50';

  const getSubjectIcon = (subject) => {
    const s = String(subject || '').toUpperCase();
    const props = { size: 14, className: 'block text-gray-500' };

    if (s === 'MATH') return <Calculator {...props} />;
    if (s === 'ENG') return <BookOpen {...props} />;
    if (s === 'KOR') return <Languages {...props} />;
    if (s === 'SCI' || s === 'SCIENCE') return <FlaskConical {...props} />;
    return <FileText {...props} />;
  };

  const dailyTasks = Array.isArray(tasks)
    ? tasks.filter((t) => {
        const td = normalizeToDate(t?.date);
        return td ? isSameDay(td, day) : false;
      })
    : [];

  const dailyEvents = Array.isArray(events) ? events.filter((ev) => inEventRange(day, ev)) : [];

  const tasksBySubject = {};
  dailyTasks.forEach((t) => {
    const key = String(t?.subject || 'ETC').toUpperCase();
    if (!tasksBySubject[key]) tasksBySubject[key] = [];
    tasksBySubject[key].push(t);
  });

  const subjects = Object.keys(tasksBySubject).sort((a, b) => {
    const diff = tasksBySubject[b].length - tasksBySubject[a].length;
    if (diff !== 0) return diff;
    return a.localeCompare(b);
  });

  const MAX_VISIBLE_ICONS = 3;

  return (
    <div
      className={`
        min-h-[80px] p-2 border-r border-b border-gray-200 flex flex-col transition-colors cursor-pointer relative bg-white
        ${isOtherMonth ? 'bg-slate-50 text-slate-300' : 'hover:bg-slate-50'}
        ${isSelected ? 'bg-blue-50 ring-inset ring-2 ring-blue-500 z-10' : ''}
        ${textColorClass}
      `}
      onClick={() => onDayClick(day)}
    >
      <div className="flex justify-between mb-1">
        <span
          className={`
            ${isCurrentDay ? 'bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center -ml-1' : ''}
          `}
        >
          {format(day, 'd')}
        </span>

        {dailyEvents.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-gray-500">
            <CalIcon size={12} className="text-gray-400" />
            {dailyEvents.length}
          </span>
        )}
      </div>

      {dailyEvents.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {dailyEvents.slice(0, 3).map((ev) => (
            <span key={ev.id} className="text-[10px] px-1 py-[1px] rounded bg-slate-100 text-slate-600">
              {ev.subject || 'ETC'}
            </span>
          ))}
          {dailyEvents.length > 3 && (
            <span className="text-[10px] px-1 py-[1px] rounded bg-slate-200 text-slate-600">
              +{dailyEvents.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="mt-1">
        {subjects.length === 0 ? null : (
          <div className="flex flex-col gap-0.5 mt-1">
            {subjects.map((subj) => {
              const list = tasksBySubject[subj];
              const visible = list.slice(0, MAX_VISIBLE_ICONS);
              const hiddenCount = list.length - MAX_VISIBLE_ICONS;

              return (
                <div key={subj} className="flex flex-nowrap items-center">
                  {visible.map((task, index) => {
                    const isDone = task?.status === 'DONE';
                    return (
                      <div
                        key={task.id}
                        className={`
                          relative flex items-center justify-center w-5 h-5 rounded bg-slate-100 transition-all
                          ${isDone ? 'opacity-50 bg-slate-200' : ''}
                        `}
                        style={{ marginLeft: index > 0 ? '-6px' : 0, zIndex: visible.length - index }}
                      >
                        {getSubjectIcon(task?.subject)}
                      </div>
                    );
                  })}
                  {hiddenCount > 0 && (
                    <div
                      className="flex items-center justify-center h-4 px-0.5 text-[9px] font-semibold text-slate-500 bg-slate-200 rounded ml-[-4px]"
                      style={{ zIndex: 0 }}
                    >
                      +{hiddenCount}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
