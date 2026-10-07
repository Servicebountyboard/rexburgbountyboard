import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTavern } from "./store";
import { canContact, passwordError, profileStats } from "./model";
import {
  Avatar,
  Body,
  Button,
  C,
  Chip,
  Empty,
  Field,
  go,
  Icon,
  Label,
  Page,
  ProfileOverview,
  Reward,
  s,
  Status,
  Title,
} from "./ui";

export function DetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, act } = useTavern();
  const [confirm, setConfirm] = useState(false),
    [feedback, setFeedback] = useState(""),
    [returnWork, setReturnWork] = useState(false),
    [rating, setRating] = useState(0),
    [comment, setComment] = useState("");
  const b = state.bounties.find((b) => b.id === id);
  if (!b)
    return (
      <Page back title="Bounty">
        <Empty
          title="This notice is missing."
          body="It may have been removed when the demo was reset."
          action={() => router.replace("/")}
        />
      </Page>
    );
  const poster = state.people.find((p) => p.id === b.publisher)!;
  const own = b.publisher === state.currentId;
  const mine = state.claims.find(
    (c) => c.bountyId === id && c.hunterId === state.currentId,
  );
  const pending = state.claims.filter(
    (c) => c.bountyId === id && c.status === "pending",
  );
  const hunter = state.people.find((p) => p.id === b.hunterId);
  const contact = canContact(state, b);
  const rated = state.ratings.find((r) => r.bountyId === id);
  return (
    <Page back title="Bounty brief">
      <View style={s.rowBetween}>
        <Label>{b.category} · COMMUNITY NOTICE</Label>
        <Reward xp={b.xp} />
      </View>
      <Status
        status={
          !own && mine?.status === "pending"
            ? "pending"
            : !own && mine?.status === "rejected"
              ? "rejected"
              : b.status
        }
      />
      <Title>{b.title}</Title>
      <View style={s.meta}>
        <Icon name="pin" color={C.muted} size={17} />
        <Body>{b.location}</Body>
      </View>
      <View style={s.inset}>
        <View style={s.rowBetween}>
          <View>
            <Label>TIME COMMITMENT</Label>
            <Text style={[s.sectionTitle, { marginTop: 8 }]}>{b.duration}</Text>
          </View>
          <View>
            <Label>WHEN</Label>
            <Text style={[s.small, { marginTop: 8 }]}>{b.when}</Text>
          </View>
        </View>
      </View>
      <Label>THE GOOD TO BE DONE</Label>
      <Body>{b.description}</Body>
      <Label>MATERIALS & PREPARATION</Label>
      <Body>{b.bring}</Body>
      <Pressable
        accessibilityRole="button"
        onPress={() => go(`/member?id=${poster.id}`)}
        style={s.personRow}
      >
        <Avatar person={poster} />
        <View style={{ flex: 1 }}>
          <Label>POSTED BY</Label>
          <Text style={[s.personName, { marginTop: 5 }]}>{poster.name}</Text>
        </View>
        <Icon name="arrow" color={C.wax} />
      </Pressable>
      {contact || own ? (
        <View style={s.card}>
          <Label>MEETING DETAILS · APPROVED PARTICIPANTS</Label>
          <Body>{b.address}</Body>
          <Text selectable style={s.link}>
            {b.contact}
          </Text>
          {contact && (
            <Button
              title={`Message ${own ? hunter?.name.split(" ")[0] : poster.name.split(" ")[0]}`}
              secondary
              icon="message"
              onPress={() => go(`/conversation?id=${b.id}`)}
            />
          )}
        </View>
      ) : (
        <View style={s.inset}>
          <Icon name="shield" color={C.muted} />
          <Body>
            Exact meeting details and contact information unlock after the
            poster approves you.
          </Body>
        </View>
      )}
      {!own &&
        b.status === "open" &&
        !mine &&
        (!confirm ? (
          <>
            <Body>
              Claiming sends your profile to {poster.name.split(" ")[0]}. Wait
              for approval before starting work.
            </Body>
            <Button
              title="Claim bounty"
              icon="arrow"
              onPress={() => setConfirm(true)}
            />
          </>
        ) : (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Offer a helping hand?</Text>
            <Body>
              The poster will see your name, avatar, score, and demo reputation.
              This is a request, not an assignment.
            </Body>
            <Button
              title="Send claim request"
              onPress={() => {
                if (act({ type: "claim", bountyId: b.id })) setConfirm(false);
              }}
            />
            <Button
              title="Not just yet"
              secondary
              onPress={() => setConfirm(false)}
            />
          </View>
        ))}
      {mine?.status === "pending" && (
        <View style={s.inset}>
          <Text style={s.sectionTitle}>Your offer is on its way.</Text>
          <Body>
            {poster.name.split(" ")[0]} received a demo notification. You’ll be
            notified when they decide.
          </Body>
          <Button
            title={`Demo: review as ${poster.name.split(" ")[0]}`}
            secondary
            onPress={() => {
              act({ type: "switch", id: poster.id });
              setConfirm(false);
            }}
          />
        </View>
      )}
      {mine?.status === "rejected" && (
        <View style={s.inset}>
          <Body>
            This claim wasn’t selected. Your other opportunities are still
            waiting on the board.
          </Body>
          <Button
            title="Find another good deed"
            secondary
            onPress={() => router.replace("/")}
          />
        </View>
      )}
      {own && b.status === "open" && (
        <>
          <Label>
            {pending.length} HUNTER{" "}
            {pending.length === 1 ? "REQUEST" : "REQUESTS"}
          </Label>
          {pending.map((c) => {
            const p = state.people.find((p) => p.id === c.hunterId)!;
            const stats = profileStats(state, p.id);
            return (
              <View key={c.id} style={s.card}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => go(`/member?id=${p.id}`)}
                  style={s.personRow}
                >
                  <Avatar person={p} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.personName}>{p.name}</Text>
                    <Text style={s.small}>
                      {stats.xp} XP · {stats.completed} completed ·{" "}
                      {stats.rating} rating
                    </Text>
                  </View>
                  <Icon name="arrow" />
                </Pressable>
                <Body>{p.bio}</Body>
                <Button
                  title={`Accept ${p.name.split(" ")[0]}`}
                  onPress={() =>
                    act({ type: "decide", claimId: c.id, accept: true })
                  }
                />
                <Button
                  title="Reject request"
                  secondary
                  onPress={() =>
                    act({ type: "decide", claimId: c.id, accept: false })
                  }
                />
              </View>
            );
          })}
          {!pending.length && (
            <Body>No requests yet. Your bounty is open on the board.</Body>
          )}
        </>
      )}
      {hunter && (
        <View style={s.card}>
          <Label>ASSIGNED HUNTER</Label>
          <Pressable
            accessibilityRole="button"
            onPress={() => go(`/member?id=${hunter.id}`)}
            style={s.personRow}
          >
            <Avatar person={hunter} />
            <View style={{ flex: 1 }}>
              <Text style={s.personName}>{hunter.name}</Text>
              <Text style={s.small}>
                {profileStats(state, hunter.id).completed} completed good deeds
              </Text>
            </View>
            <Icon name="arrow" />
          </Pressable>
          {["Claim approved", "Work in progress", "Completion reviewed"].map(
            (label, i) => (
              <View style={s.step} key={label}>
                <View
                  style={[
                    s.stepCircle,
                    (i < 2 || b.status === "completed") && {
                      backgroundColor: C.green,
                      borderColor: C.green,
                    },
                  ]}
                >
                  {i < 2 || b.status === "completed" ? (
                    <Icon name="check" size={14} color={C.paper} />
                  ) : (
                    <Text style={s.caption}>3</Text>
                  )}
                </View>
                <Text style={s.body}>{label}</Text>
              </View>
            ),
          )}
        </View>
      )}
      {own && hunter && b.status === "active" && <Button title={`Demo: continue as ${hunter.name.split(" ")[0]}`} secondary onPress={() => act({ type: "switch", id: hunter.id })} />}
      {b.feedback && b.status === "active" && contact && (
        <View style={s.alert}>
          <Label>POSTER FEEDBACK</Label>
          <Body>{b.feedback}</Body>
        </View>
      )}
      {b.status === "active" &&
        b.hunterId === state.currentId &&
        (!confirm ? (
          <Button
            title="Complete bounty · request review"
            icon="check"
            onPress={() => setConfirm(true)}
          />
        ) : (
          <View style={s.card}>
            <Text style={s.sectionTitle}>Ready for a final look?</Text>
            <Body>
              Confirm you’ve completed the listed work. Points are awarded after
              the poster approves.
            </Body>
            <Button
              title="Send completion request"
              onPress={() => {
                if (act({ type: "submit", bountyId: b.id })) setConfirm(false);
              }}
            />
            <Button
              title="Keep working"
              secondary
              onPress={() => setConfirm(false)}
            />
          </View>
        ))}
      {b.status === "review" && !own && b.hunterId === state.currentId && (
        <View style={s.inset}>
          <Text style={s.sectionTitle}>A deed awaiting its seal.</Text>
          <Body>
            The poster is reviewing your work. Your points are pending.
          </Body>
          <Button
            title={`Demo: review as ${poster.name.split(" ")[0]}`}
            secondary
            onPress={() => act({ type: "switch", id: poster.id })}
          />
        </View>
      )}
      {b.status === "review" && own && (
        <View style={s.card}>
          <Label>YOUR DECISION IS NEEDED</Label>
          <Text style={s.sectionTitle}>A deed well done?</Text>
          <Body>
            {hunter?.name} requested completion. Check the work against the
            original task before approving.
          </Body>
          <Button
            title={`Complete · Award ${b.xp} XP`}
            icon="check"
            onPress={() => act({ type: "complete", bountyId: b.id })}
          />
          <Button
            title="Not Yet · More work needed"
            secondary
            onPress={() => setReturnWork(!returnWork)}
          />
          {returnWork && (
            <>
              <Field
                label="What still needs attention?"
                multiline
                value={feedback}
                onChangeText={setFeedback}
                placeholder="Give the hunter a clear next step."
              />
              <Button
                title="Return to active work"
                disabled={!feedback.trim()}
                onPress={() => {
                  if (act({ type: "notYet", bountyId: b.id, feedback }))
                    setReturnWork(false);
                }}
              />
            </>
          )}
        </View>
      )}
      {b.status === "completed" && (
        <View style={s.inset}>
          <Icon name="check" size={30} color={C.green} />
          <Text style={s.sectionTitle}>A good deed, recorded.</Text>
          <Body>
            {hunter?.name} earned {b.xp} XP. This bounty is now in completed
            history.
          </Body>
        </View>
      )}
      {b.status === "completed" && own && !rated && (
        <View style={s.card}>
          <Label>OPTIONAL · SAMPLE FIVE-STAR SCALE</Label>
          <Text style={s.sectionTitle}>How did your hunter do?</Text>
          <View style={s.wrap}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Chip
                key={n}
                label={`${n} ★`}
                active={rating === n}
                onPress={() => setRating(n)}
              />
            ))}
          </View>
          <Field
            label="A few kind words (optional)"
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            multiline
          />
          <Button
            title="Save rating"
            disabled={!rating}
            onPress={() =>
              act({ type: "rate", bountyId: b.id, score: rating, comment })
            }
          />
          <Button
            title="Skip for now"
            secondary
            onPress={() => router.back()}
          />
        </View>
      )}
      {rated && <Status status={`Rated ${rated.score} / 5 · Thank you`} />}
      <Text style={s.caption}>
        Local prototype · XP and rating rules are sample values.
      </Text>
    </Page>
  );
}

export function CreateScreen() {
  const { state, act } = useTavern();
  const me = state.people.find((p) => p.id === state.currentId);
  const [form, setForm] = useState({
    title: "",
    description: "",
    duration: "",
    materials: "",
    location: "",
    address: "",
    contact: me?.email || "",
    category: "Community",
  });
  const [preview, setPreview] = useState(false),
    [error, setError] = useState("");
  const update = (k: keyof typeof form, v: string) =>
    setForm({ ...form, [k]: v });
  function review() {
    if (Object.values(form).some((x) => !x.trim())) {
      setError("Complete each field so your hunter knows what to expect.");
      return;
    }
    if (form.title.trim().length < 5 || form.description.trim().length < 20) {
      setError(
        "Use at least 5 characters for the title and 20 for the description.",
      );
      return;
    }
    setError("");
    setPreview(true);
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page back title="Post a bounty">
        <Label>A PLACE ON THE BOARD</Label>
        <Title>{preview ? "One last look." : "Ask your neighbors."}</Title>
        <Body>
          {preview
            ? "Check the details before pinning your notice."
            : "Clear details make it easier for the right person to lend a hand."}
        </Body>
        {error && (
          <Text accessibilityRole="alert" style={s.errorText}>
            {error}
          </Text>
        )}
        {!preview ? (
          <>
            <Field
              label="Bounty title"
              value={form.title}
              onChangeText={(v) => update("title", v)}
              placeholder="A helping hand with…"
              maxLength={100}
            />
            <Field
              label="What needs doing?"
              value={form.description}
              onChangeText={(v) => update("description", v)}
              placeholder="Describe the task and what finished looks like."
              multiline
              maxLength={2000}
            />
            <Label>CATEGORY</Label>
            <View style={s.wrap}>
              {["Community", "Outdoors", "Education"].map((v) => (
                <Chip
                  key={v}
                  label={v}
                  active={v === form.category}
                  onPress={() => update("category", v)}
                />
              ))}
            </View>
            <Field
              label="Estimated time"
              value={form.duration}
              onChangeText={(v) => update("duration", v)}
              placeholder="e.g. 2 hours"
              maxLength={60}
            />
            <Field
              label="Required / provided materials"
              value={form.materials}
              onChangeText={(v) => update("materials", v)}
              placeholder="Bring gloves. Tools provided."
              multiline
              maxLength={1000}
            />
            <Field
              label="Public location"
              value={form.location}
              onChangeText={(v) => update("location", v)}
              placeholder="e.g. Rexburg community garden"
              maxLength={120}
            />
            <Field
              label="Exact meeting details (approved hunter only)"
              value={form.address}
              onChangeText={(v) => update("address", v)}
              placeholder="Use sample details for this demo"
              maxLength={300}
            />
            <Field
              label="Contact email or phone (approved hunter only)"
              value={form.contact}
              onChangeText={(v) => update("contact", v)}
              autoCapitalize="none"
              maxLength={160}
            />
            <View style={s.inset}>
              <Body>
                Each new demo bounty carries 200 XP. The team’s final point
                system is still to be decided. Use fictional contact details in
                this prototype.
              </Body>
            </View>
            <Button title="Preview my bounty" icon="arrow" onPress={review} />
          </>
        ) : (
          <>
            <View style={s.noticeCard}>
              <Label>{form.category} · 200 DEMO XP</Label>
              <Title>{form.title}</Title>
              <Body>{form.description}</Body>
              <Text style={s.sectionTitle}>Time & materials</Text>
              <Body>
                {form.duration}
                {"\n"}
                {form.materials}
              </Body>
              <Text style={s.sectionTitle}>Where & how</Text>
              <Body>
                {form.location}
                {"\n"}
                {form.address}
                {"\n"}
                {form.contact}
              </Body>
            </View>
            <Button
              title="Pin to the bounty board"
              icon="plus"
              onPress={() => {
                if (act({ type: "create", ...form }))
                  router.replace({ pathname: "/work", params: { mode: "Posting", created: String(state.nextId) } });
              }}
            />
            <Button
              title="Edit details"
              secondary
              onPress={() => setPreview(false)}
            />
          </>
        )}
      </Page>
    </KeyboardAvoidingView>
  );
}

export function MemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state } = useTavern();
  const p = state.people.find((p) => p.id === id);
  return (
    <Page back title="Community profile">
      {p ? (
        <ProfileOverview person={p} />
      ) : (
        <Empty
          title="Profile unavailable"
          body="This demo account may have been reset."
        />
      )}
    </Page>
  );
}
export function NotificationsScreen() {
  const { state, act } = useTavern();
  const list = state.notices.filter((n) => n.recipient === state.currentId);
  return (
    <Page back title="Notifications">
      <Label>NEWS FROM THE NOTICEBOARD</Label>
      <Title>A little news{"\n"}from your neighbors.</Title>
      <Body>Requests, decisions, and progress—all in one place.</Body>
      {list.map((n) => (
        <Pressable
          key={n.id}
          accessibilityRole="button"
          onPress={() => {
            act({ type: "read", id: n.id });
            go(`/bounty/${n.bountyId}`);
          }}
          style={[
            s.card,
            !n.read && { borderLeftWidth: 4, borderLeftColor: C.wax },
          ]}
        >
          <View style={s.rowBetween}>
            <Label>{n.read ? "READ" : "NEW UPDATE"}</Label>
            <Text style={s.caption}>
              {new Date(n.time).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </Text>
          </View>
          <Text style={s.sectionTitle}>{n.title}</Text>
          <Body>{n.body}</Body>
          <Text style={s.link}>Open bounty →</Text>
        </Pressable>
      ))}
      {!list.length && (
        <Empty
          title="All quiet at the inn."
          body="Your claim and completion updates will appear here."
        />
      )}
      <Text style={s.caption}>
        In-app demo notifications only. No remote push is sent.
      </Text>
    </Page>
  );
}
export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { state, act } = useTavern();
  const [text, setText] = useState("");
  const b = state.bounties.find((b) => b.id === id);
  if (!b || !canContact(state, b))
    return (
      <Page back title="Messages">
        <Empty
          title="This conversation is locked."
          body="Only the poster and approved hunter can access it."
        />
      </Page>
    );
  const other = state.people.find(
    (p) =>
      p.id === (state.currentId === b.publisher ? b.hunterId : b.publisher),
  )!;
  const messages = state.messages.filter((m) => m.bountyId === id);
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page back title={other.name}>
        <View style={s.inset}>
          <Label>CONVERSATION ABOUT</Label>
          <Text style={s.sectionTitle}>{b.title}</Text>
          <Status status={b.status} />
        </View>
        {!messages.length && (
          <Empty
            title="Pull up a chair."
            body="Say hello and coordinate the details of your good deed."
          />
        )}
        {messages.map((m) => (
          <View
            key={m.id}
            style={[s.message, m.sender === state.currentId && s.messageOwn]}
          >
            <Label>{state.people.find((p) => p.id === m.sender)?.name}</Label>
            <Body>{m.text}</Body>
            <Text style={s.caption}>
              {new Date(m.time).toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </Text>
          </View>
        ))}
        <Field
          label="Your message"
          value={text}
          onChangeText={setText}
          multiline
          placeholder="Write a neighborly note…"
          maxLength={2000}
        />
        <Button
          title="Send message"
          icon="arrow"
          disabled={!text.trim()}
          onPress={() => {
            if (act({ type: "message", bountyId: b.id, text })) setText("");
          }}
        />
        <Button
          title={`Demo: reply as ${other.name.split(" ")[0]}`}
          secondary
          onPress={() => act({ type: "switch", id: other.id })}
        />
        <Text style={s.caption}>
          Messages are stored locally. Nothing is sent to another device.
        </Text>
      </Page>
    </KeyboardAvoidingView>
  );
}

export function AccountScreen() {
  const params = useLocalSearchParams<{ mode: string }>();
  const { state, act } = useTavern();
  const [mode, setMode] = useState(params.mode || "signin");
  const [name, setName] = useState(""),
    [username, setUsername] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [resent, setResent] = useState(false);
  const me = state.people.find((p) => p.id === state.currentId);
  const verification = mode === "verify" || (me && !me.verified);
  function register() {
    const err = passwordError(password);
    if (err) {
      setError(err);
      return;
    }
    if (act({ type: "register", name, username, email })) {
      setPassword("");
      setMode("verify");
      setError("");
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Page title="Welcome to the tavern">
        <Label>REXBURG BOUNTY BOARD</Label>
        <Title>
          {verification
            ? "A place with your name on it."
            : mode === "signup"
              ? "Join the common good."
              : "There’s a place for you here."}
        </Title>
        <View style={s.inset}>
          <Body>
            Demo accounts only. No real sign-in service or verification email is
            connected. Use fictional information; passwords are checked for the
            example rules but never saved.
          </Body>
        </View>
        {verification ? (
          <>
            <Body>
              In the finished app, a verification link will go to{" "}
              {me?.email || "your email"}. This prototype lets you preview that
              step.
            </Body>
            <Button
              title="Simulate verified email"
              onPress={() => {
                act({ type: "verify" });
                router.replace("/");
              }}
            />
            <Button
              title={
                resent ? "Demo resend noted" : "Preview resend verification"
              }
              secondary
              onPress={() => setResent(true)}
            />
          </>
        ) : (
          <>
            <View style={s.segmented}>
              <Chip
                label="Demo sign in"
                active={mode === "signin"}
                onPress={() => {
                  setMode("signin");
                  setError("");
                }}
              />
              <Chip
                label="Try sign up"
                active={mode === "signup"}
                onPress={() => {
                  setMode("signup");
                  setError("");
                }}
              />
            </View>
            {mode === "signin" ? (
              <>
                {state.people
                  .filter((p) => p.verified)
                  .map((p) => (
                    <Pressable
                      accessibilityRole="button"
                      key={p.id}
                      style={s.card}
                      onPress={() => {
                        act({ type: "switch", id: p.id });
                        router.replace("/");
                      }}
                    >
                      <View style={s.personRow}>
                        <Avatar person={p} />
                        <View style={{ flex: 1 }}>
                          <Text style={s.personName}>Continue as {p.name}</Text>
                          <Text style={s.small}>{p.role}</Text>
                        </View>
                        <Icon name="arrow" color={C.wax} />
                      </View>
                    </Pressable>
                  ))}
              </>
            ) : (
              <>
                <Field
                  label="Display name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your demo name"
                  maxLength={60}
                />
                <Field
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  placeholder="3–24 letters, numbers, underscores"
                  maxLength={24}
                />
                <Field
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="neighbor@example.com"
                  maxLength={160}
                />
                <Field
                  label="Example password (not saved)"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
                <Body>8+ characters · 2+ numbers · 1+ special character</Body>
                {error && (
                  <Text accessibilityRole="alert" style={s.errorText}>
                    {error}
                  </Text>
                )}
                <Button title="Create demo account" onPress={register} />
              </>
            )}
          </>
        )}
        <Text style={s.caption}>
          Google / Apple sign-in and device push permissions are planned
          integrations, not enabled in this local prototype.
        </Text>
      </Page>
    </KeyboardAvoidingView>
  );
}

