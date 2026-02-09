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
      {hours.map((hour, hourIndex) => {
        // 다음 시간대 확인 (세로 합치기용)
        const nextHour = hours[hourIndex + 1];

        return (
          // ✅ Row의 border-b 제거 -> Slot에서 개별 처리
          <div key={hour} className="flex flex-1 min-h-0 last:border-b-0">
            <div className="w-7 md:w-10 flex-shrink-0 flex items-center justify-center border-r border-b border-slate-100 bg-slate-50 text-[9px] md:text-xs text-slate-400 font-medium">
              {hour}
            </div>

            <div className="flex-1 flex min-h-0">
              {Array.from({ length: 6 }).map((_, slotIndex) => {
                const timeId = generateTimeId(hour, slotIndex);
                const task = findTaskForSlot(data, timeId);
                const isSelected = selectedStart === timeId;

                // 기본적으로 모든 슬롯에 하단 보더 추가
                const baseClasses =
                  "flex-1 border-r border-b border-slate-100 last:border-r-0 cursor-pointer relative transition-all duration-200 after:hidden after:content-none";
                const stateClasses = isSelected
                  ? "bg-indigo-500 hover:bg-indigo-600"
                  : task
                    ? "animate-block-appear"
                    : "hover:bg-slate-100";

                const nextTimeId = slotIndex < 5 ? generateTimeId(hour, slotIndex + 1) : null;
                const nextTask = nextTimeId ? findTaskForSlot(data, nextTimeId) : null;
                const isSameAsNext = task && nextTask && task.id === nextTask.id;

                // 다음 시간(아래쪽) 확인
                const belowTimeId = nextHour !== undefined ? generateTimeId(nextHour, slotIndex) : null;
                const belowTask = belowTimeId ? findTaskForSlot(data, belowTimeId) : null;
                const isSameAsBelow = task && belowTask && task.id === belowTask.id;

                const taskColor = task ? resolveCssColor(task.color, task.subject) : null;

                // 겹침/Gap 방지 그림자 생성
                const shadows = [];
                if (isSameAsNext) shadows.push(`1px 0 0 0 ${taskColor}`);
                if (isSameAsBelow) shadows.push(`0 1px 0 0 ${taskColor}`);
                const boxShadow = shadows.length > 0 ? shadows.join(", ") : "none";

                const inlineStyle =
                  task && !isSelected
                    ? {
                      backgroundColor: taskColor,
                      borderBottom: isSameAsBelow ? "0" : "2px solid rgba(255,255,255,0.8)",
                      borderRight: isSameAsNext ? "0" : "2px solid rgba(255,255,255,0.8)",
                      boxShadow,
                      zIndex: isSameAsNext || isSameAsBelow ? 1 : "auto",
                    }
                    : {};

                const tooltip = task ? `${task.content} (${task.startTime} ~ ${task.endTime})` : timeId;

                return (
                  <div
                    key={slotIndex}
                    onClick={() => onSlotClick?.(timeId)}
                    className={`${baseClasses} ${stateClasses} ${isSameAsNext ? "!border-r-0" : ""} ${isSameAsBelow ? "!border-b-0" : ""}`}
                    style={inlineStyle}
                    title={tooltip}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
