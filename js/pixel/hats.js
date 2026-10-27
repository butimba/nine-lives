// Hats: small sprites anchored to the cat's head point (top-centre of the skull, between the ears).
// Each hat: rows (interior, auto-outlined), dx/dy = extra offset of the hat's bottom-centre from the head point.
import { defineSprite } from './sprite.js';

const HAT_DEFS = {
  bow: {
    dx: 3, dy: 0,
    rows: [
      'RR..RR',
      'RPRrRPR',
      'RRRrRRR',
      'rR..Rr',
    ].map((r) => r.padEnd(7, '.')),
    map: { R: '#ff5d8f', P: '#ffc9d3', r: '#c2306a' },
  },
  cap: {
    dx: 1, dy: 0,
    rows: [
      '..bbbbb.....',
      '.bBbbbbb....',
      '.bbbbbbbb...',
      'yccccccccccc',
    ],
    map: { b: '#3b78d8', B: '#7ec4ff', c: '#1f3a78', y: '#ffd23f' },
  },
  flower: {
    dx: 3, dy: 1,
    rows: [
      '.P.P.',
      'PPyPP',
      '.PPP.',
      'e.e..',
    ],
    map: { P: '#ffffff', y: '#ffd23f', e: '#3aa34f' },
  },
  party: {
    dx: 0, dy: 0,
    rows: [
      '...YY..',
      '...Y...',
      '...m...',
      '..mVm..',
      '..yym..',
      '.mVVmy.',
      '.yymVVm',
      'mVVmyym',
    ],
    map: { Y: '#fff1a8', y: '#ffd23f', m: '#ff5d8f', V: '#8a55d6' },
  },
  tophat: {
    dx: 0, dy: 0,
    rows: [
      '.gggggg.',
      '.gGgggg.',
      '.gGgggg.',
      '.gGgggg.',
      '.RRRRRR.',
      'KKKKKKKKK',
    ].map((r) => r.padEnd(9, '.')),
    map: { g: '#3a3350', G: '#6b6188', R: '#e8434f', K: '#272036' },
  },
  headphones: {
    dx: 0, dy: 7,
    rows: [
      '....sssss....',
      '..ss.....ss..',
      '.s.........s.',
      '.s.........s.',
      'RR.........RR',
      'RR.........RR',
      'RR.........RR',
      'rR.........Rr',
    ].map((r) => r.padEnd(13, '.')),
    map: { s: '#5d6b85', R: '#e8434f', r: '#a82848' },
  },
  wizard: {
    dx: -1, dy: 0,
    rows: [
      'Vv.........',
      '.VV........',
      '..VVv......',
      '...VVV.....',
      '...VyVV....',
      '..VVVVVv...',
      '..VVVVyV...',
      '.VVyVVVVv..',
      'vvvvvvvvvvv',
    ],
    map: { V: '#5b3cc4', v: '#3a2280', y: '#ffd23f' },
  },
  horns: {
    dx: 0, dy: 0,
    rows: [
      'r...r',
      'Rr.rR',
      'RR.RR',
    ],
    map: { R: '#e8434f', r: '#a82848' },
  },
  halo: {
    dx: 0, dy: -5,
    rows: [
      '..WYYYYYY..',
      'YY.......YY',
      'dd.......dd',
      '..ddddddd..',
    ],
    map: { Y: '#ffe96b', d: '#e0a000', W: '#ffffff' },
    outline: 'none',
  },
  crown: {
    dx: 0, dy: 0,
    rows: [
      'Y...Y...Y',
      'yY.yYy.Yy',
      'yyyyyyyyy',
      'yRyyByyRy',
      'ddddddddd',
    ],
    map: { Y: '#fff1a8', y: '#ffd23f', d: '#d98a00', R: '#e8434f', B: '#3bd8ff' },
  },
  witch: {
    dx: -1, dy: 0,
    rows: [
      'gg.........',
      '.ggg.......',
      '..ggg......',
      '...ggg.....',
      '...gggg....',
      '..gGgggg...',
      '..VVVVVV...',
      '..VyyVVV...',
      'ggggggggggg',
    ],
    map: { g: '#2c2440', G: '#4e4470', V: '#8a55d6', y: '#ffd23f' },
  },
  pumpkinhat: {
    dx: 0, dy: 0,
    rows: [
      '...en..',
      '...nee.',
      '.oOOoO.',
      'oOOoOOo',
      'oOOoOOo',
      '.ooooo.',
    ],
    map: { o: '#d9622b', O: '#ffa04d', n: '#5a3324', e: '#3aa34f' },
  },
  santa: {
    dx: 0, dy: 0,
    rows: [
      'WW........',
      'WWRR......',
      '..RRRR....',
      '..RRrRRR..',
      '.RRRRRRrR.',
      'WWWWWWWWWW',
      'WWWWWWWWWW',
    ],
    map: { R: '#e8434f', r: '#a82848', W: '#f4efe2' },
  },
  bunnyears: {
    dx: 0, dy: 1,
    rows: [
      '.WW....WW.',
      'WPPW..WPPW',
      'WPPW..WPPW',
      'WPPW..WPPW',
      'WPPW..WPPW',
      '.WPW..WPW.',
      '.WWW..WWW.',
    ],
    map: { W: '#f4efe2', P: '#ffb3c7' },
  },
  sunhat: {
    dx: 0, dy: 0,
    rows: [
      '....TTTTT....',
      '...TtTTTTT...',
      '...RRRRRRR...',
      'tTTTTTTTTTTTt',
      '.ttttttttttt.',
    ],
    map: { T: '#ecc28a', t: '#c98a52', R: '#ff5d8f' },
  },
};

const cache = new Map();
export function hatSprite(hatId) {
  if (!hatId || hatId === 'none') return null;
  if (cache.has(hatId)) return cache.get(hatId);
  const d = HAT_DEFS[hatId];
  if (!d) return null;
  const w = Math.max(...d.rows.map((r) => r.length)), h = d.rows.length;
  // anchor: bottom-centre of the interior, shifted so that drawing at the head point applies dx/dy.
  const spr = defineSprite({
    id: 'hat_' + hatId, w, h, frames: [d.rows], map: d.map, outline: d.outline === 'none' ? null : d.outline || 'k',
    anchor: { x: Math.floor(w / 2) - d.dx, y: h - 1 - d.dy + 1 },
  });
  cache.set(hatId, spr);
  return spr;
}
export const HAT_IDS = Object.keys(HAT_DEFS);
