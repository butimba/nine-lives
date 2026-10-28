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
  { id: "catnip", name: "Catnip", icon: "🌿", desc: "+1 life now", w: 3, instant: true },
  { id: "bell", name: "Golden Bell", icon: "🔔", desc: "+50% fish in this run", w: 3 },
  { id: "lightning", name: "Lightning Paws", icon: "⚡", desc: "Fast answer (5 s): +1 hit", w: 3 },
  { id: "bubble", name: "Bubble Shield", icon: "🫧", desc: "Blocks the next boss shot", w: 3, instant: true },
  { id: "fire_combo", name: "Fire Combo", icon: "🔥", desc: "3 good in a row: x2 hits", w: 2 },
  { id: "clover", name: "Lucky Clover", icon: "🍀", desc: "Big hit chance +15%", w: 3 },
  { id: "magnet", name: "Star Magnet", icon: "🧲", desc: "+30% XP in this run", w: 3 },
  { id: "big_heart", name: "Big Heart", icon: "💖", desc: "+1 life and +1 shield", w: 2, instant: true },
];

// --- MOCE AKTYWNE (etap 2) — id wieczne. Pasek mocy ładuje się dobrymi odpowiedziami (charge = ile dobrych).
// Odblokowanie: level >= unlockLevel (rewards.js) albo nagroda ze skrzyni. Założone: max 2 (save.powers.equipped).
// icon = klucz ICONS (js/pixel/icons.js). Teksty EN, A1.
export const POWERS = [
  { id: "owl_eye", name: "Owl Eye", desc: "Takes away a wrong answer", icon: "power_owl_eye", charge: 3, unlockLevel: 2, color: "#ffd23f" },
  { id: "freeze", name: "Freeze", desc: "Stops everything for 3 questions", icon: "power_freeze", charge: 4, unlockLevel: 3, color: "#7ec4ff" },
  { id: "claw_storm", name: "Claw Storm", desc: "Double hits for 3 answers", icon: "power_claw_storm", charge: 5, unlockLevel: 4, color: "#ff5d5d" },
  { id: "fish_magnet", name: "Fish Magnet", desc: "Double fish on this floor", icon: "power_fish_magnet", charge: 4, unlockLevel: 6, color: "#6fe3d3" },
  { id: "catnip", name: "Catnip", desc: "+1 life", icon: "power_catnip", charge: 6, unlockLevel: 8, color: "#93e04c" },
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
  levelXp: (lvl) => 100 + (lvl - 1) * 40, // XP potrzebne na przejście z lvl do lvl+1
  monsterHp: (floor) => (floor < 20 ? 2 : floor < 60 ? 3 : 4),
  bossHp: (floor) => (floor < 20 ? 5 : floor < 60 ? 6 : 7),
  floorsPerStage: 5,
  weeklyHpPerPlayer: 250,
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
];
