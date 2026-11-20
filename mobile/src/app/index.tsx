import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BrandMark, Surface } from "../components/ui";
import { AuthenticatedApp } from "../components/AuthenticatedApp";
import { useAuth } from "../features/auth/AuthProvider";
import { getOwnProfile, type OwnProfile } from "../features/profile/profileRepository";
import { palettes } from "../theme";

export default function HomeScreen() {
  const { session, loading, error, signIn, signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const colors = palettes.dark;
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [profileResult, setProfileResult] = useState<{ userId: string; profile: OwnProfile | null; error: string | null } | null>(null);
  const [profileRefresh, setProfileRefresh] = useState(0);
  const sessionUserId = session?.user.id;

  useEffect(() => {
    if (!sessionUserId) return;

    let current = true;
    getOwnProfile(sessionUserId).then((result) => {
      if (current) setProfileResult({ userId: sessionUserId, profile: result, error: null });
    }).catch((queryError: unknown) => {
      if (current) setProfileResult({
        userId: sessionUserId,
        profile: null,
        error: queryError instanceof Error ? queryError.message : "Could not load your profile.",
      });
    });

    return () => { current = false; };
  }, [sessionUserId, profileRefresh]);

  const ownProfileResult = profileResult?.userId === sessionUserId ? profileResult : null;
  const profileLoading = Boolean(sessionUserId) && !ownProfileResult;
  const profile = ownProfileResult?.profile ?? null;
  const profileError = ownProfileResult?.error ?? null;

  const submit = async () => {
    setLocalError(null);
    setNotice(null);
    if (!email.trim() || !password || (creatingAccount && !username.trim())) {
      setLocalError(creatingAccount ? "Enter a username, email, and password." : "Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      if (creatingAccount) {
        await signUp(email.trim(), password, username.trim());
        setNotice("Account request sent. If email confirmation is enabled, check your inbox to finish signing in.");
      } else {
        await signIn(email.trim(), password);
      }
    } catch {
      // AuthProvider exposes the backend's error message without logging credentials.
    } finally {
      setBusy(false);
    }
  };

  return <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
    {loading ? <View style={styles.center}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted, marginTop: 12 }}>Restoring your session…</Text></View> : session ? <AuthenticatedApp
      profile={profile}
      profileLoading={profileLoading}
      profileError={profileError}
      onRetryProfile={() => setProfileRefresh((value) => value + 1)}
    /> : <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <BrandMark colors={colors} />
        <Text style={[styles.title, { color: colors.text }]}>Rexburg Bounty Board</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>{creatingAccount ? "Create your account" : "Sign in to continue"}</Text>
        {error ? <Surface colors={colors} style={styles.errorCard}><Text accessibilityRole="alert" style={styles.error}>{error}</Text></Surface> : null}
        <Surface colors={colors} style={styles.card}>
          {creatingAccount ? <>
            <Text style={[styles.label, { color: colors.text }]}>Username</Text>
            <TextInput accessibilityLabel="Username" autoCapitalize="none" autoComplete="username" value={username} onChangeText={setUsername} placeholder="Choose a username" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
          </> : null}
          <Text style={[styles.label, { color: colors.text }]}>Email</Text>
          <TextInput accessibilityLabel="Email" autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
          <Text style={[styles.label, { color: colors.text }]}>Password</Text>
          <TextInput accessibilityLabel="Password" autoComplete={creatingAccount ? "new-password" : "current-password"} secureTextEntry value={password} onChangeText={setPassword} placeholder="Enter your password" placeholderTextColor={colors.muted} style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.surfaceAlt }]} />
          {localError ? <Text accessibilityRole="alert" style={styles.error}>{localError}</Text> : null}
          {notice ? <Text accessibilityLiveRegion="polite" style={{ color: colors.accentStrong, lineHeight: 20 }}>{notice}</Text> : null}
          <Pressable accessibilityRole="button" disabled={busy} onPress={submit} style={[styles.submit, { backgroundColor: colors.accentSoft, borderColor: colors.accent, opacity: busy ? 0.65 : 1 }]}>
            {busy ? <ActivityIndicator color={colors.accentStrong} /> : <Text style={{ color: colors.text, fontWeight: "800" }}>{creatingAccount ? "Create account" : "Sign in"}</Text>}
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => { setCreatingAccount((value) => !value); setNotice(null); setLocalError(null); }} style={styles.modeToggle}>
            <Text style={{ color: colors.accentStrong }}>{creatingAccount ? "Already registered? Sign in" : "New here? Create an account"}</Text>
          </Pressable>
        </Surface>
      </ScrollView>
    </KeyboardAvoidingView>}
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 }, flex: { flex: 1 }, center: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 1, width: "100%", maxWidth: 520, alignSelf: "center", justifyContent: "center", padding: 22, gap: 13 },
  title: { fontSize: 26, fontWeight: "800", textAlign: "center" }, subtitle: { fontSize: 15, textAlign: "center", marginBottom: 8 },
  card: { gap: 11, padding: 18 }, cardTitle: { fontSize: 18, fontWeight: "800" }, label: { fontSize: 13, fontWeight: "700", marginTop: 4 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, fontSize: 15 },
  submit: { minHeight: 48, borderWidth: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 5 },
  modeToggle: { minHeight: 44, alignItems: "center", justifyContent: "center" }, errorCard: { borderColor: "#A7443C" }, error: { color: "#E07B70", lineHeight: 20 },
});
