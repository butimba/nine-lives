// Pixelizer: turns emoji / 'color:#hex' / 'num:7' into small, consistent pixel-art images.
// pixelImage(img, size=18) -> canvas of (size+2)x(size+2) (1px outline room), cached.
// pixelURL(img, scale=3) -> dataURL (cached).
import { PAL, hexToRgb, rgbToHex, shade, mix } from './palette.js';
import { makeCanvas, canvasURL } from './sprite.js';
import { drawText, textWidth } from './font.js';

const OUT = [14, 11, 22];
const cache = new Map();
const urlCache = new Map();
const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif';

// work canvas for big renders
let work = null;
function workCtx(n) {
  if (!work || work.width !== n) { work = makeCanvas(n, n); }
  const ctx = work.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, n, n);
  return ctx;
}

function pixelizeEmoji(str, size) {
  const N = 160;
  const ctx = workCtx(N);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `120px ${EMOJI_FONT}`;
  ctx.fillStyle = '#000';
  ctx.fillText(str, N / 2, N / 2 + 6);
  const src = ctx.getImageData(0, 0, N, N).data;
  // bounds
  let x0 = N, y0 = N, x1 = -1, y1 = -1;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (src[(y * N + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const out = new Array(size * size).fill(null);
  if (x1 < 0) return out;
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const cell = Math.max(bw, bh) / size; // source px per target px
  const ox = x0 - (size * cell - bw) / 2, oy = y0 - (size * cell - bh) / 2;
  for (let ty = 0; ty < size; ty++) for (let tx = 0; tx < size; tx++) {
    const sx0 = ox + tx * cell, sy0 = oy + ty * cell;
    let a = 0, r = 0, g = 0, b = 0, n = 0;
    const steps = Math.max(2, Math.round(cell));
    for (let j = 0; j < steps; j++) for (let i = 0; i < steps; i++) {
      const sx = Math.floor(sx0 + ((i + 0.5) * cell) / steps), sy = Math.floor(sy0 + ((j + 0.5) * cell) / steps);
      n++;
      if (sx < 0 || sy < 0 || sx >= N || sy >= N) continue;
      const k = (sy * N + sx) * 4, al = src[k + 3];
      if (!al) continue;
      a += al; r += src[k] * al; g += src[k + 1] * al; b += src[k + 2] * al;
    }
    const cov = a / (n * 255);
    if (cov < 0.42) continue;
    out[ty * size + tx] = [r / a, g / a, b / a];
  }
  // posterize lightly: snap each channel to a 6-level ramp + boost contrast a touch -> crisper, flatter pixel look
  for (let i = 0; i < out.length; i++) {
    const c = out[i];
    if (!c) continue;
    out[i] = c.map((v) => {
      const s = Math.min(255, Math.max(0, (v - 128) * 1.12 + 128));
      return Math.round(s / 51) * 51 * 0.7 + s * 0.3;
    });
  }
  return out;
}

// paint splat for 'color:#hex'
const BLOB = [
  '......####........',
  '....#######...##..',
  '...##########.###.',
  '..##############..',
  '.###############..',
  '.################.',
  '#################.',
  '.################.',
  '.#################',
  '..###############.',
  '..##############..',
  '.##############...',
  '.#############....',
  '..###########.....',
  '...#########.##...',
  '....####.###.###..',
  '...........#..##..',
  '..................',
];
function colorBlob(hex, size) {
  const out = new Array(size * size).fill(null);
  const base = hexToRgb(hex);
  const hi = hexToRgb(shade(hex, 0.16)), lo = hexToRgb(shade(hex, -0.14));
  const k = BLOB.length / size;
  const inside = (x, y) => { const r = BLOB[Math.floor(y * k)]; return r && r[Math.floor(x * k)] === '#'; };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inside(x, y)) continue;
    let c = base;
    if (!inside(x + 1, y + 1) || !inside(x, y + 2)) c = lo;
    else if (!inside(x - 1, y - 1)) c = hi;
    out[y * size + x] = c;
  }
  // glossy highlight
  const gx = Math.floor(size * 0.3), gy = Math.floor(size * 0.25);
  for (const [dx, dy] of [[0, 0], [1, 0], [0, 1]]) if (out[(gy + dy) * size + gx + dx]) out[(gy + dy) * size + gx + dx] = [255, 255, 255];
  return out;
}

function toCanvas(px, size, outline = true) {
  const S = size + 2;
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const d = img.data;
  const at = (x, y) => (x >= 0 && y >= 0 && x < size && y < size ? px[y * size + x] : null);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const o = (y * S + x) * 4;
    const c0 = at(x - 1, y - 1);
    if (c0) { d[o] = c0[0]; d[o + 1] = c0[1]; d[o + 2] = c0[2]; d[o + 3] = 255; continue; }
    if (outline && (at(x - 2, y - 1) || at(x, y - 1) || at(x - 1, y - 2) || at(x - 1, y))) { d[o] = OUT[0]; d[o + 1] = OUT[1]; d[o + 2] = OUT[2]; d[o + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

export function pixelImage(img, size = 18) {
  const s = String(img ?? '');
  const key = s + '|' + size;
  let c = cache.get(key);
  if (c) return c;
  if (s.startsWith('color:')) {
    c = toCanvas(colorBlob(s.slice(6).trim(), size), size);
  } else if (s.startsWith('num:')) {
    const n = s.slice(4).trim();
    c = makeCanvas(size + 2, size + 2);
    const ctx = c.getContext('2d');
    const sc = textWidth(n, 2) <= size + 2 ? 2 : 1;
    const w = textWidth(n, sc);
    drawText(ctx, n, Math.floor((size + 2 - w) / 2), Math.floor((size + 2 - 7 * sc) / 2), { color: PAL.w, scale: sc, outline: PAL.k });
  } else {
    c = toCanvas(pixelizeEmoji(s, size), size);
  }
  cache.set(key, c);
  return c;
}

export function pixelURL(img, scale = 3) {
  const key = img + '|' + scale;
  let u = urlCache.get(key);
  if (u) return u;
  const c = pixelImage(img);
  const o = makeCanvas(c.width * scale, c.height * scale);
  const ctx = o.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, 0, 0, o.width, o.height);
  u = canvasURL(o);
  urlCache.set(key, u);
  return u;
}
