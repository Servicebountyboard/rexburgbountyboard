import React, { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { supabase } from "@/lib/supabase";
import { useTavern } from "../tavern/live-store";
import { passwordError } from "../tavern/live-model";
import { Body, Button, C, Field, Label, Logo, s, Title } from "../tavern/ui";

type Mode = "signin" | "signup" | "verify" | "forgot" | "sent" | "reset" | "changed";
const callbackUrl = (flow: "verify" | "reset") => Linking.createURL("auth/callback", { queryParams: { flow } });
const go = (mode: Mode) => router.replace({ pathname: "/account", params: { mode } });
const accountErrorMessage = (reason: unknown) => {
  const message = reason instanceof Error ? reason.message : "The account request failed.";
  if (/email rate limit exceeded/i.test(message)) return "Supabase's test email quota has been reached. Try again after it resets, or temporarily turn off Confirm Email in Supabase Auth settings while testing.";
  return message;
};

export default function AccountScreen() {
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = (["signin", "signup", "verify", "forgot", "sent", "reset", "changed"] as string[]).includes(rawMode || "") ? rawMode as Mode : "signin";
  const { session } = useTavern();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const verificationRedirect = callbackUrl("verify");
  const usingExpoGo = verificationRedirect.startsWith("exp://") || verificationRedirect.startsWith("exps://");
  useEffect(() => { if (mode === "signin" && session) router.replace("/"); }, [mode, session]);

  async function submit() {
    if (!supabase) { setError("Supabase is not configured. Add mobile/.env and restart Expo."); return; }
    setError(""); setMessage("");
    const cleanEmail = email.trim().toLowerCase();
    if (["signin", "signup", "forgot"].includes(mode) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError("Enter a valid email address."); return; }
    if (mode === "signup" && !/^[a-z0-9_]{3,24}$/.test(username.trim().toLowerCase())) { setError("Use 3–24 letters, numbers, or underscores for your username."); return; }
    if (mode === "signup" || mode === "reset") {
      const reason = passwordError(password);
      if (reason) { setError(reason); return; }
      if (password !== confirm) { setError("Passwords do not match."); return; }
    }
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
        if (authError) throw authError;
        router.replace("/");
      } else if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email: cleanEmail, password, options: { data: { username: username.trim().toLowerCase() }, emailRedirectTo: callbackUrl("verify") } });
        if (authError) {
          if (authError.message.includes("Database error saving new user")) {
            throw new Error("Supabase could not create this account's profile. The username may already be in use; try a different one. If it still fails, ask the project owner to check Auth and Postgres logs.");
          }
          throw authError;
        }
        setPassword(""); setConfirm("");
        if (data.session) router.replace("/");
        else go("verify");
      } else if (mode === "forgot") {
        const { error: authError } = await supabase.auth.resetPasswordForEmail(cleanEmail, { redirectTo: callbackUrl("reset") });
        if (authError) throw authError;
        go("sent");
      } else if (mode === "reset") {
        if (!session) throw new Error("Open the latest password reset link first.");
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) throw authError;
        setPassword(""); setConfirm("");
        go("changed");
      }
    } catch (reason) {
      setError(accountErrorMessage(reason));
    } finally { setBusy(false); }
  }
  async function resend() {
    if (!supabase || !email.trim()) { setError("Enter your signup email first."); return; }
    setBusy(true); setError("");
    const { error: authError } = await supabase.auth.resend({ type: "signup", email: email.trim().toLowerCase(), options: { emailRedirectTo: callbackUrl("verify") } });
    setBusy(false);
    if (authError) setError(accountErrorMessage(authError));
    else setMessage("If this address still needs confirmation, a new link may be on its way. Already confirmed? Sign in instead.");
  }
  return <SafeAreaView style={s.screen}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[s.page, { maxWidth: 520, paddingTop: 38 }]}>
    <View style={s.rowBetween}><Logo /><Text style={s.wordmark}>Rexburg Bounty Board</Text></View>
    <Label>THE COMMUNITY LEDGER</Label>
    <Title>{mode === "signin" ? "Your place at the table." : mode === "signup" ? "Join the common good." : mode === "forgot" ? "Find your way back." : mode === "reset" ? "Choose a new password." : mode === "changed" ? "A fresh start." : "Check your inbox."}</Title>
    <Body>{mode === "signin" ? "Sign in to find and post real bounties." : mode === "signup" ? "Create an account to help your neighbors." : mode === "verify" ? "Follow the confirmation link in your email, then return to sign in. If the link opened an unavailable page, try signing in first; your address may already be confirmed." : mode === "sent" ? "If the address matches an account, a reset link is on its way." : mode === "changed" ? "Your password has been updated." : "Use the link from your email to continue."}</Body>
    {mode === "verify" && usingExpoGo && <View style={s.inset}>
      <Label>EXPO GO CONFIRMATION REDIRECT</Label>
      <Text selectable style={s.body}>{verificationRedirect}</Text>
      <Body>Add this exact URL to Supabase Authentication → URL Configuration → Redirect URLs, then resend the confirmation email. Keep Expo running while opening the link. This URL can change when Expo restarts.</Body>
    </View>}
    {!!error && <View accessibilityRole="alert" style={s.alert}><Text style={s.errorText}>{error}</Text></View>}
    {!!message && <Text style={s.body}>{message}</Text>}
    {(["signin", "signup", "forgot", "verify"] as Mode[]).includes(mode) && <Field label="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />}
    {mode === "signup" && <Field label="Username (must be unique)" value={username} onChangeText={setUsername} autoCapitalize="none" maxLength={24} />}
    {(["signin", "signup", "reset"] as Mode[]).includes(mode) && <Field label={mode === "reset" ? "New password" : "Password"} value={password} onChangeText={setPassword} secureTextEntry autoComplete={mode === "signin" ? "current-password" : "new-password"} />}
    {(mode === "signup" || mode === "reset") && <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />}
    {(["signin", "signup", "forgot", "reset"] as Mode[]).includes(mode) && <Button title={mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset email" : "Update password"} disabled={busy} onPress={() => { void submit(); }} />}
    {busy && <ActivityIndicator color={C.wax} />}
    {mode === "signin" && <><Button title="Create an account" secondary onPress={() => go("signup")} /><Button title="Resend confirmation email" secondary onPress={() => go("verify")} /><Button title="Forgot password?" secondary onPress={() => go("forgot")} /></>}
    {mode === "verify" && <Button title="Resend confirmation email" secondary disabled={busy} onPress={() => { void resend(); }} />}
    {mode !== "signin" && <Button title="Back to sign in" secondary onPress={() => go("signin")} />}
    {session && mode !== "reset" && <Button title="Go to bounty board" secondary onPress={() => router.replace("/")} />}
  </ScrollView></KeyboardAvoidingView></SafeAreaView>;
}
