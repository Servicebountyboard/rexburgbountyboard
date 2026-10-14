# Rexburg Bounty Board

An Expo SDK 57 prototype backed by Supabase Auth and the existing tables in `../SUPABASE_SCHEMA.md`.

## Run

1. Run `npm install` in this directory.
2. Copy `.env.example` to `.env` and set your project's URL and publishable key. Never use a service-role key in the app.
3. Complete [Supabase setup](SUPABASE_SETUP.md) before signing up.
4. On this Windows workspace, run `npx.cmd expo start --web --clear` for the quickest browser check. For native testing, run `npx.cmd expo start --clear` and open a development build.

Use `npm run typecheck` and `npm run lint` for local checks.

## Current scope

Email/password signup, email confirmation, sign-in, password reset, bounty posting, claims, poster decisions, completion review, private messages, ratings, points, and in-app notifications are wired to Supabase. Actions require the companion SQL migration. No fictional seed data or demo account switching is loaded.

The current schema has no category, schedule, profile photo, or device push token. The app shows a general Rexburg location and uses `bounties.address` for meeting details restricted to the poster and accepted hunter. New bounties award 200 XP under the SQL rules.

Data refreshes after local actions and when the user taps Refresh. Remote changes require a manual refresh. The board currently fetches at most 200 bounties, the inbox 500 messages, and 100 notifications; add pagination for larger use.
