import { supabase } from "../../lib/supabase";

export type WorkClaim = {
  claimId: number;
  bountyId: number;
  hunterId: string;
  hunterName: string | null;
  posterId: string;
  posterName: string | null;
  title: string;
  bountyStatus: string;
  claimStatus: string;
  createdAt: string;
};

type ClaimRow = {
  bounty_claim_id: number;
  bounty_id: number;
  hunter_id: string;
  created_at: string;
  status: { status_name: string } | { status_name: string }[] | null;
  hunter: { username: string } | { username: string }[] | null;
  bounty: {
    poster_id: string;
    title: string;
    status: { status_name: string } | { status_name: string }[] | null;
    poster: { username: string } | { username: string }[] | null;
  } | {
    poster_id: string;
    title: string;
    status: { status_name: string } | { status_name: string }[] | null;
    poster: { username: string } | { username: string }[] | null;
  }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? value[0] ?? null : value;
}

function mapClaim(row: ClaimRow): WorkClaim | null {
  const bounty = one(row.bounty);
  if (!bounty) return null;
  return {
    claimId: row.bounty_claim_id,
    bountyId: row.bounty_id,
    hunterId: row.hunter_id,
    hunterName: one(row.hunter)?.username ?? null,
    posterId: bounty.poster_id,
    posterName: one(bounty.poster)?.username ?? null,
    title: bounty.title,
    bountyStatus: one(bounty.status)?.status_name ?? "UNKNOWN",
    claimStatus: one(row.status)?.status_name ?? "UNKNOWN",
    createdAt: row.created_at,
  };
}

const CLAIM_SELECTION = "bounty_claim_id,bounty_id,hunter_id,created_at,status:bounty_claim_status!bounty_claims_bounty_claim_status_id_fkey(status_name),hunter:profiles!bounty_claims_hunter_id_fkey(username),bounty:bounties!bounty_claims_bounty_id_fkey(poster_id,title,status:bounty_status!bounties_bounty_status_id_fkey(status_name),poster:profiles!bounties_poster_id_fkey(username))";
const POSTER_CLAIM_SELECTION = CLAIM_SELECTION.replace("bounty:bounties!bounty_claims_bounty_id_fkey(", "bounty:bounties!bounty_claims_bounty_id_fkey!inner(");

export async function listWorkClaims(userId: string): Promise<WorkClaim[]> {
  if (!supabase) throw new Error("Supabase is not configured.");

  const [hunterResult, posterResult] = await Promise.all([
    supabase.from("bounty_claims").select(CLAIM_SELECTION).eq("hunter_id", userId).order("created_at", { ascending: false }).range(0, 49),
    supabase.from("bounty_claims").select(POSTER_CLAIM_SELECTION).eq("bounty.poster_id", userId).order("created_at", { ascending: false }).range(0, 49),
  ]);

  if (hunterResult.error) throw hunterResult.error;
  if (posterResult.error) throw posterResult.error;

  const claims = new Map<number, WorkClaim>();
  for (const row of [...(hunterResult.data ?? []), ...(posterResult.data ?? [])] as unknown as ClaimRow[]) {
    const mapped = mapClaim(row);
    if (mapped) claims.set(mapped.claimId, mapped);
  }
  return [...claims.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listMyPostedBounties(userId: string) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("bounties")
    .select("bounty_id,title,description,reward_points,created_at,status:bounty_status!bounties_bounty_status_id_fkey(status_name)")
    .eq("poster_id", userId)
    .order("created_at", { ascending: false })
    .range(0, 49);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.bounty_id,
    title: row.title,
    description: row.description,
    rewardPoints: row.reward_points,
    createdAt: row.created_at,
    status: one(row.status)?.status_name ?? "UNKNOWN",
  }));
}

export async function decideClaim(claimId: number, accept: boolean): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("decide_claim", { p_claim_id: claimId, p_accept: accept });
  if (error) throw error;
}

export async function submitWork(bountyId: number): Promise<number> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("submit_work", { p_bounty_id: bountyId });
  if (error) throw error;
  if (typeof data !== "number") throw new Error("The database did not confirm the work submission.");
  return data;
}

export async function reviewWork(bountyId: number, approve: boolean, feedback: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("review_work", {
    p_bounty_id: bountyId,
    p_approve: approve,
    p_feedback: feedback || null,
  });
  if (error) throw error;
}

export async function sendBountyMessage(bountyId: number, text: string): Promise<number> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("send_bounty_message", { p_bounty_id: bountyId, p_text: text });
  if (error) throw error;
  if (typeof data !== "number") throw new Error("The database did not confirm the message.");
  return data;
}

export async function listBountyMessages(bountyId: number, offset = 0) {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.from("bounty_messages")
    .select("message_id,bounty_id,sender_id,message_text,created_at,sender:profiles!bounty_messages_sender_id_fkey(username)")
    .eq("bounty_id", bountyId)
    .order("created_at", { ascending: false })
    .range(offset, offset + 49);
  if (error) throw error;
  return (data ?? []).reverse();
}

export async function rateHunter(bountyId: number, rating: number, review: string): Promise<void> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { error } = await supabase.rpc("rate_hunter", { p_bounty_id: bountyId, p_rating: rating, p_review: review || null });
  if (error) throw error;
}

export async function getPrivateAddress(bountyId: number): Promise<string | null> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_private_address", { p_bounty_id: bountyId });
  if (error) throw error;
  return typeof data === "string" ? data : null;
}
