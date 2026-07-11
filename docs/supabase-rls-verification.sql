-- Run in the Supabase SQL editor before launch.
-- The query lists public tables that either have RLS disabled or have no policy.

select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.polname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where c.relkind = 'r'
  and n.nspname = 'public'
group by n.nspname, c.relname, c.relrowsecurity
having c.relrowsecurity = false
   or count(p.polname) = 0
order by c.relname;
