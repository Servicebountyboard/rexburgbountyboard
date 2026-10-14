import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { Action, emptyState, State } from "./live-model";

type ContextValue = {
  state: State;
  session: Session | null;
  ready: boolean;
  busy: boolean;
  refresh: () => Promise<boolean>;
  act: (action: Action) => Promise<boolean>;
  clearError: () => void;
};
const Context = createContext<ContextValue | null>(null);
const getRows = <T,>(result: { data: T[] | null; error: { message: string } | null }) => {
  if (result.error) throw new Error(result.error.message);
  return result.data ?? [];
};
const intId = (value: string) => {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Invalid record ID.");
  return id;
};
const bountyStatus = (name: string | undefined): State["bounties"][number]["status"] => {
  switch (name) {
    case "POSTED": return "open";
    case "ASSIGNED":
    case "IN_PROGRESS": return "active";
    case "SUBMITTED": return "review";
    case "COMPLETED": return "completed";
    case "DRAFT": return "draft";
    case "CANCELLED": return "cancelled";
    default: return "closed";
  }
};
const claimStatus = (name: string | undefined): State["claims"][number]["status"] => {
  switch (name) {
    case "PENDING": return "pending";
    case "ASSIGNED": return "accepted";
    case "REJECTED": return "rejected";
    case "CANCELLED": return "cancelled";
    default: return "other";
  }
};

export function TavernProvider({ children }: React.PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [state, setState] = useState<State>(emptyState);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (userId: string): Promise<boolean> => {
    if (!supabase) return false;
    try {
      const [profiles, bounties, bountyStatuses, claims, claimStatuses, notices, messages, ratings, rewards, submissions] = await Promise.all([
        supabase.from("profiles").select("user_id,username,biography,total_points,average_rating"),
        supabase.from("bounties").select("bounty_id,poster_id,bounty_status_id,title,description,materials,estimated_minutes,reward_points,created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("bounty_status").select("bounty_status_id,status_name"),
        supabase.from("bounty_claims").select("bounty_claim_id,bounty_id,hunter_id,bounty_claim_status_id"),
        supabase.from("bounty_claim_status").select("bounty_claim_status_id,status_name"),
        supabase.from("notifications").select("notification_id,user_id,bounty_id,title,message,is_read,created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("bounty_messages").select("message_id,bounty_id,sender_id,message_text,created_at").order("created_at", { ascending: true }).limit(500),
        supabase.from("user_ratings").select("bounty_id,recipient_id,rating,review"),
        supabase.from("reward_transactions").select("user_id,bounty_claim_id"),
        supabase.from("bounty_submissions").select("bounty_claim_id,submission_status,review_notes,submission_number").order("submission_number", { ascending: true }),
      ]);
      const profileRows = getRows(profiles);
      const bountyRows = getRows(bounties);
      const statusRows = getRows(bountyStatuses);
      const claimRows = getRows(claims);
      const claimStatusRows = getRows(claimStatuses);
      const noticeRows = getRows(notices);
      const messageRows = getRows(messages);
      const ratingRows = getRows(ratings);
      const rewardRows = getRows(rewards);
      const submissionRows = getRows(submissions);
      const statusById = new Map(statusRows.map((row) => [row.bounty_status_id, row.status_name]));
      const claimStatusById = new Map(claimStatusRows.map((row) => [row.bounty_claim_status_id, row.status_name]));
      const accepted = new Map(claimRows.filter((row) => claimStatusById.get(row.bounty_claim_status_id) === "ASSIGNED").map((row) => [row.bounty_id, row.hunter_id]));
      const feedback = new Map<number, string>();
      for (const row of submissionRows) {
        if (row.submission_status !== "CHANGES_REQUESTED" || !row.review_notes) continue;
        const claim = claimRows.find((item) => item.bounty_claim_id === row.bounty_claim_id);
        if (claim) feedback.set(claim.bounty_id, row.review_notes);
      }
      setState({
        currentId: userId,
        people: profileRows.map((row) => ({
          id: row.user_id,
          name: row.username || "Neighbor",
          initials: (row.username || "N").slice(0, 2).toUpperCase(),
          bio: row.biography || "A neighbor in Rexburg.",
          rating: Number(row.average_rating || 0).toFixed(1),
          completed: rewardRows.filter((reward) => reward.user_id === row.user_id).length,
          xp: Number(row.total_points || 0),
        })),
        bounties: bountyRows.map((row) => ({
          id: String(row.bounty_id),
          publisher: row.poster_id,
          title: row.title,
          description: row.description,
          bring: row.materials || "No materials listed.",
          xp: row.reward_points,
          duration: row.estimated_minutes ? `${row.estimated_minutes} minutes` : "Flexible",
          location: "Rexburg, Idaho",
          address: "",
          status: bountyStatus(statusById.get(row.bounty_status_id)),
          hunterId: accepted.get(row.bounty_id),
          feedback: feedback.get(row.bounty_id),
        })),
        claims: claimRows.map((row) => ({
          id: String(row.bounty_claim_id),
          bountyId: String(row.bounty_id),
          hunterId: row.hunter_id,
          status: claimStatus(claimStatusById.get(row.bounty_claim_status_id)),
        })),
        notices: noticeRows.map((row) => ({ id: String(row.notification_id), recipient: row.user_id, bountyId: row.bounty_id == null ? "" : String(row.bounty_id), title: row.title, body: row.message, read: row.is_read, time: row.created_at })),
        messages: messageRows.map((row) => ({ id: String(row.message_id), bountyId: String(row.bounty_id), sender: row.sender_id, text: row.message_text, time: row.created_at })),
        ratings: ratingRows.map((row) => ({ bountyId: String(row.bounty_id), hunterId: row.recipient_id, score: row.rating, comment: row.review || "" })),
        error: null,
      });
      return true;
    } catch (error) {
      setState((old) => ({ ...old, currentId: userId, error: error instanceof Error ? error.message : "Could not load data." }));
      return false;
    }
  }, []);

  const refresh = useCallback(async () => session?.user.id ? load(session.user.id) : false, [load, session]);
  useEffect(() => {
    let alive = true;
    if (!supabase) {
      setState({ ...emptyState, error: "Supabase is not configured. Add mobile/.env and restart Expo." });
      setReady(true);
      return;
    }
    const applySession = async (next: Session | null) => {
      if (!alive) return;
      setSession(next);
      if (next) await load(next.user.id);
      else setState(emptyState);
      if (alive) setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => applySession(data.session)).catch(() => setReady(true));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, next) => {
      setTimeout(() => { void applySession(next); }, 0);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, [load]);

  async function act(action: Action): Promise<boolean> {
    if (!supabase || !session) {
      setState((old) => ({ ...old, error: "Sign in to continue." }));
      return false;
    }
    setBusy(true);
    setState((old) => ({ ...old, error: null }));
    try {
      const request = (() => {
        switch (action.type) {
          case "create": return supabase.rpc("create_bounty", { p_title: action.title, p_description: action.description, p_materials: action.materials, p_estimated_minutes: action.estimatedMinutes, p_address: action.address });
          case "claim": return supabase.rpc("request_claim", { p_bounty_id: intId(action.bountyId) });
          case "decide": return supabase.rpc("decide_claim", { p_claim_id: intId(action.claimId), p_accept: action.accept });
          case "submit": return supabase.rpc("submit_work", { p_bounty_id: intId(action.bountyId) });
          case "complete": return supabase.rpc("review_work", { p_bounty_id: intId(action.bountyId), p_approve: true, p_feedback: "" });
          case "notYet": return supabase.rpc("review_work", { p_bounty_id: intId(action.bountyId), p_approve: false, p_feedback: action.feedback });
          case "message": return supabase.rpc("send_bounty_message", { p_bounty_id: intId(action.bountyId), p_text: action.text });
          case "rate": return supabase.rpc("rate_hunter", { p_bounty_id: intId(action.bountyId), p_rating: action.score, p_review: action.comment });
          case "read": return supabase.rpc("mark_notification_read", { p_notification_id: intId(action.id) });
        }
      })();
      const { error } = await request;
      if (error) throw error;
      return await load(session.user.id);
    } catch (error) {
      setState((old) => ({ ...old, error: error instanceof Error ? error.message : "That request failed." }));
      return false;
    } finally {
      setBusy(false);
    }
  }
  return <Context.Provider value={{ state, session, ready, busy, refresh, act, clearError: () => setState((old) => ({ ...old, error: null })) }}>{children}</Context.Provider>;
}

export function useTavern() {
  const context = useContext(Context);
  if (!context) throw new Error("TavernProvider required");
  return context;
}
