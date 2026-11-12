// Symulacja ekonomii przy REALNYM graniu: dziecko gra 2–4 razy w tygodniu po 10–20 min (+ lekcje z Maxem),
// są dni bez gry. Używa prawdziwych funkcji gry (skrzynie, sklep, sklep tygodnia, boss tygodnia, paczka).
// node tools/sim-economy.mjs  → ile rybek z czego, kiedy dziecko ma WSZYSTKO (sklep, skrzynie, sklep tygodnia, boss tygodnia),
// ile rybek leży na końcu. Skórki mityczne (tylko za złoty zestaw słówek) są poza celem — to nagroda „dla mistrzów”. Wydarzenia sezonowe i nagrody z fabuły nie są liczone (osobny kalendarz).
import { pathToFileURL } from "node:url";
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { freshSave, levelInfo } = await import("../js/state.js");
const { openChest, chestForFloor, shopItems, buy, weeklyReward, weeklyNumbers, openParcel, FEATURED } = await import("../js/meta.js");
const { ECON, RUN_EVENTS, CHESTS } = await import("../data/progression.js");
const { SKINS, HATS } = await import("../data/cosmetics.js");
const { DAILY_FISH } = await import("../js/daily.js");

const START = new Date(2026, 1, 23); // poniedziałek poza wydarzeniami
export const PATTERNS = {
  light: { home: [2, 2], min: [10, 10], lessons: [1, 1] },   // 2× po 10 min + 1 lekcja
  typical: { home: [2, 4], min: [10, 20], lessons: [1, 2] }, // 2–4× po 10–20 min + 1–2 lekcje
  heavy: { home: [4, 5], min: [20, 25], lessons: [2, 2] },   // prawie codziennie po 20+ min
};
const ri = (rng, [a, b]) => a + Math.floor(rng() * (b - a + 1));
// wszystko, co da się zebrać bez wydarzeń i bez fabuły
const GOAL = [...SKINS.filter((s) => !s.retired && ["shop", "chest", "featured", "weekly"].includes(s.source)).map((s) => "s:" + s.id),
  ...HATS.filter((s) => !s.retired && ["shop", "chest"].includes(s.source)).map((s) => "h:" + s.id)];
const missing = (s) => GOAL.filter((k) => !(k[0] === "s" ? s.owned.skins : s.owned.hats).includes(k.slice(2)));

// jeden etap (5 pięter, ~5 min): 4 potwory + boss. 85% szans na pokonanie bossa.
function stage(floor, rng) {
  const hp = ECON.monsterHp(floor), bhp = ECON.bossHp(floor) + (floor % ECON.kingEvery === 0 ? ECON.kingHp : 0);
  const correct = 4 * hp + bhp, won = rng() < 0.85;
  let fish = correct * ECON.coinPerCorrect + 4 * ECON.coinPerKill + (won ? ECON.coinPerBoss : 0);
  fish += 4 + (rng() < 0.16 * 5 ? ECON.starFish : 0); // odbicia (1–2) + złota gwiazdka
  if (won && floor % ECON.kingEvery === 0) fish += ECON.kingFish;
  for (let f = 0; f < 4; f++) {
    const r = rng();
    if (r < RUN_EVENTS.golden.chance) fish += RUN_EVENTS.golden.fish;
    else if (r < RUN_EVENTS.golden.chance + RUN_EVENTS.glitch.chance && floor > 150) fish += RUN_EVENTS.glitch.fish;
    else if (r < 0.1 + RUN_EVENTS.secret.chance) fish += RUN_EVENTS.secret.fish[0] * 1.6;
  }
  const mimic = rng() < RUN_EVENTS.mimic.chance * 4 ? RUN_EVENTS.mimic.chest[Math.floor(rng() * 3)] : null;
  return { fish, dmg: Math.round(correct * 1.3), xp: correct * ECON.xpPerCorrect + (won ? ECON.xpPerBoss : 0), won, mimic };
}

export function simulate(patternName = "typical", weeks = 26, seed = 1) {
  let x = seed * 9301 + 49297; const rng = () => ((x = (x * 9301 + 49297) % 233280) / 233280);
  const P = PATTERNS[patternName], s = freshSave("sim", {});
  const src = { play: 0, weekly: 0, chests: 0, daily: 0, other: 0 }, spent = { shop: 0, featured: 0 };
  const chests = {}; let floor = 0, doneDay = null, sessions = 0, minutes = 0, beaten = 0, lastChestItemDay = 0, fishAtDone = 0;
  const monthly = [], curve = []; let gap = 0, maxGap = 0, have0 = 0;
  const open = (c, d) => { chests[c] = (chests[c] || 0) + 1; const c0 = s.coins; const r = openChest(s, c, START); if (r.kind === "coins") src.chests += s.coins - c0; else lastChestItemDay = d; };
  for (let w = 0; w < weeks; w++) {
    const days = new Set(); const nHome = ri(rng, P.home), nLes = ri(rng, P.lessons);
    while (days.size < Math.min(7, nHome + nLes)) days.add(Math.floor(rng() * 7));
    const list = [...days].sort(); let wDmg = 0;
    list.forEach((wd, i) => {
      const d = w * 7 + wd + 1, mins = i < nHome ? ri(rng, P.min) : 10;
      sessions++; minutes += mins;
      let bossChests = 0, bosses = 0;
      for (let m = 0; m + 5 <= mins; m += 5) {
        const st = stage(floor + 5, rng); // < 20 min = pełne nagrody (REWARD_TIERS)
        s.coins += st.fish; src.play += st.fish;
        const wf = Math.round(st.dmg * ECON.weeklyFishPerHit); s.coins += wf; src.weekly += wf; wDmg += st.dmg;
        const l0 = levelInfo(s.xp).lvl; s.xp += st.xp; const l1 = levelInfo(s.xp).lvl;
        for (let l = l0 + 1; l <= l1; l++) if (l > 25 || l % 5 === 0) open(l > 25 || l % 10 === 0 ? "silver" : "wood", d); // od lvl 25 wszystkie talenty → srebrna co level
        if (st.mimic) open(st.mimic, d);
        if (!st.won) continue;
        floor += 5; bosses++;
        if (bossChests < ECON.bossChestsPerDay || floor % ECON.kingEvery === 0) { bossChests++; open(chestForFloor(floor, s, rng), d); }
      }
      // wyzwania dnia: temat główny + nauka zawsze, zadanie z gry w 60%, „boss bez straty życia” (srebrna) w 20%
      const df = DAILY_FISH.main + DAILY_FISH.learn + (rng() < 0.6 ? DAILY_FISH.game : 0); s.coins += df; src.daily += df;
      if (bosses && rng() < 0.2) open("silver", d);
      s.story = Math.min(100, (s.story || 0) + (bosses ? 1 : 0));
      const c0 = s.coins; openParcel(s, "d" + d, rng); src.other += s.coins - c0;
      // zakupy: najpierw skórka tygodnia, potem najtańsze ze sklepu
      const day = new Date(START.getTime() + d * 864e5), si = shopItems(s, day);
      if (si.featured && !si.featured.owned && buy(s, si.featured)) spent.featured += si.featured.price;
      for (;;) { const it = [...shopItems(s, day).skins, ...shopItems(s, day).hats].filter((q) => !q.owned).sort((a, b) => a.price - b.price)[0];
        if (!it || !buy(s, it)) break; spent.shop += it.price; }
      if (doneDay == null && !missing(s).length) { doneDay = d; fishAtDone = s.coins; }
      // „czy dziś coś nowego?” — nowy przedmiot albo nowy level. Najdłuższa seria sesji bez niczego = zastój.
      const have = GOAL.length - missing(s).length + levelInfo(s.xp).lvl;
      if (doneDay == null) { gap = have > have0 ? 0 : gap + 1; maxGap = Math.max(maxGap, gap); } have0 = have;
    });
    // boss tygodnia: grupa dzieci grających podobnie → pada, gdy moje obrażenia >= HP na gracza
    const n = weeklyNumbers({ total: wDmg, players: 1, mine: wDmg });
    if (wDmg >= n.hp && wDmg >= ECON.weeklyPrizeHits) { beaten++; const r = weeklyReward(s, n); src.weekly += r.coins; for (const c of s.chests.splice(0)) open(c, w * 7 + 7); }
    if ((w + 1) % 4 === 0) monthly.push(s.coins);
    if (process.env.SIMDBG && w + 1 === +process.env.SIMDBG) console.log("missing", missing(s).join(" "));
    curve.push({ w: w + 1, items: GOAL.length - missing(s).length, lvl: levelInfo(s.xp).lvl, fish: Math.round(s.coins) });
  }
  const days = weeks * 7, per = (v) => Math.round(v / weeks);
  return { pattern: patternName, weeks, sessionsPerWeek: +(sessions / weeks).toFixed(1), minPerWeek: Math.round(minutes / weeks),
    fishPerWeek: { play: per(src.play), weekly: per(src.weekly), chests: per(src.chests), daily: per(src.daily), other: per(src.other),
      total: per(src.play + src.weekly + src.chests + src.daily + src.other) },
    spent, weeklyBeaten: `${beaten}/${weeks}`, chestsPerWeek: +(Object.values(chests).reduce((a, b) => a + b, 0) / weeks).toFixed(1), chests,
    lastChestItemDay, floor, level: levelInfo(s.xp).lvl,
    doneDay, doneWeeks: doneDay && +(doneDay / 7).toFixed(1), fishAtDone, missing: missing(s).length, leftover: s.coins, bankByMonth: monthly, maxGapSessions: maxGap, curve };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`do zebrania (bez wydarzeń i fabuły): ${GOAL.length} przedmiotów, sklep tygodnia: ${FEATURED.length} skórek`);
  for (const p of Object.keys(PATTERNS)) {
    const runs = [1, 2, 3, 4, 5].map((sd) => simulate(p, 40, sd));
    const r = runs[0], done = runs.map((q) => q.doneWeeks ?? ">40");
    console.log(`\n== ${p}: ${r.sessionsPerWeek} sesji/tydz., ${r.minPerWeek} min/tydz. | wszystko po tygodniach: ${done.join(", ")}`);
    console.log(JSON.stringify({ ...r, chests: undefined, curve: undefined }));
    console.log("tydzień: " + r.curve.filter((c) => c.w % 2 === 0 && c.w <= 24).map((c) => `${c.w}:${c.items}it/L${c.lvl}/${c.fish}f`).join("  "));
  }
}
