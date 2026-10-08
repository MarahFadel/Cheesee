-- Season poll: votes table, RLS, counts RPC, realtime.

-- 1. Table
create table if not exists public.votes (
  id bigint generated always as identity primary key,
  season text not null check (season in ('spring', 'summer', 'autumn', 'winter')),
  created_at timestamptz not null default now()
);

create index if not exists votes_season_idx on public.votes (season);

-- 2. Row Level Security: anon may INSERT and SELECT only.
alter table public.votes enable row level security;

drop policy if exists "anon can insert votes" on public.votes;
create policy "anon can insert votes"
  on public.votes for insert
  to anon
  with check (season in ('spring', 'summer', 'autumn', 'winter'));

drop policy if exists "anon can read votes" on public.votes;
create policy "anon can read votes"
  on public.votes for select
  to anon
  using (true);

-- Belt and braces: grant only what's needed at the privilege level too.
revoke all on table public.votes from anon;
grant select, insert on table public.votes to anon;

-- 3. Counts for all four seasons, including zeros.
create or replace function public.get_vote_counts()
returns table (season text, count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select s.season, count(v.id)::bigint as count
  from unnest(array['spring', 'summer', 'autumn', 'winter']) with ordinality as s(season, ord)
  left join public.votes v on v.season = s.season
  group by s.season, s.ord
  order by s.ord;
$$;

revoke all on function public.get_vote_counts() from public;
grant execute on function public.get_vote_counts() to anon, authenticated;

-- 4. Realtime: broadcast inserts on votes.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'votes'
  ) then
    alter publication supabase_realtime add table public.votes;
  end if;
end $$;
