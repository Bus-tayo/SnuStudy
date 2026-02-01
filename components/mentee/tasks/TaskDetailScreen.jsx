"use client";

import { useState } from "react";
import { mockTaskDetail } from "@/lib/mock/mockData";

export default function TaskDetailScreen({ taskId }) {
  const data = mockTaskDetail(taskId);
  const [file, setFile] = useState(null);

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="text-lg font-bold">{data.title}</div>
        <div className="text-sm text-neutral-500">{data.subject}</div>
      </div>

      <div className="border rounded p-3 space-y-2">
        <div className="text-sm font-semibold">학습 자료</div>
        {data.pdfUrl ? (
          <a className="underline text-sm" href={data.pdfUrl} target="_blank" rel="noreferrer">
            PDF 다운로드
          </a>
        ) : (
          <div className="text-sm text-neutral-500">PDF 없음</div>
        )}
      </div>

      <div className="border rounded p-3 space-y-2">
        <div className="text-sm font-semibold">공부 인증 업로드 (jpg)</div>
        <input
          type="file"
          accept="image/jpeg,image/jpg"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="px-3 py-2 border rounded text-sm" disabled={!file}>
          업로드
        </button>
        <div className="text-xs text-neutral-500">
          * 실제 업로드(Supabase Storage) 연결은 다음 단계에서 처리
        </div>
      </div>
    </div>
  );
}
