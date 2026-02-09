"use client";

import React from "react";
import { generatePlannerHours, generateTimeId, DEFAULT_STUDY_COLOR, findTaskForSlot } from "@/lib/utils/timeUtils";

const TOKEN_TO_CSS = {
  KOR: "hsl(var(--subject-kor))",
  MATH: "hsl(var(--subject-math))",
  ENG: "hsl(var(--subject-eng))",
  ETC: "hsl(var(--subject-etc))",
  ACCENT: "hsl(var(--accent))",
  PRIMARY: "hsl(var(--primary))",
  DONE: "hsl(var(--status-done))",
  SUB: "hsl(var(--secondary-foreground))",
};

function resolveCssColor(colorLike, subject) {
  if (!colorLike) {
    if (subject && TOKEN_TO_CSS[subject]) return TOKEN_TO_CSS[subject];
    return DEFAULT_STUDY_COLOR;
  }
  if (typeof colorLike === "string" && TOKEN_TO_CSS[colorLike]) return TOKEN_TO_CSS[colorLike];
  return colorLike;
}

export function TimeTableGrid({ data = [], onSlotClick, selectedStart }) {
  const hours = generatePlannerHours();

  return (
    <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white select-none text-xs md:text-sm w-full h-full min-h-0 shadow-sm">
      {hours.map((hour) => (
        // ✅ 고정 h-6/md:h-10 제거 → 남은 높이를 row 수로 자동 등분
        <div key={hour} className="flex flex-1 min-h-0 border-b border-slate-100 last:border-b-0">
          <div className="w-7 md:w-10 flex-shrink-0 flex items-center justify-center border-r border-slate-100 bg-slate-50 text-[9px] md:text-xs text-slate-400 font-medium">
            {hour}
          </div>

          <div className="flex-1 flex min-h-0">
            {Array.from({ length: 6 }).map((_, slotIndex) => {
              const timeId = generateTimeId(hour, slotIndex);
              const task = findTaskForSlot(data, timeId);
              const isSelected = selectedStart === timeId;

              const baseClasses =
                "flex-1 border-r border-white/30 last:border-r-0 cursor-pointer relative transition-all duration-200";
              const stateClasses = isSelected
                ? "bg-indigo-500 hover:bg-indigo-600"
                : task
                ? "animate-block-appear"
                : "hover:bg-slate-100";

              const inlineStyle =
                task && !isSelected
                  ? { backgroundColor: resolveCssColor(task.color, task.subject) }
                  : {};

              const tooltip = task ? `${task.content} (${task.startTime} ~ ${task.endTime})` : timeId;

              return (
                <div
                  key={slotIndex}
                  onClick={() => onSlotClick?.(timeId)}
                  className={`${baseClasses} ${stateClasses}`}
                  style={inlineStyle}
                  title={tooltip}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
