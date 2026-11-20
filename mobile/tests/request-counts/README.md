# Offline request-count tests

From `mobile`, run `npm.cmd run test:requests` (Windows) or `npm run test:requests`.

Open `comparison.md` for the comparison table. `latest.json` contains endpoint counts for tooling. `baseline.json` is the fixed initial measurement: commit it and do not update it on each run. Commit reports when reviewing an optimization so Git preserves the history.

The runner transpiles and executes the actual `live-store.tsx` and `live-model.ts` using the project's installed TypeScript. It injects an in-memory Supabase fake and a minimal state-hook harness. It never imports the real Supabase client, reads `.env`, or permits network modules. No additional packages are required.

Scenarios cover three successful actions, their failure paths, opening an already-read notification, a conversation with more than 50 messages and another conversation, and a successful send followed by a failed read. Startup loads are excluded. Assertions check visible message/notification state, one message saved, error handling, latest-50 ordering and filtering, deduplication, and preservation of older messages and unrelated data. A post-save read failure is reported as a successful send with a refresh warning so the composer does not encourage resending. Request counts above the baseline fail; lower counts are allowed when behavior checks pass. Unsupported new imports/query methods fail closed and require deliberate harness support.

These are store-level tests, not rendered React/UI or live database integration tests. The notification scenario measures `act({type:'read'})`, not subsequent navigation or the private-address lookup. The refresh scenario invokes the same shared refresh handler used by the conversation screen. React effect scheduling, duplicate startup effects, RLS, SQL triggers, network timing, and actual recipient delivery are outside scope. Confirm screen handlers still call these entry points after future UI changes.

Fixture response bytes count serialized mocked response data only. They are not measured bandwidth or billed Supabase usage. Each awaited table query and RPC counts as one API request; internal SQL operations are not counted. No percentage of free-plan quota is inferred.

To intentionally establish a new baseline, review the previous report in Git, remove `baseline.json`, and run `node scripts/test-request-counts.cjs --capture-baseline`. Ordinary runs never overwrite the baseline. Behavioral failures exit nonzero before report generation, so any existing report remains from the last passing behavioral run. Request-budget failures produce a comparison report and exit nonzero.
