-- DRAFT FOR REVIEW ONLY. This file has not been applied to Supabase.
-- Exposes only the signed-in user's spendable XP, Gold balance, and the active
-- server-side conversion rate. The rate itself remains administrator-controlled.

create or replace function public.get_xp_exchange_info()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_rate integer;
  v_gold integer;
begin
  if v_user_id is null then
    raise exception 'Sign in to continue';
  end if;

  select es.setting_value into v_rate
    from rbb_private.economy_settings as es
   where es.setting_key = 'xp_per_gold';

  select p.total_gold into v_gold
    from public.profiles as p
   where p.user_id = v_user_id;

  if v_rate is null or v_rate <= 0 or v_gold is null then
    raise exception 'XP exchange settings or profile are unavailable';
  end if;

  return jsonb_build_object(
    'available_xp', rbb_private.available_xp(v_user_id),
    'xp_per_gold', v_rate,
    'total_gold', v_gold
  );
end;
$function$;

revoke all on function public.get_xp_exchange_info() from public, anon;
grant execute on function public.get_xp_exchange_info() to authenticated;
