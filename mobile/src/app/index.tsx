import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useMemo, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppButton, AppHeader, Reward, Surface, TabBar, TagChip } from "../components/ui";
import { ChatScreen } from "../components/ChatScreen";
import { ProfileScreen } from "../components/ProfileScreen";
import type { Bounty } from "../data/fixtures";
import { previewRepository } from "../data/previewRepository";
import { palettes, type ThemeMode } from "../theme";

type Tab = "Chat" | "Board" | "Profile";
const THEME_KEY = "rexburg-bounty-board-theme";
const { listBounties, listServiceTags } = previewRepository;
const bounties = listBounties();
const serviceTags = listServiceTags();

export default function HomeScreen() {
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [activeTab, setActiveTab] = useState<Tab>("Board");
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const colors = palettes[mode];
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const columns = width >= 720 ? 3 : 2;
  const gap = 10;
  const cardWidth = (Math.min(width, 920) - 36 - gap * (columns - 1)) / columns;

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") setMode(saved);
    }).catch(() => undefined);
  }, []);

  const changeTheme = (next: ThemeMode) => {
    setMode(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  };

  const filteredBounties = useMemo(() => bounties.filter((bounty) => {
    const tag = serviceTags.find((item) => item.id === bounty.tagId);
    const matchesText = `${bounty.title} ${bounty.description} ${bounty.location} ${tag?.name ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesText && (selectedTags.length === 0 || selectedTags.includes(bounty.tagId));
  }), [query, selectedTags]);

  const toggleTag = (id: string) => setSelectedTags((current) => current.includes(id) ? current.filter((tag) => tag !== id) : [...current, id]);
  const switchTab = (tab: Tab) => setActiveTab(tab);

  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
    <StatusBar barStyle={mode === "dark" ? "light-content" : "dark-content"} />
    {activeTab === "Board" ? <>
      <AppHeader colors={colors} subtitle="Welcome back, Hunter" onProfile={() => switchTab("Profile")} />
      <View style={styles.searchRow}>
        <Pressable accessibilityRole="button" accessibilityLabel="Choose service tags" onPress={() => setShowTags(true)} style={[styles.filterButton, { backgroundColor: colors.surfaceAlt, borderColor: colors.accent }]}>
          <Text style={{ color: colors.text, fontSize: 15 }}>◆</Text><Text style={[styles.filterText, { color: colors.text }]}>Tags</Text><Text style={{ color: colors.muted }}>⌄</Text>
        </Pressable>
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <Text style={{ color: colors.muted, fontSize: 18 }}>⌕</Text>
          <TextInput value={query} onChangeText={setQuery} placeholder="Search bounties…" placeholderTextColor={colors.muted} returnKeyType="search" accessibilityLabel="Search bounties" style={[styles.searchInput, { color: colors.text }]} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery("")}><Text style={{ color: colors.muted, fontSize: 18 }}>×</Text></Pressable> : null}
        </View>
      </View>
      {selectedTags.length > 0 ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.selectedRow}>
        {selectedTags.map((id) => { const tag = serviceTags.find((item) => item.id === id); return tag ? <TagChip key={id} colors={colors} label={tag.name} icon={tag.icon} tint={tag.color} selected onPress={() => toggleTag(id)} /> : null; })}
        <Pressable onPress={() => setSelectedTags([])}><Text style={{ color: colors.muted, fontSize: 12, paddingHorizontal: 4 }}>Clear all</Text></Pressable>
      </ScrollView> : null}
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.boardContent, { paddingBottom: 24 + insets.bottom }]}>
        {filteredBounties.length ? <View style={[styles.grid, { gap }]}>{filteredBounties.map((bounty) => {
          const tag = serviceTags.find((item) => item.id === bounty.tagId);
          return <Pressable key={bounty.id} accessibilityRole="button" accessibilityLabel={`View bounty: ${bounty.title}`} onPress={() => setSelectedBounty(bounty)} style={({ pressed }) => [styles.bountyCard, { width: cardWidth, backgroundColor: colors.surface, borderColor: colors.line, shadowColor: colors.shadow, opacity: pressed ? 0.88 : 1 }]}>
            {tag ? <View style={[styles.categoryPill, { backgroundColor: `${tag.color}25` }]}><Text style={[styles.categoryIcon, { color: tag.color }]}>{tag.icon}</Text><Text numberOfLines={1} style={[styles.categoryName, { color: colors.text }]}>{tag.name}</Text></View> : null}
            <Text numberOfLines={3} style={[styles.cardTitle, { color: colors.text }]}>{bounty.title}</Text>
            <Reward colors={colors} xp={bounty.xp} />
            <View style={[styles.cardDivider, { backgroundColor: colors.line }]} />
            <View style={styles.metaLine}><Text style={{ color: colors.muted }}>⌖</Text><Text numberOfLines={1} style={[styles.metaText, { color: colors.muted }]}>{bounty.location}</Text></View>
            <View style={styles.metaLine}><Text style={{ color: colors.muted }}>▦</Text><Text numberOfLines={1} style={[styles.metaText, { color: colors.muted }]}>{bounty.due}</Text></View>
          </Pressable>;
        })}</View> : <Surface colors={colors} style={styles.emptyState}><Text style={{ fontSize: 38 }}>✦</Text><Text style={[styles.emptyTitle, { color: colors.text }]}>No bounties found</Text><Text style={{ color: colors.muted, textAlign: "center" }}>Try another search or clear your selected tags.</Text><AppButton colors={colors} label="Clear filters" secondary onPress={() => { setQuery(""); setSelectedTags([]); }} /></Surface>}
        <Text style={[styles.fixtureNote, { color: colors.muted }]}>Sample bounties · demo data</Text>
      </ScrollView>
    </> : activeTab === "Chat" ? <ChatScreen colors={colors} onProfile={() => switchTab("Profile")} /> : <ProfileScreen colors={colors} mode={mode} onThemeChange={changeTheme} />}

    <View style={{ paddingBottom: insets.bottom, backgroundColor: colors.background }}>
      <TabBar colors={colors} active={activeTab} onChange={switchTab} />
    </View>

    <Modal visible={showTags} animationType="slide" transparent onRequestClose={() => setShowTags(false)}>
      <View style={styles.modalBackdrop}><KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.line }]} /><View style={styles.sheetHeading}><View><Text style={[styles.sheetTitle, { color: colors.text }]}>Choose service tags</Text><Text style={{ color: colors.muted, marginTop: 3 }}>Filter the board by what you can help with</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Close tags" onPress={() => setShowTags(false)} style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontSize: 20 }}>×</Text></Pressable></View>
        {selectedTags.length > 0 ? <><Text style={[styles.overline, { color: colors.muted }]}>SELECTED TAGS</Text><View style={styles.chipWrap}>{selectedTags.map((id) => { const tag = serviceTags.find((item) => item.id === id); return tag ? <TagChip key={id} colors={colors} label={tag.name} icon={tag.icon} selected tint={tag.color} onPress={() => toggleTag(id)} /> : null; })}</View></> : null}
        <Text style={[styles.overline, { color: colors.muted }]}>SERVICE TAGS</Text><ScrollView contentContainerStyle={styles.tagCatalog}>{serviceTags.map((tag) => { const selected = selectedTags.includes(tag.id); return <Pressable key={tag.id} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleTag(tag.id)} style={[styles.catalogItem, { borderColor: selected ? colors.accent : colors.line, backgroundColor: colors.surface }]}><View style={[styles.catalogIcon, { backgroundColor: `${tag.color}28`, borderColor: selected ? colors.accent : colors.line }]}><Text style={{ color: tag.color, fontSize: 26, fontWeight: "700" }}>{tag.icon}</Text>{selected ? <View style={[styles.checkBadge, { backgroundColor: colors.dark, borderColor: colors.accent }]}><Text style={{ color: colors.accent, fontSize: 12 }}>✓</Text></View> : null}</View><Text numberOfLines={2} style={{ color: colors.text, fontSize: 12, textAlign: "center" }}>{tag.name}</Text></Pressable>; })}</ScrollView>
        <AppButton colors={colors} label={`Show ${filteredBounties.length} bounties`} onPress={() => setShowTags(false)} />
      </KeyboardAvoidingView></View>
    </Modal>

    <Modal visible={selectedBounty !== null} animationType="slide" transparent onRequestClose={() => setSelectedBounty(null)}>
      <View style={styles.modalBackdrop}><View style={[styles.detailSheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 18) }]}>
        <View style={[styles.sheetHandle, { backgroundColor: colors.line }]} /><View style={styles.sheetHeading}><View style={{ flex: 1 }}><Text style={[styles.sheetTitle, { color: colors.text }]}>{selectedBounty?.title}</Text>{selectedBounty ? <View style={{ marginTop: 9 }}>{(() => { const tag = serviceTags.find((item) => item.id === selectedBounty.tagId); return tag ? <TagChip colors={colors} label={tag.name} icon={tag.icon} tint={tag.color} /> : null; })()}</View> : null}</View><Pressable accessibilityRole="button" accessibilityLabel="Close bounty details" onPress={() => setSelectedBounty(null)} style={[styles.closeButton, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontSize: 20 }}>×</Text></Pressable></View>
        <ScrollView style={{ maxHeight: "65%" }} contentContainerStyle={{ gap: 16, paddingVertical: 6 }}>
          <View><Text style={[styles.detailLabel, { color: colors.muted }]}>ABOUT THIS BOUNTY</Text><Text style={[styles.detailText, { color: colors.text }]}>{selectedBounty?.description}</Text></View>
          <View><Text style={[styles.detailLabel, { color: colors.muted }]}>REQUIREMENTS</Text><Text style={[styles.detailText, { color: colors.text }]}>{selectedBounty?.requirements}</Text></View>
          <View style={styles.detailMeta}><Text style={{ color: colors.text }}>⌖  {selectedBounty?.location}</Text><Text style={{ color: colors.text }}>▦  {selectedBounty?.due}</Text></View>
          <Text style={{ color: colors.muted }}>Posted by {selectedBounty?.poster}</Text>
          {selectedBounty ? <Reward colors={colors} xp={selectedBounty.xp} gold={selectedBounty.gold} /> : null}
        </ScrollView>
        <AppButton colors={colors} label="Request to claim" onPress={() => Alert.alert("Not connected yet", "Claim requests will be available after the bounty service is connected.")} />
        <Text style={[styles.fixtureNote, { color: colors.muted }]}>Preview data · no claim is submitted</Text>
      </View></View>
    </Modal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchRow: { flexDirection: "row", gap: 9, paddingHorizontal: 16, paddingBottom: 12 },
  filterButton: { minHeight: 44, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 },
  filterText: { fontWeight: "700", fontSize: 13 },
  searchBox: { minHeight: 44, flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, flexDirection: "row", gap: 8, alignItems: "center" },
  searchInput: { flex: 1, minWidth: 0, fontSize: 14, paddingVertical: 8 },
  selectedRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 7, alignItems: "center" },
  boardContent: { paddingHorizontal: 18, paddingTop: 1, alignItems: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", maxWidth: 920 },
  bountyCard: { borderWidth: 1, borderRadius: 15, padding: 12, minHeight: 208, shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  categoryPill: { alignSelf: "flex-start", maxWidth: "100%", borderRadius: 7, paddingHorizontal: 7, paddingVertical: 4, flexDirection: "row", alignItems: "center", gap: 5 },
  categoryIcon: { fontSize: 14, fontWeight: "800" }, categoryName: { fontSize: 10, fontWeight: "600", flexShrink: 1 },
  cardTitle: { fontSize: 16, lineHeight: 20, fontWeight: "800", marginTop: 9, marginBottom: "auto" },
  cardDivider: { height: 1, marginVertical: 9 }, metaLine: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 5 }, metaText: { fontSize: 12, flexShrink: 1 },
  emptyState: { width: "100%", alignItems: "center", gap: 12, padding: 28, marginTop: 40 }, emptyTitle: { fontSize: 19, fontWeight: "800" },
  fixtureNote: { textAlign: "center", fontSize: 11, padding: 5 },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  sheet: { maxHeight: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, gap: 12 },
  detailSheet: { maxHeight: "88%", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 18, paddingTop: 10, gap: 13 },
  sheetHandle: { width: 40, height: 4, borderRadius: 4, alignSelf: "center", marginBottom: 4 },
  sheetHeading: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  sheetTitle: { fontSize: 21, lineHeight: 27, fontWeight: "800" },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  overline: { fontSize: 11, fontWeight: "800", letterSpacing: 2, marginTop: 4 },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  tagCatalog: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, paddingVertical: 4 },
  catalogItem: { width: "31%", minHeight: 92, borderWidth: 1, borderRadius: 14, alignItems: "center", justifyContent: "center", gap: 5, padding: 6 },
  catalogIcon: { width: 52, height: 52, borderRadius: 15, borderWidth: 1.5, alignItems: "center", justifyContent: "center", position: "relative" },
  checkBadge: { position: "absolute", right: -5, bottom: -4, width: 21, height: 21, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  detailLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 1.4, marginBottom: 5 },
  detailText: { fontSize: 15, lineHeight: 22 },
  detailMeta: { flexDirection: "row", flexWrap: "wrap", gap: 18, paddingVertical: 9 },
});
