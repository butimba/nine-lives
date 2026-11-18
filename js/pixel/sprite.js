// Text pixel-maps -> cached canvases.
// defineSprite({ id, w, h, frames: string[][], map, anchor, points, outline })
//  - frames: array of frames, each an array of row strings (one char = one pixel). A single string[] is accepted too.
//  - map: { ch: '#hex' | PALkey | null }, falls back to PAL[ch].
//  - outline (extra, optional): colour/PAL key. Adds a 1px outline by 4-neighbour dilation; sprite grows by 1px
//    on each side and anchor/points shift by +1 automatically.
import { PAL } from './palette.js';

const isDoc = typeof document !== 'undefined';
function mkCanvas(w, h) {
  if (isDoc) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  return new OffscreenCanvas(w, h);
}
export { mkCanvas as makeCanvas };

function resolve(v) {
  if (v == null) return null;
  if (typeof v === 'string' && v[0] === '#') return v;
  if (v in PAL) return PAL[v];
  return v;
}

const rgbCache = new Map();
function rgba(hex) {
  let r = rgbCache.get(hex);
  if (r) return r;
  let h = hex.slice(1);
  let a = 255;
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length === 8) { a = parseInt(h.slice(6), 16); h = h.slice(0, 6); }
  const n = parseInt(h, 16);
  r = [(n >> 16) & 255, (n >> 8) & 255, n & 255, a];
  rgbCache.set(hex, r);
  return r;
}

// Parse rows into a colour grid (array of hex|null), width w, height h.
function parseFrame(rows, w, h, map, hexMap) {
  const px = new Array(w * h).fill(null);
  for (let y = 0; y < h; y++) {
    const row = rows[y] || '';
    for (let x = 0; x < w; x++) {
      const ch = row[x];
      if (ch === undefined || ch === '.' || ch === ' ') continue;
      let col = ch in map ? resolve(map[ch]) : PAL[ch] ?? null;
      if (col && hexMap && hexMap[col] !== undefined) col = hexMap[col];
      px[y * w + x] = col;
    }
  }
  return px;
}

function addOutline(px, w, h, col) {
  const W = w + 2, H = h + 2;
  const out = new Array(W * H).fill(null);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[(y + 1) * W + x + 1] = px[y * w + x];
  const res = out.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (out[y * W + x]) continue;
    if ((x > 0 && out[y * W + x - 1]) || (x < W - 1 && out[y * W + x + 1]) || (y > 0 && out[(y - 1) * W + x]) || (y < H - 1 && out[(y + 1) * W + x]))
      res[y * W + x] = col;
  }
  return res;
}

export function gridToCanvas(px, w, h, mode) {
  const c = mkCanvas(w, h);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < px.length; i++) {
    const col = px[i];
    if (!col) continue;
    const [r, g, b, a] = rgba(col);
    const o = i * 4;
    if (mode === 'flash') { d[o] = d[o + 1] = d[o + 2] = 255; d[o + 3] = a; }
    else if (mode === 'sil') { d[o] = 14; d[o + 1] = 11; d[o + 2] = 22; d[o + 3] = a; }
    else { d[o] = r; d[o + 1] = g; d[o + 2] = b; d[o + 3] = a; }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

let autoId = 0;
export function defineSprite(def) {
  let { id, w, h, frames, map = {}, anchor, points, outline, hexMap } = def;
  if (typeof frames[0] === 'string') frames = [frames];
  h = h || frames[0].length;
  w = w || Math.max(...frames[0].map((r) => r.length));
  const oc = outline ? resolve(outline === true ? 'k' : outline) : null;
  const pad = oc ? 1 : 0;
  const grids = frames.map((rows) => {
    const g = parseFrame(rows, w, h, map, hexMap);
    return oc ? addOutline(g, w, h, oc) : g;
  });
  const W = w + pad * 2, H = h + pad * 2;
  const anc = anchor ? { x: anchor.x + pad, y: anchor.y + pad } : { x: Math.floor(W / 2), y: H };
  const pts = (points || []).map((p) => {
    const o = {};
    for (const k in p) o[k] = p[k] ? { x: p[k].x + pad, y: p[k].y + pad } : p[k];
    return o;
  });
  const cache = new Map();
  return fromGrids({ id: id || 'spr' + autoId++, w: W, h: H, grids, anchor: anc, points: pts, def: { ...def, frames, w, h } }, cache);
}

// Build a sprite straight from colour grids (used by procedural modules).
export function spriteFromGrids({ id, w, h, grids, anchor, points }) {
  return fromGrids({ id: id || 'spr' + autoId++, w, h, grids, anchor: anchor || { x: Math.floor(w / 2), y: h }, points: points || [], def: null }, new Map());
}

function fromGrids(o, cache) {
  const spr = {
    id: o.id, w: o.w, h: o.h, nFrames: o.grids.length, anchor: o.anchor, points: o.points,
    grids: o.grids, def: o.def,
    canvas(frame = 0, mode = '') {
      const f = ((frame % spr.nFrames) + spr.nFrames) % spr.nFrames;
      const key = f + mode;
      let c = cache.get(key);
      if (!c) { c = gridToCanvas(o.grids[f], o.w, o.h, mode); cache.set(key, c); }
      return c;
    },
  };
  return spr;
}

// recolor(sprite, { ch: colour } | { '#oldhex': '#newhex' }, newId)
export function recolor(sprite, mapOverride = {}, newId) {
  const charMap = {}, hexMap = {};
  for (const k in mapOverride) (k[0] === '#' ? hexMap : charMap)[k] = resolve(mapOverride[k]);
  if (sprite.def && Object.keys(charMap).length) {
    return defineSprite({ ...sprite.def, id: newId || sprite.id + '_rc', map: { ...sprite.def.map, ...charMap }, hexMap: { ...(sprite.def.hexMap || {}), ...hexMap } });
  }
  const grids = sprite.grids.map((g) => g.map((c) => (c && hexMap[c] !== undefined ? hexMap[c] : c)));
  return spriteFromGrids({ id: newId || sprite.id + '_rc', w: sprite.w, h: sprite.h, grids, anchor: sprite.anchor, points: sprite.points });
}

// x,y = anchor position in logical px.
export function drawSprite(ctx, sprite, frame = 0, x = 0, y = 0, { scale = 1, flip = false, alpha = 1, flash = false, silhouette = false } = {}) {
  if (!sprite) return;
  const c = sprite.canvas(frame, flash ? 'flash' : silhouette ? 'sil' : '');
  const ax = flip ? sprite.w - sprite.anchor.x : sprite.anchor.x;
  const dx = Math.round(x - ax * scale), dy = Math.round(y - sprite.anchor.y * scale);
  const prevA = ctx.globalAlpha;
  if (alpha !== 1) ctx.globalAlpha = prevA * alpha;
  ctx.imageSmoothingEnabled = false;
  if (flip) {
    ctx.save();
    ctx.translate(dx + sprite.w * scale, dy);
    ctx.scale(-1, 1);
    ctx.drawImage(c, 0, 0, sprite.w * scale, sprite.h * scale);
    ctx.restore();
  } else {
    ctx.drawImage(c, dx, dy, sprite.w * scale, sprite.h * scale);
  }
  ctx.globalAlpha = prevA;
}

const urlCache = new Map();
export function spriteURL(sprite, frame = 0, scale = 3, mode = '') {
  const key = sprite.id + '|' + frame + '|' + scale + '|' + mode;
  let u = urlCache.get(key);
  if (u) return u;
  const c = mkCanvas(sprite.w * scale, sprite.h * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sprite.canvas(frame, mode), 0, 0, sprite.w * scale, sprite.h * scale);
  u = canvasURL(c);
  urlCache.set(key, u);
  return u;
}
export function canvasURL(c) {
  if (c.toDataURL) return c.toDataURL('image/png');
  return '';
}

// Tiny seeded RNG shared by procedural modules.
export function rng32(seed) {
  let s = typeof seed === 'number' ? seed >>> 0 : hashStr(String(seed));
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
