# Rexburg Bounty Board

Rexburg Bounty Board is an Expo/React Native application for coordinating
one-on-one acts of service in Rexburg, Idaho.

## Repository structure

```text
mobile/                Expo application
```

## Local development

Prerequisites: Node.js and npm.

```powershell
cd mobile
npm.cmd install
npm.cmd start
```

## Quality checks

Run these from `mobile/` before opening a pull request:

```powershell
npm.cmd run typecheck
npm.cmd run lint
```

## Project status

This repository is undergoing a production-readiness rebuild. Authentication,
persistence, and database-backed workflows are intentionally disconnected. A
dormant client factory and environment template remain under `mobile/` for the
future data layer; the running app does not import or initialize them.
