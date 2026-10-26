const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("http://localhost:8765/?debug");
  await p.fill(".login input", "łucja"); await p.$eval(".login .go", (e) => e.click());
  await p.waitForTimeout(800);
  if (await p.$(".namecat")) { await p.$eval(".chips .chip", (e) => e.click()); await p.$eval(".namecat .go", (e) => e.click()); }
  await p.goto("http://localhost:8765/package.json"); await p.evaluate(() => {
    const k = Object.keys(localStorage).find((k) => k.startsWith("ninelives:save")); const s = JSON.parse(localStorage.getItem(k));
    for (const pat of ["ps_3s:plain", "ps_3s:es", "ps_3s:ies", "ps_neg:neg", "pc:form", "pc_vs_ps:mix", "ps_q:q"]) s.srs["g:" + pat] = { b: 3, due: 0, n: 3, ok: 3, last: 0 };
    for (const w of ["dog", "cat", "horse", "cow", "pig", "sheep"]) s.srs["v:animals:" + w] = { b: 4, due: 0, n: 4, ok: 4, last: 0 };
    s.coins = 900; s.xp = 900; s.chests = ["gold"]; s.story = 3; s.shadows = ["v:animals:dog", "v:animals:cat", "g:ps_3s:plain", "v:animals:pig"];
    s.rev = 999; localStorage.setItem(k, JSON.stringify(s));
  });
  await p.goto("http://localhost:8765/?debug"); await p.waitForTimeout(1200);
  await p.screenshot({ path: `/tmp/shots/y-home.png` });
  await p.$eval(".play", (e) => e.click());
  const seen = {};
  for (let i = 0; i < 26; i++) {
    await p.waitForTimeout(1100);
    const t = await p.evaluate(() => window.__task && window.__task.type);
    if (t && !seen[t] && await p.$(".task")) { seen[t] = 1; await p.screenshot({ path: `/tmp/shots/y-task-${t}.png` }); }
    const wrongNow = i === 4;
    await p.evaluate(async (wrong) => {
      const sl = (ms) => new Promise((r) => setTimeout(r, ms));
      const g = document.querySelector(".intro .go, .feedback .go, .perk"); if (g) return g.click();
      const t = window.__task; if (!t || !document.querySelector(".task")) return;
      const q = (s) => [...document.querySelectorAll(s)];
      if (t.options && q(".task .opt").length && ["cloze","word2pic","pic2word","listen2pic","pl2en"].includes(t.type)) { q(".task .opt")[t.options.findIndex((o) => wrong ? !o.ok : o.ok)].click(); return; }
      if (t.type === "fix") return q(".task .tok")[t.badIdx].click();
      if (t.type === "judge") return (t.correct ? document.querySelector(".judge-yes") : document.querySelector(".judge-no")).click();
      if (t.type === "build") { for (const w of t.words) { q(".task .tile").find((e) => e.textContent === w && !e.disabled)?.click(); await sl(40); } return; }
      if (t.type === "type") { document.querySelector(".typebox input").value = t.word.en; return document.querySelector(".typebox .go").click(); }
      if (t.type === "spell") { for (const ch of t.word.en.replace(/[^a-zA-Z]/g, "")) { q(".task .tile").find((e) => e.textContent === ch && !e.disabled)?.click(); await sl(40); } return; }
      if (t.type === "match") { for (const pr of t.pairs) { q(".mimg").find((e) => e.dataset.en === pr.en)?.click(); await sl(40); q(".mword").find((e) => e.dataset.en === pr.en)?.click(); await sl(40); } }
    }, wrongNow);
    if (wrongNow) { await p.waitForTimeout(1500); await p.screenshot({ path: `/tmp/shots/y-feedback.png` }); }
    if (await p.$(".perk-pick")) await p.screenshot({ path: `/tmp/shots/y-perk.png` });
  }
  console.log(Object.keys(seen));
  await b.close();
})();
