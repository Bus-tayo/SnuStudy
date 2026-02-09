/**
 * 자정 직후 실행용: 지정된 날짜의 미완료 과제(TODO/WORKING)를 가진 멘티에게 리마인드 알림을 생성합니다.
 *
 * 실행 예시:
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/sendTaskReminders.js 2026-02-08
 *   # 날짜를 생략하면 오늘 날짜(toYmd(new Date())) 기준으로 동작합니다.
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

async function notificationExists({ userId, taskId, date }) {
  const { data, error } = await supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", "TASK_REMINDER")
    .contains("payload_json", { task_id: taskId, date })
    .limit(1);

  if (error) throw error;
  return (data ?? []).length > 0;
}

async function insertReminder({ userId, taskId, title, date }) {
  const body = `${date}에 해야 할 \"${title}\" 과제가 아직 완료되지 않았어요.`;
  const now = new Date().toISOString();

  const { error } = await supabase.from("notifications").insert({
    user_id: userId,
    title: "과제 미완료 리마인드",
    body,
    type: "TASK_REMINDER",
    payload_json: { task_id: taskId, date },
    is_read: false,
    created_at: now,
    sent_at: now,
  });

  if (error) throw error;
}

async function main() {
  const targetDate = process.argv[2] || toYmd(new Date());
  console.log(`🔔 Generating reminders for ${targetDate}`);

  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, mentee_id, title, status, date")
    .eq("date", targetDate)
    .neq("status", "DONE");

  if (error) throw error;

  for (const t of tasks ?? []) {
    try {
      const exists = await notificationExists({ userId: t.mentee_id, taskId: t.id, date: targetDate });
      if (exists) {
        continue;
      }
      await insertReminder({
        userId: t.mentee_id,
        taskId: t.id,
        title: t.title,
        date: targetDate,
      });
      console.log(` - reminder created for user ${t.mentee_id} task ${t.id}`);
    } catch (e) {
      console.error(`Failed for task ${t.id}:`, e.message);
    }
  }

  console.log("✅ Done");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
