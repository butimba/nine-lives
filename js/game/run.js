// RUN — the cat climbs the tower. 5 floors = a stage, boss on floor 5. Replaces v1 battle.js.
// Per answer: Session task -> planTask (C) -> mechanic -> record() -> juice. Lives (D) only lost on wrong English.
import { createStage } from "./stage.js";
import { createFx, pxText, pxTextWidth } from "./juice.js";
import { drawTower, floorY, CAT_X, HATCH, climbPath, dayPhase, approach } from "./world.js";
import { biomeForFloor, SHADOW_BIOME } from "./biomes.js";
import { bossIntro, createBossFight } from "./boss.js";
import { createRunUI } from "./runui.js";
import { planTask, MECHANICS } from "./mechanics/index.js";
import { Session, record } from "../engine.js";
import { PERKS, ECON, powerById, RUN_EVENTS, MERCHANT_OFFERS } from "../../data/progression.js";
import { ensureDaily, progressDaily } from "../daily.js";
import { syncPowers } from "../rewards.js";
import EVENTS, { activeEvent } from "../../data/events.js";
import { sfx, speak, startMusic, stopMusic } from "../audio.js";
import { persist } from "../state.js";
import * as lives from "../lives.js";
import { getCat, catURL } from "../pixel/cat.js";
import { chestSprite } from "../pixel/chests.js";
import { makeMonster } from "../pixel/monsters.js";
import { ICONS, iconURL } from "../pixel/icons.js";
import { drawSprite } from "../pixel/sprite.js";
import { pixelURL } from "../pixel/pixelizer.js";

const tr = (save, id) => (save.talents && save.talents[id]) || 0;
const S_ = (k, ...a) => { try { sfx[k] && sfx[k](...a); } catch {} };
const say = (txt) => { try { if (txt) speak(txt); } catch {} };
const AS = 2; // actors (cat, monsters) are drawn at 2x so 7-year-olds can see them on a phone
const isStub = (spr) => !spr || !spr.w || !spr.anchor;
const ease = { out: (k) => 1 - (1 - k) ** 3, inQ: (k) => k * k, back: (k) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2 };
const HEART = [".##.##.", "#######", "#######", ".#####.", "..###..", "...#..."];
const FISH = ["...##...", ".######.#", "#.#######", "########.", ".######.#", "...##...."];

function pix(ctx, rows, x, y, col, out = "#0e0b16", s = 1) {
  x = Math.round(x); y = Math.round(y);
  if (out) { ctx.fillStyle = out; rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === "#") ctx.fillRect(x + i * s - 1, y + j * s - 1, s + 2, s + 2); })); }
  ctx.fillStyle = col; rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === "#") ctx.fillRect(x + i * s, y + j * s, s, s); }));
}

export async function runGame(hostEl, save, profile = {}, mode = "tower", opts = {}) {
  const isShadow = mode === "shadow";
  const startedAt = Date.now();
  const debug = (() => { try { return new URLSearchParams(location.search).has("debug"); } catch { return false; } })();
  const DBG = debug ? (window.__nl = window.__nl || {}) : null;
  const setState = (s) => { if (DBG) DBG.runState = s; };
  const qp = (k) => { try { return new URLSearchParams(location.search).get(k); } catch { return null; } };
  // ?debug&season=halloween|none forces a seasonal event, ?debug&event=golden|mimic|merchant|secret forces a run event
  const seasonQ = debug ? qp("season") : null;
  const ev = seasonQ ? EVENTS.find((e) => e.id === seasonQ) || null : activeEvent(new Date(), EVENTS);
  const halloween = !!(ev && ev.id === "halloween" && ev.mech === "trickortreat");
  const forceEvent = debug ? qp("event") : null;

  const blank = (extra = {}) => ({ mode, startFloor: save.tower.checkpoint + 1, floorReached: save.tower.checkpoint, bossBeaten: false, quit: false,
    asleep: false, answers: 0, correct: 0, bestCombo: 0, kills: 0, coins: 0, xp: 0, weeklyDmg: 0, ms: 0, perks: [], ...extra });

  lives.tickLives(save);
  try { ensureDaily(save, profile); } catch (e) { console.warn("daily", e); }
  let unlockedPowers = [];
  try { unlockedPowers = syncPowers(save).map((p) => p.id); } catch (e) { console.warn("powers", e); }
  save.stats = save.stats || {}; save.stats.events = save.stats.events || {};
  const bumpEvent = (k) => { save.stats.events[k] = (save.stats.events[k] || 0) + 1; };
  const startLives = lives.livesState(save).n;
  if (!isShadow && startLives <= 0) return blank({ asleep: true });
  const session = new Session(save, profile, mode);
  if (!session.pool.length) return blank({ empty: true });

  // ---------- run state ----------
  const S = {
    combo: 0, bestCombo: 0, coins: 0, xp: 0, perks: [], answers: 0, correct: 0, kills: 0, weeklyDmg: 0,
    shields: tr(save, "nine_lives"), hints: { left: tr(save, "sixth_sense") > 0 ? tr(save, "sixth_sense") + 1 : 1 },
    startFloor: isShadow ? -1 : save.tower.checkpoint + 1, bossBeaten: false, quit: false, asleep: false,
    livesN: startLives, dream: isShadow && startLives <= 0, cellarErrors: 0, dreamErrors: 0,
    livesLost: 0, failedKeys: new Set(), freezeTasks: 0, clawHits: 0, magnetFloor: null, powersUsed: 0,
    stageEvent: null, events: [], eventChests: [],
  };
  const has = (id) => S.perks.includes(id);
  let floor = isShadow ? 0 : S.startFloor - 1; // the cat starts on the ledge below and climbs in
  const floorFrom = isShadow ? -8 : 0;
  const nFloors = isShadow ? Math.min(6, Math.max(3, session.pool.length)) : ECON.floorsPerStage;

  // ---------- DOM + stage ----------
  hostEl.innerHTML = "";
  const screen = document.createElement("div");
  screen.className = `run-screen ${isShadow ? "is-shadow" : ""}`;
  hostEl.append(screen);
  const stage = createStage(screen, { lw: 240, minH: 360, maxH: 600 });
  const fx = createFx();
  const imgURL = (img) => pixelURL(img, 4);
  const ui = createRunUI(stage.overlay, { showPl: save.settings.pl !== false, speak: say, sfx, imgURL, iconURL: (n, s) => (isStub(ICONS[n]) ? "" : iconURL(n, s)) });
  let quitRes;
  const quitP = new Promise((r) => (quitRes = r));
  ui.onQuit = () => { S.quit = true; quitRes("quit"); };
  ui.onModal = (open) => { stage.paused = open; };
  const untilQuit = (p) => Promise.race([p, quitP]);

  const footY = () => stage.h - 46;           // screen y of the current ledge
  let camY = floorY(floor) - footY(), camFollow = null;
  const toScreenY = (wy) => wy - camY;

  // ---------- cat ----------
  const catSpr = getCat(save.equipped.skin, save.equipped.hat);
  const cat = { wx: CAT_X, wy: floorY(floor), anim: "idle", animT: 0, flip: false, sx: 1, sy: 1, flash: 0 };
  const tweens = [];
  const tween = (dur, fn, done) => new Promise((res) => tweens.push({ t: 0, dur: Math.max(0.01, dur), fn, res: () => { done && done(); res(); } }));
  const dust = (x, sy, n = 6) => fx.burst(x, sy, { n, colors: ["#d8ccb4", "#a89c86"], speed: 30, gravity: -20, life: 0.4, spread: Math.PI, angle: -Math.PI / 2 });
  const land = () => {
    cat.anim = "idle"; cat.sx = 1.25; cat.sy = 0.75;
    dust(cat.wx, toScreenY(cat.wy));
    S_("tap");
  };
  function jumpWorld(x, y, dur = 0.3, hgt = 22, { quiet = false } = {}) {
    const x0 = cat.wx, y0 = cat.wy;
    if (Math.abs(x - x0) > 1) cat.flip = x < x0;
    cat.anim = "jump"; cat.sx = 0.85; cat.sy = 1.2;
    if (!quiet) S_("jump");
    const top = Math.min(y0, y) - hgt;
    return tween(dur, (k) => {
      cat.wx = x0 + (x - x0) * k;
      // parabola through y0 -> top -> y
      const a = y0 + (top - y0) * (1 - (1 - 2 * Math.min(k, 0.5)) ** 2);
      const b = top + (y - top) * ((Math.max(k, 0.5) - 0.5) * 2) ** 2;
      cat.wy = k < 0.5 ? a : b;
      cat.sx += (1 - cat.sx) * 0.2; cat.sy += (1 - cat.sy) * 0.2;
    }, land);
  }
  function fallWorld(x, y, dur = 0.35) {
    const y0 = cat.wy; cat.wx = x; cat.anim = "jump";
    return tween(dur, (k) => { cat.wy = y0 + (y - y0) * ease.inQ(k); }, () => { land(); stage.shake(1.5, 120); });
  }
  const atHome = () => Math.abs(cat.wx - CAT_X) < 2 && Math.abs(cat.wy - floorY(floor)) < 2;
  const goHome = async () => { if (!atHome()) await jumpWorld(CAT_X, floorY(floor), 0.26, 10, { quiet: true }); cat.flip = false; };
  const catApi = {
    get x() { return cat.wx; }, set x(v) { cat.wx = v; },
    get y() { return toScreenY(cat.wy); }, set y(v) { cat.wy = v + camY; },
    jumpTo(x, y) { return jumpWorld(x, y + camY, 0.24, 14); },
    attack() { cat.anim = "attack"; cat.animT = 0; return tween(0.2, () => {}, () => { if (cat.anim === "attack") cat.anim = "idle"; }); },
    setAnim(a) { if (cat.anim === "attack" && a !== "attack") return; if (cat.anim !== a) { cat.anim = a; cat.animT = 0; } },
    setFlip(f) { cat.flip = !!f; },
  };

  // ---------- monster ----------
  let mon = null;
  const GOLD_PAL = ["#ffd23f", "#fff1a8", "#c98a12"];
  function spawn(f, kind = null) {
    const b = isShadow ? SHADOW_BIOME : biomeForFloor(f);
    const boss = !isShadow && f % ECON.floorsPerStage === 0;
    let pal = ev && ev.monTint && !isShadow && Math.random() < 0.4 ? ev.monTint : b.mon;
    if (kind === "golden") pal = GOLD_PAL;
    const m = kind === "mimic" ? makeMimic() : makeMonster(`${save.id}-${f}-${startedAt}`, pal, { boss, shadow: isShadow });
    const hp = isShadow ? 1 : boss ? ECON.bossHp(f) : ECON.monsterHp(f);
    mon = { m, boss, hp, max: hp, hpShow: hp, wx: 240 - (boss ? 58 : 50), wy: floorY(f), anim: "idle", animT: 0, flash: 0,
      drop: 1, lx: 0, off: 0, sx: 1, sy: 1, dead: false, alpha: 1, phase: 1, colors: kind === "mimic" ? ["#b0703e", "#ffd23f"] : [pal[0] || "#ff6b2c", pal[1] || "#ffcf3f"],
      golden: kind === "golden" ? { turns: RUN_EVENTS.golden.turns } : null, mimic: kind === "mimic" ? { revealed: false } : null, trick: null, fled: false };
    return tween(0.45, (k) => { mon.drop = 1 - ease.out(k); }, () => {
      mon.sx = 1.3; mon.sy = 0.7; stage.shake(boss ? 3 : 1, 150);
      fx.burst(mon.wx, toScreenY(mon.wy), { n: 10, colors: ["#d8ccb4", "#a89c86"], speed: 40, gravity: -10, spread: Math.PI, angle: -Math.PI / 2 });
      S_(boss ? "bossIntro" : "pop");
    });
  }
  const monW = () => (mon.m.w || 22) * AS, monH = () => (mon.m.h || 22) * AS;
  const monScreen = () => ({ x: mon.wx + mon.lx + (mon.off || 0), y: toScreenY(mon.wy) });

  // ---------- mimic: a chest with teeth ----------
  function makeMimic() {
    const ch = chestSprite("wood");
    const m = {
      name: "Mimic", w: 20, h: 16, boss: false,
      draw(ctx, x, y, { anim = "idle", t = 0, flash = false, scale = 1 } = {}) {
        const rev = mon && mon.mimic && mon.mimic.revealed;
        const chomp = rev && (anim === "lunge" || (anim === "idle" && Math.floor(t * 3) % 2 === 0));
        const open = rev ? chomp || anim === "die" : false;
        const peek = !rev && Math.floor(t * 0.8) % 4 === 3;
        ch.draw(ctx, x, y, { open, shake: rev ? 0 : peek ? 1 : 0, scale, t, flash });
        const px = (dx, dy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x + dx * scale), Math.round(y + dy * scale), w * scale, h * scale); };
        if (open) {
          // eyes in the dark, tongue, teeth
          px(-6, -15, 3, 2, "#ffd23f"); px(3, -15, 3, 2, "#ffd23f"); px(-5, -15, 1, 2, "#0e0b16"); px(4, -15, 1, 2, "#0e0b16");
          px(-4, -11, 8, 2, "#e8434f"); px(-2, -11, 3, 1, "#ff9aa8");
          for (let i = 0; i < 6; i++) { px(-9 + i * 3, -12, 2, 1, "#ffffff"); px(-8 + i * 3, -11, 1, 1, "#ffffff"); }
        } else if (rev || peek) {
          // eyes peeking from under the lid
          px(-6, -11, 2, 1, "#ffd23f"); px(4, -11, 2, 1, "#ffd23f");
          if (rev) for (let i = 0; i < 6; i++) px(-9 + i * 3, -10, 1, 1, "#ffffff");
        }
      },
      portraitURL: () => "",
    };
    return m;
  }

  // ---------- boss fight ----------
  let fight = null;
  function startFight() {
    fight = createBossFight({
      stage, fx, sfx,
      from: () => { const p = monScreen(); return { x: p.x, y: p.y - monH() * 0.6 }; },
      to: () => ({ x: cat.wx, y: toScreenY(cat.wy) - 14 }),
      colors: mon.colors,
      onDeflect: () => { S.coins += 1; },
      onMiss: () => {
        const c = { x: cat.wx, y: toScreenY(cat.wy) - 24 };
        if (S.shields > 0) {
          S.shields--; S_("pop");
          fx.ring(c.x, c.y, "#7ec4ff", { r: 6 }); fx.float(c.x, c.y - 10, "SHIELD!", { color: "#7ec4ff" });
        } else {
          if (S.combo >= 2) fx.float(c.x, c.y - 10, "COMBO LOST", { color: "#ff9a8a" });
          S.combo = 0; cat.anim = "hurt"; cat.flash = 0.2; S_("hurt");
          setTimeout(() => { if (cat.anim === "hurt") cat.anim = "idle"; }, 350);
        }
      },
    });
  }

  // ---------- banners ----------
  let banner = null;
  const showBanner = (text, sub = "", dur = 1.3, color = "#ffcf3f") => { banner = { text, sub, t: 0, dur, color }; };

  // ---------- HUD geometry ----------
  const HUD = { fish: () => ({ x: 204, y: 10 }), heart: (i) => ({ x: 4 + i * 15 + 7, y: 9 }) };
  let heartPulse = new Array(9).fill(0);
  let fishPulse = 0;

  // ---------- mechanic in play ----------
  let mech = null;
  let runState = "idle";
  const typing = () => { const ae = document.activeElement; return !!(ae && stage.overlay.contains(ae) && /^(INPUT|TEXTAREA)$/.test(ae.tagName)); };

  // ---------- scene ----------
  const scene = {
    update(dt, t) {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i]; tw.t += dt; const k = Math.min(1, tw.t / tw.dur);
        tw.fn(k);
        if (k >= 1) { tweens.splice(i, 1); tw.res(); }
      }
      const target = camFollow ? camFollow() : floorY(floor) - footY();
      camY = approach(camY, target, dt, camFollow ? 9 : 6);
      cat.animT += dt;
      cat.sx += (1 - cat.sx) * Math.min(1, dt * 14); cat.sy += (1 - cat.sy) * Math.min(1, dt * 14);
      if (cat.flash > 0) cat.flash -= dt;
      if (mon) {
        mon.animT += dt;
        if (mon.flash > 0) mon.flash -= dt;
        mon.sx += (1 - mon.sx) * Math.min(1, dt * 12); mon.sy += (1 - mon.sy) * Math.min(1, dt * 12);
        mon.hpShow += (mon.hp - mon.hpShow) * Math.min(1, dt * 5);
      }
      if (fight) { fight.paused = runState !== "task" || typing() || !!(mech && mech.typing) || ui.modalOpen || S.freezeTasks > 0; fight.update(dt, t); }
      if (mech && mech.update) mech.update(dt, t);
      updateExtras(dt, t);
      fx.update(dt);
      for (let i = 0; i < 9; i++) if (heartPulse[i] > 0) heartPulse[i] -= dt;
      if (fishPulse > 0) fishPulse -= dt;
      if (banner) { banner.t += dt; if (banner.t > banner.dur) banner = null; }
    },
    draw(ctx, t) {
      const w = 240, h = stage.h;
      drawTower(ctx, { w, h, camY, floorFrom, t, phase: dayPhase(), trophies: trophies() });
      if (merchantNPC) drawMerchant(ctx, t);
      if (mon && !(mon.dead && mon.alpha <= 0)) drawMonster(ctx, t);
      drawCat(ctx, t);
      if (mech && mech.draw) { ctx.save(); try { mech.draw(ctx, t); } finally { ctx.restore(); } }
      if (fight) fight.draw(ctx, t);
      if (bonus) drawBonus(ctx, t);
      fx.draw(ctx);
      if (S.freezeTasks > 0) drawFrost(ctx, t);
      drawHud(ctx, t);
      if (powerFx) drawPowerFx(ctx, t);
      if (banner) drawBanner(ctx, t);
    },
  };
  const trophies = () => {
    const out = [];
    if (isShadow) return out;
    for (let f = ECON.floorsPerStage; f <= save.tower.checkpoint; f += ECON.floorsPerStage) out.push(f);
    if (S.bossBeaten) out.push(S.startFloor + ECON.floorsPerStage - 1);
    return out;
  };

  function drawCat(ctx, t) {
    const x = Math.round(cat.wx), y = Math.round(toScreenY(cat.wy));
    // shadow on the ledge when in the air
    const ly = Math.round(toScreenY(floorY(floor)));
    if (Math.abs(cat.wy - floorY(floor)) > 3 && cat.wy < floorY(floor) && cat.wx > HATCH.x1) {
      ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x - 14, ly - 2, 28, 2);
    }
    const o = { anim: cat.anim, t: cat.animT, flip: cat.flip, flash: cat.flash > 0, scale: AS };
    if (cat.sx !== 1 || cat.sy !== 1) { ctx.save(); ctx.translate(x, y); ctx.scale(cat.sx, cat.sy); catSpr.draw(ctx, 0, 0, o); ctx.restore(); }
    else catSpr.draw(ctx, x, y, o);
    if (cat.anim === "sleep") {
      const k = (t * 0.6) % 1, zx = Math.round(x + 18 + k * 10), zy = Math.round(y - 44 - k * 18);
      ctx.globalAlpha = Math.min(1, (1 - k) * 2);
      if (!isStub(ICONS.zzz)) drawSprite(ctx, ICONS.zzz, 0, zx, zy, {});
      else pxText(ctx, "Z", zx, zy, { color: "#dfe6ff", scale: 2 });
      ctx.globalAlpha = 1;
    }
  }
  function drawMonster(ctx, t) {
    const p = monScreen();
    const x = Math.round(p.x), y = Math.round(p.y - mon.drop * 160);
    ctx.save();
    ctx.globalAlpha = mon.alpha;
    // ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)"; ctx.fillRect(x - Math.round(monW() * 0.4), Math.round(p.y) - 2, Math.round(monW() * 0.8), 2);
    const bob = mon.anim === "idle" ? Math.round(Math.sin(t * 3) * 1.5) : 0;
    const o = { anim: mon.anim, t: mon.animT, flash: mon.flash > 0, scale: AS };
    if (mon.phase === 2 && Math.floor(t * 6) % 2 === 0 && mon.flash <= 0) o.flash = false;
    ctx.translate(x, y + bob);
    if (mon.sx !== 1 || mon.sy !== 1) ctx.scale(mon.sx, mon.sy);
    if (mon.trick) drawTrick(ctx, mon.trick, t);
    else mon.m.draw(ctx, 0, 0, o);
    ctx.restore();
    if (mon.golden && !mon.dead && Math.floor(t * 7) % 3 === 0) {
      // twinkles on the golden monster
      const k = Math.floor(t * 7);
      const sx = Math.round(x + ((k * 37) % 40) - 20), sy = Math.round(y - ((k * 23) % monH()));
      ctx.fillStyle = "#ffffff"; ctx.fillRect(sx, sy - 2, 1, 5); ctx.fillRect(sx - 2, sy, 5, 1);
    }
    if (mon.dead || mon.fled) return;
    if (mon.mimic && !mon.mimic.revealed) return; // just a chest... right?
    // HP bar + name
    const bw = mon.boss ? 56 : 36, bx = Math.round(x - bw / 2), by = Math.round(y - monH() - 10);
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(bx - 1, by - 1, bw + 2, 7);
    ctx.fillStyle = "#3a1a24"; ctx.fillRect(bx, by, bw, 5);
    ctx.fillStyle = "#fff2a8"; ctx.fillRect(bx, by, Math.round(bw * Math.max(0, mon.hpShow) / mon.max), 5);
    const hpC = mon.hp / mon.max > 0.5 ? "#5ccb5f" : mon.hp / mon.max > 0.25 ? "#ffcf3f" : "#e8434f";
    ctx.fillStyle = hpC; ctx.fillRect(bx, by, Math.round(bw * Math.max(0, mon.hp) / mon.max), 5);
    ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.fillRect(bx, by, bw, 1);
    for (let i = 1; i < mon.max; i++) { ctx.fillStyle = "#0e0b16"; ctx.fillRect(bx + Math.round(bw * i / mon.max), by, 1, 5); }
    if (mon.boss) pxText(ctx, (mon.m.name || "BOSS").toUpperCase().slice(0, 18), x, by - 8, { color: "#ffcf3f", align: "center" });
    if (mon.golden) {
      // turns left before it runs away: clock + number
      const tx = bx + bw + 3, ty = by - 2;
      if (!isStub(ICONS.clock)) drawSprite(ctx, ICONS.clock, 0, tx + ICONS.clock.anchor.x, ty + ICONS.clock.anchor.y, {});
      pxText(ctx, String(Math.max(0, mon.golden.turns)), tx + 11, ty + 1, { color: mon.golden.turns <= 1 ? "#ff6a5a" : "#ffcf3f" });
      pxText(ctx, "GOLDEN!", x, by - 8, { color: "#ffcf3f", align: "center" });
    }
  }
  function drawHud(ctx, t) {
    const H = stage.h;
    // top bar
    ctx.fillStyle = "rgba(14,11,22,0.72)"; ctx.fillRect(0, 0, 240, 20);
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(0, 20, 240, 1);
    // hearts (9 lives) at 2x
    const n = S.livesN;
    const useIco = !isStub(ICONS.heart);
    for (let i = 0; i < 9; i++) {
      const full = i < n;
      const p = heartPulse[i] > 0 ? Math.round(Math.sin(heartPulse[i] * 30) * 2) : 0;
      const hx = 4 + i * 15, hy = 4 - p;
      if (useIco) { const sp = full ? ICONS.heart : ICONS.heartEmpty; drawSprite(ctx, sp, 0, hx + 1 + sp.anchor.x, hy + 1 + sp.anchor.y, { silhouette: false, alpha: full && S.dream ? 0.6 : 1 }); }
      else {
        pix(ctx, HEART, hx, hy, full ? (S.dream ? "#9a8cff" : "#e8434f") : "#3a2f4e", "#0e0b16", 2);
        if (full) { ctx.fillStyle = S.dream ? "#d8d0ff" : "#ffb0b8"; ctx.fillRect(hx + 2, hy + 2, 2, 2); }
      }
    }
    // fish (run coins), 2x
    const fp = fishPulse > 0 ? 1 : 0;
    const fishX = 196, fishY = 5 - fp;
    if (!isStub(ICONS.fish)) drawSprite(ctx, ICONS.fish, 0, fishX + 2 + ICONS.fish.anchor.x * 1, fishY + ICONS.fish.anchor.y, {});
    else pix(ctx, FISH, fishX, fishY, "#7ec4ff", "#0e0b16", 2);
    pxText(ctx, String(Math.round(S.coins)), fishX - 3, fishY + 1, { color: fp ? "#ffffff" : "#ffcf3f", align: "right", scale: 2 });
    HUD.fish = () => ({ x: fishX + 8, y: 10 });
    // shields float over the cat's head
    if (S.shields > 0) {
      const cx = cat.wx, cy = toScreenY(cat.wy) - 62;
      for (let i = 0; i < Math.min(S.shields, 5); i++) {
        const sx = Math.round(cx - (Math.min(S.shields, 5) * 8) / 2 + i * 8), sy = Math.round(cy + Math.sin(t * 3 + i) * 1.5);
        ctx.fillStyle = "#0e0b16"; ctx.fillRect(sx - 1, sy - 1, 7, 8);
        ctx.fillStyle = "#3b78d8"; ctx.fillRect(sx, sy, 5, 5); ctx.fillRect(sx + 1, sy + 5, 3, 1);
        ctx.fillStyle = "#bfe8ff"; ctx.fillRect(sx + 1, sy + 1, 1, 2);
      }
    }
    // bottom bar: combo meter (left) + floor plaque (middle)
    const by = H - 25;
    const cm = S.combo % 8, full = S.combo > 0 && S.combo % 8 === 0;
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(3, by - 3, 116, 22);
    ctx.fillStyle = "#1d1530"; ctx.fillRect(4, by - 2, 114, 20);
    pxText(ctx, "COMBO", 8, by + 1, { color: S.combo >= 3 ? "#ffcf3f" : "#8a7aa8", outline: null });
    if (S.combo >= 2) pxText(ctx, `x${S.combo}`, 8, by + 8, { color: "#ffcf3f", outline: null, scale: 1 });
    for (let i = 0; i < 8; i++) {
      const on = full || i < cm;
      const hot = S.combo >= 6 && Math.floor(t * 10) % 2;
      ctx.fillStyle = on ? (hot ? "#ff6b2c" : "#ffcf3f") : "#3a2f4e";
      ctx.fillRect(30 + i * 9, by + 1, 7, 12);
      if (on) { ctx.fillStyle = "#fff2a8"; ctx.fillRect(30 + i * 9, by + 1, 7, 2); }
    }
    pix(ctx, HEART, 104, by + 2, cm >= 6 || full ? "#e8434f" : "#5a3a4e", "#0e0b16", 1);
    if (cm >= 6) pxText(ctx, "+1", 105, by + 10, { color: "#ffb0b8", outline: null });
    // floor plaque
    const label = isShadow ? (S.dream ? "DREAM" : `CELLAR ${Math.max(1, -floor)}`) : mon && mon.boss ? `BOSS ${floor}` : `FLOOR ${Math.max(1, floor)}`;
    const lw = Math.max(pxTextWidth(label) + 8, 30), lx = 124;
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(lx - 1, by - 3, lw + 2, 22);
    ctx.fillStyle = mon && mon.boss ? "#b8323a" : "#2a2238"; ctx.fillRect(lx, by - 2, lw, 20);
    ctx.fillStyle = mon && mon.boss ? "#ff6a5a" : "#4a3e60"; ctx.fillRect(lx, by - 2, lw, 1);
    pxText(ctx, label, lx + 4, by + 1, { color: "#f4efe2", outline: null });
    const steps = isShadow ? nFloors : ECON.floorsPerStage;
    for (let i = 0; i < steps; i++) {
      const f = isShadow ? -(i + 1) : S.startFloor + i;
      const cur = f === floor, done = isShadow ? i < -floor - 1 || (cur && mon && mon.dead) : f < floor || (cur && mon && mon.dead) || S.bossBeaten;
      const px = lx + 4 + i * 5;
      ctx.fillStyle = done ? "#ffcf3f" : cur ? "#f4efe2" : i === steps - 1 && !isShadow ? "#b8323a" : "#4a3e60";
      ctx.fillRect(px, by + 10, 3, 3);
    }
  }
  function drawBanner(ctx, t) {
    const b = banner, k = b.t / b.dur;
    const inK = Math.min(1, b.t / 0.18), outK = Math.max(0, (b.t - (b.dur - 0.2)) / 0.2);
    const off = (1 - ease.out(inK)) * -260 + ease.inQ(outK) * 260;
    const y = Math.round(stage.h * 0.36);
    const hh = b.sub ? 34 : 26;
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(Math.round(off), y - 2, 240, hh + 4);
    ctx.fillStyle = "#1d1530"; ctx.fillRect(Math.round(off), y, 240, hh);
    ctx.fillStyle = b.color; ctx.fillRect(Math.round(off), y, 240, 1); ctx.fillRect(Math.round(off), y + hh - 1, 240, 1);
    pxText(ctx, b.text, 120 + off, y + 5, { color: b.color, scale: 3, align: "center", shadow: "#0e0b16" });
    if (b.sub) pxText(ctx, b.sub, 120 + off * 1.2, y + 25, { color: "#f4efe2", align: "center" });
    void k;
  }
  stage.setScene(scene);

  // ---------- helpers ----------
  const ms2 = (ms) => untilQuit(stage.sleep(ms));
  let lastPlay = Date.now();
  const tickPlay = () => { const now = Date.now(); lives.addPlayTime(save, Math.min(60000, now - lastPlay)); lastPlay = now; };
  const refreshLives = () => { S.livesN = lives.livesState(save).n; };
  const heartFly = (from) => {
    const i = Math.min(8, S.livesN - 1), hp = HUD.heart(Math.max(0, i));
    fx.collect(from.x, from.y, hp.x, hp.y, { n: 5, color: "#e8434f", onArrive: () => { heartPulse[Math.max(0, i)] = 0.4; } });
  };

  async function climbTo(next) {
    setState("idle"); runState = "idle";
    if (next > floor) {
      camFollow = () => Math.min(floorY(floor) - footY(), cat.wy - footY() + 30);
      await goHome();
      const path = climbPath(floor);
      for (let i = 0; i < path.length; i++) {
        const p = path[i];
        await jumpWorld(p.x, p.y, i === path.length - 1 ? 0.3 : 0.21, i === path.length - 1 ? 26 : 16);
        if (S.quit) break;
      }
    } else {
      camFollow = () => cat.wy - footY();
      await jumpWorld((HATCH.x0 + HATCH.x1) / 2, floorY(floor) - 2, 0.26, 12);
      await fallWorld((HATCH.x0 + HATCH.x1) / 2, floorY(next), 0.42);
      cat.wy = floorY(next);
    }
    floor = next;
    camFollow = null;
    if (next < floor + 1) await goHome();
    cat.flip = false;
  }

  // phase 2 of a boss prefers a different mechanic than the one used most in phase 1
  const mechCount = {};
  function nextTask(avoid) {
    const t = session.next();
    if (!t || !avoid) return t;
    const requeued = session.requeue && session.requeue.some((r) => r.at <= session.i);
    let cur = t;
    for (let tries = 0; tries < 2; tries++) {
      if (cur.intro || requeued) return cur;
      const m = planTask({ ...cur }, profile, save.settings).mech;
      if (m !== avoid) return cur;
      // undo the pick and try again
      session.recent.pop(); session.i--;
      if (!save.srs[cur.key]) session.newCount[cur.kind === "vocab" ? "vocab" : "grammar"]--;
      const again = session.next();
      if (!again) return cur;
      cur = again;
    }
    return cur;
  }

  // ---------- one answer ----------
  async function playTask(task) {
    // bot helpers: the answer is always reachable on the task object
    if (task.answer === undefined) task.answer = task.kind === "vocab" ? task.word.en : task.q && (task.type === "build" ? task.q.full : task.q.answer);
    if (DBG) { DBG.task = task; DBG.mech = null; }
    if (task.intro) {
      setState("intro"); runState = "intro";
      await untilQuit(ui.introCard(task, { autoSay: !!(save.settings.voice || profile.noReading) }));
      if (S.quit) return null;
    }
    const plan = planTask(task, profile, save.settings);
    const prompt = plan.prompt || {};
    const pb = ui.prompt(prompt, { onSay: () => say(prompt.say) });
    if (prompt.autoSay && prompt.say) say(prompt.say);
    const cs = stage.cssScale || 1;
    const top = Math.max(34, Math.round(pb / cs) + 6), bot = footY() - 64;
    const ay = Math.max(top, bot - 250);
    const arena = { x: 6, y: ay, w: 228, h: Math.max(80, bot - ay) };
    const Mech = MECHANICS[plan.mech] || MECHANICS.signs;
    const difficulty = isShadow ? 0.15 : Math.min(1, (Math.max(1, floor) - 1) / 60 + (mon && mon.phase === 2 ? 0.15 : 0));
    const m = Mech.create({
      stage, fx, arena, task: plan.task || task, prompt, rng: Math.random, difficulty, sfx, speak: say,
      sprites: { getCat, ICONS, iconURL, drawSprite, pixelURL }, cat: catApi, hints: S.hints, revealCard: false, ground: footY(),
      target: mon ? { x: mon.wx, y: toScreenY(mon.wy) - monH() / 2 } : { x: 190, y: footY() - 20 },
    });
    mech = m;
    mechCount[plan.mech] = (mechCount[plan.mech] || 0) + 1;
    if (DBG) DBG.mech = { name: plan.mech, targets: () => (m.debug && m.debug.targets ? m.debug.targets() : []), answer: (g) => m.debug && m.debug.answer && m.debug.answer(g) };
    ui.setHints(S.hints.left, typeof m.hint === "function");
    ui.onHint = () => {
      if (S.hints.left <= 0 || runState !== "task") return;
      let ok = false; try { ok = m.hint(); } catch {}
      if (ok) { S.hints.left--; ui.setHints(S.hints.left, true); } else S_("wrong");
    };
    setState("task"); runState = "task";
    const res = await untilQuit(m.result);
    ui.setHints(0, false);
    if (S.quit || res === "quit") { m.destroy && m.destroy(); mech = null; ui.clearPrompt(); return null; }
    const tt = plan.task || task;
    S.answers++;
    record(save, tt, res.ok, res.ms, res.tag, { hinted: res.hinted, shadowMode: isShadow });
    tickPlay();
    if (res.ok) await onRight(tt, res);
    else await onWrong(tt, m);
    try { m.destroy && m.destroy(); } catch {}
    if (mech === m) mech = null;
    ui.clearPrompt();
    persist();
    return res;
  }

  async function onRight(task, res) {
    S.correct++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo);
    const quick = res.ms < 700 && task.type !== "match";
    let dmg = 1, crit = false;
    if (!quick && !res.hinted) {
      const critCh = 0.05 + tr(save, "sharp_claws") * 0.06 + (has("clover") ? 0.15 : 0);
      if (Math.random() < critCh) { crit = true; dmg = 2 + (has("fishbone") ? 1 : 0); }
      const cr = tr(save, "combo"); if (cr && S.combo >= Math.max(2, 5 - cr)) dmg += 1;
      if (has("fire_combo") && S.combo >= 3) dmg *= 2;
      if (has("lightning") && res.ms < 5000 && !["type", "spell", "build", "match"].includes(task.type)) dmg += 1;
      if (mon.firstHit !== false && tr(save, "pounce")) dmg *= tr(save, "pounce") + 1;
    }
    mon.firstHit = false;
    S.weeklyDmg += dmg;
    S.coins += ECON.coinPerCorrect; S.xp += ECON.xpPerCorrect;
    if (S.combo > 0 && S.combo % lives.COMBO_LIFE === 0) {
      lives.gainLife(save, "combo"); refreshLives();
      const c = { x: cat.wx, y: toScreenY(cat.wy) - 40 };
      fx.float(c.x, c.y - 8, "+1 LIFE", { color: "#ff8a9a", big: true });
      heartFly(c); S_("lifeGain");
    }
    // pounce! the cat leaps at the monster and swipes
    runState = "hit"; setState("idle");
    const ly = floorY(floor);
    await jumpWorld(mon.wx - monW() / 2 - 22, ly, 0.22, cat.wy < ly - 10 ? 4 : 18, { quiet: true });
    cat.flip = false; cat.anim = "attack"; cat.animT = 0;
    const p = monScreen(), hy = p.y - monH() / 2;
    stage.hitstop(crit ? 90 : 65); stage.shake(crit ? 4 : 2, crit ? 260 : 160);
    mon.flash = 0.14; mon.anim = "hurt"; mon.animT = 0; mon.sx = 0.75; mon.sy = 1.25; mon.lx = 6;
    mon.hp = Math.max(0, mon.hp - dmg);
    crit ? S_("crit") : S_("hit");
    fx.burst(p.x - 4, hy, { n: crit ? 26 : 14, colors: crit ? ["#ffcf3f", "#ffffff", "#ff6b2c"] : ["#ffffff", mon.colors[0], "#f4efe2"], speed: crit ? 110 : 80, gravity: 140, size: crit ? 2 : 1 });
    fx.ring(p.x - 4, hy, crit ? "#ffcf3f" : "#ffffff");
    // claw slash marks
    fx.burst(p.x - 2, hy, { n: 6, colors: ["#ffffff"], speed: 120, gravity: 0, life: 0.18, spread: 0.4, angle: Math.PI * 0.25 });
    fx.float(p.x, hy - 12, crit ? `-${dmg}!` : `-${dmg}`, { color: crit ? "#ffcf3f" : "#ffffff", big: crit });
    if (crit) { fx.flash("#ffffff", 70); fx.float(p.x, hy - 28, "CRIT", { color: "#ff6b2c" }); }
    if (S.combo === 3 || S.combo === 5 || S.combo >= 10 && S.combo % 5 === 0) { fx.float(cat.wx + 10, toScreenY(cat.wy) - 70, `COMBO x${S.combo}`, { color: "#ff9a3d", big: true, life: 1.1 }); S_("perk"); }
    await ms2(160);
    mon.lx = 0; mon.anim = "idle";
    // phase 2 for bosses
    if (mon.boss && mon.phase === 1 && mon.hp > 0 && mon.hp <= mon.max / 2) {
      mon.phase = 2; if (fight) fight.setPhase(2);
      showBanner("ANGRY!", "Faster now!", 1.2, "#ff5a4a"); stage.shake(4, 400); fx.flash("#ff3a3a", 120); S_("bossIntro");
      try { startMusic("boss"); } catch {}
    }
    await jumpWorld(CAT_X, ly, 0.3, 20, { quiet: true });
    cat.flip = false;
  }

  async function onWrong(task, m) {
    S.combo = 0; S.xp += ECON.xpPerTry;
    session.failed(task.key);
    S_("wrong");
    runState = "hit"; setState("idle");
    await goHome();
    // monster strikes back
    const reach = mon.wx - cat.wx - monW() / 2 - 26;
    await tween(0.16, (k) => { mon.lx = -reach * ease.inQ(k); mon.anim = "lunge"; });
    stage.hitstop(70); stage.shake(3, 220);
    cat.anim = "hurt"; cat.flash = 0.18; cat.sx = 0.8; cat.sy = 1.15;
    const c = { x: cat.wx, y: toScreenY(cat.wy) - 24 };
    fx.burst(c.x, c.y, { n: 12, colors: ["#e8434f", "#ffffff"], speed: 70 });
    // life rules
    let msg = null, lost = false;
    if (isShadow && S.dream) { S.dreamErrors++; msg = ["DREAM", "#bfb4ff"]; }
    else if (isShadow && S.cellarErrors < 2) { S.cellarErrors++; msg = ["FREE TRY", "#9ae86a"]; }
    else {
      if (isShadow) S.cellarErrors++;
      if (Math.random() < tr(save, "thick_fur") * 0.1) msg = ["THICK FUR!", "#7ec4ff"];
      else {
        const before = S.livesN;
        lives.loseLife(save); refreshLives(); lost = true;
        const hp = HUD.heart(Math.max(0, before - 1));
        heartPulse[Math.max(0, before - 1)] = 0.5;
        fx.burst(hp.x, hp.y, { n: 10, colors: ["#e8434f", "#ffb0b8"], speed: 50, gravity: 120 });
        S_("lifeLost"); S_("hurt");
        fx.float(c.x, c.y - 8, "-1", { color: "#e8434f", big: true });
        if (isShadow && S.livesN <= 0) S.dream = true;
      }
    }
    if (msg) fx.float(c.x, c.y - 8, msg[0], { color: msg[1] });
    await tween(0.22, (k) => { mon.lx = -reach * (1 - ease.out(k)); }, () => { mon.anim = "idle"; mon.lx = 0; });
    if (cat.anim === "hurt") cat.anim = "idle";
    void lost;
    // reveal: our card ([data-act=next]); the mechanic highlights the right answer in-world
    setState("reveal"); runState = "reveal";
    try { const r = m.reveal && m.reveal(); if (r && r.catch) r.catch(() => {}); } catch {}
    if (task.kind === "vocab" && (save.settings.voice || profile.noReading)) say(task.word.en);
    ui.clearPrompt();
    await untilQuit(ui.revealCard(task));
  }

  async function killMonster() {
    S.kills++;
    const boss = mon.boss;
    const gain = boss ? ECON.coinPerBoss : isShadow ? ECON.coinShadowClear : ECON.coinPerKill;
    S.coins += gain; if (boss) S.xp += ECON.xpPerBoss;
    mon.dead = true; mon.anim = "die"; mon.animT = 0;
    if (fight) { fight.clear(); fight.destroy(); fight = null; }
    const p = monScreen(), hy = p.y - monH() / 2;
    stage.hitstop(boss ? 140 : 80); stage.shake(boss ? 6 : 3, boss ? 500 : 250);
    fx.flash("#ffffff", boss ? 160 : 80);
    fx.burst(p.x, hy, { n: boss ? 60 : 30, colors: [...mon.colors, "#ffffff", "#0e0b16"], speed: boss ? 140 : 100, gravity: 160, size: 2 });
    fx.ring(p.x, hy, "#ffcf3f", { r: 4, vr: 140 });
    S_(boss ? "win" : "coin");
    const f = HUD.fish();
    fx.collect(p.x, hy, f.x, f.y, { n: Math.min(10, 3 + gain / 2), color: "#7ec4ff", onArrive: () => { fishPulse = 0.25; S_("coin"); } });
    fx.float(p.x, hy - 14, `+${gain}`, { color: "#7ec4ff", big: true });
    await tween(0.5, (k) => { mon.alpha = 1 - k; mon.sy = 1 - k * 0.6; mon.sx = 1 + k * 0.4; });
    await ms2(boss ? 500 : 200);
  }

  async function choosePerk() {
    setState("perk"); runState = "perk";
    const owned = new Set(S.perks);
    const pool = PERKS.filter((p) => p.instant || !owned.has(p.id));
    const choice = [];
    while (choice.length < 3 && pool.length) {
      const tot = pool.reduce((a, p) => a + p.w, 0); let r = Math.random() * tot;
      const i = pool.findIndex((p) => (r -= p.w) <= 0); choice.push(pool.splice(i < 0 ? 0 : i, 1)[0]);
    }
    const p = await untilQuit(ui.perkCards(choice));
    if (S.quit || !p || p === "quit") return;
    S_("perk");
    const c = { x: cat.wx, y: toScreenY(cat.wy) - 40 };
    if (p.id === "catnip") { lives.gainLife(save, "catnip"); refreshLives(); heartFly(c); fx.float(c.x, c.y, "+1 LIFE", { color: "#ff8a9a" }); }
    else if (p.id === "bubble") { S.shields++; fx.float(c.x, c.y, "+1 SHIELD", { color: "#7ec4ff" }); }
    else if (p.id === "big_heart") { lives.gainLife(save, "perk"); refreshLives(); S.shields++; heartFly(c); fx.float(c.x, c.y, "+1 LIFE", { color: "#ff8a9a" }); }
    else S.perks.push(p.id);
    fx.burst(c.x, c.y, { n: 16, colors: ["#ffcf3f", "#ffffff"], speed: 60, gravity: 40 });
    cat.anim = "dance"; cat.animT = 0;
    await ms2(500);
    cat.anim = "idle";
  }

  // ---------- main loop ----------
  try { startMusic(isShadow ? "shadow" : "tower"); } catch {}
  await ms2(250);
  let prevBiome = null;
  outer: for (let i = 0; i < nFloors; i++) {
    const next = isShadow ? -(i + 1) : S.startFloor + i;
    await climbTo(next);
    if (S.quit) break;
    const b = isShadow ? SHADOW_BIOME : biomeForFloor(floor);
    const isBossFloor = !isShadow && floor % ECON.floorsPerStage === 0;
    if (isShadow) showBanner(`CELLAR ${i + 1}`, i === 0 ? "Beat the shadows!" : "", 1.1, "#bfb4ff");
    else showBanner(isBossFloor ? "BOSS FLOOR" : `FLOOR ${floor}`, prevBiome !== b.id ? b.label.toUpperCase() : "", 1.1, isBossFloor ? "#ff6a5a" : "#ffcf3f");
    prevBiome = b.id;
    await spawn(floor);
    if (isBossFloor) {
      setState("bossIntro"); runState = "bossIntro";
      try { startMusic("boss"); } catch {}
      await untilQuit(bossIntro({ ui, stage, fx, monster: mon.m, sfx }));
      if (S.quit) break;
      startFight();
    } else await ms2(250);
    while (mon.hp > 0) {
      if (S.quit) break outer;
      const avoid = mon.boss && mon.phase === 2 ? Object.entries(mechCount).sort((a, b2) => b2[1] - a[1])[0]?.[0] : null;
      const task = nextTask(avoid);
      if (!task) break outer;
      const res = await playTask(task);
      if (S.quit || !res) break outer;
      if (!isShadow && S.livesN <= 0) { S.asleep = true; break outer; }
      if (isShadow && S.dream && S.dreamErrors >= 3) break outer;
    }
    if (mon.hp <= 0) {
      await killMonster();
      if (mon.boss) S.bossBeaten = true;
      if (!isShadow && !mon.boss && (i === 1 || i === 3)) { await choosePerk(); if (S.quit) break; }
    }
  }

  // ---------- ending ----------
  runState = "idle"; setState("idle");
  if (fight) { fight.destroy(); fight = null; }
  if (mech) { try { mech.destroy(); } catch {} mech = null; }
  ui.clearPrompt(); ui.hideTop(true);
  try { stopMusic(); } catch {}
  if (!S.quit) {
    if (S.bossBeaten) {
      cat.anim = "dance"; cat.animT = 0; S_("win");
      showBanner("STAGE CLEAR!", "", 1.8, "#ffcf3f");
      for (let k = 0; k < 4; k++) { fx.burst(30 + Math.random() * 180, 60 + Math.random() * 80, { n: 18, colors: ["#ffcf3f", "#e8434f", "#7ec4ff", "#93e04c", "#ffffff"], speed: 90, gravity: 90, size: 2 }); await stage.sleep(260); }
      await stage.sleep(700);
    } else if (S.asleep) {
      cat.anim = "sleep"; S_("snore");
      await stage.sleep(600);
      setState("reveal");
      await ui.messageCard({ title: "Zzz...", sub: "No lives left. Come back later!", btn: "OK" });
      setState("idle");
    } else if (isShadow) {
      const won = !(S.dream && S.dreamErrors >= 3);
      cat.anim = won ? "dance" : "sleep";
      showBanner(won ? "CELLAR CLEAN!" : "WAKE UP!", "", 1.4, "#bfb4ff");
      await stage.sleep(1400);
    }
  }
  const mult = lives.rewardMult(save, mode);
  const stats = {
    mode, startFloor: S.startFloor, floorReached: floor, bossBeaten: S.bossBeaten, quit: S.quit, asleep: S.asleep,
    answers: S.answers, correct: S.correct, bestCombo: S.bestCombo, kills: S.kills,
    coins: Math.round(S.coins * mult), xp: Math.round(S.xp * mult), weeklyDmg: S.weeklyDmg, ms: Date.now() - startedAt, perks: [...S.perks],
    rewardMult: mult, dream: isShadow && S.dream,
  };
  persist();
  if (DBG) { DBG.runState = "idle"; DBG.task = null; DBG.mech = null; }
  ui.destroy();
  stage.destroy();
  screen.remove();
  return stats;
}
