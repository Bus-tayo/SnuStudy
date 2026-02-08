"use client";

import React, { useState } from "react";
import { X, Check, BookOpen, AlertCircle } from "lucide-react";

// Subject colors mapping
const SUBJECT_COLORS = {
    KOREAN: '#EF4444',    // 빨강
    MATH: '#3B82F6',      // 파랑
    ENGLISH: '#22C55E',   // 초록
    SCIENCE: '#A855F7',   // 보라
    SOCIAL: '#F97316',    // 주황
    ETC: '#6366F1',       // 인디고
};

// Preset colors for manual selection
const PRESET_COLORS = [
    { name: '인디고', value: '#6366F1' },
    { name: '파랑', value: '#3B82F6' },
    { name: '청록', value: '#14B8A6' },
    { name: '초록', value: '#22C55E' },
    { name: '노랑', value: '#EAB308' },
    { name: '주황', value: '#F97316' },
    { name: '빨강', value: '#EF4444' },
    { name: '분홍', value: '#EC4899' },
    { name: '보라', value: '#A855F7' },
    { name: '슬레이트', value: '#64748B' },
];

export function StudyInputModal({ isOpen, onClose, onConfirm, tasks = [], initialTaskId = null, initialColor = null }) {
    const [selectedTaskId, setSelectedTaskId] = useState(null);
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

    // Initialize state when modal opens or props change
    React.useEffect(() => {
        if (isOpen) {
            setSelectedTaskId(initialTaskId);
            setSelectedColor(initialColor || PRESET_COLORS[0].value);
        }
    }, [isOpen, initialTaskId, initialColor]);

    if (!isOpen) return null;

    const selectedTask = tasks.find(t => t.id === selectedTaskId);

    // Auto-select color based on task subject
    const handleTaskSelect = (taskId) => {
        setSelectedTaskId(taskId);
        const task = tasks.find(t => t.id === taskId);
        // Only auto-select color if not editing (or if user changes task)
        // For simplicity, always auto-select color on task change to keep consistency
        if (task?.subject && SUBJECT_COLORS[task.subject]) {
            setSelectedColor(SUBJECT_COLORS[task.subject]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedTaskId) return;
        onConfirm(selectedTaskId, selectedColor);
        setSelectedTaskId(null);
        setSelectedColor(PRESET_COLORS[0].value);
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800">공부할 과제 선택</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    {/* Task Selection List */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {tasks.length > 0 ? (
                            tasks.map((task) => {
                                const isSelected = selectedTaskId === task.id;
                                const taskColor = SUBJECT_COLORS[task.subject] || PRESET_COLORS[0].value;

                                return (
                                    <button
                                        key={task.id}
                                        type="button"
                                        onClick={() => handleTaskSelect(task.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${isSelected
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <span
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: taskColor }}
                                        />
                                        <span className={`flex-1 text-sm font-medium ${isSelected ? 'text-indigo-700' : 'text-slate-700'
                                            }`}>
                                            {task.title}
                                        </span>
                                        {isSelected && (
                                            <Check size={18} className="text-indigo-600" />
                                        )}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 text-slate-400">
                                <AlertCircle size={48} className="mx-auto mb-3 opacity-50" />
                                <p className="text-sm">오늘 할당된 과제가 없습니다.</p>
                                <p className="text-xs mt-1">먼저 플래너에서 과제를 추가해주세요.</p>
                            </div>
                        )}
                    </div>

                    {/* Color Picker (Optional override) */}
                    {selectedTaskId && (
                        <div className="px-4 pb-2 space-y-2 border-t border-slate-100 pt-3">
                            <label className="text-xs font-medium text-slate-500">색상 변경 (선택)</label>
                            <div className="flex flex-wrap gap-1.5">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setSelectedColor(color.value)}
                                        className="w-6 h-6 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                        style={{ backgroundColor: color.value }}
                                        title={color.name}
                                    >
                                        {selectedColor === color.value && (
                                            <Check size={12} className="text-white drop-shadow-md" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 p-4 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedTaskId}
                            className="flex-1 py-3 text-white rounded-xl font-bold shadow-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                            style={{ backgroundColor: selectedColor }}
                        >
                            확인
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
