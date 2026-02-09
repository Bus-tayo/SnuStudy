"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownEditor({ value, onChange }) {
  const [mode, setMode] = useState("EDIT"); // EDIT | PREVIEW

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          className={`btn-secondary ${mode === "EDIT" ? "opacity-100" : "opacity-70"}`}
          onClick={() => setMode("EDIT")}
        >
          편집
        </button>
        <button
          type="button"
          className={`btn-secondary ${mode === "PREVIEW" ? "opacity-100" : "opacity-70"}`}
          onClick={() => setMode("PREVIEW")}
        >
          미리보기
        </button>
      </div>

      {mode === "EDIT" ? (
        <textarea
          className="w-full min-h-[220px] border border-border rounded-xl p-3 text-sm bg-background"
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={"- 핵심 오답 원인\n- 다음엔 이렇게\n\n**굵게**, *기울임*, `코드`, [링크](...)"}
        />
      ) : (
        <div className="border border-border rounded-xl p-3 bg-background">
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {value ?? ""}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
