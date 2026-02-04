import React from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWeekHeader() {
    return (
        <div className="grid grid-cols-7 border-b border-gray-200 bg-white">
            {DAYS.map((day, idx) => {
                let colorClass = 'text-gray-500';
                if (idx === 0) colorClass = 'text-red-500';
                if (idx === 6) colorClass = 'text-blue-500';

                return (
                    <div
                        key={day}
                        className={`py-2 text-center text-sm font-semibold ${colorClass}`}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
    );
}
