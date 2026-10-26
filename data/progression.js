// PROGRESJA: talenty (stałe), perki (na jeden bieg), skrzynki, fabuła.
// id są stałe na zawsze. Wartości liczbowe (balans) możesz zmieniać bez psucia zapisów.

// --- 3 ścieżki talentów. Punkt talentu = 1 za każdy level. ---
export const TALENTS = [
  // PAZURY — atak
  { id: "sharp_claws", tree: "claws", name: "Sharp Claws", icon: "🗡️", max: 3, desc: (r) => `+${r * 6}% szansy na cios krytyczny (x2)` },
  { id: "combo", tree: "claws", name: "Combo Master", icon: "🔥", max: 3, desc: (r) => `Seria ${Math.max(2, 5 - r)} dobrych odpowiedzi = +1 obrażeń`, req: "sharp_claws" },
  { id: "pounce", tree: "claws", name: "Pounce", icon: "🐾", max: 2, desc: (r) => `Pierwszy cios na piętrze: x${r + 1}`, req: "combo" },
  // FUTRO — obrona
  { id: "nine_lives", tree: "fur", name: "Nine Lives", icon: "❤️", max: 3, desc: (r) => `+${r} serce na start` },
  { id: "thick_fur", tree: "fur", name: "Thick Fur", icon: "🛡️", max: 3, desc: (r) => `${r * 10}% szansy, że cios potworka nic nie zrobi`, req: "nine_lives" },
  { id: "cat_nap", tree: "fur", name: "Cat Nap", icon: "😴", max: 2, desc: (r) => `Po bossie odzyskujesz ${r} serce`, req: "thick_fur" },
  // WĄSY — spryt i nagrody
  { id: "lucky", tree: "whiskers", name: "Lucky Whiskers", icon: "🪙", max: 3, desc: (r) => `+${r * 10}% monet` },
  { id: "sixth_sense", tree: "whiskers", name: "Sixth Sense", icon: "💡", max: 3, desc: (r) => `${r + 1}x podpowiedź na bieg (usuwa złą odpowiedź)`, req: "lucky" },
  { id: "treasure", tree: "whiskers", name: "Treasure Nose", icon: "💎", max: 2, desc: (r) => `Lepsze skarby w skrzyniach (+${r * 8}% na rzadkie)`, req: "sixth_sense" },
];
export const TREES = {
  claws: { name: "Pazury", color: "#ff5d5d" },
  fur: { name: "Futro", color: "#3d9bff" },
  whiskers: { name: "Wąsy", color: "#ffb21f" },
};

// --- perki na jeden bieg (wybór 1 z 3) ---
export const PERKS = [
  { id: "fishbone", name: "Fishbone Sword", icon: "🐟", desc: "Krytyki zadają +1", w: 3 },
  { id: "catnip", name: "Catnip", icon: "🌿", desc: "Odzyskaj 1 serce teraz", w: 3, instant: true },
  { id: "bell", name: "Golden Bell", icon: "🔔", desc: "+50% monet w tym biegu", w: 3 },
  { id: "lightning", name: "Lightning Paws", icon: "⚡", desc: "Szybka odpowiedź (do 5 s) = +1 obrażeń", w: 3 },
  { id: "bubble", name: "Bubble Shield", icon: "🫧", desc: "Blokuje następny cios", w: 3, instant: true },
  { id: "fire_combo", name: "Fire Combo", icon: "🔥", desc: "Seria 3+ = podwójne obrażenia", w: 2 },
  { id: "clover", name: "Lucky Clover", icon: "🍀", desc: "+15% szansy na krytyk", w: 3 },
  { id: "magnet", name: "Star Magnet", icon: "🧲", desc: "+30% XP w tym biegu", w: 3 },
  { id: "big_heart", name: "Big Heart", icon: "💖", desc: "+1 maks. serce i leczenie", w: 2, instant: true },
];

// --- skrzynki ---
export const CHESTS = {
  wood: { name: "Drewniana skrzynia", icon: "🧰", rolls: { coins: 70, common: 20, rare: 9, epic: 1, legendary: 0 } },
  silver: { name: "Srebrna skrzynia", icon: "🎁", rolls: { coins: 45, common: 25, rare: 22, epic: 7, legendary: 1 } },
  gold: { name: "Złota skrzynia", icon: "👑", rolls: { coins: 20, common: 15, rare: 35, epic: 22, legendary: 8 } },
};

// --- ekonomia ---
export const ECON = {
  coinPerCorrect: 2, coinPerKill: 3, coinPerBoss: 20, coinShadowClear: 4,
  xpPerCorrect: 10, xpPerTry: 2, xpPerBoss: 50,
  dailyFullRuns: 3, dailyMult: [1, 1, 1, 0.5, 0.5, 0.25],
  freezePrice: 120, freezeMax: 2,
  chestPrice: 220,
  levelXp: (lvl) => 100 + (lvl - 1) * 40, // XP potrzebne na przejście z lvl do lvl+1
  monsterHp: (floor) => (floor < 20 ? 2 : floor < 60 ? 3 : 4),
  bossHp: (floor) => (floor < 20 ? 5 : floor < 60 ? 6 : 7),
  floorsPerStage: 5,
  weeklyHpPerPlayer: 250,
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
