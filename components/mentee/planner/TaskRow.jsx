'use client';

import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

export default function TaskRow({
  task,
  studiedSeconds,
  isDeleteMode,
  isSelected,
  onSelect,
  onOpenDetail,
  subjectBorderColor,
  onToggleDone,
  isTogglingDone,
}) {
  const isDone = task.status === 'DONE';

  const handleClick = () => {
    if (isDeleteMode) onSelect?.();
    else onOpenDetail?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`w-full min-w-0 flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer overflow-x-hidden ${
        isDeleteMode && isSelected
          ? `bg-red-50 ${subjectBorderColor} shadow-md`
          : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
      } ${isDeleteMode && !isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}
    >
      {/* ✅ 체크박스(완료 토글): delete 모드가 아닐 때 */}
      {!isDeleteMode ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDone?.();
          }}
          disabled={!!isTogglingDone}
          className="shrink-0 w-7 h-7 grid place-items-center rounded-full hover:bg-slate-50 active:scale-[0.98] transition disabled:opacity-60"
          aria-label={isDone ? '완료 해제' : '완료 처리'}
        >
          {isTogglingDone ? (
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          ) : isDone ? (
            <CheckCircle2 className="w-6 h-6 text-primary" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300" />
          )}
        </button>
      ) : (
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 text-red-500 fill-white" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300" />
          )}
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0">
        <span
          className={`text-[15px] font-semibold transition-all truncate ${
            !isDeleteMode && isDone ? 'text-slate-400 line-through' : 'text-slate-800'
          }`}
        >
          {task.title}
        </span>

        {studiedSeconds > 0 ? (
          <span className="text-[11px] text-primary font-medium mt-0.5 truncate">
            {Math.floor(studiedSeconds / 60)}분 학습 완료
          </span>
        ) : null}
      </div>
    </div>
  );
}
