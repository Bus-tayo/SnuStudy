import React from 'react';
import { format, isSameDay, getDay } from 'date-fns';

export function CalendarDayCell({ day, selectedDate, tasks = [], events = [], onDayClick, isOtherMonth = false }) {
  const isSelected = isSameDay(day, selectedDate);
  const dayOfWeek = getDay(day);

  // Filter tasks/events for this day
  const dailyTasks = tasks.filter(t => {
    const d = t.date instanceof Date ? t.date : new Date(t.date);
    return isSameDay(d, day);
  });

  const dailyEvents = events.filter(e => {
    const d = e.date ? e.date : (e.start_date || e.startDate);
    return d ? isSameDay(new Date(d), day) : false;
  });

  const hasActiveTasks = dailyTasks.some(t => t.status !== 'DONE' && t.isCompleted !== true);
  const hasCompletedTasks = dailyTasks.some(t => t.status === 'DONE' || t.isCompleted === true);
  const hasEvents = dailyEvents.length > 0;

  // Priority: Active Work (Tasks or Events) > All Done (Only Finished Tasks)
  const isAllDone = !hasActiveTasks && !hasEvents && hasCompletedTasks;
  const hasActiveWork = hasActiveTasks || hasEvents;
  const showDot = hasActiveWork || isAllDone;

  /* 
   * THEME LOGIC:
   * - Default Text: var(--calendar-text)
   * - Selection: bg-[var(--calendar-selected-bg)] text-[var(--calendar-selected-text)] rounded-full
   * - Weekend: var(--calendar-sunday) / var(--calendar-saturday)
   * - Other Month: var(--calendar-disabled-text)
   */

  let textColorStyle = { color: 'var(--calendar-text)' };

  if (!isSelected) {
    if (dayOfWeek === 0) textColorStyle = { color: 'var(--calendar-sunday)' }; // Sunday
    else if (dayOfWeek === 6) textColorStyle = { color: 'var(--calendar-saturday)' }; // Saturday

    if (isOtherMonth) textColorStyle = { color: 'var(--calendar-disabled-text)' };
  } else {
    // Selected State Override
    textColorStyle = { color: 'var(--calendar-selected-text)' };
  }

  return (
    <div
      className="flex flex-col items-center justify-center p-1 cursor-pointer"
      onClick={() => onDayClick(day)}
      style={{ minHeight: '50px' }}
    >
      <div
        className={`
          w-8 h-8 flex items-center justify-center rounded-full text-base font-semibold transition-all duration-200
          ${isSelected ? 'shadow-sm' : ''}
        `}
        style={{
          backgroundColor: isSelected ? 'var(--calendar-selected-bg)' : 'transparent',
          ...textColorStyle
        }}
      >
        {format(day, 'd')}
      </div>

      <div className="h-1.5 flex items-center justify-center mt-0.5">
        {showDot && (
          <div
            className="w-1 h-1 rounded-full"
            style={{
              backgroundColor: isAllDone
                ? '#34D399' // Emerald 400 (Green)
                : 'var(--calendar-text-secondary)'
            }}
          />
        )}
      </div>
    </div>
  );
}
