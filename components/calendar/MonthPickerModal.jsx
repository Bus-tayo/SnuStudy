import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useCalendar } from './CalendarContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, setMonth, setYear, getYear, getMonth } from 'date-fns';
import { CalendarDayCell } from './CalendarDayCell';
import { CalendarWeekHeader } from './CalendarWeekHeader';

function WheelPicker({ viewDate, onSelect, onCancel }) {
    const currentYear = getYear(viewDate);
    const currentMonth = getMonth(viewDate);

    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);

    const yearRef = useRef(null);
    const monthRef = useRef(null);

    const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i);
    const months = Array.from({ length: 12 }, (_, i) => i);

    useEffect(() => {
        if (yearRef.current) {
            const yearIndex = years.indexOf(selectedYear);
            yearRef.current.scrollTop = yearIndex * 40;
        }
        if (monthRef.current) {
            monthRef.current.scrollTop = selectedMonth * 40;
        }
    }, []);

    const handleConfirm = () => {
        const newDate = setMonth(setYear(viewDate, selectedYear), selectedMonth);
        onSelect(newDate);
    };

    return (
        <div className="absolute inset-0 bg-white rounded-xl flex flex-col z-[100]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                <button onClick={onCancel} className="text-gray-500 text-base border-none bg-transparent cursor-pointer">취소</button>
                <h3 className="m-0 text-base font-semibold">날짜 선택</h3>
                <button onClick={handleConfirm} className="text-blue-500 text-base font-semibold border-none bg-transparent cursor-pointer">확인</button>
            </div>

            <div className="flex-1 flex justify-center items-center p-4 gap-2">
                {/* Year Wheel */}
                <div className="relative w-[100px] h-[160px]">
                    <div className="absolute top-1/2 left-0 right-0 h-[40px] -translate-y-1/2 bg-slate-100 rounded-lg pointer-events-none z-0" />
                    <div
                        ref={yearRef}
                        className="relative h-full overflow-y-scroll snap-y snap-mandatory pt-[60px] pb-[60px] z-10 scrollbar-hide"
                        onScroll={(e) => {
                            const scrollTop = e.currentTarget.scrollTop;
                            const index = Math.round(scrollTop / 40);
                            if (years[index] !== undefined) setSelectedYear(years[index]);
                        }}
                    >
                        {years.map(year => (
                            <div
                                key={year}
                                className={`
                                    h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all
                                    ${selectedYear === year ? 'text-xl font-semibold text-slate-800' : 'text-base font-normal text-slate-400'}
                                `}
                                onClick={() => {
                                    setSelectedYear(year);
                                    if (yearRef.current) {
                                        yearRef.current.scrollTo({ top: years.indexOf(year) * 40, behavior: 'smooth' });
                                    }
                                }}
                            >
                                {year}년
                            </div>
                        ))}
                    </div>
                </div>

                {/* Month Wheel */}
                <div className="relative w-[80px] h-[160px]">
                    <div className="absolute top-1/2 left-0 right-0 h-[40px] -translate-y-1/2 bg-slate-100 rounded-lg pointer-events-none z-0" />
                    <div
                        ref={monthRef}
                        className="relative h-full overflow-y-scroll snap-y snap-mandatory pt-[60px] pb-[60px] z-10 scrollbar-hide"
                        onScroll={(e) => {
                            const scrollTop = e.currentTarget.scrollTop;
                            const index = Math.round(scrollTop / 40);
                            if (months[index] !== undefined) setSelectedMonth(months[index]);
                        }}
                    >
                        {months.map(month => (
                            <div
                                key={month}
                                className={`
                                    h-[40px] flex items-center justify-center snap-center cursor-pointer transition-all
                                    ${selectedMonth === month ? 'text-xl font-semibold text-slate-800' : 'text-base font-normal text-slate-400'}
                                `}
                                onClick={() => {
                                    setSelectedMonth(month);
                                    if (monthRef.current) {
                                        monthRef.current.scrollTo({ top: month * 40, behavior: 'smooth' });
                                    }
                                }}
                            >
                                {month + 1}월
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MonthPickerModal({ isOpen, onClose }) {
    const { selectedDate, setSelectedDate, currentDate, setCurrentDate, tasks } = useCalendar();
    const [mounted, setMounted] = useState(false);
    const [viewDate, setViewDate] = useState(currentDate);
    const [tempSelectedDate, setTempSelectedDate] = useState(selectedDate);
    const [direction, setDirection] = useState(0);
    const [showWheelPicker, setShowWheelPicker] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setViewDate(currentDate);
            setTempSelectedDate(selectedDate);
            setShowWheelPicker(false);
        }
    }, [isOpen, currentDate, selectedDate]);

    if (!isOpen || !mounted) return null;

    const handlePrevMonth = () => {
        setDirection(-1);
        setViewDate(prev => subMonths(prev, 1));
    };

    const handleNextMonth = () => {
        setDirection(1);
        setViewDate(prev => addMonths(prev, 1));
    };

    const handleDateClick = (d) => {
        setTempSelectedDate(d);
    };

    const handleConfirm = () => {
        setSelectedDate(tempSelectedDate);
        setCurrentDate(tempSelectedDate);
        onClose();
    };

    const handleCancel = () => {
        onClose();
    };

    const handleWheelSelect = (d) => {
        setViewDate(d);
        setShowWheelPicker(false);
    };

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return createPortal(
        <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-[2px]" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl w-full max-w-[400px] max-h-[90vh] p-0 overflow-hidden relative shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {showWheelPicker && (
                    <WheelPicker
                        viewDate={viewDate}
                        onSelect={handleWheelSelect}
                        onCancel={() => setShowWheelPicker(false)}
                    />
                )}

                <div className="flex justify-between items-center p-4 border-b border-gray-100">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent"
                        aria-label="Previous Month"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <h3
                        className="m-0 text-base font-semibold cursor-pointer px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                        onClick={() => setShowWheelPicker(true)}
                    >
                        {format(viewDate, 'yyyy년 M월')}
                    </h3>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors border-none bg-transparent"
                        aria-label="Next Month"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="px-4 pb-0 overflow-visible">
                    <CalendarWeekHeader />
                    <div
                        className="grid grid-cols-7 w-full border-l border-t border-gray-200"
                    >
                        {days.map((day) => {
                            const isCurrentMonth = isSameMonth(day, monthStart);
                            return (
                                <CalendarDayCell
                                    key={day.toString()}
                                    day={day}
                                    selectedDate={tempSelectedDate}
                                    tasks={tasks}
                                    onDayClick={handleDateClick}
                                    isOtherMonth={!isCurrentMonth}
                                />
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3 p-4 border-t border-gray-100 mt-2">
                    <button
                        onClick={handleCancel}
                        className="flex-1 py-3 px-4 rounded-lg border border-gray-200 bg-white text-gray-500 text-base font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 py-3 px-4 rounded-lg border-none bg-blue-500 text-white text-base font-semibold cursor-pointer hover:bg-blue-600 transition-colors shadow-sm"
                    >
                        확인
                    </button>
                </div>
            </motion.div>
        </div>,
        document.body
    );
}
