/**
 * 아침 7~8시 등 일정한 시간에 실행: 특정 날짜의 할 일 목록을 요약해 알림으로 보냅니다.
 *
 * 예시:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/sendTodayTaskDigest.js 2026-02-08
 *   # 날짜를 생략하면 오늘 기준으로 전송합니다.
 */

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

function toYmd(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

async function upsertDigest({ userId, date, titles }) {
  const summary = titles.slice(0, 5).join(" · ");
  const overflow = titles.length > 5 ? ` 외 ${titles.length - 5}건` : "";
  const body = `[${date}] 오늘 해야 할 일: ${summary}${overflow}`;
  const now = new Date().toISOString();

  // 중복 방지: 같은 날짜의 TASK_TODAY 알림이 이미 있으면 건너뛰기
  const { data: existing, error: findErr } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "TASK_TODAY")
    .contains("payload_json", { date })
    .limit(1);
  if (findErr) throw findErr;
  if ((existing ?? []).length > 0) return false;

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: "오늘의 할 일 요약",
    body,
    type: "TASK_TODAY",
    payload_json: { date },
    is_read: false,
    created_at: now,
    sent_at: now,
  });
  if (error) throw error;
  return true;
}

async function main() {
  const targetDate = process.argv[2] || toYmd(new Date());
  console.log(`📬 Sending task digest for ${targetDate}`);

  const { data: rows, error } = await supabase
    .from("tasks")
    .select("mentee_id,title,date")
    .eq("date", targetDate);
  if (error) throw error;

  const grouped = new Map();
  for (const row of rows ?? []) {
    if (!grouped.has(row.mentee_id)) grouped.set(row.mentee_id, []);
    grouped.get(row.mentee_id).push(row.title);
  }

  for (const [userId, titles] of grouped.entries()) {
    try {
      const created = await upsertDigest({ userId, date: targetDate, titles });
      if (created) console.log(` - digest created for user ${userId}`);
    } catch (e) {
      console.error(`Failed for user ${userId}:`, e.message);
    }
  }

  console.log("✅ Done");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
