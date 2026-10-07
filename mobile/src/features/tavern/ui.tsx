import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path, Circle, Rect, Line } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Href } from "expo-router";
import { useTavern } from "./store";
import { Member, Task, profileStats } from "./model";
export const C = {
  ink: "#35271F",
  parchment: "#F4EAD5",
  paper: "#FFF9EC",
  wax: "#783D36",
  brass: "#B58A49",
  green: "#355544",
  muted: "#6C5744",
  line: "#D8C5A5",
  soft: "#EBDDC3",
};
export const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia, serif",
});
export function go(path: string) {
  router.push(path as Href);
}
export type IconName =
  | "board"
  | "people"
  | "work"
  | "message"
  | "profile"
  | "bell"
  | "arrow"
  | "back"
  | "pin"
  | "clock"
  | "check"
  | "plus"
  | "search"
  | "leaf"
  | "book"
  | "heart"
  | "close"
  | "shield"
  | "logout";
const paths: Record<IconName, string> = {
  board: "M5 3h14v18H5z M8 7h8 M8 11h8 M8 15h5",
  people:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M17 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87",
  work: "M9 5V3h6v2 M3 7h18v14H3z M3 12h18 M10 12v3h4v-3",
  message:
    "M21 15a3 3 0 0 1-3 3H7l-5 4V5a3 3 0 0 1 3-3h13a3 3 0 0 1 3 3z M6 7h11 M6 12h7",
  profile: "M4 21v-2a7 7 0 0 1 14 0v2",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  back: "M20 12H4 M10 6l-6 6 6 6",
  pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z",
  clock: "M12 6v6l4 2",
  check: "M4 12l5 5L20 5",
  plus: "M12 4v16 M4 12h16",
  search: "M16 16l5 5",
  leaf: "M20 3C5 1 1 10 6 17c7 5 16-1 14-14z M4 21L16 9",
  book: "M12 5C8 2 3 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-1-1-6-2-10 1z M12 5v16",
  heart: "M20 4c-3-3-7 0-8 2-1-2-5-5-8-2-7 6 8 17 8 17S27 10 20 4z",
  close: "M6 6l12 12 M18 6L6 18",
  shield: "M12 2l9 4v7c0 5-9 9-9 9s-9-4-9-9V6z M8 12l3 3 5-6",
  logout: "M9 3H3v18h6 M10 12h12 M17 7l5 5-5 5",
};
export function Icon({
  name,
  size = 20,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d={paths[name]} />
      {(name === "profile" || name === "people") && (
        <Circle cx={name === "people" ? 9 : 11} cy="7" r="4" />
      )}
      {name === "clock" && <Circle cx="12" cy="12" r="9" />}
      {name === "search" && <Circle cx="10" cy="10" r="7" />}
      {name === "pin" && <Circle cx="12" cy="10" r="2.5" />}
    </Svg>
  );
}
export function Lantern() {
  return (
    <Svg
      width={94}
      height={140}
      viewBox="0 0 94 140"
      fill="none"
      stroke={C.brass}
      strokeWidth={1.4}
    >
      <Path d="M38 23V15a9 9 0 0 1 18 0v8 M28 33h38l-8-10H36z M31 39h32l5 57H26z M26 101h42l-5 10H31z M37 42l4 50 M57 42l-4 50" />
      <Rect x="20" y="114" width="54" height="5" rx="2" />
      <Path
        d="M47 58c-9 11-12 17-7 22 5 5 15 1 13-6-1-5-5-8-6-16z"
        fill={C.brass}
        opacity={0.55}
      />
      <Line x1="47" y1="0" x2="47" y2="5" />
      <Circle cx="14" cy="63" r="1.5" fill={C.brass} />
      <Circle cx="82" cy="46" r="1.5" fill={C.brass} />
    </Svg>
  );
}
export function Label({ children }: React.PropsWithChildren) {
  return <Text style={s.label}>{children}</Text>;
}
export function Title({ children }: React.PropsWithChildren) {
  return <Text style={s.title}>{children}</Text>;
}
export function Body({ children }: React.PropsWithChildren) {
  return <Text style={s.body}>{children}</Text>;
}
export function Button({
  title,
  onPress,
  secondary = false,
  icon,
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  secondary?: boolean;
  icon?: IconName;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.4 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.wax }]}>{title}</Text>
      {icon && <Icon name={icon} color={secondary ? C.wax : C.paper} />}
    </Pressable>
  );
}
export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[s.chip, active && { backgroundColor: C.ink, borderColor: C.ink }]}
    >
      <Text style={[s.chipText, active && { color: C.paper }]}>{label}</Text>
    </Pressable>
  );
}
export function Avatar({
  person,
  large = false,
}: {
  person: Member;
  large?: boolean;
}) {
  return (
    <View
      accessibilityLabel={`${person.name}'s placeholder avatar`}
      style={[s.avatar, large && { width: 80, height: 80, borderRadius: 40 }]}
    >
      <Text style={[s.avatarText, large && { fontSize: 28 }]}>
        {person.initials}
      </Text>
    </View>
  );
}
export function Logo() {
  return (
    <View style={s.logo}>
      <Text style={s.logoR}>R</Text>
      <Text style={s.logoBB}>BB</Text>
    </View>
  );
}
export function Status({ status }: { status: string }) {
  const labels: Record<string, string> = {
    open: "Open bounty",
    pending: "Awaiting approval",
    active: "In progress",
    review: "Completion review",
    completed: "Completed",
    rejected: "Request declined",
    accepted: "Approved",
  };
  const good = ["completed", "active", "accepted"].includes(status);
  return (
    <View style={[s.status, good && { backgroundColor: "#DDE7DC" }]}>
      <Text style={[s.statusText, good && { color: C.green }]}>
        {labels[status] || status}
      </Text>
    </View>
  );
}
export function Field({
  label,
  error,
  ...props
}: TextInputProps & { label: string; error?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={s.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#88745F"
        {...props}
        style={[
          s.input,
          props.multiline && { minHeight: 110, textAlignVertical: "top" },
          props.style,
          error && { borderColor: C.wax },
        ]}
      />
      {error && (
        <Text accessibilityRole="alert" style={s.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}
export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: () => void;
}) {
  return (
    <View style={s.empty}>
      <Icon name="leaf" size={34} color={C.brass} />
      <Text style={s.sectionTitle}>{title}</Text>
      <Body>{body}</Body>
      {action && (
        <Button title="Explore the board" secondary onPress={action} />
      )}
    </View>
  );
}
export function Page({
  children,
  title,
  back = false,
}: React.PropsWithChildren<{ title?: string; back?: boolean }>) {
  const { ready, state, storageError, retrySave, act } = useTavern();
  const unread = state.notices.filter(
    (n) => n.recipient === state.currentId && !n.read,
  ).length;
  return (
    <SafeAreaView edges={["top", "left", "right"]} style={s.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.page}
      >
        <View style={s.header}>
          {back ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() =>
                router.canGoBack() ? router.back() : router.replace("/")
              }
              style={s.iconButton}
            >
              <Icon name="back" />
            </Pressable>
          ) : (
            <Logo />
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.wordmark}>{title || "Rexburg Bounty Board"}</Text>
            <Text style={s.micro}>
              {title ? "THE COMMUNITY LEDGER" : "A GATHERING PLACE FOR GOOD"}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications, ${unread} unread`}
            onPress={() => go("/notifications")}
            style={s.iconButton}
          >
            <Icon name="bell" />
            {unread > 0 && <View style={s.dot} />}
          </Pressable>
        </View>
        {!ready ? (
          <ActivityIndicator color={C.wax} size="large" />
        ) : (
          <>
            {storageError && (
              <View style={s.alert}>
                <Body>{storageError}</Body>
                <Button title="Retry saving" secondary onPress={retrySave} />
              </View>
            )}
            {state.error && (
              <View accessibilityRole="alert" style={s.alert}>
                <Text style={s.errorText}>{state.error}</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => act({ type: "clearError" })}
                >
                  <Text style={s.link}>Dismiss</Text>
                </Pressable>
              </View>
            )}
            {children}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
export function Reward({ xp, small = false }: { xp: number; small?: boolean }) {
  return (
    <View style={[s.reward, small && { width: 55, height: 55 }]}>
      <Text style={[s.rewardValue, small && { fontSize: 18 }]}>{xp}</Text>
      <Text style={s.rewardLabel}>XP</Text>
    </View>
  );
}
export function BountyCard({
  b,
  compact = false,
}: {
  b: Task;
  compact?: boolean;
}) {
  const { state } = useTavern();
  const p = state.people.find((p) => p.id === b.publisher)!;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${b.title}, ${b.xp} XP, ${b.status}. View details`}
      onPress={() => go(`/bounty/${b.id}`)}
      style={({ pressed }) => [s.noticeCard, pressed && { opacity: 0.8 }]}
    >
      <View style={s.pin} />
      <View style={s.rowBetween}>
        <Label>{b.category} / REXBURG</Label>
        <Reward xp={b.xp} small />
      </View>
      <Text style={[s.cardTitle, compact && { fontSize: 22 }]}>{b.title}</Text>
      <View style={s.meta}>
        <Icon name="pin" size={14} color={C.muted} />
        <Text style={s.small}>{b.location}</Text>
      </View>
      <View style={s.meta}>
        <Icon name="clock" size={14} color={C.muted} />
        <Text style={s.small}>{b.duration}</Text>
      </View>
      <View style={s.cardFooter}>
        <Text style={s.small}>Posted by {p.name.split(" ")[0]}</Text>
        {b.status === "open" ? (
          <Icon name="arrow" color={C.wax} />
        ) : (
          <Status status={b.status} />
        )}
      </View>
    </Pressable>
  );
}
export function ProfileOverview({ person }: { person: Member }) {
  const { state } = useTavern();
  const stats = profileStats(state, person.id);
  return (
    <>
      <View style={s.profileHero}>
        <Avatar person={person} large />
        <Title>{person.name}</Title>
        <Body>{person.role} · Rexburg, Idaho</Body>
        <Status
          status={
            person.verified ? "Demo member · Verified" : "Verification pending"
          }
        />
      </View>
      <View style={s.stats}>
        {[
          [stats.xp.toLocaleString(), "SCORE / XP"],
          [String(stats.completed), "COMPLETED"],
          [stats.completed ? stats.rating : "New", "RATING"],
        ].map(([value, label]) => (
          <View key={label} style={s.stat}>
            <Text style={s.statNumber}>{value}</Text>
            <Text style={s.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      <Label>THE PERSON BEHIND THE GOOD</Label>
      <Body>{person.bio}</Body>
      <View style={s.wrap}>
        {person.skills.map((skill) => (
          <Status key={skill} status={skill} />
        ))}
      </View>
      <Text style={s.caption}>
        Sample profile • Historical completion rate: {person.rate}%{"\n"}XP and
        rating rules are illustrative until the team finalizes them.
      </Text>
    </>
  );
}
export function ResponsiveCards({ children }: React.PropsWithChildren) {
  const { width } = useWindowDimensions();
  return (
    <View
      style={[
        s.grid,
        width > 850 && { flexDirection: "row", flexWrap: "wrap" },
      ]}
    >
      {React.Children.map(children, (child) => (
        <View style={width > 850 ? { width: "48.5%" } : { width: "100%" }}>
          {child}
        </View>
      ))}
    </View>
  );
}
export const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.parchment },
  page: {
    padding: 22,
    paddingBottom: 40,
    gap: 22,
    width: "100%",
    maxWidth: 1000,
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.line,
  },
  wordmark: { fontFamily: serif, fontSize: 19, color: C.ink },
  micro: { fontSize: 8, letterSpacing: 1.7, color: C.muted, marginTop: 5 },
  logo: {
    width: 39,
    height: 46,
    borderWidth: 1,
    borderColor: C.brass,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  logoR: { fontFamily: serif, fontSize: 25, lineHeight: 27, color: C.ink },
  logoBB: { fontSize: 8, letterSpacing: 2, color: C.ink },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    position: "absolute",
    right: 8,
    top: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.wax,
  },
  title: {
    fontFamily: serif,
    fontSize: 33,
    lineHeight: 39,
    color: C.ink,
    letterSpacing: -0.6,
  },
  sectionTitle: {
    fontFamily: serif,
    fontSize: 24,
    lineHeight: 30,
    color: C.ink,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: C.muted,
    textTransform: "uppercase",
  },
  body: { fontSize: 14, lineHeight: 23, color: C.muted },
  small: { fontSize: 12, lineHeight: 19, color: C.muted, flexShrink: 1 },
  caption: { fontSize: 11, lineHeight: 18, color: C.muted },
  link: { fontSize: 13, color: C.wax, fontWeight: "700" },
  button: {
    minHeight: 50,
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: C.wax,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: C.wax,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.paper,
    flexShrink: 1,
  },
  secondary: { backgroundColor: "transparent" },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  wrap: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  chip: {
    minHeight: 44,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: C.paper,
  },
  chipText: { fontSize: 12, fontWeight: "600", color: C.muted },
  avatar: {
    width: 46,
    height: 46,
    backgroundColor: C.soft,
    borderWidth: 1,
    borderColor: C.brass,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontFamily: serif, fontSize: 18, color: C.wax },
  status: {
    alignSelf: "flex-start",
    backgroundColor: "#E9D8BA",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  statusText: { fontSize: 11, color: "#654A2F", fontWeight: "600" },
  input: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 6,
    padding: 14,
    fontSize: 16,
    color: C.ink,
    minHeight: 50,
  },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: C.ink },
  errorText: { fontSize: 13, lineHeight: 21, color: C.wax },
  alert: {
    padding: 16,
    gap: 12,
    backgroundColor: "#EFDDD3",
    borderLeftWidth: 3,
    borderLeftColor: C.wax,
  },
  empty: {
    alignItems: "center",
    padding: 30,
    gap: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: C.line,
  },
  noticeCard: {
    backgroundColor: C.paper,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 5,
    padding: 22,
    gap: 15,
    boxShadow: "2px 4px 0px rgba(109, 79, 39, 0.09)",
  },
  pin: {
    position: "absolute",
    top: 8,
    left: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.brass,
  },
  cardTitle: {
    fontFamily: serif,
    fontSize: 27,
    lineHeight: 33,
    color: C.ink,
    letterSpacing: -0.4,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 7 },
  cardFooter: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: C.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  reward: {
    width: 74,
    height: 74,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: C.wax,
    backgroundColor: "#F0E0C6",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardValue: { fontFamily: serif, fontSize: 25, color: C.wax },
  rewardLabel: { fontSize: 9, letterSpacing: 1, color: C.wax },
  profileHero: { alignItems: "center", gap: 13, padding: 18 },
  stats: {
    flexDirection: "row",
    paddingVertical: 22,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.line,
  },
  stat: { flex: 1, alignItems: "center", gap: 6 },
  statNumber: { fontFamily: serif, fontSize: 25, color: C.ink },
  statLabel: { fontSize: 9, letterSpacing: 1, color: C.muted },
  grid: { gap: 20 },
  inset: { backgroundColor: C.soft, padding: 18, gap: 12, borderRadius: 5 },
  personRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  personName: { fontSize: 15, fontWeight: "600", color: C.ink },
  divider: { height: 1, backgroundColor: C.line },
  hero: { backgroundColor: C.ink, borderRadius: 8, padding: 25, gap: 16 },
  heroTitle: {
    fontFamily: serif,
    fontSize: 36,
    lineHeight: 40,
    color: C.paper,
    letterSpacing: -0.7,
  },
  heroText: { fontSize: 13, lineHeight: 21, color: "#E0CDB0" },
  heroLabel: { fontSize: 9, letterSpacing: 1.6, color: "#DFC18B" },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroBottom: {
    borderTopWidth: 1,
    borderTopColor: "#67513B",
    paddingTop: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroNumber: { fontFamily: serif, fontSize: 21, color: "#E4C692" },
  segmented: { flexDirection: "row", gap: 8 },
  message: {
    backgroundColor: C.paper,
    padding: 16,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 10,
    maxWidth: "88%",
    gap: 8,
  },
  messageOwn: { alignSelf: "flex-end", backgroundColor: C.soft },
  step: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    paddingVertical: 8,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    backgroundColor: C.paper,
    padding: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 7,
  },
});
