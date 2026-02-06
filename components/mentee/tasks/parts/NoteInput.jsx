"use client";

export default function NoteInput({ value, onChange }) {
  return (
    <div className="border rounded-lg p-3 space-y-2 bg-white">
      <div className="text-sm font-semibold">나의 코멘트</div>
      <textarea
        className="w-full min-h-[88px] border rounded p-2 text-sm outline-none"
        placeholder="사진 업로드 시 함께 저장됩니다."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
