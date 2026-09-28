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

-- Optional encrypted backup of the private memory vault. The browser encrypts
-- before upload; Supabase receives ciphertext and cannot read the passphrase.
create table if not exists public.private_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  salt text not null,
  iterations integer not null,
  scope text not null check (scope in ('profiles', 'all')),
  updated_at timestamptz not null default now()
);

alter table public.private_vaults enable row level security;
revoke all on public.private_vaults from anon;
grant select, insert, update on public.private_vaults to authenticated;

drop policy if exists "Read own vault" on public.private_vaults;
create policy "Read own vault" on public.private_vaults
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Create own vault" on public.private_vaults;
create policy "Create own vault" on public.private_vaults
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Update own vault" on public.private_vaults;
create policy "Update own vault" on public.private_vaults
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
