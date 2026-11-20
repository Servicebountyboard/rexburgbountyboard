import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AppButton, AppHeader, Surface } from "./ui";
import { WorkScreen } from "./WorkScreen";
import { NotificationScreen } from "./NotificationScreen";
import { ProfileRecordsScreen } from "./ProfileRecordsScreen";
import type { OwnProfile } from "../features/profile/profileRepository";
import { exchangeXpForGold, getXpExchangeInfo, type XpExchangeInfo } from "../features/rewards/economyRepository";
import type { AppColors, ThemeMode } from "../theme";

type ProfileSection = "My Bounties" | "My Reviews" | "Stats & History" | "Notifications" | "Account Settings";

export function ProfileScreen({
  colors, userId, mode, profile, loading, error, onRetry, onThemeChange, onSignOut,
}: {
  colors: AppColors;
  userId: string;
  mode: ThemeMode;
  profile: OwnProfile | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onThemeChange: (mode: ThemeMode) => void;
  onSignOut: () => void;
}) {
  const [section, setSection] = useState<ProfileSection | null>(null);
  const [exchangeAmount, setExchangeAmount] = useState("100");
  const [exchangeBusy, setExchangeBusy] = useState(false);
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  const [exchangeNotice, setExchangeNotice] = useState<string | null>(null);
  const [exchangeState, setExchangeState] = useState<{ userId: string; info: XpExchangeInfo; error: string | null } | null>(null);
  const [exchangeRefresh, setExchangeRefresh] = useState(0);
  const exchangeAttempt = useRef<{ amount: number; key: string } | null>(null);
  const sections: ProfileSection[] = ["My Bounties", "My Reviews", "Stats & History", "Notifications", "Account Settings"];
  const profileUserId = profile?.userId;

  useEffect(() => {
    if (!profileUserId) return;
    let active = true;
    getXpExchangeInfo().then((info) => {
      if (active) setExchangeState({ userId: profileUserId, info, error: null });
    }).catch((queryError: unknown) => {
      if (active) setExchangeState({
        userId: profileUserId,
        info: { availableXp: 0, xpPerGold: 100, totalGold: 0 },
        error: queryError instanceof Error ? queryError.message : "Could not load XP exchange settings.",
      });
    });
    return () => { active = false; };
  }, [profileUserId, exchangeRefresh]);

  const currentExchange = exchangeState?.userId === profileUserId ? exchangeState : null;
  const exchangeInfo = currentExchange?.info ?? null;
  const exchangeLoading = Boolean(profile && !currentExchange);

  const submitExchange = async () => {
    setExchangeError(null);
    setExchangeNotice(null);
    const amount = Number(exchangeAmount);
    if (!Number.isSafeInteger(amount) || amount <= 0 || !exchangeInfo) {
      setExchangeError("Enter a valid whole number of XP to trade.");
      return;
    }
    if (amount % exchangeInfo.xpPerGold !== 0) {
      setExchangeError(`Trade XP in multiples of ${exchangeInfo.xpPerGold.toLocaleString()}.`);
      return;
    }
    if (amount > exchangeInfo.availableXp) {
      setExchangeError("You do not have enough XP available to trade that amount.");
      return;
    }

    setExchangeBusy(true);
    try {
      if (!exchangeAttempt.current || exchangeAttempt.current.amount !== amount) {
        exchangeAttempt.current = {
          amount,
          key: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
        };
      }
      const key = exchangeAttempt.current.key;
      const result = await exchangeXpForGold(amount, key);
      exchangeAttempt.current = null;
      setExchangeState({ userId: profileUserId!, info: result, error: null });
      setExchangeNotice(`Traded ${result.xpSpent.toLocaleString()} XP for ${result.goldReceived.toLocaleString()} Gold.`);
      onRetry();
    } catch (mutationError: unknown) {
      setExchangeError(mutationError instanceof Error ? mutationError.message : "XP exchange failed. Your XP was not changed.");
    } finally {
      setExchangeBusy(false);
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <AppHeader colors={colors} title={section ?? "Your Profile"} subtitle="Your Supabase account" onBack={section ? () => setSection(null) : undefined} onProfile={() => setSection("Account Settings")} />
    {section === null ? <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.summary}>
        <View style={styles.profileTop}>
          <View style={[styles.avatar, { backgroundColor: colors.surfaceAlt }]}><Text style={{ fontSize: 30 }}>♙</Text></View>
          <View style={{ flex: 1 }}>
            {loading ? <ActivityIndicator color={colors.accent} /> : <Text style={[styles.profileName, { color: colors.text }]}>{profile?.username ?? (error ? "Profile unavailable" : "Profile not found")}</Text>}
            <Text style={{ color: colors.muted, marginTop: 4 }}>Community member</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open account settings" onPress={() => setSection("Account Settings")} style={[styles.settingsButton, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.accent, fontSize: 20 }}>⚙</Text></Pressable>
        </View>
        {error ? <View style={{ gap: 10, marginTop: 12 }}><Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{error}</Text><AppButton colors={colors} label="Retry profile" secondary onPress={onRetry} /></View> : null}
        {!loading && !error && !profile ? <Text style={{ color: colors.muted, marginTop: 12, lineHeight: 20 }}>A profile row has not been created for this account. The app will not create one without a verified backend workflow.</Text> : null}
        {profile ? <>
          <View style={styles.progressLabel}><Text style={{ color: colors.text, fontWeight: "600" }}>Experience</Text><Text style={{ color: colors.muted, fontSize: 12 }}>{profile.totalPoints.toLocaleString()} XP</Text></View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceAlt }]}><View style={[styles.progressFill, { backgroundColor: colors.accent, width: "100%" }]} /></View>
          <Text style={[styles.ratingLabel, { color: colors.text }]}>Community rating</Text>
          <Text style={{ color: colors.accent, fontSize: 17, textAlign: "center" }}>{profile.averageRating > 0 ? `${profile.averageRating.toFixed(1)} / 5` : "Not rated yet"}</Text>
          <View style={styles.statsRow}>
            <View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.muted, fontSize: 11 }}>Total XP</Text><Text style={[styles.statValue, { color: colors.text }]}>{profile.totalPoints.toLocaleString()}</Text></View>
            <View style={[styles.stat, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.muted, fontSize: 11 }}>Total Gold</Text><Text style={[styles.statValue, { color: colors.text }]}>{(exchangeInfo?.totalGold ?? profile.totalGold).toLocaleString()}</Text></View>
          </View>
        </> : null}
      </Surface>

      <Surface colors={colors} style={styles.exchangeCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Trade XP for Gold</Text>
        {exchangeLoading ? <ActivityIndicator color={colors.accent} /> : exchangeInfo ? <>
          <View style={styles.exchangeLine}><Text style={{ color: colors.muted }}>Available XP</Text><Text style={{ color: colors.text, fontWeight: "800" }}>{exchangeInfo.availableXp.toLocaleString()}</Text></View>
          <Text style={{ color: colors.muted }}>Rate: {exchangeInfo.xpPerGold.toLocaleString()} XP = 1 Gold. Lifetime XP stays on your profile.</Text>
          <TextInput accessibilityLabel="XP amount to trade" keyboardType="number-pad" value={exchangeAmount} onChangeText={setExchangeAmount} placeholder="XP amount" placeholderTextColor={colors.muted} style={[styles.amountInput, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
          {exchangeError ? <Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{exchangeError}</Text> : null}
          {exchangeNotice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.accentStrong, lineHeight: 20 }}>{exchangeNotice}</Text> : null}
          <Pressable accessibilityRole="button" disabled={exchangeBusy} onPress={submitExchange} style={[styles.exchangeButton, { backgroundColor: colors.accentSoft, borderColor: colors.accent, opacity: exchangeBusy ? 0.65 : 1 }]}>
            {exchangeBusy ? <ActivityIndicator color={colors.accentStrong} /> : <Text style={{ color: colors.text, fontWeight: "800" }}>Trade XP for Gold</Text>}
          </Pressable>
        </> : <>
          {currentExchange?.error ? <Text accessibilityRole="alert" style={{ color: "#E07B70", lineHeight: 20 }}>{currentExchange.error}</Text> : null}
          <Text style={{ color: colors.muted, lineHeight: 20 }}>XP exchange data is unavailable. Confirm the XP exchange migration has been applied, then retry.</Text>
          <AppButton colors={colors} label="Retry exchange info" secondary onPress={() => setExchangeRefresh((value) => value + 1)} />
        </>}
      </Surface>

      <Surface colors={colors} style={{ paddingVertical: 0 }}>
        {sections.map((title) => <Pressable key={title} accessibilityRole="button" onPress={() => setSection(title)} style={({ pressed }) => [styles.action, { borderBottomColor: colors.line, opacity: pressed ? 0.72 : 1 }]}>
          <View style={[styles.actionIcon, { backgroundColor: colors.accentSoft }]}><Text style={{ color: colors.accentStrong, fontSize: 18 }}>{title === "Account Settings" ? "⚙" : "›"}</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: colors.text, fontWeight: "700" }}>{title}</Text><Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>{title === "Account Settings" ? "Appearance and account" : title === "Notifications" ? "Updates from your bounty activity" : "Your records and activity"}</Text></View>
          <Text style={{ color: colors.muted, fontSize: 22 }}>›</Text>
        </Pressable>)}
      </Surface>
    </ScrollView> : section === "My Bounties" ? <WorkScreen userId={userId} colors={colors} /> : section === "My Reviews" ? <ProfileRecordsScreen userId={userId} section="reviews" colors={colors} /> : section === "Stats & History" ? <ProfileRecordsScreen userId={userId} section="history" colors={colors} /> : section === "Notifications" ? <NotificationScreen userId={userId} colors={colors} /> : section === "Account Settings" ? <ScrollView contentContainerStyle={styles.content}>
      <Surface colors={colors} style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
        <Text style={{ color: colors.muted, marginBottom: 12, marginTop: 4 }}>Choose the board theme.</Text>
        <View style={styles.themeRow}>{(["dark", "light"] as const).map((theme) => <Pressable key={theme} accessibilityRole="radio" accessibilityState={{ checked: mode === theme }} onPress={() => onThemeChange(theme)} style={[styles.themeOption, { backgroundColor: mode === theme ? colors.accentSoft : colors.surfaceAlt, borderColor: mode === theme ? colors.accent : colors.line }]}><Text style={{ color: colors.text, fontWeight: "700", textTransform: "capitalize" }}>{theme === "dark" ? "◐  Dark" : "☼  Light"}</Text></Pressable>)}</View>
      </Surface>
      <Surface colors={colors} style={styles.settingsCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Account</Text>
        <Text style={{ color: colors.muted, lineHeight: 20, marginTop: 5, marginBottom: 12 }}>Sign out of your Supabase account on this device.</Text>
        <AppButton colors={colors} label="Sign out" secondary onPress={onSignOut} />
      </Surface>
    </ScrollView> : null}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, content: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 }, summary: { padding: 16 },
  profileTop: { flexDirection: "row", alignItems: "center", gap: 12 }, avatar: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center" },
  profileName: { fontSize: 17, fontWeight: "800" }, settingsButton: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 12 },
  progressLabel: { flexDirection: "row", justifyContent: "space-between", marginTop: 18, marginBottom: 7 }, progressTrack: { height: 8, borderRadius: 5, overflow: "hidden" }, progressFill: { height: "100%", borderRadius: 5 },
  ratingLabel: { textAlign: "center", fontWeight: "700", marginTop: 17 }, statsRow: { flexDirection: "row", gap: 8, marginTop: 14 }, stat: { flex: 1, minHeight: 64, borderRadius: 12, padding: 10, alignItems: "center", justifyContent: "center", gap: 4 }, statValue: { fontSize: 17, fontWeight: "800", marginTop: 2 },
  action: { minHeight: 70, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, paddingHorizontal: 12 }, actionIcon: { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  sectionState: { flex: 1, justifyContent: "center", padding: 16 }, unsupported: { alignItems: "center", gap: 12, padding: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "800" }, settingsCard: { padding: 16 }, themeRow: { flexDirection: "row", gap: 10 }, themeOption: { flex: 1, minHeight: 46, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1 },
  exchangeCard: { padding: 16, gap: 12 }, exchangeLine: { flexDirection: "row", justifyContent: "space-between" }, amountInput: { minHeight: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 15 }, exchangeButton: { minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
