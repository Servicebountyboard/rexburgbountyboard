import { supabase } from "../../lib/supabase";

export type XpExchangeInfo = {
  availableXp: number;
  xpPerGold: number;
  totalGold: number;
};

export type XpExchangeResult = XpExchangeInfo & {
  exchangeId: number;
  xpSpent: number;
  goldReceived: number;
};

function mapExchangeInfo(data: Record<string, unknown>): XpExchangeInfo {
  const info = {
    availableXp: Number(data.available_xp),
    xpPerGold: Number(data.xp_per_gold),
    totalGold: Number(data.total_gold),
  };
  if (!Number.isFinite(info.availableXp) || !Number.isInteger(info.xpPerGold) || info.xpPerGold <= 0 || !Number.isFinite(info.totalGold)) {
    throw new Error("The XP exchange response contained invalid values.");
  }
  return info;
}

export async function getXpExchangeInfo(): Promise<XpExchangeInfo> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_xp_exchange_info");
  if (error) throw error;
  if (!data || typeof data !== "object") throw new Error("The XP exchange response was invalid.");
  return mapExchangeInfo(data as Record<string, unknown>);
}

export async function exchangeXpForGold(xpAmount: number, idempotencyKey: string): Promise<XpExchangeResult> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("exchange_xp_for_gold", {
    p_xp_amount: xpAmount,
    p_idempotency_key: idempotencyKey,
  });
  if (error) throw error;
  if (!data || typeof data !== "object") throw new Error("The XP exchange response was invalid.");

  const result = data as Record<string, unknown>;
  return {
    ...mapExchangeInfo(result),
    exchangeId: Number(result.exchange_id),
    xpSpent: Number(result.xp_spent),
    goldReceived: Number(result.gold_received),
  };
}
