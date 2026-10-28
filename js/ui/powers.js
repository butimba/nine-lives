// MOCE: wybór max 2 mocy (save.powers.equipped). Szybki wybór przed Climb ([data-act=power-pick]) + sekcja w Skills.
// Lista mocy: data/progression.js → POWERS (agent G). Gdy jej jeszcze nie ma, UI się chowa.
import { h, esc, ico, iconSrc, pxButton, panel, onAct, replay, toast } from "./components.js";
import * as PROG from "../../data/progression.js";
import { levelInfo, persist } from "../state.js";
import { sfx } from "../audio.js";

export const MAX_EQUIP = 2;
export const powersList = () => (Array.isArray(PROG.POWERS) ? PROG.POWERS : []);
export const hasPowers = () => powersList().length > 0;

function ps(save) {
  save.powers ??= { owned: [], equipped: [] };
  save.powers.owned ??= []; save.powers.equipped ??= [];
  return save.powers;
}
export function isUnlocked(save, p) {
  return ps(save).owned.includes(p.id) || levelInfo(save.xp).lvl >= (p.unlockLevel || 1);
}
export function equippedPowers(save) {
  const all = powersList();
  return ps(save).equipped.map((id) => all.find((p) => p.id === id)).filter((p) => p && isUnlocked(save, p));
}
export const powerIcon = (p, scale = 3) => iconSrc(p.icon || "power_" + p.id, scale);

export function toggleEquip(save, id) {
  const P = ps(save);
  const p = powersList().find((x) => x.id === id);
  if (!p || !isUnlocked(save, p)) return false;
  P.equipped = P.equipped.filter((x) => powersList().some((q) => q.id === x));
  if (P.equipped.includes(id)) P.equipped = P.equipped.filter((x) => x !== id);
  else { P.equipped.push(id); while (P.equipped.length > MAX_EQUIP) P.equipped.shift(); }
  persist();
  return true;
}

// dwa sloty (dom: mały przycisk obok Climb)
export function slotsHTML(save, { scale = 2 } = {}) {
  const eq = equippedPowers(save);
  return Array.from({ length: MAX_EQUIP }, (_, i) => eq[i]
    ? `<i class="pw-slot on"><img class="px-ico" src="${powerIcon(eq[i], scale)}" alt="${esc(eq[i].name)}"></i>`
    : `<i class="pw-slot"><b>+</b></i>`).join("");
}

// siatka kart mocy (Skills i arkusz wyboru)
export function gridHTML(save) {
  const lvl = levelInfo(save.xp).lvl;
  const eq = ps(save).equipped;
  return `<div class="pw-grid">${powersList().map((p, i) => {
    const un = isUnlocked(save, p), on = un && eq.includes(p.id);
    return `<button class="pw-card ${on ? "on" : ""} ${un ? "" : "locked"}" data-act="power-toggle" data-id="${esc(p.id)}" style="--tilt:${[-1.2, 0.8, -0.4, 1.1, -0.8][i % 5]}deg">
      <span class="pw-ico">${un ? `<img class="px-ico" src="${powerIcon(p, 3)}" alt="">` : `<img class="px-ico" src="${iconSrc("lock", 3)}" alt="">`}</span>
      <b>${esc(p.name)}</b>
      <small>${un ? esc(p.desc || "") : `Level ${p.unlockLevel}`}</small>
      ${un ? `<span class="pw-charge">${Array.from({ length: Math.min(8, p.charge || 4) }, () => "<i></i>").join("")}<em>${p.charge || "?"}</em></span>` : `<span class="pw-need">LV ${lvl}/${p.unlockLevel}</span>`}
    </button>`;
  }).join("")}</div>`;
}

// arkusz wyboru (modal); zwraca Promise po zamknięciu
export function powerPicker(save) {
  return new Promise((res) => {
    const m = h(`<div class="modal-back pw-back"><div class="modal pw-modal">${panel(`
      <h2 class="px modal-title">Pick 2 powers</h2>
      <p class="pw-help lex">Right answers fill the power. Tap it in the tower!</p>
      <div class="pw-slots-big"></div>
      <div class="pw-body"></div>
      <div class="modal-actions">${pxButton("OK!", { act: "power-done", variant: "ok" })}</div>`, { tilt: -0.6 })}</div></div>`);
    const render = () => {
      m.querySelector(".pw-body").innerHTML = gridHTML(save);
      m.querySelector(".pw-slots-big").innerHTML = slotsHTML(save, { scale: 3 });
    };
    render();
    const close = () => { m.classList.add("out"); setTimeout(() => m.remove(), 180); off(); res(); };
    const off = onAct(m, {
      "power-toggle": (b) => {
        const p = powersList().find((x) => x.id === b.dataset.id);
        if (!p) return;
        if (!isUnlocked(save, p)) { sfx.wrong(); replay(b, "nope"); toast(`Get level ${p.unlockLevel}!`, { icon: "lock" }); return; }
        toggleEquip(save, p.id); sfx.perk ? sfx.perk() : sfx.tap(); render();
        const nb = m.querySelector(`[data-id="${CSS.escape(p.id)}"]`); if (nb) replay(nb, "pop-in");
      },
      "power-done": () => { sfx.tap(); close(); },
    });
    m.addEventListener("click", (e) => { if (e.target === m) close(); });
    document.body.append(m);
  });
}

// sekcja w Skills (bez modala)
export function mountPowersSection(host, save) {
  if (!hasPowers()) { host.innerHTML = ""; return () => {}; }
  const render = () => {
    host.innerHTML = panel(`<div class="tree-head" style="--t:#8a55d6">${ico("star")}<span>Powers</span><span class="pw-head-slots">${slotsHTML(save, { scale: 2 })}</span></div>
      <div class="pw-wrap"><p class="pw-help lex">Pick 2. Right answers fill them in the tower.</p>${gridHTML(save)}</div>`, { cls: "tree pw-tree", tape: true, tilt: 0.4, style: "--t:#8a55d6" });
  };
  render();
  return onAct(host, {
    "power-toggle": (b) => {
      const p = powersList().find((x) => x.id === b.dataset.id);
      if (!p) return;
      if (!isUnlocked(save, p)) { sfx.wrong(); replay(b, "nope"); toast(`Get level ${p.unlockLevel}!`, { icon: "lock" }); return; }
      toggleEquip(save, p.id); sfx.perk ? sfx.perk() : sfx.tap(); render();
    },
  });
}
