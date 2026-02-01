import TaskRow from "./TaskRow";

export default function TaskChecklist({ tasks }) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">오늘 할 일</div>
        <button className="px-3 py-1.5 border rounded text-sm">추가</button>
      </div>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskRow key={t.id} task={t} />
        ))}
      </div>
    </section>
  );
}
