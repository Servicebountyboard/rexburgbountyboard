import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, AppHeader, Surface } from "./ui";
import { listWorkClaims, type WorkClaim } from "../features/bounty/workRepository";
import { BountyChatModal } from "./WorkScreen";
import type { AppColors } from "../theme";

type ChatFilter = "Friends" | "Bounties";

export function ChatScreen({ colors, onProfile, userId }: { colors: AppColors; onProfile: () => void; userId: string }) {
  const [filter, setFilter] = useState<ChatFilter>("Bounties");
  const [claimsState, setClaimsState] = useState<{ userId: string; claims: WorkClaim[]; error: string | null } | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [activeChat, setActiveChat] = useState<{ id: number; title: string } | null>(null);

  useEffect(() => {
    let active = true;
    listWorkClaims(userId).then((claims) => {
      if (active) setClaimsState({ userId, claims: claims.filter((claim) => claim.claimStatus === "ASSIGNED"), error: null });
    }).catch((error: unknown) => {
      if (active) setClaimsState({ userId, claims: [], error: error instanceof Error ? error.message : "Could not load bounty conversations." });
    });
    return () => { active = false; };
  }, [userId, refresh]);

  const current = claimsState?.userId === userId ? claimsState : null;

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <AppHeader colors={colors} title="Chat" subtitle="Friends and bounty conversations" onProfile={onProfile} />
    <View style={[styles.segment, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      {(["Friends", "Bounties"] as const).map((item) => <Pressable key={item} accessibilityRole="tab" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.segmentTab, { borderColor: filter === item ? colors.accent : "transparent", backgroundColor: filter === item ? colors.accentSoft : "transparent" }]}>
        <Text style={{ color: colors.text, fontWeight: "600" }}>{item === "Friends" ? "♧" : "✦"}  {item}</Text>
      </Pressable>)}
    </View>

    {filter === "Friends" ? <View style={styles.emptyWrap}><Surface colors={colors} style={styles.empty}>
      <Text style={{ fontSize: 32, color: colors.accent }}>✉</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Friend messaging isn’t available yet</Text>
      <Text style={{ color: colors.muted, lineHeight: 21, textAlign: "center" }}>The deployed database has no friend or direct-conversation policies and no trusted RPCs for friend requests, conversation creation, or direct messages.</Text>
    </Surface></View> : !current ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted, marginTop: 10 }}>Loading accepted bounty conversations…</Text></View> : current.error ? <Surface colors={colors} style={styles.empty}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>Conversations could not be loaded</Text>
      <Text accessibilityRole="alert" style={{ color: colors.muted, lineHeight: 20 }}>{current.error}</Text>
      <AppButton colors={colors} label="Retry" secondary onPress={() => setRefresh((value) => value + 1)} />
    </Surface> : <ScrollView contentContainerStyle={styles.list}>
      {current.claims.length ? current.claims.map((claim) => <Pressable key={claim.claimId} accessibilityRole="button" onPress={() => setActiveChat({ id: claim.bountyId, title: claim.title })}>
        <Surface colors={colors} style={styles.row}>
          <View style={[styles.initials, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontWeight: "800" }}>✦</Text></View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.name, { color: colors.text }]}>{claim.title}</Text>
            <Text numberOfLines={1} style={{ color: colors.muted }}>{claim.posterId === userId ? `With ${claim.hunterName ?? "approved hunter"}` : `With ${claim.posterName ?? "bounty poster"}`}</Text>
          </View>
          <Text style={{ color: colors.accentStrong }}>Open ›</Text>
        </Surface>
      </Pressable>) : <Surface colors={colors} style={styles.empty}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>No bounty conversations yet</Text>
        <Text style={{ color: colors.muted, textAlign: "center", lineHeight: 21 }}>Bounty chat becomes available after a claim is accepted.</Text>
      </Surface>}
    </ScrollView>}

    <BountyChatModal bounty={activeChat} userId={userId} colors={colors} onClose={() => setActiveChat(null)} />
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, segment: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderRadius: 13, padding: 3 },
  segmentTab: { flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 16, paddingBottom: 18, gap: 8 }, row: { minHeight: 76, padding: 12, flexDirection: "row", alignItems: "center", gap: 12 }, initials: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" }, name: { fontSize: 15, fontWeight: "800" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" }, emptyWrap: { flex: 1, justifyContent: "center", padding: 16 }, empty: { alignItems: "center", gap: 12, padding: 24, marginHorizontal: 16 },
});
