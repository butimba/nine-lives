// The cat. Side view, facing right. Composed from a head + body poses, then coloured per skin.
// Template chars (resolved per skin):
//   F fur  H fur shade  L fur light  B belly  b belly shade  E ear inner  I iris  k ink  W white  N nose  p blush
//   s stripe mask (stripe colour if pattern=stripes, else fur)   S stripe mask on shade
//   q spot mask (stripe colour if pattern=spots, else fur)
//   x tux mask (belly if pattern=tux, else fur)                  X tux mask on shade
//   z sock mask (belly if socks/tux, else fur)                   Z sock mask on shade
import { SKINS } from '../../data/cosmetics.js';
import { spriteFromGrids, drawSprite, makeCanvas, canvasURL, rng32 } from './sprite.js';
import { PAL, shade, mix, hslToHex, toHsl } from './palette.js';
import { hatSprite } from './hats.js';
import { paintFxStatic, paintFxAnim, fxBounds } from './catfx.js';

export const CAT_ANIMS = {
  idle: { frames: [0, 1], fps: 2 },
  jump: { frames: [2], fps: 1 },
  attack: { frames: [3, 4], fps: 12 },
  hurt: { frames: [5], fps: 1 },
  sleep: { frames: [6], fps: 1 },
  dance: { frames: [7, 8, 7, 0], fps: 6 },
};

// ---------- HEAD (13 x 11). '#' = eye cell (2x3 per eye) ----------
const HEAD = [
  '..F......F...',
  '.FEF....FEF..',
  '.FEEFFFFFEEF.',
  '.FFFFsFsFFFF.',
  'FFFFFFsFFFqqF',
  'FFFF##FFF##qF',
  'FFFF##FFF##FF',
  'HFFF##FFF##FF',
  'HFFpxxxNxxpFF',
  '.HFFxxkxkxxF.',
  '..HHxxxxxxH..',
];
const EYES = {
  open: ['kW', 'kk', 'II'],
  blink: ['..', 'kk', '..'],
  happy: ['...', '.k.', 'k.k'],
  hurt: ['k.', '.k', 'k.'],
  sleep: ['..', '..', 'kk'],
};
function head(eye, eye2) {
  const e1 = EYES[eye], e2 = EYES[eye2 || eye];
  return HEAD.map((row, y) => {
    if (y < 5 || y > 7) return row;
    const ey = y - 5;
    let r = row.split('');
    // far eye x4-5, near eye x9-10
    const put = (g, x0) => { const o = g[ey].length === 3 ? x0 - 1 : x0; for (let i = 0; i < g[ey].length; i++) { const ch = g[ey][i]; if (ch !== '.') r[o + i] = ch; else if (i + o === x0 || i + o === x0 + 1) r[o + i] = 'F'; } };
    put(e1, 4); put(e2, 9);
    return r.join('');
  });
}
// hurt: mirror the near eye glyph for > <
const HURT_FAR = ['k.', '.k', 'k.'], HURT_NEAR = ['.k', 'k.', '.k'];
function hurtHead() {
  return HEAD.map((row, y) => {
    if (y < 5 || y > 7) return row;
    const ey = y - 5, r = row.split('');
    for (let i = 0; i < 2; i++) { r[4 + i] = HURT_FAR[ey][i] === '.' ? 'F' : 'k'; r[9 + i] = HURT_NEAR[ey][i] === '.' ? 'F' : 'k'; }
    return r.join('');
  });
}

// ---------- BODIES (26 x 22). Head is pasted on top at [hx, hy]. ----------
const W = 28, H = 22;
const BODY = {
  sit: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..............FFFFFFFF....',
    '............FsFFFFFFFF....',
    '..........FFFssFFFBBBF....',
    '.........FFsFFFqFFBBBF....',
    '..HH....FFFsFFqqFFBBBF....',
    '.HFFH..FFFFFFFFFFFBBBF....',
    '.HF.H..FsFFFHHHFFFBBBF....',
    '.HF...FFsFHFFFFHFFbBBF....',
    '.Hs...FFFHFFFFFFHFHHFF....',
    '.HF...FsFHFFqFFFHFHHFF....',
    '..Hs..FsFFFFqqFFHFHHFF....',
    '..HFF.FFFFFFFzzzHFZZzz....',
    '...HHHHHHHHHHZZZHHZZzz....',
  ],
  jump: [
    '..........................',
    '..HH......................',
    '.HFsH.....................',
    '.HF.......................',
    '..Hs......................',
    '...HF.....................',
    '....HF....................',
    '.....HF.......FFFF........',
    '......FFFFsFFFFFFFF.......',
    '.....FFsFFsFFsFFFFFF......',
    '....FFFFFFFFFqqFFFBBF.....',
    '...FFFFFFFFFFFqFFBBBBF....',
    '..FFFFFFFFFFFFFFBBBBFFFF..',
    '.FFFHHHHHHHHFFFFbBBFHHHZzz',
    'zFFH.......HHHH.....HZZzz.',
    'zzH.......................',
    'ZZ........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
  ],
  crouch: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..HH......................',
    '.HFsH.....................',
    '.HF.H.....................',
    '.HF.....FFFFFFF...........',
    '.Hs...FFFsFFsFFFFF........',
    '..HF.FFFsFFsFFsFFFFF......',
    '..HFFFFFFFFFFFqqFFFFBB....',
    '...HFFFFFFFFFFFqFFFBBBB...',
    '....FFFFFFFFFFFFFFFBBBBF..',
    '....FFFHHHHHHFFFFFbBBBF...',
    '....HFFFFFFFFHFFFHHFFFzz..',
    '....HzzzFFFFFHzzzHHFFzzz..',
    '.....ZZZHHHHHHZZZ.HHZZZ...',
  ],
  swipe: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..HH......................',
    '.HFsH.....................',
    '.HF.H.....................',
    '.Hs.....FFFFFFFF..........',
    '..HF..FFFsFFsFFFFF........',
    '..HFFFFFsFFsFFsFFFFF......',
    '...HFFFFFFFFFFFqqFFFBBBFFzzW',
    '....FFFFFFFFFFFFqFFBBBBFFzzW',
    '....FFFHHHHHHFFFFFbBBBF..ZW.',
    '....HFFFFFFFFHFFFHHFFF......',
    '....HzzzFFFFFHzzzHHFzz......',
    '.....ZZZHHHHHHZZZ.HZZZ......',
  ],
  puff: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.H.H......................',
    'HFHFH.....................',
    'HFsFH.....................',
    'FFFFH.....................',
    'HFsFH.........FFFFFFFF....',
    'HFFFH.......FsFFFFFFFF....',
    '.HsFH.....FFFssFFFBBBF....',
    '.HFFH....FFsFFFqFFBBBF....',
    '.HsH....FFFsFFqqFFBBBF....',
    '.HFH...FFFFFFFFFFFBBBF....',
    '.HFH...FsFFFHHHFFFBBBF....',
    '.HsH..FFsFHFFFFHFFbBBF....',
    '..HF..FFFHFFFFFFHFHHFF....',
    '..HFF.FsFHFFqFFFHFHHFF....',
    '...HFFFFFFFFFzzzHFZZzz....',
    '....HHHHHHHHHZZZHHZZzz....',
  ],
  loaf: [
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '..........................',
    '.......FFFFFFFFF..........',
    '.....FFFsFFsFFsFFF........',
    '....FFFsFFsFFsFFFFF.......',
    '...FFFFFFFFFFqqFFFFF......',
    '...FFFFFFFFFFFqFFFFFF.....',
    '..HFFFFFFFFFFFFFFFFFFF....',
    '.HsFFHHHHHHHHFFFFFFFFF....',
    'HFsFsFsFsFsFsHzzzzFzzzz...',
    '.HHHHHHHHHHHHHZZZZHZZZZ...',
  ],
  stand: [
    '............................',
    '............................',
    '............................',
    '....zz',
    '....zz',
    '....FF',
    '....HF',
    '.....FF',
    '.....HFF',
    '......FFF',
    '......HFFFFFFFFFFF',
    '.......FFFFFFFBBBFFFFFzz',
    '..HH...FFFsFFFBBBFHHHHZZ',
    '.HFFH..FFsFFFFBBBF',
    '.HF.H..FFFsFFFBBBF',
    '.Hs....FFsFFFFBBBF',
    '.HF....FFFFFFFbBBF',
    '..Hs...HFFFFFFFFFF',
    '..HFF..HFFFHHFFFFH',
    '...HFFFFFFH..HFFFH',
    '....HHzzzzH..HzzzzH',
    '......ZZZZ....ZZZZ',
  ],
  stand2: [
    '............................',
    '............................',
    '............................',
    '......................zz',
    '......................zz',
    '......................FF',
    '......................FF',
    '......................FH',
    '......................FH',
    '.....................FFH',
    '.....zz.HFFFFFFFFFFFFFH',
    '.....ZHHFFFFFFFBBBFF',
    '........FFsFFFFBBBF',
    '..HH....FsFFFFFBBBF',
    '.HFFH...FFsFFFFBBBF',
    '.HF.H...FsFFFFFBBBF',
    '.Hs.....FFFFFFFbBBF',
    '.HF.....HFFFFFFFFFF',
    '..Hs....HFFFHHFFFFH',
    '..HFFFFFFFFH.HFFFFH',
    '....HHHzzzzH.HzzzzH',
    '.......ZZZZ...ZZZZ',
  ],
};

const FRAMES = [
  { body: 'sit', head: 'open', hx: 11, hy: 0 },
  { body: 'sit', head: 'open', hx: 11, hy: 1 },
  { body: 'jump', head: 'open', hx: 14, hy: 1 },
  { body: 'crouch', head: 'open', hx: 13, hy: 6 },
  { body: 'swipe', head: 'open', hx: 13, hy: 6 },
  { body: 'puff', head: 'hurt', hx: 10, hy: 0 },
  { body: 'loaf', head: 'sleep', hx: 11, hy: 10 },
  { body: 'stand', head: 'happy', hx: 9, hy: 0 },
  { body: 'stand2', head: 'happy', hx: 9, hy: 1 },
];

function composeFrame(f) {
  const g = BODY[f.body].map((r) => r.padEnd(W, '.').split(''));
  const hd = f.head === 'hurt' ? hurtHead() : head(f.head);
  hd.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      const yy = y + f.hy, xx = x + f.hx;
      if (yy >= 0 && yy < H && xx >= 0 && xx < W) g[yy][xx] = ch;
    }
  });
  return g; // 2D char array
}
const CHAR_FRAMES = FRAMES.map(composeFrame);
// tail tip per body pose (body coords) — used by the shrimp fan and friends
const TAIL_TIP = { sit: [2, 13], jump: [2, 1], crouch: [2, 9], swipe: [2, 10], puff: [1, 6], loaf: [0, 20], stand: [2, 12], stand2: [2, 12] };
const HEAD_POINTS = FRAMES.map((f) => ({ head: { x: f.hx + 6, y: f.hy + 3 } }));

// ---------- skin -> colours ----------
const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];
function slotColors(skin) {
  const c = skin.colors, pat = skin.pattern || 'none';
  const fur = (skin.pixel && skin.pixel.fur) || c.fur;
  const belly = (skin.pixel && skin.pixel.belly) || c.belly;
  const stripe = (skin.pixel && skin.pixel.stripe) || c.stripe;
  const furSh = shade(fur, -0.16), bellySh = shade(belly, -0.12), stripeSh = shade(stripe, -0.1);
  const m = {
    F: fur, H: furSh, L: shade(fur, 0.1), B: belly, b: bellySh,
    E: c.ear, I: c.eye, N: c.nose, k: PAL.k, W: PAL.W, p: mix(fur, '#ff7d9a', 0.45),
    s: pat === 'stripes' ? stripe : fur, S: pat === 'stripes' ? stripeSh : furSh,
    q: pat === 'spots' ? stripe : fur,
    x: pat === 'tux' ? belly : fur, X: pat === 'tux' ? bellySh : furSh,
    z: pat === 'socks' || pat === 'tux' ? belly : fur, Z: pat === 'socks' || pat === 'tux' ? bellySh : furSh,
  };
  return m;
}

const OUT = '#0e0b16';
// Pad so fx (antennae, flames) have room: PAD around the 26x22 body.
const PADX = 4, PADT = 6, PADB = 1;
export const CAT_W = W + PADX * 2, CAT_H = H + PADT + PADB;

function colorGrid(chars, map) {
  const g = new Array(CAT_W * CAT_H).fill(null);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = chars[y][x];
    if (ch === '.') continue;
    g[(y + PADT) * CAT_W + x + PADX] = map[ch] ?? PAL[ch] ?? null;
  }
  return g;
}
export function outlineGrid(g, w, h, col = OUT) {
  const res = g.slice();
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (g[y * w + x]) continue;
    if ((x > 0 && g[y * w + x - 1]) || (x < w - 1 && g[y * w + x + 1]) || (y > 0 && g[(y - 1) * w + x]) || (y < h - 1 && g[(y + 1) * w + x])) res[y * w + x] = col;
  }
  return res;
}

const catCache = new Map();
function buildSkin(skinId) {
  if (catCache.has(skinId)) return catCache.get(skinId);
  const skin = skinById(skinId);
  const fx = skin.fx || [];
  const map = slotColors(skin);
  const variants = fx.includes('rainbow') ? 12 : fx.includes('ghost') ? 2 : 1; // rainbow = hue cycle, ghost = wave phase
  const sprites = [];
  for (let v = 0; v < variants; v++) {
    let m = map;
    
    const grids = CHAR_FRAMES.map((chars, fi) => {
      let g = colorGrid(chars, m);
      const ctx = { g, w: CAT_W, h: CAT_H, chars, fi, v, ox: PADX, oy: PADT, frame: FRAMES[fi], skin, map: m, head: HEAD_POINTS[fi].head, tail: TAIL_TIP[FRAMES[fi].body], body: FRAMES[fi].body };
      paintFxStatic(fx, ctx, 'under');
      g = outlineGrid(ctx.g, CAT_W, CAT_H, fx.includes('ghost') ? '#3a3a6e' : OUT);
      ctx.g = g;
      paintFxStatic(fx, ctx, 'over');
      return ctx.g;
    });
    sprites.push(spriteFromGrids({
      id: 'cat_' + skinId + '_' + v, w: CAT_W, h: CAT_H, grids,
      anchor: { x: PADX + 13, y: PADT + H },
      points: HEAD_POINTS.map((p) => ({ head: { x: p.head.x + PADX, y: p.head.y + PADT } })),
    }));
  }
  const furMask = CHAR_FRAMES.map((chars) => {
    const pts = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if ('FHsSqLxX'.includes(chars[y][x])) pts.push([x + PADX, y + PADT]);
    return pts;
  });
  const top = sprites[0].grids.map((g) => {
    const t = [];
    for (let x = 0; x < CAT_W; x++) { let y = 0; while (y < CAT_H && !g[y * CAT_W + x]) y++; t.push(y < CAT_H ? y : -1); }
    return t;
  });
  const rec = { skin, fx, sprites, furMask, map, top, frames: FRAMES, ox: PADX, oy: PADT, tails: FRAMES.map((f) => TAIL_TIP[f.body]) };
  catCache.set(skinId, rec);
  return rec;
}

function rainbowMap(map, v) {
  const hue = v * 45;
  const fur = hslToHex(hue, 0.85, 0.68), belly = hslToHex(hue + 40, 0.9, 0.85), stripe = hslToHex(hue + 90, 0.85, 0.62);
  return { ...map, F: fur, H: shade(fur, -0.16), L: shade(fur, 0.1), B: belly, b: shade(belly, -0.12), s: fur, S: shade(fur, -0.16), q: fur, x: fur, X: shade(fur, -0.16), z: fur, Z: shade(fur, -0.16), p: mix(fur, '#ff7d9a', 0.45) };
}

export function frameFor(anim, t) {
  const a = CAT_ANIMS[anim] || CAT_ANIMS.idle;
  const i = Math.floor((t || 0) * a.fps) % a.frames.length;
  return a.frames[i];
}

export function getCat(skinId = 'ginger', hatId = 'none') {
  const rec = buildSkin(skinId);
  const hat = hatSprite(hatId);
  const spr0 = rec.sprites[0];
  return {
    w: CAT_W, h: CAT_H, skin: rec.skin,
    headPoint(anim = 'idle', t = 0) { return spr0.points[frameFor(anim, t)].head; },
    draw(ctx, x, y, { anim = 'idle', t = 0, scale = 1, flip = false, flash = false, silhouette = false, alpha = 1, frame } = {}) {
      const fi = frame ?? frameFor(anim, t);
      const spr = rec.sprites.length > 1 ? rec.sprites[Math.floor(t * (rec.fx.includes('ghost') ? 3 : 6)) % rec.sprites.length] : spr0;
      if (rec.fx.includes('ghost') && !silhouette) y = y - 1 - Math.round(Math.sin(t * 2.5) * 1.5) * scale;
      const ghost = rec.fx.includes('ghost') && !silhouette && !flash;
      const a = alpha * (ghost ? 0.8 + 0.08 * Math.sin(t * 3) : 1);
      const fxo = { ctx, x, y, t, scale, flip, fi, rec, spr, anchor: spr.anchor };
      if (!silhouette && !flash) paintFxAnim(rec.fx, fxo, 'back');
      drawSprite(ctx, spr, fi, x, y, { scale, flip, alpha: a, flash, silhouette });
      if (!silhouette && !flash) paintFxAnim(rec.fx, fxo, 'front');
      if (hat) {
        const hp = spr.points[fi].head;
        const hx = flip ? spr.w - hp.x : hp.x;
        const px = x + (hx - (flip ? spr.w - spr.anchor.x : spr.anchor.x)) * scale;
        const py = y + (hp.y - spr.anchor.y) * scale;
        drawSprite(ctx, hat, 0, px, py, { scale, flip, alpha, flash, silhouette });
      }
    },
  };
}

const urlCache = new Map();
export function catURL(skinId, hatId = 'none', scale = 4, { silhouette = false, anim = 'idle', frame = 0 } = {}) {
  const key = [skinId, hatId, scale, silhouette, anim, frame].join('|');
  if (urlCache.has(key)) return urlCache.get(key);
  const top = 8; // headroom for tall hats
  const c = makeCanvas(CAT_W * scale, (CAT_H + top) * scale);
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  const cat = getCat(skinId, hatId);
  const fi = CAT_ANIMS[anim] ? CAT_ANIMS[anim].frames[frame % CAT_ANIMS[anim].frames.length] : 0;
  cat.draw(ctx, PADX + 13, top + PADT + H, { frame: fi, t: 0, silhouette });
  const u = canvasURL(c);
  urlCache.set(key, u);
  return u;
}
