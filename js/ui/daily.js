// DAILY: 3 wyzwania dnia (js/daily.js agenta G: ensureDaily/claimDaily) + seria dni i zamrożenia.
// Odbiór nagrody = soczysta animacja: stempel, rybki lecą do licznika, konfetti, skrzynia.
import { h, esc, app, ico, iconSrc, chestSrc, pxButton, panel, stamp, sticker, pageHead, refreshFish, toast, onAct, countUp, liveCat, replay, fmtTime, CHEST_EN } from "./components.js";
import { go } from "./router.js";
import { persist } from "../state.js";
import { streakAlive } from "../meta.js";
import { sfx } from "../audio.js";
import { ECON } from "../../data/progression.js";

// ---- moduł G (może jeszcze nie istnieć) ----
let dailyMod = null, dailyP = null;
export function loadDaily() {
  if (!dailyP) dailyP = import("../daily.js").then((m) => (dailyMod = m)).catch(() => (dailyMod = null));
  return dailyP;
}
loadDaily();
export const dailyReady = () => !!(dailyMod && dailyMod.ensureDaily);

export function dailyList(save, profile) {
  if (dailyReady()) { try { dailyMod.ensureDaily(save, profile); } catch (e) { console.warn("daily", e); } }
  const L = (save.challenges && save.challenges.list) || [];
  return L.map((c) => ({ ...c, n: Math.min(c.n || 0, c.goal || 1), done: !!c.done || (c.n || 0) >= (c.goal || 1) }));
}
export function dailySummary(save, profile) {
  const L = dailyList(save, profile);
  return { total: L.length, done: L.filter((c) => c.done).length, claimable: L.filter((c) => c.done && !c.claimed).length };
}
// ikonka wyzwania wg tekstu (bez emoji)
function chIcon(c) {
  const t = `${c.id} ${c.text}`.toLowerCase();
  if (/boss/.test(t)) return "skull";
  if (/combo|row/.test(t)) return "flame";
  if (/shadow|cellar/.test(t)) return "door";
  if (/type|spell|write/.test(t)) return "cards";
  if (/life|heart/.test(t)) return "heart";
  if (/floor|climb/.test(t)) return "trophy";
  if (/fish/.test(t)) return "fish";
  return "star";
}
const midnightIn = () => { const d = new Date(); const m = new Date(d); m.setHours(24, 0, 0, 0); return m - d; };

export const dailyScreen = {
  async mount(root) {
    const save = app.save, profile = app.profile;
    if (!save) { go("login"); return; }
    await loadDaily();
    const el = h(`<div class="screen page daily">${pageHead("Daily", save)}
      <div class="dl-streak"></div>
      <div class="section-title">Today <small class="dl-reset"></small></div>
      <div class="dl-list"></div>
      <div class="dl-bottom"></div>
    </div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);

    const renderStreak = () => {
      const st = streakAlive(save), s = save.streak;
      const count = st.alive ? st.count : 0;
      const filled = count && count % 7 === 0 ? 7 : count % 7, toChest = 7 - filled;
      const pips = Array.from({ length: 7 }, (_, i) => `<i class="${i < filled ? "on" : ""} ${i === 6 ? "chest" : ""}">${i === 6 ? `<img class="px-img" src="${chestSrc("silver", 1)}" alt="">` : ""}</i>`).join("");
      $(".dl-streak").innerHTML = panel(`
        <div class="dl-flame ${st.alive ? "" : "dead"}">${ico("flame", { scale: 5 })}<b>${count}</b></div>
        <div class="dl-sinfo">
          <b class="px">${count === 1 ? "1 day" : `${count} days`} in a row</b>
          <span class="lex">${st.playedToday ? "You played today. Great!" : count ? "Play today to keep it!" : "Play today to start!"}</span>
          <div class="dl-pips">${pips}</div>
          <small class="lex">${toChest === 0 ? "Silver chest! Well done!" : `${toChest} more ${toChest === 1 ? "day" : "days"}: silver chest`}</small>
        </div>
        <div class="dl-freeze" title="Streak freeze">${Array.from({ length: ECON.freezeMax }, (_, i) => `<img class="px-ico ${i < s.freezes ? "" : "off"}" src="${iconSrc("snow", 3)}" alt="">`).join("")}<small>freeze ${s.freezes}/${ECON.freezeMax}</small></div>
      `, { cls: "dl-streak-card", tilt: -0.8 });
    };

    const renderList = (flashId) => {
      $(".dl-reset").textContent = `new in ${fmtTime(midnightIn()).replace(/:\d\d$/, "")}`;
      const L = dailyList(save, profile);
      const box = $(".dl-list");
      if (!dailyReady() && !L.length) {
        box.innerHTML = panel(`<p class="lex" style="margin:0">New quests are coming soon!</p>`, { cls: "dl-card", tilt: 0.6 });
        return;
      }
      box.innerHTML = L.map((c, i) => {
        const pct = Math.round((c.n / (c.goal || 1)) * 100);
        const rw = c.reward || {};
        return panel(`
          <div class="dl-ico">${ico(chIcon(c), { scale: 3 })}</div>
          <div class="dl-main">
            <p class="dl-text lex">${esc(c.text || "")}</p>
            <div class="dl-bar ${c.done ? "full" : ""}"><i style="width:${pct}%"></i><span>${c.n}/${c.goal}</span></div>
          </div>
          <div class="dl-side">
            <div class="dl-reward">${rw.fish ? `${ico("fish", { scale: 2 })}<b>${rw.fish}</b>` : ""}${rw.chest ? `<img class="px-img dl-chest" src="${chestSrc(rw.chest, 2)}" alt="${esc(CHEST_EN[rw.chest] || "chest")}">` : ""}</div>
            ${c.claimed ? `<div class="dl-stamp">${stamp("Done", { color: "ok", cls: flashId === c.id ? "slam" : "" })}</div>`
              : c.done ? pxButton("Claim!", { act: "claim", variant: "gold", cls: "px-btn--sm dl-claim", attrs: `data-id="${esc(c.id)}"` })
              : `<span class="dl-left lex">${c.goal - c.n} to go</span>`}
          </div>`, { cls: `dl-card ${c.claimed ? "claimed" : c.done ? "ready" : ""}`, tape: i === 1, tilt: [-0.7, 0.5, -0.3][i % 3] });
      }).join("");
      const all = L.length && L.every((c) => c.claimed);
      $(".dl-bottom").innerHTML = all ? `<div class="dl-all">${sticker(`<span class="sticker-label sticker-label--green">All done! See you tomorrow</span>`, { tilt: -2 })}<div class="dl-cat"></div></div>`
        : save.chests.length ? `<div class="res-actions">${pxButton(`Open chest (${save.chests.length})`, { act: "open-chest", variant: "gold" })}</div>` : "";
      if (all) { const c = liveCat({ skin: save.equipped.skin, hat: save.equipped.hat, anim: "dance", scale: 3 }); $(".dl-cat").append(c.el); }
      if (all && save.chests.length) $(".dl-bottom").insertAdjacentHTML("beforeend", `<div class="res-actions">${pxButton(`Open chest (${save.chests.length})`, { act: "open-chest", variant: "gold" })}</div>`);
    };

    // ---- animacja odbioru ----
    const fly = (fromEl, toEl, src, n, delay = 55) => {
      const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
      for (let i = 0; i < n; i++) {
        const img = h(`<img class="px-ico dl-fly" src="${src}" alt="">`);
        document.body.append(img);
        const sx = a.left + a.width / 2 + (Math.random() - 0.5) * 40, sy = a.top + a.height / 2 + (Math.random() - 0.5) * 20;
        const mx = sx + (Math.random() - 0.5) * 120, my = sy - 60 - Math.random() * 80;
        const ex = b.left + b.width / 2 - 12, ey = b.top + b.height / 2 - 12;
        img.style.left = "0px"; img.style.top = "0px";
        const anim = img.animate([
          { transform: `translate(${sx - 12}px,${sy - 12}px) scale(.6)`, opacity: 0 },
          { transform: `translate(${mx - 12}px,${my - 12}px) scale(1.3)`, opacity: 1, offset: 0.35 },
          { transform: `translate(${ex}px,${ey}px) scale(.8)`, opacity: 1 },
        ], { duration: 620 + Math.random() * 160, delay: i * delay, easing: "cubic-bezier(.5,0,.6,1)", fill: "both" });
        anim.onfinish = () => { img.remove(); sfx.coin(); const chip = toEl.closest(".chip") || toEl; replay(chip, "bump"); };
      }
    };
    const confetti = (fromEl) => {
      const a = fromEl.getBoundingClientRect();
      const cols = ["#ffd23f", "#ff8fa3", "#6fe3d3", "#93e04c", "#f4efe2", "#ffa04d"];
      for (let i = 0; i < 26; i++) {
        const d = h(`<i class="dl-conf" style="background:${cols[i % cols.length]}"></i>`);
        document.body.append(d);
        const ang = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 110;
        const x = a.left + a.width / 2, y = a.top + a.height / 2;
        d.animate([
          { transform: `translate(${x}px,${y}px) rotate(0)`, opacity: 1 },
          { transform: `translate(${x + Math.cos(ang) * sp}px,${y + Math.sin(ang) * sp - 40}px) rotate(${Math.random() * 360}deg)`, opacity: 1, offset: 0.55 },
          { transform: `translate(${x + Math.cos(ang) * sp * 1.2}px,${y + Math.sin(ang) * sp + 70}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
        ], { duration: 900 + Math.random() * 400, easing: "steps(12)", fill: "both" }).onfinish = () => d.remove();
      }
    };
    const claim = async (b) => {
      if (!dailyReady() || b.disabled) return;
      b.disabled = true;
      const id = b.dataset.id;
      const coins0 = save.coins, chests0 = save.chests.length;
      let r = null;
      try { r = dailyMod.claimDaily(save, id); } catch (e) { console.warn("claimDaily", e); }
      if (!r) { b.disabled = false; sfx.wrong(); return; }
      // claimDaily może sam dodać nagrodę — jeśli nie, dodajemy tutaj (kontrakt nie precyzuje)
      if (r.fish && save.coins === coins0) save.coins += r.fish;
      if (r.chest && save.chests.length === chests0) save.chests.push(r.chest);
      persist(true);
      const card = b.closest(".dl-card");
      confetti(b); sfx.stamp ? sfx.stamp() : sfx.tap();
      const fishEl = el.querySelector(".page-head [data-fish]");
      if (r.fish && fishEl) {
        fly(b, fishEl, iconSrc("fish", 3), Math.min(10, Math.max(3, Math.round(r.fish / 10))));
        fishEl.textContent = coins0;
        setTimeout(() => countUp(fishEl, coins0, save.coins, 700), 450);
      } else refreshFish(el, save);
      if (r.chest) { setTimeout(() => { sfx.chest(); toast(`${CHEST_EN[r.chest] || "Chest"}!`, { icon: "star" }); }, 500); }
      replay(card, "dl-win");
      setTimeout(() => { if (el.isConnected) { renderList(id); if (dailyList(save, profile).every((c) => c.claimed)) { sfx.win(); confetti($(".dl-bottom") || b); } } }, 380);
    };

    renderStreak();
    renderList();
    const timer = setInterval(() => { if (el.isConnected) $(".dl-reset").textContent = `new in ${fmtTime(midnightIn()).replace(/:\d\d$/, "")}`; }, 30000);
    const off = onAct(el, {
      back: () => { sfx.tap(); go("home"); },
      claim,
      "open-chest": () => { sfx.tap(); go("chest", { from: "daily" }); },
    });
    return () => { off(); clearInterval(timer); };
  },
};
