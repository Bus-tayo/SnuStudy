import FeedbackSummaryCard from "./FeedbackSummaryCard";
import { mockFeedbacks } from "@/lib/mock/mockData";

export default function FeedbackScreen() {
  const items = mockFeedbacks();

  return (
    <div className="p-4 space-y-3">
      <div className="text-lg font-bold">과목별 피드백</div>
      {items.map((f) => (
        <FeedbackSummaryCard key={f.id} item={f} />
      ))}
    </div>
  );
}
