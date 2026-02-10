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
    case "KOR": return "국어";
    case "ENG": return "영어";
    case "MATH": return "수학";
    default: return "기타";
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
            기간 리포트 PDF (요약 + 과목별 상세 + 날짜별 타임테이블 전체)
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

                  const profileName = report.profile?.name ?? "멘티";
                  const rangeLabel = `${report.range.fromYmd} ~ ${report.range.toYmd}`;
                  const createdLabel = `생성일: ${ymd(new Date())}`;

                  const tasks = report.tasks || [];
                  const feedbacks = report.feedbacks || [];
                  const taskFeedbacks = report.taskFeedbacks || [];

                  const subjects = ["KOR", "ENG", "MATH", "ETC"];

                  // DONE/TODO
                  const doneAll = tasks.filter((t) => t.status === "DONE");
                  const todoAll = tasks.filter((t) => t.status !== "DONE");

                  // subject stats
                  const subjectStats = {};
                  for (const s of subjects) subjectStats[s] = { total: 0, done: 0, minutes: 0 };

                  for (const t of tasks) {
                    const s = t.subject ?? "ETC";
                    subjectStats[s].total += 1;
                    if (t.status === "DONE") subjectStats[s].done += 1;
                  }
                  for (const s of subjects) {
                    subjectStats[s].minutes = report.minutesBySubject?.[s] ?? 0;
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

                  // 요약 피드백(최신 8개)
                  const feedbackHighlights = feedbacks
                    .slice()
                    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
                    .slice(-8)
                    .map((fb) => ({
                      subject: fb.subject ?? "ETC",
                      author: fb.author ?? "알 수 없음",
                      summary: cleanText(fb.summary || fb.body || "(내용 없음)").slice(0, 140),
                    }));

                  // 과제 피드백+태그(최신 6개)
                  const taskFeedbackHighlights = taskFeedbacks
                    .slice()
                    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))
                    .slice(-6)
                    .map((tf) => {
                      const tags = (tf.tags || []).map((t) => t.name).slice(0, 6).join(", ");
                      const head = `${tf.task_title} · ${tf.mentor_name}`;
                      const body = cleanText(tf.body || "").slice(0, 120);
                      return `${head}${tags ? ` · [${tags}]` : ""} — ${body}`;
                    });

                  const subjectSections = (subjList) => subjList.map((s) => {
                    const sTasks = tasks.filter((t) => (t.subject ?? "ETC") === s);
                    const sDone = sTasks.filter((t) => t.status === "DONE");
                    const sTodo = sTasks.filter((t) => t.status !== "DONE");

                    const sFeedbacks = feedbacks
                      .filter((fb) => (fb.subject ?? "ETC") === s)
                      .slice(-4)
                      .map((fb) => ({
                        author: fb.author ?? "알 수 없음",
                        summary: cleanText(fb.summary || fb.body || "(내용 없음)").slice(0, 180),
                      }));

                    const sTaskFeedbacks = taskFeedbacks
                      .filter((tf) => (tf.subject ?? "ETC") === s)
                      .slice(-3)
                      .map((tf) => ({
                        taskTitle: tf.task_title,
                        mentorName: tf.mentor_name,
                        body: cleanText(tf.body || "").slice(0, 220),
                        tags: (tf.tags || []).slice(0, 8),
                      }));

                    const meta = `공부 ${fmtMinutes(subjectStats[s].minutes)} · 완료 ${sDone.length}/${sTasks.length}`;

                    return {
                      subject: s,
                      meta,
                      done: sDone.slice(-6).map((t) => `[${t.date}] ${t.title}`),
                      todo: sTodo.slice(-6).map((t) => `[${t.date}] ${t.title}`),
                      feedbacks: sFeedbacks,
                      taskFeedbacks: sTaskFeedbacks,
                    };
                  });

                  const pagesBuilt = [];

                  // Page 1: Summary (내부 용어 제거 / 텍스트 클리핑 방지 위해 항목 수 제한)
                  pagesBuilt.push({
                    key: "p-summary",
                    type: "summary",
                    watermark: "STUDY REPORT",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 요약",
                    pill: "리포트",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: `${profileName} 학습 리포트`,
                    subtitle: "기간 동안의 학습 기록을 요약하고, 과목별 수행/피드백을 정리한 보고서입니다.",
                    badges: [],
                    profileBlock: {
                      avatarUrl: null,
                      name: profileName,
                      subLine1: `멘티 ID: ${report.profile?.id ?? "-"}`,
                      subLine2: rangeLabel,
                      kpis: [
                        { label: "전체 공부 시간", value: fmtMinutes(report.minutesTotal ?? 0), hint: "타임테이블 기준" },
                        { label: "연속 학습일(최대)", value: `${report.maxConsecutiveInRange ?? 0}일`, hint: "기간 내 최대 연속" },
                        { label: "총 포인트", value: `${Number(report.totalPoints ?? 0).toLocaleString()} P`, hint: "누적 포인트" },
                      ],
                    },
                    leftBlocks: [
                      { title: "과목별 성취 요약", kind: "rankTable", rows: subjectRanksRows },
                      {
                        title: "최근 과제 진행 상황",
                        kind: "list2col",
                        left: doneAll.slice(-10).map((t) => `[${t.date}] ${t.title}`),
                        right: todoAll.slice(-10).map((t) => `[${t.date}] ${t.title}`),
                      },
                      { title: "멘토 피드백 하이라이트", kind: "feedback", items: feedbackHighlights },
                    ],
                    rightBlocks: [
                      {
                        title: "과목별 공부시간",
                        kind: "subjectCards",
                        items: [
                          { key: "kor", title: "국어", value: fmtMinutes(subjectStats.KOR.minutes), hint: `완료 ${subjectStats.KOR.done}/${subjectStats.KOR.total}`, bg: subjBg("KOR") },
                          { key: "eng", title: "영어", value: fmtMinutes(subjectStats.ENG.minutes), hint: `완료 ${subjectStats.ENG.done}/${subjectStats.ENG.total}`, bg: subjBg("ENG") },
                          { key: "math", title: "수학", value: fmtMinutes(subjectStats.MATH.minutes), hint: `완료 ${subjectStats.MATH.done}/${subjectStats.MATH.total}`, bg: subjBg("MATH") },
                          { key: "etc", title: "기타", value: fmtMinutes(subjectStats.ETC.minutes), hint: `완료 ${subjectStats.ETC.done}/${subjectStats.ETC.total}`, bg: subjBg("ETC") },
                        ],
                      },
                      {
                        title: "과제 피드백 & 태그 하이라이트",
                        kind: "list",
                        items: taskFeedbackHighlights.length ? taskFeedbackHighlights : ["(기간 내 과제 피드백 없음)"],
                      },
                      {
                        title: "리포트 구성",
                        kind: "text",
                        text: `이후 페이지에는 과목별 상세 정리와, 기간 내 모든 날짜의 타임테이블이 포함됩니다. (총 ${report.range.days?.length || 0}일)`,
                      },
                    ],
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "Page 1",
                  });

                  // Page 2: 국어/영어
                  pagesBuilt.push({
                    key: "p-subjects-1",
                    type: "subject-group",
                    watermark: "SUBJECTS",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 과목별",
                    pill: "과목",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: "과목별 상세 (1/2)",
                    subtitle: "국어 · 영어",
                    badges: [],
                    groupTitle: "국어 / 영어",
                    sections: subjectSections(["KOR", "ENG"]),
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "Page 2",
                  });

                  // Page 3: 수학/기타
                  pagesBuilt.push({
                    key: "p-subjects-2",
                    type: "subject-group",
                    watermark: "SUBJECTS",
                    brandName: "설스터디",
                    headerTag: "학습 리포트 · 과목별",
                    pill: "과목",
                    metaRightTop: rangeLabel,
                    metaRightBottom: createdLabel,
                    title: "과목별 상세 (2/2)",
                    subtitle: "수학 · 기타",
                    badges: [],
                    groupTitle: "수학 / 기타",
                    sections: subjectSections(["MATH", "ETC"]),
                    footerLeft: "설스터디 · 학습 리포트",
                    footerRight: "Page 3",
                  });

                  // Page 4~: 모든 날짜 타임테이블
                  const days = report.range.days || [];
                  for (let idx = 0; idx < days.length; idx += 1) {
                    const d = days[idx];
                    const sessions = report.sessionsByDay?.[d] || [];
                    const totalMinutes = report.minutesByDay?.[d] ?? 0;

                    const dayTasks = tasks.filter((t) => t.date === d);
                    const dayDone = dayTasks
                      .filter((t) => t.status === "DONE")
                      .map((t) => `${subjectLabel(t.subject)} · ${t.title}`);

                    const dayTodo = dayTasks
                      .filter((t) => t.status !== "DONE")
                      .map((t) => `${subjectLabel(t.subject)} · ${t.title}`);

                    pagesBuilt.push({
                      key: `p-day-${d}`,
                      type: "timetable-day",
                      watermark: "TIMETABLE",
                      brandName: "설스터디",
                      headerTag: "학습 리포트 · 타임테이블",
                      pill: "일일",
                      metaRightTop: d,
                      metaRightBottom: createdLabel,
                      title: `${d} 타임테이블`,
                      subtitle: "하루 학습 기록을 시간대별로 정리했습니다.",
                      badges: [],
                      dayYmd: d,
                      sessions,
                      totalMinutes,
                      tasksDone: dayDone,
                      tasksTodo: dayTodo,
                      footerLeft: "설스터디 · 학습 리포트",
                      footerRight: `Page ${idx + 4}`,
                    });
                  }

                  setPages(pagesBuilt);
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
            * 공부시간은 타임테이블에 기록된 시간 기준으로 집계됩니다. <br />
            * 기간이 길면 날짜별 타임테이블 페이지 수가 늘어납니다.
          </div>
        </div>
      </div>

      {pages.length ? <ReportPagesHost pages={pages} hostRef={hostRef} /> : null}
    </div>
  );
}
