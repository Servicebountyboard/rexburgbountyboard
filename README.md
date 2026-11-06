# Rexburg Bounty Board

Rexburg Bounty Board is an Expo/React Native application for coordinating
one-on-one acts of service in Rexburg, Idaho. Supabase provides authentication,
data storage, row-level authorization, and workflow operations.

## Repository structure

```text
mobile/                Expo application
supabase/migrations/   Versioned database changes
supabase/scripts/      Manual database inspection and verification scripts
docs/architecture/     Architecture notes and historical implementation plans
docs/development/      Developer setup guides
```

## Local development

Prerequisites: Node.js, npm, and access to a Supabase development project.

```powershell
cd mobile
Copy-Item .env.example .env
npm.cmd install
npm.cmd start
```

Set the two public Supabase values in `mobile/.env`. Never place a service-role
key or database password in the mobile application.

## Quality checks

Run these from `mobile/` before opening a pull request:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

See [Supabase setup](docs/development/supabase.md) for backend configuration and
[the schema reference](docs/architecture/database-schema-reference.md) for the
currently documented data model.

## Project status

This repository is undergoing a production-readiness rebuild. The existing app
is a working prototype; its interfaces and database migrations should not yet be
treated as stable.
