# Moon Diary → 100 etapów (WDROŻONE 10.11, ?v=17)

Stan dziś: 20 stron (`STORY` w `data/progression.js`), 1 strona za nowego bossa. Dzieci robią ~4–5 bossów dziennie, więc fabuła kończy się po ~5 dniach i urywa na „Ciąg dalszy nastąpi…”, a Księżyc nadal nie wraca na niebo.

Propozycja: **100 stron = 100 bossów** (piętro 500). Strony 1–20 zostają bez zmian. Dzieci odzyskują Księżyc, a potem szukają zgubionych gwiazd i układają z nich **14 gwiazdozbiorów** na niebie ekranu głównego. Przy bossie 100 niebo jest pełne i fabuła się kończy.

## Główny pomysł (jedno zdanie)
Król Nocy nie jest zły, tylko samotny: zapomniał wszystkich słów i jego niebo zgasło. **Zapomniane słowa to cienie, a słowa, które sobie przypominasz, zamieniają się w gwiazdy.** Nauka dosłownie zapala niebo, a do tego fabuła łączy się z Shadow Cellar (powtórki).

## Rozdziały

| Rozdział | Strony (= boss nr) | O czym | Co widać na niebie (ekran główny) |
|---|---|---|---|
| 1. Moon Pieces | 1–20 (są już) | Kawałki Księżyca | Przerywany kontur **wypełnia się kawałkami** (jak w Moon Diary, zgodnie z ruchem wskazówek zegara) |
| 2. The Night King | 21–25 | Spotkanie z Królem, przyjaźń, Księżyc wraca | 25: **pełny, świecący Księżyc** zamiast konturu; napis „where is the Moon?” → „where are the stars?” |
| 3. Lost Stars | 26–45 | Gwiazdy spadły i chowają się w wieży | Ryba, Mysz, Ptak, Łódka |
| 4. Shadow Stars | 46–70 | Sekret: cienie to zapomniane słowa | Klucz, Sowa, Latawiec, Dzwon, Drzewo |
| 5. Friends in the Sky | 71–95 | Przyjaciele z rozdziału 1 pomagają | Duszek, Żaba (w koronie), Robot, Dom, **Kot (to ty!)** |
| 6. The Full Sky | 96–100 | Finał | 100: wielka **Gwiazda Północna** nad wieżą, spadające gwiazdy, napis „the sky is full!” |

**Mechanika nieba:** 1 strona = 1 nowa gwiazda (strony 26–95, czyli 70 gwiazd = 14 gwiazdozbiorów po 5). Następny gwiazdozbiór widać jako blade, przerywane kropki (tak jak dziś kontur Księżyca), więc dziecko wie, co układa. Po 5. gwieździe gwiazdy łączą się kreskami i pojawia się podpis po angielsku (`FISH`, `MOUSE`…), czyli przy okazji kolejne słówko.

**Ważne:** dzieci grają głównie po szkole, czyli za dnia, a dziś gwiazdy rysują się tylko o świcie, zmierzchu i w nocy. Gwiazdozbiory muszą być widoczne **także w dzień** (blade, bez kresek), a w nocy pełne, z kreskami i mruganiem. Inaczej postępu nie widać.

Nazwy gwiazdozbiorów to proste słówka A1. Wszystko jest nasze własne (żadnych postaci z licencją).

## Wszystkie nowe strony (21–100)
Kolumna „obrazek” = emoji do `PAGE_ART` (pikselizowane, Unicode ≤ 13).

### 2. The Night King
| # | obrazek | EN | PL |
|---|---|---|---|
| 21 | 🌌 | The top of the tower. It is cold and dark. A big shadow sits on a throne. | Szczyt wieży. Jest zimno i ciemno. Na tronie siedzi wielki cień. |
| 22 | 🤴 | “I am the Night King,” says the shadow. His voice is sad, not angry. | „Jestem Królem Nocy” — mówi cień. Jego głos jest smutny, nie zły. |
| 23 | 😢 | “I took the Moon because I was alone. My sky had no stars. It was so dark.” | „Zabrałem Księżyc, bo byłem sam. Na moim niebie nie było gwiazd. Było tak ciemno.” |
| 24 | 🤝 | You say: “Let's be friends. Friends share the Moon.” The King smiles. | Mówisz: „Bądźmy przyjaciółmi. Przyjaciele dzielą się Księżycem.” Król się uśmiecha. |
| 25 | 🌕 | You put the last piece in. The Moon is back in the sky! But… where are the stars? | Wkładasz ostatni kawałek. Księżyc wrócił na niebo! Ale… gdzie są gwiazdy? |

### 3. Lost Stars — strony 26–30 (bez zmian, dzieci już je czytają)
| # | obrazek | EN | PL |
|---|---|---|---|
| 26 | 🌠 | The King looks down. “The stars fell. They are hiding in the tower. They are small and shy.” | Król patrzy w dół. „Gwiazdy spadły. Chowają się w wieży. Są małe i nieśmiałe.” |
| 27 | 🛏️ | You find a tiny light under a bed. It is a star! “Hi! Can I go home?” | Znajdujesz małe światełko pod łóżkiem. To gwiazda! „Cześć! Mogę wrócić do domu?” |
| 28 | ⭐ | You throw the star up. It flies into the sky and shines. | Podrzucasz gwiazdę. Leci w niebo i świeci. |
| 29 | 🐠 | A star is in a fish bowl. A little fish sings to it. | Gwiazda jest w akwarium. Mała rybka jej śpiewa. |
| 30 | 🐟 | Five stars in the sky. Look! They make a fish! | Pięć gwiazd na niebie. Spójrz! Tworzą rybę! |

---

# WERSJA 2 (12.11.2026): nowy scenariusz stron 31–100 — ZAAKCEPTOWANA, w grze (data/progression.js STORY, js/ui/pages.js PAGE_ART)

Stary plan stron 31–100 był powtarzalny („znalazłem gwiazdę → gwiazdozbiór” przez 70 dni). Nowa wersja ma tajemnicę, stawkę i zwroty akcji. Gwiazdozbiory i nagrody zostają na tych samych stronach, więc kod nieba i `STORY_REWARDS` się nie zmieniają.

## Oś historii
- **Tajemnica:** gwiazdy nie spadły same. Zabrała je **the Grey** (Szara Mgła). Na całą historię jedno pytanie: **kim jest Mgła i czego chce?**
- **Zasada świata (już z rozdziału 1):** „Words are keys”, zapomniane słowa zamieniają się w cienie. Nowe: **słowo, które pamiętasz, świeci i Mgła nie może go dotknąć.** Nauka (i Shadow Cellar, czyli powtórki) dosłownie chroni niebo.
- **Prawda (finał):** Mgła to tysiące zapomnianych słów sklejonych w jedną szarą chmurę. Nikt ich nie pamięta, więc są samotne i zimne. Zabierały gwiazdy, bo gwiazdy są ciepłe. Kot nie walczy z Mgłą, tylko **zaczyna ją pamiętać**: każde przypomniane słowo zamienia się w gwiazdę. Bez zabijania „złego”: wygrywają pamięć i przyjaźń. Ten sam motyw co u Króla Nocy (samotność), ale tym razem dziecko samo odkrywa prawdę (strony 66–89), zamiast ją usłyszeć.
- **Bohaterowie:** Król Nocy (dumny, buduje statek, popełnia błąd i zostaje porwany), **Pip** — mysz-wynalazczyni (praktyczna, zabawna), **Skye** — ptak-zwiadowca (odważna, trochę narwana), Duszek z rozdziału 1, Żabi Książę, Robot ze Star Station, **Mailcat** — kot-listonosz w balonie, **Wieloryb Chmur** (stary, mądry, mówi powoli). Kot (dziecko) podejmuje decyzje i rozwiązuje zagadkę.
- **Rytm:** każde 5 stron kończy się haczykiem, żeby chcieć wrócić jutro. Co 5 stron zapala się gwiazdozbiór, zawsze z powodu, który wynika z historii.

## Rozdziały (cel → przeszkoda → zwrot)
| Rozdział | Strony | Cel | Przeszkoda | Zwrot / haczyk |
|---|---|---|---|---|
| 3. Lost Stars | 31–45 | Zebrać gwiazdy | Gwiazdy mają szare, zimne plamy | 35: „Nie spadły. Coś je zabrało.” 40: Mgła istnieje. 45: statek Króla leci |
| 4. Shadow Stars | 46–70 | Ścigać Mgłę statkiem | Mgła rośnie i kradnie Gwiazdę-Klucz | 48: tajemniczy list „Why?”. 60: **Mgła porywa Króla**. 68: Mgła to zapomniane słowa. 70: Wieloryb |
| 5. Friends in the Sky | 71–95 | Uratować Króla z wnętrza Mgły | W środku nie ma słów | 78: deszcz zapomnianych słów. 86–88: **serce Mgły to małe, samotne słowo**, to ono napisało list. 95: kot = Strażnik Słów |
| 6. The Full Sky | 96–100 | Przypomnieć Mgle wszystkie słowa | Słów jest bardzo dużo | 100: Mgła zamienia się w gwiazdy, festiwal nieba |

## Strony 31–100
### 3. Lost Stars (31–45)
| # | obrazek | EN | PL |
|---|---|---|---|
| 31 | 🔍 | The fish star has a grey spot. It is cold. “Who did this?” you ask. | Rybia gwiazda ma szarą plamę. Jest zimna. „Kto to zrobił?” — pytasz. |
| 32 | 🐭 | In the kitchen you meet Pip, a mouse with big glasses. Her lamp is a star! | W kuchni poznajesz Pip, mysz w wielkich okularach. Jej lampka to gwiazda! |
| 33 | 🔧 | Pip makes things. “I can fix the grey spot,” she says. “But you must tell me a word.” | Pip robi wynalazki. „Naprawię tę szarą plamę” — mówi. „Ale musisz powiedzieć mi słowo.” |
| 34 | ✨ | You say “cheese”. The word glows. The grey spot is gone! Words are light. | Mówisz „cheese”. Słowo świeci. Szara plama znika! Słowa są światłem. |
| 35 | 🐭 | Pip gives you her star. Now a mouse shines in the sky. Pip whispers: “The stars did not fall. Something took them.” | Pip daje ci swoją gwiazdę. Teraz na niebie świeci mysz. Pip szepcze: „Gwiazdy nie spadły. Coś je zabrało.” |
| 36 | 🐦 | On the roof lives Skye, a fast bird. “I saw it!” she says. “A big grey cloud. It eats light.” | Na dachu mieszka Skye, szybki ptak. „Widziałam to!” — mówi. „Wielka szara chmura. Zjada światło.” |
| 37 | 🎨 | Pip has a plan: “Light can make a bridge. We need a word for every colour.” | Pip ma plan: „Ze światła da się zrobić most. Potrzebujemy słowa na każdy kolor.” |
| 38 | 🌈 | “Red, orange, yellow, green, blue, purple!” A rainbow bridge goes up to the clouds! | „Red, orange, yellow, green, blue, purple!” Tęczowy most prowadzi do chmur! |
| 39 | ☁️ | On the clouds you find three stars in a nest. Skye takes them home. | Na chmurach znajdujesz trzy gwiazdy w gnieździe. Skye zabiera je do domu. |
| 40 | 🌫️ | Now a bird shines in the sky. But far away, the sky is grey. The grey cloud is real. | Teraz na niebie świeci ptak. Ale daleko niebo jest szare. Szara chmura jest prawdziwa. |
| 41 | 👑 | The King is angry. “Nobody takes MY stars! I will build a ship. A ship that flies!” | Król się złości. „Nikt nie zabiera MOICH gwiazd! Zbuduję statek. Statek, który lata!” |
| 42 | 🔨 | Pip helps. Robots help. You help too. Bang, bang! Every day the ship is bigger. | Pip pomaga. Roboty pomagają. Ty też pomagasz. Bum, bum! Statek jest każdego dnia większy. |
| 43 | ⛵ | The ship needs a sail. You find a paper boat with a star inside. It is the last part! | Statek potrzebuje żagla. Znajdujesz papierową łódkę z gwiazdą w środku. To ostatnia część! |
| 44 | 🚪 | The paper boat came from the Shadow Cellar. The shadows wave. “Please remember us,” they say. | Papierowa łódka przypłynęła z Piwnicy Cieni. Cienie machają. „Proszę, pamiętaj o nas” — mówią. |
| 45 | 🚢 | A boat shines in the sky. And the King's ship flies! “Next stop: the grey cloud!” | Na niebie świeci łódka. A statek Króla leci! „Następny przystanek: szara chmura!” |

### 4. Shadow Stars (46–70)
| # | obrazek | EN | PL |
|---|---|---|---|
| 46 | 🌬️ | The ship flies over the tower. The wind is cold. The King looks at a map. “The cloud has a name. It is the Grey.” | Statek leci nad wieżą. Wiatr jest zimny. Król patrzy na mapę. „Ta chmura ma imię. To Mgła.” |
| 47 | 🎈 | A balloon comes! A cat with a big bag says: “I am Mailcat. I have a letter for you.” | Leci balon! Kot z wielką torbą mówi: „Jestem Mailcat. Mam dla ciebie list.” |
| 48 | ✉️ | The letter is grey. It has only one word: “Why?” Who wrote it? | List jest szary. Jest w nim tylko jedno słowo: „Why?” Kto go napisał? |
| 49 | 🗝️ | Mailcat says: “The Grey took the Key Star. Without it, the Moon cannot open the night.” | Mailcat mówi: „Mgła zabrała Gwiazdę-Klucz. Bez niej Księżyc nie może otworzyć nocy.” |
| 50 | 🔑 | You fly into the Grey and say every word you know. The Key Star is free! A key shines in the sky. | Wlatujesz w Mgłę i mówisz każde słowo, które znasz. Gwiazda-Klucz jest wolna! Na niebie świeci klucz. |
| 51 | 📚 | The ship stops at a library in the clouds. It is very quiet. Somebody says: “Shhh!” | Statek zatrzymuje się przy bibliotece w chmurach. Jest bardzo cicho. Ktoś mówi: „Ćśśś!” |
| 52 | 🦉 | It is an old owl. “I keep all the words of the world,” she says. “But many books are empty now.” | To stara sowa. „Pilnuję wszystkich słów świata” — mówi. „Ale wiele książek jest teraz pustych.” |
| 53 | 📖 | “When nobody says a word for a long time, it flies away,” says the owl. “Where to?” you ask. | „Kiedy nikt długo nie mówi jakiegoś słowa, ono odlatuje” — mówi sowa. „Dokąd?” — pytasz. |
| 54 | 🤔 | The owl looks at the window. Outside, the Grey is bigger. “There,” she says. | Sowa patrzy w okno. Na zewnątrz Mgła jest większa. „Tam” — mówi. |
| 55 | 🦉 | The owl gives you a star from her lamp. An owl shines in the sky. “Be careful,” she says. “The Grey is hungry.” | Sowa daje ci gwiazdę ze swojej lampy. Na niebie świeci sowa. „Uważaj” — mówi. „Mgła jest głodna.” |
| 56 | ⛈️ | A storm! The ship shakes. Grey hands come out of the cloud. They want the stars! | Burza! Statek się trzęsie. Z chmury wychodzą szare ręce. Chcą gwiazd! |
| 57 | 🪁 | Skye has an idea. She ties a star to a kite. “Follow the light, not the Grey!” | Skye ma pomysł. Przywiązuje gwiazdę do latawca. „Leć za światłem, nie za Mgłą!” |
| 58 | 💪 | The King stands at the front of the ship. “Go away, Grey! I am the King of the Night!” | Król staje na dziobie statku. „Odejdź, Mgło! Jestem Królem Nocy!” |
| 59 | 😱 | But the Grey does not go away. It opens like a big mouth… | Ale Mgła nie odchodzi. Otwiera się jak wielka paszcza… |
| 60 | 🌫️ | …and takes the King! Only his crown falls on the ship. A kite shines in the sky, but you are very sad. | …i zabiera Króla! Na statek spada tylko jego korona. Na niebie świeci latawiec, ale jest ci bardzo smutno. |
| 61 | 👑 | You hold the crown. It is still warm. “The King is alive,” says Pip. “We will find him.” | Trzymasz koronę. Jest jeszcze ciepła. „Król żyje” — mówi Pip. „Znajdziemy go.” |
| 62 | 🔔 | The owl says: “A bell can wake up words. Ring it, and the King can hear you.” | Sowa mówi: „Dzwon potrafi obudzić słowa. Zadzwoń, a Król cię usłyszy.” |
| 63 | 🌌 | You ring the bell. Ding! The sky turns green and pink. It is the King's light! He is inside the Grey. | Dzwonisz. Dzyń! Niebo robi się zielone i różowe. To światło Króla! Jest w środku Mgły. |
| 64 | 📡 | The lights make letters: “I… AM… OK.” The King is talking to you! | Światła układają się w litery: „I… AM… OK.” Król mówi do ciebie! |
| 65 | 🔔 | A bell shines in the sky. Then the lights say one more word: “HELP.” | Na niebie świeci dzwon. Potem światła mówią jeszcze jedno słowo: „HELP.” |
| 66 | 🌳 | In the clouds there is a tree. Its leaves are words. But the leaves are falling. | W chmurach rośnie drzewo. Jego liście to słowa. Ale liście spadają. |
| 67 | 🍂 | Every leaf that falls turns grey and flies into the Grey. Hmm… | Każdy liść, który spada, robi się szary i leci do Mgły. Hmm… |
| 68 | 💡 | “The Grey is made of forgotten words!” you say. Pip drops her glasses. “Oh no. That is why it is so big.” | „Mgła jest zrobiona z zapomnianych słów!” — mówisz. Pip upuszcza okulary. „O nie. Dlatego jest taka wielka.” |
| 69 | 🍃 | You say the words on the leaves. They stop falling. They glow again. | Mówisz słowa z liści. Przestają spadać. Znowu świecą. |
| 70 | 🐋 | A tree shines in the sky. Then something huge comes out of the clouds. A whale! “I can take you inside the Grey,” it says. | Na niebie świeci drzewo. Wtedy z chmur wynurza się coś ogromnego. Wieloryb! „Mogę zabrać was do środka Mgły” — mówi. |

### 5. Friends in the Sky (71–95)
| # | obrazek | EN | PL |
|---|---|---|---|
| 71 | 🐋 | The Cloud Whale is very old. He speaks slowly. “Inside the Grey… there are no words. You cannot talk.” | Wieloryb Chmur jest bardzo stary. Mówi powoli. „W środku Mgły… nie ma słów. Nie da się mówić.” |
| 72 | 😶 | “How can we find the King with no words?” asks Skye. Nobody knows. | „Jak znajdziemy Króla bez słów?” — pyta Skye. Nikt nie wie. |
| 73 | 👻 | Then a little voice says: “I know how.” It is the ghost from the Candy Forest! | Wtedy cichy głosik mówi: „Ja wiem jak.” To duszek z Cukierkowego Lasu! |
| 74 | 🤫 | “I had no voice once,” says the ghost. “You can talk with your heart. And with light.” | „Kiedyś nie miałem głosu” — mówi duszek. „Można mówić sercem. I światłem.” |
| 75 | 👻 | A ghost shines in the sky. You go into the whale. The whale swims into the Grey. Everything is dark. | Na niebie świeci duszek. Wchodzicie do wieloryba. Wieloryb płynie w Mgłę. Wszystko jest ciemne. |
| 76 | 🌑 | Inside the Grey it is quiet and cold. You open your mouth, but no words come out. | W środku Mgły jest cicho i zimno. Otwierasz usta, ale nie wychodzą żadne słowa. |
| 77 | 🐸 | A green light jumps in the dark. Ribbit! It is the frog prince. He came to help. | W ciemności skacze zielone światełko. Kum kum! To żabi książę. Przyszedł pomóc. |
| 78 | ☄️ | Suddenly, little lights fall all around you. They are words! Forgotten words falling like rain. | Nagle wokół spadają małe światełka. To słowa! Zapomniane słowa spadają jak deszcz. |
| 79 | 🤲 | You catch one. It says “umbrella”. You remember it! It glows in your paw. | Łapiesz jedno. To „umbrella”. Pamiętasz je! Świeci w twojej łapce. |
| 80 | 🐸 | You catch more and more. Every word you remember lights the dark. A frog shines in the sky. | Łapiesz coraz więcej. Każde słowo, które pamiętasz, rozjaśnia ciemność. Na niebie świeci żaba. |
| 81 | 🤖 | Beep! The robot from Star Station is here too. “I can make a word lamp,” it says. | Bip! Robot ze Star Station też tu jest. „Mogę zrobić lampę ze słów” — mówi. |
| 82 | 🏮 | You put your words in the lamp. It shines bright. Now you can see a path. | Wkładasz swoje słowa do lampy. Świeci jasno. Teraz widać ścieżkę. |
| 83 | 👣 | The path goes down, down, down. You hear something. Somebody is crying. | Ścieżka prowadzi w dół, w dół, w dół. Coś słychać. Ktoś płacze. |
| 84 | 👑 | It is the King! He is sitting in the dark. “I am sorry,” he says. “I was proud. I shouted at the Grey.” | To Król! Siedzi w ciemności. „Przepraszam” — mówi. „Byłem dumny. Krzyczałem na Mgłę.” |
| 85 | 🤖 | You give him his crown. A robot shines in the sky. But the King says: “Wait. Look behind you.” | Oddajesz mu koronę. Na niebie świeci robot. Ale Król mówi: „Czekaj. Spójrz za siebie.” |
| 86 | 💔 | Behind you is the heart of the Grey. It is not a monster. It is a tiny grey word, all alone. | Za tobą jest serce Mgły. To nie potwór. To malutkie szare słowo, całkiem samotne. |
| 87 | 🥺 | The tiny word says: “Why do you remember them… and not us?” Now you know who wrote the letter. | Malutkie słowo mówi: „Dlaczego pamiętasz je… a nas nie?” Teraz wiesz, kto napisał list. |
| 88 | 🏠 | “We took the stars because we were cold,” says the word. “We just want to go home.” | „Zabieraliśmy gwiazdy, bo było nam zimno” — mówi słowo. „Chcemy tylko wrócić do domu.” |
| 89 | 🤔 | Where is home for a word? You think and think. Then you smile. “Home is somebody who remembers you.” | Gdzie jest dom słowa? Myślisz i myślisz. Potem się uśmiechasz. „Dom to ktoś, kto o tobie pamięta.” |
| 90 | ☄️ | You say the tiny word. It glows! A comet flies across the sky and shows the way out. A house shines in the sky. | Mówisz to malutkie słowo. Świeci! Przez niebo przelatuje kometa i pokazuje drogę na zewnątrz. Na niebie świeci dom. |
| 91 | 🐋 | The whale swims out. The Grey is a little smaller. But there are so many words left. | Wieloryb wypływa. Mgła jest trochę mniejsza. Ale zostało tyle słów. |
| 92 | 🧭 | “I cannot remember all of them alone,” you say. Pip smiles. “You are not alone.” | „Nie dam rady zapamiętać ich wszystkich w pojedynkę” — mówisz. Pip się uśmiecha. „Masz nas.” |
| 93 | 🤝 | Everybody comes: Pip, Skye, the owl, the ghost, the frog, the robot, Mailcat and the King. | Przychodzą wszyscy: Pip, Skye, sowa, duszek, żaba, robot, Mailcat i Król. |
| 94 | 📣 | Every friend takes some words. “We will say them every day,” says the King. “Then they will never be grey again.” | Każdy przyjaciel bierze trochę słów. „Będziemy je mówić codziennie” — mówi Król. „Wtedy już nigdy nie będą szare.” |
| 95 | 🐱 | The last stars fly up and make a cat. It is you! “You are the Keeper of Words now,” says the owl. | Ostatnie gwiazdy lecą w górę i tworzą kota. To ty! „Teraz to ty strzeżesz słów” — mówi sowa. |

### 6. The Full Sky (96–100)
| # | obrazek | EN | PL |
|---|---|---|---|
| 96 | 🌫️ | One night, the Grey comes to the tower. It is small now. It is not scary. It looks at you. | Pewnej nocy Mgła przychodzi do wieży. Jest teraz mała. Nie jest straszna. Patrzy na ciebie. |
| 97 | 💬 | You say a word. And another. And another. Every word you say turns into a new star. | Mówisz słowo. I kolejne. I kolejne. Każde słowo, które mówisz, zamienia się w nową gwiazdę. |
| 98 | 🌟 | The Grey gets smaller and brighter… and brighter… and BRIGHTER! | Mgła robi się mniejsza i jaśniejsza… i jaśniejsza… i JAŚNIEJSZA! |
| 99 | 💫 | The Grey is gone. In its place there is a new, big star. It whispers: “Thank you for remembering us.” | Mgły już nie ma. Na jej miejscu jest nowa, wielka gwiazda. Szepcze: „Dziękujemy, że o nas pamiętasz.” |
| 100 | 🎆 | The sky is full! The King has a party in the sky, with a rainbow, the ship, the whale and fireworks. Never stop learning words. The End. | Niebo jest pełne! Król robi przyjęcie na niebie, z tęczą, statkiem, wielorybem i fajerwerkami. Nigdy nie przestawaj uczyć się słów. Koniec. |

## Nagrody za strony (bez zmian, pasują do historii)
| Strona | Nagroda | Dlaczego tu |
|---|---|---|
| 35 | Mouse ears | poznajesz Pip, gwiazdozbiór MOUSE |
| 40 | Feather | od Skye |
| 45 | Paper boat | żagiel statku to łódka z gwiazdą |
| 50 | Shadow Cat | uwolniona Gwiazda-Klucz, lot w Mgłę |
| 55 | Night cap | cicha, senna biblioteka sowy |
| 60 | Sky Cat | latawiec, burza, porwanie Króla |
| 65 | Little bell | dzwon budzi słowa |
| 70 | Star Tree Cat | drzewo słów |
| 75 | Boo Cat | duszek prowadzi w ciemność |
| 80 | Frog hat | żabi książę |
| 85 | Robot antenna | robot i lampa ze słów |
| 90 | Cozy Cat | „dom to ktoś, kto o tobie pamięta” |
| 95 | Star Cat | kot-gwiazdozbiór, Strażnik Słów |
| 100 | Star Crown | finał |

## Co dzieje się na niebie (ekran główny, kod: `js/game/skyshow.js`)
Każde wydarzenie pojawia się w dniu, w którym dziecko o nim czyta, i **zostaje na niebie na zawsze** (wyliczane z `save.story`, widoczne także w dzień).

| Od strony | Na niebie | Zachowanie |
|---|---|---|
| 25 | Pełny Księżyc + **Moon Base** | baza się odblokowuje |
| 30, 35 … 95 | gwiazdozbiór się zamyka | jednorazowy pokaz: gwiazdy ożywają (ryba płynie, ptak leci, łódka płynie…), potem czasem nocą |
| 38 | **Tęczowy most** | łuk od wieży do chmur |
| 45 | **Statek Króla** | przelatuje co jakiś czas; raz dziennie zrzuca paczkę na spadochronie (tap = prezent) |
| 47 | **Balon Mailcata** | dryfuje po niebie |
| 60–98 | **Mgła** | szara chmura w rogu nieba: rośnie do 85, potem maleje, od 99 znika |
| 63 | **Zorza** | zielono-różowe fale u góry nieba |
| 70 | **Wieloryb Chmur** | powoli przepływa przez niebo |
| 78 | **Deszcz słów (meteory)** | spadające światełka; tap = +1 rybka (limit dzienny) |
| 90 | **Kometa** | czasem przelatuje przez całe niebo |
| 100 | **Festiwal** | wszystko naraz + fajerwerki + parada gwiazdozbiorów; potem co wieczór losowy pokaz |


## Zgodność i wdrożenie (po akceptacji)
- **Zapis bez zmian.** `save.story` liczy dalej do 100, a `js/rewards.js` już używa `STORY.length`, więc wystarczy dopisać strony. Niebo jest wyliczane z `save.story` (zasada 4 z CLAUDE.md), czyli bez nowego pola, bez migracji i bez zmiany `SAVE_VERSION`.
- **Tempo (decyzja Maxa): 1 nowa strona dziennie**, za pierwszego bossa danego dnia. Liczą się dni gry, nie kalendarz i nie seria: kto opuści dzień, nic nie traci, tylko czyta wolniej. 100 stron to ~100 dni gry, czyli przy 4–5 dniach w tygodniu **~5 miesięcy**. Pozostali bossowie tego dnia dają skrzynie jak dotąd, a w Diary pojawia się napis „Next page tomorrow!”.
- Kod: w `js/rewards.js` warunek `save.story++` dostaje dodatkowo `save.daily.pageDay !== today()` i ustawia `save.daily.pageDay = today()`. To jedno opcjonalne pole, a brak pola (`undefined`) działa poprawnie, więc migracja nie jest potrzebna. `SAVE_VERSION` zostaje bez zmian (w razie wątpliwości dopiszemy pole do migracji v5 z gałęzi rodzica).
- **Dzieci, które mają już więcej stron:** nic nie zabieramy. Strony były nagrodą, a ich liczba jest widoczna (kawałki Księżyca, licznik), więc dziecko by to zauważyło. Od dnia wdrożenia każde dostaje po prostu 1 stronę dziennie dalej. W chmurze: najwięcej ma testowy zapis Maxa (15), dzieci 6 lub mniej, więc różnice to kilka stron.
- **Nadrabianie:** nie robimy. Fabuła nie ma terminu, a każde dziecko czyta swoją. Jedyne miejsce, gdzie dzieci się porównują, to duet; różnica kilku stron nie przeszkadza.
- Kod (szacunek: ~1 dzień):
  - `data/progression.js`: +80 stron w `STORY` i nowa tablica `SKY` (14 gwiazdozbiorów: nazwa i 5 punktów w układzie nieba ekranu głównego, 240 px szerokości; wieża zajmuje środek, więc gwiazdozbiory idą po bokach i nad wieżą, a Gwiazda Północna na środku u góry).
  - `js/ui/pages.js`: `PAGE_ART` +80 obrazków; nagłówek zależny od rozdziału („13/20 Moon pieces” → „7/70 stars”); opcjonalnie „Sky map” (duży podgląd nieba z podpisami).
  - `js/game/world.js` + `js/ui/home.js`: Księżyc wypełnia się kawałkami, a od strony 25 jest pełny; gwiazdozbiory widoczne także w dzień; napis przy Księżycu zmienia się z rozdziałem.
  - Testy z CLAUDE.md (walidator, test-systems, bot) + zrzuty nieba w różnych porach i na stronach 0/20/25/50/100.
- Nie ruszam plików z gałęzi `boss-samouczek-literowanie` poza `pages.js`/`home.js`/`world.js` (do sprawdzenia przy scalaniu).

## Pytania do Maxa
1. ~~Tempo~~: ustalone, 1 strona dziennie (patrz wyżej).
2. **Nagroda za stronę 100?** Np. czapka „Star Crown” albo skórka „Star Cat” (nowe id, bez migracji). Tak/nie?
3. **Po stronie 100:** niebo zostaje pełne, Diary pokazuje „The End”, a wieża dalej działa. Ewentualny sezon 2 (np. planety) zostawiamy na później?
4. Czy jakąś stronę lub gwiazdozbiór zmienić? Każdą linijkę można poprawić przed wdrożeniem.
