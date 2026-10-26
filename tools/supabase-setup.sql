-- Wklej całość w Supabase → SQL Editor → Run. Można uruchomić wielokrotnie.
create table if not exists public.saves (
  id text primary key,
  data jsonb not null,
  pub jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.weekly (
  week text not null,
  id text not null,
  dmg integer not null default 0,
  primary key (week, id)
);

alter table public.saves enable row level security;
alter table public.weekly enable row level security;

-- Gra nie ma kont z hasłami (dzieci logują się imieniem), więc klucz publiczny
-- może czytać i zapisywać postępy. Kasowanie jest zablokowane.
drop policy if exists "saves read" on public.saves;
drop policy if exists "saves insert" on public.saves;
drop policy if exists "saves update" on public.saves;
create policy "saves read" on public.saves for select to anon using (true);
create policy "saves insert" on public.saves for insert to anon with check (length(id) between 3 and 40);
create policy "saves update" on public.saves for update to anon using (true) with check (length(id) between 3 and 40);

drop policy if exists "weekly read" on public.weekly;
drop policy if exists "weekly insert" on public.weekly;
drop policy if exists "weekly update" on public.weekly;
create policy "weekly read" on public.weekly for select to anon using (true);
create policy "weekly insert" on public.weekly for insert to anon with check (dmg between 0 and 5000);
create policy "weekly update" on public.weekly for update to anon using (true) with check (dmg between 0 and 5000);

grant select, insert, update on public.saves, public.weekly to anon;
