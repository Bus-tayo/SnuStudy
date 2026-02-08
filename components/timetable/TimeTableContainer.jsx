"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TimeTableGrid } from "./TimeTableGrid";
import { TimeTableOverlay } from "./TimeTableOverlay";
import { StudyInputModal } from "./StudyInputModal";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchStudySessions, addStudySession, deleteStudySession, updateStudySession } from "@/lib/repositories/studySessionsRepo";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";
import { createIsoDateForPlannerTime, dateToGridTime, DEFAULT_STUDY_COLOR, findTaskForSlot } from "@/lib/utils/timeUtils";

export default function TimeTableContainer({ selectedDate }) {
    // State Machine: 'IDLE', 'OVERLAY_OPEN', 'INPUT_MODAL', 'SELECT_START', 'SELECT_END', 'EDIT_MODAL'
    const [mode, setMode] = useState("IDLE");

    // Data State
    const [tasks, setTasks] = useState([]); // Study sessions
    const [dailyTasks, setDailyTasks] = useState([]); // Planner tasks for selection
    const [tempTaskId, setTempTaskId] = useState(null);
    const [tempColor, setTempColor] = useState(DEFAULT_STUDY_COLOR);
    const [tempStart, setTempStart] = useState(null);
    const [editingSessionId, setEditingSessionId] = useState(null); // ID of session being edited
    const currentDate = selectedDate || new Date(); // Use prop or fallback to today

    const menteeId = useMemo(() => getMenteeIdFromStorage(), []);

    // Load Data
    useEffect(() => {
        if (!menteeId) return;

        const loadData = async () => {
            try {
                // Parallel fetch: Study Sessions & Daily Tasks
                const [sessionsData, tasksData] = await Promise.all([
                    fetchStudySessions({ menteeId, date: currentDate }),
                    fetchTasksByDate({ menteeId, date: currentDate })
                ]);

                // Transform sessions for Grid
                const formattedSessions = sessionsData.map(d => ({
                    ...d,
                    startTime: dateToGridTime(new Date(d.startTime)),
                    endTime: dateToGridTime(new Date(d.endTime)),
                }));
                setTasks(formattedSessions);

                // Set daily tasks for selection modal
                setDailyTasks(tasksData);

            } catch (e) {
                console.error("Failed to load data", e);
            }
        };

        loadData();
    }, [menteeId, currentDate]);

    // Handlers
    const handleMainGridClick = () => {
        // Main grid click always opens overlay
        setMode("OVERLAY_OPEN");
    };

    const handleOverlayGridClick = async (timeId) => {
        // OVERLAY_OPEN -> Check if clicking existing task or empty slot
        if (mode === "OVERLAY_OPEN") {
            const existingTask = findTaskForSlot(tasks, timeId);

            if (existingTask) {
                // Edit Mode
                setEditingSessionId(existingTask.id);
                setTempTaskId(existingTask.taskId);
                setTempColor(existingTask.color);
                setMode("EDIT_MODAL");
            } else {
                // Start Selection for New Task
                setTempStart(timeId);
                setMode("SELECT_END");
            }
            return;
        }

        // SELECT_START -> Store Start, Move to SELECT_END (Logic moved to above for simplification in overlay)
        // Actually, logic flow: 
        // 1. Click "+" -> INPUT_MODAL -> Select Task -> SELECT_START
        // 2. Click Grid (Empty) -> SELECT_START (if we want direct click-to-add without picking task first? No, current flow is Task First)

        // Wait, current flow in handleGridClick was:
        // IDLE -> OVERLAY (Main)
        // IDLE -> Edit/Overlay (Overlay)

        // Let's refine handleOverlayGridClick based on current mode:

        if (mode === "SELECT_START") {
            setTempStart(timeId);
            setMode("SELECT_END");
            return;
        }

        if (mode === "SELECT_END") {
            if (!tempStart) return;

            // Create ISO strings
            const startTimeIso = createIsoDateForPlannerTime(tempStart, currentDate);
            const endTimeIso = createIsoDateForPlannerTime(timeId, currentDate);

            try {
                const saved = await addStudySession({
                    menteeId,
                    taskId: tempTaskId,
                    startTime: startTimeIso,
                    endTime: endTimeIso,
                    color: tempColor
                });

                // Optimistic UI Update or Refetch
                const newTask = {
                    id: saved.id,
                    taskId: saved.taskId,
                    content: saved.content,
                    subject: saved.subject,
                    startTime: tempStart, // Grid ID format
                    endTime: timeId,      // Grid ID format
                    color: saved.color,
                };
                setTasks(prev => [...prev, newTask]);

            } catch (e) {
                alert("Failed to save session");
                console.error(e);
            }

            // Reset
            setTempStart(null);
            setTempTaskId(null);
            setTempColor(DEFAULT_STUDY_COLOR);
            // We want to stay in Overlay. 
            // If mode is IDLE, Overlay is closed.
            // If we are in Overlay, mode should be 'OVERLAY_OPEN'.
            setMode("OVERLAY_OPEN");
        }
    };

    const handleAddClick = () => {
        setMode("INPUT_MODAL");
    };

    const handleInputConfirm = (taskId, color) => {
        setTempTaskId(taskId);
        setTempColor(color);
        setMode("SELECT_START");
    };

    const handleEditConfirm = async (taskId, color) => {
        if (!editingSessionId) return;

        try {
            const updated = await updateStudySession({
                sessionId: editingSessionId,
                taskId,
                color
            });

            // Update UI
            setTasks(prev => prev.map(t =>
                t.id === editingSessionId
                    ? { ...t, taskId: updated.taskId, content: updated.content, subject: updated.subject, color: updated.color }
                    : t
            ));
        } catch (e) {
            alert("Failed to update session");
            console.error(e);
        }

        setMode("OVERLAY_OPEN"); // Return to overlay, not main screen
        setEditingSessionId(null);
        setTempTaskId(null);
    };

    const handleInputCancel = () => {
        // Return to overlay if cancelling edit or add
        setMode("OVERLAY_OPEN");
        setEditingSessionId(null);
    };

    const handleOverlayClose = () => {
        setMode("IDLE");
    };

    const handleDeleteTask = async (id) => {
        try {
            await deleteStudySession(id);
            setTasks(prev => prev.filter(t => t.id !== id));
        } catch (e) {
            alert("Failed to delete session");
            console.error(e);
        }
    };

    return (
        <div className="relative w-full h-full flex flex-col items-center bg-transparent">
            {/* Toast Message for Selection Mode */}
            {(mode === "SELECT_START" || mode === "SELECT_END") && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-10px] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
                    {mode === "SELECT_START" ? "시작 시간을 선택해주세요" : "종료 시간을 선택해주세요"}
                </div>
            )}

            {/* Grid View (Main) */}
            <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
                <TimeTableGrid
                    data={tasks}
                    onSlotClick={handleMainGridClick}
                    selectedStart={tempStart}
                />
            </div>

            {/* Overlay - Full Screen with Grid */}
            <TimeTableOverlay
                isOpen={mode !== "IDLE" && mode !== "INPUT_MODAL" && mode !== "EDIT_MODAL"}
                onClose={handleOverlayClose}
                tasks={tasks}
                onAddClick={handleAddClick}
                onDeleteTask={handleDeleteTask}
                onSlotClick={handleOverlayGridClick}
                selectedStart={tempStart}
                selectionMode={mode === "SELECT_START" || mode === "SELECT_END" ? mode : null}
            />

            {/* Input Modal (Add) */}
            <StudyInputModal
                isOpen={mode === "INPUT_MODAL"}
                onClose={handleInputCancel}
                onConfirm={handleInputConfirm}
                tasks={dailyTasks}
            />

            {/* Input Modal (Edit) */}
            <StudyInputModal
                isOpen={mode === "EDIT_MODAL"}
                onClose={handleInputCancel}
                onConfirm={handleEditConfirm}
                tasks={dailyTasks}
                initialTaskId={tempTaskId}
                initialColor={tempColor}
            />
        </div>
    );
}
