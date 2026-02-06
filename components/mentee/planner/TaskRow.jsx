'use client';

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateTaskStatus } from '@/lib/repositories/tasksRepo';
import { overwriteManualMinutesForTaskInDay } from '@/lib/repositories/timeLogsRepo';

export default function TaskRow({ task, studiedSeconds, date, onMutated }) {
  const router = useRouter();
  const studiedMinutes = useMemo(() => Math.floor((Number(studiedSeconds ?? 0) || 0) / 60), [studiedSeconds]);

  const [minutes, setMinutes] = useState(String(studiedMinutes));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMinutes(String(studiedMinutes));
  }, [studiedMinutes]);

  const isDone = task.status === 'DONE';
  const locked = task.is_fixed_by_mentor === true;

  async function toggleDone() {
    setSaving(true);
    try {
      await updateTaskStatus({ taskId: task.id, status: isDone ? 'TODO' : 'DONE' });
      onMutated?.();
    } catch (e) {
      console.error('[TaskRow/toggleDone]', e);
      alert(e?.message ?? '상태 변경 실패');
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
      console.error('[TaskRow/saveMinutes]', e);
      alert(e?.message ?? '공부시간 저장 실패');
    } finally {
      setSaving(false);
    }
  }

  function goDetail() {
    router.push(`/mentee/tasks/${task.id}`);
  }

  return (
    <div className="flex items-start justify-between border rounded p-2 gap-3">
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={isDone} onChange={toggleDone} disabled={saving} />

        <button type="button" onClick={goDetail} className="flex flex-col text-left">
          <span className="text-sm underline underline-offset-2">{task.title}</span>
          <span className="text-xs text-gray-500">
            {task.subject}
            {locked ? ' · 멘토 지정' : ''}
          </span>
        </button>
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
