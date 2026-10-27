// Bot grający w Nine Lives v2 (kontrakt debug: window.__nl + [data-act=...]).
// Użycie: node tools/bot.cjs [login=lucja] [accuracy=0.85] [runs=2] [viewport=mobile|desktop] [port=8765]
// Najpierw: python3 -m http.server <port>
// Klika PRAWDZIWE współrzędne z __nl.mech.targets() (fallback: __nl.mech.answer(good)),
// wpisuje słowa w .spell-input input, przechodzi perki/bossa/wyniki, odwiedza Wardrobe i otwiera skrzynię.
// Chmura (Supabase) jest blokowana — bot nigdy nie nadpisze prawdziwego zapisu ucznia.
const fs = require("fs");
const { chromium } = require("playwright");

const SHOTS = process.env.SHOTS_DIR || "/tmp/shots";
const VIEWPORTS = { mobile: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- helpers (eksportowane dla shots-v2.cjs) ----------
async function newGame(browser, { vp = "mobile", port = 8765, query = "" } = {}) {
  const size = VIEWPORTS[vp] || VIEWPORTS.mobile;
  const context = await browser.newContext({ viewport: size, hasTouch: vp === "mobile", deviceScaleFactor: vp === "mobile" ? 2 : 1 });
  await context.route(/supabase\.co/, (r) => r.abort());
  const p = await context.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push("PAGEERR " + (e.stack || e.message).split("\n").slice(0, 3).join(" | ")));
  p.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (/supabase|Failed to load resource|cloud|net::ERR|fetch/i.test(t)) return;
    errors.push("CONSOLE " + t);
  });
  p.__base = `http://localhost:${port}/`;
  p.__query = query;
  p.__errors = errors;
  return p;
}
const url = (p, extra = "") => p.__base + "?debug" + (p.__query ? "&" + p.__query : "") + (extra ? "&" + extra : "");

// pierwszy WIDOCZNY element pasujący do selektora → środek w px klienta
async function visible(p, sel) {
  return p.evaluate((sel) => {
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect();
      const st = getComputedStyle(el);
      if (r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none" && !el.disabled && +st.opacity !== 0)
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return null;
  }, sel).catch(() => null);
}
async function tap(p, sel) {
  const c = await visible(p, sel);
  if (!c) return false;
  await p.mouse.click(c.x, c.y);
  return true;
}
async function waitFor(p, sel, ms = 8000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await visible(p, sel)) return true; await sleep(100); }
  return false;
}
const nl = (p) => p.evaluate(() => {
  const n = window.__nl; if (!n) return null;
  const t = n.task || null;
  return { screen: n.screen, runState: n.runState, mech: n.mech && n.mech.name,
    task: t && { type: t.type, key: t.key, kind: t.kind, answer: t.answer != null ? String(t.answer) : (t.word && t.word.en) || null } };
}).catch(() => null);

async function login(p, name, extra = "") {
  p.__login = name;
  if (!(await visible(p, "#login-name"))) await p.goto(url(p, extra));
  if (!(await waitFor(p, "#login-name", 10000))) throw new Error("no #login-name");
  await p.fill("#login-name", name);
  await tap(p, "[data-act=login]");
  // nadawanie imienia kotu (tylko przy pierwszym logowaniu)
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    if (await visible(p, "[data-act=climb]")) return true;
    if (await visible(p, "[data-act=name-random]")) {
      await tap(p, "[data-act=name-random]"); await sleep(150);
      await tap(p, "[data-act=name-ok]"); await sleep(300);
    }
    await sleep(150);
  }
  return !!(await visible(p, "[data-act=climb]"));
}

// przejdź na ekran domowy (po przeładowaniu gra może znów pokazać logowanie)
async function goHome(p, name, extra = "") {
  await p.goto(url(p, extra));
  const t0 = Date.now();
  while (Date.now() - t0 < 10000) {
    if (await visible(p, "[data-act=climb]")) return true;
    if (await visible(p, "#login-name")) return login(p, name, extra);
    await sleep(150);
  }
  return false;
}

// zmiana zapisu w localStorage (np. skrzynie do zrzutów) + przeładowanie
async function patchSave(p, fnSrc) {
  await p.evaluate((src) => {
    const k = Object.keys(localStorage).find((k) => k.startsWith("ninelives:save:"));
    if (!k) return;
    const s = JSON.parse(localStorage.getItem(k));
    new Function("s", src)(s);
    s.rev = (s.rev || 0) + 1000;
    localStorage.setItem(k, JSON.stringify(s));
  }, fnSrc);
  return goHome(p, p.__login || "lucja");
}

// Jeden bieg. onEvent(kind, info) — do zrzutów ('mech' przy nowej mechanice, 'bossIntro', 'reveal', 'perk').
async function playRun(p, { acc = 0.85, counts, onEvent = async () => {}, maxMs = 6 * 60 * 1000, log = () => {} } = {}) {
  if (!(await tap(p, "[data-act=climb]"))) return { error: "no climb button" };
  const t0 = Date.now();
  let lastKey = null, good = true, sameTicks = 0, lastState = null, stuck = 0;
  while (Date.now() - t0 < maxMs) {
    await sleep(120);
    if (await visible(p, "[data-act=continue]")) return { ok: true };
    const st = await nl(p);
    if (!st) { if (++stuck > 80) return { error: "no __nl" }; continue; }
    if (st.screen === "results") { await sleep(300); continue; }
    if (st.screen === "home" && Date.now() - t0 > 3000) return { error: "back home without results" };
    if (st.runState !== lastState) { lastState = st.runState; if (["bossIntro", "perk", "reveal"].includes(st.runState)) await onEvent(st.runState, st); }
    if (await visible(p, "[data-act=perk]")) { await tap(p, "[data-act=perk]"); continue; }
    if (await visible(p, "[data-act=next]")) { await tap(p, "[data-act=next]"); continue; }
    if (st.runState !== "task" || !st.task) {
      if (st.runState === "bossIntro" || st.runState === "intro") {
        // intro bez przycisku → tap w środek sceny
        if (++sameTicks % 15 === 0) { const vp = p.viewportSize(); await p.mouse.click(vp.width / 2, vp.height / 2); }
      }
      continue;
    }
    const key = st.task.key + "|" + st.task.type + "|" + st.mech;
    const isNew = await p.evaluate(() => { const t = window.__nl.task; const n = window.__botLastTask !== t; window.__botLastTask = t; return n; });
    if (isNew) {
      good = Math.random() < acc;
      sameTicks = 0; lastKey = key;
      counts.types[st.task.type] = (counts.types[st.task.type] || 0) + 1;
      counts.mechs[st.mech] = (counts.mechs[st.mech] || 0) + 1;
      counts.tasks++;
      if (!good) counts.wrongPlanned++;
      await sleep(350); // dziecko też chwilę patrzy
      await onEvent("mech", st);
      log(`  task ${st.task.type} -> ${st.mech} ${good ? "good" : "BAD"}`);
    }
    sameTicks++;
    // pisanie
    if (await visible(p, ".spell-input input")) {
      const word = good ? (st.task.answer || "cat") : "zzqx";
      await p.fill(".spell-input input", "");
      await p.type(".spell-input input", word, { delay: 25 });
      if (!(await tap(p, "[data-act=cast]"))) await p.press(".spell-input input", "Enter");
      counts.clicks++;
      await sleep(500);
      continue;
    }
    // prawdziwe kliknięcie w cel
    const targets = await p.evaluate(() => { try { return window.__nl.mech.targets() || []; } catch (e) { return []; } });
    const pickT = good ? targets.find((t) => t.ok) : targets.find((t) => !t.ok) || targets.find((t) => t.ok);
    const vp = p.viewportSize();
    if (pickT && sameTicks < 60 && pickT.x >= 0 && pickT.y >= 0 && pickT.x <= vp.width && pickT.y <= vp.height) {
      await p.mouse.click(pickT.x, pickT.y);
      counts.clicks++;
      await sleep(good ? 260 : 400);
      if (!good) good = true; // po jednej pomyłce reszta sekwencji dobrze (catch / pary)
    } else if (sameTicks >= 25) {
      // cel poza ekranem / brak celów / zablokowany → fallback z kontraktu
      await p.evaluate((g) => { try { window.__nl.mech.answer(g); } catch (e) { console.warn("answer() failed", e); } }, good);
      counts.fallbacks++;
      sameTicks = 0;
      await sleep(500);
    }
  }
  return { error: "timeout" };
}

async function resultsText(p) {
  return p.evaluate(() => {
    const b = document.querySelector("[data-act=continue]");
    const root = (b && (b.closest("section,main,.screen,.results") || b.parentElement)) || document.body;
    return root.innerText.replace(/\s+/g, " ").slice(0, 220);
  }).catch(() => "?");
}

async function chestRitual(p, shot) {
  if (!(await tap(p, "[data-act=chest]"))) return false;
  await sleep(500);
  if (shot) await shot("chest-0");
  for (let i = 0; i < 4; i++) {
    if (!(await tap(p, "[data-act=tap-chest]"))) break;
    await sleep(380);
    if (shot && i === 1) await shot("chest-cracks");
  }
  await sleep(1400);
  if (shot) await shot("chest-reward");
  await sleep(1200);
  if (!(await tap(p, "[data-act=continue]"))) await tap(p, "[data-act=back]");
  await sleep(500);
  return true;
}

async function saveSummary(p) {
  return p.evaluate(() => {
    const s = (window.__nl && window.__nl.save && window.__nl.save()) || (() => {
      const k = Object.keys(localStorage).find((k) => k.startsWith("ninelives:save:")); return k && JSON.parse(localStorage.getItem(k));
    })();
    if (!s) return null;
    return { v: s.v, xp: s.xp, coins: s.coins, lives: s.lives, dailyMin: +((s.daily && s.daily.ms || 0) / 60000).toFixed(1), tower: s.tower,
      chests: s.chests, story: s.story, skins: s.owned.skins.length, hats: s.owned.hats.length, equipped: s.equipped,
      srs: Object.keys(s.srs).length, shadows: s.shadows.length, conf: s.confusions, streak: s.streak && s.streak.count, voice: s.settings.voice };
  }).catch((e) => "ERR " + e.message);
}

module.exports = { newGame, login, goHome, playRun, chestRitual, saveSummary, resultsText, tap, visible, waitFor, nl, patchSave, url, sleep, VIEWPORTS, SHOTS };

// ---------- main ----------
if (require.main === module) {
  const [loginName = "lucja", acc = "0.85", runs = "2", vp = "mobile", port = "8765"] = process.argv.slice(2);
  (async () => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const browser = await chromium.launch();
    const p = await newGame(browser, { vp, port: +port });
    const shot = (name) => p.screenshot({ path: `${SHOTS}/${loginName}-${vp}-${name}.png` }).catch(() => {});
    const counts = { types: {}, mechs: {}, tasks: 0, clicks: 0, fallbacks: 0, wrongPlanned: 0 };
    const verbose = !!process.env.VERBOSE;
    try {
      if (!(await login(p, loginName))) throw new Error("login failed (no [data-act=climb])");
      await shot("home");
      const seenMech = new Set();
      for (let r = 0; r < +runs; r++) {
        const st0 = await saveSummary(p);
        if (st0 && st0.lives && st0.lives.n === 0) { console.log(`run ${r}: cat is asleep (0 lives) — stop`); break; }
        const res = await playRun(p, {
          acc: +acc, counts, log: verbose ? console.log : () => {},
          onEvent: async (kind, st) => {
            if (kind === "mech" && st.mech && !seenMech.has(st.mech)) { seenMech.add(st.mech); await shot(`mech-${st.mech}`); }
            if (kind === "bossIntro" && r === 0) await shot("boss-intro");
            if (kind === "perk" && r === 0) await shot("perk");
            if (kind === "reveal" && r === 0) await shot("reveal");
          },
        });
        await shot(`results-r${r}`);
        console.log(`run ${r}:`, res.error ? `ERROR ${res.error}` : await resultsText(p));
        if (res.error) { const st = await nl(p); console.log("  state:", JSON.stringify(st)); }
        await tap(p, "[data-act=continue]");
        if (!(await waitFor(p, "[data-act=climb]", 5000))) await goHome(p, loginName);
        await sleep(400);
      }
      // przegląd ekranów
      for (const act of ["wardrobe", "skills", "cards", "moon", "settings"]) {
        if (!(await tap(p, `[data-act=${act}]`))) { console.log(`(no [data-act=${act}])`); continue; }
        await sleep(600); await shot(`page-${act}`);
        await tap(p, "[data-act=back]");
        if (!(await waitFor(p, "[data-act=climb]", 4000))) await goHome(p, loginName);
      }
      if (await chestRitual(p, shot)) console.log("chest ritual: done");
      else console.log("chest ritual: no chest");
    } catch (e) {
      console.log("BOT FAILURE:", e.message);
      await shot("failure");
    }
    console.log("task types:", JSON.stringify(counts.types));
    console.log("mechanics:", JSON.stringify(counts.mechs));
    console.log(`tasks: ${counts.tasks}, clicks: ${counts.clicks}, fallbacks(answer()): ${counts.fallbacks}, planned wrong: ${counts.wrongPlanned}`);
    console.log("save:", JSON.stringify(await saveSummary(p)));
    console.log("ERRORS:", p.__errors.length ? "\n" + [...new Set(p.__errors)].slice(0, 15).join("\n") : "none");
    await browser.close();
  })();
}
