// Shared helpers for mechanics: graphics bridge (A's pixel modules with fallbacks),
// choice-mechanic base (timing, result, input, reveal card), text + tween utils.

// ---------- graphics bridge ----------
export const G = {}; // filled with A's exports when available
const PIX = ["palette", "sprite", "frames", "font", "pixelizer", "icons"];
export const gfxReady = Promise.all(PIX.map((n) => import(`../../pixel/${n}.js`).then((m) => Object.assign(G, m)).catch(() => {}))).then(() => G);

export const COL = { // mirrors js/pixel/palette.js PAL
  ink: "#0e0b16", deep: "#272036", paper: "#f4efe2", wood: "#8e5434", woodL: "#c98a52", woodLL: "#ecc28a", woodD: "#5a3324", woodDD: "#2e1a12",
  stone: "#7a7290", stoneL: "#b7b0c8", stoneD: "#463e5c", gold: "#ffd23f", goldL: "#fff1a8", ok: "#93e04c", okD: "#3aa34f", bad: "#e8434f", badD: "#a82848",
  dirt: "#8e5434", dirtL: "#c98a52", dirtD: "#5a3324", grass: "#3aa34f", grassL: "#93e04c", grassD: "#1d5a3c",
  bubble: "#7ec4ff", bubbleL: "#d2f2ff", bubbleD: "#3b78d8", magic: "#6fe3d3", magic2: "#d867d0", violet: "#8a55d6",
};
const C = (k) => (G.UI && G.UI[k]) || COL[k];
export { C as uiCol };

// pixel picture for a word image ('🐶' | 'color:#hex' | 'num:7')
const picCache = new Map();
export function pic(img, size = 18) {
  if (G.pixelImage) { try { return G.pixelImage(img, size); } catch {} }
  const key = img + "|" + size;
  if (picCache.has(key)) return picCache.get(key);
  const cv = document.createElement("canvas"); cv.width = cv.height = size + 2;
  const c = cv.getContext("2d");
  if (img.startsWith("color:")) { c.fillStyle = COL.ink; c.fillRect(1, 1, size, size); c.fillStyle = img.slice(6); c.fillRect(2, 2, size - 2, size - 2); }
  else if (img.startsWith("num:")) { c.fillStyle = COL.ink; c.font = `700 ${size}px "Pixelify Sans", monospace`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(img.slice(4), (size + 2) / 2, (size + 2) / 2 + 1); }
  else {
    const tmp = document.createElement("canvas"); tmp.width = tmp.height = size; const t = tmp.getContext("2d");
    t.font = `${Math.round(size * 0.86)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; t.textAlign = "center"; t.textBaseline = "middle";
    t.fillText(img, size / 2, size / 2 + size * 0.06);
    // 1px dark outline (alpha dilation)
    const d = t.getImageData(0, 0, size, size).data;
    c.fillStyle = COL.ink;
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (d[(y * size + x) * 4 + 3] > 90)
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) c.fillRect(x + 1 + dx, y + 1 + dy, 1, 1);
    c.drawImage(tmp, 1, 1);
  }
  picCache.set(key, cv);
  return cv;
}
export function picURL(img, scale = 3) {
  if (G.pixelURL) { try { return G.pixelURL(img, scale); } catch {} }
  const p = pic(img); const cv = document.createElement("canvas"); cv.width = p.width * scale; cv.height = p.height * scale;
  const c = cv.getContext("2d"); c.imageSmoothingEnabled = false; c.drawImage(p, 0, 0, cv.width, cv.height); return cv.toDataURL();
}
export function drawPic(ctx, img, cx, cy, scale = 2, alpha = 1) {
  const p = pic(img);
  const w = p.width * scale, h = p.height * scale;
  const a = ctx.globalAlpha; ctx.globalAlpha = a * alpha;
  ctx.drawImage(p, Math.round(cx - w / 2), Math.round(cy - h / 2), w, h);
  ctx.globalAlpha = a;
}

// panels: use A's drawPanel when present
export function panel(ctx, x, y, w, h, style = "wood", opts = {}) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  if (G.drawPanel && !opts.own) { try { G.drawPanel(ctx, x, y, w, h, style, opts); return; } catch {} }
  const P = style === "stone" ? [COL.stoneD, COL.stone, COL.stoneL] : style === "paper" ? ["#b8ab8c", COL.paper, "#fffaf0"] : [COL.woodD, COL.wood, COL.woodL];
  ctx.fillStyle = COL.ink; ctx.fillRect(x + 1, y, w - 2, h); ctx.fillRect(x, y + 1, w, h - 2);
  ctx.fillStyle = P[0]; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = P[1]; ctx.fillRect(x + 2, y + 1, w - 4, h - 4);
  ctx.fillStyle = P[2]; ctx.fillRect(x + 2, y + 1, w - 4, 1);
  if (style === "wood") { ctx.fillStyle = P[0]; for (let yy = y + 1 + Math.floor((h - 3) / 2); yy < y + h - 3; yy += 99) ctx.fillRect(x + 2, yy, w - 4, 1); ctx.fillRect(x + 3, y + 3, 1, 1); ctx.fillRect(x + w - 4, y + 3, 1, 1); ctx.fillRect(x + 3, y + h - 5, 1, 1); ctx.fillRect(x + w - 4, y + h - 5, 1, 1); }
  if (opts.tint) { ctx.fillStyle = opts.tint; ctx.globalAlpha *= 0.35; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); ctx.globalAlpha /= 0.35; }
}

// readable word text on canvas (Lexend), auto-shrinks to maxW
export function word(ctx, str, x, y, { size = 11, color = COL.paper, maxW = 999, weight = 600, align = "center", shadow = COL.ink, font = "Lexend" } = {}) {
  let s = size;
  ctx.font = `${weight} ${s}px "${font}", sans-serif`;
  while (s > 6 && ctx.measureText(str).width > maxW) { s -= 0.5; ctx.font = `${weight} ${s}px "${font}", sans-serif`; }
  ctx.textAlign = align; ctx.textBaseline = "middle";
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(str, x + 0.75, y + 0.75); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
  return s;
}
export function textW(ctx, str, size = 11, weight = 600, font = "Lexend") { ctx.font = `${weight} ${size}px "${font}", sans-serif`; return ctx.measureText(str).width; }

// ---------- tweens ----------
export const ease = { out: (k) => 1 - (1 - k) ** 3, back: (k) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2, inOut: (k) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2) };
export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const race = (p, ms) => Promise.race([Promise.resolve(p), wait(ms)]);

export function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
export const norm = (s) => s.toLowerCase().replace(/[-\s]+/g, " ").replace(/[^a-z ']/g, "").trim();

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export { esc };

// ---------- base for every mechanic ----------
export function base(ctx) {
  const B = {
    t0: 0, live: false, done: false, hinted: false, revealing: false, offs: [], els: [],
    S: (k) => { try { ctx.sfx && ctx.sfx[k] && ctx.sfx[k](); } catch {} },
    say: (txt) => { try { ctx.speak && ctx.speak(txt); } catch {} },
    start() { B.live = true; B.t0 = performance.now(); },
    ms: () => (B.live ? performance.now() - B.t0 : 0),
    onDown(fn) {
      // stage.input: handler returning true consumes the event (boss projectiles register with higher priority)
      const off = ctx.stage.input.on("down", (e) => { if (e.handled || B.done || B.revealing || !B.live || ctx.stage.paused) return false; return fn(e) === true; });
      if (off) B.offs.push(off);
    },
    finish: null, result: null,
    client: (x, y) => ctx.stage.toClient(x, y),
    destroy() { B.offs.forEach((f) => { try { f(); } catch {} }); B.offs = []; B.els.forEach((e) => e.remove()); B.els = []; if (B._docNext) document.removeEventListener("click", B._docNext, true); },
  };
  B.result = new Promise((res) => {
    B.finish = (ok, tag, choice, extra = {}) => {
      if (B.done) return false; B.done = true;
      const r = { ok: !!ok, ms: Math.max(1, B.ms()), tag: ok ? null : tag || null, hinted: B.hinted, choice: choice ?? null, ...extra };
      B._resolve = () => res(r);
      return r;
    };
  });
  // resolve after the in-world animation (call when the smash is visible)
  B.settle = () => B._resolve && B._resolve();
  // reveal card: correct answer + [data-act=next]; resolves on click (ours or any [data-act=next])
  B.revealCard = (task, extraHtml = "") => new Promise((res) => {
    B.revealing = true;
    let fired = false;
    const go = () => { if (fired) return; fired = true; B.S("tap"); el && el.remove(); document.removeEventListener("click", B._docNext, true); res(); };
    B._docNext = (e) => { if (e.target.closest && e.target.closest("[data-act=next]")) go(); };
    document.addEventListener("click", B._docNext, true);
    let el = null;
    if (ctx.revealCard === false || !ctx.stage.overlay) return;
    const a = answerHTML(task);
    el = document.createElement("div");
    el.className = "mech-reveal";
    el.innerHTML = `<div class="mech-reveal__card">${a}${extraHtml}<button class="px-btn px-btn--big mech-next" data-act="next">OK</button></div>`;
    const sp = el.querySelector(".mech-say"); if (sp) sp.addEventListener("click", (e) => { e.stopPropagation(); B.say(sp.dataset.say); });
    ctx.stage.overlay.append(el); B.els.push(el);
    if (task.kind === "vocab") B.say(task.word.en);
  });
  return B;
}

export function answerHTML(t) {
  if (t.kind === "vocab") {
    return `<div class="mech-ans"><img class="mech-ans__img" src="${picURL(t.word.img, 4)}" alt=""><div class="mech-ans__txt"><b class="lex">${esc(t.word.en)}</b><span class="mech-ans__pl">${esc(t.word.pl)}</span></div><button class="mech-say" data-say="${esc(t.word.en)}" aria-label="Listen">${speakerSVG()}</button></div>`;
  }
  return `<div class="mech-ans mech-ans--g"><div class="mech-ans__txt"><b class="lex">${esc(t.q.full)}</b>${t.q.hint ? `<span class="mech-ans__pl">${esc(t.q.hint)}</span>` : ""}</div><button class="mech-say" data-say="${esc(t.q.full)}" aria-label="Listen">${speakerSVG()}</button></div>`;
}
export function speakerSVG() {
  return `<svg viewBox="0 0 12 12" width="24" height="24" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M1 4h2v4H1zM3 4h1V3h1V2h1v8H5V9H4V8H3zM8 3h1v1h1v4H9v1H8V8h1V4H8zM8 5h0z"/></svg>`;
}

// pixel speaker icon on canvas (A's ICONS.speaker if available)
export function drawSpeaker(ctx, cx, cy, scale = 2, color = COL.ink) {
  // own glyph (crisp, matches the reveal-card icon)
  const px = [
    "....#.....", "...##..#..", "#####...#.", "#####.#.#.", "#####.#.#.", "#####...#.", "...##..#..", "....#.....",
  ];
  ctx.fillStyle = color;
  const ox = Math.round(cx - 5 * scale), oy = Math.round(cy - 4 * scale);
  px.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === "#") ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale); }));
}

// generic glow outline (pulse) around rect
export function glowRect(ctx, x, y, w, h, color, t, k = 1) {
  const p = 1 + Math.round((Math.sin(t * 8) + 1) * 1.5) * k;
  ctx.fillStyle = color;
  ctx.globalAlpha *= 0.85;
  ctx.fillRect(Math.round(x - p), Math.round(y - p), Math.round(w + p * 2), 1 + (p > 2 ? 1 : 0));
  ctx.fillRect(Math.round(x - p), Math.round(y + h + p - 1), Math.round(w + p * 2), 1 + (p > 2 ? 1 : 0));
  ctx.fillRect(Math.round(x - p), Math.round(y - p), 1 + (p > 2 ? 1 : 0), Math.round(h + p * 2));
  ctx.fillRect(Math.round(x + w + p - 1), Math.round(y - p), 1 + (p > 2 ? 1 : 0), Math.round(h + p * 2));
  ctx.globalAlpha /= 0.85;
}
// bouncing arrow pointing down at (x, y)
export function arrowDown(ctx, x, y, t, color = COL.gold) {
  const b = Math.round(Math.abs(Math.sin(t * 6)) * 3);
  const rows = ["..###..", "..###..", "#######", ".#####.", "..###..", "...#..."];
  const ox = Math.round(x - 3.5), oy = Math.round(y - 6 - b);
  ctx.fillStyle = COL.ink;
  rows.forEach((r, yy) => [...r].forEach((c, xx) => { if (c === "#") ctx.fillRect(ox + xx - 1, oy + yy - 1, 3, 3); }));
  ctx.fillStyle = color;
  rows.forEach((r, yy) => [...r].forEach((c, xx) => { if (c === "#") ctx.fillRect(ox + xx, oy + yy, 1, 1); }));
}

export function fxSafe(fx) {
  const n = () => {};
  return fx ? { burst: (...a) => fx.burst && fx.burst(...a), float: (...a) => fx.float && fx.float(...a), ring: (...a) => fx.ring && fx.ring(...a) } : { burst: n, float: n, ring: n };
}
