'use client';

import { useState } from 'react';
import { ChevronDown, MessageSquareQuote } from 'lucide-react';
import SubjectBadge from '@/components/common/SubjectBadge';

export default function FeedbackSummaryCard({ item }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      onClick={() => setIsOpen(!isOpen)}
      className={`card-base cursor-pointer transition-all duration-300 overflow-hidden bg-white ${isOpen ? 'ring-1 ring-primary shadow-md' : 'hover:border-primary/40'
        }`}
    >
      {/* 1. 카드 헤더 (항상 보임) */}
      <div className="flex items-start justify-between p-4">
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          {/* 상단: 날짜 + 과목 뱃지 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">
              {item.date}
            </span>
            <SubjectBadge subject={item.subject} />
          </div>

          {/* 요약 제목 (item.summary) */}
          <h3 className="text-base font-bold text-foreground truncate pr-2">
            {item.summary}
          </h3>
        </div>

        {/* 펼치기 아이콘 (애니메이션) */}
        <div className={`transition-transform duration-300 mt-1 text-muted-foreground ${isOpen ? 'rotate-180 text-primary' : ''}`}>
          <ChevronDown className="w-5 h-5" />
        </div>
      </div>

      {/* 2. 상세 내용 (펼쳐졌을 때만 보임 - item.body) */}
      <div
        className={`bg-slate-50 px-4 transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[500px] py-4 opacity-100 border-t border-border' : 'max-h-0 py-0 opacity-0'
          }`}
      >
        <div className="flex gap-3">
          <MessageSquareQuote className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {item.body}
          </p>
        </div>

        {/* 장식용 서명 */}
        <div className="mt-3 text-right">
          <span className="text-xs font-semibold text-primary/80">{item.author} 멘토</span>
        </div>
      </div>
    </div>
  );
}