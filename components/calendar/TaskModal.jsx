"use client";

import React from 'react';
import { useCalendar } from './CalendarContext';
import { format, isSameDay } from 'date-fns';
import { X } from 'lucide-react';

export function TaskModal() {
    const { selectedDate, tasks, isModalOpen, setIsModalOpen } = useCalendar();

    if (!isModalOpen) return null;

    const dailyTasks = tasks.filter(task => isSameDay(task.date, selectedDate));

    React.useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setIsModalOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [setIsModalOpen]);

    return (
        <div
            className="fixed inset-0 bg-black/40 backdrop-blur-[4px] flex items-center justify-center z-50 p-4"
            onClick={() => setIsModalOpen(false)}
        >
            <div
                className="bg-white rounded-3xl w-full max-w-[400px] max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-white/50 animate-[modalSlideUp_0.3s_cubic-bezier(0.16,1,0.3,1)]"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-4 px-6 border-b border-gray-200">
                    <h3 className="text-xl font-bold text-gray-800">
                        {format(selectedDate, 'yyyy-MM-dd')}
                    </h3>
                    <button className="bg-transparent border-none text-gray-500 cursor-pointer p-1 hover:text-gray-900" onClick={() => setIsModalOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {dailyTasks.length === 0 ? (
                        <p className="text-gray-400 italic text-center p-4">
                            No tasks scheduled for this day.
                        </p>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {dailyTasks.map(task => (
                                <div key={task.id} className="p-4 rounded-xl border border-gray-200 bg-slate-50">
                                    <div className="flex items-center gap-3 mb-2">
                                        <input
                                            type="checkbox"
                                            checked={task.isCompleted}
                                            readOnly
                                            className="w-[18px] h-[18px] accent-blue-500"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                {task.category && (
                                                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-gray-200 text-gray-600 font-bold">
                                                        {task.category}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-medium ${task.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {task.content}
                                            </span>
                                        </div>
                                    </div>

                                    {task.feedback && (
                                        <div className="mt-3 p-3.5 bg-green-50 rounded-lg border-l-4 border-green-500 text-green-800 text-sm leading-relaxed">
                                            <strong>Mentor Feedback:</strong><br />
                                            {task.feedback}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
