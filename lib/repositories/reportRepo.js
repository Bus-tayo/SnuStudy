import { supabase } from "@/lib/supabase/client";

function ymdFromDate(dt) {
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function ensureYmd(v) {
  if (!v) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  return ymdFromDate(new Date(v));
}

function addDaysYmd(ymd, delta) {
  const dt = new Date(`${ymd}T00:00:00`);
  dt.setDate(dt.getDate() + delta);
  return ymdFromDate(dt);
}

function enumerateDays(fromYmd, toYmd) {
  const out = [];
  const cur = new Date(`${fromYmd}T00:00:00`);
  const end = new Date(`${toYmd}T00:00:00`);
  while (cur <= end) {
    out.push(ymdFromDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/**
 * ✅ Supabase timestamptz 필터용 ISO 생성 (Asia/Seoul 기준)
 * - start: fromYmd 00:00:00+09:00
 * - endExclusive: (toYmd+1) 00:00:00+09:00
 */
function startIsoFromYmdLocal(fromYmd) {
  return `${fromYmd}T00:00:00+09:00`;
}
function endIsoExclusiveFromYmdLocal(toYmd) {
  const next = addDaysYmd(toYmd, 1);
  return `${next}T00:00:00+09:00`;
}

/**
 * ✅ 세션 started_at(ISO)을 Asia/Seoul 날짜키(YYYY-MM-DD)로 변환
 * - 브라우저/서버 TZ와 무관하게 "Asia/Seoul"로 고정
 */
function plannerDayKeyFromStartedAtLocal(startedAtIso) {
  if (!startedAtIso) return null;
  // toLocaleDateString('en-CA') => YYYY-MM-DD 형태
  return new Date(startedAtIso).toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
}

function diffMinutes(startIso, endIso) {
  if (!startIso || !endIso) return 0;
  const a = new Date(startIso).getTime();
  const b = new Date(endIso).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return 0;
  return Math.max(0, Math.round((b - a) / 60000));
}

async function fetchTotalPoints({ menteeId }) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("total_points")
      .eq("id", menteeId)
      .single();
    if (error) return 0;
    return Number(data?.total_points ?? 0) || 0;
  } catch (_) {
    return 0;
  }
}

export async function fetchReportData({ menteeId, from, to }) {
  if (!menteeId) throw new Error("menteeId가 필요합니다.");
  const fromYmd = ensureYmd(from);
  const toYmd = ensureYmd(to);
  if (!fromYmd || !toYmd) throw new Error("기간(from/to)이 필요합니다.");

  // 1) 프로필
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

  // 2-1) 태그 통계 (task_feedback_tags 기반)
  let tagStats = [];
  try {
    const taskIds = (tasks || []).map((t) => t.id).filter(Boolean);
    if (taskIds.length) {
      const { data: tfRows, error: tfErr } = await supabase
        .from("task_feedbacks")
        .select(`id, task_id, task:tasks(id, subject)`)
        .in("task_id", taskIds);

      if (!tfErr) {
        const tfList = tfRows || [];
        const tfIds = tfList.map((r) => r.id).filter(Boolean);

        const tfSubjectById = {};
        for (const r of tfList) {
          tfSubjectById[r.id] = r?.task?.subject || "ETC";
        }

        if (tfIds.length) {
          const { data: tftRows, error: tftErr } = await supabase
            .from("task_feedback_tags")
            .select(`id, task_feedback_id, tag_id, tag:tags(id, name)`)
            .in("task_feedback_id", tfIds);

          if (!tftErr) {
            const agg = {};
            let totalLinks = 0;

            for (const row of tftRows || []) {
              const tagName = String(row?.tag?.name || "").trim();
              if (!tagName) continue;

              totalLinks += 1;

              if (!agg[tagName]) {
                agg[tagName] = {
                  tagName,
                  feedbackCount: 0,
                  subjectCounts: { KOR: 0, ENG: 0, MATH: 0, ETC: 0 },
                };
              }

              agg[tagName].feedbackCount += 1;
              const subj = tfSubjectById[row.task_feedback_id] || "ETC";
              if (agg[tagName].subjectCounts[subj] == null) agg[tagName].subjectCounts[subj] = 0;
              agg[tagName].subjectCounts[subj] += 1;
            }

            const stats = Object.values(agg).map((x) => {
              const entries = Object.entries(x.subjectCounts || {});
              entries.sort((a, b) => (b[1] || 0) - (a[1] || 0));
              const topSubject = entries[0]?.[0] || "ETC";
              const subjectCount = entries.filter(([, c]) => (c || 0) > 0).length;
              const sharePct = totalLinks ? Math.round((x.feedbackCount / totalLinks) * 100) : 0;
              return { ...x, topSubject, subjectCount, sharePct };
            });

            stats.sort((a, b) => b.feedbackCount - a.feedbackCount || a.tagName.localeCompare(b.tagName));
            tagStats = stats;
          }
        }
      }
    }
  } catch (_) {
    tagStats = [];
  }

  // 3) 기간 멘토 피드백 (feedbacks)
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

  // 4) 총 포인트 (기간 무관)
  const totalPoints = await fetchTotalPoints({ menteeId });

  // 5) 기간 study_sessions (진짜 학습시간 source of truth)
  const startIso = startIsoFromYmdLocal(fromYmd);
  const endIso = endIsoExclusiveFromYmdLocal(toYmd);

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
    const d = plannerDayKeyFromStartedAtLocal(s.started_at);
    if (!sessionsByDay[d]) continue; // 범위 밖 안전장치

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

    // 태그 통계
    tagStats,

    // 학습시간 집계
    studySessions,
    sessionsByDay,
    minutesByDay,
    minutesBySubject,
    minutesTotal,
  };
}
