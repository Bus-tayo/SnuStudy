"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from "@/lib/auth/session";
import { fetchMenteesByMentorId } from "@/lib/repositories/usersRepository";
import { fetchDailyPlanner } from "@/lib/repositories/plannerRepo";
import { fetchTasksByDate } from "@/lib/repositories/tasksRepo";
import { fetchStudySessions } from "@/lib/repositories/studySessionsRepo";

import LogoutButton from "@/components/auth/LogoutButton";
import MenteeCard from "./MenteeCard";

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
    return () => { alive = false; };
  }, [router]);

  useEffect(() => {
    if (!bootstrapped || !mentorId) return;
    reload(mentorId);
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
    const [planner, tasks, sessions] = await Promise.all([
      fetchDailyPlanner({ menteeId, date: today }),
      fetchTasksByDate({ menteeId, date: today }),
      fetchStudySessions({ menteeId, date: today }),
    ]);
    // study_sessions의 started_at/ended_at 차이로 초 합산
    const totalSeconds = sessions.reduce((acc, s) => {
      if (!s.startTime || !s.endTime) return acc;
      const diffMs = new Date(s.endTime) - new Date(s.startTime);
      return acc + Math.max(0, Math.floor(diffMs / 1000));
    }, 0);
    const doneCount = tasks.filter((t) => t.status === "DONE").length;

    return {
      headerNote: planner?.header_note ?? "",
      totalCount: tasks.length,
      doneCount,
      studyMinutes: Math.floor(totalSeconds / 60),
      tasks: tasks.map(t => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subject: t.subject,
        status: t.status
      })),
    };
  }

  const subtitle = useMemo(() => format(today, "yyyy.MM.dd EEE"), []);
  const completedCount = mentees.filter((m) => {
    const s = snapshots[m.id];
    return s && s.totalCount > 0 && s.doneCount === s.totalCount;
  }).length;

  if (errorMsg) return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  if (!bootstrapped || !mentorId) return null;

  return (
    <div className="flex flex-col h-full bg-gray-50 min-h-dvh w-full max-w-[430px] mx-auto shadow-xl">
      <header className="px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500 font-medium mb-0.5">{subtitle}</div>
          <h1 className="text-xl font-bold text-gray-900 leading-none">멘티 관리</h1>
        </div>
        <LogoutButton />
      </header>

      <main className="flex-1 overflow-y-auto pb-10">
        <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between mb-4 sticky top-0 z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm text-gray-800 font-medium">오늘 완료</span>
            <span className="text-lg font-bold text-blue-600 leading-none">{completedCount}</span>
            <span className="text-sm text-gray-400 font-medium">/ {mentees.length}명</span>
          </div>

          <button
            onClick={() => reload(mentorId)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs px-3 py-2 bg-gray-50 border border-gray-200 text-gray-600 rounded-lg active:bg-gray-100 transition-colors disabled:opacity-50 font-medium shadow-sm touch-manipulation"
          >
            <svg
              className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {loading ? "로딩중" : "새로고침"}
          </button>
        </div>

        <div className="px-4 space-y-4">
          {mentees.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400 text-sm">
              <p>담당 멘티가 없습니다.</p>
              <p className="mt-1">Supabase 연결을 확인하세요.</p>
            </div>
          ) : (
            mentees.map((mentee) => (
              <MenteeCard
                key={mentee.id}
                mentee={mentee}
                snapshot={snapshots[mentee.id]}
              />
            ))
          )}
        </div>
      </main>
    </div>
  );
}