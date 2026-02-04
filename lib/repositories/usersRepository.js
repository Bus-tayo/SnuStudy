// lib/repositories/usersRepository.js
import { supabase } from '@/lib/supabase/client';

export async function fetchAppUserById(id) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, mentor_id, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchMenteesByMentorId(mentorId) {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, role, mentor_id')
    .eq('mentor_id', mentorId)
    .eq('role', 'MENTEE')
    .order('id', { ascending: true });

  if (error) throw error;
  return data ?? [];
}
