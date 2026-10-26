import { h, esc, normLogin, loginHash, sleep, today } from "./util.js";
import { loadSave, persist, getSave, levelInfo, talentPoints, exportCode, freshSave } from "./state.js";
import { catSVG, makeMonster, monsterSVG, biomeForFloor, rngFrom } from "./art.js";
import { runGame } from "./battle.js";
import { sfx, setAudio, startMusic, stopMusic, speak } from "./audio.js";
import { SKINS, HATS, RARITY } from "../data/cosmetics.js";
import { TALENTS, TREES, CHESTS, ECON, STORY } from "../data/progression.js";
import EVENTS, { activeEvent } from "../data/events.js";
import VOCAB from "../data/vocab.js";
import { SKILLS } from "../data/grammar.js";
import ROSTER from "../data/roster.js";
import { activeSkills, itemsForSkill, wordOf, cardTier, shadowList, skillName, reportText } from "./engine.js";
import { shopItems, buy, openChest, canRaise, tr, streakAlive, weeklyStatus, weeklyReward, weeklyBossInfo, ensureWeek } from "./meta.js";
import * as cloud from "./cloud.js";

const app = document.getElementById("app");
let save = null, profile = null, loginName = "";

// ---------- start ----------
async function boot() {
  let last = null; try { last = localStorage.getItem("ninelives:last"); } catch {}
  if (last) { await login(last, true); return; }
  showLogin();
}

function showLogin() {
  stopMusic();
  app.innerHTML = "";
  const el = h(`<div class="screen login">
    <div class="login-cat">${catSVG("ginger", "wizard", { cls: "idle" })}</div>
    <h1 class="logo">Nine <span>Lives</span></h1>
    <p class="tag">Wspinaj się na Wieżę. Odzyskaj Księżyc. 🌙</p>
    <form class="card login-card">
      <label>Wpisz swój login</label>
      <input name="n" autocomplete="off" autocapitalize="off" placeholder="np. kasia" maxlength="24"/>
      <button class="btn big go">Graj! ▶</button>
    </form></div>`);
  app.append(el);
  const f = el.querySelector("form"), inp = f.querySelector("input");
  f.onsubmit = async (e) => { e.preventDefault(); if (normLogin(inp.value).length < 2) { inp.classList.add("shake"); setTimeout(() => inp.classList.remove("shake"), 400); return; } sfx.tap(); await login(inp.value); };
}

async function login(name, silent = false) {
  loginName = name;
  const id = loginHash(name);
  profile = ROSTER.players[id] || { ...ROSTER.default, guest: true };
  app.innerHTML = `<div class="screen loading"><div class="spinner">🐾</div></div>`;
  save = await loadSave(id, profile);
  try { localStorage.setItem("ninelives:last", name); } catch {}
  setAudio(save.settings);
  if (!save.catName) return nameCat();
  home();
}

function nameCat() {
  app.innerHTML = "";
  const names = ["Whiskers", "Luna", "Mochi", "Pixel", "Tiger", "Shadow", "Biscuit", "Comet"];
  const el = h(`<div class="screen namecat">
    <div class="big-cat">${catSVG(save.equipped.skin, "none", { cls: "idle" })}</div>
    <h2>Jak nazywa się Twój kot?</h2>
    <form class="card"><input maxlength="14" placeholder="Imię kota" autocomplete="off"/>
    <div class="chips">${names.map((n) => `<button type="button" class="chip">${n}</button>`).join("")}</div>
    <button class="btn big go">Gotowe ✔</button></form></div>`);
  app.append(el);
  const inp = el.querySelector("input");
  el.querySelectorAll(".chips .chip").forEach((c) => (c.onclick = () => { inp.value = c.textContent; sfx.tap(); }));
  el.querySelector("form").onsubmit = (e) => {
    e.preventDefault(); const v = inp.value.trim(); if (!v) return;
    save.catName = v.slice(0, 14); persist(true); home(true);
  };
}

// ---------- ekran główny ----------
async function home(first = false) {
  startMusic("home");
  const ev = activeEvent(new Date(), EVENTS);
  const L = levelInfo(save.xp);
  const pts = talentPoints(save);
  const st = streakAlive(save);
  const shadows = shadowList(save).length;
  if (save.daily.date !== today()) { save.daily.date = today(); save.daily.runs = 0; }
  const fullLeft = Math.max(0, ECON.dailyFullRuns - save.daily.runs);
  const next = save.tower.checkpoint + 1;
  const b = biomeForFloor(next);
  app.innerHTML = "";
  const el = h(`<div class="screen home">
    <div class="topbar">
      <div class="lvl"><b>Lv ${L.lvl}</b><div class="xpbar"><i style="width:${(L.into / L.need) * 100}%"></i></div></div>
      <div class="pill streak ${st.alive ? "" : "dead"}" title="Seria dni">🔥 ${st.alive ? st.count : 0}${save.streak.freezes ? ` <small>🧊${save.streak.freezes}</small>` : ""}</div>
      <div class="pill coins">🪙 ${save.coins}</div>
      <button class="btn ghost icon set">⚙️</button>
    </div>
    ${ev ? `<div class="event-banner">${esc(ev.banner)}</div>` : ""}
    <div class="home-stage" style="--a:${b.sky[0]};--b:${b.sky[1]};--c:${b.sky[2]}">
      <div class="home-cat" title="Pogłaszcz!">${catSVG(save.equipped.skin, save.equipped.hat, { cls: "idle" })}</div>
      <div class="cat-name">${esc(save.catName)}</div>
      <div class="duo-slot"></div>
    </div>
    <button class="btn play">
      <span class="pl1">▶ Climb the Tower</span>
      <span class="pl2">Piętro ${next}–${next + ECON.floorsPerStage - 1} · ${esc(b.label)}</span>
      <span class="pl3">${fullLeft > 0 ? `Pełne nagrody: jeszcze ${fullLeft}×` : "Nagrody: mniejsze (zagraj w Jaskini Cieni 🌑)"}</span>
    </button>
    <div class="menu">
      <button class="tile-btn shadow ${shadows >= 3 ? "" : "locked"}"><span>🌑</span><b>Shadow Cave</b><small>${shadows >= 3 ? `${shadows} cieni czeka` : "Jeszcze nic tu nie ma"}</small></button>
      <button class="tile-btn weekly"><span>👹</span><b>Weekly Boss</b><small class="wk">…</small></button>
      <button class="tile-btn shop"><span>🛒</span><b>Shop</b><small>Skórki i czapki</small></button>
      <button class="tile-btn talents">${pts > 0 ? `<em class="badge">${pts}</em>` : ""}<span>⭐</span><b>Talents</b><small>Pazury · Futro · Wąsy</small></button>
      <button class="tile-btn wardrobe"><span>👕</span><b>Wardrobe</b><small>${save.owned.skins.length} skórek</small></button>
      <button class="tile-btn album"><span>📖</span><b>Album</b><small>Twoje karty słówek</small></button>
      <button class="tile-btn story">${save.story ? "" : ""}<span>🌙</span><b>Moon Diary</b><small>${save.story}/${STORY.length} stron</small></button>
      <button class="tile-btn chests ${save.chests.length ? "glow" : "locked"}">${save.chests.length ? `<em class="badge">${save.chests.length}</em>` : ""}<span>🎁</span><b>Chests</b><small>${save.chests.length ? "Otwórz!" : "Wygrywaj z bossami"}</small></button>
    </div>
  </div>`);
  app.append(el);
  const $ = (s) => el.querySelector(s);
  $(".home-cat").onclick = () => { sfx.perk(); $(".home-cat").classList.remove("pet"); void $(".home-cat").offsetWidth; $(".home-cat").classList.add("pet"); };
  $(".play").onclick = () => play("tower");
  $(".shadow").onclick = () => (shadows >= 3 ? play("shadow") : toast("Cienie pojawiają się, gdy coś zapomnisz albo się pomylisz. Na razie czysto! ✨"));
  $(".shop").onclick = shop; $(".talents").onclick = talents; $(".wardrobe").onclick = wardrobe;
  $(".album").onclick = album; $(".story").onclick = story; $(".chests").onclick = () => (save.chests.length ? chests() : toast("Skrzynie dostajesz za bossów, serie dni i co 5 leveli."));
  $(".weekly").onclick = weekly; $(".set").onclick = settings;
  // boss tygodnia — postęp
  weeklyStatus(save).then((w) => { const p = Math.min(100, Math.round((w.total / w.hp) * 100)); const c = el.querySelector(".wk"); if (c) c.textContent = p >= 100 ? (save.weekly.claimed.includes(w.week) ? "Pokonany ✔" : "Odbierz nagrodę! 🎁") : `${p}% pokonany`; });
  // duet
  if (cloud.enabled() && profile.duo) cloud.loadPublic(profile.duo).then((p) => {
    if (!p || !p.name) return;
    const slot = el.querySelector(".duo-slot"); if (!slot) return;
    const ago = p.updated_at ? Math.round((Date.now() - new Date(p.updated_at)) / 3600000) : null;
    slot.innerHTML = `<div class="duo"><div class="duo-cat">${catSVG(p.skin, p.hat)}</div><div><b>${esc(p.name)}</b><small>Twój duet · piętro ${p.best || 0}${ago != null ? ` · ${ago < 24 ? "grał(a) dziś" : `${Math.round(ago / 24)} dni temu`}` : ""}</small></div></div>`;
  }).catch(() => {});
  if (first) toast(`Cześć, ${esc(save.catName)}! Kliknij „Climb the Tower”, żeby zacząć. 🐾`);
}

async function play(mode) {
  sfx.tap();
  const res = await runGame(app, save, profile, mode);
  if (res.empty) { toast("Brak zadań — powiedz nauczycielowi! 🙂"); return home(); }
  results(res);
}

function results(r) {
  const won = r.won;
  won ? sfx.win() : sfx.lose();
  const acc = r.answers ? Math.round((r.correct / r.answers) * 100) : 0;
  const msgs = [];
  if (r.lvlAfter > r.lvlBefore) msgs.push(`⭐ Level ${r.lvlAfter}! +${r.lvlAfter - r.lvlBefore} punkt talentu`);
  if (r.chest) msgs.push(`🎁 ${CHESTS[r.chest].name}!`);
  if (r.story) msgs.push(`🌙 Nowa strona Dziennika Księżyca!`);
  for (const e of r.streakEvents) {
    if (e.type === "freeFreeze") msgs.push("🧊 Dostajesz Zamrożenie serii (chroni serię, gdy opuścisz 1 dzień)");
    if (e.type === "freezeUsed") msgs.push("🧊 Zamrożenie uratowało Twoją serię!");
    if (e.type === "streakChest") msgs.push(`🔥 ${e.n} dni z rzędu! Srebrna skrzynia!`);
    if (e.type === "streakLost") msgs.push(`Seria zaczyna się od nowa. Tym razem dalej! 💪`);
  }
  if (r.mult < 1) msgs.push(`Nagrody x${r.mult} (dziś już grałeś dużo — Jaskinia Cieni zawsze daje pełne!)`);
  app.innerHTML = "";
  const el = h(`<div class="screen results ${won ? "win" : "lose"}">
    <div class="res-cat">${catSVG(save.equipped.skin, save.equipped.hat, { cls: won ? "jump" : "", sad: !won && !r.quit })}</div>
    <h2>${r.mode === "shadow" ? (won ? "Shadows cleared! ✨" : "The shadows won… this time") : won ? "Boss defeated! 👑" : r.quit ? "See you soon!" : "Your cat needs a nap 😴"}</h2>
    <p class="sub">${r.mode === "shadow" ? "" : won ? `Nowy checkpoint: piętro ${save.tower.checkpoint + 1}` : `Doszedłeś do piętra ${r.floor}. Spróbuj jeszcze raz!`}</p>
    <div class="stats">
      <div><b>+${r.coins}</b><small>🪙 monet</small></div>
      <div><b>+${r.xp}</b><small>⭐ XP</small></div>
      <div><b>${r.bestCombo}</b><small>🔥 combo</small></div>
      <div><b>${acc}%</b><small>🎯 celność</small></div>
    </div>
    ${msgs.map((m) => `<div class="msg pop">${m}</div>`).join("")}
    <div class="row">
      ${r.chest ? `<button class="btn big go open">Otwórz skrzynię 🎁</button>` : ""}
      <button class="btn big ${r.chest ? "ghost" : "go"} again">Jeszcze raz ▶</button>
      <button class="btn ghost back">🏠</button>
    </div></div>`);
  app.append(el);
  el.querySelector(".again").onclick = () => play(r.mode);
  el.querySelector(".back").onclick = () => home();
  if (r.chest) el.querySelector(".open").onclick = chests;
  if (r.lvlAfter > r.lvlBefore) setTimeout(sfx.level, 600);
}

// ---------- podstrony ----------
function page(title, body, back = home) {
  app.innerHTML = "";
  const el = h(`<div class="screen page"><div class="page-head"><button class="btn ghost icon back">←</button><h2>${title}</h2><div class="pill coins">🪙 <span class="cv">${save.coins}</span></div></div><div class="page-body"></div></div>`);
  el.querySelector(".page-body").append(...(Array.isArray(body) ? body : [body]));
  el.querySelector(".back").onclick = () => { sfx.tap(); back(); };
  app.append(el);
  return el;
}
const refreshCoins = (el) => { const c = el.querySelector(".cv"); if (c) c.textContent = save.coins; };

function shop() {
  const items = shopItems(save);
  const wrap = h(`<div></div>`);
  if (items.event) wrap.append(h(`<div class="event-banner">${esc(items.event.banner)} — tylko do ${items.event.to.split("-").reverse().join(".")}!</div>`));
  const grid = h(`<div class="shop-grid"></div>`);
  const all = [...items.skins, ...items.hats].sort((a, b) => (a.owned - b.owned) || (a.price - b.price));
  for (const it of all) {
    const card = h(`<div class="shop-item ${it.owned ? "owned" : ""}" style="--r:${RARITY[it.rarity].color}">
      <div class="si-art">${it.kind === "skin" ? catSVG(it.id, "none") : catSVG(save.equipped.skin, it.id)}</div>
      <b>${esc(it.name)}</b><small class="rar">${RARITY[it.rarity].name}${it.source.startsWith("event") ? " · 🎃 event" : ""}</small>
      <button class="btn ${it.owned ? "ghost" : "go"}">${it.owned ? "Masz ✔" : `🪙 ${it.price}`}</button></div>`);
    card.querySelector("button").onclick = () => {
      if (it.owned) return;
      if (save.coins < it.price) { toast(`Brakuje ${it.price - save.coins} 🪙`); return; }
      buy(save, it); sfx.chest();
      if (it.kind === "skin") save.equipped.skin = it.id; else save.equipped.hat = it.id;
      persist(); toast(`Nowe! ${it.name} założone ✨`); shop();
    };
    grid.append(card);
  }
  const extra = h(`<div class="shop-extra">
    <div class="shop-item"><div class="si-art big-emoji">🧊</div><b>Zamrożenie serii</b><small>Chroni serię, gdy opuścisz 1 dzień (max ${ECON.freezeMax}). Masz: ${save.streak.freezes}</small><button class="btn go fr">🪙 ${ECON.freezePrice}</button></div>
    <div class="shop-item"><div class="si-art big-emoji">🧰</div><b>Drewniana skrzynia</b><small>Monety albo niespodzianka</small><button class="btn go ch">🪙 ${ECON.chestPrice}</button></div></div>`);
  extra.querySelector(".fr").onclick = () => {
    if (save.streak.freezes >= ECON.freezeMax) return toast("Masz już maksimum 🧊");
    if (save.coins < ECON.freezePrice) return toast("Za mało monet");
    save.coins -= ECON.freezePrice; save.streak.freezes++; persist(); sfx.coin(); shop();
  };
  extra.querySelector(".ch").onclick = () => {
    if (save.coins < ECON.chestPrice) return toast("Za mało monet");
    save.coins -= ECON.chestPrice; save.chests.push("wood"); persist(); chests();
  };
  wrap.append(extra, grid);
  page("🛒 Shop", wrap);
}

function wardrobe() {
  const wrap = h(`<div class="wardrobe"><div class="w-preview">${catSVG(save.equipped.skin, save.equipped.hat, { cls: "idle" })}</div><h3>Skórki</h3><div class="w-grid skins"></div><h3>Czapki</h3><div class="w-grid hats"></div><p class="sub">Więcej w Sklepie, skrzyniach i za Bossa Tygodnia 👹</p></div>`);
  const sk = SKINS.filter((s) => save.owned.skins.includes(s.id));
  const ht = HATS.filter((s) => save.owned.hats.includes(s.id));
  for (const s of sk) {
    const b = h(`<button class="w-item ${save.equipped.skin === s.id ? "on" : ""}" style="--r:${RARITY[s.rarity].color}">${catSVG(s.id, "none")}<small>${esc(s.name)}</small></button>`);
    b.onclick = () => { save.equipped.skin = s.id; persist(); sfx.tap(); wardrobe(); };
    wrap.querySelector(".skins").append(b);
  }
  for (const s of ht) {
    const b = h(`<button class="w-item ${save.equipped.hat === s.id ? "on" : ""}" style="--r:${RARITY[s.rarity].color}">${catSVG(save.equipped.skin, s.id)}<small>${esc(s.name)}</small></button>`);
    b.onclick = () => { save.equipped.hat = s.id; persist(); sfx.tap(); wardrobe(); };
    wrap.querySelector(".hats").append(b);
  }
  page("👕 Wardrobe", wrap);
}

function talents() {
  const pts = talentPoints(save);
  const wrap = h(`<div class="talents"><p class="sub">Punkty: <b>${pts}</b> · 1 punkt za każdy level</p><div class="trees"></div></div>`);
  for (const [tid, tree] of Object.entries(TREES)) {
    const col = h(`<div class="tree" style="--t:${tree.color}"><h3>${tree.name}</h3></div>`);
    for (const t of TALENTS.filter((x) => x.tree === tid)) {
      const r = tr(save, t.id);
      const can = canRaise(save, t, pts);
      const locked = t.req && tr(save, t.req) < 1;
      const n = h(`<div class="talent ${locked ? "locked" : ""} ${r ? "has" : ""}">
        <div class="ti">${t.icon}</div><div class="tt"><b>${esc(t.name)}</b><small>${esc(t.desc(Math.min(t.max, r + 1)))}</small>
        <div class="pips">${Array.from({ length: t.max }, (_, i) => `<i class="${i < r ? "on" : ""}"></i>`).join("")}</div></div>
        <button class="btn ${can ? "go" : "ghost"}" ${can ? "" : "disabled"}>${r >= t.max ? "MAX" : "+"}</button></div>`);
      n.querySelector("button").onclick = () => { if (!canRaise(save, t, talentPoints(save))) return; save.talents[t.id] = r + 1; persist(); sfx.level(); talents(); };
      col.append(n);
    }
    wrap.querySelector(".trees").append(col);
  }
  page("⭐ Talents", wrap);
}

function album() {
  const skills = [...activeSkills(save, profile).keys(), ...Object.keys(save.skills)].filter((v, i, a) => a.indexOf(v) === i);
  const wrap = h(`<div class="album"><div class="album-tabs"></div><div class="album-grid"></div><p class="sub legend">Szara = widziana · <span style="color:#cd7f32">Brąz</span> · <span style="color:#c0c0c0">Srebro</span> · <span style="color:#ffcf3f">Złoto</span> = pamiętasz na długo</p></div>`);
  const show = (sk) => {
    wrap.querySelectorAll(".album-tabs button").forEach((b) => b.classList.toggle("on", b.dataset.s === sk));
    const g = wrap.querySelector(".album-grid"); g.innerHTML = "";
    for (const key of itemsForSkill(sk)) {
      const tier = cardTier(save.srs[key]);
      const w = key.startsWith("v:") ? wordOf(key) : null;
      const label = w ? w.en : exampleFor(key);
      const art = w ? (w.img.startsWith("color:") ? `<span class="img swatch" style="--c:${w.img.slice(6)}"></span>` : w.img.startsWith("num:") ? `<span class="img num">${w.img.slice(4)}</span>` : w.img) : "📜";
      const c = h(`<button class="acard t${tier} ${w ? "" : "gram"}">${tier ? `<div class="aart">${art}</div><b>${esc(label)}</b>` : `<div class="aart">❔</div><b>???</b>`}</button>`);
      if (tier && w) c.onclick = () => speak(w.en);
      g.append(c);
    }
  };
  skills.sort((a, b) => itemsForSkill(b).filter((k) => save.srs[k]).length - itemsForSkill(a).filter((k) => save.srs[k]).length);
  for (const sk of skills) {
    const total = itemsForSkill(sk).length; if (!total) continue;
    const gold = itemsForSkill(sk).filter((k) => cardTier(save.srs[k]) === 4).length;
    const b = h(`<button data-s="${sk}">${esc(skillName(sk))} <small>${gold}/${total}</small></button>`);
    b.onclick = () => show(sk);
    wrap.querySelector(".album-tabs").append(b);
  }
  page("📖 Album", wrap);
  if (skills.length) show(skills[0]);
}

function exampleFor(key) {
  const [, sk, p] = key.split(":");
  try { return SKILLS[sk].patterns[p](rngFrom(key)).full; } catch { return p; }
}

function story() {
  const wrap = h(`<div class="story"><p class="sub">Za każdego pokonanego bossa nowa strona. 🌙</p></div>`);
  STORY.forEach((p, i) => {
    const open = i < save.story;
    const el = h(`<div class="page-card ${open ? "" : "locked"}"><div class="pn">${i + 1}</div><div>${open ? `<p class="en">${esc(p.en)} <button class="spk">🔊</button></p><p class="pl hidden">${esc(p.pl)}</p><button class="btn ghost sm tpl">PL</button>` : `<p class="en">🔒 Pokonaj kolejnego bossa</p>`}</div></div>`);
    if (open) { el.querySelector(".spk").onclick = () => speak(p.en, 0.8); el.querySelector(".tpl").onclick = () => el.querySelector(".pl").classList.toggle("hidden"); }
    wrap.append(el);
  });
  page("🌙 Moon Diary", wrap);
}

async function chests() {
  if (!save.chests.length) return home();
  const type = save.chests[0];
  const c = CHESTS[type];
  const wrap = h(`<div class="chest-open"><div class="chest-big wobble">${c.icon}</div><p>${esc(c.name)}</p><button class="btn big go">Otwórz!</button><p class="sub">Zostało: ${save.chests.length}</p></div>`);
  const el = page("🎁 Chests", wrap);
  wrap.querySelector(".go").onclick = async () => {
    save.chests.shift();
    const res = openChest(save, type);
    persist(); sfx.chest();
    wrap.querySelector(".chest-big").className = "chest-big burst";
    await sleep(500);
    let inner;
    if (res.kind === "coins") inner = `<div class="loot"><div class="big-emoji">🪙</div><h3>+${res.amount} monet</h3>${res.dup ? `<small>(miałeś już wszystko z tej rzadkości)</small>` : ""}</div>`;
    else inner = `<div class="loot" style="--r:${RARITY[res.item.rarity].color}"><div class="loot-art">${res.kind === "skin" ? catSVG(res.item.id, "none", { cls: "idle" }) : catSVG(save.equipped.skin, res.item.id, { cls: "idle" })}</div><h3>${esc(res.item.name)}</h3><small class="rar">${RARITY[res.item.rarity].name}</small><button class="btn go wear">Załóż</button></div>`;
    wrap.innerHTML = inner + `<div class="row"><button class="btn big ${save.chests.length ? "go" : "ghost"} nxt">${save.chests.length ? `Następna (${save.chests.length}) 🎁` : "Dalej"}</button></div>`;
    refreshCoins(el);
    const wear = wrap.querySelector(".wear");
    if (wear) wear.onclick = () => { if (res.kind === "skin") save.equipped.skin = res.item.id; else save.equipped.hat = res.item.id; persist(); wear.textContent = "Założone ✔"; sfx.tap(); };
    wrap.querySelector(".nxt").onclick = () => (save.chests.length ? chests() : home());
  };
}

async function weekly() {
  const w = await weeklyStatus(save);
  const info = weeklyBossInfo(w.week);
  const m = makeMonster(info.seed, ["#ff5d5d", "#7a3cff", "#ff8a1f", "#38e8ff", "#8fe04a"], true);
  const p = Math.min(1, w.total / w.hp);
  const done = p >= 1, claimed = save.weekly.claimed.includes(w.week);
  const queue = SKINS.filter((s) => s.source === "weekly").sort((a, b) => a.order - b.order);
  const nextSkin = queue.find((s) => !save.owned.skins.includes(s.id));
  const wrap = h(`<div class="weekly">
    <div class="wb-mon ${done ? "defeated-soft" : ""}">${monsterSVG(m)}</div>
    <h3>${esc(m.name)}</h3>
    <div class="hpbar big"><i style="width:${(1 - p) * 100}%"></i></div>
    <p class="sub">${done ? "Pokonany! 🎉" : `Zostało ${Math.max(0, w.hp - w.total)} HP`}</p>
    <p>${w.cloud ? "Wszyscy gracze walczą z nim razem. Każda dobra odpowiedź w Wieży to cios!" : "Każda dobra odpowiedź w Wieży to cios!"} Nowy boss w każdy poniedziałek.</p>
    ${nextSkin ? `<div class="reward-preview"><div>${catSVG(nextSkin.id, "none")}</div><div><b>Nagroda: ${done && !claimed ? esc(nextSkin.name) : "tajemnicza skórka ❔"}</b><small>+100 🪙</small></div></div>` : `<div class="reward-preview"><b>Nagroda: Złota skrzynia 👑 + 100 🪙</b></div>`}
    ${done && !claimed ? `<button class="btn big go claim">Odbierz nagrodę 🎁</button>` : ""}
  </div>`);
  if (nextSkin && !(done && !claimed)) wrap.querySelector(".reward-preview > div").style.filter = "brightness(0) opacity(.5)";
  page("👹 Weekly Boss", wrap);
  const cl = wrap.querySelector(".claim");
  if (cl) cl.onclick = () => {
    const r = weeklyReward(save); save.weekly.claimed.push(w.week); persist(true); sfx.chest();
    if (r.skin) { save.equipped.skin = r.skin.id; toast(`Nowa skórka: ${r.skin.name}! ✨`); } else toast("Złota skrzynia! 👑");
    weekly();
  };
}

function settings() {
  const s = save.settings;
  const wrap = h(`<div class="settings">
    <label class="sw"><input type="checkbox" class="v" ${s.voice ? "checked" : ""}/> 🗣️ Lektor czyta zadania na głos</label>
    <label class="sw"><input type="checkbox" class="pl" ${s.pl !== false ? "checked" : ""}/> 🇵🇱 Polskie podpowiedzi w poleceniach</label>
    <label class="sw"><input type="checkbox" class="sfx" ${s.sfx ? "checked" : ""}/> 🔔 Dźwięki</label>
    <label class="sw"><input type="checkbox" class="mus" ${s.music ? "checked" : ""}/> 🎵 Muzyka</label>
    <label>Imię kota <input class="cn" value="${esc(save.catName)}" maxlength="14"/></label>
    <p class="sub">Grasz jako: <b>${esc(loginName)}</b> ${cloud.enabled() ? "· zapis w chmurze ☁️" : "· zapis na tym urządzeniu"}</p>
    <div class="row"><button class="btn ghost logout">Wyloguj</button><button class="btn ghost teacher">👩‍🏫 Dla nauczyciela</button></div>
    ${profile.tester ? `<div class="card"><b>🧪 Konto testowe</b><div class="row"><button class="btn ghost t-coins">+1000 🪙</button><button class="btn ghost t-xp">+5 leveli</button><button class="btn ghost t-chest">+3 skrzynie</button><button class="btn danger t-reset">Reset od zera</button></div></div>` : ""}
  </div>`);
  const upd = () => { s.voice = wrap.querySelector(".v").checked; s.pl = wrap.querySelector(".pl").checked; s.sfx = wrap.querySelector(".sfx").checked; s.music = wrap.querySelector(".mus").checked; const n = wrap.querySelector(".cn").value.trim(); if (n) save.catName = n; setAudio(s); persist(); };
  wrap.querySelectorAll("input").forEach((i) => (i.onchange = upd));
  if (profile.tester) {
    wrap.querySelector(".t-coins").onclick = () => { save.coins += 1000; persist(); toast("+1000 🪙"); };
    wrap.querySelector(".t-xp").onclick = () => { const l = levelInfo(save.xp).lvl; for (let i = 0; i < 5; i++) save.xp += ECON.levelXp(l + i); persist(); toast("+5 leveli ⭐"); };
    wrap.querySelector(".t-chest").onclick = () => { save.chests.push("wood", "silver", "gold"); persist(); toast("+3 skrzynie 🎁"); };
    wrap.querySelector(".t-reset").onclick = () => { const id = save.id; Object.assign(save, freshSave(id, profile), { rev: save.rev }); persist(true); toast("Wyczyszczone"); nameCat(); };
  }
  wrap.querySelector(".logout").onclick = () => { try { localStorage.removeItem("ninelives:last"); } catch {} showLogin(); };
  wrap.querySelector(".teacher").onclick = () => {
    const txt = reportText(save, profile, loginName);
    const r = h(`<div class="report"><textarea readonly>${esc(txt)}</textarea><div class="row"><button class="btn go cp">Kopiuj raport</button><button class="btn ghost ex">Kopiuj kod zapisu</button></div></div>`);
    r.querySelector(".cp").onclick = () => { navigator.clipboard?.writeText(txt); toast("Skopiowane ✔"); };
    r.querySelector(".ex").onclick = () => { navigator.clipboard?.writeText(exportCode()); toast("Kod zapisu skopiowany ✔"); };
    wrap.append(r);
  };
  page("⚙️ Ustawienia", wrap);
}

export function toast(msg) {
  const t = h(`<div class="toast">${msg}</div>`); document.body.append(t);
  setTimeout(() => t.classList.add("out"), 2600); setTimeout(() => t.remove(), 3100);
}

// odblokuj audio przy pierwszym dotknięciu (wymóg przeglądarek)
document.addEventListener("pointerdown", () => { try { speechSynthesis.getVoices(); } catch {} }, { once: true });
window.addEventListener("beforeunload", () => persist(true));
document.addEventListener("visibilitychange", () => { if (document.hidden && save) persist(true); });
boot();
