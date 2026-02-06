"use client";

export default function TaskDetailTopBar({ title, subtitle, onBack }) {
  return (
    <div className="px-4 py-3 border-b bg-white flex items-center gap-3">
      <button
        type="button"
        className="h-9 px-3 rounded border text-sm"
        onClick={onBack}
      >
        ←
      </button>

      <div className="min-w-0 flex-1">
        <div className="text-base font-semibold truncate">{title}</div>
        {subtitle ? <div className="text-xs text-neutral-500 truncate">{subtitle}</div> : null}
      </div>
    </div>
  );
}
