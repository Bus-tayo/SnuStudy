import { supabase } from "@/lib/supabase/client";

export async function fetchNotifications({ userId, limit = 50 }) {
  if (!userId) return [];

  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function fetchUnreadCount(userId) {
  if (!userId) return 0;

  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export async function markNotificationRead(notificationId, userId) {
  if (!notificationId || !userId) return null;

  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function markAllNotificationsRead(userId) {
  if (!userId) return;
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

export async function createNotification({ userId, title, body, type, payload }) {
  if (!userId) throw new Error("userId is required to create notification");

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      body,
      type,
      payload_json: payload ?? null,
      is_read: false,
      created_at: now,
      sent_at: now,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function hasNotification({ userId, type, payload }) {
  if (!userId || !type) return false;

  let query = supabase
    .from("notifications")
    .select("id")
    .eq("user_id", userId)
    .eq("type", type)
    .limit(1);

  if (payload) {
    query = query.contains("payload_json", payload);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).length > 0;
}

export function subscribeNotificationEvents(userId, { onInsert, onUpdate, onDelete } = {}) {
  if (!userId) return () => {};

  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert?.(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onUpdate?.(payload.new)
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onDelete?.(payload.old)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
