'use client';

import { useMemo, useState, useEffect } from 'react';
import TaskRow from './TaskRow';
import { addMenteeTask, deleteTasks, updateTaskStatus } from '@/lib/repositories/tasksRepo';
import { Plus, ChevronDown, Trash2, X, AlignLeft, CheckCircle2, Circle } from 'lucide-react';

const SUBJECT_OPTIONS = [
  { value: 'KOR', label: '국어' },
  { value: 'MATH', label: '수학' },
  { value: 'ENG', label: '영어' },
  { value: 'ETC', label: '기타' },
];

export default function TaskChecklist({ menteeId, date, tasks, secondsByTaskId, onMutated }) {
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSubject, setNewSubject] = useState('ETC');
  const [adding, setAdding] = useState(false);

  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [detailTask, setDetailTask] = useState(null);

  const safeMenteeId = useMemo(() => {
    const n = Number(menteeId);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [menteeId]);

  // 상세 모달 데이터 동기화
  useEffect(() => {
    if (detailTask && tasks) {
      const updatedTask = tasks.find((t) => t.id === detailTask.id);
      if (updatedTask) {
        setDetailTask((prev) => ({ ...prev, ...updatedTask }));
      }
    }
  }, [tasks, detailTask?.id]);

  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode);
    setSelectedIds([]);
  };

  const handleSelectTask = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
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
    const title = newTitle.trim();
    if (!title || !safeMenteeId) return;
    
    setAdding(true);
    try {
      await addMenteeTask({
        menteeId: safeMenteeId,
        date,
        title,
        description: newDescription,
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

  async function toggleDetailTaskStatus() {
    if (!detailTask) return;
    
    // 'TODO' <-> 'DONE' 토글
    const nextStatus = detailTask.status === 'DONE' ? 'TODO' : 'DONE';
    
    // 낙관적 업데이트
    setDetailTask(prev => ({ ...prev, status: nextStatus }));

    try {
      await updateTaskStatus({ taskId: detailTask.id, status: nextStatus });
      onMutated?.();
    } catch (e) {
      console.error(e);
      // 실패 시 롤백
      setDetailTask(prev => ({ ...prev, status: detailTask.status }));
      alert('상태 변경 실패');
    }
  }

  const groupedTasks = useMemo(() => {
    const groups = { KOR: [], MATH: [], ENG: [], ETC: [] };
    tasks?.forEach((task) => {
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
    <>
      <div className="flex flex-col gap-6 px-1 pb-24 relative">
        <div className="flex items-center justify-between mb-2 h-9">
          <h2 className="text-lg font-bold text-foreground">오늘의 할 일</h2>
          
          {tasks?.length > 0 && (
            <div>
              {isDeleteMode ? (
                <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                  <button
                    onClick={toggleDeleteMode}
                    className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={selectedIds.length === 0}
                    className={`px-3 py-1.5 text-xs font-bold text-white rounded-lg flex items-center gap-1 transition-colors ${
                      selectedIds.length > 0 
                        ? 'bg-red-600 hover:bg-red-700 shadow-sm' 
                        : 'bg-red-300 cursor-not-allowed'
                    }`}
                  >
                    <span>삭제</span>
                    {selectedIds.length > 0 && <span className="bg-white/20 px-1.5 rounded text-[10px]">{selectedIds.length}</span>}
                  </button>
                </div>
              ) : (
                <button
                  onClick={toggleDeleteMode}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg shadow-sm transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  할 일 삭제
                </button>
              )}
            </div>
          )}
        </div>

        {!tasks || tasks.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground bg-slate-50 rounded-xl border border-dashed border-border mb-4">
            등록된 할 일이 없습니다.<br />아래에서 추가해보세요!
          </div>
        ) : (
          Object.entries(groupedTasks).map(([subjectKey, subjectTasks]) => {
            if (subjectTasks.length === 0) return null;
            const config = subjectConfig[subjectKey] || subjectConfig.ETC;

            return (
              <div key={subjectKey} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1 mt-2">
                  <ChevronDown className={`w-5 h-5 ${config.color}`} />
                  <span className={`text-base font-bold ${config.color}`}>
                    {config.label}
                  </span>
                </div>

                <div className="flex flex-col gap-3 pl-1">
                  {subjectTasks.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      studiedSeconds={secondsByTaskId.get(task.id) ?? 0}
                      isDeleteMode={isDeleteMode}
                      isSelected={selectedIds.includes(task.id)}
                      onSelect={() => handleSelectTask(task.id)}
                      onOpenDetail={() => setDetailTask(task)}
                      subjectBorderColor={config.borderColor}
                    />
                  ))}
                </div>
              </div>
            );
          })
        )}

        {!isDeleteMode && (
          <div className="mt-4 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-1">
              새로운 할 일 추가
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex gap-2">
                <select
                  className="h-11 rounded-xl border border-border bg-white px-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  disabled={adding}
                >
                  {SUBJECT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>

                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="할 일을 입력하세요"
                  className="flex-1 h-11 rounded-xl border border-border bg-white px-4 text-sm focus:border-primary focus:outline-none"
                  disabled={adding}
                />
              </div>

              <div className="flex gap-2 px-1">
                <AlignLeft className="w-4 h-4 text-muted-foreground mt-2" />
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="세부 내용(메모)을 입력하세요 (선택)"
                  className="flex-1 min-h-[80px] rounded-lg border border-slate-200 bg-white p-3 text-sm placeholder:text-muted-foreground/70 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none leading-relaxed"
                  disabled={adding}
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={adding || !newTitle.trim()}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-white font-semibold shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
              >
                {adding ? <span className="text-xs">저장 중...</span> : <><Plus className="w-5 h-5" /><span>추가하기</span></>}
              </button>
            </div>
          </div>
        )}
      </div>

      {detailTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setDetailTask(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col gap-4">
              <div>
                <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-100 text-slate-600`}>
                   {SUBJECT_OPTIONS.find(o => o.value === detailTask.subject)?.label || '기타'}
                </span>
                <h3 className={`text-xl font-bold mt-2 leading-snug ${detailTask.status === 'DONE' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {detailTask.title}
                </h3>
              </div>

              <div className="min-h-[80px] max-h-[300px] overflow-y-auto text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                {detailTask.description ? (
                  <p className="whitespace-pre-wrap">{detailTask.description}</p>
                ) : (
                  <span className="text-slate-400 italic">입력된 세부 내용이 없습니다.</span>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={toggleDetailTaskStatus}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    detailTask.status === 'DONE'
                      ? 'text-slate-500 bg-slate-100 hover:bg-slate-200' 
                      : 'text-primary bg-primary/10 hover:bg-primary/20'
                  }`}
                >
                  {detailTask.status === 'DONE' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                  {detailTask.status === 'DONE' ? '완료 취소' : '완료하기'}
                </button>

                <button
                  onClick={() => setDetailTask(null)}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg active:scale-95 transition-transform"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}