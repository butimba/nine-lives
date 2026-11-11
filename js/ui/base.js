// MOON BASE: domek kota na Księżycu. 6 miejsc (sufit, ściana ×2, podłoga ×3); tap miejsce → wybierz / kup mebel.
import { h, esc, app, ico, picSrc, pageHead, refreshFish, toast, onAct, liveCat } from "./components.js";
import { go } from "./router.js";
import { persist } from "../state.js";
import { sfx } from "../audio.js";
import { SLOTS, FURNITURE } from "../../data/base.js";
import { baseUnlocked, buyFurniture, placeFurniture, BASE_PAGE } from "../meta.js";

const RAR_COL = { common: "#9aa5b8", rare: "#3d9bff", epic: "#8a55d6", legendary: "#ffb020" };

export const baseScreen = {
  mount(root) {
    const save = app.save;
    if (!baseUnlocked(save)) { toast(`Moon Base opens on Moon Diary page ${BASE_PAGE}!`); go("home"); return; }
    let sel = null;
    const el = h(`<div class="screen page base">${pageHead("Moon Base", save)}
      <div class="base-room"><div class="base-window"></div><div class="base-cat"></div><div class="base-slots"></div></div>
      <p class="muted base-hint">Tap a <b>+</b> to make your room!</p>
      <div class="base-pick"></div></div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);
    const cat = liveCat({ skin: save.equipped.skin, hat: save.equipped.hat, scale: 3 });
    $(".base-cat").append(cat.el);
    const byId = (id) => FURNITURE.find((f) => f.id === id);

    const render = () => {
      $(".base-slots").innerHTML = SLOTS.map((s) => {
        const f = byId(save.base.placed[s.id]);
        return `<button class="base-slot base-slot--${s.kind} ${sel === s.id ? "on" : ""} ${f ? "full" : ""}" data-act="slot" data-s="${s.id}" style="left:${s.x}%;top:${s.y}%" aria-label="${f ? esc(f.name) : "Empty place"}">
          ${f ? `<img class="px-img" src="${picSrc(f.emoji, 3)}" alt="">` : "<b>+</b>"}</button>`;
      }).join("");
      const slot = SLOTS.find((s) => s.id === sel);
      if (!slot) { $(".base-pick").innerHTML = ""; return; }
      const items = FURNITURE.filter((f) => f.slot === slot.kind);
      const own = (f) => save.base.owned.includes(f.id);
      $(".base-pick").innerHTML = `<div class="base-grid">
        ${save.base.placed[sel] ? `<button class="base-item" data-act="put" data-id=""><span class="base-x">✕</span><small>empty</small></button>` : ""}
        ${items.map((f) => `<button class="base-item ${own(f) ? "own" : f.source === "ship" ? "lock" : ""}" data-act="put" data-id="${f.id}" style="--rc:${RAR_COL[f.rarity]}">
          <img class="px-img" src="${picSrc(f.emoji, 3)}" alt=""><small>${esc(f.name)}</small>
          ${own(f) ? "" : f.source === "ship" ? `<em>sky ship</em>` : `<em>${ico("fish", { scale: 2 })}${f.price}</em>`}</button>`).join("")}</div>`;
    };
    render();

    return onAct(el, {
      back: () => { sfx.tap(); go("home"); },
      slot: (b) => { sfx.tap(); sel = sel === b.dataset.s ? null : b.dataset.s; render(); },
      put: (b) => {
        const id = b.dataset.id, f = byId(id);
        if (f && !save.base.owned.includes(id)) {
          if (f.source === "ship") { sfx.tap(); toast("A gift from the King's sky ship!", { icon: "star" }); return; }
          if (!buyFurniture(save, f)) { sfx.tap(); toast(`You need ${f.price} fish.`, { icon: "fish" }); return; }
          sfx.coin(); refreshFish(el, save);
        } else sfx.tap();
        placeFurniture(save, sel, id || null);
        persist(true);
        cat.play(id ? "jump" : "idle", 900);
        sel = null; render();
      },
    });
  },
};
