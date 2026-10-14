export type Member = {
  id: string;
  name: string;
  initials: string;
  bio: string;
  rating: string;
  completed: number;
  xp: number;
};

export type Task = {
  id: string;
  title: string;
  publisher: string;
  status: "open" | "active" | "review" | "completed" | "draft" | "cancelled" | "closed";
  hunterId?: string;
  description: string;
  bring: string;
  xp: number;
  duration: string;
  location: string;
  address: string;
  feedback?: string;
};

export type Claim = {
  id: string;
  bountyId: string;
  hunterId: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | "other";
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
  currentId: string | null;
  people: Member[];
  bounties: Task[];
  claims: Claim[];
  notices: Notice[];
  messages: Message[];
  ratings: Rating[];
  error: string | null;
};
export const emptyState: State = {
  currentId: null,
  people: [],
  bounties: [],
  claims: [],
  notices: [],
  messages: [],
  ratings: [],
  error: null,
};
export type Action =
  | { type: "create"; title: string; description: string; materials: string; estimatedMinutes: number; address: string }
  | { type: "claim" | "submit" | "complete"; bountyId: string }
  | { type: "decide"; claimId: string; accept: boolean }
  | { type: "notYet"; bountyId: string; feedback: string }
  | { type: "message"; bountyId: string; text: string }
  | { type: "rate"; bountyId: string; score: number; comment: string }
  | { type: "read"; id: string };

export function canContact(s: State, b: Task) {
  return Boolean(s.currentId && b.hunterId && [b.publisher, b.hunterId].includes(s.currentId));
}
export function profileStats(s: State, id: string) {
  const p = s.people.find((person) => person.id === id);
  return { xp: p?.xp ?? 0, completed: p?.completed ?? 0, rating: p?.rating ?? "0.0" };
}
export function passwordError(password: string): string | null {
  if (password.length < 8 || (password.match(/[0-9]/g) || []).length < 2 || !/[^a-zA-Z0-9\s]/.test(password))
    return "Use 8+ characters, at least 2 numbers, and 1 special character.";
  return null;
}
