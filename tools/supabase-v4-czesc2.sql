-- Nine Lives v4, CZĘŚĆ 2: zamyka tabelę zapisów przed kluczem publicznym.
-- Uruchom DOPIERO gdy na stronie jest gra używająca funkcji z części 1 (nl_load / nl_save / nl_pub).
-- Potem nikt z kluczem publicznym nie pobierze listy wszystkich zapisów ani nie zmieni statusu skórek.
drop policy if exists "saves read" on public.saves;
drop policy if exists "saves insert" on public.saves;
drop policy if exists "saves update" on public.saves;
revoke all on public.saves from anon;

