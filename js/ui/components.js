// Wspólne klocki UI: przyciski pikselowe, panele papierowe, toasty, modale, liczniki.
// Cały tekst w UI: prosty angielski (A1).
import { h, esc } from "../util.js";
import { iconURL } from "../pixel/icons.js";
import { catURL } from "../pixel/cat.js";
import { pixelURL } from "../pixel/pixelizer.js";
import { sfx } from "../audio.js";

export { h, esc };

// ---------- bezpieczne obrazki z modułów A (stub/błąd → pusty piksel) ----------
const BLANK = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
const memo = new Map();
function cached(key, fn) {
  if (memo.has(key)) return memo.get(key);
  let v = BLANK;
  try { v = fn() || BLANK; } catch (e) { console.warn("sprite", key, e); }
  memo.set(key, v);
  return v;
}
export const iconSrc = (name, scale = 3) => cached(`i:${name}:${scale}`, () => iconURL(name, scale));
export const catSrc = (skin, hat = "none", scale = 4, opts = {}) =>
  cached(`c:${skin}:${hat}:${scale}:${opts.silhouette ? 1 : 0}:${opts.anim || "idle"}:${opts.frame || 0}`, () => catURL(skin, hat || "none", scale, opts));
export const picSrc = (img, scale = 3) => cached(`p:${img}:${scale}`, () => pixelURL(img, scale));

export const ico = (name, { scale = 3, cls = "" } = {}) => `<img class="px-ico ${cls}" src="${iconSrc(name, scale)}" alt="" draggable="false">`;
export const catImg = (skin, hat, { scale = 4, cls = "", silhouette = false, anim, frame } = {}) =>
  `<img class="px-cat ${cls}" src="${catSrc(skin, hat, scale, { silhouette, anim, frame })}" alt="" draggable="false">`;

// ---------- przyciski ----------
// variant: '' (pomarańczowy), 'ok', 'paper', 'dark', 'danger', 'gold'
export function pxButton(label, { act, big = false, variant = "", icon, cls = "", disabled = false, attrs = "" } = {}) {
  return `<button class="px-btn ${big ? "px-btn--big" : ""} ${variant ? "px-btn--" + variant : ""} ${cls}" ${act ? `data-act="${act}"` : ""} ${disabled ? "disabled" : ""} ${attrs}>${icon ? ico(icon, { scale: big ? 4 : 3 }) : ""}<span>${label}</span></button>`;
}
export const backBtn = () => `<button class="px-btn px-btn--paper back-btn" data-act="back" aria-label="Back"><i class="px-arrow"></i></button>`;

// ---------- panel papierowy z taśmą ----------
export function panel(inner, { cls = "", tape = true, tilt = 0, grid = true, style = "" } = {}) {
  return `<div class="px-panel paper ${grid ? "paper--grid" : ""} ${cls}" style="--tilt:${tilt}deg;${style}">${tape ? `<i class="tape tape--l"></i><i class="tape tape--r"></i>` : ""}${inner}</div>`;
}
export const stamp = (text, { color = "danger", cls = "" } = {}) => `<div class="stamp stamp--${color} ${cls}"><span>${esc(text)}</span></div>`;
export const sticker = (inner, { cls = "", tilt = -4 } = {}) => `<div class="sticker ${cls}" style="--tilt:${tilt}deg">${inner}</div>`;
export const hand = (text, cls = "") => `<span class="hand ${cls}">${esc(text)}</span>`;

// ---------- nagłówek podstron ----------
export function pageHead(title, save, { fish = true } = {}) {
  return `<header class="page-head">${backBtn()}<h1 class="page-title px">${esc(title)}</h1>${fish ? `<div class="chip chip--fish">${ico("fish")}<b data-fish>${save.coins}</b></div>` : "<span></span>"}</header>`;
}
export function refreshFish(root, save) { root.querySelectorAll("[data-fish]").forEach((e) => (e.textContent = save.coins)); }

// ---------- toast ----------
let toastBox = null;
export function toast(msg, { icon, ms = 2400 } = {}) {
  if (!toastBox || !toastBox.isConnected) { toastBox = h(`<div class="toasts" aria-live="polite"></div>`); document.body.append(toastBox); }
  const t = h(`<div class="toast">${icon ? ico(icon) : ""}<span>${esc(msg)}</span></div>`);
  toastBox.append(t);
  setTimeout(() => t.classList.add("out"), ms);
  setTimeout(() => t.remove(), ms + 400);
}

// ---------- modal ----------
// actions: [{ label, value, variant }]; zwraca Promise<value|null>
export function modal({ title = "", body = "", actions = [{ label: "OK", value: true }], cls = "" } = {}) {
  return new Promise((res) => {
    const m = h(`<div class="modal-back"><div class="modal ${cls}">${panel(`${title ? `<h2 class="px modal-title">${esc(title)}</h2>` : ""}<div class="modal-body">${body}</div><div class="modal-actions">${actions.map((a, i) => pxButton(esc(a.label), { variant: a.variant || (i ? "paper" : ""), attrs: `data-i="${i}"` })).join("")}</div>`, { tilt: -1 })}</div></div>`);
    const close = (v) => { m.classList.add("out"); setTimeout(() => m.remove(), 180); res(v); };
    m.addEventListener("click", (e) => {
      const b = e.target.closest("[data-i]");
      if (b) { sfx.tap(); close(actions[+b.dataset.i].value); }
      else if (e.target === m) close(null);
    });
    document.body.append(m);
  });
}

// ---------- liczniki ----------
export function countUp(el, from, to, ms = 900, { tick, prefix = "", done } = {}) {
  if (!el) return Promise.resolve();
  return new Promise((res) => {
    const t0 = performance.now(); let last = from;
    const step = (now) => {
      if (!el.isConnected) return res();
      const k = Math.min(1, (now - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      const v = Math.round(from + (to - from) * e);
      if (v !== last && tick) tick(v);
      last = v; el.textContent = prefix + v;
      if (k < 1) requestAnimationFrame(step); else { done && done(); res(); }
    };
    requestAnimationFrame(step);
  });
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const hh = Math.floor(s / 3600), mm = Math.floor((s % 3600) / 60), ss = s % 60;
  return hh ? `${hh}:${String(mm).padStart(2, "0")}:${String(ss).padStart(2, "0")}` : `${mm}:${String(ss).padStart(2, "0")}`;
}

export const RARITY_EN = { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" };
export const CHEST_EN = { wood: "Wood chest", silver: "Silver chest", gold: "Gold chest", epic: "Epic chest" };

// delegacja kliknięć po data-act
export function onAct(root, map) {
  const fn = (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || !root.contains(b) || b.disabled) return;
    const f = map[b.dataset.act];
    if (f) { e.preventDefault(); f(b, e); }
  };
  root.addEventListener("click", fn);
  return () => root.removeEventListener("click", fn);
}

// klasa animacji „od nowa”
export function replay(el, cls) { if (!el) return; el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }

// ---------- pikselowe mini-ikony z siatki znaków (dla drobiazgów UI spoza ICONS) ----------
export function pixelSVG(rows, colors = { X: "#0e0b16" }) {
  const w = Math.max(...rows.map((r) => r.length)), hgt = rows.length;
  let p = "";
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (colors[ch]) p += `<rect x='${x}' y='${y}' width='1' height='1' fill='${colors[ch]}'/>`; }));
  return `data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${hgt}' shape-rendering='crispEdges'>${p}</svg>`)}`;
}
export const GEAR = pixelSVG([
  "...XXX...",
  ".X.XXX.X.",
  "..XXXXX..",
  "XXXX.XXXX",
  "XXX...XXX",
  "XXXX.XXXX",
  "..XXXXX..",
  ".X.XXX.X.",
  "...XXX...",
]);

// ---------- żywy kot: mały canvas, jedna wspólna pętla rAF dla wszystkich kotów UI ----------
import { getCat } from "../pixel/cat.js";
const liveSet = new Set();
let loopRaf = 0;
function loop(now) {
  loopRaf = 0;
  const t = now / 1000;
  for (const c of liveSet) {
    if (!c.canvas.isConnected) { if (c.born + 2000 < now) liveSet.delete(c); continue; }
    const anim = c.tmp && now < c.tmpUntil ? c.tmp : c.anim;
    const ctx = c.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, c.canvas.width, c.canvas.height);
    ctx.setTransform(c.k, 0, 0, c.k, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const bob = c.hop && now < c.hopUntil ? -Math.round(Math.abs(Math.sin((c.hopUntil - now) / 90)) * 4) : 0;
    try { c.cat.draw(ctx, Math.round(c.W / 2), c.H - 2 + bob, { anim, t, scale: 1, silhouette: c.silhouette }); } catch (e) { /* stub */ }
  }
  if (liveSet.size) loopRaf = requestAnimationFrame(loop);
}
export function liveCat({ skin = "ginger", hat = "none", anim = "idle", scale = 4, silhouette = false, cls = "" } = {}) {
  const c = { anim, silhouette, born: performance.now() };
  const canvas = document.createElement("canvas");
  canvas.className = "cat-live px-canvas " + cls;
  c.canvas = canvas; c.ctx = canvas.getContext("2d");
  const build = (s, hh) => {
    let cat; try { cat = getCat(s, hh || "none"); } catch { cat = { w: 24, h: 24, draw() {} }; }
    c.cat = cat; c.skin = s; c.hat = hh;
    c.W = (cat.w || 24) + 12; c.H = (cat.h || 24) + 12;
    const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
    c.k = scale * dpr;
    canvas.width = c.W * c.k; canvas.height = c.H * c.k;
    canvas.style.width = c.W * scale + "px"; canvas.style.height = c.H * scale + "px";
  };
  build(skin, hat);
  liveSet.add(c);
  if (!loopRaf) loopRaf = requestAnimationFrame(loop);
  return {
    el: canvas,
    set({ skin: s = c.skin, hat: hh = c.hat, anim: a } = {}) { if (s !== c.skin || hh !== c.hat) build(s, hh); if (a) c.anim = a; },
    play(a, ms = 1200) { c.tmp = a; c.tmpUntil = performance.now() + ms; },
    hop(ms = 400) { c.hop = true; c.hopUntil = performance.now() + ms; },
    get anim() { return c.anim; },
  };
}

// wspólny stan aplikacji (ustawiany przy logowaniu)
export const app = { save: null, profile: null, loginName: "" };

// skrzynia jako obrazek (sklep, wyniki)
import { chestSprite } from "../pixel/chests.js";
export const chestSrc = (type = "wood", scale = 3, opts = {}) => cached(`ch:${type}:${scale}:${opts.open ? 1 : 0}`, () => {
  const s = chestSprite(type);
  const c = document.createElement("canvas");
  c.width = (s.w + 4) * scale; c.height = (s.h + 6) * scale;
  const x = c.getContext("2d"); x.imageSmoothingEnabled = false; x.setTransform(scale, 0, 0, scale, 0, 0);
  s.draw(x, Math.round((s.w + 4) / 2), s.h + 5, { open: !!opts.open });
  return c.toDataURL();
});
