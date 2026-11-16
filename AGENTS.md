# AGENTS.md — Rexburg Bounty Board

## Mission

Connect the existing Rexburg Bounty Board mobile application directly to the project's existing Supabase backend. The production application must use real authenticated users and real database records. Do not use mock data, seeded demo users, fake bounties, simulated notifications, in-memory persistence, or AsyncStorage as a substitute for backend data.

Preserve the current visual design and user flows wherever practical. Replace the demo data and demo state-management layer with a properly structured Supabase data layer.

## Non-negotiable requirements

1. **Supabase is the source of truth.** All user profiles, bounties, claims, submissions, messages, conversations, friendships, notifications, ratings, rewards, and gold balances/transactions must come from or be persisted to Supabase.
2. **No test data in application code.** Do not create sample users, sample bounties, fake claims, fake conversations, seeded notifications, placeholder ratings, or fallback records.
3. **No silent demo fallback.** If Supabase configuration is missing, the user is signed out, a query fails, or a table is unavailable, show a clear loading, empty, authentication, or error state. Never silently substitute hardcoded data.
4. **Do not modify the database schema casually.** First inspect the existing Supabase schema, constraints, indexes, triggers, functions, grants, and RLS policies. Do not create or alter tables, columns, functions, triggers, or policies unless explicitly requested and the change is documented for approval.
5. **RLS is mandatory.** Use the Supabase anon/publishable key from the client. Never put a service-role key, database password, or other privileged secret in the mobile app, source control, or `EXPO_PUBLIC_*` variables. Never bypass RLS.
6. **Preserve the current design.** Keep the existing screens, components, typography, colors, navigation, and interaction patterns unless a change is necessary to make a real workflow correct.
7. **No fake success.** Only show success after the database operation succeeds. Surface meaningful errors and preserve user input when a request fails.
8. **No destructive cleanup.** Do not delete existing screens, assets, components, or database objects simply because they are not immediately used. Explain proposed removals before making them.

## Repository orientation

The Expo application is in `mobile/`.

Important current files:

- `mobile/src/app/_layout.tsx` — root layout; currently mounts `TavernProvider`.
- `mobile/src/app/(tabs)/_layout.tsx` — tab navigation and current demo-account redirect.
- `mobile/src/features/tavern/store.tsx` — current local/demo state provider using AsyncStorage.
- `mobile/src/features/tavern/model.ts` — current state model and reducer; imports seeded data.
- `mobile/src/features/tavern/seed.ts` — hardcoded demo people and bounties. These must no longer supply application data.
- `mobile/src/features/tavern/tabs.tsx` and `screens.tsx` — main UI screens that currently consume demo state.
- `mobile/src/features/account/` — inspect the current account/authentication screens and replace simulated account switching with Supabase Auth.
- `mobile/src/features/bounty/store.tsx` — contains another hardcoded bounty/person store. Determine whether it is still referenced. Do not leave two competing sources of truth.
- `mobile/src/features/tavern/ui.tsx` — shared visual components; preserve styling while wiring real data.

The active app currently uses the `tavern` feature provider. Trace imports and route usage before changing architecture. Consolidate duplicated data access rather than building a second parallel store.

## Step 1 — Inspect the actual Supabase backend before coding

Use the connected Supabase project or the project's existing documented configuration to inspect:

- Actual table and column names and data types.
- Primary keys, foreign keys, unique constraints, defaults, and check constraints.
- Existing views, RPC functions, triggers, and storage buckets.
- RLS enabled state and every policy, including `USING` and `WITH CHECK`.
- Grants for `anon` and `authenticated`.
- Existing status lookup values in `bounty_status` and `bounty_claim_status`.

The known public tables from the supplied project schema are:

- `profiles`
- `bounties`
- `bounty_status`
- `bounty_status_history`
- `bounty_claim_status`
- `bounty_claims`
- `bounty_claim_status_history`
- `bounty_submissions`
- `bounty_messages`
- `reward_transactions`
- `user_ratings`
- `notifications`
- `bounty_revision_history`
- `bounty_tags`
- `service_tags`
- `profile_service_tags`
- `conversations`
- `conversation_participants`
- `direct_messages`
- `message_attachments`
- `friend_relationships`
- `gold_transactions`

The supplied schema explicitly defines these columns:

### `profiles`

- `user_id` (UUID; primary key; references `auth.users(id)`)
- `username` (unique, required)
- `email`
- `biography`
- `total_points` (required, default 0)
- `average_rating` (required, default 0)
- `created_at`
- `updated_at`

### `bounties`

- `bounty_id` (identity primary key)
- `poster_id` (references `profiles.user_id`)
- `bounty_status_id` (references `bounty_status.bounty_status_id`)
- `title`
- `description`
- `materials`
- `estimated_minutes`
- `reward_points`
- `location_lat`
- `location_lng`
- `address`
- `created_at`
- `updated_at`

Do not assume that the remaining tables have particular columns. Introspect their real definitions before implementing queries or inserts. Do not guess field names based on UI labels.

## Project-specific Supabase configuration

Use these exact project settings when configuring the mobile app:

- Supabase project URL: `https://hnqqbclzrxypukgmdajx.supabase.co`
- Supabase publishable key: `sb_publishable_js00Fw7YT6lH0dC3lG2ddw_b866pqBe`

For the Expo app, configure them locally in `mobile/.env.local` using the existing variable convention:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://hnqqbclzrxypukgmdajx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_js00Fw7YT6lH0dC3lG2ddw_b866pqBe
```

Treat the `sb_publishable_...` value as a client-side publishable key. It may be used by the mobile client, but it does not replace authentication or Row Level Security. Never put a Supabase service-role key or database password in the app. Keep `mobile/.env.local` out of source control; `.env.example` must contain variable names only, with no real values. Do not print the key in logs or expose it in application UI.

## Step 2 — Add Supabase client configuration

1. Check the Expo SDK version and use a Supabase JS client compatible with the installed React Native/Expo environment.
2. Install dependencies using the Expo-compatible package workflow where applicable.
3. Create one shared Supabase client module, for example `mobile/src/lib/supabase.ts`.
4. Read configuration from:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` (or the project's current Supabase publishable key, if that is the configured convention).
5. Add a `.env.example` containing variable names only and ensure real `.env` files are ignored by Git.
6. Validate configuration at startup. If it is absent, show a clear setup/configuration error; do not load demo data.
7. Configure persistent Supabase Auth sessions for React Native using the supported storage integration and appropriate URL/session handling for the installed Expo SDK.
8. Never log access tokens, refresh tokens, passwords, full authorization headers, or other secrets.

Do not ask the user to paste secrets into source files or chat. Do not invent project URL or keys.

## Step 3 — Replace demo authentication

Use Supabase Auth for:

- Sign up.
- Sign in.
- Sign out.
- Session restoration on app launch.
- Password reset/recovery if supported by the current account UI.
- Auth state changes.
- Loading and error states.

Use `auth.users.id` as the identity for the corresponding `profiles.user_id`.

Remove the demo account selector and all account-switching behavior. The signed-in user must always be the authenticated Supabase user. Do not allow a user to impersonate another account through UI state.

After authentication, fetch the current user's profile from `profiles`. If profile creation is required, follow the actual existing database trigger/policy/design. Do not invent a client-side profile bootstrap that conflicts with existing triggers or constraints. If a profile is missing, display a recoverable setup state and report the issue clearly.

## Step 4 — Build a real data-access layer

Organize Supabase operations by feature rather than placing all queries inside screen components. A suggested structure is:

```text
mobile/src/
  lib/
    supabase.ts
    auth.ts
    errors.ts
  features/
    auth/
      auth-provider.tsx
      auth-repository.ts
    profiles/
      profile-repository.ts
    bounty/
      bounty-repository.ts
      claim-repository.ts
      submission-repository.ts
    messaging/
      conversation-repository.ts
      message-repository.ts
      friendship-repository.ts
    notifications/
      notification-repository.ts
    rewards/
      reward-repository.ts
    ratings/
      rating-repository.ts
```

Adapt this to the existing project structure rather than creating redundant modules.

Requirements:

- Select explicit columns; avoid `select('*')` in routine application queries.
- Filter and paginate server-side. Do not download entire tables and filter everything on the device.
- Use typed database models generated from the actual Supabase schema when practical.
- Keep database row types separate from UI view models. Map actual database fields into UI-friendly values in one place.
- Centralize error handling and return typed results.
- Avoid duplicate requests and stale state.
- Use realtime subscriptions only where they materially improve the feature; subscribe to the signed-in user's authorized records and clean up subscriptions when screens/providers unmount.
- Do not assume a request succeeded until Supabase confirms it.
- Never expose private meeting/contact details before the backend's authorization rules permit access.

## Step 5 — Wire every existing feature to real tables

Implement the existing UI against the real schema. Before each operation, inspect the table definition and RLS policy and confirm that the signed-in user is allowed to perform it.

### Bounty board

- Load real bounties from `bounties`.
- Resolve the status through `bounty_status`; do not hardcode identity values for status rows.
- Display poster information from `profiles`.
- Use `bounty_tags` and related tag tables only after inspecting their actual relationships.
- Search, category filtering, and pagination should query the backend where appropriate.
- Create and edit bounties using real rows and the authenticated `poster_id`.
- Preserve the existing location fields and only show information the user is authorized to see.

### Claims and work

- Load claims from `bounty_claims`.
- Resolve claim statuses through `bounty_claim_status`.
- Use `bounty_claim_status_history` and `bounty_status_history` as designed by the existing backend.
- A hunter submits a claim; the poster accepts or rejects it according to existing policies.
- Completion requests and reviews must use `bounty_submissions`.
- Do not simulate claim approval by changing local state.
- Do not let the client award points directly by updating `profiles.total_points`.

### Rewards and gold

The product rule is **Gold is earned through bounties**.

- Treat `reward_transactions` and `gold_transactions` according to their actual schema and existing business logic.
- Inspect existing database functions/triggers before implementing reward issuance.
- Award points/gold only through the existing trusted database mechanism (such as an approved RPC or trigger) if one exists.
- Do not allow the client to mint, transfer, or arbitrarily change gold/points.
- Prevent duplicate reward issuance using the database's existing uniqueness/idempotency protections.
- If the required trusted backend operation does not exist, stop and report the gap. Propose a migration/RPC for approval rather than implementing insecure client-side balance changes.

### Profiles and services

- Load public profile information from `profiles`.
- The product rule is **Profile visibility is public**. Implement public profile reads consistent with the existing RLS policy.
- Only allow users to edit their own profile fields, as enforced by RLS.
- Load service tags and profile-service relationships from `service_tags` and `profile_service_tags`.
- Calculate statistics from authoritative records or existing backend functions. Do not display fabricated ratings, completion counts, XP, or success rates.

### Direct messaging and friendships

The product rule is **Direct messaging is friends-only**.

- Use `friend_relationships` to determine friendship state.
- Use `conversations`, `conversation_participants`, `direct_messages`, and `message_attachments` according to their actual foreign keys and policies.
- Only allow direct conversations and message access when the existing backend rules confirm the users are friends/authorized participants.
- Do not implement a client-only friendship check as the security boundary. RLS/database policies must enforce access.
- Do not expose conversations by downloading all rows and filtering locally.
- Use realtime message updates only after confirming RLS and subscription behavior.

### Bounty-specific messaging

- Use `bounty_messages` only for the bounty discussion workflow defined by the schema and RLS.
- Respect the existing accepted-participant rule.
- Keep bounty discussions separate from friends-only direct messages.

### Notifications

- Load notifications for the authenticated user from `notifications`.
- Mark notifications read through a permitted database update.
- Create notifications through existing triggers/functions or an authorized workflow. Do not fabricate local notifications after an action.
- If notifications are generated by database triggers, do not create duplicates in the client.

### Ratings

- Load and submit real ratings through `user_ratings`.
- Enforce one rating per permitted relationship if the database already defines that constraint or policy.
- Do not fabricate rating averages. Use the existing `profiles.average_rating` update mechanism if present; otherwise report that a trusted aggregate mechanism is missing instead of trusting client writes.

### Attachments

- Inspect the configured Supabase Storage buckets and `message_attachments` schema.
- Use only existing buckets/policies unless a new bucket is approved.
- Respect file size/type limits and access rules. Do not expose private object URLs publicly unless the bucket is intentionally public.

## Step 6 — Remove demo and local-persistence behavior

Search the entire mobile app for:

- `seed.ts`
- `initialState`
- `seedBounties`
- `seedPeople`
- `claim-seed`
- `notice-seed`
- hardcoded sample names, email addresses, bounty titles, ratings, XP, and balances
- demo account selectors or `switch` actions
- demo labels and simulated notifications/messages
- AsyncStorage persistence of application/domain state
- duplicate hardcoded stores such as `features/bounty/store.tsx`

Remove these from the live application data path. Keep AsyncStorage only if it is genuinely needed for non-authoritative preferences or Supabase's supported auth-session persistence. It must not be used as a fallback database.

Do not delete design assets or UI components merely because they were used in the prototype. Replace sample content with honest empty states, skeletons, and error states.

Remove or rewrite demo-only tests/scripts so they do not imply the production app uses simulated records. Add tests for repository behavior and workflow logic using mocked Supabase client responses in the test environment only; test mocks must never be bundled or used as runtime application data.

## Step 7 — UI state and user experience

Every screen must handle:

- Initial loading.
- Authenticated and unauthenticated states.
- Empty results (a real empty table/query result).
- Query or mutation errors.
- Retry.
- Refresh after mutations.
- Pagination where a list can grow.
- Offline/network failure without pretending writes succeeded.

Use language that accurately describes the backend state. For example, do not say “claim submitted” until the insert succeeds. Do not show “reward earned” until the trusted reward operation has completed and the resulting record/balance can be confirmed.

## Step 8 — Security and data integrity

- All client requests must use the authenticated Supabase session.
- Treat RLS as the enforcement boundary, not UI conditions.
- Never use a service-role key in the client.
- Never trust `user_id`, `poster_id`, `hunter_id`, sender IDs, reward amounts, or status IDs supplied by the client without server-side authorization/validation.
- Do not expose email addresses or private contact details on public profiles unless the existing design and policy explicitly allow it.
- Do not expose precise bounty meeting details to unauthorized users.
- Do not let users edit other users' profiles, claims, messages, ratings, or transactions.
- Do not let clients directly write authoritative reward balances.
- Do not weaken or disable RLS to make the UI work.
- If an operation fails with an RLS error, inspect and report the policy mismatch. Do not work around it with privileged credentials.

## Step 9 — Environment and setup documentation

Document how to configure the app locally without including real credentials:

```bash
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Explain where to obtain these values in the Supabase project dashboard. Confirm `.env` is gitignored. Ensure no actual secret values are committed.

If the project uses a different key name or a newer publishable-key convention, use one consistent convention and document it.

## Step 10 — Validation before completion

Run from `mobile/`:

```bash
npx expo lint
npx tsc --noEmit
```

Run the available Expo Doctor command appropriate for the installed SDK. Add and run relevant tests for authentication, repository queries, and critical bounty workflows.

Also manually verify:

1. App starts with valid Supabase configuration and no seeded records.
2. App shows a configuration error when Supabase environment variables are absent.
3. A signed-out user is sent to real sign-in/sign-up.
4. Signing in restores the correct Supabase session.
5. A user sees only bounties allowed by RLS.
6. A user can create a bounty with their own authenticated user ID.
7. Claim request, poster decision, submission, review, and reward workflows persist to the correct tables.
8. Direct messaging is available only to friends and authorized participants.
9. Public profile visibility works without exposing private fields.
10. Notifications and ratings reflect actual database records.
11. A failed query or mutation never falls back to demo data or displays a false success.

Do not claim that live Supabase integration is verified unless the app has actually been run with valid project configuration and the relevant workflows have been tested against the connected Supabase project.

## Implementation order

Work in this order and keep each stage type-safe:

1. Inspect schema, policies, functions, triggers, and storage.
2. Add Supabase client and environment validation.
3. Replace demo account switching with Supabase Auth.
4. Replace the active provider/store with authenticated profile and bounty queries.
5. Wire bounty creation, claim requests, decisions, submissions, and status history.
6. Wire trusted rewards/gold operations.
7. Wire profiles and service tags.
8. Wire friends, conversations, direct messages, and attachments.
9. Wire notifications and ratings.
10. Remove unused demo stores and seed data from the runtime path.
11. Run lint, typecheck, tests, and end-to-end workflow checks.

At the end of each stage, summarize changed files, database objects used, tests run, and any blockers requiring user approval. If the live Supabase schema does not support a required workflow, stop at that boundary and explain the exact missing database capability. Do not invent schema details or weaken security to complete the UI.
