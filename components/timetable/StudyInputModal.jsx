"use client";

import React, { useState } from "react";
import { X, Check, AlertCircle } from "lucide-react";

const HEX7_RE = /^#([0-9A-Fa-f]{6})$/;

const SUBJECT_TOKEN_TO_CSS_VAR = {
  KOR: "--subject-kor",
  MATH: "--subject-math",
  ENG: "--subject-eng",
  ETC: "--subject-etc",
};

function clamp01(x) {
  return Math.min(1, Math.max(0, x));
}

function hslToRgb(h, s, l) {
  const hh = ((Number(h) % 360) + 360) % 360;
  const ss = clamp01(Number(s) / 100);
  const ll = clamp01(Number(l) / 100);

  const c = (1 - Math.abs(2 * ll - 1)) * ss;
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
  const m = ll - c / 2;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (hh < 60) {
    r1 = c;
    g1 = x;
  } else if (hh < 120) {
    r1 = x;
    g1 = c;
  } else if (hh < 180) {
    g1 = c;
    b1 = x;
  } else if (hh < 240) {
    g1 = x;
    b1 = c;
  } else if (hh < 300) {
    r1 = x;
    b1 = c;
  } else {
    r1 = c;
    b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);
  return { r, g, b };
}

function rgbToHex7(r, g, b) {
  const to2 = (n) => String(Math.max(0, Math.min(255, n)).toString(16)).padStart(2, "0");
  return `#${to2(r)}${to2(g)}${to2(b)}`.toUpperCase();
}

function parseHslTriplet(str) {
  if (!str) return null;
  const s = String(str).trim();
  const cleaned = s
    .replace(/^hsl\(/i, "")
    .replace(/\)$/g, "")
    .replace(/\s*\/\s*/g, " ")
    .replace(/,/g, " ")
    .trim();

  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return null;

  const h = Number(parts[0]);
  const sPct = Number(String(parts[1]).replace("%", ""));
  const lPct = Number(String(parts[2]).replace("%", ""));
  if (!Number.isFinite(h) || !Number.isFinite(sPct) || !Number.isFinite(lPct)) return null;
  return { h, s: sPct, l: lPct };
}

function cssVarToHex7(varName) {
  if (typeof window === "undefined") return null;
  if (!varName) return null;
  const v = String(varName).trim();
  const key = v.startsWith("--") ? v : `--${v}`;
  const raw = window.getComputedStyle(document.documentElement).getPropertyValue(key);
  const triplet = parseHslTriplet(raw);
  if (!triplet) return null;
  const { r, g, b } = hslToRgb(triplet.h, triplet.s, triplet.l);
  return rgbToHex7(r, g, b);
}

function normalizeToHex7(value) {
  if (!value) return null;
  if (typeof value === "string" && HEX7_RE.test(value)) return value.toUpperCase();

  const v = String(value).trim();

  // subject/token (KOR/ENG/MATH/ETC) -> HEX
  if (SUBJECT_TOKEN_TO_CSS_VAR[v]) {
    return cssVarToHex7(SUBJECT_TOKEN_TO_CSS_VAR[v]);
  }

  // "hsl(var(--subject-kor))" / "var(--subject-kor)" / "--subject-kor" / "subject-kor" -> HEX
  const varMatch = v.match(/var\(\s*(--[A-Za-z0-9_-]+)\s*\)/);
  if (varMatch?.[1]) {
    return cssVarToHex7(varMatch[1]);
  }

  if (v.startsWith("--")) {
    return cssVarToHex7(v);
  }

  // raw triplet like "215 25% 47%"
  const triplet = parseHslTriplet(v);
  if (triplet) {
    const { r, g, b } = hslToRgb(triplet.h, triplet.s, triplet.l);
    return rgbToHex7(r, g, b);
  }

  return null;
}

function getPresetColors() {
  // 반드시 theme.css(var(--...)) 기반으로 HEX를 만든다. (HSL/hsl() 절대 반환 안 함)
  const list = [
    { name: "국어", var: "--subject-kor" },
    { name: "수학", var: "--subject-math" },
    { name: "영어", var: "--subject-eng" },
    { name: "기타", var: "--subject-etc" },
    { name: "Primary", var: "--primary" },
    { name: "Accent", var: "--accent" },
  ];
  return list
    .map((x) => ({ name: x.name, value: cssVarToHex7(x.var) }))
    .filter((x) => typeof x.value === "string" && HEX7_RE.test(x.value));
}

function resolveColorHex(token, subject) {
  const direct = normalizeToHex7(token) || normalizeToHex7(subject);
  if (direct) return direct;
  return cssVarToHex7("--subject-etc") || "#000000";
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
  const [presetColors, setPresetColors] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);

  React.useEffect(() => {
    if (!isOpen) return;
    const presets = getPresetColors();
    setPresetColors(presets);
    if (!selectedColor && presets[0]?.value) setSelectedColor(presets[0].value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedTaskId(initialTaskId);

      if (initialColor) {
        setSelectedColor(resolveColorHex(initialColor, null));
        return;
      }

      const presets = getPresetColors();
      if (presets[0]?.value) setSelectedColor(presets[0].value);
    }
  }, [isOpen, initialTaskId, initialColor]);

  if (!isOpen) return null;

  const handleTaskSelect = (taskId) => {
    setSelectedTaskId(taskId);
    const task = tasks.find((t) => t.id === taskId);

    // 과목 자동색: legacy hex도 유지
    const autoColor = resolveColorHex(task?.color, task?.subject);
    if (autoColor) setSelectedColor(autoColor);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedTaskId) return;
    const safeHex = resolveColorHex(selectedColor, null);
    onConfirm(selectedTaskId, safeHex);
    setSelectedTaskId(null);
    setSelectedColor(presetColors[0]?.value || null);
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
                const taskColor = resolveColorHex(task?.color, task?.subject);

                return (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => handleTaskSelect(task.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]"
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: taskColor }}
                    />
                    <span
                      className={`flex-1 text-sm font-medium ${
                        isSelected ? "text-[hsl(var(--primary))]" : "text-slate-700"
                      }`}
                    >
                      {task.title}
                    </span>
                    {isSelected && <Check size={18} className="text-[hsl(var(--primary))]" />}
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
                {presetColors.map((color) => (
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
              style={{ backgroundColor: resolveColorHex(selectedColor, null) }}
            >
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
