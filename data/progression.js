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
  { en: "Old, forgotten words turn into shadows. That is why the Shadow Cellar is so dark…", pl: "Stare, zapomniane słowa zamieniają się w cienie. Dlatego Piwnica Cieni jest taka ciemna…" },
  { en: "Lava everywhere! You see a piece of the Moon. It is warm and it glows.", pl: "Wszędzie lawa! Widzisz kawałek Księżyca. Jest ciepły i świeci." },
  { en: "The Moon piece talks: “Find all my pieces. Then I can go home.”", pl: "Kawałek Księżyca mówi: „Znajdź wszystkie moje kawałki. Wtedy wrócę do domu.”" },
  { en: "Snow falls up, not down. In the Frozen Tower, everything is upside down.", pl: "Śnieg pada do góry, nie w dół. W Zamarzniętej Wieży wszystko jest do góry nogami." },
  { en: "A snowman gives you a map. On the map there is a crown… and your name!", pl: "Bałwan daje ci mapę. Na mapie jest korona… i twoje imię!" },
  { en: "In the Dream Clouds you meet a cat. It looks like you. “I am you from the future,” it says.", pl: "W Chmurach Snów spotykasz kota. Wygląda jak ty. „Jestem tobą z przyszłości” — mówi." },
  { en: "Future You says: “Keep climbing. And one more thing… watch out for the Glitch.” Then it is gone.", pl: "Ty z przyszłości mówi: „Wspinaj się dalej. I jeszcze jedno… uważaj na Glitcha.” I znika." },
  { en: "Star Station! Robots everywhere. One robot has the biggest Moon piece.", pl: "Stacja Gwiazd! Wszędzie roboty. Jeden robot ma największy kawałek Księżyca." },
  { en: "The robot says: “Beep. Hungry is robot the.” Its sentence is broken! You fix it: “The robot is hungry.”", pl: "Robot mówi: „Bip. Głodny jest robot ten.” Jego zdanie jest zepsute! Naprawiasz je: „The robot is hungry.”" },
  { en: "The robot gets a snack and gives you the piece. The Moon is almost complete… but the Night King is waiting. To be continued…", pl: "Robot dostaje przekąskę i daje ci kawałek. Księżyc jest prawie cały… ale czeka Król Nocy. Ciąg dalszy nastąpi…" },
  // --- rozdziały 2–6 (strony 21–100, docs/STORY-100.md) — 1 strona dziennie (rewards.js) ---
  { en: "The top of the tower. It is cold and dark. A big shadow sits on a throne.", pl: "Szczyt wieży. Jest zimno i ciemno. Na tronie siedzi wielki cień." },
  { en: "“I am the Night King,” says the shadow. His voice is sad, not angry.", pl: "„Jestem Królem Nocy” — mówi cień. Jego głos jest smutny, nie zły." },
  { en: "“I took the Moon because I was alone. My sky has no stars. It is so dark.”", pl: "„Zabrałem Księżyc, bo byłem sam. Moje niebo nie ma gwiazd. Jest tak ciemno.”" },
  { en: "You say: “Let's be friends. Friends share the Moon.” The King smiles. Then he laughs. What a funny laugh!", pl: "Mówisz: „Bądźmy przyjaciółmi. Przyjaciele dzielą się Księżycem.” Król się uśmiecha. Potem się śmieje. Ale śmieszny śmiech!" },
  { en: "The last piece clicks in. The Moon is back! The King gives you a key: “A little house on the Moon. It is yours!”", pl: "Ostatni kawałek wskakuje na miejsce. Księżyc wrócił! Król daje ci klucz: „Mały domek na Księżycu. Jest twój!”" },
  { en: "But wait… where are the stars? The King looks down. “They fell into the tower. They are small and shy.”", pl: "Ale chwila… gdzie są gwiazdy? Król patrzy w dół. „Spadły do wieży. Są małe i nieśmiałe.”" },
  { en: "You find a tiny light under a bed. It is a star! “Hi! Can I go home?”", pl: "Znajdujesz małe światełko pod łóżkiem. To gwiazda! „Cześć! Mogę wrócić do domu?”" },
  { en: "You throw the star up. Whoosh! It flies into the sky and shines.", pl: "Podrzucasz gwiazdę. Szuuu! Leci w niebo i świeci." },
  { en: "A star is in a fish bowl. A little fish sings to it. So cute!", pl: "Gwiazda jest w akwarium. Mała rybka jej śpiewa. Słodkie!" },
  { en: "Five stars in the sky. Look! They make a fish!", pl: "Pięć gwiazd na niebie. Spójrz! Tworzą rybę!" },
  { en: "Bzzt! The fish star flickers. Grey pixels eat its light. “Who did this?” you ask.", pl: "Bzzt! Rybia gwiazda migocze. Szare piksele zjadają jej światło. „Kto to zrobił?” — pytasz." },
  { en: "In the kitchen you meet Pip, a mouse with big glasses. She makes gadgets. “That is a glitch,” she says.", pl: "W kuchni spotykasz Pip, mysz w dużych okularach. Robi gadżety. „To glitch” — mówi." },
  { en: "Pip points at the tower. “Glitch monsters! They break sentences. Listen…” A monster says: “He like cheese.”", pl: "Pip pokazuje wieżę. „Potwory Glitcha! Psują zdania. Posłuchaj…” Potwór mówi: „He like cheese.”" },
  { en: "You say: “He likes cheese.” Zap! The monster stops flickering. Pip claps. “Good sentences fix glitches!”", pl: "Mówisz: „He likes cheese.” Zap! Potwór przestaje migotać. Pip klaszcze. „Dobre zdania naprawiają glitche!”" },
  { en: "Pip gives you a star. Now a mouse shines in the sky. Pip whispers: “The stars did not fall. Something took them.”", pl: "Pip daje ci gwiazdę. Teraz na niebie świeci mysz. Pip szepcze: „Gwiazdy nie spadły. Coś je zabrało.”" },
  { en: "On the roof lives Skye, the fastest bird in town. “I saw it!” she says. “A big grey cloud. It buzzes and eats light.”", pl: "Na dachu mieszka Skye, najszybszy ptak w mieście. „Widziałam to!” — mówi. „Wielka szara chmura. Bzyczy i zjada światło.”" },
  { en: "Pip has a plan: “Light can make a bridge. Tell me the colours of the rainbow!”", pl: "Pip ma plan: „Światło może zrobić most. Powiedz mi kolory tęczy!”" },
  { en: "“Red, orange, yellow, green, blue, purple!” A rainbow bridge goes up to the clouds. Let's go!", pl: "„Red, orange, yellow, green, blue, purple!” Tęczowy most prowadzi do chmur. Ruszamy!" },
  { en: "On the clouds there is a nest with three stars. Skye takes them home. “Easy!” she says.", pl: "Na chmurach jest gniazdo z trzema gwiazdami. Skye zabiera je do domu. „Łatwizna!” — mówi." },
  { en: "A bird shines in the sky. But far away, a grey cloud buzzes: bzzzt. The Glitch is real.", pl: "Na niebie świeci ptak. Ale daleko szara chmura bzyczy: bzzzt. Glitch istnieje naprawdę." },
  { en: "The King is angry. “Nobody takes MY stars! I will build a ship. A ship that flies!”", pl: "Król jest zły. „Nikt nie zabiera MOICH gwiazd! Zbuduję statek. Statek, który lata!”" },
  { en: "Pip builds. The robots build. You build too. Bang, bang! Every day the ship is bigger.", pl: "Pip buduje. Roboty budują. Ty też budujesz. Bum, bum! Każdego dnia statek jest większy." },
  { en: "The ship needs a sail. You find a paper boat with a star inside. It is the last part!", pl: "Statek potrzebuje żagla. Znajdujesz papierową łódkę z gwiazdą w środku. To ostatnia część!" },
  { en: "The paper boat came from the Shadow Cellar. The shadows wave at you. “Don't forget us!”", pl: "Papierowa łódka przypłynęła z Piwnicy Cieni. Cienie do ciebie machają. „Nie zapomnij o nas!”" },
  { en: "A boat shines in the sky. And the King's ship flies! It drops a gift every day. “Next stop: the Glitch!”", pl: "Na niebie świeci łódka. A statek Króla lata! Codziennie zrzuca prezent. „Następny przystanek: Glitch!”" },
  { en: "The ship flies high. The King looks at the map. The Glitch is huge. It glitches clouds, birds… even sentences.", pl: "Statek leci wysoko. Król patrzy na mapę. Glitch jest ogromny. Psuje chmury, ptaki… nawet zdania." },
  { en: "A balloon comes! A cat with a big bag waves. “I am Mailcat. I have a letter for you.”", pl: "Przylatuje balon! Kot z wielką torbą macha. „Jestem Kot Listonosz. Mam dla ciebie list.”" },
  { en: "The letter is grey. It says: “Why nobody understand me?” Who wrote it? And why is the sentence broken?", pl: "List jest szary. Jest w nim: „Why nobody understand me?” Kto to napisał? I czemu zdanie jest zepsute?" },
  { en: "Mailcat says: “The Glitch has the Key Star. Without it, the night cannot open.”", pl: "Kot Listonosz mówi: „Glitch ma Gwiazdę-Klucz. Bez niej noc nie może się otworzyć.”" },
  { en: "You fly into the Glitch. Everything says “bzzt”! You shout good, strong sentences. The Key Star is free! A key shines in the sky.", pl: "Wlatujesz w Glitcha. Wszystko robi „bzzt”! Wykrzykujesz dobre, mocne zdania. Gwiazda-Klucz jest wolna! Na niebie świeci klucz." },
  { en: "The ship stops at a library in the clouds. It is very quiet. Somebody says: “Shhh!”", pl: "Statek zatrzymuje się przy bibliotece w chmurach. Jest bardzo cicho. Ktoś mówi: „Ćśś!”" },
  { en: "It is an old owl. “I keep all the stories of the world,” she says. “But the Glitch scrambles them.”", pl: "To stara sowa. „Pilnuję wszystkich historii świata” — mówi. „Ale Glitch je miesza.”" },
  { en: "She opens a book. It says: “dragon a was There.” You fix it: “There was a dragon.” The book glows!", pl: "Otwiera książkę. Jest w niej: „dragon a was There.” Naprawiasz: „There was a dragon.” Książka świeci!" },
  { en: "“Broken sentences make the Glitch bigger,” says the owl. “Good sentences make it smaller.”", pl: "„Zepsute zdania powiększają Glitcha” — mówi sowa. „Dobre zdania go zmniejszają.”" },
  { en: "The owl gives you a star from her lamp. An owl shines in the sky. “Be careful. The Glitch is hungry.”", pl: "Sowa daje ci gwiazdę ze swojej lampy. Na niebie świeci sowa. „Uważaj. Glitch jest głodny.”" },
  { en: "A storm! The ship shakes. Grey pixel hands come out of the cloud. They want the stars!", pl: "Burza! Statek się trzęsie. Z chmury wychodzą szare pikselowe ręce. Chcą gwiazd!" },
  { en: "Skye has an idea. She ties a star to a kite. “Follow the light, not the Glitch!”", pl: "Skye ma pomysł. Przywiązuje gwiazdę do latawca. „Leć za światłem, nie za Glitchem!”" },
  { en: "The King stands at the front of the ship. “Go away, Glitch! I am the King of the Night!”", pl: "Król stoi na dziobie statku. „Odejdź, Glitchu! Jestem Królem Nocy!”" },
  { en: "But the Glitch does not go away. It opens like a big mouth…", pl: "Ale Glitch nie odchodzi. Otwiera się jak wielka paszcza…" },
  { en: "…and takes the King! Only his crown falls on the ship. A kite shines in the sky, but you are very sad.", pl: "…i zabiera Króla! Na statek spada tylko jego korona. Na niebie świeci latawiec, ale jest ci bardzo smutno." },
  { en: "You hold the crown. It is still warm. “The King is OK,” says Pip. “We can find him.”", pl: "Trzymasz koronę. Jest jeszcze ciepła. „Król jest cały” — mówi Pip. „Znajdziemy go.”" },
  { en: "The owl says: “A bell can send a message. Ring it, and the King can hear you.”", pl: "Sowa mówi: „Dzwon może wysłać wiadomość. Zadzwoń, a Król cię usłyszy.”" },
  { en: "You ring the bell. Ding! The sky turns green and pink. It is the King's light! He is inside the Glitch.", pl: "Dzwonisz. Dzyń! Niebo robi się zielone i różowe. To światło Króla! Jest w środku Glitcha." },
  { en: "The lights make words: “I… IS… OK.” You smile. “It's ‘I AM OK’, Your Majesty!” The lights blink. Haha.", pl: "Światła układają słowa: „I… IS… OK.” Uśmiechasz się. „Mówi się ‘I AM OK’, Wasza Wysokość!” Światła mrugają. Haha." },
  { en: "A bell shines in the sky. Then the lights send one more word: “HELP.”", pl: "Na niebie świeci dzwon. Potem światła wysyłają jeszcze jedno słowo: „HELP.”" },
  { en: "In the clouds there is a tree. Its leaves are sentences. But the leaves are falling.", pl: "W chmurach rośnie drzewo. Jego liście to zdania. Ale liście spadają." },
  { en: "Every leaf that falls goes grey and flies into the Glitch. Bzzt. Hmm…", pl: "Każdy spadający liść szarzeje i leci do Glitcha. Bzzt. Hmm…" },
  { en: "“The Glitch is made of broken sentences!” you say. Pip drops her glasses. “No way! That is why it is so big!”", pl: "„Glitch jest zrobiony z zepsutych zdań!” — mówisz. Pip upuszcza okulary. „Nie może być! Dlatego jest taki wielki!”" },
  { en: "You fix the sentences on the leaves. They stop falling. They glow again.", pl: "Naprawiasz zdania na liściach. Przestają spadać. Znowu świecą." },
  { en: "A tree shines in the sky. Then something huge comes out of the clouds. A whale! “I can take you inside the Glitch,” he says.", pl: "Na niebie świeci drzewo. Potem z chmur wyłania się coś ogromnego. Wieloryb! „Mogę zabrać cię do środka Glitcha” — mówi." },
  { en: "The Cloud Whale is very old. He speaks slowly. “Inside the Glitch… sentences break. Be careful what you say.”", pl: "Chmurowy Wieloryb jest bardzo stary. Mówi powoli. „W środku Glitcha… zdania się psują. Uważaj, co mówisz.”" },
  { en: "“How can we find the King in there?” asks Skye. Nobody knows.", pl: "„Jak znajdziemy tam Króla?” — pyta Skye. Nikt nie wie." },
  { en: "Then a little voice says: “I know.” It is the ghost from the Candy Forest!", pl: "Wtedy cichutki głos mówi: „Ja wiem.” To duszek z Cukierkowego Lasu!" },
  { en: "“I had no voice once,” says the ghost. “You helped me. Now I help you.”", pl: "„Kiedyś nie miałem głosu” — mówi duszek. „Dostałem od ciebie pomoc. Teraz ja pomogę tobie.”" },
  { en: "A ghost shines in the sky. You jump into the whale. The whale swims into the Glitch. Everything is dark.", pl: "Na niebie świeci duszek. Wskakujesz do wieloryba. Wieloryb wpływa w Glitcha. Wszędzie ciemno." },
  { en: "Inside the Glitch it is cold. Everything flickers. Even your paws flicker! Bzzt.", pl: "W środku Glitcha jest zimno. Wszystko migocze. Nawet twoje łapki migoczą! Bzzt." },
  { en: "A green light jumps in the dark. Ribbit! It is the frog prince. “I am here to help!”", pl: "W ciemności skacze zielone światełko. Kum! To żabi książę. „Przybywam pomóc!”" },
  { en: "Suddenly, little lights fall all around you. They are broken sentences! They fall like rain.", pl: "Nagle wokół ciebie spadają małe światełka. To zepsute zdania! Spadają jak deszcz." },
  { en: "You catch one: “The frog are green.” Easy! “The frog is green.” It glows in your paw.", pl: "Łapiesz jedno: „The frog are green.” Łatwe! „The frog is green.” Świeci w twojej łapce." },
  { en: "You catch more and more. Every sentence you fix lights the dark. A frog shines in the sky.", pl: "Łapiesz coraz więcej. Każde naprawione zdanie rozświetla ciemność. Na niebie świeci żaba." },
  { en: "Beep! The robot from Star Station is here too. “Sentence lamp. Ready,” it says. No glitch!", pl: "Bip! Robot ze Stacji Gwiazd też tu jest. „Lampa zdań. Gotowa” — mówi. Bez glitcha!" },
  { en: "You put your fixed sentences in the lamp. It shines bright. Now you can see a path.", pl: "Wkładasz naprawione zdania do lampy. Świeci jasno. Teraz widać ścieżkę." },
  { en: "The path goes down, down, down. You hear something. Somebody is crying.", pl: "Ścieżka prowadzi w dół, w dół, w dół. Coś słychać. Ktoś płacze." },
  { en: "It is the King! He sits in the dark. “I am sorry,” he says. “I shouted at the Glitch. That made it angry.”", pl: "To Król! Siedzi w ciemności. „Przepraszam” — mówi. „Krzyczałem na Glitcha. To go rozzłościło.”" },
  { en: "You give him his crown. A robot shines in the sky. But the King says: “Wait. Look behind you.”", pl: "Oddajesz mu koronę. Na niebie świeci robot. Ale Król mówi: „Czekaj. Spójrz za siebie.”" },
  { en: "Behind you is the heart of the Glitch. It is not a monster. It is a tiny grey sentence, all alone.", pl: "Za tobą jest serce Glitcha. To nie potwór. To malutkie szare zdanie, całkiem samo." },
  { en: "The tiny sentence says: “Nobody understand me.” Now you know who wrote the letter!", pl: "Malutkie zdanie mówi: „Nobody understand me.” Teraz wiesz, kto napisał list!" },
  { en: "“Nobody listens to broken sentences,” it says. “So I broke ALL the sentences. Now nobody understands anybody.”", pl: "„Nikt nie słucha zepsutych zdań” — mówi. „Więc zepsułem WSZYSTKIE zdania. Teraz nikt nikogo nie rozumie.”" },
  { en: "You think and think. Then you smile. “You are not bad. You just need some help.”", pl: "Myślisz i myślisz. Potem się uśmiechasz. „Nie jesteś złe. Potrzebujesz tylko trochę pomocy.”" },
  { en: "You help it: “Nobody understands me.” Then you add: “But now I do.” It glows! A comet shows the way out. A house shines in the sky.", pl: "Pomagasz mu: „Nobody understands me.” Potem dodajesz: „But now I do.” Świeci! Kometa pokazuje drogę na zewnątrz. Na niebie świeci domek." },
  { en: "The whale swims out. The Glitch is a little smaller. But there are so many broken sentences left.", pl: "Wieloryb wypływa. Glitch jest trochę mniejszy. Ale zostało jeszcze mnóstwo zepsutych zdań." },
  { en: "“I can't fix them all alone,” you say. Pip smiles. “You are not alone.”", pl: "„Nie naprawię ich wszystkich w pojedynkę” — mówisz. Pip się uśmiecha. „Nie musisz tego robić w pojedynkę.”" },
  { en: "Everybody comes: Pip, Skye, the owl, the ghost, the frog, the robot, Mailcat and the King.", pl: "Przychodzą wszyscy: Pip, Skye, sowa, duszek, żaba, robot, Kot Listonosz i Król." },
  { en: "Every friend fixes some sentences. “Teamwork!” shouts the King. The Glitch gets smaller and smaller.", pl: "Każdy przyjaciel naprawia trochę zdań. „Drużyna!” — woła Król. Glitch robi się coraz mniejszy." },
  { en: "The last stars fly up and make a cat. It is you! “You are the Sentence Hero now,” says the owl.", pl: "Ostatnie gwiazdy lecą w górę i tworzą kota. To ty! „Teraz to ty strzeżesz zdań” — mówi sowa." },
  { en: "One night, the Glitch comes to the tower. It is small now. It isn't scary. It looks at you.", pl: "Pewnej nocy Glitch przychodzi pod wieżę. Jest teraz mały. Nie jest straszny. Patrzy na ciebie." },
  { en: "You say a good sentence. And another. And another. Every sentence turns into a new star.", pl: "Mówisz dobre zdanie. I kolejne. I kolejne. Każde zdanie zamienia się w nową gwiazdę." },
  { en: "The Glitch gets smaller and brighter… and brighter… and BRIGHTER!", pl: "Glitch robi się mniejszy i jaśniejszy… i jaśniejszy… i JAŚNIEJSZY!" },
  { en: "The Glitch is gone. In its place there is a new, big star. It says, perfectly: “Thank you for helping me.”", pl: "Glitcha już nie ma. Na jego miejscu jest nowa, wielka gwiazda. Mówi, bez jednego błędu: „Dziękuję za pomoc.”" },
  { en: "The sky is full! The King has a party in the sky, with a rainbow, the ship, the whale and fireworks. GG! The End.", pl: "Niebo jest pełne! Król robi imprezę na niebie, z tęczą, statkiem, wielorybem i fajerwerkami. GG! Koniec." },
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
  { name: "Lost Stars", from: 26, to: 45 }, { name: "The Glitch", from: 46, to: 70 },
  { name: "Inside the Glitch", from: 71, to: 95 }, { name: "The Full Sky", from: 96, to: 100 },
];
