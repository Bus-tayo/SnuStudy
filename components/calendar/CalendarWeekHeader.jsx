import React from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarWeekHeader() {
    return (
        <div className="grid grid-cols-7 border-b border-white/10">
            {DAYS.map((day, idx) => {
                let colorStyle = { color: 'var(--calendar-text-secondary)' };
                if (idx === 0) colorStyle = { color: 'var(--calendar-sunday)' };
                if (idx === 6) colorStyle = { color: 'var(--calendar-saturday)' };

                return (
                    <div
                        key={day}
                        className="py-2 text-center text-sm font-semibold"
                        style={colorStyle}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
    );
}
