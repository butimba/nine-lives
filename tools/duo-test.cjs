// Test duetu (Łucja ↔ Matylda) w prawdziwej przeglądarce z UDAWANYM Supabase (pamięć w Node) — nigdy nie dotyka prawdziwej bazy.
// Użycie: python3 -m http.server <port> & node tools/duo-test.cjs [port=8765] [season=winter|none]
// Sprawdza: prezent 5 rybek (raz dziennie, bez podwójnego liczenia), powiadomienie z IMIENIEM KOTA, wspólne wyzwanie
// (oboje muszą pomóc), flagę przyjaciółki, ukrywanie duetu offline. Zrzuty: $SHOTS_DIR/duo-*.png
const fs = require("fs");
const { chromium } = require("playwright");
const B = require("./bot.cjs");

const [port = "8765", season = ""] = process.argv.slice(2);
const SH = B.SHOTS;
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };

// ---------- fake Supabase REST (saves/weekly/skins) ----------
const store = { saves: new Map(), weekly: [] };
let realHits = 0;
async function fakeSupabase(route) {
  const req = route.request();
  const u = new URL(req.url());
  const path = u.pathname.replace(/^\/rest\/v1\//, "");
  const q = u.searchParams;
  const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: body == null ? "" : JSON.stringify(body) });
  const idEq = (q.get("id") || "").replace(/^eq\./, "");
  if (path === "saves") {
    if (req.method() === "POST") {
      const row = JSON.parse(req.postData() || "{}");
      store.saves.set(row.id, { ...row, updated_at: new Date().toISOString() });
      return json(null, 201);
    }
    const sel = (q.get("select") || "").split(",");
    const rows = idEq ? (store.saves.has(idEq) ? [store.saves.get(idEq)] : []) : [...store.saves.values()];
    return json(rows.map((r) => Object.fromEntries(sel.map((k) => [k, r[k]]))));
  }
  if (path === "weekly") return req.method() === "POST" ? json(null, 201) : json([]);
  if (path === "skins") return json([]);
  return json([]);
}

async function player(browser, vp, { offline = false } = {}) {
  const size = B.VIEWPORTS[vp];
  const context = await browser.newContext({ viewport: size, hasTouch: vp === "mobile", deviceScaleFactor: vp === "mobile" ? 2 : 1 });
  // każde wyjście do *.supabase.co trafia do atrapy (albo jest blokowane w trybie offline) — nigdy do sieci
  await context.route(/supabase\.co/, (r) => { realHits++; return offline ? r.abort() : fakeSupabase(r); });
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("PAGEERR " + (e.stack || e.message).split("\n").slice(0, 3).join(" | ")));
  p.on("console", (m) => { if (m.type() === "error" && !/supabase|Failed to load resource|cloud|net::ERR|fetch/i.test(m.text())) errors.push("CONSOLE " + m.text()); });
  p.__base = `http://localhost:${port}/`; p.__query = season ? "season=" + season : ""; p.__errors = errors;
  return p;
}
const save = (p) => p.evaluate(() => { const s = window.__nl.save(); return { id: s.id, coins: s.coins, cat: s.catName, duo: s.duo, best: s.tower.best }; });
const text = (p, sel) => p.evaluate((sel) => { const e = document.querySelector(sel); return e ? e.textContent : ""; }, sel);
const setSave = (p, src) => p.evaluate((src) => { const s = window.__nl.save(); new Function("s", src)(s); }, src);
const persistNow = (p) => p.evaluate(() => import("./js/state.js").then((m) => m.persist(true)));

(async () => {
  fs.mkdirSync(SH, { recursive: true });
  const browser = await chromium.launch();
  const lu = await player(browser, "mobile"), ma = await player(browser, "mobile");
  ok(await B.login(lu, "lucja"), "lucja logs in");
  ok(await B.login(ma, "matylda"), "matylda logs in");
  await B.sleep(2500);
  const L0 = await save(lu), M0 = await save(ma);
  ok(store.saves.has(L0.id) && store.saves.has(M0.id), "both saves reached the fake cloud");
  // Matylda: wysoko w wieży (flaga), Łucja: niżej
  await setSave(ma, "s.tower.best = 7; s.tower.checkpoint = 5;"); await persistNow(ma); await B.sleep(400);
  ok(store.saves.get(M0.id).pub.best === 7, "pub.best published");

  // --- Łucja widzi kota Matyldy + przycisk prezentu ---
  await B.goHome(lu, "lucja"); await B.sleep(2200);
  ok(await B.visible(lu, "[data-act=duo-gift]"), "send-a-fish button near partner's cat");
  ok((await text(lu, ".duo-tag")).includes(M0.cat), "partner shown by CAT name");
  ok(await B.visible(lu, "[data-act=duo-flag]"), "partner flag on the tower");
  await lu.screenshot({ path: `${SH}/duo-home-lucja.png` });
  const luCoins = (await save(lu)).coins;
  await B.tap(lu, "[data-act=duo-gift]"); await B.sleep(1600);
  ok((await save(lu)).coins === luCoins, "sending costs the sender nothing");
  ok(await B.visible(lu, "[data-act=duo-sent]"), "button turns into 'sent!'");
  await lu.screenshot({ path: `${SH}/duo-home-lucja-sent.png` });
  ok(!(await B.visible(lu, "[data-act=duo-gift]")), "only one gift a day");
  ok(store.saves.get(L0.id).pub.duo && store.saves.get(L0.id).pub.duo.giftTo === M0.id, "pub.duo.giftTo = partner id");

  // --- Matylda dostaje prezent przy następnej wizycie w domu ---
  const mc0 = (await save(ma)).coins;
  await B.goHome(ma, "matylda"); await B.sleep(1500);
  ok(await B.visible(ma, ".duo-pop"), "juicy gift notification");
  const pop = await text(ma, ".duo-pop");
  ok(pop.includes(L0.cat) && /sent you a fish/.test(pop), `notification uses Łucja's CAT name (${pop.trim()})`);
  await ma.screenshot({ path: `${SH}/duo-home-matylda-gift.png` });
  await B.sleep(2500);
  const mc1 = (await save(ma)).coins;
  ok(mc1 === mc0 + 5, `+5 fish (${mc0} -> ${mc1})`);
  await B.goHome(ma, "matylda"); await B.sleep(2500);
  ok((await save(ma)).coins === mc1 && !(await B.visible(ma, ".duo-pop")), "no double count after reload");

  // --- wspólne wyzwanie: tylko Łucja gra → nie wystarczy ---
  await setSave(lu, "const d=new Date();const t=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; s.duo.nDay=t; s.duo.n=28;");
  await persistNow(lu); await B.sleep(300);
  await B.goHome(ma, "matylda"); await B.sleep(800);
  await B.tap(ma, "[data-act=daily]"); await B.sleep(1800);
  ok(await B.visible(ma, ".tg-card"), "Together card on Daily");
  ok(!(await B.visible(ma, "[data-act=duo-claim]")), "not claimable when Matylda has 0");
  await ma.screenshot({ path: `${SH}/duo-daily-matylda-0.png` });
  await setSave(ma, "const d=new Date();const t=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; s.duo.nDay=t; s.duo.n=3;");
  await persistNow(ma); await B.sleep(300);
  await B.tap(ma, "[data-act=back]"); await B.sleep(500);
  await B.tap(ma, "[data-act=daily]"); await B.sleep(1500);
  // cache partnera 45 s: wymuś świeże dane
  await ma.evaluate(() => import("./js/meta.js").then((m) => m.forgetPartner()));
  await B.tap(ma, "[data-act=back]"); await B.sleep(400); await B.tap(ma, "[data-act=daily]"); await B.sleep(1800);
  ok(await B.visible(ma, "[data-act=duo-claim]"), "claimable when both helped (28 + 3 >= 30)");
  await ma.screenshot({ path: `${SH}/duo-daily-matylda-ready.png` });
  const mc2 = (await save(ma)).coins;
  await B.tap(ma, "[data-act=duo-claim]"); await B.sleep(1500);
  const ms = await save(ma);
  ok(ms.coins === mc2 + 30, "duo reward: +30 fish");
  ok(!(await B.visible(ma, "[data-act=duo-claim]")), "claimed once");
  await ma.screenshot({ path: `${SH}/duo-daily-matylda-claimed.png` });
  // Łucja też może odebrać
  await lu.evaluate(() => import("./js/meta.js").then((m) => m.forgetPartner()));
  await B.goHome(lu, "lucja"); await B.sleep(600);
  await B.tap(lu, "[data-act=daily]"); await B.sleep(1800);
  ok(await B.visible(lu, "[data-act=duo-claim]"), "partner can claim too");
  await lu.screenshot({ path: `${SH}/duo-daily-lucja.png` });

  // --- offline: duet się chowa ---
  const off = await player(browser, "desktop", { offline: true });
  ok(await B.login(off, "lucja"), "offline login");
  await B.sleep(1500);
  ok(!(await B.visible(off, "[data-act=duo-gift]")) && !(await B.visible(off, ".duo-tag")), "offline: no duet UI on home");
  await B.tap(off, "[data-act=daily]"); await B.sleep(1200);
  ok(!(await B.visible(off, ".tg-card")), "offline: no Together card");
  await off.screenshot({ path: `${SH}/duo-offline-daily.png` });

  const errs = [...lu.__errors, ...ma.__errors, ...off.__errors];
  console.log(`fake supabase requests: ${realHits} (all intercepted)`);
  console.log(`\n${pass} passed, ${fail} failed`);
  console.log("ERRORS:", errs.length ? "\n" + [...new Set(errs)].slice(0, 12).join("\n") : "none");
  await browser.close();
  process.exit(fail || errs.length ? 1 : 0);
})();
