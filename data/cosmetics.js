// SKÓRKI I CZAPKI. id są stałe na zawsze (zapisane w postępach dzieci).
// Nowa skórka = nowy wpis. Nie usuwaj starych — ustaw "retired: true", żeby zniknęła ze sklepu.
// source: "shop" (za monety), "chest" (tylko ze skrzynek), "weekly" (nagroda za bossa tygodnia, po kolei wg "order"),
//         "event:<id>" (do kupienia tylko w czasie wydarzenia), "start" (każdy ma od początku)
// colors: fur, belly, stripe, ear, eye, nose. pattern: none | stripes | spots | tux | socks
// fx: dodatkowe efekty rysowane przez grę (shrimp, fire, toxic, candy, ghost, galaxy, robot, ice, zombie, golden, pumpkin, rainbow)

export const SKINS = [
  { id: "ginger", name: "Ginger", rarity: "common", source: "start", pattern: "stripes",
    colors: { fur: "#f4a24c", belly: "#ffe3c2", stripe: "#d9782b", ear: "#ffb6a3", eye: "#3fae5a", nose: "#ff7d8a" } },
  { id: "midnight", name: "Midnight", rarity: "common", source: "shop", price: 150, pattern: "none",
    colors: { fur: "#2b2a3a", belly: "#4a4860", stripe: "#1c1b28", ear: "#c77dff", eye: "#ffd23f", nose: "#c77dff" } },
  { id: "snowball", name: "Snowball", rarity: "common", source: "shop", price: 150, pattern: "none",
    colors: { fur: "#f6f4ff", belly: "#ffffff", stripe: "#dcd8ee", ear: "#ffc6d9", eye: "#4aa8ff", nose: "#ff8fb1" } },
  { id: "tux", name: "Tuxedo", rarity: "common", source: "shop", price: 200, pattern: "tux",
    colors: { fur: "#26262e", belly: "#ffffff", stripe: "#26262e", ear: "#ff9eb5", eye: "#7ad151", nose: "#ff9eb5" } },
  { id: "tabby", name: "Grey Tabby", rarity: "common", source: "shop", price: 200, pattern: "stripes",
    colors: { fur: "#9aa0ab", belly: "#e6e8ec", stripe: "#5e6470", ear: "#ffb8c6", eye: "#e8b730", nose: "#ff8fa3" } },
  { id: "cookie", name: "Cookie", rarity: "common", source: "shop", price: 250, pattern: "spots",
    colors: { fur: "#e9d3b0", belly: "#fff6e6", stripe: "#7a5232", ear: "#f7b6a0", eye: "#2f8f6b", nose: "#d8706b" } },
  { id: "candy", name: "Candy Cat", rarity: "rare", source: "shop", price: 450, pattern: "stripes", fx: ["candy"],
    colors: { fur: "#ffc4e1", belly: "#fff0f8", stripe: "#ff6fb5", ear: "#9ee6ff", eye: "#a66bff", nose: "#ff4f9a" } },
  { id: "toxic", name: "Toxic Cat", rarity: "rare", source: "chest", pattern: "spots", fx: ["toxic"],
    colors: { fur: "#8fe04a", belly: "#d8ff9e", stripe: "#3a8f1e", ear: "#2c4d14", eye: "#ff3df2", nose: "#2c4d14" } },
  { id: "robot", name: "Robo Cat", rarity: "rare", source: "shop", price: 500, pattern: "none", fx: ["robot"],
    colors: { fur: "#b8c4d6", belly: "#e3ebf5", stripe: "#7f8ea6", ear: "#ff5d5d", eye: "#38e8ff", nose: "#ff5d5d" } },
  { id: "ice", name: "Frost Cat", rarity: "rare", source: "chest", pattern: "none", fx: ["ice"],
    colors: { fur: "#bfeaff", belly: "#effaff", stripe: "#7cc8f0", ear: "#ffffff", eye: "#2266ff", nose: "#7cc8f0" } },
  { id: "fire", name: "Fire Cat", rarity: "epic", source: "chest", pattern: "stripes", fx: ["fire"],
    colors: { fur: "#ff6b2c", belly: "#ffd36b", stripe: "#c7280f", ear: "#ffd36b", eye: "#fff35c", nose: "#7a1505" } },
  { id: "galaxy", name: "Galaxy Cat", rarity: "epic", source: "shop", price: 900, pattern: "none", fx: ["galaxy"],
    colors: { fur: "#3b2a7a", belly: "#5a43b0", stripe: "#22195a", ear: "#ff7ae0", eye: "#7affea", nose: "#ff7ae0" } },
  { id: "golden", name: "Golden Cat", rarity: "legendary", source: "chest", pattern: "none", fx: ["golden"],
    colors: { fur: "#ffcf3f", belly: "#fff1b0", stripe: "#d99a00", ear: "#ffe68a", eye: "#b8336a", nose: "#d99a00" } },
  { id: "rainbow", name: "Rainbow Cat", rarity: "legendary", source: "shop", price: 2500, pattern: "none", fx: ["rainbow"],
    colors: { fur: "#ffffff", belly: "#ffffff", stripe: "#ffffff", ear: "#ff9ad5", eye: "#5b3cff", nose: "#ff6fa5" } },
  // --- wydarzenia ---
  { id: "pumpkin", name: "Pumpkin Cat", rarity: "rare", source: "event:halloween", price: 350, pattern: "stripes", fx: ["pumpkin"],
    colors: { fur: "#ff8a1f", belly: "#ffc27a", stripe: "#d45f00", ear: "#3d7a1a", eye: "#ffe14d", nose: "#3a1d00" } },
  { id: "ghost", name: "Ghost Cat", rarity: "epic", source: "event:halloween", price: 700, pattern: "none", fx: ["ghost"],
    colors: { fur: "#eef0ff", belly: "#ffffff", stripe: "#c9cdf5", ear: "#b9bff5", eye: "#262a5c", nose: "#b9bff5" } },
  { id: "zombie", name: "Zombie Cat", rarity: "rare", source: "event:halloween", price: 400, pattern: "spots", fx: ["zombie"],
    colors: { fur: "#8fb58a", belly: "#c4dbb9", stripe: "#5d7d58", ear: "#a35f6b", eye: "#ff2b2b", nose: "#5a2a33" } },
  { id: "gingerbread", name: "Gingerbread Cat", rarity: "rare", source: "event:winter", price: 400, pattern: "none", fx: ["candy"],
    colors: { fur: "#b8743c", belly: "#e9b27a", stripe: "#ffffff", ear: "#ffffff", eye: "#2a1405", nose: "#ff4b4b" } },
  // --- nagrody za bossa tygodnia (kolejka) ---
  { id: "shrimp", name: "Shrimp Cat", rarity: "epic", source: "weekly", order: 1, pattern: "stripes", fx: ["shrimp"],
    colors: { fur: "#ff8f7a", belly: "#ffd0c2", stripe: "#e8573f", ear: "#ffb3a3", eye: "#1d1d2b", nose: "#c73b28" } },
  { id: "dream", name: "Dream Cat", rarity: "epic", source: "weekly", order: 2, pattern: "spots", fx: ["galaxy"],
    colors: { fur: "#c9b8ff", belly: "#efe8ff", stripe: "#8f73ff", ear: "#ffb8ec", eye: "#2b1a66", nose: "#ff8fd8" } },
  { id: "lava", name: "Lava Cat", rarity: "epic", source: "weekly", order: 3, pattern: "stripes", fx: ["fire"],
    colors: { fur: "#3a2a2a", belly: "#5a3a32", stripe: "#ff5a1f", ear: "#ff5a1f", eye: "#ffd21f", nose: "#ff5a1f" } },
  { id: "mint", name: "Mint Cat", rarity: "rare", source: "weekly", order: 4, pattern: "socks",
    colors: { fur: "#9ff0d0", belly: "#e6fff5", stripe: "#ffffff", ear: "#ffb3c7", eye: "#ff5d8f", nose: "#ff5d8f" } },
  { id: "storm", name: "Storm Cat", rarity: "epic", source: "weekly", order: 5, pattern: "stripes", fx: ["ice"],
    colors: { fur: "#4a5470", belly: "#7c88a8", stripe: "#ffe14d", ear: "#ffe14d", eye: "#7ae8ff", nose: "#ffe14d" } },
];

export const HATS = [
  { id: "none", name: "No hat", rarity: "common", source: "start" },
  { id: "bow", name: "Bow", rarity: "common", source: "shop", price: 80 },
  { id: "cap", name: "Cap", rarity: "common", source: "shop", price: 100 },
  { id: "flower", name: "Flower", rarity: "common", source: "shop", price: 100 },
  { id: "party", name: "Party hat", rarity: "common", source: "shop", price: 120 },
  { id: "tophat", name: "Top hat", rarity: "rare", source: "shop", price: 250 },
  { id: "headphones", name: "Headphones", rarity: "rare", source: "shop", price: 300 },
  { id: "wizard", name: "Wizard hat", rarity: "rare", source: "chest" },
  { id: "horns", name: "Little horns", rarity: "rare", source: "chest" },
  { id: "halo", name: "Halo", rarity: "epic", source: "chest" },
  { id: "crown", name: "Crown", rarity: "legendary", source: "chest" },
  { id: "witch", name: "Witch hat", rarity: "rare", source: "event:halloween", price: 200 },
  { id: "pumpkinhat", name: "Pumpkin hat", rarity: "rare", source: "event:halloween", price: 220 },
  { id: "santa", name: "Santa hat", rarity: "rare", source: "event:winter", price: 200 },
  { id: "bunnyears", name: "Bunny ears", rarity: "rare", source: "event:spring", price: 200 },
  { id: "sunhat", name: "Sun hat", rarity: "rare", source: "event:summer", price: 200 },
];

export const RARITY = {
  common: { name: "Zwykła", color: "#9aa5b8" },
  rare: { name: "Rzadka", color: "#3d9bff" },
  epic: { name: "Epicka", color: "#b04dff" },
  legendary: { name: "Legendarna", color: "#ffb21f" },
};
