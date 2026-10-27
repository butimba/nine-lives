// EKRAN GŁÓWNY = WIEŻA. Scena canvas (stage B) + hotspoty DOM.
// Od dołu: Shadow Cellar (drzwi, oczy, licznik) → piętra (kot w oknie swojego piętra) → trofea bossów
// → plakat WANTED (boss tygodnia) → niebo z brakującym Księżycem (Moon Diary).
import { h, esc, app, ico, iconSrc, picSrc, pxButton, sticker, toast, onAct, fmtTime, GEAR, replay } from "./components.js";
import { go } from "./router.js";
import { levelInfo, talentPoints, persist } from "../state.js";
import { livesState, tickLives, sleepyTier, MAX_LIVES } from "../lives.js";
import { streakAlive, weeklyStatus, weeklyBossInfo } from "../meta.js";
import { shadowList } from "../engine.js";
import { sfx, startMusic } from "../audio.js";
import { ECON, STORY } from "../../data/progression.js";
import EVENTS, { activeEvent } from "../../data/events.js";
import * as cloud from "../cloud.js";
import { getCat } from "../pixel/cat.js";
import { chestSprite } from "../pixel/chests.js";
import { makeMonster } from "../pixel/monsters.js";
import { createStage } from "../game/stage.js";
import { createFx, pxText } from "../game/juice.js";
import { dayPhase, drawSky, drawTrophy, biomeForFloor } from "../game/world.js";

// ---------- geometria sceny (logiczne px, szer. 240) ----------
const W = 240, TX0 = 62, TX1 = 178, TCX = 120;  // wieża
const GROUND = 18, LOBBY = 44, BH = 42;           // wys. ziemi, parteru, piętra
const MOON = { x: 212, y: 30 };
const SKY_PAL = {
  night: ["#090818", "#100f2c", "#18173f", "#221f52", "#2c2862"],
  dawn: ["#26285e", "#5a4a94", "#b46aa0", "#f2909a", "#ffc890"],
  day: ["#2f7ad8", "#4a94e8", "#6eaef0", "#98c8f6", "#c8e4ff"],
  dusk: ["#1d1b4a", "#4e3274", "#a84a6e", "#e8705a", "#ffaa5e"],
};
// tło hosta (boczne marginesy poza canvasem) = te same pasy nieba + ziemia, dopasowane do pozycji canvasu
function skyBg(scene, stage, phase, H) {
  const hostH = scene.clientHeight || 1, c = stage.canvas;
  const top = c.offsetTop, ch = c.offsetHeight || hostH;
  const groundPx = top + ch * (H - GROUND) / H;
  const pal = SKY_PAL[phase] || SKY_PAL.night, n = pal.length;
  const stops = pal.map((col, i) => `${col} ${top + (ch * i) / n}px ${top + (ch * (i + 1)) / n}px`);
  return `linear-gradient(${pal[0]} 0 ${top}px, ${stops.join(", ")}, #2a1e18 ${groundPx}px)`;
}
const TINT = { day: null, dawn: ["#ff9a6a", 0.1], dusk: ["#5a2a7a", 0.2], night: ["#0a0a30", 0.4] };

function hash(a, b = 0) { let x = (a * 374761393 + b * 668265263) | 0; x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; }
const mkCanvas = (w, hh) => { const c = document.createElement("canvas"); c.width = w; c.height = hh; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; };

function layoutFor(H, save) {
  const cp = save.tower.checkpoint || 0;
  const catFloor = Math.max(1, cp);
  const groundY = H - GROUND;
  const lobbyTop = groundY - LOBBY;
  const nBands = Math.ceil(lobbyTop / BH) + 1;
  const catIdx = Math.min(2, catFloor - 1);   // kot na 3. pasie od dołu (albo niżej)
  const base = catFloor - catIdx;
  const bands = [];
  for (let i = 0; i < nBands; i++) bands.push({ f: base + i, bottom: lobbyTop - i * BH });
  const catBand = bands[catIdx];
  return { H, cp, catFloor, groundY, lobbyTop, bands, catBand,
    cat: { x: TCX, y: catBand.bottom - 5 },
    door: { x: TCX, y: groundY - 15, w: 30, h: 32 },
    poster: { x: TCX - 2, y: Math.max(8, Math.min(catBand.bottom - BH - 74, 40)) },
    chests: [{ x: 199, y: groundY + 1 }, { x: 224, y: groundY + 1 }, { x: 211, y: groundY - 13 }],
    partner: { x: 32, y: groundY + 1 },
  };
}

// ---------- statyczna wieża (cache per układ + pora dnia) ----------
function bakeTower(L, phase) {
  const [c, x] = mkCanvas(W, L.H);
  const tint = TINT[phase];
  // pasy pięter
  for (const band of L.bands) {
    const b = biomeForFloor(Math.max(1, band.f));
    const top = band.bottom - BH;
    if (band.bottom < -4) continue;
    // cegły
    x.fillStyle = b.mortar; x.fillRect(TX0, top, TX1 - TX0, BH);
    const bw = b.style === "blocks" ? 14 : b.style === "planks" ? 24 : 10, bh = b.style === "blocks" ? 7 : b.style === "planks" ? 6 : 5;
    for (let row = 0, y = top; y < band.bottom; row++, y += bh) for (let px = TX0 + (row % 2 ? -bw / 2 : 0); px < TX1; px += bw) {
      const r = hash(px + band.f * 31, row);
      x.fillStyle = r < 0.18 ? b.brickLo : r > 0.86 ? b.brickHi : b.brick;
      const x0 = Math.max(TX0, px + 1), x1 = Math.min(TX1, px + bw);
      x.fillRect(x0, y + 1, x1 - x0, Math.min(bh - 1, band.bottom - y - 1));
      x.fillStyle = b.brickHi; x.fillRect(x0, y + 1, Math.max(0, x1 - x0 - 1), 1);
    }
    // narożne filary
    x.fillStyle = b.brickLo; x.fillRect(TX0, top, 3, BH); x.fillRect(TX1 - 3, top, 3, BH);
    x.fillStyle = "rgba(0,0,0,.25)"; x.fillRect(TX1 - 6, top, 3, BH);
    if (tint) { x.globalAlpha = tint[1]; x.fillStyle = tint[0]; x.fillRect(TX0, top, TX1 - TX0, BH); x.globalAlpha = 1; }
    // gzyms / półka piętra
    const ly = band.bottom - 4;
    x.fillStyle = b.ledgeLo; x.fillRect(TX0 - 4, ly, TX1 - TX0 + 8, 5);
    x.fillStyle = b.ledge; x.fillRect(TX0 - 4, ly, TX1 - TX0 + 8, 3);
    x.fillStyle = b.ledgeHi; x.fillRect(TX0 - 4, ly, TX1 - TX0 + 8, 1);
    x.fillStyle = "rgba(0,0,0,.35)"; x.fillRect(TX0, ly + 5, TX1 - TX0, 2);
    // tabliczka z numerem
    const boss = band.f % ECON.floorsPerStage === 0;
    const label = String(band.f), pw = Math.max(13, label.length * 4 + 5), px = TX1 - 8 - pw;
    x.fillStyle = "#0e0b16"; x.fillRect(px - 1, band.bottom - 15, pw + 2, 9);
    x.fillStyle = boss ? "#b8323a" : "#2a2238"; x.fillRect(px, band.bottom - 14, pw, 7);
    x.fillStyle = boss ? "#ff6a5a" : "#4a3e60"; x.fillRect(px, band.bottom - 14, pw, 1);
    pxText(x, label, px + pw / 2 + 0.5, band.bottom - 13, { color: boss ? "#ffe9a8" : "#f4efe2", align: "center", outline: null });
    // okna
    if (band === L.catBand) bigWindow(x, b, band);
    else for (const wx of [TX0 + 14, TX0 + 50]) smallWindow(x, b, wx, band.bottom - 30, band.f <= L.cp);
    // balkon z trofeum (pokonany boss)
    if (boss && band.f <= L.cp) {
      x.fillStyle = b.ledgeLo; x.fillRect(TX1, ly - 1, 16, 5); x.fillStyle = b.ledge; x.fillRect(TX1, ly - 1, 16, 3); x.fillStyle = b.ledgeHi; x.fillRect(TX1, ly - 1, 16, 1);
      x.fillStyle = b.ledgeLo; x.fillRect(TX1 + 2, ly + 4, 2, 4); x.fillRect(TX1 + 11, ly + 4, 2, 4);
    }
  }
  // parter + piwnica
  const b0 = biomeForFloor(0);
  const top = L.lobbyTop;
  x.fillStyle = "#1e1a2c"; x.fillRect(TX0, top, TX1 - TX0, LOBBY);
  for (let row = 0, y = top; y < L.groundY; row++, y += 8) for (let px = TX0 + (row % 2 ? -8 : 0); px < TX1; px += 16) {
    const r = hash(px, row + 999);
    x.fillStyle = r < 0.2 ? "#2a2440" : r > 0.85 ? "#4a4064" : "#3a3252";
    const x0 = Math.max(TX0, px + 1), x1 = Math.min(TX1, px + 16);
    x.fillRect(x0, y + 1, x1 - x0, 7); x.fillStyle = "#544a70"; x.fillRect(x0, y + 1, x1 - x0 - 1, 1);
  }
  if (tint) { x.globalAlpha = tint[1]; x.fillStyle = tint[0]; x.fillRect(TX0, top, TX1 - TX0, LOBBY); x.globalAlpha = 1; }
  // drzwi piwnicy (łuk)
  const d = L.door, dx = d.x - d.w / 2, dy = L.groundY - d.h;
  x.fillStyle = "#0e0b16"; x.fillRect(dx - 3, dy + 6, d.w + 6, d.h - 6); x.fillRect(dx, dy, d.w, 8); x.fillRect(dx + 5, dy - 3, d.w - 10, 4);
  x.fillStyle = "#6e6290"; x.fillRect(dx - 2, dy + 7, d.w + 4, d.h - 7); x.fillRect(dx + 1, dy + 1, d.w - 2, 7); x.fillRect(dx + 6, dy - 2, d.w - 12, 3);
  x.fillStyle = "#07060f"; x.fillRect(dx + 2, dy + 8, d.w - 4, d.h - 8); x.fillRect(dx + 4, dy + 4, d.w - 8, 4); x.fillRect(dx + 8, dy + 1, d.w - 16, 3);
  // schodki w dół
  x.fillStyle = "#1a142c"; for (let i = 0; i < 3; i++) x.fillRect(dx + 4 + i * 2, L.groundY - 4 - i * 3, d.w - 8 - i * 4, 2);
  // pochodnie przy drzwiach
  for (const tx of [dx - 12, dx + d.w + 10]) { x.fillStyle = "#3a2a1a"; x.fillRect(tx, dy + 10, 3, 6); x.fillStyle = b0.ledgeLo; x.fillRect(tx - 2, dy + 15, 7, 2); }
  // ziemia
  const g = L.groundY;
  x.fillStyle = "#2a1e18"; x.fillRect(0, g, W, GROUND);
  for (let i = 0; i < 90; i++) { x.fillStyle = i % 3 ? "#3a2a20" : "#4a3628"; x.fillRect(Math.floor(hash(i, 3) * W), g + 4 + Math.floor(hash(i, 4) * (GROUND - 4)), 2 + (i % 3), 1); }
  const grass = phase === "night" ? ["#24412e", "#33603e"] : phase === "day" ? ["#3c6e47", "#6ea04a"] : ["#33563a", "#55804a"];
  x.fillStyle = grass[0]; x.fillRect(0, g, W, 4); x.fillStyle = grass[1]; x.fillRect(0, g, W, 1);
  for (let i = 0; i < W; i += 2) if (hash(i, 9) < 0.45 && (i < TX0 - 2 || i > TX1 + 2)) { x.fillStyle = grass[1]; x.fillRect(i, g - 1 - (hash(i, 8) < 0.3 ? 1 : 0), 1, 1 + (hash(i, 8) < 0.3 ? 1 : 0)); }
  // cień wieży na ziemi
  x.fillStyle = "rgba(0,0,0,.3)"; x.fillRect(TX0 - 6, g, TX1 - TX0 + 12, 2);
  return c;
}

function smallWindow(x, b, wx, wy, lit) {
  x.fillStyle = "#0e0b16"; x.fillRect(wx - 1, wy + 2, 14, 17); x.fillRect(wx + 1, wy, 10, 3);
  x.fillStyle = lit ? b.light : "#120f20"; x.fillRect(wx + 1, wy + 3, 10, 14); x.fillRect(wx + 2, wy + 1, 8, 2);
  if (lit) { x.fillStyle = "rgba(255,255,255,.45)"; x.fillRect(wx + 2, wy + 4, 1, 4); }
  x.fillStyle = "#0e0b16"; x.fillRect(wx + 5, wy + 1, 2, 16); x.fillRect(wx + 1, wy + 9, 10, 1);
  x.fillStyle = b.ledgeHi; x.fillRect(wx - 2, wy + 17, 16, 2);
}
function bigWindow(x, b, band) {
  const ww = 34, wh = 30, wx = TCX - ww / 2, wy = band.bottom - 4 - wh;
  x.fillStyle = "#0e0b16"; x.fillRect(wx - 3, wy + 4, ww + 6, wh - 2); x.fillRect(wx, wy, ww, 5); x.fillRect(wx + 5, wy - 3, ww - 10, 4);
  x.fillStyle = b.ledgeHi; x.fillRect(wx - 2, wy + 5, ww + 4, wh - 3); x.fillRect(wx + 1, wy + 1, ww - 2, 5); x.fillRect(wx + 6, wy - 2, ww - 12, 3);
  x.fillStyle = mixHex(b.light, "#ff9a3d", 0.25); x.fillRect(wx, wy + 6, ww, wh - 6); x.fillRect(wx + 2, wy + 3, ww - 4, 3); x.fillRect(wx + 7, wy, ww - 14, 3);
  x.fillStyle = "rgba(255,255,255,.35)"; x.fillRect(wx + 3, wy + 7, 1, 6); x.fillRect(wx + 5, wy + 7, 1, 2);
  // zasłonki
  x.fillStyle = "#a82848"; x.fillRect(wx, wy + 5, 4, wh - 7); x.fillRect(wx + ww - 4, wy + 5, 4, wh - 7);
  x.fillStyle = "#e8434f"; x.fillRect(wx + 1, wy + 5, 1, wh - 8); x.fillRect(wx + ww - 3, wy + 5, 1, wh - 8);
}
function mixHex(a, b2, k) {
  const p = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
  const A = p(a), B = p(b2);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, "0")).join("");
}

// ---------- wzgórza w tle ----------
function bakeHills(H, phase) {
  const [c, x] = mkCanvas(W, H);
  const col = { night: ["#141233", "#1b1a40"], dawn: ["#4a3a6a", "#6a4a7a"], day: ["#5a8ab8", "#7aa8d0"], dusk: ["#3a2650", "#5a3260"] }[phase];
  const g = H - GROUND;
  for (const [k, amp, off, cc] of [[0.031, 26, 7, col[1]], [0.05, 16, 2, col[0]]]) {
    x.fillStyle = cc;
    for (let i = 0; i < W; i++) { const hh = Math.round(amp * (0.55 + 0.45 * Math.sin(i * k + off)) + 6); x.fillRect(i, g - hh, 1, hh); }
  }
  return c;
}

// =========================================================
export const homeScreen = {
  mount(root, params = {}) {
    const save = app.save, profile = app.profile;
    if (!save) { go("login"); return; }
    tickLives(save);
    const ph0 = dayPhase();
    startMusic(ph0.phase === "night" || ph0.phase === "dusk" ? "home-night" : "home-day");
    const ev = activeEvent(new Date(), EVENTS);
    const shadows = shadowList(save).length;
    const pts = talentPoints(save);
    const el = h(`<div class="screen home">
      <header class="home-hud">
        <div class="hud-row hud-row--top">
          <div class="hearts-wrap" style="display:flex;align-items:center;min-width:0"><div class="hearts" aria-label="lives"></div><span class="hud-next"></span></div>
          <button class="px-btn px-btn--paper gear" data-act="settings" aria-label="Settings"><img class="px-ico" src="${GEAR}" width="24" height="24" alt=""></button>
        </div>
        <div class="hud-row">
          <div class="chip lvl-chip"><span class="lv">LV <b data-lv></b></span><div class="xpbar"><i data-xp></i></div></div>
          <div class="chip chip--fish">${ico("fish")}<b data-fish>${save.coins}</b></div>
          <div class="chip chip--streak">${ico("flame")}<b data-streak>0</b></div>
        </div>
      </header>
      <div class="home-scene"></div>
      <nav class="home-dock">
        <div class="climb-wrap"></div>
        <div class="dock-bar">
          <button class="dock-btn" data-act="wardrobe">${ico("wardrobe", { scale: 3 })}<span>Wardrobe</span>${ev ? `<span class="sticker" style="--tilt:10deg"><span class="sticker-label sticker-label--violet">new</span></span>` : ""}</button>
          <button class="dock-btn" data-act="skills">${ico("skills", { scale: 3 })}<span>Skills</span>${pts > 0 ? `<em class="badge">${pts}</em>` : ""}</button>
          <button class="dock-btn" data-act="cards">${ico("cards", { scale: 3 })}<span>Cards</span></button>
          <button class="dock-btn soon" data-act="daily">${ico("daily", { scale: 3 })}<span>Daily</span><span class="sticker" style="--tilt:12deg"><span class="sticker-label">soon</span></span></button>
        </div>
      </nav>
    </div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);
    const scene = $(".home-scene");

    // ---------- HUD ----------
    let lastN = -1;
    const renderHud = () => {
      const ls = livesState(save);
      if (ls.n !== lastN) {
        const hearts = $(".hearts");
        hearts.innerHTML = Array.from({ length: MAX_LIVES }, (_, i) => `<img class="px-ico ${i < ls.n ? "" : "lost"} ${lastN >= 0 && i >= lastN && i < ls.n ? "pop" : ""}" src="${iconSrc(i < ls.n ? "heart" : "heartEmpty", 2)}" alt="">`).join("");
        hearts.setAttribute("aria-label", `${ls.n} of ${MAX_LIVES} lives`);
        if (lastN >= 0 && (ls.n === 0) !== (lastN === 0)) renderClimb();
        lastN = ls.n;
      }
      $(".hud-next").textContent = ls.n < MAX_LIVES ? `+1 in ${fmtTime(ls.nextInMs)}` : "";
      const L = levelInfo(save.xp);
      $("[data-lv]").textContent = L.lvl;
      $("[data-xp]").style.width = `${Math.round((L.into / L.need) * 100)}%`;
      $("[data-fish]").textContent = save.coins;
      const st = streakAlive(save);
      $("[data-streak]").textContent = st.alive ? st.count : 0;
      $(".chip--streak").classList.toggle("dead", !st.alive);
      const sl = $(".climb-time"); if (sl) sl.textContent = fmtTime(ls.nextInMs);
    };

    // ---------- CLIMB ----------
    const renderClimb = () => {
      const ls = livesState(save);
      const next = save.tower.checkpoint + 1;
      const b = biomeForFloor(next);
      const wrap = $(".climb-wrap");
      if (ls.asleep) {
        wrap.innerHTML = `${pxButton(`<span class="zz">Z z z</span>`, { act: "climb", big: true, variant: "dark", cls: "climb", disabled: true })}
          <div class="climb-sub">Next life in <span class="climb-time">${fmtTime(ls.nextInMs)}</span></div>`;
      } else {
        const tier = sleepyTier(save);
        wrap.innerHTML = `${pxButton("Climb", { act: "climb", big: true, cls: "climb" })}
          <div class="climb-sub">Floor ${next}–${next + ECON.floorsPerStage - 1} · ${esc(b.label || b.name)}</div>
          ${tier > 0 ? `<span class="climb-note">sleepy…</span>` : save.stats.runs < 2 ? `<span class="climb-note">tap!</span>` : ""}`;
      }
    };
    renderClimb();
    renderHud();

    // ---------- scena ----------
    const stage = createStage(scene, { lw: W, minH: 280, maxH: 432 });
    const fx = createFx();
    let L = null, towerC = null, hillsC = null, bakedKey = "";
    let phase = dayPhase();
    let catAnimUntil = 0, catAnim = null;
    const catObj = getCat(save.equipped.skin, save.equipped.hat);
    let partner = null;
    const chestTypes = () => save.chests.slice(0, 3);
    const chestSpr = {};
    const spr = (t) => (chestSpr[t] = chestSpr[t] || (() => { try { return chestSprite(t); } catch { return null; } })());

    const hot = h(`<div class="home-hot" style="position:absolute;inset:0;pointer-events:none"></div>`);
    stage.overlay.append(hot);
    const pos = (x, y) => `left:${(x / W) * 100}%;top:${(y / L.H) * 100}%`;
    const size = (w, hh) => `width:${(w / W) * 100}%;height:${(hh / L.H) * 100}%`;

    const weekly = { p: 0, done: false, claimed: false };
    const weekInfo = weeklyBossInfo();
    let bossURL = "";
    try { bossURL = makeMonster(weekInfo.seed, ["#e8434f", "#8a55d6", "#ffa04d", "#6fe3d3", "#93e04c"], { boss: true }).portraitURL(2); } catch {}

    const renderHot = () => {
      const story = save.story || 0;
      let seen = 0; try { seen = +localStorage.getItem(`ninelives:storySeen:${save.id}`) || 0; } catch {}
      const nC = save.chests.length;
      hot.innerHTML = `
        <button class="hot hot--moon" data-act="moon" aria-label="Moon Diary" style="${pos(MOON.x, MOON.y)};${size(34, 34)}">
          ${story > seen ? `<span class="hot-label" style="top:118%;left:10%;--tilt:6deg">${sticker(`<span class="sticker-label">new page</span>`, { tilt: 0 })}</span>` : `<span class="hot-label hand" style="top:92%;font-size:calc(var(--u) * 10);color:#dfe6ff;--tilt:-6deg">where is<br>the Moon?</span>`}
        </button>
        <button class="hot hot-wanted" data-act="weekly" aria-label="Weekly boss" style="${pos(L.poster.x, L.poster.y + 31)};width:calc(var(--u) * 58)">
          <span class="wanted-mini"><i class="tape tape--c" style="top:calc(var(--u) * -5);width:calc(var(--u) * 26);height:calc(var(--u) * 8);margin-left:calc(var(--u) * -13)"></i>
            <b>WANTED</b>${bossURL ? `<img class="px-img" src="${bossURL}" alt="">` : ""}
            <span class="mini-hp"><i style="width:${Math.round((1 - weekly.p) * 100)}%"></i></span>
            ${weekly.done && !weekly.claimed ? `<span class="mini-claim">claim!</span>` : ""}</span>
        </button>
        <button class="hot hot--cat" data-act="pet" aria-label="Pet your cat" style="${pos(L.cat.x, L.cat.y - 14)};${size(36, 30)}"></button>
        <button class="hot hot--door" data-act="cellar" aria-label="Shadow Cellar" style="${pos(L.door.x, L.door.y)};${size(34, 34)}">
          ${shadows ? `<span class="hot-label" style="top:88%;--tilt:-4deg">${sticker(`<span class="sticker-label sticker-label--violet">${shadows} shadow${shadows === 1 ? "" : "s"}</span>`, { tilt: 0 })}</span>` : ""}
        </button>
        ${nC ? `<button class="hot hot--chest" data-act="chest" aria-label="Open chest" style="${pos(211, L.groundY - 10)};${size(48, 30)}">
          <span class="chest-count">${sticker(`<span class="sticker-label sticker-label--red">${nC}</span>`, { tilt: 8 })}</span></button>` : ""}
        ${partner ? `<span class="duo-tag" style="${pos(L.partner.x, L.groundY - 40)}">${esc(partner.name)}<small>${partner.ago}</small></span>` : ""}
      `;
    };

    const relayout = () => {
      L = layoutFor(stage.h, save);
      bakedKey = "";
      renderHot();
      scene.style.setProperty("--sky-bg", skyBg(scene, stage, phase.phase, L.H));
    };
    stage.onResize(relayout);
    relayout();

    const bake = () => {
      const key = `${L.H}|${phase.phase}|${L.cp}`;
      if (key === bakedKey) return;
      bakedKey = key;
      towerC = bakeTower(L, phase.phase);
      hillsC = bakeHills(L.H, phase.phase);
      scene.style.setProperty("--sky-bg", skyBg(scene, stage, phase.phase, L.H));
    };

    let phaseT = 0;
    stage.setScene({
      update(dt, t) {
        fx.update(dt);
        phaseT += dt;
        if (phaseT > 30) { phaseT = 0; phase = dayPhase(); }
      },
      draw(ctx, t) {
        bake();
        const night = phase.phase === "night";
        drawSky(ctx, W, L.H, phase, t, { moon: true, moonX: MOON.x, moonY: MOON.y, birds: true, fireflies: false });
        ctx.drawImage(hillsC, 0, 0);
        ctx.drawImage(towerC, 0, 0);
        // blask okien i pochodni
        const glowA = { day: 0.06, dawn: 0.22, dusk: 0.32, night: 0.5 }[phase.phase];
        ctx.globalCompositeOperation = "lighter";
        for (const band of L.bands) {
          if (band.bottom < 0 || band.bottom > L.H + BH) continue;
          const b = biomeForFloor(Math.max(1, band.f));
          if (band === L.catBand) { ctx.globalAlpha = glowA * (0.9 + 0.1 * Math.sin(t * 3)); glow(ctx, TCX, band.bottom - 18, 26, b.light); }
          else if (band.f <= L.cp) { ctx.globalAlpha = glowA * 0.6; glow(ctx, TX0 + 20, band.bottom - 22, 12, b.light); glow(ctx, TX0 + 56, band.bottom - 22, 12, b.light); }
        }
        const d = L.door;
        for (const tx of [d.x - d.w / 2 - 11, d.x + d.w / 2 + 11]) {
          const fl = 0.85 + 0.15 * Math.sin(t * 13 + tx);
          ctx.globalAlpha = glowA * 1.2 * fl; glow(ctx, tx, L.groundY - d.h + 8, 16, "#ffb43a");
        }
        ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
        for (const tx of [d.x - d.w / 2 - 11, d.x + d.w / 2 + 11]) {
          const fr = Math.floor(t * 10 + tx) % 3, ty = L.groundY - d.h + 8;
          ctx.fillStyle = "#ff6a2c"; ctx.fillRect(tx - 2, ty, 4, 3);
          ctx.fillStyle = "#ffb43a"; ctx.fillRect(tx - 1, ty - 3 - (fr === 1 ? 1 : 0), 2, 4);
          ctx.fillStyle = "#fff2a8"; ctx.fillRect(tx, ty - 2 - (fr % 2), 1, 2);
        }
        // oczy w piwnicy (tyle par, ile cieni, max 3)
        const pairs = Math.min(3, shadows);
        for (let i = 0; i < pairs; i++) {
          if ((Math.floor(t * 0.8 + i * 1.3) % 6) === 0 && ((t * 5 + i) % 1) < 0.35) continue;
          const ex = d.x - 9 + i * 7 + (i === 1 ? 0 : 0), ey = L.groundY - 22 + (i % 2) * 6 + Math.round(Math.sin(t * 0.7 + i) * 1);
          ctx.fillStyle = i === 1 ? "#ffd27a" : "#c9a0ff";
          ctx.fillRect(ex, ey, 2, 1); ctx.fillRect(ex + 4, ey, 2, 1);
        }
        // trofea
        for (const band of L.bands) if (band.f % ECON.floorsPerStage === 0 && band.f <= L.cp) drawTrophy(ctx, TX1 + 8, band.bottom - 5, t + band.f);
        // kot w oknie
        const ls = livesState(save);
        const anim = performance.now() < catAnimUntil ? catAnim : ls.asleep ? "sleep" : "idle";
        try { catObj.draw(ctx, L.cat.x, L.cat.y, { anim, t }); } catch {}
        if (ls.asleep) {
          for (let i = 0; i < 3; i++) {
            const k = ((t * 0.5 + i / 3) % 1);
            ctx.globalAlpha = 1 - k;
            pxText(ctx, "Z", L.cat.x + 10 + k * 10 + i * 2, L.cat.y - 26 - k * 22, { color: "#f4efe2", scale: k > 0.5 ? 2 : 1 });
          }
          ctx.globalAlpha = 1;
        }
        // skrzynie przy wieży (drgają)
        const types = chestTypes();
        types.forEach((ty, i) => {
          const s = spr(ty); if (!s) return;
          const cycle = (t + i * 0.7) % 2.6, sh = cycle < 0.45 ? Math.sin(cycle * 40) * 1.5 : 0;
          const p = L.chests[i];
          try { s.draw(ctx, Math.round(p.x + sh), p.y - (cycle < 0.45 && cycle > 0.15 ? 1 : 0), { shake: 0 }); } catch {}
        });
        // kot z duetu
        if (partner && partner.cat) try { partner.cat.draw(ctx, L.partner.x, L.partner.y, { anim: "idle", t: t + 0.4 }); } catch {}
        // chmurki z przodu
        ctx.globalAlpha = night ? 0.5 : 0.85;
        const cc = night ? "#2a2860" : phase.phase === "day" ? "#f4f8ff" : "#f6c4c0";
        for (let i = 0; i < 2; i++) {
          const cx = ((t * (3 + i * 2) + i * 140) % (W + 80)) - 60, cy = 60 + i * 34;
          ctx.fillStyle = cc; ctx.fillRect(Math.round(cx), cy + 3, 34, 4); ctx.fillRect(Math.round(cx) + 5, cy, 18, 3); ctx.fillRect(Math.round(cx) + 22, cy + 1, 7, 2);
        }
        ctx.globalAlpha = 1;
        fx.draw(ctx);
      },
    });

    // ---------- tygodniowy boss ----------
    weeklyStatus(save).then((w) => {
      weekly.p = Math.min(1, w.total / w.hp); weekly.done = weekly.p >= 1; weekly.claimed = save.weekly.claimed.includes(w.week);
      if (el.isConnected) renderHot();
    }).catch(() => {});

    // ---------- duet ----------
    if (cloud.enabled() && profile && profile.duo) cloud.loadPublic(profile.duo).then((p) => {
      if (!p || !p.name || !el.isConnected) return;
      const hrs = p.updated_at ? (Date.now() - new Date(p.updated_at)) / 3600000 : null;
      let cat = null; try { cat = getCat(p.skin || "ginger", p.hat || "none"); } catch {}
      partner = { name: p.name, cat, ago: hrs == null ? "" : hrs < 24 ? "played today" : `${Math.round(hrs / 24)} days ago` };
      renderHot();
    }).catch(() => {});

    // ---------- zdarzenia ----------
    const pet = () => {
      sfx.purr();
      catAnim = Math.random() < 0.5 ? "dance" : "jump"; catAnimUntil = performance.now() + 900;
      fx.burst(L.cat.x, L.cat.y - 16, { n: 8, colors: ["#ff8fa3", "#ffc9d3", "#f4efe2"], speed: 30, gravity: -20, life: 0.9 });
      fx.float(L.cat.x, L.cat.y - 30, ["PURR", "MEOW", "PRRR"][Math.floor(Math.random() * 3)], { color: "#ffc9d3" });
    };
    const off = onAct(el, {
      climb: () => {
        if (livesState(save).asleep) { toast("Your cat is sleeping. Come back later!"); return; }
        sfx.tap(); go("run", { mode: "tower" });
      },
      cellar: () => {
        if (shadows < 3) { sfx.tap(); toast(shadows ? "Only a few shadows. Come back later!" : "No shadows here. Good job!"); return; }
        sfx.tap(); go("run", { mode: "shadow" });
      },
      pet,
      moon: () => { sfx.tap(); go("story"); },
      weekly: () => { sfx.tap(); go("weekly"); },
      chest: () => { if (save.chests.length) { sfx.tap(); go("chest"); } },
      settings: () => { sfx.tap(); go("settings"); },
      wardrobe: () => { sfx.tap(); go("wardrobe"); },
      skills: () => { sfx.tap(); go("skills"); },
      cards: () => { sfx.tap(); go("cards"); },
      daily: (b) => { replay(b, "nope"); toast("Daily quests: coming soon!"); },
    });

    // event (Halloween…) jako naklejka
    if (ev) {
      const s = h(`<button class="event-sticker" data-act="wardrobe" aria-label="${esc(ev.name)}">${sticker(`<span class="ev-pic">${ev.deco ? `<img class="px-img" src="${picSrc([...ev.deco][0], 2)}" alt="">` : ""}</span><span class="sticker-label">${esc(ev.name)}</span>`, { tilt: -6 })}</button>`);
      scene.append(s);
    }
    if (params.first) setTimeout(() => toast(`Hi, ${save.catName}! Tap Climb!`), 400);

    const onWin = () => setTimeout(() => { if (L && el.isConnected) scene.style.setProperty("--sky-bg", skyBg(scene, stage, phase.phase, L.H)); }, 150);
    window.addEventListener("resize", onWin);
    const timer = setInterval(renderHud, 1000);
    const lifeTimer = setInterval(() => { tickLives(save); renderHud(); }, 30000);
    return () => { window.removeEventListener("resize", onWin); clearInterval(timer); clearInterval(lifeTimer); off(); stage.destroy(); };
  },
};

function glow(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  for (const [rr, a] of [[r, 0.35], [r * 0.66, 0.5], [r * 0.36, 0.7]]) {
    const ga = ctx.globalAlpha; ctx.globalAlpha = ga * a;
    const R = Math.round(rr);
    for (let dy = -R; dy <= R; dy += 1) { const dx = Math.floor(Math.sqrt(R * R - dy * dy)); ctx.fillRect(Math.round(x - dx), Math.round(y + dy), dx * 2 + 1, 1); }
    ctx.globalAlpha = ga;
  }
}
