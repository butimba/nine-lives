// ŻYWE NIEBO (fabuła, docs/STORY-100.md → „Niebo”). Wszystko wyliczane z save.story — bez pól w zapisie.
// Każde zjawisko pojawia się w dniu, w którym dziecko o nim czyta. Warstwy (od tyłu): gradient → gwiazdy tła → zorza →
// gwiazdozbiory → Księżyc (world.js drawSky) → tęcza, Glitch, wieloryb, balon, meteory, kometa (tu) → wzgórza → wieża.
// Skala: 1 px logiczny, paleta gry; dzień = bez gwiazd tła, gwiazdozbiory blade; noc = wszystko.
import { drawFireworks, bitXY } from "./world.js";
import { pxText } from "./juice.js";

// glitch* = szara chmura Glitcha (od 36 widać ją z dachu, 40 otwiera oko, 60 wielka, od 86 maleje, 99 = gwiazda Bit)
export const SKY_AT = { glitch: 36, glitchEye: 40, glitchBig: 60, glitchShrink: 86, bit: 99, rainbow: 38, ship: 45, balloon: 47, aurora: 63, whale: 70, meteors: 78, comet: 90, festival: 100 };

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

// tęcza (str. 38: „A rainbow is shy. It never stays long.”): tylko za dnia, nie codziennie (~połowa dni),
// mała, z boku wieży, wyrasta zza wzgórz; strona i wielkość zależą od dnia; pojawia się na ~50 s co 2 min.
const dayNo = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / 864e5);
const rnd = (a, b) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
const RAINBOW = ["#e8434f", "#ff9a3d", "#ffd23f", "#7ad151", "#3d9bff", "#8a55d6"];
export function rainbowToday(d = dayNo()) {
  if (rnd(d, 1) > 0.55) return null;
  const left = rnd(d, 2) < 0.5, r = 15 + Math.floor(rnd(d, 3) * 9);
  return { cx: left ? 18 + Math.floor(rnd(d, 4) * 22) : 200 + Math.floor(rnd(d, 4) * 22), r };
}
function rainbow(ctx, w, h, t, a) {
  const rb = rainbowToday();
  if (!rb) return;
  const cyc = t % 120, k = cyc < 50 ? Math.min(1, cyc / 6, (50 - cyc) / 6) : 0;
  if (k <= 0) return;
  const base = h - 42; // stopy tęczy chowają się za wzgórzami
  RAINBOW.forEach((c, i) => {
    const r = rb.r - i;
    ctx.fillStyle = c;
    for (let x = -r; x <= r; x++) {
      const y = Math.round(Math.sqrt(r * r - x * x));
      const fade = Math.min(1, y / (r * 0.5)); // im niżej, tym bledsza (dither przez alfę)
      ctx.globalAlpha = a * k * (0.35 + 0.65 * fade);
      ctx.fillRect(rb.cx + x, base - y, 1, 1);
      if (Math.abs(x) > r * 0.7) ctx.fillRect(rb.cx + x, base - y - 1, 1, 1); // domknięcie boków łuku
    }
  });
  ctx.globalAlpha = 1;
}
// zorza (str. 63): zielono-różowe fale u góry — tylko o zmierzchu i w nocy
function aurora(ctx, w, h, t, a) {
  for (let x = 0; x < w; x += 2) {
    const y = h * 0.04 + Math.sin(x * 0.045 + t * 0.5) * 6 + Math.sin(x * 0.12 - t * 0.9) * 3;
    const k = (Math.sin(x * 0.02 + t * 0.3) + 1) / 2;
    for (let j = 0; j < 14; j += 1) {
      ctx.globalAlpha = a * (1 - j / 14) * (0.5 + 0.5 * Math.sin(x * 0.07 + t));
      ctx.fillStyle = j < 3 ? "#bfffe0" : k > 0.5 ? "#4dffb0" : "#ff7ae0";
      ctx.fillRect(x, Math.round(y + j), 2, 1);
    }
  }
  ctx.globalAlpha = 1;
}
// Glitch: ciemna, kłębiąca się chmura pikseli po lewej stronie wieży (bitXY), zasłania gwiazdy. Rośnie z fabułą, rzędy pikseli „przeskakują”,
// błyskają zepsute kolory; od strony 40 ma jedno oko, które patrzy na wieżę. Od 99 w tym miejscu świeci Bit (world.js).
export function glitchSize(story) {
  if (story < SKY_AT.glitch || story >= SKY_AT.bit) return 0;
  if (story < SKY_AT.glitchBig) return 0.25 + 0.35 * (story - SKY_AT.glitch) / (SKY_AT.glitchBig - SKY_AT.glitch);
  if (story < SKY_AT.glitchShrink) return 0.8 + 0.2 * (story - SKY_AT.glitchBig) / (SKY_AT.glitchShrink - SKY_AT.glitchBig);
  return 1 - 0.75 * (story - SKY_AT.glitchShrink + 1) / (SKY_AT.bit - SKY_AT.glitchShrink);
}
function glitch(ctx, w, h, t, story, a) {
  const k = glitchSize(story);
  if (!k) return;
  const [cx, cy] = bitXY(h), R = 6 + k * 20, tick = Math.floor(t * 8), glitchy = tick % 7 < 2;
  const cols = ["#2e2a48", "#3c3760", "#4c4670"];
  for (let i = 0; i < 6; i++) {
    const ang = i * 1.05 + t * 0.12, r = R * (0.42 + 0.12 * Math.sin(t * 0.7 + i * 1.3));
    const x = cx + Math.cos(ang) * R * 0.55, y = cy + Math.sin(ang) * R * 0.22;
    ctx.fillStyle = cols[i % 3]; ctx.globalAlpha = a * 0.9;
    for (let yy = -Math.round(r * 0.6); yy <= Math.round(r * 0.6); yy++) {
      const hw = Math.sqrt(Math.max(0, r * r - (yy / 0.6) * (yy / 0.6))), row = Math.round(y + yy);
      const off = glitchy && rnd(tick, row) < 0.25 ? Math.round((rnd(row, tick) - 0.5) * 8) : 0;
      ctx.fillRect(Math.round(x - hw) + off, row, Math.round(hw * 2), 1);
    }
  }
  // zepsute piksele (magenta/cyjan)
  for (let i = 0; i < 2 + Math.round(k * 4); i++) {
    if (rnd(tick, i + 9) < 0.5) continue;
    ctx.globalAlpha = a * 0.8; ctx.fillStyle = i % 2 ? "#ff4fd8" : "#4dfff0";
    ctx.fillRect(Math.round(cx - R * 0.8 + rnd(i, tick) * R * 1.6), Math.round(cy - R * 0.3 + rnd(tick, i) * R * 0.6), 2 + (i % 3), 1);
  }
  // oko (od str. 40) patrzy w stronę wieży, czasem mruga
  if (story >= SKY_AT.glitchEye && k > 0.3 && Math.floor(t * 0.5) % 6) {
    const ex = Math.round(cx + R * 0.15), ey = Math.round(cy - 1);
    ctx.globalAlpha = a; ctx.fillStyle = "#e9e4ff"; ctx.fillRect(ex - 2, ey, 5, 3); ctx.fillRect(ex - 1, ey - 1, 3, 5);
    ctx.fillStyle = story >= SKY_AT.glitchShrink ? "#6fe3d3" : "#ff4fd8"; ctx.fillRect(ex + 1, ey + 1, 1, 1);
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
  for (const [a, b] of c.lines) { const A = P[a], B = P[b], n = Math.max(Math.abs(B[0] - A[0]), Math.abs(B[1] - A[1])); for (let i = 2; i < n - 1; i += 2) ctx.fillRect(Math.round(A[0] + (B[0] - A[0]) * i / n), Math.round(A[1] + (B[1] - A[1]) * i / n), 1, 1); }
  for (const [px, py] of P) { ctx.globalAlpha = alpha; ctx.fillStyle = "#fff6c8"; ctx.fillRect(Math.round(px) - 1, Math.round(py), 3, 1); ctx.fillRect(Math.round(px), Math.round(py) - 1, 1, 3); ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
  // iskierki za grupą
  ctx.globalAlpha = alpha * 0.6; ctx.fillStyle = "#ffe96b";
  for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(x0 - 4 - i * 5), Math.round(y0 + 6 + Math.sin(t * 8 + i) * 3), 1, 1);
  // zdanie, z którego narodził się gwiazdozbiór (moc kota = dobre zdania), widoczne w środku przelotu
  // (wieża zasłania środek, więc zdanie pojawia się w pasie nieba, przez który akurat leci: max 14 znaków w linii)
  const mid = x0 + 16, side = mid < 66 ? 30 : mid > w - 66 ? w - 30 : 0;
  if (c.say && side) {
    const lines = c.say.split(" ").reduce((L, wd) => { const last = L[L.length - 1]; if (last && (last + " " + wd).length <= 14) L[L.length - 1] = last + " " + wd; else L.push(wd); return L; }, []);
    ctx.globalAlpha = alpha;
    lines.forEach((ln, j) => pxText(ctx, ln, side, Math.round(y0 + 26 + j * 7), { color: "#fff6c8", align: "center" }));
  }
  ctx.globalAlpha = 1;
}

// tło-mieszkańcy: rysowane PO drawSky, PRZED wzgórzami i wieżą
export function drawSkyLife(ctx, w, h, phase, t, story) {
  if (!story) return;
  const night = phase === "night", day = phase === "day";
  const a = night ? 1 : day ? 0.55 : 0.8;
  if (story >= SKY_AT.aurora && !day && phase !== "dawn") aurora(ctx, w, h, t, night ? 0.35 : 0.15);
  if (story >= SKY_AT.rainbow && !night) rainbow(ctx, w, h, t, day ? 0.9 : 0.5);
  glitch(ctx, w, h, t, story, night ? 1 : 0.85);
  if (story >= SKY_AT.whale) { const ph = (t % 90) / 30; if (ph < 1) art(ctx, w + 10 - ph * (w + 50), h * 0.2 + Math.sin(t * 0.8) * 2, WHALE, WHALE_MAP); }
  if (story >= SKY_AT.balloon) art(ctx, ((t * 3) % (w + 30)) - 15, h * 0.3 + Math.sin(t * 0.6) * 4, BALLOON, BALLOON_MAP);
  if (story >= SKY_AT.meteors && !day) meteors(ctx, w, h, t, a);
  if (story >= SKY_AT.comet) comet(ctx, w, h, t, a);
  if (story >= SKY_AT.festival && !day) drawFireworks(ctx, w, h * 0.45, t);
}
