// WARDROBE: skórki + czapki + sklep na jednym ekranie. Żywy podgląd kota (tańczy po założeniu).
import { h, esc, app, ico, catImg, pxButton, panel, pageHead, refreshFish, toast, modal, onAct, liveCat, sticker, RARITY_EN } from "./components.js";
import { go } from "./router.js";
import { persist } from "../state.js";
import { shopItems, buy } from "../meta.js";
import { sfx } from "../audio.js";
import { SKINS, HATS } from "../../data/cosmetics.js";
import { ECON } from "../../data/progression.js";
import EVENTS, { activeEvent } from "../../data/events.js";

const SOURCE_HINT = { start: "", shop: "shop", chest: "chest", weekly: "boss prize" };
const srcHint = (it) => (it.source || "").startsWith("event:") ? "event" : SOURCE_HINT[it.source] || "";

export const wardrobeScreen = {
  mount(root, params = {}) {
    const save = app.save;
    let tab = params.tab || "skins";
    let tryOn = null; // { kind, id, price, name } — przymierzanie w sklepie
    const ev = activeEvent(new Date(), EVENTS);
    const el = h(`<div class="screen page wardrobe">
      ${pageHead("Wardrobe", save)}
      <div class="preview-box"><i class="spot"></i><div class="preview-cat"></div>
        <div class="preview-name"></div><div class="preview-actions"></div></div>
      <div class="tabs" role="tablist"></div>
      <div class="tab-body"></div>
    </div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);
    const cat = liveCat({ skin: save.equipped.skin, hat: save.equipped.hat, scale: 5 });
    $(".preview-cat").append(cat.el);

    const skinsAll = SKINS.filter((s) => !s.retired || save.owned.skins.includes(s.id));
    const hatsAll = HATS.filter((s) => s.id !== "none" && (!s.retired || save.owned.hats.includes(s.id)));

    const renderPreview = () => {
      const skin = tryOn && tryOn.kind === "skin" ? tryOn.id : save.equipped.skin;
      const hat = tryOn && tryOn.kind === "hat" ? tryOn.id : save.equipped.hat;
      cat.set({ skin, hat });
      const sk = SKINS.find((s) => s.id === skin);
      $(".preview-name").innerHTML = sticker(`<span class="sticker-label">${esc(tryOn ? tryOn.name : save.catName || (sk && sk.name) || "")}</span>`, { tilt: -3 });
      let act = "";
      if (tryOn) act = pxButton(`${ico("fish")}<span>${tryOn.price}</span>`, { act: "buy", variant: save.coins >= tryOn.price ? "ok" : "dark", cls: "px-btn--sm" }) + pxButton("X", { act: "untry", variant: "paper", cls: "px-btn--sm" });
      else if (save.equipped.hat && save.equipped.hat !== "none") act = pxButton("Take off hat", { act: "hat-off", variant: "paper", cls: "px-btn--sm" });
      $(".preview-actions").innerHTML = act;
    };

    const renderTabs = () => {
      const nS = skinsAll.filter((s) => save.owned.skins.includes(s.id)).length;
      const nH = hatsAll.filter((s) => save.owned.hats.includes(s.id)).length;
      $(".tabs").innerHTML = [["skins", "Skins", `${nS}/${skinsAll.length}`], ["hats", "Hats", `${nH}/${hatsAll.length}`], ["shop", "Shop", ev ? "event!" : "fish"]]
        .map(([id, label, sub]) => `<button class="tab ${tab === id ? "on" : ""}" role="tab" data-act="tab" data-tab="${id}">${label}<small>${sub}</small></button>`).join("");
    };

    const itemHTML = (it, kind, { owned, on, price, cant } = {}) => {
      const r = it.rarity || "common";
      const art = kind === "skin"
        ? catImg(it.id, "none", { scale: 2, silhouette: !owned && !price })
        : catImg(save.equipped.skin, it.id, { scale: 2, silhouette: !owned && !price });
      const name = owned || price ? esc(it.name) : "???";
      const evTag = (it.source || "").startsWith("event:") ? `<span class="ev">${sticker(`<span class="sticker-label sticker-label--violet">event</span>`, { tilt: -8 })}</span>` : "";
      const foot = price && !owned ? `<span class="price">${ico("fish", { scale: 2 })}${price}</span>` : !owned ? `<span class="price" style="color:var(--l,#b7b0c8)">${esc(srcHint(it) || "?")}</span>` : price ? `<span class="price" style="color:#93e04c">got it</span>` : "";
      return `<button class="item ${on ? "on" : ""} ${!owned && !price ? "locked" : ""} ${cant ? "cant" : ""}" style="--r:var(--px-r-${r})" data-act="${owned ? "equip" : price ? "try" : "locked"}" data-kind="${kind}" data-id="${it.id}" title="${esc(RARITY_EN[r])}">
        <i class="rar"></i>${evTag}${art}<span class="nm">${name}</span>${foot}</button>`;
    };

    const renderBody = () => {
      const body = $(".tab-body");
      if (tab === "skins" || tab === "hats") {
        const list = tab === "skins" ? skinsAll : hatsAll;
        const own = tab === "skins" ? save.owned.skins : save.owned.hats;
        const sorted = [...list].sort((a, b) => (own.includes(b.id) - own.includes(a.id)));
        body.innerHTML = `<div class="item-grid">${sorted.map((it) => itemHTML(it, tab === "skins" ? "skin" : "hat", { owned: own.includes(it.id), on: (tab === "skins" ? save.equipped.skin : save.equipped.hat) === it.id })).join("")}</div>
          <div class="legend-row">${["common", "rare", "epic", "legendary"].map((r) => `<span><i style="background:var(--px-r-${r})"></i>${RARITY_EN[r]}</span>`).join("")}</div>`;
      } else {
        const items = shopItems(save);
        const all = [...items.skins, ...items.hats].sort((a, b) => (a.owned - b.owned) || ((b.source || "").startsWith("event") - (a.source || "").startsWith("event")) || (a.price - b.price));
        body.innerHTML = `
          <div class="shop-extras">
            ${panel(`<img class="px-ico big-ico" src="${iconURLsafe("shield")}" alt=""><b>Streak freeze</b><small>Miss 1 day, keep your streak. You have ${save.streak.freezes}/${ECON.freezeMax}.</small>
              ${pxButton(`${ico("fish", { scale: 2 })}<span>${ECON.freezePrice}</span>`, { act: "buy-freeze", variant: save.coins >= ECON.freezePrice && save.streak.freezes < ECON.freezeMax ? "ok" : "dark", cls: "px-btn--sm" })}`, { cls: "shop-extra", tilt: -1.5, tape: true })}
            ${panel(`<img class="px-ico big-ico" src="${chestSrc("wood", 3)}" alt="" style="object-fit:contain"><b>Wood chest</b><small>Fish or a surprise!</small>
              ${pxButton(`${ico("fish", { scale: 2 })}<span>${ECON.chestPrice}</span>`, { act: "buy-chest", variant: save.coins >= ECON.chestPrice ? "ok" : "dark", cls: "px-btn--sm" })}`, { cls: "shop-extra", tilt: 1.2, tape: true })}
          </div>
          <div class="section-title">Skins + hats ${ev ? `<small>${esc(ev.name)}!</small>` : ""}</div>
          <div class="item-grid">${all.map((it) => itemHTML(it, it.kind, { owned: it.owned, price: it.price, cant: !it.owned && save.coins < it.price, on: tryOn && tryOn.id === it.id })).join("")}</div>`;
      }
    };
    const render = () => { renderPreview(); renderTabs(); renderBody(); refreshFish(el, save); };
    render();

    const equip = (kind, id) => {
      if (kind === "skin") save.equipped.skin = id; else save.equipped.hat = id;
      persist(); sfx.perk && sfx.perk(); tryOn = null;
      cat.set({ skin: save.equipped.skin, hat: save.equipped.hat }); cat.play("dance", 1400);
      render();
    };

    const off = onAct(el, {
      back: () => { sfx.tap(); go("home"); },
      tab: (b) => { tab = b.dataset.tab; tryOn = null; sfx.tap(); render(); },
      equip: (b) => equip(b.dataset.kind, b.dataset.id),
      locked: (b) => { sfx.tap(); const it = (b.dataset.kind === "skin" ? SKINS : HATS).find((x) => x.id === b.dataset.id); const s = it && srcHint(it); toast(s === "chest" ? "Find it in a chest!" : s === "boss prize" ? "Beat the weekly boss!" : s === "event" ? "Only in special events!" : "Not yet!"); },
      try: (b) => {
        const kind = b.dataset.kind, it = (kind === "skin" ? SKINS : HATS).find((x) => x.id === b.dataset.id);
        tryOn = { kind, id: it.id, price: it.price, name: it.name };
        sfx.tap(); cat.hop(); render();
        el.querySelector(".preview-box").scrollIntoView({ behavior: "smooth", block: "center" });
      },
      untry: () => { tryOn = null; sfx.tap(); render(); },
      buy: async () => {
        if (!tryOn) return;
        if (save.coins < tryOn.price) { sfx.wrong(); toast(`You need ${tryOn.price - save.coins} more fish`, { icon: "fish" }); return; }
        const yes = await modal({ title: "Buy it?", body: `<p style="margin:0;display:flex;align-items:center;gap:8px"><b>${esc(tryOn.name)}</b> for ${ico("fish", { scale: 2 })} <b>${tryOn.price}</b></p>`, actions: [{ label: "Yes!", value: true, variant: "ok" }, { label: "No", value: false }] });
        if (!yes) return;
        const it = { ...tryOn, owned: false };
        if (!buy(save, it)) return;
        sfx.chest(); toast(`New! ${tryOn.name}`);
        equip(tryOn.kind, tryOn.id);
      },
      "hat-off": () => equip("hat", "none"),
      "buy-freeze": () => {
        if (save.streak.freezes >= ECON.freezeMax) return toast("You have the max!");
        if (save.coins < ECON.freezePrice) { sfx.wrong(); return toast("Not enough fish"); }
        save.coins -= ECON.freezePrice; save.streak.freezes++; persist(); sfx.coin(); toast("Streak freeze +1"); render();
      },
      "buy-chest": () => {
        if (save.coins < ECON.chestPrice) { sfx.wrong(); return toast("Not enough fish"); }
        save.coins -= ECON.chestPrice; save.chests.unshift("wood"); persist(); sfx.coin(); go("chest", { from: "wardrobe" });
      },
    });
    return off;
  },
};

import { iconSrc, chestSrc } from "./components.js";
function iconURLsafe(name) { return iconSrc(name, 4); }
