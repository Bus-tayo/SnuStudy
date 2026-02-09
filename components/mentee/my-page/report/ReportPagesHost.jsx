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

export default function ReportPagesHost({ pages, hostRef }) {
  return (
    <div ref={hostRef} className="report-pages-host" aria-hidden="true">
      {pages.map((p) => (
        <div key={p.key} className="report-page">
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
              <div className="report-pill">{safeText(p.pill, "REPORT")}</div>
              <div>{safeText(p.metaRightTop)}</div>
              <div>{safeText(p.metaRightBottom)}</div>
            </div>
          </div>

          <div className="report-title">
            <div>
              <h1>{safeText(p.title, "학습 리포트")}</h1>
              <div className="sub">{safeText(p.subtitle)}</div>
            </div>
            <div className="report-badges">
              {(p.badges || []).map((b) => (
                <div key={b.text} className={`report-badge ${b.variant || ""}`}>
                  {b.text}
                </div>
              ))}
            </div>
          </div>

          {/* 상단 프로필 + KPI 요약 */}
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

          {/* 본문 2컬럼 */}
          <div className="report-grid">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {p.leftBlocks?.map((blk) => (
                <div key={blk.title} className="report-card">
                  <h2>{blk.title}</h2>

                  {blk.kind === "list2col" ? (
                    <div className="report-twoCol">
                      <div>
                        <div className="report-miniTitle">한 일</div>
                        <ul className="report-list">
                          {(blk.left || []).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="report-miniTitle">하지 못한 일</div>
                        <ul className="report-list">
                          {(blk.right || []).map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    </div>
                  ) : blk.kind === "text" ? (
                    <p>{blk.text}</p>
                  ) : blk.kind === "rankTable" ? (
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>과목</th>
                          <th>완료/전체</th>
                          <th>완료율</th>
                          <th>랭크</th>
                          <th>공부시간</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(blk.rows || []).map((r) => (
                          <tr key={r.subject}>
                            <td>{subjectLabel(r.subject)}</td>
                            <td>{r.done}/{r.total}</td>
                            <td>{r.rate}%</td>
                            <td><span className={`report-tier ${r.tier}`}>{r.tier}</span></td>
                            <td>{r.studyTimeLabel}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : blk.kind === "feedback" ? (
                    <ul className="report-list">
                      {(blk.items || []).map((f, i) => (
                        <li key={i}>
                          [{subjectLabel(f.subject)}] {f.author}: {f.summary}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {p.rightBlocks?.map((blk) => (
                <div key={blk.title} className="report-card">
                  <h2>{blk.title}</h2>
                  {blk.kind === "chart" ? (
                    <div className="report-chart">
                      <img alt={blk.title} src={blk.src} />
                    </div>
                  ) : blk.kind === "text" ? (
                    <p>{blk.text}</p>
                  ) : blk.kind === "list" ? (
                    <ul className="report-list">
                      {(blk.items || []).map((x, i) => <li key={i}>{x}</li>)}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <div className="report-footer">
            <div>{safeText(p.footerLeft)}</div>
            <div>{safeText(p.footerRight)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
