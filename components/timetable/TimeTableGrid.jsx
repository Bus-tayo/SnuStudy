"use client";

import React from "react";
import {
    timeToMinutes,
    adjustMinutesForPlannerDay,
    generatePlannerHours,
    generateTimeId,
    DEFAULT_STUDY_COLOR,
    findTaskForSlot,
} from "@/lib/utils/timeUtils";

/**
 * TimeTableGrid Component
 * Displays a 21-hour grid (6AM - 2AM) with 10-minute slots
 */
export function TimeTableGrid({ data = [], onSlotClick, selectedStart }) {
    const hours = generatePlannerHours();

    return (
        <div className="flex flex-col border border-slate-200 rounded-xl overflow-hidden bg-white select-none text-xs md:text-sm w-full shadow-sm">
            {hours.map((hour) => (
                <div key={hour} className="flex h-6 md:h-10 border-b border-slate-100 last:border-b-0">
                    {/* Time Label */}
                    <div className="w-7 md:w-10 flex-shrink-0 flex items-center justify-center border-r border-slate-100 bg-slate-50 text-[9px] md:text-xs text-slate-400 font-medium">
                        {hour}
                    </div>

                    {/* 10-min Slots */}
                    <div className="flex-1 flex">
                        {Array.from({ length: 6 }).map((_, slotIndex) => {
                            const timeId = generateTimeId(hour, slotIndex);
                            const task = findTaskForSlot(data, timeId);
                            const isSelected = selectedStart === timeId;

                            // Determine styles
                            const baseClasses = "flex-1 border-r border-white/30 last:border-r-0 cursor-pointer relative transition-all duration-200";
                            const stateClasses = isSelected
                                ? "bg-indigo-500 hover:bg-indigo-600"
                                : task
                                    ? "animate-block-appear"
                                    : "hover:bg-slate-100";

                            const inlineStyle = task && !isSelected
                                ? { backgroundColor: task.color || DEFAULT_STUDY_COLOR }
                                : {};

                            const tooltip = task
                                ? `${task.content} (${task.startTime} ~ ${task.endTime})`
                                : timeId;

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
