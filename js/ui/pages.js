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
import { mountPowersSection } from "./powers.js";

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
    const el = h(`<div class="screen page skills">${pageHead("Skills", save, { fish: false })}<div class="sk-body"></div><div class="sk-powers"></div></div>`);
    root.append(el);
    const offPw = mountPowersSection(el.querySelector(".sk-powers"), save);
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
    const offSk = onAct(el, {
      back,
      raise: (b) => {
        const t = TALENTS.find((x) => x.id === b.dataset.id);
        if (!t || !canRaise(save, t, talentPoints(save))) return;
        save.talents[t.id] = tr(save, t.id) + 1; persist(); sfx.level(); render();
      },
    });
    return () => { offSk(); offPw(); };
  },
};

// =================== CARDS ===================
const SKILL_EN = { plural: "plurals", pc_vs_ps: "simple or continuous?" };
const skillLabel = (sk) => sk.startsWith("v:") ? (VOCAB[sk.slice(2)] ? VOCAB[sk.slice(2)].name : sk) : SKILL_EN[sk] || (SKILLS[sk] ? SKILLS[sk].name : sk);
function exampleFor(key) {
  const [, sk, p] = key.split(":");
  try { let s = 0; for (const c of key) s = (s * 31 + c.charCodeAt(0)) >>> 0; const rng = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); return SKILLS[sk].patterns[p](rng).full; } catch { return p; }
}
const TIER_EN = ["", "seen", "bronze", "silver", "gold"];
// JEDNO źródło liczb albumu (zakładki, nagłówek, podsumowanie liczą tak samo): found = karta odkryta (tier > 0)
function setStats(save, sk) {
  const items = itemsForSkill(sk);
  const tiers = items.map((k) => cardTier(save.srs[k]));
  const by = [0, 0, 0, 0, 0]; tiers.forEach((t) => by[t]++);
  const found = items.length - by[0];
  return { items, tiers, n: items.length, found, gold: by[4], by, complete: found === items.length && items.length > 0, allGold: by[4] === items.length && items.length > 0 };
}

export const cardsScreen = {
  mount(root, params = {}) {
    const save = app.save, profile = app.profile;
    const skills = [...activeSkills(save, profile).keys(), ...Object.keys(save.skills)].filter((v, i, a) => a.indexOf(v) === i && itemsForSkill(v).length);
    const stats = Object.fromEntries(skills.map((sk) => [sk, setStats(save, sk)]));
    skills.sort((a, b) => stats[b].found - stats[a].found);
    let cur = params.skill && skills.includes(params.skill) ? params.skill : skills[0];
    const total = skills.reduce((a, s) => a + stats[s].n, 0);
    const got = skills.reduce((a, s) => a + stats[s].found, 0);
    const gold = skills.reduce((a, s) => a + stats[s].gold, 0);
    const sets = skills.filter((s) => stats[s].complete).length;
    const goldCard = `<span class="mini-card t4"><i></i></span>`;
    const el = h(`<div class="screen page cards">${pageHead("Cards", save, { fish: false })}
      ${panel(`<div class="al-sum">
          <div class="al-stat"><span class="mini-card t2"><i></i></span><b>${got}<small>/${total}</small></b><em>cards</em></div>
          <div class="al-stat">${goldCard}<b>${gold}</b><em>gold</em></div>
          <div class="al-stat"><img class="px-ico" src="${iconSrc("trophy", 3)}" alt=""><b>${sets}<small>/${skills.length}</small></b><em>sets done</em></div>
        </div>
        <div class="al-bar"><i style="width:${total ? (got / total) * 100 : 0}%"></i><i class="g" style="width:${total ? (gold / total) * 100 : 0}%"></i></div>
        <span class="hand al-doodle">${got ? "collect them all!" : "play to find cards!"}</span>`, { cls: "al-head", tilt: -0.8 })}
      <div class="album-tabs"></div>
      <div class="al-set"></div>
      <div class="album-grid"></div>
      <div class="tier-key"><span><i style="background:#8a8299"></i>seen</span><span><i style="background:#c98a52"></i>bronze</span><span><i style="background:#a9b6cb"></i>silver</span><span><i style="background:#ffd23f"></i>gold</span><span class="lex">right answers = better cards</span></div>
    </div>`);
    root.append(el);
    const render = () => {
      el.querySelector(".album-tabs").innerHTML = skills.map((sk) => {
        const st = stats[sk];
        const th = sk.startsWith("v:") ? VOCAB[sk.slice(2)] : null;
        return `<button class="album-tab ${sk === cur ? "on" : ""} ${st.allGold ? "gold" : st.complete ? "done" : ""}" data-act="skill" data-s="${esc(sk)}">${th && th.icon ? `<img class="px-img" src="${picSrc(th.icon, 2)}" alt="">` : ico("cards", { scale: 2 })}<span>${esc(skillLabel(sk))}</span><small>${st.found}/${st.n}${st.gold ? ` · ${st.gold}★` : ""}</small>${st.complete ? `<img class="px-ico tab-star" src="${iconSrc("star", 2)}" alt="">` : ""}</button>`;
      }).join("");
      const g = el.querySelector(".album-grid"), head = el.querySelector(".al-set");
      if (!cur) { head.innerHTML = ""; g.innerHTML = `<p class="muted">Play to find cards!</p>`; return; }
      const st = stats[cur];
      head.innerHTML = `<div class="al-set-name px">${esc(skillLabel(cur))}</div>
        <div class="al-seg">${[4, 3, 2, 1].map((t) => st.by[t] ? `<i class="t${t}" style="flex:${st.by[t]}"></i>` : "").join("")}${st.by[0] ? `<i class="t0" style="flex:${st.by[0]}"></i>` : ""}</div>
        <div class="al-set-n">${st.found}/${st.n} found · ${st.gold} gold ${st.allGold ? sticker(`<span class="sticker-label">GOLD SET!</span>`, { tilt: -6 }) : st.complete ? sticker(`<span class="sticker-label sticker-label--green">set done!</span>`, { tilt: -6 }) : ""}</div>`;
      const gram = !cur.startsWith("v:");
      g.className = `album-grid card-grid ${gram ? "gram" : ""}`;
      g.innerHTML = st.items.map((key, i) => {
        const tier = st.tiers[i], no = `<span class="no">#${i + 1}</span>`;
        if (!tier) return `<div class="wcard t0">${no}<div class="art">?</div><span class="w">???</span></div>`;
        const rib = `<span class="rib">${TIER_EN[tier]}</span>`;
        if (gram) return `<div class="wcard t${tier} gram">${no}<div class="art">${esc(exampleFor(key))}</div>${rib}</div>`;
        const w = wordOf(key);
        return `<button class="wcard t${tier}" data-act="card" data-k="${esc(key)}">${no}<div class="art"><img class="px-img" src="${picSrc(w.img, 3)}" alt=""></div><span class="w">${esc(w.en)}</span>${rib}</button>`;
      }).join("");
    };
    render();
    const bigCard = (key) => {
      const w = wordOf(key), tier = cardTier(save.srs[key]);
      if (!w) return;
      if (canSpeak()) speak(w.en);
      const showPl = save.settings.pl !== false;
      const m = h(`<div class="modal-back card-back"><div class="big-card wcard t${tier}">
          <div class="art"><img class="px-img" src="${picSrc(w.img, 6)}" alt=""></div>
          <span class="w">${esc(w.en)}</span>${showPl ? `<span class="pl lex">${esc(w.pl || "")}</span>` : ""}
          <div class="stars">${[1, 2, 3, 4].map((t) => `<img class="px-ico ${t <= tier ? "" : "off"}" src="${iconSrc("star", 3)}" alt="">`).join("")}</div>
          <span class="rib">${TIER_EN[tier]}</span>
          <p class="lex next">${tier >= 4 ? "Gold! You know this word." : "Get it right again to make it " + TIER_EN[tier + 1] + "!"}</p>
          <div class="row">${canSpeak() ? pxButton("Listen", { icon: "speaker", act: "say", variant: "paper", cls: "px-btn--sm" }) : ""}${pxButton("OK", { act: "close", variant: "ok", cls: "px-btn--sm" })}</div>
        </div></div>`);
      const close = () => { m.classList.add("out"); setTimeout(() => m.remove(), 180); };
      m.addEventListener("click", (e) => { const b = e.target.closest("[data-act]"); if (b && b.dataset.act === "say") { speak(w.en); sfx.tap(); return; } if (e.target === m || (b && b.dataset.act === "close")) { sfx.tap(); close(); } });
      document.body.append(m);
      sfx.tap();
    };
    return onAct(el, {
      back,
      skill: (b) => { cur = b.dataset.s; sfx.tap(); render(); },
      card: (b) => bigCard(b.dataset.k),
    });
  },
};

// =================== MOON DIARY ===================
const stripEmoji = (s) => s.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]️?/gu, "").replace(/\s+/g, " ").trim();
// ilustracja każdej strony (pikselizowane emoji, spójne z resztą gry)
const PAGE_ART = ["🌑", "🗼", "📜", "📚", "🔑", "👻", "👋", "🤫", "🐸", "🤴", "🌫️", "🌋", "🌙", "❄️", "🗺️", "☁️", "🐱", "🤖", "❓", "👑"];
function moonCanvas(open, total) {
  const R = 22, S = 4, c = document.createElement("canvas");
  c.width = c.height = (R * 2 + 6) * S;
  c.className = "moon-px px-canvas";
  const x = c.getContext("2d"); x.setTransform(S, 0, 0, S, 0, 0);
  const cx = R + 3, cy = R + 3, k = Math.min(1, open / Math.max(1, total));
  for (let yy = -R; yy <= R; yy++) for (let xx = -R; xx <= R; xx++) {
    const d = Math.sqrt(xx * xx + yy * yy);
    if (d > R + 0.5) continue;
    const ang = (Math.atan2(xx, -yy) / (Math.PI * 2) + 1) % 1; // kawałki zgodnie z zegarem
    const filled = ang < k;
    const edge = d > R - 1.2;
    let col = filled ? ((xx * 3 + yy * 5) % 11 === 0 ? "#d9ceb4" : yy > 8 ? "#e7dfc8" : "#fff8e0") : "transparent";
    if (filled && (xx + 7) * (xx + 7) + (yy + 6) * (yy + 6) < 18) col = "#d9ceb4";
    if (filled && (xx - 9) * (xx - 9) + (yy - 4) * (yy - 4) < 10) col = "#e2d8bd";
    if (!filled && edge && ((xx + yy) & 1)) col = "#7a7290";
    if (filled && edge) col = "#0e0b16";
    if (col !== "transparent") { x.fillStyle = col; x.fillRect(cx + xx, cy + yy, 1, 1); }
  }
  return c;
}
export const storyScreen = {
  mount(root) {
    const save = app.save;
    const open = Math.min(save.story || 0, STORY.length);
    try { localStorage.setItem(`ninelives:storySeen:${save.id}`, String(open)); } catch {}
    const showPl = save.settings.pl !== false;
    const page = (p, i) => panel(`
        <div class="dp-head"><span class="pn">page ${i + 1}</span><span class="hand dp-date">${["night", "later", "next day", "morning", "at night"][i % 5]}</span></div>
        <div class="dp-body">
          <div class="dp-art" style="--tilt:${i % 2 ? 4 : -4}deg"><i class="tape tape--c"></i><img class="px-img" src="${picSrc(PAGE_ART[i] || "⭐", 4)}" alt=""></div>
          <div class="dp-text"><p class="en">${esc(stripEmoji(p.en))}</p>${showPl ? `<p class="pl" hidden>${esc(p.pl)}</p>` : ""}</div>
        </div>
        <div class="row">${canSpeak() ? pxButton("Listen", { icon: "speaker", act: "say", variant: "paper", cls: "px-btn--sm", attrs: `data-i="${i}"` }) : ""}${showPl ? pxButton("PL", { act: "pl", variant: "paper", cls: "px-btn--sm" }) : ""}</div>`,
      { cls: `diary-page paper--lined ${i % 2 ? "odd" : ""}`, grid: false, tape: i % 3 === 0, tilt: [-0.8, 0.5, -0.3, 0.9][i % 4] });
    const el = h(`<div class="screen page story">${pageHead("Moon Diary", save, { fish: false })}
      <div class="moon-head"><div class="moon-slot"></div>
        <p><b>${open}/${STORY.length}</b> Moon pieces</p><span class="note">beat a boss = new page</span></div>
      <div class="diary">${STORY.map((p, i) => i < open ? page(p, i)
        : i === open ? panel(`<div class="dp-locked"><img class="px-ico" src="${iconSrc("lock", 4)}" alt=""><div><span class="pn">page ${i + 1}</span><p class="en">Beat the next boss!</p></div><span class="dp-q px">?</span></div>`, { cls: "diary-page locked torn", grid: false, tape: false, tilt: 0.4 }) : "").join("")}
        ${open < STORY.length - 1 ? `<p class="muted dp-more">${STORY.length - open - 1} more pages…</p>` : ""}</div>
    </div>`);
    root.append(el);
    el.querySelector(".moon-slot").append(moonCanvas(open, STORY.length));
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
