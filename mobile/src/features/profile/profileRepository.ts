import { supabase } from "../../lib/supabase";

export type OwnProfile = {
  userId: string;
  username: string;
  totalPoints: number;
  averageRating: number;
  totalGold: number;
};

export async function getOwnProfile(userId: string): Promise<OwnProfile | null> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,username,total_points,average_rating,total_gold")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    userId: data.user_id,
    username: data.username,
    totalPoints: data.total_points,
    averageRating: Number(data.average_rating),
    totalGold: data.total_gold,
  };
}
