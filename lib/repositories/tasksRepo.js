import { supabase } from '@/lib/supabase/client';
import { toYmd } from '@/lib/utils/dateIso';

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

export async function addMenteeTask({ menteeId, date, title, subject = 'ETC' }) {
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
    subject, // ✅ 과목 선택 반영
    status: 'TODO',
    is_fixed_by_mentor: false,
    sort_order: nextSort,
    created_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
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
  return data;
}
