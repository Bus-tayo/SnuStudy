"use client";

// ===== Constants =====
export const PLANNER_DAY_START_HOUR = 6;  // 플래너 하루 시작: 오전 6시
export const PLANNER_DAY_END_HOUR = 2;     // 플래너 하루 종료: 다음 날 새벽 2시
export const MINUTES_PER_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const MINUTES_IN_DAY = HOURS_IN_DAY * MINUTES_PER_HOUR;

// ===== Time Format Utilities =====

/**
 * Convert "HH:MM" string to minutes since midnight
 * @param {string} timeStr - Time string in "HH:MM" format
 * @returns {number} Minutes since midnight (0-1439)
 */
export const timeToMinutes = (timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * MINUTES_PER_HOUR + (m || 0);
};

/**
 * Convert Date object to "HH:MM" grid format
 * @param {Date} date - Date object
 * @returns {string} Time in "HH:MM" format
 */
export const dateToGridTime = (date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};

/**
 * Adjust minutes for planner day (6AM - 2AM next day)
 * Times before 6AM are treated as "next day" in the planner context
 * @param {number} minutes - Minutes since midnight
 * @returns {number} Adjusted minutes for planner day comparison
 */
export const adjustMinutesForPlannerDay = (minutes) => {
    if (minutes < PLANNER_DAY_START_HOUR * MINUTES_PER_HOUR) {
        return minutes + MINUTES_IN_DAY;
    }
    return minutes;
};

/**
 * Check if hour is in early morning (before planner day starts)
 * @param {number} hour - Hour (0-23)
 * @returns {boolean} True if before 6AM
 */
export const isEarlyMorning = (hour) => hour < PLANNER_DAY_START_HOUR;

/**
 * Create ISO date string for a given time on the current planner date
 * Handles day crossing for early morning hours (0-5 AM = next calendar day)
 * @param {string} timeId - Time in "HH:MM" format
 * @param {Date} baseDate - The planner date
 * @returns {string} ISO date string
 */
export const createIsoDateForPlannerTime = (timeId, baseDate) => {
    const [h, m] = timeId.split(':').map(Number);
    const d = new Date(baseDate);
    d.setHours(h, m, 0, 0);

    // Early morning hours belong to "Planner Day" which is the next calendar day
    if (isEarlyMorning(h)) {
        d.setDate(d.getDate() + 1);
    }
    return d.toISOString();
};

// ===== Grid Display Utilities =====

/**
 * Generate array of hours for TimeTable grid display
 * From 6AM to 2AM next day (21 hours total)
 * @returns {number[]} Array of hours [6, 7, 8, ..., 23, 0, 1, 2]
 */
export const generatePlannerHours = () => {
    const totalHours = 21; // 6AM to 2AM = 21 hours
    return Array.from({ length: totalHours }, (_, i) => {
        const h = i + PLANNER_DAY_START_HOUR;
        return h >= HOURS_IN_DAY ? h - HOURS_IN_DAY : h;
    });
};

/**
 * Generate time ID for a given hour and 10-minute slot index
 * @param {number} hour - Hour (0-23)
 * @param {number} slotIndex - Slot index (0-5 for 10-min intervals)
 * @returns {string} Time ID in "HH:MM" format
 */
export const generateTimeId = (hour, slotIndex) => {
    const minute = slotIndex * 10;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// ===== Default Colors =====
export const DEFAULT_STUDY_COLOR = '#6366F1'; // Indigo
export const PRESET_COLORS = [
    '#6366F1', // Indigo (default)
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#F97316', // Orange
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#84CC16', // Lime
];

/**
 * Check if a slot falls within any task's time range
 * Handles day crossing for early morning hours
 * @param {Array} tasks - List of tasks/sessions
 * @param {string} slotTimeId - Time ID in "HH:MM" format
 * @returns {object|null} Found task or null
 */
export const findTaskForSlot = (tasks, slotTimeId) => {
    const slotMinutes = timeToMinutes(slotTimeId);
    const adjustedSlotMinutes = adjustMinutesForPlannerDay(slotMinutes);

    for (const task of tasks) {
        let startMinutes = adjustMinutesForPlannerDay(timeToMinutes(task.startTime));
        let endMinutes = adjustMinutesForPlannerDay(timeToMinutes(task.endTime));

        // Handle end time that wraps (e.g., start 23:00, end 01:00 after adjustment)
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        // Check if slot is within range [start, end)
        if (adjustedSlotMinutes >= startMinutes && adjustedSlotMinutes < endMinutes) {
            return task;
        }
    }
    return null;
};
