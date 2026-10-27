// Procedural monsters: seed + palette -> a characterful little pixel creature (faces LEFT, toward the cat).
// makeMonster(seed, palette, { boss, shadow }) -> { name, boss, shadow, w, h, draw(ctx,x,y,{anim,t,p,flash,scale,alpha}), portraitURL(scale) }
//   anim: 'idle' (t = global seconds) | 'hurt' | 'lunge' | 'die'
//   For hurt/lunge/die pass p = progress 0..1 (preferred) or t = seconds since that anim started
//   (durations: hurt 0.3 s, die 0.6 s). 'lunge' is a pose (open mouth); the caller moves the monster.
//   seed may be a number or any string (hashed).
import { spriteFromGrids, drawSprite, makeCanvas, canvasURL, rng32, hashStr } from './sprite.js';
import { PAL, shade, mix, luminance } from './palette.js';

const K = PAL.k;
const pick = (r, a) => a[Math.floor(r() * a.length)];

// ---------------- shapes: inside(u, v, o) with u,v in [-1,1] ----------------
const SHAPES = {
  blob: (u, v) => v > -0.95 && u * u + Math.pow(Math.max(0, -v) * 1.0, 2) + Math.pow(Math.max(0, v) * 0.55, 2) * 1.6 < 0.95 && v < 0.98,
  slime: (u, v, o) => {
    const top = -0.55 + (o.squash || 0) * 0.2;
    if (v < top) return false;
    const t = (v - top) / (1 - top); // 0 top .. 1 bottom
    const half = Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))) * (0.86 + 0.12 * t);
    return Math.abs(u) < half && v < 0.98;
  },
  ghost: (u, v, o) => {
    if (v < 0) return u * u + v * v * 1.05 < 0.78;
    const wave = 0.78 + 0.13 * Math.sin(u * Math.PI * 2.2 + (o.phase || 0));
    return Math.abs(u) < 0.88 && v < wave;
  },
  box: (u, v) => Math.pow(Math.abs(u) / 0.86, 6) + Math.pow(Math.abs(v) / 0.96, 6) < 1,
  spiky: (u, v) => {
    const a = Math.atan2(v, u), r = Math.hypot(u * 1.05, v);
    const spikes = v < 0.1 ? Math.pow(Math.max(0, Math.cos(a * 7)), 6) * 0.3 : 0;
    return r < 0.66 + spikes && v < 0.98;
  },
  bean: (u, v) => (u + v * 0.12) * (u + v * 0.12) / 0.4 + v * v / 0.97 < 1,
  bat: (u, v, o) => {
    if (u * u / 0.3 + (v - 0.15) * (v - 0.15) / 0.42 < 1) return true; // body
    if (Math.abs(u) < 0.3 && v < -0.45 && v > -0.75 && Math.abs(Math.abs(u) - 0.17) < 0.1) return true; // ears
    const au = Math.abs(u);
    if (au < 0.45 || au > 1) return false;
    const k = (au - 0.45) / 0.55; // 0 at body .. 1 at tip
    const lift = o.flap ? 0.35 : -0.25;
    const top = -0.25 - k * (0.45 + lift) + (o.flap ? 0.25 : 0);
    const scallop = 0.12 * Math.abs(Math.sin(k * Math.PI * 2.5));
    const bottom = 0.35 - k * (0.5 + lift * 0.5) - scallop + (o.flap ? 0.3 : 0);
    return v > top && v < bottom;
  },
  shroom: (u, v) => {
    if (v < 0.05) return u * u / 0.95 + Math.pow((v + 0.15) / 0.82, 2) < 1 && v > -0.95;
    return Math.abs(u) < 0.42 + v * 0.08 && v < 0.98;
  },
  eyeball: (u, v) => u * u + (v - 0.02) * (v - 0.02) < 0.9 && v < 0.98,
};
const SHAPE_IDS = Object.keys(SHAPES);

const NOUNS = {
  blob: ['Gloop', 'Blob', 'Blobby', 'Splodge'],
  slime: ['Slime', 'Ooze', 'Goo', 'Gloop'],
  ghost: ['Boo', 'Ghosty', 'Wisp', 'Spook'],
  box: ['Box', 'Cube', 'Blocky', 'Brick'],
  spiky: ['Spike', 'Prickle', 'Thorn', 'Spiky'],
  bean: ['Bean', 'Pea', 'Jellybean', 'Nut'],
  bat: ['Flap', 'Batty', 'Wing', 'Flutter'],
  shroom: ['Shroom', 'Puff', 'Toadstool', 'Spore'],
  eyeball: ['Peeper', 'Eyeball', 'Blinky', 'Stare'],
};
const ADJ = ['Grumpy', 'Sleepy', 'Silly', 'Wobbly', 'Sneaky', 'Hungry', 'Bouncy', 'Stinky', 'Tiny', 'Fluffy', 'Spooky', 'Giggly', 'Cranky', 'Sticky', 'Soggy', 'Moody', 'Noisy', 'Lazy', 'Bossy', 'Dizzy'];
const TITLES = ['Count', 'Baron', 'Duke', 'Queen', 'King', 'Lady', 'Captain', 'Professor', 'General', 'Sir', 'Doctor', 'Mega'];
const BOSS_NOUNS = ['Pickle', 'Waffle', 'Noodle', 'Jelly', 'Muffin', 'Turnip', 'Pudding', 'Sprout', 'Nugget', 'Biscuit', 'Meatball', 'Cabbage', 'Crumble', 'Dumpling'];

// ---------------- face glyphs ----------------
// W white, k ink, D body-dark (eyelid), p pink, r red, g glow
const EYES_S = {
  dot: ['kW', 'kk'],
  round: ['WWW', 'kkW', 'kkW'],
  angry: ['WWW', 'kkW', 'kkW'],
  sleepy: ['DDD', 'kkW', 'kkW'],
  wide: ['.WW.', 'WWWW', 'kkWW', '.kW.'],
};
const EYES_B = {
  dot: ['kkW', 'kkk', 'kkk'],
  round: ['.WWW.', 'WWWWW', 'kkkWW', 'kkkWW', '.kkW.'],
  angry: ['.WWW.', 'WWWWW', 'kkkWW', 'kkkWW', '.kkW.'],
  sleepy: ['.DDD.', 'DDDDD', 'kkkWW', 'kkkWW', '.kkW.'],
  wide: ['.WWW.', 'WWWWW', 'kkkWW', 'kkkWW', '.kkW.'],
};
const CYCLOPS_S = ['.WWW.', 'WWWWW', 'kkkWW', 'kkkWW', '.WWW.'];
const CYCLOPS_B = ['..WWWW..', '.WWWWWW.', 'WWWWWWWW', 'kkkkWWWW', 'kkkkWWWW', 'kkkkWWWW', '.kkkWWW.', '..WWWW..'];
const HURT_S = ['k.k', '.k.', 'k.k'];
const HURT_B = ['k...k', '.k.k.', '..k..', '.k.k.', 'k...k'];
const MOUTHS_S = {
  fang: ['kkkkk', '.W.W.'],
  smile: ['k...k', '.kkk.'],
  grin: ['kkkkkk', 'kWkWkk', '.kkkk.'],
  o: ['.kk.', 'kkkk', '.kk.'],
  tongue: ['kkkk', 'kkpk', '..p.'],
  wavy: ['k.k.k', '.k.k.'],
  frown: ['.kkk.', 'k...k'],
};
const MOUTHS_B = {
  fang: ['kkkkkkkk', 'kkkkkkkk', '.W....W.'],
  smile: ['k......k', '.k....k.', '..kkkk..'],
  grin: ['kkkkkkkkk', 'kWkWkWkWk', 'kkkkkkkkk', '.kkpppkk.'],
  o: ['..kkk..', '.kkkkk.', '.kkpkk.', '..kkk..'],
  tongue: ['kkkkkkk', 'kkkkpkk', '...ppp.', '....p..'],
  wavy: ['k..k..k..', '.k..k..k.', '..k..k...'].map((r) => r.slice(0, 8)),
  frown: ['..kkkk..', '.k....k.', 'k......k'],
};
const MOUTH_OPEN_S = ['.kkkk.', 'kkWWkk', 'kkkkkk', '.kppk.'];
const MOUTH_OPEN_B = ['..kkkkkk..', '.kWkkkkWk.', 'kkkkkkkkkk', 'kkkkppkkkk', '.kkppppkk.'];

// ---------------- genome ----------------
function genome(seed, palette, boss, shadow) {
  const r = rng32((seed >>> 0) * 2654435761 + (boss ? 17 : 0));
  const shapeId = pick(r, SHAPE_IDS);
  const pal = palette && palette.length ? palette : ['#93e04c', '#3aa34f', '#ffd23f'];
  // main colour: palette[0] or [1] at random, accent = another entry (or a complementary pop)
  const main = pal[Math.floor(r() * Math.min(2, pal.length))];
  const fallback = pick(r, ['#ffd23f', '#ff8fa3', '#7ec4ff', '#e8434f']);
  const accent = pal.find((c) => c !== main && Math.abs(luminance(c) - luminance(main)) > 0.12) || fallback;
  const eyesN = shapeId === 'eyeball' ? 1 : r() < 0.12 ? 1 : r() < 0.85 ? 2 : 3;
  const eyeType = pick(r, ['dot', 'round', 'round', 'angry', 'sleepy', 'wide']);
  const mouth = pick(r, Object.keys(MOUTHS_S));
  const accs = ['none', 'horns', 'antenna', 'sprout', 'horn1', 'tuft', 'bow', 'none'];
  const acc = shapeId === 'shroom' || shapeId === 'bat' ? pick(r, ['none', 'none', 'tuft']) : pick(r, accs);
  const pattern = pick(r, ['belly', 'spots', 'none', 'belly', 'stripes']);
  const feet = ['blob', 'box', 'bean', 'spiky', 'eyeball'].includes(shapeId) && r() < 0.8;
  const arms = ['blob', 'box', 'bean', 'slime'].includes(shapeId) && r() < 0.45;
  const blush = r() < 0.4;
  const name = boss ? `${pick(r, TITLES)} ${pick(r, BOSS_NOUNS)}` : `${pick(r, ADJ)} ${pick(r, NOUNS[shapeId])}`;
  return { r, shapeId, main, accent, eyesN, eyeType, mouth, acc, pattern, feet, arms, blush, name, boss, shadow, seed };
}

// ---------------- render one frame to a colour grid ----------------
// frame: { sw, sh (shape box), phase, flap, hurt, open }
function renderFrame(gn, fr) {
  const B = gn.boss;
  const W = B ? 44 : 26, H = B ? 48 : 30; // grid with margins for accessories/outline
  const g = new Array(W * H).fill(null);
  const sw = fr.sw, sh = fr.sh;
  const x0 = Math.floor((W - sw) / 2) + (fr.dx || 0), y0 = H - 1 - sh; // shape box; 1px bottom margin for outline
  const sh_ = gn.shadow;
  const body = sh_ ? '#2b2342' : gn.main;
  const dark = sh_ ? '#1a1430' : shade(gn.main, -0.17);
  const darker = sh_ ? '#120d22' : shade(gn.main, -0.3);
  const light = sh_ ? '#40355f' : shade(gn.main, 0.12);
  const accent = sh_ ? '#3a2f58' : gn.accent;
  const accDark = sh_ ? '#251d3d' : shade(gn.accent, -0.2);
  const belly = sh_ ? '#352b52' : mix(gn.main, '#fff6e0', 0.45);

  const shapeFn = SHAPES[gn.shapeId];
  const opts = { phase: fr.phase || 0, flap: fr.flap || 0, squash: fr.squash || 0 };
  const inside = (x, y) => {
    if (x < 0 || y < 0 || x >= sw || y >= sh) return false;
    const u = ((x + 0.5) / sw) * 2 - 1, v = ((y + 0.5) / sh) * 2 - 1;
    return shapeFn(u, v, opts);
  };
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y * W + x] = c; };
  const get = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? g[y * W + x] : null);

  // 1. body with rim shading (light from top-left)
  const d = B ? 2 : 1;
  for (let y = 0; y < sh; y++) for (let x = 0; x < sw; x++) {
    if (!inside(x, y)) continue;
    let c = body;
    if (!inside(x + d, y + d) || !inside(x, y + d + 1)) c = dark;
    if (!inside(x + 1, y + 1) && !inside(x, y + 1)) c = darker;
    else if (!inside(x - 1, y - 1) && inside(x + 1, y + 1) && c === body) c = light;
    // mushroom cap = accent colour, stem = pale
    if (gn.shapeId === 'shroom') {
      const v = ((y + 0.5) / sh) * 2 - 1;
      if (v < 0.05) c = c === body ? accent : c === light ? shade(accent, 0.12) : c === dark ? accDark : shade(accent, -0.32);
      else c = c === body ? belly : c === light ? mix(belly, '#ffffff', 0.3) : shade(belly, -0.15);
    }
    set(x0 + x, y0 + y, c);
  }
  const cx = x0 + Math.floor(sw / 2), cy = y0 + Math.floor(sh / 2);
  const isBody = (x, y) => { const c = get(x, y); return c === body || c === light; };

  // 2. patterns
  const r = rng32(gn.seed * 31 + 7);
  if (gn.shapeId === 'shroom') {
    // cap spots
    const spots = B ? 6 : 4;
    for (let i = 0; i < spots * 4 && i < 60; i++) {
      const x = x0 + Math.floor(r() * sw), y = y0 + Math.floor(r() * sh * 0.45);
      const ok = get(x, y) === accent && get(x + 1, y) === accent && get(x, y + 1) === accent && get(x + 1, y + 1) === accent;
      if (ok) { set(x, y, '#fff6e0'); if (B) { set(x + 1, y, '#fff6e0'); set(x, y + 1, '#fff6e0'); set(x + 1, y + 1, '#fff6e0'); } }
    }
  } else if (gn.pattern === 'belly' && gn.shapeId !== 'bat' && gn.shapeId !== 'eyeball') {
    const bw = sw * 0.28, bh = sh * 0.22, bcx = cx - (B ? 2 : 1), bcy = y0 + sh * 0.72;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      if (!isBody(x, y)) continue;
      if (Math.pow((x + 0.5 - bcx) / bw, 2) + Math.pow((y + 0.5 - bcy) / bh, 2) < 1) set(x, y, belly);
    }
  } else if (gn.pattern === 'spots') {
    let n = B ? 7 : 3;
    for (let i = 0; i < 200 && n > 0; i++) {
      const x = x0 + 1 + Math.floor(r() * (sw - 2)), y = y0 + Math.floor(sh * 0.15 + r() * sh * 0.75);
      const near = [-2, -1, 0, 1, 2, 3].some((a) => [-2, -1, 0, 1, 2, 3].some((b) => get(x + a, y + b) === accent));
      if (!near && isBody(x, y) && isBody(x + 1, y) && isBody(x, y + 1) && isBody(x - 1, y) && isBody(x, y - 1) && isBody(x + 1, y + 1) && (!B || (isBody(x + 2, y) && isBody(x, y + 2)))) {
        set(x, y, accent);
        if (B) { set(x + 1, y, accent); set(x, y + 1, accent); set(x + 1, y + 1, accDark); }
        n--;
        // keep spots apart
        i += 0;
      }
    }
  } else if (gn.pattern === 'stripes') {
    for (let y = 0; y < H; y++) {
      const band = Math.floor((y - y0) / (B ? 4 : 3));
      if ((band % 3) !== 2) continue;
      for (let x = 0; x < W; x++) if (isBody(x, y) && (y - y0) > sh * 0.3) set(x, y, shade(gn.main, -0.08));
    }
  }

  // 3. accessories before outline (so they get outlined)
  const topAt = (x) => { for (let y = 0; y < H; y++) if (get(x, y)) return y; return H; };
  const accC = sh_ ? '#3a2f58' : gn.accent;
  const s = B ? 2 : 1;
  const faceShift = -Math.round(sw * 0.12); // faces left
  if (gn.acc === 'horns') {
    const HS = B ? ['...x', '..xx', '.xxx', 'xxxx', 'xxxX', 'xxXX'] : ['..x', '.xx', 'xxX'];
    for (const side of [-1, 1]) {
      const hx = cx + side * Math.round(sw * 0.26), ty = topAt(hx);
      HS.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') { const xx = side > 0 ? hx + i - 1 : hx - i + 1; set(xx, ty - HS.length + j + 1, row[i] === 'X' ? shade(accC, -0.2) : j < 1 ? shade(accC, 0.15) : accC); } });
    }
  } else if (gn.acc === 'horn1') {
    const hx = cx + faceShift, ty = topAt(hx);
    for (let k = 0; k < 4 * s; k++) { set(hx, ty - k, accC); if (k < 2 * s) set(hx + 1, ty - k, shade(accC, -0.15)); }
  } else if (gn.acc === 'antenna') {
    const hx = cx + 1, ty = topAt(hx);
    for (let k = 1; k <= 3 * s; k++) set(hx + (k > 2 * s ? 1 : 0), ty - k, darker);
    const bx = hx + 1, by = ty - 3 * s - 1;
    set(bx, by, accC); set(bx + 1, by, accC); set(bx, by - 1, shade(accC, 0.2)); set(bx + 1, by - 1, accC);
    if (B) { set(bx - 1, by, accC); set(bx + 2, by, accC); set(bx, by + 1, accC); set(bx + 1, by + 1, accC); }
  } else if (gn.acc === 'sprout') {
    const hx = cx, ty = topAt(hx);
    set(hx, ty - 1, '#3aa34f'); set(hx, ty - 2, '#3aa34f');
    set(hx - 1, ty - 3, '#93e04c'); set(hx - 2, ty - 3, '#93e04c'); set(hx - 2, ty - 4, '#93e04c');
    set(hx + 1, ty - 3, '#3aa34f'); set(hx + 2, ty - 3, '#93e04c'); set(hx + 2, ty - 4, '#93e04c');
  } else if (gn.acc === 'tuft') {
    const hx = cx, ty = topAt(hx);
    set(hx, ty - 1, dark); set(hx - 1, ty - 2, dark); set(hx + 1, ty - 1, dark); set(hx + 2, ty - 2, dark);
  } else if (gn.acc === 'bow') {
    const hx = cx + Math.round(sw * 0.22), ty = topAt(hx) + 1;
    const pink = sh_ ? '#3a2f58' : '#ff5d8f';
    for (const [x, y] of [[-2, -1], [-2, 0], [-2, 1], [-1, 0], [0, 0], [1, 0], [2, -1], [2, 0], [2, 1], [-1, -1], [1, 1]]) set(hx + x, ty + y, pink);
    set(hx, ty, shade(pink, -0.25));
  }
  if (gn.feet) {
    const fy = y0 + sh;
    for (const fx of [cx - Math.round(sw * 0.25), cx + Math.round(sw * 0.12)]) for (let k = 0; k < 2 * s + 1; k++) { set(fx + k, fy - 1, darker); }
  }
  if (gn.arms) {
    const ay = y0 + Math.round(sh * 0.55) + (fr.open ? -2 : 0);
    for (let k = 0; k < s; k++) { set(x0 - 1 - k, ay, dark); set(x0 - 1 - k, ay + 1, darker); set(x0 + sw + k, ay, dark); set(x0 + sw + k, ay + 1, darker); }
  }
  // boss crown (before outline)
  if (B) {
    const crownW = 11, cx0 = cx - 5 + faceShift + 2, ty = topAt(cx) - 1;
    const C = ['Y.Y...Y.Y', 'Y.YY.YY.Y', 'YYYYYYYYY', 'YRYYBYYRY', 'ddddddddd'];
    const ccol = { Y: '#ffd23f', R: '#e8434f', B: '#3bd8ff', d: '#d98a00' };
    C.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') set(cx0 + i + 1, ty - (C.length - 1) + j + 1, ccol[row[i]]); });
    void crownW;
  }

  // 4. outline
  const out = g.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (g[y * W + x]) continue;
    if (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1)) out[y * W + x] = K;
  }
  for (let i = 0; i < out.length; i++) g[i] = out[i];

  // 5. face (over outline)
  const glyph = (rows, gx, gy, cmap) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const k = row[i]; if (k !== '.') set(gx + i, gy + j, cmap[k] || k); } });
  const glow = sh_ ? (gn.seed % 2 ? '#ffe14d' : '#ff5df0') : null;
  const fmap = { W: sh_ ? glow : '#ffffff', k: sh_ ? glow : K, D: dark, p: '#ff8fa3', r: '#e8434f' };
  if (sh_) fmap.k = '#0b0816';
  const eyeY = gn.shapeId === 'shroom' ? y0 + Math.round(sh * 0.62) : gn.shapeId === 'bat' ? y0 + Math.round(sh * 0.4) : y0 + Math.round(sh * (gn.shapeId === 'ghost' ? 0.3 : 0.36));
  const ecx = cx + faceShift;
  let eyeG;
  if (fr.hurt) eyeG = B ? HURT_B : HURT_S;
  else if (gn.eyesN === 1) eyeG = B ? CYCLOPS_B : CYCLOPS_S;
  else eyeG = (B ? EYES_B : EYES_S)[gn.eyeType];
  if (sh_ && !fr.hurt && gn.eyesN > 1) eyeG = eyeG.map((r) => r.replace(/k/g, 'W')); // glowing, no pupils (cyclops keeps a slit)
  const ew = eyeG[0].length, eh = eyeG.length;
  const gap = B ? 3 : gn.eyesN === 3 ? 1 : 2;
  const xs = gn.eyesN === 1 ? [ecx - Math.floor(ew / 2)] : gn.eyesN === 2 ? [ecx - ew - Math.floor(gap / 2), ecx + Math.ceil(gap / 2)] : [ecx - ew - gap - Math.floor(ew / 2), ecx - Math.floor(ew / 2), ecx + Math.ceil(ew / 2) + gap];
  // nudge the whole face right if an eye would spill past the body edge
  const fits = (dx) => xs.every((ex, i) => { const ey = eyeY - Math.floor(eh / 2) + (gn.eyesN === 3 && i === 1 ? -Math.ceil(eh / 2) : 0);
    return eyeG.every((row, j) => [...row].every((ch, q) => ch === '.' || ((c) => c && c !== K)(get(ex + dx + q, ey + j)))); });
  let fdx = 0; while (fdx < 6 && !fits(fdx)) fdx++;
  if (fdx >= 6) fdx = 0;
  for (let i = 0; i < xs.length; i++) xs[i] += fdx;
  xs.forEach((ex, i) => {
    const ey = eyeY - Math.floor(eh / 2) + (gn.eyesN === 3 && i === 1 ? -Math.ceil(eh / 2) : 0);
    if (sh_ && !fr.hurt) {
      // soft glow halo
      for (let j = -1; j <= eh; j++) for (let q = -1; q <= ew; q++) {
        if (Math.pow((q + 0.5 - ew / 2) / (ew / 2 + 1), 2) + Math.pow((j + 0.5 - eh / 2) / (eh / 2 + 1), 2) > 1) continue;
        const c = get(ex + q, ey + j); if (c && c !== K) set(ex + q, ey + j, mix(c, glow, 0.3));
      }
    }
    glyph(eyeG, ex, ey, fmap);
    if (gn.eyeType === 'angry' && !fr.hurt && gn.eyesN !== 1) {
      const left = i === 0;
      const by = ey - 1 - (B ? 1 : 0);
      for (let q = 0; q < ew; q++) set(ex + q, by + (left ? (q >= ew - 1 ? 1 : 0) : q === 0 ? 1 : 0) , fmap.k === K ? K : darker);
    }
  });
  // mouth
  const mg = fr.open ? (B ? MOUTH_OPEN_B : MOUTH_OPEN_S) : fr.hurt ? (B ? MOUTHS_B.o : MOUTHS_S.o) : (B ? MOUTHS_B : MOUTHS_S)[gn.mouth];
  const my = eyeY + Math.ceil(eh / 2) + (B ? 3 : 1) + (gn.eyesN === 1 ? 0 : 0);
  const mx = ecx + fdx - Math.floor(mg[0].length / 2);
  if (gn.shapeId !== 'eyeball' || fr.open || B) glyph(mg, mx, Math.min(my, y0 + sh - mg.length - 1), { ...fmap, k: sh_ ? '#0b0816' : K, W: sh_ ? glow : '#ffffff', p: sh_ ? glow : '#ff8fa3' });
  if (gn.blush && !sh_) {
    const by = eyeY + Math.ceil(eh / 2);
    const bl = mix(gn.main, '#ff5d8f', 0.5);
    [xs[0] - 1, xs[xs.length - 1] + ew].forEach((bx) => { if (isBody(bx, by)) set(bx, by, bl); if (B && isBody(bx + 1, by)) set(bx + 1, by, bl); });
  }
  return { g, W, H };
}

// ---------------- public ----------------
const monCache = new Map();
export function makeMonster(seed = 1, palette = ['#93e04c', '#3aa34f', '#ffd23f'], { boss = false, shadow = false } = {}) {
  const key = seed + '|' + palette.join(',') + '|' + boss + '|' + shadow;
  if (monCache.has(key)) return monCache.get(key);
  seed = typeof seed === 'number' && Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : hashStr(String(seed));
  const gn = genome(seed, palette, boss, shadow);
  const base = boss ? { sw: 34, sh: 32 } : { sw: 19, sh: 18 };
  if (gn.shapeId === 'bean') { base.sw -= boss ? 6 : 4; }
  if (gn.shapeId === 'bat') { base.sw += boss ? 8 : 5; base.sh -= boss ? 2 : 1; }
  if (gn.shapeId === 'box') { base.sh += 0; }
  const fly = gn.shapeId === 'bat' || gn.shapeId === 'ghost';
  const F = [
    { ...base, phase: 0, flap: 0 }, // idle0
    { ...base, sw: base.sw + 1, sh: base.sh - 1, phase: 1.6, flap: 1, squash: 1 }, // idle1 (squash)
    { ...base, sw: base.sw + 2, sh: base.sh - 2, hurt: true, phase: 0.8, flap: 1, squash: 1 }, // hurt
    { ...base, sw: base.sw + 3, sh: base.sh - 1, open: true, dx: -1, phase: 2.4 }, // lunge
    { ...base, sw: base.sw + 3, sh: Math.round(base.sh * 0.6), hurt: true, squash: 1 }, // flat1
    { ...base, sw: base.sw + 5, sh: Math.max(4, Math.round(base.sh * 0.3)), hurt: true, squash: 1 }, // flat2
  ];
  const rendered = F.map((f) => renderFrame(gn, f));
  const W = rendered[0].W, H = rendered[0].H;
  const spr = spriteFromGrids({ id: 'mon_' + key, w: W, h: H, grids: rendered.map((r) => r.g), anchor: { x: Math.floor(W / 2), y: H - 1 } });
  // tight bounds of frame 0 (for layout)
  let minX = W, maxX = 0, minY = H;
  rendered[0].g.forEach((c, i) => { if (c) { const x = i % W, y = (i / W) | 0; minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); } });
  const glowCol = shadow ? (seed % 2 ? '#ffe14d' : '#ff5df0') : null;
  const m = {
    name: shadow ? 'Shadow ' + gn.name.split(' ').pop() : gn.name,
    boss, shadow, shape: gn.shapeId, color: gn.main,
    w: maxX - minX + 1, h: H - minY, sprite: spr, fly,
    draw(ctx, x, y, { anim = 'idle', t = 0, p, flash = false, scale = 1, alpha = 1, flip = false } = {}) {
      let fi = 0, dx = 0, dy = 0, a = alpha;
      if (fly) dy -= Math.round(2 + Math.sin(t * 3) * 2) * scale;
      if (anim === 'idle') {
        fi = Math.floor(t * 2.5) % 2;
        if (shadow) a *= 0.85 + 0.15 * Math.sin(t * 5);
      } else if (anim === 'hurt') {
        const q = p ?? Math.min(1, t / 0.3);
        fi = 2;
        dx = Math.round(Math.sin(q * Math.PI * 6) * 2 * (1 - q)) * scale;
        flash = flash || q < 0.25;
      } else if (anim === 'lunge') {
        // pose only (open mouth, lean in); the caller moves the monster
        fi = p != null && p > 0.85 ? 0 : 3;
        dx = -scale;
      } else if (anim === 'die') {
        const q = p ?? Math.min(1, t / 0.6);
        if (q < 0.15) { fi = 2; flash = true; }
        else if (q < 0.4) fi = 4;
        else if (q < 0.6) fi = 5;
        else {
          // puff of pixels
          const k = (q - 0.6) / 0.4;
          const n = boss ? 14 : 9;
          ctx.save();
          ctx.globalAlpha *= (1 - k) * alpha;
          for (let i = 0; i < n; i++) {
            const ang = (i / n) * Math.PI * 2 + seed;
            const rr = (4 + k * (boss ? 22 : 13)) * scale;
            const px = Math.round(x + Math.cos(ang) * rr), py = Math.round(y - (boss ? 14 : 8) * scale + Math.sin(ang) * rr * 0.7);
            const sz = Math.max(1, Math.round((boss ? 3 : 2) * (1 - k * 0.6))) * scale;
            ctx.fillStyle = i % 3 === 0 ? '#ffffff' : shadow ? '#40355f' : i % 3 === 1 ? gn.main : gn.accent;
            ctx.fillRect(px, py, sz, sz);
          }
          ctx.restore();
          return;
        }
      }
      if (glowCol && !flash) {
        // faint ground glow under shadow monsters
        ctx.save(); ctx.globalAlpha *= 0.25 * alpha; ctx.fillStyle = glowCol;
        ctx.fillRect(Math.round(x - (this.w / 2 - 2) * scale), Math.round(y - 1 * scale), (this.w - 4) * scale, scale);
        ctx.restore();
      }
      drawSprite(ctx, spr, fi, x + dx, y + dy, { scale, flash, alpha: a, flip });
    },
    portraitURL(scale = 3) {
      const pw = maxX - minX + 3, ph = H - minY + 2;
      const c = makeCanvas(pw * scale, ph * scale);
      const cx = c.getContext('2d');
      cx.imageSmoothingEnabled = false;
      cx.drawImage(spr.canvas(0), minX - 1, minY - 1, pw, ph, 0, 0, pw * scale, ph * scale);
      return canvasURL(c);
    },
  };
  monCache.set(key, m);
  return m;
}

// Names only (no rendering) — handy for intros/cards.
export function monsterName(seed, { boss = false, shadow = false } = {}) {
  seed = typeof seed === 'number' && Number.isFinite(seed) ? Math.abs(Math.floor(seed)) : hashStr(String(seed));
  const gn = genome(seed, ['#000000'], boss, shadow);
  return shadow ? 'Shadow ' + gn.name.split(' ').pop() : gn.name;
}
