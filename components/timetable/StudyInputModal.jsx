"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";

const HEX7_RE = /^#([0-9A-Fa-f]{6})$/;

const TOKEN_TO_CSS = {
  KOR: "hsl(var(--subject-kor))",
  MATH: "hsl(var(--subject-math))",
  ENG: "hsl(var(--subject-eng))",
  ETC: "hsl(var(--subject-etc))",
};

const SUBJECT_COLORS = {
  KOR: "#EF4444",
  MATH: "#3B82F6",
  ENG: "#22C55E",
  ETC: "#6366F1",
};

const PRESET_COLORS = [
  { name: "인디고", value: "#6366F1" },
  { name: "파랑", value: "#3B82F6" },
  { name: "청록", value: "#14B8A6" },
  { name: "초록", value: "#22C55E" },
  { name: "노랑", value: "#EAB308" },
  { name: "주황", value: "#F97316" },
  { name: "빨강", value: "#EF4444" },
  { name: "분홍", value: "#EC4899" },
  { name: "보라", value: "#A855F7" },
  { name: "슬레이트", value: "#64748B" },
];

function resolveCssColor(token, subject) {
  if (typeof token === "string" && HEX7_RE.test(token)) return token;
  if (typeof subject === "string" && HEX7_RE.test(subject)) return subject;

  if (token && TOKEN_TO_CSS[token]) return TOKEN_TO_CSS[token];
  if (subject && TOKEN_TO_CSS[subject]) return TOKEN_TO_CSS[subject];

  if (typeof token === "string" && SUBJECT_COLORS[token]) return SUBJECT_COLORS[token];
  if (typeof subject === "string" && SUBJECT_COLORS[subject]) return SUBJECT_COLORS[subject];

  return SUBJECT_COLORS.ETC;
}

export function StudyInputModal({
  isOpen,
  onClose,
  onConfirm,
  tasks = [],
  initialTaskId = null,
  initialColor = null,
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTaskId(initialTaskId);

      if (initialColor) {
        setSelectedColor(resolveCssColor(initialColor, null));
      } else {
        setSelectedColor(PRESET_COLORS[0].value);
      }
    }
  }, [isOpen, initialTaskId, initialColor]);

  if (!isOpen) return null;

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);

    // 과목 자동색: legacy hex도 유지
    const autoColor = resolveCssColor(task?.color, task?.subject);
    if (autoColor) setSelectedColor(autoColor);
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-800">공부할 과제 선택</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" type="button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const taskColor = resolveCssColor(task?.color, task?.subject);

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleTaskSelect(task.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: taskColor }}
                    />
                    <span
                      className={`flex-1 text-sm font-medium ${
                        isSelected ? "text-indigo-700" : "text-slate-700"
                      }`}
                    >
                      {task.title}
                    </span>
                    {isSelected && <Check size={18} className="text-indigo-600" />}
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
              style={{ backgroundColor: resolveCssColor(selectedColor, null) }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
