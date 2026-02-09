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

  // 기존 AUTO 삭제
  const { error: delErr } = await supabase
    .from("task_feedback_tags")
    .delete()
    .eq("task_feedback_id", taskFeedbackId)
    .eq("source", "AUTO");

  if (delErr) throw delErr;

  if (ids.length === 0) return;

  const rows = ids.map((tagId) => ({
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

  // 기존 MANUAL 삭제
  const { error: delErr } = await supabase
    .from("task_feedback_tags")
    .delete()
    .eq("task_feedback_id", taskFeedbackId)
    .eq("source", "MANUAL");

  if (delErr) throw delErr;

  if (ids.length === 0) return;

  const rows = ids.map((tagId) => ({
    task_feedback_id: taskFeedbackId,
    tag_id: tagId,
    source: "MANUAL",
    created_by: actorUserId ?? null,
  }));

  const { error: insErr } = await supabase.from("task_feedback_tags").insert(rows);
  if (insErr) throw insErr;
}
