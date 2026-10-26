// BIEG: kot wspina się na wieżę. 5 pięter = etap, na 5. piętrze boss.
import { h, esc, sleep, shuffle, today } from "./util.js";
import { catSVG, makeMonster, monsterSVG, biomeForFloor, rngFrom } from "./art.js";
import { Session, record, isVocab } from "./engine.js";
import { renderTask, renderIntro, answerReveal, sayText } from "./tasks.js";
import { sfx, speak, startMusic, stopMusic } from "./audio.js";
import { PERKS, ECON, STORY } from "../data/progression.js";
import EVENTS, { activeEvent } from "../data/events.js";
import { tr, chestForFloor, touchStreak, ensureWeek } from "./meta.js";
import { persist, levelInfo } from "./state.js";
import * as cloud from "./cloud.js";

export async function runGame(root, save, profile, mode = "tower", opts = {}) {
  const ev = activeEvent(new Date(), EVENTS);
  const isShadow = mode === "shadow";
  if (!isShadow) { if (save.daily.date !== today()) { save.daily.date = today(); save.daily.runs = 0; } save.daily.runs++; }
  const mult = isShadow ? 1 : ECON.dailyMult[Math.min(save.daily.runs - 1, ECON.dailyMult.length - 1)];
  const session = new Session(save, profile, mode);
  if (!session.pool.length) return { empty: true };
  ensureWeek(save);

  const S = {
    maxHearts: 3 + tr(save, "nine_lives"), hearts: 0, combo: 0, bestCombo: 0, coins: 0, xp: 0, perks: [], shield: 0,
    hints: { left: tr(save, "sixth_sense") > 0 ? tr(save, "sixth_sense") + 1 : 1 }, answers: 0, correct: 0, kills: 0, weeklyDmg: 0,
    startFloor: save.tower.checkpoint + 1, floor: save.tower.checkpoint + 1, bossBeaten: false, startedAt: Date.now(), chest: null, story: null,
  };
  S.hearts = S.maxHearts;
  const has = (id) => S.perks.includes(id);
  const lastFloor = isShadow ? 6 : S.startFloor + ECON.floorsPerStage - 1;

  // ---- UI ----
  root.innerHTML = "";
  const biome = isShadow ? { id: "shadow", label: "Shadow Cave", sky: ["#07060f", "#1d1636", "#3b2a66"], ground: "#120f22", deco: "🕯️🌑✨", mon: ["#3b2a66", "#5a3a8a", "#2a2050"] } : biomeForFloor(S.floor);
  const screen = h(`<div class="screen run biome-${biome.id}">
    <div class="hud">
      <div class="hearts"></div>
      <div class="floor-badge"></div>
      <div class="hud-right"><span class="combo"></span><span class="coins-run">🪙 0</span><button class="btn ghost quit" title="Wyjdź">✕</button></div>
    </div>
    <div class="stage">
      <div class="sky"></div><div class="deco"></div><div class="ground"></div>
      <div class="actor cat-wrap"></div>
      <div class="actor mon-wrap"><div class="mon-name"></div><div class="hpbar"><i></i></div><div class="mon"></div></div>
      <div class="fx-layer"></div>
      <div class="perk-strip"></div>
    </div>
    <div class="task-area"></div>
  </div>`);
  root.append(screen);
  const $ = (s) => screen.querySelector(s);
  const taskBox = $(".task-area"), fx = $(".fx-layer");

  const paintBiome = (b) => {
    const [a, m, z] = (ev && !isShadow && b.tier === 0 && Math.random() < 0) ? ev.tint : b.sky;
    $(".sky").style.background = `linear-gradient(180deg, ${a}, ${m} 60%, ${z})`;
    $(".ground").style.background = `linear-gradient(180deg, ${b.ground}, ${shadeDark(b.ground)})`;
    $(".stage").style.filter = b.hue ? `hue-rotate(${b.hue}deg)` : "";
    const decoSet = [...(b.deco || "")].filter((c) => c.trim() && !/[‍️]/.test(c));
    const evDeco = ev && !isShadow ? [...ev.deco].filter((c) => c.trim() && !/[‍️]/.test(c)) : [];
    const items = [...decoSet, ...evDeco];
    $(".deco").innerHTML = items.slice(0, 3).map((e, i) => `<span style="left:${45 + i * 5}%;bottom:${20 + (i % 2) * 3}%;font-size:${16 + (i % 2) * 4}px">${e}</span>`).join("")
      + items.slice(3, 8).map((e, i) => `<span style="left:${8 + i * 19}%;top:${6 + ((i * 13) % 22)}%;font-size:${14 + (i % 3) * 3}px;opacity:.45;animation-delay:${i * 0.6}s">${e}</span>`).join("")
      + evDeco.slice(0, 2).map((e, i) => `<span class="flyer" style="top:${10 + i * 12}%;animation-delay:${i * 5}s">${e}</span>`).join("")
      + Array.from({ length: 14 }, (_, i) => `<i class="star" style="left:${(i * 71) % 100}%;top:${(i * 37) % 45}%;animation-delay:${i * 0.3}s"></i>`).join("");
  };
  paintBiome(biome);
  $(".cat-wrap").innerHTML = catSVG(save.equipped.skin, save.equipped.hat, { cls: "idle" });

  const drawHud = () => {
    $(".hearts").innerHTML = Array.from({ length: S.maxHearts }, (_, i) => `<span class="heart ${i < S.hearts ? "" : "empty"}">${i < S.hearts ? "❤️" : "🖤"}</span>`).join("") + (S.shield ? `<span class="heart">🫧</span>` : "");
    $(".floor-badge").innerHTML = isShadow ? `🌑 Shadow Cave` : `<b>Floor ${S.floor}</b><small>${esc(biomeForFloor(S.floor).label)}</small>`;
    $(".combo").textContent = S.combo >= 2 ? `🔥x${S.combo}` : "";
    $(".coins-run").textContent = `🪙 ${Math.round(S.coins)}`;
    $(".perk-strip").innerHTML = S.perks.map((p) => `<span title="${esc(PERKS.find((x) => x.id === p).name)}">${PERKS.find((x) => x.id === p).icon}</span>`).join("");
  };
  const floatText = (txt, cls, side = "mon") => {
    const el = h(`<div class="float ${cls} ${side}">${txt}</div>`); fx.append(el); setTimeout(() => el.remove(), 1100);
  };
  const burst = (side, color) => {
    for (let i = 0; i < 10; i++) {
      const p = h(`<i class="spark ${side}" style="--dx:${(Math.random() - 0.5) * 160}px;--dy:${-Math.random() * 120 - 20}px;background:${color}"></i>`);
      fx.append(p); setTimeout(() => p.remove(), 700);
    }
  };
  let quit = false;
  const taskCtx = { hints: null, showPl: save.settings.pl !== false };
  $(".quit").onclick = () => {
    const m = h(`<div class="modal"><div class="card pop"><p>Wyjść z biegu?<br><small>Zebrane monety zostaną.</small></p><div class="row"><button class="btn ghost no">Gram dalej</button><button class="btn danger yes">Wyjdź</button></div></div></div>`);
    screen.append(m);
    m.querySelector(".no").onclick = () => m.remove();
    m.querySelector(".yes").onclick = () => { m.remove(); quit = true; taskCtx.abort && taskCtx.abort(); };
  };

  // ---- potwór ----
  let mon, monHp, monMax, firstHitOnFloor;
  const spawn = (floor) => {
    const b = isShadow ? biome : biomeForFloor(floor);
    const boss = !isShadow && floor % ECON.floorsPerStage === 0;
    const pal = ev && !isShadow && Math.random() < 0.5 ? ev.monTint : b.mon;
    mon = makeMonster(`${save.id}-${floor}-${S.startedAt}`, pal, boss, isShadow ? "shadow" : "normal");
    monMax = monHp = isShadow ? 1 : boss ? ECON.bossHp(floor) : ECON.monsterHp(floor);
    firstHitOnFloor = true;
    $(".mon").innerHTML = monsterSVG(mon);
    $(".mon-name").innerHTML = `${boss ? "👑 " : ""}${esc(mon.name)}`;
    $(".mon-wrap").className = `actor mon-wrap enter ${boss ? "is-boss" : ""}`;
    drawHp();
    if (boss) { startMusic("boss"); floatText("BOSS!", "boss-text", "mid"); }
  };
  const drawHp = () => { $(".hpbar i").style.width = `${(monHp / monMax) * 100}%`; };

  // ---- perki ----
  const choosePerk = async () => {
    const owned = new Set(S.perks);
    const pool = PERKS.filter((p) => p.instant || !owned.has(p.id));
    const rng = Math.random;
    const choice = [];
    while (choice.length < 3 && pool.length) {
      const tot = pool.reduce((a, p) => a + p.w, 0); let r = rng() * tot;
      const i = pool.findIndex((p) => (r -= p.w) <= 0); choice.push(pool.splice(i < 0 ? 0 : i, 1)[0]);
    }
    taskBox.innerHTML = "";
    const card = h(`<div class="card perk-pick pop"><div class="task-title">Choose a power! <span class="task-pl">Wybierz moc na ten bieg</span></div><div class="perks"></div></div>`);
    taskBox.append(card);
    await new Promise((res) => {
      choice.forEach((p) => {
        const b = h(`<button class="perk"><span class="pi">${p.icon}</span><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></button>`);
        b.onclick = () => {
          sfx.perk();
          if (p.id === "catnip") S.hearts = Math.min(S.maxHearts, S.hearts + 1);
          else if (p.id === "bubble") S.shield++;
          else if (p.id === "big_heart") { S.maxHearts++; S.hearts = Math.min(S.maxHearts, S.hearts + 1); }
          else S.perks.push(p.id);
          drawHud(); res();
        };
        card.querySelector(".perks").append(b);
      });
    });
  };

  // ---- pętla ----
  startMusic(isShadow ? "shadow" : "tower");
  drawHud();
  let shadowMonsters = isShadow ? Math.min(6, Math.max(3, session.pool.length)) : 0;
  const totalFloors = isShadow ? shadowMonsters : ECON.floorsPerStage;

  outer: for (let f = 0; f < totalFloors; f++) {
    S.floor = isShadow ? f + 1 : S.startFloor + f;
    if (!isShadow && f > 0 && biomeForFloor(S.floor).id !== biomeForFloor(S.floor - 1).id) paintBiome(biomeForFloor(S.floor));
    spawn(S.floor);
    drawHud();
    await sleep(450);
    while (monHp > 0) {
      if (quit) break outer;
      const task = session.next();
      if (!task) break outer;
      if (task.intro) await renderIntro(task, taskBox);
      taskCtx.hints = S.hints;
      const res = await renderTask(task, taskBox, taskCtx);
      if (quit) break outer;
      S.answers++;
      record(save, task, res.ok, res.ms, res.tag, { hinted: res.hinted, shadowMode: isShadow });
      if (res.ok) {
        S.correct++; S.combo++; S.bestCombo = Math.max(S.bestCombo, S.combo);
        const quick = res.ms < 700 && !["match"].includes(task.type);
        let dmg = 1, crit = false;
        if (!quick && !res.hinted) {
          const critCh = 0.05 + tr(save, "sharp_claws") * 0.06 + (has("clover") ? 0.15 : 0);
          if (Math.random() < critCh) { crit = true; dmg = 2 + (has("fishbone") ? 1 : 0); }
          const cr = tr(save, "combo"); if (cr && S.combo >= Math.max(2, 5 - cr)) dmg += 1;
          if (has("fire_combo") && S.combo >= 3) dmg *= 2;
          if (has("lightning") && res.ms < 5000 && !["type", "spell", "build", "match"].includes(task.type)) dmg += 1;
          if (firstHitOnFloor && tr(save, "pounce")) dmg *= tr(save, "pounce") + 1;
        }
        firstHitOnFloor = false;
        S.weeklyDmg += dmg;
        const coinGain = ECON.coinPerCorrect;
        S.coins += coinGain; S.xp += ECON.xpPerCorrect;
        sfx.correct();
        await sleep(task.type === "match" ? 250 : 380);
        $(".cat-wrap").classList.remove("attack"); void $(".cat-wrap").offsetWidth; $(".cat-wrap").classList.add("attack");
        await sleep(200);
        monHp = Math.max(0, monHp - dmg); drawHp();
        $(".mon-wrap").classList.remove("hurt"); void $(".mon-wrap").offsetWidth; $(".mon-wrap").classList.add("hurt");
        crit ? sfx.crit() : sfx.hit();
        floatText(crit ? `CRIT -${dmg}!` : `-${dmg}`, crit ? "crit" : "dmg");
        burst("mon", crit ? "#ffd23f" : "#fff");
        if (S.combo === 3 || S.combo === 6 || S.combo === 10) floatText(`🔥 Combo x${S.combo}!`, "combo-t", "mid");
        drawHud();
        await sleep(450);
      } else {
        S.combo = 0; S.xp += ECON.xpPerTry;
        session.failed(task.key);
        sfx.wrong();
        // potwór atakuje
        $(".mon-wrap").classList.remove("lunge"); void $(".mon-wrap").offsetWidth; $(".mon-wrap").classList.add("lunge");
        await sleep(260);
        let blocked = false;
        if (S.shield) { S.shield--; blocked = true; floatText("🫧 Blocked!", "block", "cat"); }
        else if (Math.random() < tr(save, "thick_fur") * 0.1) { blocked = true; floatText("🛡️ Blocked!", "block", "cat"); }
        else { S.hearts--; sfx.hurt(); floatText("-❤️", "hurt-t", "cat"); $(".cat-wrap").classList.remove("hurt"); void $(".cat-wrap").offsetWidth; $(".cat-wrap").classList.add("hurt"); }
        drawHud();
        // pokaż poprawną odpowiedź — dziecko musi kliknąć dalej
        if (task.kind === "vocab") speak(task.word.en);
        const fb = h(`<div class="card feedback pop"><div class="fb-title">Not quite! <span class="task-pl">Tak powinno być:</span></div>${answerReveal(task)}<button class="btn big go">OK →</button></div>`);
        taskBox.innerHTML = ""; taskBox.append(fb);
        fb.querySelector(".reveal").insertAdjacentHTML("beforeend", ` <button class="spk" data-say="${esc(sayText(task))}">🔊</button>`);
        fb.querySelector(".spk").onclick = (e) => speak(e.target.dataset.say);
        await new Promise((r) => (fb.querySelector(".go").onclick = () => { sfx.tap(); r(); }));
        if (S.hearts <= 0) break outer;
      }
    }
    if (monHp <= 0) {
      // potwór pokonany
      S.kills++;
      const boss = mon.boss;
      S.coins += boss ? ECON.coinPerBoss : isShadow ? ECON.coinShadowClear : ECON.coinPerKill;
      if (boss) S.xp += ECON.xpPerBoss;
      $(".mon-wrap").classList.add("defeated");
      sfx.coin(); burst("mon", "#ffd23f");
      floatText(boss ? `👑 +${ECON.coinPerBoss} 🪙` : `+${isShadow ? ECON.coinShadowClear : ECON.coinPerKill} 🪙`, "coin-t");
      drawHud();
      await sleep(boss ? 1100 : 650);
      if (boss) {
        S.bossBeaten = true;
        const nap = tr(save, "cat_nap"); if (nap) S.hearts = Math.min(S.maxHearts, S.hearts + nap);
      }
      if (!isShadow && !boss && (f === 1 || f === 3)) await choosePerk();
    }
  }
  stopMusic();

  // ---- koniec biegu: nagrody ----
  const coinMult = (1 + tr(save, "lucky") * 0.1) * (has("bell") ? 1.5 : 1) * mult;
  const xpMult = has("magnet") ? 1.3 : 1;
  const coins = Math.round(S.coins * coinMult);
  const xp = Math.round(S.xp * xpMult);
  const lvlBefore = levelInfo(save.xp).lvl;
  save.coins += coins; save.xp += xp;
  const lvlAfter = levelInfo(save.xp).lvl;
  for (let l = lvlBefore + 1; l <= lvlAfter; l++) if (l % 5 === 0) save.chests.push(l % 10 === 0 ? "silver" : "wood");
  if (S.bossBeaten && !isShadow) {
    save.tower.checkpoint = S.startFloor + ECON.floorsPerStage - 1;
    save.tower.bossesBeaten++;
    S.chest = chestForFloor(save.tower.checkpoint, save);
    save.chests.push(S.chest);
    if (save.story < STORY.length && save.tower.bossesBeaten > save.story) { save.story++; S.story = save.story; }
  }
  save.tower.best = Math.max(save.tower.best, isShadow ? save.tower.best : S.bossBeaten ? save.tower.checkpoint : S.floor - 1);
  save.weekly.dmg += S.weeklyDmg;
  save.stats.runs++; if (isShadow) save.stats.shadowRuns++;
  save.stats.playMs += Date.now() - S.startedAt;
  const streakEvents = S.answers >= 5 ? touchStreak(save) : [];
  persist(true);
  if (cloud.enabled() && S.weeklyDmg) cloud.weeklyAdd(save.weekly.week, save.id, save.weekly.dmg).catch(() => {});
  return { ...S, coins, xp, mult, lvlBefore, lvlAfter, streakEvents, mode, quit, won: isShadow ? S.hearts > 0 : S.bossBeaten };
}

function shadeDark(hex) {
  const n = parseInt(hex.slice(1), 16); const f = (v) => Math.round(v * 0.6);
  return "#" + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(f).map((v) => v.toString(16).padStart(2, "0")).join("");
}
