-- Read-only inventory. Run this in the intended Supabase project's SQL Editor
-- and share the single JSON result before applying migrations.
select jsonb_pretty(jsonb_build_object(
  'columns', (
    select jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name, 'type', data_type, 'max_length', character_maximum_length, 'nullable', is_nullable, 'default', column_default) order by table_name, ordinal_position)
    from information_schema.columns
    where table_schema = 'public' and table_name in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'constraints', (
    select jsonb_agg(jsonb_build_object('table', c.relname, 'name', pc.conname, 'definition', pg_get_constraintdef(pc.oid)) order by c.relname, pc.conname)
    from pg_constraint pc
    join pg_class c on c.oid = pc.conrelid
    where pc.connamespace = 'public'::regnamespace and c.relname in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'indexes', (
    select jsonb_agg(jsonb_build_object('table', tablename, 'name', indexname, 'definition', indexdef) order by tablename, indexname)
    from pg_indexes
    where schemaname = 'public' and tablename in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'policies', (
    select jsonb_agg(jsonb_build_object('table', tablename, 'name', policyname, 'command', cmd, 'roles', roles, 'using', qual, 'check', with_check) order by tablename, policyname)
    from pg_policies where schemaname = 'public' and tablename in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'table_grants', (
    select jsonb_agg(jsonb_build_object('table', table_name, 'grantee', grantee, 'privilege', privilege_type) order by table_name, grantee, privilege_type)
    from information_schema.role_table_grants
    where table_schema = 'public' and grantee in ('PUBLIC', 'anon', 'authenticated') and table_name in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'column_grants', (
    select jsonb_agg(jsonb_build_object('table', table_name, 'column', column_name, 'grantee', grantee, 'privilege', privilege_type) order by table_name, column_name, grantee, privilege_type)
    from information_schema.column_privileges
    where table_schema = 'public' and grantee in ('PUBLIC', 'anon', 'authenticated') and table_name in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'rls', (
    select jsonb_agg(jsonb_build_object('table', relname, 'enabled', relrowsecurity, 'forced', relforcerowsecurity) order by relname)
    from pg_class where relnamespace = 'public'::regnamespace and relname in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'triggers', (
    select jsonb_agg(jsonb_build_object('table', event_object_table, 'name', trigger_name, 'timing', action_timing, 'event', event_manipulation, 'statement', action_statement) order by event_object_table, trigger_name)
    from information_schema.triggers
    where event_object_schema = 'public' and event_object_table in (
      'profiles', 'bounty_status', 'bounties', 'bounty_status_history',
      'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
      'bounty_submissions', 'bounty_messages', 'reward_transactions',
      'user_ratings', 'notifications', 'bounty_revision_history'
    )
  ),
  'auth_user_triggers', (
    select jsonb_agg(jsonb_build_object('name', t.tgname, 'definition', pg_get_triggerdef(t.oid)) order by t.tgname)
    from pg_trigger t
    where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal
  ),
  'potential_function_conflicts', (
    select jsonb_agg(jsonb_build_object('schema', n.nspname, 'name', p.proname, 'arguments', pg_get_function_identity_arguments(p.oid)) order by n.nspname, p.proname)
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'rbb_private')
      and p.proname in ('create_bounty', 'request_claim', 'decide_claim', 'submit_work',
        'review_work', 'rate_hunter', 'send_bounty_message', 'mark_notification_read',
        'get_private_address', 'on_auth_user_created')
  ),
  'existing_data', jsonb_build_object(
    'auth_users', (select count(*) from auth.users),
    'users_without_profile', (select count(*) from auth.users u left join public.profiles p on p.user_id = u.id where p.user_id is null),
    'duplicate_hunter_claims', (select count(*) from (select 1 from public.bounty_claims group by bounty_id, hunter_id having count(*) > 1) d),
    'duplicate_submission_numbers', (select count(*) from (select 1 from public.bounty_submissions group by bounty_claim_id, submission_number having count(*) > 1) d),
    'duplicate_ratings', (select count(*) from (select 1 from public.user_ratings group by bounty_id, recipient_id having count(*) > 1) d),
    'submission_statuses', (select coalesce(jsonb_agg(distinct submission_status), '[]'::jsonb) from public.bounty_submissions),
    'bounties', (select count(*) from public.bounties)
  ),
  'bounty_status', (select coalesce(jsonb_agg(status_name order by status_name), '[]'::jsonb) from public.bounty_status),
  'claim_status', (select coalesce(jsonb_agg(status_name order by status_name), '[]'::jsonb) from public.bounty_claim_status)
)) as schema_inventory;
