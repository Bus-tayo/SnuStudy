"use client";

import { useRouter } from "next/navigation";

export default function PlannerHeader({ dateStr }) {
  const router = useRouter();

  return (
    <header className="flex items-center justify-between">
      <button className="px-3 py-2 border rounded" onClick={() => router.back()}>
        이전
      </button>
      <div className="font-semibold">{dateStr}</div>
      <button className="px-3 py-2 border rounded" onClick={() => router.refresh()}>
        새로고침
      </button>
    </header>
  );
}
