// Nine Lives: the ONE palette. Every sprite char maps through PAL unless a sprite's own map overrides it.
// Night-tower mood: cool purple darks, warm lights. Hue-shifted ramps (shadows lean purple, lights lean yellow).
export const PAL = {
  '.': null,
  // inks / neutrals
  k: '#0e0b16', // outline ink
  K: '#272036', // deep shadow
  g: '#463e5c', // dusk grey-violet
  G: '#7a7290', // mid grey
  l: '#b7b0c8', // light grey
  w: '#f4efe2', // paper white
  W: '#ffffff',
  // reds / pinks
  r: '#a82848', R: '#e8434f', p: '#ff8fa3', P: '#ffc9d3',
  // oranges / yellows
  o: '#d9622b', O: '#ffa04d', y: '#ffd23f', Y: '#fff1a8',
  // browns
  n: '#5a3324', N: '#8e5434', t: '#c98a52', T: '#ecc28a',
  // greens
  f: '#1d5a3c', e: '#3aa34f', E: '#93e04c',
  // blues
  c: '#1f3a78', b: '#3b78d8', B: '#7ec4ff', C: '#d2f2ff',
  // violets
  v: '#41246e', V: '#8a55d6', m: '#d867d0',
  // metals
  s: '#5d6b85', S: '#a9b6cb', d: '#9a6a12', D: '#d9a22b',
  // teal
  a: '#2a8f8a', A: '#6fe3d3',
};

export const UI = {
  ink: PAL.k,
  paper: PAL.w,
  paperDark: '#d9ceb4',
  accent: PAL.O,
  danger: PAL.R,
  ok: PAL.e,
  gold: PAL.y,
  shadow: PAL.K,
  night: '#151027',
  sky: PAL.b,
};

export const RARITY_COLOR = {
  common: '#a9b6cb',
  rare: '#3b9bff',
  epic: '#b04dff',
  legendary: '#ffb21f',
};

export function applyCssVars(rootEl = document.documentElement) {
  const st = rootEl.style;
  st.setProperty('--px-ink', UI.ink);
  st.setProperty('--px-paper', UI.paper);
  st.setProperty('--px-paper-dark', UI.paperDark);
  st.setProperty('--px-accent', UI.accent);
  st.setProperty('--px-danger', UI.danger);
  st.setProperty('--px-ok', UI.ok);
  st.setProperty('--px-gold', UI.gold);
  st.setProperty('--px-shadow', UI.shadow);
  st.setProperty('--px-night', UI.night);
  st.setProperty('--px-sky', UI.sky);
  for (const [k, v] of Object.entries(RARITY_COLOR)) st.setProperty('--px-r-' + k, v);
}

// ---- small colour helpers shared by the pixel modules ----
export function hexToRgb(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
}
export function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
}
export function toHsl(hex) { return rgbToHsl(...hexToRgb(hex)); }
// Pixel-art shading: darker = shift hue toward violet (~250deg), lighter = toward yellow (~55deg).
export function shade(hex, amt) {
  let [h, s, l] = toHsl(hex);
  const target = amt < 0 ? 255 : 55;
  let dh = ((target - h + 540) % 360) - 180;
  const k = Math.min(1, Math.abs(amt)) * (s < 0.08 ? 0 : 0.35);
  h += dh * k;
  l = Math.max(0, Math.min(1, l + amt));
  if (amt < 0) s = Math.min(1, s * (1 + Math.abs(amt) * 0.4) + (s < 0.08 ? 0.06 : 0));
  return hslToHex(h, s, l);
}
export function mix(a, b, t) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbToHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t);
}
export function luminance(hex) { const [r, g, b] = hexToRgb(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
