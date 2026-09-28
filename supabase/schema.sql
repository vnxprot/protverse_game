-- ProtVerse: each signed-in player owns exactly one saved journey.
create table if not exists public.game_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  save_data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.game_saves enable row level security;
revoke all on public.game_saves from anon;
grant select, insert, update on public.game_saves to authenticated;

drop policy if exists "Read own save" on public.game_saves;
create policy "Read own save" on public.game_saves
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Create own save" on public.game_saves;
create policy "Create own save" on public.game_saves
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own save" on public.game_saves;
create policy "Update own save" on public.game_saves
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
