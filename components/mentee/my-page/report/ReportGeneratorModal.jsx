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

function formatMinutesFromSeconds(seconds) {
  const s = Number(seconds) || 0;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}분`;
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${hh}시간 ${mm}분`;
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
    case "KOR": return "국어";
    case "ENG": return "영어";
    case "MATH": return "수학";
    default: return "기타";
  }
}

function hslVar(name) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  // theme.css가 "220 80% 28%" 형태라면 hsl(변수)로 쓰는게 정석
  return v ? `hsl(${v})` : "hsl(220 80% 28%)";
}

function cssToRgbTuple(color) {
  const c = document.createElement("canvas");
  c.width = 1;
  c.height = 1;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  const s = ctx.fillStyle;
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return [0, 0, 0];
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

async function chartToDataUrl(config, w = 720, h = 300) {
  const { Chart } = await import("chart.js/auto");
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  const chart = new Chart(ctx, {
    ...config,
    options: {
      ...(config.options || {}),
      responsive: false,
      animation: false,
    },
  });

  // 한 프레임 기다려서 렌더 안정화
  await new Promise((r) => requestAnimationFrame(r));
  const url = canvas.toDataURL("image/png");
  chart.destroy();
  return url;
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
            기간 리포트 PDF (한 일/하지 못한 일/공부시간/연속학습/포인트/과목별 랭크+피드백)
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              className="py-2 rounded-xl border border-border text-sm font-bold"
              onClick={() => { setFrom(addDays(today, -6)); setTo(today); }}
            >
              최근 7일
            </button>
            <button
              className="py-2 rounded-xl border border-border text-sm font-bold"
              onClick={() => { setFrom(addDays(today, -29)); setTo(today); }}
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
                  if (!menteeId) throw new Error("menteeId를 찾지 못했습니다.");

                  const report = await fetchReportData({ menteeId, from, to });

                  const tasks = report.tasks || [];
                  const logs = report.timeLogs || [];

                  // time log 합산 (taskId -> seconds)
                  const secondsByTask = new Map();
                  for (const log of logs) {
                    const tid = log.task_id;
                    const sec = Number(log.duration_seconds ?? 0) || 0;
                    secondsByTask.set(tid, (secondsByTask.get(tid) ?? 0) + sec);
                  }

                  // 일자별 분 합산
                  const dates = [];
                  let cur = report.range.fromYmd;
                  while (cur <= report.range.toYmd) {
                    dates.push(cur);
                    cur = addDays(cur, 1);
                  }

                  const minutesByDate = new Map(dates.map((d) => [d, 0]));
                  for (const t of tasks) {
                    const d = t.date;
                    if (!d) continue;
                    const sec = secondsByTask.get(t.id) ?? 0;
                    minutesByDate.set(d, (minutesByDate.get(d) ?? 0) + Math.round(sec / 60));
                  }

                  const dailyMinutes = dates.map((d) => minutesByDate.get(d) ?? 0);

                  const done = tasks.filter((t) => t.status === "DONE");
                  const notDone = tasks.filter((t) => t.status !== "DONE");

                  const totalSeconds = Array.from(secondsByTask.values()).reduce((a, b) => a + b, 0);

                  const secondsBySubject = { KOR: 0, ENG: 0, MATH: 0, ETC: 0 };
                  for (const t of tasks) {
                    const s = t.subject ?? "ETC";
                    secondsBySubject[s] = (secondsBySubject[s] || 0) + (secondsByTask.get(t.id) ?? 0);
                  }

                  // 과목별 랭크
                  const subjectStats = { KOR: { total: 0, done: 0, seconds: 0 }, ENG: { total: 0, done: 0, seconds: 0 }, MATH: { total: 0, done: 0, seconds: 0 }, ETC: { total: 0, done: 0, seconds: 0 } };
                  for (const t of tasks) {
                    const s = t.subject ?? "ETC";
                    subjectStats[s].total += 1;
                    if (t.status === "DONE") subjectStats[s].done += 1;
                    subjectStats[s].seconds += secondsByTask.get(t.id) ?? 0;
                  }

                  const subjectRanksRows = Object.keys(subjectStats).map((s) => {
                    const total = subjectStats[s].total;
                    const dn = subjectStats[s].done;
                    const rate = total ? Math.round((dn / total) * 100) : 0;
                    return {
                      subject: s,
                      total,
                      done: dn,
                      rate,
                      tier: tierFromRate(rate),
                      studyTimeLabel: formatMinutesFromSeconds(subjectStats[s].seconds),
                    };
                  });

                  // 피드백 정리: 과목별, 멘토별
                  const feedbackBySubject = { KOR: [], ENG: [], MATH: [], ETC: [] };
                  const feedbackByMentor = {};
                  for (const fb of report.feedbacks ?? []) {
                    const s = fb.subject ?? "ETC";
                    if (!feedbackBySubject[s]) feedbackBySubject[s] = [];
                    feedbackBySubject[s].push(fb);

                    const mentor = fb.author ?? "알 수 없음";
                    if (!feedbackByMentor[mentor]) feedbackByMentor[mentor] = [];
                    feedbackByMentor[mentor].push(fb);
                  }

                  // 차트 색
                  const primary = hslVar("--primary");
                  const accent = hslVar("--accent");
                  const [pr, pg, pb] = cssToRgbTuple(primary);
                  const primaryFill = `rgba(${pr}, ${pg}, ${pb}, 0.18)`;

                  // 1) 일자별 공부시간 라인
                  const dailyStudy = await chartToDataUrl(
                    {
                      type: "line",
                      data: {
                        labels: dates.map((d) => d.slice(5)),
                        datasets: [
                          {
                            data: dailyMinutes,
                            borderColor: primary,
                            backgroundColor: primaryFill,
                            fill: true,
                            tension: 0.35,
                            pointRadius: 2,
                          },
                        ],
                      },
                      options: {
                        plugins: { legend: { display: false } },
                        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
                      },
                    },
                    720,
                    300
                  );

                  // 2) 과목별 공부시간 바
                  const studyBySubject = await chartToDataUrl(
                    {
                      type: "bar",
                      data: {
                        labels: ["국어", "영어", "수학", "기타"],
                        datasets: [
                          {
                            data: [
                              Math.round((secondsBySubject.KOR || 0) / 60),
                              Math.round((secondsBySubject.ENG || 0) / 60),
                              Math.round((secondsBySubject.MATH || 0) / 60),
                              Math.round((secondsBySubject.ETC || 0) / 60),
                            ],
                            backgroundColor: [primary, accent, "rgba(234,179,8,.65)", "rgba(100,116,139,.55)"],
                            borderRadius: 10,
                          },
                        ],
                      },
                      options: {
                        plugins: { legend: { display: false } },
                        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
                      },
                    },
                    720,
                    300
                  );

                  // 3) done vs todo 도넛
                  const doneVsTodo = await chartToDataUrl(
                    {
                      type: "doughnut",
                      data: {
                        labels: ["한 일", "하지 못한 일"],
                        datasets: [{ data: [done.length, notDone.length], backgroundColor: [primary, accent], borderWidth: 0 }],
                      },
                      options: { plugins: { legend: { position: "bottom" } }, cutout: "62%" },
                    },
                    520,
                    320
                  );

                  // 총 포인트(기간 무관)
                  const totalPoints = report.totalPoints ?? 0;
                  const totalPointsLabel = `${Number(totalPoints).toLocaleString()} P`;

                  const profileName = report.profile?.name ?? "멘티";
                  const rangeLabel = `${report.range.fromYmd} ~ ${report.range.toYmd}`;

                  // 페이지 구성 (1p로 구성, 필요하면 2p로 쉽게 확장 가능)
                  const page1 = {
                    key: "p1",
                    watermark: "STUDY REPORT",
                    brandName: "설스터디",
                    headerTag: "기간 리포트",
                    pill: "REPORT",
                    metaRightTop: rangeLabel,
                    metaRightBottom: `생성일: ${ymd(new Date())}`,
                    title: `${profileName} 학습 리포트`,
                    subtitle: "일자별 공부시간 · 과목별 랭크/피드백 · 포인트/연속학습/수행현황 요약",
                    badges: [
                      { text: "기간 리포트", variant: "primary" },
                      { text: lowRes ? "LOW-RES" : "HQ", variant: lowRes ? "" : "green" },
                    ],
                    profileBlock: {
                      avatarUrl: null,
                      name: profileName,
                      subLine1: `멘티 ID: ${report.profile?.id ?? "-"}`,
                      subLine2: rangeLabel,
                      kpis: [
                        { label: "전체 공부 시간", value: formatMinutesFromSeconds(totalSeconds) },
                        { label: "연속 학습일", value: `${report.profile?.current_streak ?? 0}일`, hint: "DB current_streak" },
                        { label: "총 포인트", value: totalPointsLabel, hint: "기간 무관" },
                      ],
                    },
                    leftBlocks: [
                      {
                        title: "한 일 / 하지 못한 일",
                        kind: "list2col",
                        left: (done.slice(0, 12).map((t) => `[${t.date}] ${t.title}`)),
                        right: (notDone.slice(0, 12).map((t) => `[${t.date}] ${t.title}`)),
                      },
                      {
                        title: "과목별 랭크",
                        kind: "rankTable",
                        rows: subjectRanksRows,
                      },
                      {
                        title: "멘토 피드백(요약)",
                        kind: "feedback",
                        items: (report.feedbacks || []).slice(0, 10).map((fb) => ({
                          subject: fb.subject ?? "ETC",
                          author: fb.author ?? "알 수 없음",
                          summary: fb.summary ?? fb.content ?? "(내용 없음)",
                        })),
                      },
                    ],
                    rightBlocks: [
                      { title: "일자별 공부시간(분)", kind: "chart", src: dailyStudy },
                      { title: "과목별 공부시간(분)", kind: "chart", src: studyBySubject },
                      { title: "한 일 vs 하지 못한 일", kind: "chart", src: doneVsTodo },
                    ],
                    footerLeft: "설스터디 · Study Report",
                    footerRight: "Page 1 / 1",
                  };

                  setPages([page1]);

                  // host 렌더링 대기
                  await new Promise((r) => requestAnimationFrame(r));

                  const host = hostRef.current;
                  if (!host) throw new Error("pagesHost를 찾지 못했습니다.");

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
            * “총 포인트/과목별 랭크”는 누적 기준으로 표시됩니다. (기간 무관) <br />
            * 차트/폰트 로딩을 기다린 뒤 캡처해서 PDF 깨짐을 최대한 방지합니다.
          </div>
        </div>
      </div>

      {/* PDF 렌더용 숨김 호스트 */}
      {pages.length ? <ReportPagesHost pages={pages} hostRef={hostRef} /> : null}
    </div>
  );
}
