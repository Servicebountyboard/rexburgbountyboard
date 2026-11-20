import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppButton, Surface } from "./ui";
import { listReceivedRatings, RATINGS_PER_PAGE } from "../features/ratings/ratingRepository";
import { listRewardTransactions, REWARDS_PER_PAGE } from "../features/rewards/rewardRepository";
import type { AppColors } from "../theme";

type Section = "reviews" | "history";
type RecordPage = { userId: string; section: Section; rows: Record<string, unknown>[]; hasMore: boolean; error: string | null };

export function ProfileRecordsScreen({ userId, section, colors }: { userId: string; section: Section; colors: AppColors }) {
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [page, setPage] = useState<RecordPage | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const loadRows = async (): Promise<unknown[]> => section === "reviews"
      ? listReceivedRatings(userId, offset)
      : listRewardTransactions(userId, offset);
    Promise.resolve().then(() => {
      setLoading(true);
      return loadRows();
    }).then((rows) => {
      if (!active) return;
      const limit = section === "reviews" ? RATINGS_PER_PAGE : REWARDS_PER_PAGE;
      setPage((current) => ({
        userId,
        section,
        rows: offset && current?.userId === userId && current.section === section ? [...current.rows, ...(rows as unknown as Record<string, unknown>[])] : rows as unknown as Record<string, unknown>[],
        hasMore: rows.length === limit,
        error: null,
      }));
    }).catch((queryError: unknown) => {
      if (active) setPage({ userId, section, rows: [], hasMore: false, error: queryError instanceof Error ? queryError.message : "Could not load account history." });
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [userId, section, offset, refresh]);

  const current = page?.userId === userId && page.section === section ? page : null;
  const rowLimit = section === "reviews" ? RATINGS_PER_PAGE : REWARDS_PER_PAGE;
  const refreshList = () => { setOffset(0); setPage(null); setRefresh((value) => value + 1); };

  return <View style={styles.root}>
    {loading && !current ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted, marginTop: 10 }}>Loading {section === "reviews" ? "reviews" : "XP history"}…</Text></View> : null}
    {current?.error ? <Surface colors={colors} style={styles.state}><Text style={{ color: colors.text, fontWeight: "800" }}>Could not load {section === "reviews" ? "reviews" : "XP history"}</Text><Text accessibilityRole="alert" style={{ color: colors.muted }}>{current.error}</Text><AppButton colors={colors} label="Retry" secondary onPress={refreshList} /></Surface> : null}
    {current && !current.error ? <>
      {current.rows.length ? current.rows.map((row) => section === "reviews" ? <RatingCard key={String(row.rating_id)} row={row} colors={colors} /> : <RewardCard key={String(row.reward_id)} row={row} colors={colors} />) : <Surface colors={colors} style={styles.state}><Text style={{ color: colors.text, fontWeight: "800" }}>No {section === "reviews" ? "reviews" : "XP rewards"} yet</Text><Text style={{ color: colors.muted }}>This is the live result from your account.</Text></Surface>}
      {current.hasMore ? <View style={{ padding: 16 }}><AppButton colors={colors} label="Load older records" secondary onPress={() => setOffset((value) => value + rowLimit)} /></View> : null}
    </> : null}
  </View>;
}

function RatingCard({ row, colors }: { row: Record<string, unknown>; colors: AppColors }) {
  const raterValue = row.rater as { username?: string } | { username?: string }[] | null;
  const bountyValue = row.bounty as { title?: string } | { title?: string }[] | null;
  const rater = Array.isArray(raterValue) ? raterValue[0] : raterValue;
  const bounty = Array.isArray(bountyValue) ? bountyValue[0] : bountyValue;
  return <Surface colors={colors} style={styles.card}>
    <View style={styles.cardTop}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>{rater?.username ?? "Community member"}</Text><Text style={{ color: colors.accentStrong, fontWeight: "800" }}>{Number(row.rating)} / 5</Text></View>
    {bounty?.title ? <Text style={{ color: colors.muted }}>Bounty: {bounty.title}</Text> : null}
    {typeof row.review === "string" && row.review ? <Text style={{ color: colors.text, lineHeight: 21 }}>{row.review}</Text> : <Text style={{ color: colors.muted }}>No written review.</Text>}
    <Text style={{ color: colors.muted, fontSize: 11 }}>{new Date(String(row.created_at)).toLocaleDateString()}</Text>
  </Surface>;
}

function RewardCard({ row, colors }: { row: Record<string, unknown>; colors: AppColors }) {
  return <Surface colors={colors} style={styles.card}>
    <View style={styles.cardTop}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>{typeof row.reason === "string" && row.reason ? row.reason.replaceAll("_", " ") : "Bounty XP reward"}</Text><Text style={{ color: colors.accentStrong, fontWeight: "800" }}>+{Number(row.points)} XP</Text></View>
    <Text style={{ color: colors.muted }}>Bounty #{String(row.bounty_id)}</Text>
    <Text style={{ color: colors.muted, fontSize: 11 }}>{new Date(String(row.created_at)).toLocaleDateString()}</Text>
  </Surface>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, state: { margin: 16, padding: 22, alignItems: "center", gap: 10 }, card: { marginHorizontal: 16, marginBottom: 9, padding: 14, gap: 8 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { fontSize: 15, fontWeight: "800" } });
