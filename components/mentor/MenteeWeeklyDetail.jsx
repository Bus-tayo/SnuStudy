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

const getSubjectColorVar = (subject) => {
  if (!subject) return '--subject-etc';
  const sub = subject.toUpperCase();
  if (sub === 'KOR') return '--subject-kor';
  if (sub === 'MATH') return '--subject-math';
  if (sub === 'ENG') return '--subject-eng';
  return '--subject-etc';
};

const getSubjectKorean = (subject) => {
  if (!subject) return '';
  const sub = subject.toUpperCase();
  if (sub === 'KOR') return '국어';
  if (sub === 'MATH') return '수학';
  if (sub === 'ENG') return '영어';
  return subject; 
};

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
    return () => { alive = false; };
  }, [router, menteeId]);

  useEffect(() => {
    if (!bootstrapped || !menteeId || !mentorId) return;
    loadWeek(weekStart);
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
            onAddTask: async (title, subject, description, cb) => {
              const t = title?.trim();
              if (!t) return;
              try {
                await addMentorTask({
                  mentorId,
                  menteeId,
                  date,
                  title: t,
                  subject,
                  description,
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

  const displayName = mentee.name || "이름 없음";

  return (
    <div className="min-h-dvh flex flex-col bg-gray-50 w-full max-w-[430px] mx-auto shadow-xl">
      <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shadow-sm">
        <button
          onClick={() => router.push("/mentor")}
          className="p-2 -ml-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-gray-900 leading-tight">{displayName}</h1>
          <span className="text-xs text-gray-500">{weekLabel}</span>
        </div>
      </header>

      <main className="flex-1 p-4 space-y-4 overflow-y-auto pb-12">
        <div className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border shadow-sm">
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, -1))}
            className="flex-1 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 touch-manipulation"
            disabled={loading}
          >
            ← 이전 주
          </button>
          {loading && <span className="text-xs text-blue-500 font-medium animate-pulse whitespace-nowrap px-2">로딩...</span>}
          <button
            onClick={() => setWeekStart(addWeeks(weekStart, 1))}
            className="flex-1 py-3 border rounded-lg text-sm font-medium hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 touch-manipulation"
            disabled={loading}
          >
            다음 주 →
          </button>
        </div>

        <div className="space-y-4">
          {days.map((d) => (
            <DayCard key={d.date.toISOString()} day={d} />
          ))}
        </div>
      </main>
    </div>
  );
}

function DayCard({ day }) {
  const { isToday, isPast } = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const target = new Date(day.date);
    const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
    
    return {
      isToday: targetDay.getTime() === today.getTime(),
      isPast: targetDay.getTime() < today.getTime(),
    };
  }, [day.date]);

  const hasTasks = (day.tasks ?? []).length > 0;
  
  const isAllDone = 
    (hasTasks && day.tasks.every(t => t.status === "DONE")) || 
    (!hasTasks && isPast);

  const [isListOpen, setIsListOpen] = useState(isToday);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newSubject, setNewSubject] = useState("ETC");
  const [adding, setAdding] = useState(false);

  const dateLabel = format(day.date, "MM.dd (EEE)");
  const header = day.planner?.header_note?.trim();

  const handleToggleTask = (taskId) => {
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  const containerBorderClass = isAllDone
    ? "border-green-200 ring-1 ring-green-100"
    : isToday
    ? "border-blue-200 ring-1 ring-blue-100"
    : "border-gray-200";

  const headerBgClass = isAllDone
    ? "bg-green-50 border-green-100 active:bg-green-100"
    : "bg-gray-50 border-gray-100 active:bg-gray-200";
    
  const dateTextClass = isAllDone
    ? "text-green-800"
    : isToday
    ? "text-blue-700"
    : "text-gray-800";

  return (
    <div className={`border bg-white rounded-xl shadow-sm overflow-hidden transition-all ${containerBorderClass}`}>
      <div 
        onClick={() => setIsListOpen(!isListOpen)}
        className={`flex items-center justify-between p-4 border-b cursor-pointer select-none transition-colors ${headerBgClass}`}
      >
        <div className="flex items-center gap-3">
            <div className={`text-base font-bold ${dateTextClass}`}>
              {dateLabel} {isToday && <span className={`text-xs font-normal ml-1 ${isAllDone ? "text-green-600" : "text-blue-600"}`}>(오늘)</span>}
            </div>
            <div className={`text-xs font-medium border px-2 py-0.5 rounded-full ${isAllDone ? "text-green-600 bg-white border-green-200" : "text-gray-500 bg-white border-gray-200"}`}>
            {day.tasks.filter((t) => t.status === "DONE").length} / {day.tasks.length}
            </div>
        </div>
        <div className={`p-1 rounded-full border bg-white ${isAllDone ? "border-green-100 text-green-400" : "border-gray-100 text-gray-400"}`}>
             <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isListOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${isListOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
        <div className="p-4 space-y-5">
            <div>
                <div className="text-[11px] font-bold text-gray-400 mb-1.5 uppercase tracking-wide">플래너 메모</div>
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg min-h-[40px] border border-gray-100">
                    {header ? header : <span className="text-gray-400 italic">작성된 메모가 없습니다.</span>}
                </div>
            </div>

            <div>
                <div className="text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wide">할 일 목록</div>
                {!hasTasks ? (
                <div className="text-sm text-center text-gray-400 py-6 border border-dashed rounded-xl bg-gray-50">
                    등록된 할 일이 없습니다.
                </div>
                ) : (
                <ul className="space-y-3">
                    {day.tasks.map((t) => (
                        <TaskItem 
                            key={t.id} 
                            task={t} 
                            minutes={day.minutesByTaskId.get(t.id) ?? 0}
                            isExpanded={expandedTaskId === t.id}
                            onToggle={() => handleToggleTask(t.id)}
                        />
                    ))}
                </ul>
                )}
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-2">
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">할 일 추가</div>
                <div className="flex gap-2">
                    <select
                        className="border border-gray-300 rounded-lg px-2 text-base h-11 bg-white w-24 flex-shrink-0"
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
                        placeholder="할 일 제목"
                        className="flex-1 border border-gray-300 rounded-lg px-3 text-base h-11"
                        disabled={adding}
                    />
                </div>
                <input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="상세 내용 (선택)"
                    className="w-full border border-gray-300 rounded-lg px-3 text-base h-11"
                    disabled={adding}
                />
                <button
                    onClick={async () => {
                        setAdding(true);
                        try {
                        await day.onAddTask(newTitle, newSubject, newDescription, () => {
                            setNewTitle("");
                            setNewDescription("");
                            setNewSubject("ETC");
                        });
                        } finally {
                        setAdding(false);
                        }
                    }}
                    disabled={adding}
                    className="w-full bg-blue-600 text-white rounded-lg text-base h-11 font-bold hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 transition-colors shadow-sm"
                >
                    추가
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, minutes, isExpanded, onToggle }) {
    const varName = getSubjectColorVar(task.subject);
    const subjectKorean = getSubjectKorean(task.subject);
    const isTaskDone = task.status === "DONE";

    return (
        <li
            onClick={onToggle}
            className={`flex flex-col rounded-xl border transition-all cursor-pointer shadow-sm active:scale-[0.99] touch-manipulation ${
            isTaskDone
                ? "border-green-200 bg-green-50"
                : "border-gray-200 bg-white"
            }`}
        >
            <div className="flex items-center p-3 gap-3">
                <div className="flex-shrink-0">
                    {isTaskDone ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white shadow-sm">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        </div>
                    ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className={`font-medium text-base leading-tight truncate ${isTaskDone ? "text-gray-400 line-through decoration-gray-400" : "text-gray-900"}`}>
                        {task.title}
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-1.5">
                          <span 
                            style={{ 
                                color: `hsl(var(${varName}))`,
                                borderColor: `hsl(var(${varName}))`,
                                backgroundColor: `hsl(var(${varName}) / 0.05)` 
                            }}
                            className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-md border"
                        >
                            {subjectKorean}
                        </span>
                        
                        {task.is_fixed_by_mentor && (
                            <span className="text-[10px] text-blue-500 font-medium bg-blue-50 px-1.5 py-0.5 rounded">
                                멘토 지정
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex-shrink-0 flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-[10px] font-semibold text-gray-600">{minutes}분</div>
                    </div>
                    <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>

            <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-dashed ${
                    isExpanded ? "max-h-96 opacity-100 border-gray-200" : "max-h-0 opacity-0 border-transparent"
                }`}
            >
                <div className="p-3 bg-opacity-50 bg-gray-50 text-sm text-gray-600 leading-relaxed">
                    <div className="font-semibold mb-1 text-xs text-gray-400 uppercase">상세 내용</div>
                    {task.description ? (
                        <p className="whitespace-pre-wrap">{task.description}</p>
                    ) : (
                        <p className="text-gray-400 italic">작성된 상세 내용이 없습니다.</p>
                    )}
                </div>
            </div>
        </li>
    );
}