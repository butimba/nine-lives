// PROGRESJA: talenty (stałe), perki (na jeden bieg), skrzynki, fabuła.
// id są stałe na zawsze. Wartości liczbowe (balans) możesz zmieniać bez psucia zapisów.

// --- 3 ścieżki talentów. Punkt talentu = 1 za każdy level. ---
// Teksty w grze po angielsku (A1). desc(r) = opis dla rangi r.
export const TALENTS = [
  // CLAWS — atak
  { id: "sharp_claws", tree: "claws", name: "Sharp Claws", icon: "🗡️", max: 3, desc: (r) => `Big hit chance +${r * 6}%` },
  { id: "combo", tree: "claws", name: "Combo Master", icon: "🔥", max: 3, desc: (r) => `${Math.max(2, 5 - r)} good answers in a row: +1 hit`, req: "sharp_claws" },
  { id: "pounce", tree: "claws", name: "Pounce", icon: "🐾", max: 2, desc: (r) => `First hit on a floor: x${r + 1}`, req: "combo" },
  // FUR — obrona (decyzja leada #3)
  { id: "nine_lives", tree: "fur", name: "Nine Lives", icon: "❤️", max: 3, desc: (r) => `+${r} shield for boss shots` },
  { id: "thick_fur", tree: "fur", name: "Thick Fur", icon: "🛡️", max: 3, desc: (r) => `${r * 10}% chance: a mistake costs no life`, req: "nine_lives" },
  { id: "cat_nap", tree: "fur", name: "Cat Nap", icon: "😴", max: 2, desc: (r) => `Beat a boss: +${r >= 2 ? 2 : 1} life`, req: "thick_fur" },
  // WHISKERS — spryt i nagrody
  { id: "lucky", tree: "whiskers", name: "Lucky Whiskers", icon: "🪙", max: 3, desc: (r) => `+${r * 10}% fish` },
  { id: "sixth_sense", tree: "whiskers", name: "Sixth Sense", icon: "💡", max: 3, desc: (r) => `${r + 1} hints in a run`, req: "lucky" },
  { id: "treasure", tree: "whiskers", name: "Treasure Nose", icon: "💎", max: 2, desc: (r) => `Better chests: +${r * 8}% rare`, req: "sixth_sense" },
];
export const TREES = {
  claws: { name: "Claws", color: "#ff5d5d" },
  fur: { name: "Fur", color: "#3d9bff" },
  whiskers: { name: "Whiskers", color: "#ffb21f" },
};

// --- perki na jeden bieg (wybór 1 z 3) ---
export const PERKS = [
  { id: "fishbone", name: "Fishbone Sword", icon: "🐟", desc: "Big hits: +1 hit", w: 3 },
  { id: "bell", name: "Golden Bell", icon: "🔔", desc: "+50% fish in this run", w: 3 },
  { id: "lightning", name: "Lightning Paws", icon: "⚡", desc: "Fast answer (5 s): +1 hit", w: 3 },
  { id: "fire_combo", name: "Fire Combo", icon: "🔥", desc: "3 good in a row: x2 hits", w: 2 },
  { id: "clover", name: "Lucky Clover", icon: "🍀", desc: "Big hit chance +15%", w: 3 },
  { id: "magnet", name: "Star Magnet", icon: "🧲", desc: "+30% XP in this run", w: 3 },
  { id: "big_heart", name: "Big Heart", icon: "💖", desc: "+1 life and +1 shield", w: 2, instant: true },
];

// --- MOCE AKTYWNE (etap 2) — id wieczne. Pasek mocy ładuje się dobrymi odpowiedziami (charge = ile dobrych).
// Odblokowanie: level >= unlockLevel (rewards.js) albo nagroda ze skrzyni. Założone: max 2 (save.powers.equipped).
// icon = klucz ICONS (js/pixel/icons.js). Teksty EN, A1.
export const POWERS = [
  // perki biegu nie dublują mocy (catnip, bubble usunięte); moce odblokowują się wolniej (już odblokowane zostają)
  { id: "owl_eye", name: "Owl Eye", desc: "Takes away a wrong answer", icon: "power_owl_eye", charge: 3, unlockLevel: 2, color: "#ffd23f" },
  { id: "freeze", name: "Freeze", desc: "Stops everything for 3 questions", icon: "power_freeze", charge: 4, unlockLevel: 4, color: "#7ec4ff" },
  { id: "claw_storm", name: "Claw Storm", desc: "Double hits for 3 answers", icon: "power_claw_storm", charge: 5, unlockLevel: 7, color: "#ff5d5d" },
  { id: "ball_buster", name: "Ball Buster", desc: "No boss shots for 3 answers", icon: "power_ball_buster", charge: 4, unlockLevel: 10, color: "#ff9a3d" },
  { id: "fish_magnet", name: "Fish Magnet", desc: "Double fish on this floor", icon: "power_fish_magnet", charge: 4, unlockLevel: 13, color: "#6fe3d3" },
  { id: "catnip", name: "Catnip", desc: "+1 life", icon: "power_catnip", charge: 6, unlockLevel: 16, color: "#93e04c" },
];
export const MAX_EQUIPPED_POWERS = 2;
export const powerById = (id) => POWERS.find((p) => p.id === id) || null;

// --- WYDARZENIA W BIEGU (etap 2): losowe, nigdy na piętrze bossa, max 1 na etap (bieg). Szansa na piętro.
// golden/mimic zastępują potwora na początku piętra; merchant/secret pojawiają się po pokonaniu potwora.
export const RUN_EVENTS = {
  golden: { chance: 0.035, turns: 3, fish: 30 },          // złoty potwór: ucieka po 3 odpowiedziach, dużo rybek
  mimic: { chance: 0.03, chest: ["wood", "wood", "silver"] }, // skrzynia-mimik: mini-walka, nagroda = skrzynia
  merchant: { chance: 0.04 },                              // kupiec-kot między piętrami
  secret: { chance: 0.012, fish: [12, 36] },               // sekretne piętro: deszcz rybek
};
// oferty kupca (cena w rybkach; płaci się najpierw rybkami z biegu, potem z banku)
export const MERCHANT_OFFERS = [
  { id: "life", name: "Catnip Tea", desc: "+1 life", icon: "heart", price: 25 },
  { id: "shield", name: "Shield", desc: "Blocks a boss shot", icon: "shield", price: 15 },
  { id: "perk", name: "Mystery Perk", desc: "A power for this run", icon: "star", price: 30 },
];

// --- skrzynie (sprite: chestSprite(type) w js/pixel/chests.js) ---
// rolls = wagi losowania; coins = [min, max] rybek, gdy wypadnie kategoria "coins"
export const CHESTS = {
  wood: { name: "Wooden Chest", icon: "🧰", rolls: { coins: 70, common: 20, rare: 9, epic: 1, legendary: 0 }, coins: [40, 90] },
  silver: { name: "Silver Chest", icon: "🎁", rolls: { coins: 45, common: 25, rare: 22, epic: 7, legendary: 1 }, coins: [90, 180] },
  gold: { name: "Golden Chest", icon: "👑", rolls: { coins: 20, common: 15, rare: 35, epic: 22, legendary: 8 }, coins: [180, 350] },
  // mythic: 50% legendary item you don't have yet (else epic), 50% (or nothing left) lots of fish — meta.openChest
  mythic: { name: "Mythic Chest", icon: "🌌", rolls: { coins: 0, common: 0, rare: 0, epic: 0, legendary: 100 }, coins: [1000, 1500] },
  epic: { name: "Epic Chest", icon: "💎", rolls: { coins: 5, common: 0, rare: 30, epic: 45, legendary: 20 }, coins: [350, 600] },
};
export const CHEST_ORDER = ["wood", "silver", "gold", "epic"];
// rybki za duplikat (wszystko z danej rzadkości już posiadane)
export const DUP_COINS = { common: 60, rare: 150, epic: 300, legendary: 600 };

// --- ekonomia ---
// Malejące nagrody i życia: js/lives.js (REWARD_TIERS, MAX_LIVES, REGEN_MS, COMBO_LIFE).
export const ECON = {
  coinPerCorrect: 2, coinPerKill: 3, coinPerBoss: 20, coinShadowClear: 4,
  xpPerCorrect: 10, xpPerTry: 2, xpPerBoss: 50,
  // LEGACY (v1 battle.js) — v2 tego nie używa, zastąpione przez lives.rewardMult
  dailyFullRuns: 3, dailyMult: [1, 1, 1, 0.5, 0.5, 0.25],
  freezePrice: 120, freezeMax: 2,
  chestPrice: 220,
  // XP potrzebne na przejście z lvl do lvl+1. Do lvl 15 jak dawniej (nikomu nie spada level), od 16 coraz wolniej:
  // wszystkie talenty (lvl 25) po ok. 2 miesiącach codziennej gry zamiast ~2,5 tygodnia.
  levelXp: (lvl) => 100 + (lvl - 1) * 40 + (lvl >= 16 ? 100 * (lvl - 15) ** 2 : 0),
  monsterHp: (floor) => (floor < 20 ? 2 : floor < 60 ? 3 : 4),
  bossHp: (floor) => (floor < 20 ? 5 : floor < 60 ? 6 : 7),
  floorsPerStage: 5,
  weeklyHpPerPlayer: 250,
  weeklyLastWeek: 0.9,   // HP bossa tygodnia >= 90% obrażeń z zeszłego tygodnia (im mocniej grają, tym większy boss i pula)
  weeklyFishPerHp: 3,    // pula rybek = HP × 3, dzielona wg obrażeń (≈ 750 rybek na przeciętne dziecko)
  weeklyMinShare: 50,
  luckyCoin: 0.1,      // talent lucky: +10% rybek za rangę
  bellCoin: 1.5,       // perk bell
  magnetXp: 1.3,       // perk magnet
  catNapLives: (r) => (r >= 2 ? 2 : r >= 1 ? 1 : 0), // talent cat_nap: życia po bossie
};

// --- FABUŁA: "The Moon Diary" — strona za każdego nowego bossa (co 5 pięter) ---
// en = proste angielskie zdania, pl = tłumaczenie (przycisk "PL").
export const STORY = [
  { en: "One night, the Moon disappears from the sky. 🌑 The cats are scared.", pl: "Pewnej nocy Księżyc znika z nieba. Koty się boją." },
  { en: "You find a tower. It is very, very tall. At the top there is a silver light.", pl: "Znajdujesz wieżę. Jest bardzo, bardzo wysoka. Na szczycie jest srebrne światło." },
  { en: "A monster drops a note: “The Night King has the Moon.” Who is the Night King?", pl: "Potwór upuszcza liścik: „Król Nocy ma Księżyc”. Kim jest Król Nocy?" },
  { en: "The attic smells of old books. Something is writing on the wall… in English!", pl: "Strych pachnie starymi książkami. Coś pisze na ścianie… po angielsku!" },
  { en: "The wall says: “Words are keys.” Every word you learn opens a door.", pl: "Na ścianie jest napisane: „Słowa są kluczami”. Każde słowo, którego się uczysz, otwiera drzwi." },
  { en: "In the Candy Forest, a tiny ghost is crying. “The King stole my voice!”", pl: "W Cukierkowym Lesie płacze mały duszek. „Król ukradł mój głos!”" },
  { en: "You give the ghost a word: “hello”. The ghost smiles. Now it can talk!", pl: "Dajesz duszkowi słowo: „hello”. Duszek się uśmiecha. Teraz może mówić!" },
  { en: "The ghost whispers: “The King hates new words. They make him weak.”", pl: "Duszek szepcze: „Król nienawidzi nowych słów. Osłabiają go.”" },
  { en: "The swamp is green and stinky. A frog wearing a crown jumps out. Is it the King? No!", pl: "Bagno jest zielone i śmierdzące. Wyskakuje żaba w koronie. To Król? Nie!" },
  { en: "The frog is a prince. “I forgot all my words,” he says. “Help me remember.”", pl: "Żaba to książę. „Zapomniałem wszystkich słów” — mówi. „Pomóż mi sobie przypomnieć.”" },
  { en: "Forgotten words become shadows. That is why the Shadow Cave is so dark…", pl: "Zapomniane słowa zamieniają się w cienie. Dlatego Jaskinia Cieni jest taka ciemna…" },
  { en: "Lava everywhere! You see a piece of the Moon. It is warm and glowing.", pl: "Wszędzie lawa! Widzisz kawałek Księżyca. Jest ciepły i świeci." },
  { en: "The Moon piece talks: “Find all my pieces. Then I can go home.”", pl: "Kawałek Księżyca mówi: „Znajdź wszystkie moje kawałki. Wtedy wrócę do domu.”" },
  { en: "Snow falls up, not down. In the Frozen Tower, everything is upside down.", pl: "Śnieg pada do góry, nie w dół. W Zamarzniętej Wieży wszystko jest do góry nogami." },
  { en: "A snowman gives you a map. On the map there is a crown… and your name!", pl: "Bałwan daje ci mapę. Na mapie jest korona… i twoje imię!" },
  { en: "In the Dream Clouds you meet a cat. It looks like you. “I am you from the future,” it says.", pl: "W Chmurach Snów spotykasz kota. Wygląda jak ty. „Jestem tobą z przyszłości” — mówi." },
  { en: "“Keep climbing,” says Future You. “And never stop learning words.”", pl: "„Wspinaj się dalej” — mówi Przyszły Ty. „I nigdy nie przestawaj uczyć się słów.”" },
  { en: "Star Station! Robots everywhere. One robot is holding the biggest Moon piece.", pl: "Gwiezdna Stacja! Wszędzie roboty. Jeden robot trzyma największy kawałek Księżyca." },
  { en: "The robot says: “Beep. Answer my question and the piece is yours.”", pl: "Robot mówi: „Bip. Odpowiedz na moje pytanie, a kawałek jest twój.”" },
  { en: "You answer. The robot bows. The Moon is almost complete… but the Night King is waiting. To be continued…", pl: "Odpowiadasz. Robot się kłania. Księżyc jest prawie cały… ale Król Nocy czeka. Ciąg dalszy nastąpi…" },
  // --- rozdziały 2–6 (strony 21–100, docs/STORY-100.md) — 1 strona dziennie (rewards.js) ---
  { en: "The top of the tower. It is cold and dark. A big shadow sits on a throne.", pl: "Szczyt wieży. Jest zimno i ciemno. Na tronie siedzi wielki cień." },
  { en: "“I am the Night King,” says the shadow. His voice is sad, not angry.", pl: "„Jestem Królem Nocy” — mówi cień. Jego głos jest smutny, nie zły." },
  { en: "“I took the Moon because I was alone. My sky had no stars. It was so dark.”", pl: "„Zabrałem Księżyc, bo byłem sam. Na moim niebie nie było gwiazd. Było tak ciemno.”" },
  { en: "You say: “Let's be friends. Friends share the Moon.” The King smiles.", pl: "Mówisz: „Bądźmy przyjaciółmi. Przyjaciele dzielą się Księżycem.” Król się uśmiecha." },
  { en: "You put the last piece in. The Moon is back in the sky! But… where are the stars?", pl: "Wkładasz ostatni kawałek. Księżyc wrócił na niebo! Ale… gdzie są gwiazdy?" },
  { en: "The King looks down. “The stars fell. They are hiding in the tower. They are small and shy.”", pl: "Król patrzy w dół. „Gwiazdy spadły. Chowają się w wieży. Są małe i nieśmiałe.”" },
  { en: "You find a tiny light under a bed. It is a star! “Hi! Can I go home?”", pl: "Znajdujesz małe światełko pod łóżkiem. To gwiazda! „Cześć! Mogę wrócić do domu?”" },
  { en: "You throw the star up. It flies into the sky and shines.", pl: "Podrzucasz gwiazdę. Leci w niebo i świeci." },
  { en: "A star is in a fish bowl. A little fish sings to it.", pl: "Gwiazda jest w akwarium. Mała rybka jej śpiewa." },
  { en: "Five stars in the sky. Look! They make a fish!", pl: "Pięć gwiazd na niebie. Spójrz! Tworzą rybę!" },
  { en: "The King says: “Stars like to be together. They make pictures in the sky.”", pl: "Król mówi: „Gwiazdy lubią być razem. Tworzą obrazki na niebie.”" },
  { en: "In the kitchen, a mouse has a star. It is the mouse's lamp.", pl: "W kuchni mysz ma gwiazdę. To lampka myszy." },
  { en: "The mouse says: “Tell me a new word and the star is yours.” You say: “cheese”.", pl: "Mysz mówi: „Powiedz mi nowe słowo, a gwiazda jest twoja.” Mówisz: „cheese”." },
  { en: "The mouse is happy. It eats the cheese and gives you the star.", pl: "Mysz jest szczęśliwa. Je ser i daje ci gwiazdę." },
  { en: "Now there is a mouse in the sky. It is next to the fish. Funny!", pl: "Teraz na niebie jest mysz. Jest obok ryby. Śmieszne!" },
  { en: "A bird has a star in its nest. It thinks the star is an egg.", pl: "Ptak ma gwiazdę w gnieździe. Myśli, że gwiazda to jajko." },
  { en: "You give the bird a real egg. The bird says “thank you”.", pl: "Dajesz ptakowi prawdziwe jajko. Ptak mówi „dziękuję”." },
  { en: "The bird flies with you. From up high, it can see the stars.", pl: "Ptak leci z tobą. Z wysoka widzi gwiazdy." },
  { en: "“There! And there!” says the bird. You find two stars in the clouds.", pl: "„Tam! I tam!” — mówi ptak. Znajdujesz dwie gwiazdy w chmurach." },
  { en: "A bird is in the sky now. It flies next to the Moon.", pl: "Na niebie jest teraz ptak. Leci obok Księżyca." },
  { en: "It rains. A paper boat sails on the water. There is a star in the boat!", pl: "Pada deszcz. Papierowa łódka płynie po wodzie. W łódce jest gwiazda!" },
  { en: "You follow the boat. Down, down, down… to the Shadow Cellar.", pl: "Idziesz za łódką. W dół, w dół, w dół… do Piwnicy Cieni." },
  { en: "The shadows are not scary. They are sad. They look at the star and smile.", pl: "Cienie nie są straszne. Są smutne. Patrzą na gwiazdę i się uśmiechają." },
  { en: "A shadow gives you a star. “Take it. Please remember us.”", pl: "Cień daje ci gwiazdę. „Weź ją. Proszę, pamiętaj o nas.”" },
  { en: "A boat sails in the sky. The King claps. But what about the shadows?", pl: "Po niebie płynie łódka. Król klaszcze. Ale co z cieniami?" },
  { en: "You ask the King: “What are shadows?” He says: “Shadows are forgotten words.”", pl: "Pytasz Króla: „Czym są cienie?” Mówi: „Cienie to zapomniane słowa.”" },
  { en: "Remember? “Words are keys.” A star is locked in a little box.", pl: "Pamiętasz? „Słowa są kluczami.” Gwiazda jest zamknięta w małym pudełku." },
  { en: "The box says: “Say a word you forgot.” You think and think… “Umbrella!”", pl: "Na pudełku jest napisane: „Powiedz zapomniane słowo.” Myślisz i myślisz… „Umbrella!”" },
  { en: "Click! The box opens. The star jumps out.", pl: "Klik! Pudełko się otwiera. Gwiazda wyskakuje." },
  { en: "Look! A key shines in the sky.", pl: "Spójrz! Na niebie świeci klucz." },
  { en: "It is night. An old owl is reading a book. The book is full of stars.", pl: "Jest noc. Stara sowa czyta książkę. Książka jest pełna gwiazd." },
  { en: "The owl says: “Every word is a little star. Read, and they shine.”", pl: "Sowa mówi: „Każde słowo to mała gwiazdka. Czytaj, a będą świecić.”" },
  { en: "You read the book with the owl. A star flies out of the book!", pl: "Czytasz książkę z sową. Z książki wylatuje gwiazda!" },
  { en: "The owl is sleepy. “Goodnight, little cat. Goodnight, stars.”", pl: "Sowa jest śpiąca. „Dobranoc, mały kocie. Dobranoc, gwiazdy.”" },
  { en: "An owl looks down from the sky. Its eyes are two big stars.", pl: "Z nieba patrzy sowa. Jej oczy to dwie duże gwiazdy." },
  { en: "It is windy! A kite is flying. There is a star on its tail.", pl: "Wieje wiatr! Leci latawiec. Na jego ogonie jest gwiazda." },
  { en: "You run and jump. You can't catch the kite. It is too fast!", pl: "Biegniesz i skaczesz. Nie możesz złapać latawca. Jest za szybki!" },
  { en: "The bird from the sky helps you. It holds the string.", pl: "Ptak z nieba ci pomaga. Trzyma sznurek." },
  { en: "Now the kite is in your paws. Thank you, bird!", pl: "Teraz latawiec jest w twoich łapkach. Dziękuję, ptaku!" },
  { en: "A kite flies in the sky. The wind is happy.", pl: "Po niebie leci latawiec. Wiatr jest szczęśliwy." },
  { en: "Ding! Dong! A big bell rings. The shadows in the cellar can hear it.", pl: "Ding! Dong! Dzwoni duży dzwon. Cienie w piwnicy go słyszą." },
  { en: "The shadows come up. They want to see the stars too.", pl: "Cienie wychodzą na górę. One też chcą zobaczyć gwiazdy." },
  { en: "A small shadow says: “I am ‘yellow’. I was a word. Do you remember me?”", pl: "Mały cień mówi: „Jestem ‘yellow’. Byłem słowem. Pamiętasz mnie?”" },
  { en: "You say: “Yellow! Like the sun!” The shadow starts to glow…", pl: "Mówisz: „Yellow! Jak słońce!” Cień zaczyna świecić…" },
  { en: "The shadow is a star now! A bell rings in the sky.", pl: "Cień jest teraz gwiazdą! Na niebie dzwoni dzwon." },
  { en: "Now you know the secret. You remember a word, and a shadow becomes a star.", pl: "Teraz znasz sekret. Przypominasz sobie słowo, a cień staje się gwiazdą." },
  { en: "That is why the King's sky was dark. He forgot all his words.", pl: "Dlatego niebo Króla było ciemne. Zapomniał wszystkich słów." },
  { en: "You teach the King a word: “friend”. He says it again and again.", pl: "Uczysz Króla słowa: „friend”. Powtarza je w kółko." },
  { en: "The King plants a star in a pot. It grows and grows…", pl: "Król sadzi gwiazdę w doniczce. Rośnie i rośnie…" },
  { en: "A star tree! Look at the sky. So many stars!", pl: "Gwiezdne drzewo! Spójrz na niebo. Tyle gwiazd!" },
  { en: "The little ghost from the Candy Forest visits you. “I want to help!”", pl: "Odwiedza cię mały duszek z Cukierkowego Lasu. „Chcę pomóc!”" },
  { en: "Ghosts can go through walls. The ghost finds stars in secret rooms.", pl: "Duchy przechodzą przez ściany. Duszek znajduje gwiazdy w tajnych pokojach." },
  { en: "“Hello! Hello!” says the ghost to every star. Remember? That word is from you.", pl: "„Hello! Hello!” — mówi duszek do każdej gwiazdy. Pamiętasz? To słowo od ciebie." },
  { en: "The stars like the ghost. They follow it like little ducks.", pl: "Gwiazdy lubią duszka. Idą za nim jak małe kaczuszki." },
  { en: "A ghost in the sky! It is not scary. It is waving.", pl: "Duszek na niebie! Nie jest straszny. Macha." },
  { en: "The frog prince jumps in. He remembers all his words now!", pl: "Wskakuje żabi książę. Teraz pamięta wszystkie swoje słowa!" },
  { en: "“Ribbit! I can count in English!” He counts the stars: one, two, three…", pl: "„Kum! Umiem liczyć po angielsku!” Liczy gwiazdy: one, two, three…" },
  { en: "In the swamp, stars sleep on big leaves. The frog wakes them up.", pl: "Na bagnie gwiazdy śpią na dużych liściach. Żaba je budzi." },
  { en: "The frog jumps very high. Higher than the tower! He puts a star in the sky.", pl: "Żaba skacze bardzo wysoko. Wyżej niż wieża! Kładzie gwiazdę na niebie." },
  { en: "A frog in the sky! It has a little crown.", pl: "Żaba na niebie! Ma małą koronę." },
  { en: "Beep! The robot from Star Station calls you. “I have a question. Again.”", pl: "Bip! Dzwoni robot z Gwiezdnej Stacji. „Mam pytanie. Znowu.”" },
  { en: "“What is the opposite of ‘dark’?” You say: “Light!” Beep beep, correct!", pl: "„Co jest przeciwieństwem ‘dark’?” Mówisz: „Light!” Bip bip, dobrze!" },
  { en: "The robot has a big telescope. You can see far, far away.", pl: "Robot ma duży teleskop. Widać daleko, daleko." },
  { en: "In the telescope you see your friend, the snowman. His hat is full of stars!", pl: "W teleskopie widzisz przyjaciela bałwana. Jego kapelusz jest pełen gwiazd!" },
  { en: "A robot in the sky! Its eyes blink: beep, beep.", pl: "Robot na niebie! Jego oczy mrugają: bip, bip." },
  { en: "The snowman comes too. “Brr! I want a home in the sky.”", pl: "Bałwan też przychodzi. „Brr! Chcę dom na niebie.”" },
  { en: "You and your friends build a house of stars. The ghost carries the stars.", pl: "Ty i przyjaciele budujecie dom z gwiazd. Duszek nosi gwiazdy." },
  { en: "The frog makes the door. The robot makes the windows.", pl: "Żaba robi drzwi. Robot robi okna." },
  { en: "The snowman makes the roof. It is white and cold.", pl: "Bałwan robi dach. Jest biały i zimny." },
  { en: "A house in the sky! Now everybody has a home.", pl: "Dom na niebie! Teraz każdy ma dom." },
  { en: "The King looks at the sky. “Something is missing,” he says.", pl: "Król patrzy na niebo. „Czegoś brakuje” — mówi." },
  { en: "“There is no cat in the sky. But a cat found all the stars!”", pl: "„Na niebie nie ma kota. A to kot znalazł wszystkie gwiazdy!”" },
  { en: "Your friends find stars for you. Now you wait.", pl: "Przyjaciele szukają gwiazd dla ciebie. Teraz ty czekasz." },
  { en: "They put the stars up: ears, eyes, a tail…", pl: "Umieszczają gwiazdy: uszy, oczy, ogon…" },
  { en: "It is you! A cat in the sky! You are a star.", pl: "To ty! Kot na niebie! Jesteś gwiazdą." },
  { en: "Future You is on the roof. “Remember me? This is the night from my story.”", pl: "Przyszły Ty jest na dachu. „Pamiętasz mnie? To jest ta noc z mojej opowieści.”" },
  { en: "“Look up,” says Future You. One star is still missing. The biggest one.", pl: "„Spójrz w górę” — mówi Przyszły Ty. Wciąż brakuje jednej gwiazdy. Największej." },
  { en: "The King gives you his crown. In the crown there is a big, bright star.", pl: "Król daje ci swoją koronę. W koronie jest duża, jasna gwiazda." },
  { en: "“This star is all your words,” says the King. “Put it at the top of the sky.”", pl: "„Ta gwiazda to wszystkie twoje słowa” — mówi Król. „Umieść ją na szczycie nieba.”" },
  { en: "The sky is full. The Moon smiles. The cats dance. Thank you, little star! The End.", pl: "Niebo jest pełne. Księżyc się uśmiecha. Koty tańczą. Dziękujemy, mała gwiazdko! Koniec." },
];

// --- NIEBO (rozdziały 3–5): strona 26–95 = 1 gwiazda, 5 gwiazd = gwiazdozbiór (wyliczane z save.story, bez pola w zapisie) ---
// pts: 5 gwiazd w polu 22x17 px (kolejność zapalania), lines: kreski po ukończeniu, name: słówko A1 pod gwiazdozbiorem
export const SKY_FIRST_PAGE = 26, MOON_PAGES = 25;
export const SKY = [
  { name: "FISH", pts: [[0, 8], [8, 3], [8, 13], [18, 4], [18, 12]], lines: [[0, 1], [1, 4], [0, 2], [2, 3], [3, 4]] },
  { name: "MOUSE", pts: [[2, 2], [7, 2], [4, 7], [14, 10], [21, 6]], lines: [[0, 2], [1, 2], [2, 3], [3, 4]] },
  { name: "BIRD", pts: [[0, 4], [6, 8], [11, 6], [16, 8], [22, 4]], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  { name: "BOAT", pts: [[0, 10], [20, 10], [16, 15], [4, 15], [10, 0]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [4, 0], [4, 1]] },
  { name: "KEY", pts: [[0, 2], [0, 8], [5, 5], [20, 5], [20, 9]], lines: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4]] },
  { name: "OWL", pts: [[2, 0], [14, 0], [5, 6], [11, 6], [8, 15]], lines: [[0, 2], [1, 3], [2, 3], [2, 4], [3, 4]] },
  { name: "KITE", pts: [[8, 0], [14, 6], [8, 12], [2, 6], [14, 17]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4]] },
  { name: "BELL", pts: [[8, 0], [4, 8], [12, 8], [0, 14], [16, 14]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 4]] },
  { name: "TREE", pts: [[8, 0], [2, 10], [14, 10], [8, 10], [8, 16]], lines: [[0, 1], [0, 2], [1, 2], [3, 4]] },
  { name: "GHOST", pts: [[8, 0], [2, 6], [14, 6], [4, 15], [12, 15]], lines: [[0, 1], [0, 2], [1, 3], [2, 4]] },
  { name: "FROG", pts: [[3, 0], [13, 0], [8, 6], [0, 12], [16, 12]], lines: [[0, 2], [1, 2], [2, 3], [2, 4]] },
  { name: "ROBOT", pts: [[8, 0], [3, 5], [13, 5], [13, 14], [3, 14]], lines: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 1]] },
  { name: "HOUSE", pts: [[8, 0], [1, 7], [15, 7], [15, 16], [1, 16]], lines: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 1]] },
  { name: "CAT", pts: [[2, 0], [10, 0], [6, 6], [12, 13], [20, 6]], lines: [[0, 2], [1, 2], [2, 3], [3, 4]] },
];
// ile gwiazd zapalonych przy danej liczbie stron (0–70)
export const skyStars = (story) => Math.max(0, Math.min(SKY.length * 5, (story || 0) - SKY_FIRST_PAGE + 1));

// --- nagrody z fabuły (source: "story" w cosmetics.js): strona -> przedmiot. Wydawane w rewards.js (syncStory, idempotentne) ---
export const STORY_REWARDS = {
  25: { hat: "moonclip" }, 30: { skin: "goldfish" }, 35: { hat: "mouseears" }, 40: { hat: "feather" },
  45: { hat: "paperboat" }, 50: { skin: "shadowcat" }, 55: { hat: "nightcap" }, 60: { skin: "skycat" },
  65: { hat: "bellhat" }, 70: { skin: "startree" }, 75: { skin: "boo" }, 80: { hat: "froghat" },
  85: { hat: "antenna" }, 90: { skin: "cozy" }, 95: { skin: "starcat" }, 100: { hat: "starcrown" },
};

// rozdziały Moon Diary (zakładki): from/to = numery stron (1-based)
export const CHAPTERS = [
  { name: "Moon Pieces", from: 1, to: 20 }, { name: "The Night King", from: 21, to: 25 },
  { name: "Lost Stars", from: 26, to: 45 }, { name: "Shadow Stars", from: 46, to: 70 },
  { name: "Friends in the Sky", from: 71, to: 95 }, { name: "The Full Sky", from: 96, to: 100 },
];
