"use client";

import React from 'react';
import { useCalendar } from './CalendarContext';
import { format, isSameDay } from 'date-fns';

export function DailyDetail() {
    const { selectedDate, tasks } = useCalendar();

    const dailyTasks = tasks.filter(task => isSameDay(task.date, selectedDate));

    return (
        <div className="p-6 border-t border-gray-200 bg-white flex-1">
            <h3 className="text-lg font-bold mb-4 text-gray-800">
                {format(selectedDate, 'yyyy-MM-dd')}
            </h3>

            {dailyTasks.length === 0 ? (
                <p className="text-gray-400 italic">
                    No tasks scheduled for this day.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {dailyTasks.map(task => (
                        <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50">
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    type="checkbox"
                                    checked={task.isCompleted}
                                    readOnly
                                    className="accent-blue-500"
                                />
                                <span className={task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}>
                                    {task.content}
                                </span>
                            </div>

                            {task.feedback && (
                                <div className="mt-2 p-3 bg-green-50 rounded-md border-l-4 border-green-500 text-green-800 text-sm">
                                    <strong>Mentor Feedback:</strong> {task.feedback}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
