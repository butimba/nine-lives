// SKÓRKI RYSOWANE PRZEZ DZIECI („custom:<id>”).
// Dziecko maluje na szablonie kota (klatka 0 = siedzący kot, rozmiar jak prawdziwy sprite).
// pixels = string TEMPLATE.w*TEMPLATE.h znaków: '.' = poza kotem, inaczej klucz koloru z PAL (js/pixel/palette.js).
// Ten moduł zamienia rysunek na pełną, animowaną skórkę: każda klatka (skok, atak, taniec…) bierze kolor
// z najbliższej pomalowanej komórki tej samej części ciała (futro / brzuszek / łapki / uszy). Cieniowanie
// (H, S, X, Z, b w szablonie kota) dokładane jest automatycznie, więc nawet płaski rysunek wygląda jak pixel art.
import { CAT_TEMPLATE, CAT_W, CAT_H, setCustomSkinHook, forgetSkin } from './cat.js';
import { PAL, shade, mix } from './palette.js';
import { SKINS } from '../../data/cosmetics.js';

const { W, H, HEAD, FRAMES, CHAR_FRAMES } = CAT_TEMPLATE;
const PADX = (CAT_W - W) / 2, PADT = CAT_H - H - 1;

// ograniczona paleta edytora (2 rzędy po 10) — klucze z PAL
export const EDIT_PALETTE = ['k', 'g', 'l', 'w', 'W', 'N', 't', 'T', 'R', 'p', 'P', 'O', 'y', 'e', 'E', 'A', 'b', 'B', 'V', 'm'];
const OK_CHARS = new Set([...EDIT_PALETTE, ...Object.keys(PAL).filter((k) => k !== '.')]);

const LOCK = new Set(['k', 'W', 'I']);           // oczy, pyszczek — zawsze widoczne (kot ma twarz)
const SHADE = { H: -0.16, S: -0.16, X: -0.16, Z: -0.16, b: -0.12, L: 0.1 };
const IRIS = '#3fae5a';
const clsOf = (ch) => (ch === 'E' ? 'ear' : ch === 'B' || ch === 'b' ? 'belly' : ch === 'z' || ch === 'Z' ? 'feet' : ch === 'N' ? 'nose' : ch === 'p' ? 'cheek' : 'fur');
const DEFAULT = { fur: 'w', belly: 'W', feet: 'w', ear: 'P', nose: 'p', cheek: 'P' };

// ---------- szablon: klatka 0, przycięta do kota ----------
const F0 = FRAMES[0], G0 = CHAR_FRAMES[0];
const isHead = (f, x, y) => { const lx = x - f.hx, ly = y - f.hy; return ly >= 0 && ly < HEAD.length && lx >= 0 && lx < HEAD[ly].length && HEAD[ly][lx] !== '.'; };
let x0 = W, y0 = H, x1 = 0, y1 = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (G0[y][x] !== '.') { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
const EW = x1 - x0 + 1, EH = y1 - y0 + 1;
const cells = new Array(EW * EH).fill(null);
for (let y = 0; y < EH; y++) for (let x = 0; x < EW; x++) {
  const ch = G0[y + y0][x + x0];
  if (ch === '.') continue;
  cells[y * EW + x] = { ch, cls: clsOf(ch), locked: LOCK.has(ch), head: isHead(F0, x + x0, y + y0), shade: SHADE[ch] || 0 };
}
export const TEMPLATE = { w: EW, h: EH, cells, ox: x0, oy: y0 };
const idx = (fx, fy) => (fy - y0) * EW + (fx - x0); // współrzędne klatki 0 → indeks szablonu
const paintable = cells.map((c, i) => (c && !c.locked ? i : -1)).filter((i) => i >= 0);

export function blankPixels() {
  return cells.map((c) => (!c ? '.' : c.locked ? '.' : DEFAULT[c.cls])).join('');
}
export function isValidPixels(p) {
  if (typeof p !== 'string' || p.length !== EW * EH) return false;
  for (let i = 0; i < p.length; i++) { const ch = p[i]; if (ch !== '.' && !OK_CHARS.has(ch)) return false; if (ch !== '.' && (!cells[i] || cells[i].locked)) return false; }
  return true;
}
// kolor komórki szablonu tak, jak zobaczy go dziecko w edytorze (z cieniowaniem)
export function cellColor(pixels, i) {
  const c = cells[i];
  if (!c) return null;
  if (c.locked) return c.ch === 'I' ? IRIS : PAL[c.ch];
  const base = PAL[pixels[i]] || PAL[DEFAULT[c.cls]];
  return c.shade ? shade(base, c.shade) : base;
}

// ---------- mapa: komórka dowolnej klatki → komórka szablonu ----------
const nearest = (px, py, pred) => {
  let best = -1, bd = 1e9;
  for (const i of paintable) {
    const c = cells[i];
    if (!pred(c)) continue;
    const dx = (i % EW) + x0 - px, dy = Math.floor(i / EW) + y0 - py, d = dx * dx + dy * dy * 1.2;
    if (d < bd) { bd = d; best = i; }
  }
  return best;
};
function bodyBox(rows) {
  let a = 99, b = 99, c = -1, d = -1;
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch !== '.') { a = Math.min(a, x); b = Math.min(b, y); c = Math.max(c, x); d = Math.max(d, y); } }));
  return { x: a, y: b, w: c - a + 1, h: d - b + 1 };
}
// ramka body = części poza głową w klatce
function bodyCellsBox(fi) {
  const f = FRAMES[fi], g = CHAR_FRAMES[fi];
  const pts = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (g[y][x] !== '.' && !isHead(f, x, y)) pts.push([x, y]);
  return bodyBox(Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (pts.some((p) => p[0] === x && p[1] === y) ? 'F' : '.')).join('')));
}
const BOX0 = bodyCellsBox(0);
const MAPS = CHAR_FRAMES.map((g, fi) => {
  const f = FRAMES[fi];
  const box = fi === 0 || f.body === F0.body ? BOX0 : bodyCellsBox(fi);
  const m = new Int16Array(W * H).fill(-1);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = g[y][x];
    if (ch === '.' || LOCK.has(ch)) continue;
    let t = -1;
    if (isHead(f, x, y)) {
      const tx = x - f.hx + F0.hx, ty = y - f.hy + F0.hy, ti = idx(tx, ty);
      t = cells[ti] && !cells[ti].locked ? ti : nearest(tx, ty, (c) => c.head);
    } else {
      const u = box.w > 1 ? (x - box.x) / (box.w - 1) : 0, v = box.h > 1 ? (y - box.y) / (box.h - 1) : 0;
      const tx = BOX0.x + Math.round(u * (BOX0.w - 1)), ty = BOX0.y + Math.round(v * (BOX0.h - 1));
      const cls = clsOf(ch), ti = tx >= x0 && ty >= y0 && tx <= x1 && ty <= y1 ? idx(tx, ty) : -1;
      t = ti >= 0 && cells[ti] && !cells[ti].locked && !cells[ti].head && cells[ti].cls === cls ? ti : nearest(tx, ty, (c) => !c.head && c.cls === cls);
      if (t < 0) t = nearest(tx, ty, (c) => !c.head);
    }
    m[y * W + x] = t;
  }
  return m;
});

function frameGrid(pixels, fi) {
  const g = CHAR_FRAMES[fi], m = MAPS[fi];
  const out = new Array(CAT_W * CAT_H).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = g[y][x];
    if (ch === '.') continue;
    let col;
    if (LOCK.has(ch)) col = ch === 'I' ? IRIS : PAL[ch];
    else {
      const t = m[y * W + x];
      const c = t >= 0 ? cells[t] : null;
      const base = PAL[t >= 0 ? pixels[t] : ''] || PAL[DEFAULT[clsOf(ch)]] || PAL.w;
      const sh = SHADE[ch] || 0;
      col = sh ? shade(base, sh) : base;
      if (ch === 'p' && c && c.cls !== 'cheek') col = mix(base, '#ff7d9a', 0.45);
    }
    out[(y + PADT) * CAT_W + x + PADX] = col;
  }
  return out;
}

// ---------- rejestr skórek ----------
const store = new Map(); // 'custom:<id>' -> { pixels, name }
setCustomSkinHook((id) => {
  const r = store.get(id);
  if (!r) return null;
  const skin = { id, name: r.name || 'My Cat', rarity: 'epic', pattern: 'none', fx: [], custom: true,
    colors: { fur: PAL[r.pixels[paintable[0]]] || PAL.w, belly: PAL.W, stripe: PAL.l, ear: PAL.P, eye: IRIS, nose: PAL.p } };
  return { skin, grid: (fi) => frameGrid(r.pixels, fi) };
});

export function registerSkin(id, pixels, { name } = {}) {
  if (!isValidPixels(pixels)) return false;
  const prev = store.get(id);
  if (prev && prev.pixels === pixels && prev.name === name) return true;
  store.set(id, { pixels, name });
  forgetSkin(id);
  return true;
}
export const hasSkin = (id) => store.has(id);
export const skinPixels = (id) => (store.get(id) || {}).pixels || null;

// zatwierdzone skórki z chmury → katalog (kolejka nagród za bossa tygodnia, po istniejących). Bez autora.
export function addCommunitySkins(rows = []) {
  const list = rows.filter((r) => r && r.id && isValidPixels(r.pixels)).sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  let added = 0;
  list.forEach((r, i) => {
    const id = 'custom:' + r.id;
    registerSkin(id, r.pixels, { name: r.name });
    const name = String(r.name || 'Kids Cat').slice(0, 24);
    const ex = SKINS.find((s) => s.id === id);
    if (ex) { ex.name = name; return; }
    SKINS.push({ id, name, rarity: 'epic', source: 'weekly', order: 1000 + i, pattern: 'none', community: true,
      colors: { fur: '#f4efe2', belly: '#ffffff', stripe: '#b7b0c8', ear: '#ffc9d3', eye: IRIS, nose: '#ff8fa3' } });
    added++;
  });
  return added;
}
