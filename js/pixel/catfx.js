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


const inHead = (c, x, y) => x >= c.frame.hx && x < c.frame.hx + 13 && y >= c.frame.hy && y < c.frame.hy + 11;
// Christmas-lights wire: diagonal lines over the body fur (body coords). Shared by the static wire and the animated bulbs.
function wirePts(chars, frame) {
  const out = [];
  const fur = (x, y) => 'FHsSqxXLzZBb'.includes((chars[y] && chars[y][x]) || '.');
  for (let y = 0; y < chars.length; y++) for (let x = 0; x < chars[y].length; x++) {
    const head = x >= frame.hx && x < frame.hx + 13 && y >= frame.hy && y < frame.hy + 11;
    if (!fur(x, y)) continue;
    // a ring around the neck + two diagonal loops round the body
    if (head ? y === frame.hy + 10 : ((x + y * 2) % 9 === 0 || (x + y * 2) % 9 === 1)) out.push([x, y]);
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

  // ---------- Stage 4: Shark + Christmas / New Year ----------
  shark(c, layer) {
    const dk = c.skin.colors.stripe, lt = mix(c.skin.colors.fur, '#ffffff', 0.25);
    if (layer === 'under') {
      // dorsal fin on the back + forked tail fin
      const fin = { sit: [7, 12], puff: [7, 13], jump: [8, 8], crouch: [9, 12], swipe: [9, 13], loaf: [7, 13], stand: [5, 10], stand2: [5, 11] }[c.body];
      if (fin) rows(c, fin[0] - 1, fin[1] - 5, ['S....', 'SS...', 'SLS..', 'SLLS.', '.SLLS', '.SSSS'], { S: dk, L: lt });
      const [tx, ty] = c.tail;
      if (c.body === 'loaf') rows(c, tx - 3, ty - 2, ['S..', 'SS.', '.S.', 'SS.', 'S..'], { S: dk });
      else rows(c, tx - 2, ty - 3, ['S...S', '.S.S.', '..S..'], { S: dk });
    } else {
      // toothy grin + gills
      for (let X = 4; X <= 10; X++) hs(c, X, 9, X % 2 ? '#ffffff' : PAL.k);
      hs(c, 5, 10, '#ffffff'); hs(c, 7, 10, '#ffffff'); hs(c, 9, 10, '#ffffff');
      for (const X of [1, 3]) { hs(c, X, 6, dk); hs(c, X, 7, dk); }
    }
  },
  santa(c, layer) {
    if (layer !== 'over') return;
    const W = '#f4efe2', belt = '#1d1d2b', gold = '#ffd23f';
    // white cuffs (paws) + fluffy beard under the chin
    for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) if ('zZ'.includes(ch(c, x, y))) set(c, x, y, W);
    for (let X = 3; X <= 11; X++) for (let Y = 9; Y <= 12; Y++) {
      const inBeard = Y === 9 ? X >= 4 && X <= 10 && X !== 6 && X !== 8 && X !== 7 : Y === 10 ? X >= 3 && X <= 11 : Y === 11 ? X >= 4 && X <= 10 : X >= 6 && X <= 8;
      if (!inBeard) continue;
      const bx = c.frame.hx + X, by = c.frame.hy + Y;
      if (Y >= 11 || ch(c, bx, by) !== '.') set(c, bx, by, Y === 12 || (Y === 11 && X % 3 === 0) ? '#d8d2e6' : W);
    }
    hs(c, 7, 9, '#ff9aa8');
    // belt with a golden buckle
    const by = { sit: 17, puff: 18, jump: 11, crouch: 16, swipe: 17, loaf: 18, stand: 16, stand2: 16 }[c.body];
    if (by != null) {
      let bx = [];
      for (let x = 0; x < (c.chars[by] || []).length; x++) if (ch(c, x, by) !== '.' && !inHead(c, x, by)) { set(c, x, by, belt); bx.push(x); }
      const bel = bx.filter((x) => 'Bb'.includes(ch(c, x, by)));
      const mid = bel.length ? bel[Math.floor(bel.length / 2)] : bx[Math.floor(bx.length / 2)];
      if (mid != null) { set(c, mid - 1, by, gold); set(c, mid + 1, by, gold); set(c, mid, by, gold); }
    }
  },
  lights(c, layer) {
    if (layer !== 'over') return;
    // the wire of the Christmas lights wraps diagonally around the body
    for (const [x, y] of wirePts(c.chars, c.frame)) set(c, x, y, '#1f4a2a');
  },
  xmastree(c, layer) {
    if (layer === 'under') {
      // a little star on top of the head
      hs(c, 6, -3, '#ffd23f'); hs(c, 5, -2, '#ffd23f'); hs(c, 6, -2, '#fff1a8'); hs(c, 7, -2, '#ffd23f'); hs(c, 6, -1, '#ffd23f');
      return;
    }
    // golden garland: zigzag across the body, baubles on top
    for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) {
      if (inHead(c, x, y) || !isFur(c, x, y)) continue;
      if ((x + y * 2) % 7 === 0 && (y % 4 === 1 || y % 4 === 2)) set(c, x, y, '#ffd23f');
    }
    const cols = ['#e8434f', '#3b9bff', '#ffd23f', '#ff8fd8', '#ffffff'];
    furSpots(c, 7, 2024 + c.fi, 'body').forEach(([x, y], i) => set(c, x, y, cols[i % cols.length]));
  },
  reindeer(c, layer) {
    if (layer === 'under') {
      const A = '#e8cfa8';
      for (const [X, Y] of [[3, -1], [3, -2], [3, -3], [2, -3], [1, -4], [4, -4], [4, -5], [9, -1], [9, -2], [9, -3], [10, -3], [11, -4], [8, -4], [8, -5]]) hs(c, X, Y, A);
    } else {
      // bigger shiny red nose + light belly spots
      hs(c, 7, 8, c.skin.colors.nose); hs(c, 8, 8, c.skin.colors.nose); hs(c, 8, 7, '#ff9aa8');
      furSpots(c, 4, 88 + c.fi, 'body').forEach(([x, y]) => set(c, x, y, mix(c.skin.colors.belly, '#ffffff', 0.3)));
    }
  },
  snowman(c, layer) {
    if (layer !== 'over') return;
    // carrot nose
    hs(c, 7, 8, '#ff8a1f'); hs(c, 8, 8, '#ff8a1f'); hs(c, 9, 8, '#d9622b');
    // coal buttons down the belly
    const B = [];
    for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) if ('Bb'.includes(ch(c, x, y)) && !inHead(c, x, y)) B.push([x, y]);
    if (B.length) {
      const cnt = {}; B.forEach(([x]) => (cnt[x] = (cnt[x] || 0) + 1));
      const col = +Object.entries(cnt).sort((a, b) => b[1] - a[1])[0][0];
      const ys = B.filter(([x]) => x === col).map(([, y]) => y).sort((a, b) => a - b);
      [0.25, 0.55, 0.85].forEach((k) => { const y = ys[Math.min(ys.length - 1, Math.floor(ys.length * k))]; if (y != null) set(c, col, y, '#1d1d2b'); });
    }
    // red + green striped scarf around the neck, one end hanging
    const sy = c.frame.hy + 10;
    for (let X = 1; X <= 11; X++) { const x = c.frame.hx + X; if (ch(c, x, sy) !== '.' || ch(c, x, sy + 1) !== '.') set(c, x, sy, X % 3 === 0 ? '#3aa34f' : '#e8434f'); }
    for (let k = 1; k <= 3; k++) set(c, c.frame.hx + 2, sy + k, k % 2 ? '#e8434f' : '#3aa34f');
  },
  elf(c, layer) {
    if (layer === 'under') {
      // green tunic on the body (head keeps its skin colour)
      const G = '#3aa34f', Gs = '#2a7a3a';
      for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) {
        const k = ch(c, x, y);
        if (inHead(c, x, y) || !'FHsSqLxX'.includes(k)) continue;
        set(c, x, y, 'HSX'.includes(k) ? Gs : G);
      }
      // jingle bell on the tail
      const [tx, ty] = c.tail;
      set(c, tx, ty, '#ffd23f'); set(c, tx - 1, ty, '#ffd23f'); set(c, tx, ty + 1, '#d99a00');
      return;
    }
    // zigzag collar under the head
    const y = c.frame.hy + 11;
    for (let X = 2; X <= 11; X++) { const x = c.frame.hx + X; if (ch(c, x, y) !== '.') set(c, x, y, X % 2 ? '#e8434f' : '#ffd23f'); }
  },
  candycane(c, layer) {
    if (layer !== 'under') return;
    // diagonal red stripes over all the fur (not the face)
    for (let y = 0; y < c.chars.length; y++) for (let x = 0; x < c.chars[y].length; x++) {
      const k = ch(c, x, y);
      if (!'FHsSqxXzZL'.includes(k)) continue;
      if (inHead(c, x, y) && y - c.frame.hy >= 4) continue;
      if (((x + y) % 4 + 4) % 4 < 2) set(c, x, y, 'HSXZ'.includes(k) ? '#b8323a' : '#e8434f');
    }
  },
  firework(c, layer) {
    if (layer !== 'over') return;
    const cols = ['#ff5d8f', '#ffe14d', '#6fe3d3', '#93e04c', '#ffffff', '#ffa04d'];
    furSpots(c, 10, 2027 + c.fi, 'body').forEach(([x, y], i) => set(c, x, y, cols[i % cols.length]));
    furSpots(c, 2, 12 + c.fi, 'head').forEach(([x, y], i) => { if (!'kWIp'.includes(ch(c, x, y))) set(c, x, y, cols[(i + 2) % cols.length]); });
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
  // ---------- Stage 4 ----------
  shark(o, layer) {
    if (layer !== 'front') return;
    // bubbles rising from the mouth
    for (let i = 0; i < 2; i++) {
      const ph = (o.t * 0.7 + i * 0.5) % 1;
      if (ph > 0.75) continue;
      const [gx, gy] = hp(o, 12 + Math.round(Math.sin(o.t * 4 + i) * 1), 8);
      const yy = gy - Math.round(ph * 14);
      P(o, gx + i * 2, yy, '#bfe8ff'); if (ph > 0.3) P(o, gx + i * 2 + 1, yy - 1, '#ffffff');
    }
  },
  lights(o, layer) {
    if (layer !== 'front') return;
    const rec = o.rec, fi = o.fi;
    rec._bulbs = rec._bulbs || [];
    if (!rec._bulbs[fi]) {
      const chars = rec.chars && rec.chars[fi];
      rec._bulbs[fi] = chars ? wirePts(chars, rec.frames[fi]).filter(([x, y], i) => i % 3 === 0).map(([x, y]) => [x + rec.ox, y + rec.oy]) : [];
    }
    const cols = ['#ff3b4f', '#ffd23f', '#3ad65a', '#3b9bff', '#ff8fd8'];
    const step = Math.floor(o.t * 3);
    const ctx = o.ctx;
    rec._bulbs[fi].forEach(([gx, gy], i) => {
      const col = cols[(i + step) % cols.length];
      const on = (i + step) % 4 !== 0;
      if (on) { const a = ctx.globalAlpha; ctx.globalAlpha = a * 0.35; P(o, gx - 1, gy - 1, col, 3, 3); ctx.globalAlpha = a; }
      P(o, gx, gy, on ? col : shade(col, -0.45));
      if (on && (i + step) % 5 === 1) P(o, gx, gy, '#ffffff');
    });
  },
  xmastree(o, layer) {
    if (layer !== 'front') return;
    const [sx, sy] = hp(o, 6, -2);
    if (Math.floor(o.t * 2.5) % 3 === 0) sparkle(o, sx, sy, 1, '#ffd23f');
    const pts = o.rec.furMask[o.fi];
    const r = rng32(Math.floor(o.t * 2) + 7);
    const p = pts[Math.floor(r() * pts.length)];
    if (p && Math.floor(o.t * 4) % 2) P(o, p[0], p[1], '#ffffff');
  },
  reindeer(o, layer) {
    if (layer !== 'front') return;
    const [nx, ny] = hp(o, 8, 8);
    const k = 0.5 + 0.5 * Math.sin(o.t * 5);
    const a = o.ctx.globalAlpha;
    o.ctx.globalAlpha = a * (0.25 + 0.35 * k); P(o, nx - 1, ny - 1, '#ff5d5d', 3, 3);
    o.ctx.globalAlpha = a * 0.18 * k; P(o, nx - 2, ny - 2, '#ff9a8a', 5, 5);
    o.ctx.globalAlpha = a;
    if (k > 0.85) P(o, nx, ny - 1, '#ffffff');
  },
  snowman(o, layer) {
    if (layer !== 'front') return;
    // a few snowflakes drifting around
    for (let i = 0; i < 4; i++) {
      const ph = (o.t * 0.35 + i * 0.25) % 1;
      const gx = 3 + ((i * 11) % 30) + Math.round(Math.sin(o.t * 2 + i) * 1.5), gy = Math.round(ph * 28);
      P(o, gx, gy, i % 2 ? '#ffffff' : '#dff6ff');
    }
  },
  elf(o, layer) {
    if (layer !== 'front') return;
    const tail = o.rec.tails[o.fi];
    if (!tail || Math.floor(o.t * 3) % 3) return;
    sparkle(o, tail[0] + o.rec.ox - 1, tail[1] + o.rec.oy - 2, 0, '#ffd23f');
  },
  candycane(o, layer) { if (layer === 'front' && Math.floor(o.t * 1.5) % 4 === 0) { const [gx, gy] = hp(o, 3, 2); sparkle(o, gx, gy, 1, '#ffffff'); } },
  santa(o, layer) {
    if (layer !== 'front') return;
    for (let i = 0; i < 3; i++) {
      const ph = (o.t * 0.3 + i / 3) % 1;
      P(o, 2 + ((i * 13) % 32), Math.round(ph * 30) - 2, '#ffffff');
    }
  },
  firework(o, layer) {
    // rockets shoot up and burst into rings of colour around the cat
    const bursts = [[4, 3, 0, '#ff5d8f'], [31, 1, 0.33, '#ffe14d'], [32, 17, 0.66, '#6fe3d3']];
    for (const [bx, by, off, col] of bursts) {
      const ph = (o.t * 0.55 + off) % 1;
      if (layer === 'back' && ph < 0.28) {
        const k = ph / 0.28;
        P(o, bx, Math.round(by + 12 - k * 12), '#fff1a8');
        if (k > 0.3) P(o, bx, Math.round(by + 13 - k * 12), '#ffa04d');
      }
      if (layer === 'front' && ph >= 0.28 && ph < 0.85) {
        const k = (ph - 0.28) / 0.57, r = 1 + Math.round(k * 5);
        const a = o.ctx.globalAlpha; o.ctx.globalAlpha = a * (k > 0.7 ? (1 - k) / 0.3 : 1);
        for (let i = 0; i < 8; i++) {
          const ang = (i / 8) * Math.PI * 2;
          P(o, Math.round(bx + Math.cos(ang) * r), Math.round(by + Math.sin(ang) * r), i % 2 ? col : '#ffffff');
          if (r > 2) P(o, Math.round(bx + Math.cos(ang) * (r - 2)), Math.round(by + Math.sin(ang) * (r - 2)), shade(col, -0.2));
        }
        if (k < 0.2) sparkle(o, bx, by, 1, col);
        o.ctx.globalAlpha = a;
      }
    }
  },

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
