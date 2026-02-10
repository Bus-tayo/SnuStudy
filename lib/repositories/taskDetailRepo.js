import { supabase } from "@/lib/supabase/client";

export async function fetchTaskById({ taskId }) {
  if (!Number.isFinite(taskId)) throw new Error("invalid taskId");

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchAvailableSubjects({ menteeId }) {
  if (!Number.isFinite(menteeId)) throw new Error("invalid menteeId");

  const { data, error } = await supabase
    .from("tasks")
    .select("subject")
    .eq("mentee_id", menteeId)
    .limit(5000);

  if (error) throw error;

  const subjects = Array.from(new Set((data ?? []).map((r) => r?.subject).filter(Boolean)));

  if (!subjects.includes("ETC")) subjects.push("ETC");
  subjects.sort();
  return subjects;
}

export async function updateTaskMeta({ taskId, title, subject, goal }) {
  if (!Number.isFinite(taskId)) throw new Error("invalid taskId");

  const patch = {
    updated_at: new Date().toISOString(),
  };

  if (typeof title === "string") patch.title = title;
  if (typeof subject === "string") patch.subject = subject;
  if (typeof goal === "string") patch.goal = goal;

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}
