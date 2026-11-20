import { supabase } from "../../lib/supabase";

export type BoardBounty = {
  id: number;
  title: string;
  description: string;
  materials: string | null;
  estimatedMinutes: number | null;
  rewardPoints: number;
  createdAt: string;
  status: string;
  poster: string | null;
};

export const BOUNTIES_PER_PAGE = 20;

function firstRelated<T>(value: T | T[] | null): T | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined;
}

export async function listBoardBounties({ search, offset }: { search: string; offset: number }) {
  if (!supabase) throw new Error("Supabase is not configured.");

  let request = supabase
    .from("bounties")
    .select("bounty_id,title,description,materials,estimated_minutes,reward_points,created_at,status:bounty_status!bounties_bounty_status_id_fkey(status_name),poster:profiles!bounties_poster_id_fkey(username)")
    .eq("status.status_name", "POSTED")
    .order("created_at", { ascending: false })
    .order("bounty_id", { ascending: false })
    .range(offset, offset + BOUNTIES_PER_PAGE - 1);

  const normalizedSearch = search.trim();
  if (normalizedSearch) request = request.ilike("title", `%${normalizedSearch}%`);

  const { data, error } = await request;
  if (error) throw error;

  return (data ?? []).map((row): BoardBounty => {
    const status = firstRelated(row.status);
    const poster = firstRelated(row.poster);
    return {
    id: row.bounty_id,
    title: row.title,
    description: row.description,
    materials: row.materials,
    estimatedMinutes: row.estimated_minutes,
    rewardPoints: row.reward_points,
    createdAt: row.created_at,
    status: status?.status_name ?? "Status unavailable",
    poster: poster?.username ?? null,
    };
  });
}

export async function createBounty(input: {
  title: string;
  description: string;
  materials: string;
  estimatedMinutes: number;
  address: string;
}): Promise<number> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("create_bounty", {
    p_title: input.title,
    p_description: input.description,
    p_materials: input.materials || null,
    p_estimated_minutes: input.estimatedMinutes,
    p_address: input.address || null,
  });
  if (error) throw error;
  if (typeof data !== "number") throw new Error("The database did not return the created bounty ID.");
  return data;
}

export async function requestBountyClaim(bountyId: number): Promise<number> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("request_claim", { p_bounty_id: bountyId });
  if (error) throw error;
  if (typeof data !== "number") throw new Error("The database did not confirm the claim request.");
  return data;
}
