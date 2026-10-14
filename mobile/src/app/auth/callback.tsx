import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Body, Button, C, s, Title } from "@/features/tavern/ui";

export default function AuthCallback() {
  const { code, flow, error_description } = useLocalSearchParams<{ code?: string; flow?: string; error_description?: string }>();
  const [error, setError] = useState("");
  const displayError = error_description || (!code || !supabase ? "This link is incomplete or Supabase is not configured." : error);
  useEffect(() => {
    let active = true;
    if (error_description || !code || !supabase) return;
    supabase.auth.exchangeCodeForSession(code).then(({ error: authError }) => {
      if (!active) return;
      if (authError) setError(authError.message);
      else router.replace(flow === "reset" ? "/account?mode=reset" : "/");
    });
    return () => { active = false; };
  }, [code, flow, error_description]);
  return <View style={[s.screen, { justifyContent: "center", padding: 24, gap: 20 }]}>
    <Title>{displayError ? "Link could not be opened" : "Confirming your account…"}</Title>
    {displayError ? <><Body>{displayError}</Body><Button title="Back to account" onPress={() => router.replace("/account")} /></> : <ActivityIndicator color={C.wax} />}
  </View>;
}
