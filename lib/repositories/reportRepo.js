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

// ✅ 타임테이블 day(06:00~다음날 02:00)를 커버하려고 to+1일 03:00까지 확보
function endIsoExclusiveFromYmd(toYmd) {
  const dt = new Date(`${toYmd}T00:00:00`);
  dt.setDate(dt.getDate() + 1);
  dt.setHours(3, 0, 0, 0);
  return dt.toISOString();
}

function enumerateDays(fromYmd, toYmd) {
  const out = [];
  const a = new Date(`${fromYmd}T00:00:00`);
  const b = new Date(`${toYmd}T00:00:00`);
  for (let d = new Date(a); d <= b; d.setDate(d.getDate() + 1)) {
    out.push(ymd(d));
  }
  return out;
}

// ✅ planner day: 06:00 ~ 다음날 02:00
// started_at이 00~02이면 "전날"로 귀속 (planner 기준)
function plannerDayKeyFromStartedAt(iso) {
  const dt = new Date(iso);
  const h = dt.getHours();
  const day = ymd(dt);

  // 00~02 => 전날
  if (h < 3) {
    const prev = new Date(dt);
    prev.setDate(prev.getDate() - 1);
    return ymd(prev);
  }
  return day;
}

function diffMinutes(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  const m = Math.round((b - a) / 60000);
  return Number.isFinite(m) && m > 0 ? m : 0;
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

  // 3) 기간 멘토 피드백
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

  // 4) 총 포인트(기간 무관)
  const totalPoints = await fetchTotalPoints({ menteeId });

  // ✅ 5) 기간 study_sessions (진짜 학습시간 source of truth)
  const startIso = startIsoFromYmd(fromYmd);
  const endIso = endIsoExclusiveFromYmd(toYmd);

  const { data: sessionsRaw, error: sErr } = await supabase
    .from("study_sessions")
    .select(
      `
      id, mentee_id, task_id, content, started_at, ended_at, color,
      task:tasks(id, title, subject)
    `
    )
    .eq("mentee_id", menteeId)
    .gte("started_at", startIso)
    .lt("started_at", endIso)
    .order("started_at", { ascending: true });

  if (sErr) throw sErr;

  const studySessions = (sessionsRaw || []).map((s) => {
    const content = s.task?.title || s.content || "학습";
    const subject = s.task?.subject || null;
    const minutes = diffMinutes(s.started_at, s.ended_at);
    return {
      id: s.id,
      task_id: s.task_id,
      content,
      subject,
      started_at: s.started_at,
      ended_at: s.ended_at,
      color: s.color || null,
      minutes,
    };
  });

  const days = enumerateDays(fromYmd, toYmd);

  const sessionsByDay = {};
  const minutesByDay = {};
  for (const d of days) {
    sessionsByDay[d] = [];
    minutesByDay[d] = 0;
  }

  const minutesBySubject = { KOR: 0, ENG: 0, MATH: 0, ETC: 0 };
  let minutesTotal = 0;

  for (const s of studySessions) {
    const d = plannerDayKeyFromStartedAt(s.started_at);
    if (!sessionsByDay[d]) {
      // 범위 밖으로 귀속될 수 있는 (from 첫날 00~02) 예외 방지
      continue;
    }
    sessionsByDay[d].push(s);
    minutesByDay[d] += s.minutes;
    minutesTotal += s.minutes;

    const subj = s.subject || "ETC";
    if (minutesBySubject[subj] == null) minutesBySubject[subj] = 0;
    minutesBySubject[subj] += s.minutes;
  }

  return {
    profile,
    range: { fromYmd, toYmd, days },
    tasks: tasks || [],
    feedbacks,
    totalPoints,

    // ✅ report generator/renderer가 기대하는 집계 필드 제공
    studySessions,
    sessionsByDay,
    minutesByDay,
    minutesBySubject,
    minutesTotal,
  };
}
