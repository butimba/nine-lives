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
  golden: { chance: 0.035, turns: 3, fish: 15 },          // złoty potwór: ucieka po 3 odpowiedziach, dużo rybek
  mimic: { chance: 0.03, chest: ["wood", "wood", "silver"] }, // skrzynia-mimik: mini-walka, nagroda = skrzynia
  merchant: { chance: 0.04 },                              // kupiec-kot między piętrami
  secret: { chance: 0.012, fish: [8, 24] },               // sekretne piętro: deszcz rybek
  // Glitch (fabuła, strony 31–34): potwór z fabuły, pyta TYLKO zdaniami; naprawiony = bonus rybek. Nie dla nieczytających.
  glitch: { chance: 0.05, fish: 10, page: 34 },
};
// oferty kupca (cena w rybkach; płaci się najpierw rybkami z biegu, potem z banku)
export const MERCHANT_OFFERS = [
  { id: "life", name: "Catnip Tea", desc: "+1 life", icon: "heart", price: 15 },
  { id: "shield", name: "Shield", desc: "Blocks a boss shot", icon: "shield", price: 10 },
  { id: "perk", name: "Mystery Perk", desc: "A power for this run", icon: "star", price: 20 },
];

// --- skrzynie (sprite: chestSprite(type) w js/pixel/chests.js) ---
// rolls = wagi losowania; coins = [min, max] rybek, gdy wypadnie kategoria "coins"
// Rybki ze skrzyń celowo małe: skrzynia ma dawać PRZEDMIOTY. Wcześniej skrzynie dawały więcej rybek niż sama gra
// (tools/sim-economy.mjs: ~800/dzień) i cały sklep był kupiony po 3 tygodniach.
// min = najniższa rzadkość przedmiotu (drabinka: im lepsza skrzynia, tym lepsza gwarancja). Wagi 0 = nigdy.
export const CHESTS = {
  wood: { name: "Wooden Chest", icon: "🧰", min: "common", rolls: { coins: 60, common: 30, rare: 10, epic: 0, legendary: 0 }, coins: [5, 10] },
  silver: { name: "Silver Chest", icon: "🎁", min: "common", rolls: { coins: 0, common: 50, rare: 40, epic: 10, legendary: 0 }, coins: [10, 20] },
  gold: { name: "Golden Chest", icon: "👑", min: "rare", rolls: { coins: 0, common: 0, rare: 50, epic: 40, legendary: 10 }, coins: [20, 40] },
  // epicka = smaczek raz na jakiś czas: zawsze epicki albo legendarny
  epic: { name: "Epic Chest", icon: "💎", min: "epic", rolls: { coins: 0, common: 0, rare: 0, epic: 75, legendary: 25 }, coins: [40, 70] },
  // mityczna (tylko boss tygodnia): legendarny (skórki "mythic" ×2) → epicki; rybki dopiero gdy masz wszystko
  mythic: { name: "Mythic Chest", icon: "🌌", min: "epic", rolls: { coins: 0, common: 0, rare: 0, epic: 0, legendary: 100 }, coins: [80, 150] },
};
// gwarancja do pokazania pod skrzynią (ui/chest.js)
export const CHEST_PROMISE = { wood: "Fish or a surprise!", silver: "Always a prize!", gold: "Rare or better!", epic: "Epic or better!", mythic: "LEGENDARY!" };
export const CHEST_ORDER = ["wood", "silver", "gold", "epic"]; // + "mythic" (tylko boss tygodnia)
// rybki za duplikat (wszystko z danej rzadkości już posiadane)
export const DUP_COINS = { common: 30, rare: 75, epic: 150, legendary: 300 };

// --- ekonomia ---
// Malejące nagrody i życia: js/lives.js (REWARD_TIERS, MAX_LIVES, REGEN_MS, COMBO_LIFE).
export const ECON = {
  coinPerCorrect: 1, coinPerKill: 1, coinPerBoss: 5, coinShadowClear: 2,
  xpPerCorrect: 10, xpPerTry: 2, xpPerBoss: 50,
  // LEGACY (v1 battle.js) — v2 tego nie używa, zastąpione przez lives.rewardMult
  dailyFullRuns: 3, dailyMult: [1, 1, 1, 0.5, 0.5, 0.25],
  freezePrice: 60, freezeMax: 2,
  bossChestsPerDay: 1, // skrzynia za bossa tylko za pierwszego bossa dnia (dalej same rybki) — save.daily.bossChests
  chestPrice: 150, // sklep sprzedaje SREBRNĄ skrzynię
  // XP potrzebne na przejście z lvl do lvl+1. Do lvl 15 jak dawniej (nikomu nie spada level), od 16 coraz wolniej:
  // wszystkie talenty (lvl 25) po ok. 2 miesiącach codziennej gry zamiast ~2,5 tygodnia.
  levelXp: (lvl) => 100 + (lvl - 1) * 40 + (lvl >= 16 ? 100 * (lvl - 15) ** 2 : 0),
  monsterHp: (floor) => (floor < 20 ? 2 : floor < 60 ? 3 : 4),
  bossHp: (floor) => (floor < 20 ? 5 : floor < 60 ? 6 : 7),
  floorsPerStage: 5,
  starFish: 3, // złota gwiazdka w walce z bossem
  parcelFish: [5, 10], // paczka ze statku Króla (raz dziennie, od strony 45): same rybki
  kingEvery: 25, kingHp: 2, kingFish: 25, // boss co 25 pięter = Król: korona, +2 HP, 3. pocisk w fazie 2, +25 rybek
  weeklyHpPerPlayer: 120,
  weeklyLastWeek: 0.9,   // HP bossa tygodnia >= 90% obrażeń z zeszłego tygodnia (im mocniej grają, tym większy boss i pula)
  weeklyFishPerHp: 0.5,    // pula bonusu = HP × 0,5, dzielona wg obrażeń, wypłacana po pokonaniu bossa (≈ 60 rybek na dziecko)
  weeklyFishPerHit: 0.2,   // + 0,2 rybki za punkt obrażeń od razu po biegu (× malejące nagrody), nawet gdy boss nie padnie
  weeklyMinShare: 30,
  luckyCoin: 0.1,      // talent lucky: +10% rybek za rangę
  bellCoin: 1.5,       // perk bell
  magnetXp: 1.3,       // perk magnet
  catNapLives: (r) => (r >= 2 ? 2 : r >= 1 ? 1 : 0), // talent cat_nap: życia po bossie
};

// --- FABUŁA: "The Moon Diary" (docs/STORY-100.md, wersja 4) — 1 strona dziennie za pierwszego bossa dnia (rewards.js) ---
// en = proste angielskie zdania (A1: present simple, can, have got, there is), pl = podpowiedź (przycisk "PL", neutralna płciowo),
// art = obrazek strony (emoji pikselizowane, Unicode ≤ 13). Główna zasada świata: DOBRE ZDANIE STAJE SIĘ PRAWDĄ.
export const STORY = [
  // 1. The Missing Moon (1–10)
  { art: "🌑", en: "One night, the Moon disappears from the sky. 🌑 The cats are scared.", pl: "Pewnej nocy Księżyc znika z nieba. Koty się boją." },
  { art: "🗼", en: "You find a tower. It is very, very tall. At the top there is a silver light.", pl: "Znajdujesz wieżę. Jest bardzo, bardzo wysoka. Na szczycie jest srebrne światło." },
  { art: "📜", en: "A monster drops a note: “The Night King has the Moon.” Who is the Night King?", pl: "Potwór upuszcza liścik: „Król Nocy ma Księżyc”. Kim jest Król Nocy?" },
  { art: "📚", en: "The attic smells of old books. Something is writing on the wall… in English!", pl: "Strych pachnie starymi książkami. Coś pisze na ścianie… po angielsku!" },
  { art: "🔑", en: "The wall says: “Words are keys.” Every word you learn opens a door.", pl: "Na ścianie jest napisane: „Słowa są kluczami”. Każde słowo, którego się uczysz, otwiera drzwi." },
  { art: "👻", en: "In the Candy Forest, a tiny ghost is crying. “The King stole my voice!”", pl: "W Cukierkowym Lesie płacze mały duszek. „Król ukradł mój głos!”" },
  { art: "👋", en: "You give the ghost a word: “hello”. The ghost smiles. Now it can talk!", pl: "Dajesz duszkowi słowo: „hello”. Duszek się uśmiecha. Teraz może mówić!" },
  { art: "🤫", en: "The ghost whispers: “The King hates new words. They make him weak.”", pl: "Duszek szepcze: „Król nienawidzi nowych słów. Osłabiają go.”" },
  { art: "🐸", en: "The swamp is green and stinky. A frog wearing a crown jumps out. Is it the King? No!", pl: "Bagno jest zielone i śmierdzące. Wyskakuje żaba w koronie. To Król? Nie!" },
  { art: "🤴", en: "The frog is a prince. “I can't remember my words,” he says. “Something grey eats them. Bzzt!”", pl: "Żaba to książę. „Nie pamiętam swoich słów” — mówi. „Coś szarego je zjada. Bzzt!”" },
  // 2. Sentence Magic (11–20)
  { art: "🌑", en: "Old, forgotten words turn into shadows. That is why the Shadow Cellar is so dark…", pl: "Stare, zapomniane słowa zamieniają się w cienie. Dlatego Piwnica Cieni jest taka ciemna…" },
  { art: "🌋", en: "Lava everywhere! You see a piece of the Moon. It is warm and it glows.", pl: "Wszędzie lawa! Widzisz kawałek Księżyca. Jest ciepły i świeci." },
  { art: "🌙", en: "The Moon piece talks: “Find all my pieces. Then I can go home.”", pl: "Kawałek Księżyca mówi: „Znajdź wszystkie moje kawałki. Wtedy wrócę do domu.”" },
  { art: "❄️", en: "Snow falls up, not down. In the Frozen Tower, everything is upside down.", pl: "Śnieg pada do góry, nie w dół. W Zamarzniętej Wieży wszystko jest do góry nogami." },
  { art: "🗺️", en: "A snowman gives you a map. On the map there is a crown… and your name!", pl: "Bałwan daje ci mapę. Na mapie jest korona… i twoje imię!" },
  { art: "☁️", en: "In the Dream Clouds you meet a cat. It looks like you. “I am you from the future,” it says.", pl: "W Chmurach Snów spotykasz kota. Wygląda jak ty. „Jestem tobą z przyszłości” — mówi." },
  { art: "🐱", en: "Future You says: “Keep climbing. And one more thing… watch out for the Glitch.” Then it is gone.", pl: "Ty z przyszłości mówi: „Wspinaj się dalej. I jeszcze jedno… uważaj na Glitcha.” I znika." },
  { art: "🤖", en: "Star Station! Robots everywhere. One robot has got the biggest Moon piece.", pl: "Stacja Gwiazd! Wszędzie roboty. Jeden robot ma największy kawałek Księżyca." },
  { art: "🤖", en: "The robot says: “Beep. Hungry is robot the.” You fix it: “The robot is hungry.” “Correct,” it beeps. “Still hungry.”", pl: "Robot mówi: „Bip. Głodny jest robot ten.” Naprawiasz: „The robot is hungry.” „Poprawnie” — piszczy robot. „Dalej głodny.”" },
  { art: "🍕", en: "You say: “The robot has got a pizza.” PLOP! A pizza falls from the sky! Your sentences come true! Then a big voice shouts: “WHO is using MY magic?”", pl: "Mówisz: „The robot has got a pizza.” PLUM! Z nieba spada pizza! Twoje zdania się spełniają! Wtedy wielki głos woła: „KTO używa MOJEJ magii?”" },
  // 3. The Night King (21–30)
  { art: "🌌", en: "The top of the tower. It is dark and cold. A tall shadow sits on a throne. Its eyes are two little moons.", pl: "Szczyt wieży. Jest ciemno i zimno. Na tronie siedzi wysoki cień. Jego oczy to dwa małe księżyce." },
  { art: "🤴", en: "“I am the Night King,” says the shadow. “Every night I write the sky. Good sentences are my stars.”", pl: "„Jestem Królem Nocy” — mówi cień. „Każdej nocy piszę niebo. Dobre zdania to moje gwiazdy.”" },
  { art: "📜", en: "You show him the note: “The Night King has the Moon.” The King laughs: “Ho-ho-HIC! That is not my note. Look, the letters flicker!”", pl: "Pokazujesz mu liścik: „Król Nocy ma Księżyc”. Król się śmieje: „Ho-ho-HIK! To nie mój liścik. Spójrz, litery migoczą!”" },
  { art: "👻", en: "The ghost is here too. “But you have got my voice!” “No,” says the King. “Something grey takes voices. Something grey writes notes.”", pl: "Duszek też tu jest. „Ale ty masz mój głos!” „Nie” — mówi Król. „Coś szarego zabiera głosy. Coś szarego pisze liściki.”" },
  { art: "🌕", en: "You put the pieces together and say: “The Moon is in the sky.” WHOOSH! The Moon is back! The King gives you a Moon clip. But… where are the stars?", pl: "Składasz kawałki i mówisz: „The Moon is in the sky.” SZUUU! Księżyc wrócił! Król daje ci spinkę z Księżycem. Ale… gdzie są gwiazdy?" },
  { art: "🛏️", en: "You find a tiny light under your bed. It is a star! It says: “Hello. Me is star. Me is lost.”", pl: "Znajdujesz pod łóżkiem małe światełko. To gwiazda! Mówi: „Cześć. Mnie jest gwiazda. Mnie jest zgubiona.”" },
  { art: "⭐", en: "You help it: “I am a star. I am lost.” Ding! Now it can talk. And it can fly! WHOOSH — look up, it is in the sky!", pl: "Pomagasz jej: „I am a star. I am lost.” Dzyń! Teraz umie mówić. I umie latać! SZUUU — spójrz w górę, jest na niebie!" },
  { art: "🤴", en: "The King is so happy. “Every broken sentence is a lost star. Fix them, and my sky comes back!”", pl: "Król bardzo się cieszy. „Każde zepsute zdanie to zgubiona gwiazda. Napraw je, a moje niebo wróci!”" },
  { art: "🐠", en: "In the fish tank there are little stars. A goldfish sings to them: “Blub, blub. Fish are happy is.” Hmm…", pl: "W akwarium są małe gwiazdki. Złota rybka im śpiewa: „Blub, blub. Ryba są szczęśliwa jest.” Hmm…" },
  { art: "🐟", en: "You sing too: “The fish is happy.” The stars fly up and make a big fish. It swims across the sky! But one of its stars… flickers. Bzzt.", pl: "Ty też śpiewasz: „The fish is happy.” Gwiazdy lecą w górę i tworzą wielką rybę. Płynie przez niebo! Ale jedna z jej gwiazd… migocze. Bzzt." },
  // 4. The Glitch (31–40)
  { art: "📺", en: "Bzzt! Grey pixels eat the fish star. The star sings: “Blub… bzzt… blub.” What is that?", pl: "Bzzt! Szare piksele zjadają rybią gwiazdę. Gwiazda śpiewa: „Blub… bzzt… blub.” Co to jest?" },
  { art: "🐭", en: "In the kitchen you meet Pip, a mouse with big glasses. She has got a hundred gadgets. “That is a glitch!” she says.", pl: "W kuchni spotykasz Pip, mysz w dużych okularach. Ma sto gadżetów. „To glitch!” — mówi." },
  { art: "👾", en: "Pip points at the tower. “Glitch monsters! They break sentences. Listen…” A grey monster says: “He like cheese.”", pl: "Pip pokazuje wieżę. „Potwory Glitcha! Psują zdania. Posłuchaj…” Szary potwór mówi: „He like cheese.”" },
  { art: "🧀", en: "You say: “He likes cheese.” ZAP! The monster stops flickering… and a big cheese falls on Pip. Look out! Glitch monsters are in your tower now!", pl: "Mówisz: „He likes cheese.” ZAP! Potwór przestaje migotać… a na Pip spada wielki ser. Uwaga! Potwory Glitcha są teraz w twojej wieży!" },
  { art: "🐭", en: "Pip gives you mouse ears. “For luck!” You say: “A mouse can dance.” The stars make a mouse. It dances in the sky!", pl: "Pip daje ci mysie uszy. „Na szczęście!” Mówisz: „A mouse can dance.” Gwiazdy tworzą mysz. Tańczy na niebie!" },
  { art: "🐦", en: "On the roof lives Skye, the fastest bird in town. “I can see it!” she says. “A big grey cloud. It eats stars. GULP!”", pl: "Na dachu mieszka Skye, najszybszy ptak w mieście. „Widzę to!” — mówi. „Wielka szara chmura. Zjada gwiazdy. HAM!”" },
  { art: "🌦️", en: "“How can we get up there?” you ask. Pip has got a plan: “Sun plus rain makes a bridge. Say the colours!”", pl: "„Jak się tam dostaniemy?” — pytasz. Pip ma plan: „Słońce plus deszcz robi most. Powiedz kolory!”" },
  { art: "🌈", en: "“Red, orange, yellow, green, blue, purple!” A rainbow bridge goes up. “Hurry!” says Pip. “A rainbow is shy. It never stays long.”", pl: "„Red, orange, yellow, green, blue, purple!” W górę wyrasta tęczowy most. „Szybko!” — mówi Pip. „Tęcza jest nieśmiała. Nigdy nie zostaje długo.”" },
  { art: "☁️", en: "On the clouds there is a nest with three stars. Skye takes them. “Easy!” she says. Then she sees the grey cloud. “Not easy.”", pl: "Na chmurach jest gniazdo z trzema gwiazdami. Skye je zabiera. „Łatwizna!” — mówi. Potem widzi szarą chmurę. „Nie łatwizna.”" },
  { art: "🐦", en: "You say: “Birds can fly.” The stars make a bird. Skye gives you a feather. Then the grey cloud opens one big eye. It looks at you…", pl: "Mówisz: „Birds can fly.” Gwiazdy tworzą ptaka. Skye daje ci piórko. Wtedy szara chmura otwiera jedno wielkie oko. Patrzy na ciebie…" },
  // 5. The Flying Ship (41–50)
  { art: "👑", en: "The King is angry. “Nobody eats MY stars! We need a ship. A ship that can fly!”", pl: "Król jest zły. „Nikt nie zjada MOICH gwiazd! Potrzebny nam statek. Statek, który umie latać!”" },
  { art: "🔨", en: "Pip builds. The robots build. You build too. Bang, bang! The robot eats a nail. “Beep. Sorry.”", pl: "Pip buduje. Roboty budują. Ty też budujesz. Bum, bum! Robot zjada gwóźdź. „Bip. Przepraszam.”" },
  { art: "🚪", en: "The ship needs a sail. In the Shadow Cellar you find a paper boat. There is a star inside!", pl: "Statek potrzebuje żagla. W Piwnicy Cieni znajdujesz papierową łódkę. W środku jest gwiazda!" },
  { art: "👋", en: "The shadows in the cellar wave at you. “We are old words. Please don't forget us!” You wave back.", pl: "Cienie w piwnicy do ciebie machają. „Jesteśmy starymi słowami. Nie zapominaj o nas!” Machasz do nich." },
  { art: "🚢", en: "The paper boat is the sail. You say: “The ship can fly.” And it CAN! A boat shines in the stars, and the King's ship flies. Every day it drops a gift!", pl: "Papierowa łódka to żagiel. Mówisz: „The ship can fly.” I UMIE! W gwiazdach świeci łódka, a statek Króla lata. Codziennie zrzuca prezent!" },
  { art: "🗺️", en: "The ship flies high. The King looks at the map. “The Glitch is huge! It glitches clouds, birds… even sentences.”", pl: "Statek leci wysoko. Król patrzy na mapę. „Glitch jest ogromny! Psuje chmury, ptaki… nawet zdania.”" },
  { art: "🎈", en: "A balloon comes! A cat with a big bag waves. “I am Mailcat! I have got a letter for… um… you? Yes, you!”", pl: "Przylatuje balon! Kot z wielką torbą macha. „Jestem Kot Listonosz! Mam list dla… yyy… ciebie? Tak, dla ciebie!”" },
  { art: "✉️", en: "The letter is grey. It says: “Why nobody understand me?” Who writes letters like this? And why is the sentence broken?", pl: "List jest szary. Jest w nim: „Why nobody understand me?” Kto pisze takie listy? I czemu zdanie jest zepsute?" },
  { art: "🗝️", en: "Mailcat says: “The Glitch has got the Key Star. Without it, the night can't open.” “What does that mean?” “No idea. I only carry letters.”", pl: "Kot Listonosz mówi: „Glitch ma Gwiazdę-Klucz. Bez niej noc nie może się otworzyć.” „Co to znaczy?” „Nie mam pojęcia. Ja tylko noszę listy.”" },
  { art: "🔑", en: "You fly into the grey cloud: “The key is free!” ZAP! A key shines in the stars. You come out grey — a shadow cat! The Glitch roars: “YOU IS IN TROUBLE!”", pl: "Wlatujesz w szarą chmurę: „The key is free!” ZAP! W gwiazdach świeci klucz. Wylatujesz jako szary kot-cień! Glitch ryczy: „TY JEST W KŁOPOTACH!”" },
  // 6. The Storm (51–60)
  { art: "📚", en: "The ship stops at a library in the clouds. It is very quiet. Somebody says: “Shhh!”", pl: "Statek zatrzymuje się przy bibliotece w chmurach. Jest bardzo cicho. Ktoś mówi: „Ćśś!”" },
  { art: "🦉", en: "It is an old owl. “I keep all the stories of the world,” she says. “But the Glitch scrambles them.”", pl: "To stara sowa. „Pilnuję wszystkich historii świata” — mówi. „Ale Glitch je miesza.”" },
  { art: "📖", en: "She opens a book. It says: “dragon a is There.” You fix it: “There is a dragon.” POP! A tiny dragon jumps out of the book. Oops!", pl: "Otwiera książkę. Jest w niej: „dragon a is There.” Naprawiasz: „There is a dragon.” PYK! Z książki wyskakuje malutki smok. Ups!" },
  { art: "🐉", en: "The tiny dragon sneezes. ACHOO! Sparks everywhere! “Shhh!” says the owl. “Be careful. Your sentences are strong magic.”", pl: "Malutki smok kicha. APSIK! Wszędzie iskry! „Ćśś!” — mówi sowa. „Uważaj. Twoje zdania to silna magia.”" },
  { art: "🦉", en: "You say: “Owls can see in the dark.” The stars make an owl. The owl gives you a night cap. “Sleep well. Tomorrow is a big day.”", pl: "Mówisz: „Owls can see in the dark.” Gwiazdy tworzą sowę. Sowa daje ci szlafmycę. „Śpij dobrze. Jutro wielki dzień.”" },
  { art: "⛈️", en: "A storm! The ship shakes. Grey pixel hands come out of the cloud. They want the stars!", pl: "Burza! Statek się trzęsie. Z chmury wychodzą szare pikselowe ręce. Chcą gwiazd!" },
  { art: "🪁", en: "Skye has an idea. She ties a star to a kite. “Follow the light, not the Glitch!”", pl: "Skye ma pomysł. Przywiązuje gwiazdę do latawca. „Leć za światłem, nie za Glitchem!”" },
  { art: "💪", en: "The King stands at the front of the ship. “Go away, Glitch! I am the King of the Night!” The Glitch answers: “ME IS KING NOW.”", pl: "Król stoi na dziobie statku. „Odejdź, Glitchu! Jestem Królem Nocy!” Glitch odpowiada: „MNIE JEST TERAZ KRÓL.”" },
  { art: "😱", en: "“Wrong!” shouts the King. “It is ‘I AM the King’!” The Glitch is very angry now. It opens like a big mouth…", pl: "„Źle!” — woła Król. „Mówi się ‘I AM the King’!” Glitch jest teraz bardzo zły. Otwiera się jak wielka paszcza…" },
  { art: "🌫️", en: "…and takes the King! Only his crown falls on the ship. A kite shines in the stars, but nobody smiles.", pl: "…i zabiera Króla! Na statek spada tylko jego korona. W gwiazdach świeci latawiec, ale nikt się nie uśmiecha." },
  // 7. The King's Light (61–70)
  { art: "👑", en: "You hold the crown. It is still warm. “The King is OK,” says Pip. “Warm crown, happy King. That is science.”", pl: "Trzymasz koronę. Jest jeszcze ciepła. „Król jest cały” — mówi Pip. „Ciepła korona, szczęśliwy Król. To nauka.”" },
  { art: "🔔", en: "The owl says: “A bell can send a message. Ring it, and the King can hear you.”", pl: "Sowa mówi: „Dzwon może wysłać wiadomość. Zadzwoń, a Król cię usłyszy.”" },
  { art: "🌌", en: "You ring the bell. DING! The sky turns green and pink. It is the King's light! He is inside the Glitch.", pl: "Dzwonisz. DZYŃ! Niebo robi się zielone i różowe. To światło Króla! Jest w środku Glitcha." },
  { art: "📡", en: "The lights make words: “I… IS… OK.” You smile. “It is ‘I AM OK’, Your Majesty!” The lights blink: “HO-HO-HIC!”", pl: "Światła układają słowa: „I… IS… OK.” Uśmiechasz się. „Mówi się ‘I AM OK’, Wasza Wysokość!” Światła mrugają: „HO-HO-HIK!”" },
  { art: "🔔", en: "You say: “Bells can sing.” DING-DONG! The stars make a bell. Then the lights send one more word: “HELP.”", pl: "Mówisz: „Bells can sing.” DZYŃ-DOŃ! Gwiazdy tworzą dzwon. Potem światła wysyłają jeszcze jedno słowo: „HELP.”" },
  { art: "🌳", en: "In the clouds there is a tree. Its leaves are sentences. But the leaves are falling.", pl: "W chmurach rośnie drzewo. Jego liście to zdania. Ale liście spadają." },
  { art: "🍂", en: "Every leaf goes grey and flies into the Glitch. One leaf says: “Tree are tall.” Another says: “Me can't fly.”", pl: "Każdy liść szarzeje i leci do Glitcha. Jeden liść mówi: „Tree are tall.” Inny mówi: „Me can't fly.”" },
  { art: "💡", en: "“The Glitch eats broken sentences!” you say. “That is why it is so big!” Pip drops her glasses. “No way!”", pl: "„Glitch zjada zepsute zdania!” — mówisz. „Dlatego jest taki wielki!” Pip upuszcza okulary. „Nie może być!”" },
  { art: "🍃", en: "You fix the leaves: “Trees are tall.” “I can't fly.” They stop falling. They glow again. The Glitch looks hungry.", pl: "Naprawiasz liście: „Trees are tall.” „I can't fly.” Przestają spadać. Znowu świecą. Glitch wygląda na głodnego." },
  { art: "🐋", en: "You say: “The tree is big.” The stars make a tree. Then something huge comes out of the clouds. A whale! “I can take you inside the Glitch,” he says.", pl: "Mówisz: „The tree is big.” Gwiazdy tworzą drzewo. Wtedy z chmur wyłania się coś ogromnego. Wieloryb! „Mogę zabrać cię do środka Glitcha” — mówi." },
  // 8. Inside the Glitch (71–85)
  { art: "🐋", en: "The Cloud Whale is very old. He speaks slowly. “Inside the Glitch… sentences break. Be careful what you say.”", pl: "Chmurowy Wieloryb jest bardzo stary. Mówi powoli. „W środku Glitcha… zdania się psują. Uważaj, co mówisz.”" },
  { art: "😶", en: "“How can we find the King in there?” asks Skye. Nobody knows. The robot stops eating. That is serious.", pl: "„Jak znajdziemy tam Króla?” — pyta Skye. Nikt nie wie. Robot przestaje jeść. To poważna sprawa." },
  { art: "👻", en: "Then a little voice says: “I know.” It is the ghost from the Candy Forest!", pl: "Wtedy cichutki głos mówi: „Ja wiem.” To duszek z Cukierkowego Lasu!" },
  { art: "🤫", en: "“The Glitch has got my old voice,” says the ghost. “I can hear it in there. Follow me!”", pl: "„Glitch ma mój stary głos” — mówi duszek. „Słyszę go tam w środku. Za mną!”" },
  { art: "👻", en: "You say: “Ghosts can glow.” The stars make a ghost. You jump into the whale. The whale swims into the Glitch. Everything is dark…", pl: "Mówisz: „Ghosts can glow.” Gwiazdy tworzą duszka. Wskakujesz do wieloryba. Wieloryb wpływa w Glitcha. Wszędzie ciemno…" },
  { art: "🌑", en: "Inside the Glitch it is cold. Everything flickers. Even your paws flicker! Bzzt.", pl: "W środku Glitcha jest zimno. Wszystko migocze. Nawet twoje łapki migoczą! Bzzt." },
  { art: "🐸", en: "A green light jumps in the dark. Ribbit! It is the frog prince. “Frogs can see in the dark. Follow me!”", pl: "W ciemności skacze zielone światełko. Kum! To żabi książę. „Żaby widzą w ciemności. Za mną!”" },
  { art: "☄️", en: "Suddenly, little lights fall all around you. They are broken sentences! They fall like rain.", pl: "Nagle wokół ciebie spadają małe światełka. To zepsute zdania! Spadają jak deszcz." },
  { art: "🤲", en: "You catch one: “The frog are green.” Easy! “The frog is green.” It glows in your paw.", pl: "Łapiesz jedno: „The frog are green.” Łatwe! „The frog is green.” Świeci w twojej łapce." },
  { art: "🐸", en: "You catch more and more. Every sentence you fix is a star. The stars make a frog with a crown. “Ribbit-tastic!” says the prince.", pl: "Łapiesz coraz więcej. Każde naprawione zdanie to gwiazda. Gwiazdy tworzą żabę w koronie. „Kumfantastycznie!” — mówi książę." },
  { art: "🤖", en: "Beep! The robot from Star Station is here too. “Sentence lamp. Ready. Also: snack?”", pl: "Bip! Robot ze Stacji Gwiazd też tu jest. „Lampa zdań. Gotowa. Poza tym: przekąska?”" },
  { art: "🏮", en: "You put your fixed sentences in the lamp. It shines bright. Now you can see a path.", pl: "Wkładasz naprawione zdania do lampy. Świeci jasno. Teraz widać ścieżkę." },
  { art: "👣", en: "The path goes down, down, down. You can hear something. Somebody is crying.", pl: "Ścieżka prowadzi w dół, w dół, w dół. Coś słychać. Ktoś płacze." },
  { art: "👑", en: "It is the King! He sits in the dark. “I am sorry,” he says. “I always shout at the Glitch. It makes it angry.”", pl: "To Król! Siedzi w ciemności. „Przepraszam” — mówi. „Ciągle krzyczę na Glitcha. To go złości.”" },
  { art: "🤖", en: "You give him his crown. You say: “The robot is a hero.” The stars make a robot! But the King whispers: “Shh. Look behind you.”", pl: "Oddajesz mu koronę. Mówisz: „The robot is a hero.” Gwiazdy tworzą robota! Ale Król szepcze: „Ćśś. Spójrz za siebie.”" },
  // 9. The Full Sky (86–100)
  { art: "💔", en: "Behind you is the heart of the Glitch. It is not a monster. It is a tiny grey sentence, all alone.", pl: "Za tobą jest serce Glitcha. To nie potwór. To malutkie szare zdanie, całkiem samo." },
  { art: "🥺", en: "The tiny sentence says: “Nobody understand me.” Now you know who writes the grey letters!", pl: "Malutkie zdanie mówi: „Nobody understand me.” Teraz wiesz, kto pisze szare listy!" },
  { art: "📜", en: "“And the note about the King? That is me too,” it says. “Nobody listens to broken sentences. So I break ALL the sentences.”", pl: "„A liścik o Królu? To też ja” — mówi. „Nikt nie słucha zepsutych zdań. Więc psuję WSZYSTKIE zdania.”" },
  { art: "🤔", en: "You think and think. Then you smile. “You are not bad. You just need some help.”", pl: "Myślisz i myślisz. Potem się uśmiechasz. „Nie jesteś złe. Potrzebujesz tylko trochę pomocy.”" },
  { art: "🏠", en: "You help it: “Nobody understands me.” Then you add: “But I do. We are friends.” A house shines in the stars, and a comet shows the way home.", pl: "Pomagasz mu: „Nobody understands me.” Potem dodajesz: „But I do. We are friends.” W gwiazdach świeci domek, a kometa pokazuje drogę do domu." },
  { art: "🐋", en: "The whale swims out. The Glitch is smaller now. But there are so many broken sentences left!", pl: "Wieloryb wypływa. Glitch jest teraz mniejszy. Ale zostało jeszcze mnóstwo zepsutych zdań!" },
  { art: "🧭", en: "“I can't fix them all alone,” you say. Pip smiles. “You are not alone.”", pl: "„Nie naprawię ich wszystkich w pojedynkę” — mówisz. Pip się uśmiecha. „Nie musisz tego robić w pojedynkę.”" },
  { art: "🤝", en: "Everybody comes: Pip, Skye, the owl, the ghost, the frog, the robot, the tiny dragon, Mailcat and the King.", pl: "Przychodzą wszyscy: Pip, Skye, sowa, duszek, żaba, robot, malutki smok, Kot Listonosz i Król." },
  { art: "📣", en: "Everybody fixes sentences. “Teamwork!” shouts the King. The dragon sneezes. ACHOO! The Glitch gets smaller and smaller.", pl: "Wszyscy naprawiają zdania. „Drużyna!” — woła Król. Smok kicha. APSIK! Glitch robi się coraz mniejszy." },
  { art: "🐱", en: "You say: “The cat is a hero.” The last stars fly up and make a cat. It is you! “You are the Sentence Hero now,” says the owl.", pl: "Mówisz: „The cat is a hero.” Ostatnie gwiazdy lecą w górę i tworzą kota. To ty! „Teraz to ty strzeżesz zdań” — mówi sowa." },
  { art: "☁️", en: "One more thing. You go to the Dream Clouds. There is a little cat there. It looks like you… a younger you!", pl: "Jeszcze jedno. Idziesz do Chmur Snów. Jest tam mały kot. Wygląda jak ty… to ty sprzed wielu dni!" },
  { art: "🐱", en: "Now you understand. YOU are Future You! You wink and say: “Keep climbing. And watch out for the Glitch.”", pl: "Teraz rozumiesz. To TY jesteś „tobą z przyszłości”! Mrugasz i mówisz: „Wspinaj się dalej. I uważaj na Glitcha.”" },
  { art: "🌟", en: "Back at the tower, the tiny grey sentence is waiting. You say a good sentence. And another. It gets brighter… and BRIGHTER!", pl: "Pod wieżą czeka malutkie szare zdanie. Mówisz dobre zdanie. I kolejne. Robi się jaśniejsze… i JAŚNIEJSZE!" },
  { art: "💫", en: "The Glitch is a star now! A big, new star. It says, perfectly: “Thank you. I am happy now. My name is Bit.”", pl: "Glitch jest teraz gwiazdą! Wielką, nową gwiazdą. Mówi bez jednego błędu: „Dziękuję. Teraz jestem szczęśliwy. Mam na imię Bit.”" },
  { art: "🎆", en: "The sky is full! The King has a party with the ship, the whale, Mailcat and fireworks. Bit shines at the top. GG! The End.", pl: "Niebo jest pełne! Król robi imprezę ze statkiem, wielorybem, Kotem Listonoszem i fajerwerkami. Na górze świeci Bit. GG! Koniec." },
];

// --- NIEBO (strony 26–95): 14 gwiazdozbiorów, każdy = 5 stron. Gwiazdozbiór rodzi się z ZDANIA (say), które kot mówi w fabule
// na ostatniej stronie. pts = 7–8 gwiazd w polu ≤ 32x24 px (kolejność zapalania; pierwsza = jasna „głowa”), lines = kreski po ukończeniu.
// Gwiazdy zapalają się porcjami: strona k z 5 → round(n·k/5) gwiazd. Wszystko wyliczane z save.story (bez pól w zapisie).
export const SKY_FIRST_PAGE = 26, MOON_PAGES = 25, SKY_PAGES = 5;
export const SKY = [
  { name: "FISH", say: "The fish is happy.", pts: [[0, 9], [9, 3], [18, 4], [24, 9], [18, 14], [9, 15], [31, 3], [31, 15]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [3, 6], [6, 7], [7, 3]] },
  { name: "MOUSE", say: "A mouse can dance.", pts: [[0, 13], [5, 4], [10, 2], [17, 7], [22, 13], [10, 16], [27, 17], [32, 10]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [4, 6], [6, 7]] },
  { name: "BIRD", say: "Birds can fly.", pts: [[15, 12], [0, 2], [7, 8], [22, 8], [29, 2], [15, 7], [15, 19]], lines: [[1, 2], [2, 0], [0, 3], [3, 4], [5, 0], [0, 6]] },
  { name: "BOAT", say: "The ship can fly.", pts: [[14, 0], [0, 13], [28, 13], [23, 19], [5, 19], [14, 11], [5, 10]], lines: [[1, 2], [2, 3], [3, 4], [4, 1], [0, 5], [0, 6], [6, 5]] },
  { name: "KEY", say: "The key is free.", pts: [[5, 0], [0, 5], [5, 10], [10, 5], [22, 5], [31, 5], [31, 10], [22, 9]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [3, 4], [4, 5], [5, 6], [4, 7]] },
  { name: "OWL", say: "Owls can see in the dark.", pts: [[7, 7], [2, 0], [20, 0], [15, 7], [11, 11], [4, 21], [18, 21]], lines: [[1, 0], [0, 4], [4, 3], [3, 2], [0, 5], [5, 6], [6, 3]] },
  { name: "KITE", say: "Follow the light!", pts: [[10, 0], [19, 8], [10, 17], [1, 8], [13, 20], [18, 22], [22, 20]], lines: [[0, 1], [1, 2], [2, 3], [3, 0], [2, 4], [4, 5], [5, 6]] },
  { name: "BELL", say: "Bells can sing.", pts: [[10, 0], [5, 5], [15, 5], [3, 13], [17, 13], [0, 18], [20, 18], [10, 22]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6]] },
  { name: "TREE", say: "The tree is big.", pts: [[12, 0], [6, 6], [18, 6], [2, 13], [22, 13], [12, 13], [12, 22]], lines: [[0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [5, 4], [5, 6]] },
  { name: "GHOST", say: "Ghosts can glow.", pts: [[10, 0], [3, 6], [17, 6], [1, 19], [7, 16], [13, 19], [19, 16]], lines: [[0, 1], [0, 2], [1, 3], [2, 6], [3, 4], [4, 5], [5, 6]] },
  { name: "FROG", say: "The frog is green.", pts: [[10, 0], [5, 4], [15, 4], [1, 9], [19, 9], [3, 17], [17, 17], [10, 19]], lines: [[1, 0], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 7], [7, 6]] },
  { name: "ROBOT", say: "The robot is a hero.", pts: [[10, 0], [5, 3], [15, 3], [15, 10], [5, 10], [2, 13], [18, 13], [18, 23], [2, 23]], lines: [[0, 1], [0, 2], [1, 2], [2, 3], [3, 4], [4, 1], [5, 6], [6, 7], [7, 8], [8, 5]] },
  { name: "HOUSE", say: "We are friends.", pts: [[11, 0], [1, 9], [21, 9], [3, 21], [19, 21], [17, 3], [11, 15]], lines: [[0, 1], [0, 2], [1, 2], [1, 3], [3, 4], [4, 2]] },
  { name: "CAT", say: "The cat is a hero.", pts: [[7, 9], [3, 0], [11, 0], [1, 6], [13, 6], [2, 21], [16, 21], [26, 12]], lines: [[3, 1], [1, 2], [2, 4], [3, 0], [0, 4], [3, 5], [5, 6], [6, 4], [6, 7]] },
];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// ile stron gwiazdozbioru i (0–5) przeczytane przy danej liczbie stron
export const skyPagesDone = (story, i) => clamp((story || 0) - SKY_FIRST_PAGE - i * SKY_PAGES + 1, 0, SKY_PAGES);
// ile gwiazd gwiazdozbioru i świeci
export const skyLit = (story, i) => Math.round((SKY[i].pts.length * skyPagesDone(story, i)) / SKY_PAGES);
// ukończone gwiazdozbiory (0–14) i wszystkie zapalone gwiazdy
export const skyDone = (story) => clamp(Math.floor(((story || 0) - SKY_FIRST_PAGE + 1) / SKY_PAGES), 0, SKY.length);
export const skyStars = (story) => SKY.reduce((n, _, i) => n + skyLit(story, i), 0);
export const SKY_TOTAL = SKY.reduce((n, c) => n + c.pts.length, 0);

// --- nagrody z fabuły (source: "story" w cosmetics.js): strona -> przedmiot. Wydawane w rewards.js (syncStory, idempotentne) ---
export const STORY_REWARDS = {
  25: { hat: "moonclip" }, 30: { skin: "goldfish" }, 35: { hat: "mouseears" }, 40: { hat: "feather" },
  45: { hat: "paperboat" }, 50: { skin: "shadowcat" }, 55: { hat: "nightcap" }, 60: { skin: "skycat" },
  65: { hat: "bellhat" }, 70: { skin: "startree" }, 75: { skin: "boo" }, 80: { hat: "froghat" },
  85: { hat: "antenna" }, 90: { skin: "cozy" }, 95: { skin: "starcat" }, 100: { hat: "starcrown" },
};

// rozdziały Moon Diary (zakładki): from/to = numery stron (1-based); każdy kończy się haczykiem
export const CHAPTERS = [
  { name: "The Missing Moon", from: 1, to: 10 }, { name: "Sentence Magic", from: 11, to: 20 },
  { name: "The Night King", from: 21, to: 30 }, { name: "The Glitch", from: 31, to: 40 },
  { name: "The Flying Ship", from: 41, to: 50 }, { name: "The Storm", from: 51, to: 60 },
  { name: "The King's Light", from: 61, to: 70 }, { name: "Inside the Glitch", from: 71, to: 85 },
  { name: "The Full Sky", from: 86, to: 100 },
];
