// Bot grający w grę: node tools/bot.cjs [login] [accuracy] [runs] [viewport]
const { chromium } = require("playwright");
const [login = "lucja", acc = "0.85", runs = "2", vp = "mobile"] = process.argv.slice(2);
const ACC = +acc;
(async () => {
  const b = await chromium.launch();
  const size = vp === "mobile" ? { width: 390, height: 844 } : { width: 1280, height: 860 };
  const p = await b.newPage({ viewport: size });
  const errors = [];
  p.on("pageerror", (e) => errors.push("PAGEERR " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !/supabase|Failed to load resource|cloud/i.test(m.text())) errors.push("CONSOLE " + m.text()); });
  await p.goto("http://localhost:8765/?debug");
  await p.fill(".login input", login);
  await p.$eval(".login .go", (e) => e.click());
  await p.waitForTimeout(600);
  if (await p.$(".namecat")) { await p.$eval(".chips .chip", (e) => e.click()); await p.$eval(".namecat .go", (e) => e.click()); }
  await p.waitForSelector(".home");
  await p.screenshot({ path: `/tmp/shots/${login}-home-${vp}.png` });
  const counts = {};
  for (let r = 0; r < +runs; r++) {
    await p.$eval(".play", (e) => e.click());
    let steps = 0;
    while (steps++ < 200) {
      await p.waitForTimeout(120);
      if (await p.$(".results")) break;
      if (await p.$(".perk-pick")) { await p.$eval(".perk", (e) => e.click()); continue; }
      if (await p.$(".intro .go")) { await p.$eval(".intro .go", (e) => e.click()); continue; }
      if (await p.$(".feedback .go")) { await p.$eval(".feedback .go", (e) => e.click()); continue; }
      const t = await p.evaluate(() => window.__task && { type: window.__task.type, key: window.__task.key, done: !document.querySelector(".task") || document.querySelector(".task button:not(:disabled)") == null });
      if (!t || !(await p.$(".task"))) continue;
      const busy = await p.evaluate(() => !document.querySelector(".task .opt:not(:disabled), .task .tile:not(:disabled), .task .tok:not(:disabled), .task input:not(:disabled), .task .listen:not(:disabled)"));
      if (busy) continue;
      counts[t.type] = (counts[t.type] || 0) + 1;
      if (steps === 6 || (steps % 25 === 0)) await p.screenshot({ path: `/tmp/shots/${login}-${vp}-r${r}-s${steps}-${t.type}.png` });
      const good = Math.random() < ACC;
      await p.evaluate(async (good) => {
        const t = window.__task; const sl = (ms) => new Promise((r) => setTimeout(r, ms));
        await sl(800);
        const q = (s) => [...document.querySelectorAll(s)];
        const clickText = (sel, txt) => { const el = q(sel).find((e) => e.textContent.trim() === txt && !e.disabled); el && el.click(); return !!el; };
        if (t.kind === "vocab") {
          const w = t.word;
          if (["word2pic", "listen2pic", "pic2word", "pl2en"].includes(t.type)) {
            const idx = t.options.findIndex((o) => (good ? o.ok : !o.ok));
            q(".task .opt")[idx].click();
          } else if (t.type === "pic2listen") {
            const idx = t.options.findIndex((o) => (good ? o.ok : !o.ok)); q(".task .opt")[idx].click(); await sl(100); document.querySelector(".task .go").click();
          } else if (t.type === "spell") {
            const letters = (good ? w.en : w.en.split("").reverse().join("")).replace(/[^a-zA-Z]/g, "").split("");
            for (const ch of letters) { const el = q(".task .tile").find((e) => e.textContent === ch && !e.disabled); if (el) el.click(); else { const any = q(".task .tile").find((e) => !e.disabled); any && any.click(); } await sl(60); }
          } else if (t.type === "type") {
            const inp = document.querySelector(".typebox input"); inp.value = good ? w.en : "zzzz"; document.querySelector(".typebox .go").click();
          } else if (t.type === "match") {
            for (const pr of t.pairs) {
              q(".mimg").find((e) => e.dataset.en === pr.en && !e.disabled).click(); await sl(80);
              const target = good ? pr.en : q(".mword").find((e) => e.dataset.en !== pr.en && !e.disabled)?.dataset.en || pr.en;
              q(".mword").find((e) => e.dataset.en === target && !e.disabled)?.click(); await sl(80);
              if (!good) { q(".mimg").find((e) => e.dataset.en === pr.en && !e.disabled)?.click(); await sl(50); q(".mword").find((e) => e.dataset.en === pr.en && !e.disabled)?.click(); await sl(80); }
            }
          }
        } else {
          if (t.type === "cloze") { const idx = t.options.findIndex((o) => (good ? o.ok : !o.ok)); q(".task .opt")[idx].click(); }
          else if (t.type === "fix") { const toks = q(".task .tok"); (good ? toks[t.badIdx] : toks[(t.badIdx + 1) % toks.length]).click(); }
          else if (t.type === "judge") { (t.correct === good ? document.querySelector(".judge-yes") : document.querySelector(".judge-no")).click(); }
          else if (t.type === "build") {
            const order = good ? t.words : [...t.words].reverse();
            for (const w of order) { const el = q(".task .tile").find((e) => e.textContent === w && !e.disabled); el && el.click(); await sl(50); }
          }
        }
      }, good);
      await p.waitForTimeout(200);
    }
    await p.screenshot({ path: `/tmp/shots/${login}-results-${vp}-r${r}.png` });
    const resTxt = await p.$eval(".results", (e) => e.innerText.replace(/\s+/g, " ").slice(0, 200)).catch(() => "NO RESULTS (stuck?)");
    console.log(`run ${r}:`, resTxt);
    if (await p.$(".results .back")) await p.$eval(".results .back", (e) => e.click());
    await p.waitForTimeout(400);
  }
  console.log("task types:", JSON.stringify(counts));
  // przegląd stron
  for (const sel of [".shop", ".talents", ".wardrobe", ".album", ".story", ".weekly", ".set"]) {
    await p.$eval(sel, (e) => e.click()); await p.waitForTimeout(500);
    await p.screenshot({ path: `/tmp/shots/${login}-page-${sel.slice(1)}-${vp}.png`, fullPage: true });
    await p.$eval(".back", (e) => e.click()); await p.waitForTimeout(300);
  }
  if (await p.$(".chests.glow")) { await p.$eval(".chests", (e) => e.click()); await p.waitForTimeout(300); await p.$eval(".chest-open .go", (e) => e.click()); await p.waitForTimeout(900); await p.screenshot({ path: `/tmp/shots/${login}-chest-${vp}.png` }); }
  const save = await p.evaluate(() => { const k = Object.keys(localStorage).find((k) => k.startsWith("ninelives:save")); const s = JSON.parse(localStorage.getItem(k)); return { xp: s.xp, coins: s.coins, tower: s.tower, srs: Object.keys(s.srs).length, conf: s.confusions, shadows: s.shadows.length, skills: s.skills }; });
  console.log("save:", JSON.stringify(save));
  console.log("ERRORS:", errors.length ? errors.slice(0, 10).join("\n") : "none");
  await b.close();
})();
