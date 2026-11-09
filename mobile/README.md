# Mobile application

The client is an Expo SDK 57 application using Expo Router.

## Setup

From this directory:

```powershell
npm.cmd install
npm.cmd start
```

## Commands

- `npm.cmd start` starts Expo.
- `npm.cmd run start:clear` starts Expo with a clean Metro cache.
- `npm.cmd run android`, `ios`, or `web` starts a platform target.
- `npm.cmd run export:web` verifies the production web bundle.
- `npm.cmd run check:expo` checks SDK dependency compatibility.
- `npm.cmd run doctor` runs the complete Expo project diagnostic.
- `npm.cmd run typecheck` checks TypeScript.
- `npm.cmd run lint` checks source quality.

## Database status

All authentication, persistence, queries, and remote mutations are intentionally
disconnected while the application is cleaned up. `src/lib/supabase.ts` is a
dormant client factory and `.env.example` documents the two public values needed
to reconnect later. The running application does not import the client.
