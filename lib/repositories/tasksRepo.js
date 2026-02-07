import { supabase } from '@/lib/supabase/client';
import { toYmd } from '@/lib/utils/dateIso';

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
    if (diffDays(prev, next) === 1) {
      run += 1;
    } else {
      run = 1;
    }
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

export async function recalcUserStreak(menteeId) {
  if (!menteeId) return null;

  const { data, error } = await supabase
    .from('tasks')
    .select('date')
    .eq('mentee_id', menteeId)
    .eq('status', 'DONE');

  if (error) throw error;

  const dates = (data ?? []).map((row) => row?.date).filter(Boolean);
  const todayYmd = toYmd(new Date());
  const { current, max, last } = computeStreakStats(dates, todayYmd);

  const { error: updateError } = await supabase
    .from('users')
    .update({
      current_streak: current,
      max_streak: max,
      last_streak_date: last,
    })
    .eq('id', menteeId);

  if (updateError) throw updateError;

  return { current, max, last };
}

export async function fetchTasksByDate({ menteeId, date }) {
  const ymd = toYmd(date);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('mentee_id', menteeId)
    .eq('date', ymd)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTasksByRange({ menteeId, from, to }) {
  const fromYmd = toYmd(from);
  const toYmdStr = toYmd(to);

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('mentee_id', menteeId)
    .gte('date', fromYmd)
    .lte('date', toYmdStr)
    .order('date', { ascending: true })
    .order('sort_order', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addMenteeTask({ menteeId, date, title, description, subject = 'ETC' }) {
  const ymd = toYmd(date);

  const { data: existing, error: e1 } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('mentee_id', menteeId)
    .eq('date', ymd)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);

  if (e1) throw e1;

  const maxSort = existing?.[0]?.sort_order ?? 0;
  const nextSort = (Number.isFinite(maxSort) ? maxSort : 0) + 1;

  const now = new Date().toISOString();

  const payload = {
    mentee_id: menteeId,
    created_by: menteeId,
    date: ymd,
    time: '00:00',
    title,
    description: description || '',
    subject,
    status: 'TODO',
    is_fixed_by_mentor: false,
    sort_order: nextSort,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();

  if (error) throw error;
  return data;
}

export async function addMentorTask({ mentorId, menteeId, date, title, subject = 'ETC' }) {
  const ymd = toYmd(date);

  const { data: existing, error: e1 } = await supabase
    .from('tasks')
    .select('sort_order')
    .eq('mentee_id', menteeId)
    .eq('date', ymd)
    .order('sort_order', { ascending: false, nullsFirst: false })
    .limit(1);

  if (e1) throw e1;

  const maxSort = existing?.[0]?.sort_order ?? 0;
  const nextSort = (Number.isFinite(maxSort) ? maxSort : 0) + 1;

  const now = new Date().toISOString();

  const payload = {
    mentee_id: menteeId,
    created_by: mentorId,
    date: ymd,
    time: '00:00',
    title,
    subject,
    status: 'TODO',
    is_fixed_by_mentor: true,
    sort_order: nextSort,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase.from('tasks').insert(payload).select('*').single();

  if (error) throw error;
  return data;
}

export async function deleteTasks(taskIds) {
  if (!taskIds || taskIds.length === 0) return;

  const { error } = await supabase
    .from('tasks')
    .delete()
    .in('id', taskIds);

  if (error) throw error;
}

export async function updateTaskStatus({ taskId, status }) {
  const now = new Date().toISOString();

  const patch = {
    status,
    updated_at: now,
    completed_at: status === 'DONE' ? now : null,
  };

  const { data, error } = await supabase
    .from('tasks')
    .update(patch)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) throw error;

  const task = data;

  if (task?.date) {
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('status')
      .eq('mentee_id', task.mentee_id)
      .eq('date', task.date);

    if (tasksError) throw tasksError;

    const totalTasks = tasks?.length ?? 0;
    const completedTasks = (tasks ?? []).filter((t) => t.status === 'DONE').length;
    const achievementRate = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    const { error: statsError } = await supabase
      .from('daily_statistics')
      .upsert(
        {
          user_id: task.mentee_id,
          date: task.date,
          total_tasks_count: totalTasks,
          completed_tasks_count: completedTasks,
          achievement_rate: achievementRate,
        },
        { onConflict: 'user_id,date' }
      );

    if (statsError) throw statsError;
  }

  await recalcUserStreak(task?.mentee_id);

  return data;
}