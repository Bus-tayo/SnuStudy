import PlannerHeader from "./PlannerHeader";
import WeekMiniCalendar from "./WeekMiniCalendar";
import PlannerNoteInput from "./PlannerNoteInput";
import TaskChecklist from "./TaskChecklist";
import { getISODate } from "@/lib/utils/date";
import { mockPlannerBundle } from "@/lib/mock/mockData.js";

export default function PlannerScreen({ initialDate }) {
  const dateStr = getISODate(initialDate);

  // 지금은 DB 붙이기 전이라 mock
  const bundle = mockPlannerBundle(dateStr);

  return (
    <div className="p-4 space-y-4">
      <PlannerHeader dateStr={dateStr} />
      <WeekMiniCalendar selectedDateStr={dateStr} />
      <PlannerNoteInput value={bundle.headerNote} />
      <TaskChecklist tasks={bundle.tasks} />
      {/* 아래는 “어제자 피드백 보기/과목별 피드백” 영역으로 확장 */}
      <div className="pt-2 border-t">
        <div className="text-sm font-semibold">피드백</div>
        <div className="text-sm text-neutral-500">데이터 연결 예정</div>
      </div>
    </div>
  );
}
