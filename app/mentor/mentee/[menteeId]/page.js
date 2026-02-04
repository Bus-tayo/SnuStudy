"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";

import MenteeWeeklyDetail from "@/components/mentor/MenteeWeeklyDetail";

export default function MentorMenteeDetailPage() {
  const params = useParams();
  const menteeId = useMemo(() => Number(params?.menteeId), [params]);

  if (!Number.isFinite(menteeId)) {
    return <div className="p-4 text-sm text-red-600">잘못된 멘티 ID</div>;
  }

  return <MenteeWeeklyDetail menteeId={menteeId} />;
}
