-- DRAFT FOR REVIEW ONLY. This file has not been applied to Supabase.
--
-- The inspected RLS report contains SELECT policies for these tables, but the
-- authenticated role had no effective SELECT grants. These grants allow those
-- existing policies to filter reads. No write privileges or policies are added.

grant select on table
  public.bounties,
  public.bounty_claims,
  public.bounty_submissions,
  public.bounty_messages,
  public.notifications,
  public.reward_transactions,
  public.user_ratings
to authenticated;
