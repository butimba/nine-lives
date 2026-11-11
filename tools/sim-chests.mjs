// Symulacja skrzyń: ile skrzyń/dzień, kiedy kończą się przedmioty, ile rybek ze skrzyń. node tools/sim-chests.mjs
globalThis.localStorage ??= { getItem: () => null, setItem() {}, removeItem() {} };
const { freshSave } = await import("../js/state.js");
const { openChest, chestForFloor } = await import("../js/meta.js");
const NOV = new Date(2026, 10, 20), OFF = new Date(2026, 1, 1);
function sim(bossPerDay, days, date) {
  const s = freshSave("sim", {}); let floor = 0, chests = {}, fishFromChests = 0, items = 0, lastItemDay = 0;
  for (let d = 1; d <= days; d++) {
    const today = [];
    for (let b = 0; b < bossPerDay; b++) { floor += 5; if (b < 3) today.push(chestForFloor(floor, s)); }
    today.push(Math.random() < 0.4 ? "silver" : "wood"); // wyzwanie dnia
    if (d % 3 === 0) today.push(d % 6 ? "wood" : "silver"); // level co ~3 dni
    if (d % 7 === 0) today.push("silver"); // seria
    for (const c of today) { chests[c] = (chests[c] || 0) + 1; const c0 = s.coins; const r = openChest(s, c, date); if (r.kind === "coins") fishFromChests += s.coins - c0; else { items++; lastItemDay = d; } }
  }
  return { bossPerDay, days, floor, chests, perDay: +(Object.values(chests).reduce((a, b) => a + b, 0) / days).toFixed(1), items, lastItemDay, fishFromChestsPerDay: Math.round(fishFromChests / days) };
}
for (const b of [2, 4]) for (const days of [14, 30, 60]) console.log(JSON.stringify(sim(b, days, OFF)));
