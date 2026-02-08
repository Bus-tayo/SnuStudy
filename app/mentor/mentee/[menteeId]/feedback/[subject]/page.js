"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import SubjectFeedbackScreen from "@/components/common/SubjectFeedbackScreen";

export default function SubjectFeedbackPage() {
    const params = useParams();
    const menteeId = useMemo(() => Number(params?.menteeId), [params]);
    const subject = useMemo(() => params?.subject, [params]);

    if (!menteeId || !subject) {
        return <div className="p-4 text-sm text-red-600">잘못된 접근입니다.</div>;
    }

    return <SubjectFeedbackScreen menteeId={menteeId} subject={subject} />;
}
