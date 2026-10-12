:::writing{variant="document" id="58321" title="AGENTS.md — Bounty App Development Guide"}

# **AGENTS.md**

# **Bounty App — Development Guide**

## **1\. Project Overview**

This project is a phone app and web-connected system that allows users to:

1. Create bounties.  
2. Publish bounties to a shared Bounty Board.  
3. Discover and search for bounties.  
4. Apply/claim bounties.  
5. Approve or reject Bounty Hunters.  
6. Complete approved bounties.  
7. Award XP and Gold.  
8. Rate Bounty Hunters.  
9. Communicate through temporary group chats.  
10. Track active, posted, claimed, and completed bounties.

The system has two primary roles:

* **Bounty Poster** — creates and posts bounties.  
* **Bounty Hunter** — finds, claims, and completes bounties.

A single user can be both a Bounty Poster and a Bounty Hunter.

The application should be designed so multiple users can interact with the Bounty Board at the same time.

---

# **2\. Technology Requirements**

## **Required Technologies**

* **TypeScript** — primary programming language.  
* **Supabase** — database, authentication, real-time communication, and backend services.  
* **Web application** — TypeScript (`.ts`), HTML, and CSS.  
* **Phone application** — should communicate with the same backend/database as the web application.

## **General Architecture**

                   ┌─────────────────────┐  
                   │       User                                        │  
                   │  Phone or Web App                      │  
                   └──────────┬──────────┘  
                                               │  
                                               │ TypeScript  
                                              ▼  
                   ┌─────────────────────┐  
                   │   Application UI                             │  
                   │                                                      │  
                   │ HTML / CSS / TS                         │  
                   └──────────┬──────────┘  
                                               │  
                                               │ Supabase Client  
                                              ▼  
                   ┌─────────────────────┐  
                   │      Supabase                                │  
                   │                                                      │  
                   │ Authentication                              │  
                   │ PostgreSQL Database                 │  
                   │ Realtime                                       │  
                   │ Storage (if needed)                      │  
                   └──────────┬──────────┘  
                                               │  
                                              ▼  
                   ┌─────────────────────┐  
                   │ Other Connected                          │  
                   │ App Clients                                   │  
                   └─────────────────────┘

The phone application and web application should use the same backend data model.

---

# **3\. Development Principles**

## **Keep the Code Simple**

Prefer straightforward TypeScript over complicated abstractions.

Good:

const bounty \= await getBounty(bountyId);

Avoid unnecessary complexity:

const bounty \= await bountyRepository  
  .withStrategy(...)  
  .usingResolver(...)  
  .execute(...)

unless there is a real reason for the abstraction.

## **Validate on Both Client and Server**

The client should provide immediate feedback.

The backend/database must still enforce important rules.

User Input  
    │  
    ▼  
Client Validation  
    │  
    ├── Invalid → Show Error  
    │  
    ▼  
Supabase Request  
    │  
    ▼  
Server/Database Validation  
    │  
    ├── Invalid → Reject Request  
    │  
    ▼  
Database Update

Never trust the client to enforce security-sensitive rules.

---

# **4\. Core Concepts**

## **User**

Every account belongs to a user.

A user can simultaneously be:

* A Bounty Poster  
* A Bounty Hunter

Do not create separate account types for Posters and Hunters.

Instead, store Hunter-specific information on the user's profile.

Example:

interface UserProfile {  
  id: string;  
  username: string;  
  xp: number;  
  gold: number;  
  hunterLevel: number;  
  hunterRating: number;  
  ratingCount: number;  
}

---

# **5\. Bounty**

A bounty represents a task that someone needs another person to perform.

A bounty contains:

* Title  
* Description  
* Tags  
* Required skills/materials  
* Estimated completion time  
* Repeat schedule  
* Reward  
* Poster  
* Current status

Example:

interface Bounty {  
  id: string;  
  posterId: string;  
  title: string;  
  description: string;  
  tags: string\[\];  
  requiredSkills: string\[\];  
  requiredMaterials: string\[\];  
  estimatedMinutes: number;  
  repeatEnabled: boolean;  
  repeatDays?: number;  
  xpReward: number;  
  goldReward: number;  
  status: BountyStatus;  
  createdAt: string;  
}

---

# **6\. Bounty Status**

Bounties should use explicit states.

Recommended states:

DRAFT  
  │  
  ▼  
POSTED  
  │  
  ▼  
PENDING\_APPROVAL  
  │  
  ├───────────────┐  
  │               │  
  ▼               ▼  
REJECTED       APPROVED  
  │               │  
  │               ▼  
  │            ACTIVE  
  │               │  
  │               ▼  
  │           COMPLETED  
  │  
  └──► POSTED

A more implementation-oriented state model:

type BountyStatus \=  
  | "draft"  
  | "posted"  
  | "pending\_approval"  
  | "active"  
  | "completed"  
  | "rejected"  
  | "cancelled";

The exact database state model may use a separate claim/application table. That is preferred because the bounty itself and a Hunter's attempt to claim it are different concepts.

---

# **7\. Bounty Creation**

## **Required Fields**

A bounty must contain:

| Field | Requirement |
| ----- | ----- |
| Title | Maximum 50 characters |
| Description | Maximum 250 characters |
| Tags | At least one recommended |
| Required skills/materials | User-defined |
| Estimated time | Minutes |
| Repeat option | Optional |
| Reward | XP \+ Gold |

## **Title Validation**

if (title.length \> 50\) {  
  throw new Error("Bounty title cannot exceed 50 characters.");  
}

## **Description Validation**

if (description.length \> 250\) {  
  throw new Error("Bounty description cannot exceed 250 characters.");  
}

## **Estimated Time**

Store time in minutes.

Example:

30 minutes  
60 minutes  
120 minutes

Do not store human-readable strings such as `"about an hour"` in the database.

Use:

estimatedMinutes: 60

The UI can convert that value into readable text.

---

# **8\. Bounty Creation Flow**

┌──────────────┐  
│ User selects                │  
│ Create Bounty             │  
└──────┬───────┘  
                 ▼  
┌─────────────────────┐  
│ Enter title                                      │  
│ Enter description                          │  
│ Select tags                                   │  
│ Add skills/materials                      │  
│ Enter time                                     │  
│ Configure repeat                          │  
└──────────┬──────────┘  
                            ▼  
   ┌───────────────┐  
   │ Validate Form                │  
   └───────┬───────┘  
                        │  
                   Invalid?  
                     /     \\  
                Yes      No  
                  │        │  
                 ▼        ▼  
     Show Error  Save Bounty  
                                │  
                               ▼  
                     Status \= POSTED  
                                │  
                               ▼  
                     Bounty Board

---

# **9\. Bounty Tags**

Tags help Hunters search and filter the Bounty Board.

## **Location / Environment**

* Indoor  
* Outdoor  
* Vehicle  
* Community / Public  
* Remote / Online

## **Task / Type**

* Cleaning  
* Maintenance / Repair  
* Yard Work / Gardening  
* Cooking / Food  
* Transportation  
* Organization  
* Moving / Lifting  
* Shopping / Errands  
* Administrative  
* Teaching / Tutoring  
* Technology  
* Creative  
* Construction  
* Pet Care  
* Child Care  
* Elder Care  
* Personal Assistance

Recommended implementation:

type BountyTag \=  
  | "indoor"  
  | "outdoor"  
  | "vehicle"  
  | "community\_public"  
  | "remote\_online"  
  | "cleaning"  
  | "maintenance\_repair"  
  | "yard\_work\_gardening"  
  | "cooking\_food"  
  | "transportation"  
  | "organization"  
  | "moving\_lifting"  
  | "shopping\_errands"  
  | "administrative"  
  | "teaching\_tutoring"  
  | "technology"  
  | "creative"  
  | "construction"  
  | "pet\_care"  
  | "child\_care"  
  | "elder\_care"  
  | "personal\_assistance";

Store stable machine-readable values in the database.

The UI can display friendly names.

---

# **10\. Bounty Board**

The Bounty Board is the main discovery area for Hunters.

It should contain:

1. Newly posted bounties.  
2. Priority bounties.  
3. Weekly Bonus bounties.  
4. Search.  
5. Filters.  
6. User's posted bounties.  
7. User's active/claimed bounties.

Example layout:

┌────────────────────────────────────┐  
│                                  BOUNTY BOARD                              │  
├────────────────────────────────────┤  
│ Search: \[\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\] 🔍                              │  
│                                    │  
│ \[New\] \[Priority\] \[Weekly Bonus\]                                          │  
├────────────────────────────────────┤  
│                                                                                             │  
│ Bounty Card                                                                        │  
│ ┌────────────────────────────────┐     │  
│ │ Help move furniture                                                  │     │  
│ │ Moving / Lifting                                                         │     │  
│ │ \~60 minutes                                                              │     │   
│ │ 100 XP \+ 100 Gold                                                   │     │  
│ │              \[View Bounty\]                                               │     │  
│ └────────────────────────────────┘      │  
│                                                                                             │  
└────────────────────────────────────┘

---

# **11\. Bounty Search**

Users should be able to filter by:

* Tags  
* Estimated time  
* Required tools/materials

Example:

interface BountyFilters {  
  tags?: string\[\];  
  maxMinutes?: number;  
  requiredMaterials?: string\[\];  
}

Example search:

const filters \= {  
  tags: \["outdoor", "yard\_work\_gardening"\],  
  maxMinutes: 120,  
  requiredMaterials: \["shovel"\]  
};

---

# **12\. Multiple Users and Concurrency**

The Bounty Board must support multiple users interacting with the same bounty at the same time.

Example:

Hunter A ─────┐  
              │  
Hunter B ─────┼──► Supabase ──► Bounty  
              │  
Hunter C ─────┘

The application must not rely solely on the UI to prevent two Hunters from claiming the same bounty.

The database/backend must enforce the rules.

## **Important Rule**

A bounty can only have one approved active Hunter at a time.

A safe flow is:

Hunter clicks Claim  
               │  
              ▼  
Create Claim/Application  
               │  
              ▼  
Poster reviews Hunter  
                │  
   ┌────┴────┐  
   ▼                     ▼  
Reject            Approve  
    │                      │  
   ▼                     ▼  
Remain     Transaction/  
Posted     atomic update  
                            │  
                           ▼  
                 Bounty becomes  
                       Active

Use database constraints, transactions, or server-side logic to prevent race conditions.

---

# **13\. Recommended Bounty Claim Model**

Do not place all Hunter information directly on the bounty.

Instead, create a separate claim/application record.

interface BountyClaim {  
  id: string;  
  bountyId: string;  
  hunterId: string;  
  status: ClaimStatus;  
  createdAt: string;  
  approvedAt?: string;  
  rejectedAt?: string;  
  completedAt?: string;  
}

type ClaimStatus \=  
  | "pending"  
  | "approved"  
  | "rejected"  
  | "completed";

This allows the system to maintain a history of interactions.

---

# **14\. Claiming a Bounty**

When a Hunter selects a bounty:

Hunter  
   │  
  ▼  
View Bounty  
   │  
  ▼  
\[Claim Bounty\]  
   │  
  ▼  
Create Pending Claim  
  │  
  ├──────────────► Notify Hunter  
  │  
  └──────────────► Notify Poster  
                          │  
                         ▼  
                   Recruitment  
                                   │  
                   ┌─────┴─────┐  
                   ▼                           ▼  
                Approve                 Reject

The bounty should not immediately become active merely because a Hunter clicked "Claim."

The Poster must approve the Hunter.

---

# **15\. Recruitment Window**

When a Hunter claims a bounty, the Poster receives a Recruitment view.

The Recruitment view should display:

* Hunter username  
* Hunter level  
* Hunter rating  
* Approve button  
* Reject button

Example:

┌─────────────────────────────┐  
│        RECRUITMENT                                        │  
├─────────────────────────────┤  
│ Hunter: ExampleUser                                       │  
│ Level: 5                                                             │  
│ Rating: 4.8 ★                                                    │  
│                                                                           │  
│ \[Reject\]       \[Approve\]                                       │  
└─────────────────────────────┘

---

# **16\. Approval Flow**

Pending Claim  
     │  
     ▼  
Poster approves  
     │  
     ▼  
Verify bounty is still available  
     │  
     ▼  
Mark claim \= APPROVED  
     │  
     ▼  
Bounty \= ACTIVE  
     │  
     ├──────────────► Remove from public board  
     │  
     ├──────────────► Add to Hunter Active Bounties  
     │  
     ├──────────────► Add to Poster Claimed Bounties  
     │  
     ├──────────────► Create temporary group chat  
     │  
     └──────────────► Notify Hunter

All state changes should be handled atomically where possible.

---

# **17\. Rejection Flow**

Pending Claim  
     │  
     ▼  
Poster rejects  
     │  
     ▼  
Claim \= REJECTED  
     │  
     ├──────────────► Notify Hunter  
     │  
     └──────────────► Bounty remains available

A rejected claim should not remove the bounty from the public board.

---

# **18\. Notifications**

Notifications are required when important events occur.

At minimum:

### **Hunter**

* Claim submitted.  
* Claim approved.  
* Claim rejected.  
* Bounty completed.  
* XP awarded.  
* Gold awarded.  
* Rating received.

### **Poster**

* Hunter claimed bounty.  
* Hunter is awaiting approval.  
* Hunter completed/requests completion.  
* Bounty completed.

Example:

interface Notification {  
  id: string;  
  userId: string;  
  type: NotificationType;  
  bountyId?: string;  
  claimId?: string;  
  message: string;  
  read: boolean;  
  createdAt: string;  
}

---

# **19\. Temporary Group Chat**

After a Poster approves a Hunter, create a temporary conversation.

Participants:

Bounty Poster  
      │  
      ├──── Temporary Group Chat ────┤  
      │                              │  
Bounty Hunter

The chat exists only while the bounty is active.

## **Chat Lifecycle**

Bounty Approved  
      │  
      ▼  
Create Conversation  
      │  
      ▼  
Hunter \+ Poster communicate  
      │  
      ▼  
Bounty Completed  
      │  
      ▼  
Delete/Archive Conversation

Do not use the chat as the permanent source of truth for bounty status.

Bounty status belongs to the bounty/claim records.

---

# **20\. Active Bounties**

The Hunter should have an **Active Bounties** or **Claimed Bounties** screen.

Example:

My Bounties  
│  
├── Active  
│   ├── Help Move Furniture  
│   └── Clean Garage  
│  
└── Completed  
    ├── Mow Lawn  
    └── Fix Computer

The Poster should have a separate view for:

My Posted Bounties  
│  
├── Available  
├── Pending Recruitment  
├── Active  
└── Completed

---

# **21\. Completing a Bounty**

The Hunter performs the requested task.

The Hunter then indicates that the task is finished.

The Poster reviews the work.

Hunter performs task  
        │  
        ▼  
Hunter indicates task is finished  
         │  
        ▼  
Poster reviews work  
                │  
   ┌────┴─────┐  
   ▼                         ▼  
Approve         Not Approved  
    │  
   ▼  
Bounty Complete

The Poster ultimately controls whether the bounty is officially completed.

---

# **22\. Bounty Completion Flow**

When the Poster clicks **Bounty Complete**:

Poster clicks  
"Bounty Complete"  
         │  
        ▼  
Verify active claim  
         │  
        ▼  
Mark claim COMPLETED  
         │  
        ▼  
Mark bounty COMPLETED  
        │  
        ├──────────────► Award 100 XP  
        │  
        ├──────────────► Award 100 Gold  
        │  
        ├──────────────► Update Hunter Level  
        │  
        ├──────────────► Request Hunter Rating  
        │  
        ├──────────────► Remove from Active Bounties  
        │  
        ├──────────────► Remove from Poster Claimed Bounties  
        │  
        └──────────────► Close temporary chat

---

# **23\. Rewards**

For the initial version, every completed bounty awards:

100 XP  
100 Gold

Store these as data rather than hard-coding them throughout the application.

Example:

const DEFAULT\_BOUNTY\_REWARD \= {  
  xp: 100,  
  gold: 100  
};

A bounty may eventually support custom rewards, but the initial implementation should use the standard reward.

---

# **24\. Gold**

Gold is an in-game currency.

For now, Gold only needs to be stored on the user's account.

interface UserProfile {  
  gold: number;  
}

When a bounty is completed:

user.gold \+= 100;

Do not build the full Gold economy yet.

Future systems may include:

* Shop  
* Items  
* Cosmetics  
* Upgrades  
* Purchases

Those are outside the current scope.

---

# **25\. XP**

XP is earned by completing bounties.

Initial reward:

100 XP per completed bounty

Example:

hunter.xp \+= 100;

XP should be stored as a total.

Do not store only the current level.

The user's total XP is the source of truth.

---

# **26\. Hunter Levels**

There are 10 Hunter levels.

| Level | Required Total XP |
| ----- | ----- |
| 1 | 30 XP |
| 2 | 100 XP |
| 3 | 200 XP |
| 4 | 400 XP |
| 5 | 800 XP |
| 6 | 1,600 XP |
| 7 | 3,200 XP |
| 8 | 6,400 XP |
| 9 | 12,800 XP |
| 10 | 20,000+ XP |

Level should be derived from total XP.

Example:

function calculateHunterLevel(xp: number): number {  
  if (xp \>= 20000\) return 10;  
  if (xp \>= 12800\) return 9;  
  if (xp \>= 6400\) return 8;  
  if (xp \>= 3200\) return 7;  
  if (xp \>= 1600\) return 6;  
  if (xp \>= 800\) return 5;  
  if (xp \>= 400\) return 4;  
  if (xp \>= 200\) return 3;  
  if (xp \>= 100\) return 2;  
  return 1;  
}

Important:

A user with 0 XP is still Level 1\.

The first threshold of 30 XP means Level 1 remains the starting level, while Level 2 begins at 100 XP.

---

# **27\. Hunter Rating**

Bounty Posters rate Hunters after a bounty is completed.

Rating:

1 ★  
2 ★  
3 ★  
4 ★  
5 ★

A Hunter's rating should be calculated from their completed bounty reviews.

Recommended data model:

interface HunterReview {  
  id: string;  
  bountyId: string;  
  hunterId: string;  
  posterId: string;  
  rating: number;  
  createdAt: string;  
}

Validation:

if (rating \< 1 || rating \> 5\) {  
  throw new Error("Rating must be between 1 and 5.");  
}

A Poster should only be able to rate the Hunter associated with a completed bounty they posted.

---

# **28\. Recommended Database Tables**

The exact schema may evolve, but the application should conceptually contain these entities:

users  
  │  
  ├── profiles  
  │  
  ├── bounties  
  │  
  ├── bounty\_claims  
  │  
  ├── hunter\_reviews  
  │  
  ├── notifications  
  │  
  └── conversations  
          │  
          └── messages

Recommended tables:

### **`profiles`**

id  
username  
xp  
gold  
hunter\_level  
hunter\_rating  
rating\_count  
created\_at  
updated\_at

### **`bounties`**

id  
poster\_id  
title  
description  
tags  
required\_skills  
required\_materials  
estimated\_minutes  
repeat\_enabled  
repeat\_days  
xp\_reward  
gold\_reward  
status  
created\_at  
updated\_at

### **`bounty_claims`**

id  
bounty\_id  
hunter\_id  
status  
created\_at  
approved\_at  
rejected\_at  
completed\_at

### **`hunter_reviews`**

id  
bounty\_id  
hunter\_id  
poster\_id  
rating  
created\_at

### **`notifications`**

id  
user\_id  
type  
bounty\_id  
claim\_id  
message  
read  
created\_at

### **`conversations`**

id  
bounty\_id  
created\_at  
closed\_at

### **`conversation_members`**

conversation\_id  
user\_id

### **`messages`**

id  
conversation\_id  
sender\_id  
message  
created\_at

---

# **29\. Database Relationships**

                               ┌─────────────┐  
                               │   PROFILE               │  
                               │                                  │  
                               │ user                          │  
                               └──────┬──────┘  
                                                 │  
             ┌─────────────┴─────────────┐  
              │                                                                     │  
             ▼                                                                    ▼  
      ┌─────────────┐             ┌─────────────┐  
      │  BOUNTIES              │             │   CLAIMS                 │  
      │                                  │             │                                  │  
      │ poster\_id                  │             │ hunter\_id                  │  
      └──────┬──────┘             └──────┬──────┘  
                        │                                                  │  
             └────────────┬──────────────┘  
                                              ▼  
                  ┌───────────────┐  
                  │    REVIEWS                   │  
                  └───────────────┘

---

# **30\. Supabase Security**

Use Supabase Row Level Security (RLS).

Users must not be allowed to modify another user's private information simply by changing an ID in a request.

Examples:

### **User Profile**

A user may update their own profile.

User A → Can update User A  
User A → Cannot update User B

### **Bounty**

A Poster may update their own bounty.

Poster A → Can update Bounty A  
Poster A → Cannot update Bounty B

### **Claim**

A Hunter may create a claim for themselves.

A Poster may approve/reject claims for their own bounties.

Hunter A  
   │  
   └──► Create claim as Hunter A

Poster A  
   │  
   └──► Approve claim on Poster A's bounty

Security should be enforced by Supabase policies, not only by TypeScript.

---

# **31\. Realtime Updates**

The Bounty Board should use Supabase Realtime where appropriate.

Example:

Hunter A posts bounty  
         │  
        ▼  
Supabase Database  
         │  
        ▼  
Realtime Event  
                │  
   ┌────┴────┐  
   ▼                      ▼  
Hunter B          Hunter C  
    │                       │  
   ▼                      ▼  
Board                Board  
updates            updates

This allows users to see changes without manually refreshing the page.

Realtime events may be used for:

* New bounties.  
* Bounty status changes.  
* Claim updates.  
* Notifications.  
* Chat messages.

---

# **32\. Claim Race Conditions**

This is an important implementation requirement.

Consider:

Hunter A                                                 Hunter B  
     │                                                             │  
   │ Claim                                                    │ Claim  
   └──────────┬─────────────┘  
                               ▼  
                        Supabase  
                               │  
             ┌──────┴──────┐  
             ▼                                ▼  
       Request A                   Request B

The application must not accidentally approve both Hunters.

The database/server must ensure only one active claim exists.

Use appropriate:

* Database constraints.  
* Transactions.  
* Atomic updates.  
* Server-side functions where necessary.

The UI is not sufficient protection.

---

# **33\. Repeat Bounties**

A bounty may optionally repeat for several days.

Maximum:

7 days

Example:

Repeat: Yes  
Duration: 5 days

Validation:

if (repeatEnabled && repeatDays \> 7\) {  
  throw new Error("A repeating bounty cannot exceed 7 days.");  
}

The exact behavior of repeated bounties should be implemented so that each scheduled occurrence has a clear lifecycle.

Do not create ambiguous states where one completion accidentally completes every occurrence.

A future implementation may use:

Bounty Template  
      │  
      ├── Occurrence 1  
      ├── Occurrence 2  
      ├── Occurrence 3  
      └── ...

For the initial implementation, keep repeat functionality simple unless product requirements specify otherwise.

---

# **34\. Priority Bounties**

The Bounty Board contains a Priority section.

Priority rules have not yet been fully defined.

Therefore:

* Do not invent complicated priority algorithms.  
* Create the data model so priority can be added.  
* Treat priority as a configurable property.

Possible future field:

priority: boolean;

Or:

priorityScore: number;

Do not make `priorityScore` the source of truth until the product team defines how it is calculated.

---

# **35\. Weekly Bonus Bounties**

The Bounty Board contains a Weekly Bonus section.

The exact rules for determining Weekly Bonus bounties have not yet been defined.

The application should therefore separate:

Normal Bounty  
Priority Bounty  
Weekly Bonus Bounty

without hard-coding an undefined algorithm.

A future implementation might add:

isWeeklyBonus: boolean;

---

# **36\. User Interface Structure**

Recommended main navigation:

┌─────────────────────────┐  
│       BOUNTY APP                                  │  
├─────────────────────────┤  
│                                                                 │  
│      Bounty Board                                     │  
│                                                                 │  
├─────────────────────────┤  
│                                                                 │  
│      My Bounties                                       │  
│                                                                 │  
├─────────────────────────┤  
│                                                                │  
│      Create Bounty                                    │  
│                                                                 │  
├─────────────────────────┤  
│                                                                 │  
│      Notifications                                       │  
│                                                                 │  
├─────────────────────────┤  
│                                                                │  
│      Profile                                                │  
│                                                                │  
└─────────────────────────┘

---

# **37\. My Bounties**

The user needs to distinguish between bounties they posted and bounties they are working on.

Recommended structure:

MY BOUNTIES

Posted  
├── Available  
├── Recruitment  
├── Active  
└── Completed

Claimed  
├── Pending  
├── Active  
└── Completed

This prevents confusion for users who act as both Posters and Hunters.

---

# **38\. Example End-to-End Workflow**

This is the primary workflow the entire application must support.

                   CREATE  
                      │  
                      ▼  
              ┌───────────────┐  
              │ Bounty Posted               │  
              └───────┬───────┘  
                                   │  
                                  ▼  
              ┌───────────────┐  
              │ Bounty Board                │  
              └───────┬───────┘  
                                   │  
                     Hunter discovers  
                                   │  
                                  ▼  
              ┌───────────────┐  
              │ Claim Request              │  
              └───────┬───────┘  
                                   │  
                                  ▼  
              ┌───────────────┐  
              │ Recruitment                   │  
              └───────┬───────┘  
                                   │  
                        Poster decides  
                               /       \\  
                             /          \\  
                      Reject       Approve  
                          │              │  
                         ▼             ▼  
                     Notify       Active Bounty  
                     Hunter           │  
                                          ▼  
                                 Group Chat  
                                           │  
                                          ▼  
                                Task Complete  
                                           │  
                                          ▼  
                               Poster Approves  
                                          │  
                                         ▼  
                       ┌─────────────┐  
                       │  Complete                 │  
                       └──────┬──────┘  
                                             │  
                 ┌────────────┼────────────┐  
                 │         ▼                  ▼            ▼               │  
                 │   \+100 XP      \+100 Gold    Rating           │  
                 │                                                                 │  
                 └────────────┼────────────┘  
                                                  ▼  
                                    Close Group Chat  
                                                  │  
                                                 ▼  
                                            Finished

---

# **39\. Example API/Data Flow**

Example: creating a bounty.

const bounty \= {  
  posterId: user.id,  
  title: "Help move furniture",  
  description: "Help move a couch from the garage into the house.",  
  tags: \["moving\_lifting"\],  
  requiredSkills: \[\],  
  requiredMaterials: \[\],  
  estimatedMinutes: 60,  
  repeatEnabled: false,  
  xpReward: 100,  
  goldReward: 100,  
  status: "posted"  
};

await supabase  
  .from("bounties")  
  .insert(bounty);

The actual implementation must also validate the authenticated user's identity and rely on RLS/server-side authorization.

---

# **40\. Example Claim Flow**

const claim \= {  
  bountyId,  
  hunterId: currentUser.id,  
  status: "pending"  
};

await supabase  
  .from("bounty\_claims")  
  .insert(claim);

Then notify the Poster:

Hunter  
  │  
  ▼  
Create Claim  
  │  
  ▼  
Supabase  
  │  
  ├──► Claim record  
  │  
  └──► Notification for Poster

---

# **41\. Example Approval Flow**

Conceptually:

await approveBountyClaim({  
  claimId,  
  posterId: currentUser.id  
});

The approval operation should verify:

1. The current user owns the bounty.  
2. The claim exists.  
3. The claim is pending.  
4. The bounty is still available.  
5. Another Hunter has not already been approved.  
6. The claim and bounty are updated atomically.  
7. The temporary conversation is created.  
8. Appropriate notifications are sent.

Do not implement these checks only in the UI.

---

# **42\. Example Completion Flow**

Conceptually:

await completeBounty({  
  bountyId,  
  posterId: currentUser.id  
});

The backend should:

Verify Poster  
      │  
      ▼  
Verify Active Claim  
      │  
      ▼  
Mark Claim Complete  
      │  
      ▼  
Mark Bounty Complete  
      │  
      ▼  
Award XP  
      │  
      ▼  
Award Gold  
      │  
      ▼  
Update Hunter Level  
      │  
      ▼  
Create Rating Request  
      │  
      ▼  
Close Conversation  
      │  
      ▼  
Notify Hunter

These operations should be designed to prevent partial completion.

For example, do not allow a bounty to say "completed" while the Hunter did not receive the reward.

---

# **43\. Recommended Service Structure**

Keep business logic separate from UI components.

Example:

src/  
├── components/  
│   ├── BountyCard.ts  
│   ├── BountyBoard.ts  
│   ├── BountyForm.ts  
│   └── HunterProfile.ts  
│  
├── services/  
│   ├── bountyService.ts  
│   ├── claimService.ts  
│   ├── rewardService.ts  
│   ├── notificationService.ts  
│   └── chatService.ts  
│  
├── types/  
│   ├── bounty.ts  
│   ├── user.ts  
│   ├── claim.ts  
│   └── notification.ts  
│  
├── utils/  
│   ├── validation.ts  
│   └── hunterLevel.ts  
│  
└── supabase/  
    └── client.ts

The exact project structure can differ, but business rules should not be scattered throughout UI code.

---

# **44\. TypeScript Types**

Create shared types for important domain objects.

Example:

export interface Bounty {  
  id: string;  
  posterId: string;  
  title: string;  
  description: string;  
  tags: BountyTag\[\];  
  requiredSkills: string\[\];  
  requiredMaterials: string\[\];  
  estimatedMinutes: number;  
  repeatEnabled: boolean;  
  repeatDays?: number;  
  xpReward: number;  
  goldReward: number;  
  status: BountyStatus;  
  createdAt: string;  
  updatedAt: string;  
}

Shared types should be used by both the UI and service layers.

---

# **45\. Error Handling**

Errors should be understandable to users.

Bad:

ERROR 23505

Better:

This bounty is no longer available.

Examples:

"Title cannot exceed 50 characters."

"Description cannot exceed 250 characters."

"This bounty is no longer available."

"You have already requested this bounty."

"You cannot approve your own bounty."

"You are not authorized to perform this action."

Log technical details for developers while showing simple messages to users.

---

# **46\. Important Business Rules**

These rules should be treated as core application requirements.

### **Users**

* Any authenticated user can create a bounty.  
* Any authenticated user can become a Hunter.  
* A user can be both Poster and Hunter.

### **Bounties**

* Title maximum: 50 characters.  
* Description maximum: 250 characters.  
* Estimated time is stored in minutes.  
* Repeat duration cannot exceed 7 days.  
* Default reward is 100 XP \+ 100 Gold.

### **Claims**

* A Hunter can request a bounty.  
* The Poster must approve the Hunter.  
* Rejected claims notify the Hunter.  
* Rejected claims leave the bounty available.  
* An approved bounty leaves the public board.  
* Only one Hunter can actively own a bounty at a time.

### **Completion**

* Poster confirms completion.  
* Hunter receives XP.  
* Hunter receives Gold.  
* Poster can rate the Hunter.  
* Active records are removed from active lists.  
* Temporary chat is closed/deleted.

### **Ratings**

* Rating is 1–5 stars.  
* Ratings are associated with completed bounties.  
* Users should not be able to rate unrelated Hunters.

---

# **47\. Security Rules**

Never trust:

* `userId` supplied by the client.  
* `posterId` supplied by the client.  
* `hunterId` supplied by the client.  
* Reward values supplied by the client.  
* Bounty status supplied by the client.  
* Hunter level supplied by the client.  
* Gold amount supplied by the client.  
* XP amount supplied by the client.

For example, do not allow this:

await supabase  
  .from("profiles")  
  .update({  
    gold: 999999999  
  })  
  .eq("id", userId);

Instead, reward changes should occur through trusted backend logic and database permissions.

---

# **48\. Source of Truth**

Use the database as the source of truth.

The UI is a representation of database state.

Database  
    │  
   ▼  
Application State  
    │  
   ▼  
UI

Do not permanently store important business state only in local storage.

Examples of database-owned state:

* XP  
* Gold  
* Hunter level  
* Bounty status  
* Claim status  
* Ratings  
* Notifications  
* Chat messages

---

# **49\. Testing Requirements**

Important workflows should have tests.

At minimum, test:

### **Bounty Creation**

Valid title → succeeds  
51-character title → fails  
Valid description → succeeds  
251-character description → fails  
Repeat \> 7 days → fails

### **Claiming**

Available bounty → claim succeeds  
Already active bounty → claim fails  
Rejected claim → bounty remains available  
Approved claim → bounty becomes active

### **Completion**

Active bounty → can complete  
Completed bounty → cannot complete again  
Completion → \+100 XP  
Completion → \+100 Gold  
Completion → rating available

### **Levels**

Test XP boundaries:

0 XP      → Level 1  
30 XP     → Level 1  
99 XP     → Level 1  
100 XP    → Level 2  
200 XP    → Level 3  
400 XP    → Level 4  
800 XP    → Level 5  
1600 XP   → Level 6  
3200 XP   → Level 7  
6400 XP   → Level 8  
12800 XP  → Level 9  
20000 XP  → Level 10

### **Concurrency**

Test that two Hunters cannot both become the approved active Hunter for the same bounty.

---

# **50\. Implementation Order**

Build the system in this order unless there is a strong reason to change it.

1\. Supabase setup  
        │  
       ▼  
2\. Authentication  
        │  
       ▼  
3\. User profiles  
        │  
       ▼  
4\. Bounty database schema  
        │  
       ▼  
5\. Bounty creation  
        │  
       ▼  
6\. Bounty Board  
        │  
       ▼  
7\. Search and filtering  
        │  
       ▼  
8\. Claim system  
        │  
       ▼  
9\. Poster approval/rejection  
        │  
       ▼  
10\. Active bounty tracking  
        │  
       ▼  
11\. Completion workflow  
        │  
       ▼  
12\. XP \+ Gold  
        │  
       ▼  
13\. Hunter levels  
        │  
       ▼  
14\. Ratings  
        │  
       ▼  
15\. Notifications  
        │  
       ▼  
16\. Temporary chat  
        │  
       ▼  
17\. Realtime updates  
        │  
       ▼  
18\. Repeat bounties  
        │  
       ▼  
19\. Priority / Weekly Bonus

Do not attempt to build every feature simultaneously.

Get the core lifecycle working first:

Create  
  ↓  
Post  
  ↓  
Claim  
  ↓  
Approve  
  ↓  
Complete  
  ↓  
Reward

---

# **51\. Definition of Done**

The initial version is functional when a user can:

┌─────────────────────────────────────────┐  
│                                     					             │  
│  Create an account                                                                         │  
│          ↓                                                                                             │  
│  Create a bounty                                                                             │  
│          ↓                                                                                             │  
│  See the bounty on the Bounty Board                                             │  
│          ↓                                                                                             │  
│  Use another account to claim it                                                      │  
│          ↓                                                                                             │  
│  Approve the Hunter                                                                        │  
│          ↓                                                                                             │  
│  See the active bounty                                                                    │  
│          ↓                                                                                             │  
│  Communicate through temporary chat                                          │  
│          ↓                                                                                             │  
│  Complete the bounty                                                                     │  
│          ↓                                                                                             │  
│  Award 100 XP \+ 100 Gold                                                             │  
│          ↓                                                                                             │  
│  Update Hunter level                                                                       │  
│          ↓                                                                                             │  
│  Rate the Hunter                                                                              │  
│          ↓                                                                                             │  
│  Close the bounty                                                                            │  
│                                                                                                         │  
└─────────────────────────────────────────┘

The complete workflow should work across both the phone and web application using the same Supabase backend.

---

# **52\. Guidance for AI Coding Agents**

When modifying this project:

1. Read this `AGENTS.md` before making architectural changes.  
2. Preserve existing business rules unless the user explicitly changes them.  
3. Prefer small, focused changes.  
4. Use TypeScript for application logic.  
5. Use Supabase for persistent shared state.  
6. Do not duplicate business logic between phone and web applications unnecessarily.  
7. Validate user input.  
8. Enforce authorization through Supabase/database security.  
9. Treat the database as the source of truth.  
10. Consider concurrent users when changing bounty or claim logic.  
11. Do not invent undefined product rules.  
12. If a requirement is ambiguous, choose the simplest implementation that preserves future flexibility.  
13. Keep user-facing error messages simple.  
14. Keep reusable domain types centralized.  
15. Add tests when changing important business logic.

## **Before changing database behavior**

Ask:

Does this change affect:

□ Bounty status?  
□ Claim status?  
□ User XP?  
□ User Gold?  
□ Hunter level?  
□ Hunter rating?  
□ Authorization?  
□ Multiple simultaneous users?  
□ Notifications?  
□ Temporary chat?

If yes, review the relevant sections of this document before implementing the change.

---

# **53\. Product Rules That Are Not Yet Defined**

The following systems exist conceptually but need additional product decisions before complex implementations are created:

* Exact Priority Bounty algorithm.  
* Exact Weekly Bonus rules.  
* Whether Bounty Posters can cancel active bounties.  
* Whether Hunters can withdraw a claim.  
* Whether rejected Hunters can apply again.  
* Whether a Poster can approve multiple pending Hunters sequentially.  
* Exact behavior of repeat bounties.  
* What happens when a Poster never responds.  
* What happens when a Hunter does not complete a bounty.  
* Whether completed bounties are permanently retained in history.  
* Exact Gold economy.  
* Future uses for Gold.

**Do not invent complicated behavior for these systems without a product requirement.**

Implement the basic data structures so these features can be expanded later.

---

# **54\. Core Mental Model**

The simplest way to understand the entire application is:

USER  
 │  
 ├───────────────┐  
 │                                       │  
 ▼                                     ▼  
POSTER                    HUNTER  
 │                                       │  
 │ creates                          │ finds  
 ▼                                     ▼  
BOUNTY ───────► BOARD  
 │                                        │  
 │                                        │ claims  
 │                                          ▼  
 │                               CLAIM REQUEST  
 │                                           │  
 │    ◄──────────────┤  
 │                                           │  
 │                       approves      │  
 └──────► ACTIVE ◄──────┘  
                          │  
                          │  
                         ▼  
                      TASK  
                          │  
                         ▼  
               COMPLETION  
                          │  
           ┌─────┼─────┐  
           ▼           ▼            ▼  
           XP      GOLD    RATING  
           │              │             │  
            └─────┴─────┘  
                           │  
                          ▼  
                COMPLETED

The central lifecycle is:

**Create → Post → Claim → Approve → Work → Complete → Reward → Rate**

All application features should support this lifecycle. :::

