# Offline request-count comparison

Actual store functions with mocked Supabase responses. Startup excluded. Payload bytes are JSON fixture data only, not billed egress. Notification navigation/address lookup, React lifecycle, RLS and server SQL are not tested.

| Action | Baseline requests | Current requests | Reduction | Fixture response bytes | Store behavior |
|---|---:|---:|---:|---:|---|
| Send a message | 11 | 2 | 81.8% | 229 | PASS |
| Open a notification (mark-read handler) | 11 | 1 | 90.9% | 4 | PASS |
| Refresh messages | 10 | 10 | 0.0% | 869 | PASS |

Three success checks, three failure checks, an already-read notification check, large-conversation filtering/merge checks, and a saved-message/read-failure check passed. Already-read click: 1 requests.

## Requests by endpoint

| Endpoint | Send message | Open notification | Refresh messages |
|---|---:|---:|---:|
| bounties | 0 | 0 | 1 |
| bounty_claim_status | 0 | 0 | 1 |
| bounty_claims | 0 | 0 | 1 |
| bounty_messages | 1 | 0 | 1 |
| bounty_status | 0 | 0 | 1 |
| bounty_submissions | 0 | 0 | 1 |
| mark_notification_read | 0 | 1 | 0 |
| notifications | 0 | 0 | 1 |
| profiles | 0 | 0 | 1 |
| reward_transactions | 0 | 0 | 1 |
| send_bounty_message | 1 | 0 | 0 |
| user_ratings | 0 | 0 | 1 |
