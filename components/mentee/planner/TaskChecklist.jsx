'use client';

import { useState } from 'react';
import TaskRow from './TaskRow';
import { addMenteeTask } from '@/lib/repositories/tasksRepo';

export default function TaskChecklist({ menteeId, date, tasks, secondsByTaskId, onMutated }) {
  const [newTitle, setNewTitle] = useState('');
  const [adding, setAdding] = useState(false);

  async function handleAdd() {
    console.log('[ADD] menteeId=', menteeId, 'type=', typeof menteeId);
console.log('[ADD] localStorage ss_user_id=', localStorage.getItem('ss_user_id'));

    const title = newTitle.trim();
    if (!title) return;

    setAdding(true);
    try {
      await addMenteeTask({ menteeId, date, title, subject: 'ETC' });
      setNewTitle('');
      onMutated?.();
    } catch (e) {
      console.error(e);
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
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="할 일 추가"
          className="flex-1 border rounded p-2 text-sm"
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
