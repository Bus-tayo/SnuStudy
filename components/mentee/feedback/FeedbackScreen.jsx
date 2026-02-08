"use client";

import { useEffect, useState } from "react";
import FeedbackSummaryCard from "./FeedbackSummaryCard";
import { fetchMenteeFeedbacks } from "@/lib/repositories/feedbacksRepo";
import { getAuthSession, resolveAppUserFromSession } from "@/lib/auth/session";
import { Bell } from "lucide-react";

export default function FeedbackScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const { session } = await getAuthSession();
        if (!session) return;
        const user = await resolveAppUserFromSession(session);
        const data = await fetchMenteeFeedbacks({ menteeId: user.appUserId });

        if (alive) setItems(data);
      } catch (e) {
        console.error("Failed to load feedbacks:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="bg-blue-50/50 pb-24 min-h-screen transition-colors duration-300">
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
          최근 일주일 간 <span className="font-bold text-primary">{items.length}건</span>의 피드백
        </div>

        {loading ? (
          <div className="py-10 text-center text-sm text-foreground/60">로딩 중...</div>
        ) : items.length > 0 ? (
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