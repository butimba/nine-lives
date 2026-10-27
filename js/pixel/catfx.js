// Skin effects for the cat (internal helper of cat.js).
// Static painters bake pixels into a frame grid ('under' = before auto-outline, so they get outlined;
// 'over' = after outline, thin details). Animated painters draw each frame in logical px.
import { PAL, shade, mix } from './palette.js';
import { rng32 } from './sprite.js';

// ---------- static helpers ----------
function set(c, bx, by, col) {
  const gx = bx + c.ox, gy = by + c.oy;
  if (gx < 0 || gy < 0 || gx >= c.w || gy >= c.h) return;
  c.g[gy * c.w + gx] = col;
}
function get(c, bx, by) {
  const gx = bx + c.ox, gy = by + c.oy;
  if (gx < 0 || gy < 0 || gx >= c.w || gy >= c.h) return null;
  return c.g[gy * c.w + gx];
}
const ch = (c, bx, by) => (c.chars[by] && c.chars[by][bx]) || '.';
const isFur = (c, bx, by) => 'FHsSqxXL'.includes(ch(c, bx, by));
// head-relative setter (head template coords)
const hs = (c, X, Y, col) => set(c, c.frame.hx + X, c.frame.hy + Y, col);
function rows(c, x0, y0, art, map) {
  art.forEach((r, j) => { for (let i = 0; i < r.length; i++) { const k = r[i]; if (k !== '.' && map[k]) set(c, x0 + i, y0 + j, map[k]); } });
}
// deterministic list of fur pixels inside the body (not head) for sprinkles/stitches
function furSpots(c, n, seed, region) {
  const r = rng32(seed), out = [];
  const pts = [];
  for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) {
    if (!isFur(c, x, y)) continue;
    // keep away from the edge so spots don't touch the outline
    if (!isFur(c, x - 1, y) || !isFur(c, x + 1, y) || !isFur(c, x, y - 1) || !isFur(c, x, y + 1)) continue;
    const inHead = x >= c.frame.hx && x < c.frame.hx + 13 && y >= c.frame.hy && y < c.frame.hy + 11;
    if (region === 'body' && inHead) continue;
    if (region === 'head' && !inHead) continue;
    pts.push([x, y]);
  }
  for (let i = 0; i < n && pts.length; i++) {
    const j = Math.floor(r() * pts.length);
    const p = pts.splice(j, 1)[0];
    // no two spots adjacent
    for (let k = pts.length - 1; k >= 0; k--) if (Math.abs(pts[k][0] - p[0]) <= 1 && Math.abs(pts[k][1] - p[1]) <= 1) pts.splice(k, 1);
    out.push(p);
  }
  return out;
}

const STATIC = {
  shrimp(c, layer) {
    const st = c.skin.colors.stripe, belly = c.skin.colors.belly;
    const dk = shade(st, -0.18);
    if (layer === 'under') {
      // fan tail (telson) at the tail tip
      const [tx, ty] = c.tail;
      if (c.body === 'loaf') {
        rows(c, tx - 3, ty - 2, ['S..', 'SS.', '.SS', 'SS.', 'S..'], { S: st });
      } else {
        rows(c, tx - 2, ty - 3, ['S.b.S', 'SSbSS', '.SSS.'], { S: st, b: dk });
      }
      // little swimmeret legs under the belly (sit-type poses)
      if (c.body === 'sit' || c.body === 'puff') { set(c, 11, 21, st); set(c, 9, 21, st); }
    } else {
      // shell shine: light dots along the back segments
      for (const [x, y] of [[13, 10], [10, 12], [8, 14], [7, 17]]) if (c.body === 'sit' && isFur(c, x, y)) set(c, x, y, mix(belly, '#ffffff', 0.4));
    }
  },
  candy(c, layer) {
    if (layer !== 'over') return;
    const cols = c.skin.id === 'gingerbread' ? ['#ffffff', '#ff4b4b', '#ffffff', '#3aa34f'] : ['#ff4f9a', '#5bd1ff', '#ffe14d', '#7cf07c', '#ffffff'];
    furSpots(c, 9, 77 + c.fi, 'body').forEach(([x, y], i) => set(c, x, y, cols[i % cols.length]));
    if (c.skin.id === 'gingerbread') {
      // icing zigzag on the forehead + white buttons
      hs(c, 4, 3, '#ffffff'); hs(c, 5, 4, '#ffffff'); hs(c, 6, 3, '#ffffff'); hs(c, 7, 4, '#ffffff'); hs(c, 8, 3, '#ffffff');
    }
  },
  robot(c, layer) {
    const st = c.skin.colors.stripe, ear = c.skin.colors.ear;
    if (layer === 'under') {
      // antenna stalk
      hs(c, 6, 2, st); hs(c, 6, 1, st); hs(c, 6, 0, st); hs(c, 6, -1, st);
      hs(c, 5, -2, ear); hs(c, 6, -2, ear); hs(c, 5, -3, ear); hs(c, 6, -3, ear);
    } else {
      // cheek bolts
      hs(c, 0, 6, st); hs(c, 12, 6, st);
      // chest panel
      const pts = c.body === 'sit' || c.body === 'puff' ? [[11, 15], [12, 15], [13, 15], [11, 16], [13, 16], [11, 17], [12, 17], [13, 17]] : [];
      pts.forEach(([x, y]) => isFur(c, x, y) && set(c, x, y, st));
      if (pts.length) set(c, 12, 16, '#38e8ff');
      // seam line across the back
      furSpots(c, 3, 5 + c.fi, 'body').forEach(([x, y]) => { set(c, x, y, shade(st, -0.1)); });
    }
  },
  ice(c, layer) {
    if (layer === 'under') {
      // ice spikes along the back (sit) / shoulders
      const spikes = { sit: [[13, 8], [11, 9], [9, 10]], puff: [[13, 9], [11, 10], [9, 11]], jump: [[5, 7], [8, 7]], crouch: [[8, 11], [11, 11]], swipe: [[8, 12], [11, 12]], loaf: [[8, 12], [11, 12], [14, 12]], stand: [], stand2: [] }[c.body] || [];
      spikes.forEach(([x, y]) => { set(c, x, y, '#d2f2ff'); set(c, x, y - 1, '#ffffff'); });
    } else {
      // frosted ear tips
      hs(c, 2, 0, '#ffffff'); hs(c, 9, 0, '#ffffff');
    }
  },
  zombie(c, layer) {
    if (layer === 'under') {
      // torn ear: bite out of the near ear tip
      hs(c, 9, 0, null);
    } else {
      const k = '#3a2a2a';
      // forehead stitches
      hs(c, 9, 3, k); hs(c, 10, 3, k); hs(c, 11, 3, k); hs(c, 9, 4, k); hs(c, 11, 2, null);
      // body stitch: horizontal seam with ticks
      const s = { sit: [9, 16], puff: [9, 17], jump: [5, 11], crouch: [8, 15], swipe: [8, 16], loaf: [6, 16], stand: [8, 14], stand2: [9, 15] }[c.body];
      if (s) {
        for (let i = 0; i < 4; i++) if (isFur(c, s[0] + i, s[1])) set(c, s[0] + i, s[1], k);
        for (const i of [0, 2]) { if (isFur(c, s[0] + i, s[1] - 1)) set(c, s[0] + i, s[1] - 1, k); if (isFur(c, s[0] + i, s[1] + 1)) set(c, s[0] + i, s[1] + 1, k); }
      }
    }
  },
  pumpkin(c, layer) {
    if (layer !== 'under') return;
    hs(c, 6, 2, '#5a3324'); hs(c, 6, 1, '#5a3324'); hs(c, 7, 0, '#5a3324');
    hs(c, 7, 1, '#3aa34f'); hs(c, 8, 1, '#3aa34f'); hs(c, 8, 0, '#93e04c');
  },
  galaxy(c, layer) {
    if (layer !== 'over') return;
    const star = c.skin.id === 'dream' ? '#ffffff' : '#fff1a8';
    furSpots(c, 6, 404 + c.fi, 'body').forEach(([x, y], i) => set(c, x, y, i % 3 ? mix(c.map.F, '#ffffff', 0.35) : star));
    furSpots(c, 2, 9 + c.fi, 'head').forEach(([x, y]) => { if (!'kWIp'.includes(ch(c, x, y))) set(c, x, y, mix(c.map.F, '#ffffff', 0.35)); });
  },
  ghost(c, layer) {
    if (layer !== 'under') return;
    // wavy, see-through bottom: cut the lowest rows into a wave
    let maxY = 0;
    for (let y = 0; y < c.chars.length; y++) if (c.chars[y].some((k) => k !== '.')) maxY = y;
    for (let x = -c.ox; x < c.w - c.ox; x++) {
      const ph = (x + c.v * 2) % 4;
      const cut = ph === 0 ? 2 : ph === 1 || ph === 3 ? 1 : 0;
      for (let k = 0; k < cut; k++) set(c, x, maxY - k, null);
    }
  },
  golden(c, layer) {
    if (layer !== 'over') return;
    // polished highlights on the back + forehead
    furSpots(c, 4, 31 + c.fi, 'body').forEach(([x, y]) => set(c, x, y, '#fff1b0'));
    hs(c, 3, 4, '#fff1b0');
  },
  rainbow(c, layer) {
    if (layer !== 'under') return;
    const HUES = ['#ff5d5d', '#ffa04d', '#ffe14d', '#6bdc6b', '#5bb5ff', '#a77bff'];
    for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) {
      const k = ch(c, x, y);
      if (!'FHsSqxXzZL'.includes(k)) continue;
      const band = ((Math.floor((y + c.v) / 2) % 6) + 6) % 6;
      const base = HUES[band];
      set(c, x, y, 'HSXZ'.includes(k) ? shade(base, -0.14) : base);
    }
  },
  fire() {}, toxic() {},
};

export function paintFxStatic(fx, c, layer) {
  for (const f of fx) if (STATIC[f]) STATIC[f](c, layer);
}

// ---------- animated ----------
function P(o, gx, gy, col, w = 1, h = 1) {
  const { ctx, x, y, scale, flip, spr } = o;
  const ax = flip ? spr.w - spr.anchor.x : spr.anchor.x;
  const lx = flip ? spr.w - gx - w : gx;
  ctx.fillStyle = col;
  ctx.fillRect(Math.round(x + (lx - ax) * scale), Math.round(y + (gy - spr.anchor.y) * scale), w * scale, h * scale);
}
// sparkle: + shape with bright centre, size 0..2
function sparkle(o, gx, gy, size, col = '#fff1a8') {
  P(o, gx, gy, '#ffffff');
  if (size >= 1) { P(o, gx - 1, gy, col); P(o, gx + 1, gy, col); P(o, gx, gy - 1, col); P(o, gx, gy + 1, col); }
  if (size >= 2) { P(o, gx - 2, gy, col); P(o, gx + 2, gy, col); P(o, gx, gy - 2, col); P(o, gx, gy + 2, col); }
}
const hp = (o, X, Y) => { const f = o.rec.frames[o.fi]; return [f.hx + X + o.rec.ox, f.hy + Y + o.rec.oy]; };

const ANIM = {
  shrimp(o, layer) {
    if (layer !== 'front') return;
    const st = o.rec.skin.colors.stripe;
    const w = (i) => Math.round(Math.sin(o.t * 6 + i * 0.9) * (i > 3 ? 1 : 0));
    const a1 = [[5, 2], [4, 1], [3, 0], [2, -1], [1, -2], [0, -2], [-1, -2], [-2, -1], [-3, 0]];
    const a2 = [[8, 2], [9, 1], [9, 0], [10, -1], [11, -2], [12, -2], [13, -2], [14, -1], [15, 0]];
    a1.forEach(([X, Y], i) => { const [gx, gy] = hp(o, X, Y + w(i)); P(o, gx, gy, st); });
    a2.forEach(([X, Y], i) => { const [gx, gy] = hp(o, X, Y + w(i + 2)); P(o, gx, gy, st); });
  },
  fire(o, layer) {
    const top = o.rec.top[o.fi];
    const cols = ['#fff1a8', '#ffd23f', '#ffa04d', '#e8434f'];
    if (layer === 'back') {
      // a crown of flames along the back/head silhouette; heights from cheap value noise
      const f = Math.floor(o.t * 9);
      const minX = top.findIndex((v) => v >= 0);
      for (let gx = 0; gx < top.length; gx++) {
        const gy = top[gx];
        if (gy < 0 || gx > 24) continue; // keep the face clear
        const n = (Math.sin(gx * 2.1 + f * 1.7) + Math.sin(gx * 0.7 - f * 2.3)) * 0.25 + 0.5;
        const hgt = 1 + Math.floor(n * 4.2);
        for (let k = 1; k <= hgt; k++) {
          const rel = k / hgt; // 0 near body .. 1 at tip
          P(o, gx, gy - k + 1, rel > 0.8 ? '#e8434f' : rel > 0.5 ? '#ffa04d' : k === 1 ? '#fff1a8' : '#ffd23f');
        }
        if (gx === minX) continue;
      }
    } else {
      // embers rising
      const r = rng32(Math.floor(o.t * 4) + 1);
      for (let i = 0; i < 3; i++) {
        const ph = (o.t * 1.5 + i / 3) % 1;
        const gx = 6 + Math.floor(r() * 22);
        const gy = Math.round(o.rec.top[o.fi][gx] - 2 - ph * 10);
        if (o.rec.top[o.fi][gx] > 0) P(o, gx, gy, ph < 0.5 ? '#ffd23f' : '#e8434f');
      }
    }
  },
  toxic(o, layer) {
    if (layer !== 'front') return;
    // drips falling from the chin and the belly
    const drips = [[6, 10, 0], [10, 10, 0.45]];
    drips.forEach(([X, Y, off]) => {
      const ph = (o.t * 0.9 + off) % 1;
      const [gx, gy] = hp(o, X, Y);
      if (ph < 0.4) { P(o, gx, gy + 1, '#93e04c'); if (ph > 0.2) P(o, gx, gy + 2, '#93e04c'); }
      else { const d = Math.round((ph - 0.4) * 22); P(o, gx, gy + 2 + d, '#93e04c'); P(o, gx, gy + 3 + d, '#3aa34f'); }
    });
    // bubble popping above
    const ph = (o.t * 0.6) % 1;
    const [bx, by] = hp(o, -1, 2);
    if (ph < 0.8) { const yy = by - Math.round(ph * 6); P(o, bx, yy, '#93e04c'); P(o, bx + 1, yy - 1, '#d8ff9e'); }
  },
  galaxy(o, layer) {
    if (layer !== 'front') return;
    const pts = o.rec.furMask[o.fi];
    const r = rng32(Math.floor(o.t * 3) + 99);
    for (let i = 0; i < 2; i++) { const p = pts[Math.floor(r() * pts.length)]; sparkle(o, p[0], p[1], 1, o.rec.skin.colors.eye); }
  },
  golden(o, layer) {
    if (layer !== 'front') return;
    const spots = [[3, 4], [28, 8], [30, 20], [6, 22], [18, 2]];
    spots.forEach(([gx, gy], i) => {
      const ph = (o.t * 0.8 + i * 0.37) % 1;
      if (ph < 0.35) sparkle(o, gx, gy, ph < 0.12 || ph > 0.24 ? 0 : 1, '#ffd23f');
    });
  },
  rainbow(o, layer) { ANIM.golden(o, layer); },
  ice(o, layer) {
    if (layer !== 'front') return;
    const spots = [[4, 10], [27, 14], [8, 26], [25, 4]];
    spots.forEach(([gx, gy], i) => {
      const ph = (o.t * 0.7 + i * 0.29) % 1;
      if (ph < 0.3) sparkle(o, gx, gy, ph > 0.1 && ph < 0.2 ? 1 : 0, '#7ec4ff');
    });
  },
  robot(o, layer) {
    if (layer !== 'front') return;
    if (Math.floor(o.t * 2) % 2) { const [gx, gy] = hp(o, 5, -3); P(o, gx, gy, '#ffffff'); }
  },
  ghost(o, layer) {
    if (layer !== 'back') return;
    // faint trail wisps
    const ph = (o.t * 0.5) % 1;
    const [gx, gy] = hp(o, -4, 12);
    o.ctx.globalAlpha *= 0.5;
    P(o, gx - Math.round(ph * 4), gy - Math.round(ph * 3), '#c9cdf5');
    o.ctx.globalAlpha /= 0.5;
  },
};

export function paintFxAnim(fx, o, layer) {
  for (const f of fx) if (ANIM[f]) ANIM[f](o, layer);
}
export const fxBounds = {};
