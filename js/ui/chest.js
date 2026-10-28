// RYTUAŁ OTWIERANIA SKRZYNI: 3 tapnięcia (coraz mocniej trzęsie, pęknięcia) → wybuch światła w kolorze
// rzadkości → hit-stop przy epic/legendary → przedmiot obraca się w spotlighcie + konfetti → NEW! → kot zakłada i tańczy.
// Duplikat / rybki → deszcz monet-rybek z licznikiem.
import { h, esc, app, ico, pxButton, panel, stamp, sticker, onAct, countUp, refreshFish, RARITY_EN, CHEST_EN, replay } from "./components.js";
import { go } from "./router.js";
import { persist } from "../state.js";
import { openChest, isGift, giftItem } from "../meta.js";
import { sfx, startMusic } from "../audio.js";
import { RARITY_COLOR } from "../pixel/palette.js";
import { chestSprite } from "../pixel/chests.js";
import { getCat } from "../pixel/cat.js";
import { createStage } from "../game/stage.js";
import { createFx, pxText } from "../game/juice.js";

const W = 240;
const RAR_RANK = { common: 0, rare: 1, epic: 2, legendary: 3 };

export const chestScreen = {
  mount(root, params = {}) {
    const save = app.save;
    if (!save || !save.chests.length) { go(params.from || "home"); return; }
    startMusic("chest");
    const type = save.chests[0];
    const gift = isGift(type);
    const sprType = gift ? "epic" : type;
    const el = h(`<div class="screen chest-screen ${gift ? "is-gift" : ""}">
      <div class="chest-top"><button class="px-btn px-btn--paper back-btn" data-act="back" aria-label="Back"><i class="px-arrow"></i></button>
        <span class="chest-left">${gift ? "Gift" : esc(CHEST_EN[type] || "Chest")} · ${save.chests.length} left</span>
        <div class="chip chip--fish">${ico("fish")}<b data-fish>${save.coins}</b></div></div>
      ${gift ? `<div class="gift-banner">${sticker(`<span class="sticker-label sticker-label--red">A gift from your teacher!</span>`, { tilt: -3 })}<span class="hand gift-note">for you!</span></div>` : ""}
      <div class="chest-stage"><button class="tap-chest-hot" data-act="tap-chest" aria-label="Tap the chest"></button></div>
      <div class="chest-ui"><div class="chest-hint">Tap! Tap! Tap!</div><div class="tap-dots"><i></i><i></i><i></i></div></div>
    </div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);
    const stage = createStage($(".chest-stage"), { lw: W, minH: 240, maxH: 360 });
    const fx = createFx();
    let chest = null; try { chest = chestSprite(sprType); } catch {}
    const S = { taps: 0, shake: 0, open: false, openT: 0, res: null, color: "#f4efe2", item: null, spinT: 0, danceAt: 0, rank: 0 };
    const cx = () => W / 2, cy = () => Math.round(stage.h * 0.62) - 2;

    stage.setScene({
      update(dt, t) {
        fx.update(dt);
        S.shake = Math.max(0, S.shake - dt * 6);
        if (gift && !S.open && Math.random() < 0.12) fx.burst(cx() + (Math.random() - 0.5) * 90, cy() - 20 - Math.random() * 50, { n: 1, colors: ["#fff1a8", "#ffd23f", "#ff8fa3"], speed: 8, gravity: -14, life: 1.1, size: 1 });
      if (S.open) { S.openT += dt; S.spinT += dt; if (S.openT < 2.2 && Math.random() < 0.35 + S.rank * 0.15) fx.burst(cx() + (Math.random() - 0.5) * 120, -4, { n: 2, colors: confetti(S.color), speed: 20, gravity: 60, life: 2.4, size: 2 }); }
      },
      draw(ctx, t) {
        const H = stage.h;
        // tło: ciemna scena + szachownica
        ctx.fillStyle = "#151027"; ctx.fillRect(0, 0, W, H);
        // podłoga
        ctx.fillStyle = "#1d1734"; ctx.fillRect(cx() - 70, cy() + 1, 140, 10); ctx.fillRect(cx() - 56, cy() + 11, 112, 4);
        // spotlight
        ctx.globalAlpha = S.open ? 0.32 : 0.16;
        ctx.fillStyle = S.open ? S.color : "#fff1a8";
        ctx.beginPath(); ctx.moveTo(cx() - 14, 0); ctx.lineTo(cx() + 14, 0); ctx.lineTo(cx() + 54, cy() + 6); ctx.lineTo(cx() - 54, cy() + 6); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = "rgba(8,5,18,.55)"; ctx.fillRect(cx() - 34, cy() + 1, 68, 4); ctx.fillRect(cx() - 28, cy() + 5, 56, 2);
        if (S.open) {
          // promienie w kolorze rzadkości
          const n = 12, rot = t * (0.5 + S.rank * 0.25), R = 260, yy = cy() - 30;
          ctx.globalAlpha = Math.min(0.5, S.openT * 2) * (0.6 + S.rank * 0.12);
          ctx.fillStyle = S.color;
          for (let i = 0; i < n; i++) {
            const a = rot + (i / n) * Math.PI * 2, a2 = a + 0.13;
            ctx.beginPath(); ctx.moveTo(cx(), yy); ctx.lineTo(cx() + Math.cos(a) * R, yy + Math.sin(a) * R); ctx.lineTo(cx() + Math.cos(a2) * R, yy + Math.sin(a2) * R); ctx.fill();
          }
          ctx.globalAlpha = 1;
          // otwarta skrzynia
          if (chest) try { chest.draw(ctx, cx(), cy(), { open: true, cracks: 3, scale: 3 }); } catch {}
          // przedmiot
          const rise = Math.min(1, S.openT / 0.6);
          const iy = Math.round(cy() - 40 - rise * 30 + Math.sin(t * 2.5) * 2);
          if (S.item) {
            const spinning = S.spinT < 1.5;
            const k = spinning ? Math.cos(S.spinT * 9) : 1;
            const dance = !spinning && S.danceAt;
            ctx.save(); ctx.translate(cx(), iy); ctx.scale(Math.max(0.08, Math.abs(Math.round(k * 6) / 6)) * 3 * (k < 0 ? -1 : 1), 3);
            try { S.item.draw(ctx, 0, 0, { anim: dance ? "dance" : "idle", t: dance ? t : 0, scale: 1 }); } catch {}
            ctx.restore();
          } else if (S.res) {
            // ryba-moneta
            drawFishCoin(ctx, cx(), iy - 10, t);
          }
        } else {
          const sh = S.shake * (2 + S.taps * 1.5);
          const ox = Math.round(Math.sin(t * 60) * sh), oy = S.taps === 0 ? Math.round(Math.sin(t * 3) * 1.5) : Math.round(-Math.abs(Math.sin(t * 40)) * sh * 0.5);
          // wskazówka: pulsujący pierścień
          if (chest) try { chest.draw(ctx, cx() + ox, cy() + oy, { cracks: S.taps, open: false, shake: 0, scale: 3 }); } catch {}
          if (gift && chest) drawRibbon(ctx, cx() + ox, cy() + oy, chest, t);
          // świecenie z pęknięć
          if (S.taps) {
            ctx.globalCompositeOperation = "lighter"; ctx.globalAlpha = 0.1 * S.taps + 0.05 * Math.sin(t * 12);
            ctx.fillStyle = "#fff1a8"; ctx.fillRect(cx() - 36, cy() - 56, 72, 56); ctx.globalCompositeOperation = "source-over"; ctx.globalAlpha = 1;
          }
        }
        fx.draw(ctx);
      },
    });

    const tapDots = () => el.querySelectorAll(".tap-dots i").forEach((d, i) => d.classList.toggle("on", i < S.taps));

    const tap = () => {
      if (S.open || S.busy) return;
      S.taps++; S.shake = 1;
      tapDots();
      sfx.crack();
      stage.shake(1 + S.taps, 160 + S.taps * 60);
      fx.burst(cx() + (Math.random() - 0.5) * 30, cy() - 30, { n: 6 + S.taps * 6, colors: ["#fff1a8", "#ffd23f", "#f4efe2"], speed: 50 + S.taps * 25, life: 0.5 });
      if (S.taps >= 3) { S.busy = true; setTimeout(burst, 280); }
    };

    const burst = () => {
      save.chests.shift();
      const res = openChest(save, type);
      S.res = res;
      const rarity = res.kind === "chest" ? "epic" : res.kind === "coins" ? (res.had && res.had.rarity) || res.dup || "common" : res.item.rarity || "common";
      S.rank = RAR_RANK[rarity] || 0;
      if (res.gift) S.rank = Math.max(2, S.rank); // prezent = pełna dopamina
      S.color = RARITY_COLOR[rarity] || "#f4efe2";
      let isNew = false;
      if (res.kind === "skin") { save.equipped.skin = res.item.id; isNew = true; }
      if (res.kind === "hat") { save.equipped.hat = res.item.id; isNew = true; }
      persist(true);
      if (res.kind !== "coins") { try { S.item = getCat(save.equipped.skin, save.equipped.hat); } catch {} }
      // wybuch
      if (S.rank >= 2) { stage.hitstop(S.rank === 3 ? 140 : 90); const f = h(`<div class="flash"></div>`); document.body.append(f); setTimeout(() => f.remove(), 400); }
      stage.shake(3 + S.rank * 2, 300 + S.rank * 120);
      sfx.burst();
      fx.ring(cx(), cy() - 24, S.color, { r: 4, vr: 220, life: 0.5 });
      fx.burst(cx(), cy() - 24, { n: 50 + S.rank * 30, colors: confetti(S.color), speed: 130 + S.rank * 30, gravity: 90, life: 1.2, size: 2 });
      S.open = true; S.openT = 0; S.spinT = 0;
      const ui = $(".chest-ui");
      const left = save.chests.length;
      const contBtn = pxButton(left ? `Next chest (${left})` : "OK!", { act: "continue", big: true, variant: "ok" });
      if (res.kind === "chest") {
        sfx.chest();
        S.giftChest = res.chest;
        ui.innerHTML = `<div style="position:relative">${panel(`<span class="rar-tag">${sticker(`<span class="sticker-label sticker-label--red">from your teacher</span>`, { tilt: -4 })}</span>
            <h2>${esc(CHEST_EN[res.chest] || "Chest")}!</h2><div class="kind">open it next</div>`, { cls: "loot-card", tilt: -1 })}</div>
          <div class="res-actions">${pxButton("Open it!", { act: "continue", big: true, variant: "gold" })}</div>`;
        setTimeout(() => { if (el.isConnected) sfx.level(); }, 400);
      } else if (res.kind === "coins") {
        sfx.coin();
        ui.innerHTML = `<div class="fish-rain">${ico("fish", { scale: 4 })}<span>+<b data-c>0</b></span></div>
          ${res.had ? `<div class="chest-left">You have ${esc(res.had.name)}! Fish for you.</div>` : res.dup ? `<div class="chest-left">You have all ${esc(RARITY_EN[res.dup])} items!</div>` : ""}<div class="res-actions">${contBtn}</div>`;
        // deszcz rybek
        let n = 0; const rain = setInterval(() => { if (!el.isConnected || ++n > 24) return clearInterval(rain); fx.burst(cx() + (Math.random() - 0.5) * 140, -2, { n: 3, colors: ["#ffd23f", "#ffa04d", "#fff1a8"], speed: 15, gravity: 160, life: 1.6, size: 2 }); }, 70);
        countUp(ui.querySelector("[data-c]"), 0, res.amount, 1100, { tick: (v) => { if (v % 7 === 0) sfx.coin(); } }).then(() => refreshFish(el, save));
      } else {
        sfx.chest();
        const it = res.item;
        ui.innerHTML = `<div style="position:relative">${panel(`<span class="rar-tag">${sticker(`<span class="sticker-label" style="background:${S.color};color:${S.rank >= 1 ? "#fff" : "#0e0b16"}">${esc(RARITY_EN[it.rarity] || "")}</span>`, { tilt: -4 })}${res.gift ? sticker(`<span class="sticker-label sticker-label--red">gift</span>`, { tilt: 5 }) : ""}</span>
            <h2>${esc(it.name)}</h2><div class="kind">${res.kind === "skin" ? "new skin" : "new hat"} · wearing it now</div>
            ${res.gift ? `<div class="hand gift-thanks">from your teacher</div>` : ""}`, { cls: "loot-card", tilt: -1 })}
            ${isNew ? `<div class="new-stamp">${stamp("NEW!", { color: S.rank >= 2 ? "violet" : "danger", cls: "slam" })}</div>` : ""}</div>
          <div class="res-actions">${contBtn}</div>`;
        setTimeout(() => { if (el.isConnected) { S.danceAt = 1; sfx.stamp && sfx.stamp(); } }, 1500);
        setTimeout(() => { if (el.isConnected) sfx.level(); }, 400);
      }
      $(".tap-chest-hot").remove();
    };

    // tap również na całej scenie
    const offTap = stage.input.on("down", () => { tap(); return true; });
    const off = onAct(el, {
      "tap-chest": tap,
      continue: () => { sfx.tap(); if (save.chests.length) go("chest", params); else go(params.from || "home"); },
      back: () => { sfx.tap(); go(params.from || "home"); },
    });
    return () => { off(); offTap(); stage.destroy(); };
  },
};

// czerwona wstążka z kokardą na zamkniętej skrzyni-prezencie (logiczne px, skrzynia w skali 3)
function drawRibbon(ctx, x, y, chest, t) {
  const k = 3, w = chest.w * k, hh = chest.h * k, top = y - hh;
  const R = "#e8434f", D = "#a82848", L = "#ff8fa3", K = "#0e0b16";
  ctx.fillStyle = K; ctx.fillRect(x - 5, top + 2, 10, hh - 3);
  ctx.fillStyle = R; ctx.fillRect(x - 4, top + 3, 8, hh - 5);
  ctx.fillStyle = L; ctx.fillRect(x - 3, top + 3, 2, hh - 5);
  ctx.fillStyle = D; ctx.fillRect(x + 2, top + 3, 2, hh - 5);
  // kokarda (dwie pętle + węzeł), lekko podskakuje
  const by = top - 1 + Math.round(Math.sin(t * 4) * 1);
  const loop = (dx) => {
    ctx.fillStyle = K; ctx.fillRect(x + dx - 1, by - 8, 12, 11);
    ctx.fillStyle = R; ctx.fillRect(x + dx, by - 7, 10, 9);
    ctx.fillStyle = D; ctx.fillRect(x + dx + 3, by - 4, 4, 3);
    ctx.fillStyle = L; ctx.fillRect(x + dx + 1, by - 6, 3, 2);
  };
  loop(-15); loop(5);
  ctx.fillStyle = K; ctx.fillRect(x - 5, by - 6, 10, 10);
  ctx.fillStyle = R; ctx.fillRect(x - 4, by - 5, 8, 8);
  ctx.fillStyle = L; ctx.fillRect(x - 3, by - 4, 3, 2);
  // końcówki wstążki
  ctx.fillStyle = K; ctx.fillRect(x - 9, by + 3, 6, 9); ctx.fillRect(x + 3, by + 3, 6, 9);
  ctx.fillStyle = D; ctx.fillRect(x - 8, by + 4, 4, 7); ctx.fillRect(x + 4, by + 4, 4, 7);
  void w;
}
function confetti(c) { return [c, "#ffd23f", "#f4efe2", "#ff8fa3", "#6fe3d3", "#93e04c"]; }
function drawFishCoin(ctx, x, y, t) {
  const k = Math.abs(Math.cos(t * 4)); const w = Math.max(1, Math.round(9 * k));
  ctx.fillStyle = "#0e0b16"; ctx.fillRect(x - w - 1, y - 9, w * 2 + 2, 19);
  ctx.fillStyle = "#d9a22b"; ctx.fillRect(x - w, y - 8, w * 2, 17);
  ctx.fillStyle = "#ffd23f"; ctx.fillRect(x - w + 1, y - 7, Math.max(1, w * 2 - 3), 14);
  if (w > 4) { pxText(ctx, "F", x, y - 3, { color: "#9a6a12", align: "center", outline: null }); }
}
