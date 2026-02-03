'use client';

export default function StudyTimeInput({ disabled }) {
  return (
    <input
      type="number"
      placeholder="분"
      disabled={disabled}
      className="w-16 border rounded text-xs p-1 text-right"
    />
  );
}
