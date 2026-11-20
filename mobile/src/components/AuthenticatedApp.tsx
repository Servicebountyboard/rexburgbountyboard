import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { useAuth } from "../features/auth/AuthProvider";
import type { OwnProfile } from "../features/profile/profileRepository";
import { palettes, type ThemeMode } from "../theme";
import { BoardScreen } from "./BoardScreen";
import { ChatScreen } from "./ChatScreen";
import { ProfileScreen } from "./ProfileScreen";
import { TabBar } from "./ui";

type Tab = "Chat" | "Board" | "Profile";
const THEME_KEY = "rexburg-bounty-board-theme";

export function AuthenticatedApp({
  profile, profileLoading, profileError, onRetryProfile,
}: {
  profile: OwnProfile | null;
  profileLoading: boolean;
  profileError: string | null;
  onRetryProfile: () => void;
}) {
  const { session, signOut } = useAuth();
  const [mode, setMode] = useState<ThemeMode>("dark");
  const [activeTab, setActiveTab] = useState<Tab>("Board");
  const colors = palettes[mode];

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved) => {
      if (saved === "light" || saved === "dark") setMode(saved);
    }).catch(() => undefined);
  }, []);

  const changeTheme = (next: ThemeMode) => {
    setMode(next);
    AsyncStorage.setItem(THEME_KEY, next).catch(() => undefined);
  };

  const showProfile = () => setActiveTab("Profile");

  return <View style={[styles.root, { backgroundColor: colors.background }]}>
    <View style={styles.content}>
      {activeTab === "Board" ? <BoardScreen colors={colors} onProfile={showProfile} /> : activeTab === "Chat" ? <ChatScreen colors={colors} onProfile={showProfile} userId={session?.user.id ?? ""} /> : <ProfileScreen
        colors={colors}
        userId={session?.user.id ?? ""}
        mode={mode}
        profile={profile}
        loading={profileLoading}
        error={profileError}
        onRetry={onRetryProfile}
        onThemeChange={changeTheme}
        onSignOut={() => { signOut().catch((error: unknown) => Alert.alert("Couldn't sign out", error instanceof Error ? error.message : "Please try again.")); }}
      />}
    </View>
    <TabBar colors={colors} active={activeTab} onChange={setActiveTab} />
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, content: { flex: 1 } });
