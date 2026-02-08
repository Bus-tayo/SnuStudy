import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/lib/repositories/notificationsRepo";

const FEEDBACK_FETCH_DATE = 7;

export async function fetchFeedbacks({ menteeId, subject }) {
    const { data, error } = await supabase
        .from("feedbacks")
        .select("*, mentor:users!feedbacks_mentor_id_fkey(name)")
        .eq("mentee_id", menteeId)
        .eq("subject", subject)
        .order("date", { ascending: false });

    if (error) throw error;

    return data.map(item => ({
        ...item,
        author: item.mentor?.name ?? "알 수 없음",
    }));
}

export async function fetchMenteeFeedbacks({ menteeId }) {
    const today = new Date();
    const ago = new Date(today);
    ago.setDate(ago.getDate() - FEEDBACK_FETCH_DATE);
    const agoStr = ago.toISOString().split('T')[0];

    const { data, error } = await supabase
        .from("feedbacks")
        .select("*, mentor:users!feedbacks_mentor_id_fkey(name)")
        .eq("mentee_id", menteeId)
        .gte("date", agoStr)
        .order("date", { ascending: false });

    if (error) throw error;

    return data.map(item => ({
        ...item,
        author: item.mentor?.name ?? "알 수 없음",
    }));
}

export async function createFeedback({ menteeId, mentorId, subject, summary, body }) {
  const now = new Date();

    const payload = {
        mentee_id: menteeId,
        mentor_id: mentorId,
        subject,
        summary,
        body,
        date: now.toISOString().split('T')[0],
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
    };

    const { data, error } = await supabase
        .from("feedbacks")
    .insert(payload)
    .select("*, mentor:users!feedbacks_mentor_id_fkey(name)")
    .single();

  if (error) throw error;
  const result = {
    ...data,
    author: data.mentor?.name ?? "나 (멘토)",
  };

  try {
    await createNotification({
      userId: menteeId,
      type: "FEEDBACK_NEW",
      title: "새 피드백이 도착했어요",
      body: summary || "멘토가 오늘 피드백을 남겼습니다.",
      payload: { feedback_id: data.id, subject },
    });
  } catch (e) {
    console.warn("[createFeedback] notification failed", e);
  }

  return result;
}

export async function updateFeedback({ id, summary, body }) {
    const now = new Date().toISOString();

    const { data, error } = await supabase
        .from("feedbacks")
        .update({
            summary,
            body,
            updated_at: now
        })
        .eq("id", id)
        .select("*, mentor:users!feedbacks_mentor_id_fkey(name)")
        .single();

    if (error) throw error;

    return {
        ...data,
        author: data.mentor?.name ?? "나 (멘토)",
    };
}
