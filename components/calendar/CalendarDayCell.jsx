
import React from 'react';
import { format, isSameDay, isToday, getDay } from 'date-fns';
import { Calculator, BookOpen, Languages, FlaskConical, FileText } from 'lucide-react';

export function CalendarDayCell({
    day,
    selectedDate,
    tasks,
    onDayClick,
    isOtherMonth = false
}) {
    const isSelected = isSameDay(day, selectedDate);
    const isCurrentDay = isToday(day);
    const dayOfWeek = getDay(day);

    let textColorClass = 'text-gray-700';
    if (dayOfWeek === 0) textColorClass = 'text-red-500';
    if (dayOfWeek === 6) textColorClass = 'text-blue-500';
    if (isOtherMonth) textColorClass = 'text-slate-300 pointer-events-none opacity-50 bg-slate-50';

    const getCategoryIcon = (category) => {
        const cat = category?.toLowerCase() || '';
        const props = { size: 14, className: "block text-gray-500" };

        if (cat === 'math') return <Calculator {...props} />;
        if (cat === 'english') return <BookOpen {...props} />;
        if (cat === 'korean') return <Languages {...props} />;
        if (cat === 'science') return <FlaskConical {...props} />;
        return <FileText {...props} />;
    };

    const renderTaskIcons = () => {
        if (!tasks) return null;
        const dailyTasks = tasks.filter(t => isSameDay(t.date, day));
        if (dailyTasks.length === 0) return null;

        const tasksByCategory = {};
        dailyTasks.forEach(task => {
            const rawCat = task.category || 'Other';
            const normalizationKey = rawCat.toLowerCase();
            if (!tasksByCategory[normalizationKey]) tasksByCategory[normalizationKey] = [];
            tasksByCategory[normalizationKey].push(task);
        });

        const categories = Object.keys(tasksByCategory).sort((a, b) => {
            const countDiff = tasksByCategory[b].length - tasksByCategory[a].length;
            if (countDiff !== 0) return countDiff;
            return a.localeCompare(b);
        });

        const MAX_VISIBLE_ICONS = 3;

        return (
            <div className="flex flex-col gap-0.5 mt-1">
                {categories.map(cat => {
                    const tasksInCategory = tasksByCategory[cat];
                    const visibleTasks = tasksInCategory.slice(0, MAX_VISIBLE_ICONS);
                    const hiddenCount = tasksInCategory.length - MAX_VISIBLE_ICONS;

                    return (
                        <div key={cat} className="flex flex-nowrap items-center">
                            {visibleTasks.map((task, index) => (
                                <div
                                    key={task.id}
                                    className={`
                                        relative flex items-center justify-center w-5 h-5 rounded bg-slate-100 transition-all
                                        ${task.isCompleted ? 'opacity-50 bg-slate-200' : ''}
                                    `}
                                    style={{ marginLeft: index > 0 ? '-6px' : 0, zIndex: visibleTasks.length - index }}
                                >
                                    {getCategoryIcon(task.category)}
                                    {task.feedback && (
                                        <div className="absolute -top-[2px] -right-[2px] w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
                                    )}
                                </div>
                            ))}
                            {hiddenCount > 0 && (
                                <div
                                    className="flex items-center justify-center h-4 px-0.5 text-[9px] font-semibold text-slate-500 bg-slate-200 rounded ml-[-4px]"
                                    style={{ zIndex: 0 }}
                                >
                                    +{hiddenCount}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div
            className={`
                min-h-[80px] p-2 border-r border-b border-gray-200 flex flex-col transition-colors cursor-pointer relative bg-white
                ${isOtherMonth ? 'bg-slate-50 text-slate-300' : 'hover:bg-slate-50'}
                ${isSelected ? 'bg-blue-50 ring-inset ring-2 ring-blue-500 z-10' : ''}
                ${textColorClass}
            `}
            onClick={() => onDayClick(day)}
        >
            <div className="flex justify-between mb-1">
                <span className={`
                    ${isCurrentDay
                        ? 'bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center -ml-1'
                        : ''}
                `}>
                    {format(day, 'd')}
                </span>
            </div>

            <div className="mt-1">
                {renderTaskIcons()}
            </div>
        </div>
    );
}
