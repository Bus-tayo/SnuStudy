import { supabase } from '@/lib/supabase/client';
import { toYmd } from '@/lib/utils/dateIso';

export async function fetchCalendarEventsByRange({ menteeId, from, to }) {
  const fromYmd = toYmd(from);
  const toYmdStr = toYmd(to);

  const { data, error } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('mentee_id', menteeId)
    .lte('start_date', toYmdStr)
    .or(`end_date.gte.${fromYmd},end_date.is.null`)
    .order('start_date', { ascending: true })
    .order('id', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
