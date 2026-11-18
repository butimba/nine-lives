// Pixel panels drawn straight onto a canvas (logical px). Styles: wood | stone | bubble | paper | block.
// drawPanel(ctx, x, y, w, h, style, { tint, tail }) — tint recolours the fill; bubble accepts tail: 'left'|'right'|'down'.
import { PAL, shade, mix } from './palette.js';

const K = PAL.k;
function R(ctx, x, y, w, h, c) { if (w <= 0 || h <= 0) return; ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }

// rounded box outline+fill with corner radius 1 or 2 (pixel steps)
function box(ctx, x, y, w, h, fill, r = 1) {
  if (r >= 2) {
    R(ctx, x + 2, y, w - 4, 1, K); R(ctx, x + 2, y + h - 1, w - 4, 1, K);
    R(ctx, x, y + 2, 1, h - 4, K); R(ctx, x + w - 1, y + 2, 1, h - 4, K);
    R(ctx, x + 1, y + 1, 1, 1, K); R(ctx, x + w - 2, y + 1, 1, 1, K); R(ctx, x + 1, y + h - 2, 1, 1, K); R(ctx, x + w - 2, y + h - 2, 1, 1, K);
    R(ctx, x + 2, y + 1, w - 4, h - 2, fill); R(ctx, x + 1, y + 2, w - 2, h - 4, fill);
  } else {
    R(ctx, x + 1, y, w - 2, 1, K); R(ctx, x + 1, y + h - 1, w - 2, 1, K);
    R(ctx, x, y + 1, 1, h - 2, K); R(ctx, x + w - 1, y + 1, 1, h - 2, K);
    R(ctx, x + 1, y + 1, w - 2, h - 2, fill);
  }
}

const STYLES = {
  wood(ctx, x, y, w, h, base) {
    base = base || '#9a5d34';
    const hi = shade(base, 0.12), lo = shade(base, -0.16), line = shade(base, -0.3);
    box(ctx, x, y, w, h, base, 1);
    R(ctx, x + 1, y + 1, w - 2, 1, hi); R(ctx, x + 1, y + 1, 1, h - 2, hi);
    R(ctx, x + 1, y + h - 2, w - 2, 1, lo); R(ctx, x + w - 2, y + 1, 1, h - 2, lo);
    // plank seams with staggered joints
    let row = 0;
    for (let yy = y + 7; yy < y + h - 3; yy += 7, row++) {
      R(ctx, x + 2, yy, w - 4, 1, line);
      R(ctx, x + 2, yy + 1, w - 4, 1, hi);
      const jx = x + 8 + ((row * 23) % Math.max(8, w - 16));
      if (jx < x + w - 6) R(ctx, jx, yy - 6, 1, 6, line);
    }
    // nails
    for (const [nx, ny] of [[x + 3, y + 3], [x + w - 4, y + 3], [x + 3, y + h - 4], [x + w - 4, y + h - 4]]) { R(ctx, nx, ny, 1, 1, '#a9b6cb'); }
  },
  stone(ctx, x, y, w, h, base) {
    base = base || '#7a7290';
    const hi = shade(base, 0.12), lo = shade(base, -0.15), mortar = shade(base, -0.28);
    box(ctx, x, y, w, h, base, 1);
    // brick courses
    let row = 0;
    for (let yy = y + 1; yy < y + h - 1; yy += 6, row++) {
      const hh = Math.min(6, y + h - 1 - yy);
      if (yy > y + 1) R(ctx, x + 1, yy, w - 2, 1, mortar);
      const off = row % 2 ? 6 : 0;
      for (let xx = x + 1 - off; xx < x + w - 1; xx += 12) {
        const bx = Math.max(x + 1, xx), bw = Math.min(xx + 12, x + w - 1) - bx;
        if (xx > x + 1) R(ctx, xx, yy + (yy > y + 1 ? 1 : 0), 1, hh - 1, mortar);
        R(ctx, bx + (xx > x + 1 ? 1 : 0), yy + (yy > y + 1 ? 1 : 0), Math.max(0, bw - 1), 1, hi);
        R(ctx, bx + 1, yy + hh - 1, Math.max(0, bw - 2), 1, lo);
      }
    }
    R(ctx, x + 1, y + h - 2, w - 2, 1, lo);
  },
  bubble(ctx, x, y, w, h, base, opts) {
    base = base || '#f4efe2';
    box(ctx, x, y, w, h, base, 2);
    R(ctx, x + 2, y + h - 2, w - 4, 1, shade(base, -0.1));
    const t = opts.tail;
    if (t === 'down' || t === 'left' || t === 'right') {
      const tx = t === 'left' ? x + 6 : t === 'right' ? x + w - 10 : x + Math.floor(w / 2) - 2;
      const ty = y + h - 1;
      // little triangular tail
      R(ctx, tx, ty, 5, 1, base); R(ctx, tx + 1, ty + 1, 3, 1, base); R(ctx, tx + 2, ty + 2, 1, 1, base);
      R(ctx, tx - 1, ty, 1, 1, K); R(ctx, tx + 5, ty, 1, 1, K); R(ctx, tx, ty + 1, 1, 1, K); R(ctx, tx + 4, ty + 1, 1, 1, K);
      R(ctx, tx + 1, ty + 2, 1, 1, K); R(ctx, tx + 3, ty + 2, 1, 1, K); R(ctx, tx + 2, ty + 3, 1, 1, K);
    }
  },
  paper(ctx, x, y, w, h, base) {
    base = base || '#f4efe2';
    const grid = mix(base, '#7ec4ff', 0.22);
    // drop shadow
    R(ctx, x + 2, y + h, w - 1, 1, 'rgba(14,11,22,0.35)'); R(ctx, x + w, y + 2, 1, h - 1, 'rgba(14,11,22,0.35)');
    box(ctx, x, y, w, h, base, 1);
    for (let xx = x + 5; xx < x + w - 2; xx += 5) R(ctx, xx, y + 2, 1, h - 4, grid);
    for (let yy = y + 5; yy < y + h - 2; yy += 5) R(ctx, x + 2, yy, w - 4, 1, grid);
    // margin line
    if (w > 30) R(ctx, x + 9, y + 1, 1, h - 2, mix(base, '#e8434f', 0.35));
    // dog-ear corner
    R(ctx, x + w - 4, y + 1, 3, 1, shade(base, -0.08)); R(ctx, x + w - 3, y + 2, 2, 1, shade(base, -0.08)); R(ctx, x + w - 2, y + 3, 1, 1, shade(base, -0.08));
  },
  block(ctx, x, y, w, h, base) {
    base = base || '#3aa34f';
    const hi = shade(base, 0.14), hi2 = shade(base, 0.24), lo = shade(base, -0.16), lo2 = shade(base, -0.28);
    box(ctx, x, y, w, h, base, 1);
    R(ctx, x + 1, y + 1, w - 2, 2, hi); R(ctx, x + 1, y + 1, 2, h - 2, hi);
    R(ctx, x + 1, y + 1, w - 3, 1, hi2);
    R(ctx, x + 1, y + h - 3, w - 2, 2, lo); R(ctx, x + w - 3, y + 1, 2, h - 2, lo);
    R(ctx, x + 2, y + h - 2, w - 3, 1, lo2);
    // texture speckles (minecraft-ish), deterministic
    let s = (x * 73856093) ^ (y * 19349663) ^ (w * 83492791);
    for (let i = 0; i < Math.floor((w * h) / 40); i++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const px = x + 4 + (s % Math.max(1, w - 8));
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const py = y + 4 + (s % Math.max(1, h - 8));
      R(ctx, px, py, 1, 1, i % 2 ? lo : hi);
    }
  },
};

export function drawPanel(ctx, x, y, w, h, style = 'wood', opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (w < 6 || h < 6) { box(ctx, x, y, Math.max(2, w), Math.max(2, h), opts.tint || '#f4efe2', 1); return; }
  (STYLES[style] || STYLES.wood)(ctx, x, y, w, h, opts.tint, opts);
}
export const PANEL_STYLES = Object.keys(STYLES);
