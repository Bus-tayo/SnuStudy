import { supabase } from "@/lib/supabase/client";

export async function fetchTaskPdfMaterial({ taskId }) {
  const { data, error } = await supabase
    .from("task_materials")
    .select("*")
    .eq("task_id", taskId)
    .eq("type", "PDF")
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data?.[0] ?? null;
}
