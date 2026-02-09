"use client";

const TIERS = [
  { value: "BRONZE", label: "브론즈" },
  { value: "SILVER", label: "실버" },
  { value: "GOLD", label: "골드" },
  { value: "PLATINUM", label: "플래티넘" },
  { value: "DIAMOND", label: "다이아" },
];

export default function DifficultyPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIERS.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange?.(t.value)}
            className={`px-3 py-2 rounded-xl border text-sm ${
              active ? "bg-primary text-primary-foreground border-border" : "bg-background border-border"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
