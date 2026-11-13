import type { PropsWithChildren, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { AppColors } from "../theme";

export function BrandMark({ colors, size = 48 }: { colors: AppColors; size?: number }) {
  return <View style={[styles.brandMark, { width: size, height: size, borderColor: colors.accent, backgroundColor: colors.accentSoft }]}>
    <Text style={{ color: colors.accent, fontSize: size * 0.58, lineHeight: size * 0.78 }}>✦</Text>
  </View>;
}

export function AppHeader({ colors, subtitle, onProfile, title = "Bounty Board", onBack }: { colors: AppColors; subtitle: string; onProfile: () => void; title?: string; onBack?: () => void }) {
  return <View style={styles.header}>
    {onBack ? <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={onBack} style={[styles.backButton, { backgroundColor: colors.surfaceAlt }]}><Text style={{ color: colors.text, fontSize: 24 }}>‹</Text></Pressable> : <BrandMark colors={colors} />}
    <View style={styles.headerTitle}>
      <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text>
    </View>
    <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={onProfile} style={[styles.avatarButton, { backgroundColor: colors.surfaceAlt }]}>
      <Text style={{ fontSize: 21 }}>👤</Text><View style={[styles.onlineDot, { backgroundColor: colors.accent }]} />
    </Pressable>
  </View>;
}

export function Surface({ colors, children, style }: PropsWithChildren<{ colors: AppColors; style?: StyleProp<ViewStyle> }>) {
  return <View style={[styles.surface, { backgroundColor: colors.surface, borderColor: colors.line, shadowColor: colors.shadow }, style]}>{children}</View>;
}

export function AppButton({ colors, label, onPress, secondary = false }: { colors: AppColors; label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? colors.surfaceAlt : colors.accentSoft, borderColor: colors.accent, opacity: pressed ? 0.75 : 1 }]}>
    <Text style={{ color: colors.text, fontWeight: "700" }}>{label}</Text>
  </Pressable>;
}

export function TagChip({ colors, label, icon, selected, onPress, tint }: { colors: AppColors; label: string; icon?: string; selected?: boolean; onPress?: () => void; tint?: string }) {
  const content: ReactNode = <><Text style={{ color: tint ?? colors.accentStrong, fontWeight: "800" }}>{icon ?? "✦"}</Text><Text numberOfLines={1} style={{ color: colors.text, fontSize: 12, fontWeight: selected ? "700" : "500" }}>{label}</Text>{selected ? <Text style={{ color: colors.muted }}>×</Text> : null}</>;
  const style = [styles.tagChip, { backgroundColor: selected ? colors.accentSoft : colors.surfaceAlt, borderColor: selected ? colors.accent : colors.line }];
  return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={style}>{content}</Pressable> : <View style={style}>{content}</View>;
}

export function Reward({ colors, xp, gold }: { colors: AppColors; xp: number; gold?: number }) {
  return <View style={styles.rewardRow}><Text style={{ color: colors.accentStrong, fontSize: 18 }}>✦</Text><Text style={[styles.rewardText, { color: colors.text }]}>{xp} XP</Text>{gold !== undefined ? <Text style={{ color: colors.muted, fontSize: 12 }}> · {gold} gold</Text> : null}</View>;
}

export function TabBar({ colors, active, onChange }: { colors: AppColors; active: "Chat" | "Board" | "Profile"; onChange: (tab: "Chat" | "Board" | "Profile") => void }) {
  return <View style={[styles.tabBar, { backgroundColor: colors.background, borderColor: colors.line }]}>
    {([ ["Chat", "▤"], ["Board", "♜"], ["Profile", "♟"] ] as const).map(([tab, icon]) => {
      const selected = active === tab;
      return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => onChange(tab)} style={[styles.tabItem, selected && { backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1 }]}>
        <Text style={{ fontSize: 19, color: selected ? colors.accentStrong : colors.text }}>{icon}</Text>
        <Text style={{ color: selected ? colors.accentStrong : colors.muted, fontSize: 12, fontWeight: selected ? "700" : "500" }}>{tab}</Text>
      </Pressable>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 18, paddingTop: 8, paddingBottom: 16 }, backButton: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1 }, title: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 }, subtitle: { fontSize: 13, marginTop: 1 },
  brandMark: { alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 13 },
  avatarButton: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, onlineDot: { position: "absolute", right: 2, top: 2, width: 10, height: 10, borderRadius: 5, borderWidth: 1, borderColor: "#222" },
  surface: { borderWidth: 1, borderRadius: 16, padding: 14, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  button: { borderWidth: 1, borderRadius: 13, minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  tagChip: { minHeight: 34, borderWidth: 1, borderRadius: 11, paddingHorizontal: 10, gap: 7, flexDirection: "row", alignItems: "center", justifyContent: "center", maxWidth: "100%" },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 5 }, rewardText: { fontSize: 18, fontWeight: "800" },
  tabBar: { flexDirection: "row", paddingHorizontal: 12, paddingTop: 7, paddingBottom: 4, gap: 7, borderTopWidth: 1 },
  tabItem: { flex: 1, minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 2, borderColor: "transparent" },
});
