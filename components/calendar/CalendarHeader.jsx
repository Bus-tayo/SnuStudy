"use client";

import { useState } from 'react';
import { useCalendar } from './CalendarContext';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { Play } from 'lucide-react';
import { MonthPickerModal } from './MonthPickerModal';

export function CalendarHeader() {
  const { currentDate, setCurrentDate, viewMode, selectedDate, setSelectedDate, setDirection, onDateClick } =
    useCalendar();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const moveTo = (nextDate, dir) => {
    setDirection(dir);
    setCurrentDate(nextDate);
    setSelectedDate(nextDate);
    if (onDateClick) onDateClick(nextDate);
  };

  const handlePrev = () => {
    if (viewMode === 'month') moveTo(subMonths(currentDate, 1), -1);
    else moveTo(subWeeks(currentDate, 1), -1);
  };

  const handleNext = () => {
    if (viewMode === 'month') moveTo(addMonths(currentDate, 1), 1);
    else moveTo(addWeeks(currentDate, 1), 1);
  };

  return (
    <>
      <div className="flex justify-between items-center p-4">
        <button
          onClick={handlePrev}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: 'var(--calendar-text)' }}
          aria-label="Previous"
        >
          <Play size={18} fill="currentColor" className="rotate-180" />
        </button>

        <h2
          onClick={() => setIsPickerOpen(true)}
          className="text-lg font-bold cursor-pointer"
          style={{ color: 'var(--calendar-text)' }}
        >
          {format(selectedDate, 'yyyy.MM.dd')}
        </h2>

        <button
          onClick={handleNext}
          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          style={{ color: 'var(--calendar-text)' }}
          aria-label="Next"
        >
          <Play size={18} fill="currentColor" />
        </button>
      </div>

      <MonthPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  );
}
