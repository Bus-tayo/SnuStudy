'use client';

import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function WeekMiniCalendar({ selectedDate, onSelectDate }) {
  const startDate = startOfWeek(selectedDate || new Date(), { weekStartsOn: 0 });
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  return (
    <div className="flex w-full flex-col border-b border-border/60 bg-white py-3 mb-2">
      <div className="flex w-full items-center justify-between px-4">
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          return (
            <button
              key={date.toISOString()}
              onClick={() => onSelectDate(date)}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all duration-200 ${
                isSelected ? 'bg-primary text-primary-foreground shadow-md scale-105' : 'text-muted-foreground hover:bg-slate-50'
              }`}
            >
              <span className={`text-[11px] font-medium mb-1 ${isSelected ? 'opacity-90' : 'opacity-70'}`}>
                {format(date, 'EEE', { locale: ko })}
              </span>
              <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}>
                {format(date, 'd')}
              </span>
              {isToday && !isSelected && <span className="mt-1 h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}