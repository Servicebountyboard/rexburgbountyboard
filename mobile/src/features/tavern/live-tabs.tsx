import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTavern } from "./live-store";
import { canContact, profileStats } from "./live-model";
import { Avatar, Body, BountyCard, Button, C, Chip, Empty, Field, go, Icon, Label, Lantern, Page, ProfileOverview, ResponsiveCards, s, Status, Title } from "./ui";

export function BoardScreen() {
  const { state, refresh } = useTavern();
  const [query, setQuery] = useState("");
  const me = state.people.find((person) => person.id === state.currentId);
  const list = state.bounties.filter((bounty) => bounty.status === "open" && `${bounty.title} ${bounty.description}`.toLowerCase().includes(query.toLowerCase()));
  return <Page>
    <View style={s.hero}>
      <Text style={s.heroLabel}>THE TAVERN NOTICEBOARD · REXBURG, ID</Text>
      <View style={s.heroTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.heroTitle}>Good deeds{"\n"}belong here.</Text>
          <Text style={[s.heroText, { marginTop: 12 }]}>Pull up a chair. Lend a hand.{"\n"}Your next chapter starts nearby.</Text>
        </View>
        <Lantern />
      </View>
      <View style={s.heroBottom}>
        <Text style={s.heroText}>{me ? `Welcome, ${me.name}` : "Welcome, neighbor"}</Text>
        <Text style={s.heroNumber}>{me ? `${profileStats(state, me.id).xp.toLocaleString()} XP` : "RBB"}</Text>
      </View>
    </View>
    <View style={s.rowBetween}>
      <View><Label>PINNED BY YOUR NEIGHBORS</Label><Text style={[s.sectionTitle, { marginTop: 7 }]}>The bounty board</Text></View>
      <Pressable accessibilityRole="button" accessibilityLabel="Post a bounty" onPress={() => go("/create")} style={s.iconButton}><Icon name="plus" color={C.wax} /></Pressable>
    </View>
    <Field label="Find a good deed" value={query} onChangeText={setQuery} placeholder="Search bounties" />
    <View style={s.rowBetween}><Label>{list.length} OPEN BOUNTIES</Label><Button title="Refresh" secondary onPress={() => { void refresh(); }} /></View>
    <ResponsiveCards>{list.map((bounty) => <BountyCard key={bounty.id} b={bounty} />)}</ResponsiveCards>
    {!list.length && <Empty title="A quiet corner of the board" body="No matching open bounties yet." />}
    <Button title="Post a bounty" icon="plus" onPress={() => go("/create")} />
  </Page>;
}

export function PeopleScreen() {
  const { state, refresh } = useTavern();
  const [query, setQuery] = useState("");
  const list = state.people.filter((person) => person.name.toLowerCase().includes(query.toLowerCase()));
  return <Page title="People">
    <Label>THE PEOPLE BEHIND THE GOOD</Label><Title>Good deeds.{"\n"}Good company.</Title>
    <Body>Meet neighbors on the board. Public profiles show usernames, biographies, points, and ratings.</Body>
    <Field label="Find a neighbor" value={query} onChangeText={setQuery} placeholder="Search usernames" />
    <Button title="Refresh" secondary onPress={() => { void refresh(); }} />
    <ResponsiveCards>{list.map((person) => <Pressable key={person.id} accessibilityRole="button" style={s.card} onPress={() => go(`/member?id=${person.id}`)}>
      <View style={s.personRow}><Avatar person={person} /><View style={{ flex: 1 }}><Text style={s.personName}>{person.name}{person.id === state.currentId ? " · You" : ""}</Text><Text style={s.small}>{person.xp.toLocaleString()} XP</Text></View><Icon name="arrow" color={C.wax} /></View>
      <Body>{person.bio}</Body>
    </Pressable>)}</ResponsiveCards>
    {!list.length && <Empty title="No neighbors found" body="Try a different username." />}
  </Page>;
}

export function WorkScreen() {
  const { state, refresh } = useTavern();
  const [mode, setMode] = useState<"Hunting" | "Posting">("Hunting");
  const [filter, setFilter] = useState<"Current" | "History">("Current");
  const myClaims = state.claims.filter((claim) => claim.hunterId === state.currentId);
  const list = state.bounties.filter((bounty) => {
    const involved = mode === "Posting" ? bounty.publisher === state.currentId : myClaims.some((claim) => claim.bountyId === bounty.id);
    const history = ["completed", "cancelled", "closed"].includes(bounty.status) || (mode === "Hunting" && myClaims.some((claim) => claim.bountyId === bounty.id && ["rejected", "cancelled"].includes(claim.status)));
    return involved && (filter === "History" ? history : !history);
  });
  return <Page title="My work">
    <Label>YOUR COMMUNITY LEDGER</Label><Title>Every deed{"\n"}has a story.</Title>
    <View style={s.wrap}>{(["Hunting", "Posting"] as const).map((value) => <Chip key={value} label={value} active={mode === value} onPress={() => setMode(value)} />)}</View>
    <View style={s.wrap}>{(["Current", "History"] as const).map((value) => <Chip key={value} label={value} active={filter === value} onPress={() => setFilter(value)} />)}</View>
    <Button title="Refresh" secondary onPress={() => { void refresh(); }} />
    {list.map((bounty) => {
      const claim = myClaims.find((item) => item.bountyId === bounty.id);
      const pending = state.claims.filter((item) => item.bountyId === bounty.id && item.status === "pending").length;
      return <Pressable key={bounty.id} accessibilityRole="button" onPress={() => go(`/bounty/${bounty.id}`)} style={s.card}>
        <View style={s.rowBetween}><Status status={mode === "Hunting" && claim?.status !== "accepted" ? claim?.status || bounty.status : bounty.status} /><Text style={s.link}>{bounty.xp} XP</Text></View>
        <Text style={s.cardTitle}>{bounty.title}</Text>
        <Body>{mode === "Posting" && pending ? `${pending} claim request${pending === 1 ? "" : "s"} to review` : bounty.status === "review" ? "Completion review is needed." : bounty.description}</Body>
      </Pressable>;
    })}
    {!list.length && <Empty title="Nothing on the ledger yet" body="Find a bounty or post one to begin." action={() => router.replace("/")} />}
    {mode === "Posting" && <Button title="Post a new bounty" icon="plus" onPress={() => go("/create")} />}
  </Page>;
}

export function MessagesScreen() {
  const { state, refresh } = useTavern();
  const list = state.bounties.filter((bounty) => canContact(state, bounty));
  return <Page title="Messages">
    <Label>AROUND THE COMMON TABLE</Label><Title>Conversations.</Title>
    <Body>Messages unlock when a poster accepts a hunter.</Body>
    <Button title="Refresh" secondary onPress={() => { void refresh(); }} />
    {list.map((bounty) => {
      const other = state.people.find((person) => person.id === (bounty.publisher === state.currentId ? bounty.hunterId : bounty.publisher));
      const last = state.messages.filter((message) => message.bountyId === bounty.id).at(-1);
      return <Pressable key={bounty.id} accessibilityRole="button" onPress={() => go(`/conversation?id=${bounty.id}`)} style={s.card}>
        <Text style={s.personName}>{other?.name || "Neighbor"}</Text><Text style={s.small}>{bounty.title}</Text><Body>{last?.text || "Start a conversation about this bounty."}</Body>
      </Pressable>;
    })}
    {!list.length && <Empty title="The table is quiet for now" body="An approved claim opens a private conversation." />}
  </Page>;
}

export function ProfileScreen() {
  const { state, refresh } = useTavern();
  const me = state.people.find((person) => person.id === state.currentId);
  const [busy, setBusy] = useState(false);
  const [signoutError, setSignoutError] = useState("");
  return <Page title="Your profile">
    {me ? <ProfileOverview person={me} /> : <Empty title="Profile unavailable" body="Your account is signed in, but its profile could not be loaded. Please refresh or contact the project owner." />}
    <Button title="Refresh profile" secondary onPress={() => { void refresh(); }} />
    {!!signoutError && <Text accessibilityRole="alert" style={s.errorText}>{signoutError}</Text>}
    <Button title={busy ? "Signing out…" : "Sign out"} secondary disabled={busy} onPress={async () => {
      if (!supabase) return;
      setBusy(true); setSignoutError("");
      const { error } = await supabase.auth.signOut();
      setBusy(false);
      if (error) setSignoutError(error.message);
      else router.replace("/account");
    }} />
  </Page>;
}
