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

      {/* ✅ 이게 없으면 "과제 리스트/상세로 이동" UI가 아예 없음 */}
      <DailyDetail />
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
