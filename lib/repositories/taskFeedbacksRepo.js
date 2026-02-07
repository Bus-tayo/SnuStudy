import { supabase } from "@/lib/supabase/client";

export async function fetchTaskFeedback({ taskId }) {
  const { data, error } = await supabase
    .from("task_feedbacks")
    .select("*")
    .eq("task_id", taskId)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function upsertTaskFeedback({
  taskId,
  menteeId,
  mentorId,
  difficulty,
  body,
}) {
  const now = new Date().toISOString();

  const payload = {
    task_id: taskId,
    mentee_id: menteeId,
    mentor_id: mentorId,
    difficulty,
    body, // ✅ 컬럼명이 body가 맞다는 전제. 만약 body_markdown이면 여기만 변경.
    updated_at: now,
    created_at: now,
  };

  const { data, error } = await supabase
    .from("task_feedbacks")
    .upsert(payload, { onConflict: "task_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
