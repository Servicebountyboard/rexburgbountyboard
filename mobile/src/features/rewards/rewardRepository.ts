import { supabase } from "../../lib/supabase";

export const REWARDS_PER_PAGE = 30;

export async function listRewardTransactions(userId: string, offset = 0) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("reward_transactions")
    .select("reward_id,bounty_id,bounty_claim_id,points,reason,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .order("reward_id", { ascending: false })
    .range(offset, offset + REWARDS_PER_PAGE - 1);
  if (error) throw error;
  return data ?? [];
}
