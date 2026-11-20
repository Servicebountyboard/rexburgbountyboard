import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton, Surface } from "./ui";
import {
  decideClaim,
  getPrivateAddress,
  listBountyMessages,
  listMyPostedBounties,
  listWorkClaims,
  rateHunter,
  reviewWork,
  sendBountyMessage,
  submitWork,
  type WorkClaim,
} from "../features/bounty/workRepository";
import type { AppColors } from "../theme";

type PostedBounty = Awaited<ReturnType<typeof listMyPostedBounties>>[number];
type DashboardState = { userId: string; posts: PostedBounty[]; claims: WorkClaim[]; error: string | null };

export function WorkScreen({ userId, colors }: { userId: string; colors: AppColors }) {
  const [tab, setTab] = useState<"My Posts" | "Claims">("My Posts");
  const [dashboard, setDashboard] = useState<DashboardState | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [activeChat, setActiveChat] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([listMyPostedBounties(userId), listWorkClaims(userId)]).then(([posts, claims]) => {
      if (active) setDashboard({ userId, posts, claims, error: null });
    }).catch((error: unknown) => {
      if (active) setDashboard({ userId, posts: [], claims: [], error: error instanceof Error ? error.message : "Could not load your work." });
    });
    return () => { active = false; };
  }, [userId, refresh]);

  const current = dashboard?.userId === userId ? dashboard : null;
  const loading = !current;
  const posts = current?.posts ?? [];
  const claims = current?.claims ?? [];
  const error = current?.error ?? null;

  return <View style={styles.root}>
    <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {(["My Posts", "Claims"] as const).map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: tab === item }} onPress={() => setTab(item)} style={[styles.segmentItem, { backgroundColor: tab === item ? colors.accentSoft : "transparent", borderColor: tab === item ? colors.accent : "transparent" }]}>
        <Text style={{ color: colors.text, fontWeight: "700" }}>{item}</Text>
      </Pressable>)}
    </View>
    {error ? <Surface colors={colors} style={styles.stateCard}>
      <Text style={{ color: colors.text, fontWeight: "800", fontSize: 17 }}>Work could not be loaded</Text>
      <Text accessibilityRole="alert" style={{ color: colors.muted, lineHeight: 20 }}>{error}</Text>
      <AppButton colors={colors} label="Retry" secondary onPress={() => setRefresh((value) => value + 1)} />
    </Surface> : loading ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted, marginTop: 10 }}>Loading your work…</Text></View> : tab === "My Posts" ? <ScrollView contentContainerStyle={styles.list}>
      {posts.length ? posts.map((post) => <Surface key={post.id} colors={colors} style={styles.card}>
        <View style={styles.cardTop}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>{post.title}</Text><Text style={[styles.status, { color: colors.accentStrong, backgroundColor: colors.accentSoft }]}>{post.status}</Text></View>
        <Text numberOfLines={2} style={{ color: colors.muted, lineHeight: 20 }}>{post.description}</Text>
        <View style={styles.cardBottom}><Text style={{ color: colors.muted }}>Bounty #{post.id}</Text><Text style={{ color: colors.text, fontWeight: "700" }}>{post.rewardPoints} XP</Text></View>
      </Surface>) : <Empty colors={colors} text="You haven't posted any bounties yet." />}
    </ScrollView> : <ScrollView contentContainerStyle={styles.list}>
      {claims.length ? claims.map((claim) => <ClaimCard key={claim.claimId} claim={claim} userId={userId} colors={colors} onChanged={() => setRefresh((value) => value + 1)} onOpenChat={() => setActiveChat({ id: claim.bountyId, title: claim.title })} />) : <Empty colors={colors} text="You have no claims or incoming claim requests." />}
    </ScrollView>}
    <BountyChatModal bounty={activeChat} userId={userId} colors={colors} onClose={() => setActiveChat(null)} />
  </View>;
}

function Empty({ colors, text }: { colors: AppColors; text: string }) {
  return <Surface colors={colors} style={styles.stateCard}><Text style={{ color: colors.text, fontWeight: "700" }}>{text}</Text></Surface>;
}

function ClaimCard({ claim, userId, colors, onChanged, onOpenChat }: { claim: WorkClaim; userId: string; colors: AppColors; onChanged: () => void; onOpenChat: () => void }) {
  const isPoster = claim.posterId === userId;
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [review, setReview] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const run = async (action: () => Promise<void>, success: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      Alert.alert("Saved", success);
      onChanged();
    } catch (mutationError: unknown) {
      setError(mutationError instanceof Error ? mutationError.message : "The request failed. Your input has been kept.");
    } finally {
      setBusy(false);
    }
  };

  const openAddress = async () => {
    setBusy(true);
    setError(null);
    try {
      const address = await getPrivateAddress(claim.bountyId);
      Alert.alert("Meeting address", address || "No address was provided for this bounty.");
    } catch (addressError: unknown) {
      setError(addressError instanceof Error ? addressError.message : "Meeting details are not available to this account.");
    } finally {
      setBusy(false);
    }
  };

  return <Surface colors={colors} style={styles.card}>
    <View style={styles.cardTop}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>{claim.title}</Text><Text style={[styles.status, { color: colors.accentStrong, backgroundColor: colors.accentSoft }]}>{claim.claimStatus.replaceAll("_", " ")}</Text></View>
    <Text style={{ color: colors.muted }}>{isPoster ? `Claim from ${claim.hunterName ?? "community member"}` : `Posted by ${claim.posterName ?? "community member"}`}</Text>
    <Text style={{ color: colors.muted }}>Bounty status: {claim.bountyStatus.replaceAll("_", " ")}</Text>

    {isPoster && claim.claimStatus === "PENDING" ? <View style={styles.actionRow}>
      <AppButton colors={colors} label={busy ? "Saving…" : "Accept"} disabled={busy} onPress={() => { void run(() => decideClaim(claim.claimId, true), "The claim was accepted. Other pending requests were declined by the database."); }} />
      <AppButton colors={colors} label={busy ? "Saving…" : "Decline"} disabled={busy} secondary onPress={() => { void run(() => decideClaim(claim.claimId, false), "The claim was declined."); }} />
    </View> : null}

    {!isPoster && claim.claimStatus === "ASSIGNED" && claim.bountyStatus === "IN_PROGRESS" ? <AppButton colors={colors} label={busy ? "Submitting…" : "Submit work"} disabled={busy} onPress={() => { void run(async () => { await submitWork(claim.bountyId); }, "Your work was submitted for review."); }} /> : null}

    {isPoster && claim.claimStatus === "ASSIGNED" && claim.bountyStatus === "SUBMITTED" ? <View style={styles.actionGroup}>
      <TextInput multiline maxLength={2000} value={feedback} onChangeText={setFeedback} placeholder="Feedback required if changes are requested" placeholderTextColor={colors.muted} style={[styles.feedback, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
      <AppButton colors={colors} label={busy ? "Reviewing…" : "Approve work"} disabled={busy} onPress={() => { void run(() => reviewWork(claim.bountyId, true, ""), "Work approved. The database issued the XP reward."); }} />
      <AppButton colors={colors} label={busy ? "Reviewing…" : "Request changes"} disabled={busy || !feedback.trim()} secondary onPress={() => { void run(async () => { await reviewWork(claim.bountyId, false, feedback.trim()); setFeedback(""); }, "Feedback was sent and the bounty returned to in progress."); }} />
    </View> : null}

    {isPoster && claim.claimStatus === "ASSIGNED" && claim.bountyStatus === "COMPLETED" ? <View style={styles.actionGroup}>
      <Text style={{ color: colors.text, fontWeight: "700" }}>Rate the completed work</Text>
      <View style={styles.ratingRow}>{([1, 2, 3, 4, 5] as const).map((value) => <Pressable key={value} accessibilityRole="radio" accessibilityState={{ checked: rating === value }} onPress={() => setRating(value)} style={[styles.ratingButton, { borderColor: rating === value ? colors.accent : colors.line, backgroundColor: rating === value ? colors.accentSoft : colors.surface }]}><Text style={{ color: colors.text }}>{value}</Text></Pressable>)}</View>
      <TextInput maxLength={500} value={review} onChangeText={setReview} placeholder="Review (optional)" placeholderTextColor={colors.muted} style={[styles.feedback, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
      <AppButton colors={colors} label={busy ? "Submitting…" : "Submit rating"} disabled={busy} onPress={() => { void run(async () => { await rateHunter(claim.bountyId, rating, review.trim()); setReview(""); }, "Your rating was saved."); }} />
    </View> : null}

    {claim.claimStatus === "ASSIGNED" ? <View style={styles.actionRow}>
      <AppButton colors={colors} label="Open bounty chat" secondary onPress={onOpenChat} />
      <AppButton colors={colors} label={busy ? "Loading…" : "Meeting address"} secondary disabled={busy} onPress={() => { void openAddress(); }} />
    </View> : null}
    {error ? <Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{error}</Text> : null}
  </Surface>;
}

type BountyMessage = { message_id: number; sender_id: string; message_text: string; created_at: string; sender: { username: string } | { username: string }[] | null };

export function BountyChatModal({ bounty, userId, colors, onClose }: { bounty: { id: number; title: string } | null; userId: string; colors: AppColors; onClose: () => void }) {
  const [messages, setMessages] = useState<BountyMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const activeBountyId = bounty?.id;
  const [loadedBountyId, setLoadedBountyId] = useState<number | null>(null);

  useEffect(() => {
    if (!activeBountyId) return;
    let active = true;
    listBountyMessages(activeBountyId, offset).then((page) => {
      if (!active) return;
      setMessages((current) => offset ? [...page, ...current] : page as BountyMessage[]);
      setLoadedBountyId(activeBountyId);
      setError(null);
    }).catch((queryError: unknown) => {
      if (active) setError(queryError instanceof Error ? queryError.message : "Could not load this conversation.");
    });
    return () => { active = false; };
  }, [activeBountyId, offset, refresh]);

  const send = async () => {
    if (!activeBountyId || !draft.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await sendBountyMessage(activeBountyId, draft.trim());
      setDraft("");
      setOffset(0);
      setRefresh((value) => value + 1);
    } catch (sendError: unknown) {
      setError(sendError instanceof Error ? sendError.message : "Message was not sent. Your draft has been kept.");
    } finally {
      setBusy(false);
    }
  };

  return <Modal visible={Boolean(bounty)} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.backdrop}><View style={[styles.chatSheet, { backgroundColor: colors.background }]}>
      <View style={[styles.handle, { backgroundColor: colors.line }]} />
      <View style={styles.cardTop}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{bounty?.title}</Text><Text style={{ color: colors.muted, marginTop: 4 }}>Bounty conversation</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close conversation" onPress={onClose} style={[styles.close, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text }}>×</Text></Pressable></View>
      {offset < 100 ? <AppButton colors={colors} label="Load older messages" secondary onPress={() => setOffset((value) => value + 50)} /> : null}
      <ScrollView style={styles.messages} contentContainerStyle={styles.messageList}>
        {loadedBountyId === activeBountyId && messages.length ? messages.map((message) => {
          const sender = Array.isArray(message.sender) ? message.sender[0] : message.sender;
          const mine = message.sender_id === userId;
          return <View key={message.message_id} style={[styles.messageBubble, { alignSelf: mine ? "flex-end" : "flex-start", backgroundColor: mine ? colors.accentSoft : colors.surface, borderColor: mine ? colors.accent : colors.line }]}>
            <Text style={{ color: colors.muted, fontSize: 11 }}>{mine ? "You" : sender?.username ?? "Participant"}</Text>
            <Text style={{ color: colors.text, lineHeight: 21 }}>{message.message_text}</Text>
            <Text style={{ color: colors.muted, fontSize: 10, textAlign: "right" }}>{new Date(message.created_at).toLocaleString()}</Text>
          </View>;
        }) : loadedBountyId === activeBountyId && !error ? <Text style={{ color: colors.muted, textAlign: "center", marginTop: 20 }}>No messages in this bounty conversation yet.</Text> : null}
      </ScrollView>
      {error ? <Text accessibilityRole="alert" style={{ color: "#E07B70" }}>{error}</Text> : null}
      <View style={[styles.composer, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <TextInput accessibilityLabel="Type a bounty message" maxLength={2000} value={draft} onChangeText={setDraft} placeholder="Message the approved participant…" placeholderTextColor={colors.muted} style={[styles.composerInput, { color: colors.text }]} onSubmitEditing={() => { void send(); }} returnKeyType="send" />
        <AppButton colors={colors} label={busy ? "Sending…" : "Send"} disabled={busy || !draft.trim()} onPress={() => { void send(); }} />
      </View>
    </View></View>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, segment: { flexDirection: "row", borderWidth: 1, borderRadius: 13, padding: 3, marginHorizontal: 16, marginBottom: 12 }, segmentItem: { flex: 1, minHeight: 42, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 16, gap: 10 }, card: { padding: 14, gap: 10 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 9 }, title: { fontSize: 16, fontWeight: "800", lineHeight: 22 }, status: { fontSize: 10, fontWeight: "800", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, overflow: "hidden" }, cardBottom: { flexDirection: "row", justifyContent: "space-between" },
  stateCard: { marginHorizontal: 16, padding: 20, alignItems: "center", gap: 12 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, actionGroup: { gap: 8, marginTop: 4 }, actionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, feedback: { minHeight: 48, borderWidth: 1, borderRadius: 12, padding: 11, textAlignVertical: "top" }, ratingRow: { flexDirection: "row", gap: 8 }, ratingButton: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }, chatSheet: { height: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20, gap: 10 }, handle: { width: 40, height: 4, alignSelf: "center", borderRadius: 4 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, messages: { flex: 1 }, messageList: { gap: 8, paddingVertical: 8 }, messageBubble: { maxWidth: "86%", borderWidth: 1, borderRadius: 15, padding: 10, gap: 4 }, composer: { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 14, padding: 6 }, composerInput: { flex: 1, minHeight: 42, paddingHorizontal: 8 },
});
