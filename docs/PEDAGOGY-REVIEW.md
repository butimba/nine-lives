# Nine Lives: przegląd pedagogiczny (Agent P, etap 4)

Stan: 05.11.2026, kod z `main` (HEAD 08d1367) + to, co G właśnie zmienia w `data/grammar.js` (tryb `subjects: "3s"`).
Zakres: każdy typ zadania, metoda jako całość, Łucja i Matylda (9 lat, present simple 3. os.), Nina (9), Bruno (7, nie czyta).
Nie powtarzam `docs/LEARNING-AUDIT.md` (dwuznaczności, zgadywanie, tagi błędów, NEW RULE, limity nowości są tam załatwione). Tu idę głębiej: co dziecko **naprawdę** ćwiczy i co wychodzi po 3 tygodniach grania.

Jak liczyłem: symulacja 21 dni × 2 biegi × 28 zadań na prawdziwym `Session` / `record()` (trafność 80% i 92%, stałe i losowe pory grania), bot (`tools/bot.cjs lucja`), zrzuty ekranu, heurystyki „czy da się trafić bez czytania podmiotu”. Skrypty w scratchpadzie, kodu nie ruszałem.

---

## Najważniejsze w 60 sekund

1. **Błąd w powtórkach: temat główny nigdy nie rośnie.** Po 21 dniach Łucji (trafność 80–92%) wszystkie 5 wzorców `ps_3s` siedzi w pudełku 1–2. Poboczne słówka i `pc` są w tym czasie w pudełku 4–5. W jednym przebiegu było 39 dobrych odpowiedzi z rzędu na `ps_3s:plain`, a pudełko dalej wynosiło 1. Powód: każda dobra odpowiedź, także dodatkowa (niewymagalna), przesuwa `due` na „teraz + 23 h” (`record()` w `js/engine.js`). Temat główny wraca kilka razy dziennie, więc termin wiecznie ucieka. Do tego każdy błąd tego samego dnia daje −2 pudełka.
   **Skutek dydaktyczny:** Łucja w praktyce dostaje do present simple tylko „Fill the gap” i „Right or wrong?”, czyli rozpoznawanie z 33–50% szansą zgadnięcia. Układania zdań, wpisywania i szukania błędu prawie nie ma (1–5 na ~35 zadań gramatyki dziennie). Złote karty dla tematu głównego są nieosiągalne, a to odwraca motywację: im więcej ćwiczy, tym mniej to widać.
   Po poprawce (termin liczony od kalendarzowego dnia, pudełko zmienia tylko pierwsza odpowiedź danego dnia) wzorce `ps_3s` są po 21 dniach w pudełkach 3–5.
2. **Tryb „tylko 3. osoba” (prośba Maxa) zrobi z luki zgadywankę „klikaj w -s”.** Już dziś heurystyka „wybierz najkrótszą opcję kończącą się na -s” trafia **100%** w `ps_3s:plain` i `ps_3s:has` (a to większość zadań), bez czytania podmiotu. Gdy zniknie kontrast z I/you/they, poprawną odpowiedzią prawie zawsze będzie forma z -s. Potrzebny jest kontrast **wewnątrz** 3. osoby: `doesn't + play`, `Does he play?`, `can play`, `Who plays…?`.
3. **Nie ma ani jednego zadania na znaczenie.** Wszystkie zadania gramatyczne da się rozwiązać bez rozumienia zdania. Zdania bywają dziwne („The witch cooks soup after school.”, „She has a shower on Mondays.”). Nie ma „kto?”, obrazka do zdania ani mini-historyjki, a fabuła (Moon Diary) leży obok nauki zamiast ją nieść.
4. **Układanie zdań nie sprawdza -s.** Kafelek „plays” jest podany, więc „Build the sentence!” ćwiczy szyk i spostrzegawczość, a nie końcówkę. Mimo to awansuje wzorzec `ps_3s` do złota jako zadanie „mocne”.
5. **Informacja zwrotna jest tylko po błędzie.** Po dobrej odpowiedzi tabliczka pęka i zdanie znika. Dziecko nigdy nie widzi ani nie słyszy całego poprawnego zdania, więc tracimy najtańszą powtórkę formy.
6. **Wymyślone literówki jako dystraktory** („dancees”, „likees”, „plaies”, „cookes”) pokazują dzieciom formy, których same by nie wymyśliły. Badania na dorosłych pokazują, że oglądanie błędnej pisowni psuje własną.
7. **Słuchania prawie nie ma, mówienia brak.** Czytający mają głos domyślnie wyłączony, a listen2pic jest dla nich wyłączone (TTS bywa słaby). Rozwiązanie jest tanie: nagrane pliki ~300 słówek (Max może je nagrać sam) i wtedy słuchanie wraca dla wszystkich.

---

## 1. Co trenuje każdy typ zadania

Legenda: R = rozpoznanie (wybór z opcji), R+ = rozpoznanie z ograniczonym wyborem elementów, P = produkcja (przypomnienie bez opcji). F = forma, Z = znaczenie.

| Typ (mechanika) | Kiedy (pudełko) | Co naprawdę trenuje | Szansa zgadnięcia | Obciążenie (9 lat) | Uwagi |
|---|---|---|---|---|---|
| word2pic (Signs / Bubbles) | słówka 0–2 | R, Z: słowo → obrazek. Dekodowanie pisanego słowa | 1/3–1/4 | niskie | Dobre na start. Bańki dodają ruch, ale nic językowo. |
| pic2word (Signs) | słówka 0–3 | R, Z → F: obrazek → słowo pisane | 1/3–1/4 | niskie | OK. |
| pl2en (Signs) | słówka 1–5 | **R**, a nie przypominanie: polski → wybór angielskiego z 4 | 1/4 | niskie | W audycie traktowane jak krok ku produkcji, a to nadal rozpoznanie. Nie liczyć jako „mocne”. |
| spell (Spell tiles / Catch) | słówka 2–5 | R+ (litery dane + 2 wabiki), F: pisownia | bardzo niska | średnie (Catch: + zręczność) | Dobre „przypominanie z rusztowaniem”. Catch dokłada motorykę (łapanie), ale to nie decyduje o odpowiedzi. |
| type (Spell Cast) | słówka 3–5, gramatyka 3–5 (tylko `pc:spelling`, plural) | **P**, F: pełne przypomnienie pisowni | ~0 | wysokie (klawiatura na telefonie) | Jedyna prawdziwa produkcja. Dla present simple nie istnieje (patrz §3.4). |
| listen2pic / pic2listen (Bubbles) | tylko nieczytający | R, Z: dźwięk ↔ obrazek | 1/3–1/4 | pic2listen: wysokie (trzeba trzymać w pamięci 3–4 słowa audio) | Dla Bruna jedyne zadania. Przy 4 opcjach to dużo dla 7-latka. |
| cloze (Signs) | gramatyka 0–5 | R, F. **Z niepotrzebne**: decyzja zapada na podstawie formy | 1/3–1/4, a w praktyce ~1 przy heurystyce „-s” (§3.2) | niskie | Kręgosłup gramatyki dzisiaj. |
| judge (Bubbles ✓/✗) | gramatyka 1–2 | R, F: wyczucie poprawności (noticing) | 1/2 | niskie | Przy wiecznym pudełku 1 to ~35% zadań tematu głównego. Złe zdania pokazują błędne formy (§3.6). |
| fix (Fix the Line) | gramatyka 2–5 | R, F: wykrycie błędu; tylko błędy pisowni / -ing / be | 1/liczba klocków (~1/6) | średnie | Dobre, ale po pomyłce `fix` zapisuje tag błędu, którego dziecko nie popełniło, tylko nie zauważyło (np. `s_spelling`). Zaśmieca wzorce błędów. |
| build (Build the Line / Catch) | gramatyka 2–5 | P+ szyku, **nie** -s (forma czasownika jest podana) | ~0 | średnie / wysokie (Catch: motoryka + pamięć zdania) | Kropka przy ostatnim kafelku zdradza koniec. Zbyt mocno nagradzane (awans do złota). |

Wniosek ogólny: gra jest dziś **automatem do rozpoznawania formy**. Rozpoznawanie jest potrzebne (retrieval practice działa także w formie wyboru), ale:
- produkcja w gramatyce dotyczy tylko szyku (build) i dwóch wąskich wzorców (type), a nie samej końcówki -s,
- **znaczenie nie jest nigdy potrzebne do odpowiedzi.** W podejściu „processing instruction” (VanPatten) i u dzieci (Cameron, Pinter) to właśnie potrzeba zrozumienia zmusza mózg do przetworzenia formy. Bez tego dziecko uczy się reguły „dopisz -s” jako gry w literki, a nie jako znaczenia „on / ona robi to regularnie”.

## 2. Metoda jako całość

### 2.1 Sekwencja: prezentacja → ćwiczenie kontrolowane → swobodniejsze
- **Prezentacja:** karta NEW RULE pokazuje 1 rozwiązany przykład + regułę, a NEW WORD pokazuje obrazek, słowo i dźwięk. To za mało jak na 9-latka i present simple: jedno zdanie bez kontekstu, a dzieci w tym wieku uczą się z wielu przykładów w sytuacji (Muñoz 2006: młodsi uczniowie opierają się na dużej ilości inputu, a nie na regule).
- **Ćwiczenie kontrolowane:** jest i to dużo (cloze, judge, fix, build).
- **Swobodniejsze / znaczeniowe:** brak. Nie ma żadnego zadania, w którym dziecko coś komunikuje albo rozumie (historyjka, pytanie „kto?”, wybór obrazka do zdania, zdanie o sobie / swoim kocie).
- **Natychmiastowy test po prezentacji:** po karcie NEW WORD od razu idzie zadanie na to samo słowo, a trafienie awansuje 0 → 1. To odpowiedź z pamięci roboczej sprzed 3 sekund, a nie przypomnienie. Karpicke i Roediger (2007): kluczowe jest **opóźnienie pierwszego przypomnienia**. Pierwszy „liczący się” test powinien przyjść po 2–4 innych zadaniach.

### 2.2 Powtórki a nowy materiał
- Proporcje nowości są dobre (limity z audytu). Zła jest **mechanika terminów dla rzeczy ćwiczonych codziennie** (punkt 1 na górze). Dane z symulacji, Łucja, 21 dni, `ps_3s` (5 wzorców), liczba wzorców w pudełkach 0/1/2/3/4/5:

| wariant | trafność 80% | trafność 92% |
|---|---|---|
| dziś, stałe pory (15:00 i 16:00) | 0/5/0/0/0/0 | 0/3/2/0/0/0 |
| dziś, losowe pory 14–19 | 0/3/2/0/0/0 do 0/5/0/0/0/0 | 0/2/3/0/0/0 do 0/4/1/0/0/0 |
| po poprawce (termin od dnia kalendarzowego + pudełko rusza tylko 1. odpowiedź dnia), losowe pory | 0/0/0/0/2/3 do 0/0/1/1/0/3 | 0/0/0/0/2/3 do 0/0/0/0/4/1 |

  Dla porównania poboczne `pc` i słówka u Łucji kończą dziś w pudełkach 3–5. **Temat główny wypada najgorzej, choć jest ćwiczony 10× częściej.**
- Tematy poboczne są zagłodzone: `ps_neg`, `ps_q`, `pc`, `pc_vs_ps` dostają łącznie 1–5 zadań dziennie. To zgodne z ustaleniem 68% dla tematu głównego, ale przy 3s-only te umiejętności powinny stać się **częścią** tematu głównego (§4), a nie leżeć obok.
- Przeplatanie wewnątrz tematu działa (plays / watches / studies / has). Nakata i Suzuki (2019) pokazali na gramatyce angielskiej, że mieszanie typów zadań gramatycznych poprawia retencję po tygodniu. To argument za mieszaniem plays / doesn't play / Does…play? / can play w jednym bloku.

### 2.3 Informacja zwrotna
- Po błędzie jest dobra: zdanie z wyróżnioną odpowiedzią, krótkie „why” po angielsku, polska reguła, kontrast obrazków przy słówkach.
- Po trafieniu brakuje **echa**: pełne zdanie z wyróżnioną formą przez ~1 s, opcjonalnie z głosem. To darmowa dodatkowa ekspozycja na poprawną formę w znaczeniu, w momencie największej uwagi.
- Brakuje **drugiej szansy z podpowiedzią** (elicitation). U dzieci w wieku 9–11 lat (immersja francuska, Lyster 2004; Lyster i Ranta 1997) podpowiedź, po której uczeń sam się poprawia, działa na morfologię lepiej niż samo pokazanie dobrej odpowiedzi. W Spell Cast jest to już zrobione („Almost! Fix it”), w gramatyce nie.

### 2.4 Opakowanie arcade: pomaga czy przeszkadza?
Pomaga:
- odpowiedź = akcja (cios), więc każde zadanie jest testem (retrieval), a nie czytanką,
- brak limitu czasu na odpowiedź (to dobrze dla 7–9 lat),
- krótkie biegi i malejące nagrody to rozłożona praktyka.

Przeszkadza / ryzyko:
- ruch celów rośnie z piętrem (`difficulty` = piętro / 60), a boss w 2. fazie robi „Faster now!” i rzuca pociski. Uwaga dzielona między łapanie pocisków a czytanie zdania podnosi obciążenie poznawcze akurat przy bossie, czyli wtedy, gdy zależy nam na najlepszej odpowiedzi (audyt wspomniał to dla Bruna; dotyczy też Łucji przy zdaniach),
- Catch przy budowaniu zdań: dziecko trzyma w głowie zdanie, którego nigdzie nie widzi (prompt pusty), a jednocześnie steruje kotem. Dla 9-latki to trudne z powodu motoryki, a nie angielskiego,
- dzień 1 jest monotonny: bot Łucji w pierwszym biegu miał 14 z 16 zadań „Fill the gap” i wszystkie na tabliczkach. Różnorodność odblokowuje się dopiero z pudełkami, a te (pkt 1) stoją.

### 2.5 Znaczenie, kontekst, personalizacja
- Zdania są poprawne i (po audycie) rzadko absurdalne, ale **bezosobowe i bez historii**: Tom / Mia / Grandma / The witch robią losowe rzeczy. Brakuje ciągłości („Tom” nie ma charakteru), brakuje kota gracza i przyjaciółki z duetu.
- Cordova i Lepper (1996): u dzieci w wieku 9–11 lat personalizacja (imiona, ulubione rzeczy) i kontekst fantasy w zadaniach podniosły **i** motywację, **i** wyniki nauki. Tani efekt: imię własnego kota i kota przyjaciółki jako podmiot („Captain Noodle eats fish every morning.”). Bez imion dzieci: roster nie ma imion, a imię kota jest w zapisie.
- Moon Diary to gotowy nośnik historii. Teraz jest tylko „nagrodą”. Strony w present simple 3. os. („The Night King lives in a dark tower. He hates music.”) + 1 pytanie „Right or wrong?” do treści dałyby jedyne miejsce, gdzie czytanie ma cel.

### 2.6 Motywacja przez tygodnie
- Nowość: skrzynie, skórki, wydarzenia, boss tygodnia, duet. To mocna strona.
- **Widoczność mistrzostwa: odwrócona.** Album kart liczy złoto z pudełek, a temat główny stoi (pkt 1). Łucja zobaczy złote „snake” i „pumpkin”, ale „he plays” zostanie brązowe po 50 dniach grania. W teorii samookreślenia (Deci i Ryan) poczucie kompetencji jest jednym z trzech filarów, a my je chowamy.
- Brakuje **drabinki** widocznej dla dziecka (Max prosi o nią w pkt 4): „-s ✓ → -es ✓ → -ies → doesn't → Does…? → Who…?”. To byłby cel średnioterminowy między skrzynią (krótki) a fabułą (długi).

### 2.7 Słuchanie i mówienie
- Czytający: głos domyślnie wyłączony, listen2pic wyłączone. W praktyce Łucja nie słyszy angielskiego, chyba że sama kliknie głośnik. Dla 9-latków fonologia słowa to połowa słowa.
- Nieczytający (Bruno): wszystko zależy od syntezatora, a „pic2listen” z 4 opcjami (od pudełka 1) to 4 nagrania do porównania w pamięci.
- Mówienia w grze nie da się sprawdzić (rozpoznawanie mowy dziecięcej w przeglądarce jest zawodne). Substytuty:
  1. **nagrane audio słówek** (stała jakość). Max może nagrać sam ok. 300 słów w ~40 minut; „głos nauczyciela” to dodatkowy plus dla dzieci,
  2. **„Say it!”**: po karcie odsłony / NEW WORD opcjonalny przycisk „I said it!” (bez nagrody, bez sprawdzania). Efekt produkcji (MacLeod 2010): powiedzenie na głos poprawia pamięć,
  3. **mostek do lekcji**: raport dla Maxa z listą „5 zdań do powiedzenia na głos na lekcji” (najsłabsze wzorce), czyli mówienie odbywa się na korkach, a gra je przygotowuje,
  4. dla Bruna **TPR-lite** (Asher): „Jump! / Sleep! / Run!” → dziecko wybiera animację kota (3 przyciski-ikony) albo „listen and colour” (red + apple = dwa słowa w jednej decyzji, czyli zalążek składni).

### 2.8 Drabinka gramatyczna (styl Bugs Team 3)
Bugs Team 3 (Macmillan, klasa 3), wg wymagań szkolnych opartych na podręczniku: Starter (alfabet, 1–20, *there is*), U1 dzikie zwierzęta i liczby 10–100 (*they live / eat…*), U2 części ciała zwierząt i *have got*, U3 *can* i sport, U4 **rutyna dnia, zawody, godziny** (tu jest present simple 3. os.: *he gets up at…, a vet helps animals*), U5 sklepy i *there is / are*, U6 wakacje i present continuous. Wniosek: present simple w 3. klasie przychodzi **przez rutynę dnia i zawody**, z godzinami. Nasze zdania mają „every day / on Mondays”, ale brakuje godzin, zawodów i rutyny jako tematu.

Proponowana drabinka dla Łucji / Matyldy (tylko 3. os.), każdy szczebel to istniejące id albo NOWY wzorzec (G decyduje o id):
1. `ps_3s:plain` + `has` (likes, plays, eats, has)
2. `ps_3s:es` (watches, goes, does, brushes, washes)
3. `ps_3s:ies` (studies, flies, carries)
4. NOWY: kontrast w 3. os. — `can` vs zwykłe zdanie (*Tom can swim. / Tom swims every day.*) oraz *doesn't + base* (`ps_neg:base_after`, `ps_neg:neg` w trybie 3s)
5. `ps_q:q` / `ps_q:short` w trybie 3s (*Does she…? Yes, she does.*)
6. NOWY: `Who…?` (*Who plays the piano? → Mia does.* + scena z 3 postaciami, §4 P1-7)
7. NOWY: rutyna z godziną (*Tom gets up at seven o'clock.*; liczby 20–100 i godziny wg prośby Maxa: „bez łatwych liczb”)
8. NOWY: zawody (*A vet helps animals. A teacher works at school.*) w połączeniu ze słówkami `jobs`
9. NOWY: przysłówki częstotliwości (*always / usually / never* + miejsce w zdaniu)
10. (klasa 4) *What / Where does he…?*

Kryterium awansu na szczebel (Max: „powtórki zawsze pierwsze”): poprzedni szczebel ma `skills.m ≥ 0.75` i wszystkie jego wzorce pudełko ≥ 2 (to działa dopiero po poprawce z pkt 1).

### 2.9 Bruno (7, nie czyta)
- Dobrze: zero tekstu, automatyczny dźwięk, tylko słówka.
- Słabo: tylko 2 typy zadań (listen2pic, pic2listen), oba to rozpoznanie pojedynczego słowa. Przez tygodnie będzie to monotonne. Brak dwóch słów naraz (kolor + rzecz, liczba + rzecz), brak działania (TPR), brak piosenki / rymowanki.
- pic2listen z 4 opcjami: obciążenie pamięci roboczej. Przy `noReading` max 3 opcje.

## 3. Konkretne problemy w treści i mechanice (z dowodami)

### 3.1 Dryf terminów (bug) — `js/engine.js` → `record()`
`r.due = now + BOX_DAYS[r.b] * DAY - 3600000` wykonuje się przy **każdej** dobrej odpowiedzi, także niewymagalnej. Rzecz ćwiczona codziennie ma termin „23 h po ostatniej odpowiedzi wczoraj”, więc jeśli dziś gra o tej samej lub wcześniejszej porze, nigdy nie jest wymagalna i nie awansuje. Do tego błąd przy niewymagalnym powtórzeniu (temat główny wraca co 1 zadanie) to −2 pudełka. Trace z symulacji: `d0…d5: 39× OK, b1 przez cały czas`.

### 3.2 Heurystyka „-s” (tryb 3s-only)
Trafienie bez czytania podmiotu (heurystyka „najkrótsza opcja na -s”, 2000 zdań na wzorzec, wersja z HEAD):
`ps_3s:plain` 100%, `ps_3s:has` 100%, `ps_3s:es` 49%, `ps_3s:ies` 49%, `ps_3s:no_s` 0%, `ps_neg:*` 0%, `ps_q:q` 0%.
Po usunięciu `no_s` (liczba mnoga) dla Łucji zostaje głównie plain / has, a te dziecko rozwiąże, nie patrząc na podmiot. Decyzja „-s czy nie” musi zależeć od składni: po *does / doesn't / can* forma bez -s, w zdaniu twierdzącym z -s. Wtedy 3s-only zostaje, a decyzja nie znika.

### 3.3 Build bez wabika
`grammarTask()` → `t.tiles = shuffle(t.words…)`: kafelki to dokładnie słowa zdania. Dla `ps_3s` to ćwiczenie szyku, a nie końcówki, a mimo to `STRONG` awansuje wzorzec do złota.

### 3.4 Brak produkcji -s
`type` istnieje tylko dla `pc:spelling` i plural (świadoma decyzja audytu: „Tom ___ (play) every day” dopuszcza „played”). Dla 9-latków, które nie znają jeszcze past simple, to ryzyko czysto teoretyczne. Dwa bezpieczne wyjścia: (a) wpisywanie z ramą „he / she → ___ (watch)” lub zdaniem z *every day* i akceptowaniem tylko formy -s, a „played” traktować jak „Almost!” (bez kary); (b) mechanika „Ending Smash”: *watch + ?* → tabliczki *-s / -es / -ies* (forma jednoznaczna, odpowiedź zależy od reguły pisowni).

### 3.5 Sens zdań
Z zrzutów i próbek: „The witch cooks soup after school.”, „She has a shower on Mondays.”, „My brother flies a kite every morning.”, „Does my brother watch cartoons?” (poprawne, ale nienaturalne pytanie o „mojego” brata). `TIME_FOR` działa na poziomie obiektu, a potrzebny jest poziom czasownik + obiekt + podmiot (wiedźma nie chodzi do szkoły, prysznic nie bywa tylko w poniedziałki).

### 3.6 Wymyślone literówki
`ps3()` dla zwykłych czasowników tworzy „bad” = `v.b + "es"` (likees, dancees, cookes, plaies). Takich błędów dzieci nie robią. Typowe są *watchs, gos, dos, studys, flys, haves*. Brown (1988) oraz Jacoby i Hollingshead (1990): oglądanie błędnej pisowni obniża późniejszą poprawność własnej pisowni (badania na dorosłych; u dzieci z niepewną pisownią ryzyko jest raczej większe). Dodatkowo „Right or wrong?” pokazuje te formy jako całe zdania, a „Smash the mistake” jako blok.

### 3.7 Tag w „fix” po chybionym klocku
`fixline.js`: `B.finish(ok, task.tag || "fix", …)`. Gdy dziecko kliknie zły klocek, do `save.confusions` trafia tag zasianego błędu (np. `s_spelling`), choć dziecko go nie popełniło. Raport dla Maxa może więc pokazać „błędy w pisowni -s”, których nie było. Lepiej zapisywać `fix` (nie zauważył) i tylko to.

### 3.8 Drobne
- `js/lives.js`: komentarz mówi, że błąd na nowym elemencie jest darmowy, a kod tego już nie robi (decyzja z commita 76e97eb). Trzeba wyrównać komentarz.
- `pl2en` jest liczone jako zadanie „słabe”, co jest poprawne, ale w audycie opisane jako krok ku produkcji. Nie zmieniać kodu, tylko świadomość.

## 4. Benchmark (krótko)

| Podejście / aplikacja | Co działa | U nas | Luka |
|---|---|---|---|
| Spaced repetition (Cepeda i in. 2006; Kang 2016) | rosnące odstępy, test po przerwie | jest, ale dryf terminów (3.1) | poprawić termin i liczenie „tylko pierwsza odpowiedź dnia” |
| Retrieval practice u dzieci (Karpicke, Blunt i Smith 2016; Goossens i in. 2014, słówka w podstawówce) | testowanie > ponowne czytanie, także u 8–10-latków | cała gra to testowanie | 1. test zaraz po prezentacji nie powinien liczyć się jako przypomnienie |
| Interleaving gramatyki (Nakata i Suzuki 2019) | mieszanie typów zadań gramatycznych | w temacie jest | mieszać też ps_3s z doesn't / Does / can / Who |
| Processing instruction / structured input (VanPatten) | zadania, w których forma niesie znaczenie | brak | „Who…?”, obrazek do zdania |
| Corrective feedback u dzieci (Lyster i Ranta 1997; Lyster 2004) | podpowiedź + samodzielna poprawa > gotowa odpowiedź | gotowa odpowiedź | druga szansa po podpowiedzi |
| TPR (Asher 1969), Cameron (2001), Pinter (2006) | działanie, ruch, sens, powtarzalne rutyny, piosenki | brak dla Bruna | TPR-lite, „listen and colour” |
| Task-based (Ellis 2003) | cel komunikacyjny, wynik nie-językowy | brak | mini-zadania: „Find who likes pizza”, Moon Diary z pytaniem |
| Personalizacja (Cordova i Lepper 1996) | imiona, ulubione rzeczy dziecka | brak | kot gracza / kot przyjaciółki w zdaniach |
| Duolingo ABC (3–8 lat, czytanie po angielsku) | wszystko klikalne = dźwięk, nagrany lektor, krótkie lekcje, mapa postępu | TTS, mapa = wieża (bez nauki) | nagrane audio, widoczna ścieżka umiejętności |
| Lingokids / Teach Your Monster to Read | postać i świat niosą naukę, piosenki, mini-gry na znaczenie | świat jest, nauka obok | fabuła = input; różnorodność zadań od dnia 1 |
| Duolingo (główna) | „skill path” z koronami, mieszanie typów, zadania słuchowe i mówione | album kart | drabinka widoczna dla dziecka |

## 5. Lista zmian (priorytety)

Właściciele: **G** = `js/engine.js`, `data/grammar.js`, `js/game/mechanics/index.js`, walidator, roster. **D** = `js/game/run.js`, `js/game/runui.js`, `js/ui/*`, `data/progression.js`, `css/*`. **G\*** = pliki mechanik (`signs.js`, `fixline.js`, `catch.js`, `spell.js`, `bubbles.js`) nie są przypisane w `docs/STAGE4.md`, więc lead decyduje (proponuję G, bo to routing zadań). **Max** = decyzja / nagrania.

### P1 (przed wypuszczeniem treści 3s-only)

**P1-1. Naprawić terminy powtórek (G)**
- Co: w `record()`: (a) termin liczony od początku lokalnego dnia: `due = początek dnia(now) + BOX_DAYS[b] dni` (zgodnie z ideą „minęła noc”); (b) dobra odpowiedź na rzecz niewymagalną **nie zmienia** `due` ani `b` (tylko `st`, `skills.m`, log); (c) błąd na rzecz niewymagalną: bez −2, tylko `st = 0`, `due = min(due, jutro)` + requeue w biegu (jest). Opcjonalnie −1, jeśli to drugi błąd tego dnia na tym kluczu. Błąd na wymagalnej: jak dziś.
- Efekt: temat główny zaczyna rosnąć (symulacja: `ps_3s` w pudełkach 3–5 po 21 dniach zamiast 1–2), więc odblokowują się build / fix / type i złote karty dla tematu, który dziecko ćwiczy najwięcej. **Zależność:** drabinka, którą G właśnie dodaje w `engine.js` (`known(r) = r.b >= 2 || …`, blokada „najpierw powtórki” przez `r.due`), opiera się na pudełkach i terminach. Bez tej poprawki szczeble tematu głównego odblokują się tylko przez zapasową regułę `n ≥ 6 && 80%`, a liczba „due” będzie zaniżona.
- Test: nowy blok w `tools/check-grammar.mjs`: (1) dobra odpowiedź o 20:00, potem wczesna gra następnego dnia o 9:00 → rzecz jest wymagalna; (2) 10 dobrych odpowiedzi tego samego dnia nie zmienia `due`; (3) symulacja 21 dni Łucji przy trafności 85%: mediana pudełka wzorców tematu głównego ≥ 3, a udział zadań build + fix + type w temacie głównym w dniach 15–21 ≥ 25%.

**P1-2. Tryb 3s bez heurystyki „-s” (G)**
- Co: w `subjects: "3s"` (praca G w toku) temat główny Łucji / Matyldy = pakiet: `ps_3s:*` + `ps_neg:base_after` / `ps_neg:neg` (3s) + `ps_q:q` / `short` (3s) + NOWY wzorzec kontrastu `ps_3s:vs_base` (ta sama osoba, raz *Tom ___ football every day*, raz *Tom can ___ / doesn't ___ football*). Opcje w każdym takim zadaniu zawierają **i** formę -s, **i** bazową. Do rozważenia: traktować te umiejętności jako jeden „main” (np. `focus[0]` jako lista lub alias `ps3_pack`), żeby 68% nie zjadało tylko `ps_3s`.
- Efekt: decyzja o -s zależy od składni (does / can / zwykłe zdanie), a nie od wyglądu opcji. Przeplatanie (Nakata i Suzuki 2019).
- Test: walidator liczy heurystykę „wybierz opcję na -s” na symulowanych zadaniach Łucji (luka + judge): trafność ≤ 60%; w każdym biegu ≥ 30% zadań gramatycznych tematu głównego ma odpowiedź bez -s; zero podmiotów I / you / we / they / liczba mnoga w profilu 3s.

**P1-3. Wabik w układaniu zdań (G + G\*)**
- Co: `grammarTask()` dla `build` przy wzorcach `ps_3s`, `ps_neg:base_after`, `ps_q` dokłada 1 kafelek-wabik = zła forma czasownika z `q.wrong` (np. „play” przy „plays”; „likes” przy „doesn't like”). `fixline.js` (build) i `catch.js` muszą kończyć sprawdzanie, gdy `placed.length === task.words.length` i zostawiać wabik w stosie (catch już obsługuje dodatkowe tokeny; fixline sprawdzić). Odsłona bez zmian.
- Efekt: build sprawdza szyk **i** zgodność -s, więc awans do złota jest zasłużony.
- Test: walidator: każde `build` dla tych wzorców ma dokładnie 1 wabik, a zdanie z wabikiem zamiast formy jest niepoprawne (mini-wyrocznia); bot `lucja` przechodzi bez błędów; ręcznie: zrzut z dwoma kafelkami „plays” / „play”.

**P1-4. Echo po dobrej odpowiedzi (D)**
- Co: w `run.js` → `onRight()` dla zadań gramatycznych pokazać nad kotem pasek / dymek z `q.full` (forma docelowa pogrubiona) przez ~1,2 s, równolegle z animacją ciosu (bez blokowania; tap = pomiń); dla słówek podpis słowa pod obrazkiem. Głos tylko gdy `settings.voice`.
- Efekt: każda dobra odpowiedź = dodatkowa ekspozycja na poprawne zdanie w całości. Zero kosztu czasu, bo trwa podczas animacji.
- Test: zrzut po trafieniu w cloze / judge / build; średni czas zadania w bocie rośnie o ≤ 0,3 s; brak tekstu dla `noReading` (dla Bruna samo słowo audio).

**P1-5. Dystraktory pisowni: tylko realne błędy, i nie od razu (G)**
- Co: `ps3()` w `data/grammar.js`: dla zwykłych czasowników bez -ch / -sh / -o / -y nie generować „bad” (likees, dancees, cookes, plaies); dystraktory = forma bazowa + -ing. Dla -es / -ies / have zostawić realne błędy (watchs, gos, dos, studys, flys, haves), ale w lukach dopiero od pudełka ≥ 2, a w `judge` / `fix` dalej (mają sens na wykrywanie).
- Efekt: dzieci nie oglądają form, których same by nie wymyśliły (Brown 1988; Jacoby i Hollingshead 1990); spada „szum” w raportach.
- Test: walidator: lista dozwolonych błędnych form pisowni (biała lista); żadne zadanie przy pudełku 0–1 nie pokazuje literówki.

**P1-6. Pierwszy test nowości z opóźnieniem (G, drobna zmiana w D)**
- Co: zadanie zaraz po karcie NEW WORD / NEW RULE oznaczyć `task.justIntroduced = true`. `record()` nie daje wtedy awansu 0 → 1, a silnik dokłada `requeue` tej rzeczy za 3–5 zadań; awans 0 → 1 dopiero za to opóźnione trafienie. W `run.js` nic poza przekazaniem flagi (koszt w życiach bez zmian).
- Efekt: pierwsze prawdziwe przypomnienie po przerwie (Karpicke i Roediger 2007); pudełko 1 znaczy „pamiętam po chwili”, a nie „pamiętam sprzed 3 sekund”.
- Test: symulacja: w ≥ 90% przypadków nowa rzecz pojawia się drugi raz w tym samym biegu po 3–5 zadaniach; brak awansu 0 → 1 dla zadania tuż po karcie.

**P1-7. Zadanie na znaczenie: „Who…?” ze sceną (G + D)**
- Co: nowy wzorzec 3s (G) zwraca `{ scene: [{name:"Tom", img:"👦", likes:["🍕","⚽"]}, {name:"Mia", img:"👧", …}, {name:"Grandma", …}], question: "Who plays the piano?", answer: "Mia" }`. Prompt (D, `runui.prompt`) pokazuje 3 postaci z 2 ikonkami każda, a odpowiedź wybiera się na tabliczkach (Signs) z imionami / obrazkami. Odsłona: „Mia plays the piano. 🎹”. Wariant 2: odwrotnie, „Mia ___ the piano” z opcjami `plays / play / playing` i sceną jako kontekst. Max wprost prosi o „Who…?”.
- Efekt: pierwsze zadanie, w którym trzeba zrozumieć zdanie; forma 3s w funkcji (VanPatten, task-based).
- Test: walidator: dokładnie 1 postać pasuje do pytania; emoji wg zasad z `CLAUDE.md`; zrzut mobile 390 px czytelny (3 postaci w 1 rzędzie); bot.

### P2 (następny krok)

**P2-1. Druga szansa z podpowiedzią (D + G)**: cloze / judge przy pudełku ≥ 1: po pierwszym błędzie pokazać `TAG_WHY` jako dymek („After doesn't → no -s.”), zła tabliczka odpada, dziecko wybiera jeszcze raz. Sukces za drugim razem = „SAVED!”, bez utraty życia, ale w SRS jak błąd (`st = 0`, bez −2; tag zapisany). Efekt: samodzielna poprawa (Lyster 2004). Test: bot: przy celowo złej pierwszej odpowiedzi pojawia się druga próba; `save.lives.n` bez zmian po „SAVED!”; `srs.b` nie rośnie.

**P2-2. Personalizowane zdania (G)**: `make(rng, opts)` dostaje `opts.names = { cat: save.catName, friendCat: kot z duetu z pub }`; w ~15% zdań 3s podmiotem jest kot gracza lub kot przyjaciółki (tylko czynności zwierzęce: `ANIMAL_OBJS`). Żadnych imion dzieci. Efekt: personalizacja (Cordova i Lepper 1996) i duet w treści. Test: walidator z przykładowymi imionami („Sir Pickles”); sanitizacja (litery, spacje, max 16 znaków); `isAnimal` obsługuje imiona kotów.

**P2-3. Drabinka widoczna dla dziecka (D, dane od G)**: G eksportuje `LADDER = { lucja: [...] }` / `ladderState(save, profile)` (szczeble z §2.8, stan z `skills.m` i pudełek); D pokazuje pasek szczebli (pikselowe stopnie z ikoną „-s”, „-es”, „-ies”, „doesn't”, „Does?”, „Who?”) na ekranie Cards lub przy wieży + stempel „NEW STEP!” przy odblokowaniu. Efekt: widoczna kompetencja, cel średnioterminowy (pkt 4 Maxa). Test: zrzut; spójność z raportem w `teacher.html`.

**P2-4. Boss = powtórka (G + D)**: `Session.next({ prefer: "review" })`. Dla zadań bossa preferować rzeczy niewidziane w tym biegu i starsze (pudełko ≥ 2, wymagalne lub prawie). `run.js` woła to w walce z bossem. Boss przestaje być „najtrudniejszym ruchem”, a staje się „sprawdzianem z tygodnia”. Efekt: przypominanie z odstępem, a zarazem sens dla bossa. Test: symulacja: ≥ 70% zadań bossa to powtórki; brak nowości u bossa.

**P2-5. Sens zdań: `TIME_FOR` na poziomie czynności (G)**: mapy dozwolonych podmiotów i czasu dla par czasownik + obiekt (prysznic: every morning / every evening; wiedźma: bez „after school / to school”; kite: at the weekend). Max przegląda 30 losowych zdań na wzorzec (lista z walidatora do skopiowania). Test: nowe regexy w `SENSE`; akceptacja Maxa.

**P2-6. Nagrane audio słówek (Max + D, G w doborze typów)**: `audio/words/<en>.mp3` (Max nagrywa albo jednorazowe generowanie dobrym TTS); `js/audio.js` (nieprzypisany, D\*) gra plik, jeśli jest, inaczej TTS. Gdy audio jest dostępne, G włącza `listen2pic` dla czytających od pudełka ≥ 2 i auto-odtwarzanie przy NEW WORD i odsłonie. Efekt: fonologia słowa dla wszystkich, stała jakość dla Bruna. Test: lista brakujących plików w walidatorze; offline działa (fallback TTS).

**P2-7. Produkcja -s (G + G\*)**: wariant „Ending Smash” (*watch + ? → -s / -es / -ies*, Signs) od pudełka 2 i wpisywanie `type` dla 3s od pudełka 3 z ramą „(he) ___ (watch) every day” i akceptacją tylko formy -s („played / watched” → „Almost! Present simple!”, bez kary). Efekt: przypomnienie formy zamiast rozpoznania. Test: walidator: odpowiedź jednoznaczna; „Ending Smash” tylko dla czasowników z regułą.

**P2-8. Mostek do lekcji (G, raport)**: `reportText()` dopisuje sekcję „NA LEKCJĘ (na głos)”: 5 zdań z najsłabszych wzorców i 5 słówek z najczęstszych pomyłek. Max używa ich na korkach. Efekt: mówienie poza grą, celowane. Test: raport z symulowanego zapisu zawiera sekcję z 5 + 5 pozycjami.

**P2-9. Tag w `fix` (G\*)**: przy kliknięciu złego klocka zapisywać tag `fix`, a nie tag zasianego błędu. Test: symulacja: chybiony fix nie podnosi `confusions.s_spelling`.

### P3 (później / jeśli starczy czasu)

- **P3-1. Moon Diary jako input (D, `data/progression.js` STORY + G na pytanie):** strony przepisane na present simple 3. os., z jednym pytaniem „Right or wrong?” do treści (bez wpływu na SRS, nagroda: strona się „świeci”). Test: każda strona ≤ 3 zdania A1, pytanie jednoznaczne.
- **P3-2. Bruno: więcej formatów (G + G\*):** max 3 opcje w `pic2listen` dla `noReading`; „listen and colour” (*red apple* vs *green apple* vs *red car*); TPR-lite „Jump! / Sleep! / Run!” → wybór animacji kota (ikony akcji). Test: zero tekstu na ekranie; walidator jednoznaczności (kolor + rzecz).
- **P3-3. „Say it!” (D):** opcjonalny przycisk po NEW WORD / odsłonie dla Niny i Bruna; tylko licznik do raportu, bez nagród (żeby nie klikać na pusto dla rybek).
- **P3-4. Zręczność a język (D):** przy zadaniach zdaniowych (cloze z długim zdaniem, build, Catch) wolniejsze cele u bossa; „Faster now!” dotyczy pocisków, a nie tabliczek. Dla `noReading` `difficulty ≤ 0.3`. Test: zrzut bossa w fazie 2 z czytelnymi tabliczkami.
- **P3-5. Słówka w kontekście (V / G):** od pudełka 2 czasem luka zdaniowa ze słówkiem (*The cow says ___.* → obrazki) i „odd one out” z kategorii (jest w DESIGN.md, nie ma w kodzie).
- **P3-6. Różnorodność od dnia 1 (G):** na pudełku 0 gramatyki dopuścić `judge` dla co 4. zadania albo „Who…?” (P1-7), żeby pierwszy bieg nie był 14 × „Fill the gap”.
- **P3-7. Komentarz w `js/lives.js`** zgodny z kodem (nowe rzeczy nie są już darmowe).

## 6. Pytania do Maxa
1. 3s-only dla Matyldy: czy dotyczy też `be` i `have_got` (*he is / he has got* bez *I am / they have got*)? G właśnie robi `S3()` dla obu, więc tylko potwierdzić.
2. Czy w „Who…?” mogą padać odpowiedzi *Tom does.* (krótka odpowiedź), czy samo imię?
3. Czy nagrasz słówka swoim głosem (~300 słów, ok. 40 minut)? To najtańsza poprawa słuchania dla wszystkich i dla Bruna.

## Źródła (skrót)
Asher 1969 (TPR) · Brown 1988; Jacoby i Hollingshead 1990 (ekspozycja na błędną pisownię) · Cameron 2001; Pinter 2006 (nauczanie dzieci) · Cepeda i in. 2006; Kang 2016 (spacing) · Cordova i Lepper 1996 (personalizacja u dzieci) · Deci i Ryan (SDT) · Ellis 2003 (task-based) · Goossens i in. 2014 (retrieval, słówka, podstawówka) · Karpicke i Roediger 2007 (opóźnienie pierwszego testu) · Karpicke, Blunt i Smith 2016 (retrieval u dzieci) · Lyster i Ranta 1997; Lyster 2004 (prompts u dzieci) · MacLeod i in. 2010 (efekt produkcji) · Muñoz 2006 (wiek a nauka L2) · Nakata i Suzuki 2019 (interleaving gramatyki) · VanPatten 2004 (processing instruction). Bugs Team 3: zakres wg wymagań edukacyjnych SP 59 Poznań, 2024 (na podstawie podręcznika).
