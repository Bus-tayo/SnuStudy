import { supabase } from "@/lib/supabase/client";

function isUniqueViolation(err) {
  // Postgres unique_violation
  return err?.code === "23505";
}

export async function addPointLedger({
  menteeId,
  sourceType,
  points,
  sourceId = null,
  sourceKey = null,
}) {
  if (!menteeId) throw new Error("menteeId가 필요합니다.");
  if (!sourceType) throw new Error("sourceType이 필요합니다.");
  if (!Number.isFinite(points) || points <= 0) throw new Error("points는 1 이상의 정수여야 합니다.");

  const payload = {
    mentee_id: menteeId,
    source_type: sourceType,
    source_id: sourceId,
    source_key: sourceKey,
    points,
  };

  const { data, error } = await supabase
    .from("point_ledger")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    // source_key unique로 중복 지급 방지. 중복이면 무시.
    if (isUniqueViolation(error)) return null;
    throw error;
  }
  return data;
}

export async function fetchTotalPoints({ menteeId }) {
  if (!menteeId) return 0;

  const { data, error } = await supabase
    .from("point_ledger")
    .select("points")
    .eq("mentee_id", menteeId);

  if (error) throw error;
  const sum = (data ?? []).reduce((acc, row) => acc + (Number(row?.points) || 0), 0);
  return sum;
}
