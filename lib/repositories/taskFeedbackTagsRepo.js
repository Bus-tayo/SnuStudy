import { supabase } from "@/lib/supabase/client";

// task_feedback_tags: (task_feedback_id, tag_id, source[AUTO/MANUAL], created_by, created_at ...)
export async function fetchFeedbackTags({ taskFeedbackId }) {
  const { data, error } = await supabase
    .from("task_feedback_tags")
    .select("*")
    .eq("task_feedback_id", taskFeedbackId);

  if (error) throw error;
  return data ?? [];
}

export async function syncAutoTags({ taskFeedbackId, tagIds }) {
  const ids = Array.from(new Set((tagIds ?? []).filter((x) => Number.isFinite(x))));

  // ✅ UNIQUE(task_feedback_id, tag_id) 제약 때문에
  // AUTO는 이미 MANUAL로 달린 태그는 건드리지 않도록 제외한다. (MANUAL 우선)
  const { data: manualRows, error: manualErr } = await supabase
    .from("task_feedback_tags")
    .select("tag_id")
    .eq("task_feedback_id", taskFeedbackId)
    .eq("source", "MANUAL");

  if (manualErr) throw manualErr;

  const manualIds = new Set((manualRows ?? []).map((r) => r.tag_id));
  const nextAutoIds = ids.filter((id) => !manualIds.has(id));

  // 기존 AUTO 삭제
  const { error: delErr } = await supabase
    .from("task_feedback_tags")
    .delete()
    .eq("task_feedback_id", taskFeedbackId)
    .eq("source", "AUTO");

  if (delErr) throw delErr;

  if (nextAutoIds.length === 0) return;

  const rows = nextAutoIds.map((tagId) => ({
    task_feedback_id: taskFeedbackId,
    tag_id: tagId,
    source: "AUTO",
    created_by: null,
  }));

  const { error: insErr } = await supabase.from("task_feedback_tags").insert(rows);
  if (insErr) throw insErr;
}

export async function syncManualTags({ taskFeedbackId, tagIds, actorUserId }) {
  const ids = Array.from(new Set((tagIds ?? []).filter((x) => Number.isFinite(x))));

  // ✅ MANUAL 동기화:
  // - 화면에서 선택된 MANUAL만 남기고 나머지는 제거
  // - UNIQUE(task_feedback_id, tag_id)라서 AUTO로 이미 달린 태그를 MANUAL로 바꾸는 경우가 있음
  //   → upsert(onConflict)로 source를 MANUAL로 덮어쓰기

  // 1) 선택에서 빠진 MANUAL은 제거
  if (ids.length === 0) {
    const { error: delAllErr } = await supabase
      .from("task_feedback_tags")
      .delete()
      .eq("task_feedback_id", taskFeedbackId)
      .eq("source", "MANUAL");

    if (delAllErr) throw delAllErr;
    return;
  }

  const { error: delErr } = await supabase
    .from("task_feedback_tags")
    .delete()
    .eq("task_feedback_id", taskFeedbackId)
    .eq("source", "MANUAL")
    .not("tag_id", "in", `(${ids.join(",")})`);

  if (delErr) throw delErr;

  // 2) 선택된 태그는 MANUAL로 upsert (AUTO가 있으면 MANUAL로 전환)
  const rows = ids.map((tagId) => ({
    task_feedback_id: taskFeedbackId,
    tag_id: tagId,
    source: "MANUAL",
    created_by: actorUserId ?? null,
  }));

  const { error: upErr } = await supabase
    .from("task_feedback_tags")
    .upsert(rows, { onConflict: "task_feedback_id,tag_id" });

  if (upErr) throw upErr;
}
