import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { AppButton, Surface } from "./ui";
import { listNotifications, markNotificationRead, NOTIFICATIONS_PER_PAGE } from "../features/notifications/notificationRepository";
import type { AppColors } from "../theme";

type NotificationRow = Awaited<ReturnType<typeof listNotifications>>[number];

export function NotificationScreen({ userId, colors }: { userId: string; colors: AppColors }) {
  const [offset, setOffset] = useState(0);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState<{ userId: string; items: NotificationRow[]; loading: boolean; error: string | null; hasMore: boolean } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listNotifications(userId, offset).then((page) => {
      if (!active) return;
      setState((current) => ({
        userId,
        items: offset && current?.userId === userId ? [...current.items, ...page] : page,
        loading: false,
        error: null,
        hasMore: page.length === NOTIFICATIONS_PER_PAGE,
      }));
    }).catch((error: unknown) => {
      if (active) setState((current) => ({ userId, items: current?.userId === userId ? current.items : [], loading: false, error: error instanceof Error ? error.message : "Could not load notifications.", hasMore: false }));
    });
    return () => { active = false; };
  }, [userId, offset, refresh]);

  const current = state?.userId === userId ? state : null;
  const markRead = async (notificationId: number) => {
    setBusyId(notificationId);
    setActionError(null);
    try {
      await markNotificationRead(notificationId);
      setState((previous) => previous?.userId === userId ? { ...previous, items: previous.items.map((item) => item.notification_id === notificationId ? { ...item, is_read: true } : item) } : previous);
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : "The notification could not be marked read.");
    } finally {
      setBusyId(null);
    }
  };

  return <View style={styles.root}>
    {current?.error ? <Surface colors={colors} style={styles.state}><Text style={{ color: colors.text, fontWeight: "800" }}>Notifications could not be loaded</Text><Text accessibilityRole="alert" style={{ color: colors.muted }}>{current.error}</Text><AppButton colors={colors} label="Retry" secondary onPress={() => { setOffset(0); setState(null); setRefresh((value) => value + 1); }} /></Surface> : null}
    {!current ? <View style={styles.loading}><ActivityIndicator color={colors.accent} /><Text style={{ color: colors.muted, marginTop: 10 }}>Loading notifications…</Text></View> : null}
    {current && !current.error ? <>
      {actionError ? <Text accessibilityRole="alert" style={{ color: "#E07B70", marginHorizontal: 16, marginBottom: 8 }}>{actionError}</Text> : null}
      {current.items.length ? current.items.map((item) => <Surface key={item.notification_id} colors={colors} style={styles.card}>
        <View style={styles.cardTop}><Text style={[styles.title, { color: colors.text, flex: 1 }]}>{item.title}</Text><Text style={{ color: item.is_read ? colors.muted : colors.accentStrong, fontWeight: "700", fontSize: 11 }}>{item.is_read ? "READ" : "NEW"}</Text></View>
        <Text style={{ color: colors.muted, lineHeight: 20 }}>{item.message}</Text>
        <View style={styles.footer}><Text style={{ color: colors.muted, fontSize: 11 }}>{new Date(item.created_at).toLocaleString()}</Text>{!item.is_read ? <AppButton colors={colors} label={busyId === item.notification_id ? "Saving…" : "Mark read"} secondary disabled={busyId !== null} onPress={() => { void markRead(item.notification_id); }} /> : null}</View>
      </Surface>) : <Surface colors={colors} style={styles.state}><Text style={{ color: colors.text, fontWeight: "800" }}>No notifications</Text><Text style={{ color: colors.muted }}>Database-generated updates will appear here.</Text></Surface>}
      {current.hasMore ? <View style={{ padding: 16 }}><AppButton colors={colors} label="Load older notifications" secondary onPress={() => setOffset((value) => value + NOTIFICATIONS_PER_PAGE)} /></View> : null}
    </> : null}
  </View>;
}

const styles = StyleSheet.create({ root: { flex: 1 }, loading: { flex: 1, alignItems: "center", justifyContent: "center" }, state: { margin: 16, padding: 22, alignItems: "center", gap: 10 }, card: { marginHorizontal: 16, marginBottom: 9, padding: 14, gap: 9 }, cardTop: { flexDirection: "row", alignItems: "center", gap: 8 }, title: { fontSize: 15, fontWeight: "800" }, footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 } });
