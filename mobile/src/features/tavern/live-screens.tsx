import React, { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useTavern } from "./live-store";
import { canContact, profileStats } from "./live-model";
import { Avatar, Body, Button, C, Chip, Empty, Field, go, Icon, Label, Page, ProfileOverview, Reward, s, Status, Title } from "./ui";

export function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, act, busy, refresh } = useTavern();
  const [confirm, setConfirm] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [returnWork, setReturnWork] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [privateAddress, setPrivateAddress] = useState<{ bountyId: string; address: string } | null>(null);
  const b = state.bounties.find((item) => item.id === id);
  const own = b?.publisher === state.currentId;
  const contact = b ? canContact(state, b) : false;
  useEffect(() => {
    let active = true;
    if (!b || (!own && !contact) || !supabase) return;
    const recordId = Number(b.id);
    if (!Number.isSafeInteger(recordId)) return;
    supabase.rpc("get_private_address", { p_bounty_id: recordId }).then(({ data, error }) => {
      if (active) setPrivateAddress({ bountyId: b.id, address: error ? "Private details are unavailable right now." : data || "No meeting details provided yet." });
    });
    return () => { active = false; };
  }, [b, own, contact]);
  if (!b) return <Page back title="Bounty"><Empty title="Bounty unavailable" body="It may have been removed or you may not have access." /></Page>;
  const poster = state.people.find((person) => person.id === b.publisher);
  const mine = state.claims.find((claim) => claim.bountyId === b.id && claim.hunterId === state.currentId);
  const pending = state.claims.filter((claim) => claim.bountyId === b.id && claim.status === "pending");
  const hunter = state.people.find((person) => person.id === b.hunterId);
  const rated = state.ratings.find((item) => item.bountyId === b.id && item.hunterId === b.hunterId);
  return <Page back title="Bounty brief">
    <View style={s.rowBetween}><Label>REXBURG COMMUNITY NOTICE</Label><Reward xp={b.xp} /></View>
    <Status status={!own && mine?.status === "pending" ? "pending" : !own && mine?.status === "rejected" ? "rejected" : b.status} />
    <Title>{b.title}</Title>
    <View style={s.meta}><Icon name="pin" color={C.muted} size={17} /><Body>{b.location}</Body></View>
    <View style={s.inset}><Label>TIME COMMITMENT</Label><Text style={s.sectionTitle}>{b.duration}</Text></View>
    <Label>THE GOOD TO BE DONE</Label><Body>{b.description}</Body>
    <Label>MATERIALS & PREPARATION</Label><Body>{b.bring}</Body>
    {poster && <Pressable accessibilityRole="button" onPress={() => go(`/member?id=${poster.id}`)} style={s.personRow}><Avatar person={poster} /><View style={{ flex: 1 }}><Text style={s.personName}>{poster.name}</Text><Text style={s.small}>Bounty poster</Text></View><Icon name="arrow" color={C.wax} /></Pressable>}
    {own || contact ? <View style={s.card}>
      <Label>MEETING DETAILS · APPROVED PARTICIPANTS</Label>
      <Body>{privateAddress?.bountyId === b.id ? privateAddress.address : "Loading private details…"}</Body>
      {contact && <Button title="Open private conversation" secondary icon="message" onPress={() => go(`/conversation?id=${b.id}`)} />}
    </View> : <View style={s.inset}><Icon name="shield" color={C.muted} /><Body>Exact meeting details unlock after the poster approves a hunter.</Body></View>}
    {!own && b.status === "open" && !mine && (!confirm ? <Button title="Claim bounty" icon="arrow" onPress={() => setConfirm(true)} /> : <View style={s.card}>
      <Text style={s.sectionTitle}>Offer a helping hand?</Text><Body>The poster will review your public profile before choosing a hunter.</Body>
      <Button title="Send claim request" disabled={busy} onPress={async () => { if (await act({ type: "claim", bountyId: b.id })) setConfirm(false); }} />
      <Button title="Not just yet" secondary onPress={() => setConfirm(false)} />
    </View>)}
    {mine?.status === "pending" && <View style={s.inset}><Text style={s.sectionTitle}>Your request is awaiting approval.</Text><Body>The poster will be notified.</Body></View>}
    {mine?.status === "rejected" && <View style={s.inset}><Body>This claim was not selected.</Body><Button title="Find another good deed" secondary onPress={() => router.replace("/")} /></View>}
    {own && b.status === "open" && <>
      <Label>{pending.length} HUNTER REQUEST{pending.length === 1 ? "" : "S"}</Label>
      {pending.map((claim) => {
        const person = state.people.find((item) => item.id === claim.hunterId);
        return <View key={claim.id} style={s.card}>
          <Text style={s.personName}>{person?.name || "Neighbor"}</Text>
          {person && <Body>{profileStats(state, person.id).xp.toLocaleString()} XP · {person.bio}</Body>}
          <Button title="Accept hunter" disabled={busy} onPress={() => { void act({ type: "decide", claimId: claim.id, accept: true }); }} />
          <Button title="Reject request" secondary disabled={busy} onPress={() => { void act({ type: "decide", claimId: claim.id, accept: false }); }} />
        </View>;
      })}
      {!pending.length && <Body>No requests yet. Your bounty is open on the board.</Body>}
    </>}
    {hunter && <View style={s.card}><Label>ASSIGNED HUNTER</Label><Text style={s.personName}>{hunter.name}</Text></View>}
    {b.feedback && b.status === "active" && contact && <View style={s.alert}><Label>POSTER FEEDBACK</Label><Body>{b.feedback}</Body></View>}
    {b.status === "active" && b.hunterId === state.currentId && (!confirm ? <Button title="Request completion review" icon="check" onPress={() => setConfirm(true)} /> : <View style={s.card}>
      <Body>Only the poster can approve completed work and award XP.</Body>
      <Button title="Send completion request" disabled={busy} onPress={async () => { if (await act({ type: "submit", bountyId: b.id })) setConfirm(false); }} />
      <Button title="Keep working" secondary onPress={() => setConfirm(false)} />
    </View>)}
    {b.status === "review" && !own && b.hunterId === state.currentId && <View style={s.inset}><Body>The poster is reviewing your work. Points are pending.</Body></View>}
    {b.status === "review" && own && <View style={s.card}>
      <Label>YOUR DECISION IS NEEDED</Label><Text style={s.sectionTitle}>A deed well done?</Text><Body>Check the finished work before awarding points.</Body>
      <Button title={`Approve · Award ${b.xp} XP`} disabled={busy} onPress={() => { void act({ type: "complete", bountyId: b.id }); }} />
      <Button title="Not Yet · More work needed" secondary onPress={() => setReturnWork(!returnWork)} />
      {returnWork && <><Field label="What still needs attention?" value={feedback} onChangeText={setFeedback} multiline /><Button title="Return to active work" disabled={busy || !feedback.trim()} onPress={async () => { if (await act({ type: "notYet", bountyId: b.id, feedback })) setReturnWork(false); }} /></>}
    </View>}
    {b.status === "completed" && <View style={s.inset}><Icon name="check" size={30} color={C.green} /><Text style={s.sectionTitle}>A good deed, recorded.</Text><Body>{hunter?.name || "The hunter"} earned {b.xp} XP.</Body></View>}
    {b.status === "completed" && own && !rated && <View style={s.card}>
      <Label>OPTIONAL RATING</Label><Text style={s.sectionTitle}>How did your hunter do?</Text>
      <View style={s.wrap}>{[1, 2, 3, 4, 5].map((score) => <Chip key={score} label={`${score} ★`} active={rating === score} onPress={() => setRating(score)} />)}</View>
      <Field label="A few kind words (optional)" value={comment} onChangeText={setComment} multiline maxLength={500} />
      <Button title="Save rating" disabled={busy || !rating} onPress={() => { void act({ type: "rate", bountyId: b.id, score: rating, comment }); }} />
    </View>}
    {rated && <Status status={`Rated ${rated.score} / 5`} />}
    <Button title="Refresh bounty" secondary onPress={() => { void refresh(); }} />
  </Page>;
}

export function CreateScreen() {
  const { act, busy } = useTavern();
  const [form, setForm] = useState({ title: "", description: "", materials: "", estimatedMinutes: "", address: "" });
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState("");
  const update = (field: keyof typeof form, value: string) => setForm((old) => ({ ...old, [field]: value }));
  const minutes = Number(form.estimatedMinutes);
  const valid = form.title.trim().length >= 5 && form.description.trim().length >= 20 && Number.isInteger(minutes) && minutes > 0 && minutes <= 1440;
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Page back title="Post a bounty">
    <Label>A PLACE ON THE BOARD</Label><Title>{preview ? "One last look." : "Ask your neighbors."}</Title>
    <Body>Describe the task clearly. Exact meeting details are visible only to you and your approved hunter.</Body>
    {!!error && <Text accessibilityRole="alert" style={s.errorText}>{error}</Text>}
    {!preview ? <>
      <Field label="Bounty title" value={form.title} onChangeText={(value) => update("title", value)} maxLength={100} />
      <Field label="What needs doing?" value={form.description} onChangeText={(value) => update("description", value)} maxLength={2000} multiline />
      <Field label="Estimated minutes" value={form.estimatedMinutes} onChangeText={(value) => update("estimatedMinutes", value)} keyboardType="number-pad" placeholder="e.g. 90" />
      <Field label="Required / provided materials (optional)" value={form.materials} onChangeText={(value) => update("materials", value)} multiline maxLength={1000} />
      <Field label="Exact meeting details (approved hunter only, optional)" value={form.address} onChangeText={(value) => update("address", value)} multiline maxLength={300} />
      <View style={s.inset}><Body>New bounties currently award 200 XP. The public board shows Rexburg as the general location. Coordinate contact privately in messages after approval.</Body></View>
      <Button title="Preview bounty" icon="arrow" onPress={() => { if (!valid) setError("Use a title of at least 5 characters, a description of at least 20, and a positive estimate up to 1,440 minutes."); else { setError(""); setPreview(true); } }} />
    </> : <>
      <View style={s.noticeCard}><Label>REXBURG · 200 XP</Label><Title>{form.title}</Title><Body>{form.description}</Body><Label>TIME & MATERIALS</Label><Body>{minutes} minutes{"\n"}{form.materials || "No materials listed."}</Body><Label>PRIVATE MEETING DETAILS</Label><Body>{form.address || "Not provided yet."}</Body></View>
      <Button title="Pin to the bounty board" icon="plus" disabled={busy} onPress={async () => { if (await act({ type: "create", title: form.title, description: form.description, materials: form.materials, estimatedMinutes: minutes, address: form.address })) router.replace("/work"); }} />
      <Button title="Edit details" secondary onPress={() => setPreview(false)} />
    </>}
  </Page></KeyboardAvoidingView>;
}

export function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useTavern();
  const person = state.people.find((item) => item.id === id);
  return <Page back title="Community profile">{person ? <ProfileOverview person={person} /> : <Empty title="Profile unavailable" body="This profile could not be found." />}</Page>;
}

export function NotificationsScreen() {
  const { state, act, refresh } = useTavern();
  const list = state.notices.filter((notice) => notice.recipient === state.currentId);
  return <Page back title="Notifications">
    <Label>NEWS FROM THE NOTICEBOARD</Label><Title>A little news{"\n"}from your neighbors.</Title>
    <Button title="Refresh" secondary onPress={() => { void refresh(); }} />
    {list.map((notice) => <Pressable key={notice.id} accessibilityRole="button" onPress={async () => { if (await act({ type: "read", id: notice.id }) && notice.bountyId) go(`/bounty/${notice.bountyId}`); }} style={[s.card, !notice.read && { borderLeftWidth: 4, borderLeftColor: C.wax }]}>
      <View style={s.rowBetween}><Label>{notice.read ? "READ" : "NEW UPDATE"}</Label><Text style={s.caption}>{new Date(notice.time).toLocaleDateString()}</Text></View>
      <Text style={s.sectionTitle}>{notice.title}</Text><Body>{notice.body}</Body>
    </Pressable>)}
    {!list.length && <Empty title="All quiet at the inn" body="Claim and completion updates will appear here." />}
  </Page>;
}

export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, act, busy, refresh } = useTavern();
  const [text, setText] = useState("");
  const bounty = state.bounties.find((item) => item.id === id);
  if (!bounty || !canContact(state, bounty)) return <Page back title="Messages"><Empty title="This conversation is locked" body="Only the poster and approved hunter can access it." /></Page>;
  const other = state.people.find((person) => person.id === (state.currentId === bounty.publisher ? bounty.hunterId : bounty.publisher));
  const messages = state.messages.filter((message) => message.bountyId === id);
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><Page back title={other?.name || "Messages"}>
    <View style={s.inset}><Label>CONVERSATION ABOUT</Label><Text style={s.sectionTitle}>{bounty.title}</Text><Status status={bounty.status} /></View>
    <Button title="Refresh messages" secondary onPress={() => { void refresh(); }} />
    {!messages.length && <Empty title="Pull up a chair" body="Say hello and coordinate your good deed." />}
    {messages.map((message) => <View key={message.id} style={[s.message, message.sender === state.currentId && s.messageOwn]}><Label>{state.people.find((person) => person.id === message.sender)?.name || "Neighbor"}</Label><Body>{message.text}</Body><Text style={s.caption}>{new Date(message.time).toLocaleTimeString()}</Text></View>)}
    <Field label="Your message" value={text} onChangeText={setText} multiline maxLength={2000} />
    <Button title="Send message" icon="arrow" disabled={busy || !text.trim()} onPress={async () => { if (await act({ type: "message", bountyId: bounty.id, text })) setText(""); }} />
  </Page></KeyboardAvoidingView>;
}
