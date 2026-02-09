"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Plus, Trash2, ClipboardList, X } from "lucide-react";
import { TimeTableGrid } from "./TimeTableGrid";

export function TimeTableOverlay({
    isOpen,
    onClose,
    tasks = [],
    onAddClick,
    onDeleteTask,
    onSlotClick,  // For time selection mode
    selectedStart, // For highlighting selected start time
    selectionMode, // 'SELECT_START' | 'SELECT_END' | null
}) {
    const [portalRoot, setPortalRoot] = useState(null);
    const [showRecords, setShowRecords] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        // Find the portal target in MobileViewportShell
        const root = document.getElementById("viewport-overlay-root");
        setPortalRoot(root);
    }, []);

    // Handle open/close with animation
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
        }
    }, [isOpen]);

    // Disable body scroll when overlay is open
    useEffect(() => {
        if (isVisible) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isVisible]);

    // Close records popup when overlay closes
    useEffect(() => {
        if (!isOpen) {
            setShowRecords(false);
        }
    }, [isOpen]);

    // Handle close with animation
    const handleClose = useCallback(() => {
        setIsClosing(true);
        // Wait for animation to complete before actually closing
        setTimeout(() => {
            setIsVisible(false);
            setIsClosing(false);
            onClose();
        }, 300); // Match animation duration
    }, [onClose]);

    if (!isVisible) return null;

    const overlayContent = (
        <div className={`fixed inset-0 z-[70] flex justify-center ${isClosing ? 'animate-overlay-slide-out' : 'animate-overlay-slide-in'}`}>
            <div className="w-full max-w-[430px] flex flex-col bg-slate-50 overflow-hidden relative">
                {/* Header - Same color as weekly calendar */}
                <div
                    className="flex items-center px-2 py-3 shadow-sm"
                    style={{ backgroundColor: 'var(--calendar-bg, #6374ae)', color: 'var(--calendar-text, white)' }}
                >
                    {/* Back Button - Left */}
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <ChevronLeft size={28} />
                    </button>

                    {/* Title - Center */}
                    <h2 className="flex-1 text-lg font-bold text-center pr-10">공부 시간</h2>
                </div>

                {/* Selection Mode Toast */}
                {selectionMode && (
                    <div className="bg-indigo-600 text-white px-4 py-2 text-center text-sm font-medium">
                        {selectionMode === "SELECT_START"
                            ? "📍 시작 시간을 선택해주세요"
                            : "🏁 종료 시간을 선택해주세요"}
                    </div>
                )}

                {/* Add Button Row - Below header, above grid, right-aligned */}
                {!selectionMode && (
                    <div className="flex justify-end px-4 py-2 bg-white border-b border-slate-100">
                        <button
                            onClick={onAddClick}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <Plus size={16} />
                            추가
                        </button>
                    </div>
                )}

                {/* TimeTable Grid - Scrollable area */}
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 pb-20 animate-content-fade-in">
                        <TimeTableGrid
                            data={tasks}
                            onSlotClick={onSlotClick}
                            selectedStart={selectedStart}
                        />
                    </div>
                </div>

                {/* Floating Record Button */}
                {!selectionMode && (
                    <button
                        onClick={() => setShowRecords(true)}
                        className="absolute bottom-24 right-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    >
                        <ClipboardList size={24} />
                        {tasks.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                {tasks.length}
                            </span>
                        )}
                    </button>
                )}

                {/* Records Bottom Sheet */}
                {showRecords && (
                    <div
                        className="absolute inset-0 z-[60] flex flex-col justify-end"
                        onClick={() => setShowRecords(false)}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/40" />

                        {/* Sheet */}
                        <div
                            className="relative bg-white rounded-t-2xl shadow-2xl max-h-[70%] flex flex-col animate-slide-up"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Handle */}
                            <div className="flex justify-center py-2">
                                <div className="w-10 h-1 bg-slate-300 rounded-full" />
                            </div>

                            {/* Header */}
                            <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                                <h3 className="text-lg font-bold text-slate-800">
                                    오늘의 기록 ({tasks.length})
                                </h3>
                                <button
                                    onClick={() => setShowRecords(false)}
                                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Records List */}
                            <div className="flex-1 overflow-y-auto p-4 pb-24">
                                {tasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {tasks.map((task) => (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-100"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: task.color || '#6366F1' }}
                                                    />
                                                    <div>
                                                        <span className="text-sm font-semibold text-slate-700 block">
                                                            {task.content}
                                                        </span>
                                                        <span className="text-xs text-slate-400">
                                                            {task.startTime} ~ {task.endTime}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => onDeleteTask?.(task.id)}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400">
                                        <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
                                        <p className="text-sm">아직 기록된 공부가 없습니다.</p>
                                        <p className="text-xs mt-1">상단의 '추가' 버튼을 눌러 첫 기록을 추가해보세요.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    // Use portal to render at MobileViewportShell level
    if (portalRoot) {
        return createPortal(overlayContent, portalRoot);
    }

    // Fallback: render in place if portal not available yet
    return overlayContent;
}
