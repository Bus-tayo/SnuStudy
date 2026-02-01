module.exports = [
"[project]/lib/mock/mockData.js [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "mockFeedbacks",
    ()=>mockFeedbacks,
    "mockPlannerBundle",
    ()=>mockPlannerBundle,
    "mockProgress",
    ()=>mockProgress,
    "mockTaskDetail",
    ()=>mockTaskDetail
]);
function mockPlannerBundle(dateStr) {
    return {
        headerNote: "",
        tasks: [
            {
                id: "t1",
                title: "국어 비문학 2지문",
                subject: "KOR",
                status: "TODO",
                studyMinutes: 0
            },
            {
                id: "t2",
                title: "영어 어휘 50개",
                subject: "ENG",
                status: "WORKING",
                studyMinutes: 20
            },
            {
                id: "t3",
                title: "수학 N제 10문항",
                subject: "MATH",
                status: "DONE",
                studyMinutes: 60
            }
        ]
    };
}
function mockTaskDetail(taskId) {
    return {
        id: taskId,
        title: `과제 ${taskId}`,
        subject: "KOR",
        pdfUrl: ""
    };
}
function mockFeedbacks() {
    return [
        {
            id: "f1",
            subject: "KOR",
            date: "2026-02-01",
            summary: "핵심: 지문 구조 파악",
            body: "세부 피드백 내용..."
        },
        {
            id: "f2",
            subject: "ENG",
            date: "2026-02-01",
            summary: "핵심: 구문/동사",
            body: "세부 피드백 내용..."
        },
        {
            id: "f3",
            subject: "MATH",
            date: "2026-02-01",
            summary: "핵심: 오답원인 분류",
            body: "세부 피드백 내용..."
        }
    ];
}
function mockProgress() {
    return {
        KOR: 62,
        ENG: 48,
        MATH: 55
    };
}
}),
"[project]/components/mentee/tasks/TaskDetailScreen.jsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TaskDetailScreen
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2f$mockData$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/mock/mockData.js [app-ssr] (ecmascript)");
"use client";
;
;
;
function TaskDetailScreen({ taskId }) {
    const data = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$mock$2f$mockData$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["mockTaskDetail"])(taskId);
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "p-4 space-y-4",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-lg font-bold",
                        children: data.title
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 13,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-neutral-500",
                        children: data.subject
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 14,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                lineNumber: 12,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border rounded p-3 space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-semibold",
                        children: "학습 자료"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 18,
                        columnNumber: 9
                    }, this),
                    data.pdfUrl ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "underline text-sm",
                        href: data.pdfUrl,
                        target: "_blank",
                        rel: "noreferrer",
                        children: "PDF 다운로드"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 20,
                        columnNumber: 11
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm text-neutral-500",
                        children: "PDF 없음"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 24,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                lineNumber: 17,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "border rounded p-3 space-y-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-sm font-semibold",
                        children: "공부 인증 업로드 (jpg)"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 29,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        accept: "image/jpeg,image/jpg",
                        onChange: (e)=>setFile(e.target.files?.[0] ?? null)
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 30,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "px-3 py-2 border rounded text-sm",
                        disabled: !file,
                        children: "업로드"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 35,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-xs text-neutral-500",
                        children: "* 실제 업로드(Supabase Storage) 연결은 다음 단계에서 처리"
                    }, void 0, false, {
                        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                        lineNumber: 38,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
                lineNumber: 28,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/mentee/tasks/TaskDetailScreen.jsx",
        lineNumber: 11,
        columnNumber: 5
    }, this);
}
}),
];

//# sourceMappingURL=_3bf80eb7._.js.map