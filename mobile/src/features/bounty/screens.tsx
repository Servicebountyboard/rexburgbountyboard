import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Bounty, bounties, people, Person, useBounties } from "./store";

const C = {
  ink: "#20372E",
  muted: "#748078",
  paper: "#F7F8F2",
  green: "#244D3B",
  lime: "#D7EF9E",
  line: "#E5E9DF",
};
function Button({
  label,
  onPress,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        secondary && s.secondary,
        pressed && { opacity: 0.7 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: C.green }]}>
        {label}
      </Text>
    </Pressable>
  );
}
function Avatar({
  person,
  large = false,
}: {
  person: Person;
  large?: boolean;
}) {
  return (
    <View
      style={[
        s.avatar,
        { backgroundColor: person.color },
        large && { width: 76, height: 76, borderRadius: 26 },
      ]}
    >
      <Text style={[s.avatarText, large && { fontSize: 24 }]}>
        {person.initials}
      </Text>
    </View>
  );
}
function Pill({ text, dark = false }: { text: string; dark?: boolean }) {
  return (
    <View style={[s.pill, dark && { backgroundColor: C.lime }]}>
      <Text style={s.pillText}>{text}</Text>
    </View>
  );
}
function Sheet({
  title,
  close,
  children,
}: React.PropsWithChildren<{ title: string; close: () => void }>) {
  return (
    <Modal
      transparent
      animationType="slide"
      onRequestClose={close}
      statusBarTranslucent
    >
      <View style={s.backdrop}>
        <SafeAreaView style={s.sheet} edges={["bottom"]}>
          <View style={s.sheetHeader}>
            <Text style={s.eyebrow}>{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close dialog"
              onPress={close}
              style={s.close}
            >
              <Text style={{ fontSize: 24, color: C.ink }}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={s.sheetContent}>
            {children}
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.small}>{label}</Text>
    </View>
  );
}
function Profile({ person }: { person: Person }) {
  const { state } = useBounties();
  const done =
    person.id === "you"
      ? state.assignments.filter((a) => a.status === "completed")
      : [];
  const xp =
    person.xp +
    done.reduce(
      (sum, a) => sum + (bounties.find((b) => b.id === a.bountyId)?.xp ?? 0),
      0,
    );
  return (
    <>
      <View style={s.profileHero}>
        <Avatar person={person} large />
        <Text style={s.heading}>{person.name}</Text>
        <Text style={s.muted}>{person.role} · Rexburg, ID</Text>
        <Pill
          text={`LEVEL ${Math.floor(xp / 500) + 1} · ${xp.toLocaleString()} XP`}
          dark
        />
      </View>
      <View style={s.stats}>
        <Stat value={person.rating} label="★ Rating" />
        <Stat
          value={String(person.completed + done.length)}
          label="Completed"
        />
        <Stat value={`${person.rate}%`} label="Completion" />
      </View>
      <Text style={s.small}>
        Completion rate reflects sample profile history.
      </Text>
      <Text style={s.sectionTitle}>A neighbor you can count on</Text>
      <Text style={s.body}>{person.bio}</Text>
      <View style={s.wrap}>
        {person.skills.map((skill) => (
          <Pill key={skill} text={skill} />
        ))}
      </View>
      <View style={s.quote}>
        <Text style={s.eyebrow}>COMMUNITY FEEDBACK · SAMPLE</Text>
        <Text style={s.quoteText}>
          “Kind, reliable, and ready to help. Made a real difference to our
          day.”
        </Text>
        <Text style={s.small}>A fellow Rexburg neighbor · ★★★★★</Text>
      </View>
    </>
  );
}
function Inbox({
  close,
  initialRecipient,
}: {
  close: () => void;
  initialRecipient: string;
}) {
  const { state, dispatch } = useBounties();
  const [recipient, setRecipient] = useState(initialRecipient);
  const [selected, setSelected] = useState<string | null>(null);
  const notices = state.notices.filter((n) => n.recipient === recipient);
  const bounty = bounties.find((b) => b.id === selected);
  const status = state.assignments.find((a) => a.bountyId === selected)?.status;
  return (
    <Sheet title="NOTIFICATION CENTER" close={close}>
      <Text style={s.heading}>
        {recipient === "you" ? "Your updates" : "The publisher’s view"}
      </Text>
      <Text style={s.body}>
        Demo inbox · notifications are simulated on this device.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {people.map((p) => (
          <Pressable
            accessibilityRole="button"
            key={p.id}
            onPress={() => {
              setRecipient(p.id);
              setSelected(null);
              dispatch({ type: "read", recipient: p.id });
            }}
            style={[s.chip, recipient === p.id && s.chipActive]}
          >
            <Text style={[s.chipText, recipient === p.id && s.chipTextActive]}>
              {p.id === "you" ? "You" : p.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {!notices.length && (
        <View style={s.empty}>
          <Text style={s.sectionTitle}>All quiet for now</Text>
          <Text style={s.body}>
            Accept a bounty to send its publisher a demo notification.
          </Text>
        </View>
      )}
      {notices.map((n) => {
        const item = bounties.find((b) => b.id === n.bountyId)!;
        return (
          <Pressable
            accessibilityRole="button"
            key={n.id}
            onPress={() => {
              setSelected(item.id);
              dispatch({ type: "read", recipient });
            }}
            style={[s.notice, selected === item.id && { borderColor: C.green }]}
          >
            <Text style={s.eyebrow}>
              {n.kind === "completed"
                ? "✓ REWARD UNLOCKED"
                : n.kind === "submitted"
                  ? "✓ READY FOR REVIEW"
                  : "↗ NEW BOUNTY ACCEPTANCE"}
            </Text>
            <Text style={s.cardTitle}>
              {n.kind === "completed"
                ? `You earned ${item.xp} XP`
                : n.kind === "submitted"
                  ? "Bridger finished a bounty"
                  : "Bridger accepted your bounty"}
            </Text>
            <Text style={s.body}>{item.title}</Text>
            <Text style={s.link}>
              {recipient === "you"
                ? "View reward details →"
                : "Review hunter profile →"}
            </Text>
          </Pressable>
        );
      })}
      {bounty && (
        <View style={s.review}>
          <Text style={s.eyebrow}>
            {recipient === "you"
              ? "BOUNTY COMPLETED"
              : "YOUR BOUNTY · HUNTER OVERVIEW"}
          </Text>
          <Text style={s.sectionTitle}>{bounty.title}</Text>
          {recipient !== "you" && <Profile person={people[0]} />}
          {recipient !== "you" && status === "submitted" && (
            <Button
              label={`Confirm completion · award ${bounty.xp} XP`}
              onPress={() =>
                dispatch({ type: "complete", bountyId: bounty.id })
              }
            />
          )}
          {status === "accepted" && (
            <Text style={s.body}>
              Bridger is on it. You can confirm completion once the hunter
              submits the bounty for review.
            </Text>
          )}
          {status === "completed" && (
            <View style={s.success}>
              <Text style={s.successText}>
                ✓ Completed · {bounty.xp} XP awarded to Bridger
              </Text>
            </View>
          )}
        </View>
      )}
    </Sheet>
  );
}
function Detail({
  bounty,
  close,
  openInbox,
}: {
  bounty: Bounty;
  close: () => void;
  openInbox: (id: string) => void;
}) {
  const { state, dispatch } = useBounties();
  const status = state.assignments.find(
    (a) => a.bountyId === bounty.id,
  )?.status;
  const publisher = people.find((p) => p.id === bounty.publisher)!;
  return (
    <Sheet title="THE BOUNTY BRIEF" close={close}>
      <View style={[s.detailArt, { backgroundColor: bounty.color }]}>
        <Text style={s.artSymbol}>{bounty.symbol}</Text>
        <Pill text={`+${bounty.xp} XP`} dark />
      </View>
      <View style={s.wrap}>
        <Pill text={bounty.category} />
        <Pill
          text={
            status === "completed"
              ? "Completed"
              : status === "submitted"
                ? "Awaiting review"
                : status === "accepted"
                  ? "Accepted by you"
                  : "Open bounty"
          }
        />
      </View>
      <Text style={s.heading}>{bounty.title}</Text>
      <Text style={s.body}>⌖ {bounty.location}</Text>
      <View style={s.stats}>
        <Stat value={bounty.duration} label="Time commitment" />
        <Stat value={bounty.distance} label="Sample distance" />
      </View>
      <Text style={s.link}>{bounty.when}</Text>
      <Text style={s.sectionTitle}>A small act. A real difference.</Text>
      <Text style={s.body}>{bounty.description}</Text>
      <Text style={s.sectionTitle}>Good to bring</Text>
      <Text style={s.body}>{bounty.bring}</Text>
      <View style={s.personRow}>
        <Avatar person={publisher} />
        <View style={s.grow}>
          <Text style={s.small}>POSTED BY</Text>
          <Text style={s.cardTitle}>{publisher.name}</Text>
          <Text style={s.small}>★ {publisher.rating} · Community member</Text>
        </View>
      </View>
      {!status && (
        <>
          <Text style={s.small}>
            Accepting shares your name, rating, completed bounties, and
            completion rate with {publisher.name.split(" ")[0]}.
          </Text>
          <Button
            label={`Accept bounty · ${bounty.xp} XP`}
            onPress={() => dispatch({ type: "accept", bountyId: bounty.id })}
          />
        </>
      )}
      {status === "accepted" && (
        <>
          <View style={s.success}>
            <Text style={s.successText}>✓ You’re on the board!</Text>
            <Text style={s.body}>
              {publisher.name.split(" ")[0]} received a demo notification with
              your hunter profile.
            </Text>
          </View>
          <Button
            label="I’ve finished · request review"
            onPress={() => dispatch({ type: "submit", bountyId: bounty.id })}
          />
        </>
      )}
      {status === "submitted" && (
        <View style={s.success}>
          <Text style={s.successText}>✓ Completion sent for review</Text>
          <Text style={s.body}>
            Your XP will be awarded when the publisher confirms your work.
          </Text>
        </View>
      )}
      {status === "completed" && (
        <View style={s.success}>
          <Text style={s.successText}>✦ Nice work! {bounty.xp} XP earned.</Text>
          <Text style={s.body}>Your hunter profile has been updated.</Text>
        </View>
      )}
      {status && (
        <Button
          label={`Preview ${publisher.name.split(" ")[0]}’s inbox →`}
          secondary
          onPress={() => openInbox(publisher.id)}
        />
      )}
    </Sheet>
  );
}
export function BoardScreen() {
  const { state } = useBounties();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState<Bounty | null>(null);
  const [inbox, setInbox] = useState<string | null>(null);
  const [profile, setProfile] = useState(false);
  const totalXp =
    people[0].xp +
    state.assignments
      .filter((a) => a.status === "completed")
      .reduce(
        (sum, a) => sum + bounties.find((b) => b.id === a.bountyId)!.xp,
        0,
      );
  const active = state.assignments.filter(
    (a) => a.status !== "completed",
  ).length;
  const list = bounties.filter(
    (b) =>
      (filter === "All" ||
        (filter === "My bounties"
          ? state.assignments.some((a) => a.bountyId === b.id)
          : b.category === filter)) &&
      `${b.title} ${b.location}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.header}>
          <View>
            <Text style={s.brand}>
              BOUNTY<Text style={{ color: "#7C9A53" }}> / </Text>REXBURG
            </Text>
            <Text style={s.small}>Good neighbors. Great impact.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => setProfile(true)}
          >
            <Avatar person={people[0]} />
          </Pressable>
        </View>
        <View style={s.hero}>
          <View style={s.rowBetween}>
            <Text style={s.heroEyebrow}>YOUR NEIGHBORHOOD NEEDS YOU</Text>
            <Text style={s.spark}>✳</Text>
          </View>
          <Text style={s.heroTitle}>Small acts.{"\n"}Big local impact.</Text>
          <Text style={s.heroBody}>Find your next good deed in Rexburg.</Text>
          <View style={s.heroFooter}>
            <Pill text={`LEVEL ${Math.floor(totalXp / 500) + 1} HUNTER`} dark />
            <Text style={s.heroXp}>{totalXp.toLocaleString()} XP</Text>
          </View>
          <View style={s.track}>
            <View style={[s.progress, { width: `${(totalXp % 500) / 5}%` }]} />
          </View>
          <Text style={s.heroSmall}>
            {500 - (totalXp % 500)} XP to your next level · Signed in as Bridger
          </Text>
        </View>
        <View>
          <Text style={s.heading}>The bounty board</Text>
          <Text style={s.muted}>
            {active
              ? `${active} in progress · Keep the good going`
              : "A little of your time goes a long way."}
          </Text>
        </View>
        <TextInput
          accessibilityLabel="Search bounties or locations"
          placeholder="Search a good deed or a place"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          style={s.search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.chips}
        >
          {["All", "My bounties", "Outdoors", "Community", "Education"].map(
            (f) => (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: f === filter }}
                key={f}
                onPress={() => setFilter(f)}
                style={[s.chip, filter === f && s.chipActive]}
              >
                <Text style={[s.chipText, filter === f && s.chipTextActive]}>
                  {f}
                </Text>
              </Pressable>
            ),
          )}
        </ScrollView>
        <View style={s.rowBetween}>
          <Text style={s.eyebrow}>{list.length} WAYS TO SHOW UP</Text>
          <Text style={s.small}>Rexburg, ID</Text>
        </View>
        {list.map((b, index) => {
          const status = state.assignments.find(
            (a) => a.bountyId === b.id,
          )?.status;
          const publisher = people.find((p) => p.id === b.publisher)!;
          return (
            <Pressable
              key={b.id}
              accessibilityRole="button"
              accessibilityLabel={`${b.title}, ${b.xp} XP. View bounty`}
              onPress={() => setSelected(b)}
              style={({ pressed }) => [s.card, pressed && { opacity: 0.8 }]}
            >
              <View style={s.cardTop}>
                <View style={[s.iconTile, { backgroundColor: b.color }]}>
                  <Text style={s.tileSymbol}>{b.symbol}</Text>
                </View>
                <View style={s.grow}>
                  <Text style={s.eyebrow}>{b.category.toUpperCase()}</Text>
                  <Text style={s.small}>
                    {b.duration} · {b.distance} away
                  </Text>
                </View>
                <Pill text={`+${b.xp} XP`} dark />
              </View>
              {index === 0 && filter === "All" && (
                <Text style={s.featured}>THE WEEKEND PICK</Text>
              )}
              <Text style={s.cardHeading}>{b.title}</Text>
              <Text style={s.muted}>⌖ {b.location}</Text>
              <View style={s.cardBottom}>
                <Text style={s.small}>
                  {publisher.name} · ★ {publisher.rating}
                </Text>
                <Text style={s.link}>
                  {status === "completed"
                    ? "✓ Completed"
                    : status === "submitted"
                      ? "In review"
                      : status === "accepted"
                        ? "In progress →"
                        : "View bounty →"}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {!list.length && (
          <View style={s.empty}>
            <Text style={s.sectionTitle}>
              Your next good deed is out there.
            </Text>
            <Text style={s.body}>
              {filter === "My bounties"
                ? "Accept a bounty and it will appear here."
                : "Try a different search or category."}
            </Text>
            <Button
              label="Browse all bounties"
              secondary
              onPress={() => {
                setQuery("");
                setFilter("All");
              }}
            />
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => setInbox("you")}
          style={s.demoCard}
        >
          <View style={s.grow}>
            <Text style={s.cardTitle}>The other side of a good deed</Text>
            <Text style={s.small}>
              Preview publisher inboxes ·{" "}
              {state.notices.filter((n) => !n.read).length} unread
            </Text>
          </View>
          <Text style={s.arrow}>↗</Text>
        </Pressable>
        <Text style={s.footnote}>
          PROTOTYPE · Sample people & opportunities{"\n"}Demo sign-in and
          notifications. Progress resets on reload.
        </Text>
      </ScrollView>
      {selected && (
        <Detail
          bounty={selected}
          close={() => setSelected(null)}
          openInbox={(id) => {
            setSelected(null);
            setInbox(id);
          }}
        />
      )}
      {inbox && <Inbox initialRecipient={inbox} close={() => setInbox(null)} />}
      {profile && (
        <Sheet title="YOUR HUNTER PROFILE" close={() => setProfile(false)}>
          <Profile person={people[0]} />
        </Sheet>
      )}
    </SafeAreaView>
  );
}
export function PeopleScreen() {
  const [selected, setSelected] = useState<Person | null>(null);
  const [inbox, setInbox] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const list = people.filter((p) =>
    `${p.name} ${p.skills.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <SafeAreaView edges={["top"]} style={s.screen}>
      <ScrollView
        contentContainerStyle={s.page}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.brand}>THE PEOPLE BEHIND THE GOOD</Text>
        <Text style={s.largeHeading}>Meet your{"\n"}community.</Text>
        <Text style={s.body}>
          Neighbors with a little time and a lot of heart.
        </Text>
        <View style={s.communityBanner}>
          <Text style={s.spark}>✳</Text>
          <View style={s.grow}>
            <Text style={s.cardTitle}>Better, together.</Text>
            <Text style={s.body}>
              Every bounty starts with a person.{"\n"}Get to know yours.
            </Text>
          </View>
        </View>
        <TextInput
          accessibilityLabel="Search people or skills"
          placeholder="Search neighbors or skills"
          placeholderTextColor={C.muted}
          value={query}
          onChangeText={setQuery}
          style={s.search}
        />
        <Text style={s.eyebrow}>
          {list.length} LOCAL CHANGEMAKERS · DEMO PROFILES
        </Text>
        {list.map((p) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSelected(p)}
            key={p.id}
            style={s.card}
          >
            <View style={s.personRow}>
              <Avatar person={p} />
              <View style={s.grow}>
                <Text style={s.cardTitle}>
                  {p.name}
                  {p.id === "you" ? " · You" : ""}
                </Text>
                <Text style={s.small}>{p.role}</Text>
              </View>
              <Text style={s.link}>★ {p.rating}</Text>
            </View>
            <Text style={s.body} numberOfLines={2}>
              {p.bio}
            </Text>
            <View style={s.wrap}>
              {p.skills.map((skill) => (
                <Pill key={skill} text={skill} />
              ))}
            </View>
            <Text style={s.link}>Meet {p.name.split(" ")[0]} →</Text>
          </Pressable>
        ))}
        {!list.length && (
          <Text style={s.body}>
            No neighbors found. Try a name or skill like gardening.
          </Text>
        )}
        <Text style={s.footnote}>
          Built around people, powered by kindness.{"\n"}All profiles are
          fictional prototype data.
        </Text>
      </ScrollView>
      {selected && (
        <Sheet title="COMMUNITY PROFILE" close={() => setSelected(null)}>
          <Profile person={selected} />
          <Button
            label={
              selected.id === "you"
                ? "View your notifications"
                : "Preview publisher inbox"
            }
            secondary
            onPress={() => {
              setInbox(selected.id);
              setSelected(null);
            }}
          />
        </Sheet>
      )}
      {inbox && <Inbox initialRecipient={inbox} close={() => setInbox(null)} />}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.paper },
  page: {
    padding: 22,
    paddingBottom: 110,
    gap: 20,
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  brand: { color: C.ink, fontSize: 14, fontWeight: "900", letterSpacing: 1.4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: { color: C.ink, fontWeight: "800", fontSize: 15 },
  hero: {
    backgroundColor: C.green,
    padding: 24,
    borderRadius: 28,
    gap: 16,
    overflow: "hidden",
  },
  heroEyebrow: {
    fontSize: 10,
    color: C.lime,
    letterSpacing: 1.5,
    fontWeight: "700",
    flex: 1,
  },
  spark: { fontSize: 42, color: "#93B365" },
  heroTitle: {
    fontSize: 36,
    lineHeight: 40,
    color: "#FFFFFF",
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  heroBody: { color: "#D4E1D3", fontSize: 14, lineHeight: 22 },
  heroFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  heroXp: { color: C.lime, fontWeight: "800", fontSize: 18 },
  heroSmall: { color: "#CDDCCB", fontSize: 11, lineHeight: 17 },
  track: { height: 5, backgroundColor: "#567460", borderRadius: 5 },
  progress: { height: 5, backgroundColor: C.lime, borderRadius: 5 },
  heading: {
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "800",
    letterSpacing: -0.7,
    color: C.ink,
  },
  largeHeading: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "800",
    letterSpacing: -1.5,
    color: C.ink,
  },
  muted: { color: C.muted, fontSize: 13, lineHeight: 21 },
  body: { color: "#647068", fontSize: 14, lineHeight: 23 },
  small: { color: C.muted, fontSize: 11, lineHeight: 18 },
  eyebrow: {
    color: "#66775E",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  search: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 15,
    color: C.ink,
    fontSize: 14,
  },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 17,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: "#EBEEE5",
  },
  chipActive: { backgroundColor: C.green },
  chipText: { color: "#61705F", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#FFFFFF" },
  card: {
    borderRadius: 23,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#FFFFFF",
    padding: 19,
    gap: 14,
  },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  tileSymbol: { fontSize: 30, color: C.green },
  cardHeading: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -0.4,
  },
  cardTitle: { color: C.ink, fontSize: 15, fontWeight: "700", lineHeight: 22 },
  featured: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "800",
    color: "#8B7548",
  },
  cardBottom: {
    borderTopWidth: 1,
    borderTopColor: C.line,
    paddingTop: 13,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  grow: { flex: 1, gap: 3 },
  pill: {
    backgroundColor: "#EEF1E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  pillText: { color: C.green, fontSize: 10, fontWeight: "800" },
  link: { color: C.green, fontWeight: "700", fontSize: 12, lineHeight: 20 },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  demoCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: "#E7EDDC",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  arrow: { color: C.green, fontSize: 28 },
  footnote: {
    color: "#899282",
    fontSize: 10,
    lineHeight: 18,
    textAlign: "center",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "#10261CCC",
    justifyContent: "flex-end",
    paddingTop: 48,
  },
  sheet: {
    maxHeight: "100%",
    backgroundColor: C.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },
  sheetHeader: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  close: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E9EDE2",
    borderRadius: 22,
  },
  sheetContent: { padding: 24, paddingTop: 6, gap: 20, paddingBottom: 42 },
  detailArt: {
    height: 140,
    borderRadius: 24,
    padding: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  artSymbol: { fontSize: 80, color: C.green },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    lineHeight: 26,
    color: C.ink,
  },
  button: {
    paddingVertical: 17,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: C.green,
    alignItems: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
    textAlign: "center",
  },
  secondary: { backgroundColor: "#E6ECDD" },
  success: {
    backgroundColor: "#E6EFD9",
    padding: 20,
    borderRadius: 18,
    gap: 8,
  },
  successText: {
    color: C.green,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "800",
  },
  profileHero: { alignItems: "center", gap: 12, paddingVertical: 10 },
  stats: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
  },
  stat: { flex: 1, alignItems: "center", gap: 5 },
  statValue: { fontSize: 22, fontWeight: "800", color: C.ink },
  personRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  quote: { backgroundColor: "#ECEEE3", padding: 20, borderRadius: 18, gap: 14 },
  quoteText: {
    fontSize: 17,
    lineHeight: 26,
    color: C.ink,
    fontStyle: "italic",
  },
  notice: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    gap: 10,
    borderWidth: 1,
    borderColor: C.line,
  },
  review: {
    gap: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: C.line,
  },
  empty: { paddingVertical: 25, gap: 14 },
  communityBanner: {
    backgroundColor: "#E6EDDA",
    borderRadius: 24,
    padding: 22,
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },
});
