# Nine Lives — instrukcja dla Claude'a (i dla Maxa)

Gra edukacyjna (angielski) dla młodszych uczniów Maxa. Statyczna strona (GitHub Pages) + opcjonalny zapis w chmurze (Supabase, darmowy plan). Zero buildu: czysty HTML/CSS/JS (moduły ES). Teksty dla dzieci: polecenia po angielsku z polską podpowiedzią; UI po polsku.

## Struktura
- `index.html`, `css/style.css`, `js/*.js` — gra. `teacher.html` — panel nauczyciela (PIN w `config.js`).
- `data/vocab.js` — tematy słówek `[en, pl, obrazek]`. Obrazek: emoji / `color:#hex` / `num:7`.
- `data/grammar.js` — generator zdań: umiejętność → wzorce → funkcja zwracająca `{text, answer, wrong, tags, full, hint}`.
- `data/cosmetics.js` — skórki i czapki. `data/progression.js` — talenty, perki, skrzynie, ekonomia, fabuła (Moon Diary).
- `data/events.js` — wydarzenia sezonowe (włączają się same wg daty).
- `data/roster.js` — WYGENEROWANY: profile uczniów pod hashami loginów (bez imion). Źródło: `tools/roster-src.json` (PRYWATNE, w .gitignore; kopia u Maxa w `Desktop/korki/catgame/`). Po zmianie: `node tools/build-roster.mjs`.
- `config.js` — URL i publiczny klucz Supabase, PIN panelu.
- `tools/` — walidator gramatyki (`node tools/check-grammar.mjs`), boty testowe (`tools/bot.cjs`), SQL dla Supabase.

## ZASADY KOMPATYBILNOŚCI (żeby update nie skasował postępów dzieci)
1. Klucze postępu: słówko `v:<temat>:<angielskie słowo>`, gramatyka `g:<umiejętność>:<wzorzec>`. Nie zmieniaj istniejących id tematów, angielskich słów, umiejętności, wzorców, skórek, czapek, talentów. Dodawaj nowe. Polskie tłumaczenia, emoji, opisy i ceny można zmieniać.
2. Zamiast usuwać skórkę/czapkę → `retired: true`.
3. Zmiana kształtu zapisu → nowa migracja w `js/state.js` (`MIGRATIONS`) i `SAVE_VERSION + 1`.
4. Level, karty albumu, raporty są wyliczane z `xp`/`srs`/`log` — nie zapisuj ich na sztywno.
5. Przed publikacją: `node tools/check-grammar.mjs` (0 błędów) i bot: `python3 -m http.server 8765 & node tools/bot.cjs lucja 0.85 2 mobile` (ERRORS: none).
6. Po zmianie plików podbij `?v=` w `index.html`, żeby przeglądarki wzięły nową wersję.

## Typowe prośby Maxa → co zrobić
- „Dodaj uczniowi X temat Y na ten tydzień” → `tools/roster-src.json`: dopisz do `focus` (`"v:<temat>"` albo id umiejętności z grammar.js) → build-roster. Silnik sam rozłoży nowe rzeczy (max 4 nowe słówka / 2 wzorce na bieg).
- „Nowy uczeń” → nowy wpis w roster-src (login = imię bez polskich znaków), opcjonalnie `duo`, `voice: true` dla lektora, `noReading: true` dla nieczytających.
- „Nowe słówka” → nowy temat w `data/vocab.js` (14–20 słów, emoji z Unicode ≤ 13, bez 🩷🪟🪨🪆).
- „Nowa gramatyka” → nowa umiejętność w `data/grammar.js` + `prereq` + tagi błędów (+ wpis w `CONFUSION_SKILL`/`CONFUSION_PL` w engine.js) → walidator.
- „Skórka od ucznia” (np. zdjęcie zabawki) → nowy wpis w `SKINS` z `source: "weekly"` i kolejnym `order` (trafi do kolejki nagród za bossa tygodnia) albo `"shop"`. Wygląd = kolory + pattern + `fx`; nowy efekt dopisz w `catSVG` (js/art.js). Bez postaci z licencją (Pokemon itp.) — robimy własne wariacje.
- „Raport” → Max wkleja tekst z panelu (`teacher.html` → Kopiuj raport wszystkich). Przeanalizuj wzorce błędów i zaproponuj zmiany `focus`.

## Ekonomia (data/progression.js → ECON)
Etap = 5 pięter, boss na 5. Potwór 2 HP (<20 piętro), 3 HP (<60), 4 HP. Pierwsze 3 biegi dziennie pełne nagrody, potem 50% / 25%. Jaskinia Cieni (zapomniane/pomylone rzeczy) zawsze 100%. Level = punkt talentu; co 5 leveli skrzynia.
