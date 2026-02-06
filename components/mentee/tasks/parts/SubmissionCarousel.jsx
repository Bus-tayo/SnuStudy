"use client";

export default function SubmissionCarousel({ submissions, activeIndex, onChangeIndex }) {
  const list = Array.isArray(submissions) ? submissions : [];
  const has = list.length > 0;

  const prev = () => onChangeIndex(Math.max(0, activeIndex - 1));
  const next = () => onChangeIndex(Math.min(list.length - 1, activeIndex + 1));

  const active = has ? list[activeIndex] : null;

  return (
    <div className="border rounded-lg p-3 bg-white space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">공부 인증</div>
        <div className="text-xs text-neutral-500">
          {has ? `${activeIndex + 1} / ${list.length}` : "0 / 0"}
        </div>
      </div>

      {!has ? (
        <div className="text-sm text-neutral-500">아직 업로드된 사진이 없습니다.</div>
      ) : (
        <div className="space-y-2">
          <div className="w-full aspect-[4/3] bg-neutral-100 rounded overflow-hidden flex items-center justify-center">
            <img
              src={active?.image_url}
              alt="submission"
              className="w-full h-full object-contain"
              draggable={false}
            />
          </div>

          {active?.note ? (
            <div className="text-xs text-neutral-700 whitespace-pre-wrap">{active.note}</div>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="h-9 px-3 rounded border text-sm disabled:opacity-40"
              onClick={prev}
              disabled={activeIndex <= 0}
            >
              이전
            </button>
            <button
              type="button"
              className="h-9 px-3 rounded border text-sm disabled:opacity-40"
              onClick={next}
              disabled={activeIndex >= list.length - 1}
            >
              다음
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
