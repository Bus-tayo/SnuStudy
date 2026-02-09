import { supabase } from "@/lib/supabase/client";
import { fetchTotalPoints } from "@/lib/repositories/pointsRepo";

function ymd(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startIsoFromYmd(fromYmd) {
  return new Date(`${fromYmd}T00:00:00`).toISOString();
}

function endIsoExclusiveFromYmd(toYmd) {
  const dt = new Date(`${toYmd}T00:00:00`);
  dt.setDate(dt.getDate() + 1);
  return dt.toISOString();
}

export async function fetchReportData({ menteeId, from, to }) {
  if (!menteeId) throw new Error("menteeId가 필요합니다.");
  if (!from || !to) throw new Error("기간(from/to)이 필요합니다.");

  const fromYmd = /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : ymd(from);
  const toYmd = /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : ymd(to);

  // 1) 프로필(유저)
  const { data: profile, error: pErr } = await supabase
    .from("users")
    .select("id,name,role,current_streak,max_streak,last_streak_date")
    .eq("id", menteeId)
    .single();
  if (pErr) throw pErr;

  // 2) 기간 tasks
  const { data: tasks, error: tErr } = await supabase
    .from("tasks")
    .select("*")
    .eq("mentee_id", menteeId)
    .gte("date", fromYmd)
    .lte("date", toYmd)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });
  if (tErr) throw tErr;

  const taskIds = (tasks || []).map((t) => t.id).filter(Boolean);

  // 3) 기간 time logs (task_id IN + started_at 범위)
  let timeLogs = [];
  if (taskIds.length) {
    const startIso = startIsoFromYmd(fromYmd);
    const endIso = endIsoExclusiveFromYmd(toYmd);

    const { data: logs, error: lErr } = await supabase
      .from("task_time_logs")
      .select("*")
      .in("task_id", taskIds)
      .gte("started_at", startIso)
      .lt("started_at", endIso);

    if (lErr) throw lErr;
    timeLogs = logs || [];
  }

  // 4) 기간 멘토 피드백 (테이블명이 다를 수 있어서 안전하게 try)
  let feedbacks = [];
  try {
    const { data: fbs, error: fErr } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("mentee_id", menteeId)
      .gte("date", fromYmd)
      .lte("date", toYmd)
      .order("date", { ascending: true });

    if (!fErr) feedbacks = fbs || [];
  } catch (_) {
    feedbacks = [];
  }

  // 5) 총 포인트(기간 무관)
  const totalPoints = await fetchTotalPoints({ menteeId });

  return {
    profile,
    range: { fromYmd, toYmd },
    tasks: tasks || [],
    timeLogs,
    feedbacks,
    totalPoints,
  };
}
