const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function makeKey(menteeId, date) {
  return `${menteeId}::${date}`;
}

async function backfillDailyStatistics() {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("mentee_id, date, status");

  if (error) throw error;

  const map = new Map();

  (tasks ?? []).forEach((t) => {
    if (!t?.mentee_id || !t?.date) return;
    const key = makeKey(t.mentee_id, t.date);
    if (!map.has(key)) {
      map.set(key, {
        user_id: t.mentee_id,
        date: t.date,
        total_tasks_count: 0,
        completed_tasks_count: 0,
        total_study_time: 0,
        achievement_rate: 0,
      });
    }
    const row = map.get(key);
    row.total_tasks_count += 1;
    if (t.status === "DONE") row.completed_tasks_count += 1;
  });

  const rows = Array.from(map.values()).map((row) => ({
    ...row,
    achievement_rate:
      row.total_tasks_count === 0
        ? 0
        : Math.round((row.completed_tasks_count / row.total_tasks_count) * 100),
  }));

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error: upsertError } = await supabase
      .from("daily_statistics")
      .upsert(chunk, { onConflict: "user_id,date" });
    if (upsertError) throw upsertError;
  }

  return { total: rows.length };
}

backfillDailyStatistics()
  .then((res) => {
    console.log("Backfill complete:", res);
  })
  .catch((err) => {
    console.error("Backfill failed:", err);
    process.exit(1);
  });
