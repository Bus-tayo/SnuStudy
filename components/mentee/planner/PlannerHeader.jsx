'use client';

import { addDays, format } from 'date-fns';
import { upsertDailyPlannerHeader } from '@/lib/repositories/plannerRepo';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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
    <div className="flex flex-col gap-4 px-5 pt-2 pb-2 bg-white">
      <div className="flex items-center justify-between">
        <button onClick={() => onChangeDate(addDays(date, -1))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-primary transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-lg font-bold text-foreground tracking-tight">
          {format(date, 'yyyy.MM.dd (EEE)', { locale: ko })}
        </span>
        <button onClick={() => onChangeDate(addDays(date, 1))} className="p-1.5 rounded-lg text-muted-foreground hover:bg-slate-100 hover:text-primary transition-colors">
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
      <textarea
        value={headerNote}
        onChange={(e) => onChangeHeaderNote(e.target.value)}
        onBlur={handleBlur}
        placeholder="오늘의 코멘트 / 질문"
        className="w-full min-h-[50px] resize-none rounded-xl border border-border bg-slate-50 p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
      />
    </div>
  );
}
