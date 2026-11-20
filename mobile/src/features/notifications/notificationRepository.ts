import { supabase } from "../../lib/supabase";

export const NOTIFICATIONS_PER_PAGE = 30;

export async function listNotifications(userId: string, offset = 0) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("notifications")
    .select("notification_id,bounty_id,notification_type,title,message,is_read,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("notification_id", { ascending: false })
    .range(offset, offset + NOTIFICATIONS_PER_PAGE - 1);
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationRead(notificationId: number): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("mark_notification_read", { p_notification_id: notificationId });
  if (error) throw error;
}
