# Nine Lives: audyt pod kątem nauki (dla Maxa)

Stan: 31.10.2026. Zakres: `js/engine.js`, `data/grammar.js`, `data/vocab.js`, `js/game/mechanics/index.js`, `tools/check-grammar.mjs`.
Każdy punkt ma ocenę, dowód (badania i to, co robił kod) oraz zmianę. ✅ = wdrożone, ➡️ = do zrobienia przez innych (lead / G / H).

## Najważniejsze w 30 sekund
1. **Były zadania z dwiema dobrymi odpowiedziami.** Na przykład `___ you swim?` z opcją **Do** (zdanie „Do you swim?” jest poprawne), „Smash the mistake” w zdaniu „Fish can walk” (da się naprawić też na „Fish can **swim**”), „Tom ___ football **now**” (przy „now” present simple też bywa poprawny). ✅ Naprawione, a walidator ma teraz mini-wyrocznię gramatyczną i sam łapie takie przypadki (sprawdziłem: po celowym zepsuciu kodu walidator zgłasza ok. 800 błędów).
2. **Temat główny nie był wcale wyróżniony** (wszystkie elementy `focus` miały wagę 1). ✅ Teraz ok. 68% zadań (w symulacji 66–71%).
3. **Złota karta mogła wpaść za zgadywanie.** Przy 2 opcjach albo w „Right or wrong?” szansa na trafienie na ślepo to 50%. ✅ Teraz awans wymaga 2 dobrych odpowiedzi z rzędu, a pudełka 4–5 zdobywa się tylko zadaniami „mocnymi” (pisanie, literki, układanie zdania, znajdź błąd).
4. **Po pomyłce kot nic nie wyjaśniał po angielsku.** ✅ Karta odsłony pokazuje teraz krótką regułę po angielsku dla TEGO zdania („Tom → watch + es → watches”), typ błędu („After does / doesn't → no -s.”), a przy słówkach kontrast „That is "dog". This is "cat".” z obrazkiem.
5. ➡️ **Życia karzą za błędy, które są potrzebne do nauki** (nowe słowo, pierwsze pisanie). Proponuję: bez utraty życia przy `task.firstTry` (pole już jest w zadaniu).

---

## 1. Powtórki rozłożone w czasie (spacing)
- **Ocena:** dobra baza, ale awans był za łatwy. Pudełka 0–5, odstępy 0/1/2/4/8/16 dni.
- **Dowód:** Cepeda i in. (2006, 2008): najlepszy odstęp rośnie z czasem, przez jaki chcemy pamiętać, a rozszerzające się odstępy działają u dzieci. Problem w kodzie: element z pudełka 1 mógł awansować **tego samego dnia** (`r.b <= 1`), więc nowe słowo przechodziło 0 → 1 → 2 w jednym biegu i wracało dopiero po 2 dniach. To nauka „na masę” (massed), która udaje powtórkę.
- **Zmiana ✅:** tego samego dnia awansuje się tylko 0 → 1. Dalsze pudełka wymagają, żeby powtórka była wymagalna (due), czyli żeby minęła noc. Sen konsoliduje pamięć (Diekelmann i Born, 2010). Pomyłka: −2 pudełka i powrót tego samego zadania za 2–4 zadania (bez zmian, to dobre).

## 2. Co liczy się jako sukces (zgadywanie)
- **Ocena:** słabo. Każde trafienie było pełnym sukcesem.
- **Dowód:** przy 2 opcjach ok. 50% trafień to czysty przypadek. Taka „wiedza” fałszuje raport i karty w albumie.
- **Zmiana ✅:** `guessRate(task)` liczy szansę na zgadnięcie (1/liczba opcji, right/wrong = ½, znajdź błąd = 1/liczba klocków, pisanie = 0).
  - Jeśli szansa jest powyżej ⅓, awans wymaga 2 dobrych z rzędu (`srs.st`, nowe opcjonalne pole; brak pola = 0, więc migracja niepotrzebna).
  - Trafienie, które mogło być zgadnięciem, proporcjonalnie mniej podnosi „opanowanie” (`skills.m`).
  - Bez zmian: <700 ms = bez awansu (klik na oślep), użyta podpowiedź = bez awansu.
- `cardTier` i raport liczą jak dotąd z `r.b`, więc album i panel są spójne. Złota karta jest po prostu trudniejsza i bardziej „prawdziwa”.

## 3. Praktyka przypominania (retrieval) oraz rozpoznawanie a produkcja
- **Ocena:** quiz to retrieval (dobrze: Roediger i Karpicke, 2006, efekt testowania), ale gramatyka była prawie w całości rozpoznawaniem: luka z 2–3 opcjami. Pisania w gramatyce nie było wcale.
- **Dowód:** generowanie odpowiedzi daje trwalszy ślad niż jej rozpoznanie (generation effect: Slamecka i Graf, 1978). Produkcja powinna rosnąć razem z opanowaniem.
- **Zmiana ✅:** progresja według pudełka:

| pudełko | słówka (czytający) | gramatyka |
|---|---|---|
| 0 | word2pic, listen2pic, pic2word (3 opcje) | luka (3 opcje) |
| 1 | + pic2listen | luka / right-or-wrong |
| 2 | pic2word, pl2en, listen2pic, **literki** | luka, znajdź błąd, right-or-wrong, **układanie** |
| 3 | **literki, pisanie**, pl2en, pic2word | **układanie**, znajdź błąd, luka, **wpisz** |
| 4–5 | **pisanie ×2, literki**, pl2en | **układanie ×2, wpisz**, znajdź błąd, luka |

  - Nowe zadanie gramatyczne **„wpisz brakujące słowo”** (mechanika Spell Cast) jest tylko tam, gdzie odpowiedź jest jedna: `Tom is ___ (run) now.` → running oraz liczba mnoga `one mouse → two ___`. Celowo NIE ma go w present simple: `Tom ___ (play) football every day` przyjmuje też „played”.
  - Jeśli wylosowany typ jest niewykonalny, silnik bierze inny typ z listy tego samego pudełka, a nie od razu lukę, więc produkcja nie znika.
  - Limit długości: literki do 9 liter, pisanie do 10 liter. Dłuższe hasła („police officer”) dostają pl2en.

## 4. Przeplatanie a bloki, temat główny ~65–70%
- **Ocena:** nie było zaimplementowane. W `focus` każdy temat miał wagę 1, a limit 2 nowych wzorców gramatyki na bieg był wspólny, więc mógł go „zjeść” temat poboczny.
- **Dowód:** przeplatanie podobnych kategorii poprawia rozróżnianie (Rohrer i Taylor, 2007; Kornell i Bjork, 2008). Jednocześnie początkujący potrzebują dużo ekspozycji na jeden temat. Twoja decyzja (65–70% tematu głównego) to rozsądny kompromis: blok na poziomie tematu, przeplatanie wewnątrz (plays / watches / studies / has / I play).
- **Zmiana ✅:** `MAIN_SHARE = 0.68`. Gdy temat główny ma kandydatów, losujemy go z tym prawdopodobieństwem. Wzorce gramatyczne tematu głównego mogą wracać po 1 zadaniu (zdania są za każdym razem inne), reszta po 4. Osobne limity nowych rzeczy: temat główny 4 słówka / 2 wzorce na bieg, reszta 2 / 1. **Symulacja 21 dni: Łucja 71%, Nina 66%, Bruno 69%.**

## 5. Pożądane trudności (desirable difficulties)
- **Ocena:** OK po zmianach. Bjork (1994): trudności, które wymagają wysiłku przy przypominaniu (odstęp, przeplatanie, generowanie), pomagają. Przypadkowe trudności (dwuznaczne zadania, za długie słowa, zgadywanie) to szum.
- **Zmiana ✅:** usunąłem trudności złe (dwuznaczności, za długie literki, „Listen!” przy cichej czynności), a dodałem dobre (produkcja przy wyższych pudełkach, przeplatanie wzorców).
- ➡️ Prędkość tabliczek i baniek rośnie z piętrem. To zręczność, a nie angielski. Dla 7-latków (Bruno) warto ograniczyć `difficulty` przy `noReading`.

## 6. Informacja zwrotna
- **Ocena:** była natychmiastowa i korygująca (pokazanie dobrej odpowiedzi), ale nie wyjaśniała. Polska reguła pojawiała się tylko z włączonym PL, a po angielsku nie było nic.
- **Dowód:** Hattie i Timperley (2007): największy efekt ma informacja zwrotna na poziomie zadania i procesu („dlaczego”), a nie samo „źle”. Shute (2008): krótka, konkretna, od razu.
- **Zmiana ✅:**
  - każdy wzorzec ma `why` (prosty angielski, konkretny dla zdania) i `hint` (polska reguła),
  - każda zła opcja ma tag błędu i krótki komunikat `TAG_WHY`,
  - słówka pokazują kontrast: co dziecko kliknęło (obrazek i słowo), a co było dobre,
  - przy pisaniu słowo jest przeliterowane (`c-a-t`).

  `record()` zapisuje to w `task.feedback`, a karta odsłony (`runui.revealCard`, mała zmiana opisana w raporcie) to pokazuje.
- ➡️ Gramatyka nie ma karty „NEW!” jak słówka. Przy pierwszym spotkaniu wzorca warto pokazać 1 przykład z rozwiązaniem (efekt przykładu z rozwiązaniem, Sweller). Pole `task.firstTry` jest gotowe.

## 7. Wzorce błędów i naprawianie
- **Ocena:** dobra idea (tag błędu → umiejętność do wzmocnienia), ale połowa złych opcji nie miała tagów (be, have got, can, there, plural), więc tych błędów system nie widział.
- **Zmiana ✅:** każda zła opcja ma tag (walidator to wymusza), jest 11 nowych tagów z opisem po polsku do raportu i mapowaniem na umiejętność. Pomyłki przy słówkach (`pick:<słowo>`) trafiają do logu, ale nie zaśmiecają wzorców błędów gramatyki.

## 8. Jakość treści (audyt każdego słówka i wzorca)
Naprawione w danych ✅:
- **Dwuznaczne zadania z luką i dystraktorami:** `can:q` (Do you…? / Does he…?), `plural` (fishes i busses są poprawne, więc wypadły), `pc` z gołym „now” (wypadło, zostały right now / at the moment / Look! / Listen! / Shh!).
- **„Smash the mistake” tylko tam, gdzie błąd da się naprawić wyłącznie w jednym klocku.** Błąd zgodności „He play” odpada, bo „**We** play” też jest poprawne. „She isn't play” odpada, bo „isn't **playing**” też. „Fish can walk” odpada. Zostają błędy pisowni (watchs, runing), „Tom playing football”, „There is two cats”.
- **„Right or wrong?”** tylko dla zdań złych w każdym odczytaniu. Zamiana czasów i fakty („Fish can walk”) są wyłączone.
- **Układanie zdań** tylko przy jednej możliwej kolejności: bez „Tom and Mia” (= Mia and Tom), bez „Look! She…” (= „She…. Look!”), maksymalnie 7 klocków.
- **Nonsensy:** zwierzęta robią tylko zwierzęce rzeczy (było „The dog writes an email”, „My cat has got a new bike”), pora dnia pasuje do obiektu (było „has breakfast every evening”, „goes to school at the weekend”), „like” bez „every day”, bez „I am my friend” i bez „Grandma is ten years old”.
- **Słówka:** tired 😴 → 🥱 (😴 = sleep), bored 😒 → 😑, holiday ✈️ → 🧳 (✈️ = plane), poprawione polskie tłumaczenia (dzidziuś, nauczyciel / nauczycielka, piosenkarz / piosenkarka…).
- **Strażnik dystraktorów w silniku:** nigdy dwa takie same obrazki, słowa ani tłumaczenia (orange 🍊 i kolor, cook jako zawód i czynność, egg w dwóch tematach), a do tego `CONFUSABLE` w `data/vocab.js`: 50+ grup słów, które przy jednym obrazku mogą być „dobre”. Przykłady: rain / cloud / storm, ball / football / tennis, bird / owl / duck, tree / forest, car / taxi, hand / arm, teddy bear / bear, red / read (homofon TTS).

## 9. Obciążenie poznawcze i czytanie (7–9 lat), Bruno
- **Ocena:** w porządku, z drobnymi poprawkami. Zdania mają 4–8 słów, A1.
- **Zmiany ✅:**
  - limity nowych rzeczy na bieg (temat główny 4 słówka / 2 wzorce, reszta 2 / 1) i na dzień (10 słówek, 4 wzorce),
  - limity długości dla literek i pisania,
  - TTS nie czyta „___”, „→”, nawiasów, a „wind” mówi jako „the wind” (inaczej syntezator potrafi przeczytać /waɪnd/).
- **Bruno (noReading):** pula zawiera tylko słówka, także w Shadow Cellar (wcześniej mogła tam trafić gramatyka). Zadania to wyłącznie listen2pic / pic2listen, bez żadnego tekstu w poleceniu, z automatycznym dźwiękiem. Walidator to sprawdza.
- ➡️ Karta „NEW WORD” i karta odsłony pokazują tekst. Dla Bruna to tylko dodatek, bo dźwięk gra.

## 10. Wsparcie L1 (polski)
- **Ocena:** dobrze, że polski jest podpowiedzią, a nie głównym kanałem. Badania nad L1 w nauce L2 u dzieci (np. Macaro, 2005) wspierają krótkie objaśnienia w L1. pl2en uczy przekładu w stronę produkcji.
- **Zmiana ✅:** polskie reguły przy każdym wzorcu, poprawione tłumaczenia, a przy wpisywaniu w gramatyce polecenie „Wpisz brakujące słowo”.

## 11. Motywacja
- **Nagrody (efekt nadmiernego uzasadnienia):** Deci, Koestner i Ryan (1999) pokazali, że oczekiwane nagrody za wykonanie mogą obniżać motywację wewnętrzną, a nagrody nieoczekiwane i informacyjne nie szkodzą. Gra ma oba rodzaje (rybki za odpowiedź oraz niespodzianki: mimik, skrzynie, złoty potwór). ➡️ Zostawić niespodzianki. W komunikatach mówić o postępie („New card: gold!”), a nie o zarobku.
- **Życia a lęk przed błędem:** −1 życie za każdy błąd uczy unikania ryzyka i zgadywania. Kara jest też niesprawiedliwa przy rzeczach, których dziecko jeszcze nie znało. Badania nad „productive failure” (Kapur, 2008) i błędami w nauce pokazują, że błąd z dobrą informacją zwrotną pomaga, jeśli nie jest karany. ➡️ **G:** w `onWrong` nie odbierać życia, gdy `task.firstTry === true` (pierwsza próba danego elementu). Można dodać komunikat „BRAVE TRY”. Rozważyć to samo dla `type`/`build` przy pudełku ≤3.
- **Malejące nagrody** (20/30/45 min): to zgodne z nauką. Rozłożona praktyka bije maraton, a krótkie sesje (3–5 min bieg) dobrze pasują do uwagi 7–9-latków. Bez zmian.

## 12. Długość sesji
- **Ocena:** dobrze. Bieg ma ok. 25–35 zadań, 3–5 min. Limity nowych rzeczy pilnują, żeby w jednym biegu nie było „ściany nowości”.

## 13. Wymowa (TTS)
- **Ocena:** en-GB, tempo 0.85, w porządku. Ryzyka: pojedyncze słowa bez kontekstu (read: /riːd/ czy /red/, wind) oraz brak kontroli nad głosem systemowym.
- **Zmiana ✅:** czyszczenie tekstu dla TTS (`sayText`) i poprawka dla „wind”. „red” i „read” nigdy nie pojawiają się razem jako opcje.
- ➡️ Na dłuższą metę: nagrać 260 słówek (lub wygenerować raz i zapisać pliki), żeby wymowa była stała na każdym urządzeniu.

---

## Walidator (`node tools/check-grammar.mjs`, wynik musi być ALL BAD 0)
Sprawdza:
- 2000 zdań na wzorzec: kształt, tagi, opisy PL, `why`, sensowność (zwierzęta, pory dnia, wiek), mini-wyrocznię „czy zła opcja daje poprawne zdanie”,
- słówka: duplikaty, zakazane emoji, wspólne emoji bez wpisu w `CONFUSABLE`,
- KAŻDY typ zadania i KAŻDE przypisanie mechaniki (`planTask`) dla każdego wzorca i słówka na każdym pudełku, także dla profilu nieczytającego: unikalne opcje, dokładnie jedna dobra, poprawna odsłona, spójność fix / build / judge / spell / type, brak nie-zdań w mechanikach zdaniowych, jednoznaczne układanie, brak tekstu dla nieczytających, brak symboli w TTS,
- symulację 21 dni gry trzech profili: udział tematu głównego 58–80%, różnorodność, limity nowych rzeczy, złoto nigdy za samo rozpoznawanie.

Ostatni wynik: ok. 47 000 zadań gramatyki i 44 000 słówek, **ALL BAD 0**.
