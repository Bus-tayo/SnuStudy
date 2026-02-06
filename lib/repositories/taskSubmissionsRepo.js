import { supabase } from "@/lib/supabase/client";

export async function fetchTaskSubmissions({ taskId, menteeId }) {
  const { data, error } = await supabase
    .from("task_submissions")
    .select("*")
    .eq("task_id", taskId)
    .eq("mentee_id", menteeId)
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createTaskSubmission({ taskId, menteeId, imageUrl, note }) {
  const now = new Date().toISOString();

  const payload = {
    task_id: taskId,
    mentee_id: menteeId,
    image_url: imageUrl,
    note: note ?? null,
    submitted_at: now,
  };

  const { data, error } = await supabase
    .from("task_submissions")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
