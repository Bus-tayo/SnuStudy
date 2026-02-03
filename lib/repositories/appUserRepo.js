import { supabase } from '@/lib/supabase/client';

export async function fetchAppUserByAuthUid(authUid) {
  const { data, error } = await supabase
    .from('users') // public.users
    .select('id, name, role, mentor_id, auth_uid')
    .eq('auth_uid', authUid)
    .single();

  if (error) throw error;
  return data;
}
