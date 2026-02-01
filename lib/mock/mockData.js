export function mockPlannerBundle(dateStr) {
  return {
    headerNote: "",
    tasks: [
      { id: "t1", title: "국어 비문학 2지문", subject: "KOR", status: "TODO", studyMinutes: 0 },
      { id: "t2", title: "영어 어휘 50개", subject: "ENG", status: "WORKING", studyMinutes: 20 },
      { id: "t3", title: "수학 N제 10문항", subject: "MATH", status: "DONE", studyMinutes: 60 },
    ],
  };
}

export function mockTaskDetail(taskId) {
  return {
    id: taskId,
    title: `과제 ${taskId}`,
    subject: "KOR",
    pdfUrl: "", // 나중에 task_materials.file_url 연결
  };
}

export function mockFeedbacks() {
  return [
    { id: "f1", subject: "KOR", date: "2026-02-01", summary: "핵심: 지문 구조 파악", body: "세부 피드백 내용..." },
    { id: "f2", subject: "ENG", date: "2026-02-01", summary: "핵심: 구문/동사", body: "세부 피드백 내용..." },
    { id: "f3", subject: "MATH", date: "2026-02-01", summary: "핵심: 오답원인 분류", body: "세부 피드백 내용..." },
  ];
}

export function mockProgress() {
  return { KOR: 62, ENG: 48, MATH: 55 };
}
