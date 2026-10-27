// JUICE — pixel particles, floating numbers, rings, flashes. Cap 200 live objects.
// Also a tiny 3x5 bitmap font (pxText) used by the run HUD and the tower plaques,
// so numbers are always crisp even before A's font module loads.

// ---------- 3x5 pixel font ----------
const G = {
  "0": "111101101101111", "1": "010110010010111", "2": "111001111100111", "3": "111001011001111", "4": "101101111001001",
  "5": "111100111001111", "6": "111100111101111", "7": "111001010010010", "8": "111101111101111", "9": "111101111001111",
  A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111",
  F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010",
  K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010",
  P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010",
  U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010",
  Z: "111001010100111", "+": "000010111010000", "-": "000000111000000", "!": "010010010000010", "?": "111001010000010",
  ":": "000010000010000", "/": "001001010100100", ".": "000000000000010", "%": "101001010100101", "'": "010010000000000",
  x: "000101010101000", " ": "000000000000000", "#": "101111101111101", "<": "001010100010001", ">": "100010001010100",
  "*": "000101010101000", "=": "000111000111000", ",": "000000000010100", "(": "010100100100010", ")": "010001001001010",
};
// width in logical px of a string at a given scale
export const pxTextWidth = (str, scale = 1) => Math.max(0, String(str).length * 4 - 1) * scale;
// draw crisp bitmap text; outline draws a 1px (scaled) dark border around glyphs
export function pxText(ctx, str, x, y, { color = "#f4efe2", scale = 1, align = "left", outline = "#0e0b16", shadow = null } = {}) {
  str = String(str);
  const w = pxTextWidth(str, scale);
  let x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const y0 = Math.round(y);
  const s = scale;
  const pass = (col, ox, oy, grow) => {
    ctx.fillStyle = col;
    let cx = x0;
    for (const chRaw of str) {
      const ch = G[chRaw] ? chRaw : G[chRaw.toUpperCase()] ? chRaw.toUpperCase() : "?";
      const g = G[ch];
      for (let i = 0; i < 15; i++) if (g[i] === "1") {
        const gx = cx + (i % 3) * s + ox, gy = y0 + Math.floor(i / 3) * s + oy;
        if (grow) ctx.fillRect(gx - s, gy - s, s * 3, s * 3); else ctx.fillRect(gx, gy, s, s);
      }
      cx += 4 * s;
    }
  };
  if (shadow) pass(shadow, 0, s, !!outline);
  if (outline) pass(outline, 0, 0, true);
  pass(color, 0, 0, false);
  return w;
}

// optional: A's bitmap font (5x7) when it exists — used for big damage numbers
let drawTextA = null;
import("../pixel/font.js").then((m) => { if (typeof m.drawText === "function") drawTextA = m.drawText; }).catch(() => {});
const A_OK = /^[A-Z0-9 +\-x!?/:%]*$/;

const CAP = 200;

export function createFx() {
  const parts = []; // {x,y,vx,vy,g,life,max,size,color,kind}
  const floats = []; // {x,y,vy,text,color,big,life,max}
  const rings = [];  // {x,y,r,vr,color,life,max}
  let flashT = 0, flashMax = 1, flashColor = "#fff";
  const total = () => parts.length + floats.length + rings.length;
  const room = (n) => { while (total() + n > CAP && parts.length) parts.shift(); return total() + n <= CAP; };

  const fx = {
    burst(x, y, { n = 10, colors = ["#f4efe2"], speed = 60, gravity = 120, size = 1, life = 0.6, up = 0, spread = Math.PI * 2, angle = -Math.PI / 2 } = {}) {
      n = Math.min(n, CAP);
      room(n);
      for (let i = 0; i < n; i++) {
        const a = spread >= Math.PI * 2 ? Math.random() * Math.PI * 2 : angle + (Math.random() - 0.5) * spread;
        const sp = speed * (0.35 + Math.random() * 0.75);
        const l = life * (0.6 + Math.random() * 0.6);
        parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - up, g: gravity, life: l, max: l,
          size: Math.max(1, Math.round(size * (Math.random() < 0.3 ? 2 : 1))), color: colors[(Math.random() * colors.length) | 0] });
      }
    },
    // little squares that fly to a target (e.g. fish to the HUD counter)
    collect(x, y, tx, ty, { n = 6, color = "#ffcf3f", size = 2, life = 0.7, onArrive } = {}) {
      room(n);
      for (let i = 0; i < n; i++) {
        const l = life + i * 0.05;
        parts.push({ x, y, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 60, g: 0, life: l, max: l, size, color,
          home: { tx, ty }, onArrive: i === n - 1 ? onArrive : null });
      }
    },
    float(x, y, text, { color = "#f4efe2", big = false, life = 0.9, outline = "#0e0b16" } = {}) {
      if (floats.length > 20) floats.shift();
      room(1);
      floats.push({ x, y, vy: big ? -34 : -26, text: String(text), color, big, life, max: life, outline });
    },
    ring(x, y, color = "#f4efe2", { r = 3, vr = 90, life = 0.35 } = {}) {
      room(1);
      rings.push({ x, y, r, vr, color, life, max: life });
    },
    flash(color = "#ffffff", ms = 90) { flashT = flashMax = ms / 1000; flashColor = color; },
    clear() { parts.length = floats.length = rings.length = 0; },
    get count() { return total(); },
    update(dt) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life -= dt;
        if (p.home) {
          const k = 1 - p.life / p.max;
          if (k > 0.35) { // home in
            const f = Math.min(1, (k - 0.35) * 3.5);
            p.x += (p.home.tx - p.x) * f * 0.35; p.y += (p.home.ty - p.y) * f * 0.35;
          } else { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.92; p.vy *= 0.92; }
          if (p.life <= 0 || (Math.abs(p.x - p.home.tx) < 2 && Math.abs(p.y - p.home.ty) < 2)) { if (p.onArrive) p.onArrive(); parts.splice(i, 1); }
          continue;
        }
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        p.vx *= 0.985;
      }
      for (let i = floats.length - 1; i >= 0; i--) {
        const f = floats[i]; f.life -= dt; f.y += f.vy * dt; f.vy *= 0.94;
        if (f.life <= 0) floats.splice(i, 1);
      }
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i]; r.life -= dt; r.r += r.vr * dt; r.vr *= 0.9;
        if (r.life <= 0) rings.splice(i, 1);
      }
      if (flashT > 0) flashT -= dt;
    },
    draw(ctx) {
      for (const p of parts) {
        const fade = p.home ? 1 : Math.min(1, p.life / p.max * 2);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        const s = p.home ? p.size : p.life / p.max < 0.3 && p.size > 1 ? p.size - 1 : p.size;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y - s / 2), s, s);
      }
      ctx.globalAlpha = 1;
      for (const r of rings) {
        ctx.globalAlpha = Math.max(0, r.life / r.max);
        ctx.fillStyle = r.color;
        const n = Math.max(8, Math.round(r.r * 1.6));
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2;
          ctx.fillRect(Math.round(r.x + Math.cos(a) * r.r), Math.round(r.y + Math.sin(a) * r.r), 1, 1);
        }
      }
      ctx.globalAlpha = 1;
      for (const f of floats) {
        const k = f.life / f.max;
        const pop = k > 0.8 ? 1 + (k - 0.8) * 2.5 : 1; // starts big, settles
        const scale = Math.round((f.big ? 3 : 2) * pop);
        ctx.globalAlpha = Math.min(1, k * 3);
        const up = f.text.toUpperCase();
        if (drawTextA && A_OK.test(up) && f.big) drawTextA(ctx, up, Math.round(f.x), Math.round(f.y), { color: f.color, align: "center", scale: Math.max(1, scale - 1), outline: f.outline });
        else pxText(ctx, f.text, f.x, f.y, { color: f.color, scale, align: "center", outline: f.outline });
      }
      ctx.globalAlpha = 1;
      if (flashT > 0) {
        ctx.globalAlpha = Math.max(0, flashT / flashMax) * 0.55;
        ctx.fillStyle = flashColor;
        ctx.fillRect(-8, -8, 400, 1200);
        ctx.globalAlpha = 1;
      }
    },
  };
  return fx;
}
