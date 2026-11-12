// Symulacja skrzyń przy realnym graniu (ten sam model co sim-economy: 2–4 sesje/tydz. + lekcje, dni bez gry).
// node tools/sim-chests.mjs → ile skrzyń jakiego typu na tydzień, do kiedy skrzynie dają przedmioty, ile rybek z nich.
import { simulate, PATTERNS } from "./sim-economy.mjs";
for (const p of Object.keys(PATTERNS)) {
  const r = simulate(p, 26, 1), per = {};
  for (const [k, v] of Object.entries(r.chests)) per[k] = +(v / r.weeks).toFixed(1);
  console.log(JSON.stringify({ pattern: p, sessionsPerWeek: r.sessionsPerWeek, chestsPerWeek: r.chestsPerWeek, byType: per,
    lastItemFromChestWeek: +(r.lastChestItemDay / 7).toFixed(1), chestFishPerWeek: r.fishPerWeek.chests, weeklyBeaten: r.weeklyBeaten }));
}
