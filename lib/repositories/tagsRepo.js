import { supabase } from "@/lib/supabase/client";

export async function fetchAllTags() {
  const { data, error } = await supabase
    .from("tags")
    .select("id,name,aliases")
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function upsertTagByName({ name, aliases = [] }) {
  const n = String(name ?? "").trim();
  if (!n) throw new Error("tag name required");

  const { data: found, error: e1 } = await supabase
    .from("tags")
    .select("id,name,aliases")
    .eq("name", n)
    .maybeSingle();

  if (e1) throw e1;
  if (found) return found;

  const { data, error } = await supabase
    .from("tags")
    .insert({ name: n, aliases }) // created_at은 default now()로 해결
    .select("id,name,aliases")
    .single();

  if (error) throw error;
  return data;
}
