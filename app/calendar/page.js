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
                    onDateClick={(date) => setSelectedDate(date)}
                />


            </div>
        </main >
    );
}
