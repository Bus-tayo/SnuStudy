"use client";

import { Calendar } from '@/components/calendar';
import { startOfToday, addDays, isSameDay, format } from 'date-fns';
import { useState } from 'react';

export default function CalendarTestPage() {
    // 1. Manage active date state (Default: Today)
    const [selectedDate, setSelectedDate] = useState(startOfToday());

    // 2. Task State
    const [tasks, setTasks] = useState([
        {
            id: '1',
            date: startOfToday(),
            content: 'Math: Solve 20 calculus problems',
            category: 'Math',
            isCompleted: true,
            feedback: 'Great job on the derivatives.'
        },
        {
            id: '2',
            date: startOfToday(),
            content: 'English: Read Chapter 3 of the textbook',
            category: 'English',
            isCompleted: false,
        },
        {
            id: '3',
            date: addDays(startOfToday(), 1),
            content: 'Physics: Review Newton\'s laws',
            category: 'Science',
            isCompleted: false,
        },
        {
            id: '5',
            date: startOfToday(),
            content: 'Math: Review Trigonometry',
            category: 'Math',
            isCompleted: false
        }
    ]);

    // Helper to add a task
    const categories = ['Math', 'English', 'Science', 'Korean'];
    const addTask = () => {
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const newTask = {
            id: Date.now().toString(),
            date: selectedDate,
            content: `${randomCategory}: New task ${Date.now()}`,
            category: randomCategory,
            isCompleted: false
        };
        setTasks(prev => [...prev, newTask]);
    };

    // Helper to delete a task
    const deleteTask = (taskId) => {
        setTasks(prev => prev.filter(t => t.id !== taskId));
    };

    // 3. Filter tasks for the selected date
    const activeTasks = tasks.filter(task =>
        isSameDay(task.date, selectedDate)
    );

    return (
        <main className="min-h-screen bg-slate-50 flex flex-col gap-8 pb-8">
            <header className="w-full max-w-4xl mx-auto px-8 pt-8">
                <h1 className="text-3xl font-bold text-slate-800">
                    Study Coach
                </h1>
                <p className="text-slate-500">Calendar Component Test Page</p>
            </header>

            <div className="w-full max-w-4xl mx-auto">
                {/* 4. Calendar Component (Edge-to-edge on mobile) */}
                <Calendar
                    tasks={tasks}
                    title="캘린더"
                    useModal={true}
                    onDateClick={(date) => setSelectedDate(date)}
                />

                {/* 5. External Task List (with padding) */}
                <div className="mt-8 px-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-700 m-0">
                            Tasks for {format(selectedDate, 'yyyy-MM-dd')}
                        </h3>
                        <button
                            onClick={addTask}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
                        >
                            + Add Task
                        </button>
                    </div>

                    {activeTasks.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {activeTasks.map(task => (
                                <div key={task.id} className={`
                                    p-4 bg-white rounded-xl shadow-sm flex items-center gap-4 border-l-4
                                    ${task.isCompleted ? 'border-green-500' : 'border-blue-500'}
                                `}>
                                    <input
                                        type="checkbox"
                                        checked={task.isCompleted}
                                        readOnly
                                        className="w-5 h-5 accent-blue-500"
                                    />
                                    <div className="flex-1">
                                        <div className="font-semibold text-slate-800">{task.content}</div>
                                        <div className="text-sm text-slate-500 mt-0.5">
                                            {task.category}
                                        </div>
                                        {task.feedback && (
                                            <div className="mt-2 text-sm bg-green-50 p-2 rounded-md text-green-800">
                                                💡 {task.feedback}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteTask(task.id)}
                                        className="px-3 py-1.5 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                            No tasks scheduled for this day.
                        </div>
                    )}
                </div>
            </div>
        </main >
    );
}
