## Table `profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `user_id` | `uuid` | Primary |
| `username` | `varchar` |  Unique |
| `email` | `varchar` |  Nullable |
| `biography` | `text` |  Nullable |
| `total_points` | `int4` |  |
| `average_rating` | `numeric` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `bounty_status`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_status_id` | `int8` | Primary Identity |
| `status_name` | `varchar` |  Unique |

## Table `bounties`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_id` | `int8` | Primary Identity |
| `poster_id` | `uuid` |  |
| `bounty_status_id` | `int8` |  |
| `title` | `varchar` |  |
| `description` | `text` |  |
| `materials` | `text` |  Nullable |
| `estimated_minutes` | `int4` |  Nullable |
| `reward_points` | `int4` |  |
| `location_lat` | `numeric` |  Nullable |
| `location_lng` | `numeric` |  Nullable |
| `address` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `bounty_status_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_status_history_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `bounty_status_id` | `int8` |  |
| `changed_by` | `uuid` |  |
| `changed_at` | `timestamptz` |  |

## Table `bounty_claim_status`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_claim_status_id` | `int8` | Primary Identity |
| `status_name` | `varchar` |  Unique |

## Table `bounty_claims`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_claim_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `hunter_id` | `uuid` |  |
| `bounty_claim_status_id` | `int8` |  |
| `claim_message` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `bounty_claim_status_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `bounty_claim_status_history_id` | `int8` | Primary Identity |
| `bounty_claim_id` | `int8` |  |
| `bounty_claim_status_id` | `int8` |  |
| `changed_by` | `uuid` |  |
| `changed_at` | `timestamptz` |  |

## Table `bounty_submissions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `submission_id` | `int8` | Primary Identity |
| `bounty_claim_id` | `int8` |  |
| `submission_number` | `int4` |  |
| `submission_notes` | `text` |  Nullable |
| `submission_status` | `varchar` |  |
| `submitted_at` | `timestamptz` |  |
| `reviewed_by` | `uuid` |  Nullable |
| `reviewed_at` | `timestamptz` |  Nullable |
| `review_notes` | `text` |  Nullable |

## Table `bounty_messages`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `message_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `sender_id` | `uuid` |  |
| `message_text` | `text` |  |
| `created_at` | `timestamptz` |  |

## Table `reward_transactions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `reward_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `bounty_claim_id` | `int8` |  Unique |
| `user_id` | `uuid` |  |
| `points` | `int4` |  |
| `reason` | `varchar` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `user_ratings`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `rating_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `rater_id` | `uuid` |  |
| `recipient_id` | `uuid` |  |
| `rating` | `int4` |  |
| `review` | `text` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `notification_id` | `int8` | Primary Identity |
| `user_id` | `uuid` |  |
| `bounty_id` | `int8` |  Nullable |
| `notification_type` | `varchar` |  |
| `title` | `varchar` |  |
| `message` | `text` |  |
| `is_read` | `bool` |  |
| `created_at` | `timestamptz` |  |

## Table `bounty_revision_history`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `revision_id` | `int8` | Primary Identity |
| `bounty_id` | `int8` |  |
| `edited_by` | `uuid` |  |
| `revision_number` | `int4` |  |
| `title` | `varchar` |  |
| `description` | `text` |  |
| `materials` | `text` |  Nullable |
| `estimated_minutes` | `int4` |  Nullable |
| `reward_points` | `int4` |  Nullable |
| `address` | `varchar` |  Nullable |
| `edited_at` | `timestamptz` |  |

