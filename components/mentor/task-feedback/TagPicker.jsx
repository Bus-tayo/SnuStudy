"use client";

import { useMemo, useState } from "react";

function Chip({ children, tone = "default", onClick }) {
  const base = "px-2.5 py-1 rounded-full text-xs border";
  const cls =
    tone === "auto"
      ? "bg-secondary text-secondary-foreground border-border"
      : "bg-background border-border";
  return (
    <button type="button" onClick={onClick} className={`${base} ${cls}`}>
      {children}
    </button>
  );
}

export default function TagPicker({
  allTags,
  autoTagIds,
  manualTagIds,
  onChangeManual,
  onCreateTag,
}) {
  const [q, setQ] = useState("");
  const [newTag, setNewTag] = useState("");

  // ✅ 전체 태그 목록은 노출하지 않고(요구사항),
  // 입력 중일 때만 상위 몇 개를 "추천" 형태로 보여준다.
  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    const picked = new Set([...(autoTagIds ?? []), ...(manualTagIds ?? [])]);
    return (allTags ?? [])
      .filter((t) => !picked.has(t.id))
      .filter((t) => String(t.name ?? "").toLowerCase().includes(query))
      .slice(0, 8);
  }, [allTags, q, autoTagIds, manualTagIds]);

  const toggleManual = (id) => {
    const set = new Set(manualTagIds ?? []);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChangeManual?.(Array.from(set));
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="text-xs text-foreground/60">자동 태그</div>
        <div className="flex flex-wrap gap-2">
          {(autoTagIds ?? []).length === 0 ? (
            <div className="text-xs text-foreground/60">
              본문에서 감지된 키워드가 없어요
            </div>
          ) : (
            (autoTagIds ?? []).map((id) => {
              const tag = (allTags ?? []).find((t) => t.id === id);
              return (
                <Chip key={id} tone="auto">
                  #{tag?.name ?? "tag"}
                </Chip>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="text-xs text-foreground/60">수동 태그</div>
        <div className="flex flex-wrap gap-2">
          {(manualTagIds ?? []).length === 0 ? (
            <div className="text-xs text-foreground/60">추가한 태그가 없어요</div>
          ) : (
            (manualTagIds ?? []).map((id) => {
              const tag = (allTags ?? []).find((t) => t.id === id);
              return (
                <Chip key={id} tone="manual" onClick={() => toggleManual(id)}>
                  #{tag?.name ?? "tag"} ✕
                </Chip>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-2">
        <input
          className="w-full border border-border rounded-xl px-3 py-2 text-sm bg-background"
          placeholder="태그 추가 (검색해서 선택)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {suggestions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((t) => (
              <Chip
                key={t.id}
                tone="manual"
                onClick={() => {
                  toggleManual(t.id);
                  setQ("");
                }}
              >
                #{t.name} +
              </Chip>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          className="flex-1 border border-border rounded-xl px-3 py-2 text-sm bg-background"
          placeholder="새 태그 만들기 (예: 적분)"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
        />
        <button
          className="btn-secondary"
          onClick={async () => {
            const name = newTag.trim();
            if (!name) return;
            await onCreateTag?.(name);
            setNewTag("");
          }}
        >
          추가
        </button>
      </div>
    </div>
  );
}
