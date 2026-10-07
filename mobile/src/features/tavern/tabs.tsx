import React, { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTavern } from "./store";
import { canContact, profileStats } from "./model";
import {
  Avatar,
  Body,
  BountyCard,
  Button,
  C,
  Chip,
  Empty,
  Field,
  go,
  Icon,
  Label,
  Lantern,
  Page,
  ProfileOverview,
  ResponsiveCards,
  s,
  Status,
  Title,
} from "./ui";

export function BoardScreen() {
  const { state } = useTavern();
  const [query, setQuery] = useState(""),
    [category, setCategory] = useState("All");
  const me = state.people.find((p) => p.id === state.currentId);
  const list = state.bounties.filter(
    (b) =>
      b.status === "open" &&
      (category === "All" || b.category === category) &&
      `${b.title} ${b.location}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <Page>
      <View style={s.hero}>
        <Text style={s.heroLabel}>THE TAVERN NOTICEBOARD · REXBURG, ID</Text>
        <View style={s.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroTitle}>Good deeds{"\n"}belong here.</Text>
            <Text style={[s.heroText, { marginTop: 12 }]}>
              Pull up a chair. Lend a hand.{"\n"}Your next chapter starts
              nearby.
            </Text>
          </View>
          <Lantern />
        </View>
        <View style={s.heroBottom}>
          <Text style={s.heroText}>
            {me
              ? `Welcome back, ${me.name.split(" ")[0]}`
              : "A place for every neighbor"}
          </Text>
          <Text style={s.heroNumber}>
            {me
              ? `${profileStats(state, me.id).xp.toLocaleString()} XP`
              : "RBB"}
          </Text>
        </View>
      </View>
      <View style={s.rowBetween}>
        <View>
          <Label>PINNED BY YOUR NEIGHBORS</Label>
          <Text style={[s.sectionTitle, { marginTop: 7 }]}>
            The bounty board
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => go("/create")}
          style={s.iconButton}
        >
          <Icon name="plus" color={C.wax} />
          <Text style={s.caption}>Post</Text>
        </Pressable>
      </View>
      <Field
        label="Find a good deed"
        value={query}
        onChangeText={setQuery}
        placeholder="Search bounties or places"
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8 }}
      >
        {["All", "Outdoors", "Community", "Education"].map((c) => (
          <Chip
            key={c}
            label={c}
            active={category === c}
            onPress={() => setCategory(c)}
          />
        ))}
      </ScrollView>
      <View style={s.rowBetween}>
        <Label>
          {list.length} OPEN {list.length === 1 ? "BOUNTY" : "BOUNTIES"}
        </Label>
        <Text style={s.caption}>Local demo opportunities</Text>
      </View>
      <ResponsiveCards>
        {list.map((b) => (
          <BountyCard key={b.id} b={b} />
        ))}
      </ResponsiveCards>
      {!list.length && (
        <Empty
          title="A quiet corner of the board"
          body="Try another category or clear your search."
          action={() => {
            setCategory("All");
            setQuery("");
          }}
        />
      )}
      <View style={s.inset}>
        <Icon name="heart" color={C.wax} />
        <Text style={s.sectionTitle}>A little time. A lasting difference.</Text>
        <Body>
          Choose a bounty, request a claim, and wait for the poster’s approval.
          Good work earns points after it’s confirmed.
        </Body>
        <Button
          title="Post a bounty"
          secondary
          icon="plus"
          onPress={() => go("/create")}
        />
      </View>
      <Text style={s.caption}>
        Community prototype · Sample people, places, and XP.{"\n"}Demo progress
        is saved on this device.
      </Text>
    </Page>
  );
}
export function PeopleScreen() {
  const { state } = useTavern();
  const [q, setQ] = useState("");
  const list = state.people.filter((p) =>
    `${p.name} ${p.skills.join(" ")}`.toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <Page title="People">
      <Label>THE PEOPLE BEHIND THE GOOD</Label>
      <Title>Good deeds.{"\n"}Good company.</Title>
      <Body>Get to know the neighbors who make Rexburg feel like home.</Body>
      <Field
        label="Find a neighbor"
        value={q}
        onChangeText={setQ}
        placeholder="Name or a helpful skill"
      />
      <ResponsiveCards>
        {list.map((p) => (
          <Pressable
            accessibilityRole="button"
            key={p.id}
            style={s.card}
            onPress={() => go(`/member?id=${p.id}`)}
          >
            <View style={s.personRow}>
              <Avatar person={p} />
              <View style={{ flex: 1 }}>
                <Text style={s.personName}>
                  {p.name}
                  {p.id === state.currentId ? " · You" : ""}
                </Text>
                <Text style={s.small}>{p.role}</Text>
              </View>
              <Icon name="arrow" color={C.wax} />
            </View>
            <Body>{p.bio}</Body>
            <View style={s.wrap}>
              {p.skills.map((x) => (
                <Status key={x} status={x} />
              ))}
            </View>
            <View style={s.cardFooter}>
              <Text style={s.small}>
                {profileStats(state, p.id).completed} good deeds
              </Text>
              <Text style={s.link}>
                {profileStats(state, p.id).xp.toLocaleString()} XP
              </Text>
            </View>
          </Pressable>
        ))}
      </ResponsiveCards>
      {!list.length && (
        <Empty
          title="No neighbors found"
          body="Try a different name or skill."
        />
      )}
    </Page>
  );
}
export function WorkScreen() {
  const params = useLocalSearchParams<{ mode: string; created: string }>();
  return (
    <WorkLedger key={params.created || "initial"} initialMode={params.mode} />
  );
}
function WorkLedger({ initialMode }: { initialMode?: string }) {
  const { state } = useTavern();
  const [mode, setMode] = useState(
      initialMode === "Posting" ? "Posting" : "Hunting",
    ),
    [filter, setFilter] = useState("Current");

  const myClaims = state.claims.filter((c) => c.hunterId === state.currentId);
  const list = state.bounties.filter(
    (b) =>
      (mode === "Posting"
        ? b.publisher === state.currentId
        : myClaims.some((c) => c.bountyId === b.id)) &&
      (filter === "History"
        ? b.status === "completed" ||
          (mode === "Hunting" &&
            myClaims.some(
              (c) => c.bountyId === b.id && c.status === "rejected",
            ))
        : b.status !== "completed" &&
          !(
            mode === "Hunting" &&
            myClaims.some((c) => c.bountyId === b.id && c.status === "rejected")
          )),
  );
  return (
    <Page title="My work">
      <Label>YOUR COMMUNITY LEDGER</Label>
      <Title>Every deed{"\n"}has a story.</Title>
      <View style={s.segmented}>
        {["Hunting", "Posting"].map((v) => (
          <Chip
            key={v}
            label={v}
            active={mode === v}
            onPress={() => setMode(v)}
          />
        ))}
      </View>
      <View style={s.wrap}>
        {["Current", "History"].map((v) => (
          <Chip
            key={v}
            label={v}
            active={filter === v}
            onPress={() => setFilter(v)}
          />
        ))}
      </View>
      <Body>
        {mode === "Hunting"
          ? "Your requests, assignments, and completed good deeds."
          : "Your posted bounties, incoming claims, and completion reviews."}
      </Body>
      {list.map((b) => {
        const claim = myClaims.find((c) => c.bountyId === b.id);
        const pending = state.claims.filter(
          (c) => c.bountyId === b.id && c.status === "pending",
        ).length;
        return (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            onPress={() => go(`/bounty/${b.id}`)}
            style={s.card}
          >
            <View style={s.rowBetween}>
              <Status
                status={
                  mode === "Hunting" && claim?.status === "pending"
                    ? "pending"
                    : mode === "Hunting" && claim?.status === "rejected"
                      ? "rejected"
                      : b.status
                }
              />
              <Text style={s.link}>{b.xp} XP</Text>
            </View>
            <Text style={s.cardTitle}>{b.title}</Text>
            <Body>
              {b.status === "review"
                ? mode === "Posting"
                  ? "Your decision is needed. Review the finished work."
                  : "The poster is reviewing your completion request."
                : mode === "Posting" && pending
                  ? `${pending} hunter request${pending === 1 ? "" : "s"} to review`
                  : b.status === "active"
                    ? "Approved and ready to make a difference."
                    : b.status === "completed"
                      ? "Completed and recorded in the ledger."
                      : "Waiting for a good match."}
            </Body>
            <View style={s.rowBetween}>
              <Text style={s.small}>
                {b.duration} · {b.location}
              </Text>
              <Icon name="arrow" color={C.wax} />
            </View>
          </Pressable>
        );
      })}
      {!list.length && (
        <Empty
          title={
            filter === "History"
              ? "Your story is still being written."
              : "Nothing on the ledger yet."
          }
          body={
            mode === "Posting"
              ? "Post a bounty and invite a neighbor to help."
              : "Claim a bounty and follow its progress here."
          }
          action={() => router.replace("/")}
        />
      )}
      {mode === "Posting" && (
        <Button
          title="Post a new bounty"
          icon="plus"
          onPress={() => go("/create")}
        />
      )}
    </Page>
  );
}
export function MessagesScreen() {
  const { state } = useTavern();
  const list = state.bounties.filter((b) => canContact(state, b));
  return (
    <Page title="Messages">
      <Label>AROUND THE COMMON TABLE</Label>
      <Title>A good deed starts{"\n"}with a conversation.</Title>
      <Body>
        Coordinate with your poster or approved hunter. Messages stay inside
        this local demo.
      </Body>
      {list.map((b) => {
        const other = state.people.find(
          (p) =>
            p.id ===
            (b.publisher === state.currentId ? b.hunterId : b.publisher),
        )!;
        const last = state.messages.filter((m) => m.bountyId === b.id).at(-1);
        return (
          <Pressable
            key={b.id}
            accessibilityRole="button"
            onPress={() => go(`/conversation?id=${b.id}`)}
            style={s.card}
          >
            <View style={s.personRow}>
              <Avatar person={other} />
              <View style={{ flex: 1 }}>
                <Text style={s.personName}>{other.name}</Text>
                <Text style={s.small}>{b.title}</Text>
              </View>
              <Icon name="arrow" color={C.wax} />
            </View>
            <Text numberOfLines={2} style={s.body}>
              {last ? last.text : "Start a conversation about this bounty."}
            </Text>
          </Pressable>
        );
      })}
      {!list.length && (
        <Empty
          title="The table is quiet for now."
          body="Conversations unlock when a poster approves a hunter. Find a bounty or review an incoming claim."
          action={() => router.replace("/")}
        />
      )}
    </Page>
  );
}
export function ProfileScreen() {
  const { state, act } = useTavern();
  const me = state.people.find((p) => p.id === state.currentId);
  const [reset, setReset] = useState(false);
  return (
    <Page title="Your profile">
      {me ? (
        <>
          <ProfileOverview person={me} />
          <Button
            title="Preview account screens"
            secondary
            onPress={() => go("/account")}
          />
          {!me.verified && (
            <Button
              title="Finish demo verification"
              onPress={() => go("/demo-accounts?mode=verify")}
            />
          )}
          <View style={s.card}>
            <Label>THE DEMO TABLE</Label>
            <Text style={s.sectionTitle}>Try the other side.</Text>
            <Body>
              Switch to a sample neighbor to review claims, approve work, or
              reply to messages. This is a local demonstration, not real
              authentication.
            </Body>
            {state.people.map((p) => (
              <Pressable
                key={p.id}
                accessibilityRole="button"
                accessibilityState={{ selected: p.id === state.currentId }}
                onPress={() => {
                  act({ type: "switch", id: p.id });
                  router.replace("/profile");
                }}
                style={[s.personRow, { paddingVertical: 8 }]}
              >
                <Avatar person={p} />
                <View style={{ flex: 1 }}>
                  <Text style={s.personName}>{p.name}</Text>
                  <Text style={s.small}>
                    {p.id === state.currentId ? "Current demo account" : p.role}
                  </Text>
                </View>
                {p.id === state.currentId ? (
                  <Icon name="check" color={C.green} />
                ) : (
                  <Icon name="arrow" color={C.muted} />
                )}
              </Pressable>
            ))}
          </View>
          <Button
            title="Sign out of demo"
            secondary
            icon="logout"
            onPress={() => {
              go("/account?mode=signout");
            }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => setReset(!reset)}
            style={{ padding: 12 }}
          >
            <Text style={s.caption}>Reset local demo data</Text>
          </Pressable>
          {reset && (
            <View style={s.alert}>
              <Body>
                This removes local demo posts, messages, claims, and rewards and
                restores the sample accounts.
              </Body>
              <Button
                title="Confirm reset"
                onPress={() => {
                  act({ type: "reset" });
                  setReset(false);
                  router.replace("/");
                }}
              />
              <Button
                title="Keep my progress"
                secondary
                onPress={() => setReset(false)}
              />
            </View>
          )}
        </>
      ) : (
        <>
          <Title>There’s a place{"\n"}for you here.</Title>
          <Body>Choose a demo account or try the sign-up flow.</Body>
          <Button title="Enter the tavern" onPress={() => go("/account")} />
        </>
      )}
    </Page>
  );
}
