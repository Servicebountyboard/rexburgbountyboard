-- Applied to Supabase manually by the project owner on 2026-11-20;
-- application was reported by the owner and has not been independently verified.
-- Initial rate: 100 earned XP -> 1 Gold. Adjust xp_per_gold in the private
-- settings table as a trusted administrator; the mobile client cannot change it.
-- profiles.total_points remains lifetime earned XP. Spendable XP is calculated
-- as earned reward_transactions minus this private, append-only exchange ledger.

create table if not exists rbb_private.economy_settings (
  setting_key text primary key check (setting_key = 'xp_per_gold'),
  setting_value integer not null check (setting_value > 0),
  updated_at timestamptz not null default now()
);

insert into rbb_private.economy_settings (setting_key, setting_value)
values ('xp_per_gold', 100)
on conflict (setting_key) do nothing;

create table if not exists rbb_private.xp_gold_exchange_ledger (
  exchange_id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(user_id),
  xp_spent integer not null check (xp_spent > 0),
  gold_received integer not null check (gold_received > 0),
  xp_per_gold integer not null check (xp_per_gold > 0),
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  constraint xp_gold_exchange_ledger_user_key unique (user_id, idempotency_key)
);

alter table rbb_private.economy_settings enable row level security;
alter table rbb_private.xp_gold_exchange_ledger enable row level security;
revoke all on table rbb_private.economy_settings from public, anon, authenticated;
revoke all on table rbb_private.xp_gold_exchange_ledger from public, anon, authenticated;
revoke all on sequence rbb_private.xp_gold_exchange_ledger_exchange_id_seq from public, anon, authenticated;

create or replace function rbb_private.available_xp(p_user_id uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $function$
  select greatest(
    coalesce((select sum(rt.points)::bigint from public.reward_transactions as rt where rt.user_id = p_user_id), 0)
      - coalesce((select sum(xe.xp_spent)::bigint from rbb_private.xp_gold_exchange_ledger as xe where xe.user_id = p_user_id), 0),
    0
  );
$function$;
revoke all on function rbb_private.available_xp(uuid) from public, anon, authenticated;

create or replace function rbb_private.exchange_xp_for_gold(p_xp_amount integer, p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_user_id uuid := auth.uid();
  v_rate integer;
  v_available bigint;
  v_gold_amount integer;
  v_total_gold integer;
  v_exchange rbb_private.xp_gold_exchange_ledger%rowtype;
begin
  if v_user_id is null or not rbb_private.email_confirmed() then
    raise exception 'Confirm your email before exchanging XP';
  end if;
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 or length(p_idempotency_key) > 100 then
    raise exception 'A valid idempotency key is required';
  end if;

  -- Lock the profile so parallel requests cannot spend the same XP twice.
  select p.total_gold into v_total_gold
    from public.profiles as p where p.user_id = v_user_id for update;
  if not found then raise exception 'Profile not found'; end if;

  -- Return a prior successful operation on retry, even if the rate has since changed.
  select * into v_exchange from rbb_private.xp_gold_exchange_ledger as xe
   where xe.user_id = v_user_id and xe.idempotency_key = p_idempotency_key;
  if found then
    if v_exchange.xp_spent <> p_xp_amount then
      raise exception 'This idempotency key was already used for a different exchange';
    end if;
    return jsonb_build_object(
      'exchange_id', v_exchange.exchange_id,
      'xp_spent', v_exchange.xp_spent,
      'gold_received', v_exchange.gold_received,
      'xp_per_gold', v_exchange.xp_per_gold,
      'available_xp', rbb_private.available_xp(v_user_id),
      'total_gold', v_total_gold
    );
  end if;

  select es.setting_value into v_rate from rbb_private.economy_settings as es
   where es.setting_key = 'xp_per_gold';
  if v_rate is null or v_rate <= 0 then raise exception 'XP-to-Gold exchange rate is unavailable'; end if;
  if p_xp_amount is null or p_xp_amount <= 0 or p_xp_amount % v_rate <> 0 then
    raise exception 'XP amount must be a positive multiple of the current exchange rate';
  end if;

  v_available := rbb_private.available_xp(v_user_id);
  if p_xp_amount > v_available then raise exception 'Not enough XP available to exchange'; end if;
  v_gold_amount := p_xp_amount / v_rate;

  insert into rbb_private.xp_gold_exchange_ledger
    (user_id, xp_spent, gold_received, xp_per_gold, idempotency_key)
  values (v_user_id, p_xp_amount, v_gold_amount, v_rate, p_idempotency_key)
  returning * into v_exchange;

  -- The existing AFTER INSERT trigger updates total_gold and enforces its floor.
  insert into public.gold_transactions
    (user_id, amount, transaction_type, reason, bounty_id, bounty_claim_id, idempotency_key, created_at)
  values (
    v_user_id, v_gold_amount, 'EARN', 'XP exchanged for Gold', null, null,
    'xp-exchange:' || v_user_id::text || ':' || p_idempotency_key, now()
  );

  select p.total_gold into v_total_gold from public.profiles as p where p.user_id = v_user_id;
  return jsonb_build_object(
    'exchange_id', v_exchange.exchange_id,
    'xp_spent', v_exchange.xp_spent,
    'gold_received', v_exchange.gold_received,
    'xp_per_gold', v_exchange.xp_per_gold,
    'available_xp', v_available - p_xp_amount,
    'total_gold', v_total_gold
  );
end;
$function$;
revoke all on function rbb_private.exchange_xp_for_gold(integer, text) from public, anon, authenticated;

create or replace function public.get_available_xp()
returns bigint
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.uid() is null then raise exception 'Sign in to continue'; end if;
  return rbb_private.available_xp(auth.uid());
end;
$function$;

create or replace function public.exchange_xp_for_gold(p_xp_amount integer, p_idempotency_key text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
begin
  return rbb_private.exchange_xp_for_gold(p_xp_amount, p_idempotency_key);
end;
$function$;

revoke all on function public.get_available_xp() from public, anon;
revoke all on function public.exchange_xp_for_gold(integer, text) from public, anon;
grant execute on function public.get_available_xp() to authenticated;
grant execute on function public.exchange_xp_for_gold(integer, text) to authenticated;

-- Example administrator adjustment (run in Supabase SQL Editor):
-- update rbb_private.economy_settings
--    set setting_value = 125, updated_at = now()
--  where setting_key = 'xp_per_gold';
