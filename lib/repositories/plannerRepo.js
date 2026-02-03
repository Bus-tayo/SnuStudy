import { supabase } from '@/lib/supabase/client';
import { toYmd } from '@/lib/utils/dateIso';

export async function fetchDailyPlanner({ menteeId, date }) {
  const ymd = toYmd(date);

  const { data, error } = await supabase
    .from('daily_planner')
    .select('*')
    .eq('mentee_id', menteeId)
    .eq('date', ymd)
    .maybeSingle();

  if (error) throw error;
  return data; // 없으면 null
}

export async function upsertDailyPlannerHeader({ menteeId, date, headerNote }) {
  const ymd = toYmd(date);

  // row 존재 여부 확인
  const existing = await fetchDailyPlanner({ menteeId, date });

  if (existing?.id) {
    const { data, error } = await supabase
      .from('daily_planner')
      .update({ header_note: headerNote, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('daily_planner')
    .insert({
      mentee_id: menteeId,
      date: ymd,
      header_note: headerNote,
      // created_at/updated_at은 DB default가 있으면 생략 가능. (없다면 지금처럼 넣어도 됨)
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}
