'use client';

import { addDays, format } from 'date-fns';
import { upsertDailyPlannerHeader } from '@/lib/repositories/plannerRepo';

export default function PlannerHeader({
  menteeId,
  date,
  headerNote,
  onChangeHeaderNote,
  onChangeDate,
  onSaved,
}) {
  async function handleBlur() {
    try {
      await upsertDailyPlannerHeader({
        menteeId,
        date,
        headerNote: headerNote?.trim() ?? '',
      });
      onSaved?.();
    } catch (e) {
      // MVP: UI 최소화. 필요하면 toast로 교체.
      console.error(e);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <button onClick={() => onChangeDate(addDays(date, -1))}>◀</button>
        <span className="font-semibold">{format(date, 'yyyy.MM.dd')}</span>
        <button onClick={() => onChangeDate(addDays(date, 1))}>▶</button>
      </div>

      <textarea
        value={headerNote}
        onChange={(e) => onChangeHeaderNote(e.target.value)}
        onBlur={handleBlur}
        placeholder="오늘의 코멘트 / 질문"
        className="w-full border rounded p-2 text-sm"
      />
    </div>
  );
}
