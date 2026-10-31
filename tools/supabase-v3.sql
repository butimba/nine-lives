-- Nine Lives v3: skórki rysowane przez dzieci. Wklej całość w Supabase → SQL Editor → Run.
-- Można uruchomić wielokrotnie. Wymaga wcześniejszego tools/supabase-setup.sql (tabele saves, weekly).
create table if not exists public.skins (
  id text primary key,
  author_id text not null,
  name text not null default '',
  pixels text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

alter table public.skins enable row level security;

-- Jak przy zapisach: klucz publiczny czyta i dopisuje. Zmiana statusu (Zatwierdź/Odrzuć) idzie z panelu
-- nauczyciela tym samym kluczem, więc update jest dozwolony. Kasowanie zablokowane.
drop policy if exists "skins read" on public.skins;
drop policy if exists "skins insert" on public.skins;
drop policy if exists "skins update" on public.skins;
create policy "skins read" on public.skins for select to anon using (true);
create policy "skins insert" on public.skins for insert to anon with check (
  length(id) between 3 and 60 and length(author_id) between 3 and 40 and length(name) <= 24
  and length(pixels) between 16 and 2000 and status = 'pending');
create policy "skins update" on public.skins for update to anon using (true) with check (
  length(id) between 3 and 60 and length(author_id) between 3 and 40 and length(name) <= 24
  and length(pixels) between 16 and 2000 and status in ('pending', 'approved', 'rejected'));

grant select, insert, update on public.skins to anon;
