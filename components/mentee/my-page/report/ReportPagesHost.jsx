"use client";

import "./reportPrint.css";

const TASKS_PER_COLUMN_PER_PAGE = 5;

function chunkArray(arr, size) {
  const src = Array.isArray(arr) ? arr : [];
  const result = [];
  for (let i = 0; i < src.length; i += size) {
    result.push(src.slice(i, i + size));
  }
  return result;
}

function expandTaskPages(page) {
  const doneChunks = chunkArray(page?.doneItems || [], TASKS_PER_COLUMN_PER_PAGE);
  const todoChunks = chunkArray(page?.todoItems || [], TASKS_PER_COLUMN_PER_PAGE);
  const count = Math.max(1, doneChunks.length, todoChunks.length);
  const expanded = [];
  for (let i = 0; i < count; i += 1) {
    expanded.push({
      ...page,
      key: `${page.key}-part-${i + 1}`,
      doneItems: doneChunks[i] || [],
      todoItems: todoChunks[i] || [],
      tasksShowTitle: i === 0,
      tasksPartIndex: i + 1,
      tasksPartTotal: count,
    });
  }
  return expanded;
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

function safeText(v, fallback = "-") {
  const s = String(v ?? "").trim();
  return s ? s : fallback;
}

function fmtHmFromIso(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function fmtMinutes(m) {
  const mm = Number(m) || 0;
  if (mm < 60) return `${mm}분`;
  const h = Math.floor(mm / 60);
  const r = mm % 60;
  return r ? `${h}시간 ${r}분` : `${h}시간`;
}

function subjectCssBg(subject) {
  const map = {
    KOR: "hsl(var(--subject-kor) / 0.18)",
    ENG: "hsl(var(--subject-eng) / 0.18)",
    MATH: "hsl(var(--subject-math) / 0.18)",
    ETC: "hsl(var(--subject-etc) / 0.18)",
  };
  return map[subject || "ETC"] || map.ETC;
}

function subjectCssBorder(subject) {
  const map = {
    KOR: "hsl(var(--subject-kor) / 0.32)",
    ENG: "hsl(var(--subject-eng) / 0.32)",
    MATH: "hsl(var(--subject-math) / 0.32)",
    ETC: "hsl(var(--subject-etc) / 0.32)",
  };
  return map[subject || "ETC"] || map.ETC;
}

function PageChrome({ p, children }) {
  return (
    <div className="report-page">
      <div className="report-bg" />
      <div className="report-watermark">{p.watermark || "REPORT"}</div>

      <div className="report-top">
        <div className="report-brand">
          <div className="report-logo" />
          <div className="report-meta">
            <div className="name">{safeText(p.brandName, "설스터디")}</div>
            <div className="tag">{safeText(p.headerTag)}</div>
          </div>
        </div>

        <div className="report-docmeta">
          <div className="report-pill">{safeText(p.pill, "리포트")}</div>
          <div>{safeText(p.metaRightTop)}</div>
          <div>{safeText(p.metaRightBottom)}</div>
        </div>
      </div>

      <div className="report-title">
        <div>
          <h1>{safeText(p.title, "학습 리포트")}</h1>
          <div className="sub">{safeText(p.subtitle)}</div>
        </div>
      </div>

      {p.profileBlock ? (
        <div className="report-profileRow">
          <div className="report-profileCard">
            <div className="report-avatar">
              {p.profileBlock.avatarUrl ? (
                <img alt="avatar" src={p.profileBlock.avatarUrl} />
              ) : (
                <div className="report-avatarFallback" />
              )}
            </div>
            <div className="report-profileMeta">
              <div className="report-profileName">{safeText(p.profileBlock.name, "멘티")}</div>
              <div className="report-profileSub">
                {safeText(p.profileBlock.subLine1, "")}
                {p.profileBlock.subLine2 ? <span> · {p.profileBlock.subLine2}</span> : null}
              </div>
            </div>
          </div>

          <div className="report-kpiCard">
            <div className="report-kpiGrid">
              {(p.profileBlock.kpis || []).map((k) => (
                <div key={k.label} className="report-kpiItem">
                  <div className="label">{k.label}</div>
                  <div className="value">{k.value}</div>
                  {k.hint ? <div className="hint">{k.hint}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {children}

      <div className="report-footer">
        <div>{safeText(p.footerLeft)}</div>
        <div>{safeText(p.footerRight)}</div>
      </div>
    </div>
  );
}

/* -------- Summary Page -------- */

function SummaryPageBody({ p }) {
  const leftBlocks = p.leftBlocks || [];
  const rightBlocks = p.rightBlocks || [];
  const rankIdx = leftBlocks.findIndex((b) => b?.kind === "rankTable");
  const rankBlock = rankIdx >= 0 ? leftBlocks[rankIdx] : null;
  const leftBefore = rankIdx >= 0 ? leftBlocks.slice(0, rankIdx) : leftBlocks;
  const leftAfter = rankIdx >= 0 ? leftBlocks.slice(rankIdx + 1) : [];

  return (
    <div className="report-summaryLayout">
      <div className="report-grid" style={{ marginTop: 0 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leftBefore.map((blk) => (
          <div key={blk.title} className="report-card">
            <h2>{blk.title}</h2>

            {blk.kind === "rankTable" ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th style={{ width: 70 }}>과목</th>
                    <th style={{ width: 90 }}>공부시간</th>
                    <th style={{ width: 70 }}>완료</th>
                    <th style={{ width: 60 }}>완료율</th>
                    <th style={{ width: 60 }}>등급</th>
                  </tr>
                </thead>
                <tbody>
                  {(blk.rows || []).map((r) => (
                    <tr key={r.subject}>
                      <td>{subjectLabel(r.subject)}</td>
                      <td>{r.studyTimeLabel}</td>
                      <td>
                        {r.done}/{r.total}
                      </td>
                      <td>{r.rate}%</td>
                      <td>
                        <span className={`report-tier ${r.tier}`}>{r.tier}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : blk.kind === "insights" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(blk.items || []).map((it) => (
                  <div
                    key={it.label}
                    style={{
                      borderRadius: 16,
                      padding: 10,
                      border: "1px solid hsl(var(--foreground) / 0.10)",
                      background: "hsl(var(--foreground) / 0.02)",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 1000, color: "hsl(var(--foreground) / 0.60)" }}>
                      {it.label}
                    </div>
                    <div style={{ marginTop: 3, fontSize: 14, fontWeight: 1000, letterSpacing: "-0.2px" }}>
                      {it.value}
                    </div>
                    {it.hint ? (
                      <div style={{ marginTop: 2, fontSize: 10, fontWeight: 900, color: "hsl(var(--foreground) / 0.55)" }}>
                        {it.hint}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : blk.kind === "list" ? (
              <ul className="report-list">{(blk.items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
            ) : blk.kind === "text" ? (
              <p style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.75)", lineHeight: 1.35 }}>{blk.text}</p>
            ) : null}
          </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rightBlocks.map((blk) => (
          <div key={blk.title} className="report-card">
            <h2>{blk.title}</h2>

            {blk.kind === "subjectCards" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {(blk.items || []).map((it) => (
                  <div
                    key={it.key}
                    style={{
                      borderRadius: 16,
                      padding: 10,
                      border: "1px solid hsl(var(--foreground) / 0.10)",
                      background: it.bg,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 1000 }}>{it.title}</div>
                    <div style={{ marginTop: 2, fontSize: 14, fontWeight: 1000, letterSpacing: "-0.2px" }}>
                      {it.value}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 10, fontWeight: 900, color: "hsl(var(--foreground) / 0.60)" }}>
                      {it.hint}
                    </div>
                  </div>
                ))}
              </div>
            ) : blk.kind === "list" ? (
              <ul className="report-list">{(blk.items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
            ) : blk.kind === "text" ? (
              <p style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.75)", lineHeight: 1.35 }}>{blk.text}</p>
            ) : null}
          </div>
          ))}
        </div>
      </div>

      {rankBlock ? (
        <div className="report-card report-fullWidthCard" style={{ marginTop: 12 }}>
          <h2>{rankBlock.title}</h2>
          <table className="report-table report-tableWide">
            <thead>
              <tr>
                <th style={{ width: 90 }}>과목</th>
                <th style={{ width: 120 }}>공부시간</th>
                <th style={{ width: 80 }}>완료</th>
                <th style={{ width: 70 }}>완료율</th>
                <th style={{ width: 80 }}>등급</th>
              </tr>
            </thead>
            <tbody>
              {(rankBlock.rows || []).map((r) => (
                <tr key={r.subject}>
                  <td>{subjectLabel(r.subject)}</td>
                  <td>{r.studyTimeLabel}</td>
                  <td>
                    {r.done}/{r.total}
                  </td>
                  <td>{r.rate}%</td>
                  <td>
                    <span className={`report-tier ${r.tier}`}>{r.tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {leftAfter.length ? (
        <div className="report-grid" style={{ marginTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {leftAfter.map((blk) => (
              <div key={blk.title} className="report-card">
                <h2>{blk.title}</h2>

                {blk.kind === "list" ? (
                  <ul className="report-list">{(blk.items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                ) : blk.kind === "text" ? (
                  <p style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.75)", lineHeight: 1.35 }}>{blk.text}</p>
                ) : null}
              </div>
            ))}
          </div>
          <div />
        </div>
      ) : null}
    </div>
  );
}

/* -------- Subject Feedback Page -------- */

function FeedbackCard({ it }) {
  const bg = subjectCssBg(it.subject || "ETC");
  const bd = subjectCssBorder(it.subject || "ETC");
  return (
    <div
      className="report-feedbackCard"
      style={{
        borderRadius: 16,
        border: `1px solid ${bd}`,
        background: bg,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 86,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 1000, color: "hsl(var(--foreground) / 0.78)" }}>{it.date}</div>
        <div style={{ fontSize: 11, fontWeight: 1000, color: "hsl(var(--foreground) / 0.78)" }}>
          {subjectLabel(it.subject)}
        </div>
      </div>
      <div style={{ fontSize: 12, fontWeight: 900, color: "hsl(var(--foreground) / 0.88)", lineHeight: 1.35, whiteSpace: "pre-wrap" }}>
        {safeText(it.content, "(내용 없음)")}
      </div>
    </div>
  );
}

function SubjectFeedbackPageBody({ p }) {
  const groups = p.groups || [];
  return (
    <div className="report-grid full">
      <div className="report-card">
        <h2>과목별 피드백</h2>
        <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 10 }}>
          기간 내 멘토 피드백을 과목별로 카드 형태로 정리했습니다.
        </div>

        {groups.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {groups.map((g) => (
              <div key={g.subject}>
                <div className="report-miniTitle" style={{ marginBottom: 8 }}>
                  {subjectLabel(g.subject)}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(g.items || []).map((it) => (
                    <FeedbackCard key={it.key} it={it} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.55)" }}>(피드백 없음)</div>
        )}
      </div>
    </div>
  );
}

/* -------- Tag Stats Page -------- */

function TagStatsPageBody({ p }) {
  const rows = p.rows || [];
  return (
    <div className="report-grid full">
      <div className="report-card">
        <h2>태그 통계</h2>
        <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 10 }}>
          과제 피드백에 1개 이상 등장한 태그만 집계했습니다.
        </div>

        {rows.length ? (
          <table className="report-table report-tableWide">
            <thead>
              <tr>
                <th style={{ width: 240 }}>태그</th>
                <th style={{ width: 120 }}>등장 횟수</th>
                <th style={{ width: 120 }}>관련 과목 수</th>
                <th style={{ width: 120 }}>주요 과목</th>
                <th style={{ width: 80 }}>비중</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.tagName}>
                  <td style={{ fontWeight: 900 }}>{r.tagName}</td>
                  <td>{r.feedbackCount}</td>
                  <td>{r.subjectCount}</td>
                  <td>{subjectLabel(r.topSubject)}</td>
                  <td>{r.sharePct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.55)" }}>(태그 없음)</div>
        )}
      </div>
    </div>
  );
}

/* -------- Trends Page (SVG charts) -------- */

function BarChart({ labels, values }) {
  const max = Math.max(1, ...values.map((v) => Number(v) || 0));
  const w = 640;
  const h = 240;
  const padX = 26;
  const padY = 18;
  const n = labels.length;
  const gap = 6;
  const barW = (w - padX * 2 - gap * (n - 1)) / n;

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <line x1={padX} y1={h - padY} x2={w - padX} y2={h - padY} stroke="hsl(var(--foreground) / 0.18)" />
      {values.map((v, i) => {
        const vv = Number(v) || 0;
        const bh = Math.round(((h - padY * 2) * vv) / max);
        const x = padX + i * (barW + gap);
        const y = h - padY - bh;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={bh}
              rx="6"
              fill="hsl(var(--primary) / 0.20)"
              stroke="hsl(var(--primary) / 0.35)"
            />
            <text
              x={x + barW / 2}
              y={h - 6}
              fontSize="10"
              textAnchor="middle"
              fill="hsl(var(--foreground) / 0.60)"
              fontWeight="700"
            >
              {labels[i]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function DonutChart({ items }) {
  const total = Math.max(1, items.reduce((a, b) => a + (Number(b.value) || 0), 0));
  const cx = 140;
  const cy = 140;
  const r = 78;
  const stroke = 22;
  const circum = 2 * Math.PI * r;

  const colors = {
    KOR: "hsl(var(--subject-kor) / 0.75)",
    ENG: "hsl(var(--subject-eng) / 0.75)",
    MATH: "hsl(var(--subject-math) / 0.75)",
    ETC: "hsl(var(--subject-etc) / 0.75)",
  };

  let acc = 0;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 12, alignItems: "center" }}>
      <svg width="100%" viewBox="0 0 280 280" style={{ display: "block" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--foreground) / 0.10)" strokeWidth={stroke} />
        {items.map((it) => {
          const v = Number(it.value) || 0;
          const frac = v / total;
          const dash = frac * circum;
          const offset = circum * (1 - acc);
          acc += frac;

          return (
            <circle
              key={it.key}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={colors[it.key] || "hsl(var(--primary) / 0.65)"}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${circum - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          );
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="12" fontWeight="900" fill="hsl(var(--foreground) / 0.80)">
          과목 비중
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="12" fontWeight="900" fill="hsl(var(--foreground) / 0.80)">
          100%
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((it) => {
          const pct = Math.round(((Number(it.value) || 0) / total) * 100);
          return (
            <div key={it.key} style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 11 }}>
              <div style={{ fontWeight: 1000, color: "hsl(var(--foreground) / 0.80)" }}>{subjectLabel(it.key)}</div>
              <div style={{ fontWeight: 900, color: "hsl(var(--foreground) / 0.60)" }}>
                {pct}% · {fmtMinutes(it.value)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TrendsPageBody({ p }) {
  return (
    <div className="report-grid full">
      <div className="report-card">
        <h2>일별 공부시간</h2>
        <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 8 }}>
          기간 내 추이를 막대그래프로 요약했습니다.
        </div>
        <BarChart labels={p.dayChart.labels} values={p.dayChart.values} />
      </div>

      <div className="report-card" style={{ marginTop: 12 }}>
        <h2>과목 비중</h2>
        <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 8 }}>
          전체 공부시간 중 과목별 비중입니다.
        </div>
        <DonutChart items={p.subjectShare} />
      </div>
    </div>
  );
}

/* -------- Tasks Page (big, full page) -------- */

function TaskCard({ item }) {
  const bg = subjectCssBg(item.subject || "ETC");
  const bd = subjectCssBorder(item.subject || "ETC");
  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${bd}`,
        background: bg,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 78,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 1000, color: "hsl(var(--foreground) / 0.78)" }}>{item.date}</div>
        <div style={{ fontSize: 11, fontWeight: 1000, color: "hsl(var(--foreground) / 0.78)" }}>
          {subjectLabel(item.subject)}
        </div>
      </div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 1000,
          letterSpacing: "-0.2px",
          color: "hsl(var(--foreground) / 0.90)",
          lineHeight: 1.25,
        }}
      >
        {item.title}
      </div>
      {item.goal ? (
        <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", lineHeight: 1.3 }}>{item.goal}</div>
      ) : null}
    </div>
  );
}

function TasksPageBody({ p }) {
  return (
    <div className="report-grid full">
      <div className="report-card">
        {p.tasksShowTitle !== false ? (
          <h2>최근 과제 진행</h2>
        ) : (
          <h2>
            최근 과제 진행{" "}
            <span style={{ fontSize: 11, fontWeight: 900, color: "hsl(var(--foreground) / 0.60)" }}>
              ({p.tasksPartIndex}/{p.tasksPartTotal})
            </span>
          </h2>
        )}
        {p.tasksShowTitle !== false ? (
          <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 10 }}>
            완료/미완료를 큼직하게 정리했습니다.
          </div>
        ) : (
          <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.65)", marginBottom: 10 }}>(이어서)</div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <div className="report-miniTitle" style={{ fontSize: 12 }}>
              완료
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {p.doneItems.length ? (
                p.doneItems.map((it) => <TaskCard key={it.key} item={it} />)
              ) : (
                <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
              )}
            </div>
          </div>

          <div>
            <div className="report-miniTitle" style={{ fontSize: 12 }}>
              미완료
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {p.todoItems.length ? (
                p.todoItems.map((it) => <TaskCard key={it.key} item={it} />)
              ) : (
                <div style={{ fontSize: 12, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------- Timetable (lane layout) -------- */

function TimetableDay({ ymd, sessions, totalMinutes, tasksDone, tasksTodo }) {
  const DAY_START = 6 * 60;
  const DAY_END = 26 * 60;
  const SPAN = DAY_END - DAY_START;
  const H = 740;

  const norm = (m) => (m < 360 ? m + 1440 : m);

  const raw = (sessions || [])
    .filter((s) => s.started_at && s.ended_at)
    .map((s) => {
      const st = new Date(s.started_at);
      const en = new Date(s.ended_at);

      const stMin = norm(st.getHours() * 60 + st.getMinutes());
      const enMin = norm(en.getHours() * 60 + en.getMinutes());

      const a = Math.max(DAY_START, stMin);
      const b = Math.min(DAY_END, enMin);

      if (b <= a) return null;

      const subj = s.subject || "ETC";
      const title = String(s.content || "").trim() || "학습";

      return {
        id: s.id,
        a,
        b,
        title,
        leftLabel: `${fmtHmFromIso(s.started_at)}–${fmtHmFromIso(s.ended_at)}`,
        rightLabel: fmtMinutes(s.minutes),
        bg: subjectCssBg(subj),
        bd: subjectCssBorder(subj),
      };
    })
    .filter(Boolean)
    .sort((x, y) => x.a - y.a || x.b - y.b);

  const lanes = [];
  const placed = raw.map((it) => {
    let laneIdx = -1;
    for (let i = 0; i < lanes.length; i += 1) {
      if (it.a >= lanes[i] + 1) {
        laneIdx = i;
        break;
      }
    }
    if (laneIdx === -1) {
      laneIdx = lanes.length;
      lanes.push(it.b);
    } else {
      lanes[laneIdx] = it.b;
    }
    return { ...it, laneIdx };
  });

  const laneCount = Math.min(4, Math.max(1, lanes.length));
  const colGap = 10;
  const colPad = 10;
  const canvasW = 794 - 48 - 48 - 62;
  const usableW = canvasW - colPad * 2 - colGap * (laneCount - 1);
  const colW = usableW / laneCount;

  const blocks = placed.map((it) => {
    const top = ((it.a - DAY_START) / SPAN) * H;
    const height = Math.max(28, ((it.b - it.a) / SPAN) * H);

    const laneIdx = Math.min(laneCount - 1, it.laneIdx);
    const left = colPad + laneIdx * (colW + colGap);

    return {
      id: it.id,
      top,
      height,
      left,
      width: colW,
      title: it.title,
      leftLabel: it.leftLabel,
      rightLabel: it.rightLabel,
      bg: it.bg,
      bd: it.bd,
    };
  });

  const hourMarks = [];
  for (let hh = 6; hh <= 26; hh += 2) {
    const t = (hh - 6) * 60;
    const y = (t / SPAN) * H;
    const labelH = hh <= 23 ? hh : hh - 24;
    hourMarks.push({ y, label: `${String(labelH).padStart(2, "0")}:00` });
  }

  return (
    <div className="report-ttWrap">
      <div className="report-ttHeader">
        <div>
          <div className="d">{ymd}</div>
          <div className="meta">공부 {fmtMinutes(totalMinutes)} · 세션 {raw.length}개</div>
        </div>
        <div className="meta">
          완료 {tasksDone?.length || 0} · 미완료 {tasksTodo?.length || 0}
        </div>
      </div>

      <div className="report-ttGrid">
        <div className="report-ttHours">
          {hourMarks.map((m, i) => (
            <div key={i} className="h" style={{ top: m.y }}>
              {m.label}
            </div>
          ))}
        </div>

        <div className="report-ttCanvas">
          {blocks.map((b) => (
            <div
              key={b.id}
              className="report-ttBlock"
              style={{
                top: b.top,
                height: b.height,
                left: b.left,
                width: b.width,
                background: b.bg,
                borderColor: b.bd,
              }}
            >
              <div className="t">{b.title}</div>
              <div className="s">
                <span>{b.leftLabel}</span>
                <span>{b.rightLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="report-card" style={{ padding: 10, borderRadius: 16 }}>
          <div className="report-miniTitle">완료한 일</div>
          {tasksDone?.length ? (
            <ul className="report-list">{tasksDone.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul>
          ) : (
            <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
          )}
        </div>
        <div className="report-card" style={{ padding: 10, borderRadius: 16 }}>
          <div className="report-miniTitle">미완료한 일</div>
          {tasksTodo?.length ? (
            <ul className="report-list">{tasksTodo.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul>
          ) : (
            <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
          )}
        </div>
      </div>
    </div>
  );
}

function TimetablePageBody({ p }) {
  return (
    <div className="report-grid full" style={{ marginTop: 12 }}>
      <TimetableDay ymd={p.dayYmd} sessions={p.sessions} totalMinutes={p.totalMinutes} tasksDone={p.tasksDone} tasksTodo={p.tasksTodo} />
    </div>
  );
}

/* -------- Host -------- */

export default function ReportPagesHost({ pages, hostRef }) {
  const expandedPages = (pages || []).flatMap((p) => {
    if (p?.type === "tasks") return expandTaskPages(p);
    return [p];
  });

  return (
    <div ref={hostRef} className="report-pages-host" aria-hidden="true">
      {expandedPages.map((p) => (
        <PageChrome key={p.key} p={p}>
          {p.type === "summary" ? (
            <SummaryPageBody p={p} />
          ) : p.type === "trends" ? (
            <TrendsPageBody p={p} />
          ) : p.type === "tasks" ? (
            <TasksPageBody p={p} />
          ) : p.type === "subject-feedback" ? (
            <SubjectFeedbackPageBody p={p} />
          ) : p.type === "tag-stats" ? (
            <TagStatsPageBody p={p} />
          ) : p.type === "timetable-day" ? (
            <TimetablePageBody p={p} />
          ) : null}
        </PageChrome>
      ))}
    </div>
  );
}
