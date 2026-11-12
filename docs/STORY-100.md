# Moon Diary: fabuła i niebo (WERSJA 4, 12.11.2026, W GRZE)

Zastępuje wersje 1–3. Dane są w `data/progression.js` (`STORY` z polem `art`, `SKY`, `CHAPTERS`, `STORY_REWARDS`), niebo w `js/game/world.js` i `js/game/skyshow.js`. Tabele niżej są wygenerowane z danych.

**Uwagi Maxa do wersji 3:** nudna, szablonowa („pomóż X → gwiazda → gwiazdozbiór” 14 razy); gwiazdy, ich liczba i sposób pojawiania się są nudne; tęcza jest ogromna i zawsze w tym samym miejscu; estetyka się nie klei. Chce, żeby niebo z czasem naprawdę się zapełniało.

## Pomysł w jednym zdaniu
**Dobre zdanie staje się prawdą.** Kot mówi „The robot has got a pizza.” i z sufitu spada pizza. Glitch psuje zdania, więc świat robi się dziwny: śnieg pada do góry, gwiazdy mówią „Me is star”. Gramatyka to moc kota, a nie „ucz się słówek”. Pasuje to do gry, w której ~70% zadań to zdania, i do potworów Glitcha w wieży (od strony 34).

## Co jest nowe w porównaniu z wersją 3
- **Humor z mechaniki:** każde naprawione zdanie coś wyczarowuje (pizza 20, ser spada na Pip 34, smok wyskakuje z książki 53). Glitch mówi zepsutymi zdaniami („ME IS KING NOW”, „YOU IS IN TROUBLE!”), a Król poprawia mu gramatykę… i zostaje połknięty (58–60).
- **Zagadki z rozwiązaniem:**
  - Kto napisał liścik ze strony 3? Na stronie 23 litery migoczą, na 88 Glitch się przyznaje.
  - Kim jest „Ty z przyszłości” ze stron 16–17? Pętla czasu na stronach 96–97: dziecko samo idzie do Chmur Snów i ostrzega młodszego siebie.
  - Szary list „Why nobody understand me?” (48) prowadzi do serca Glitcha (87).
- **Postacie z powracającymi żartami:** Król śmieje się „Ho-ho-HIC!”. Robot jest zawsze głodny. Kot Listonosz nie wie, do kogo jest list. Pip ma „sto gadżetów” i mówi „That is science.” Skye mówi „Easy!”, a potem „Not easy.” Mały smok kicha iskrami.
- **Każdy rozdział kończy się haczykiem:** „WHO is using MY magic?” (20), migocząca gwiazda (30), oko w chmurze (40), „YOU IS IN TROUBLE!” (50), porwanie Króla (60), wieloryb (70), „Look behind you.” (85).
- **Gwiazdozbiór rodzi się ze zdania:** na stronie z nagrodą kot mówi zdanie („Birds can fly.”), a gwiazdy układają ptaka. To samo zdanie wyświetla się pikselowym fontem, kiedy gwiazdozbiór przelatuje przez niebo.
- **Złoczyńca bez morału na siłę:** Glitch to samotne zepsute zdanie, które chciało, żeby ktoś je zrozumiał. Na końcu zostaje gwiazdą Bit, w tym samym miejscu nieba, w którym wisiała chmura.
- **Strony 1–15 bez zmian** (dzieci już je czytały). Strona 10 ma dopisany haczyk („Something grey eats them. Bzzt!”). Moon Base usunięta (osobna sesja), więc strona 25 nie obiecuje domku: Król daje spinkę z Księżycem (nagroda `moonclip`).
- **Język:** A1 (present simple, can, have got, there is), bez czasu przeszłego. Polskie podpowiedzi w 2. osobie, czas teraźniejszy, neutralne płciowo. Test pilnuje form „-łeś/-łaś” i długości stron (≤ 34 słowa).

## Rozdziały (9 zakładek)
| # | Nazwa | Strony | Haczyk na końcu |
|---|---|---|---|
| 1 | The Missing Moon | 1–10 | żabi książę: „coś szarego zjada słowa” |
| 2 | Sentence Magic | 11–20 | zdania się spełniają → „WHO is using MY magic?” |
| 3 | The Night King | 21–30 | Król jest niewinny, Księżyc wraca; gwiazda ryby migocze |
| 4 | The Glitch | 31–40 | Pip, potwory Glitcha w wieży (34), tęcza, Skye; chmura otwiera oko |
| 5 | The Flying Ship | 41–50 | statek lata (45, paczka), Kot Listonosz, szary list, Gwiazda-Klucz |
| 6 | The Storm | 51–60 | sowa i smok z książki; Glitch połyka Króla |
| 7 | The King's Light | 61–70 | dzwon, zorza „I IS OK”, drzewo zdań; wieloryb |
| 8 | Inside the Glitch | 71–85 | duszek, żaba, deszcz zepsutych zdań, lampa, Król odnaleziony |
| 9 | The Full Sky | 86–100 | serce Glitcha, pętla czasu, Bit, impreza |

## Niebo (ekran główny)
Zasady: wszystko jest wyliczane z `save.story` (bez nowych pól w zapisie). Zjawisko pojawia się w dniu, w którym dziecko o nim czyta. Skala to 1 piksel logiczny, a paleta jest ta sama co w grze. Wieża zasłania środek, więc niebo to dwa pasy po bokach (po ~60 px).

**Warstwy (od tyłu):** gradient pory dnia → gwiazdy tła → zorza → gwiazdozbiory → Księżyc → tęcza, Glitch, wieloryb, balon, meteory, kometa, statek → wzgórza → wieża.

**Dzień i noc (`dayPhase()`, podgląd `?hour=14` / `?hour=22`):**
- W dzień nie ma gwiazd tła. Gwiazdozbiory są białe i blade (dzieci grają po szkole, więc postęp musi być widać).
- Tęcza pojawia się tylko w dzień.
- Zorza, meteory i fajerwerki pojawiają się tylko o zmierzchu i w nocy.

**Jak niebo się zapełnia:**
- **Gwiazdy tła rosną ze stronami:** 14 na starcie (Księżyca nie ma, niebo jest puste), ~24 na stronie 25, ~144 na stronie 100. Są w 3 rozmiarach, w kolorach z palety, a ~15% ma odcień różowy lub miętowy. Mrugają.
- **14 gwiazdozbiorów po 7–9 gwiazd (106 razem)**, każdy na 5 stron. Na stronie k z 5 świeci round(n·k/5) gwiazd. Między zapalonymi gwiazdami są blade kreski, więc obrazek rośnie dzień po dniu. Pierwsza gwiazda to jasna „głowa”. Po ukończeniu kreski są jaśniejsze, a po nich biegnie iskierka. Następny gwiazdozbiór widać jako blade kropki.
- **Dzisiejsza gwiazda:** jeśli dziś przybyła strona (`save.daily.pageDay`), po wejściu na ekran gwiazda przylatuje z wieży po łuku z ogonem. Potem przez cały dzień pulsuje wokół niej żółty pierścień.
- **Przelot:** nowo ukończony gwiazdozbiór raz przelatuje przez niebo (później czasem nocą) i pokazuje swoje zdanie pikselowym fontem w pasie nieba.
- **Rozmieszczenie:** 7 gwiazdozbiorów po lewej (poniżej naklejek wydarzeń), 7 po prawej (pod Księżycem), na zmianę bliżej i dalej od wieży. Wysokość jest ułamkiem nieba nad wzgórzami, więc układ działa na każdym telefonie.

| Od strony | Na niebie | Zachowanie |
|---|---|---|
| 1–25 | Księżyc z kawałków | kontur wypełnia się zgodnie z ruchem wskazówek zegara, na 25 jest pełny |
| 26–95 | gwiazdozbiory | 1 strona = kolejne gwiazdy (tabela niżej) |
| 36 | **Glitch** | ciemnofioletowa chmura pikseli po lewej. Rzędy pikseli przeskakują, błyskają kolory magenta i cyjan. Rośnie do 60, jest największy 60–85, maleje od 86, a na 99 znika |
| 38 | **Tęcza** | mała (promień 15–23 px), wyrasta zza wzgórz. Tylko w dzień, w ~połowę dni, z lewej albo prawej strony, w różnej wielkości (wg daty). Pojawia się na ~50 s co 2 minuty („A rainbow is shy”) |
| 40 | oko Glitcha | patrzy na wieżę i mruga; od 86 ma inny kolor (Glitch przestaje być groźny) |
| 45 | **Statek Króla** | przelatuje; raz dziennie zrzuca paczkę (paczka i rybki należą do części ekonomicznej, `openParcel`) |
| 47 | **Balon Kota Listonosza** | dryfuje |
| 63 | **Zorza** | światło Króla z wnętrza Glitcha (tylko zmierzch i noc) |
| 70 | **Wieloryb** | co 90 s przepływa przez niebo |
| 78 | **Deszcz zepsutych zdań** | meteory (tylko noc) |
| 90 | **Kometa** | „pokazuje drogę do domu”, co 40 s |
| 99 | **Bit** | duża gwiazda z oczkami w miejscu Glitcha |
| 100 | **Impreza** | fajerwerki co wieczór, losowe przeloty gwiazdozbiorów |

### Gwiazdozbiory
| Strony | Gwiazdozbiór | Gwiazdy | Zdanie (z fabuły) | Nagroda |
|---|---|---|---|---|
| 26–30 | FISH | 8 | The fish is happy. | goldfish |
| 31–35 | MOUSE | 8 | A mouse can dance. | mouseears |
| 36–40 | BIRD | 7 | Birds can fly. | feather |
| 41–45 | BOAT | 7 | The ship can fly. | paperboat |
| 46–50 | KEY | 8 | The key is free. | shadowcat |
| 51–55 | OWL | 7 | Owls can see in the dark. | nightcap |
| 56–60 | KITE | 7 | Follow the light! | skycat |
| 61–65 | BELL | 8 | Bells can sing. | bellhat |
| 66–70 | TREE | 7 | The tree is big. | startree |
| 71–75 | GHOST | 7 | Ghosts can glow. | boo |
| 76–80 | FROG | 8 | The frog is green. | froghat |
| 81–85 | ROBOT | 9 | The robot is a hero. | antenna |
| 86–90 | HOUSE | 7 | We are friends. | cozy |
| 91–95 | CAT | 8 | The cat is a hero. | starcat |

Razem 106 gwiazd w gwiazdozbiorach.

## Zgodność
- Zapis bez zmian: `save.story` (0–100) i `save.daily.pageDay` już istnieją. Niebo, gwiazdy i Bit są wyliczane z tych pól, bez migracji.
- Id nagród `STORY_REWARDS` i strony nagród są bez zmian (16 przedmiotów). Gwiazdozbiory kończą się dokładnie na stronach nagród 30–95.
- `RUN_EVENTS.glitch.page` = 34: na tej stronie fabuła mówi „Glitch monsters are in your tower now!”.
- Nowy gwiazdozbiór = wpis w `SKY` (≤ 32×24 px, 6–9 gwiazd, `say` = zdanie z fabuły) i miejsce w `SKY_SLOTS` (`world.js`). Test `tools/test-systems.mjs` pilnuje wymiarów, liczby gwiazd, stron nagród, obrazków i neutralnych podpowiedzi.

## Wszystkie strony

### 1. The Missing Moon (1–10)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 1 | 🌑 | One night, the Moon disappears from the sky. 🌑 The cats are scared. | Pewnej nocy Księżyc znika z nieba. Koty się boją. |
| 2 | 🗼 | You find a tower. It is very, very tall. At the top there is a silver light. | Znajdujesz wieżę. Jest bardzo, bardzo wysoka. Na szczycie jest srebrne światło. |
| 3 | 📜 | A monster drops a note: “The Night King has the Moon.” Who is the Night King? | Potwór upuszcza liścik: „Król Nocy ma Księżyc”. Kim jest Król Nocy? |
| 4 | 📚 | The attic smells of old books. Something is writing on the wall… in English! | Strych pachnie starymi książkami. Coś pisze na ścianie… po angielsku! |
| 5 | 🔑 | The wall says: “Words are keys.” Every word you learn opens a door. | Na ścianie jest napisane: „Słowa są kluczami”. Każde słowo, którego się uczysz, otwiera drzwi. |
| 6 | 👻 | In the Candy Forest, a tiny ghost is crying. “The King stole my voice!” | W Cukierkowym Lesie płacze mały duszek. „Król ukradł mój głos!” |
| 7 | 👋 | You give the ghost a word: “hello”. The ghost smiles. Now it can talk! | Dajesz duszkowi słowo: „hello”. Duszek się uśmiecha. Teraz może mówić! |
| 8 | 🤫 | The ghost whispers: “The King hates new words. They make him weak.” | Duszek szepcze: „Król nienawidzi nowych słów. Osłabiają go.” |
| 9 | 🐸 | The swamp is green and stinky. A frog wearing a crown jumps out. Is it the King? No! | Bagno jest zielone i śmierdzące. Wyskakuje żaba w koronie. To Król? Nie! |
| 10 | 🤴 | The frog is a prince. “I can't remember my words,” he says. “Something grey eats them. Bzzt!” | Żaba to książę. „Nie pamiętam swoich słów” — mówi. „Coś szarego je zjada. Bzzt!” |

### 2. Sentence Magic (11–20)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 11 | 🌑 | Old, forgotten words turn into shadows. That is why the Shadow Cellar is so dark… | Stare, zapomniane słowa zamieniają się w cienie. Dlatego Piwnica Cieni jest taka ciemna… |
| 12 | 🌋 | Lava everywhere! You see a piece of the Moon. It is warm and it glows. | Wszędzie lawa! Widzisz kawałek Księżyca. Jest ciepły i świeci. |
| 13 | 🌙 | The Moon piece talks: “Find all my pieces. Then I can go home.” | Kawałek Księżyca mówi: „Znajdź wszystkie moje kawałki. Wtedy wrócę do domu.” |
| 14 | ❄️ | Snow falls up, not down. In the Frozen Tower, everything is upside down. | Śnieg pada do góry, nie w dół. W Zamarzniętej Wieży wszystko jest do góry nogami. |
| 15 | 🗺️ | A snowman gives you a map. On the map there is a crown… and your name! | Bałwan daje ci mapę. Na mapie jest korona… i twoje imię! |
| 16 | ☁️ | In the Dream Clouds you meet a cat. It looks like you. “I am you from the future,” it says. | W Chmurach Snów spotykasz kota. Wygląda jak ty. „Jestem tobą z przyszłości” — mówi. |
| 17 | 🐱 | Future You says: “Keep climbing. And one more thing… watch out for the Glitch.” Then it is gone. | Ty z przyszłości mówi: „Wspinaj się dalej. I jeszcze jedno… uważaj na Glitcha.” I znika. |
| 18 | 🤖 | Star Station! Robots everywhere. One robot has got the biggest Moon piece. | Stacja Gwiazd! Wszędzie roboty. Jeden robot ma największy kawałek Księżyca. |
| 19 | 🤖 | The robot says: “Beep. Hungry is robot the.” You fix it: “The robot is hungry.” “Correct,” it beeps. “Still hungry.” | Robot mówi: „Bip. Głodny jest robot ten.” Naprawiasz: „The robot is hungry.” „Poprawnie” — piszczy robot. „Dalej głodny.” |
| 20 | 🍕 | You say: “The robot has got a pizza.” PLOP! A pizza falls from the sky! Your sentences come true! Then a big voice shouts: “WHO is using MY magic?” | Mówisz: „The robot has got a pizza.” PLUM! Z nieba spada pizza! Twoje zdania się spełniają! Wtedy wielki głos woła: „KTO używa MOJEJ magii?” |

### 3. The Night King (21–30)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 21 | 🌌 | The top of the tower. It is dark and cold. A tall shadow sits on a throne. Its eyes are two little moons. | Szczyt wieży. Jest ciemno i zimno. Na tronie siedzi wysoki cień. Jego oczy to dwa małe księżyce. |
| 22 | 🤴 | “I am the Night King,” says the shadow. “Every night I write the sky. Good sentences are my stars.” | „Jestem Królem Nocy” — mówi cień. „Każdej nocy piszę niebo. Dobre zdania to moje gwiazdy.” |
| 23 | 📜 | You show him the note: “The Night King has the Moon.” The King laughs: “Ho-ho-HIC! That is not my note. Look, the letters flicker!” | Pokazujesz mu liścik: „Król Nocy ma Księżyc”. Król się śmieje: „Ho-ho-HIK! To nie mój liścik. Spójrz, litery migoczą!” |
| 24 | 👻 | The ghost is here too. “But you have got my voice!” “No,” says the King. “Something grey takes voices. Something grey writes notes.” | Duszek też tu jest. „Ale ty masz mój głos!” „Nie” — mówi Król. „Coś szarego zabiera głosy. Coś szarego pisze liściki.” |
| 25 | 🌕 | You put the pieces together and say: “The Moon is in the sky.” WHOOSH! The Moon is back! The King gives you a Moon clip. But… where are the stars? | Składasz kawałki i mówisz: „The Moon is in the sky.” SZUUU! Księżyc wrócił! Król daje ci spinkę z Księżycem. Ale… gdzie są gwiazdy? |
| 26 | 🛏️ | You find a tiny light under your bed. It is a star! It says: “Hello. Me is star. Me is lost.” | Znajdujesz pod łóżkiem małe światełko. To gwiazda! Mówi: „Cześć. Mnie jest gwiazda. Mnie jest zgubiona.” |
| 27 | ⭐ | You help it: “I am a star. I am lost.” Ding! Now it can talk. And it can fly! WHOOSH — look up, it is in the sky! | Pomagasz jej: „I am a star. I am lost.” Dzyń! Teraz umie mówić. I umie latać! SZUUU — spójrz w górę, jest na niebie! |
| 28 | 🤴 | The King is so happy. “Every broken sentence is a lost star. Fix them, and my sky comes back!” | Król bardzo się cieszy. „Każde zepsute zdanie to zgubiona gwiazda. Napraw je, a moje niebo wróci!” |
| 29 | 🐠 | In the fish tank there are little stars. A goldfish sings to them: “Blub, blub. Fish are happy is.” Hmm… | W akwarium są małe gwiazdki. Złota rybka im śpiewa: „Blub, blub. Ryba są szczęśliwa jest.” Hmm… |
| 30 | 🐟 | You sing too: “The fish is happy.” The stars fly up and make a big fish. It swims across the sky! But one of its stars… flickers. Bzzt. | Ty też śpiewasz: „The fish is happy.” Gwiazdy lecą w górę i tworzą wielką rybę. Płynie przez niebo! Ale jedna z jej gwiazd… migocze. Bzzt. |

### 4. The Glitch (31–40)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 31 | 📺 | Bzzt! Grey pixels eat the fish star. The star sings: “Blub… bzzt… blub.” What is that? | Bzzt! Szare piksele zjadają rybią gwiazdę. Gwiazda śpiewa: „Blub… bzzt… blub.” Co to jest? |
| 32 | 🐭 | In the kitchen you meet Pip, a mouse with big glasses. She has got a hundred gadgets. “That is a glitch!” she says. | W kuchni spotykasz Pip, mysz w dużych okularach. Ma sto gadżetów. „To glitch!” — mówi. |
| 33 | 👾 | Pip points at the tower. “Glitch monsters! They break sentences. Listen…” A grey monster says: “He like cheese.” | Pip pokazuje wieżę. „Potwory Glitcha! Psują zdania. Posłuchaj…” Szary potwór mówi: „He like cheese.” |
| 34 | 🧀 | You say: “He likes cheese.” ZAP! The monster stops flickering… and a big cheese falls on Pip. Look out! Glitch monsters are in your tower now! | Mówisz: „He likes cheese.” ZAP! Potwór przestaje migotać… a na Pip spada wielki ser. Uwaga! Potwory Glitcha są teraz w twojej wieży! |
| 35 | 🐭 | Pip gives you mouse ears. “For luck!” You say: “A mouse can dance.” The stars make a mouse. It dances in the sky! | Pip daje ci mysie uszy. „Na szczęście!” Mówisz: „A mouse can dance.” Gwiazdy tworzą mysz. Tańczy na niebie! |
| 36 | 🐦 | On the roof lives Skye, the fastest bird in town. “I can see it!” she says. “A big grey cloud. It eats stars. GULP!” | Na dachu mieszka Skye, najszybszy ptak w mieście. „Widzę to!” — mówi. „Wielka szara chmura. Zjada gwiazdy. HAM!” |
| 37 | 🌦️ | “How can we get up there?” you ask. Pip has got a plan: “Sun plus rain makes a bridge. Say the colours!” | „Jak się tam dostaniemy?” — pytasz. Pip ma plan: „Słońce plus deszcz robi most. Powiedz kolory!” |
| 38 | 🌈 | “Red, orange, yellow, green, blue, purple!” A rainbow bridge goes up. “Hurry!” says Pip. “A rainbow is shy. It never stays long.” | „Red, orange, yellow, green, blue, purple!” W górę wyrasta tęczowy most. „Szybko!” — mówi Pip. „Tęcza jest nieśmiała. Nigdy nie zostaje długo.” |
| 39 | ☁️ | On the clouds there is a nest with three stars. Skye takes them. “Easy!” she says. Then she sees the grey cloud. “Not easy.” | Na chmurach jest gniazdo z trzema gwiazdami. Skye je zabiera. „Łatwizna!” — mówi. Potem widzi szarą chmurę. „Nie łatwizna.” |
| 40 | 🐦 | You say: “Birds can fly.” The stars make a bird. Skye gives you a feather. Then the grey cloud opens one big eye. It looks at you… | Mówisz: „Birds can fly.” Gwiazdy tworzą ptaka. Skye daje ci piórko. Wtedy szara chmura otwiera jedno wielkie oko. Patrzy na ciebie… |

### 5. The Flying Ship (41–50)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 41 | 👑 | The King is angry. “Nobody eats MY stars! We need a ship. A ship that can fly!” | Król jest zły. „Nikt nie zjada MOICH gwiazd! Potrzebny nam statek. Statek, który umie latać!” |
| 42 | 🔨 | Pip builds. The robots build. You build too. Bang, bang! The robot eats a nail. “Beep. Sorry.” | Pip buduje. Roboty budują. Ty też budujesz. Bum, bum! Robot zjada gwóźdź. „Bip. Przepraszam.” |
| 43 | 🚪 | The ship needs a sail. In the Shadow Cellar you find a paper boat. There is a star inside! | Statek potrzebuje żagla. W Piwnicy Cieni znajdujesz papierową łódkę. W środku jest gwiazda! |
| 44 | 👋 | The shadows in the cellar wave at you. “We are old words. Please don't forget us!” You wave back. | Cienie w piwnicy do ciebie machają. „Jesteśmy starymi słowami. Nie zapominaj o nas!” Machasz do nich. |
| 45 | 🚢 | The paper boat is the sail. You say: “The ship can fly.” And it CAN! A boat shines in the stars, and the King's ship flies. Every day it drops a gift! | Papierowa łódka to żagiel. Mówisz: „The ship can fly.” I UMIE! W gwiazdach świeci łódka, a statek Króla lata. Codziennie zrzuca prezent! |
| 46 | 🗺️ | The ship flies high. The King looks at the map. “The Glitch is huge! It glitches clouds, birds… even sentences.” | Statek leci wysoko. Król patrzy na mapę. „Glitch jest ogromny! Psuje chmury, ptaki… nawet zdania.” |
| 47 | 🎈 | A balloon comes! A cat with a big bag waves. “I am Mailcat! I have got a letter for… um… you? Yes, you!” | Przylatuje balon! Kot z wielką torbą macha. „Jestem Kot Listonosz! Mam list dla… yyy… ciebie? Tak, dla ciebie!” |
| 48 | ✉️ | The letter is grey. It says: “Why nobody understand me?” Who writes letters like this? And why is the sentence broken? | List jest szary. Jest w nim: „Why nobody understand me?” Kto pisze takie listy? I czemu zdanie jest zepsute? |
| 49 | 🗝️ | Mailcat says: “The Glitch has got the Key Star. Without it, the night can't open.” “What does that mean?” “No idea. I only carry letters.” | Kot Listonosz mówi: „Glitch ma Gwiazdę-Klucz. Bez niej noc nie może się otworzyć.” „Co to znaczy?” „Nie mam pojęcia. Ja tylko noszę listy.” |
| 50 | 🔑 | You fly into the grey cloud: “The key is free!” ZAP! A key shines in the stars. You come out grey — a shadow cat! The Glitch roars: “YOU IS IN TROUBLE!” | Wlatujesz w szarą chmurę: „The key is free!” ZAP! W gwiazdach świeci klucz. Wylatujesz jako szary kot-cień! Glitch ryczy: „TY JEST W KŁOPOTACH!” |

### 6. The Storm (51–60)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 51 | 📚 | The ship stops at a library in the clouds. It is very quiet. Somebody says: “Shhh!” | Statek zatrzymuje się przy bibliotece w chmurach. Jest bardzo cicho. Ktoś mówi: „Ćśś!” |
| 52 | 🦉 | It is an old owl. “I keep all the stories of the world,” she says. “But the Glitch scrambles them.” | To stara sowa. „Pilnuję wszystkich historii świata” — mówi. „Ale Glitch je miesza.” |
| 53 | 📖 | She opens a book. It says: “dragon a is There.” You fix it: “There is a dragon.” POP! A tiny dragon jumps out of the book. Oops! | Otwiera książkę. Jest w niej: „dragon a is There.” Naprawiasz: „There is a dragon.” PYK! Z książki wyskakuje malutki smok. Ups! |
| 54 | 🐉 | The tiny dragon sneezes. ACHOO! Sparks everywhere! “Shhh!” says the owl. “Be careful. Your sentences are strong magic.” | Malutki smok kicha. APSIK! Wszędzie iskry! „Ćśś!” — mówi sowa. „Uważaj. Twoje zdania to silna magia.” |
| 55 | 🦉 | You say: “Owls can see in the dark.” The stars make an owl. The owl gives you a night cap. “Sleep well. Tomorrow is a big day.” | Mówisz: „Owls can see in the dark.” Gwiazdy tworzą sowę. Sowa daje ci szlafmycę. „Śpij dobrze. Jutro wielki dzień.” |
| 56 | ⛈️ | A storm! The ship shakes. Grey pixel hands come out of the cloud. They want the stars! | Burza! Statek się trzęsie. Z chmury wychodzą szare pikselowe ręce. Chcą gwiazd! |
| 57 | 🪁 | Skye has an idea. She ties a star to a kite. “Follow the light, not the Glitch!” | Skye ma pomysł. Przywiązuje gwiazdę do latawca. „Leć za światłem, nie za Glitchem!” |
| 58 | 💪 | The King stands at the front of the ship. “Go away, Glitch! I am the King of the Night!” The Glitch answers: “ME IS KING NOW.” | Król stoi na dziobie statku. „Odejdź, Glitchu! Jestem Królem Nocy!” Glitch odpowiada: „MNIE JEST TERAZ KRÓL.” |
| 59 | 😱 | “Wrong!” shouts the King. “It is ‘I AM the King’!” The Glitch is very angry now. It opens like a big mouth… | „Źle!” — woła Król. „Mówi się ‘I AM the King’!” Glitch jest teraz bardzo zły. Otwiera się jak wielka paszcza… |
| 60 | 🌫️ | …and takes the King! Only his crown falls on the ship. A kite shines in the stars, but nobody smiles. | …i zabiera Króla! Na statek spada tylko jego korona. W gwiazdach świeci latawiec, ale nikt się nie uśmiecha. |

### 7. The King's Light (61–70)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 61 | 👑 | You hold the crown. It is still warm. “The King is OK,” says Pip. “Warm crown, happy King. That is science.” | Trzymasz koronę. Jest jeszcze ciepła. „Król jest cały” — mówi Pip. „Ciepła korona, szczęśliwy Król. To nauka.” |
| 62 | 🔔 | The owl says: “A bell can send a message. Ring it, and the King can hear you.” | Sowa mówi: „Dzwon może wysłać wiadomość. Zadzwoń, a Król cię usłyszy.” |
| 63 | 🌌 | You ring the bell. DING! The sky turns green and pink. It is the King's light! He is inside the Glitch. | Dzwonisz. DZYŃ! Niebo robi się zielone i różowe. To światło Króla! Jest w środku Glitcha. |
| 64 | 📡 | The lights make words: “I… IS… OK.” You smile. “It is ‘I AM OK’, Your Majesty!” The lights blink: “HO-HO-HIC!” | Światła układają słowa: „I… IS… OK.” Uśmiechasz się. „Mówi się ‘I AM OK’, Wasza Wysokość!” Światła mrugają: „HO-HO-HIK!” |
| 65 | 🔔 | You say: “Bells can sing.” DING-DONG! The stars make a bell. Then the lights send one more word: “HELP.” | Mówisz: „Bells can sing.” DZYŃ-DOŃ! Gwiazdy tworzą dzwon. Potem światła wysyłają jeszcze jedno słowo: „HELP.” |
| 66 | 🌳 | In the clouds there is a tree. Its leaves are sentences. But the leaves are falling. | W chmurach rośnie drzewo. Jego liście to zdania. Ale liście spadają. |
| 67 | 🍂 | Every leaf goes grey and flies into the Glitch. One leaf says: “Tree are tall.” Another says: “Me can't fly.” | Każdy liść szarzeje i leci do Glitcha. Jeden liść mówi: „Tree are tall.” Inny mówi: „Me can't fly.” |
| 68 | 💡 | “The Glitch eats broken sentences!” you say. “That is why it is so big!” Pip drops her glasses. “No way!” | „Glitch zjada zepsute zdania!” — mówisz. „Dlatego jest taki wielki!” Pip upuszcza okulary. „Nie może być!” |
| 69 | 🍃 | You fix the leaves: “Trees are tall.” “I can't fly.” They stop falling. They glow again. The Glitch looks hungry. | Naprawiasz liście: „Trees are tall.” „I can't fly.” Przestają spadać. Znowu świecą. Glitch wygląda na głodnego. |
| 70 | 🐋 | You say: “The tree is big.” The stars make a tree. Then something huge comes out of the clouds. A whale! “I can take you inside the Glitch,” he says. | Mówisz: „The tree is big.” Gwiazdy tworzą drzewo. Wtedy z chmur wyłania się coś ogromnego. Wieloryb! „Mogę zabrać cię do środka Glitcha” — mówi. |

### 8. Inside the Glitch (71–85)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 71 | 🐋 | The Cloud Whale is very old. He speaks slowly. “Inside the Glitch… sentences break. Be careful what you say.” | Chmurowy Wieloryb jest bardzo stary. Mówi powoli. „W środku Glitcha… zdania się psują. Uważaj, co mówisz.” |
| 72 | 😶 | “How can we find the King in there?” asks Skye. Nobody knows. The robot stops eating. That is serious. | „Jak znajdziemy tam Króla?” — pyta Skye. Nikt nie wie. Robot przestaje jeść. To poważna sprawa. |
| 73 | 👻 | Then a little voice says: “I know.” It is the ghost from the Candy Forest! | Wtedy cichutki głos mówi: „Ja wiem.” To duszek z Cukierkowego Lasu! |
| 74 | 🤫 | “The Glitch has got my old voice,” says the ghost. “I can hear it in there. Follow me!” | „Glitch ma mój stary głos” — mówi duszek. „Słyszę go tam w środku. Za mną!” |
| 75 | 👻 | You say: “Ghosts can glow.” The stars make a ghost. You jump into the whale. The whale swims into the Glitch. Everything is dark… | Mówisz: „Ghosts can glow.” Gwiazdy tworzą duszka. Wskakujesz do wieloryba. Wieloryb wpływa w Glitcha. Wszędzie ciemno… |
| 76 | 🌑 | Inside the Glitch it is cold. Everything flickers. Even your paws flicker! Bzzt. | W środku Glitcha jest zimno. Wszystko migocze. Nawet twoje łapki migoczą! Bzzt. |
| 77 | 🐸 | A green light jumps in the dark. Ribbit! It is the frog prince. “Frogs can see in the dark. Follow me!” | W ciemności skacze zielone światełko. Kum! To żabi książę. „Żaby widzą w ciemności. Za mną!” |
| 78 | ☄️ | Suddenly, little lights fall all around you. They are broken sentences! They fall like rain. | Nagle wokół ciebie spadają małe światełka. To zepsute zdania! Spadają jak deszcz. |
| 79 | 🤲 | You catch one: “The frog are green.” Easy! “The frog is green.” It glows in your paw. | Łapiesz jedno: „The frog are green.” Łatwe! „The frog is green.” Świeci w twojej łapce. |
| 80 | 🐸 | You catch more and more. Every sentence you fix is a star. The stars make a frog with a crown. “Ribbit-tastic!” says the prince. | Łapiesz coraz więcej. Każde naprawione zdanie to gwiazda. Gwiazdy tworzą żabę w koronie. „Kumfantastycznie!” — mówi książę. |
| 81 | 🤖 | Beep! The robot from Star Station is here too. “Sentence lamp. Ready. Also: snack?” | Bip! Robot ze Stacji Gwiazd też tu jest. „Lampa zdań. Gotowa. Poza tym: przekąska?” |
| 82 | 🏮 | You put your fixed sentences in the lamp. It shines bright. Now you can see a path. | Wkładasz naprawione zdania do lampy. Świeci jasno. Teraz widać ścieżkę. |
| 83 | 👣 | The path goes down, down, down. You can hear something. Somebody is crying. | Ścieżka prowadzi w dół, w dół, w dół. Coś słychać. Ktoś płacze. |
| 84 | 👑 | It is the King! He sits in the dark. “I am sorry,” he says. “I always shout at the Glitch. It makes it angry.” | To Król! Siedzi w ciemności. „Przepraszam” — mówi. „Ciągle krzyczę na Glitcha. To go złości.” |
| 85 | 🤖 | You give him his crown. You say: “The robot is a hero.” The stars make a robot! But the King whispers: “Shh. Look behind you.” | Oddajesz mu koronę. Mówisz: „The robot is a hero.” Gwiazdy tworzą robota! Ale Król szepcze: „Ćśś. Spójrz za siebie.” |

### 9. The Full Sky (86–100)
| # | Obrazek | EN | PL |
|---|---|---|---|
| 86 | 💔 | Behind you is the heart of the Glitch. It is not a monster. It is a tiny grey sentence, all alone. | Za tobą jest serce Glitcha. To nie potwór. To malutkie szare zdanie, całkiem samo. |
| 87 | 🥺 | The tiny sentence says: “Nobody understand me.” Now you know who writes the grey letters! | Malutkie zdanie mówi: „Nobody understand me.” Teraz wiesz, kto pisze szare listy! |
| 88 | 📜 | “And the note about the King? That is me too,” it says. “Nobody listens to broken sentences. So I break ALL the sentences.” | „A liścik o Królu? To też ja” — mówi. „Nikt nie słucha zepsutych zdań. Więc psuję WSZYSTKIE zdania.” |
| 89 | 🤔 | You think and think. Then you smile. “You are not bad. You just need some help.” | Myślisz i myślisz. Potem się uśmiechasz. „Nie jesteś złe. Potrzebujesz tylko trochę pomocy.” |
| 90 | 🏠 | You help it: “Nobody understands me.” Then you add: “But I do. We are friends.” A house shines in the stars, and a comet shows the way home. | Pomagasz mu: „Nobody understands me.” Potem dodajesz: „But I do. We are friends.” W gwiazdach świeci domek, a kometa pokazuje drogę do domu. |
| 91 | 🐋 | The whale swims out. The Glitch is smaller now. But there are so many broken sentences left! | Wieloryb wypływa. Glitch jest teraz mniejszy. Ale zostało jeszcze mnóstwo zepsutych zdań! |
| 92 | 🧭 | “I can't fix them all alone,” you say. Pip smiles. “You are not alone.” | „Nie naprawię ich wszystkich w pojedynkę” — mówisz. Pip się uśmiecha. „Nie musisz tego robić w pojedynkę.” |
| 93 | 🤝 | Everybody comes: Pip, Skye, the owl, the ghost, the frog, the robot, the tiny dragon, Mailcat and the King. | Przychodzą wszyscy: Pip, Skye, sowa, duszek, żaba, robot, malutki smok, Kot Listonosz i Król. |
| 94 | 📣 | Everybody fixes sentences. “Teamwork!” shouts the King. The dragon sneezes. ACHOO! The Glitch gets smaller and smaller. | Wszyscy naprawiają zdania. „Drużyna!” — woła Król. Smok kicha. APSIK! Glitch robi się coraz mniejszy. |
| 95 | 🐱 | You say: “The cat is a hero.” The last stars fly up and make a cat. It is you! “You are the Sentence Hero now,” says the owl. | Mówisz: „The cat is a hero.” Ostatnie gwiazdy lecą w górę i tworzą kota. To ty! „Teraz to ty strzeżesz zdań” — mówi sowa. |
| 96 | ☁️ | One more thing. You go to the Dream Clouds. There is a little cat there. It looks like you… a younger you! | Jeszcze jedno. Idziesz do Chmur Snów. Jest tam mały kot. Wygląda jak ty… to ty sprzed wielu dni! |
| 97 | 🐱 | Now you understand. YOU are Future You! You wink and say: “Keep climbing. And watch out for the Glitch.” | Teraz rozumiesz. To TY jesteś „tobą z przyszłości”! Mrugasz i mówisz: „Wspinaj się dalej. I uważaj na Glitcha.” |
| 98 | 🌟 | Back at the tower, the tiny grey sentence is waiting. You say a good sentence. And another. It gets brighter… and BRIGHTER! | Pod wieżą czeka malutkie szare zdanie. Mówisz dobre zdanie. I kolejne. Robi się jaśniejsze… i JAŚNIEJSZE! |
| 99 | 💫 | The Glitch is a star now! A big, new star. It says, perfectly: “Thank you. I am happy now. My name is Bit.” | Glitch jest teraz gwiazdą! Wielką, nową gwiazdą. Mówi bez jednego błędu: „Dziękuję. Teraz jestem szczęśliwy. Mam na imię Bit.” |
| 100 | 🎆 | The sky is full! The King has a party with the ship, the whale, Mailcat and fireworks. Bit shines at the top. GG! The End. | Niebo jest pełne! Król robi imprezę ze statkiem, wielorybem, Kotem Listonoszem i fajerwerkami. Na górze świeci Bit. GG! Koniec. |
