"use client";

import { useEffect, useMemo, useState } from "react";
import { Flame } from "lucide-react";

import { supabase } from "@/lib/supabase/client";
import { recalcUserStreak } from "@/lib/repositories/tasksRepo";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";

export default function StreakBanner() {
  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!menteeId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const recalced = await recalcUserStreak(menteeId);
        if (!alive) return;

        if (recalced) {
          setCurrentStreak(Number(recalced?.current ?? 0));
          setMaxStreak(Number(recalced?.max ?? 0));
          return;
        }

        const { data, error } = await supabase
          .from("users")
          .select("current_streak, max_streak")
          .eq("id", menteeId)
          .single();

        if (error) throw error;
        if (!alive) return;

        setCurrentStreak(Number(data?.current_streak ?? 0));
        setMaxStreak(Number(data?.max_streak ?? 0));
      } catch (e) {
        console.error("[StreakBanner/load]", e);
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    function handleFocus() {
      load();
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        load();
      }
    }

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      alive = false;
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [menteeId]);

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center">
          <Flame className="text-orange-500" size={20} />
        </div>
        <div>
          <div className="text-xs text-neutral-500">연속 학습</div>
          {loading ? (
            <div className="text-sm text-neutral-400">불러오는 중...</div>
          ) : (
            <div className="text-lg font-semibold">
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                {currentStreak}일
              </span>
              <span className="text-sm text-neutral-400 ml-2">최고 {maxStreak}일</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
