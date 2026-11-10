# Nine Lives: progresja, tempo i czy gra jest „ready forever”

Stan: `main` (?v=14) + gałąź `boss-samouczek-literowanie` (mityczna skrzynia, diamentowe słówka; jeszcze niescalona). Liczby to szacunki z kodu (`ECON`, `lives.js`, `meta.js`, `cosmetics.js`) przy typowym dniu dziecka: **4–5 bossów, ~20–30 min, ~100 odpowiedzi**.

## 1. Ile trwa zdobycie czego (typowe dziecko)

Na jeden etap (4 potwory + boss): na dole wieży ~13 trafień, od piętra 60 ~23 trafienia. Daje to ~60–80 rybek i ~180–280 XP. Na dzień: **~300 rybek z gry + ~250 ze skrzyń, czyli ~500 rybek i ~1000 XP**.

| Element | Ile jest | Kiedy się kończy | Uwagi |
|---|---|---|---|
| Moce aktywne | 5 | **2.–3. dzień** (level 8) | ok, to samouczek |
| Talenty | 24 punkty (9 talentów) | **~2 tygodnie** (level 25) | potem level daje już tylko skrzynię co 5 leveli |
| Kolekcja skrzyń + sklep (bez wydarzeń) | 14 skórek + 10 czapek, sklep ≈ 7 800 rybek | **~2–4 tygodnie** | legendarne najdłużej; mityczna skrzynia z gałęzi przyspiesza |
| Skórki bossa tygodnia | 5 | **5. tydzień** | potem złota skrzynia + 100 rybek |
| Moon Diary (dziś 20 stron) | 20 bossów | **~5 dni** | |
| Moon Diary po STORY-100 | 1 strona / dzień gry | **~5 miesięcy** | decyzja Maxa: 1 strona dziennie |
| Wieża | nieskończona | nigdy | od piętra 60 nie rośnie trudność, od ~80 biomy wracają w innym kolorze („Candy Forest II”) |
| Seria dni | nieskończona | nigdy | srebrna skrzynia co 7 dni |
| Wydarzenia | 7 w roku, wg daty | wracają co rok | w 2. roku przedmioty z wydarzeń są już zdobyte |
| **Słówka (album)** | 509 słów / 40 tematów + gramatyka | **miesiące** | max 4 nowe na bieg, złoto po powtórkach, diament 6 tyg. po złocie + sprawdzian |
| Lekcje Maxa (`lessons.js`) | dopisywane przez asystenta | dopóki Max uczy | jedyna rzecz, która „aktualizuje się sama” |

## 2. Główny słaby punkt: „ściana” w 3.–5. tygodniu

Prawie cała meta-progresja kończy się **w tym samym czasie**: talenty (~2 tyg.), kolekcja (~2–4 tyg.), skórki tygodnia (5 tyg.). Potem:

- **Rybki tracą sens.** Nie ma już czego kupić, duplikaty zamieniają się w rybki, a drewniana skrzynia za 220 rybek oddaje mniej, niż kosztuje. Waluta bez celu to pusta nagroda.
- **Level-up nic nie daje** poza skrzynią co 5 leveli, a ta zawiera już tylko rybki.
- **Skrzynia za każdego bossa** to po ~4 tygodniach losowanie samych rybek, a 4–5 razy dziennie.
- Zostają: numer piętra, seria dni, boss tygodnia, wydarzenia i **nauka**.

Dobra wiadomość: **jedyna naprawdę długa ścieżka (słówka → złoto → diament) to dokładnie to, o co chodzi w tej grze.** Problem tylko w tym, że w grze jej prawie nie widać: album jest schowany, a na ekranie głównym dominują rybki, skrzynie i piętra.

Mniejsze słabe punkty:
- **Malejące nagrody** (po 20/30/45 min) tną rybki i XP, ale nie wieżę. (Fabuły to już nie dotyczy: 1 strona dziennie.)
- **Talent Treasure Nose** i perk/moc **Fish Magnet** tracą sens po skompletowaniu kolekcji (zwiększają coś, co nic nie daje).
- **Wydarzenia w 2. roku** dają te same przedmioty. Słownictwo i mechaniki dalej działają, ale „nowości” już nie ma, chyba że Max coś dopisze.

## 3. Jak to złożyć w wersję „final” (propozycja, od najważniejszego)

1. **Fabuła: 1 strona dziennie (decyzja Maxa).** Strona przychodzi za pierwszego bossa dnia, więc 100 stron to ~5 miesięcy gry. Fabuła staje się najdłuższym celem w grze i powodem, żeby wrócić jutro. Szczegóły w `STORY-100.md`.
2. **Na ekranie głównym pokazywać naukę, a nie rybki.** Gwiazdy na niebie (pkt 1) już to robią. Do tego licznik „⭐ 312 words” przy Księżycu i album jednym kliknięciem.
3. **Rybki po skompletowaniu kolekcji.** Najtaniej: gdy wszystko jest zdobyte, skrzynie zamieniają się w coś zbieranego bez końca, np. kolejne kolory/warianty (wariant kolorystyczny skórki to tylko `hueShift`, który już jest w kodzie). Albo uczciwie: ekran „Collection complete!” i skrzynie za bossa przestają wypadać (mniej szumu). Do decyzji Maxa.
4. **Zostawić bez zmian:** wieżę (nieskończona), serię dni, bossa tygodnia, wydarzenia wg daty i talenty. Działają same i nie wymagają opieki.

## 4. Czy gra jest „ready forever”? Jeszcze nie, ale niewiele brakuje

**Co już działa samo, bez opieki:** wydarzenia i święta włączają się wg daty, boss tygodnia według numeru tygodnia, pora dnia według zegara, powtórki i wzorce błędów według silnika, wieża jest nieskończona, a zapis ma migracje.

**Co trzeba domknąć przed „zamrożeniem”:**

| # | Problem | Ryzyko | Co zrobić |
|---|---|---|---|
| 1 | **Gałąź `boss-samouczek-literowanie` niescalona** (3 commity + niezacommitowane zmiany) | wersja finalna nie istnieje w jednym miejscu | dokończyć, przetestować, scalić do `main` |
| 2 | **Supabase (darmowy plan) usypia projekt po ~7 dniach bez ruchu** (np. wakacje, ferie). Uśpiony projekt można obudzić ręcznie, ale po ~90 dniach przywrócenie przez panel może być niemożliwe | zapis w chmurze przestaje działać, panel nauczyciela pusty | mały GitHub Action raz na 3 dni pinguje Supabase (kilka linijek), albo Max pamięta, żeby się logować. Sprawdzić aktualne zasady Supabase |
| 3 | **Safari na iPhonie/iPadzie kasuje localStorage po 7 dniach bez wizyty** (strona niedodana do ekranu głównego) | bez chmury dziecko traci postęp | gra już wczytuje zapis z chmury, więc pkt 2 to rozwiązuje. Warto też dodać grę do ekranu głównego na urządzeniach dzieci |
| 4 | Treść aktualizuje się tylko przez asystenta lekcji na PC Maxa | gdy Max przestanie, treść stoi | to jest ok: 509 słów + gramatyka + ścieżki wystarczą na lata |
| 5 | Meta-progresja kończy się w ~4–5 tyg. (sekcja 2) | dzieci tracą motywację po miesiącu | pkt 1–3 z sekcji 3 |
| 6 | Fabuła kończy się, a gra trwa | po bossie 100 „The End” | to ok, jeśli niebo zostaje pełne. Nie planować sezonu 2 |

**Wniosek:** rdzeń gry (nauka + wieża + daty) jest gotowy na lata. Nie jest gotowa warstwa motywacji, bo wszystko kończy się w ~miesiąc naraz. Brakuje też dwóch rzeczy technicznych: scalenia gałęzi i ochrony Supabase przed uśpieniem. Po tych krokach można grę zamknąć:

1. Scalić `boss-samouczek-literowanie` → `main`.
2. Wdrożyć STORY-100 z zasadą 1 strony dziennie + licznik słówek na ekranie głównym.
3. Decyzja o rybkach po kolekcji (sekcja 3, pkt 3).
4. Keep-alive dla Supabase.
5. Pełne testy z CLAUDE.md, zrzuty, push i koniec rozwoju; dalej działa tylko asystent lekcji.
