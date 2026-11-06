-- Read-only verification after the migration. Run in the same SQL Editor.
select jsonb_pretty(jsonb_build_object(
  'all_app_tables_have_rls', (
    select count(*) = 13 from pg_class
    where relnamespace = 'public'::regnamespace and relrowsecurity
      and relname in ('profiles', 'bounty_status', 'bounties', 'bounty_status_history',
        'bounty_claim_status', 'bounty_claims', 'bounty_claim_status_history',
        'bounty_submissions', 'bounty_messages', 'reward_transactions',
        'user_ratings', 'notifications', 'bounty_revision_history')
  ),
  'rpc_count', (
    select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in ('create_bounty', 'request_claim',
      'decide_claim', 'submit_work', 'review_work', 'rate_hunter',
      'send_bounty_message', 'mark_notification_read', 'get_private_address')
  ),
  'authenticated_can_read_address', has_column_privilege('authenticated', 'public.bounties', 'address', 'SELECT'),
  'authenticated_can_read_coordinates',
    has_column_privilege('authenticated', 'public.bounties', 'location_lat', 'SELECT')
    or has_column_privilege('authenticated', 'public.bounties', 'location_lng', 'SELECT'),
  'authenticated_can_read_email', has_column_privilege('authenticated', 'public.profiles', 'email', 'SELECT'),
  'authenticated_can_write_bounties_directly',
    has_table_privilege('authenticated', 'public.bounties', 'INSERT')
    or has_table_privilege('authenticated', 'public.bounties', 'UPDATE')
    or has_table_privilege('authenticated', 'public.bounties', 'DELETE'),
  'profile_trigger_count', (
    select count(*) from pg_trigger t where t.tgrelid = 'auth.users'::regclass
      and t.tgname = 'on_auth_user_created' and not t.tgisinternal
  )
)) as postflight;
