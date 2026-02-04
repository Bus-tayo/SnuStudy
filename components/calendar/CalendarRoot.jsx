"use client";

import React from 'react';
import { CalendarProvider, useCalendar } from './CalendarContext';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';



function CalendarContent() {
    const { viewMode } = useCalendar();

    return (
        <div className="flex flex-col h-full">
            <CalendarHeader />

            <div className="flex-1 flex flex-col overflow-hidden">
                {viewMode === 'month' ? <MonthView /> : <WeekView />}
            </div>
        </div>
    );
}

export function CalendarRoot({ tasks, title, onDateClick, height }) {

    return (
        <CalendarProvider tasks={tasks} title={title} onDateClick={onDateClick} height={height}>
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-auto min-h-[50px] p-0 sm:p-5">
                <CalendarContent />
            </div>
        </CalendarProvider>
    );
}
