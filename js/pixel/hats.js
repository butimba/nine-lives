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
  elfhat: {
    dx: -1, dy: 0,
    rows: [
      'yy.........',
      'yGG........',
      '..GGG......',
      '...GGgG....',
      '...GGGGg...',
      '..GGgGGGg..',
      'RWRWRWRWRWR',
    ],
    map: { G: '#3aa34f', g: '#1f6a34', y: '#ffd23f', R: '#e8434f', W: '#f4efe2' },
  },
  earmuffs: {
    dx: 0, dy: 7,
    rows: [
      '....bbbbb....',
      '..bb.....bb..',
      '.b.........b.',
      'pP.........Pp',
      'PPP.......PPP',
      'PPP.......PPP',
      '.PP.......PP.',
    ],
    map: { b: '#e8434f', P: '#ff8fb1', p: '#ffd0e0' },
  },
  antlers: {
    dx: 0, dy: 0,
    rows: [
      'B.B.......B.B',
      '.BbB.....BbB.',
      '..BB.B.B.BB..',
      '...BBB.BBB...',
      '....B...B....',
    ],
    map: { B: '#9a6a42', b: '#c98a5a' },
  },
  star: {
    dx: 0, dy: -1,
    rows: [
      '....Y....',
      '...YYY...',
      'YYYYWYYYY',
      '.YYYWYYY.',
      '..YYYYY..',
      '..YY.YY..',
      '.Yd...dY.',
    ],
    map: { Y: '#ffd23f', W: '#ffffff', d: '#d99a00' },
  },
  nyhat: {
    dx: 0, dy: 0,
    rows: [
      '..W.W..',
      '...W...',
      '...Y...',
      '..ysY..',
      '..YYy..',
      '.yYsYy.',
      '.YYYYsY',
      'yYsYYYy',
    ],
    map: { Y: '#ffd23f', y: '#d99a00', s: '#ffffff', W: '#ffe96b' },
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
  // ---------- story prizes ----------
  moonclip: {
    dx: 3, dy: 0,
    rows: [
      '..YY.',
      '.Yy..',
      'YY...',
      'YY...',
      '.Yy..',
      '..YY.',
    ],
    map: { Y: '#ffe68a', y: '#fff6c8' },
  },
  mouseears: {
    dx: 0, dy: 1,
    rows: [
      '.GGG.....GGG.',
      'GPPPG...GPPPG',
      'GPPPG...GPPPG',
      '.GGG.....GGG.',
    ],
    map: { G: '#9aa0b0', P: '#ffb6c7' },
  },
  feather: {
    dx: 3, dy: 0,
    rows: [
      '....R',
      '...RR',
      '..RrR',
      '..Rr.',
      '.RrR.',
      '.Rr..',
      'Y....',
    ],
    map: { R: '#5bb5ff', r: '#ffffff', Y: '#ffd23f' },
  },
  paperboat: {
    dx: 0, dy: 0,
    rows: [
      '....W....',
      '...WWW...',
      '..WWwWW..',
      'wWWWWWWWw',
      '.wWWWWWw.',
    ],
    map: { W: '#f4efe2', w: '#b8c4d8' },
  },
  nightcap: {
    dx: 1, dy: 0,
    rows: [
      '.......Y.',
      '......BB.',
      '....BBb..',
      '..BBbBB..',
      '.BBBBBBb.',
      'WWWWWWWW.',
    ],
    map: { B: '#3b4ea8', b: '#7ec4ff', Y: '#ffd23f', W: '#f4efe2' },
  },
  bellhat: {
    dx: 3, dy: 0,
    rows: [
      '.R.R.',
      '..R..',
      '.YYY.',
      'YyYYY',
      'YYYYY',
      '..d..',
    ],
    map: { R: '#e8434f', Y: '#ffd23f', y: '#fff1a8', d: '#a87a00' },
  },
  froghat: {
    dx: 0, dy: 0,
    rows: [
      '.WW.....WW.',
      'WkW.....WkW',
      '.GGGGGGGGG.',
      'GGgGGGGGgGG',
      'GGGGGGGGGGG',
    ],
    map: { G: '#3aa34f', g: '#93e04c', W: '#ffffff', k: '#1d1d2b' },
  },
  antenna: {
    dx: 0, dy: 0,
    rows: [
      '..R..',
      '.RrR.',
      '..R..',
      '..s..',
      '..s..',
      'sSSSs',
    ],
    map: { R: '#e8434f', r: '#ffd0d0', s: '#9aa5b8', S: '#d8dee8' },
  },
  starcrown: {
    dx: 0, dy: 0,
    rows: [
      '.....W.....',
      '....YWY....',
      'Y..YYYYY..Y',
      'YY.YYbYY.YY',
      'YYYYYYYYYYY',
      'dYdYdYdYdYd',
    ],
    map: { Y: '#ffd23f', W: '#ffffff', b: '#5bb5ff', d: '#d99a00' },
  },
  // ---------- shop / events ----------
  chef: {
    dx: 0, dy: 0,
    rows: [
      '.WW.WW.',
      'WWWWWWW',
      'WwWWWwW',
      '.WWWWW.',
      '.ggggg.',
    ],
    map: { W: '#ffffff', w: '#dfe3ea', g: '#c8ccd8' },
  },
  pirate: {
    dx: 0, dy: 0,
    rows: [
      '...KKKKK...',
      '..KKKWKKK..',
      '.KKKWKWKKK.',
      'KKKKKKKKKKK',
      'YYYYYYYYYYY',
    ],
    map: { K: '#2a2a36', W: '#f4efe2', Y: '#ffd23f' },
  },
  viking: {
    dx: 0, dy: 0,
    rows: [
      'W.........W',
      'WW.......WW',
      '.WW.SSS.WW.',
      '..SSsSSSS..',
      '..SSSSSSS..',
      '.YYYYYYYYY.',
    ],
    map: { W: '#f4efe2', S: '#9aa5b8', s: '#d8dee8', Y: '#c98a3a' },
  },
  flowercrown: {
    dx: 0, dy: 0,
    rows: [
      '.P...Y...B.',
      'PyP.YrY.BwB',
      'gPgggYgggBg',
    ],
    map: { P: '#ff8fb1', y: '#ffd23f', Y: '#ffd23f', r: '#ff5d5d', B: '#7ec4ff', w: '#ffffff', g: '#3aa34f' },
  },
  bobble: {
    dx: 0, dy: 0,
    rows: [
      '...WW...',
      '...WW...',
      '.RRRRRR.',
      'RRWRRWRR',
      'RRRRRRRR',
      'WWWWWWWW',
    ],
    map: { R: '#e8434f', W: '#f4efe2' },
  },
  heartclip: {
    dx: 3, dy: 0,
    rows: [
      '.R.R.',
      'RrRRR',
      'RRRRR',
      '.RRR.',
      '..R..',
    ],
    map: { R: '#ff5d8f', r: '#ffd0e0' },
  },
  gradcap: {
    dx: 0, dy: 0,
    rows: [
      '....KKK....',
      'KKKKKKKKKKK',
      '.KKKKKKKKY.',
      '..KKKKKK.Y.',
      '..KKKKKK.Y.',
    ],
    map: { K: '#2a2a36', Y: '#ffd23f' },
  },

  // ---------- paczka 2026-11 ----------
  beret: {
    dx: 1, dy: 0,
    rows: [
      '....b....',
      '..rrrrr..',
      '.rRrrrrr.',
      'rrrrrrrrr',
      '.ddddddd.',
    ],
    map: { b: '#3a1a2a', r: '#c2306a', R: '#ff6f9a', d: '#8a1f48' },
  },
  bandana: {
    dx: 0, dy: 1,
    rows: [
      '.rrrrrrr...',
      'rrWrrrWrr..',
      'rrrrrrrrrrr',
      '........rr.',
    ],
    map: { r: '#e8434f', W: '#ffffff' },
  },
  dragonhorns: {
    dx: 0, dy: 0,
    rows: [
      'g.........g',
      'gg.......gg',
      '.gG.....Gg.',
      '..GG...GG..',
    ],
    map: { g: '#3aa34f', G: '#93e04c' },
  },
  astronaut: {
    dx: 0, dy: 2,
    rows: [
      '...WWWWW...',
      '..WbbbbBW..',
      '.WbbbbbbBW.',
      '.WbbbbbbbW.',
      '.WWWWWWWWW.',
      'SSSSRSSSSSS',
    ],
    map: { W: '#f4f8ff', b: '#3b78d8', B: '#bfe6ff', S: '#9aa5b8', R: '#e8434f' },
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
