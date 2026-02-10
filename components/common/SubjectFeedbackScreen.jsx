"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Send, Clock, User, Pencil, X } from "lucide-react";
import { createFeedback, fetchFeedbacks, updateFeedback } from "@/lib/repositories/feedbacksRepo";
import { getAuthSession, resolveAppUserFromSession } from "@/lib/auth/session";

const SUBJECT_LABEL = {
    KOR: "국어",
    ENG: "영어",
    MATH: "수학",
    ETC: "기타",
};

export default function SubjectFeedbackScreen({ menteeId, subject, readOnly = false }) {
    const router = useRouter();
    const [summary, setSummary] = useState("");
    const [feedback, setFeedback] = useState("");
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const subjectName = SUBJECT_LABEL[subject] ?? subject;

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                if (!menteeId) return;
                setLoading(true);
                const data = await fetchFeedbacks({ menteeId, subject });
                if (alive) setHistory(data);
            } catch (e) {
                console.error("Failed to load feedbacks:", e);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [menteeId, subject]);

    const handleEdit = (item) => {
        setEditingId(item.id);
        setSummary(item.summary || "");
        setFeedback(item.body || item.content || "");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setSummary("");
        setFeedback("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!feedback.trim() || !summary.trim()) return;

        try {
            setSubmitting(true);
            const { session } = await getAuthSession();
            if (!session) throw new Error("로그인이 필요합니다.");
            const user = await resolveAppUserFromSession(session);

            if (editingId) {
                const updatedEntry = await updateFeedback({
                    id: editingId,
                    summary,
                    body: feedback,
                });

                setHistory(history.map(item => item.id === editingId ? updatedEntry : item));
                setEditingId(null);
            } else {
                const newEntry = await createFeedback({
                    menteeId,
                    mentorId: user.appUserId,
                    subject,
                    summary,
                    body: feedback,
                });
                setHistory([newEntry, ...history]);
            }

            setFeedback("");
            setSummary("");
        } catch (e) {
            console.error("Failed to submit feedback:", e);
            alert("피드백 저장에 실패했습니다.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-dvh flex flex-col bg-background max-w-[430px] mx-auto shadow-xl">
            {/* Header */}
            <header className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-md">
                <button
                    onClick={() => router.back()}
                    className="p-1 -ml-1 rounded-full hover:bg-muted transition-colors"
                >
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-extrabold">
                    {subjectName} 피드백
                </h1>
            </header>

            <main className="flex-1 p-4 space-y-6 pb-24">
                {/* Input Area - Only for Mentor */}
                {!readOnly && (
                    <section className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-foreground/80">
                                {editingId ? "피드백 수정하기" : "새로운 피드백 작성"}
                            </label>
                            {editingId && (
                                <button
                                    onClick={handleCancelEdit}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                                >
                                    <X className="w-3 h-3" /> 취소
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="relative space-y-2">
                            <input
                                type="text"
                                value={summary}
                                onChange={(e) => setSummary(e.target.value)}
                                placeholder="핵심 내용 (예: 지문 구조 파악)"
                                className="w-full p-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={submitting}
                            />
                            <textarea
                                value={feedback}
                                onChange={(e) => setFeedback(e.target.value)}
                                placeholder={`${subjectName} 학습에 대한 피드백을 남겨주세요. (500자 이내)`}
                                className="w-full h-32 p-3 pb-10 rounded-xl border border-border bg-card text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={submitting}
                            />
                            <button
                                type="submit"
                                disabled={!feedback.trim() || !summary.trim() || submitting}
                                className={`absolute bottom-3 right-3 p-2 rounded-full text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity ${editingId ? 'bg-green-600' : 'bg-primary'}`}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </form>
                    </section>
                )}

                {/* History Area */}
                <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-foreground/80">
                        이전 피드백 기록
                    </h2>
                    <div className="space-y-3">
                        {history.length > 0 ? (
                            history.map((item) => (
                                <div key={item.id} className={`card-base p-4 space-y-2 bg-card/50 transition-colors ${editingId === item.id ? 'ring-2 ring-primary bg-primary/5' : ''}`}>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{item.author}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{item.date}</span>
                                            </div>
                                            {!readOnly && (
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1 hover:bg-muted rounded-full text-foreground/60 hover:text-primary transition-colors"
                                                    title="수정"
                                                >
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {item.summary && (
                                        <h3 className="text-sm font-bold text-foreground">
                                            {item.summary}
                                        </h3>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                                        {item.body}
                                    </p>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border">
                                작성된 피드백이 없습니다.
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
}
