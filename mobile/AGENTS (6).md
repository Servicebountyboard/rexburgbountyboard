# Rexburg Bounty Board --- Agent Instructions

These instructions apply to the entire repository. The Expo application
lives in `mobile/`. The more specific `mobile/AGENTS.md` contains
additional Expo SDK and React Native rules; follow both files. When
instructions conflict, follow the more specific mobile instructions
unless this file establishes a project-wide security or product
requirement.

## 1. Product goal

Build a polished, mobile-first Rexburg Bounty Board application for
coordinating local acts of service. The app should feel like a refined,
approachable medieval bounty board---not a fantasy game interface.
Prioritize clarity, trust, accessibility, and fast task discovery.

The supplied visual references are the design source of truth: - Dark
charcoal/black interface with warm gold accents is the default theme. -
A warm cream/parchment interface with brown and gold accents is the
light theme. - Both themes must be supported. Do not implement dark-only
or light-only styling. - Use the supplied polished mockups to guide
spacing, hierarchy, card treatment, typography, icon treatment,
navigation, and component proportions. - Use the supplied hand-drawn
sketches to understand screen purpose and interactions. Where a sketch
conflicts with the polished mockups on visual treatment, use the mockup
for appearance and the sketch for intended behavior. - Do not invent a
substantially different visual direction.

## 2. Repository facts and constraints

-   `mobile/` is the Expo application.
-   The app uses Expo Router, React Native, TypeScript, and React 19.
-   The package manifest currently declares Expo SDK `~57.0.32`.
-   Supabase JS is installed and a dormant client factory exists at
    `mobile/src/lib/supabase.ts`.
-   The repository was intentionally disconnected from authentication
    and persistence during its rebuild. Do not assume the dormant client
    is already safe to initialize or that any screen is already
    database-backed.
-   The repository initially contains a minimal placeholder route.
    Inspect the current tree before editing; do not assume files or
    components exist.
-   Keep route files in `mobile/src/app/`. Put reusable components,
    hooks, services, repositories, types, and theme code outside the
    route directory.
-   Preserve the existing `mobile/AGENTS.md` guidance. Consult versioned
    Expo documentation before changing Expo/React Native APIs or adding
    native dependencies.

## 3. Design system

### 3.1 Theme behavior

Implement a centralized theme system with: - Dark as the initial/default
theme. - Light as an available user-selectable theme. - A single source
of truth for colors, typography, spacing, radii, borders, elevation, and
icon sizing. - Theme preference persistence using an appropriate
existing dependency or an Expo-compatible solution. Do not add a
dependency without checking SDK compatibility. - No scattered hard-coded
color values in feature components.

Suggested semantic tokens (tune against the supplied references; do not
treat these as permission to ignore the references):

Dark: - App background: near-black charcoal. - Surface/card: layered
charcoal and dark brown. - Primary text: warm white. - Secondary text:
muted warm gray. - Accent: antique/brushed gold. - Dividers: subtle
charcoal/gold-tinted borders. - Inputs: dark inset surfaces with
restrained borders.

Light: - App background: warm cream/parchment. - Surface/card: pale
cream and slightly deeper beige. - Primary text: deep brown/charcoal. -
Secondary text: muted brown-gray. - Accent: antique/brushed gold. -
Dividers: subtle tan borders. - Inputs: light inset surfaces.

Use gold as an accent, not as a fill for every control. Avoid excessive
gradients, glow, ornate decoration, oversized shadows, and visual
clutter. Keep contrast readable in both themes.

### 3.2 Typography and visual hierarchy

-   Use a consistent type scale and line-height system.
-   The brand/title treatment may use a refined serif style if a
    suitable bundled/licensed font is available; body text should remain
    highly readable.
-   Do not add remote font dependencies or assume a font asset exists.
    Inspect assets first.
-   Keep card titles, reward values, metadata, and actions visually
    distinct.
-   Avoid tiny text, especially for metadata and tap targets.

### 3.3 Components

Create reusable, themed components where they provide consistency: - App
header/brand mark - Bottom tab navigation - Search input - Tag filter
control and selected-tag chips - Service-tag selector - Bounty card -
XP/gold reward display - Profile summary and progress bar - Rating
display - Conversation row and message bubble - Modal/sheet/dialog -
Empty, loading, and error states - Buttons, icon buttons, dividers, and
form fields

Do not create abstractions for one-off elements without a clear reuse
case. Keep components focused and typed.

### 3.4 Navigation and screens

The primary bottom navigation has three destinations: 1. Chat 2. Board
3. Profile

The Board is the central discovery screen and is the default landing
destination after authentication. The selected tab should be visually
obvious in both themes.

Build the UI around these screen areas:

**Board** - Branded header and signed-in greeting. - Tag filter entry
point. - Bounty search field. - Scrollable, responsive bounty-card
list/grid appropriate to phone width. - Cards show category/tag, title,
XP reward, location/remote indicator, and due timing when the data
exists. - Include bookmark/save affordance only if the underlying
feature is implemented. Do not fake persistence. - Provide clear
loading, empty, and error states.

**Tag selection** - Show selected tags separately from the complete
service-tag catalog. - Selected tags can be removed. - Service tags use
the icon/color metadata from `service_tags` where available, with safe
fallbacks. - Do not hard-code a second, divergent category catalog in
the UI.

**Bounty details / acceptance** - Show bounty title, description,
requirements/materials, estimated duration, location, tags, poster
information, XP, and gold reward when present. - Provide an
accept/request action that invokes the approved database operation. Do
not directly update claim/status tables from the client. - Preserve any
private-address restriction; do not expose a full address just because a
bounty card is visible. - The sketch describes a details popup with
close and accept actions. Use a modal or bottom sheet that fits the
platform and remains accessible.

**Profile** - Public profile summary: username, avatar, Hunter
level/progress, rating, XP, and gold. - Profile actions: My Bounties, My
Reviews, Stats/History, Account Settings, and Sign Out, as supported by
implemented routes/services. - Hunter level is derived from XP according
to a documented product rule; do not invent a formula silently. If no
formula is established, show XP/progress without claiming a level. -
Public profile data must not include email.

**Chat / conversations** - Friends and Bounties filters/tabs, matching
the supplied mockup. - Conversation list with participant
avatar/initials, username, last-message preview, timestamp, and unread
indicator when available. - Conversation view with messages, sender
identity, timestamps, composer, and optional attachments. - Direct
conversations can only be created between accepted friends. - Bounty
conversations must follow existing bounty participant authorization. -
Do not treat a bounty conversation as a direct-friend conversation or
weaken either rule.

**Settings** - Provide a clear light/dark theme setting. - Sign-out must
use the real authentication flow when authentication is implemented. -
Confirmation dialogs should be used for destructive or consequential
actions.

### 3.5 Interaction and accessibility

-   Use platform-appropriate touch targets (aim for at least 44x44
    points).
-   Support safe areas, keyboard avoidance, scrolling, and smaller phone
    dimensions.
-   Use accessible labels/roles for icon-only controls.
-   Provide visible pressed, focused, disabled, loading, and error
    states.
-   Do not make decorative controls appear interactive.
-   Ensure forms validate input and display actionable errors.
-   Avoid layout changes that cause content to jump when loading.

## 4. Database architecture: feature-owned data access

**The UI must never query Supabase directly.** Screen components and
presentational components must not import the Supabase client or call
`.from()`, `.rpc()`, or storage APIs.

Use this flow:

`Screen -> feature hook -> feature service/repository -> Supabase client -> PostgreSQL`

Each feature owns its data access. A screen should request a
purpose-built view model from its feature hook, not load unrelated
application data.

Suggested organization (adapt to the existing tree rather than blindly
creating duplicates):

``` text
mobile/src/
  app/
    _layout.tsx
    (tabs)/
      _layout.tsx
      board.tsx
      chat.tsx
      profile.tsx
    bounty/
      [bountyId].tsx
    conversation/
      [conversationId].tsx
    settings/
      index.tsx
  components/
    common/
    bounty/
    chat/
    profile/
    tags/
  features/
    auth/
      auth.service.ts
      auth.repository.ts
      auth.types.ts
      useAuth.ts
    bounties/
      bounty.repository.ts
      bounty.service.ts
      bounty.types.ts
      useBounties.ts
      useBountyDetails.ts
    tags/
      tag.repository.ts
      tag.service.ts
      tag.types.ts
      useServiceTags.ts
    profile/
      profile.repository.ts
      profile.service.ts
      profile.types.ts
      useProfile.ts
    friends/
      friends.repository.ts
      friends.service.ts
      friends.types.ts
      useFriends.ts
    conversations/
      conversation.repository.ts
      conversation.service.ts
      conversation.types.ts
      useConversations.ts
      useMessages.ts
    notifications/
    rewards/
  lib/
    supabase.ts
    database.types.ts
  theme/
    colors.ts
    tokens.ts
    ThemeProvider.tsx
  utils/
```

The exact file layout may differ if a clearer convention already exists.
Do not reorganize the whole project just to match this example.

### 4.1 Query rules (mandatory)

-   Never fetch the entire database to populate a screen.
-   Never use unbounded `select('*')` in application queries.
-   Select only the columns the feature needs.
-   Apply filters in PostgreSQL, not after downloading rows.
-   Paginate bounty lists, messages, transaction history, and other
    growing collections.
-   Use deterministic ordering and stable cursor/range pagination.
-   Fetch only the active screen's data. Do not eagerly fetch profile,
    messages, notifications, and all bounties together.
-   Avoid N+1 requests. Use a targeted join/select or a purpose-built
    database function when it is secure and demonstrably more efficient.
-   Do not create broad joins that return unnecessary nested records.
-   Debounce search input and query only the necessary bounty fields.
-   Cache only where useful; invalidate/refetch after relevant
    mutations.
-   Handle loading, empty, and error states independently per feature.
-   Do not silently fall back to a full-table query when a targeted
    query fails.
-   Do not log secrets, tokens, private messages, email addresses, or
    private addresses.

Examples of the expected query shape:

``` ts
// Good: explicit fields, server-side filter, bounded page.
supabase
  .from('bounties')
  .select('bounty_id,title,description,reward_points,gold_reward,created_at')
  .eq('bounty_status_id', postedStatusId)
  .order('created_at', { ascending: false })
  .range(from, to);

// Bad: unrestricted full-table read.
supabase.from('bounties').select('*');
```

Do not copy the example blindly: confirm the actual status identifiers
and deployed schema before using it.

### 4.2 Feature-to-table ownership

Keep queries within these feature boundaries. A feature may read a
related table when the relationship is required for its view, but it
must request only the relevant rows and columns.

  -------------------------------------------------------------------------------------
  Feature / screen        Primary tables                 Rules
  ----------------------- ------------------------------ ------------------------------
  Board and search        `bounties`, `bounty_status`,   Query only visible/eligible
                          `bounty_tags`, `service_tags`, bounties; paginate; do not
                          `profiles`                     expose private addresses.

  Bounty details          `bounties`, `bounty_status`,   Fetch one bounty by ID and
                          `bounty_tags`, `service_tags`, only relevant claim/profile
                          `profiles`, `bounty_claims`,   details. Use the approved
                          `bounty_claim_status`          claim RPC for requesting a
                                                         bounty.

  My Bounties             `bounties`, `bounty_claims`,   Filter to the signed-in user
                          `bounty_claim_status`,         as poster or hunter; paginate.
                          `bounty_submissions`           

  Tags                    `service_tags`, `bounty_tags`, Load the small service-tag
                          `profile_service_tags`         catalog once as needed; query
                                                         associations for the current
                                                         bounty/user only.

  Public profile          `profiles`, `user_ratings`     Public fields only; never
                                                         select or display email.

  Profile rewards/history `reward_transactions`,         Filter by the current user or
                          `gold_transactions`,           selected bounty; paginate.
                          `bounty_status_history`,       Respect RLS.
                          `bounty_revision_history`      

  Friends                 `friend_relationships`,        Query only relationships
                          `profiles`                     involving the current user;
                                                         use RPCs for
                                                         request/respond/block/remove
                                                         operations.

  Conversations list      `conversations`,               Return only conversations
                          `conversation_participants`,   where current user
                          `direct_messages`, `profiles`  participates; use bounded
                                                         last-message previews.

  Conversation detail     `direct_messages`,             Query one conversation and a
                          `conversation_participants`,   page of messages; verify
                          `profiles`,                    participant access.
                          `message_attachments`          

  Bounty chat             `bounty_messages`, `bounties`, Only approved poster/hunter
                          `profiles`,                    participants; use
                          `message_attachments`          `send_bounty_message()` for
                                                         sending.

  Notifications           `notifications`, optionally    Filter by current user;
                          `bounties`                     paginate; use
                                                         `mark_notification_read()` for
                                                         marking read.

  Reviews                 `user_ratings`, `profiles`     Query only ratings for the
                                                         requested profile or current
                                                         user's relevant reviews.
  -------------------------------------------------------------------------------------

Original schema tables also include: - `bounty_status_history` -
`bounty_claim_status_history` - `bounty_revision_history` -
`reward_transactions`

Do not query history tables unless the relevant history screen or
workflow needs them.

### 4.3 Database source of truth and schema drift

The user supplied an original PostgreSQL schema containing 13 tables. A
follow-up migration added nine tables: - `service_tags` -
`bounty_tags` - `profile_service_tags` - `friend_relationships` -
`conversations` - `conversation_participants` - `direct_messages` -
`gold_transactions` - `message_attachments`

The follow-up migration also added `profiles.avatar_path` and
`profiles.total_gold`. The later security design proposed
`bounties.gold_reward` and additional RPCs/policies.

**Do not assume every proposed migration or SQL change has been
successfully applied.** Before wiring a feature to a new column, policy,
or RPC: 1. Inspect the repository's migration files and generated
database types. 2. Confirm the deployed Supabase schema and function
signatures with the user-provided current schema or verification output.
3. If the app depends on a migration that is not present/applied, stop
and report the exact missing requirement. Do not silently invent a
substitute. 4. Do not create or alter tables, columns, policies,
triggers, indexes, or RPCs without explicit user approval.

The schema document in `docs/development/database_schema.md` may be
stale relative to the supplied updated schema. Update
documentation/types only after confirming the deployed schema.

### 4.4 Existing RPCs and business logic

The database already contains public RPC wrappers for important bounty
workflows. Preserve and use them rather than writing direct table
updates:

-   `create_bounty(p_title, p_description, p_materials, p_estimated_minutes, p_address)`
-   `request_claim(p_bounty_id)`
-   `decide_claim(p_claim_id, p_accept)`
-   `submit_work(p_bounty_id)`
-   `review_work(p_bounty_id, p_approve, p_feedback)`
-   `send_bounty_message(p_bounty_id, p_text)`
-   `rate_hunter(p_bounty_id, p_rating, p_review)`
-   `get_private_address(p_bounty_id)`
-   `mark_notification_read(p_notification_id)`

The new friend/conversation RPCs proposed in the security migration
are: - `send_friend_request(p_friend_id)` -
`respond_to_friend_request(p_friendship_id, p_accept)` -
`manage_friend_relationship(p_friend_id, p_action)` -
`create_direct_conversation(p_friend_id)` -
`send_direct_message(p_conversation_id, p_text)`

Use these only after confirming they exist in the deployed database and
their policies have been tested. Never assume a function is available
because it appears in this instruction file.

### 4.5 Authentication and Supabase client

-   Keep the Supabase client in `mobile/src/lib/supabase.ts` (or the
    existing canonical client module).
-   Read configuration from Expo public environment variables, such as
    `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
-   Never put a service-role key or other privileged secret in the
    mobile app.
-   Do not initialize Supabase until configuration and auth/session
    behavior are deliberately implemented.
-   Use the Supabase client with the authenticated user's session so RLS
    applies.
-   Do not duplicate auth state in multiple unrelated stores.
-   Do not build fake sign-in, sign-out, user identity, or persisted
    data and present it as real functionality.
-   If backend configuration is unavailable, use clearly identified
    development fixtures behind a small repository interface. Keep
    fixtures separate from production services and never mix fixture
    data with live results.

### 4.6 Storage and attachments

The proposed storage buckets are: - `profile-images` -
`message-attachments`

Do not assume the buckets or Storage policies exist. Confirm them before
implementing upload/download flows. Store object paths/references in the
database, not binary files. Use private access for message attachments
and enforce participant access. Do not expose private storage objects
through permanent public URLs.

## 5. XP, gold, and Hunter level

-   `profiles.total_points` is the XP/points total.
-   `profiles.total_gold` is the gold balance after the relevant
    migration is confirmed.
-   `reward_transactions` is the XP reward ledger.
-   `gold_transactions` is the gold ledger.
-   The supplied original schema has `bounties.reward_points`; the
    proposed follow-up adds `bounties.gold_reward`.
-   Gold should be awarded only by the trusted database completion
    workflow, not by a client-side balance update.
-   Never update `profiles.total_gold` directly from the frontend.
-   Hunter level is intended to be derived from XP, but the exact level
    thresholds have not been specified. Do not invent thresholds. Until
    the product rule is supplied, display XP and a neutral progress
    treatment without asserting a level number.

## 6. Implementation workflow

Work incrementally and preserve a runnable app.

1.  Inspect the current source tree, routes, package scripts, and
    existing `mobile/AGENTS.md`.
2.  Identify the current app entry route and navigation structure before
    replacing anything.
3.  Establish theme tokens and the shared app shell first.
4.  Implement the three primary tabs (Chat, Board, Profile) and their
    navigation.
5.  Build reusable visual components against the supplied references.
6.  Add each feature's hook/service/repository boundary before
    connecting its screen to live data.
7.  Connect one feature at a time, starting with the Board, then Bounty
    Details, Profile, Friends/Chat, and supporting features.
8.  Verify loading, empty, error, and success states for every connected
    feature.
9.  Do not change unrelated screens or remove existing functionality
    while completing a scoped task.
10. Keep changes focused. Do not rewrite the entire app when a small
    targeted change will satisfy the requirement.

For each implementation task, state: - What files are being changed. -
Which screen/feature is in scope. - Which database tables/RPCs are
involved. - What is intentionally out of scope. - How the change will be
tested.

## 7. Quality and completion requirements

Before declaring a task complete: - Run `npm run typecheck` from
`mobile/`. - Run `npm run lint` from `mobile/`. - Run relevant Expo
checks if dependencies/configuration changed. - Test the target screen
on a narrow phone viewport and both themes. - Verify navigation and back
behavior. - Verify loading, empty, and error states. - Confirm no screen
imports the Supabase client directly. - Confirm queries are
feature-scoped, filtered, bounded, and select explicit fields. - Confirm
no secrets or privileged keys are committed. - Report any test that
could not be run and why; never claim an unrun test passed.

## 8. Explicit non-goals and guardrails

-   Do not redesign the product away from the supplied mockups.
-   Do not introduce a desktop-first layout.
-   Do not add a map, geolocation workflow, payment system, admin
    console, or unrelated feature unless separately requested.
-   Do not add fake friends, messages, bounties, XP, gold, reviews, or
    notifications to production behavior.
-   Do not invent schema, security rules, Hunter-level thresholds, or
    reward rules.
-   Do not make database-wide queries to simplify frontend
    implementation.
-   Do not bypass RLS or use service-role credentials in the app.
-   Do not make unapproved schema or migration changes.
-   Do not replace a working feature with a placeholder during unrelated
    UI work.

## 9. Definition of done for the UI rebuild

The UI rebuild is ready for the next integration stage when: - The app
has a coherent, polished implementation of the supplied dark and light
visual designs. - Dark is the default and the theme can be changed in
Settings. - The three-tab navigation (Chat, Board, Profile) works. -
Board cards, tag selection, profile summary, and conversation list match
the supplied design intent. - Bounty detail and conversation screens
have clear interaction paths. - Components are reusable and consistently
themed. - Each feature has an isolated data access boundary. - No screen
performs direct Supabase queries. - Live data is only enabled for
verified schema/RPC/policy functionality; unimplemented backend features
are clearly identified rather than faked. - Typecheck and lint pass, and
the implementation has been manually checked on mobile layouts.
