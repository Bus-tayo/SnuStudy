"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";

import { TimeTableGrid } from "./TimeTableGrid";
import { TimeTableOverlay } from "./TimeTableOverlay";
import { StudyInputModal } from "./StudyInputModal";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import {
  fetchStudySessions,
  addStudySession,
  deleteStudySession,
  updateStudySession,
} from "@/lib/repositories/studySessionsRepo";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";
import {
  createIsoDateForPlannerTime,
  dateToGridTime,
  findTaskForSlot,
  timeToMinutes,
  adjustMinutesForPlannerDay,
} from "@/lib/utils/timeUtils";

const DEFAULT_COLOR_TOKEN = "ETC";

function minutesToTimeId(totalMinutes) {
  const m = ((totalMinutes % 1440) + 1440) % 1440;
  const hh = String(Math.floor(m / 60)).padStart(2, "0");
  const mm = String(m % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function TimeTableContainer({ selectedDate }) {
  const [mode, setMode] = useState("IDLE");
  const isProcessing = useRef(false);

  const [tasks, setTasks] = useState([]);
  const [dailyTasks, setDailyTasks] = useState([]);
  const [tempTaskId, setTempTaskId] = useState(null);
  const [tempColor, setTempColor] = useState(DEFAULT_COLOR_TOKEN); // token
  const [tempStart, setTempStart] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const currentDate = selectedDate || new Date();

  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);

  useEffect(() => {
    if (!menteeId) return;

    const loadData = async () => {
      try {
        const [sessionsData, tasksData] = await Promise.all([
          fetchStudySessions({ menteeId, date: currentDate }),
          fetchTasksByDate({ menteeId, date: currentDate }),
        ]);

        const formattedSessions = sessionsData.map((d) => ({
          ...d,
          startTime: dateToGridTime(new Date(d.startTime)),
          endTime: dateToGridTime(new Date(d.endTime)),
        }));
        setTasks(formattedSessions);

        setDailyTasks(tasksData);
      } catch (e) {
        console.error("Failed to load data", e);
      }
    };

    loadData();
  }, [menteeId, currentDate]);

  const handleMainGridClick = () => {
    setMode("OVERLAY_OPEN");
  };

  const handleOverlayGridClick = async (timeId) => {
    if (mode === "OVERLAY_OPEN") {
      const existingTask = findTaskForSlot(tasks, timeId);
      if (existingTask) {
        setEditingSessionId(existingTask.id);
        setTempTaskId(existingTask.taskId);
        setTempColor(existingTask.color || DEFAULT_COLOR_TOKEN);
        setMode("EDIT_MODAL");
      }
      return;
    }

    if (mode === "SELECT_START") {
      setTempStart(timeId);
      setMode("SELECT_END");
      return;
    }

    if (mode === "SELECT_END") {
      if (isProcessing.current) return;
      isProcessing.current = true;

      try {
        if (!tempStart) return;

        const startMinutes = adjustMinutesForPlannerDay(timeToMinutes(tempStart));
        const endMinutesExclusive = adjustMinutesForPlannerDay(timeToMinutes(timeId)) + 10;

        if (endMinutesExclusive <= startMinutes) {
          alert("종료 시간은 시작 시간보다 이후여야 합니다.");
          return;
        }

        const hasOverlap = tasks.some((task) => {
          const taskStart = adjustMinutesForPlannerDay(timeToMinutes(task.startTime));
          const taskEnd = adjustMinutesForPlannerDay(timeToMinutes(task.endTime));
          return startMinutes < taskEnd && endMinutesExclusive > taskStart;
        });

        if (hasOverlap) {
          alert("이미 존재하는 공부 시간과 겹칩니다.");
          return;
        }

        const startTimeIso = createIsoDateForPlannerTime(tempStart, currentDate);
        const endTimeIdForDb = minutesToTimeId(timeToMinutes(timeId) + 10);
        const endTimeIso = createIsoDateForPlannerTime(endTimeIdForDb, currentDate);

        try {
          const saved = await addStudySession({
            menteeId,
            taskId: tempTaskId,
            startTime: startTimeIso,
            endTime: endTimeIso,
            color: tempColor,
          });

          const newTask = {
            id: saved.id,
            taskId: saved.taskId,
            content: saved.content,
            subject: saved.subject,
            startTime: tempStart,
            endTime: endTimeIdForDb,
            color: saved.color,
          };
          setTasks((prev) => [...prev, newTask]);
        } catch (e) {
          alert("Failed to save session");
          console.error(e);
        }

        setTempStart(null);
        setTempTaskId(null);
        setTempColor(DEFAULT_COLOR_TOKEN);
        setMode("OVERLAY_OPEN");
      } finally {
        setTimeout(() => {
          isProcessing.current = false;
        }, 300);
      }
    }
  };

  const handleAddClick = () => {
    setMode("INPUT_MODAL");
  };

  const handleInputConfirm = (taskId, colorToken) => {
    setTempTaskId(taskId);
    setTempColor(colorToken || DEFAULT_COLOR_TOKEN);
    setMode("SELECT_START");
  };

  const handleEditConfirm = async (taskId, colorToken) => {
    if (!editingSessionId) return;

    try {
      const updated = await updateStudySession({
        sessionId: editingSessionId,
        taskId,
        color: colorToken || DEFAULT_COLOR_TOKEN,
      });

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingSessionId
            ? {
                ...t,
                taskId: updated.taskId,
                content: updated.content,
                subject: updated.subject,
                color: updated.color,
              }
            : t
        )
      );
    } catch (e) {
      alert("Failed to update session");
      console.error(e);
    }

    setMode("OVERLAY_OPEN");
    setEditingSessionId(null);
    setTempTaskId(null);
  };

  const handleEditDelete = async () => {
    if (!editingSessionId) return;

    try {
      await deleteStudySession(editingSessionId);
      setTasks((prev) => prev.filter((t) => t.id !== editingSessionId));
    } catch (e) {
      alert("Failed to delete session");
      console.error(e);
      return;
    }

    setMode("OVERLAY_OPEN");
    setEditingSessionId(null);
    setTempTaskId(null);
  };

  const handleInputCancel = () => {
    setMode("OVERLAY_OPEN");
    setEditingSessionId(null);
  };

  const handleOverlayClose = () => {
    setMode("IDLE");
  };

  const handleDeleteTask = async (id) => {
    try {
      await deleteStudySession(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
    } catch (e) {
      alert("Failed to delete session");
      console.error(e);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-transparent">
      {(mode === "SELECT_START" || mode === "SELECT_END") && (
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mt-[-10px] bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-50 text-sm whitespace-nowrap animate-in fade-in slide-in-from-bottom-2">
          {mode === "SELECT_START" ? "시작 시간을 선택해주세요" : "종료 시간을 선택해주세요"}
        </div>
      )}

      <div className="w-full h-full overflow-y-auto pr-2 custom-scrollbar">
        <TimeTableGrid data={tasks} onSlotClick={handleMainGridClick} selectedStart={tempStart} />
      </div>

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

      <StudyInputModal
        isOpen={mode === "INPUT_MODAL"}
        onClose={handleInputCancel}
        onConfirm={handleInputConfirm}
        tasks={dailyTasks}
      />

      <StudyInputModal
        isOpen={mode === "EDIT_MODAL"}
        onClose={handleInputCancel}
        onConfirm={handleEditConfirm}
        onDelete={handleEditDelete}   // ✅ 여기만 추가
        tasks={dailyTasks}
        initialTaskId={tempTaskId}
        initialColor={tempColor}
      />
    </div>
  );
}
