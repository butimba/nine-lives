import { spriteFromGrids } from './sprite.js';
export function box(id, w, h, col) {
  const g = new Array(w * h).fill(col);
  for (let x = 0; x < w; x++) { g[x] = '#0e0b16'; g[(h - 1) * w + x] = '#0e0b16'; }
  for (let y = 0; y < h; y++) { g[y * w] = '#0e0b16'; g[y * w + w - 1] = '#0e0b16'; }
  return spriteFromGrids({ id, w, h, grids: [g], anchor: { x: w >> 1, y: h }, points: [{ head: { x: w >> 1, y: 3 } }] });
}
