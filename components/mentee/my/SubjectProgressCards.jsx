"use client";

import { useEffect, useMemo, useState } from "react";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { supabase } from "@/lib/supabase/client";
import { toYmd } from "@/lib/utils/dateIso";
import { fetchTotalPoints } from "@/lib/repositories/pointsRepo";

const SUBJECT_LABEL = {
  KOR: "국어",
  ENG: "영어",
  MATH: "수학",
  ETC: "기타",
};

function tierFromRate(rate) {
  if (rate >= 90) return "DIAMOND";
  if (rate >= 75) return "PLATINUM";
  if (rate >= 60) return "GOLD";
  if (rate >= 40) return "SILVER";
  return "BRONZE";
}

function tierLabel(tier) {
  switch (tier) {
    case "DIAMOND": return "다이아";
    case "PLATINUM": return "플래티넘";
    case "GOLD": return "골드";
    case "SILVER": return "실버";
    default: return "브론즈";
  }
}

function subjectHslVar(subject) {
  switch (subject) {
    case "KOR": return "hsl(var(--subject-kor))";
    case "ENG": return "hsl(var(--subject-eng))";
    case "MATH": return "hsl(var(--subject-math))";
    default: return "hsl(var(--subject-etc))";
  }
}

async function fetchSubjectRates30d(menteeId) {
  const today = new Date();
  const from = new Date(today);
  from.setDate(from.getDate() - 29);

  const fromYmd = toYmd(from);
  const toYmdStr = toYmd(today);

  const { data, error } = await supabase
    .from("tasks")
    .select("subject,status")
    .eq("mentee_id", menteeId)
    .gte("date", fromYmd)
    .lte("date", toYmdStr);

  if (error) throw error;

  const base = { KOR: { total: 0, done: 0 }, ENG: { total: 0, done: 0 }, MATH: { total: 0, done: 0 }, ETC: { total: 0, done: 0 } };

  for (const row of data ?? []) {
    const s = row?.subject ?? "ETC";
    if (!base[s]) base[s] = { total: 0, done: 0 };
    base[s].total += 1;
    if (row?.status === "DONE") base[s].done += 1;
  }

  const out = {};
  for (const k of Object.keys(base)) {
    const total = base[k].total;
    const done = base[k].done;
    const rate = total === 0 ? 0 : Math.round((done / total) * 100);
    out[k] = { rate, total, done, tier: tierFromRate(rate) };
  }
  return out;
}

function PointsCard({ points, loading }) {
  return (
    <div className="card-base p-3 flex items-center justify-between">
      <div>
        <div className="text-xs text-foreground/60">보유 포인트</div>
        <div className="text-lg font-extrabold">
          {loading ? "…" : `${points.toLocaleString()} P`}
        </div>
      </div>
      <div className="badge-base bg-secondary text-secondary-foreground border-border">
        게임처럼 쌓아보자
      </div>
    </div>
  );
}

export default function SubjectProgressCards(props) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [rates, setRates] = useState(null);
  const [points, setPoints] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(true);

  // menteeId 결정 (prop이 우선, 없으면 스토리지)
  const [resolvedMenteeId, setResolvedMenteeId] = useState(props.menteeId || null);

  useEffect(() => {
    if (props.menteeId) {
      setResolvedMenteeId(props.menteeId);
    } else {
      const stored = getMenteeIdFromStorage();
      setResolvedMenteeId(stored);
    }
  }, [props.menteeId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr("");
        setLoading(true);
        if (!resolvedMenteeId) {
          if (props.menteeId === undefined && !getMenteeIdFromStorage()) {
            throw new Error("로그인이 필요합니다.");
          }
          return;
        }

        const r = await fetchSubjectRates30d(resolvedMenteeId);
        if (!alive) return;
        setRates(r);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message ?? "과목별 달성률을 불러오지 못했습니다.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [resolvedMenteeId, props.menteeId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setPointsLoading(true);
        if (!resolvedMenteeId) return;
        const total = await fetchTotalPoints({ menteeId: resolvedMenteeId });
        if (!alive) return;
        setPoints(Number(total) || 0);
      } finally {
        if (alive) setPointsLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [resolvedMenteeId]);

  const entries = useMemo(() => {
    const r = rates ?? {};
    const keys = ["KOR", "ENG", "MATH", "ETC"];
    return keys.map((k) => ({ subject: k, ...(r[k] ?? { rate: 0, tier: "BRONZE", total: 0, done: 0 }) }));
  }, [rates]);

  return (
    <div className="space-y-3">
      <PointsCard points={points} loading={pointsLoading} />

      <div className="flex items-end justify-between">
        <div className="text-sm font-extrabold">과목별 달성률</div>
        <div className="text-xs text-foreground/60">최근 30일</div>
      </div>

      {err ? <div className="text-sm text-red-600">{err}</div> : null}

      <div className="grid grid-cols-2 gap-2">
        {entries.map((it) => {
          const color = subjectHslVar(it.subject);
          return (
            <div
              key={it.subject}
              className="card-base p-3 space-y-2 relative group"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-foreground/60">{SUBJECT_LABEL[it.subject] ?? it.subject}</div>
                <div className="badge-base border-border bg-background" style={{ borderColor: color, color }}>
                  {tierLabel(it.tier)}
                </div>
              </div>

              <div className="text-xl font-extrabold">{loading ? "…" : `${it.rate}%`}</div>

              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.max(0, Math.min(100, it.rate))}%`, background: color }}
                />
              </div>

              <div className="flex items-center justify-between mt-1">
                <div className="text-xs text-foreground/60">
                  {it.done}/{it.total} 완료
                </div>

                {props.onClickSubject && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      props.onClickSubject(it.subject);
                    }}
                    className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-semibold"
                  >
                    피드백 작성하기
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
