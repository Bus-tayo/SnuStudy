"use client";

import React from 'react';
import { useCalendar } from './CalendarContext';
import { startOfWeek, endOfWeek, eachDayOfInterval, format } from 'date-fns';

import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarWeekHeader } from './CalendarWeekHeader';

export function WeekView() {
  const { currentDate, selectedDate, setSelectedDate, direction, tasks, events, onDateClick, height } = useCalendar();

  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? '100%' : '-100%',
      opacity: 0,
      zIndex: 0,
    }),
    center: { x: 0, opacity: 1, zIndex: 1 },
    exit: (direction) => ({
      x: direction < 0 ? '100%' : '-100%',
      opacity: 0,
      zIndex: 0,
    }),
  };

  return (
    <div
      style={{
        overflow: 'hidden',
        perspective: '1200px',
        position: 'relative',
        height: height,
        transition: 'height 0.3s ease',
      }}
    >
      <CalendarWeekHeader />

      <div style={{ position: 'relative', height: 'calc(100% - 40px)', width: '100%' }}>
        <AnimatePresence mode="popLayout" custom={direction}>
          <motion.div
            key={format(currentDate, 'yyyy-w')}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.35 }}
            className="grid grid-cols-7 w-full h-full border-l border-t border-gray-200"
            style={{ width: '100%' }}
          >
            {days.map((day) => (
              <CalendarDayCell
                key={day.toString()}
                day={day}
                selectedDate={selectedDate}
                tasks={tasks}
                events={events}
                onDayClick={(d) => {
                  setSelectedDate(d);
                  onDateClick?.(d);
                }}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
