// ŻYWE NIEBO (fabuła 31–100, docs/STORY-100.md → „Co dzieje się na niebie”).
// Wszystko wyliczane z save.story — bez pól w zapisie. Każdy mieszkaniec pojawia się w dniu, w którym dziecko o nim czyta,
// i zostaje na zawsze. Widać go także w dzień (dzieci grają po szkole).
import { drawFireworks } from "./world.js";

export const SKY_AT = { rainbow: 38, ship: 45, balloon: 47, grey: 60, greyPeak: 85, greyGone: 99, aurora: 63, whale: 70, meteors: 78, comet: 90, festival: 100 };

function art(ctx, x, y, rows, map, flip = false) {
  x = Math.round(x); y = Math.round(y);
  rows.forEach((r, j) => {
    for (let i = 0; i < r.length; i++) {
      const c = map[r[i]];
      if (!c) continue;
      ctx.fillStyle = c; ctx.fillRect(flip ? x + r.length - 1 - i : x + i, y + j, 1, 1);
    }
  });
}

const SHIP = [
  "........Y.....",
  "........YY....",
  "........M.....",
  ".....SSSMSS...",
  "....SSSSMSSS..",
  "...SSSsSMSsSS.",
  "........M.....",
  "HHHHHHHHHHHHHH",
  ".hHHoHHoHHoHh.",
  "..hhhhhhhhhh..",
];
const SHIP_MAP = { Y: "#ffd23f", M: "#5a3a22", S: "#f4efe2", s: "#d8cfb8", H: "#8a5a3a", h: "#5a3a22", o: "#ffe96b" };
const WHALE = [
  ".........................ww.",
  "..........................w.",
  "......BBBBBBBBBBB..........b",
  "....BBBBBBBBBBBBBBB.......bb",
  "..BBBBBBBBBBBBBBBBBBB....bb.",
  ".BBkBBBBBBBBBBBBBBBBBBBBBb..",
  "BBBBBBBBBBBBBBBBBBBBBBBBb...",
  "LLLLLLLLLLLLLLLLLLLBBBb.....",
  ".LLLLLLLLLLLLLLLL..bb.......",
  "...LLLLLLLLLLL..............",
];
const WHALE_MAP = { B: "#6f8fbe", b: "#4a6a9a", L: "#cfe0f5", k: "#1d1d2b", w: "#bfe6ff" };
const BALLOON = [
  "..RRWRR..",
  ".RRWWWRR.",
  "RRRWWWRRR",
  "RRRWWWRRR",
  "RRRWWWRRR",
  ".RRWWWRR.",
  "..RRWRR..",
  "...l.l...",
  "...l.l...",
  "...BcB...",
  "...BBB...",
];
const BALLOON_MAP = { R: "#e8434f", W: "#fff4f4", l: "#5a3a22", B: "#9a6a42", c: "#f4a24c" };
const PARCEL = ["PPPPP", "PrPrP", "rrrrr", "PrPrP", "PPPPP"];
const PARCEL_MAP = { P: "#c98a3a", r: "#e8434f" };
const CHUTE = [".WWWWW.", "WRWRWRW", "l.....l", ".l...l.", "..l.l.."];
const CHUTE_MAP = { W: "#ffffff", R: "#7ec4ff", l: "#9aa5b8" };

// ---- pojedyncze rysunki (eksport dla ekranu głównego) ----
export const drawShip = (ctx, x, y, flip) => art(ctx, x, y, SHIP, SHIP_MAP, flip);
// paczka w skali ×2 (żeby dało się ją trafić palcem); (x, y) = lewy górny róg paczki
export function drawParcel(ctx, x, y, falling, t = 0) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(2, 2);
  if (falling) art(ctx, -1, -6 + Math.round(Math.sin(t * 3)), CHUTE, CHUTE_MAP);
  art(ctx, 0, 0, PARCEL, PARCEL_MAP);
  ctx.restore();
}

// tęcza: łuk za wieżą (most do chmur, str. 38)
function rainbow(ctx, w, h, a) {
  const cols = ["#e8434f", "#ff9a3d", "#ffd23f", "#7ad151", "#3d9bff", "#8a55d6"];
  const cx = w * 0.5, cy = h * 0.66, r0 = w * 0.42;
  ctx.globalAlpha = a;
  cols.forEach((c, i) => {
    ctx.fillStyle = c; const r = r0 - i;
    for (let k = 0; k <= 160; k++) { const ang = Math.PI + (k / 160) * Math.PI; ctx.fillRect(Math.round(cx + Math.cos(ang) * r), Math.round(cy + Math.sin(ang) * r * 0.75), 1, 1); }
  });
  ctx.globalAlpha = 1;
}
// zorza (str. 63): zielono-różowe fale u góry
function aurora(ctx, w, h, t, a) {
  for (let x = 0; x < w; x += 2) {
    const y = h * 0.05 + Math.sin(x * 0.045 + t * 0.5) * 6 + Math.sin(x * 0.12 - t * 0.9) * 3;
    const k = (Math.sin(x * 0.02 + t * 0.3) + 1) / 2;
    for (let j = 0; j < 14; j++) {
      ctx.globalAlpha = a * (1 - j / 14) * (0.5 + 0.5 * Math.sin(x * 0.07 + t));
      ctx.fillStyle = k > 0.5 ? "#4dffb0" : "#ff7ae0";
      ctx.fillRect(x, Math.round(y + j), 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}
// Glitch (szara chmura, str. 60–98): rośnie do 85, potem maleje; w rogu nieba, powoli kłębi się
function grey(ctx, w, h, t, story) {
  if (story < SKY_AT.grey || story >= SKY_AT.greyGone) return;
  const k = story <= SKY_AT.greyPeak ? (story - SKY_AT.grey + 1) / (SKY_AT.greyPeak - SKY_AT.grey + 1) : 1 - (story - SKY_AT.greyPeak) / (SKY_AT.greyGone - SKY_AT.greyPeak);
  const R = 6 + k * 16, cx = w * 0.13, cy = h * 0.1;
  for (let i = 0; i < 7; i++) {
    const ang = i * 0.9 + t * 0.15, rr = R * (0.5 + 0.25 * Math.sin(t * 0.7 + i));
    const x = cx + Math.cos(ang) * R * 0.6, y = cy + Math.sin(ang) * R * 0.35, r = rr;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = i % 2 ? "#8a8fa3" : "#a7abbc";
    for (let yy = -r; yy <= r; yy++) { const hw = Math.sqrt(r * r - yy * yy); ctx.fillRect(Math.round(x - hw), Math.round(y + yy * 0.6), Math.round(hw * 2), 1); }
  }
  // to jest Glitch z fabuły: co chwilę błyskają kolorowe „zepsute piksele”
  if (Math.floor(t * 4) % 3 === 0) {
    const k = Math.floor(t * 4);
    for (let i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.6; ctx.fillStyle = i % 2 ? "#ff4fd8" : "#4dfff0";
      ctx.fillRect(Math.round(cx - R + ((k * (11 + i * 7)) % (R * 2))), Math.round(cy - R * 0.35 + ((k * (5 + i * 3)) % Math.max(1, Math.round(R * 0.7)))), 3 + (i % 3) * 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}
// meteory = spadające zapomniane słowa (str. 78)
function meteors(ctx, w, h, t, a) {
  for (let k = 0; k < 3; k++) {
    const cyc = Math.floor(t * 0.22 + k * 0.37), ph = (t * 0.22 + k * 0.37) % 1;
    if (ph > 0.18) continue;
    const s = Math.sin(cyc * 12.9898 + k * 78.233) * 43758.5453, r = s - Math.floor(s);
    const x0 = 30 + r * (w - 40), y0 = h * 0.04 + r * h * 0.15, d = ph / 0.18;
    for (let i = 0; i < 9; i++) {
      ctx.globalAlpha = a * (1 - i / 9) * (1 - d * 0.5);
      ctx.fillStyle = i ? "#ffe96b" : "#ffffff";
      ctx.fillRect(Math.round(x0 - d * 40 + i), Math.round(y0 + d * 26 - i * 0.65), 1, 1);
    }
  }
  ctx.globalAlpha = 1;
}
// kometa (str. 90): co 40 s przez całe niebo, z długim ogonem
function comet(ctx, w, h, t, a) {
  const ph = (t % 40) / 6;
  if (ph > 1) return;
  const x = -20 + ph * (w + 40), y = h * 0.08 + ph * h * 0.1;
  for (let i = 0; i < 34; i++) {
    ctx.globalAlpha = a * (1 - i / 34);
    ctx.fillStyle = i < 3 ? "#ffffff" : i % 3 ? "#9df2ff" : "#bfe6ff";
    ctx.fillRect(Math.round(x - i), Math.round(y - i * 0.3), 1, i < 3 ? 2 : 1);
  }
  ctx.globalAlpha = 1;
}

// gwiazdozbiór ożywa: grupa gwiazd przelatuje przez niebo (~6 s). c = SKY[i], ruch zależny od nazwy.
export const SHOW_LEN = 6;
const MOVES = { FISH: [4, 3], MOUSE: [2, 6], BIRD: [7, 1.5], BOAT: [2, 1], KEY: [1, 2], OWL: [5, 1.2], KITE: [10, 0.8], BELL: [3, 4], TREE: [1, 1], GHOST: [8, 1], FROG: [9, 3], ROBOT: [2, 5], HOUSE: [1, 1], CAT: [6, 2.5] };
export function drawConstellationShow(ctx, c, w, h, k, t, alpha = 1) {
  const [amp, freq] = MOVES[c.name] || [4, 2];
  const x0 = -26 + k * (w + 52), y0 = h * 0.18 + Math.sin(k * Math.PI * 2 * freq) * amp - (c.name === "KITE" ? k * 20 : 0);
  const P = c.pts.map(([px, py]) => [x0 + px, y0 + py]);
  ctx.fillStyle = "#9fb4ff"; ctx.globalAlpha = 0.5 * alpha;
  for (const [a, b] of c.lines) { const A = P[a], B = P[b], n = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); for (let i = 1; i < n; i++) ctx.fillRect(Math.round(A[0] + (B[0] - A[0]) * i / n), Math.round(A[1] + (B[1] - A[1]) * i / n), 1, 1); }
  for (const [px, py] of P) { ctx.globalAlpha = alpha; ctx.fillStyle = "#fff6c8"; ctx.fillRect(Math.round(px) - 1, Math.round(py), 3, 1); ctx.fillRect(Math.round(px), Math.round(py) - 1, 1, 3); }
  // iskierki za grupą
  ctx.globalAlpha = alpha * 0.6; ctx.fillStyle = "#ffe96b";
  for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x0 - 4 - i * 5), Math.round(y0 + 6 + Math.sin(t * 8 + i) * 3), 1, 1);
  ctx.globalAlpha = 1;
}

// tło-mieszkańcy: rysowane PO drawSky, PRZED wieżą
export function drawSkyLife(ctx, w, h, phase, t, story) {
  if (!story) return;
  const night = phase === "night", day = phase === "day";
  const a = night ? 1 : day ? 0.55 : 0.8;
  if (story >= SKY_AT.aurora) aurora(ctx, w, h, t, night ? 0.35 : 0.12);
  if (story >= SKY_AT.rainbow) rainbow(ctx, w, h, night ? 0.22 : 0.45);
  grey(ctx, w, h, t, story);
  if (story >= SKY_AT.whale) { const ph = (t % 90) / 30; if (ph < 1) art(ctx, w + 10 - ph * (w + 50), h * 0.2 + Math.sin(t * 0.8) * 2, WHALE, WHALE_MAP); }
  if (story >= SKY_AT.balloon) art(ctx, ((t * 3) % (w + 30)) - 15, h * 0.3 + Math.sin(t * 0.6) * 4, BALLOON, BALLOON_MAP);
  if (story >= SKY_AT.meteors) meteors(ctx, w, h, t, a);
  if (story >= SKY_AT.comet) comet(ctx, w, h, t, a);
  if (story >= SKY_AT.festival && !day) drawFireworks(ctx, w, h * 0.45, t);
}
