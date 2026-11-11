// Symulacja ekonomii rybek: dziecko gra codziennie N minut, kupuje najtańszą rzecz ze sklepu, gdy go stać.
// node tools/sim-economy.mjs  → kiedy ma cały sklep, ile rybek leży bezużytecznie.
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { freshSave } = await import("../js/state.js");
const { openChest, chestForFloor, shopItems, buy } = await import("../js/meta.js");
const { ECON } = await import("../data/progression.js");
const { REWARD_TIERS } = await import("../js/lives.js");
const DATE = new Date(2026, 1, 20); // poza wydarzeniem (dni symulacji liczone od tej daty)
const mult = (min) => [...REWARD_TIERS].reverse().find((t) => min >= t.min).mult;
function run(floor) { // jeden etap (5 pięter): 4 potwory + boss; ~5 min
  const hp = ECON.monsterHp(floor), bhp = ECON.bossHp(floor), correct = 4 * hp + bhp;
  return { fish: correct * ECON.coinPerCorrect + 4 * ECON.coinPerKill + ECON.coinPerBoss + 8, dmg: correct * 1.3 };
}
function sim(minutes, days) {
  const s = freshSave("sim", {}); let floor = 0, play = 0, chestFish = 0, other = 0, ownedAllDay = null, featBought = 0;
  for (let d = 1; d <= days; d++) {
    let bossChests = 0;
    for (let m = 0; m + 5 <= minutes; m += 5) {
      floor += 5; const r = run(floor), k = mult(m);
      const f = Math.round(r.fish * k + r.dmg * ECON.weeklyFishPerHit * k); s.coins += f; play += f;
      if (bossChests < ECON.bossChestsPerDay || floor % ECON.kingEvery === 0) { bossChests++; const c0 = s.coins; const o = openChest(s, chestForFloor(floor, s), DATE); if (o.kind === "coins") chestFish += s.coins - c0; }
    }
    const daily = 30 + 30 + 60; s.coins += daily; other += daily; // 3 wyzwania dnia
    for (const c of [...(Math.random() < 0.2 ? ["silver"] : []), ...(d % 3 ? [] : ["wood"]), ...(d % 7 ? [] : ["silver"])]) { const c0 = s.coins; const o = openChest(s, c, DATE); if (o.kind === "coins") chestFish += s.coins - c0; }
    if (d % 7 === 0) { const w = 500; s.coins += w; other += w; s.chests = []; const c0 = s.coins; const o = openChest(s, "mythic", DATE); if (o.kind === "coins") chestFish += s.coins - c0; }
    const day = new Date(DATE.getTime() + d * 864e5);
    for (;;) { const si = shopItems(s, day); const it = [...si.skins, ...si.hats].filter((x) => !x.owned).sort((a, b) => a.price - b.price)[0]; if (!it) { ownedAllDay ??= d; break; } if (!buy(s, it)) break; }
    { const f = shopItems(s, day).featured; if (f && !f.owned && buy(s, f)) featBought++; }
  }
  const per = (x) => Math.round(x / days);
  return { minutes, days, perDay: { play: per(play), chests: per(chestFish), other: per(other) }, shopDoneDay: ownedAllDay, featuredBought: featBought, leftover: s.coins };
}
for (const m of [20, 30]) for (const days of [30, 60, 90]) console.log(JSON.stringify(sim(m, days)));
