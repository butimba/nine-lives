// Testy systemów (bez przeglądarki): migracja v1→v2, życia, malejące nagrody, nagrody po biegu.
// Uruchom: node tools/test-systems.mjs
import { migrate, freshSave, SAVE_VERSION, levelInfo, freshDuo } from "../js/state.js";
import { record, cardTier, DIAMOND, isDiamondCheck } from "../js/engine.js";
import { shopItems, eventChestItems, ensureDuo, sendGift, receiveGifts, duoChallenge, claimDuo, duoAddCorrect, canSendGift, DUO } from "../js/meta.js";
import { duoPub } from "../js/cloud.js";
import { SKINS, HATS } from "../data/cosmetics.js";
import { eventAllows } from "../data/events.js";
import * as L from "../js/lives.js";
import { applyRunResults, syncPowers, syncStory } from "../js/rewards.js";
import { ensureDaily, progressDaily, claimDaily, makeDaily } from "../js/daily.js";
import { POWERS, RUN_EVENTS, MERCHANT_OFFERS } from "../data/progression.js";
import EVENTS, { activeEvent } from "../data/events.js";
import { openChest, chestForFloor, weeklyNumbers, weeklyReward } from "../js/meta.js";
import { CHESTS, TALENTS, PERKS, ECON, STORY, SKY, skyStars, skyLit, skyDone, SKY_TOTAL, CHAPTERS, STORY_REWARDS } from "../data/progression.js";
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
  eq(s.v, SAVE_VERSION, "version bumped to latest");
  eq(SAVE_VERSION, 6, "SAVE_VERSION is 6");
  eq(s.base, { owned: [], placed: {} }, "v6: Moon Base field added");
  eq(s.duo, freshDuo(), "v4: duo added");
  eq(s.tips, { _old: 1 }, "v5: old accounts skip the tutorial");
  eq(s.pace, { catch: 1 }, "v5: catch pace added");
  // nic ze starych danych nie zginęło (v1 -> v3)
  for (const k of Object.keys(V1)) if (!["v", "settings", "daily", "stats"].includes(k)) eq(s[k], V1[k], `v1 field preserved: ${k}`);
  for (const k of Object.keys(V1.stats)) eq(s.stats[k], V1.stats[k], `v1 stats preserved: ${k}`);
  eq(s.stats.events, {}, "v3: stats.events added");
  eq(s.gifts, { claimed: [] }, "v3: gifts added");
  eq(s.mySkin, { pixels: null, status: "none", at: 0 }, "v3: mySkin added");
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
  eq(f.tips, {}, "v5: fresh account gets the tutorial");
  ok(f.v === SAVE_VERSION && f.duo && Array.isArray(f.duo.got) && f.lives.n === 9 && f.daily.ms === 0 && f.challenges && f.powers && f.settings.voice === true, "freshSave v2 fields");
  eq(freshSave("x", { voice: true }).settings.voice, false, "freshSave: voice follows noReading, not profile.voice");
  eq(migrate(null), null, "migrate(null) -> null");
}

// ---------- v2 -> v3 bezstratnie ----------
{
  const V2 = migrate(clone(V1), {}); V2.v = 2; delete V2.gifts; delete V2.mySkin; delete V2.stats.events;
  V2.challenges = { date: "2026-10-27", list: [{ id: "x", ev: "correct", text: "t", goal: 5, n: 2, done: false, claimed: false, reward: { fish: 10 } }] };
  V2.powers = { owned: ["owl_eye"], equipped: ["owl_eye"] }; V2.lives = { n: 4, at: 123, date: "2026-10-27" }; V2.daily.ms = 777;
  const before = clone(V2);
  const s = migrate(clone(V2), {});
  eq(s.v, SAVE_VERSION, "v2 -> latest");
  for (const k of Object.keys(before)) if (!["v", "stats", "lives"].includes(k)) eq(s[k], before[k], `v2 field preserved: ${k}`);
  for (const k of Object.keys(before.stats)) eq(s.stats[k], before.stats[k], `v2 stats preserved: ${k}`);
  ok(s.lives.n === 4 && s.lives.at === 123 && s.lives.date === "2026-10-27", "v2 lives preserved");
  ok(s.gifts.claimed.length === 0 && s.mySkin.status === "none" && typeof s.stats.events === "object", "v3 fields added");
  const keep = clone(s); keep.gifts.claimed.push("skin:shrimp"); keep.mySkin.status = "pending"; keep.stats.events.golden = 2;
  const again = migrate(keep, {});
  ok(again.gifts.claimed[0] === "skin:shrimp" && again.mySkin.status === "pending" && again.stats.events.golden === 2, "v3 re-migrate no-op");
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

// ---------- łagodne życia (mistakeCost) ----------
{
  const now = Date.now();
  const s = freshSave("g", {});
  eq(L.mistakeCost(s, { repeat: true }, now).free, "repeat", "repeat free");
  eq(s.lives.free, 0, "repeat doesn't use warm-up");
  const r = []; for (let i = 0; i < L.FREE_PER_DAY + 2; i++) r.push(L.mistakeCost(s, {}, now).free);
  eq(r, [...Array(L.FREE_PER_DAY).fill("warmup"), null, null], "warm-up then costs");
  s.lives.date = "2000-01-01"; L.tickLives(s, now); eq(s.lives.free, 0, "warm-up resets at midnight");
  // symulacja: 7-latek 60% trafień, ~7 s na odpowiedź, 30% błędów na nowych, 25% powtórek -> ile minut do 0 żyć?
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sim = (gentle) => { const z = freshSave("sim", {}); let t = 0; while (z.lives.n > 0 && t < 120 * MIN) { t += 7000; if (rnd() < 0.6) continue;
    const c = gentle ? L.mistakeCost(z, { newItem: rnd() < 0.3, repeat: rnd() < 0.25 }, now) : { free: null }; if (!c.free) L.loseLife(z, now); } return t / MIN; };
  const hard = sim(false), soft = sim(true);
  console.log(`  lives sim (60% acc): old rule ${hard.toFixed(1)} min, gentle ${soft.toFixed(1)} min`);
  ok(hard < 4 && soft >= 4.5 && soft > 2 * hard, "gentle lives: struggling kid plays clearly longer than the old rule");
}

// ---------- fabuła 100 stron, 1 strona dziennie, nagrody, niebo ----------
{
  ok(STORY.length === 100 && STORY.every((p) => p.en && p.pl), "STORY has 100 pages");
  ok(SKY.length === 14 && SKY.every((c) => c.pts.length >= 6 && c.pts.length <= 9 && c.say && c.lines.every(([a, b]) => a < c.pts.length && b < c.pts.length)), "14 constellations, 6-9 stars, each with a sentence");
  ok(SKY.every((c) => c.pts.every(([x, y]) => x >= 0 && x <= 32 && y >= 0 && y <= 24)), "constellations fit 32x24");
  eq([skyStars(25), skyLit(26, 0), skyLit(30, 0), skyStars(95), skyStars(100)], [0, 2, 8, SKY_TOTAL, SKY_TOTAL], "sky stars from story pages");
  eq([skyDone(29), skyDone(30), skyDone(94), skyDone(95)], [0, 1, 13, 14], "constellations done on reward pages");
  ok(Object.keys(STORY_REWARDS).every((pg) => +pg === 25 || +pg === 100 || (skyDone(+pg) > skyDone(+pg - 1))), "story prizes 30-95 = constellation pages");
  ok(STORY.every((p) => p.art && [...p.art].every((ch) => ch.codePointAt(0) < 0x1fa70 || ch.codePointAt(0) === 0x1fa81)), "every page has art (Unicode <= 13 safe)");
  ok(!STORY.some((p) => /\w+(łeś|łaś)|\(a\)|eś\/aś/.test(p.pl)), "Polish hints gender-neutral (no zrobiłeś/aś)");
  ok(STORY.every((p) => p.en.split(/\s+/).length <= 34), "pages short (<= 34 words)");
  ok(CHAPTERS[0].from === 1 && CHAPTERS.at(-1).to === 100 && CHAPTERS.every((c, i) => !i || c.from === CHAPTERS[i - 1].to + 1), "chapters cover 1-100");
  for (const [pg, r] of Object.entries(STORY_REWARDS)) { const id = r.skin || r.hat; const it = (r.skin ? SKINS : HATS).find((x) => x.id === id); ok(it && it.source === "story" && +pg <= 100, `story prize ${id} exists`); }
  ok(Object.keys(STORY_REWARDS).length === 16, "16 story prizes");
  const s = freshSave("st", {}); s.tower.bossesBeaten = 40; s.story = 24;
  const r1 = applyRunResults(s, { mode: "tower", bossBeaten: true, startFloor: 1 });
  eq(s.story, 25, "first boss today -> page"); ok(s.owned.hats.includes("moonclip") && r1.extras.some((e) => /Moon clip/.test(e.text)), "page 25 -> Moon clip prize");
  applyRunResults(s, { mode: "tower", bossBeaten: true, startFloor: 6 }); eq(s.story, 25, "second boss same day -> no new page");
  s.daily.pageDay = "2000-01-01"; applyRunResults(s, { mode: "tower", bossBeaten: true, startFloor: 11 }); eq(s.story, 26, "next day -> page");
  const s2 = freshSave("st2", {}); s2.story = 100; eq(syncStory(s2).length, 16, "syncStory grants all 16 at page 100"); eq(syncStory(s2).length, 0, "syncStory idempotent");
}
// ---------- boss tygodnia: wspólna pula ----------
{
  const H = ECON.weeklyHpPerPlayer, K = ECON.weeklyFishPerHp, a = weeklyNumbers({ total: 200, players: 2, mine: 200 });
  eq(a.hp, 2 * H, "weekly hp = per player x players"); eq(a.pool, Math.round(2 * H * K), "pool = hp x weeklyFishPerHp");
  eq(a.share, Math.max(ECON.weeklyMinShare, Math.round(a.pool * 200 / (2 * H))), "share by damage");
  const b = weeklyNumbers({ total: 2000, players: 2, lastTotal: 2000, lastPlayers: 3, mine: 1000 });
  eq(b.hp, 1800, "hp grows with last week's effort (90%)"); eq(b.share, Math.round(1800 * K * 1000 / 2000), "big helper gets big share");
  eq(weeklyNumbers({ total: 500, players: 2, mine: 0 }).share, 0, "no hits -> no share");
  eq(weeklyNumbers({ total: 5000, players: 2, mine: 1 }).share, ECON.weeklyMinShare, "tiny helper gets min share");
  const s = freshSave("wk", {}); const r = weeklyReward(s, { share: 420 }); ok(r.coins === 420 && s.coins === 50 + 420 && r.skin && s.chests.includes("mythic") && s.chests.includes("gold"), "weekly reward = mythic + gold chest + skin + my share");
}

// ---------- moce ----------
{
  ok(POWERS.length === 6 && POWERS.every((p) => p.id && p.name && /^[\x20-\x7e]+$/.test(p.desc) && p.icon.startsWith("power_") && p.charge > 0 && p.unlockLevel >= 1), "POWERS shape");
  const s = freshSave("pw", {});
  eq(syncPowers(s), [], "level 1: no powers");
  let need = 0; for (let l = 1; l < 7; l++) need += ECON.levelXp(l); s.xp = need; // level 7
  const fresh = syncPowers(s).map((p) => p.id);
  eq(fresh, ["owl_eye", "freeze", "claw_storm"], "level 7 unlocks 3 (slower unlocks)");
  ok(POWERS.find((p) => p.id === "catnip").unlockLevel === 16 && POWERS.some((p) => p.id === "ball_buster"), "catnip late, ball buster exists");
  ok(!PERKS.some((p) => p.id === "catnip" || p.id === "bubble"), "no perks duplicating powers");
  eq(s.powers.equipped, ["owl_eye", "freeze"], "auto-equip first 2");
  eq(syncPowers(s), [], "idempotent");
  s.powers.equipped = ["claw_storm", "nope", "claw_storm"]; syncPowers(s); eq(s.powers.equipped, ["claw_storm"], "equipped cleaned");
  // level-up w biegu -> results.extras
  const s2 = freshSave("pw2", {}); s2.xp = ECON.levelXp(1) - 5;
  const r = applyRunResults(s2, { ...clone({ mode: "tower", answers: 3, xp: 10, coins: 0 }), unlockedPowers: [] });
  ok(r.newPowers.includes("owl_eye") && r.extras.some((e) => /Owl Eye/.test(e.text)), "level 2 -> owl eye + results line");
  const r2 = applyRunResults(freshSave("pw3", {}), { mode: "tower", unlockedPowers: ["freeze"], eventChests: ["silver"], events: ["golden", "secret"] });
  ok(r2.newPowers[0] === "freeze" && r2.extras.length === 4, "start-of-run unlock + event lines");
}

// ---------- wydarzenia biegu / sezon ----------
{
  ok(Object.values(RUN_EVENTS).every((e) => e.chance > 0 && e.chance < 0.06), "run events: a few % each");
  ok(MERCHANT_OFFERS.length === 3 && MERCHANT_OFFERS.every((o) => o.price > 0), "3 merchant offers");
  const s = freshSave("ev", {}); const r = applyRunResults(s, { mode: "tower", eventChests: ["wood"] });
  ok(s.chests.includes("wood") && r.eventChests[0] === "wood", "mimic chest goes to save.chests");
  const h = activeEvent(new Date(2026, 9, 31), EVENTS); ok(h && h.id === "halloween" && h.mech === "trickortreat", "halloween on 31.10");
  ok(activeEvent(new Date(2026, 10, 20), EVENTS)?.id === "halloween", "halloween on 20.11");
  ok(activeEvent(new Date(2026, 10, 30), EVENTS)?.id === "halloween", "halloween lasts till 30.11");
  const w = activeEvent(new Date(2026, 11, 1), EVENTS); ok(w && w.id === "winter" && w.mech === "presents" && w.vocab === "winter", "winter switches on by itself on 1.12");
  ok(activeEvent(new Date(2026, 11, 24), EVENTS)?.id === "winter", "winter on 24.12");
  const ny = activeEvent(new Date(2026, 11, 31), EVENTS); ok(ny && ny.id === "newyear" && ny.sky === "fireworks", "new year on 31.12");
  ok(activeEvent(new Date(2027, 0, 6), EVENTS)?.id === "newyear" && activeEvent(new Date(2027, 0, 7), EVENTS)?.id === "winter", "new year ends 6.01, winter goes on");
  ok(activeEvent(new Date(2027, 0, 15), EVENTS)?.id === "winter" && !activeEvent(new Date(2027, 0, 16), EVENTS), "winter ends 15.01");
  ok(eventAllows(ny, "event:winter") && eventAllows(w, "event:newyear") && !eventAllows(w, "event:halloween"), "winter <-> newyear share items");
}

// ---------- kosmetyki: święta, Shark, Toxic ----------
{
  const ids = new Set(); for (const L of [SKINS, HATS]) { const one = new Set(); for (const x of L) { ok(!one.has(x.id), "unique cosmetic id " + x.id); one.add(x.id); ids.add(x.id); } }
  for (const id of ["ginger", "toxic", "shrimp", "gingerbread", "pumpkin", "ghost", "zombie", "santa"]) ok(ids.has(id), "old id kept: " + id);
  const xmas = ["santacat", "lights", "xmastree", "snowman", "elf", "candycane", "reindeer", "firework"];
  for (const id of xmas) ok(SKINS.find((k) => k.id === id && /^event:(winter|newyear)$/.test(k.source)), "christmas skin " + id);
  for (const id of ["elfhat", "earmuffs", "antlers", "star", "nyhat"]) ok(HATS.find((k) => k.id === id), "christmas hat " + id);
  const s = freshSave("shop", {});
  const nov = shopItems(s, new Date(2026, 10, 20)), dec = shopItems(s, new Date(2026, 11, 5)), jan = shopItems(s, new Date(2027, 0, 2));
  ok(nov.skins.some((k) => k.id === "shark") && nov.skins.some((k) => k.id === "toxic" && k.price > 0), "shark + toxic in the shop all year");
  ok(!nov.skins.some((k) => xmas.includes(k.id)), "no christmas skins in November");
  ok(dec.skins.filter((k) => xmas.includes(k.id)).length >= 6 && dec.hats.some((k) => k.id === "elfhat"), "christmas skins in the shop in December");
  ok(jan.skins.some((k) => k.id === "santacat") && jan.skins.some((k) => k.id === "firework") && jan.hats.some((k) => k.id === "nyhat"), "new year shop sells winter + new year items");
  ok(!dec.skins.some((k) => k.id === "reindeer"), "reindeer is chest-only");
  const evc = eventChestItems(new Date(2026, 11, 5)).map((x) => x.id);
  ok(evc.includes("reindeer") && evc.includes("antlers") && evc.includes("lights") && !evc.includes("santacat"), "event chest pool");
  ok(!eventChestItems(new Date(2026, 0, 20)).length, "no event chest items on 20.01");
  // skrzynie w grudniu dają świąteczne rzeczy
  const c = freshSave("chx", {}); let got = 0;
  for (let i = 0; i < 400; i++) { const r = (0, openChest)(c, "epic", new Date(2026, 11, 5)); if (r.item && xmas.concat(["antlers", "star"]).includes(r.item.id)) got++; }
  ok(got > 0, "december epic chests can drop christmas items");
}

// ---------- duet ----------
{
  const D1 = "2026-12-03", D2 = "2026-12-04";
  const lu = freshSave("lu", {}), ma = freshSave("ma", {});
  const pLu = { duo: "ma" }, pMa = { duo: "lu" };
  ok(canSendGift(lu, D1) && sendGift(lu, pLu, D1), "send gift");
  ok(!sendGift(lu, pLu, D1) && !canSendGift(lu, D1), "only once a day");
  ok(!sendGift(freshSave("solo", {}), {}, D1), "no duo -> no gift");
  const coins0 = lu.coins; eq(lu.coins, coins0, "sending costs nothing");
  const pub = { name: "Sir Pickles", duo: duoPub(lu) };
  eq(pub.duo.giftTo, "ma", "pub.duo.giftTo"); eq(pub.duo.gifts, [D1], "pub.duo.gifts");
  const m0 = ma.coins;
  eq(receiveGifts(ma, pub, D1), { n: 1, fish: DUO.gift }, "partner receives 5 fish");
  eq(ma.coins, m0 + DUO.gift, "fish added once");
  eq(receiveGifts(ma, pub, D1), { n: 0, fish: 0 }, "never double-counts");
  eq(receiveGifts(migrate(clone(ma), {}), pub, D1).n, 0, "still no double count after reload/migrate");
  eq(receiveGifts(lu, pub, D1).n, 0, "a gift is not for the sender");
  eq(receiveGifts(freshSave("other", {}), pub, D1).n, 0, "a gift is only for the partner");
  // dwa dni prezentów, odebrane razem
  sendGift(lu, pLu, D2); const ma2 = freshSave("ma", {});
  eq(receiveGifts(ma2, { duo: duoPub(lu) }, D2), { n: 2, fish: 2 * DUO.gift }, "missed days arrive later, each once");
  eq(ma.duo.gotGiftDay, D1, "gotGiftDay");
  // wspólne wyzwanie
  duoAddCorrect(lu, 18, D2); 
  let ch = duoChallenge(lu, pLu, null, {}, D2);
  ok(ch.goal === 30 && ch.me === 18 && ch.them === 0 && !ch.done && ch.needThem, "challenge: partner must help");
  ensureDuo(ma, D2); duoAddCorrect(ma, 5, D2);
  ch = duoChallenge(lu, pLu, { duo: duoPub(ma) }, {}, D2); ok(!ch.done && ch.total === 23, "23/30 not done");
  duoAddCorrect(ma, 7, D2);
  ch = duoChallenge(lu, pLu, { duo: duoPub(ma) }, {}, D2); ok(ch.done && ch.them === 12, "30/30 done (both contributed)");
  const c0 = lu.coins, ch0 = lu.chests.length;
  eq(claimDuo(lu, pLu, { duo: duoPub(ma) }, {}, D2), { fish: DUO.fish, chest: DUO.chest }, "claim duo reward");
  ok(lu.coins === c0 + DUO.fish && lu.chests.length === ch0 + 1, "reward added");
  eq(claimDuo(lu, pLu, { duo: duoPub(ma) }, {}, D2), null, "claim only once");
  ok(claimDuo(ma, pMa, { duo: duoPub(lu) }, {}, D2), "partner claims too");
  const solo = freshSave("so", {}); duoAddCorrect(solo, 40, D2);
  ok(!duoChallenge(solo, { duo: "x" }, { duo: { day: D2, duoN: 0 } }, {}, D2).done, "40 alone is not enough");
  ok(!duoChallenge(solo, { duo: "x" }, { duo: { day: D1, duoN: 30 } }, {}, D2).done, "partner's old day does not count");
  eq(duoChallenge(solo, { noReading: true }, null, {}, D2).goal, DUO.goalYoung, "young goal");
  // nowy dzień zeruje mój wkład
  eq(ensureDuo(lu, "2026-12-05").n, 0, "new day resets my count");
  // applyRunResults dolicza dobre odpowiedzi
  const r = freshSave("rr", {}); applyRunResults(r, { mode: "tower", correct: 7 }); ok(r.duo.n === 7 && r.duo.nDay === today(), "run correct answers count for the duo");
}

// ---------- wyzwania dnia ----------
{
  const prof = { focus: ["ps_3s", "v:animals"] };
  const s = freshSave("dl", {});
  const d1 = new Date(2026, 9, 28, 10), d2 = new Date(2026, 9, 29, 10);
  const c = ensureDaily(s, prof, d1);
  eq(c.list.length, 3, "3 challenges");
  ok(/present simple/.test(c.list[0].text) && c.list[0].ev === "skill:ps_3s", "main focus in simple English");
  ok(c.list.every((x) => /^[\x20-\x7e]+$/.test(x.text) && x.text.length <= 40 && x.reward.fish > 0), "short ASCII English + fish");
  eq(makeDaily(freshSave("dl", {}), prof, d1).map((x) => x.text), c.list.map((x) => x.text), "deterministic");
  const ids = c.list.map((x) => x.id); ensureDaily(s, prof, d1); eq(s.challenges.list.map((x) => x.id), ids, "same day: kept");
  eq(progressDaily(s, "nothing", 1, d1), [], "unknown event ignored");
  const first = c.list[0]; let done = [];
  for (let i = 0; i < first.goal; i++) done = done.concat(progressDaily(s, first.ev, 1, d1));
  ok(first.done && done.length === 1, "skill challenge completes once");
  eq(claimDaily(s, "nope"), null, "claim unknown -> null");
  const coins0 = s.coins; const rw = claimDaily(s, first.id);
  ok(rw && s.coins === coins0 + rw.fish && first.claimed, "claim gives fish"); eq(claimDaily(s, first.id), null, "no double claim");
  const s3 = freshSave("dl3", {}); s3.challenges = { date: null, list: [] }; ensureDaily(s3, prof, d1);
  s3.challenges.list[2] = { ...s3.challenges.list[2], ev: "combo", goal: 10, n: 0, done: false };
  progressDaily(s3, "combo", 6, d1); progressDaily(s3, "combo", 3, d1); eq(s3.challenges.list[2].n, 6, "combo keeps best");
  progressDaily(s3, "combo", 10, d1); ok(s3.challenges.list[2].done, "combo 10 done");
  const ch0 = s3.chests.length; const rr = claimDaily(s3, s3.challenges.list[2].id); ok(!rr.chest || s3.chests.length === ch0 + 1, "chest reward pushed");
  ensureDaily(s, prof, d2); ok(s.challenges.date !== c.date || s.challenges.list[0].n === 0, "new day -> new list");
  const young = ensureDaily(freshSave("yb", {}), { noReading: true, focus: ["ps_3s", "v:food"] }, d1);
  ok(young.list[0].ev === "skill:v:food" && !young.list.some((x) => x.ev === "typed"), "noReading: vocab focus, no spelling");
  ok(ensureDaily(freshSave("nf", {}), {}, d1).list.length === 3, "no focus still 3");
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
  { const sc = freshSave("cap", {}); const got = [1, 6, 11, 16, 21].map((f) => applyRunResults(sc, { mode: "tower", bossBeaten: true, startFloor: f }).chest);
    ok(got.slice(0, ECON.bossChestsPerDay).every(Boolean) && got.slice(ECON.bossChestsPerDay, 4).every((c) => !c) && got[4] === "silver", `${ECON.bossChestsPerDay} boss chest(s) a day, King always a chest (${got})`); }
  { const s3 = freshSave("wk3", {}); const c0 = s3.coins; const r3 = applyRunResults(s3, { ...clone(baseStats), weeklyDmg: 20 }); ok(r3.weeklyFish > 0 && s3.coins === c0 + r3.coins + r3.weeklyFish, `weekly hits pay fish right away (+${r3.weeklyFish})`); }
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
  const hi = () => 0.99, lo = () => 0.01;
  eq(chestForFloor(100, null, hi), "epic", "floor 100 (King) -> epic"); eq(chestForFloor(50, null, hi), "gold", "floor 50 (King) -> gold"); eq(chestForFloor(25, null, lo), "silver", "floor 25 (King) -> silver");
  eq(chestForFloor(45, null, lo), "epic", "very lucky roll from floor 40 -> epic"); eq(chestForFloor(45, null, () => 0.1), "silver", "lucky roll -> silver"); eq(chestForFloor(35, null, lo), "silver", "no random epic below floor 40"); eq(chestForFloor(45, null, hi), "wood", "normal boss -> wood");
  { const seen = new Set(); for (let i = 1; i < 4000; i++) seen.add(chestForFloor(5 * i)); ok(!seen.has("mythic") && seen.has("epic"), "tower: epic sometimes, mythic never"); }
  { const sm = freshSave("myth", {}); const res = Array.from({ length: 12 }, () => openChest(sm, "mythic"));
    const [m0, m1] = CHESTS.mythic.coins;
    ok(res.every((r) => (r.kind === "coins" && r.amount >= m0 && r.amount <= m1) || ((r.kind === "skin" || r.kind === "hat") && ["legendary", "epic"].includes(r.item.rarity))), "mythic -> legendary item or mythic fish");
    { const sx = freshSave("myth2", {}); ok(Array.from({ length: 8 }, () => openChest(sx, "mythic")).every((r) => r.kind !== "coins"), "mythic always gives an item while some are left"); }
    for (let i = 0; i < 150; i++) openChest(sm, "mythic"); const r2 = Array.from({ length: 6 }, () => openChest(sm, "mythic")); ok(r2.every((r) => r.kind === "coins" && r.amount >= m0), "mythic with everything owned -> fish, no duplicate");
    ok(["mooncat", "phoenix", "crystal", "aurora"].every((id) => sm.owned.skins.includes(id)), "mythic gives the 4 mythic-only skins"); }
  { const sg = freshSave("gold", {}); for (let i = 0; i < 60; i++) openChest(sg, "gold"); ok(!sg.owned.skins.some((id) => SKINS.find((k) => k.id === id).source === "mythic"), "mythic-only skins never in normal chests"); }
  ok(TALENTS.length === 9 && TALENTS.every((t) => /^[\x20-\x7e]+$/.test(t.desc(1)) && t.desc(1).length < 40), "talent descs short English");
  ok(PERKS.every((p) => /^[\x20-\x7e]+$/.test(p.desc)), "perk descs English");
  const names = new Set(); for (let i = 0; i < 400; i++) names.add(randomCatName());
  ok(names.size > 200 && [...names].every((n) => n.split(" ").length === 2 && !/Luna|Mochi/.test(n)), "cat names: 2 words, varied");
  let seed = 1; const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  eq(randomCatName(rng), (seed = 1, randomCatName(rng)), "cat names deterministic with rng");
}

// ---------- boss: wolniejsze pociski, złoty pocisk, seria odbić (js/game/boss.js) ----------
{
  const { createBossFight } = await import("../js/game/boss.js");
  const noop = () => {};
  const fx = { burst: noop, ring: noop, float: noop, flash: noop };
  const mk = (rngVal, extra = {}) => {
    let down = null; const log = { miss: 0, defl: [], bonus: 0 };
    const stage = { input: { on: (ev, fn) => { down = fn; return noop; } }, hitstop: noop, shake: noop };
    const f = createBossFight({ stage, fx, rng: () => rngVal, from: () => ({ x: 190, y: 300 }), to: () => ({ x: 60, y: 300 }),
      onMiss: () => log.miss++, onDeflect: (p, s) => log.defl.push(s), onBonus: () => log.bonus++, ...extra });
    f.paused = false;
    const run = (sec) => { for (let k = 0; k < sec * 20; k++) f.update(0.05, 0); };
    const fly = () => f.projectiles.find((x) => x.state === "fly");
    const tap = () => { const p = fly(); return p ? down({ x: p.x, y: p.y }) : false; };
    const tapNext = () => { for (let k = 0; k < 200 && !tap(); k++) run(0.25); };
    return { f, log, run, tap, tapNext, fly };
  };
  // rng 0.5 everywhere: no golden shots (0.5 > 0.16), no "sneak" at the start
  const a = mk(0.5);
  a.run(3.5); ok(!!a.fly(), "boss: first shot is in the air after ~3 s");
  ok(!a.fly().gold, "boss: first shot is never golden");
  ok(a.fly().dur > 5.5, "boss: a shot takes over 5.5 s at the start of a fight");
  a.run(9); ok(a.log.miss >= 1, "boss: an untapped shot hits the cat");
  const fast = mk(0.5, { progress: () => 1 }); fast.run(3.5);
  ok(fast.fly().dur > 3.8, "boss: a shot takes over 3.8 s even at the end of a fight");
  // deflects in a row: 1, 2, 3; a miss resets the streak
  const s = mk(0.5);
  s.tapNext(); s.tapNext(); s.tapNext();
  eq(s.log.defl, [1, 2, 3], "boss: deflect streak grows");
  s.run(16); ok(s.log.miss >= 1, "boss: a miss after the streak");
  s.tapNext(); eq(s.log.defl[3], 1, "boss: a miss resets the streak");
  // rng 0.1 everywhere: every shot after the first one is golden
  const g = mk(0.1);
  g.tapNext(); eq(g.log.defl.length, 1, "boss: first shot deflected");
  g.run(1); g.tapNext();
  eq(g.log.bonus, 1, "boss: tapping a golden shot gives the bonus");
  eq(g.log.defl.length, 1, "boss: a golden tap is not a deflect");
  const g2 = mk(0.1); g2.tapNext(); g2.run(60);
  eq(g2.log.miss, 0, "boss: missed golden shots never hurt");
  ok(ECON.kingEvery === 25 && ECON.kingHp > 0 && ECON.kingFish > 0, "king boss config");
}

// ---- ekonomia 2026-11: ceny, drabinka skrzyń, sklep tygodnia ----
{
  const { PRICE } = await import("../data/cosmetics.js");
  const { CHESTS: CH } = await import("../data/progression.js");
  const { featuredItem, FEATURED, touchStreak: tS, openChest: oC } = await import("../js/meta.js");
  ok(SKINS.filter((x) => x.price).every((x) => x.price === PRICE.skin[x.rarity]) && HATS.filter((x) => x.price).every((x) => x.price === PRICE.hat[x.rarity]), "one price per rarity (skins + hats)");
  const rank = { common: 0, rare: 1, epic: 2, legendary: 3 };
  for (const t of ["wood", "silver", "gold", "epic", "mythic"]) {
    const sv = freshSave("lad" + t, {}); let bad = 0;
    for (let i = 0; i < 300; i++) { const r = oC(sv, t, new Date(2026, 1, 1)); if (r.item && rank[r.item.rarity] < rank[CH[t].min]) bad++; }
    eq(bad, 0, `${t} chest never below ${CH[t].min}`);
  }
  { const sv = freshSave("silv", {}); ok(Array.from({ length: 10 }, () => oC(sv, "silver", new Date(2026, 1, 1))).every((r) => r.kind !== "coins"), "silver chest always gives an item while some are left"); }
  { const sv = freshSave("feat", {}); let bad = 0; for (let i = 0; i < 400; i++) { const r = oC(sv, "gold", new Date(2026, 1, 1)); if (r.item && r.item.source === "featured") bad++; } eq(bad, 0, "chests never give featured skins"); }
  const wk = (n) => new Date(2026, 0, 5 + 7 * n);
  const ids = Array.from({ length: FEATURED.length + 1 }, (_, i) => featuredItem(wk(i)).id);
  ok(new Set(ids.slice(0, FEATURED.length)).size === FEATURED.length && ids[0] === ids[FEATURED.length], `featured skin changes weekly and comes back (${ids})`);
  eq(featuredItem(new Date(2026, 0, 5)).id, featuredItem(new Date(2026, 0, 11)).id, "same featured skin Mon..Sun");
  { const sv = freshSave("featkid", {}); const d0 = new Date(2026, 0, 5), plain = featuredItem(d0).id;
    sv.owned.skins.push(plain); const mine = featuredItem(d0, sv).id;
    ok(mine !== plain && FEATURED.includes(mine), "featured skips a skin the kid already owns");
    sv.owned.skins.push(mine); eq(featuredItem(new Date(2026, 0, 9), sv).id, mine, "featured stays the same all week after buying");
    sv.owned.skins.push(...FEATURED); ok(FEATURED.includes(featuredItem(new Date(2026, 0, 12), sv).id), "featured still shown when kid owns all"); }
  { const sv = freshSave("shopf", {}); const si = shopItems(sv, wk(0)); ok(si.featured && !si.skins.some((x) => x.source === "featured"), "shop: featured only as the weekly card"); }
  { const sv = freshSave("st28", {}); const d = new Date(Date.now() - 864e5);
    sv.streak.last = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; sv.streak.count = 27;
    const evs = tS(sv); ok(sv.chests.includes("epic") && evs.some((e) => e.chest === "epic"), "28-day streak -> epic chest"); }
}

// ---- paczka ze statku Króla (same rybki) ----
{
  const { openParcel } = await import("../js/meta.js");
  const [lo, hi] = ECON.parcelFish;
  const sv = freshSave("ship1", {});
  sv.story = 44; eq(openParcel(sv, "2026-11-12"), null, "no ship parcel before page 45");
  sv.story = 45; const c0 = sv.coins; const r1 = openParcel(sv, "2026-11-12", () => 0.999);
  ok(r1 && r1.fish === hi && sv.coins === c0 + r1.fish && !r1.item, "parcel gives only fish (max)");
  eq(openParcel(sv, "2026-11-12"), null, "ship parcel once per day");
  const r2 = openParcel(sv, "2026-11-13", () => 0); ok(r2 && r2.fish === lo && !r2.item, "parcel gives only fish (min)");
}

// ---- gramatyka na pierwszym planie (GRAMMAR_SHARE) ----
{
  const E = await import("../js/engine.js");
  const prof = { focus: ["be", "v:animals", "v:food", "v:colors"] };
  const sv = freshSave("gshare", prof); let g = 0, n = 0;
  for (let d = 0; d < 5; d++) { const ses = new E.Session(sv, prof, "tower", d + 7); for (let i = 0; i < 60; i++) { const t = ses.next(); if (!t) break; n++; if (t.kind === "grammar") g++; E.record(sv, t, true, 2000, null); } }
  ok(g / n > 0.5 && g / n < 0.85, `runs are mostly sentences when grammar is active (${Math.round(100 * g / n)}%)`);
  const ses3 = new E.Session(sv, prof, "tower", 99); ses3.forceGrammar = true;
  ok(Array.from({ length: 20 }, () => ses3.next()).filter(Boolean).every((t) => t.kind === "grammar"), "Glitch (forceGrammar) asks only sentences");
  const kid = { focus: ["v:animals", "be"], noReading: true }; const s2 = freshSave("gnr", kid); const ses2 = new E.Session(s2, kid, "tower", 3);
  ok(Array.from({ length: 30 }, () => ses2.next()).filter(Boolean).every((t) => t.kind === "vocab"), "non-readers still get only words");
}

// ---- logowanie, gdy chmura nie odpowiada (Łucja 11.2026: świeży kot zamiast jej zapisu) ----
{
  const ST = await import("../js/state.js");
  const mine = { ...freshSave("7njwyk"), createdAt: 1, rev: 465, xp: 1169, catName: "Mine" };
  const fresh = { ...freshSave("7njwyk"), createdAt: 2, rev: 30, xp: 40, catName: "New" };
  eq(ST.pickSave(fresh, mine).catName, "Mine", "a fresh cat never beats the real save of the same login");
  eq(ST.pickSave({ ...mine, rev: 500 }, mine).rev, 500, "same cat: higher rev wins");
  eq(ST.pickSave(null, mine).catName, "Mine", "only cloud save -> cloud");
  const store = {}, calls = [];
  const oldFetch = globalThis.fetch, oldLS = globalThis.localStorage, oldWarn = console.warn; console.warn = () => {};
  globalThis.localStorage = { getItem: (k) => store[k] ?? null, setItem: (k, v) => { store[k] = String(v); }, removeItem: (k) => { delete store[k]; } };
  globalThis.fetch = (u) => { calls.push(u); return Promise.reject(new Error("offline")); };
  let threw = null; try { await ST.loadSave("7njwyk", {}); } catch (e) { threw = e; }
  ok(threw && threw.cloud, "cloud down + nothing on this device -> login fails, no new cat");
  ok(!store["ninelives:save:7njwyk"], "no fresh save written on failed login");
  store["ninelives:save:7njwyk"] = JSON.stringify({ ...mine, id: "other" });
  const s = await ST.loadSave("7njwyk", {});
  eq(s.catName, "Mine", "cloud down + local save -> plays the local save");
  eq(s.id, "7njwyk", "save id always equals the login it was loaded for");
  calls.length = 0; ST.persist(true); await new Promise((r) => setTimeout(r, 10));
  eq(calls.length, 0, "no cloud write after a failed cloud load");
  globalThis.fetch = oldFetch; console.warn = oldWarn;
  if (oldLS === undefined) delete globalThis.localStorage; else globalThis.localStorage = oldLS;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
