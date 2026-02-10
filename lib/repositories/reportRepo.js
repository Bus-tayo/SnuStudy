import { supabase } from "@/lib/supabase/client";
import { fetchTotalPoints } from "@/lib/repositories/pointsRepo";

function ymd(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysYmd(dateStr, delta) {
  const dt = new Date(dateStr);
  dt.setDate(dt.getDate() + delta);
  return ymd(dt);
}

// planner day: 06:00 ~ next day 02:00
function rangeIsoForPlannerDays(fromYmd, toYmd) {
  const start = new Date(`${fromYmd}T06:00:00`);
  const end = new Date(`${addDaysYmd(toYmd, 1)}T02:00:00`);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}

function plannerDayYmdFromIso(iso) {
  const dt = new Date(iso);
  const local = new Date(dt.getTime());
  const h = local.getHours();
  if (h < 6) local.setDate(local.getDate() - 1);
  return ymd(local);
}

function diffMinutes(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.round((b - a) / 60000);
}

function computeMaxConsecutiveDays(activeYmdSet, fromYmd, toYmd) {
  let cur = fromYmd;
  let best = 0;
  let streak = 0;

  while (cur <= toYmd) {
    if (activeYmdSet.has(cur)) {
      streak += 1;
      best = Math.max(best, streak);
    } else {
      streak = 0;
    }
    cur = addDaysYmd(cur, 1);
  }
  return best;
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

  // 3) study_sessions (공부시간 source of truth)
  const { startIso, endIso } = rangeIsoForPlannerDays(fromYmd, toYmd);

  const { data: studySessionsRaw, error: sErr } = await supabase
    .from("study_sessions")
    .select(
      `
      *,
      task:tasks(id,title,subject,date)
    `
    )
    .eq("mentee_id", menteeId)
    .gte("started_at", startIso)
    .lt("started_at", endIso)
    .order("started_at", { ascending: true });

  if (sErr) throw sErr;

  const studySessions = (studySessionsRaw || []).map((row) => {
    const minutes = diffMinutes(row.started_at, row.ended_at);
    const pYmd = plannerDayYmdFromIso(row.started_at);
    return {
      id: row.id,
      mentee_id: row.mentee_id,
      task_id: row.task_id,
      started_at: row.started_at,
      ended_at: row.ended_at,
      minutes,
      planner_ymd: pYmd,
      color: row.color || null,
      content: row.task?.title || row.content || "삭제된 과제",
      subject: row.task?.subject || null,
      task_date: row.task?.date || null,
    };
  });

  // 4) 기간 멘토 피드백 (과목별)
  let feedbacks = [];
  {
    const { data: fbs, error: fErr } = await supabase
      .from("feedbacks")
      .select("*, mentor:users!feedbacks_mentor_id_fkey(name)")
      .eq("mentee_id", menteeId)
      .gte("date", fromYmd)
      .lte("date", toYmd)
      .order("date", { ascending: true });

    if (!fErr) {
      feedbacks =
        (fbs || []).map((x) => ({
          ...x,
          author: x.mentor?.name ?? "알 수 없음",
        })) ?? [];
    }
  }

  // 5) task_feedbacks (+ tags) : 기간 내 tasks에 달린 피드백을 보고서에 포함
  let taskFeedbacks = [];
  if (taskIds.length) {
    const { data: tfs, error: tfErr } = await supabase
      .from("task_feedbacks")
      .select(
        `
        id, task_id, mentee_id, mentor_id, difficulty, body, created_at, updated_at,
        mentor:users!task_feedbacks_mentor_id_fkey(name),
        task:tasks(id,title,subject,date),
        task_feedback_tags:task_feedback_tags(
          source,
          tag:tags(id,name)
        )
      `
      )
      .in("task_id", taskIds)
      .eq("mentee_id", menteeId)
      .order("created_at", { ascending: true });

    if (!tfErr) {
      taskFeedbacks = (tfs || []).map((x) => ({
        id: x.id,
        task_id: x.task_id,
        mentor_id: x.mentor_id,
        mentor_name: x.mentor?.name ?? "알 수 없음",
        difficulty: x.difficulty ?? null,
        body: x.body ?? "",
        created_at: x.created_at,
        subject: x.task?.subject ?? null,
        task_title: x.task?.title ?? "과제",
        task_date: x.task?.date ?? null,
        tags: (x.task_feedback_tags || [])
          .map((r) => ({
            id: r.tag?.id ?? null,
            name: r.tag?.name ?? "",
            source: r.source ?? "",
          }))
          .filter((t) => t.id && t.name),
      }));
    }
  }

  // 6) 총 포인트(기간 무관)
  const totalPoints = await fetchTotalPoints({ menteeId });

  // 7) 집계(보고서 렌더링을 위해 repo에서 미리 계산)
  const minutesTotal = studySessions.reduce((a, s) => a + (s.minutes || 0), 0);

  const minutesBySubject = { KOR: 0, ENG: 0, MATH: 0, ETC: 0 };
  const activeDays = new Set();

  for (const s of studySessions) {
    const subj = s.subject || "ETC";
    minutesBySubject[subj] = (minutesBySubject[subj] || 0) + (s.minutes || 0);
    if ((s.minutes || 0) > 0 && s.planner_ymd) activeDays.add(s.planner_ymd);
  }

  const maxConsecutive = computeMaxConsecutiveDays(activeDays, fromYmd, toYmd);

  // day list
  const days = [];
  let cur = fromYmd;
  while (cur <= toYmd) {
    days.push(cur);
    cur = addDaysYmd(cur, 1);
  }

  // group by day
  const sessionsByDay = {};
  for (const d of days) sessionsByDay[d] = [];
  for (const s of studySessions) {
    if (!sessionsByDay[s.planner_ymd]) sessionsByDay[s.planner_ymd] = [];
    sessionsByDay[s.planner_ymd].push(s);
  }

  const minutesByDay = {};
  for (const d of days) minutesByDay[d] = sessionsByDay[d].reduce((a, s) => a + (s.minutes || 0), 0);

  return {
    profile,
    range: { fromYmd, toYmd, days },
    tasks: tasks || [],
    studySessions,
    sessionsByDay,
    minutesByDay,
    minutesTotal,
    minutesBySubject,
    maxConsecutiveInRange: maxConsecutive,
    feedbacks,
    taskFeedbacks,
    totalPoints,
  };
}
