"use client";

export default function SubmissionUploadBar({ busy, onCameraOrUpload }) {
  return (
    <div className="fixed left-1/2 -translate-x-1/2 top-0 bottom-0 w-full max-w-[430px] z-[86] pointer-events-none">
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto bottom-[calc(16px+env(safe-area-inset-bottom))] w-[280px] max-w-[calc(100%-7.5rem)]">
        <button
          type="button"
          disabled={busy}
          onClick={onCameraOrUpload}
          className="w-full text-center py-3 rounded-xl bg-primary text-primary-foreground shadow-lg font-semibold ring-2 ring-accent/30 ring-offset-2 ring-offset-background transition-transform active:scale-[0.99] hover:scale-[1.01] disabled:opacity-50 disabled:hover:scale-100"
        >
          {busy ? "업로드 중..." : "사진 업로드(jpg)"}
        </button>
      </div>
    </div>
  );
}
