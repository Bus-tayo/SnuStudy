"use client";

import "./reportPrint.css";

function subjectLabel(s) {
  switch (s) {
    case "KOR": return "국어";
    case "ENG": return "영어";
    case "MATH": return "수학";
    default: return "기타";
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
      <div className="report-watermark">{p.watermark || "STUDY REPORT"}</div>

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

        {/* ✅ 고객용: 내부 키워드/뱃지 제거 → badges 없으면 렌더 자체 안 함 */}
        {Array.isArray(p.badges) && p.badges.length ? (
          <div className="report-badges">
            {p.badges.map((b) => (
              <div key={b.text} className={`report-badge ${b.variant || ""}`}>
                {b.text}
              </div>
            ))}
          </div>
        ) : null}
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

function SummaryPageBody({ p }) {
  return (
    <div className="report-grid">
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(p.leftBlocks || []).map((blk) => (
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
                      <td>{r.done}/{r.total}</td>
                      <td>{r.rate}%</td>
                      <td><span className={`report-tier ${r.tier}`}>{r.tier}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : blk.kind === "list2col" ? (
              <div className="report-twoCol">
                <div>
                  <div className="report-miniTitle">한 일</div>
                  <ul className="report-list">{(blk.left || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
                <div>
                  <div className="report-miniTitle">하지 못한 일</div>
                  <ul className="report-list">{(blk.right || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              </div>
            ) : blk.kind === "feedback" ? (
              <ul className="report-list">
                {(blk.items || []).map((f, i) => (
                  <li key={i}>
                    [{subjectLabel(f.subject)}] {f.author}: {f.summary}
                  </li>
                ))}
              </ul>
            ) : blk.kind === "list" ? (
              <ul className="report-list">{(blk.items || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
            ) : blk.kind === "text" ? (
              <p style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.75)", lineHeight: 1.35 }}>{blk.text}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {(p.rightBlocks || []).map((blk) => (
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
  );
}

function SubjectGroupPageBody({ p }) {
  return (
    <div className="report-grid full">
      <div className="report-card">
        <h2>{p.groupTitle}</h2>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {(p.sections || []).map((sec) => (
            <div key={sec.subject} className="report-card" style={{ padding: 12, borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 1000, letterSpacing: "-0.2px" }}>
                  {subjectLabel(sec.subject)}
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: "hsl(var(--foreground) / 0.60)" }}>
                  {sec.meta}
                </div>
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
                <div className="report-card" style={{ padding: 10, borderRadius: 16, background: "hsl(var(--foreground) / 0.02)" }}>
                  <div className="report-miniTitle">과제 (완료)</div>
                  {sec.done?.length ? (
                    <ul className="report-list">
                      {sec.done.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
                  )}
                </div>

                <div className="report-card" style={{ padding: 10, borderRadius: 16, background: "hsl(var(--foreground) / 0.02)" }}>
                  <div className="report-miniTitle">과제 (미완료)</div>
                  {sec.todo?.length ? (
                    <ul className="report-list">
                      {sec.todo.map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
                  )}
                </div>

                <div className="report-card" style={{ padding: 10, borderRadius: 16, background: "hsl(var(--foreground) / 0.02)" }}>
                  <div className="report-miniTitle">멘토 피드백</div>
                  {sec.feedbacks?.length ? (
                    <ul className="report-list">
                      {sec.feedbacks.map((f, i) => (
                        <li key={i}><b>{f.author}</b>: {f.summary}</li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
                  )}
                </div>

                <div className="report-card" style={{ padding: 10, borderRadius: 16, background: "hsl(var(--foreground) / 0.02)" }}>
                  <div className="report-miniTitle">과제 피드백 & 태그</div>
                  {sec.taskFeedbacks?.length ? (
                    <ul className="report-list">
                      {sec.taskFeedbacks.map((tf, i) => (
                        <li key={i}>
                          <div style={{ fontWeight: 1000 }}>
                            {tf.taskTitle} · {tf.mentorName}
                          </div>
                          {tf.tags?.length ? (
                            <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {tf.tags.slice(0, 8).map((t) => (
                                <span key={t.id} className="report-tagPill">{t.name}</span>
                              ))}
                            </div>
                          ) : null}
                          {tf.body ? (
                            <div style={{ marginTop: 6, fontSize: 11, color: "hsl(var(--foreground) / 0.75)", lineHeight: 1.35 }}>
                              {tf.body}
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TimetableDay({ ymd, sessions, totalMinutes, tasksDone, tasksTodo }) {
  const DAY_START = 6 * 60;
  const DAY_END = 26 * 60;
  const SPAN = DAY_END - DAY_START;
  const H = 740; // reportPrint.css height와 맞춤

  const hourMarks = [];
  for (let hh = 6; hh <= 26; hh += 2) {
    const t = (hh - 6) * 60;
    const y = (t / SPAN) * H;
    const labelH = hh <= 23 ? hh : hh - 24;
    hourMarks.push({ y, label: `${String(labelH).padStart(2, "0")}:00` });
  }

  const norm = (m) => (m < 360 ? m + 1440 : m);

  const blocks = (sessions || [])
    .filter((s) => s.started_at && s.ended_at)
    .map((s) => {
      const st = new Date(s.started_at);
      const en = new Date(s.ended_at);

      const stMin = norm(st.getHours() * 60 + st.getMinutes());
      const enMin = norm(en.getHours() * 60 + en.getMinutes());

      const a = Math.max(DAY_START, stMin);
      const b = Math.min(DAY_END, enMin);

      const top = ((a - DAY_START) / SPAN) * H;
      const height = Math.max(22, ((b - a) / SPAN) * H);

      const subj = s.subject || "ETC";
      const title = String(s.content || "").trim() || "학습 세션";

      return {
        id: s.id,
        top,
        height,
        title,
        left: `${fmtHmFromIso(s.started_at)}–${fmtHmFromIso(s.ended_at)}`,
        right: fmtMinutes(s.minutes),
        bg: subjectCssBg(subj),
        bd: subjectCssBorder(subj),
      };
    });

  return (
    <div className="report-ttWrap">
      <div className="report-ttHeader">
        <div>
          <div className="d">{ymd}</div>
          <div className="meta">공부 {fmtMinutes(totalMinutes)} · 세션 {sessions?.length || 0}개</div>
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
                background: b.bg,
                borderColor: b.bd,
              }}
            >
              <div className="t">{b.title}</div>
              <div className="s">
                <span>{b.left}</span>
                <span>{b.right}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="report-card" style={{ padding: 10, borderRadius: 16 }}>
          <div className="report-miniTitle">한 일</div>
          {tasksDone?.length ? (
            <ul className="report-list">{tasksDone.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul>
          ) : (
            <div style={{ fontSize: 11, color: "hsl(var(--foreground) / 0.55)" }}>(없음)</div>
          )}
        </div>
        <div className="report-card" style={{ padding: 10, borderRadius: 16 }}>
          <div className="report-miniTitle">하지 못한 일</div>
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
      <TimetableDay
        ymd={p.dayYmd}
        sessions={p.sessions}
        totalMinutes={p.totalMinutes}
        tasksDone={p.tasksDone}
        tasksTodo={p.tasksTodo}
      />
    </div>
  );
}

export default function ReportPagesHost({ pages, hostRef }) {
  return (
    <div ref={hostRef} className="report-pages-host" aria-hidden="true">
      {pages.map((p) => (
        <PageChrome key={p.key} p={p}>
          {p.type === "summary" ? (
            <SummaryPageBody p={p} />
          ) : p.type === "subject-group" ? (
            <SubjectGroupPageBody p={p} />
          ) : p.type === "timetable-day" ? (
            <TimetablePageBody p={p} />
          ) : null}
        </PageChrome>
      ))}
    </div>
  );
}
