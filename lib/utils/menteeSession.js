export function getMenteeIdFromStorage() {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('ss_user_id');
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export function getRoleFromStorage() {
  if (typeof window === 'undefined') return null;
  const role = localStorage.getItem('ss_role');
  return role || null;
}
