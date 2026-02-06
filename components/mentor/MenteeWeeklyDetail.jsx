"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addWeeks, format, startOfWeek } from "date-fns";

import { getAuthSession, resolveAppUserFromSession, persistAppUserToStorage } from "@/lib/auth/session";
import { fetchAppUserById } from "@/lib/repositories/usersRepository";
import { fetchDailyPlanner } from "@/lib/repositories/plannerRepo";
import { fetchTasksByDate, addMentorTask } from "@/lib/repositories/tasksRepo";
import { fetchTimeLogsForTasksInDay, sumSecondsByTaskId } from "@/lib/repositories/timeLogsRepo";

const SUBJECT_OPTIONS = [
  { value: "KOR", label: "국어" },
  { value: "ENG", label: "영어" },
  { value: "MATH", label: "수학" },
  { value: "ETC", label: "기타" },
];

export default function MenteeWeeklyDetail({ menteeId }) {
  const router = useRouter();

  const [mentorId, setMentorId] = useState(null);
  const [mentee, setMentee] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [days, setDays] = useState([]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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
        const menteeInfo = await fetchAppUserById(menteeId);
        if (!menteeInfo) {
          setErrorMsg("멘티를 찾을 수 없습니다.");
          return;
        }

        if (alive) {
          setMentorId(appUser.appUserId);
          setMentee(menteeInfo);
          setBootstrapped(true);
        }
      } catch (e) {
        console.error("[MenteeWeeklyDetail/bootstrap]", e);
        setErrorMsg(e?.message ?? "권한 또는 사용자 정보를 확인할 수 없습니다.");
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, menteeId]);

  useEffect(() => {
    if (!bootstrapped || !menteeId || !mentorId) return;
    loadWeek(weekStart);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapped, menteeId, mentorId, weekStart]);

  async function loadWeek(base) {
    setLoading(true);
    try {
      const ds = await Promise.all(
        Array.from({ length: 7 }).map(async (_, idx) => {
          const date = new Date(base);
          date.setDate(base.getDate() + idx);

          const [planner, tasks] = await Promise.all([
            fetchDailyPlanner({ menteeId, date }),
            fetchTasksByDate({ menteeId, date }),
          ]);

          const taskIds = tasks.map((t) => t.id);
          const logs = await fetchTimeLogsForTasksInDay({ taskIds, date });
          const map = sumSecondsByTaskId(logs);

          return {
            date,
            planner,
            tasks,
            minutesByTaskId: new Map(
              Array.from(map.entries()).map(([k, v]) => [k, Math.floor(v / 60)])
            ),
            onAddTask: async (title, subject, cb) => {
              const t = title?.trim();
              if (!t) return;
              try {
                await addMentorTask({
                  mentorId,
                  menteeId,
                  date,
                  title: t,
                  subject,
                });
                cb?.();
                await loadWeek(base);
              } catch (e) {
                console.error('[MenteeWeeklyDetail/addTask]', e);
                alert(e?.message ?? '할 일 추가 실패');
              }
            },
          };
        })
      );
      setDays(ds);
      setErrorMsg("");
    } catch (e) {
      console.error("[MenteeWeeklyDetail/loadWeek]", e);
      setErrorMsg(e?.message ?? "주간 데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const weekLabel = useMemo(() => {
    const end = new Date(weekStart);
    end.setDate(weekStart.getDate() + 6);
    return `${format(weekStart, "yyyy.MM.dd")} - ${format(end, "MM.dd")}`;
  }, [weekStart]);

  if (errorMsg) return <div className="p-4 text-sm text-red-600">{errorMsg}</div>;
  if (!bootstrapped || !mentee) return null;

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="px-4 py-3 border-b">
        <div className="text-xs text-neutral-500">{weekLabel}</div>
        <div className="text-lg font-semibold">{mentee.name} 주간 기록</div>
      </header>

      <main className="flex-1 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            className="px-2 py-1 border rounded text-sm"
            disabled={loading}
          >
            이전 주
          </button>
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="px-2 py-1 border rounded text-sm"
            disabled={loading}
          >
            다음 주
          </button>
          {loading ? <span className="text-xs text-neutral-500">불러오는 중...</span> : null}
        </div>

        <div className="space-y-3">
          {days.map((d) => (
            <DayCard key={d.date.toISOString()} day={d} />
          ))}
        </div>
      </main>
    </div>
  );
}

function DayCard({ day }) {
  const [newTitle, setNewTitle] = useState("");
  const [newSubject, setNewSubject] = useState("ETC");
  const [adding, setAdding] = useState(false);

  const dateLabel = format(day.date, "MM.dd (EEE)");
  const header = day.planner?.header_note?.trim();

  const hasTasks = (day.tasks ?? []).length > 0;
  return (
    <div className="border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{dateLabel}</div>
        <div className="text-[11px] text-neutral-500">
          완료 {day.tasks.filter((t) => t.status === "DONE").length} / {day.tasks.length}
        </div>
      </div>

      <div className="text-[11px] text-neutral-500">플래너 메모</div>
      <div className="text-sm">{header ? header : "메모 없음"}</div>

      <div className="space-y-1">
        <div className="text-[11px] text-neutral-500">할 일</div>
        {!hasTasks ? (
          <div className="text-xs text-neutral-500">등록된 할 일이 없습니다.</div>
        ) : (
          <ul className="space-y-1">
            {day.tasks.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded border px-2 py-1 text-sm"
              >
                <div className="flex items-center gap-2">
                  <StatusDot status={t.status} />
                  <div>
                    <div className="leading-tight">{t.title}</div>
                    <div className="text-[11px] text-neutral-500">
                      {t.subject} {t.is_fixed_by_mentor ? "· 멘토 지정" : ""}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-neutral-500">{prettyStatus(t.status)}</div>
                  <div className="text-[10px] text-neutral-400">
                    {day.minutesByTaskId.get(t.id) ?? 0}분
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <select
          className="border rounded p-2 text-sm"
          value={newSubject}
          onChange={(e) => setNewSubject(e.target.value)}
          disabled={adding}
        >
          {SUBJECT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="멘토가 할 일 추가"
          className="flex-1 border rounded p-2 text-sm"
          disabled={adding}
        />

        <button
          onClick={async () => {
            setAdding(true);
            try {
              await day.onAddTask(newTitle, newSubject, () => {
                setNewTitle("");
                setNewSubject("ETC");
              });
            } finally {
              setAdding(false);
            }
          }}
          disabled={adding}
          className="border rounded px-3 text-sm"
        >
          추가
        </button>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const color =
    status === "DONE"
      ? "bg-green-500"
      : status === "WORKING"
      ? "bg-amber-500"
      : "bg-neutral-300";
  return <span className={`w-2.5 h-2.5 rounded-full ${color}`} />;
}

function prettyStatus(status) {
  if (status === "DONE") return "완료";
  if (status === "WORKING") return "진행중";
  return "미완료";
}
