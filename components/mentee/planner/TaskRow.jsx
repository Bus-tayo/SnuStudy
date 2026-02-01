"use client";

import Link from "next/link";
import { useState } from "react";

export default function TaskRow({ task }) {
  const [minutes, setMinutes] = useState(task.studyMinutes ?? 0);

  return (
    <div className="border rounded p-3 flex items-center gap-3">
      <input type="checkbox" defaultChecked={task.status === "DONE"} />
      <div className="flex-1">
        <div className="text-sm font-semibold">
          <Link href={`/mentee/tasks/${task.id}`} className="underline">
            {task.title}
          </Link>
        </div>
        <div className="text-xs text-neutral-500">{task.subject}</div>
      </div>
      <div className="flex items-center gap-1">
        <input
          className="w-16 border rounded px-2 py-1 text-sm"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
        />
        <span className="text-xs text-neutral-500">분</span>
      </div>
    </div>
  );
}
