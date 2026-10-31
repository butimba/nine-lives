// Podstrony: Skills (talenty), Cards (album), Moon Diary, Weekly (WANTED), Settings.
import { h, esc, app, ico, iconSrc, picSrc, catImg, pxButton, panel, stamp, sticker, pageHead, refreshFish, toast, modal, onAct, chestSrc } from "./components.js";
import { go } from "./router.js";
import { logout } from "./login.js";
import { persist, levelInfo, talentPoints, exportCode, freshSave } from "../state.js";
import { canRaise, tr, weeklyStatus, weeklyReward, weeklyBossInfo } from "../meta.js";
import { activeSkills, itemsForSkill, wordOf, cardTier, reportText } from "../engine.js";
import { sfx, setAudio, speak, canSpeak } from "../audio.js";
import { TALENTS, ECON, STORY } from "../../data/progression.js";
import { SKINS } from "../../data/cosmetics.js";
import VOCAB from "../../data/vocab.js";
import { SKILLS } from "../../data/grammar.js";
import * as cloud from "../cloud.js";
import { makeMonster } from "../pixel/monsters.js";
import { gainLife } from "../lives.js";

const back = () => { sfx.tap(); go("home"); };

// =================== SKILLS ===================
const TREES_EN = { claws: { name: "Claws", color: "var(--px-danger)", icon: "claw" }, fur: { name: "Fur", color: "var(--px-sky)", icon: "shield" }, whiskers: { name: "Whiskers", color: "#d9a22b", icon: "eye" } };
const TALENT_EN = {
  sharp_claws: { name: "Sharp Claws", icon: "star", d: (r) => `+${r * 6}% big hits (x2)` },
  combo: { name: "Combo Master", icon: "flame", d: (r) => `${Math.max(2, 5 - r)} right in a row = +1 damage` },
  pounce: { name: "Pounce", icon: "catHead", d: (r) => `First hit on a floor: x${r + 1}` },
  nine_lives: { name: "Nine Lives", icon: "shield", d: (r) => `+${r} shield vs boss shots` },
  thick_fur: { name: "Thick Fur", icon: "heart", d: (r) => `${r * 10}% chance: a mistake costs no life` },
  cat_nap: { name: "Cat Nap", icon: "moon", d: (r) => `Beat a boss: +${r} ${r > 1 ? "lives" : "life"}` },
  lucky: { name: "Lucky Whiskers", icon: "fish", d: (r) => `+${r * 10}% fish` },
  sixth_sense: { name: "Sixth Sense", icon: "xp", d: (r) => `${r + 1} hints in every run` },
  treasure: { name: "Treasure Nose", icon: "cards", d: (r) => `Better chests (+${r * 8}% rare)` },
};

export const skillsScreen = {
  mount(root) {
    const save = app.save;
    const el = h(`<div class="screen page skills">${pageHead("Skills", save, { fish: false })}<div class="sk-body"></div></div>`);
    root.append(el);
    const render = () => {
      const pts = talentPoints(save);
      const L = levelInfo(save.xp);
      el.querySelector(".sk-body").innerHTML = `
        ${panel(`<span>Points</span><b>${pts}</b><span class="hand" style="font-size:20px;text-transform:none;letter-spacing:0">1 point = 1 level (you are LV ${L.lvl})</span>`, { cls: "pts-banner", tilt: -1 })}
        <div class="trees">${Object.entries(TREES_EN).map(([tid, tree], ti) => panel(`
          <div class="tree-head">${ico(tree.icon)}<span>${tree.name}</span></div>
          <div class="tree-body">${TALENTS.filter((t) => t.tree === tid).map((t) => {
            const en = TALENT_EN[t.id] || { name: t.name, icon: "star", d: () => "" };
            const r = tr(save, t.id), can = canRaise(save, t, pts), locked = t.req && tr(save, t.req) < 1;
            return `<div class="talent ${locked ? "locked" : ""} ${r ? "has" : ""}">
              <div class="ti">${ico("talent_" + t.id, { scale: 3 })}</div>
              <div><b>${esc(en.name)}</b><small>${esc(en.d(Math.max(1, Math.min(t.max, r + (r < t.max ? 1 : 0)))))}${r >= t.max ? "" : r ? " (next)" : ""}</small>
                <div class="pips">${Array.from({ length: t.max }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("")}</div></div>
              ${locked ? `<img class="px-ico" src="${iconSrc("lock", 3)}" alt="locked">` : pxButton(r >= t.max ? "Max" : "+1", { act: "raise", variant: can ? "ok" : "dark", cls: "px-btn--sm", disabled: !can, attrs: `data-id="${t.id}"` })}
            </div>`;
          }).join("")}</div>`, { cls: "tree", tape: ti === 1, tilt: [-0.8, 0.6, -0.4][ti], style: `--t:${tree.color}` })).join("")}</div>`;
    };
    render();
    return onAct(el, {
      back,
      raise: (b) => {
        const t = TALENTS.find((x) => x.id === b.dataset.id);
        if (!t || !canRaise(save, t, talentPoints(save))) return;
        save.talents[t.id] = tr(save, t.id) + 1; persist(); sfx.level(); render();
      },
    });
  },
};

// =================== CARDS ===================
const SKILL_EN = { plural: "plurals", pc_vs_ps: "simple or continuous?" };
const skillLabel = (sk) => sk.startsWith("v:") ? (VOCAB[sk.slice(2)] ? VOCAB[sk.slice(2)].name : sk) : SKILL_EN[sk] || (SKILLS[sk] ? SKILLS[sk].name : sk);
function exampleFor(key) {
  const [, sk, p] = key.split(":");
  try { let s = 0; for (const c of key) s = (s * 31 + c.charCodeAt(0)) >>> 0; const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); return SKILLS[sk].patterns[p](rng).full; } catch { return p; }
}

export const cardsScreen = {
  mount(root, params = {}) {
    const save = app.save, profile = app.profile;
    const skills = [...activeSkills(save, profile).keys(), ...Object.keys(save.skills)].filter((v, i, a) => a.indexOf(v) === i && itemsForSkill(v).length);
    skills.sort((a, b) => itemsForSkill(b).filter((k) => save.srs[k]).length - itemsForSkill(a).filter((k) => save.srs[k]).length);
    let cur = params.skill && skills.includes(params.skill) ? params.skill : skills[0];
    const total = skills.reduce((a, s) => a + itemsForSkill(s).length, 0);
    const got = skills.reduce((a, s) => a + itemsForSkill(s).filter((k) => cardTier(save.srs[k]) > 0).length, 0);
    const el = h(`<div class="screen page cards">${pageHead("Cards", save, { fish: false })}
      <div class="section-title" style="margin-top:0">Collected <small>${got}/${total}</small></div>
      <div class="album-tabs"></div><div class="album-grid"></div>
      <div class="tier-key"><span><i style="background:#8a8299"></i>seen</span><span><i style="background:#c98a52"></i>bronze</span><span><i style="background:#a9b6cb"></i>silver</span><span><i style="background:#ffd23f"></i>gold</span></div>
    </div>`);
    root.append(el);
    const render = () => {
      el.querySelector(".album-tabs").innerHTML = skills.map((sk) => {
        const items = itemsForSkill(sk), got = items.filter((k) => cardTier(save.srs[k]) > 0).length, gold = items.filter((k) => cardTier(save.srs[k]) === 4).length;
        const th = sk.startsWith("v:") ? VOCAB[sk.slice(2)] : null;
        return `<button class="album-tab ${sk === cur ? "on" : ""}" data-act="skill" data-s="${esc(sk)}">${th && th.icon ? `<img class="px-img" src="${picSrc(th.icon, 2)}" alt="">` : ico("cards", { scale: 2 })}<span>${esc(skillLabel(sk))}</span><small>${got}/${items.length}${gold ? ` · ${gold}★` : ""}</small></button>`;
      }).join("");
      const g = el.querySelector(".album-grid");
      if (!cur) { g.innerHTML = `<p class="muted">Play to find cards!</p>`; return; }
      const gram = !cur.startsWith("v:");
      g.className = `album-grid card-grid ${gram ? "gram" : ""}`;
      g.innerHTML = itemsForSkill(cur).map((key) => {
        const tier = cardTier(save.srs[key]);
        if (!tier) return `<div class="wcard t0"><div class="art">?</div><span class="w">???</span></div>`;
        if (gram) return `<div class="wcard t${tier} gram"><div class="art">${esc(exampleFor(key))}</div></div>`;
        const w = wordOf(key);
        return `<button class="wcard t${tier}" data-act="say" data-w="${esc(w.en)}"><div class="art"><img class="px-img" src="${picSrc(w.img, 3)}" alt=""></div><span class="w">${esc(w.en)}</span></button>`;
      }).join("");
    };
    render();
    return onAct(el, {
      back,
      skill: (b) => { cur = b.dataset.s; sfx.tap(); render(); },
      say: (b) => { if (canSpeak()) speak(b.dataset.w); sfx.tap(); },
    });
  },
};

// =================== MOON DIARY ===================
const stripEmoji = (s) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, "").replace(/\s+/g, " ").trim();
export const storyScreen = {
  mount(root) {
    const save = app.save;
    try { localStorage.setItem(`ninelives:storySeen:${save.id}`, String(save.story || 0)); } catch {}
    const open = save.story || 0;
    const showPl = save.settings.pl !== false;
    const el = h(`<div class="screen page story">${pageHead("Moon Diary", save, { fish: false })}
      <div class="moon-head"><div class="moon-ring" style="--p:${Math.round((open / STORY.length) * 100)}%"><i></i></div>
        <p>${open}/${STORY.length} pages</p><span class="note">beat a boss = new page</span></div>
      <div class="diary">${STORY.map((p, i) => i < open
        ? panel(`<span class="pn">${i + 1}</span><p class="en">${esc(stripEmoji(p.en))}</p>${showPl ? `<p class="pl" hidden>${esc(p.pl)}</p>` : ""}
          <div class="row">${canSpeak() ? pxButton("Listen", { icon: "speaker", act: "say", variant: "paper", cls: "px-btn--sm", attrs: `data-i="${i}"` }) : ""}${showPl ? pxButton("PL", { act: "pl", variant: "paper", cls: "px-btn--sm" }) : ""}</div>`, { cls: "diary-page paper--lined", grid: false, tape: i % 3 === 0, tilt: [-0.8, 0.5, -0.3, 0.9][i % 4] })
        : i === open ? panel(`<span class="pn">${i + 1}</span><p class="en">Beat the next boss!</p>`, { cls: "diary-page locked", grid: false, tape: false, tilt: 0.4 }) : "").join("")}</div>
    </div>`);
    root.append(el);
    return onAct(el, {
      back,
      say: (b) => speak(stripEmoji(STORY[+b.dataset.i].en), 0.8),
      pl: (b) => { const p = b.closest(".diary-page").querySelector(".pl"); if (p) p.hidden = !p.hidden; sfx.tap(); },
    });
  },
};

// =================== WEEKLY (WANTED) ===================
export const weeklyScreen = {
  async mount(root) {
    const save = app.save;
    const el = h(`<div class="screen page weekly">${pageHead("Boss", save)}<div class="wk-body"><p class="muted">…</p></div></div>`);
    root.append(el);
    const offBack = onAct(el, { back, claim: () => claim() });
    let w;
    const render = async () => {
      w = await weeklyStatus(save);
      if (!el.isConnected) return;
      const info = weeklyBossInfo(w.week);
      let m = null; try { m = makeMonster(info.seed, ["#e8434f", "#8a55d6", "#ffa04d", "#6fe3d3", "#93e04c"], { boss: true }); } catch {}
      const p = Math.min(1, w.total / w.hp), done = p >= 1, claimed = save.weekly.claimed.includes(w.week);
      const queue = SKINS.filter((s) => s.source === "weekly" && !s.retired).sort((a, b) => a.order - b.order);
      const next = queue.find((s) => !save.owned.skins.includes(s.id));
      el.querySelector(".wk-body").innerHTML = `
        ${panel(`<h2>WANTED</h2><div class="sub">this week</div>
          <div class="portrait ${done ? "defeated" : ""}">${m ? `<img class="px-img" src="${m.portraitURL(4)}" alt="">` : ""}${done ? stamp("Beaten", { color: "danger" }) : ""}</div>
          <div class="boss-name">${esc(m ? m.name : "???")}</div>
          <div class="hpbar"><i style="width:${(1 - p) * 100}%"></i><span>${done ? "0" : Math.max(0, w.hp - w.total)} HP</span></div>
          <div class="reward-box">${next ? catImg(next.id, "none", { scale: 2, silhouette: !(done && !claimed) && !claimed }) : `<img class="px-img" src="${chestSrc("gold", 3)}" alt="" style="width:64px;height:64px;object-fit:contain">`}
            <div><b>Prize: ${next ? (done ? esc(next.name) : "secret skin") : "Gold chest"}</b><small>+100 fish</small></div></div>
          ${done && !claimed ? `<div style="margin-top:14px">${pxButton("Get prize!", { act: "claim", big: true, variant: "ok" })}</div>` : claimed ? `<div style="margin-top:12px">${stamp("Got it", { color: "ok" })}</div>` : ""}
        `, { cls: "wanted", grid: false, tilt: -1.5 })}
        <p class="wanted-info">${w.cloud ? "Everyone fights this boss together." : "Fight this boss in the tower."} Every right answer is a hit!<br>New boss every Monday.</p>`;
    };
    const claim = () => {
      if (!w || save.weekly.claimed.includes(w.week)) return;
      const r = weeklyReward(save); save.weekly.claimed.push(w.week); persist(true); sfx.chest();
      if (r.skin) { save.equipped.skin = r.skin.id; persist(); toast(`New skin: ${r.skin.name}!`); } else toast("Gold chest!");
      refreshFish(el, save); render();
    };
    await render();
    return offBack;
  },
};

// =================== SETTINGS ===================
export const settingsScreen = {
  mount(root) {
    const save = app.save, profile = app.profile || {};
    const s = save.settings;
    const tog = (key, icon, label, small, on) => `<label class="toggle">${ico(icon, { scale: 3 })}<span>${label}${small ? `<small>${small}</small>` : ""}</span><input type="checkbox" data-k="${key}" ${on ? "checked" : ""}><span class="switch"></span></label>`;
    const el = h(`<div class="screen page settings">${pageHead("Settings", save, { fish: false })}
      <div class="set-list">
        ${tog("voice", "speaker", "Voice", "reads the tasks", !!s.voice)}
        ${tog("pl", "cards", "Polish help", "small hint under tasks", s.pl !== false)}
        ${tog("sfx", "star", "Sounds", "", !!s.sfx)}
        ${tog("music", "moon", "Music", "", !!s.music)}
      </div>
      ${panel(`<h3>Cat name</h3><div class="name-row"><input class="px-input cn" maxlength="18" value="${esc(save.catName)}" style="font-size:20px"></div>
        <p>Player: <b>${esc(app.loginName)}</b> · ${cloud.enabled() ? "saved online" : "saved on this device"}</p>
        <div class="set-row">${pxButton("Log out", { act: "logout", variant: "paper", cls: "px-btn--sm" })}</div>`, { cls: "set-card", tilt: -0.6 })}
      ${panel(`<h3>For teachers</h3><p>Progress and mistakes for the teacher.</p>
        <div class="set-row">${pxButton("Copy progress report", { act: "report", variant: "paper", cls: "px-btn--sm" })}${pxButton("Copy save code", { act: "export", variant: "paper", cls: "px-btn--sm" })}</div>
        <div class="report-slot"></div>`, { cls: "set-card", tape: false, tilt: 0.4 })}
      ${profile.tester ? panel(`<h3>Test account</h3><div class="set-row">
        ${pxButton("+1000 fish", { act: "t-coins", variant: "paper", cls: "px-btn--sm" })}${pxButton("+5 levels", { act: "t-xp", variant: "paper", cls: "px-btn--sm" })}
        ${pxButton("+4 chests", { act: "t-chest", variant: "paper", cls: "px-btn--sm" })}${pxButton("+9 lives", { act: "t-lives", variant: "paper", cls: "px-btn--sm" })}
        ${pxButton("0 lives", { act: "t-sleep", variant: "paper", cls: "px-btn--sm" })}${pxButton("Reset all", { act: "t-reset", variant: "danger", cls: "px-btn--sm" })}</div>`, { cls: "set-card tester", tape: false }) : ""}
    </div>`);
    root.append(el);
    el.querySelectorAll("input[data-k]").forEach((i) => i.addEventListener("change", () => { s[i.dataset.k] = i.checked; setAudio(s); persist(); sfx.tap(); }));
    const cn = el.querySelector(".cn");
    cn.addEventListener("change", () => { const v = cn.value.trim(); if (v) { save.catName = v.slice(0, 18); persist(); toast("Saved!"); } });
    const copy = (txt, msg) => { try { navigator.clipboard.writeText(txt).then(() => toast(msg), () => {}); } catch {} };
    return onAct(el, {
      back,
      logout: async () => { if (await modal({ title: "Log out?", actions: [{ label: "Yes", value: true }, { label: "No", value: false }] })) logout(); },
      report: () => {
        const txt = reportText(save, profile, app.loginName);
        el.querySelector(".report-slot").innerHTML = `<textarea class="report-box" readonly>${esc(txt)}</textarea>`;
        copy(txt, "Report copied");
      },
      export: () => copy(exportCode(), "Save code copied"),
      "t-coins": () => { save.coins += 1000; persist(); toast("+1000 fish"); },
      "t-xp": () => { const l = levelInfo(save.xp).lvl; for (let i = 0; i < 5; i++) save.xp += ECON.levelXp(l + i); persist(); toast("+5 levels"); },
      "t-chest": () => { save.chests.push("wood", "silver", "gold", "epic"); persist(); toast("+4 chests"); },
      "t-lives": () => { for (let i = 0; i < 9; i++) gainLife(save, "tester"); persist(); toast("Lives: 9"); },
      "t-sleep": () => { save.lives.n = 0; save.lives.at = Date.now(); persist(); toast("Lives: 0"); },
      "t-reset": async () => {
        if (!(await modal({ title: "Reset everything?", body: "This test account starts from zero.", actions: [{ label: "Reset", value: true, variant: "danger" }, { label: "No", value: false }] }))) return;
        const id = save.id; Object.assign(save, freshSave(id, profile), { rev: save.rev }); persist(true); go("name");
      },
    });
  },
};
