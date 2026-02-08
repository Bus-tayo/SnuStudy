"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";

// Preset colors for study sessions
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

export function StudyInputModal({ isOpen, onClose, onConfirm }) {
    const [text, setText] = useState("");
    const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onConfirm(text, selectedColor);
        setText("");
        setSelectedColor(PRESET_COLORS[0].value);
        // Don't call onClose here - let the parent handle mode transition via onConfirm
    };

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-lg text-slate-800">공부 내용</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <input
                        autoFocus
                        type="text"
                        placeholder="예: 수학 문제집 20페이지"
                        className="w-full px-4 py-3 bg-indigo-50/50 border border-indigo-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 placeholder:text-slate-400"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                    />

                    {/* Color Picker */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-600">색상 선택</label>
                        <div className="flex flex-wrap gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setSelectedColor(color.value)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                >
                                    {selectedColor === color.value && (
                                        <Check size={16} className="text-white drop-shadow-md" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors font-medium"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={!text.trim()}
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
