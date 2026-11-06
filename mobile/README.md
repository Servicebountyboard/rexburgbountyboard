# Mobile application

The client is an Expo SDK 57 application using Expo Router and Supabase.

## Setup

From this directory:

```powershell
Copy-Item .env.example .env
npm.cmd install
npm.cmd start
```

Configure `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` in `.env`.
Only use the project's publishable key; privileged Supabase credentials must
never be bundled into the client.

Complete the [Supabase setup guide](../docs/development/supabase.md) before
testing authentication or service workflows.

## Commands

- `npm.cmd start` starts Expo.
- `npm.cmd run android`, `ios`, or `web` starts a platform target.
- `npm.cmd run typecheck` checks TypeScript.
- `npm.cmd run lint` checks source quality.

## Current limitations

The prototype manually refreshes remote changes and uses fixed query limits. It
does not yet provide pagination, push notifications, structured scheduling,
categories, profile photos, or production monitoring.
