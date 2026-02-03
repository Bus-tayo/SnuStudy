'use client';

import { startOfWeek, addDays, format, isSameDay } from 'date-fns';

export default function WeekMiniCalendar({ selectedDate, onSelectDate }) {
  const start = startOfWeek(selectedDate, { weekStartsOn: 1 });

  return (
    <div className="flex justify-between">
      {Array.from({ length: 7 }).map((_, i) => {
        const d = addDays(start, i);
        const active = isSameDay(d, selectedDate);

        return (
          <button
            key={i}
            onClick={() => onSelectDate(d)}
            className={`text-xs ${
              active ? 'font-bold underline' : ''
            }`}
          >
            {format(d, 'dd')}
          </button>
        );
      })}
    </div>
  );
}
