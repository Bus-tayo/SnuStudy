"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

export default function MenteeCard({ mentee, snapshot }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const snap = snapshot || { doneCount: 0, totalCount: 0, studyMinutes: 0, headerNote: "", tasks: [] };
  const isDone = snap.totalCount > 0 && snap.doneCount === snap.totalCount;

  const displayName = mentee.name || "이름 없음";

  const goDetail = () => router.push(`/mentor/mentee/${mentee.id}`);

  const handleCardKeyDown = (e) => {
    if (e.currentTarget !== e.target) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      if (e.key === " " || e.key === "Spacebar") e.preventDefault();
      goDetail();
    }
  };

  const handleToggleTask = (e, taskId) => {
    e.stopPropagation();
    setExpandedTaskId(prev => prev === taskId ? null : taskId);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goDetail}
      onKeyDown={handleCardKeyDown}
      aria-label={`${displayName} 상세 보기`}
      className="group relative flex flex-col p-5 bg-white rounded-2xl border border-gray-200 shadow-sm active:scale-[0.99] transition-all cursor-pointer hover:border-blue-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg border border-indigo-100 flex-shrink-0">
            {displayName[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 text-lg leading-tight">
                {displayName}
              </span>
              <span className="text-xs text-gray-400 font-mono">#{mentee.id}</span>
            </div>
          </div>
        </div>
        
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-tight ${
            isDone ? "bg-green-100 text-green-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {isDone ? "완료" : "진행중"}
        </span>
      </div>

      <div className="mt-4 mb-3">
        <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 relative">
          <div className="absolute top-0 left-6 -mt-1 w-2 h-2 bg-gray-50 rotate-45 transform"></div>
          <span className="text-gray-400 font-semibold mr-2 text-xs">Planner</span>
          {snap.headerNote ? (
            <span className="text-gray-800 break-words">"{snap.headerNote}"</span>
          ) : (
            <span className="text-gray-400 italic">오늘의 다짐 없음</span>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">⏱️</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold">공부 시간</span>
            <span className="text-sm font-semibold text-gray-800">
              {Math.floor(snap.studyMinutes / 60)}시간 {snap.studyMinutes % 60}분
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-gray-400 font-bold">오늘 할 일</span>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${isDone ? 'text-green-600' : 'text-blue-600'}`}>
                {snap.doneCount}
              </span>
              <span className="text-xs text-gray-400">/ {snap.totalCount}개</span>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation(); 
              setIsOpen(!isOpen);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors focus:outline-none"
          >
            <svg 
              className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div 
        onClick={(e) => e.stopPropagation()} 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[800px] opacity-100 mt-3" : "max-h-0 opacity-0"
        }`}
      >
        <div className="space-y-2 px-0.5 pb-1">
          {snap.tasks && snap.tasks.length > 0 ? (
            snap.tasks.map((task) => (
              <TaskItem 
                key={task.id} 
                task={task} 
                isExpanded={expandedTaskId === task.id}
                onToggle={(e) => handleToggleTask(e, task.id)}
              />
            ))
          ) : (
            <div className="text-center text-xs text-gray-400 py-2 bg-gray-50 rounded-lg">
              등록된 할 일이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskItem({ task, isExpanded, onToggle }) {
  const varName = getSubjectColorVar(task.subject);
  const subjectKorean = getSubjectKorean(task.subject);
  const isTaskDone = task.status === "DONE";
  const taskTitle = task.title || "할 일";

  const handleTaskKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      if (e.key === " " || e.key === "Spacebar") e.preventDefault();
      onToggle(e);
    }
  };

  return (
    <div
      onClick={onToggle}
      onKeyDown={handleTaskKeyDown}
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${taskTitle} 상세 ${isExpanded ? "접기" : "펼치기"}`}
      className={`flex flex-col rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 focus-visible:ring-offset-2 ${
        isTaskDone
          ? "border-green-200 bg-green-50"
          : "border-gray-200 bg-white hover:bg-gray-50"
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
          <div className={`font-medium text-sm leading-tight truncate ${isTaskDone ? "text-gray-400 line-through decoration-gray-400" : "text-gray-800"}`}>
            {task.title}
          </div>
          
          <div className="flex items-center gap-1.5 mt-1.5">
            {task.subject && (
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
            )}
          </div>
        </div>

        <div className="flex-shrink-0">
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
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
        <div className="p-3 bg-opacity-50 bg-gray-50 text-xs text-gray-600">
          <div className="font-semibold mb-1 text-gray-400">상세 내용</div>
          {task.description ? (
            <p className="whitespace-pre-wrap leading-relaxed">{task.description}</p>
          ) : (
            <p className="text-gray-400 italic">작성된 상세 내용이 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
