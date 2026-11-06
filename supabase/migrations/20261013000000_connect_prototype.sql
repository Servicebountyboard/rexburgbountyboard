-- Applies to the tables documented in docs/architecture/database-schema-reference.md.
-- Review supabase/scripts/preflight.sql first. Run in development before production.

begin;

do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
        'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
        'bounty_submissions', 'bounty_messages', 'reward_transactions',
        'user_ratings', 'notifications', 'bounty_revision_history'
      )
      and policyname not like 'rbb_%'
  ) then
    raise exception 'Existing non-RBB policies need review before this migration can safely run';
  end if;
end $$;

-- The project's status rows already exist. Do not add a parallel vocabulary.
do $$
begin
  if (select count(*) from public.bounty_status where status_name in ('POSTED', 'IN_PROGRESS', 'SUBMITTED', 'COMPLETED')) <> 4
    or (select count(*) from public.bounty_claim_status where status_name in ('PENDING', 'ASSIGNED', 'REJECTED')) <> 3
  then raise exception 'Required existing status rows are missing'; end if;
end $$;

create schema if not exists rbb_private;
revoke all on schema rbb_private from public;
grant usage on schema rbb_private to authenticated;

create or replace function rbb_private.is_poster(p_bounty_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bounties b
    where b.bounty_id = p_bounty_id and b.poster_id = (select auth.uid())
  );
$$;

create or replace function rbb_private.is_claimant(p_bounty_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bounty_claims c
    where c.bounty_id = p_bounty_id and c.hunter_id = (select auth.uid())
  );
$$;

create or replace function rbb_private.is_accepted_participant(p_bounty_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.bounties b
    join public.bounty_claims c on c.bounty_id = b.bounty_id
    join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
    where b.bounty_id = p_bounty_id and s.status_name = 'ASSIGNED'
      and (b.poster_id = (select auth.uid()) or c.hunter_id = (select auth.uid()))
  );
$$;

create or replace function rbb_private.can_access_claim(p_claim_id bigint)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.bounty_claims c
    join public.bounties b on b.bounty_id = c.bounty_id
    where c.bounty_claim_id = p_claim_id
      and (c.hunter_id = (select auth.uid()) or b.poster_id = (select auth.uid()))
  );
$$;

create or replace function rbb_private.email_confirmed()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
  );
$$;

-- Reuse the existing on_auth_user_created trigger / public.handle_new_user().
-- It inserts profiles from the username in Auth metadata. Its table reference
-- is qualified; pin the definer search path without changing its behavior.
alter function public.handle_new_user() set search_path = '';

-- Restrict exposed columns. The address and coordinates require guarded RPC access.
revoke all on table public.profiles, public.bounty_status, public.bounties,
  public.bounty_status_history, public.bounty_claim_status, public.bounty_claims,
  public.bounty_claim_status_history, public.bounty_submissions, public.bounty_messages,
  public.reward_transactions, public.user_ratings, public.notifications,
  public.bounty_revision_history from public, anon, authenticated;

-- Clear any older column-level grants explicitly before granting the safe reads.
do $$
declare v_table record;
begin
  for v_table in
    select c.relname, string_agg(format('%I', a.attname), ', ' order by a.attnum) as columns
    from pg_class c
    join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
    where c.relnamespace = 'public'::regnamespace
      and c.relname in (
        'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
        'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
        'bounty_submissions', 'bounty_messages', 'reward_transactions',
        'user_ratings', 'notifications', 'bounty_revision_history'
      )
    group by c.relname
  loop
    execute format('revoke all (%s) on table public.%I from public, anon, authenticated', v_table.columns, v_table.relname);
  end loop;
end $$;

grant select (user_id, username, biography, total_points, average_rating) on public.profiles to authenticated;
grant select on public.bounty_status, public.bounty_claim_status to authenticated;
grant select (bounty_id, poster_id, bounty_status_id, title, description, materials,
  estimated_minutes, reward_points, created_at, updated_at) on public.bounties to authenticated;
grant select (bounty_claim_id, bounty_id, hunter_id, bounty_claim_status_id, created_at, updated_at)
  on public.bounty_claims to authenticated;
grant select (bounty_claim_id, submission_status, review_notes, submission_number)
  on public.bounty_submissions to authenticated;
grant select (message_id, bounty_id, sender_id, message_text, created_at)
  on public.bounty_messages to authenticated;
grant select (bounty_id, rater_id, recipient_id, rating, review) on public.user_ratings to authenticated;
grant select (user_id, bounty_claim_id) on public.reward_transactions to authenticated;
grant select (notification_id, user_id, bounty_id, title, message, is_read, created_at)
  on public.notifications to authenticated;

alter table public.profiles enable row level security;
alter table public.bounty_status enable row level security;
alter table public.bounties enable row level security;
alter table public.bounty_status_history enable row level security;
alter table public.bounty_claim_status enable row level security;
alter table public.bounty_claims enable row level security;
alter table public.bounty_claim_status_history enable row level security;
alter table public.bounty_submissions enable row level security;
alter table public.bounty_messages enable row level security;
alter table public.reward_transactions enable row level security;
alter table public.user_ratings enable row level security;
alter table public.notifications enable row level security;
alter table public.bounty_revision_history enable row level security;

drop policy if exists rbb_profiles_read on public.profiles;
create policy rbb_profiles_read on public.profiles for select to authenticated using (true);
drop policy if exists rbb_bounty_status_read on public.bounty_status;
create policy rbb_bounty_status_read on public.bounty_status for select to authenticated using (true);
drop policy if exists rbb_claim_status_read on public.bounty_claim_status;
create policy rbb_claim_status_read on public.bounty_claim_status for select to authenticated using (true);
drop policy if exists rbb_bounties_read on public.bounties;
create policy rbb_bounties_read on public.bounties for select to authenticated using (
  poster_id = (select auth.uid())
  or bounty_status_id = (select bounty_status_id from public.bounty_status where status_name = 'POSTED')
  or rbb_private.is_claimant(bounty_id)
);
drop policy if exists rbb_claims_read on public.bounty_claims;
create policy rbb_claims_read on public.bounty_claims for select to authenticated using (
  hunter_id = (select auth.uid()) or rbb_private.is_poster(bounty_id)
);
drop policy if exists rbb_submissions_read on public.bounty_submissions;
create policy rbb_submissions_read on public.bounty_submissions for select to authenticated using (
  rbb_private.can_access_claim(bounty_claim_id)
);
drop policy if exists rbb_messages_read on public.bounty_messages;
create policy rbb_messages_read on public.bounty_messages for select to authenticated using (
  rbb_private.is_accepted_participant(bounty_id)
);
drop policy if exists rbb_ratings_read on public.user_ratings;
create policy rbb_ratings_read on public.user_ratings for select to authenticated using (
  rater_id = (select auth.uid()) or recipient_id = (select auth.uid())
);
drop policy if exists rbb_rewards_read on public.reward_transactions;
create policy rbb_rewards_read on public.reward_transactions for select to authenticated using (
  user_id = (select auth.uid())
);
drop policy if exists rbb_notifications_read on public.notifications;
create policy rbb_notifications_read on public.notifications for select to authenticated using (
  user_id = (select auth.uid())
);

-- Existing data must be deduplicated before adding these guards.
-- The first preflight confirms unique constraints on (bounty_id, hunter_id)
-- and (bounty_claim_id, submission_number); avoid duplicate indexes.
create unique index if not exists rbb_one_rating_per_bounty_recipient
  on public.user_ratings (bounty_id, recipient_id);

do $$
declare v_accepted_id bigint;
begin
  select bounty_claim_status_id into v_accepted_id
  from public.bounty_claim_status where status_name = 'ASSIGNED';
  execute format('create unique index if not exists rbb_one_accepted_claim_per_bounty on public.bounty_claims (bounty_id) where bounty_claim_status_id = %s', v_accepted_id);
end $$;

create index if not exists rbb_bounties_status_created on public.bounties (bounty_status_id, created_at desc);
create index if not exists rbb_messages_bounty_created on public.bounty_messages (bounty_id, created_at);
create index if not exists rbb_notifications_user_created on public.notifications (user_id, created_at desc);

create or replace function rbb_private.create_bounty(
  p_title text, p_description text, p_materials text,
  p_estimated_minutes integer, p_address text
) returns bigint language plpgsql security definer set search_path = '' as $$
declare v_id bigint; v_status bigint; v_actor uuid := auth.uid();
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before posting'; end if;
  if length(trim(coalesce(p_title, ''))) < 5 or length(trim(coalesce(p_description, ''))) < 20
    or p_estimated_minutes is null or p_estimated_minutes < 1 or p_estimated_minutes > 1440
    or length(coalesce(p_title, '')) > 100 or length(coalesce(p_description, '')) > 2000
    or length(coalesce(p_materials, '')) > 1000 or length(coalesce(p_address, '')) > 300
  then raise exception 'Invalid bounty details'; end if;
  select bounty_status_id into v_status from public.bounty_status where status_name = 'POSTED';
  if v_status is null then raise exception 'Open bounty status is missing'; end if;
  insert into public.bounties (
    poster_id, bounty_status_id, title, description, materials, estimated_minutes,
    reward_points, location_lat, location_lng, address, created_at, updated_at
  ) values (
    v_actor, v_status, trim(p_title), trim(p_description), nullif(trim(coalesce(p_materials, '')), ''),
    p_estimated_minutes, 200, null, null, nullif(trim(coalesce(p_address, '')), ''), now(), now()
  ) returning bounty_id into v_id;
  insert into public.bounty_status_history (bounty_id, bounty_status_id, changed_by, changed_at)
  values (v_id, v_status, v_actor, now());
  return v_id;
end;
$$;
create or replace function public.create_bounty(
  p_title text, p_description text, p_materials text,
  p_estimated_minutes integer, p_address text
) returns bigint language sql security invoker set search_path = '' as $$
  select rbb_private.create_bounty(p_title, p_description, p_materials, p_estimated_minutes, p_address);
$$;

create or replace function rbb_private.request_claim(p_bounty_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_bounty public.bounties%rowtype; v_pending bigint; v_open bigint; v_id bigint; v_actor uuid := auth.uid();
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before claiming'; end if;
  select * into v_bounty from public.bounties where bounty_id = p_bounty_id for update;
  if not found then raise exception 'Bounty not found'; end if;
  select bounty_status_id into v_open from public.bounty_status where status_name = 'POSTED';
  if v_bounty.poster_id = v_actor or v_bounty.bounty_status_id <> v_open then raise exception 'Bounty is not available to claim'; end if;
  if exists (select 1 from public.bounty_claims where bounty_id = p_bounty_id and hunter_id = v_actor) then raise exception 'You already requested this bounty'; end if;
  select bounty_claim_status_id into v_pending from public.bounty_claim_status where status_name = 'PENDING';
  insert into public.bounty_claims (bounty_id, hunter_id, bounty_claim_status_id, claim_message, created_at, updated_at)
  values (p_bounty_id, v_actor, v_pending, null, now(), now()) returning bounty_claim_id into v_id;
  insert into public.bounty_claim_status_history (bounty_claim_id, bounty_claim_status_id, changed_by, changed_at)
  values (v_id, v_pending, v_actor, now());
  insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
  values (v_bounty.poster_id, p_bounty_id, 'claim_requested', 'New claim request', v_bounty.title, false, now());
  return v_id;
end;
$$;
create or replace function public.request_claim(p_bounty_id bigint)
returns bigint language sql security invoker set search_path = '' as $$
  select rbb_private.request_claim(p_bounty_id);
$$;

create or replace function rbb_private.decide_claim(p_claim_id bigint, p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_bounty public.bounties%rowtype; v_claim public.bounty_claims%rowtype;
  v_other public.bounty_claims%rowtype; v_pending bigint; v_accepted bigint;
  v_rejected bigint; v_open bigint; v_active bigint; v_actor uuid := auth.uid();
  v_bounty_id bigint;
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before deciding'; end if;
  select bounty_id into v_bounty_id from public.bounty_claims where bounty_claim_id = p_claim_id;
  if v_bounty_id is null then raise exception 'Claim not found'; end if;
  select * into v_bounty from public.bounties where bounty_id = v_bounty_id for update;
  select * into v_claim from public.bounty_claims where bounty_claim_id = p_claim_id for update;
  select bounty_claim_status_id into v_pending from public.bounty_claim_status where status_name = 'PENDING';
  select bounty_claim_status_id into v_accepted from public.bounty_claim_status where status_name = 'ASSIGNED';
  select bounty_claim_status_id into v_rejected from public.bounty_claim_status where status_name = 'REJECTED';
  select bounty_status_id into v_open from public.bounty_status where status_name = 'POSTED';
  select bounty_status_id into v_active from public.bounty_status where status_name = 'IN_PROGRESS';
  if v_bounty.poster_id <> v_actor or v_claim.bounty_claim_status_id <> v_pending or v_bounty.bounty_status_id <> v_open
  then raise exception 'This claim is no longer awaiting your decision'; end if;
  update public.bounty_claims set bounty_claim_status_id = case when p_accept then v_accepted else v_rejected end,
    updated_at = now() where bounty_claim_id = p_claim_id;
  insert into public.bounty_claim_status_history (bounty_claim_id, bounty_claim_status_id, changed_by, changed_at)
  values (p_claim_id, case when p_accept then v_accepted else v_rejected end, v_actor, now());
  if p_accept then
    for v_other in select * from public.bounty_claims
      where bounty_id = v_bounty_id and bounty_claim_id <> p_claim_id and bounty_claim_status_id = v_pending
    loop
      update public.bounty_claims set bounty_claim_status_id = v_rejected, updated_at = now()
      where bounty_claim_id = v_other.bounty_claim_id;
      insert into public.bounty_claim_status_history (bounty_claim_id, bounty_claim_status_id, changed_by, changed_at)
      values (v_other.bounty_claim_id, v_rejected, v_actor, now());
      insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
      values (v_other.hunter_id, v_bounty_id, 'claim_rejected', 'Another hunter was selected', v_bounty.title, false, now());
    end loop;
    update public.bounties set bounty_status_id = v_active, updated_at = now() where bounty_id = v_bounty_id;
    insert into public.bounty_status_history (bounty_id, bounty_status_id, changed_by, changed_at)
    values (v_bounty_id, v_active, v_actor, now());
  end if;
  insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
  values (v_claim.hunter_id, v_bounty_id, case when p_accept then 'claim_accepted' else 'claim_rejected' end,
    case when p_accept then 'Your claim was approved' else 'Your claim was declined' end,
    v_bounty.title, false, now());
end;
$$;
create or replace function public.decide_claim(p_claim_id bigint, p_accept boolean)
returns void language sql security invoker set search_path = '' as $$
  select rbb_private.decide_claim(p_claim_id, p_accept);
$$;

create or replace function rbb_private.submit_work(p_bounty_id bigint)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_bounty public.bounties%rowtype; v_claim public.bounty_claims%rowtype;
  v_active bigint; v_review bigint; v_id bigint; v_number integer; v_actor uuid := auth.uid();
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before submitting'; end if;
  select * into v_bounty from public.bounties where bounty_id = p_bounty_id for update;
  if not found then raise exception 'Bounty not found'; end if;
  select bounty_status_id into v_active from public.bounty_status where status_name = 'IN_PROGRESS';
  select bounty_status_id into v_review from public.bounty_status where status_name = 'SUBMITTED';
  select c.* into v_claim from public.bounty_claims c
    join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
    where c.bounty_id = p_bounty_id and s.status_name = 'ASSIGNED';
  if v_claim.hunter_id is distinct from v_actor or v_bounty.bounty_status_id <> v_active
  then raise exception 'Only the assigned hunter may submit active work'; end if;
  select coalesce(max(submission_number), 0) + 1 into v_number
  from public.bounty_submissions where bounty_claim_id = v_claim.bounty_claim_id;
  insert into public.bounty_submissions (
    bounty_claim_id, submission_number, submission_notes, submission_status,
    submitted_at, reviewed_by, reviewed_at, review_notes
  ) values (v_claim.bounty_claim_id, v_number, null, 'SUBMITTED', now(), null, null, null)
  returning submission_id into v_id;
  update public.bounties set bounty_status_id = v_review, updated_at = now() where bounty_id = p_bounty_id;
  insert into public.bounty_status_history (bounty_id, bounty_status_id, changed_by, changed_at)
  values (p_bounty_id, v_review, v_actor, now());
  insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
  values (v_bounty.poster_id, p_bounty_id, 'work_submitted', 'Work is ready for review', v_bounty.title, false, now());
  return v_id;
end;
$$;
create or replace function public.submit_work(p_bounty_id bigint)
returns bigint language sql security invoker set search_path = '' as $$
  select rbb_private.submit_work(p_bounty_id);
$$;

create or replace function rbb_private.review_work(p_bounty_id bigint, p_approve boolean, p_feedback text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_bounty public.bounties%rowtype; v_claim public.bounty_claims%rowtype;
  v_submission public.bounty_submissions%rowtype; v_review bigint; v_next bigint;
  v_actor uuid := auth.uid();
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before reviewing'; end if;
  if p_approve is null then raise exception 'A review decision is required'; end if;
  select * into v_bounty from public.bounties where bounty_id = p_bounty_id for update;
  if not found then raise exception 'Bounty not found'; end if;
  select bounty_status_id into v_review from public.bounty_status where status_name = 'SUBMITTED';
  if v_bounty.poster_id <> v_actor or v_bounty.bounty_status_id <> v_review
  then raise exception 'Only the poster can review submitted work'; end if;
  select c.* into v_claim from public.bounty_claims c
    join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
    where c.bounty_id = p_bounty_id and s.status_name = 'ASSIGNED';
  if v_claim.bounty_claim_id is null then raise exception 'Accepted claim not found'; end if;
  select * into v_submission from public.bounty_submissions
    where bounty_claim_id = v_claim.bounty_claim_id and submission_status = 'SUBMITTED'
    order by submission_number desc limit 1 for update;
  if v_submission.submission_id is null then raise exception 'Submission is not awaiting review'; end if;
  if not p_approve and length(trim(coalesce(p_feedback, ''))) = 0 then raise exception 'Give the hunter a clear next step'; end if;
  if length(coalesce(p_feedback, '')) > 2000 then raise exception 'Feedback is too long'; end if;
  select bounty_status_id into v_next from public.bounty_status
    where status_name = case when p_approve then 'COMPLETED' else 'IN_PROGRESS' end;
  update public.bounty_submissions set
    submission_status = case when p_approve then 'APPROVED' else 'CHANGES_REQUESTED' end,
    reviewed_by = v_actor, reviewed_at = now(),
    review_notes = case when p_approve then null else trim(p_feedback) end
  where submission_id = v_submission.submission_id;
  update public.bounties set bounty_status_id = v_next, updated_at = now() where bounty_id = p_bounty_id;
  insert into public.bounty_status_history (bounty_id, bounty_status_id, changed_by, changed_at)
  values (p_bounty_id, v_next, v_actor, now());
  if p_approve then
    insert into public.reward_transactions (bounty_id, bounty_claim_id, user_id, points, reason, created_at)
    values (p_bounty_id, v_claim.bounty_claim_id, v_claim.hunter_id, v_bounty.reward_points, 'bounty_completed', now())
    on conflict (bounty_claim_id) do nothing;
    update public.profiles set total_points = (
      select coalesce(sum(points), 0) from public.reward_transactions where user_id = v_claim.hunter_id
    ), updated_at = now() where user_id = v_claim.hunter_id;
  end if;
  insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
  values (v_claim.hunter_id, p_bounty_id, case when p_approve then 'work_approved' else 'work_returned' end,
    case when p_approve then 'Work approved · XP awarded' else 'A little more work is needed' end,
    case when p_approve then v_bounty.title else trim(p_feedback) end, false, now());
end;
$$;
create or replace function public.review_work(p_bounty_id bigint, p_approve boolean, p_feedback text)
returns void language sql security invoker set search_path = '' as $$
  select rbb_private.review_work(p_bounty_id, p_approve, p_feedback);
$$;

create or replace function rbb_private.rate_hunter(p_bounty_id bigint, p_rating integer, p_review text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_bounty public.bounties%rowtype; v_hunter uuid; v_completed bigint; v_actor uuid := auth.uid();
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before rating'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 or length(coalesce(p_review, '')) > 500
  then raise exception 'Rating must be 1–5 stars with at most 500 review characters'; end if;
  select * into v_bounty from public.bounties where bounty_id = p_bounty_id for update;
  if not found then raise exception 'Bounty not found'; end if;
  select bounty_status_id into v_completed from public.bounty_status where status_name = 'COMPLETED';
  if v_bounty.poster_id <> v_actor or v_bounty.bounty_status_id <> v_completed
  then raise exception 'Only the poster can rate completed work'; end if;
  select c.hunter_id into v_hunter from public.bounty_claims c
    join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
    where c.bounty_id = p_bounty_id and s.status_name = 'ASSIGNED';
  if v_hunter is null then raise exception 'Accepted hunter not found'; end if;
  if exists (select 1 from public.user_ratings where bounty_id = p_bounty_id and recipient_id = v_hunter)
  then raise exception 'This bounty has already been rated'; end if;
  insert into public.user_ratings (bounty_id, rater_id, recipient_id, rating, review, created_at)
  values (p_bounty_id, v_actor, v_hunter, p_rating, nullif(trim(coalesce(p_review, '')), ''), now());
  update public.profiles set average_rating = (
    select avg(rating)::numeric from public.user_ratings where recipient_id = v_hunter
  ), updated_at = now() where user_id = v_hunter;
end;
$$;
create or replace function public.rate_hunter(p_bounty_id bigint, p_rating integer, p_review text)
returns void language sql security invoker set search_path = '' as $$
  select rbb_private.rate_hunter(p_bounty_id, p_rating, p_review);
$$;

create or replace function rbb_private.send_bounty_message(p_bounty_id bigint, p_text text)
returns bigint language plpgsql security definer set search_path = '' as $$
declare v_bounty public.bounties%rowtype; v_hunter uuid; v_recipient uuid;
  v_id bigint; v_actor uuid := auth.uid(); v_text text := trim(coalesce(p_text, ''));
begin
  if v_actor is null or not rbb_private.email_confirmed() then raise exception 'Confirm your email before messaging'; end if;
  if length(v_text) < 1 or length(v_text) > 2000 then raise exception 'Message must contain 1–2,000 characters'; end if;
  select * into v_bounty from public.bounties where bounty_id = p_bounty_id;
  if not found then raise exception 'Bounty not found'; end if;
  select c.hunter_id into v_hunter from public.bounty_claims c
    join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
    where c.bounty_id = p_bounty_id and s.status_name = 'ASSIGNED';
  if v_hunter is null or (v_actor <> v_hunter and v_actor <> v_bounty.poster_id)
  then raise exception 'Only the poster and approved hunter can message'; end if;
  v_recipient := case when v_actor = v_bounty.poster_id then v_hunter else v_bounty.poster_id end;
  insert into public.bounty_messages (bounty_id, sender_id, message_text, created_at)
  values (p_bounty_id, v_actor, v_text, now()) returning message_id into v_id;
  insert into public.notifications (user_id, bounty_id, notification_type, title, message, is_read, created_at)
  values (v_recipient, p_bounty_id, 'new_message', 'New bounty message', left(v_text, 80), false, now());
  return v_id;
end;
$$;
create or replace function public.send_bounty_message(p_bounty_id bigint, p_text text)
returns bigint language sql security invoker set search_path = '' as $$
  select rbb_private.send_bounty_message(p_bounty_id, p_text);
$$;

create or replace function rbb_private.mark_notification_read(p_notification_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in to continue'; end if;
  update public.notifications set is_read = true
  where notification_id = p_notification_id and user_id = auth.uid();
end;
$$;
create or replace function public.mark_notification_read(p_notification_id bigint)
returns void language sql security invoker set search_path = '' as $$
  select rbb_private.mark_notification_read(p_notification_id);
$$;

create or replace function rbb_private.get_private_address(p_bounty_id bigint)
returns text language plpgsql security definer set search_path = '' as $$
declare v_address text;
begin
  if auth.uid() is null or not (
    rbb_private.is_poster(p_bounty_id) or rbb_private.is_accepted_participant(p_bounty_id)
  ) then raise exception 'Meeting details are available only to approved participants'; end if;
  select address into v_address from public.bounties where bounty_id = p_bounty_id;
  return v_address;
end;
$$;
create or replace function public.get_private_address(p_bounty_id bigint)
returns text language sql security invoker set search_path = '' as $$
  select rbb_private.get_private_address(p_bounty_id);
$$;

-- Keep privileged implementations out of exposed schemas. Wrapper routines have no elevated privileges.
revoke execute on function rbb_private.is_poster(bigint), rbb_private.is_claimant(bigint),
  rbb_private.is_accepted_participant(bigint), rbb_private.can_access_claim(bigint),
  rbb_private.email_confirmed(), rbb_private.create_bounty(text,text,text,integer,text),
  rbb_private.request_claim(bigint), rbb_private.decide_claim(bigint,boolean),
  rbb_private.submit_work(bigint), rbb_private.review_work(bigint,boolean,text),
  rbb_private.rate_hunter(bigint,integer,text), rbb_private.send_bounty_message(bigint,text),
  rbb_private.mark_notification_read(bigint), rbb_private.get_private_address(bigint)
  from public, anon;
grant execute on function rbb_private.is_poster(bigint), rbb_private.is_claimant(bigint),
  rbb_private.is_accepted_participant(bigint), rbb_private.can_access_claim(bigint),
  rbb_private.create_bounty(text,text,text,integer,text), rbb_private.request_claim(bigint),
  rbb_private.decide_claim(bigint,boolean), rbb_private.submit_work(bigint),
  rbb_private.review_work(bigint,boolean,text), rbb_private.rate_hunter(bigint,integer,text),
  rbb_private.send_bounty_message(bigint,text), rbb_private.mark_notification_read(bigint),
  rbb_private.get_private_address(bigint) to authenticated;

revoke execute on function public.create_bounty(text,text,text,integer,text),
  public.request_claim(bigint), public.decide_claim(bigint,boolean),
  public.submit_work(bigint), public.review_work(bigint,boolean,text),
  public.rate_hunter(bigint,integer,text), public.send_bounty_message(bigint,text),
  public.mark_notification_read(bigint), public.get_private_address(bigint)
  from public, anon;
grant execute on function public.create_bounty(text,text,text,integer,text),
  public.request_claim(bigint), public.decide_claim(bigint,boolean),
  public.submit_work(bigint), public.review_work(bigint,boolean,text),
  public.rate_hunter(bigint,integer,text), public.send_bounty_message(bigint,text),
  public.mark_notification_read(bigint), public.get_private_address(bigint)
  to authenticated;

notify pgrst, 'reload schema';

commit;

