# Nine Lives: plan gramatyki i drabinka (Agent G, 05.11.2026)

Pliki: `data/grammar.js` (wzorce), `js/engine.js` (ścieżka, powtórki), `tools/roster-src.json` (path uczniów), `tools/check-grammar.mjs` (walidator i symulacje).

## 1. Prośba Maxa: Łucja i Matylda tylko w 3. osobie
- Profil w rosterze: `"subjects": "3s"`. Silnik przekazuje go do generatorów (`patterns[p](rng, { subjects: "3s" })`). Wtedy podmiotem są tylko he / she / it, imiona, my teacher, my mum, the cat… Nie ma I / you / we / they ani liczby mnogiej.
- Wzorce, które bez liczby mnogiej nie mają sensu, wypisuje `skill.skip3s` i silnik ich nie losuje: `ps_3s:no_s` (they play) i `can:facts` (Birds can fly). Dotyczy to też Shadow Cellar.
- Tryb działa we wszystkich umiejętnościach z podmiotem (be, have_got, can, ps_*, pc). Na ścieżce dziewczynek są tylko present simple i have got. Przy samym „is” `be` byłoby trywialne, więc go tam nie ma.
- Walidator sprawdza 600 zdań na wzorzec w trybie 3s (żadnego I / you / we / they ani podmiotu w liczbie mnogiej) oraz każde zadanie w 30-dniowej symulacji.

## 2. Nowe wzorce (klucze `g:<skill>:<wzorzec>`, nic istniejącego nie zmienione)
| Umiejętność | Wzorzec | Przykład | Złe opcje (tag) |
|---|---|---|---|
| `ps_3s` | `vs_base` | *Tom ___ football every day.* / *Tom can ___ football.* / *Does Tom ___ football?* | play / plays / playing (no_s, s_after_modal, s_after_does, ing_confusion) |
| `have_got` | `q3` | *___ your cat got a long tail?* → Has | Have, Does, Is |
| `have_got` | `short3` | *Has Mia got a dog? — Yes, she ___.* → has | does, is |
| `ps3_like` (nowa) | `likes` | *Zoe ___ (like) maths.* → likes | like, liking |
| | `doesnt` | *Tom likes cats, but he ___ dogs.* → doesn't like | don't like, doesn't likes, not like (nowy tag `missing_do`) |
| | `like_ing` | *Mia likes ___ (swim).* → swimming | swim, swims (nowy tag `like_ing`), swiming |
| `ps3_routine` (nowa) | `routine` | *She ___ (get) up at seven o'clock.* → gets | get, getting, (gos / haves / watchs) |
| | `what_time` | *What time ___ your dad go to work?* → does | do, is |
| `ps3_who` (nowa) | `who_q` | *Who ___ (live) in a castle?* → lives | live, living, (teachs / flys) |
| | `who_short` | *Who plays the guitar? — Tom ___.* → does | do, is |
| | `who_scene` | *🎸 Tom · 🍕 Mia · 📚 Grandma. Who reads books? — ___ does.* → Grandma | pozostałe imiona (nowy tag `who_meaning`) |
| `ps3_wh` (nowa) | `what_does` | *What ___ Leo want for his birthday?* → does | do, is |
| | `where_does` | *Where ___ your cat sleep?* → does | do, is |
| | `base_after` | *What does she ___ for breakfast?* → eat | eats, eating |
| `ps3_freq` (nowa) | `freq_s` | *Tom always ___ (brush) his teeth in the morning.* → brushes | brush, brushing, brushs |
| | `freq_order` | *Mia ___ to school by bus.* → usually goes | goes usually (nowy tag `freq_order`), usually go |

Każdy wzorzec ma jedną poprawną odpowiedź, tag dla każdej złej opcji, `why` (EN) i `hint` (PL) oraz listy `fixable` i `judgeable`. Zdania z przysłówkiem częstotliwości mają `nobuild` (*Sometimes he…* i *…sometimes* też są poprawne). W `base_after` / `vs_base` forma -ing nie trafia do „Smash the mistake”, bo *What is she eating…?* też jest poprawne. Mini-wyrocznia walidatora zna teraz pytania wh (*What / Where / What time ___ she…*) i krótkie odpowiedzi (*— Yes, she ___.*).

## 3. Drabinka gramatyczna, klasy 1–4 (wzór: Bugs Team 1–3, potem wymagania dla kl. 4)
Kroki w kolejności. [✓] = potwierdzone w źródle, [~] = wniosek z opisu rozdziału, [?] = niezweryfikowane (dodane na prośbę Maxa albo z typowego programu).

**Klasa 1** (Bugs Team 1): *What's this? It's a…* [~], *I like…* [~], polecenia (imperative) [~], liczby 1–10 / kolory / zwierzęta jako słownictwo. W grze: tylko słówka (nie ma osobnych umiejętności).

**Klasa 2** (Bugs Team 2):
1. *I'm wearing…*, *I like / I don't like* [✓ U1]
2. *Do you like…?*, *Can I…?*, *The cat has got a kitten* [✓ U2] → `have_got:basic`
3. *Where's…? Is there…? There's…*, przyimki in / on / under [✓ U3] → `there:basic`
4. *I've got a (back)ache*, *I'm tired* [✓ U4] → `be:basic`
5. *I eat eggs for breakfast*, *Can I have…?* [✓ U5]
6. *I can / I can't…* [✓ U6] → `can:form`, `can:facts`

**Klasa 3** (Bugs Team 3, kolejność rozdziałów):
1. Starter: *Yes, there is / No, there isn't*, liczby 1–20 [✓] → `there:basic`
2. U1 *On safari*: dzikie zwierzęta, liczba mnoga, liczby 10–100, *They live in…*, *What do they eat?* [✓] → `plural:*`, słówka `wild`, `bignumbers`
3. U2 *What's the matter, Tiger?*: *I have / haven't got…*, *Have you got…?* [✓]. U nas w 3. os.: `have_got:basic/neg/q3/short3` [~ 3. os. to wariant Maxa]
4. U3 *Talent Show*: umiejętności i sport [✓] → `can:*` [~ can nie jest nazwane wprost]
5. U4 *My busy day*: rutyna dnia, zawody, godziny, *What time…?* [✓] → `ps_3s:*`, `ps3_routine:*` [~ present simple nie jest nazwany wprost w wymaganiach]
6. U5 *Let's go shopping*: *there is / are* w mieście [✓] → `there:basic`
7. U6 *Going on holiday*: czynności teraz [✓] → `pc:*`
8. Prośba Maxa: *Who…?* (`ps3_who`), *What / Where does he…?* (`ps3_wh`), likes / doesn't like (`ps3_like`) [? nie ma ich w wymaganiach Bugs Team 3, są w typowym materiale kl. 3–4]

**Klasa 4** (wymagania dla kl. 4, m.in. Brainy 4 / English Class A1):
1. *to be*, *have got*, *can*, *there is / are* [✓ lista ogólna]
2. present simple: twierdzenia, przeczenia, pytania [✓] → `ps_neg`, `ps_q`, `ps3_wh`
3. przysłówki częstotliwości [✓] → `ps3_freq`
4. present continuous i kontrast z simple [✓] → `pc`, `pc_vs_ps`
5. przymiotniki dzierżawcze [✓, w grze jeszcze nie ma], *like + -ing* [? → `ps3_like:like_ing`]

## 4. Ścieżka ucznia (silnik)
**Roster:** `path` to uporządkowana lista kroków: id umiejętności, `v:<temat>` albo `ladder:grade3:N` (N kolejnych tematów z `data/curriculum.js` → `LADDER.grade3`; `*` = reszta). `pathExclude: ["v:numbers"]`, bo Max nie chce łatwych liczb (jest `bignumbers` 13–100 i `ordinals`). Tematy sezonowe dorzuca wydarzenie, nie drabinka. Bez `curriculum.js` silnik bierze awaryjną drabinkę z istniejących tematów. `focus` działa dalej: dorzuca tematy „na ten tydzień” i daje temat zadania dnia (`focus[0]`).

Ścieżka Łucji i Matyldy (rozwinięta):
`ps_3s · animals · actions · ps3_like · food · wild · have_got · bignumbers · body · ps_neg · sports · ps3_who · freetime · ps_q · jobs · ps3_routine · myday · ps3_wh · town · ps3_freq · weather · holiday · nature · clothes · family · feelings · home · school · transport · toys · bugs · fruitveg · fairytale · forest · food2 · household · things · ordinals`

**Odblokowanie** (`pathState`, wyliczane z `srs` + `log`, bez nowego pola w zapisie i bez zmiany SAVE_VERSION):
- krok widziany (choć 1 element w `srs`) = otwarty na zawsze, więc stare kroki zostają w powtórkach. Pierwsze 2 kroki są otwarte od startu,
- następny krok otwiera się, gdy spełnione są wszystkie warunki:
  - najnowszy krok ma ≥ 70% elementów „opanowanych”, czyli w pudełku ≥ 2 albo z ≥ 6 próbami i ≥ 80% trafień,
  - ostatnie 20 prób z tego kroku (min. 8) ma ≥ 75% trafień,
  - każdy starszy krok ma ≥ 50% opanowanych elementów,
  - zaległych powtórek jest ≤ 20,
  - nie ma otwartego kroku, który czeka na pierwsze zadanie,
  - dziś nie zaczęto żadnego kroku (najwyżej 1 nowy krok dziennie),
- świeżo otwarty krok pojawia się w tym samym biegu (od 3. zadania), więc otwarcie od razu staje się trwałe.

**Powtórki najpierw:** gdy są zaległe powtórki, 80% wyborów (`REVIEW_FIRST`) to powtórka. Nowości mają limity: na bieg 4 słówka / 2 wzorce w temacie głównym i 2 / 1 w pozostałych, na dzień 10 słówek / 4 wzorce. Temat główny (68%) to najnowszy krok. Wzorce błędów (`confusions`) wzmacniają tylko otwarte umiejętności, bez przeskakiwania drabinki.

**Dla UI i panelu:** `pathStatus(save, profile)` → `[{ id, name, unlocked, mastery, current, seen, items, acc }]`. `reportText()` ma sekcję ŚCIEŻKA i powód, dla którego następny krok czeka.

## 5. Wdrożone punkty P1 z `docs/PEDAGOGY-REVIEW.md` (G)
- **P1-1 terminy:** `due` = północ + liczba dni pudełka. Dobra odpowiedź na rzecz niewymagalną nie zmienia terminu ani pudełka. Pierwszy błąd na niewymagalnej nie cofa pudełka, drugi tego dnia cofa o 1. Rzecz wraca najpóźniej jutro. Nowe opcjonalne pole `r.lw`. Test: 20:00 → 9:00 następnego dnia jest wymagalne. W symulacji Łucji (21 dni) mediana pudełka `ps_3s` to 5, a build + fix + type w temacie głównym w dniach 15–21 to 74%.
- **P1-2:** nowy wzorzec `ps_3s:vs_base`. W trybie 3s temat główny „present simple” to pakiet (`ps_3s`, `ps_neg`, `ps_q`, `ps3_*`). Heurystyka „najkrótsza opcja na -s” trafia 49–57% luk na ścieżce (próg ≤ 60%).
- **P1-3:** w „Build the sentence” dla ps_* / ps3_* / have_got jest 1 klocek-wabik (zła forma z `q.wrong`, `task.decoy`, `tile.i = -1`). fixline i catch kończą sprawdzanie po `words.length`, więc wabik zostaje w stosie.
- **P1-5:** literówki tylko z białej listy realnych błędów (watchs, gos, studys, haves, runing, danceing…), bez *plaies / likees*. W luce pokazujemy je dopiero od pudełka 2.
- **P1-6:** pierwsze zadanie nowej rzeczy ma `task.justIntroduced`, nie awansuje 0 → 1 i wraca za 3–5 zadań. W symulacji wraca 239 z 240 nowych rzeczy.
- **P1-7 (część G):** `ps3_who:who_scene` to zadanie na znaczenie ze sceną w tekście (emoji + imiona). Dane sceny są w `q.scene` / `q.ask`, gdyby D chciał narysować postaci.

## 6. Symulacja 30 dni (walidator, 2 biegi × 25 zadań dziennie, 1 dzień w tygodniu bez gry)
| Profil | Otwarte kroki po 30 dniach | Przyrost | Powtórki / nowe |
|---|---|---|---|
| Łucja (trafność ok. 85%) | 10 / 38 | 2→3 (dz. 3), 4 (dz. 8), 5 (dz. 10), 6 (dz. 14), 7 (dz. 18), 8 (dz. 23), 9 (dz. 26), 10 (dz. 30) | 91% / 9% |
| Matylda (ok. 75%) | 8 / 38 | 2→3 (dz. 4), 4 (dz. 8), 5 (dz. 11), 6 (dz. 17), 7 (dz. 23), 8 (dz. 25) | 92% / 8% |

Nigdy nie otwiera się więcej niż 1 krok dziennie. Prawdziwe zapisy dziewczynek mają już widziane `ps_3s`, `ps_neg`, `ps_q`, `animals`, `actions` (Łucja) oraz `have_got`, `food` (Matylda), więc te kroki są u nich otwarte od razu.

## Źródła
- Bugs Team 3, wymagania edukacyjne, SP 59 Poznań (2024): https://sp59.poznan.pl/wp-content/uploads/2024/09/Wymagania-jezyk-angielski-klasa-3.pdf
- Bugs Team 3, wymagania, SP 7 Poznań (2024, tytuł U4 „My busy day”): https://sp7.poznan.pl/wp-content/uploads/2024/09/2024_jangielski_kl3.pdf
- Bugs Team 2, wymagania, SP 77 Kraków (2021/22): https://sp77.krakow.pl/public/files/wymagania_edu._j._ang._kl._2_rok_szkolny_2021_22.pdf
- Wymagania kl. 4 (lista struktur): https://podstawowa.zso8.krakow.pl/wp-content/uploads/2024/09/Wymagania_klasa4_angielski.pdf
- Bugs Team 1: tylko wniosek z ogólnego zakresu serii [~]. Pliki Macmillan (strefa ucznia) nie dały się odczytać.
