"use client";

export default function TaskPdfSection({ pdfs }) {
  const list = Array.isArray(pdfs) ? pdfs : [];

  if (list.length === 0) {
    return (
      <div className="border rounded-lg p-3 space-y-2 bg-white">
        <div className="text-sm font-semibold">학습 자료 (PDF)</div>
        <div className="text-sm text-neutral-500">자료 없음</div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      <div className="text-sm font-semibold">학습 자료 (PDF)</div>
      <div className="flex flex-col gap-2">
        {list.map((pdf) => (
          <a
            key={pdf.id}
            className="inline-flex items-center justify-between h-10 px-4 rounded border text-sm hover:bg-neutral-50"
            href={pdf.file_url}
            target="_blank"
            rel="noreferrer"
          >
            <span className="truncate max-w-[200px]">{pdf.title}</span>
            <span className="text-xs text-secondary-foreground font-bold">보기</span>
          </a>
        ))}
      </div>
    </div>
  );
}
