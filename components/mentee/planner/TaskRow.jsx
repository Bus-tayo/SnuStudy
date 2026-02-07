'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export default function TaskRow({
  task,
  studiedSeconds,
  isDeleteMode,
  isSelected,
  onSelect,
  onOpenDetail,
  subjectBorderColor,
}) {
  const handleClick = () => {
    if (isDeleteMode) {
      onSelect();
    } else {
      onOpenDetail();
    }
  };

  const isDone = task.status === 'DONE';

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${
        isDeleteMode && isSelected
          ? `bg-red-50 ${subjectBorderColor} shadow-md`
          : 'bg-white border-slate-100 shadow-sm hover:border-slate-200'
      } ${isDeleteMode && !isSelected ? 'opacity-60 hover:opacity-100' : 'opacity-100'}`}
    >
      {isDeleteMode && (
        <div className="flex-shrink-0">
          {isSelected ? (
            <CheckCircle2 className="w-6 h-6 text-red-500 fill-white" />
          ) : (
            <Circle className="w-6 h-6 text-slate-300" />
          )}
        </div>
      )}

      <div className="flex flex-col flex-1">
        <span
          className={`text-[15px] font-semibold transition-all ${
            !isDeleteMode && isDone
              ? 'text-slate-400 line-through'
              : 'text-slate-800'
          }`}
        >
          {task.title}
        </span>
        {studiedSeconds > 0 && (
          <span className="text-[11px] text-primary font-medium mt-0.5">
            {Math.floor(studiedSeconds / 60)}분 학습 완료
          </span>
        )}
      </div>
    </div>
  );
}