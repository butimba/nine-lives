// NAGRODY PO BIEGU (przeniesione z v1 battle.js).
// run.js zwraca RunStats z coins/xp JUŻ pomnożonymi przez lives.rewardMult —
// tutaj dokładamy tylko talenty/perki, zapisujemy postęp wieży, skrzynie, fabułę, serię dni.
import { ECON, STORY, POWERS, MAX_EQUIPPED_POWERS } from "../data/progression.js";
import { tr, chestForFloor, touchStreak, ensureWeek } from "./meta.js";
import { persist, levelInfo, getSave } from "./state.js";
import { gainLife, sleepyTier, rewardMult } from "./lives.js";
import { today } from "./util.js";
import * as cloud from "./cloud.js";

const num = (v) => (typeof v === "number" && isFinite(v) ? v : 0);

// Moce: odblokuj wszystkie z unlockLevel <= level (idempotentne; H może wołać przy logowaniu).
// Jeśli gracz ma wolny slot (equipped < 2), nowa moc zakłada się sama, żeby od razu była w biegu.
// -> lista NOWO odblokowanych obiektów POWERS.
export function syncPowers(save) {
  save.powers ??= { owned: [], equipped: [] };
  const pw = save.powers;
  if (!Array.isArray(pw.owned)) pw.owned = [];
  if (!Array.isArray(pw.equipped)) pw.equipped = [];
  const lvl = levelInfo(save.xp || 0).lvl;
  const fresh = [];
  for (const p of POWERS) if (lvl >= p.unlockLevel && !pw.owned.includes(p.id)) { pw.owned.push(p.id); fresh.push(p); }
  pw.equipped = pw.equipped.filter((id, i, a) => pw.owned.includes(id) && a.indexOf(id) === i).slice(0, MAX_EQUIPPED_POWERS);
  for (const p of fresh) if (pw.equipped.length < MAX_EQUIPPED_POWERS) pw.equipped.push(p.id);
  return fresh;
}

export function applyRunResults(save, stats = {}) {
  const mode = stats.mode === "shadow" ? "shadow" : "tower";
  const isShadow = mode === "shadow";
  const perks = Array.isArray(stats.perks) ? stats.perks : [];
  const has = (id) => perks.includes(id) || perks.some((p) => p && p.id === id);

  // --- rybki i XP (talent lucky, perki bell / magnet) ---
  const coinMult = (1 + tr(save, "lucky") * ECON.luckyCoin) * (has("bell") ? ECON.bellCoin : 1);
  const xpMult = has("magnet") ? ECON.magnetXp : 1;
  const coins = Math.max(0, Math.round(num(stats.coins) * coinMult));
  const xp = Math.max(0, Math.round(num(stats.xp) * xpMult));
  const lvlBefore = levelInfo(save.xp).lvl;
  save.coins += coins; save.xp += xp;
  const lvlAfter = levelInfo(save.xp).lvl;
  const levelChests = [];
  for (let l = lvlBefore + 1; l <= lvlAfter; l++) if (l % 5 === 0) { const c = l % 10 === 0 ? "silver" : "wood"; save.chests.push(c); levelChests.push(c); }
  const newPowers = syncPowers(save);
  // linie do ekranu wyników (H: msgs.push(...r.extras)) — { cls, icon (ICONS key), text }
  const extras = [];
  for (const p of newPowers) extras.push({ cls: "ok", icon: p.icon, text: `New power: ${p.name}!`, power: p.id });
  // skrzynie z wydarzeń biegu (mimik)
  const eventChests = (Array.isArray(stats.eventChests) ? stats.eventChests : []).filter((c) => typeof c === "string");
  for (const c of eventChests) { save.chests.push(c); extras.push({ cls: "ok", icon: "chest", text: "Mimic prize: a chest!", chest: c }); }
  for (const e of Array.isArray(stats.events) ? stats.events : []) {
    if (e === "golden") extras.push({ cls: "ok", icon: "coin", text: "You caught the Golden Monster!" });
    if (e === "secret") extras.push({ cls: "ok", icon: "star", text: "You found a secret floor!" });
  }

  // --- wieża: checkpoint / rekord / bossowie / skrzynia / fabuła ---
  let chest = null, story = null, napLives = 0;
  const startFloor = num(stats.startFloor) || (save.tower.checkpoint + 1);
  if (!isShadow) {
    if (save.daily.date !== today()) { save.daily.date = today(); save.daily.runs = 0; save.daily.ms = 0; }
    save.daily.runs = (save.daily.runs || 0) + 1;
    if (stats.bossBeaten) {
      save.tower.checkpoint = Math.max(save.tower.checkpoint, startFloor + ECON.floorsPerStage - 1);
      save.tower.bossesBeaten++;
      chest = chestForFloor(save.tower.checkpoint, save);
      save.chests.push(chest);
      if (save.story < STORY.length && save.tower.bossesBeaten > save.story) { save.story++; story = save.story; }
      // talent Cat Nap: +1 / +2 życia po bossie (decyzja leada #3)
      const n = ECON.catNapLives(tr(save, "cat_nap"));
      for (let i = 0; i < n; i++) gainLife(save, "catnap");
      napLives = n;
    }
    // floorReached = piętro, na którym kot był na końcu biegu (nieukończone, jeśli bez bossa)
    const cleared = stats.bossBeaten ? save.tower.checkpoint : Math.max(0, num(stats.floorReached) - 1);
    save.tower.best = Math.max(save.tower.best, cleared);
  }

  // --- boss tygodnia ---
  const weeklyDmg = Math.max(0, Math.round(num(stats.weeklyDmg)));
  ensureWeek(save);
  save.weekly.dmg += weeklyDmg;

  // --- statystyki (answers/correct liczy engine.record) ---
  save.stats.runs++;
  if (isShadow) save.stats.shadowRuns++;
  save.stats.playMs += Math.max(0, num(stats.ms));

  const streakEvents = num(stats.answers) >= 5 ? touchStreak(save) : [];
  persist(true);
  // wypychamy do chmury tylko aktywny zapis (nie w testach / panelu)
  if (weeklyDmg && getSave() === save && cloud.enabled())
    cloud.weeklyAdd(save.weekly.week, save.id, save.weekly.dmg).catch(() => {});

  return {
    ...stats, mode,
    coins, xp, coinsBase: num(stats.coins), xpBase: num(stats.xp),
    lvlBefore, lvlAfter, levelChests, newPowers: newPowers.map((p) => p.id), extras, eventChests,
    chest, story, napLives, streakEvents,
    sleepy: sleepyTier(save), mult: rewardMult(save, mode),
    won: isShadow ? !stats.quit : !!stats.bossBeaten,
  };
}
