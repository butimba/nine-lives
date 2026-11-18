-- Nine Lives v4, CZĘŚĆ 1 (bezpieczna, tylko dodaje): funkcje zamiast czytania całej tabeli.
-- Supabase → SQL Editor → wklej całość → Run. Można uruchomić wielokrotnie. Gra działa przed i po.
-- Po wdrożeniu gry, która ich używa: tools/supabase-v4-czesc2.sql (zamyka tabele).

-- jeden zapis po id (gra zna tylko swoje id, nie da się pobrać listy wszystkich)
create or replace function public.nl_load(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select data from saves where id = p_id
$$;

-- publiczne info partnera z duetu (imię kota, skórka, piętro), bez postępów nauki
create or replace function public.nl_pub(p_id text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(pub, '{}'::jsonb) || jsonb_build_object('updated_at', updated_at) from saves where id = p_id
$$;

create or replace function public.nl_save(p_id text, p_data jsonb, p_pub jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if length(p_id) not between 3 and 40 or p_data is null or length(p_data::text) > 2000000 then
    raise exception 'bad save';
  end if;
  insert into saves (id, data, pub, updated_at) values (p_id, p_data, p_pub, now())
  on conflict (id) do update set data = excluded.data, pub = excluded.pub, updated_at = now();
end $$;

-- panel nauczyciela: hasło sprawdzane w bazie (w kodzie strony jest tylko ta funkcja, hasła nie ma nigdzie)
create or replace function public.nl_teacher_ok(p_pass text) returns boolean
language sql immutable security definer set search_path = public as $$
  select encode(sha256(convert_to(coalesce(p_pass, ''), 'UTF8')), 'hex') = '137d8208b00282b1f8ba697246be9c5377f22609c46463f7557ed11b4b99d020'
$$;

create or replace function public.nl_teacher_saves(p_pass text)
returns table (id text, data jsonb, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not nl_teacher_ok(p_pass) then raise exception 'wrong password'; end if;
  return query select s.id, s.data, s.updated_at from saves s order by s.updated_at desc;
end $$;

create or replace function public.nl_teacher_skins(p_pass text)
returns table (id text, author_id text, name text, pixels text, status text, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not nl_teacher_ok(p_pass) then raise exception 'wrong password'; end if;
  return query select k.id, k.author_id, k.name, k.pixels, k.status, k.created_at from skins k order by k.created_at desc;
end $$;

create or replace function public.nl_teacher_skin_status(p_pass text, p_id text, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not nl_teacher_ok(p_pass) then raise exception 'wrong password'; end if;
  if p_status not in ('pending', 'approved', 'rejected') then raise exception 'bad status'; end if;
  update skins set status = p_status where id = p_id;
end $$;

revoke execute on function public.nl_teacher_ok(text) from public, anon;
grant execute on function public.nl_load(text), public.nl_pub(text), public.nl_save(text, jsonb, jsonb),
  public.nl_teacher_saves(text), public.nl_teacher_skins(text), public.nl_teacher_skin_status(text, text, text) to anon;
