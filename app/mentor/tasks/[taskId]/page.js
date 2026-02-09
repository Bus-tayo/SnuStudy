import MentorTaskFeedbackScreen from "@/components/mentor/task-feedback/MentorTaskFeedbackScreen";

export default async function Page({ params }) {
  // ✅ Next 최신: params가 Promise일 수 있음
  const p = await params;
  const taskId = Number(p.taskId);

  return <MentorTaskFeedbackScreen taskId={taskId} />;
}
