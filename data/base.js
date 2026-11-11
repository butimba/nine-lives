// MOON BASE — meble do domku kota na Księżycu (otwiera się od strony 25 fabuły, js/ui/base.js).
// id są wieczne (zapis: save.base.owned / save.base.placed). Grafika = pikselizowane emoji (Unicode ≤ 13).
// slot: "top" (sufit), "wall" (ściana ×2), "floor" (podłoga ×3). Ceny = tabela czapek (data/cosmetics.js PRICE.hat).
// source "ship" = tylko z paczki statku Króla (od strony 45), nie do kupienia.
import { PRICE } from "./cosmetics.js";

export const SLOTS = [
  { id: "top", kind: "top", x: 50, y: 2 },
  { id: "wall1", kind: "wall", x: 20, y: 28 },
  { id: "wall2", kind: "wall", x: 80, y: 28 },
  { id: "floor1", kind: "floor", x: 16, y: 70 },
  { id: "floor2", kind: "floor", x: 50, y: 74 },
  { id: "floor3", kind: "floor", x: 84, y: 70 },
];

export const FURNITURE = [
  // sufit
  { id: "lamp", name: "Lamp", emoji: "💡", slot: "top", rarity: "common" },
  { id: "balloons", name: "Balloons", emoji: "🎈", slot: "top", rarity: "common" },
  { id: "lantern", name: "Lantern", emoji: "🏮", slot: "top", rarity: "rare" },
  { id: "planet", name: "Planet", emoji: "🪐", slot: "top", rarity: "epic" },
  { id: "rainbow", name: "Rainbow", emoji: "🌈", slot: "top", rarity: "legendary" },
  { id: "shipstar", name: "Ship star", emoji: "⭐", slot: "top", rarity: "rare", source: "ship" },
  // ściana
  { id: "painting", name: "Painting", emoji: "🖼️", slot: "wall", rarity: "common" },
  { id: "clock", name: "Clock", emoji: "🕰️", slot: "wall", rarity: "common" },
  { id: "map", name: "Map", emoji: "🗺️", slot: "wall", rarity: "common" },
  { id: "target", name: "Target", emoji: "🎯", slot: "wall", rarity: "common" },
  { id: "earth", name: "Earth", emoji: "🌍", slot: "wall", rarity: "rare" },
  { id: "guitar", name: "Guitar", emoji: "🎸", slot: "wall", rarity: "rare" },
  { id: "bigstar", name: "Big star", emoji: "🌟", slot: "wall", rarity: "epic" },
  { id: "compass", name: "Compass", emoji: "🧭", slot: "wall", rarity: "rare", source: "ship" },
  { id: "anchor", name: "Anchor", emoji: "⚓", slot: "wall", rarity: "epic", source: "ship" },
  // podłoga
  { id: "plant", name: "Plant", emoji: "🪴", slot: "floor", rarity: "common" },
  { id: "chair", name: "Chair", emoji: "🪑", slot: "floor", rarity: "common" },
  { id: "basket", name: "Basket", emoji: "🧺", slot: "floor", rarity: "common" },
  { id: "yarn", name: "Yarn", emoji: "🧶", slot: "floor", rarity: "common" },
  { id: "books", name: "Books", emoji: "📚", slot: "floor", rarity: "common" },
  { id: "cactus", name: "Cactus", emoji: "🌵", slot: "floor", rarity: "common" },
  { id: "teddy", name: "Teddy", emoji: "🧸", slot: "floor", rarity: "rare" },
  { id: "sofa", name: "Sofa", emoji: "🛋️", slot: "floor", rarity: "rare" },
  { id: "bed", name: "Bed", emoji: "🛏️", slot: "floor", rarity: "rare" },
  { id: "tv", name: "TV", emoji: "📺", slot: "floor", rarity: "rare" },
  { id: "piano", name: "Piano", emoji: "🎹", slot: "floor", rarity: "epic" },
  { id: "telescope", name: "Telescope", emoji: "🔭", slot: "floor", rarity: "epic" },
  { id: "statue", name: "Statue", emoji: "🗿", slot: "floor", rarity: "epic" },
  { id: "ufo", name: "UFO", emoji: "🛸", slot: "floor", rarity: "legendary" },
  { id: "castle", name: "Castle", emoji: "🏰", slot: "floor", rarity: "legendary" },
  { id: "trophy", name: "Trophy", emoji: "🏆", slot: "floor", rarity: "epic", source: "ship" },
  { id: "giftbox", name: "Gift box", emoji: "🎁", slot: "floor", rarity: "rare", source: "ship" },
];
for (const f of FURNITURE) f.price = f.source === "ship" ? 0 : PRICE.hat[f.rarity];
