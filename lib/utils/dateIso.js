export function toYmd(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// text 컬럼에 넣을 ISO (KST 보정은 "문자열"이므로, MVP에서는 local time 기반 ISO 사용)
export function rangeIsoForDay(date) {
  const d = new Date(date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);
  const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0);
  return { startIso: start.toISOString(), endIso: end.toISOString() };
}
