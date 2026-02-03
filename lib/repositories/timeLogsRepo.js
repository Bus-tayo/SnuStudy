import { supabase } from '@/lib/supabase/client';
import { rangeIsoForDay } from '@/lib/utils/dateIso';

export async function fetchTimeLogsForTasksInDay({ taskIds, date }) {
  if (!taskIds?.length) return [];

  const { startIso, endIso } = rangeIsoForDay(date);

  const { data, error } = await supabase
    .from('task_time_logs')
    .select('*')
    .in('task_id', taskIds)
    .gte('started_at', startIso)
    .lt('started_at', endIso);

  if (error) throw error;
  return data ?? [];
}

export function sumSecondsByTaskId(timeLogs) {
  const map = new Map();
  for (const log of timeLogs ?? []) {
    const tid = log.task_id;
    const sec = Number(log.duration_seconds ?? 0) || 0;
    map.set(tid, (map.get(tid) ?? 0) + sec);
  }
  return map; // taskId -> seconds
}

/**
 * MVP에서는 "수동 입력(분)"을 하루에 1개 값으로 취급:
 * - 해당 task에 대해 그 날짜 구간 내 MANUAL 로그를 삭제 후
 * - 1개의 MANUAL 로그로 재삽입 (덮어쓰기)
 */
export async function overwriteManualMinutesForTaskInDay({ taskId, date, minutes }) {
  const { startIso, endIso } = rangeIsoForDay(date);

  // 1) 기존 MANUAL 로그 삭제
  const { error: delErr } = await supabase
    .from('task_time_logs')
    .delete()
    .eq('task_id', taskId)
    .eq('source', 'MANUAL')
    .gte('started_at', startIso)
    .lt('started_at', endIso);

  if (delErr) throw delErr;

  const now = new Date().toISOString();

  // 2) 0분이면 “로그 없음”으로 처리 (삭제만 하고 종료)
  const m = Number(minutes);
  if (!Number.isFinite(m) || m <= 0) return;

  const { error: insErr } = await supabase
    .from('task_time_logs')
    .insert({
      task_id: taskId,
      source: 'MANUAL',
      started_at: now,        // text
      ended_at: now,          // text nullable이지만 넣어도 됨
      duration_seconds: Math.floor(m * 60),
      created_at: now,
      // id는 자동증가면 생략
    });

  if (insErr) throw insErr;
}
