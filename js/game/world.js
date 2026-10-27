// WORLD — the tower cross-section in pixel art + the real-clock sky.
// Shared by the run screen (B) and the home screen (E).
//
// World coordinates: y grows DOWN (like the screen). Floor f's ledge top is at floorY(f) = -f * FH.
// The room of floor f is the space above its ledge; its slab (12 px) is drawn just below the ledge top.
// Screen y = worldY - camY.  Floors < 0 are the Shadow Cellar.
import { biomeForFloor, SHADOW_BIOME, mix, shade } from "./biomes.js";
import { pxText } from "./juice.js";

export { BIOMES, biomeForFloor } from "./biomes.js";

export const FH = 540;          // room height (ledge to ledge)
export const SLAB = 12;         // slab thickness
export const HATCH = { x0: 6, x1: 48 }; // hole in each slab the cat jumps through
export const CAT_X = 64;        // where the cat stands on a ledge
export const floorY = (floor) => -floor * FH;

// stepping stones under the hatch of the NEXT floor (world coords, top surface)
export function stonesFor(floor) {
  const y = floorY(floor);
  return [{ x: 70, y: y - 90 }, { x: 24, y: y - 180 }, { x: 70, y: y - 270 }, { x: 24, y: y - 360 }, { x: 70, y: y - 446 }];
}
// path for the cat from ledge `floor` to ledge `floor+1` (list of landing points)
export function climbPath(floor) {
  return [...stonesFor(floor), { x: CAT_X, y: floorY(floor + 1) }];
}

// ---------------- day phase (real clock, ?hour=NN override) ----------------
export function dayPhase(date = new Date()) {
  let hour = date.getHours() + date.getMinutes() / 60;
  try {
    const q = new URLSearchParams(location.search).get("hour");
    if (q !== null && q !== "" && !isNaN(+q)) hour = ((+q % 24) + 24) % 24;
  } catch {}
  const span = (a, b) => (hour - a) / (b - a);
  if (hour >= 5 && hour < 8) return { phase: "dawn", k: span(5, 8), hour };
  if (hour >= 8 && hour < 18) return { phase: "day", k: span(8, 18), hour };
  if (hour >= 18 && hour < 21) return { phase: "dusk", k: span(18, 21), hour };
  const nh = hour >= 21 ? hour - 21 : hour + 3;
  return { phase: "night", k: nh / 8, hour };
}
const asPhase = (p) => (typeof p === "string" ? { phase: p, k: 0.5, hour: 12 } : p || dayPhase());

// ---------------- helpers ----------------
function hash(a, b = 0, c = 0) {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function disc(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.8));
    ctx.fillRect(Math.round(cx - dx), Math.round(cy + dy), dx * 2 + 1, 1);
  }
}
function mkCanvas(w, h) { const c = document.createElement("canvas"); c.width = Math.max(1, w); c.height = Math.max(1, h); const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; }

// ---------------- SKY ----------------
const SKY = {
  night: ["#090818", "#100f2c", "#18173f", "#221f52", "#2c2862"],
  dawn: ["#26285e", "#5a4a94", "#b46aa0", "#f2909a", "#ffc890"],
  day: ["#2f7ad8", "#4a94e8", "#6eaef0", "#98c8f6", "#c8e4ff"],
  dusk: ["#1d1b4a", "#4e3274", "#a84a6e", "#e8705a", "#ffaa5e"],
};
function lerpPal(a, b, k) { return a.map((c, i) => mix(c, b[i], k)); }
function skyPalette(p) {
  const { phase, k } = p;
  if (phase === "dawn") return k < 0.5 ? lerpPal(SKY.night, SKY.dawn, k * 2) : lerpPal(SKY.dawn, SKY.day, (k - 0.5) * 2);
  if (phase === "dusk") return k < 0.5 ? lerpPal(SKY.day, SKY.dusk, k * 2) : lerpPal(SKY.dusk, SKY.night, (k - 0.5) * 2);
  return SKY[phase];
}
const skyCache = new Map();
function skyCanvas(w, h, p) {
  const kb = p.phase === "dawn" || p.phase === "dusk" ? Math.round(p.k * 20) : 0;
  const key = `${p.phase}:${kb}:${w}:${h}`;
  let c = skyCache.get(key);
  if (c) return c;
  if (skyCache.size > 12) skyCache.clear();
  const pal = skyPalette({ phase: p.phase, k: kb / 20 });
  const [cv, x] = mkCanvas(w, h);
  const n = pal.length, bandH = h / n;
  for (let i = 0; i < n; i++) {
    const y0 = Math.round(i * bandH), y1 = Math.round((i + 1) * bandH);
    x.fillStyle = pal[i]; x.fillRect(0, y0, w, y1 - y0);
    if (i < n - 1) { // dithered seam: 3 rows checker into next colour
      x.fillStyle = pal[i + 1];
      for (let r = 0; r < 3; r++) for (let xx = (r % 2); xx < w; xx += r === 2 ? 1 : 2) {
        if (r === 2 && xx % 4 === 3) continue;
        x.fillRect(xx, y1 - 3 + r, 1, 1);
      }
    }
  }
  skyCache.set(key, cv);
  return cv;
}
const STARS = Array.from({ length: 70 }, (_, i) => ({ x: hash(i, 1), y: hash(i, 2) * hash(i, 7), big: hash(i, 3) < 0.12, tw: hash(i, 4) * 6.28, sp: 1 + hash(i, 5) * 3 }));
const CLOUDS = Array.from({ length: 5 }, (_, i) => ({ x: hash(i, 11), y: 0.08 + hash(i, 12) * 0.45, w: 18 + Math.floor(hash(i, 13) * 22), sp: 2 + hash(i, 14) * 4 }));

function drawCloud(ctx, x, y, w, col, hi) {
  x = Math.round(x); y = Math.round(y);
  ctx.fillStyle = col;
  ctx.fillRect(x, y + 4, w, 4);
  ctx.fillRect(x + 3, y + 2, w - 8, 2);
  ctx.fillRect(x + Math.floor(w * 0.25), y, Math.floor(w * 0.35), 2);
  ctx.fillRect(x + Math.floor(w * 0.55), y + 1, Math.floor(w * 0.25), 1);
  ctx.fillStyle = hi;
  ctx.fillRect(x + Math.floor(w * 0.25), y, Math.floor(w * 0.3), 1);
  ctx.fillRect(x + 3, y + 2, 4, 1);
}

export function drawSky(ctx, w, h, phase, t = 0, { moon = true, moonX, moonY, birds = true, fireflies = false } = {}) {
  const p = asPhase(phase);
  ctx.drawImage(skyCanvas(w, h, p), 0, 0);
  const night = p.phase === "night", day = p.phase === "day";
  // stars
  const starA = night ? 1 : p.phase === "dawn" ? Math.max(0, 1 - p.k * 2.2) : p.phase === "dusk" ? Math.max(0, p.k * 2 - 0.8) : 0;
  if (starA > 0) {
    for (const s of STARS) {
      const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.tw);
      ctx.globalAlpha = starA * tw;
      const sx = Math.round(s.x * w), sy = Math.round(s.y * h * 0.8);
      ctx.fillStyle = s.big ? "#fff6d8" : "#c9d4ff";
      ctx.fillRect(sx, sy, 1, 1);
      if (s.big && tw > 0.8) { ctx.fillRect(sx - 1, sy, 3, 1); ctx.fillRect(sx, sy - 1, 1, 3); }
    }
    ctx.globalAlpha = 1;
  }
  // sun
  if (!night) {
    let sx, sy, col = "#fff2b0", rim = "#ffd34a";
    if (day) { sx = w * (0.12 + 0.76 * p.k); sy = h * 0.1 + (1 - Math.sin(Math.PI * p.k)) * h * 0.18; }
    else if (p.phase === "dawn") { sx = w * 0.18; sy = h * (0.62 - 0.4 * p.k); col = "#ffe2a0"; rim = "#ff9a5a"; }
    else { sx = w * 0.84; sy = h * (0.28 + 0.4 * p.k); col = "#ffd08a"; rim = "#ff6a4a"; }
    ctx.globalAlpha = 0.18; disc(ctx, sx, sy, 13, rim); ctx.globalAlpha = 0.3; disc(ctx, sx, sy, 10, rim); ctx.globalAlpha = 1;
    disc(ctx, sx, sy, 7, rim); disc(ctx, sx - 0.5, sy - 0.5, 6, col);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(sx) - 3, Math.round(sy) - 4, 2, 1);
  }
  // clouds
  const cCol = night ? "#2a2860" : p.phase === "day" ? "#f4f8ff" : "#f6c4c0";
  const cHi = night ? "#3a3878" : "#ffffff";
  ctx.globalAlpha = night ? 0.6 : 0.95;
  for (const c of CLOUDS) {
    const x = ((c.x * (w + 60) + t * c.sp) % (w + 60)) - 50;
    drawCloud(ctx, x, c.y * h, c.w, cCol, cHi);
  }
  ctx.globalAlpha = 1;
  // the stolen moon: dashed outline (story!)
  if (moon) drawMoonOutline(ctx, moonX ?? Math.round(w * 0.76), moonY ?? Math.round(h * 0.13), t, night ? 1 : 0.55);
  // birds by day
  if (birds && (day || (p.phase === "dawn" && p.k > 0.4))) {
    ctx.fillStyle = "#1e2440";
    for (let i = 0; i < 3; i++) {
      const bx = ((t * (10 + i * 2) + i * 70) % (w + 40)) - 20;
      const by = h * (0.22 + i * 0.07) + Math.sin(t * 1.3 + i) * 3;
      const up = Math.floor(t * 5 + i) % 2 === 0;
      const X = Math.round(bx), Y = Math.round(by);
      ctx.fillRect(X, Y, 1, 1);
      if (up) { ctx.fillRect(X - 2, Y - 1, 2, 1); ctx.fillRect(X + 1, Y - 1, 2, 1); ctx.fillRect(X - 3, Y - 2, 1, 1); ctx.fillRect(X + 3, Y - 2, 1, 1); }
      else { ctx.fillRect(X - 3, Y, 3, 1); ctx.fillRect(X + 1, Y, 3, 1); }
    }
  }
  if (fireflies && night) drawFireflies(ctx, 0, h * 0.55, w, h * 0.45, t, 9);
}

export function drawMoonOutline(ctx, x, y, t = 0, alpha = 1) {
  const r = 11;
  const pulse = 0.65 + 0.35 * Math.sin(t * 1.6);
  // faint halo where the moon should be
  ctx.globalAlpha = 0.08 * alpha * pulse; disc(ctx, x, y, r + 5, "#c9d4ff");
  ctx.globalAlpha = 0.9 * alpha * (0.7 + 0.3 * pulse);
  ctx.fillStyle = "#dfe6ff";
  const n = 36, rot = t * 0.25;
  for (let i = 0; i < n; i++) {
    if (((i + Math.floor(t * 2)) >> 1) % 2) continue; // marching dashes
    const a = rot + (i / n) * Math.PI * 2;
    ctx.fillRect(Math.round(x + Math.cos(a) * r), Math.round(y + Math.sin(a) * r), 1, 1);
  }
  // "?" in the middle, very soft
  ctx.globalAlpha = 0.35 * alpha * pulse;
  pxText(ctx, "?", x + 1, y - 2, { color: "#dfe6ff", align: "center", outline: null });
  ctx.globalAlpha = 1;
}

export function drawFireflies(ctx, x, y, w, h, t, n = 8) {
  for (let i = 0; i < n; i++) {
    const fx = x + ((hash(i, 21) * w + Math.sin(t * 0.6 + i * 2.1) * 14) % w + w) % w;
    const fy = y + hash(i, 22) * h + Math.sin(t * 0.9 + i) * 8;
    const on = 0.5 + 0.5 * Math.sin(t * (2 + hash(i, 23) * 2) + i * 3);
    if (on < 0.25) continue;
    ctx.globalAlpha = on * 0.35; ctx.fillStyle = "#e9ff7a";
    ctx.fillRect(Math.round(fx) - 1, Math.round(fy) - 1, 3, 3);
    ctx.globalAlpha = on; ctx.fillStyle = "#fbffc8";
    ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1);
  }
  ctx.globalAlpha = 1;
}

// ---------------- TOWER ----------------
const TINT = { day: null, dawn: ["#ff9a6a", 0.12], dusk: ["#6a2a7a", 0.2], night: ["#0a0a30", 0.3] };
const GLOW_A = { day: 0.1, dawn: 0.28, dusk: 0.4, night: 0.62 };
const windowsFor = (w) => [{ x: Math.round(w * 0.43), y: -196 }, { x: Math.round(w * 0.76), y: -196 }, { x: Math.round(w * 0.3), y: -420 }, { x: Math.round(w * 0.63), y: -420 }]; // relative to ledge
const torchesFor = (w) => [{ x: Math.round(w * 0.595), y: -170 }, { x: Math.round(w * 0.465), y: -394 }];

function brickWall(x, w, h, b, f) {
  x.fillStyle = b.mortar; x.fillRect(0, 0, w, h);
  const pick = (r) => (r < 0.18 ? b.brickLo : r > 0.85 ? b.brickHi : b.brick);
  if (b.style === "planks") {
    for (let row = 0, y = 0; y < h; row++, y += 7) {
      let px = -Math.floor(hash(f, row, 9) * 30);
      while (px < w) {
        const len = 22 + Math.floor(hash(f, row, px) * 30);
        x.fillStyle = pick(hash(row, px, f)); x.fillRect(px + 1, y + 1, len - 1, 6);
        x.fillStyle = b.brickHi; x.fillRect(px + 1, y + 1, len - 1, 1);
        x.fillStyle = b.brickLo; // grain
        const gy = y + 3 + Math.floor(hash(px, row) * 2); x.fillRect(px + 4, gy, Math.floor(len * 0.4), 1);
        x.fillStyle = b.mortar; x.fillRect(px + 2, y + 3, 1, 1); x.fillRect(px + len - 2, y + 3, 1, 1); // nails
        px += len;
      }
    }
  } else if (b.style === "panels") {
    for (let y = 0, row = 0; y < h; y += 18, row++) for (let px = (row % 2) * -12; px < w; px += 26) {
      x.fillStyle = pick(hash(px, row, f)); x.fillRect(px + 1, y + 1, 24, 16);
      x.fillStyle = b.brickHi; x.fillRect(px + 1, y + 1, 24, 1); x.fillRect(px + 1, y + 1, 1, 16);
      x.fillStyle = b.brickLo; x.fillRect(px + 1, y + 16, 24, 1);
      x.fillStyle = b.mortar; x.fillRect(px + 12, y + 4, 1, 10);
      x.fillStyle = b.brickHi; for (const [rx, ry] of [[3, 3], [22, 3], [3, 14], [22, 14]]) x.fillRect(px + rx, y + ry, 1, 1);
    }
  } else {
    const bw = b.style === "blocks" ? 16 : 10, bh = b.style === "blocks" ? 8 : 5;
    for (let row = 0, y = 0; y < h; row++, y += bh) for (let px = row % 2 ? -bw / 2 : 0; px < w; px += bw) {
      const r = hash(px, row + f * 97, 3);
      x.fillStyle = pick(r); x.fillRect(px + 1, y + 1, bw - 1, bh - 1);
      x.fillStyle = b.brickHi; x.fillRect(px + 1, y + 1, bw - 2, 1);
      if (b.style === "blocks") {
        x.fillStyle = b.brickLo; x.fillRect(px + 1, y + bh - 1, bw - 1, 1); x.fillRect(px + bw - 1, y + 1, 1, bh - 1);
        if (r > 0.93) { x.fillStyle = b.mortar; x.fillRect(px + 5, y + 2, 1, 2); x.fillRect(px + 6, y + 4, 2, 1); x.fillRect(px + 8, y + 5, 1, 2); }
      }
    }
  }
}

function decorate(x, w, roomH, b, f) {
  // accents baked into the room (y=0 is room top, roomH is the ledge)
  const d = b.deco;
  const R = (i, k = 0) => hash(f * 31 + i, k, 77);
  if (d === "vines" || d === "moss") {
    for (let i = 0; i < 6; i++) {
      const vx = Math.floor(R(i) * w), len = 12 + Math.floor(R(i, 1) * 40);
      for (let y = 0; y < len; y++) {
        const sx = vx + Math.round(Math.sin(y * 0.35 + i) * 1.5);
        x.fillStyle = y % 5 === 0 ? b.accent : mix(b.accent, "#000000", 0.35); x.fillRect(sx, y, 1, 1);
        if (y % 6 === 3) { x.fillStyle = b.accent; x.fillRect(sx + 1, y, 2, 1); }
        if (d === "vines" && y % 13 === 9) { x.fillStyle = b.accent2; x.fillRect(sx - 1, y, 3, 1); x.fillRect(sx, y - 1, 1, 3); x.fillStyle = "#fff6a8"; x.fillRect(sx, y, 1, 1); }
      }
    }
    if (d === "moss") for (let i = 0; i < 10; i++) { const mx = Math.floor(R(i, 5) * w), my = roomH - 1 - Math.floor(R(i, 6) * 3); x.fillStyle = b.accent; x.globalAlpha = 0.7; x.fillRect(mx, my - 2, 6 + Math.floor(R(i, 7) * 10), 2); x.globalAlpha = 1; }
  } else if (d === "webs") {
    for (const [cx, sgn] of [[0, 1], [w - 1, -1]]) {
      x.fillStyle = b.accent; x.globalAlpha = 0.45;
      for (let i = 0; i < 14; i++) { x.fillRect(cx + sgn * i, i, 1, 1); x.fillRect(cx + sgn * i, 0, 1, 1); x.fillRect(cx, i, 1, 1); }
      for (const r of [5, 10]) for (let i = 0; i <= r; i++) x.fillRect(cx + sgn * i, r - i, 1, 1);
      x.globalAlpha = 1;
    }
    for (let i = 0; i < 3; i++) { const bx = 80 + Math.floor(R(i) * (w - 120)); x.fillStyle = b.brickLo; x.fillRect(bx, roomH - 10, 12, 10); x.fillStyle = b.brickHi; x.fillRect(bx, roomH - 10, 12, 1); x.fillStyle = b.mortar; x.fillRect(bx + 5, roomH - 8, 2, 6); } // boxes
  } else if (d === "sprinkles") {
    const cols = [b.accent, b.accent2, "#ffffff", "#7cf07c"];
    for (let i = 0; i < 70; i++) { x.fillStyle = cols[i % 4]; x.fillRect(Math.floor(R(i) * w), Math.floor(R(i, 1) * roomH), (i % 3) ? 2 : 1, 1); }
  } else if (d === "lava") {
    for (let i = 0; i < 5; i++) {
      let cx = Math.floor(R(i) * w), cy = Math.floor(R(i, 1) * roomH * 0.8);
      for (let s = 0; s < 14; s++) { x.fillStyle = s % 4 ? b.accent : b.accent2; x.fillRect(cx, cy, 1, 1); cx += R(i, s) < 0.5 ? 1 : 0; cy += 1; if (R(i, s + 40) < 0.3) cx -= 1; }
    }
  } else if (d === "icicles") {
    for (let i = 4; i < w; i += 7 + Math.floor(R(i) * 6)) {
      const len = 3 + Math.floor(R(i, 2) * 9);
      for (let y = 0; y < len; y++) { x.fillStyle = y < len / 2 ? b.accent : b.brickHi; const ww = Math.max(1, Math.round(3 * (1 - y / len))); x.fillRect(i - (ww >> 1), y, ww, 1); }
    }
    for (let i = 0; i < 20; i++) { x.fillStyle = "#ffffff"; x.globalAlpha = 0.6; x.fillRect(Math.floor(R(i, 8) * w), Math.floor(R(i, 9) * roomH), 1, 1); x.globalAlpha = 1; }
  } else if (d === "fluff") {
    for (let i = 0; i < 5; i++) { const cx = Math.floor(R(i) * w); x.globalAlpha = 0.5; drawCloud(x, cx, roomH - 9, 20 + Math.floor(R(i, 3) * 16), "#ffffff", "#ffffff"); x.globalAlpha = 1; }
  } else if (d === "lights") {
    for (let i = 0; i < 4; i++) { const px = Math.floor(R(i) * (w - 20)), py = 30 + Math.floor(R(i, 1) * (roomH - 80)); x.fillStyle = b.brickLo; x.fillRect(px, py, 18, 8); x.fillStyle = b.mortar; x.fillRect(px + 1, py + 1, 16, 6); for (let k = 0; k < 4; k++) { x.fillStyle = [b.accent, b.accent2, "#a3ff5d", "#ffd23f"][(k + i) % 4]; x.fillRect(px + 2 + k * 4, py + 3, 2, 2); } }
  }
}

function drawWindowFrame(x, wx, wy, b, night) {
  // arched window 22x32 at (wx,wy) top-left; interior is cleared by caller
  const fr = b.ledgeHi, fd = b.ledgeLo;
  x.fillStyle = fd; x.fillRect(wx - 2, wy + 4, 26, 30); x.fillRect(wx, wy, 22, 6); x.fillRect(wx + 3, wy - 2, 16, 2);
  x.fillStyle = fr; x.fillRect(wx - 1, wy + 5, 24, 28); x.fillRect(wx + 1, wy + 1, 20, 6); x.fillRect(wx + 4, wy - 1, 14, 2);
  // sill
  x.fillStyle = b.ledge; x.fillRect(wx - 4, wy + 33, 30, 3); x.fillStyle = b.ledgeHi; x.fillRect(wx - 4, wy + 33, 30, 1); x.fillStyle = b.ledgeLo; x.fillRect(wx - 3, wy + 36, 28, 1);
}
function windowHole(x, wx, wy) {
  x.clearRect(wx + 1, wy + 6, 20, 26);
  x.clearRect(wx + 3, wy + 3, 16, 3);
  x.clearRect(wx + 6, wy + 1, 10, 2);
}
function windowBars(x, wx, wy, b) {
  x.fillStyle = b.ledgeLo;
  x.fillRect(wx + 10, wy + 1, 2, 31); x.fillRect(wx + 1, wy + 17, 20, 2);
  x.fillStyle = "rgba(255,255,255,0.18)"; x.fillRect(wx + 3, wy + 8, 1, 6); x.fillRect(wx + 13, wy + 21, 1, 4);
}

const chunkCache = new Map();
function chunkKey(f, w, ph, b, info) { return `${f}|${w}|${ph}|${b.id}|${b.tier || 0}|${info}`; }

// one floor chunk: room (FH - SLAB tall) + slab under it. Canvas height FH, top = floorY(f+1) + SLAB.
function buildChunk(f, w, ph, b, { ground = false, foundation = false, plaque = true, boss = false } = {}) {
  const roomH = FH - SLAB;
  const [cv, x] = mkCanvas(w, FH);
  if (foundation) {
    x.fillStyle = "#1a1210"; x.fillRect(0, 0, w, FH);
    for (let i = 0; i < 160; i++) { x.fillStyle = i % 3 ? "#2a1e18" : "#3a2a20"; x.fillRect(Math.floor(hash(i, f, 1) * w), Math.floor(hash(i, f, 2) * FH), 2 + (i % 3), 1 + (i % 2)); }
    return cv;
  }
  brickWall(x, w, roomH, b, f);
  decorate(x, w, roomH, b, f);
  // painted floor number on the wall (top-left, faded)
  if (plaque && f > 0) {
    // big stencilled number + a cloth banner in the land's colours
    x.globalAlpha = 0.22;
    pxText(x, String(f), Math.round(w * 0.5), roomH - 300, { color: b.brickHi, scale: 7, outline: null, align: "center" });
    x.globalAlpha = 1;
    for (const [bx, by, bh] of [[Math.round(w * 0.16), roomH - 250, 34], [Math.round(w * 0.86), roomH - 470, 28]]) {
      x.fillStyle = b.ledgeLo; x.fillRect(bx - 9, by - 2, 18, 2);
      x.fillStyle = "#0e0b16"; x.fillRect(bx - 7, by, 14, bh + 1);
      x.fillStyle = b.accent2 || b.accent; x.fillRect(bx - 6, by, 12, bh - 4);
      x.fillStyle = b.accent; x.fillRect(bx - 6, by + 4, 12, 3); x.fillRect(bx - 6, by + bh - 12, 12, 2);
      for (let i = 0; i < 6; i++) x.fillRect(bx - 6 + i * 2, by + bh - 4, 1, 4 - (i % 2) * 2); // fringe
      x.fillStyle = "#0e0b16"; x.globalAlpha = 0.25; x.fillRect(bx + 3, by, 3, bh - 4); x.globalAlpha = 1;
      pxText(x, "*", bx + 0.5, by + 12, { color: "#fff2a8", align: "center", outline: null });
    }
  }
  // torch bracket
  for (const tp of torchesFor(w)) {
    const ty = roomH + tp.y;
    x.fillStyle = b.ledgeLo; x.fillRect(tp.x - 3, ty + 6, 7, 2); x.fillRect(tp.x - 1, ty + 2, 3, 8);
    x.fillStyle = "#3a2a1a"; x.fillRect(tp.x - 1, ty - 2, 3, 5);
  }
  // windows
  const wins = b.noWindows ? [] : windowsFor(w);
  for (const wd of wins) drawWindowFrame(x, wd.x, roomH + wd.y, b);
  if (b.noWindows) { // cellar grate
    const gx = Math.round(w * 0.7), gy = roomH - 220;
    x.fillStyle = "#08060f"; x.fillRect(gx, gy, 24, 12);
    x.fillStyle = b.ledgeHi; for (let i = 0; i < 6; i++) x.fillRect(gx + 1 + i * 4, gy, 1, 12); x.fillRect(gx, gy, 24, 1); x.fillRect(gx, gy + 11, 24, 1);
  }
  // stepping stones (for the climb to the floor above)
  for (const s of stonesFor(0)) {
    const sy = roomH + s.y;
    x.fillStyle = "#0e0b16"; x.fillRect(s.x - 16, sy - 1, 32, 8);
    x.fillStyle = b.ledgeLo; x.fillRect(s.x - 15, sy, 30, 6);
    x.fillStyle = b.ledge; x.fillRect(s.x - 15, sy, 30, 4);
    x.fillStyle = b.ledgeHi; x.fillRect(s.x - 15, sy, 30, 1);
    x.fillStyle = b.ledgeLo; x.fillRect(s.x - 10, sy + 7, 3, 3); x.fillRect(s.x + 7, sy + 7, 3, 3);
  }
  // pillars at the edges
  x.fillStyle = shade(b.wall, -0.35); x.fillRect(0, 0, 3, roomH); x.fillRect(w - 3, 0, 3, roomH);
  x.fillStyle = b.brickLo; x.fillRect(3, 0, 1, roomH); x.fillRect(w - 4, 0, 1, roomH);
  // ambient shade under the ceiling + floor contact shadow
  x.fillStyle = "rgba(0,0,0,0.28)"; x.fillRect(0, 0, w, 3); x.fillStyle = "rgba(0,0,0,0.14)"; x.fillRect(0, 3, w, 3);
  x.fillStyle = "rgba(0,0,0,0.18)"; x.fillRect(0, roomH - 2, w, 2);
  // phase tint on the walls (windows stay clear)
  const tint = TINT[ph];
  if (tint) { x.globalAlpha = tint[1]; x.fillStyle = tint[0]; x.fillRect(0, 0, w, roomH); x.globalAlpha = 1; }
  for (const wd of wins) windowHole(x, wd.x, roomH + wd.y);
  for (const wd of wins) windowBars(x, wd.x, roomH + wd.y, b);
  // slab
  const y0 = roomH;
  if (ground) {
    x.fillStyle = "#3a2a20"; x.fillRect(0, y0, w, SLAB);
    x.fillStyle = "#4e7a3a"; x.fillRect(0, y0, w, 3); x.fillStyle = "#6ea04a"; x.fillRect(0, y0, w, 1);
    for (let i = 0; i < w; i += 3) if (hash(i, 5) < 0.5) { x.fillStyle = "#6ea04a"; x.fillRect(i, y0 - 1, 1, 1); }
  } else {
    x.fillStyle = b.ledgeLo; x.fillRect(0, y0, w, SLAB);
    x.fillStyle = b.ledge; x.fillRect(0, y0, w, SLAB - 3);
    x.fillStyle = b.ledgeHi; x.fillRect(0, y0, w, 2);
    for (let i = 0; i < w; i += 16) { x.fillStyle = b.ledgeLo; x.fillRect(i, y0 + 3, 1, SLAB - 5); }
    // hatch hole
    x.clearRect(HATCH.x0, y0, HATCH.x1 - HATCH.x0, SLAB);
    x.fillStyle = "rgba(0,0,0,0.5)"; x.fillRect(HATCH.x0, y0, HATCH.x1 - HATCH.x0, SLAB);
    x.fillStyle = b.ledgeHi; x.fillRect(HATCH.x0 - 1, y0, 1, SLAB); x.fillRect(HATCH.x1, y0, 1, SLAB);
    // floor plaque on the slab face
    if (plaque && f !== 0) {
      const label = f < 0 ? `B${-f}` : String(f);
      const pw = Math.max(15, label.length * 4 + 7), px = w - 34 - pw / 2;
      x.fillStyle = "#0e0b16"; x.fillRect(px - 1, y0 + 1, pw + 2, SLAB - 2);
      x.fillStyle = boss ? "#b8323a" : "#2a2238"; x.fillRect(px, y0 + 2, pw, SLAB - 4);
      x.fillStyle = boss ? "#ff6a5a" : "#4a3e60"; x.fillRect(px, y0 + 2, pw, 1);
      pxText(x, label, px + pw / 2 + 0.5, y0 + 3, { color: boss ? "#ffe9a8" : "#f4efe2", align: "center", outline: null });
    }
  }
  return cv;
}

function getChunk(f, w, ph, b, opts) {
  const key = chunkKey(f, w, ph, b, `${opts.ground ? 1 : 0}${opts.foundation ? 1 : 0}${opts.plaque === false ? 0 : 1}${opts.boss ? 1 : 0}`);
  let c = chunkCache.get(key);
  if (c) { chunkCache.delete(key); chunkCache.set(key, c); return c; }
  c = buildChunk(f, w, ph, b, opts);
  chunkCache.set(key, c);
  while (chunkCache.size > 14) chunkCache.delete(chunkCache.keys().next().value);
  return c;
}

const glowCache = new Map();
function glowSprite(color, r) {
  const key = color + r; let g = glowCache.get(key); if (g) return g;
  const [cv, x] = mkCanvas(r * 2 + 1, r * 2 + 1);
  const rings = [[r, 0.16], [Math.round(r * 0.72), 0.22], [Math.round(r * 0.45), 0.3], [Math.round(r * 0.22), 0.4]];
  for (const [rr, a] of rings) { x.globalAlpha = a; disc(x, r, r, rr, color); }
  glowCache.set(key, cv); return cv;
}

/**
 * Draws the visible part of the tower.
 * @param {object} o { w, h, camY, floorFrom=0, floorTo=Infinity, biomeFor, t, trophies=[], phase, x=0, sky=true, plaques=true, bossEvery=5 }
 * trophies: [floor] or [{ floor, draw(ctx, x, y) }] — drawn on that floor's ledge (right side).
 */
export function drawTower(ctx, o) {
  const { w = 240, h, camY, floorFrom = 0, floorTo = Infinity, biomeFor = biomeForFloor, t = 0, trophies = [], x: ox = 0, plaques = true, bossEvery = 5 } = o;
  const p = asPhase(o.phase);
  if (o.sky !== false) drawSky(ctx, w, h, p, t, o.skyOpts || {});
  ctx.save();
  if (ox) ctx.translate(ox, 0);
  const fHi = Math.ceil((SLAB - camY) / FH) + 1, fLo = Math.floor(-(camY + h) / FH) - 1;
  const bOf = (f) => (f < 0 ? SHADOW_BIOME : biomeFor(Math.max(1, f)));
  for (let f = fLo; f <= fHi; f++) {
    if (f > floorTo) continue;
    const top = floorY(f + 1) + SLAB; // chunk top in world
    const sy = Math.round(top - camY);
    if (sy > h || sy + FH < 0) continue;
    const below = f < floorFrom;
    const b = bOf(f);
    const chunk = getChunk(f, w, p.phase, b, { foundation: below, ground: f === 0 && floorFrom >= 0, plaque: plaques, boss: f > 0 && f % bossEvery === 0 });
    ctx.drawImage(chunk, 0, sy);
  }
  // roof above floorTo: open sky stays visible (nothing drawn)
  // dynamic: torches + glow, cellar eyes, blinking lights
  const ga = GLOW_A[p.phase];
  for (let f = fLo; f <= fHi; f++) {
    if (f > floorTo || f < floorFrom) continue;
    const b = bOf(f);
    const ly = Math.round(floorY(f) - camY);
    if (ly < -FH || ly - FH > h) continue;
    for (const [ti, tp] of torchesFor(w).entries()) {
    const tx = tp.x, ty = ly + tp.y - 2;
    if (ty < -40 || ty > h + 40) continue;
    const fl = Math.sin(t * 13 + f + ti) * 0.5 + Math.sin(t * 7.3 + f * 2) * 0.5;
    // glow
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = ga * (0.85 + 0.15 * fl);
    const g = glowSprite(b.light, 34);
    ctx.drawImage(g, tx - 34, ty - 34);
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    // flame (3 frames)
    const fr = Math.floor(t * 10 + f) % 3;
    ctx.fillStyle = "#ff6a2c"; ctx.fillRect(tx - 2, ty - 2, 5, 3);
    ctx.fillStyle = "#ffb43a"; ctx.fillRect(tx - 1, ty - 4 - (fr === 1 ? 1 : 0), 3, 4);
    ctx.fillStyle = "#fff2a8"; ctx.fillRect(tx, ty - 3 - fr % 2, 1, 2);
    if (fr === 2) { ctx.fillStyle = "#ff6a2c"; ctx.fillRect(tx + 1, ty - 6, 1, 1); }
    }
    if (b.deco === "eyes") { // glowing eyes in the dark
      for (let i = 0; i < 3; i++) {
        const blink = (Math.floor(t * 0.7 + i * 1.7 + f) % 5) === 0 && (t * 7 + i) % 1 < 0.3;
        if (blink) continue;
        const ex = Math.round(w * (0.3 + i * 0.22)), ey = ly - 60 - i * 110;
        ctx.fillStyle = i === 1 ? b.accent2 : b.accent;
        ctx.fillRect(ex, ey, 2, 1); ctx.fillRect(ex + 5, ey, 2, 1);
      }
    }
    if (b.deco === "lights") {
      const on = Math.floor(t * 2 + f) % 2;
      ctx.fillStyle = on ? b.accent : b.accent2;
      for (let i = 8; i < w - 8; i += 20) ctx.fillRect(i + (on ? 0 : 10), ly + 5, 2, 2);
    }
  }
  // trophies on boss ledges
  for (const tr of trophies) {
    const f = typeof tr === "number" ? tr : tr.floor;
    const ly = Math.round(floorY(f) - camY);
    if (ly < -40 || ly > h + 40) continue;
    const tx = w - 18;
    if (tr && typeof tr.draw === "function") { tr.draw(ctx, tx, ly); continue; }
    drawTrophy(ctx, tx, ly, t + f);
  }
  if (p.phase === "night") drawFireflies(ctx, 8, 0, w - 16, h, t, 7);
  ctx.restore();
}

export function drawTrophy(ctx, x, y, t = 0) {
  // stone pedestal + golden cup with a crown notch (y = ledge top)
  ctx.fillStyle = "#2a2238"; ctx.fillRect(x - 6, y - 6, 12, 6);
  ctx.fillStyle = "#4a3e60"; ctx.fillRect(x - 6, y - 6, 12, 1);
  ctx.fillStyle = "#b8862a"; ctx.fillRect(x - 4, y - 16, 9, 6); ctx.fillRect(x - 1, y - 10, 3, 4);
  ctx.fillStyle = "#ffcf3f"; ctx.fillRect(x - 4, y - 16, 8, 5); ctx.fillRect(x - 6, y - 15, 2, 3); ctx.fillRect(x + 5, y - 15, 2, 3);
  ctx.fillStyle = "#fff2a8"; ctx.fillRect(x - 3, y - 15, 1, 3);
  if (Math.floor(t * 1.5) % 4 === 0) { ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 2, y - 18, 1, 1); }
}

// smooth camera helper: critically-damped-ish approach
export function approach(cur, target, dt, speed = 6) { return cur + (target - cur) * (1 - Math.exp(-speed * dt)); }
