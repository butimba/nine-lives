// Testy systemów (bez przeglądarki): migracja v1→v2, życia, malejące nagrody, nagrody po biegu.
// Uruchom: node tools/test-systems.mjs
import { migrate, freshSave, SAVE_VERSION, levelInfo } from "../js/state.js";
import * as L from "../js/lives.js";
import { applyRunResults } from "../js/rewards.js";
import { openChest, chestForFloor } from "../js/meta.js";
import { CHESTS, TALENTS, PERKS, ECON } from "../data/progression.js";
import { randomCatName } from "../data/catnames.js";
import { today } from "../js/util.js";

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log("FAIL:", msg); } };
const eq = (a, b, msg) => ok(JSON.stringify(a) === JSON.stringify(b), `${msg} — got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const clone = (o) => JSON.parse(JSON.stringify(o));
const MIN = 60000;

// ---------- fixture: zapis z v1 (kształt jak w produkcji) ----------
const V1 = {
  v: 1, rev: 41, id: "abc123", createdAt: 1756000000000, updatedAt: 1761000000000,
  catName: "Shrimpy", xp: 1234, coins: 377, spentTalent: 0,
  talents: { lucky: 2, sharp_claws: 1 },
  owned: { skins: ["ginger", "shrimp"], hats: ["none", "crown"] },
  equipped: { skin: "shrimp", hat: "crown" },
  tower: { checkpoint: 15, best: 17, bossesBeaten: 3 },
  daily: { date: "2026-10-20", runs: 2 },
  streak: { count: 4, last: "2026-10-20", freezes: 1, best: 6, freeGiven: true },
  srs: { "v:animals:dog": { b: 3, due: 1, n: 5, ok: 4, last: 1 }, "g:ps_3s:plain": { b: 1, due: 2, n: 3, ok: 1, last: 2 } },
  skills: { ps_3s: { m: 0.55, n: 12 } },
  confusions: { "3s_missing": 2.1 },
  shadows: ["g:ps_3s:plain"],
  story: 3, chests: ["wood", "silver"],
  weekly: { week: "2026-W43", dmg: 40, claimed: [] }, weeklySkins: 1,
  settings: { voice: true, sfx: true, music: false, pl: true },
  log: [[1761000000000, "v:animals:dog", 1, 2300, ""]],
  stats: { runs: 12, answers: 200, correct: 160, playMs: 3600000, shadowRuns: 2 },
  unknownFutureField: { keep: 1 },
};

// ---------- migracja ----------
{
  const s = migrate(clone(V1), { noReading: false });
  eq(s.v, SAVE_VERSION, "version bumped to 2");
  eq(SAVE_VERSION, 2, "SAVE_VERSION is 2");
  // nic ze starych danych nie zginęło
  for (const k of Object.keys(V1)) if (!["v", "settings", "daily"].includes(k)) eq(s[k], V1[k], `v1 field preserved: ${k}`);
  eq(s.daily.date, "2026-10-20", "daily.date kept"); eq(s.daily.runs, 2, "daily.runs kept"); eq(s.daily.ms, 0, "daily.ms added");
  ok(s.lives && s.lives.n === 9 && typeof s.lives.at === "number" && s.lives.date === today(), "lives added");
  eq(s.challenges, { date: null, list: [] }, "challenges added");
  eq(s.powers, { owned: [], equipped: [] }, "powers added");
  eq(s.settings.voice, false, "voice OFF for normal profile");
  eq(s.settings.music, false, "music setting kept");
  const b = migrate(clone(V1), { noReading: true });
  eq(b.settings.voice, true, "voice ON for noReading profile");
  const n = migrate(clone(V1));
  eq(n.settings.voice, false, "voice OFF without profile");
  // v2 → migrate again is a no-op (voice user choice survives)
  const again = clone(s); again.settings.voice = true; again.lives.n = 4;
  const s2 = migrate(again, { noReading: false });
  eq(s2.settings.voice, true, "v2 save: voice choice not overwritten");
  eq(s2.lives.n, 4, "v2 save: lives kept");
  // partial lives object gets defaults
  const p = clone(s); p.lives = { n: 3 }; const p2 = migrate(p, {});
  ok(typeof p2.lives.at === "number" && p2.lives.date, "nested lives defaults filled");
  // fresh save has all new fields
  const f = freshSave("x", { noReading: true });
  ok(f.v === 2 && f.lives.n === 9 && f.daily.ms === 0 && f.challenges && f.powers && f.settings.voice === true, "freshSave v2 fields");
  eq(freshSave("x", { voice: true }).settings.voice, false, "freshSave: voice follows noReading, not profile.voice");
  eq(migrate(null), null, "migrate(null) -> null");
}

// ---------- życia ----------
{
  const T0 = new Date(2026, 9, 27, 10, 0, 0).getTime(); // 27.10 10:00 lokalnie
  const s = freshSave("l", {}); s.lives = { n: 9, at: T0, date: today(new Date(T0)) };
  eq(L.livesState(s, T0), { n: 9, max: 9, asleep: false, nextInMs: 0 }, "full state");
  eq(L.loseLife(s, T0), 8, "lose -> 8");
  eq(s.lives.at, T0, "regen clock starts at first loss");
  eq(L.livesState(s, T0 + 5 * MIN).nextInMs, 15 * MIN, "next in 15 min");
  eq(L.livesState(s, T0 + 19 * MIN).n, 8, "no regen before 20 min");
  eq(L.livesState(s, T0 + 20 * MIN).n, 9, "regen +1 after 20 min");
  // regen kilku żyć naraz, z resztą czasu
  for (let i = 0; i < 9; i++) L.loseLife(s, T0 + 30 * MIN);
  const st0 = L.livesState(s, T0 + 30 * MIN);
  ok(st0.n === 0 && st0.asleep && st0.nextInMs === 20 * MIN, "0 lives -> asleep, 20 min countdown");
  eq(L.loseLife(s, T0 + 30 * MIN), 0, "cannot go below 0");
  eq(L.livesState(s, T0 + 30 * MIN + 65 * MIN).n, 3, "65 min -> +3");
  eq(L.livesState(s, T0 + 30 * MIN + 65 * MIN).nextInMs, 15 * MIN, "remainder kept (5 of 20 min elapsed)");
  // idempotentne
  L.tickLives(s, T0 + 95 * MIN); L.tickLives(s, T0 + 95 * MIN); eq(s.lives.n, 3, "tick idempotent");
  // combo / gain
  eq(L.gainLife(s, "combo", T0 + 96 * MIN), 4, "gain +1");
  s.lives.n = 9; eq(L.gainLife(s, "combo", T0 + 96 * MIN), 9, "gain capped at 9");
  ok(L.COMBO_LIFE === 8 && L.MAX_LIVES === 9 && L.REGEN_MS === 20 * MIN, "constants");
  // regeneracja do pełna nie przelewa się
  s.lives = { n: 7, at: T0, date: today(new Date(T0)) };
  eq(L.livesState(s, T0 + 300 * MIN).n, 9, "long wait caps at 9");
  // północ
  const late = new Date(2026, 9, 27, 23, 50).getTime(), after = new Date(2026, 9, 28, 0, 5).getTime();
  s.lives = { n: 1, at: late, date: today(new Date(late)) };
  eq(L.livesState(s, after).n, 9, "midnight reset to 9");
  eq(s.lives.date, today(new Date(after)), "date rolled");
  // zegar cofnięty
  s.lives = { n: 2, at: T0 + 60 * MIN, date: today(new Date(T0)) };
  ok(L.livesState(s, T0).n === 2 && s.lives.at === T0, "clock skew handled");
  // brak obiektu lives (stary/zepsuty zapis)
  const z = freshSave("z", {}); delete z.lives; eq(L.livesState(z, T0).n, 9, "missing lives -> 9");
}

// ---------- czas gry i malejące nagrody ----------
{
  const now = Date.now();
  const s = freshSave("m", {}); s.daily = { date: "2000-01-01", runs: 5, ms: 999999999 };
  eq(L.rewardMult(s, "tower", now), 1, "old day -> full rewards");
  L.addPlayTime(s, 5 * MIN, now);
  ok(s.daily.date === today() && s.daily.runs === 0 && s.daily.ms === 5 * MIN, "addPlayTime rolls date");
  const at = (m) => { s.daily.ms = m * MIN; return [L.rewardMult(s, "tower", now), L.sleepyTier(s, now)]; };
  eq(at(0), [1, 0], "0 min"); eq(at(19.9), [1, 0], "19.9 min");
  eq(at(20), [0.7, 1], "20 min"); eq(at(29), [0.7, 1], "29 min");
  eq(at(30), [0.35, 2], "30 min"); eq(at(44), [0.35, 2], "44 min");
  eq(at(45), [0.15, 3], "45 min"); eq(at(300), [0.15, 3], "300 min");
  eq(L.rewardMult(s, "shadow", now), 1, "shadow always 1");
  s.daily.ms = 0; L.addPlayTime(s, 60 * MIN, now); eq(s.daily.ms, 10 * MIN, "single answer capped at 10 min");
  L.addPlayTime(s, NaN, now); L.addPlayTime(s, -5, now); eq(s.daily.ms, 10 * MIN, "bad input ignored");
}

// ---------- nagrody po biegu ----------
const baseStats = { mode: "tower", startFloor: 16, floorReached: 20, bossBeaten: true, quit: false, asleep: false,
  answers: 14, correct: 12, bestCombo: 9, kills: 5, coins: 100, xp: 200, weeklyDmg: 0, ms: 4 * MIN, perks: [] };
{
  const s = migrate(clone(V1), {}); // lucky: 2
  const coins0 = s.coins, xp0 = s.xp, chests0 = s.chests.length;
  const r = applyRunResults(s, clone(baseStats));
  eq(r.coins, 120, "lucky 2 -> +20% fish");
  eq(r.xp, 200, "xp unchanged without magnet");
  eq(s.coins, coins0 + 120, "coins added"); eq(s.xp, xp0 + 200, "xp added");
  eq(s.tower.checkpoint, 20, "checkpoint = startFloor+4");
  eq(s.tower.bossesBeaten, 4, "bossesBeaten++");
  eq(s.tower.best, 20, "best updated");
  ok(["wood", "silver", "gold", "epic"].includes(r.chest), "boss chest type");
  eq(r.story, 4, "story page unlocked");
  eq(s.story, 4, "save.story++");
  ok(r.lvlBefore === levelInfo(xp0).lvl && r.lvlAfter === levelInfo(s.xp).lvl, "levels reported");
  ok(s.chests.length >= chests0 + 1, "chest pushed");
  eq(s.stats.runs, 13, "stats.runs++"); eq(s.stats.playMs, 3600000 + 4 * MIN, "playMs added");
  eq(s.stats.answers, 200, "answers not double-counted (engine does it)");
  eq(s.streak.last, today(), "streak touched (answers>=5)");
  ok(Array.isArray(r.streakEvents), "streakEvents array");
  ok(r.sleepy === 0 && r.mult === 1, "sleepy/mult reported");
  ok(r.won === true && r.mode === "tower" && r.kills === 5, "stats passed through");
}
{
  // perki bell + magnet, bez bossa, porażka na piętrze 18
  const s = migrate(clone(V1), {}); s.talents = {};
  const r = applyRunResults(s, { ...clone(baseStats), bossBeaten: false, floorReached: 18, perks: ["bell", "magnet"], answers: 3 });
  eq(r.coins, 150, "bell +50%"); eq(r.xp, 260, "magnet +30%");
  eq(s.tower.checkpoint, 15, "checkpoint unchanged without boss");
  eq(s.tower.best, 17, "best = max(old 17, 18-1)");
  eq(r.chest, null, "no chest without boss"); eq(r.story, null, "no story without boss");
  eq(s.streak.last, "2026-10-20", "streak not touched (answers<5)");
  // perki jako obiekty też działają
  const r2 = applyRunResults(s, { ...clone(baseStats), bossBeaten: false, perks: [{ id: "bell" }] });
  eq(r2.coins, 150, "perk objects accepted");
}
{
  // shadow: bez zmian wieży
  const s = migrate(clone(V1), {}); s.talents = {};
  const tower0 = clone(s.tower), runs0 = s.daily.runs;
  const r = applyRunResults(s, { ...clone(baseStats), mode: "shadow", bossBeaten: false, floorReached: 0, coins: 24, xp: 50 });
  eq(s.tower, tower0, "shadow does not touch tower");
  eq(s.stats.shadowRuns, 3, "shadowRuns++");
  eq(r.coins, 24, "shadow coins");
  ok(s.daily.runs === runs0 || s.daily.date !== "2026-10-20", "shadow does not count daily tower run");
}
{
  // level-up chests: z 0 XP na level 10 → skrzynie na 5 i 10
  const s = freshSave("lv", {});
  let need = 0; for (let l = 1; l < 10; l++) need += ECON.levelXp(l);
  const r = applyRunResults(s, { ...clone(baseStats), bossBeaten: false, coins: 0, xp: need });
  eq(r.lvlAfter, 10, "reached level 10"); eq(r.levelChests, ["wood", "silver"], "level chests at 5 and 10");
}
{
  // cat_nap: +1 / +2 życia po bossie
  for (const [rank, want] of [[0, 0], [1, 1], [2, 2]]) {
    const s = freshSave("cn", {}); s.talents = { cat_nap: rank }; s.lives = { n: 3, at: Date.now(), date: today() };
    const r = applyRunResults(s, { ...clone(baseStats), startFloor: 1 });
    eq([r.napLives, s.lives.n], [want, 3 + want], `cat_nap r=${rank}`);
  }
}
{
  // weekly dmg
  const s = freshSave("wk", {}); s.weekly = { week: "1999-W01", dmg: 500, claimed: [] };
  applyRunResults(s, { ...clone(baseStats), weeklyDmg: 33 });
  ok(s.weekly.week !== "1999-W01" && s.weekly.dmg === 33, "weekly reset + dmg added");
  // pusty / dziwny stats nie wywala
  const s2 = freshSave("e", {}); const r = applyRunResults(s2, {});
  ok(r.coins === 0 && r.xp === 0 && s2.tower.checkpoint === 0, "empty stats safe");
}

// ---------- skrzynie / dane ----------
{
  ok(CHESTS.epic && CHESTS.epic.name === "Epic Chest" && CHESTS.wood.name === "Wooden Chest", "chest names + epic");
  const s = freshSave("ch", {});
  const kinds = {};
  for (let i = 0; i < 300; i++) { const r = openChest(s, "epic"); kinds[r.kind] = (kinds[r.kind] || 0) + 1; }
  ok(kinds.skin || kinds.hat, "epic chest gives items");
  ok(new Set(s.owned.skins).size === s.owned.skins.length, "no duplicate skins");
  const s2 = freshSave("ch2", {}); const c = openChest(s2, "nope"); ok(c && c.kind, "unknown chest type falls back");
  eq(chestForFloor(50), "epic", "floor 50 -> epic"); eq(chestForFloor(25), "gold", "floor 25 -> gold");
  ok(TALENTS.length === 9 && TALENTS.every((t) => /^[\x20-\x7e]+$/.test(t.desc(1)) && t.desc(1).length < 40), "talent descs short English");
  ok(PERKS.every((p) => /^[\x20-\x7e]+$/.test(p.desc)), "perk descs English");
  const names = new Set(); for (let i = 0; i < 400; i++) names.add(randomCatName());
  ok(names.size > 200 && [...names].every((n) => n.split(" ").length === 2 && !/Luna|Mochi/.test(n)), "cat names: 2 words, varied");
  let seed = 1; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  eq(randomCatName(rng), (seed = 1, randomCatName(rng)), "cat names deterministic with rng");
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
