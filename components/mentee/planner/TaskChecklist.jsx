'use client';

import { useMemo, useState } from 'react';
import TaskRow from './TaskRow';
import { addMenteeTask } from '@/lib/repositories/tasksRepo';

const SUBJECT_OPTIONS = [
  { value: 'KOR', label: '국어' },
  { value: 'ENG', label: '영어' },
  { value: 'MATH', label: '수학' },
  { value: 'ETC', label: '기타' },
];

export default function TaskChecklist({ menteeId, date, tasks, secondsByTaskId, onMutated }) {
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('ETC');
  const [adding, setAdding] = useState(false);

  const safeMenteeId = useMemo(() => {
    const n = Number(menteeId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [menteeId]);

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;

    if (!safeMenteeId) {
      alert('앱 유저 ID가 없습니다. 다시 로그인 해주세요.');
      return;
    }

    setAdding(true);
    try {
      await addMenteeTask({
        menteeId: safeMenteeId,
        date,
        title,
        subject: newSubject,
      });
      setNewTitle('');
      onMutated?.();
    } catch (e) {
      console.error('[TaskChecklist/add]', e);
      alert(e?.message ?? '할 일 추가 실패');
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          studiedSeconds={secondsByTaskId.get(task.id) ?? 0}
          date={date}
          onMutated={onMutated}
        />
      ))}

      <div className="flex gap-2 pt-2">
        <select
          className="border rounded p-2 text-sm"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          disabled={adding}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="할 일 추가"
          className="flex-1 border rounded p-2 text-sm"
          disabled={adding}
        />

        <button
          onClick={handleAdd}
          disabled={adding}
          className="border rounded px-3 text-sm"
        >
          추가
        </button>
      </div>
    </div>
  );
}
