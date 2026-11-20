import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton, AppHeader, Reward, Surface } from "./ui";
import { BOUNTIES_PER_PAGE, createBounty, listBoardBounties, requestBountyClaim, type BoardBounty } from "../features/bounty/bountyRepository";
import type { AppColors } from "../theme";

type BoardResult = { query: string; offset: number; items: BoardBounty[]; loading: boolean; error: string | null; hasMore: boolean };

export function BoardScreen({ colors, onProfile }: { colors: AppColors; onProfile: () => void }) {
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selected, setSelected] = useState<BoardBounty | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [materials, setMaterials] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState("60");
  const [address, setAddress] = useState("");
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [claimBusy, setClaimBusy] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [result, setResult] = useState<BoardResult>({ query: "", offset: 0, items: [], loading: true, error: null, hasMore: true });
  const resultIsCurrent = result.query === search && (offset === 0 || result.offset === offset);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setResult((current) => ({
        query: search,
        offset,
        items: search === current.query && offset > 0 ? current.items : [],
        loading: true,
        error: null,
        hasMore: true,
      }));
      listBoardBounties({ search, offset }).then((page) => {
        if (!active) return;
        setResult((current) => {
          const append = offset > 0 && current.query === search;
          const items = append ? [...current.items, ...page] : page;
          return { query: search, offset, items, loading: false, error: null, hasMore: page.length === BOUNTIES_PER_PAGE };
        });
      }).catch((queryError: unknown) => {
        if (!active) return;
        setResult((current) => ({
          query: search,
          offset,
          items: offset > 0 && current.query === search ? current.items : [],
          loading: false,
          error: queryError instanceof Error ? queryError.message : "Could not load bounties.",
          hasMore: false,
        }));
      });
    }, search ? 250 : 0);

    return () => { active = false; clearTimeout(timer); };
  }, [search, offset, refreshKey]);

  const visible = resultIsCurrent ? result : null;
  const items = visible?.items ?? [];
  const loading = !visible || visible.loading;
  const error = visible?.error ?? null;

  const submitCreate = async () => {
    setCreateError(null);
    const minutes = Number(estimatedMinutes);
    if (title.trim().length < 5 || title.trim().length > 100) {
      setCreateError("Title must be 5 to 100 characters.");
      return;
    }
    if (description.trim().length < 20 || description.trim().length > 2000) {
      setCreateError("Description must be 20 to 2,000 characters.");
      return;
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setCreateError("Estimated time must be between 1 and 1,440 minutes.");
      return;
    }
    if (materials.length > 1000 || address.length > 300) {
      setCreateError("Materials or address exceeds the allowed length.");
      return;
    }

    setCreateBusy(true);
    try {
      const bountyId = await createBounty({ title: title.trim(), description: description.trim(), materials: materials.trim(), estimatedMinutes: minutes, address: address.trim() });
      setShowCreate(false);
      setTitle("");
      setDescription("");
      setMaterials("");
      setEstimatedMinutes("60");
      setAddress("");
      setOffset(0);
      setRefreshKey((value) => value + 1);
      Alert.alert("Bounty posted", `Your request was saved as bounty #${bountyId}.`);
    } catch (mutationError: unknown) {
      setCreateError(mutationError instanceof Error ? mutationError.message : "Bounty could not be posted. Your form has been kept.");
    } finally {
      setCreateBusy(false);
    }
  };

  const submitClaim = async () => {
    if (!selected) return;
    setClaimError(null);
    setClaimBusy(true);
    try {
      const claimId = await requestBountyClaim(selected.id);
      Alert.alert("Claim request sent", `Your request was saved as claim #${claimId}.`);
      setSelected(null);
    } catch (mutationError: unknown) {
      setClaimError(mutationError instanceof Error ? mutationError.message : "The claim request failed. Try again.");
    } finally {
      setClaimBusy(false);
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <AppHeader colors={colors} subtitle="Discover community requests" onProfile={onProfile} />
    <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <Text style={{ color: colors.muted, fontSize: 18 }}>⌕</Text>
      <TextInput value={search} onChangeText={(value) => { setOffset(0); setSearch(value); }} placeholder="Search bounties by title" placeholderTextColor={colors.muted} returnKeyType="search" accessibilityLabel="Search bounties" style={[styles.searchInput, { color: colors.text }]} />
      {search ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => { setOffset(0); setSearch(""); }}><Text style={{ color: colors.muted, fontSize: 18 }}>×</Text></Pressable> : null}
    </View>
    <View style={styles.createRow}><AppButton colors={colors} label="Post a bounty" onPress={() => { setCreateError(null); setShowCreate(true); }} /></View>
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      {loading && !items.length ? <View style={styles.state}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted }}>Loading bounties…</Text></View> : null}
      {error ? <Surface colors={colors} style={styles.stateCard}>
        <Text style={[styles.stateTitle, { color: colors.text }]}>Bounties could not be loaded</Text>
        <Text accessibilityRole="alert" style={{ color: colors.muted, lineHeight: 20 }}>{error}</Text>
        <AppButton colors={colors} label="Retry" secondary onPress={() => { setOffset(0); setRefreshKey((value) => value + 1); }} />
      </Surface> : null}
      {!loading && !error && !items.length ? <Surface colors={colors} style={styles.stateCard}>
        <Text style={{ fontSize: 32 }}>✦</Text>
        <Text style={[styles.stateTitle, { color: colors.text }]}>{search ? "No matching bounties" : "No bounties to show"}</Text>
        <Text style={{ color: colors.muted, textAlign: "center", lineHeight: 20 }}>This is the live result visible to your account. Pull down to refresh or try a different title.</Text>
        <AppButton colors={colors} label="Refresh" secondary onPress={() => { setOffset(0); setRefreshKey((value) => value + 1); }} />
      </Surface> : null}
      {items.map((bounty) => <Pressable key={bounty.id} accessibilityRole="button" accessibilityLabel={`View bounty: ${bounty.title}`} onPress={() => setSelected(bounty)}>
        <Surface colors={colors} style={styles.card}>
          <View style={styles.cardTop}><Text style={[styles.status, { color: colors.accentStrong, backgroundColor: colors.accentSoft }]}>{bounty.status}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{bounty.estimatedMinutes ? `${bounty.estimatedMinutes} min` : "Community request"}</Text></View>
          <Text style={[styles.title, { color: colors.text }]}>{bounty.title}</Text>
          <Text numberOfLines={3} style={{ color: colors.muted, lineHeight: 20 }}>{bounty.description}</Text>
          <View style={[styles.divider, { backgroundColor: colors.line }]} />
          <View style={styles.cardBottom}><Text style={{ color: colors.muted }}>By {bounty.poster ?? "Community member"}</Text><Reward colors={colors} xp={bounty.rewardPoints} /></View>
        </Surface>
      </Pressable>)}
      {loading && items.length ? <ActivityIndicator color={colors.accent} style={{ margin: 10 }} /> : null}
      {!loading && !error && visible?.hasMore ? <AppButton colors={colors} label="Load more" secondary onPress={() => setOffset((value) => value + BOUNTIES_PER_PAGE)} /> : null}
    </ScrollView>

    <Modal visible={selected !== null} animationType="slide" transparent onRequestClose={() => setSelected(null)}>
      <View style={styles.backdrop}><View style={[styles.sheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.line }]} />
        <View style={styles.sheetHeading}><View style={{ flex: 1 }}><Text style={[styles.title, { color: colors.text }]}>{selected?.title}</Text><Text style={{ color: colors.accentStrong, marginTop: 6 }}>{selected?.status}</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close bounty details" onPress={() => setSelected(null)} style={[styles.close, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontSize: 20 }}>×</Text></Pressable></View>
        <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 12 }}>
          <Text style={{ color: colors.text, lineHeight: 23 }}>{selected?.description}</Text>
          {selected?.materials ? <View><Text style={[styles.detailLabel, { color: colors.muted }]}>MATERIALS</Text><Text style={{ color: colors.text, lineHeight: 22 }}>{selected.materials}</Text></View> : null}
          <View style={styles.detailRow}><Text style={{ color: colors.muted }}>Posted by</Text><Text style={{ color: colors.text }}>{selected?.poster ?? "Community member"}</Text></View>
          {selected?.estimatedMinutes ? <View style={styles.detailRow}><Text style={{ color: colors.muted }}>Estimated time</Text><Text style={{ color: colors.text }}>{selected.estimatedMinutes} minutes</Text></View> : null}
          <Text style={{ color: colors.muted }}>Address details are not displayed in the public board.</Text>
          <Reward colors={colors} xp={selected?.rewardPoints ?? 0} />
          {claimError ? <Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{claimError}</Text> : null}
          <AppButton colors={colors} label={claimBusy ? "Sending request…" : "Request to claim"} secondary disabled={claimBusy} onPress={() => { void submitClaim(); }} />
        </ScrollView>
      </View></View>
    </Modal>

    <Modal visible={showCreate} animationType="slide" transparent onRequestClose={() => setShowCreate(false)}>
      <View style={styles.backdrop}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.createSheet, { backgroundColor: colors.background }]}>
        <View style={[styles.handle, { backgroundColor: colors.line }]} />
        <View style={styles.sheetHeading}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>Post a bounty</Text><Pressable accessibilityRole="button" accessibilityLabel="Close bounty form" onPress={() => setShowCreate(false)} style={[styles.close, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontSize: 20 }}>×</Text></Pressable></View>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>The database assigns the authenticated account as poster and applies the project&apos;s XP reward rule.</Text>
        <TextInput accessibilityLabel="Bounty title" maxLength={100} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surface }]} />
        <TextInput accessibilityLabel="Bounty description" maxLength={2000} multiline value={description} onChangeText={setDescription} placeholder="Describe the help you need" placeholderTextColor={colors.muted} style={[styles.formInput, styles.multiline, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surface }]} />
        <TextInput accessibilityLabel="Materials" maxLength={1000} value={materials} onChangeText={setMaterials} placeholder="Materials or requirements (optional)" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surface }]} />
        <TextInput accessibilityLabel="Estimated minutes" keyboardType="number-pad" value={estimatedMinutes} onChangeText={setEstimatedMinutes} placeholder="Estimated minutes" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surface }]} />
        <TextInput accessibilityLabel="Private address" maxLength={300} value={address} onChangeText={setAddress} placeholder="Meeting address (private until authorized)" placeholderTextColor={colors.muted} style={[styles.formInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surface }]} />
        {createError ? <Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{createError}</Text> : null}
        <AppButton colors={colors} label={createBusy ? "Posting…" : "Post bounty"} disabled={createBusy} onPress={() => { void submitCreate(); }} />
      </ScrollView></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, searchBox: { minHeight: 46, borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginBottom: 8, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 }, createRow: { paddingHorizontal: 16, paddingBottom: 12 },
  searchInput: { flex: 1, minWidth: 0, paddingVertical: 9, fontSize: 14 }, list: { paddingHorizontal: 16, paddingBottom: 20, gap: 10 }, card: { gap: 10, padding: 14 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, status: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, fontSize: 11, fontWeight: "700", overflow: "hidden" }, title: { fontSize: 18, fontWeight: "800", lineHeight: 24 }, divider: { height: 1, marginTop: 2 }, cardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 },
  state: { alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }, stateCard: { alignItems: "center", gap: 12, padding: 22 }, stateTitle: { fontSize: 18, fontWeight: "800", textAlign: "center" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }, sheet: { maxHeight: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 20, gap: 16 }, createSheet: { maxHeight: "92%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 24, gap: 12 }, handle: { width: 40, height: 4, borderRadius: 4, alignSelf: "center" }, sheetHeading: { flexDirection: "row", alignItems: "flex-start", gap: 12 }, close: { height: 44, width: 44, alignItems: "center", justifyContent: "center", borderRadius: 22 }, detailLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 5 }, detailRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 }, formInput: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 }, multiline: { minHeight: 100, textAlignVertical: "top", paddingTop: 11 },
});
