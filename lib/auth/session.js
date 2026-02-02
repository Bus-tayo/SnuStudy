// lib/auth/session.js
import { supabase } from '@/lib/supabase/client';

export async function getAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return { session: null, error };
  return { session: data.session, error: null };
}

export function getAppUserFromSession(session) {
  const user = session?.user || null;
  const meta = user?.user_metadata || {};
  const appUserId = meta.app_user_id ?? null;
  const role = meta.role ?? null;
  const name = meta.name ?? null;

  return { user, appUserId, role, name };
}
