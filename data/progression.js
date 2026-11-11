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
// Rybki ze skrzyń celowo małe: skrzynia ma dawać PRZEDMIOTY. Wcześniej skrzynie dawały więcej rybek niż sama gra
// (tools/sim-economy.mjs: ~800/dzień) i cały sklep był kupiony po 3 tygodniach.
// min = najniższa rzadkość przedmiotu (drabinka: im lepsza skrzynia, tym lepsza gwarancja). Wagi 0 = nigdy.
export const CHESTS = {
  wood: { name: "Wooden Chest", icon: "🧰", min: "common", rolls: { coins: 60, common: 30, rare: 10, epic: 0, legendary: 0 }, coins: [20, 50] },
  silver: { name: "Silver Chest", icon: "🎁", min: "common", rolls: { coins: 0, common: 50, rare: 40, epic: 10, legendary: 0 }, coins: [50, 100] },
  gold: { name: "Golden Chest", icon: "👑", min: "rare", rolls: { coins: 0, common: 0, rare: 50, epic: 40, legendary: 10 }, coins: [120, 220] },
  // epicka = smaczek raz na jakiś czas: zawsze epicki albo legendarny
  epic: { name: "Epic Chest", icon: "💎", min: "epic", rolls: { coins: 0, common: 0, rare: 0, epic: 75, legendary: 25 }, coins: [220, 380] },
  // mityczna (tylko boss tygodnia): legendarny (skórki "mythic" ×2) → epicki; rybki dopiero gdy masz wszystko
  mythic: { name: "Mythic Chest", icon: "🌌", min: "epic", rolls: { coins: 0, common: 0, rare: 0, epic: 0, legendary: 100 }, coins: [500, 800] },
};
// gwarancja do pokazania pod skrzynią (ui/chest.js)
export const CHEST_PROMISE = { wood: "Fish or a surprise!", silver: "Always a prize!", gold: "Rare or better!", epic: "Epic or better!", mythic: "LEGENDARY!" };
export const CHEST_ORDER = ["wood", "silver", "gold", "epic"]; // + "mythic" (tylko boss tygodnia)
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
  bossChestsPerDay: 3, // skrzynia za bossa tylko za pierwszych 3 bossów dnia (dalej same rybki) — save.daily.bossChests
  chestPrice: 250, // sklep sprzedaje SREBRNĄ skrzynię (drewniana za 220 była warta ~115 rybek)
  // XP potrzebne na przejście z lvl do lvl+1. Do lvl 15 jak dawniej (nikomu nie spada level), od 16 coraz wolniej:
  // wszystkie talenty (lvl 25) po ok. 2 miesiącach codziennej gry zamiast ~2,5 tygodnia.
  levelXp: (lvl) => 100 + (lvl - 1) * 40 + (lvl >= 16 ? 100 * (lvl - 15) ** 2 : 0),
  monsterHp: (floor) => (floor < 20 ? 2 : floor < 60 ? 3 : 4),
  bossHp: (floor) => (floor < 20 ? 5 : floor < 60 ? 6 : 7),
  floorsPerStage: 5,
  kingEvery: 25, kingHp: 2, kingFish: 40, // boss co 25 pięter = Król: korona, +2 HP, 3. pocisk w fazie 2, +40 rybek
  weeklyHpPerPlayer: 250,
  weeklyLastWeek: 0.9,   // HP bossa tygodnia >= 90% obrażeń z zeszłego tygodnia (im mocniej grają, tym większy boss i pula)
  weeklyFishPerHp: 2,    // pula bonusu = HP × 2, dzielona wg obrażeń, wypłacana po pokonaniu bossa (≈ 500 rybek na dziecko)
  weeklyFishPerHit: 1,   // + 1 rybka za każdy punkt obrażeń od razu po biegu (× malejące nagrody), nawet gdy boss nie padnie
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
  { en: "The fish star has a grey spot. It is cold. “Who did this?” you ask.", pl: "Rybia gwiazda ma szarą plamę. Jest zimna. „Kto to zrobił?” — pytasz." },
  { en: "In the kitchen you meet Pip, a mouse with big glasses. Her lamp is a star!", pl: "W kuchni poznajesz Pip, mysz w wielkich okularach. Jej lampka to gwiazda!" },
  { en: "Pip makes things. “I can fix the grey spot,” she says. “But you must tell me a word.”", pl: "Pip robi wynalazki. „Naprawię tę szarą plamę” — mówi. „Ale musisz powiedzieć mi słowo.”" },
  { en: "You say “cheese”. The word glows. The grey spot is gone! Words are light.", pl: "Mówisz „cheese”. Słowo świeci. Szara plama znika! Słowa są światłem." },
  { en: "Pip gives you her star. Now a mouse shines in the sky. Pip whispers: “The stars did not fall. Something took them.”", pl: "Pip daje ci swoją gwiazdę. Teraz na niebie świeci mysz. Pip szepcze: „Gwiazdy nie spadły. Coś je zabrało.”" },
  { en: "On the roof lives Skye, a fast bird. “I saw it!” she says. “A big grey cloud. It eats light.”", pl: "Na dachu mieszka Skye, szybki ptak. „Widziałam to!” — mówi. „Wielka szara chmura. Zjada światło.”" },
  { en: "Pip has a plan: “Light can make a bridge. We need a word for every colour.”", pl: "Pip ma plan: „Ze światła da się zrobić most. Potrzebujemy słowa na każdy kolor.”" },
  { en: "“Red, orange, yellow, green, blue, purple!” A rainbow bridge goes up to the clouds!", pl: "„Red, orange, yellow, green, blue, purple!” Tęczowy most prowadzi do chmur!" },
  { en: "On the clouds you find three stars in a nest. Skye takes them home.", pl: "Na chmurach znajdujesz trzy gwiazdy w gnieździe. Skye zabiera je do domu." },
  { en: "Now a bird shines in the sky. But far away, the sky is grey. The grey cloud is real.", pl: "Teraz na niebie świeci ptak. Ale daleko niebo jest szare. Szara chmura jest prawdziwa." },
  { en: "The King is angry. “Nobody takes MY stars! I will build a ship. A ship that flies!”", pl: "Król się złości. „Nikt nie zabiera MOICH gwiazd! Zbuduję statek. Statek, który lata!”" },
  { en: "Pip helps. Robots help. You help too. Bang, bang! Every day the ship is bigger.", pl: "Pip pomaga. Roboty pomagają. Ty też pomagasz. Bum, bum! Statek jest każdego dnia większy." },
  { en: "The ship needs a sail. You find a paper boat with a star inside. It is the last part!", pl: "Statek potrzebuje żagla. Znajdujesz papierową łódkę z gwiazdą w środku. To ostatnia część!" },
  { en: "The paper boat came from the Shadow Cellar. The shadows wave. “Please remember us,” they say.", pl: "Papierowa łódka przypłynęła z Piwnicy Cieni. Cienie machają. „Proszę, pamiętaj o nas” — mówią." },
  { en: "A boat shines in the sky. And the King's ship flies! “Next stop: the grey cloud!”", pl: "Na niebie świeci łódka. A statek Króla leci! „Następny przystanek: szara chmura!”" },
  { en: "The ship flies over the tower. The wind is cold. The King looks at a map. “The cloud has a name. It is the Grey.”", pl: "Statek leci nad wieżą. Wiatr jest zimny. Król patrzy na mapę. „Ta chmura ma imię. To Mgła.”" },
  { en: "A balloon comes! A cat with a big bag says: “I am Mailcat. I have a letter for you.”", pl: "Leci balon! Kot z wielką torbą mówi: „Jestem Mailcat. Mam dla ciebie list.”" },
  { en: "The letter is grey. It has only one word: “Why?” Who wrote it?", pl: "List jest szary. Jest w nim tylko jedno słowo: „Why?” Kto go napisał?" },
  { en: "Mailcat says: “The Grey took the Key Star. Without it, the Moon cannot open the night.”", pl: "Mailcat mówi: „Mgła zabrała Gwiazdę-Klucz. Bez niej Księżyc nie może otworzyć nocy.”" },
  { en: "You fly into the Grey and say every word you know. The Key Star is free! A key shines in the sky.", pl: "Wlatujesz w Mgłę i mówisz każde słowo, które znasz. Gwiazda-Klucz jest wolna! Na niebie świeci klucz." },
  { en: "The ship stops at a library in the clouds. It is very quiet. Somebody says: “Shhh!”", pl: "Statek zatrzymuje się przy bibliotece w chmurach. Jest bardzo cicho. Ktoś mówi: „Ćśśś!”" },
  { en: "It is an old owl. “I keep all the words of the world,” she says. “But many books are empty now.”", pl: "To stara sowa. „Pilnuję wszystkich słów świata” — mówi. „Ale wiele książek jest teraz pustych.”" },
  { en: "“When nobody says a word for a long time, it flies away,” says the owl. “Where to?” you ask.", pl: "„Kiedy nikt długo nie mówi jakiegoś słowa, ono odlatuje” — mówi sowa. „Dokąd?” — pytasz." },
  { en: "The owl looks at the window. Outside, the Grey is bigger. “There,” she says.", pl: "Sowa patrzy w okno. Na zewnątrz Mgła jest większa. „Tam” — mówi." },
  { en: "The owl gives you a star from her lamp. An owl shines in the sky. “Be careful,” she says. “The Grey is hungry.”", pl: "Sowa daje ci gwiazdę ze swojej lampy. Na niebie świeci sowa. „Uważaj” — mówi. „Mgła jest głodna.”" },
  { en: "A storm! The ship shakes. Grey hands come out of the cloud. They want the stars!", pl: "Burza! Statek się trzęsie. Z chmury wychodzą szare ręce. Chcą gwiazd!" },
  { en: "Skye has an idea. She ties a star to a kite. “Follow the light, not the Grey!”", pl: "Skye ma pomysł. Przywiązuje gwiazdę do latawca. „Leć za światłem, nie za Mgłą!”" },
  { en: "The King stands at the front of the ship. “Go away, Grey! I am the King of the Night!”", pl: "Król staje na dziobie statku. „Odejdź, Mgło! Jestem Królem Nocy!”" },
  { en: "But the Grey does not go away. It opens like a big mouth…", pl: "Ale Mgła nie odchodzi. Otwiera się jak wielka paszcza…" },
  { en: "…and takes the King! Only his crown falls on the ship. A kite shines in the sky, but you are very sad.", pl: "…i zabiera Króla! Na statek spada tylko jego korona. Na niebie świeci latawiec, ale jest ci bardzo smutno." },
  { en: "You hold the crown. It is still warm. “The King is alive,” says Pip. “We will find him.”", pl: "Trzymasz koronę. Jest jeszcze ciepła. „Król żyje” — mówi Pip. „Znajdziemy go.”" },
  { en: "The owl says: “A bell can wake up words. Ring it, and the King can hear you.”", pl: "Sowa mówi: „Dzwon potrafi obudzić słowa. Zadzwoń, a Król cię usłyszy.”" },
  { en: "You ring the bell. Ding! The sky turns green and pink. It is the King's light! He is inside the Grey.", pl: "Dzwonisz. Dzyń! Niebo robi się zielone i różowe. To światło Króla! Jest w środku Mgły." },
  { en: "The lights make letters: “I… AM… OK.” The King is talking to you!", pl: "Światła układają się w litery: „I… AM… OK.” Król mówi do ciebie!" },
  { en: "A bell shines in the sky. Then the lights say one more word: “HELP.”", pl: "Na niebie świeci dzwon. Potem światła mówią jeszcze jedno słowo: „HELP.”" },
  { en: "In the clouds there is a tree. Its leaves are words. But the leaves are falling.", pl: "W chmurach rośnie drzewo. Jego liście to słowa. Ale liście spadają." },
  { en: "Every leaf that falls turns grey and flies into the Grey. Hmm…", pl: "Każdy liść, który spada, robi się szary i leci do Mgły. Hmm…" },
  { en: "“The Grey is made of forgotten words!” you say. Pip drops her glasses. “Oh no. That is why it is so big.”", pl: "„Mgła jest zrobiona z zapomnianych słów!” — mówisz. Pip upuszcza okulary. „O nie. Dlatego jest taka wielka.”" },
  { en: "You say the words on the leaves. They stop falling. They glow again.", pl: "Mówisz słowa z liści. Przestają spadać. Znowu świecą." },
  { en: "A tree shines in the sky. Then something huge comes out of the clouds. A whale! “I can take you inside the Grey,” it says.", pl: "Na niebie świeci drzewo. Wtedy z chmur wynurza się coś ogromnego. Wieloryb! „Mogę zabrać was do środka Mgły” — mówi." },
  { en: "The Cloud Whale is very old. He speaks slowly. “Inside the Grey… there are no words. You cannot talk.”", pl: "Wieloryb Chmur jest bardzo stary. Mówi powoli. „W środku Mgły… nie ma słów. Nie da się mówić.”" },
  { en: "“How can we find the King with no words?” asks Skye. Nobody knows.", pl: "„Jak znajdziemy Króla bez słów?” — pyta Skye. Nikt nie wie." },
  { en: "Then a little voice says: “I know how.” It is the ghost from the Candy Forest!", pl: "Wtedy cichy głosik mówi: „Ja wiem jak.” To duszek z Cukierkowego Lasu!" },
  { en: "“I had no voice once,” says the ghost. “You can talk with your heart. And with light.”", pl: "„Kiedyś nie miałem głosu” — mówi duszek. „Można mówić sercem. I światłem.”" },
  { en: "A ghost shines in the sky. You go into the whale. The whale swims into the Grey. Everything is dark.", pl: "Na niebie świeci duszek. Wchodzicie do wieloryba. Wieloryb płynie w Mgłę. Wszystko jest ciemne." },
  { en: "Inside the Grey it is quiet and cold. You open your mouth, but no words come out.", pl: "W środku Mgły jest cicho i zimno. Otwierasz usta, ale nie wychodzą żadne słowa." },
  { en: "A green light jumps in the dark. Ribbit! It is the frog prince. He came to help.", pl: "W ciemności skacze zielone światełko. Kum kum! To żabi książę. Przyszedł pomóc." },
  { en: "Suddenly, little lights fall all around you. They are words! Forgotten words falling like rain.", pl: "Nagle wokół spadają małe światełka. To słowa! Zapomniane słowa spadają jak deszcz." },
  { en: "You catch one. It says “umbrella”. You remember it! It glows in your paw.", pl: "Łapiesz jedno. To „umbrella”. Pamiętasz je! Świeci w twojej łapce." },
  { en: "You catch more and more. Every word you remember lights the dark. A frog shines in the sky.", pl: "Łapiesz coraz więcej. Każde słowo, które pamiętasz, rozjaśnia ciemność. Na niebie świeci żaba." },
  { en: "Beep! The robot from Star Station is here too. “I can make a word lamp,” it says.", pl: "Bip! Robot ze Star Station też tu jest. „Mogę zrobić lampę ze słów” — mówi." },
  { en: "You put your words in the lamp. It shines bright. Now you can see a path.", pl: "Wkładasz swoje słowa do lampy. Świeci jasno. Teraz widać ścieżkę." },
  { en: "The path goes down, down, down. You hear something. Somebody is crying.", pl: "Ścieżka prowadzi w dół, w dół, w dół. Coś słychać. Ktoś płacze." },
  { en: "It is the King! He is sitting in the dark. “I am sorry,” he says. “I was proud. I shouted at the Grey.”", pl: "To Król! Siedzi w ciemności. „Przepraszam” — mówi. „Byłem dumny. Krzyczałem na Mgłę.”" },
  { en: "You give him his crown. A robot shines in the sky. But the King says: “Wait. Look behind you.”", pl: "Oddajesz mu koronę. Na niebie świeci robot. Ale Król mówi: „Czekaj. Spójrz za siebie.”" },
  { en: "Behind you is the heart of the Grey. It is not a monster. It is a tiny grey word, all alone.", pl: "Za tobą jest serce Mgły. To nie potwór. To malutkie szare słowo, całkiem samotne." },
  { en: "The tiny word says: “Why do you remember them… and not us?” Now you know who wrote the letter.", pl: "Malutkie słowo mówi: „Dlaczego pamiętasz je… a nas nie?” Teraz wiesz, kto napisał list." },
  { en: "“We took the stars because we were cold,” says the word. “We just want to go home.”", pl: "„Zabieraliśmy gwiazdy, bo było nam zimno” — mówi słowo. „Chcemy tylko wrócić do domu.”" },
  { en: "Where is home for a word? You think and think. Then you smile. “Home is somebody who remembers you.”", pl: "Gdzie jest dom słowa? Myślisz i myślisz. Potem się uśmiechasz. „Dom to ktoś, kto o tobie pamięta.”" },
  { en: "You say the tiny word. It glows! A comet flies across the sky and shows the way out. A house shines in the sky.", pl: "Mówisz to malutkie słowo. Świeci! Przez niebo przelatuje kometa i pokazuje drogę na zewnątrz. Na niebie świeci dom." },
  { en: "The whale swims out. The Grey is a little smaller. But there are so many words left.", pl: "Wieloryb wypływa. Mgła jest trochę mniejsza. Ale zostało tyle słów." },
  { en: "“I cannot remember all of them alone,” you say. Pip smiles. “You are not alone.”", pl: "„Nie dam rady zapamiętać ich wszystkich w pojedynkę” — mówisz. Pip się uśmiecha. „Masz nas.”" },
  { en: "Everybody comes: Pip, Skye, the owl, the ghost, the frog, the robot, Mailcat and the King.", pl: "Przychodzą wszyscy: Pip, Skye, sowa, duszek, żaba, robot, Mailcat i Król." },
  { en: "Every friend takes some words. “We will say them every day,” says the King. “Then they will never be grey again.”", pl: "Każdy przyjaciel bierze trochę słów. „Będziemy je mówić codziennie” — mówi Król. „Wtedy już nigdy nie będą szare.”" },
  { en: "The last stars fly up and make a cat. It is you! “You are the Keeper of Words now,” says the owl.", pl: "Ostatnie gwiazdy lecą w górę i tworzą kota. To ty! „Teraz to ty strzeżesz słów” — mówi sowa." },
  { en: "One night, the Grey comes to the tower. It is small now. It is not scary. It looks at you.", pl: "Pewnej nocy Mgła przychodzi do wieży. Jest teraz mała. Nie jest straszna. Patrzy na ciebie." },
  { en: "You say a word. And another. And another. Every word you say turns into a new star.", pl: "Mówisz słowo. I kolejne. I kolejne. Każde słowo, które mówisz, zamienia się w nową gwiazdę." },
  { en: "The Grey gets smaller and brighter… and brighter… and BRIGHTER!", pl: "Mgła robi się mniejsza i jaśniejsza… i jaśniejsza… i JAŚNIEJSZA!" },
  { en: "The Grey is gone. In its place there is a new, big star. It whispers: “Thank you for remembering us.”", pl: "Mgły już nie ma. Na jej miejscu jest nowa, wielka gwiazda. Szepcze: „Dziękujemy, że o nas pamiętasz.”" },
  { en: "The sky is full! The King has a party in the sky, with a rainbow, the ship, the whale and fireworks. Never stop learning words. The End.", pl: "Niebo jest pełne! Król robi przyjęcie na niebie, z tęczą, statkiem, wielorybem i fajerwerkami. Nigdy nie przestawaj uczyć się słów. Koniec." },
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
