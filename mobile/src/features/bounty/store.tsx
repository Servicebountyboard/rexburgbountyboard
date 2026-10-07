import React, { createContext, useContext, useReducer } from "react";

export type Person = {
  id: string;
  name: string;
  initials: string;
  role: string;
  bio: string;
  rating: string;
  completed: number;
  rate: number;
  xp: number;
  color: string;
  skills: string[];
};
export const people: Person[] = [
  {
    id: "you",
    name: "Bridger",
    initials: "BR",
    role: "Bounty hunter",
    bio: "Showing up for neighbors, one small act at a time. Happy to lend a hand outdoors or help with a community event.",
    rating: "4.9",
    completed: 18,
    rate: 95,
    xp: 1850,
    color: "#DCE9C7",
    skills: ["Yard work", "Heavy lifting", "Events"],
  },
  {
    id: "maya",
    name: "Maya Chen",
    initials: "MC",
    role: "Community organizer",
    bio: "Making our shared spaces a little greener. I organize neighborhood cleanups and garden days.",
    rating: "4.9",
    completed: 32,
    rate: 97,
    xp: 3400,
    color: "#F3D4BF",
    skills: ["Gardening", "Community", "Outdoors"],
  },
  {
    id: "eli",
    name: "Eli Thompson",
    initials: "ET",
    role: "Neighbor & volunteer",
    bio: "A Rexburg local who believes a good meal and a helping hand can change someone’s week.",
    rating: "4.8",
    completed: 24,
    rate: 96,
    xp: 2600,
    color: "#D9DDF3",
    skills: ["Food drives", "Delivery", "Events"],
  },
  {
    id: "sarah",
    name: "Sarah Miller",
    initials: "SM",
    role: "Bounty hunter",
    bio: "Student, trail enthusiast, and weekend volunteer. Always up for a project with a purpose.",
    rating: "5.0",
    completed: 41,
    rate: 100,
    xp: 4250,
    color: "#F5E6AE",
    skills: ["Tutoring", "Outdoors", "Organizing"],
  },
];
export type Bounty = {
  id: string;
  title: string;
  location: string;
  distance: string;
  category: string;
  xp: number;
  duration: string;
  when: string;
  publisher: string;
  description: string;
  bring: string;
  symbol: string;
  color: string;
};
export const bounties: Bounty[] = [
  {
    id: "garden",
    title: "Give the community garden a fresh start",
    location: "Rexburg Community Garden",
    distance: "0.8 mi",
    category: "Outdoors",
    xp: 250,
    duration: "2 hours",
    when: "Saturday · 9:00 AM",
    publisher: "maya",
    description:
      "Help prepare our garden beds for the next growing season. We’ll pull weeds, spread fresh compost, and tidy the shared paths. No gardening experience needed—just a little energy and a love for the neighborhood.",
    bring:
      "Closed-toe shoes, water, and work gloves if you have them. Tools are provided.",
    symbol: "✿",
    color: "#E4ECCF",
  },
  {
    id: "pantry",
    title: "Pack a little kindness",
    location: "Community Food Pantry, Rexburg",
    distance: "1.2 mi",
    category: "Community",
    xp: 180,
    duration: "90 minutes",
    when: "Saturday · 11:00 AM",
    publisher: "eli",
    description:
      "Sort donated groceries and pack food boxes for local families. We’ll show you exactly where everything goes and work together at the packing tables.",
    bring: "Comfortable shoes and a reusable water bottle.",
    symbol: "♡",
    color: "#F5DFCF",
  },
  {
    id: "trail",
    title: "Leave the river trail better than you found it",
    location: "Teton River Trail, Rexburg",
    distance: "2.4 mi",
    category: "Outdoors",
    xp: 200,
    duration: "90 minutes",
    when: "Sunday · 10:00 AM",
    publisher: "sarah",
    description:
      "Join a relaxed walk along the river while collecting litter. We’ll meet at the trail entrance, split into small groups, and finish with a cleaner place for everyone to enjoy.",
    bring: "Walking shoes and a jacket. Bags and litter grabbers are provided.",
    symbol: "↟",
    color: "#DCE9E7",
  },
  {
    id: "tutor",
    title: "Make math click for a young learner",
    location: "Madison Library, Rexburg",
    distance: "0.5 mi",
    category: "Education",
    xp: 150,
    duration: "1 hour",
    when: "Monday · 4:00 PM",
    publisher: "sarah",
    description:
      "Support a supervised homework club with basic math practice. Help students build confidence through patient explanations and a few fun number games.",
    bring:
      "Patience and a friendly attitude. All learning materials are provided.",
    symbol: "✎",
    color: "#E5E0F1",
  },
  {
    id: "move",
    title: "A helping hand with a fresh start",
    location: "Center Street, Rexburg",
    distance: "1.6 mi",
    category: "Community",
    xp: 300,
    duration: "2 hours",
    when: "Tuesday · 5:00 PM",
    publisher: "eli",
    description:
      "Help a neighbor carry packed boxes into their new home. We’ll work in pairs, take breaks, and keep the heavy items for the experienced crew.",
    bring: "Closed-toe shoes. Only lift what you’re comfortable carrying.",
    symbol: "⌂",
    color: "#F3E6C7",
  },
];
export type Assignment = {
  bountyId: string;
  status: "accepted" | "submitted" | "completed";
};
export type Notice = {
  id: number;
  recipient: string;
  bountyId: string;
  kind: "accepted" | "submitted" | "completed";
  read: boolean;
};
export type State = {
  assignments: Assignment[];
  notices: Notice[];
  nextId: number;
};
export type Action =
  | { type: "accept" | "submit" | "complete"; bountyId: string }
  | { type: "read"; recipient: string };
export const initialState: State = { assignments: [], notices: [], nextId: 1 };
export function reducer(state: State, action: Action): State {
  if (action.type === "read")
    return {
      ...state,
      notices: state.notices.map((n) =>
        n.recipient === action.recipient ? { ...n, read: true } : n,
      ),
    };
  const bounty = bounties.find((b) => b.id === action.bountyId);
  if (!bounty) return state;
  const existing = state.assignments.find((a) => a.bountyId === bounty.id);
  if (action.type === "accept" && existing) return state;
  if (action.type === "submit" && existing?.status !== "accepted") return state;
  if (action.type === "complete" && existing?.status !== "submitted")
    return state;
  const status =
    action.type === "accept"
      ? "accepted"
      : action.type === "submit"
        ? "submitted"
        : "completed";
  return {
    assignments: existing
      ? state.assignments.map((a) =>
          a.bountyId === bounty.id ? { ...a, status } : a,
        )
      : [...state.assignments, { bountyId: bounty.id, status }],
    notices: [
      {
        id: state.nextId,
        recipient: status === "completed" ? "you" : bounty.publisher,
        bountyId: bounty.id,
        kind: status,
        read: false,
      },
      ...state.notices,
    ],
    nextId: state.nextId + 1,
  };
}
const Context = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);
export function BountyProvider({ children }: React.PropsWithChildren) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <Context.Provider value={{ state, dispatch }}>{children}</Context.Provider>
  );
}
export function useBounties() {
  const value = useContext(Context);
  if (!value) throw new Error("BountyProvider is required");
  return value;
}
