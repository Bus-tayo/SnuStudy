"use client";

import React from "react";
import { CalendarProvider, useCalendar } from "./CalendarContext";
import { CalendarHeader } from "./CalendarHeader";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DailyDetail } from "./DailyDetail";

function CalendarContent() {
  const { viewMode } = useCalendar();

  return (
    <div className="flex flex-col h-full">
      <CalendarHeader />

      <div className="flex-1 flex flex-col overflow-hidden">
        {viewMode === "month" ? <MonthView /> : <WeekView />}
      </div>

      {/* <DailyDetail /> */}
    </div>
  );
}

export function CalendarRoot({ tasks, title, onDateClick, height }) {
  return (
    <CalendarProvider tasks={tasks} title={title} onDateClick={onDateClick} height={height}>
      <div
        className="rounded-b-xl shadow-md overflow-hidden flex flex-col h-auto min-h-[50px] p-0 sm:p-5 transition-colors duration-300"
        style={{
          backgroundColor: 'var(--calendar-bg)',
          color: 'var(--calendar-text)'
        }}
      >
        <CalendarContent />
      </div>
    </CalendarProvider>
  );
}
