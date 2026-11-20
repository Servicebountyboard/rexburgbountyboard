import { supabase } from "../../lib/supabase";

export const RATINGS_PER_PAGE = 30;

export async function listReceivedRatings(userId: string, offset = 0) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("user_ratings")
    .select("rating_id,bounty_id,rater_id,rating,review,created_at,rater:profiles!user_ratings_rater_id_fkey(username),bounty:bounties!user_ratings_bounty_id_fkey(title)")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .order("rating_id", { ascending: false })
    .range(offset, offset + RATINGS_PER_PAGE - 1);
  if (error) throw error;
  return data ?? [];
}
