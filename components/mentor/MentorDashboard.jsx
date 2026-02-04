"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from "@/lib/auth/session";
import { fetchMenteesByMentorId } from "@/lib/repositories/usersRepository";
import { fetchDailyPlanner } from "@/lib/repositories/plannerRepo";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from "@/lib/repositories/timeLogsRepo";

import MenteeCard from "./MenteeCard";
import LogoutButton from "@/components/auth/LogoutButton";

const today = new Date();

export default function MentorDashboard() {
  const router = useRouter();

  const [mentorId, setMentorId] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [mentees, setMentees] = useState([]);
  const [snapshots, setSnapshots] = useState({});

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { session } = await getAuthSession();
        if (!session) {
          router.replace("/login");
          return;
        }
        const appUser = await resolveAppUserFromSession(session);
        persistAppUserToStorage(appUser);

        if (appUser.role !== "MENTOR") {
          router.replace("/login");
          return;
        }

        if (alive) {
          setMentorId(appUser.appUserId);
          setBootstrapped(true);
        }
      } catch (e) {
        console.error("[MentorDashboard/bootstrap]", e);
        setErrorMsg(e?.message ?? "로그인 정보를 확인하지 못했습니다.");
        router.replace("/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  useEffect(() => {
    if (!bootstrapped || !mentorId) return;
    reload(mentorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, mentorId]);

  async function reload(mid) {
    setLoading(true);
    try {
      const menteeList = await fetchMenteesByMentorId(mid);
      setMentees(menteeList);

      const snapEntries = await Promise.all(
        menteeList.map(async (m) => {
          const snap = await buildSnapshot(m.id);
          return [m.id, snap];
        })
      );

      setSnapshots(Object.fromEntries(snapEntries));
      setErrorMsg("");
    } catch (e) {
      console.error("[MentorDashboard/reload]", e);
      setErrorMsg(e?.message ?? "멘티 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function buildSnapshot(menteeId) {
    const [planner, tasks] = await Promise.all([
      fetchDailyPlanner({ menteeId, date: today }),
      fetchTasksByDate({ menteeId, date: today }),
    ]);

    const taskIds = tasks.map((t) => t.id);
    const timeLogs = await fetchTimeLogsForTasksInDay({ taskIds, date: today });
    const secondsByTaskId = sumSecondsByTaskId(timeLogs);
    const totalSeconds = Array.from(secondsByTaskId.values()).reduce((acc, cur) => acc + cur, 0);

    const doneCount = tasks.filter((t) => t.status === "DONE").length;

    return {
      headerNote: planner?.header_note ?? "",
      totalCount: tasks.length,
      doneCount,
      studyMinutes: Math.floor(totalSeconds / 60),
      tasks: tasks.slice(0, 3).map((t) => ({
        id: t.id,
        title: t.title,
        subject: t.subject,
        status: t.status,
        locked: t.is_fixed_by_mentor === true,
      })),
    };
  }

  const subtitle = useMemo(() => format(today, "yyyy.MM.dd EEE"), []);

  if (errorMsg) {
    return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  }

  if (!bootstrapped || !mentorId) return null;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <div className="text-xs text-neutral-500">{subtitle}</div>
          <div className="text-lg font-semibold">멘토 홈</div>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">담당 멘티 {mentees.length}명</div>
          <button
            onClick={() => reload(mentorId)}
            className="text-xs px-3 py-1 border rounded disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "새로고침..." : "새로고침"}
          </button>
        </div>

        {mentees.length === 0 ? (
          <div className="text-sm text-neutral-500 border rounded p-3">
            아직 담당 멘티가 없습니다. Supabase `users.mentor_id`를 연결하세요.
          </div>
        ) : (
          <div className="space-y-3">
            {mentees.map((m) => (
              <MenteeCard key={m.id} mentee={m} snapshot={snapshots[m.id]} date={today} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
