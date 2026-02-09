import { supabase } from "@/lib/supabase/client";
import { toYmd } from "@/lib/utils/dateIso";
import { addPointLedger } from "@/lib/repositories/pointsRepo";
import { createNotification } from "@/lib/repositories/notificationsRepo";

function ymdToDate(ymd) {
  return new Date(`${ymd}T00:00:00`);
}

function addDays(ymd, days) {
  const d = ymdToDate(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

function diffDays(aYmd, bYmd) {
  const a = ymdToDate(aYmd);
  const b = ymdToDate(bYmd);
  const diffMs = b.getTime() - a.getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}

function computeStreakStats(datesYmd, todayYmd) {
  const uniqueDates = Array.from(new Set((datesYmd ?? []).filter(Boolean)));
  uniqueDates.sort();

  if (uniqueDates.length === 0) {
    return { current: 0, max: 0, last: null };
  }

  let max = 1;
  let run = 1;

  for (let i = 1; i < uniqueDates.length; i += 1) {
    const prev = uniqueDates[i - 1];
    const next = uniqueDates[i];
    if (diffDays(prev, next) === 1) run += 1;
    else run = 1;
    if (run > max) max = run;
  }

  let current = 0;
  if (todayYmd && uniqueDates.includes(todayYmd)) {
    current = 1;
    let cursor = todayYmd;
    while (uniqueDates.includes(addDays(cursor, -1))) {
      cursor = addDays(cursor, -1);
      current += 1;
    }
  }

  return {
    current,
    max,
    last: uniqueDates[uniqueDates.length - 1],
  };
}

async function fetchUserStreakFields(menteeId) {
  const { data, error } = await supabase
    .from("users")
    .select("current_streak,last_streak_date")
    .eq("id", menteeId)
    .single();

  if (error) throw error;
  return data ?? { current_streak: 0, last_streak_date: null };
}

function streakBonusPoints(currentStreak) {
  // 요구사항: 연속 학습 일수 길수록 추가 포인트
  // 구간형으로 안전하게 (원하면 나중에 숫자 조절 가능)
  if (currentStreak >= 30) return 25;
  if (currentStreak >= 14) return 15;
  if (currentStreak >= 7) return 10;
  if (currentStreak >= 3) return 5;
  if (currentStreak >= 1) return 2;
  return 0;
}

async function awardStreakBonusIfIncreased({ menteeId, beforeCurrent, afterCurrent }) {
  if (!menteeId) return;
  if (!Number.isFinite(beforeCurrent) || !Number.isFinite(afterCurrent)) return;
  if (afterCurrent <= beforeCurrent) return;

  const todayYmd = toYmd(new Date());
  const points = streakBonusPoints(afterCurrent);
  if (points <= 0) return;

  await addPointLedger({
    menteeId,
    sourceType: "STREAK_BONUS",
    points,
    sourceId: null,
    sourceKey: `STREAK:${todayYmd}`,
  });
}

export async function recalcUserStreak(menteeId) {
  if (!menteeId) return null;

  const before = await fetchUserStreakFields(menteeId);

  const { data, error } = await supabase
    .from("tasks")
    .select("date")
    .eq("mentee_id", menteeId)
    .eq("status", "DONE");

  if (error) throw error;

  const dates = (data ?? []).map((row) => row?.date).filter(Boolean);
  const todayYmd = toYmd(new Date());
  const { current, max, last } = computeStreakStats(dates, todayYmd);

  const { error: updateError } = await supabase
    .from("users")
    .update({
      current_streak: current,
      max_streak: max,
      last_streak_date: last,
    })
    .eq("id", menteeId);

  if (updateError) throw updateError;

  await awardStreakBonusIfIncreased({
    menteeId,
    beforeCurrent: Number(before?.current_streak ?? 0),
    afterCurrent: Number(current ?? 0),
  });

  return { current, max, last };
}

export async function fetchTasksByDate({ menteeId, date }) {
  const ymd = toYmd(date);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("mentee_id", menteeId)
    .eq("date", ymd)
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTasksByRange({ menteeId, from, to }) {
  const fromYmd = toYmd(from);
  const toYmdStr = toYmd(to);

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("mentee_id", menteeId)
    .gte("date", fromYmd)
    .lte("date", toYmdStr)
    .order("date", { ascending: true })
    .order("sort_order", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addMenteeTask({ menteeId, date, title, description, subject = "ETC" }) {
  const ymd = toYmd(date);

  const { data: existing, error: e1 } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("mentee_id", menteeId)
    .eq("date", ymd)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1);

  if (e1) throw e1;

  const maxSort = existing?.[0]?.sort_order ?? 0;
  const nextSort = (Number.isFinite(maxSort) ? maxSort : 0) + 1;

  const now = new Date().toISOString();

  const payload = {
    mentee_id: menteeId,
    created_by: menteeId,
    date: ymd,
    time: "00:00",
    title,
    description: description || "",
    subject,
    status: "TODO",
    is_fixed_by_mentor: false,
    sort_order: nextSort,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from("tasks").insert(payload).select("*").single();
  if (error) throw error;

  // 오늘 일정에 추가되면 즉시 알림
  const todayYmd = toYmd(new Date());
  if (ymd === todayYmd) {
    try {
      await createNotification({
        userId: menteeId,
        type: "TASK_TODAY",
        title: "오늘 할 일이 추가되었어요",
        body: `\"${title}\" 할 일이 오늘 일정에 추가되었습니다.`,
        payload: { task_id: data?.id, date: ymd },
      });
    } catch (e) {
      console.warn("[addMenteeTask] notification failed", e);
    }
  }

  await addPointLedger({
    menteeId,
    sourceType: "TASK_CREATED",
    points: 1,
    sourceId: data?.id ?? null,
    sourceKey: data?.id ? `TASK_CREATED:${data.id}` : null,
  });

  return data;
}

export async function addMentorTask({ mentorId, menteeId, date, title, subject = "ETC" }) {
  const ymd = toYmd(date);

  const { data: existing, error: e1 } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("mentee_id", menteeId)
    .eq("date", ymd)
    .order("sort_order", { ascending: false, nullsFirst: false })
    .limit(1);

  if (e1) throw e1;

  const maxSort = existing?.[0]?.sort_order ?? 0;
  const nextSort = (Number.isFinite(maxSort) ? maxSort : 0) + 1;

  const now = new Date().toISOString();

  const payload = {
    mentee_id: menteeId,
    created_by: mentorId,
    date: ymd,
    time: "00:00",
    title,
    subject,
    status: "TODO",
    is_fixed_by_mentor: true,
    sort_order: nextSort,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from("tasks").insert(payload).select("*").single();
  if (error) throw error;

  const todayYmd = toYmd(new Date());
  if (ymd === todayYmd) {
    try {
      await createNotification({
        userId: menteeId,
        type: "TASK_TODAY",
        title: "멘토가 할 일을 등록했어요",
        body: `멘토가 \"${title}\" 할 일을 오늘 일정에 추가했습니다.`,
        payload: { task_id: data?.id, date: ymd, created_by: mentorId },
      });
    } catch (e) {
      console.warn("[addMentorTask] notification failed", e);
    }
  }

  return data;
}

export async function deleteTasks(taskIds) {
  if (!taskIds || taskIds.length === 0) return;

  const { error } = await supabase.from("tasks").delete().in("id", taskIds);
  if (error) throw error;
}

export async function updateTaskStatus({ taskId, status }) {
  const now = new Date().toISOString();

  const patch = {
    status,
    updated_at: now,
    completed_at: status === "DONE" ? now : null,
  };

  const { data, error } = await supabase
    .from("tasks")
    .update(patch)
    .eq("id", taskId)
    .select("*")
    .single();

  if (error) throw error;

  const task = data;

  if (task?.date) {
    const { data: tasks, error: tasksError } = await supabase
      .from("tasks")
      .select("status")
      .eq("mentee_id", task.mentee_id)
      .eq("date", task.date);

    if (tasksError) throw tasksError;

    const totalTasks = tasks?.length ?? 0;
    const completedTasks = (tasks ?? []).filter((t) => t.status === "DONE").length;
    const achievementRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const { error: statsError } = await supabase
      .from("daily_statistics")
      .upsert(
        {
          user_id: task.mentee_id,
          date: task.date,
          total_tasks_count: totalTasks,
          completed_tasks_count: completedTasks,
          achievement_rate: achievementRate,
        },
        { onConflict: "user_id,date" }
      );

    if (statsError) throw statsError;
  }

  if (status === "DONE" && task?.mentee_id) {
    await addPointLedger({
      menteeId: task.mentee_id,
      sourceType: "TASK_DONE",
      points: 3,
      sourceId: task?.id ?? null,
      sourceKey: task?.id ? `TASK_DONE:${task.id}` : null,
    });
  }

  await recalcUserStreak(task?.mentee_id);

  return data;
}
