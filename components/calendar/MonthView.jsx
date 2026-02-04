"use client";

import React from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth } from 'date-fns';
import { useCalendar } from './CalendarContext';
// import styles from './Calendar.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarWeekHeader } from './CalendarWeekHeader';

export function MonthView({ onDateSelect, height: propHeight }) {
    const { currentDate, selectedDate, setSelectedDate, tasks, setIsModalOpen, direction, useModal, onDateClick, height: contextHeight } = useCalendar();

    const finalHeight = propHeight || contextHeight;

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const variants = {
        enter: (direction) => ({
            x: direction > 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
            zIndex: 1,
        },
        exit: (direction) => ({
            x: direction < 0 ? '100%' : '-100%',
            opacity: 0,
            zIndex: 0,
        })
    };

    return (
        <div className="flex flex-col overflow-hidden relative" style={{
            height: finalHeight,
            transition: 'height 0.3s ease',
            perspective: '1200px',
        }}>
            <CalendarWeekHeader />

            <div className="relative h-[calc(100%-40px)] w-full">
                <AnimatePresence mode="popLayout" custom={direction}>
                    <motion.div
                        key={format(currentDate, 'yyyy-MM')}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
                        className="grid grid-cols-7 w-full border-l border-t border-gray-200"
                        style={{ width: '100%' }}
                    >
                        {days.map((day, idx) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);

                            return (
                                <CalendarDayCell
                                    key={day.toString()}
                                    day={day}
                                    selectedDate={selectedDate}
                                    tasks={tasks}
                                    onDayClick={(d) => {
                                        if (onDateSelect) {
                                            onDateSelect(d);
                                            return;
                                        }

                                        setSelectedDate(d);
                                        if (useModal) {
                                            setIsModalOpen(true);
                                        } else if (onDateClick) {
                                            onDateClick(d);
                                        }
                                    }}
                                    isOtherMonth={!isCurrentMonth}
                                />
                            );
                        })}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
