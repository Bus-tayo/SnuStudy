"use client";

export default function TaskPdfSection({ pdf }) {
  const url = pdf?.file_url ?? null;
  const title = pdf?.title ?? "학습 자료";

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      <div className="text-sm font-semibold">{title}</div>

      {url ? (
        <a
          className="inline-flex items-center justify-center h-10 px-4 rounded border text-sm"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          PDF 다운로드
        </a>
      ) : (
        <div className="text-sm text-neutral-500">PDF 없음</div>
      )}
    </div>
  );
}
