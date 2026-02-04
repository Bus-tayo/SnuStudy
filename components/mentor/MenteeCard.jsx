"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";

export default function MenteeCard({ mentee, snapshot, date }) {
  const router = useRouter();

  const goDetail = () => router.push(`/mentor/mentee/${mentee.id}`);

  const header = snapshot?.headerNote?.trim();
  const total = snapshot?.totalCount ?? 0;
  const done = snapshot?.doneCount ?? 0;
  const studyMinutes = snapshot?.studyMinutes ?? 0;
  const tasks = snapshot?.tasks ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goDetail();
        }
      }}
      className="border rounded-lg p-3 space-y-3 cursor-pointer hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-300 transition"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-neutral-500">{format(date, "yyyy.MM.dd")}</div>
          <div className="text-lg font-semibold">{mentee.name}</div>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-500">오늘 완료</div>
          <div className="text-base font-semibold">
            {done} / {total}
          </div>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        <StatChip label="공부시간" value={studyMinutes ? `${studyMinutes}분` : "-"} />
        <StatChip label="플래너" value={header ? "메모 있음" : "메모 없음"} />
      </div>

      {header ? (
        <div className="rounded bg-neutral-50 border text-sm p-2">
          <div className="text-[11px] text-neutral-500 mb-1">멘티 메모</div>
          <div className="line-clamp-3 leading-relaxed">{header}</div>
        </div>
      ) : null}

      <div className="space-y-1">
        <div className="text-xs font-semibold text-neutral-700">오늘 할 일</div>
        {tasks.length === 0 ? (
          <div className="text-xs text-neutral-500">등록된 할 일이 없습니다.</div>
        ) : (
          <ul className="space-y-1">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border px-2 py-1 text-sm"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={t.status} />
                  <div>
                    <div className="leading-tight">{t.title}</div>
                    <div className="text-[11px] text-neutral-500">
                      {t.subject} {t.locked ? "· 멘토 지정" : ""}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-neutral-500">{prettyStatus(t.status)}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="px-2 py-1 rounded border bg-white flex items-center gap-1">
      <span className="text-[11px] text-neutral-500">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function StatusDot({ status }) {
  const color =
    status === "DONE"
      ? "bg-green-500"
      : status === "WORKING"
      ? "bg-amber-500"
      : "bg-neutral-300";
  return <span className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

function prettyStatus(status) {
  if (status === "DONE") return "완료";
  if (status === "WORKING") return "진행중";
  return "미완료";
}
