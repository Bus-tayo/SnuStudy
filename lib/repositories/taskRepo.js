import { supabase } from "@/lib/supabase/client";

export async function fetchTaskById(taskId) {
  // TODO: 실제 스키마/테이블(Postgres) 확정되면 select로 교체
  // const { data, error } = await supabase.from("tasks").select("*").eq("id", taskId).single();
  // if (error) throw error;
  // return data;
  return null;
}
