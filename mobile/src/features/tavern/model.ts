import {
  bounties as seedBounties,
  people as seedPeople,
  Bounty,
  Person,
} from "./seed";
export type Member = Person & {
  email: string;
  username: string;
  verified: boolean;
};
export type Task = Bounty & {
  status: "open" | "active" | "review" | "completed";
  hunterId?: string;
  address: string;
  contact: string;
  feedback?: string;
};
export type Claim = {
  id: string;
  bountyId: string;
  hunterId: string;
  status: "pending" | "accepted" | "rejected";
};
export type Notice = {
  id: string;
  recipient: string;
  bountyId: string;
  title: string;
  body: string;
  read: boolean;
  time: string;
};
export type Message = {
  id: string;
  bountyId: string;
  sender: string;
  text: string;
  time: string;
};
export type Rating = {
  bountyId: string;
  hunterId: string;
  score: number;
  comment: string;
};
export type State = {
  version: 2;
  currentId: string | null;
  people: Member[];
  bounties: Task[];
  claims: Claim[];
  notices: Notice[];
  messages: Message[];
  ratings: Rating[];
  nextId: number;
  error: string | null;
};
export const initialState: State = {
  version: 2,
  currentId: "you",
  people: seedPeople.map((p) => ({
    ...p,
    username: p.id === "you" ? "bridger" : p.id,
    email: `${p.id === "you" ? "bridger" : p.id}@example.com`,
    verified: true,
  })),
  bounties: [
    ...seedBounties.map((b) => ({
      ...b,
      status: "open" as const,
      address: `${b.location} · meet at the main entrance (sample location)`,
      contact: `${b.publisher}@example.com`,
    })),
    {
      id: "books",
      title: "Help a little library find its next chapter",
      publisher: "you",
      category: "Community",
      xp: 200,
      duration: "1 hour",
      when: "This weekend · Flexible",
      location: "Rexburg neighborhood library",
      distance: "Nearby",
      description:
        "Sort donated books, wipe the shelves, and make a welcoming reading corner. No experience needed.",
      bring: "All materials provided. Bring a little curiosity.",
      symbol: "book",
      color: "#eadfc9",
      status: "open" as const,
      address: "Neighborhood library entrance · sample location",
      contact: "bridger@example.com",
    },
  ],
  claims: [
    {
      id: "claim-seed",
      bountyId: "books",
      hunterId: "sarah",
      status: "pending",
    },
  ],
  notices: [
    {
      id: "notice-seed",
      recipient: "you",
      bountyId: "books",
      title: "Sarah offered a helping hand",
      body: "Review her claim for your little library bounty.",
      read: false,
      time: "2026-10-02T09:00:00Z",
    },
  ],
  messages: [],
  ratings: [],
  nextId: 10,
  error: null,
};
export type Action =
  | { type: "switch"; id: string }
  | { type: "signout" | "verify" | "clearError" | "reset" }
  | { type: "register"; name: string; username: string; email: string }
  | { type: "claim" | "submit" | "complete"; bountyId: string }
  | { type: "decide"; claimId: string; accept: boolean }
  | { type: "notYet"; bountyId: string; feedback: string }
  | {
      type: "create";
      title: string;
      description: string;
      duration: string;
      materials: string;
      location: string;
      address: string;
      contact: string;
      category: string;
    }
  | { type: "message"; bountyId: string; text: string }
  | { type: "rate"; bountyId: string; score: number; comment: string }
  | { type: "read"; id: string };
const fail = (s: State, error: string): State => ({ ...s, error });
export function canContact(s: State, b: Task, actor = s.currentId) {
  return Boolean(
    actor &&
    b.hunterId &&
    b.status !== "open" &&
    [b.publisher, b.hunterId].includes(actor),
  );
}
export function passwordError(password: string): string | null {
  if (
    password.length < 8 ||
    (password.match(/[0-9]/g) || []).length < 2 ||
    !/[^a-zA-Z0-9\s]/.test(password)
  )
    return "Use 8+ characters, at least 2 numbers, and 1 special character.";
  return null;
}
export function profileStats(s: State, id: string) {
  const p = s.people.find((p) => p.id === id)!;
  const done = s.bounties.filter(
    (b) => b.hunterId === id && b.status === "completed",
  );
  const reviews = s.ratings.filter((r) => r.hunterId === id);
  return {
    xp: p.xp + done.reduce((sum, b) => sum + b.xp, 0),
    completed: p.completed + done.length,
    rating: reviews.length
      ? (
          (Number(p.rating) * p.completed +
            reviews.reduce((a, r) => a + r.score, 0)) /
          (p.completed + reviews.length)
        ).toFixed(1)
      : p.rating,
  };
}
export function reducer(state: State, action: Action): State {
  if (action.type === "reset") return JSON.parse(JSON.stringify(initialState)) as State;
  if (action.type === "clearError") return { ...state, error: null };
  if (action.type === "signout")
    return { ...state, currentId: null, error: null };
  if (action.type === "switch")
    return state.people.some((p) => p.id === action.id)
      ? { ...state, currentId: action.id, error: null }
      : fail(state, "That demo account is unavailable.");
  if (action.type === "register") {
    const username = action.username.trim().toLowerCase(),
      email = action.email.trim().toLowerCase();
    if (
      !action.name.trim() ||
      !/^[a-z0-9_]{3,24}$/.test(username) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    )
      return fail(
        state,
        "Enter a name, a valid email, and a username of 3–24 letters, numbers, or underscores.",
      );
    if (state.people.some((p) => p.username === username || p.email === email))
      return fail(
        state,
        "That username or email is already used in this demo.",
      );
    const id = `member-${state.nextId}`;
    const p: Member = {
      id,
      name: action.name.trim(),
      initials: action.name
        .trim()
        .split(/\s+/)
        .map((x) => x[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
      username,
      email,
      verified: false,
      role: "Bounty hunter",
      bio: "A new neighbor ready to make a difference.",
      rating: "0.0",
      completed: 0,
      rate: 0,
      xp: 0,
      color: "#eadfc9",
      skills: ["Community"],
    };
    return {
      ...state,
      people: [...state.people, p],
      currentId: id,
      nextId: state.nextId + 1,
      error: null,
    };
  }
  const actor = state.people.find((p) => p.id === state.currentId);
  if (!actor) return fail(state, "Choose a demo account to continue.");
  if (action.type === "verify")
    return {
      ...state,
      people: state.people.map((p) =>
        p.id === actor.id ? { ...p, verified: true } : p,
      ),
      error: null,
    };
  if (action.type === "read")
    return {
      ...state,
      notices: state.notices.map((n) =>
        n.id === action.id && n.recipient === actor.id
          ? { ...n, read: true }
          : n,
      ),
      error: null,
    };
  if (!actor.verified)
    return fail(state, "Finish demo email verification first.");
  const s: State = { ...state, error: null, nextId: state.nextId + 1 };
  const notify = (
    recipient: string,
    bountyId: string,
    title: string,
    body: string,
  ) => {
    s.notices = [
      {
        id: `n-${s.nextId++}`,
        recipient,
        bountyId,
        title,
        body,
        read: false,
        time: new Date().toISOString(),
      },
      ...s.notices,
    ];
  };
  if (action.type === "create") {
    if (
      [
        action.title,
        action.description,
        action.duration,
        action.materials,
        action.location,
        action.address,
        action.contact,
      ].some((x) => !x.trim())
    )
      return fail(state, "Please complete all bounty fields.");
    if (action.title.trim().length < 5 || action.description.trim().length < 20)
      return fail(
        state,
        "Use a title of at least 5 characters and a description of at least 20.",
      );
    const b: Task = {
      id: `b-${s.nextId++}`,
      title: action.title.trim(),
      description: action.description.trim(),
      duration: action.duration.trim(),
      bring: action.materials.trim(),
      location: action.location.trim(),
      address: action.address.trim(),
      contact: action.contact.trim(),
      category: action.category,
      publisher: actor.id,
      xp: 200,
      status: "open",
      distance: "Rexburg",
      when: "Coordinate with poster",
      symbol: "community",
      color: "#eadfc9",
    };
    return { ...s, bounties: [b, ...s.bounties] };
  }
  if (action.type === "decide") {
    const c = s.claims.find((c) => c.id === action.claimId),
      b = s.bounties.find((b) => b.id === c?.bountyId);
    if (
      !c ||
      !b ||
      b.publisher !== actor.id ||
      c.status !== "pending" ||
      b.status !== "open"
    )
      return fail(state, "This claim is no longer awaiting your decision.");
    s.claims = s.claims.map((x) =>
      x.id === c.id
        ? { ...x, status: action.accept ? "accepted" : "rejected" }
        : action.accept && x.bountyId === b.id && x.status === "pending"
          ? { ...x, status: "rejected" }
          : x,
    );
    if (action.accept) {
      s.bounties = s.bounties.map((x) =>
        x.id === b.id ? { ...x, status: "active", hunterId: c.hunterId } : x,
      );
      for (const other of state.claims.filter(
        (x) => x.bountyId === b.id && x.id !== c.id && x.status === "pending",
      ))
        notify(other.hunterId, b.id, "Another hunter was selected", b.title);
    }
    notify(
      c.hunterId,
      b.id,
      action.accept ? "Your claim was approved" : "Your claim was declined",
      b.title,
    );
    return s;
  }
  if (!("bountyId" in action)) return state;
  const b = s.bounties.find((b) => b.id === action.bountyId);
  if (!b) return fail(state, "This bounty could not be found.");
  if (action.type === "claim") {
    if (
      b.publisher === actor.id ||
      b.status !== "open" ||
      s.claims.some((c) => c.bountyId === b.id && c.hunterId === actor.id)
    )
      return fail(
        state,
        "You already requested this bounty, or it is not available to you.",
      );
    s.claims = [
      ...s.claims,
      {
        id: `c-${s.nextId++}`,
        bountyId: b.id,
        hunterId: actor.id,
        status: "pending",
      },
    ];
    notify(b.publisher, b.id, `${actor.name} offered a helping hand`, b.title);
    return s;
  }
  if (action.type === "message") {
    if (!canContact(s, b) || !action.text.trim())
      return fail(
        state,
        "Messaging is available to the poster and approved hunter.",
      );
    s.messages = [
      ...s.messages,
      {
        id: `m-${s.nextId++}`,
        bountyId: b.id,
        sender: actor.id,
        text: action.text.trim().slice(0, 2000),
        time: new Date().toISOString(),
      },
    ];
    notify(
      actor.id === b.publisher ? b.hunterId! : b.publisher,
      b.id,
      `New message from ${actor.name}`,
      action.text.trim().slice(0, 80),
    );
    return s;
  }
  if (action.type === "rate") {
    if (
      b.publisher !== actor.id ||
      b.status !== "completed" ||
      !b.hunterId ||
      s.ratings.some((r) => r.bountyId === b.id) ||
      !Number.isInteger(action.score) ||
      action.score < 1 ||
      action.score > 5
    )
      return fail(state, "Only the poster can rate completed work once.");
    return {
      ...s,
      ratings: [
        ...s.ratings,
        {
          bountyId: b.id,
          hunterId: b.hunterId,
          score: action.score,
          comment: action.comment.trim().slice(0, 500),
        },
      ],
    };
  }
  if (action.type === "submit") {
    if (b.hunterId !== actor.id || b.status !== "active")
      return fail(state, "Only the assigned hunter can submit active work.");
    s.bounties = s.bounties.map((x) =>
      x.id === b.id ? { ...x, status: "review" } : x,
    );
    notify(b.publisher, b.id, "A deed is ready for review", b.title);
    return s;
  }
  if (b.publisher !== actor.id || b.status !== "review" || !b.hunterId)
    return fail(state, "Only the poster can review this completion request.");
  if (action.type === "notYet") {
    if (!action.feedback.trim())
      return fail(state, "Let the hunter know what still needs attention.");
    s.bounties = s.bounties.map((x) =>
      x.id === b.id
        ? { ...x, status: "active", feedback: action.feedback.trim() }
        : x,
    );
    notify(
      b.hunterId,
      b.id,
      "A little more work is needed",
      action.feedback.trim(),
    );
    return s;
  }
  s.bounties = s.bounties.map((x) =>
    x.id === b.id ? { ...x, status: "completed", feedback: undefined } : x,
  );
  notify(b.hunterId, b.id, `A deed well done · ${b.xp} XP earned`, b.title);
  return s;
}

