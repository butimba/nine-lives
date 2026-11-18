// 5x7 bitmap font. drawText(ctx, str, x, y, { color, align, scale, outline }) — y = top of the glyph box.
// Charset: A–Z (lowercase is shown as uppercase), 0–9, + - x(×) ! ? / : % . , ' space.
// outline: colour or null; outline adds 1px on every side (8-neighbour), included in measurements.
import { UI } from './palette.js';
import { makeCanvas } from './sprite.js';

const G = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  0: ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  1: ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  2: ['.###.', '#...#', '....#', '...#.', '..#..', '.#...', '#####'],
  3: ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  4: ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  5: ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  6: ['.###.', '#....', '#....', '####.', '#...#', '#...#', '.###.'],
  7: ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  8: ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  9: ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '-': ['....', '....', '....', '####', '....', '....', '....'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  '!': ['#', '#', '#', '#', '#', '.', '#'],
  '?': ['.###.', '#...#', '....#', '...#.', '..#..', '.....', '..#..'],
  '/': ['....#', '....#', '...#.', '..#..', '.#...', '#....', '#....'],
  ':': ['.', '#', '.', '.', '.', '#', '.'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
  '.': ['.', '.', '.', '.', '.', '.', '#'],
  ',': ['..', '..', '..', '..', '..', '.#', '#.'],
  "'": ['#', '#', '.', '.', '.', '.', '.'],
  ' ': ['...', '...', '...', '...', '...', '...', '...'],
};
const GLYPH_H = 7;
function glyph(ch) {
  if (G[ch]) return G[ch];
  if (ch === '×') return G.x;
  const up = ch.toUpperCase();
  if (G[up]) return G[up];
  return G['?'];
}

// width in px at scale 1 (without outline)
export function textWidth(str, scale = 1, { outline = UI.ink } = {}) {
  let w = 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) w += glyph(s[i])[0].length + (i < s.length - 1 ? 1 : 0);
  return (w + (outline ? 2 : 0)) * scale;
}
export const TEXT_H = GLYPH_H;

const cache = new Map();
function render(str, color, outline) {
  const key = str + '|' + color + '|' + outline;
  let c = cache.get(key);
  if (c) return c;
  const pad = outline ? 1 : 0;
  const w = textWidth(str, 1, { outline: null }) + pad * 2, h = GLYPH_H + pad * 2;
  c = makeCanvas(Math.max(1, w), h);
  const ctx = c.getContext('2d');
  const pts = [];
  let cx = pad;
  for (const ch of String(str)) {
    const g = glyph(ch);
    for (let y = 0; y < GLYPH_H; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === '#') pts.push([cx + x, pad + y]);
    cx += g[0].length + 1;
  }
  if (outline) {
    ctx.fillStyle = outline;
    for (const [x, y] of pts) ctx.fillRect(x - 1, y - 1, 3, 3);
  }
  ctx.fillStyle = color;
  for (const [x, y] of pts) ctx.fillRect(x, y, 1, 1);
  if (cache.size > 600) cache.clear();
  cache.set(key, c);
  return c;
}

export function drawText(ctx, str, x, y, { color = UI.paper, align = 'left', scale = 1, outline = UI.ink } = {}) {
  str = String(str);
  if (!str) return 0;
  const c = render(str, color, outline || null);
  const w = c.width * scale;
  let dx = x;
  if (align === 'center') dx = x - w / 2;
  else if (align === 'right') dx = x - w;
  const pad = outline ? scale : 0;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round(dx), Math.round(y - pad), w, c.height * scale);
  return w;
}

// Render text to its own canvas (for DOM use), e.g. textCanvas('FLOOR 3', { scale: 3 }).
export function textCanvas(str, { color = UI.paper, outline = UI.ink, scale = 1 } = {}) {
  const c = render(String(str), color, outline || null);
  const o = makeCanvas(c.width * scale, c.height * scale);
  const x = o.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.drawImage(c, 0, 0, o.width, o.height);
  return o;
}
