"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TimeTableGrid } from "./TimeTableGrid";
import { TimeTableOverlay } from "./TimeTableOverlay";
import { StudyInputModal } from "./StudyInputModal";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchStudySessions, addStudySession, deleteStudySession } from "@/lib/repositories/studySessionsRepo";
import { createIsoDateForPlannerTime, dateToGridTime, DEFAULT_STUDY_COLOR } from "@/lib/utils/timeUtils";

export default function TimeTableContainer({ selectedDate }) {
    // State Machine: 'IDLE', 'OVERLAY_OPEN', 'INPUT_MODAL', 'SELECT_START', 'SELECT_END'
    const [mode, setMode] = useState("IDLE");

    // Data State
    const [tasks, setTasks] = useState([]); // Array of study records
    const [tempContent, setTempContent] = useState("");
    const [tempColor, setTempColor] = useState(DEFAULT_STUDY_COLOR);
    const [tempStart, setTempStart] = useState(null);
    const currentDate = selectedDate || new Date(); // Use prop or fallback to today

    const menteeId = useMemo(() => getMenteeIdFromStorage(), []);

    // Load Data
    useEffect(() => {
        if (!menteeId) return;

        const loadData = async () => {
            try {
                const data = await fetchStudySessions({ menteeId, date: currentDate });

                // Transform for Grid - use utility for formatting
                const formatted = data.map(d => ({
                    ...d,
                    startTime: dateToGridTime(new Date(d.startTime)),
                    endTime: dateToGridTime(new Date(d.endTime)),
                }));
                setTasks(formatted);
            } catch (e) {
                console.error("Failed to load study sessions", e);
            }
        };

        loadData();
    }, [menteeId, currentDate]);

    // Handlers
    const handleGridClick = async (timeId) => {
        // IDLE -> Open Overlay
        if (mode === "IDLE") {
            setMode("OVERLAY_OPEN");
            return;
        }

        // SELECT_START -> Store Start, Move to SELECT_END
        if (mode === "SELECT_START") {
            setTempStart(timeId);
            setMode("SELECT_END");
            return;
        }

        // SELECT_END -> Store End, Add Task, Reset to IDLE
        if (mode === "SELECT_END") {
            if (!tempStart) return;

            // Create ISO strings using centralized utility
            const startTimeIso = createIsoDateForPlannerTime(tempStart, currentDate);
            const endTimeIso = createIsoDateForPlannerTime(timeId, currentDate);

            try {
                const saved = await addStudySession({
                    menteeId,
                    content: tempContent,
                    startTime: startTimeIso,
                    endTime: endTimeIso,
                    color: tempColor
                });

                // Optimistic UI Update or Refetch
                // For simplicity, refetching ensures ID and server state sync
                // But let's add optimistically for speed, then correct
                const newTask = {
                    id: saved?.id || Date.now().toString(),
                    content: tempContent,
                    startTime: tempStart, // Grid ID format
                    endTime: timeId,      // Grid ID format
                    color: tempColor,
                };
                setTasks(prev => [...prev, newTask]);

            } catch (e) {
                alert("Failed to save session");
                console.error(e);
            }

            // Reset
            setTempStart(null);
            setTempContent("");
            setTempColor(DEFAULT_STUDY_COLOR);
            setMode("IDLE");
        }
    };

    const handleAddClick = () => {
        setMode("INPUT_MODAL");
    };

    const handleInputConfirm = (content, color) => {
        setTempContent(content);
        setTempColor(color);
        setMode("SELECT_START");
    };

    const handleInputCancel = () => {
        setMode("OVERLAY_OPEN"); // Go back to overlay
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

            {/* Grid View */}
            <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
                <TimeTableGrid
                    data={tasks}
                    onSlotClick={handleGridClick}
                    selectedStart={tempStart}
                />
            </div>

            {/* Overlay - Full Screen with Grid */}
            <TimeTableOverlay
                isOpen={mode !== "IDLE" && mode !== "INPUT_MODAL"}
                onClose={handleOverlayClose}
                tasks={tasks}
                onAddClick={handleAddClick}
                onDeleteTask={handleDeleteTask}
                onSlotClick={handleGridClick}
                selectedStart={tempStart}
                selectionMode={mode === "SELECT_START" || mode === "SELECT_END" ? mode : null}
            />

            {/* Input Modal */}
            <StudyInputModal
                isOpen={mode === "INPUT_MODAL"}
                onClose={handleInputCancel}
                onConfirm={handleInputConfirm}
            />
        </div>
    );
}
