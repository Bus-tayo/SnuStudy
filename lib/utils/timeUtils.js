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
export const DEFAULT_STUDY_COLOR = '#C7D3F6'; // Rich Pastel Indigo
export const PRESET_COLORS = [
    '#C7D3F6', // Rich Pastel Indigo (default)
    '#D8C7F6', // Rich Pastel Violet
    '#F5C6DD', // Rich Pastel Pink
    '#F6CCA3', // Rich Pastel Orange
    '#BCE4CD', // Rich Pastel Emerald
    '#C6DCF7', // Rich Pastel Blue
    '#F2C4C6', // Rich Pastel Red
    '#D3E6AE', // Rich Pastel Lime
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

    // 매칭되는 모든 Task 찾기 (Overlap 가능성 대비)
    const candidates = [];

    for (const task of tasks) {
        let startMinutes = adjustMinutesForPlannerDay(timeToMinutes(task.startTime));
        let endMinutes = adjustMinutesForPlannerDay(timeToMinutes(task.endTime));

        // Handle end time that wraps
        if (endMinutes <= startMinutes) {
            endMinutes += 24 * 60;
        }

        // Check if slot is within range [start, end)
        if (adjustedSlotMinutes >= startMinutes && adjustedSlotMinutes < endMinutes) {
            candidates.push({ task, startMinutes });
        }
    }

    if (candidates.length === 0) return null;
    if (candidates.length === 1) return candidates[0].task;

    // 여러 개일 경우, 시작 시간이 현재 슬롯과 정확히 일치하는 Task를 우선
    // (예: 10:30 슬롯에 대해 A(9:00~10:31)와 B(10:30~11:00)가 있다면 B를 선택)
    const exactMatch = candidates.find(c => c.startMinutes === adjustedSlotMinutes);
    return exactMatch ? exactMatch.task : candidates[0].task;
};
