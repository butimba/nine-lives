# Nine Lives — instrukcja dla Claude'a (i dla Maxa)

Gra edukacyjna (angielski) dla młodszych uczniów Maxa. Statyczna strona (GitHub Pages) + opcjonalny zapis w chmurze (Supabase, darmowy plan). Zero buildu: czysty HTML/CSS/JS (moduły ES). Cała gra po angielsku, prosto (A1); polski tylko jako mała podpowiedź pod poleceniem zadania i w panelu nauczyciela. Projekt v2: `DESIGN.md`.

## Struktura
- `index.html`, `css/*.css`, `js/main.js` — gra (v2: pixel art arcade). `teacher.html` — panel nauczyciela (PIN w `config.js`).
- `js/pixel/` — paleta, sprite'y (kot+skórki, czapki, potwory, skrzynie, ikony), pixelizer emoji, pikselowy font.
- `js/game/` — scena canvas, wieża i cykl dnia (`?hour=NN`), bieg (`run.js`), boss, mechaniki zadań (`mechanics/`).
- `js/ui/` — ekrany (router, logowanie, dom-wieża, Wardrobe, skrzynie, wyniki…).
- `js/state.js` — zapis (SAVE_VERSION 2, migracje). `js/lives.js` — 9 żyć + malejące nagrody. `js/rewards.js` — nagrody po biegu. `js/meta.js` — skrzynie, sklep, talenty, seria dni, boss tygodnia. `js/audio.js` — chiptune SFX + muzyka generatywna + lektor.
- `js/engine.js` — silnik nauki (powtórki, wzorce błędów). `js/art.js` — LEGACY v1 (używany przez engine.js i teacher.html) (nie importować w nowym kodzie).
- `data/vocab.js` — tematy słówek `[en, pl, obrazek]`. Obrazek: emoji / `color:#hex` / `num:7`.
- `data/grammar.js` — generator zdań: umiejętność → wzorce → funkcja zwracająca `{text, answer, wrong, tags, full, hint}`.
- `data/cosmetics.js` — skórki i czapki. `data/progression.js` — talenty, perki, skrzynie (wood/silver/gold/epic), ekonomia, fabuła (Moon Diary). `data/catnames.js` — generator imion kota.
- `data/events.js` — wydarzenia sezonowe (włączają się same wg daty).
- `data/roster.js` — WYGENEROWANY: profile uczniów pod hashami loginów (bez imion). Źródło: `tools/roster-src.json` (PRYWATNE, w .gitignore; kopia u Maxa w `Desktop/korki/catgame/`). Po zmianie: `node tools/build-roster.mjs`.
- `config.js` — URL i publiczny klucz Supabase, PIN panelu.
- `tools/` — walidator gramatyki (`check-grammar.mjs`), testy systemów (`test-systems.mjs`), bot (`bot.cjs`), zrzuty (`shots-v2.cjs`), SQL dla Supabase.

## ZASADY KOMPATYBILNOŚCI (żeby update nie skasował postępów dzieci)
1. Klucze postępu: słówko `v:<temat>:<angielskie słowo>`, gramatyka `g:<umiejętność>:<wzorzec>`. Nie zmieniaj istniejących id tematów, angielskich słów, umiejętności, wzorców, skórek, czapek, talentów. Dodawaj nowe. Polskie tłumaczenia, emoji, opisy i ceny można zmieniać.
2. Zamiast usuwać skórkę/czapkę → `retired: true`.
3. Zmiana kształtu zapisu → nowa migracja w `js/state.js` (`MIGRATIONS`) i `SAVE_VERSION + 1`.
4. Level, karty albumu, raporty są wyliczane z `xp`/`srs`/`log` — nie zapisuj ich na sztywno.
5. Przed publikacją: `node tools/check-grammar.mjs` (0 błędów), `node tools/test-systems.mjs` (0 failed) i bot: `python3 -m http.server 8765 & node tools/bot.cjs lucja 0.85 2 mobile` (ERRORS: none). Bot i zrzuty blokują Supabase, więc nie nadpiszą zapisów dzieci. Zrzuty: `node tools/shots-v2.cjs 8765` → `/tmp/shots`.
6. Po zmianie plików podbij `?v=` w `index.html`, żeby przeglądarki wzięły nową wersję.

## Typowe prośby Maxa → co zrobić
- „Dodaj uczniowi X temat Y na ten tydzień” → `tools/roster-src.json`: dopisz do `focus` (`"v:<temat>"` albo id umiejętności z grammar.js) → build-roster. Silnik sam rozłoży nowe rzeczy (max 4 nowe słówka / 2 wzorce na bieg).
- „Nowy uczeń” → nowy wpis w roster-src (login = imię bez polskich znaków), opcjonalnie `duo`, `noReading: true` dla nieczytających (lektor domyślnie włączony tylko dla nich; inni mogą go włączyć w ustawieniach).
- „Nowe słówka” → nowy temat w `data/vocab.js` (14–20 słów, emoji z Unicode ≤ 13, bez 🩷🪟🪨🪆).
- „Nowa gramatyka” → nowa umiejętność w `data/grammar.js` + `prereq` + tagi błędów (+ wpis w `CONFUSION_SKILL`/`CONFUSION_PL` w engine.js) → walidator.
- „Skórka od ucznia” (np. zdjęcie zabawki) → nowy wpis w `SKINS` z `source: "weekly"` i kolejnym `order` (trafi do kolejki nagród za bossa tygodnia) albo `"shop"`. Wygląd = kolory + pattern + `fx`; nowy efekt dopisz w sprite'ach kota (`js/pixel/`). Bez postaci z licencją (Pokemon itp.) — robimy własne wariacje.
- „Raport” → Max wkleja tekst z panelu (`teacher.html` → Kopiuj raport wszystkich). Przeanalizuj wzorce błędów i zaproponuj zmiany `focus`.

## Ekonomia (data/progression.js → ECON, js/lives.js)
Etap = 5 pięter, boss na 5. Potwór 2 HP (<20 piętro), 3 HP (<60), 4 HP. Level = punkt talentu; co 5 leveli skrzynia (co 10 srebrna). Skrzynia za bossa: zwykle drewniana/srebrna, piętro 25/75… złota, 50/100… epicka.
**9 żyć dziennie** (`save.lives`): zła odpowiedź −1, +1 co 20 min, +1 za combo 8, reset do 9 o północy. 0 żyć = kot śpi (Wieża zablokowana, Shadow Cellar działa w „dream mode”).
**Malejące nagrody** wg czasu gry dziś (`save.daily.ms`): 0–20 min 100%, 20–30 min 70%, 30–45 min 35%, 45+ min 15% (rybki i XP; nauka i postęp wieży bez zmian). Shadow Cellar zawsze 100%. Progi: `REWARD_TIERS` w `js/lives.js`.
Talenty/perki mnożą rybki/XP w `js/rewards.js` (lucky +10%/rangę, bell ×1.5, magnet ×1.3 XP); Cat Nap = +1/+2 życia po bossie.
