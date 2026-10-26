const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  for (const [vp, size] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 860 }]]) {
    const p = await b.newPage({ viewport: size });
    await p.goto("http://localhost:8765/?debug");
    await p.waitForTimeout(800);
    await p.screenshot({ path: `/tmp/shots/x-login-${vp}.png` });
    await p.fill(".login input", "nina"); await p.$eval(".login .go", (e) => e.click());
    await p.waitForTimeout(800);
    if (await p.$(".namecat")) { await p.$eval(".chips .chip", (e) => e.click()); await p.$eval(".namecat .go", (e) => e.click()); }
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `/tmp/shots/x-home-${vp}.png` });
    await p.$eval(".play", (e) => e.click());
    for (let i = 0; i < 7; i++) {
      await p.waitForTimeout(1300);
      await p.screenshot({ path: `/tmp/shots/x-run-${vp}-${i}.png` });
      await p.evaluate(() => { const g = document.querySelector(".intro .go, .feedback .go, .perk"); if (g) return g.click();
        const t = window.__task; if (!t) return; const opts = [...document.querySelectorAll(".task .opt")];
        if (t.options && opts.length) { const i = t.options.findIndex((o) => o.ok); opts[i].click(); if (t.type === "pic2listen") setTimeout(() => document.querySelector(".task .go")?.click(), 100); } });
      await p.waitForTimeout(450);
      if (i == 2) await p.screenshot({ path: `/tmp/shots/x-attack-${vp}.png` });
    }
    await p.close();
  }
  await b.close();
})();
