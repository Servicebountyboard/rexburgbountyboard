/** Development-only fixtures for the UI build. Replace through feature repositories. */
export type ServiceTag = { id: string; name: string; icon: string; color: string };
export type Bounty = {
  id: string; title: string; description: string; requirements: string;
  tagId: string; xp: number; gold: number; location: string; due: string; poster: string;
};

export const serviceTags: ServiceTag[] = [
  { id: "tech", name: "Tech & Creative", icon: "⌘", color: "#477D91" },
  { id: "home", name: "Home & Errands", icon: "⌂", color: "#718C68" },
  { id: "tutoring", name: "Tutoring", icon: "▤", color: "#7960A4" },
  { id: "events", name: "Events", icon: "▦", color: "#B4513C" },
  { id: "pet", name: "Pet Care", icon: "♣", color: "#BD7136" },
  { id: "odd", name: "Odd Jobs", icon: "⚒", color: "#687982" },
  { id: "outdoor", name: "Outdoor", icon: "▲", color: "#668368" },
  { id: "cleaning", name: "Cleaning", icon: "✦", color: "#C58B3C" },
  { id: "driving", name: "Driving", icon: "◉", color: "#4E8296" },
  { id: "mechanical", name: "Mechanical", icon: "⚙", color: "#8B8174" },
  { id: "computer", name: "Computer", icon: "▱", color: "#657B8C" },
  { id: "delivery", name: "Delivery", icon: "◇", color: "#9C8060" },
  { id: "repairs", name: "Repairs", icon: "⚒", color: "#9B6854" },
  { id: "design", name: "Design", icon: "◉", color: "#8A6A91" },
];

export const bounties: Bounty[] = [
  { id: "1", title: "Build a Portfolio Website", description: "I’m graduating this semester and need a simple portfolio to share my projects and experience.", requirements: "A clean, mobile-friendly website with 3–4 project sections. I can provide photos and copy.", tagId: "tech", xp: 500, gold: 40, location: "Remote", due: "Due in 7 days", poster: "Maya R." },
  { id: "2", title: "Help Move a Sofa", description: "Looking for a couple of people to help move a sofa from the garage into our living room.", requirements: "Please bring work gloves. The sofa is heavy but the path is clear.", tagId: "home", xp: 250, gold: 20, location: "Rexburg, ID", due: "This weekend", poster: "Jordan T." },
  { id: "3", title: "Math Tutoring — Algebra", description: "Could use some help reviewing algebra before my final next week.", requirements: "Meet at the library for two one-hour sessions.", tagId: "tutoring", xp: 300, gold: 25, location: "Online", due: "Flexible schedule", poster: "Emily S." },
  { id: "4", title: "Photograph a Birthday Party", description: "Capture a few candid photos at a small family birthday party.", requirements: "About two hours. A camera is preferred, but a good phone camera works too.", tagId: "events", xp: 450, gold: 35, location: "Idaho Falls, ID", due: "Nov 15, 2026", poster: "Chris W." },
  { id: "5", title: "Walk My Dog", description: "My usual afternoon dog walker is out of town. Juniper is friendly and loves a long walk.", requirements: "45 minute walk around the neighborhood. Leash and treats provided.", tagId: "pet", xp: 150, gold: 12, location: "Rexburg, ID", due: "This week", poster: "Avery L." },
  { id: "6", title: "Assemble Furniture", description: "Need an extra set of hands putting together a desk and two bookshelves.", requirements: "Basic tools are available. Allow around two hours.", tagId: "odd", xp: 300, gold: 24, location: "Rexburg, ID", due: "Flexible schedule", poster: "Morgan D." },
];

export const profileFixture = { username: "Silverscales_Hunter", xp: "12,450", gold: "8,500", rating: 4 };

export const myBountyFixtures = [
  { id: "mine-1", title: "Help set up chairs for the ward dinner", status: "Posted" },
  { id: "mine-2", title: "Build a Portfolio Website", status: "In progress" },
  { id: "mine-3", title: "Walk Juniper this week", status: "Completed" },
] as const;

export const reviewFixtures = [
  { id: "review-1", from: "kieralynn", rating: 5, text: "Great communication and thoughtful work. Would happily work together again." },
  { id: "review-2", from: "jordan.turner", rating: 4, text: "Reliable and right on time. Thanks for lending a hand!" },
];

export const activityFixtures = [
  { id: "activity-1", title: "Bounty completed", detail: "Walk Juniper this week", reward: "+150 XP · +12 gold", date: "Nov 10" },
  { id: "activity-2", title: "Review received", detail: "From kieralynn", reward: "5 star rating", date: "Nov 8" },
  { id: "activity-3", title: "Bounty accepted", detail: "Build a Portfolio Website", reward: "In progress", date: "Nov 6" },
];

export const conversations: { initials: string; name: string; preview: string; time: string; online: boolean; kind: "Friends" | "Bounties" }[] = [
  { initials: "KL", name: "kieralynn", preview: "Hey! I'm available to help with your website bounty. Let me know…", time: "2m ago", online: true, kind: "Bounties" },
  { initials: "JT", name: "jordan.turner", preview: "Sounds good! I can meet this weekend to help move the sofa.", time: "1h ago", online: false, kind: "Friends" },
  { initials: "ER", name: "emily.rose", preview: "Here are the photos from the event. Let me know what you think!", time: "3h ago", online: true, kind: "Friends" },
  { initials: "MC", name: "matthewc", preview: "No problem! I’ll bring the tools needed for the repair.", time: "1d ago", online: false, kind: "Bounties" },
  { initials: "SL", name: "sophia_lee", preview: "Great! See you then.", time: "2d ago", online: true, kind: "Friends" },
  { initials: "DK", name: "david.kim", preview: "I’ve completed the bounty. Let me know if there’s anything else!", time: "3d ago", online: false, kind: "Bounties" },
];
