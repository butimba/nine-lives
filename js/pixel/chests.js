// Treasure chests: wood / silver / gold / epic. Each is the same silhouette in a clearly different material.
// chestSprite(type) -> { w, h, type, light, draw(ctx, x, y, { cracks: 0..3, open=false, shake=0, scale=1, t }) }
// x,y = bottom-centre (feet). shake = amplitude in logical px (use 0..3). Cracks leak light in the rarity colour.
import { defineSprite, drawSprite } from './sprite.js';

const CLOSED = [
  '..hhhhTThhhhTThhhh..',
  '.hLLLLTTLLLLTTLLLLh.',
  '.LLLLLTMLLLLTMLLLLL.',
  'LLLLLLTTLLLLTTLLLLLL',
  'llllllTTllllTTllllll',
  'kkkkkkttKKKKttkkkkkk',
  'HBBBBBTTKGGKTTBBBBBb',
  'HBBBBBTMKgkKTMBBBBBb',
  'HBBBBBTTBKKBTTBBBBBb',
  'PPPPPPTTPPPPTTPPPPPP',
  'HBBBBBTTBBBBTTBBBBBb',
  'HBBBBBTMBBBBTMBBBBBb',
  'PPPPPPTTPPPPTTPPPPPP',
  'HBBBBBTTBBBBTTBBBBBb',
  'bbbbbbttbbbbttbbbbbb',
  'tt................tt',
];
const OPEN = [
  '..llllttllllttllll..',
  '.liiiiTTiiiiTTiiiil.',
  '.liiiiTTiiiiTTiiiil.',
  'lliiiiiiiiiiiiiiiill',
  'kkkkkkkkkkkkkkkkkkkk',
  'TyyyyyyyyyyyyyyyyyyT',
  'HBBBBBTTBBBBTTBBBBBb',
  'HBBBBBTMBBBBTMBBBBBb',
  'HBBBBBTTBBBBTTBBBBBb',
  'PPPPPPTTPPPPTTPPPPPP',
  'HBBBBBTTBBBBTTBBBBBb',
  'HBBBBBTMBBBBTMBBBBBb',
  'PPPPPPTTPPPPTTPPPPPP',
  'HBBBBBTTBBBBTTBBBBBb',
  'bbbbbbttbbbbttbbbbbb',
  'tt................tt',
];

const MATS = {
  wood: {
    L: '#b0703e', l: '#8e5434', h: '#d49a5e', B: '#9a5d34', b: '#6e3f24', H: '#b8763f', P: '#5a3324',
    T: '#5d6b85', t: '#3a4258', M: '#a9b6cb', K: '#d9a22b', G: '#ffd23f', g: '#9a6a12', i: '#3a2218', y: '#ffe9a8',
    light: '#fff1a8',
  },
  silver: {
    L: '#d3dbe8', l: '#97a4bd', h: '#ffffff', B: '#bcc7d9', b: '#8290ab', H: '#eef2f8', P: '#a3afc5',
    T: '#46557a', t: '#2b3654', M: '#ffffff', K: '#eef2f8', G: '#3bd8ff', g: '#1f6fa8', i: '#1d2235', y: '#c8f4ff',
    light: '#c8f4ff',
  },
  gold: {
    L: '#ffd23f', l: '#e09a00', h: '#fff4b8', B: '#f5bb22', b: '#c27f08', H: '#ffe06a', P: '#d99410',
    T: '#c22d3f', t: '#7f1728', M: '#fff1a8', K: '#fff1a8', G: '#ff4f6a', g: '#a82848', i: '#4a1d14', y: '#fff6c8',
    light: '#fff6c8',
  },
  epic: {
    L: '#7c4fd0', l: '#5232a8', h: '#a985ff', B: '#6a40bd', b: '#40237f', H: '#8e62e0', P: '#9f74ff',
    T: '#241640', t: '#140b28', M: '#6fe3d3', K: '#6fe3d3', G: '#ff5df0', g: '#a82894', i: '#1a0d33', y: '#ffb8f7',
    light: '#ff9df5',
  },
};

// crack paths (interior coords), cumulative by stage
const CRACKS = [
  [],
  [[4, 1], [5, 2], [4, 3], [5, 4]],
  [[15, 7], [16, 8], [15, 9], [16, 10], [17, 10], [3, 10], [2, 11], [3, 12]],
  [[9, 1], [10, 2], [10, 3], [9, 4], [18, 2], [17, 3], [1, 6], [2, 7], [10, 10], [11, 11], [10, 12], [11, 13]],
];

const cache = new Map();
export function chestSprite(type = 'wood') {
  if (!MATS[type]) type = 'wood';
  if (cache.has(type)) return cache.get(type);
  const map = { ...MATS[type] };
  delete map.light;
  map.k = '#0e0b16';
  const spr = defineSprite({ id: 'chest_' + type, w: 20, h: 16, frames: [CLOSED, OPEN], map, outline: 'k', anchor: { x: 10, y: 16 } });
  const light = MATS[type].light;
  const W = spr.w, H = spr.h;
  const crackCol = { wood: '#2a160c', silver: '#232c45', gold: '#6b2a04', epic: '#12082a' }[type];
  const sparkleCol = { wood: null, silver: '#ffffff', gold: '#fff6c8', epic: '#6fe3d3' }[type];
  const api = {
    w: W, h: H, type, light, sprite: spr,
    draw(ctx, x, y, { cracks = 0, open = false, shake = 0, scale = 1, t, alpha = 1, flash = false } = {}) {
      const now = t ?? performance.now() / 1000;
      let dx = 0, dy = 0;
      if (shake > 0 && !open) {
        dx = Math.round(Math.sin(now * 55) * shake);
        dy = shake >= 2 && Math.sin(now * 23) > 0.3 ? -1 : 0;
      }
      const X = x + dx * scale, Y = y + dy * scale;
      // round pixel halo behind an open chest / a badly cracked one
      if (open || cracks >= 3) {
        ctx.save();
        ctx.fillStyle = light;
        const cy = Y - (H / 2 + (open ? 3 : 0)) * scale;
        const rings = open ? [[17, 0.16], [13, 0.22], [9, 0.3]] : [[13, 0.1 + 0.06 * Math.sin(now * 12)], [10, 0.14]];
        for (const [R, a] of rings) {
          ctx.globalAlpha = a * alpha;
          for (let yy = -R; yy <= R; yy++) {
            const half = Math.round(Math.sqrt(R * R - yy * yy) * 1.2);
            ctx.fillRect(Math.round(X - half * scale), Math.round(cy + yy * scale), half * 2 * scale, scale);
          }
        }
        if (open) {
          // light rays
          ctx.globalAlpha = 0.28 * alpha;
          for (let i = -2; i <= 2; i++) {
            const ang = -Math.PI / 2 + i * 0.42 + Math.sin(now * 2) * 0.05;
            for (let d = 6; d < 26; d++) ctx.fillRect(Math.round(X + Math.cos(ang) * d * scale), Math.round(cy + Math.sin(ang) * d * scale), scale * 2, scale * 2);
          }
        }
        ctx.restore();
      }
      drawSprite(ctx, spr, open ? 1 : 0, X, Y, { scale, alpha, flash });
      const ox = X - spr.anchor.x * scale, oy = Y - spr.anchor.y * scale;
      const px = (cx, cy, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(ox + (cx + 1) * scale), Math.round(oy + (cy + 1) * scale), scale, scale); };
      if (!open && !flash) {
        const n = Math.max(0, Math.min(3, cracks | 0));
        for (let s = 1; s <= n; s++) CRACKS[s].forEach(([cx, cy], i) => px(cx, cy, n >= 3 && i % 2 === 0 ? (Math.sin(now * 20 + i) > 0 ? '#ffffff' : light) : crackCol));
        if (n >= 3) for (let i = 0; i < 20; i++) if ((i + Math.floor(now * 14)) % 3 === 0) px(i, 5, light); // seam leaking light
        // ambient sparkle on precious chests
        if (sparkleCol) {
          const ph = (now * 0.9) % 1;
          if (ph < 0.25) {
            const spots = [[2, 1], [17, 3], [16, 11], [3, 7]];
            const [sx, sy] = spots[Math.floor(now * 0.9) % spots.length];
            px(sx, sy, '#ffffff');
            if (ph > 0.06 && ph < 0.18) { px(sx - 1, sy, sparkleCol); px(sx + 1, sy, sparkleCol); px(sx, sy - 1, sparkleCol); px(sx, sy + 1, sparkleCol); }
          }
        }
      }
      if (open) {
        // rising motes of light
        for (let i = 0; i < 5; i++) {
          const ph = (now * 0.8 + i / 5) % 1;
          px(3 + i * 3.4 | 0, Math.round(4 - ph * 10), ph < 0.5 ? '#ffffff' : light);
        }
      }
    },
  };
  cache.set(type, api);
  return api;
}
export const CHEST_TYPES = Object.keys(MATS);
