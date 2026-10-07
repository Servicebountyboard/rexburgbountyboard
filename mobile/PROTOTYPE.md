# Rexburg Bounty Board — tavern prototype

## Run
From this mobile directory: `npx.cmd expo start --clear`, then press `a` with your Android emulator running. Keep the terminal open. Press `r` to reload. On a fresh checkout run `npm.cmd install` first.

## What is implemented
- Parchment, walnut, burgundy, brass and forest palette; serif headings, custom lantern illustration and icons, pinned notice cards and XP seals.
- Bounties, People, My work, Messages and Profile tabs; search and category filtering.
- Bounty creation with validation, preview and separate public location/private meeting details.
- Claims as requests, poster accept/reject, assigned work, completion review, Not Yet feedback, one-time XP and optional sample five-star ratings.
- Sample profile summaries, notifications, private participant conversations and locally saved progress.
- Demo account creation, password-rule validation and simulated verification. Passwords are neither stored nor sent.

## Try a complete journey
1. You start as Bridger. Open the garden bounty and choose Claim bounty, then Send claim request.
2. Choose Demo: review as Maya. Review Bridger's profile and accept him.
3. Choose Demo: continue as Bridger. Meeting details and messages are now available.
4. Request completion, then choose Demo: review as Maya. Try Not Yet with feedback, or approve and award XP.
5. Find the completed bounty in My work → History. Optionally rate it as Maya.
6. Profile → Try the other side switches demo accounts. Bridger also has a library post with an incoming Sarah claim.
7. Profile → Reset local demo data restores the samples after confirmation.

## Scope and decisions
This remains a local proof of concept. Data is persisted through AsyncStorage on this device/browser, not synchronized to teammates or other devices. Notifications and conversations are in-app simulations; no push, email, Google/Apple sign-in, backend or real password authentication is connected. Use fictional contact information.

One account can both hunt and post. The prototype picks one hunter and declines other pending requests; a rejected hunter cannot re-request that same bounty. Cancellation and reassignment are not implemented. New demo bounties use 200 XP. The rating scale, point formula and concurrent-claim behavior are provisional team decisions. Profile history and historical completion rate are sample data; completed counts and XP include new demo completions.

Private details are hidden in the interface until assignment (and always available to the poster), but local data is not a security boundary. Production must enforce authentication, verification, authorization, transitions, contact access, durable messages and idempotent rewards on the server. Initial avatars stand in for profile photos.

## Team code map
- `src/features/tavern/seed.ts`: sample members and notices.
- `model.ts`: pure state transitions, authorization guards, point and rating calculations.
- `store.tsx`: local persistence, hydration and save retry.
- `ui.tsx`: shared components, palette, typography and responsive styles.
- `tabs.tsx`: the five main screens.
- `screens.tsx`: details, posting, approvals, messages, profiles and demo account flow.
- `src/app`: Expo Router route wrappers.

## Checks
- `npm.cmd run typecheck`
- `npm.cmd run lint`
- `npm.cmd run test:workflows` — ten tests covering claim decisions, concurrent claims, contact restrictions, review branches, one-time rewards, ratings, messaging, verification and reset.

The earlier green prototype remains in `src/features/bounty` as unused reference. New navigation uses the tavern feature. Native app icon assets remain the starter icons and can be replaced once the team approves a logo.
