# Supabase integration plan

## Implementation status (2026-10-14)

The Expo app now uses Supabase Auth and RPCs for its live screens. The local demo mode and its old reducer were removed. Preflight confirmed an empty project with existing uppercase status rows, no policies, and an Auth signup trigger that inserts profiles. The SQL migration in `supabase/migrations/20261013000000_connect_prototype.sql` was applied to the hosted project. Postflight confirmed nine RPCs, RLS on all 13 app tables, and no direct client read of private email, address, or coordinates or direct bounty writes. An anonymous API bounty read returned `permission denied`. The user signed in on Expo Go and posted a bounty that appeared under My work > Posting > Current. The confirmation email first redirected to an unavailable `localhost:3000` page, but the account was confirmed and could sign in. The app now displays its Expo Go callback URL on the verification screen for allowlisting. A second signup failed with "Database error saving new user" because the user reused the username from a mistaken-email signup. A retry with a new username then hit Supabase's built-in email rate limit. The user temporarily disabled Confirm Email, created the second test account, and restored the setting. The hunter submitted a claim and the poster accepted it; the bounty became active and displayed the assigned hunter. The poster sent a private message that the hunter received. The hunter submitted completed work, the poster approved it, and the hunter's profile displayed 200 XP. The poster rated the hunter, and that rating appeared on the hunter's profile. The app now explains both signup errors. Notification behavior was not conclusively checked; further edge-case testing remains. See [`docs/development/supabase.md`](../development/supabase.md) for setup and smoke-test steps.

## Agreed scope

- Replace the local demo with real Supabase data and email/password authentication. Do not migrate fictional seed accounts, bounties, or AsyncStorage records.
- Keep the **existing tables and columns** in [the schema reference](database-schema-reference.md). Database grants, row-level security (RLS), indexes, triggers, and functions may be added. Do not add product columns or tables.
- Keep useful existing presentation. If a feature cannot be represented by this schema, leave a clearly labeled, inert placeholder or remove its action from the live flow. Never show a simulated success for a real action.
- First release includes in-app notifications and messages. Device push, social login, profile photos, category filtering, and structured scheduling are deferred because the schema has no durable representation for them.

## Baseline before implementation

The production app is `mobile/` (Expo SDK 57, React Native, Expo Router). Its active screens are `src/features/tavern/{tabs,screens,ui}.tsx`, routed through `src/app/`. `src/features/tavern/store.tsx` loads and saves **the entire** `State` from/to AsyncStorage key `rexburg-tavern-v2`; `model.ts` makes every state transition in the client; `seed.ts` supplies fictional users and bounties. `src/features/account/screens.tsx` is a separate UI-only account preview, while `src/app/demo-accounts.tsx` provides account switching. The older `src/features/bounty` implementation is unused. There is no Supabase client, API layer, SQL migration, or generated database type in the repository.

This means the current authorization checks protect only the UI, and changes on one device never reach another. The ten workflow tests in `mobile/scripts/test-tavern.cjs` verify the local reducer, not database authorization or concurrency.

## Mapping and limits

| Current app concept | Existing Supabase representation | Live behavior |
| --- | --- | --- |
| Demo member, selected `currentId`, verification | Supabase Auth user UUID; `profiles.user_id`, `username`, `email`, `biography` | Session identity comes only from Auth. `username` is the public display name; `email` stays private. Verification comes from Auth, not a mutable profile flag. Remove account switching. |
| Profile XP and rating | `profiles.total_points`, `average_rating`; `reward_transactions`, `user_ratings` | Server maintains totals/average; client reads them. Display an initial avatar based on username. Existing `name`, role, skills, completion rate and profile photo have no backing columns; remove their search/claims or keep explicitly static decoration. Completed count may be derived from reward transactions. |
| Bounty | `bounties`, `bounty_status`, `bounty_status_history` | Map title, description, materials, `estimated_minutes`, reward points, address, poster, status, timestamps. Generate IDs in DB. Use a fixed “Rexburg” public location label; do not pretend it came from an address field. |
| Category, `when`, distance, visual symbol/color | No dedicated fields | Remove category filter and schedule/distance claims. Search title/description; choose a neutral local card style. If retained visually, mark these as static placeholders and never require them on the live create form. |
| Exact meeting details and contact | `bounties.address`; no contact column | Treat `address` as **private exact meeting details**. Exclude it (and precise coordinates) from ordinary bounty reads. Fetch it only for poster or accepted hunter through a guarded server read. Coordinate contact through messages; the old separate contact field cannot be saved. |
| Claim and assignment | `bounty_claims`, `bounty_claim_status`, both history tables | Request is pending; poster accepts/rejects. Derive assigned hunter from the single accepted claim. Existing schema has no `hunter_id` on bounties. |
| Completion and “Not Yet” | `bounty_submissions` plus bounty status/history | A submission moves bounty to review. “Not Yet” records review notes, returns bounty to active, and permits submission number 2, 3, etc. Approval completes the bounty. |
| Messages | `bounty_messages` | One private thread per bounty, readable/writable only by poster and accepted hunter after acceptance. Derive recipient from bounty plus accepted claim. |
| Rating | `user_ratings` | Poster can rate the accepted hunter once after completion. Server recomputes `profiles.average_rating`. |
| XP | `reward_transactions` (unique `bounty_claim_id`) | On completion approval, insert one reward for accepted claim and update `profiles.total_points` atomically. Never award in the client. |
| Notices | `notifications` | Durable per-user in-app notifications; own read/unread state. No push claim without device-token storage and delivery infrastructure. |
| Bounty editing | `bounty_revision_history` | No edit UI exists; retain table unused until edit rules are specified. |

The schema document lists column names and types but not foreign keys, `NOT NULL` rules, defaults, current status rows, RLS, or grants. The first implementation task must inspect the **actual project** before writing migrations or assuming any of those exist.

## Backend design, without changing table shapes

1. **Baseline the live database.** Get the Supabase project reference and a development/staging project. Use the Supabase CLI to capture the existing schema as a migration, then inspect columns, constraints, foreign keys, indexes, policies, grants, status values, triggers, and functions. Reconcile discrepancies against `database-schema-reference.md`. Do not reset the hosted database. Add subsequent versioned migrations for security logic only.
2. **Seed/confirm status vocabulary.** Map stable names for bounty `open`, `active`, `review`, `completed`; claim `pending`, `accepted`, `rejected`; submission `submitted`, `needs_work`, `approved`. If production already uses different names, map to them rather than silently duplicating rows. Confirm all required timestamps/defaults and the `profiles.user_id` link to `auth.users.id`.
3. **Create profiles with Auth.** On signup, use an Auth-user trigger (or equally reliable server path) to create `profiles` with unique username, private email, starting points, and timestamps. Handle username conflicts and failures visibly. Use `email_confirmed_at` or the confirmed session server-side for post/claim/message actions; do not trust a client flag. Keep Auth email and `profiles.email` synchronized or stop reading the duplicate profile email in the app.
4. **Restrict data access.** Enable RLS on every exposed table and set explicit grants. Public/signed-in reads of `profiles` get only safe columns; never expose `profiles.email`. General bounty queries must omit and lack grant to select `address`, `location_lat`, and `location_lng`. A guarded server read returns `address` only if `auth.uid()` is the poster or the accepted hunter. Even a client asking for `select('*')` must fail to reveal those columns. Histories and transactions should be read-only to clients; notification and private conversation reads must be scoped by identity. Avoid a view that bypasses RLS.
5. **Put transitions on the server.** Implement narrowly callable database routines for `create_bounty`, `request_claim`, `decide_claim`, `submit_work`, `review_work`, and `rate_hunter`; use an equally guarded write for `send_message`. A function must derive actor from `auth.uid()`, validate current state, lock the affected bounty/claim row, make all related writes in one transaction, and return the updated record. Include status-history and notification inserts in the same operation. If privileged functions are needed, keep their definer logic in a non-exposed schema, pin `search_path`, and grant execution narrowly through an exposed invoker wrapper. Revoke direct client writes to server-owned status, history, points, and rating aggregates.
6. **Enforce race and replay rules.** One claim per hunter/bounty; at most one accepted claim per bounty; only the poster accepts; accepting rejects other pending claims; only the accepted hunter submits; only the poster reviews; only one submission awaits review; unique `(bounty_claim_id, submission_number)`; one rating per completed bounty/recipient/rater; and one reward per accepted claim. Add indexes/constraints where compatible with existing data, and keep row locks plus checks inside the routines. Existing unique `reward_transactions.bounty_claim_id` is the final duplicate-award guard. Decide whether new bounties use the prototype’s fixed 200 XP; until confirmed, put any fixed rule in the server, not client input.
7. **Maintain derived values.** On approved completion, insert the reward transaction and increment/recompute `profiles.total_points` within the same transaction. On rating, recompute `profiles.average_rating` from `user_ratings` server-side. Do not calculate an authoritative balance from client seed values. History entries should record each accepted state change with actor and time.

### Access matrix for review

| Resource | Read | Write |
| --- | --- | --- |
| Public profile fields | Signed-in users (or public if explicitly desired) | Profile owner may edit only username/biography through a guarded path; no direct points/rating edits |
| Private profile email | Owner via Auth; privileged server only in `profiles` | Auth/profile-sync process |
| Bounty public fields | Signed-in users for open bounties; poster and involved hunter for their history | Poster creates through server routine; status changes only through transitions |
| Bounty address/coordinates | Poster and accepted hunter only | Poster at creation; later edit only if an edit workflow is designed |
| Claims, submissions, their histories | Claimant and related poster as appropriate | Transitions only; history append by server |
| Messages | Poster and accepted hunter | Those two participants after acceptance |
| Ratings | Related parties (aggregated score public) | Poster once after completion |
| Reward transactions | Recipient and authorized audit role | Completion routine only |
| Notifications | Recipient only | Server creates; recipient marks own as read |

## Mobile build order

1. **Connection and types.** In `mobile/`, use `npx expo install` for the Supabase client and SDK-compatible dependencies. Add `src/lib/supabase.ts`, generated `database.types.ts`, and an `EXPO_PUBLIC_SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` example file. Keep service-role/database secrets off the device. Fix `mobile/.gitignore`: it ignores `.env*.local` but **not** plain `.env`. The publishable key is expected to be visible in the bundle, so RLS is mandatory.
2. **Session and account screens.** Replace UI simulations in `src/features/account/screens.tsx` with real signup, sign-in, resend confirmation, forgot/reset password, and sign-out. Persist only the Auth session on device; subscribe to Auth changes and restore session before route decisions. Configure `app.json` scheme plus Supabase redirect allowlist, build an Expo Router callback route for confirmation/reset links, and test native and web redirects. Replace the current tabs-only `currentId` redirect with session guards covering `/create`, `/bounty/[id]`, `/conversation`, notifications, and profile too.
3. **Read models.** Replace the `TavernProvider` global seed state with typed repository/query functions and explicit loading, empty, error, and retry states. Load board (server filtered/paginated open bounties), detail, profile, own hunting/posting, claims, submissions, messages, and notifications. Convert bigint identity IDs to route-safe strings at the UI boundary and back to validated numeric IDs for queries. Revalidate on screen focus; add scoped Realtime subscriptions for messages and notifications if desired for immediate cross-device updates.
4. **Wire mutations in workflow order.** Create bounty, request claim, accept/reject, message, submit work, review/return, rate, mark notice read. Disable repeat taps while a request runs; preserve form input on failure; update/refetch from server response before showing success. Remove `act()` and `model.ts` as sources of truth; retain only pure formatting or client-side validation helpers.
5. **Remove demo behavior.** Delete/retire account switch links, local reset, simulated verify, demo replies/reviews, `seed.ts`, old AsyncStorage state save, and local-only notices. Replace demo wording. Keep unsupported visual placeholders inert and labeled. Keep the older unused `src/features/bounty` code out of the live navigation; remove it when the replacement is verified.

## Verification and release gates

- **Database tests:** run migrations from a fresh local database; test RLS and column grants with unauthenticated, unrelated user, poster, pending claimant, rejected claimant, and accepted hunter identities. Attempt direct API writes and `select('*')` to prove sensitive fields/status/rewards cannot be changed or read improperly.
- **Workflow tests:** two devices/accounts claim concurrently; simultaneous acceptance yields one hunter; rejected claimant loses private access; repeated approval gives one reward; Not Yet retains assignment and allows resubmission; duplicate ratings fail; notifications and messages appear across accounts; read status persists. Test signed-out and unverified users.
- **App checks:** Android, iOS, and web signup/confirmation/reset links, session restoration and sign-out, route guards, slow/offline/retry states, and private data after account switching on the same device. Run `npm run typecheck`, `npm run lint`, and new integration tests. Existing reducer tests are a behavior reference but must be replaced with tests against the database logic.
- **Deployment:** apply reviewed migrations to staging, generate types, connect staging app, pass cross-user tests, then apply migrations to production and update app environment. Start with a small pilot; monitor Auth failures, RLS denials, transition errors, duplicate attempts, and messaging. Have a rollback for app code and additive migrations; avoid destructive schema resets.

## Decisions and prerequisites

1. **Project access:** project reference, publishable key, URL, and a way to inspect live schema/policies/status rows; use a separate development/staging project if possible. No service-role key belongs in this repository or app bundle.
2. **Points policy:** confirm the server rule for `reward_points` on new bounties (temporary 200 XP is the prototype behavior). Existing bounty values can be read as stored.
3. **Address entry:** the create form may store an exact address, but the public board will show only a fixed Rexburg label. Coordinate further details in participant messages; there is no separate public place name or contact field. If a guarded private-address endpoint is not approved after audit, leave exact-address UI disabled rather than exposing it.
4. **Product placeholders:** decide later whether category, schedule, skills, role, photo, public location, push notifications, or cancellation/reassignment justify future schema changes. They are not prerequisites for the core connected workflow.

## References

- [Supabase React Native Auth quickstart](https://supabase.com/docs/guides/auth/quickstarts/react-native)
- [Supabase RLS and grants](https://supabase.com/docs/guides/database/postgres/row-level-security), [database-function security](https://supabase.com/docs/guides/database/functions)
- [Supabase existing-project migration workflow](https://supabase.com/docs/guides/local-development/cli-workflows), [generated TypeScript types](https://supabase.com/docs/guides/api/rest/generating-types)
- [Supabase mobile deep linking](https://supabase.com/docs/guides/auth/native-mobile-deep-linking), [Expo Router protected routes](https://docs.expo.dev/router/advanced/protected/)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/), [Expo SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/)
