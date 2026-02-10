"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getMenteeIdFromStorage } from "@/lib/utils/menteeSession";
import { fetchReportData } from "@/lib/repositories/reportRepo";
import { exportPagesToPdf } from "@/lib/utils/pdfExport";
import ReportPagesHost from "./ReportPagesHost";

function ymd(d) {
  const dt = new Date(d);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDays(dateStr, delta) {
  const dt = new Date(dateStr);
  dt.setDate(dt.getDate() + delta);
  return ymd(dt);
}

function fmtMinutes(m) {
  const mm = Number(m) || 0;
  if (mm < 60) return `${mm}분`;
  const h = Math.floor(mm / 60);
  const r = mm % 60;
  return r ? `${h}시간 ${r}분` : `${h}시간`;
}

function tierFromRate(rate) {
  if (rate >= 90) return "다이아";
  if (rate >= 75) return "플래티넘";
  if (rate >= 60) return "골드";
  if (rate >= 40) return "실버";
  return "브론즈";
}

function subjectLabel(s) {
  switch (s) {
    case "KOR":
      return "국어";
    case "ENG":
      return "영어";
    case "MATH":
      return "수학";
    default:
      return "기타";
  }
}

function subjBg(subject) {
  const map = {
    KOR: "hsl(var(--subject-kor) / 0.12)",
    ENG: "hsl(var(--subject-eng) / 0.12)",
    MATH: "hsl(var(--subject-math) / 0.12)",
    ETC: "hsl(var(--subject-etc) / 0.12)",
  };
  return map[subject || "ETC"] || map.ETC;
}

function cleanText(s) {
  return String(s ?? "")
    .replace(/기관무관/gi, "")
    .replace(/DB\s*current_streak/gi, "")
    .replace(/DB\s*current\s*stack/gi, "")
    .replace(/study_sessions/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export default function ReportGeneratorModal({ open, onClose }) {
  const hostRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [lowRes, setLowRes] = useState(false);
  const [progress, setProgress] = useState({ i: 0, n: 0 });
  const [err, setErr] = useState("");

  const today = useMemo(() => ymd(new Date()), []);
  const [from, setFrom] = useState(addDays(today, -6));
  const [to, setTo] = useState(today);

  const [pages, setPages] = useState([]);

  useEffect(() => {
    if (!open) {
      setErr("");
      setProgress({ i: 0, n: 0 });
      setPages([]);
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/40 flex items-end justify-center p-4">
      <div className="w-full max-w-[420px] rounded-2xl bg-background border border-border shadow-xl overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="text-base font-extrabold tracking-tight">보고서 생성</div>
          <div className="text-xs text-foreground/60 mt-1">
            기간 리포트 PDF (요약 + 차트 + 과제 진행)
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="py-2 rounded-xl border border-border text-sm font-bold"
              onClick={() => {
                setFrom(addDays(today, -6));
                setTo(today);
              }}
            >
              최근 7일
            </button>
            <button
              className="py-2 rounded-xl border border-border text-sm font-bold"
              onClick={() => {
                setFrom(addDays(today, -29));
                setTo(today);
              }}
            >
              최근 30일
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <div className="text-xs text-foreground/70 font-bold">시작</div>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <div className="text-xs text-foreground/70 font-bold">끝</div>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-foreground/80">
            <input
              type="checkbox"
              checked={lowRes}
              onChange={(e) => setLowRes(e.target.checked)}
            />
            저해상도(빠름)
          </label>

          {progress.n ? (
            <div className="text-xs text-foreground/60">
              PDF 생성 중… {progress.i}/{progress.n}
            </div>
          ) : null}

          {err ? (
            <div className="text-xs text-red-500 whitespace-pre-wrap">{err}</div>
          ) : null}

          <div className="flex gap-2">
            <button
              onClick={() => onClose?.()}
              className="flex-1 py-3 rounded-xl border border-border bg-background font-extrabold"
              disabled={loading}
            >
              닫기
            </button>

            <button
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-extrabold disabled:opacity-50"
              onClick={async () => {
                try {
                  setErr("");
                  setLoading(true);
                  setProgress({ i: 0, n: 0 });

                  const menteeId = getMenteeIdFromStorage();
                  if (!menteeId) throw new Error("사용자 정보를 찾지 못했습니다.");

                  const report = await fetchReportData({ menteeId, from, to });

                  const profileName = report.profile?.name ?? "멘티";
                  const rangeLabel = `${report.range.fromYmd} ~ ${report.range.toYmd}`;
                  const createdLabel = `생성일: ${ymd(new Date())}`;

                  const tasks = report.tasks || [];
                  const days = report.range.days || [];
                  const subjects = ["KOR", "ENG", "MATH", "ETC"];

                  const minutesTotal = Number(report.minutesTotal ?? 0);
                  const minutesByDay = report.minutesByDay || {};
                  const minutesBySubject = report.minutesBySubject || {};

                  // best day
                  let bestDay = "-";
                  let bestMin = -1;
                  for (const d of days) {
                    const m = Number(minutesByDay[d] ?? 0);
                    if (m > bestMin) {
                      bestMin = m;
                      bestDay = d;
                    }
                  }

                  const activeDays = days.filter((d) => Number(minutesByDay[d] ?? 0) > 0);
                  const avgPerDay = days.length ? Math.round(minutesTotal / days.length) : 0;
                  const avgActive = activeDays.length ? Math.round(minutesTotal / activeDays.length) : 0;

                  // subject stats for completion table
                  const subjectStats = {};
                  for (const s of subjects) {
                    subjectStats[s] = {
                      total: 0,
                      done: 0,
                      minutes: Number(minutesBySubject[s] ?? 0),
                    };
                  }
                  for (const t of tasks) {
                    const s = t.subject ?? "ETC";
                    subjectStats[s].total += 1;
                    if (t.status === "DONE") subjectStats[s].done += 1;
                  }

                  const subjectRanksRows = subjects.map((s) => {
                    const total = subjectStats[s].total;
                    const dn = subjectStats[s].done;
                    const rate = total ? Math.round((dn / total) * 100) : 0;
                    return {
                      subject: s,
                      total,
                      done: dn,
                      rate,
                      tier: tierFromRate(rate),
                      studyTimeLabel: fmtMinutes(subjectStats[s].minutes),
                    };
                  });

                  // trends chart data (너무 길면 14개로 샘플링)
                  const maxBars = 14;
                  let chartDays = days;
                  if (days.length > maxBars) {
                    const step = Math.ceil(days.length / maxBars);
                    chartDays = days.filter((_, i) => i % step === 0);
                  }
                  const dayLabels = chartDays.map((d) => d.slice(5)); // MM-DD
                  const dayValues = chartDays.map((d) =>
                    Math.round((Number(minutesByDay[d] ?? 0) || 0) / 10)
                  ); // 스케일 약간 축소

                  const subjectShare = subjects.map((s) => ({
                    key: s,
                    value: Number(minutesBySubject[s] ?? 0),
                  }));

                  // tasks big page (최근 18개씩)
                  const doneAll = tasks.filter((t) => t.status === "DONE").slice(-18).reverse();
                  const todoAll = tasks.filter((t) => t.status !== "DONE").slice(-18).reverse();

                  const mapTask = (t) => ({
                    key: `${t.id}`,
                    date: t.date,
                    subject: t.subject ?? "ETC",
                    title: cleanText(t.title),
                    goal: cleanText(t.goal || "").slice(0, 80),
                  });

                  const pagesBuilt = [];

                  // Page 1: Summary
                  pagesBuilt.push({
                    key: "p-summary",
                    type: "summary",
                    watermark: "REPORT",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 요약",
                    pill: "요약",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: `${profileName} 학습 리포트`,
                    subtitle: "기간 동안의 학습량과 진행 상황을 수치 중심으로 정리했습니다.",
                    profileBlock: {
                      avatarUrl: null,
                      name: profileName,
                      subLine1: rangeLabel,
                      subLine2: "",
                      kpis: [
                        { label: "전체 공부 시간", value: fmtMinutes(minutesTotal), hint: "" },
                        { label: "가장 열심히 한 날", value: bestDay, hint: bestMin >= 0 ? `공부 ${fmtMinutes(bestMin)}` : "" },
                        { label: "총 포인트", value: `${Number(report.totalPoints ?? 0).toLocaleString()} P`, hint: "누적" },
                      ],
                    },
                    leftBlocks: [
                      {
                        title: "핵심 지표",
                        kind: "insights",
                        items: [
                          { label: "총 일수", value: `${days.length}일`, hint: "" },
                          { label: "활동일", value: `${activeDays.length}일`, hint: "공부 기록이 있는 날" },
                          { label: "일평균", value: fmtMinutes(avgPerDay), hint: `활동일 평균 ${fmtMinutes(avgActive)}` },
                          { label: "연속 학습(현재)", value: `${Number(report.profile?.current_streak ?? 0)}일`, hint: "" },
                        ],
                      },
                      { title: "과목별 성취 요약", kind: "rankTable", rows: subjectRanksRows },
                      {
                        title: "리포트 안내",
                        kind: "text",
                        text: "이 보고서는 요약(1p) · 학습 추이(2p) · 최근 과제 진행(3p)으로 구성됩니다.",
                      },
                    ],
                    rightBlocks: [
                      {
                        title: "과목별 공부시간",
                        kind: "subjectCards",
                        items: [
                          {
                            key: "kor",
                            title: "국어",
                            value: fmtMinutes(subjectStats.KOR.minutes),
                            hint: `완료 ${subjectStats.KOR.done}/${subjectStats.KOR.total}`,
                            bg: subjBg("KOR"),
                          },
                          {
                            key: "eng",
                            title: "영어",
                            value: fmtMinutes(subjectStats.ENG.minutes),
                            hint: `완료 ${subjectStats.ENG.done}/${subjectStats.ENG.total}`,
                            bg: subjBg("ENG"),
                          },
                          {
                            key: "math",
                            title: "수학",
                            value: fmtMinutes(subjectStats.MATH.minutes),
                            hint: `완료 ${subjectStats.MATH.done}/${subjectStats.MATH.total}`,
                            bg: subjBg("MATH"),
                          },
                          {
                            key: "etc",
                            title: "기타",
                            value: fmtMinutes(subjectStats.ETC.minutes),
                            hint: `완료 ${subjectStats.ETC.done}/${subjectStats.ETC.total}`,
                            bg: subjBg("ETC"),
                          },
                        ],
                      },
                    ],
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "1",
                  });

                  // Page 2: Trends
                  pagesBuilt.push({
                    key: "p-trends",
                    type: "trends",
                    watermark: "TRENDS",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 추이",
                    pill: "차트",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: "학습 추이",
                    subtitle: "일별 공부시간과 과목 비중을 차트로 요약했습니다.",
                    profileBlock: null,
                    dayChart: { labels: dayLabels, values: dayValues },
                    subjectShare,
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "2",
                  });

                  // Page 3: Tasks
                  pagesBuilt.push({
                    key: "p-tasks",
                    type: "tasks",
                    watermark: "TASKS",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 과제",
                    pill: "진행",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: "최근 과제 진행",
                    subtitle: "가독성을 위해 한 페이지 전체에 큼직하게 정리했습니다.",
                    profileBlock: null,
                    doneItems: doneAll.map(mapTask),
                    todoItems: todoAll.map(mapTask),
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "3",
                  });

                  // ✅ 타임테이블 페이지 생성은 제거(요구사항 반영)
                  setPages(pagesBuilt);
                  await new Promise((r) => requestAnimationFrame(r));

                  const host = hostRef.current;
                  if (!host) throw new Error("렌더링 영역을 찾지 못했습니다.");

                  const filename = `study_report_${profileName}_${report.range.fromYmd}_${report.range.toYmd}.pdf`;

                  await exportPagesToPdf({
                    pagesHostEl: host,
                    filename,
                    lowRes,
                    onProgress: (i, n) => setProgress({ i: i + 1, n }),
                  });

                  onClose?.();
                } catch (e) {
                  setErr(e?.message ?? "보고서를 생성하지 못했습니다.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "생성 중…" : "PDF 다운로드"}
            </button>
          </div>

          <div className="text-[11px] text-foreground/60 leading-relaxed">
            
          </div>
        </div>
      </div>

      {pages.length ? <ReportPagesHost pages={pages} hostRef={hostRef} /> : null}
    </div>
  );
}
