-- Read-only follow-up for the first preflight export. Run in the same project.
select jsonb_pretty(jsonb_build_object(
  'row_counts', jsonb_build_object(
    'auth_users', (select count(*) from auth.users),
    'users_without_profile', (select count(*) from auth.users u left join public.profiles p on p.user_id = u.id where p.user_id is null),
    'profiles', (select count(*) from public.profiles),
    'bounties', (select count(*) from public.bounties),
    'claims', (select count(*) from public.bounty_claims),
    'submissions', (select count(*) from public.bounty_submissions),
    'ratings', (select count(*) from public.user_ratings)
  ),
  'bounty_status_usage', (
    select coalesce(jsonb_agg(jsonb_build_object('status', s.status_name, 'count', x.row_count) order by s.status_name), '[]'::jsonb)
    from public.bounty_status s
    left join lateral (select count(*) as row_count from public.bounties b where b.bounty_status_id = s.bounty_status_id) x on true
  ),
  'claim_status_usage', (
    select coalesce(jsonb_agg(jsonb_build_object('status', s.status_name, 'count', x.row_count) order by s.status_name), '[]'::jsonb)
    from public.bounty_claim_status s
    left join lateral (select count(*) as row_count from public.bounty_claims c where c.bounty_claim_status_id = s.bounty_claim_status_id) x on true
  ),
  'submission_status_usage', (
    select coalesce(jsonb_agg(jsonb_build_object('status', submission_status, 'count', row_count) order by submission_status), '[]'::jsonb)
    from (select submission_status, count(*) as row_count from public.bounty_submissions group by submission_status) x
  ),
  'duplicate_ratings', (select count(*) from (select 1 from public.user_ratings group by bounty_id, recipient_id having count(*) > 1) d),
  'multiple_assigned_claims', (
    select count(*) from (
      select 1 from public.bounty_claims c
      join public.bounty_claim_status s on s.bounty_claim_status_id = c.bounty_claim_status_id
      where s.status_name in ('APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED')
      group by c.bounty_id having count(*) > 1
    ) d
  ),
  'identity_columns', (
    select coalesce(jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name, 'is_identity', is_identity, 'generation', identity_generation) order by table_name, column_name), '[]'::jsonb)
    from information_schema.columns
    where table_schema = 'public' and column_name in ('bounty_id', 'bounty_claim_id', 'submission_id', 'message_id', 'notification_id', 'rating_id', 'reward_id')
  ),
  'auth_user_triggers', (
    select coalesce(jsonb_agg(jsonb_build_object('name', t.tgname, 'definition', pg_get_triggerdef(t.oid)) order by t.tgname), '[]'::jsonb)
    from pg_trigger t where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
  ),
  'public_triggers', (
    select coalesce(jsonb_agg(jsonb_build_object('table', c.relname, 'name', t.tgname, 'definition', pg_get_triggerdef(t.oid)) order by c.relname, t.tgname), '[]'::jsonb)
    from pg_trigger t join pg_class c on c.oid = t.tgrelid
    where c.relnamespace = 'public'::regnamespace and not t.tgisinternal
      and c.relname in ('profiles', 'bounties', 'bounty_claims', 'bounty_submissions', 'user_ratings', 'reward_transactions')
  ),
  'function_conflicts', (
    select coalesce(jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid)) order by n.nspname, p.proname), '[]'::jsonb)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'rbb_private')
      and p.proname in ('create_bounty', 'request_claim', 'decide_claim', 'submit_work', 'review_work', 'rate_hunter', 'send_bounty_message', 'mark_notification_read', 'get_private_address', 'on_auth_user_created')
  ),
  'role_grants', (
    select coalesce(jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name, 'grantee', grantee, 'privilege', privilege_type) order by table_name, column_name, grantee, privilege_type), '[]'::jsonb)
    from information_schema.column_privileges
    where table_schema = 'public' and grantee in ('PUBLIC', 'anon', 'authenticated')
      and ((table_name = 'profiles' and column_name = 'email')
        or (table_name = 'bounties' and column_name in ('address', 'location_lat', 'location_lng')))
  )
)) as schema_inventory_followup;
