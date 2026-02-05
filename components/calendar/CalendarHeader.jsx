"use client";

import { useState } from 'react';
import { useCalendar } from './CalendarContext';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <button
          onClick={handlePrev}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={24} />
        </button>

        <h2 onClick={() => setIsPickerOpen(true)} className="text-lg font-bold text-gray-800 cursor-pointer">
          {format(selectedDate, 'yyyy-MM-dd')}
        </h2>

        <button
          onClick={handleNext}
          className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      <MonthPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
    </>
  );
}
