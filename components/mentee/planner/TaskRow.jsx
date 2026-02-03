'use client';

import { useMemo, useState } from 'react';
import { updateTaskStatus } from '@/lib/repositories/tasksRepo';
import { overwriteManualMinutesForTaskInDay } from '@/lib/repositories/timeLogsRepo';

export default function TaskRow({ task, studiedSeconds, date, onMutated }) {
  const studiedMinutes = useMemo(() => Math.floor((studiedSeconds ?? 0) / 60), [studiedSeconds]);
  const [minutes, setMinutes] = useState(String(studiedMinutes));
  const [saving, setSaving] = useState(false);

  const isDone = task.status === 'DONE';
  const locked = task.is_fixed_by_mentor === true; // 멘토 고정 과제: 제목 수정/삭제 잠금 같은 확장 가능

  async function toggleDone() {
    setSaving(true);
    try {
      await updateTaskStatus({ taskId: task.id, status: isDone ? 'TODO' : 'DONE' });
      onMutated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function saveMinutes() {
    setSaving(true);
    try {
      const m = Number(minutes);
      await overwriteManualMinutesForTaskInDay({ taskId: task.id, date, minutes: m });
      onMutated?.();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-start justify-between border rounded p-2 gap-3">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={isDone} onChange={toggleDone} disabled={saving} />
        <div className="flex flex-col">
          <span className="text-sm">{task.title}</span>
          <span className="text-xs text-gray-500">
            {task.subject}
            {locked ? ' · 멘토 지정' : ''}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <input
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          onBlur={saveMinutes}
          inputMode="numeric"
          className="w-16 border rounded text-xs p-1 text-right"
          placeholder="분"
          disabled={saving}
        />
        <span className="text-[10px] text-gray-400">공부시간(분)</span>
      </div>
    </div>
  );
}
