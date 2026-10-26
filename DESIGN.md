# Nine Lives v2: dokument projektowy (źródło prawdy dla przebudowy)

Gra edukacyjna (angielski) dla uczniów Maxa (korepetytor). Wiek głównie 7–9 lat (Łucja 9, Matylda 9, Nina 9, Bruno 7: słabo czyta), polskie dzieci.
Wersja 1 działa (quiz z kotem). Max ocenił ją jako „bez duszy, wygląda jak z AI, to quiz, a nie gra”. Wersja 2 ma to naprawić.
Hosting: GitHub Pages (statyczny, bez buildu, moduły ES), zapis: localStorage + Supabase REST (już działa w `js/cloud.js`).

## 1. Cel i ton
- Ma to być **prawdziwa gra arcade**, która uzależnia (świadoma decyzja Maxa: „chcemy uzależnić dzieci od angielskiego”), z dużą ilością nauki w środku. Nauka jest *napędem* akcji, a nie kartką pod obrazkiem.
- **Dusza:** spójna, rozpoznawalna estetyka, żywe detale, satysfakcjonujące nagrody, humor, sekrety.
- **Cała gra po angielsku**, bardzo prostym językiem (poziom A1: krótkie słowa, ikony i animacje zamiast zdań). Polski tylko jako mała, opcjonalna podpowiedź pod poleceniem zadania (ustawienie domyślnie ON) i w panelu nauczyciela. Żadnych długich zdań w UI.
- Nic nie może wyglądać na „AI”: żadnych fioletowych gradientów, glassmorphismu, zaokrąglonych kafelków z emoji jako ikonami ani tekstów w stylu „Raport dla Claude'a”. Panel nauczyciela ma być neutralny: „Copy report”, „Progress”.

## 2. Styl wizualny: „pixel art arcade + artystyczny bałagan DIY”
- Baza to **pixel art** (sprite'y 16–32 px skalowane całkowitym mnożnikiem, `image-rendering: pixelated`). Inspiracje: automaty arcade, Minecraft, Celeste, Shovel Knight.
- Na to warstwa **DIY / mixed media**: naklejki z białą obwódką, taśma klejąca, odręczne dopiski (font Caveat Brush), stemple, papier w kratkę w menu. Ma to sugerować, że dzieci współtworzą grę (skórki są od nich). Bałagan ma być kontrolowany i artystyczny, nie przypadkowy.
- Fonty (już w repo, self-hosted w `fonts/` + `css/fonts.css`): **Pixelify Sans** (UI, liczby, nagłówki gry), **Caveat Brush** (dopiski DIY, rzadko), **Lexend** (treść zadań, bo dzieci muszą łatwo czytać).
- Paleta: ograniczona, ok. 32 kolory, zdefiniowana raz (`js/pixel/palette.js`). Gra jest ciemniejsza (wieża nocą), UI jasne/papierowe; kontrast musi być dobry.
- **Cykl dnia i nocy według prawdziwego zegara** urządzenia: świt, dzień, zachód, noc. Zmienia niebo, kolor światła wieży, gwiazdy/słońce/księżyc (Księżyca brakuje, bo to fabuła), świetliki nocą i ptaki w dzień. Klimat, nie mechanika (ewentualnie drobny bonus nocny, np. „Night Owl: +10% fish”).
- „Juice” (soczystość): screen shake, hit-stop (zatrzymanie 60–90 ms przy ciosie), pikselowe cząsteczki, liczby obrażeń, squash & stretch, chiptune'owe dźwięki generowane w WebAudio (rozbudować `js/audio.js`; muzyka generatywna/chiptune w kodzie, **żadnej muzyki Maxa**).
- **Obrazki słówek: „pixelizer” emoji.** Emoji rysujemy na małym canvasie (np. 18×18), skalujemy pixelated, dokładamy 1px ciemny kontur (dylatacja alfy) i cache'ujemy jako dataURL. Daje to automatycznie spójne pikselowe ikony dla ok. 300 słów bez ręcznego rysowania. Kolory (`color:#hex`) i cyfry (`num:7`) rysowane pixel-fontem albo pikselowym blokiem.

## 3. Rdzeń rozgrywki: Wieża (arcade)
- Ekran biegu to **scena canvas** (pixel art, stała logiczna rozdzielczość np. 320×180 albo 240×320 w pionie na telefonie; całkowite skalowanie) + nakładki HTML tylko tam, gdzie trzeba (np. input do pisania).
- **Wieża jest widoczna:** pionowy przekrój, kamera jedzie w górę po każdym piętrze, a kot wskakuje wyżej. Co 10 pięter zmienia się kraina (8 krain, potem wracają jako II, III z inną paletą; nieskończoność). Na każdym piętrze jest numer, a pokonani bossowie zostają jako trofea.
- **Etap = 5 pięter, na 5. boss.** Bieg trwa ok. 3–5 minut.
- **Odpowiedź = akcja w świecie.** Mechaniki (każde zadanie z silnika nauki jest „ubrane” w jedną z nich):
  1. **Sign Smash:** potwór/świat trzyma 2–4 tabliczki z odpowiedziami (słowa albo pikselowe obrazki), które lekko się kołyszą lub przesuwają (wyżej = szybciej). Kliknięcie/dotknięcie tabliczki → kot skacze i ją rozbija. Dobra = cios, zła = potwór oddaje.
  2. **Catch:** litery albo słowa spadają z góry, a kot (sterowany kursorem/palcem/strzałkami) łapie je w dobrej kolejności. Do literowania i układania zdań. Złe złapanie = pomyłka. Prędkość rośnie łagodnie.
  3. **Bubble Pop:** bańki z odpowiedziami unoszą się, trzeba przebić właściwą (obrazek↔słowo, słuchanie).
  4. **Spell Cast (pisanie):** kot rzuca zaklęcie, wpisując słowo. Bez limitu czasu, input HTML na scenie.
  5. **Fix the Line:** zdanie jako rząd bloków (jak Minecraft). Trzeba uderzyć w błędny blok; boss to lubi.
  6. **Match Rush:** pary obrazek–słowo jako kafle, łączenie przeciągnięciem lub dwoma kliknięciami.
- **Lekka zręczność jest obowiązkowa, ale czytelna:** zawsze wiadomo, co zrobić (kursor/palec, duże cele). Boss rzuca wolne pociski, które można odbić kliknięciem; nieodbity pocisk zabiera tarczę lub combo, **nie życie**. Życie zabiera tylko zła odpowiedź na angielski.
- **Moce aktywne:** pasek mocy ładuje się dobrymi odpowiedziami (combo). Przed biegiem wybiera się 1–2 moce, np. Freeze (zatrzymuje ruch celów), Claw Storm (x2 obrażenia przez 3 tury), Fish Magnet, Owl Eye (usuwa jedną złą odpowiedź), Catnip (+1 życie).
- **Perki biegu** jak w v1 (wybór 1 z 3 po piętrach 2 i 4) zostają, przerysowane jako pikselowe karty.
- **Wydarzenia w biegu (losowe):** złoty potwór (dużo rybek, ucieka po 3 turach), skrzynia-mimik, kupiec-kot między piętrami (wydajesz rybki na buffy), sekretne piętro (rzadko).
- **Boss** ma intro (karta z imieniem, pikselowy portret), 2 fazy (druga szybsza / inna mechanika), pociski do odbijania i większy łup.

## 4. Nine Lives: system żyć (serce gry)
- Kot ma **9 żyć na dzień** (widoczne jako 9 pikselowych serduszek / kocich głów). **Zła odpowiedź = −1 życie.** Zręczność nigdy nie zabiera życia.
- Regeneracja: +1 życie co 20 minut (prawdziwy czas), +1 za każde combo 8 dobrych odpowiedzi z rzędu (max 9), +1 z mocy Catnip / kupca.
- 0 żyć → kot zasypia („Zzz… come back later”), widać licznik do następnego życia. Rano o północy lokalnej reset do 9.
- Dobry gracz praktycznie nie traci żyć i gra dalej. Nie ma twardego limitu grania, za to **nagrody maleją z czasem gry dziennie**: 0–20 min 100%, 20–30 min 70%, 30–45 min 35%, 45+ min 15% (rybki i XP; nauka i postęp wieży działają normalnie). Komunikat w grze jest ciepły („Your cat is getting sleepy… rewards are smaller now”), bez kar.
- Jaskinia Cieni (powtórka pomyłek, w v2 nazwana **Shadow Cellar**) zawsze daje 100% nagród i nie zabiera żyć za dwa pierwsze błędy.

## 5. Ekran główny = wieża
- Pionowa scena pixel art z cyklem dnia i nocy. Od dołu: **Shadow Cellar** (drzwi, świecące oczy, licznik cieni) → piętra (kot siedzi w oknie swojego piętra) → trofea bossów → **WANTED** (plakat bossa tygodnia na ścianie, pasek HP) → u góry niebo z **brakującym Księżycem** (przerywany kontur; kliknięcie otwiera Moon Diary, czyli fabułę).
- Kot reaguje na dotknięcie (mruczy, przeciąga się). Nieotwarte skrzynie stoją jako pikselowe sprite'y przy wieży i drgają.
- Duży przycisk **CLIMB** (pikselowy, arcade). Dolny pasek: **Wardrobe** (skórki + czapki + sklep), **Skills** (talenty), **Cards** (album), **Daily** (wyzwania dnia). Ikony to pikselowe sprite'y, nie emoji.
- HUD: 9 żyć, rybki 🐟 (waluta, pikselowa rybka), level + XP, seria dni (płomień).

## 6. Nagrody, kolekcje, dopamina
- **Waluta: rybki (fish).** XP → level → punkty talentów (3 ścieżki z v1: Claws/Fur/Whiskers, przerysowane).
- **Skrzynie: prawdziwe sprite'y** (drewniana, srebrna, złota, epicka; każda wyraźnie inna, z animacją otwarcia).
  **Rytuał otwierania:** 3 tapnięcia, każde mocniej trzęsie skrzynią i pojawiają się pęknięcia → wybuch światła w kolorze rzadkości → hit-stop przy legendarnej → przedmiot obraca się w spotlighcie, pikselowe konfetti, dżingiel, stempel **NEW!** → kot od razu zakłada i robi taniec. Duplikat zamienia się w rybki z animacją sypiących się monet-rybek.
- **Kolekcje z licznikiem i pustymi sylwetkami:** Skins x/N, Hats x/N, Cards (słówka) x/N. Puste sloty są widoczne jako „???”, żeby kusiły.
- **Skórki:** pikselowe sprite'y kota (baza 24–32 px, klatki idle/jump/attack/hurt), skórka = paleta + nakładki pikseli. **Czapki** jako osobna warstwa zakotwiczona na głowie (osobna personalizacja, ważne dla Maxa); „brak czapki” to nie przedmiot, tylko przycisk „take off”. Zachować id skórek i czapek z v1 (`data/cosmetics.js`; dzieci już coś mają). Skórka Shrimp Cat (pomysł Łucji, jej zabawka) zostaje.
- **Wyzwania dnia:** 3 dziennie (np. „Beat a boss without losing a life”, „Combo 10”, „Answer 20 present simple”), nagroda w rybkach i skrzyni. Seria dni z zamrożeniem na 1 dzień (jak w v1).
- Boss tygodnia (wspólny dla wszystkich, chmura) i duety (Łucja+Matylda, Nina+Bruno) zostają, przerysowane.
- **Etap 3:** edytor skórek 16×16 w grze. Dziecko maluje i wysyła, Max akceptuje w panelu, skórka trafia do gry dla wszystkich (kolejka nagród za bossa tygodnia).

## 7. Treść i nauka
- Silnik nauki z v1 (`js/engine.js`) zostaje: powtórki w pudełkach, wzorce błędów, back to basics, stopniowość. Zmieniamy tylko **sposób podania**: zadanie → mechanika arcade.
- **Tryb jednego tematu:** główny temat ucznia (np. Łucja = present simple) to ok. 65–70% zadań, a słówka są otoczką (np. słowa ze świata w zdaniach). Sterowane przez `focus` w rosterze; pierwszy element `focus` = temat główny.
- Treść ma być mniej płaska: zdania w kontekście, „odd one out”, kategorie, krótkie mini-scenki. Wydarzenia sezonowe mają własną mechanikę (Halloween: trick-or-treat, czyli zła odpowiedź zamienia potwora w coś śmiesznego, a dobra daje cukierka).
- Lektor (TTS) **domyślnie wyłączony**, oprócz profili z `noReading` (Bruno), gdzie zadania są dźwiękowo-obrazkowe.
- Gotowe imiona kota: bez generycznych „Luna/Mochi”. Generator 2 słów (np. „Captain Noodle”, „Sir Pickles”) albo puste pole.

## 8. Kompatybilność (twarde zasady)
Zasady z `CLAUDE.md` obowiązują: klucze `v:` / `g:`, id skórek, czapek i talentów są wieczne, zmiana zapisu = migracja w `js/state.js` (SAVE_VERSION 2). Postęp dzieci z v1 musi przejść. Nowe pola (lives, dailyMinutes, challenges, collections, powers) dodaje migracja.

## 9. Etapy
- **Etap 1 (najpierw, grywalne dla dzieci):** silnik pixel art i paleta, sprite'y kota (skórki z v1) + czapki, potwory, skrzynie, ikony UI; pixelizer emoji; scena biegu z widoczną wieżą i kamerą; mechaniki 1, 3, 4, 5 (+ 2, jeśli zdąży); boss z intro i pociskami; 9 żyć + malejące nagrody; ekran główny-wieża z cyklem dnia; Wardrobe (skórki + czapki + sklep); rytuał otwierania skrzyń; UI po angielsku; migracja zapisu; testy (boty + zrzuty, mobile i desktop).
- **Etap 2:** moce aktywne, wydarzenia w biegu (złoty potwór, mimik, kupiec), wyzwania dnia, album pikselowych kart, Moon Diary w nowej formie, talenty przerysowane, Match Rush, Halloween trick-or-treat, przebudowa panelu nauczyciela (neutralny język).
- **Etap 3:** edytor skórek 16×16 + akceptacja w panelu, więcej treści i mini-scenek, dopieszczanie balansu na podstawie danych dzieci.
