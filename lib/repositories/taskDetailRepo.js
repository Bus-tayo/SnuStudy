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
