"use client";

import { use } from "react";
import TaskDetailScreen from "@/components/mentee/tasks/TaskDetailScreen";

export default function TaskDetailPage({ params }) {
  const p = use(params);          // ✅ Next 16.1.6: params Promise unwrap
  const taskId = Number(p?.taskId);

  return <TaskDetailScreen taskId={taskId} />;
}
