'use client';

import FeedbackSummaryCard from "./FeedbackSummaryCard";
import { mockFeedbacks } from "@/lib/mock/mockData";
import { Bell } from "lucide-react";

export default function FeedbackScreen() {
  const items = mockFeedbacks();

  return (
    <div className="bg-blue-50/50 pb-24 min-h-full transition-colors duration-300">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100/50 bg-white/80 px-5 py-4 backdrop-blur-md">

      <h1 className="text-xl font-bold text-foreground">
          멘토 피드백
        </h1>
        <div className="relative">
           <Bell className="w-6 h-6 text-foreground" />
           <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-accent rounded-full border-2 border-white"></span>
        </div>
      </header>


      <div className="px-5 py-6 flex flex-col gap-4">
        <div className="text-sm text-muted-foreground">
          최근 <span className="font-bold text-primary">{items.length}건</span>의 피드백
        </div>

        {items.length > 0 ? (
          items.map((f) => (
            <FeedbackSummaryCard key={f.id} item={f} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-white/60 rounded-xl border border-dashed border-blue-200/50">
            <p>도착한 피드백이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}