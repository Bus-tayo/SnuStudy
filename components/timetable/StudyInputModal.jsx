"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle, Trash2 } from "lucide-react";

// DB subject enum: KOR, ENG, MATH, ETC
// DB color는 varchar(7) 이라 token(<=7)만 저장
const SUBJECT_TO_TOKEN = {
  KOR: "KOR",
  MATH: "MATH",
  ENG: "ENG",
  ETC: "ETC",
};

// token -> theme.css 기반 실제 색상
const TOKEN_TO_CSS = {
  KOR: "hsl(var(--subject-kor))",
  MATH: "hsl(var(--subject-math))",
  ENG: "hsl(var(--subject-eng))",
  ETC: "hsl(var(--subject-etc))",
  ACCENT: "hsl(var(--accent))",
  PRIMARY: "hsl(var(--primary))",
  DONE: "hsl(var(--status-done))",
  SUB: "hsl(var(--secondary-foreground))",
};

const PRESET_COLORS = [
  { name: "국어", value: "KOR" },
  { name: "수학", value: "MATH" },
  { name: "영어", value: "ENG" },
  { name: "기타", value: "ETC" },
  { name: "포인트", value: "ACCENT" },
  { name: "프라이머리", value: "PRIMARY" },
  { name: "완료", value: "DONE" },
  { name: "보조", value: "SUB" },
];

function resolveCssColor(token, subject) {
  if (token && TOKEN_TO_CSS[token]) return TOKEN_TO_CSS[token];
  if (subject && TOKEN_TO_CSS[subject]) return TOKEN_TO_CSS[subject];
  return "hsl(var(--subject-etc))";
}

export function StudyInputModal({
  isOpen,
  onClose,
  onConfirm,
  onDelete, // ✅ 추가: 있으면 삭제 버튼 표시
  tasks = [],
  initialTaskId = null,
  initialColor = null, // token
}) {
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0].value); // token

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTaskId(initialTaskId);
      setSelectedColor(initialColor || PRESET_COLORS[0].value);
    }
  }, [isOpen, initialTaskId, initialColor]);

  if (!isOpen) return null;

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);
    const token = SUBJECT_TO_TOKEN[task?.subject] || "ACCENT";
    setSelectedColor(token);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    onConfirm(selectedTaskId, selectedColor); // ✅ token 저장
    setSelectedTaskId(null);
    setSelectedColor(PRESET_COLORS[0].value);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const ok = window.confirm("이 공부 세션을 삭제할까요?");
    if (!ok) return;
    await onDelete();
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
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const token = SUBJECT_TO_TOKEN[task.subject] || "ACCENT";
                const taskColor = resolveCssColor(token, task.subject);

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
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: taskColor }} />
                    <span className={`flex-1 text-sm font-medium ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
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
                    style={{ backgroundColor: resolveCssColor(color.value) }}
                    title={color.name}
                  >
                    {selectedColor === color.value && <Check size={12} className="text-white drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 p-4 border-t border-slate-100">
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="py-3 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                삭제
              </button>
            )}

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
              style={{ backgroundColor: resolveCssColor(selectedColor) }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
