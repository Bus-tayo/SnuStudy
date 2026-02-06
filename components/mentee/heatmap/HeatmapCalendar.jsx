"use client";

import { useEffect, useMemo, useState } from "react";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";

import { supabase } from "@/lib/supabase/client";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { toYmd } from "@/lib/utils/dateIso";

const WEEK_STARTS_ON = 1;

export default function HeatmapCalendar() {
  const menteeId = useMemo(() => getMenteeIdFromStorage(), []);
  const [cursor, setCursor] = useState(() => new Date());
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      if (!menteeId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMsg("");
      try {
        const monthStart = startOfMonth(cursor);
        const monthEnd = endOfMonth(cursor);

        const { data, error } = await supabase
          .from("daily_statistics")
          .select("date, total_tasks_count, completed_tasks_count, achievement_rate")
          .eq("user_id", menteeId)
          .gte("date", toYmd(monthStart))
          .lte("date", toYmd(monthEnd));

        if (error) {
          setStatsMap({});
          setErrorMsg("달성률 데이터를 불러오지 못했습니다.");
          return;
        }
        if (!alive) return;

        const map = {};
        (data ?? []).forEach((row) => {
          map[row.date] = row;
        });

        setStatsMap(map);
      } catch (e) {
        setStatsMap({});
        setErrorMsg("달성률 데이터를 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [menteeId, cursor]);

  const days = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: WEEK_STARTS_ON });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: WEEK_STARTS_ON });

    const result = [];
    const d = new Date(gridStart);
    while (d <= gridEnd) {
      result.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return result;
  }, [cursor]);

  function rateToClass(rate) {
    if (rate >= 100) return "bg-blue-700 border border-yellow-400";
    if (rate >= 61) return "bg-blue-500";
    if (rate >= 31) return "bg-blue-300";
    if (rate >= 1) return "bg-blue-100";
    return "bg-gray-100";
  }

  function getRateForDay(day) {
    const key = toYmd(day);
    const row = statsMap[key];
    return Number(row?.achievement_rate ?? 0);
  }

  return (
    <div className="border rounded-lg p-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">월간 달성률</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded"
            onClick={() => setCursor((prev) => addMonths(prev, -1))}
          >
            이전
          </button>
          <div className="text-sm font-medium">{format(cursor, "yyyy.MM")}</div>
          <button
            type="button"
            className="text-xs px-2 py-1 border rounded"
            onClick={() => setCursor((prev) => addMonths(prev, 1))}
          >
            다음
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-neutral-400">불러오는 중...</div>
      ) : errorMsg ? (
        <div className="text-sm text-neutral-500">{errorMsg}</div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((day) => {
            const inMonth = isSameMonth(day, cursor);
            const rate = inMonth ? getRateForDay(day) : 0;
            const cellClass = rateToClass(rate);

            return (
              <div
                key={day.toISOString()}
                className={`rounded-lg h-10 flex items-center justify-center text-xs ${cellClass} ${
                  inMonth ? "text-neutral-900" : "text-neutral-300"
                }`}
              >
                {format(day, "d")}
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-[11px] text-neutral-500">
        <span>0%</span>
        <span className="w-3 h-3 rounded bg-blue-100" />
        <span className="w-3 h-3 rounded bg-blue-300" />
        <span className="w-3 h-3 rounded bg-blue-500" />
        <span className="w-3 h-3 rounded bg-blue-700 border border-yellow-400" />
        <span>100%</span>
      </div>
    </div>
  );
}
