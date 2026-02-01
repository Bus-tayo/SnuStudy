export default function FeedbackSummaryCard({ item }) {
  return (
    <div className="border rounded p-3 space-y-1">
      <div className="flex justify-between">
        <div className="text-sm font-semibold">{item.subject}</div>
        <div className="text-xs text-neutral-500">{item.date}</div>
      </div>
      <div className="text-sm">{item.summary}</div>
      <div className="text-xs text-neutral-500 line-clamp-2">{item.body}</div>
    </div>
  );
}
