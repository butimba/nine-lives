# Nine Lives — instrukcja dla Claude'a (i dla Maxa)

Gra edukacyjna (angielski) dla młodszych uczniów Maxa. Statyczna strona (GitHub Pages) + opcjonalny zapis w chmurze (Supabase, darmowy plan). Zero buildu: czysty HTML/CSS/JS (moduły ES). Cała gra po angielsku, prosto (A1); polski tylko jako mała podpowiedź pod poleceniem zadania i w panelu nauczyciela. Projekt v2: `DESIGN.md`.

## Struktura
- `index.html`, `css/*.css`, `js/main.js` — gra (v2: pixel art arcade). `teacher.html` — panel nauczyciela (PIN w `config.js`).
- `js/pixel/` — paleta, sprite'y (kot+skórki, czapki, potwory, skrzynie, ikony), pixelizer emoji, pikselowy font.
- `js/game/` — scena canvas, wieża i cykl dnia (`?hour=NN`), bieg (`run.js`), boss, mechaniki zadań (`mechanics/`).
- `js/ui/` — ekrany (router, logowanie, dom-wieża, Wardrobe, skrzynie, wyniki…).
- `js/state.js` — zapis (SAVE_VERSION 6, migracje). `js/lives.js` — 9 żyć + malejące nagrody. `js/rewards.js` — nagrody po biegu. `js/meta.js` — skrzynie, sklep, talenty, seria dni, boss tygodnia. `js/audio.js` — chiptune SFX + muzyka generatywna + lektor.
- `js/engine.js` — silnik nauki (powtórki, wzorce błędów). `js/art.js` — LEGACY v1 (używany przez engine.js i teacher.html) (nie importować w nowym kodzie).
- `data/vocab.js` — tematy słówek `[en, pl, obrazek]`. Obrazek: emoji / `color:#hex` / `num:7`.
- `data/grammar.js` — generator zdań: umiejętność → wzorce → funkcja zwracająca `{text, answer, wrong, tags, full, hint}`.
- `data/cosmetics.js` — skórki i czapki. `data/progression.js` — talenty, perki, skrzynie (wood/silver/gold/epic + mythic tylko z bossa tygodnia), ekonomia, fabuła (Moon Diary). `data/catnames.js` — generator imion kota. `data/base.js` — meble Moon Base.
- `data/events.js` — wydarzenia sezonowe (włączają się same wg daty; Halloween 15.10–30.11, zima 1.12–15.01 z Nowym Rokiem 28.12–6.01). Nieposiadane przedmioty wydarzenia są ukryte w szafie poza wydarzeniem.
- `data/roster.js` — WYGENEROWANY: profile uczniów pod hashami loginów (bez imion). Źródło: `tools/roster-src.json` (PRYWATNE, w .gitignore; kopia u Maxa w `Desktop/korki/catgame/`). Po zmianie: `node tools/build-roster.mjs`.
- `config.js` — URL i publiczny klucz Supabase, PIN panelu.
- `tools/` — walidator gramatyki (`check-grammar.mjs`), testy systemów (`test-systems.mjs`), bot (`bot.cjs`), zrzuty (`shots-v2.cjs`), SQL dla Supabase.

**Uwaga:** asystent lekcji (`asystent-lekcji/pipeline/gra.py`) sam robi `git pull` w `catgame/repo`, a gdy testy padną — `git reset --hard origin/main`. Niezacommitowane zmiany w `repo` mogą zniknąć: większe prace rób w osobnym worktree (np. `git worktree add ../repo-xyz -b xyz`) i commituj często.

## ZASADY KOMPATYBILNOŚCI (żeby update nie skasował postępów dzieci)
1. Klucze postępu: słówko `v:<temat>:<angielskie słowo>`, gramatyka `g:<umiejętność>:<wzorzec>`. Nie zmieniaj istniejących id tematów, angielskich słów, umiejętności, wzorców, skórek, czapek, talentów. Dodawaj nowe. Polskie tłumaczenia, emoji, opisy i ceny można zmieniać.
2. Zamiast usuwać skórkę/czapkę → `retired: true`.
3. Zmiana kształtu zapisu → nowa migracja w `js/state.js` (`MIGRATIONS`) i `SAVE_VERSION + 1`.
4. Level, karty albumu, raporty są wyliczane z `xp`/`srs`/`log` — nie zapisuj ich na sztywno.
5. Przed publikacją: `node tools/check-grammar.mjs` (0 błędów), `node tools/test-systems.mjs` (0 failed) i bot (lokalnie u Maxa bot nie działa — testuj w przeglądarce: `python ../serve-test.py .` na porcie 8791, bez Supabase): `python3 -m http.server 8765 & node tools/bot.cjs lucja 0.85 2 mobile` (ERRORS: none). Bot i zrzuty blokują Supabase, więc nie nadpiszą zapisów dzieci. Zrzuty: `node tools/shots-v2.cjs 8765` → `/tmp/shots`.
6. Po zmianie plików podbij `?v=` w `index.html`, żeby przeglądarki wzięły nową wersję.

## Typowe prośby Maxa → co zrobić
- „Dodaj uczniowi X temat Y na ten tydzień” → `tools/roster-src.json`: dopisz do `focus` (`"v:<temat>"` albo id umiejętności z grammar.js) → build-roster. Silnik sam rozłoży nowe rzeczy (max 4 nowe słówka / 2 wzorce na bieg).
- „Nowy uczeń” → nowy wpis w roster-src (login = imię bez polskich znaków), opcjonalnie `duo`, `noReading: true` dla nieczytających (lektor domyślnie włączony tylko dla nich; inni mogą go włączyć w ustawieniach).
- „Nowe słówka” → nowy temat w `data/vocab.js` (14–20 słów, emoji z Unicode ≤ 13, bez 🩷🪟🪨🪆).
- „Nowa gramatyka” → nowa umiejętność w `data/grammar.js` + `prereq` + tagi błędów (+ wpis w `CONFUSION_SKILL`/`CONFUSION_PL` w engine.js) → walidator.
- „Skórka od ucznia” (np. zdjęcie zabawki) → nowy wpis w `SKINS` z `source: "weekly"` i kolejnym `order` (trafi do kolejki nagród za bossa tygodnia) albo `"shop"`. Wygląd = kolory + pattern + `fx`; nowy efekt dopisz w sprite'ach kota (`js/pixel/`). Bez postaci z licencją (Pokemon itp.) — robimy własne wariacje.
- „Raport” → Max wkleja tekst z panelu (`teacher.html` → Kopiuj raport wszystkich). Przeanalizuj wzorce błędów i zaproponuj zmiany `focus`.

## Ekonomia (data/progression.js → ECON, js/lives.js)
Etap = 5 pięter, boss na 5. Potwór 2 HP (<20 piętro), 3 HP (<60), 4 HP. Level = punkt talentu; co 5 leveli skrzynia (co 10 srebrna).
**Skrzynie** (4 stopnie + mityczna; symulacja: `node tools/sim-chests.mjs`): boss → drewniana/srebrna (srebrna 15% / 30% od p.10 / 45% od p.50), od p.40 3% epicka; Król (co 25 pięter) → złota, co 50 pięter → epicka. Skrzynia za bossa tylko za 3 pierwszych bossów dnia (`ECON.bossChestsPerDay`, `save.daily.bossChests`; Król zawsze). Inne źródła: wyzwanie dnia (tylko trudne: srebrna), level, seria 7 dni (srebrna), mimik, duet, sklep (srebrna za 250). Ze skrzyń wypadają tylko przedmioty `chest` + common/rare ze sklepu; epickie/legendarne ze sklepu tylko za rybki.
**9 żyć dziennie** (`save.lives`): zła odpowiedź −1 (pierwsze 5 błędów dnia i powtórny błąd na tym samym elemencie w biegu są darmowe — `mistakeCost`), +1 co 20 min, +1 za combo 8, reset do 9 o północy. 0 żyć = kot śpi (Wieża zablokowana, Shadow Cellar działa w „dream mode”).
**Malejące nagrody** wg czasu gry dziś (`save.daily.ms`): 0–20 min 100%, 20–30 min 70%, 30–45 min 35%, 45+ min 15% (rybki i XP; nauka i postęp wieży bez zmian). Shadow Cellar zawsze 100%. Progi: `REWARD_TIERS` w `js/lives.js`.
Talenty/perki mnożą rybki/XP w `js/rewards.js` (lucky +10%/rangę, bell ×1.5, magnet ×1.3 XP); Cat Nap = +1/+2 życia po bossie.
Levele od 16 drożeją kwadratowo (`ECON.levelXp`), talenty starczają na ~2 miesiące. Moce: Owl Eye 2, Freeze 4, Claw Storm 7, Ball Buster 10, Fish Magnet 13, Catnip 16 (perki nie dublują mocy).
**Boss** (`js/game/boss.js`): pociski lecą ~7 s na początku walki i ~4,5 s pod koniec (`cfg().speed`, było ~5 s i ~2,5 s; dzieci nie nadążały). Odbicia z rzędu = seria (NICE → GREAT → SUPER → WOW, 1 rybka, potem 2). Złota gwiazdka (16% pocisków, nigdy pierwszy): tap = +5 rybek i +1 ładunek mocy, nietrafiona nic nie kosztuje. **Król** co 25 pięter (`ECON.kingEvery`): korona, +2 HP, 3. pocisk w fazie 2, +40 rybek.
**Wysyłanie skórki do nauczyciela jest WYŁĄCZONE** (`SKIN_SENDING = false` w `js/meta.js`): dziecko maluje i nosi swojego kota, przycisku „Send to teacher” nie ma. Włączenie z powrotem = `true` (chmura i panel nietknięte).
**Mityczna skrzynia**: TYLKO za pokonanie bossa tygodnia (`weeklyReward`); w środku ZAWSZE nowy przedmiot: legendarny (skórki `source: "mythic"` tylko stąd, podwójna waga), potem epicki; 500–800 rybek dopiero, gdy ma się wszystko. Złota skrzynia nie daje zwykłych (common) przedmiotów. Duplikat = zwykłe rybki tej skrzyni (małe: drewniana 20–50, srebrna 50–100, złota 120–220, epicka 220–380), bo skrzynie mają dawać przedmioty, nie rybki.
**Ceny = jedna na rzadkość** (`PRICE` na końcu `data/cosmetics.js`, nadpisuje `price` każdego kupowalnego przedmiotu; w danych `price: 1` = „do kupienia”): skórki 200/500/1500/5000, czapki i meble 100/300/900/2500.
**Drabinka skrzyń** (`CHESTS[t].min`): drewniana (rybki lub common/rare), srebrna = zawsze przedmiot, złota ≥ rare, epicka ≥ epic, mityczna = legendarny. Wyczerpana rzadkość → niższa aż do `min`, potem rybki. Epicka to smaczek: 3% boss od p.40, Król co 50 pięter, seria co 28 dni. Napis gwarancji: `CHEST_PROMISE`.
**Sklep tygodnia** (`FEATURED` w `js/meta.js`, skórki `source: "featured"`): co poniedziałek jedna epicka/legendarna skórka tylko za rybki, wraca co 6 tygodni; ze skrzyń nigdy. Nowa skórka do rotacji = wpis w `FEATURED`. W szafie nieposiadane widać tylko w ich tygodniu.
**Żywe niebo** (`js/game/skyshow.js`, rysowane w `home.js` po `drawSky`, wszystko z `save.story`, `SKY_AT`): tęcza 38, statek Króla 45 (raz dziennie zrzuca paczkę: `openParcel`, `save.daily.shipDay`, 15–30 rybek albo 1/4 mebel `source: "ship"`), balon 47, Glitch (szara chmura) 60–98, zorza 63, wieloryb 70, meteory 78, kometa 90, fajerwerki 100. Nowy gwiazdozbiór raz „ożywa” (localStorage `ninelives:skyShow:<id>`), potem losowo nocą.
**Moon Base** (`js/ui/base.js`, ekran `base`, przycisk przy Księżycu): od strony 25 (`BASE_PAGE`). `save.base = { owned, placed }` (v6). 6 miejsc (sufit, ściana ×2, podłoga ×3), 32 meble (~15 tys. rybek). Nowy mebel = wpis w `data/base.js` (emoji ≤ Unicode 13).
**Bilans rybek** (`node tools/sim-economy.mjs`, 20 min/dzień): gra ~460, skrzynie ~350 (35%), wyzwania + boss tygodnia ~190 dziennie; zwykły sklep po ~4 tyg., 6 skórek tygodnia po ~2 mies., potem Moon Base (~15 tys.). Wcześniej skrzynie dawały ~800/dzień i sklep znikał po 3 tyg. Wyzwania dnia: rybki, skrzynia (srebrna) tylko za „boss bez straty życia”.
**Boss tygodnia** (`weeklyNumbers`): HP = max(250 × gracze, 90% obrażeń z zeszłego tygodnia). Każdy punkt obrażeń = `ECON.weeklyFishPerHit` (1) rybka od razu po biegu (× malejące nagrody), także gdy boss nie padnie. Po pokonaniu: mityczna skrzynia + skórka z kolejki `weekly` + bonus z puli = HP × 2 dzielonej wg obrażeń (min 50, 0 bez trafień). Konta `tester` nie liczą się.
**Gramatyka na pierwszym planie** (`GRAMMAR_SHARE` w `js/engine.js`, Max 11.2026): gdy dziecko ma i zdania, i słówka, najpierw losujemy rodzaj zadania — ~70% zdania; temat główny i powtórki działają w obrębie wylosowanego rodzaju. Nieczytający (Bruno) — tylko słówka. Walidator sprawdza udział tematu głównego (Nina: temat główny-słówka ~15–45%).
**Potwór Glitcha** (`RUN_EVENTS.glitch`, od strony 34 fabuły, nie dla nieczytających): migoczący potwór, pyta tylko zdaniami (`session.forceGrammar`), naprawiony = +20 rybek. Debug: `?debug&event=glitch`.
**Fabuła Moon Diary**: 100 stron (`STORY`), **1 strona dziennie** za pierwszego bossa dnia (`save.daily.pageDay`). Strony 1–25 = kawałki Księżyca, 26–95 = 14 gwiazdozbiorów (`SKY`, rysowane na niebie ekranu głównego, wyliczane z `save.story`), 100 = Gwiazda Północna. Nagrody za strony: `STORY_REWARDS` (16 przedmiotów `source: "story"`, `syncStory` w rewards.js). Plan i teksty: `docs/STORY-100.md` (wersja 3: złoczyńca Glitch psuje zdania, moc kota = dobre zdania).
