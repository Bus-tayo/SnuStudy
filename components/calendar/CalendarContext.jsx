"use client";

import React, { createContext, useContext, useState } from 'react';
import { startOfToday } from 'date-fns';

const CalendarContext = createContext(undefined);

export function CalendarProvider({
    children,
    tasks = [],
    title,
    onDateClick,
    height = 'auto'
}) {
    const [currentDate, setCurrentDate] = useState(startOfToday());
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [viewMode, setViewMode] = useState('week');
    const [direction, setDirection] = useState(0);

    return (
        <CalendarContext.Provider
            value={{
                currentDate,
                setCurrentDate,
                selectedDate,
                setSelectedDate,
                viewMode,
                setViewMode,
                tasks,
                calendarTitle: title,
                direction,
                setDirection,
                onDateClick,
                height
            }}
        >
            {children}
        </CalendarContext.Provider>
    );
}

export function useCalendar() {
    const context = useContext(CalendarContext);
    if (context === undefined) {
        throw new Error('useCalendar must be used within a CalendarProvider');
    }
    return context;
}
