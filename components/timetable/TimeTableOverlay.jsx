"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Plus, Trash2, ClipboardList, X } from "lucide-react";
import { TimeTableGrid } from "./TimeTableGrid";

const HEX7_RE = /^#([0-9A-Fa-f]{6})$/;

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

function resolveCssColor(token, subject) {
  if (typeof token === "string" && HEX7_RE.test(token)) return token;
  if (typeof subject === "string" && HEX7_RE.test(subject)) return subject;

  if (token && TOKEN_TO_CSS[token]) return TOKEN_TO_CSS[token];
  if (subject && TOKEN_TO_CSS[subject]) return TOKEN_TO_CSS[subject];

  return "hsl(var(--subject-etc))";
}

export function TimeTableOverlay({
  isOpen,
  onClose,
  tasks = [],
  onAddClick,
  onDeleteTask,
  onSlotClick,
  selectedStart,
  selectionMode,
}) {
  const [portalRoot, setPortalRoot] = useState(null);
  const [showRecords, setShowRecords] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const root = document.getElementById("viewport-overlay-root");
    setPortalRoot(root);
  }, []);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      onClose?.();
    }, 300);
  }, [onClose]);

  // ✅ isOpen true -> open
  // ✅ isOpen false -> start closing sequence (300ms animation) via handleClose()
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setIsClosing(false);
      return;
    }
    if (!isOpen && isVisible) {
      handleClose();
    }
  }, [isOpen, isVisible, handleClose]);

  useEffect(() => {
    if (isVisible) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isVisible]);

  // 유지: 오픈 닫힐 때 기록 시트 닫기
  useEffect(() => {
    if (!isOpen) setShowRecords(false);
  }, [isOpen]);

  if (!isVisible) return null;

  // ✅ 플로팅 버튼(좌하단 기록 버튼 + 우하단 벨 버튼)에 가리지 않도록.
  // spacer div를 추가하면 전체 높이가 튀는 케이스가 생겨서 paddingBottom 방식으로만 처리.
  const FLOATING_BUTTON_GUARD_PX = 148;

  const overlayContent = (
    <div
      className={`fixed inset-0 z-[70] flex justify-center ${isClosing ? "animate-overlay-slide-out" : "animate-overlay-slide-in"
        }`}
    >
      <div className="w-full max-w-[430px] flex flex-col bg-slate-50 overflow-hidden relative">
        {/* Header */}
        <div
          className="flex items-center px-2 py-3 shadow-sm"
          style={{
            backgroundColor: "var(--calendar-bg, #6374ae)",
            color: "var(--calendar-text, white)",
          }}
        >
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            type="button"
          >
            <ChevronLeft size={28} />
          </button>

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

        {/* Add Button Row */}
        {!selectionMode && (
          <div className="flex justify-end px-4 py-2 bg-white border-b border-slate-100">
            <button
              onClick={onAddClick}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors"
              type="button"
            >
              <Plus size={16} />
              추가
            </button>
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 min-h-0 overflow-hidden overflow-x-hidden">
          <div
            className="h-full p-4 animate-content-fade-in"
            style={{ paddingBottom: `${FLOATING_BUTTON_GUARD_PX}px` }}
          >
            <div className="h-full min-h-0">
              <TimeTableGrid
                data={tasks}
                onSlotClick={onSlotClick}
                selectedStart={selectedStart}
              />
            </div>
          </div>
        </div>

        {/* Floating Record Button */}
        {!selectionMode && (
          <button
            onClick={() => setShowRecords(true)}
            className="absolute left-4 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            style={{ bottom: 96 }}
            type="button"
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
            <div className="absolute inset-0 bg-black/40" />

            <div
              className="relative bg-white rounded-t-2xl shadow-2xl max-h-[70%] flex flex-col animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center py-2">
                <div className="w-10 h-1 bg-slate-300 rounded-full" />
              </div>

              <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">오늘의 기록 ({tasks.length})</h3>
                <button
                  onClick={() => setShowRecords(false)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500"
                  type="button"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-hide">
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
                            style={{ backgroundColor: resolveCssColor(task.color, task.subject) }}
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

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList size={48} className="mx-auto mb-3 opacity-50" />
                    <p className="text-sm">아직 기록된 공부가 없습니다.</p>
                    <p className="text-xs mt-1">
                      상단의 '추가' 버튼을 눌러 첫 기록을 추가해보세요.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return portalRoot ? createPortal(overlayContent, portalRoot) : overlayContent;
}
