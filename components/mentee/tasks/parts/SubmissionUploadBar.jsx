"use client";

export default function SubmissionUploadBar({ busy, onCameraOrUpload }) {
  return (
    <div className="fixed left-0 right-0 bottom-0 bg-white border-t">
      <div className="max-w-[430px] mx-auto px-4 py-3 flex items-center gap-3">
        <button
          type="button"
          className="flex-1 h-12 rounded-lg border text-sm disabled:opacity-50"
          disabled={busy}
          onClick={onCameraOrUpload}
        >
          {busy ? "업로드 중..." : "사진 업로드(jpg)"}
        </button>
      </div>
    </div>
  );
}
