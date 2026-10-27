// BIOMES — 8 lands of the tower (10 floors each). After land 8 they come back as II, III… with a palette shift.
// ids are permanent (used in saves/events): garden attic candy swamp volcano ice clouds space.

export const BIOMES = [
  { id: "garden", name: "Moonlit Garden", sky: ["#2b2d6e", "#6a4fb0", "#f7a4c0"], ground: "#3c6e47",
    mon: ["#7ad151", "#ff8fb1", "#ffd23f", "#5bc0ff"], style: "brick",
    wall: "#2c3a3a", mortar: "#1e2828", brick: "#4c6458", brickHi: "#5f7a69", brickLo: "#3c5048",
    ledge: "#6b5a46", ledgeHi: "#a08664", ledgeLo: "#3e3226", accent: "#7ad151", accent2: "#ff8fb1", light: "#ffd27a", deco: "vines" },
  { id: "attic", name: "Dusty Attic", sky: ["#2a1e2e", "#5a3a4a", "#b07a5a"], ground: "#5a3b2a",
    mon: ["#c9a26b", "#9a7bd1", "#e86a5a", "#8fb5a8"], style: "planks",
    wall: "#3a2a24", mortar: "#24180f", brick: "#6b4a34", brickHi: "#85603f", brickLo: "#553a28",
    ledge: "#7a5a3a", ledgeHi: "#a8814f", ledgeLo: "#40291a", accent: "#d8d0c0", accent2: "#c9a26b", light: "#ffc070", deco: "webs" },
  { id: "candy", name: "Candy Forest", sky: ["#ff9ad5", "#ffc4e1", "#fff0b3"], ground: "#ff6fb5",
    mon: ["#ff4f9a", "#7ad6ff", "#b38cff", "#ffd23f"], style: "brick",
    wall: "#6a2a52", mortar: "#f4d9e8", brick: "#c2487e", brickHi: "#e06a9a", brickLo: "#9c3666",
    ledge: "#f4efe2", ledgeHi: "#ffffff", ledgeLo: "#c66a8e", accent: "#7ad6ff", accent2: "#ffd23f", light: "#fff0b3", deco: "sprinkles" },
  { id: "swamp", name: "Toxic Swamp", sky: ["#1b2e1b", "#2f5a2a", "#9adf5a"], ground: "#2a4a1a",
    mon: ["#8fe04a", "#c45cff", "#3ad6a0", "#e0d43a"], style: "blocks",
    wall: "#1c2a1c", mortar: "#101a10", brick: "#3a4f30", brickHi: "#4d6640", brickLo: "#2c3c24",
    ledge: "#4a3e2a", ledgeHi: "#6e5e3e", ledgeLo: "#2a2216", accent: "#8fe04a", accent2: "#c45cff", light: "#b8ff6a", deco: "moss" },
  { id: "volcano", name: "Lava Peaks", sky: ["#2a0e0e", "#7a1e14", "#ff8a3d"], ground: "#3a1a14",
    mon: ["#ff6b2c", "#ffcf3f", "#b83a2a", "#5a3a3a"], style: "blocks",
    wall: "#2a1414", mortar: "#140808", brick: "#4a2420", brickHi: "#62302a", brickLo: "#381a16",
    ledge: "#3a2a2a", ledgeHi: "#5a4040", ledgeLo: "#1e1414", accent: "#ff6b2c", accent2: "#ffcf3f", light: "#ff9a3d", deco: "lava" },
  { id: "ice", name: "Frozen Tower", sky: ["#123a6a", "#4a8ad1", "#dff6ff"], ground: "#cfeaff",
    mon: ["#7cc8f0", "#ffffff", "#9a8cff", "#4ad1c8"], style: "blocks",
    wall: "#1e3656", mortar: "#16263e", brick: "#4a78a8", brickHi: "#7cb0dc", brickLo: "#38608a",
    ledge: "#bfe4ff", ledgeHi: "#f4fbff", ledgeLo: "#6a9cc8", accent: "#dff6ff", accent2: "#9a8cff", light: "#bfe8ff", deco: "icicles" },
  { id: "clouds", name: "Dream Clouds", sky: ["#8a7bff", "#c9b8ff", "#ffe3f3"], ground: "#ffffff",
    mon: ["#ffb8ec", "#b8e1ff", "#fff1a8", "#c9b8ff"], style: "brick",
    wall: "#4a3e7a", mortar: "#3a2f63", brick: "#8a7cc8", brickHi: "#a89ae0", brickLo: "#6e60ac",
    ledge: "#f4efe2", ledgeHi: "#ffffff", ledgeLo: "#b8a8e0", accent: "#fff1a8", accent2: "#ffb8ec", light: "#fff1a8", deco: "fluff" },
  { id: "space", name: "Star Station", sky: ["#05051a", "#1a1450", "#4a2a8a"], ground: "#2a2a40",
    mon: ["#38e8ff", "#ff5ddf", "#a3ff5d", "#ffd23f"], style: "panels",
    wall: "#16162a", mortar: "#0c0c18", brick: "#2e2e4a", brickHi: "#44446a", brickLo: "#22223a",
    ledge: "#4a4a6a", ledgeHi: "#7a7aa0", ledgeLo: "#22223a", accent: "#38e8ff", accent2: "#ff5ddf", light: "#7af0ff", deco: "lights" },
];

// Shadow Cellar (Cellar runs) — not part of the cycle
export const SHADOW_BIOME = {
  id: "shadow", name: "Shadow Cellar", label: "Shadow Cellar", tier: 0, sky: ["#07060f", "#1d1636", "#3b2a66"], ground: "#120f22",
  mon: ["#3b2a66", "#5a3a8a", "#2a2050", "#7a5ab0"], style: "blocks",
  wall: "#120e20", mortar: "#08060f", brick: "#241c3a", brickHi: "#30264c", brickLo: "#1a142c",
  ledge: "#2a2240", ledgeHi: "#423660", ledgeLo: "#120e20", accent: "#9a7aff", accent2: "#ffd27a", light: "#c9a0ff", deco: "eyes", noWindows: true,
};

const ROMAN = ["", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

// ---------- colour helpers ----------
function hexToRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbToHex(r, g, b) { return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join(""); }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
  }
  return [h, s, l];
}
function hslToRgb(h, s, l) {
  if (!s) return [l * 255, l * 255, l * 255];
  const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}
export function hueShift(hex, deg, satMul = 1) {
  if (typeof hex !== "string" || hex[0] !== "#") return hex;
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return rgbToHex(...hslToRgb((h + deg / 360 + 1) % 1, Math.min(1, s * satMul), l));
}
export function mix(a, b, k) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k);
}
export function shade(hex, k) { return k < 0 ? mix(hex, "#000000", -k) : mix(hex, "#ffffff", k); }

const COLOR_KEYS = ["wall", "mortar", "brick", "brickHi", "brickLo", "ledge", "ledgeHi", "ledgeLo", "accent", "accent2", "light", "ground"];
const cache = new Map();

export function biomeIndex(floor) { return Math.floor((Math.max(1, floor) - 1) / 10); }

export function biomeForFloor(floor) {
  if (floor <= 0) return SHADOW_BIOME;
  const idx = biomeIndex(floor);
  if (cache.has(idx)) return cache.get(idx);
  const b = BIOMES[idx % BIOMES.length];
  const tier = Math.floor(idx / BIOMES.length);
  let out;
  if (tier === 0) out = { ...b, tier, label: b.name };
  else {
    const hue = tier * 40 * (tier % 2 ? 1 : -1);
    out = { ...b, tier, hue, label: `${b.name} ${ROMAN[tier] || tier + 1}` };
    for (const k of COLOR_KEYS) out[k] = hueShift(b[k], hue, 1.1);
    out.sky = b.sky.map((c) => hueShift(c, hue));
    out.mon = b.mon.map((c) => hueShift(c, hue, 1.1));
  }
  cache.set(idx, out);
  return out;
}

// first floor of the land that contains `floor`
export const landStart = (floor) => biomeIndex(floor) * 10 + 1;
