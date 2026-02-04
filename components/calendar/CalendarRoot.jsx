"use client";

import React from 'react';
import { CalendarProvider, useCalendar } from './CalendarContext';
import { CalendarHeader } from './CalendarHeader';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { TaskModal } from './TaskModal';


function CalendarContent() {
    const { viewMode } = useCalendar();

    return (
        <div className="flex flex-col h-full">
            <CalendarHeader />

            <div className="flex-1 flex flex-col overflow-hidden">
                {viewMode === 'month' ? <MonthView /> : <WeekView />}
            </div>

            <TaskModal />
        </div>
    );
}

export function CalendarRoot({ tasks, title, useModal = true, onDateClick, height }) {
    // Enforce mobile behavior: modal is disabled for tasks (inline view used instead)
    const effectiveUseModal = false;

    return (
        <CalendarProvider tasks={tasks} title={title} useModal={effectiveUseModal} onDateClick={onDateClick} height={height}>
            <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-auto min-h-[50px] p-0 sm:p-5">
                <CalendarContent />
            </div>
        </CalendarProvider>
    );
}
