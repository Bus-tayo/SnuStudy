import { supabase } from '@/lib/supabase/client';
import { fetchAppUserByAuthUid } from '@/lib/repositories/appUserRepo';

export async function getAuthSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return { session: data?.session ?? null };
}

/**
 * 로그인 세션(uuid) -> public.users(number)로 resolve
 * - 성공 시: { appUserId, role, mentorId, name }
 */
export async function resolveAppUserFromSession(session) {
  if (!session?.user?.id) {
    throw new Error('No auth session user id.');
  }
  const authUid = session.user.id;
  const appUser = await fetchAppUserByAuthUid(authUid);

  return {
    appUserId: appUser.id,
    role: appUser.role,
    mentorId: appUser.mentor_id,
    name: appUser.name,
  };
}

/**
 * 앱 전역에서 쓰는 localStorage 세팅 함수
 */
export function persistAppUserToStorage(appUser) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('ss_user_id', String(appUser.appUserId));
  localStorage.setItem('ss_role', String(appUser.role));
  if (appUser.mentorId != null) localStorage.setItem('ss_mentor_id', String(appUser.mentorId));
  else localStorage.removeItem('ss_mentor_id');

  localStorage.setItem('ss_name', appUser.name ?? '');
}
