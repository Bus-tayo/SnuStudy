import TaskDetailScreen from "@/components/mentee/tasks/TaskDetailScreen";

export default async function TaskDetailPage({ params }) {
  const { taskId } = await params;
  return <TaskDetailScreen taskId={taskId} />;
}
