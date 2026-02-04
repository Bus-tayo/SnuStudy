"use client";

import { useState, useEffect } from 'react';
import { useCalendar } from './CalendarContext';
import { format, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { MonthPickerModal } from './MonthPickerModal';

export function CalendarHeader() {
    const { currentDate, setCurrentDate, viewMode, setViewMode, calendarTitle, setDirection, selectedDate } = useCalendar();
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    const handlePrev = () => {
        setDirection(-1);
        if (viewMode === 'month') {
            setCurrentDate(subMonths(currentDate, 1));
        } else {
            setCurrentDate(subWeeks(currentDate, 1));
        }
    };

    const handleNext = () => {
        setDirection(1);
        if (viewMode === 'month') {
            setCurrentDate(addMonths(currentDate, 1));
        } else {
            setCurrentDate(addWeeks(currentDate, 1));
        }
    };

    return (
        <>
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" aria-label="Previous">
                    <ChevronLeft size={24} />
                </button>
                <h2
                    onClick={() => setIsPickerOpen(true)}
                    className="text-lg font-bold text-gray-800 cursor-pointer"
                >
                    {format(selectedDate, 'yyyy-MM-dd')}
                </h2>
                <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors" aria-label="Next">
                    <ChevronRight size={24} />
                </button>
            </div>
            <MonthPickerModal isOpen={isPickerOpen} onClose={() => setIsPickerOpen(false)} />
        </>
    );
}
