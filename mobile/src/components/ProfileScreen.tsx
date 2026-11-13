import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AppButton, AppHeader, Surface } from "./ui";
import { previewRepository } from "../data/previewRepository";
import type { AppColors, ThemeMode } from "../theme";

type ProfileSection = "My Bounties" | "My Reviews" | "Stats & History" | "Account Settings";
const profile = previewRepository.getProfile();
const myBounties = previewRepository.listMyBounties();
const reviews = previewRepository.listReviews();
const activity = previewRepository.listActivity();

export function ProfileScreen({ colors, mode, onThemeChange }: { colors: AppColors; mode: ThemeMode; onThemeChange: (mode: ThemeMode) => void }) {
  const [section, setSection] = useState<ProfileSection | null>(null);
  const [bountyFilter, setBountyFilter] = useState("All");
  const openSection = (value: ProfileSection) => setSection(value);

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <AppHeader
      colors={colors}
      title={section ?? "Your Profile"}
      subtitle={section ? "Profile preview · demo data" : "Your adventurer profile · demo data"}
      onBack={section ? () => setSection(null) : undefined}
      onProfile={() => section ? setSection(null) : openSection("Account Settings")}
    />

    {section === null ? <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.summary}>
        <View style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}><Text style={{ fontSize: 34 }}>👤</Text></View>
          <View style={{ flex: 1 }}><Text style={[styles.profileName, { color: colors.text }]}>{profile.username}</Text><Text style={{ color: colors.muted, marginTop: 4 }}>Community member</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open account settings" onPress={() => openSection("Account Settings")} style={[styles.settingsButton, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.accent, fontSize: 20 }}>⚙</Text></Pressable>
        </View>
        <View style={styles.progressLabel}><Text style={{ color: colors.text, fontWeight: "600" }}>Experience</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{profile.xp} XP</Text></View>
        <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}><View style={[styles.progressFill, { backgroundColor: colors.accent, width: "64%" }]} /></View>
        <Text style={[styles.ratingLabel, { color: colors.text }]}>Community rating</Text>
        <Text accessibilityLabel={`${profile.rating} out of 5 stars`} style={{ color: colors.accent, fontSize: 25, letterSpacing: 4 }}>★★★★<Text style={{ color: colors.line }}>★</Text></Text>
        <View style={styles.statsRow}>
          <View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.accent, fontSize: 20 }}>✦</Text><View><Text style={{ color: colors.muted, fontSize: 11 }}>Total XP</Text><Text style={[styles.statValue, { color: colors.text }]}>{profile.xp}</Text></View></View>
          <View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.accent, fontSize: 20 }}>◉</Text><View><Text style={{ color: colors.muted, fontSize: 11 }}>Total Gold</Text><Text style={[styles.statValue, { color: colors.text }]}>{profile.gold}</Text></View></View>
        </View>
      </Surface>

      <Surface colors={colors} style={{ paddingVertical: 0 }}>
        {([
          ["▤", "My Bounties", "Posted, in progress, and completed"],
          ["★", "My Reviews", "See feedback from the community"],
          ["▥", "Stats & History", "View your activity and progress"],
          ["⚙", "Account Settings", "Manage your profile and preferences"],
        ] as const).map(([icon, title, subtitle]) => <Pressable key={title} accessibilityRole="button" onPress={() => openSection(title)} style={({ pressed }) => [styles.action, { borderBottomColor: colors.line, opacity: pressed ? 0.72 : 1 }]}>
          <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accentStrong, fontSize: 20 }}>{icon}</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "700" }}>{title}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text></View>
          <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
        </Pressable>)}
      </Surface>
      <Text style={[styles.fixtureNote, { color: colors.muted }]}>Preview values · demo data</Text>
    </ScrollView> : section === "My Bounties" ? <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.filterRow, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        {["All", "Posted", "In progress", "Completed"].map((filter) => <Pressable key={filter} accessibilityRole="button" accessibilityState={{ selected: bountyFilter === filter }} onPress={() => setBountyFilter(filter)} style={[styles.filterOption, { backgroundColor: bountyFilter === filter ? colors.accentSoft : "transparent", borderColor: bountyFilter === filter ? colors.accent : "transparent" }]}><Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>{filter}</Text></Pressable>)}
      </View>
      {myBounties.filter((item) => bountyFilter === "All" || item.status === bountyFilter).map((item) => <Surface key={item.id} colors={colors} style={styles.listCard}>
        <Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text>
        <Text style={{ color: colors.accentStrong, fontSize: 12, marginTop: 7 }}>{item.status}</Text>
      </Surface>)}
      <Text style={[styles.fixtureNote, { color: colors.muted }]}>Sample bounty activity · demo data</Text>
    </ScrollView> : section === "My Reviews" ? <ScrollView contentContainerStyle={styles.content}>
      {reviews.map((review) => <Surface key={review.id} colors={colors} style={styles.listCard}>
        <View style={styles.reviewHeader}><Text style={[styles.listTitle, { color: colors.text }]}>{review.from}</Text><Text style={{ color: colors.accent, fontWeight: "700" }}>{"★".repeat(review.rating)}<Text style={{ color: colors.line }}>{"★".repeat(5 - review.rating)}</Text></Text></View>
        <Text style={{ color: colors.muted, lineHeight: 21, marginTop: 9 }}>{review.text}</Text>
      </Surface>)}
      <Text style={[styles.fixtureNote, { color: colors.muted }]}>Sample reviews · demo data</Text>
    </ScrollView> : section === "Stats & History" ? <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.summary}><Text style={[styles.sectionTitle, { color: colors.text }]}>Your progress</Text><Text style={{ color: colors.muted, marginTop: 4 }}>A preview of recent community activity</Text>
        <View style={styles.statsRow}><View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.muted, fontSize: 11 }}>Bounties completed</Text><Text style={[styles.statValue, { color: colors.text }]}>8</Text></View><View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.muted, fontSize: 11 }}>Average rating</Text><Text style={[styles.statValue, { color: colors.text }]}>4.8 / 5</Text></View></View>
      </Surface>
      {activity.map((item) => <Surface key={item.id} colors={colors} style={styles.listCard}>
        <View style={styles.reviewHeader}><Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{item.date}</Text></View>
        <Text style={{ color: colors.muted, marginTop: 5 }}>{item.detail}</Text><Text style={{ color: colors.accentStrong, fontSize: 12, marginTop: 8 }}>{item.reward}</Text>
      </Surface>)}
      <Text style={[styles.fixtureNote, { color: colors.muted }]}>Sample stats and activity · demo data</Text>
    </ScrollView> : <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text><Text style={{ color: colors.muted, marginBottom: 12, marginTop: 4 }}>Choose your board theme. Your choice is saved on this device.</Text>
        <View style={styles.themeRow}>{(["dark", "light"] as const).map((theme) => <Pressable key={theme} accessibilityRole="radio" accessibilityState={{ checked: mode === theme }} onPress={() => onThemeChange(theme)} style={[styles.themeOption, { backgroundColor: mode === theme ? colors.accentSoft : colors.surfaceAlt, borderColor: mode === theme ? colors.accent : colors.line }]}><Text style={{ color: colors.text, fontWeight: "700", textTransform: "capitalize" }}>{theme === "dark" ? "◐  Dark" : "☼  Light"}</Text></Pressable>)}</View>
      </Surface>
      <Surface colors={colors} style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Sign out</Text>
        <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 5, marginBottom: 12 }}>Sign out becomes available when account authentication is connected.</Text>
        <AppButton colors={colors} label="Sign out unavailable" secondary onPress={() => Alert.alert("No active account", "This preview has no signed-in session to end.")} />
      </Surface>
      <Text style={[styles.fixtureNote, { color: colors.muted }]}>Account preferences preview</Text>
    </ScrollView>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 }, summary: { padding: 16 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 }, avatar: { width: 68, height: 68, borderRadius: 34, alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 17, fontWeight: "800" }, settingsButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  progressLabel: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 7 }, progressTrack: { height: 8, borderRadius: 5, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 5 },
  ratingLabel: { textAlign: "center", fontWeight: "700", marginTop: 17 }, statsRow: { flexDirection: "row", gap: 8, marginTop: 14 }, stat: { flex: 1, minHeight: 64, borderRadius: 12, padding: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, statValue: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  action: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingHorizontal: 12 }, actionIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  filterRow: { borderWidth: 1, borderRadius: 14, padding: 4, flexDirection: "row", flexWrap: "wrap", gap: 4 }, filterOption: { minHeight: 40, paddingHorizontal: 9, borderWidth: 1, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  listCard: { padding: 15 }, listTitle: { fontSize: 15, lineHeight: 20, fontWeight: "700" }, reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "800" }, settingsCard: { padding: 16 }, themeRow: { flexDirection: "row", gap: 10 }, themeOption: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1 }, fixtureNote: { textAlign: "center", fontSize: 11, padding: 5 },
});
