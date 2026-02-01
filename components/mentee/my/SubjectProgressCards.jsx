import { mockProgress } from "@/lib/mock/mockData";

export default function SubjectProgressCards() {
  const p = mockProgress();

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">과목별 달성률</div>
      <div className="grid grid-cols-3 gap-2">
        {Object.entries(p).map(([k, v]) => (
          <div key={k} className="border rounded p-3 text-center">
            <div className="text-xs text-neutral-500">{k}</div>
            <div className="text-lg font-bold">{v}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}
