// WYNIKI BIEGU (wyjście z rewards.applyRunResults): stempel, liczniki rybek/XP, combo, celność,
// level up, skrzynia, nowa strona Moon Diary, ciepły komunikat o „śpiącym” kocie.
import { h, esc, app, ico, iconSrc, catImg, chestSrc, pxButton, panel, stamp, onAct, countUp, liveCat, CHEST_EN } from "./components.js";
import { go } from "./router.js";
import { sfx, stopMusic } from "../audio.js";
import { livesState } from "../lives.js";

export const resultsScreen = {
  mount(root, r = {}) {
    const save = app.save;
    stopMusic();
    const shadow = r.mode === "shadow";
    const won = !!r.won;
    const ls = livesState(save);
    const acc = r.answers ? Math.round((r.correct / r.answers) * 100) : 0;
    let st, stColor, title, sub;
    if (r.quit) { st = "Bye!"; stColor = "ink"; title = "See you soon!"; sub = shadow ? "" : `Floor ${r.floorReached || "-"}`; }
    else if (shadow) { st = won ? "Clear!" : "Zzz"; stColor = won ? "violet" : "ink"; title = won ? "Shadows gone!" : "The shadows hide…"; sub = "Shadow Cellar"; }
    else if (won) { st = "Win!"; stColor = "ok"; title = "Boss down!"; sub = `New start: floor ${save.tower.checkpoint + 1}`; }
    else { st = "Lost"; stColor = "danger"; title = r.asleep || ls.asleep ? "Your cat is sleepy" : "Nice try!"; sub = `You got to floor ${r.floorReached || "-"}`; }

    const msgs = [];
    if (r.lvlAfter > r.lvlBefore) msgs.push({ cls: "gold", icon: "star", text: `Level ${r.lvlAfter}! +${r.lvlAfter - r.lvlBefore} skill point${r.lvlAfter - r.lvlBefore > 1 ? "s" : ""}` });
    if (r.chest) msgs.push({ cls: "ok", img: chestSrc(r.chest, 2), text: `${CHEST_EN[r.chest] || "Chest"}!` });
    for (const c of r.levelChests || []) msgs.push({ cls: "ok", img: chestSrc(c, 2), text: `Level prize: ${CHEST_EN[c] || "chest"}!` });
    if (r.story) msgs.push({ cls: "violet", icon: "moon", text: `New Moon Diary page!` });
    if (r.napLives) msgs.push({ cls: "", icon: "heart", text: `Cat nap: +${r.napLives} ${r.napLives > 1 ? "lives" : "life"}` });
    for (const e of r.streakEvents || []) {
      if (e.type === "freeFreeze") msgs.push({ icon: "shield", text: "Free streak freeze!" });
      if (e.type === "freezeUsed") msgs.push({ icon: "shield", text: "A freeze saved your streak!" });
      if (e.type === "streakChest") msgs.push({ cls: "gold", icon: "flame", text: `${e.n} days in a row! Silver chest!` });
      if (e.type === "streakLost") msgs.push({ icon: "flame", text: "New streak. Go go go!" });
    }
    const sleepy = !shadow && (r.mult < 1 || (r.sleepy || 0) > 0);
    const hasChest = save.chests.length > 0;

    const el = h(`<div class="screen results ${won ? "win" : "lose"}">
      <div class="res-head">${stamp(st, { color: stColor, cls: "slam" })}<div class="res-cat"></div></div>
      <h1 class="res-title px">${esc(title)}</h1>
      ${sub ? `<p class="res-sub">${esc(sub)}</p>` : ""}
      ${panel(`<div class="res-stats">
          <div class="res-stat big">${ico("fish", { scale: 3 })}<b>+<span data-n="coins">0</span></b><small>fish</small></div>
          <div class="res-stat big">${ico("xp", { scale: 3 })}<b>+<span data-n="xp">0</span></b><small>XP</small></div>
          <div class="res-stat">${ico("flame", { scale: 3 })}<b data-n="combo">0</b><small>best combo</small></div>
          <div class="res-stat">${ico("check", { scale: 3 })}<b><span data-n="acc">0</span>%</b><small>right</small></div>
        </div>`, { cls: "res-board", tilt: -1 })}
      <div class="res-msgs"></div>
      ${sleepy ? panel(`<img class="px-ico" src="${iconSrc("catHead", 4)}" alt=""><span>Your cat is getting sleepy… rewards are smaller now. The Shadow Cellar still gives full rewards!</span>`, { cls: "sleepy-note", tape: false, tilt: 0.6 }) : ""}
      <div class="res-actions">
        ${hasChest ? pxButton("Open chest", { act: "open-chest", big: true, variant: "gold" }) : ""}
        ${pxButton("Continue", { act: "continue", big: !hasChest, variant: hasChest ? "paper" : "ok" })}
      </div>
    </div>`);
    root.append(el);
    const cat = liveCat({ skin: save.equipped.skin, hat: save.equipped.hat, anim: won ? "dance" : r.quit ? "idle" : "hurt", scale: 4 });
    el.querySelector(".res-cat").append(cat.el);
    won ? sfx.win() : r.quit ? sfx.tap() : sfx.lose();
    setTimeout(() => sfx.stamp(), 180);

    // liczniki po kolei
    const n = (k) => el.querySelector(`[data-n=${k}]`);
    let alive = true;
    (async () => {
      await new Promise((ok) => setTimeout(ok, 450));
      await countUp(n("coins"), 0, r.coins || 0, 800, { tick: (v) => v % 3 === 0 && sfx.coin() });
      await countUp(n("xp"), 0, r.xp || 0, 700);
      await countUp(n("combo"), 0, r.bestCombo || 0, 300);
      await countUp(n("acc"), 0, acc, 400);
      if (!alive) return;
      const box = el.querySelector(".res-msgs");
      msgs.forEach((m, i) => setTimeout(() => {
        if (!alive) return;
        box.append(h(`<div class="res-msg ${m.cls ? "res-msg--" + m.cls : ""}">${m.img ? `<img class="px-img" src="${m.img}" alt="" style="object-fit:contain">` : ico(m.icon || "star")}<span>${esc(m.text)}</span></div>`));
        if (m.icon === "star") { sfx.level(); cat.play("dance", 1500); } else sfx.perk && sfx.perk();
      }, i * 380));
    })();

    const off = onAct(el, {
      continue: () => { sfx.tap(); go("home"); },
      "open-chest": () => { sfx.tap(); go("chest", { from: "home" }); },
    });
    return () => { alive = false; off(); };
  },
};
