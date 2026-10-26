// Meta-gra: skrzynki, sklep, talenty, seria dni, boss tygodnia, duety.
import { SKINS, HATS } from "../data/cosmetics.js";
import { CHESTS, ECON, TALENTS } from "../data/progression.js";
import EVENTS, { activeEvent } from "../data/events.js";
import { today, dayDiff, isoWeek } from "./util.js";
import * as cloud from "./cloud.js";

export const tr = (save, id) => save.talents[id] || 0;

export function shopItems(save, date = new Date()) {
  const ev = activeEvent(date, EVENTS);
  const ok = (it) => !it.retired && it.price && (it.source === "shop" || (ev && it.source === "event:" + ev.id));
  return {
    skins: SKINS.filter(ok).map((s) => ({ ...s, kind: "skin", owned: save.owned.skins.includes(s.id) })),
    hats: HATS.filter(ok).map((s) => ({ ...s, kind: "hat", owned: save.owned.hats.includes(s.id) })),
    event: ev,
  };
}
export function buy(save, item) {
  if (item.owned || save.coins < item.price) return false;
  save.coins -= item.price;
  (item.kind === "skin" ? save.owned.skins : save.owned.hats).push(item.id);
  return true;
}

// ---- skrzynki ----
export function openChest(save, type) {
  const c = CHESTS[type] || CHESTS.wood;
  const luck = tr(save, "treasure") * 8;
  const w = { ...c.rolls };
  if (luck) { w.coins = Math.max(5, w.coins - luck); w.rare += luck * 0.5; w.epic += luck * 0.35; w.legendary += luck * 0.15; }
  let roll = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  let cat = "coins";
  for (const [k, v] of Object.entries(w)) { roll -= v; if (roll <= 0) { cat = k; break; } }
  const coinAmt = { wood: [40, 90], silver: [90, 180], gold: [180, 350] }[type] || [40, 90];
  if (cat !== "coins") {
    const pool = [
      ...SKINS.filter((s) => s.rarity === cat && (s.source === "chest" || s.source === "shop") && !save.owned.skins.includes(s.id)).map((s) => ({ ...s, kind: "skin" })),
      ...HATS.filter((s) => s.rarity === cat && (s.source === "chest" || s.source === "shop") && !save.owned.hats.includes(s.id)).map((s) => ({ ...s, kind: "hat" })),
    ];
    if (pool.length) {
      const it = pool[Math.floor(Math.random() * pool.length)];
      (it.kind === "skin" ? save.owned.skins : save.owned.hats).push(it.id);
      return { kind: it.kind, item: it };
    }
    // wszystko już ma → monety za duplikat
    const bonus = { common: 60, rare: 150, epic: 300, legendary: 600 }[cat] || 60;
    save.coins += bonus;
    return { kind: "coins", amount: bonus, dup: cat };
  }
  const amt = Math.round(coinAmt[0] + Math.random() * (coinAmt[1] - coinAmt[0]));
  save.coins += amt;
  return { kind: "coins", amount: amt };
}
export function chestForFloor(floor, save) {
  const r = Math.random();
  if (floor % 25 === 0) return "gold";
  if (floor >= 30 && r < 0.25) return "gold";
  if (floor >= 10 && r < 0.5) return "silver";
  return r < 0.2 ? "silver" : "wood";
}

// ---- talenty ----
export function canRaise(save, t, points) {
  if (points <= 0) return false;
  if (tr(save, t.id) >= t.max) return false;
  if (t.req && tr(save, t.req) < 1) return false;
  return true;
}

// ---- seria dni (z "zamrożeniem" na 1 dzień, jak w Duolingo) ----
export function touchStreak(save) {
  const d = today();
  const s = save.streak;
  const events = [];
  if (s.last === d) return events;
  if (!s.last) s.count = 1;
  else {
    const gap = dayDiff(s.last, d);
    if (gap === 1) s.count++;
    else if (gap > 1 && s.freezes >= gap - 1) { s.freezes -= gap - 1; s.count++; events.push({ type: "freezeUsed", n: gap - 1 }); }
    else { if (s.count > 1) events.push({ type: "streakLost", was: s.count }); s.count = 1; }
  }
  s.last = d;
  s.best = Math.max(s.best || 0, s.count);
  if (s.count === 3 && !s.freeGiven) { s.freeGiven = true; s.freezes = Math.min(ECON.freezeMax, s.freezes + 1); events.push({ type: "freeFreeze" }); }
  if (s.count % 7 === 0) { save.chests.push("silver"); events.push({ type: "streakChest", n: s.count }); }
  return events;
}
export function streakAlive(save) {
  const s = save.streak;
  if (!s.last) return { alive: false, count: 0 };
  const gap = dayDiff(s.last, today());
  return { alive: gap <= 1 || s.freezes >= gap - 1, count: s.count, playedToday: gap === 0, gap };
}

// ---- boss tygodnia ----
export function weeklyBossInfo(week = isoWeek()) {
  // wygląd bossa tygodnia losowany z numeru tygodnia — zawsze ten sam dla wszystkich
  return { week, seed: "weekly-" + week };
}
export function ensureWeek(save) {
  const w = isoWeek();
  if (save.weekly.week !== w) { save.weekly.week = w; save.weekly.dmg = 0; }
  return w;
}
export async function weeklyStatus(save) {
  const w = ensureWeek(save);
  if (cloud.enabled()) {
    try {
      const st = await cloud.weeklyStatus(w);
      const players = Math.max(1, st.players);
      return { week: w, total: Math.max(st.total, save.weekly.dmg), hp: ECON.weeklyHpPerPlayer * players, cloud: true };
    } catch (e) { console.warn(e); }
  }
  return { week: w, total: save.weekly.dmg, hp: ECON.weeklyHpPerPlayer, cloud: false };
}
export function weeklyReward(save) {
  const queue = SKINS.filter((s) => s.source === "weekly" && !s.retired).sort((a, b) => a.order - b.order);
  const next = queue.find((s) => !save.owned.skins.includes(s.id));
  save.coins += 100;
  if (next) { save.owned.skins.push(next.id); save.weeklySkins++; return { skin: next, coins: 100 }; }
  save.chests.push("gold");
  return { chest: "gold", coins: 100 };
}
