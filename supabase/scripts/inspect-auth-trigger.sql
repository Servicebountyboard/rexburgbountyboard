-- Read-only: inspect the existing signup trigger's function body and owner.
select p.oid::regprocedure::text as function_name,
       pg_get_userbyid(p.proowner) as function_owner,
       p.prosecdef as security_definer,
       pg_get_functiondef(p.oid) as definition
from pg_trigger t
join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'auth.users'::regclass
  and t.tgname = 'on_auth_user_created';
