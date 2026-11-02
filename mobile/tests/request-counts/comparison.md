# Offline request-count comparison

Actual store functions with mocked Supabase responses. Startup excluded. Payload bytes are JSON fixture data only, not billed egress. Notification navigation/address lookup, React lifecycle, RLS and server SQL are not tested.

| Action | Baseline requests | Current requests | Reduction | Fixture response bytes | Store behavior |
|---|---:|---:|---:|---:|---|
| Send a message | 11 | 11 | 0.0% | 869 | PASS |
| Open a notification (mark-read handler) | 11 | 11 | 0.0% | 757 | PASS |
| Refresh messages | 10 | 10 | 0.0% | 869 | PASS |

Three success checks, three failure checks, and an already-read notification check passed. Already-read click: 11 requests.

## Requests by endpoint

| Endpoint | Send message | Open notification | Refresh messages |
|---|---:|---:|---:|
| bounties | 1 | 1 | 1 |
| bounty_claim_status | 1 | 1 | 1 |
| bounty_claims | 1 | 1 | 1 |
| bounty_messages | 1 | 1 | 1 |
| bounty_status | 1 | 1 | 1 |
| bounty_submissions | 1 | 1 | 1 |
| mark_notification_read | 0 | 1 | 0 |
| notifications | 1 | 1 | 1 |
| profiles | 1 | 1 | 1 |
| reward_transactions | 1 | 1 | 1 |
| send_bounty_message | 1 | 0 | 0 |
| user_ratings | 1 | 1 | 1 |
