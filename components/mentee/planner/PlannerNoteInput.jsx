"use client";

import { useState } from "react";

export default function PlannerNoteInput({ value = "" }) {
  const [text, setText] = useState(value);

  return (
    <div className="space-y-2">
      <div className="text-sm font-semibold">메모/질문</div>
      <textarea
        className="w-full border rounded p-2 min-h-20"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="오늘 공부 관련 코멘트/질문을 남겨보세요"
      />
    </div>
  );
}
