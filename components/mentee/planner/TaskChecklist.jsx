'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TaskRow from './TaskRow';

import { addMenteeTask, deleteTasks, updateTaskStatus } from '@/lib/repositories/tasksRepo';
import { Plus, ChevronDown, Trash2, AlignLeft } from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: 'KOR', label: '국어' },
  { value: 'MATH', label: '수학' },
  { value: 'ENG', label: '영어' },
  { value: 'ETC', label: '기타' },
];

const CALENDAR_TAB_HREF = '/mentee/planner';

function TaskListSkeleton() {
  return (
    <div className="w-full min-w-0 overflow-x-hidden">
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="w-full min-w-0 rounded-xl border border-slate-100 bg-white p-3">
            <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TaskChecklist({
  menteeId,
  date,
  tasks,
  secondsByTaskId,
  onMutated,
  mode = 'view', // 'view' | 'manage'
  title = '오늘의 할 일',
  comment = '',
  loading = false,
}) {
  const router = useRouter();

  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState('ETC');
  const [adding, setAdding] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const [navigatingTaskId, setNavigatingTaskId] = useState(null);
  const [togglingIds, setTogglingIds] = useState(new Set());

  const isManage = mode === 'manage';

  const safeMenteeId = useMemo(() => {
    const n = Number(menteeId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [menteeId]);

  const handleSelectTask = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  async function handleDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`${selectedIds.length}개의 할 일을 삭제하시겠습니까?`)) return;

    try {
      await deleteTasks(selectedIds);
      setSelectedIds([]);
      setIsDeleteMode(false);
      onMutated?.();
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  }

  async function handleAdd() {
    const titleTrim = newTitle.trim();
    if (!titleTrim || !safeMenteeId) return;

    setAdding(true);
    try {
      await addMenteeTask({
        menteeId: safeMenteeId,
        date,
        title: titleTrim,
        goal: newDescription,
        subject: newSubject,
      });
      setNewTitle('');
      setNewDescription('');
      onMutated?.();
    } catch (e) {
      alert(e?.message ?? '할 일 추가 실패');
    } finally {
      setAdding(false);
    }
  }

  const openTaskDetail = (taskId) => {
    if (!taskId) return;
    setNavigatingTaskId(taskId);
    router.push(`/mentee/tasks/${taskId}`);
  };

  const goToCalendarTab = () => {
    router.push(CALENDAR_TAB_HREF);
  };

  const toggleDone = async (task) => {
    if (!task?.id) return;
    const nextStatus = task.status === 'DONE' ? 'TODO' : 'DONE';

    setTogglingIds((prev) => {
      const n = new Set(prev);
      n.add(task.id);
      return n;
    });

    try {
      await updateTaskStatus({ taskId: task.id, status: nextStatus });
      onMutated?.();
    } catch (e) {
      alert(e?.message ?? '상태 변경 실패');
    } finally {
      setTogglingIds((prev) => {
        const n = new Set(prev);
        n.delete(task.id);
        return n;
      });
    }
  };

  const groupedTasks = useMemo(() => {
    const groups = { KOR: [], MATH: [], ENG: [], ETC: [] };
    (tasks ?? []).forEach((task) => {
      if (groups[task.subject]) groups[task.subject].push(task);
      else groups.ETC.push(task);
    });
    return groups;
  }, [tasks]);

  const subjectConfig = {
    KOR: { label: '국어', color: 'text-subject-kor', borderColor: 'border-subject-kor' },
    MATH: { label: '수학', color: 'text-subject-math', borderColor: 'border-subject-math' },
    ENG: { label: '영어', color: 'text-subject-eng', borderColor: 'border-subject-eng' },
    ETC: { label: '기타/탐구', color: 'text-subject-etc', borderColor: 'border-subject-etc' },
  };

  return (
    <div className="w-full min-w-0 overflow-x-hidden flex flex-col gap-4 px-1 pb-8">
      {/* 상세 이동 로딩 오버레이 */}
      {navigatingTaskId ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20">
          <div className="rounded-2xl bg-white/90 border border-white/40 px-5 py-4 shadow-lg">
            <div className="text-sm font-semibold text-foreground">할 일 상세로 이동 중...</div>
            <div className="mt-2 h-1.5 w-48 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full w-1/2 animate-pulse bg-primary" />
            </div>
          </div>
        </div>
      ) : null}

      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-foreground">{title}</h2>

        {isManage && (tasks?.length ?? 0) > 0 ? (
          isDeleteMode ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsDeleteMode(false);
                  setSelectedIds([]);
                }}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedIds.length === 0}
                className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1 transition-colors ${
                  selectedIds.length > 0 ? 'bg-red-600 hover:bg-red-700 shadow-sm' : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                <span>삭제</span>
                {selectedIds.length > 0 ? (
                  <span className="bg-white/20 px-1.5 rounded text-[10px]">{selectedIds.length}</span>
                ) : null}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsDeleteMode(true)}
              className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              할 일 삭제
            </button>
          )
        ) : null}
      </div>

      {/* ✅ 오늘의 코멘트: 제목 바로 아래 */}
      {comment ? (
        <div className="w-full rounded-xl border border-border bg-white/70 px-4 py-3 text-sm text-foreground/80 leading-relaxed">
          {comment}
        </div>
      ) : null}

      {/* ✅ task list 로딩 */}
      {loading ? (
        <TaskListSkeleton />
      ) : !tasks || tasks.length === 0 ? (
        <div className="py-8 text-center text-sm text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-border">
          등록된 할 일이 없습니다.
        </div>
      ) : (
        <div className="w-full min-w-0 overflow-x-hidden">
          {Object.entries(groupedTasks).map(([subjectKey, subjectTasks]) => {
            if (subjectTasks.length === 0) return null;
            const config = subjectConfig[subjectKey] || subjectConfig.ETC;

            return (
              <div key={subjectKey} className="flex flex-col gap-2 w-full min-w-0 overflow-x-hidden">
                <div className="flex items-center gap-2 mb-1 mt-2 min-w-0">
                  <ChevronDown className={`w-5 h-5 ${config.color} shrink-0`} />
                  <span className={`text-base font-bold ${config.color} truncate`}>{config.label}</span>
                </div>

                <div className="flex flex-col gap-3 pl-1 w-full min-w-0 overflow-x-hidden">
                  {subjectTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      studiedSeconds={secondsByTaskId?.get?.(task.id) ?? 0}
                      subjectBorderColor={config.borderColor}
                      isDeleteMode={isManage ? isDeleteMode : false}
                      isSelected={isManage ? selectedIds.includes(task.id) : false}
                      onSelect={isManage ? () => handleSelectTask(task.id) : undefined}
                      onOpenDetail={() => openTaskDetail(task.id)}
                      onToggleDone={() => toggleDone(task)}
                      isTogglingDone={togglingIds.has(task.id)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* view 모드: 할일수정 버튼 */}
      {!isManage ? (
        <button
          onClick={goToCalendarTab}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-white text-foreground font-semibold shadow-sm hover:bg-slate-50 active:scale-[0.99] transition"
        >
          할일수정
        </button>
      ) : null}

      {/* manage 모드: 추가 섹션 */}
      {isManage && !isDeleteMode ? (
        <div className="mt-4 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">새로운 할 일 추가</h3>
          <div className="flex flex-col gap-3">
            <div className="flex gap-2 min-w-0">
              <select
                className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary shrink-0"
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
                placeholder="할 일을 입력하세요"
                className="flex-1 min-w-0 h-11 rounded-xl border border-border bg-white px-4 text-sm focus:border-primary focus:outline-none"
                disabled={adding}
              />
            </div>

            <div className="flex gap-2 px-1 min-w-0">
              <AlignLeft className="w-4 h-4 text-muted-foreground mt-2 shrink-0" />
              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="세부 내용(메모)을 입력하세요 (선택)"
                className="flex-1 min-w-0 min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                disabled={adding}
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={adding || !newTitle.trim()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
            >
              {adding ? (
                <span className="text-xs">저장 중...</span>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>추가하기</span>
                </>
              )}
            </button>
          </div>
          <div style={{height:"32px",}}></div>
        </div>
      ) : null}
    </div>
  );
}
