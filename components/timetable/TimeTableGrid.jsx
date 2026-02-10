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

export function TimeTableGrid({ data = [], onSlotClick, selectedStart, labelMode = "default" }) {
  const hours = generatePlannerHours();
  const subtleSubjectTaskBoundaryColor = "var(--timetable-task-divider)";

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border text-xs shadow-sm select-none md:text-sm"
      style={{
        borderColor: "var(--timetable-grid-border)",
        backgroundColor: "var(--timetable-grid-bg)",
      }}
    >
      {hours.map((hour, hourIndex) => {
        const prevHour = hours[hourIndex - 1];
        const nextHour = hours[hourIndex + 1];

        return (
          <div key={hour} className="flex min-h-0 flex-1">
            <div
              className="flex w-7 flex-shrink-0 items-center justify-center border-r border-b text-[9px] font-medium md:w-10 md:text-xs"
              style={{
                borderColor: "var(--timetable-grid-border)",
                backgroundColor: "var(--timetable-hour-bg)",
                color: "var(--timetable-hour-text)",
              }}
            >
              {hour}
            </div>

            <div className="flex min-h-0 flex-1">
              {Array.from({ length: 6 }).map((_, slotIndex) => {
                const timeId = generateTimeId(hour, slotIndex);
                const task = findTaskForSlot(data, timeId);
                const isSelected = selectedStart === timeId;

                const baseClasses =
                  "relative flex-1 cursor-pointer border-r border-b transition-colors duration-150 last:border-r-0";
                const stateClasses = isSelected
                  ? "bg-[var(--timetable-selected-bg)] hover:bg-[var(--timetable-selected-hover-bg)]"
                  : task
                    ? ""
                    : "hover:bg-[var(--timetable-empty-hover-bg)]";

                const taskColor = task ? resolveCssColor(task.color, task.subject) : null;
                const tooltip = task ? `${task.content} (${task.startTime} ~ ${task.endTime})` : timeId;
                const leftTimeId =
                  slotIndex > 0
                    ? generateTimeId(hour, slotIndex - 1)
                    : prevHour !== undefined
                      ? generateTimeId(prevHour, 5)
                      : null;
                const rightTimeId =
                  slotIndex < 5
                    ? generateTimeId(hour, slotIndex + 1)
                    : null;
                const lowerTimeId = nextHour !== undefined ? generateTimeId(nextHour, slotIndex) : null;

                const leftTask = leftTimeId ? findTaskForSlot(data, leftTimeId) : null;
                const rightTask = rightTimeId ? findTaskForSlot(data, rightTimeId) : null;
                const lowerTask = lowerTimeId ? findTaskForSlot(data, lowerTimeId) : null;

                const isSameTaskAtLeft = !!(task && leftTask && task.id === leftTask.id);
                const isSameTaskAtRight = !!(task && rightTask && task.id === rightTask.id);
                const isSameTaskAtLower = !!(task && lowerTask && task.id === lowerTask.id);
                const isSameSubjectDifferentTaskAtRight =
                  !!(task && rightTask && task.subject === rightTask.subject && task.id !== rightTask.id);
                const isSameSubjectDifferentTaskAtLower =
                  !!(task && lowerTask && task.subject === lowerTask.subject && task.id !== lowerTask.id);

                const taskStyle =
                  task && !isSelected
                    ? {
                        backgroundColor: taskColor,
                        borderRightColor: isSameTaskAtRight
                          ? "transparent"
                          : isSameSubjectDifferentTaskAtRight
                            ? subtleSubjectTaskBoundaryColor
                            : undefined,
                        borderBottomColor: isSameTaskAtLower
                          ? "transparent"
                          : isSameSubjectDifferentTaskAtLower
                            ? subtleSubjectTaskBoundaryColor
                            : undefined,
                        backgroundClip: "border-box",
                      }
                    : undefined;
                const slotStyle = {
                  borderColor: "var(--timetable-grid-border)",
                  ...(taskStyle || {}),
                };
                const shouldShowTaskLabel = !!(task && !isSelected && !isSameTaskAtLeft);
                const taskLabel = task?.content ? String(task.content) : "";

                let horizontalSpanSlots = 1;
                if (shouldShowTaskLabel && task) {
                  for (let i = slotIndex + 1; i < 6; i += 1) {
                    const nextInRowTask = findTaskForSlot(data, generateTimeId(hour, i));
                    if (!nextInRowTask || nextInRowTask.id !== task.id) break;
                    horizontalSpanSlots += 1;
                  }
                }

                const labelWidthPercentBase =
                  labelMode === "compact" ? horizontalSpanSlots * 86 : horizontalSpanSlots * 100;
                const labelMaxWidth = `calc(${labelWidthPercentBase}% - var(--timetable-label-max-width-offset, 10px))`;

                return (
                  <div
                    key={slotIndex}
                    onClick={() => onSlotClick?.(timeId)}
                    className={`${baseClasses} ${stateClasses}`}
                    title={tooltip}
                    style={slotStyle}
                  >
                    {shouldShowTaskLabel ? (
                      <span
                        className="pointer-events-none absolute z-10 whitespace-nowrap leading-none"
                        style={{
                          left: "var(--timetable-label-offset-x)",
                          top: "var(--timetable-label-offset-y)",
                          borderRadius: "var(--timetable-label-radius)",
                          paddingInline: "var(--timetable-label-padding-x)",
                          paddingBlock: "var(--timetable-label-padding-y)",
                          fontSize: "var(--timetable-label-font-size)",
                          fontWeight: "var(--timetable-label-font-weight)",
                          color: "var(--timetable-label-text-color)",
                          backgroundColor: taskColor,
                          backgroundImage: taskColor
                            ? `linear-gradient(rgba(0,0,0,var(--timetable-label-bg-darken-alpha,0.12)), rgba(0,0,0,var(--timetable-label-bg-darken-alpha,0.12))), linear-gradient(${taskColor}, ${taskColor})`
                            : undefined,
                          boxShadow:
                            "inset 0 0 0 var(--timetable-label-border-width,1px) rgba(0,0,0,var(--timetable-label-border-darken-alpha,0.22))",
                          maxWidth: labelMaxWidth,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {taskLabel}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
