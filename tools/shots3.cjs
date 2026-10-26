const { chromium } = require("playwright");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("http://localhost:8765/?debug"); await p.waitForTimeout(800);
  await p.fill(".login input", "lucja"); await p.$eval(".login .go", (e) => e.click()); await p.waitForTimeout(800);
  if (await p.$(".namecat")) { await p.$eval(".chips .chip", (e) => e.click()); await p.$eval(".namecat .go", (e) => e.click()); }
  await p.goto("http://localhost:8765/package.json"); await p.evaluate(() => {
    const k = Object.keys(localStorage).find((k) => k.startsWith("ninelives:save")); const s = JSON.parse(localStorage.getItem(k));
    const ws = ["dog","cat","horse","cow","pig","sheep","duck","rabbit","mouse","fish"]; ws.forEach((w,i)=> s.srs["v:animals:"+w] = { b: i%6, due: 0, n: 4, ok: 3, last: 0 });
    s.chests = ["gold","wood"]; s.story = 3; s.shadows = ["v:animals:dog","v:animals:cat","g:ps_3s:plain","v:animals:pig"]; s.weekly = { week: null, dmg: 120, claimed: [] };
    localStorage.setItem(k, JSON.stringify(s)); });
  await p.goto("http://localhost:8765/?debug"); await p.waitForTimeout(1500);
  for (const sel of [".album", ".weekly", ".story"]) { await p.$eval(sel, (e) => e.click()); await p.waitForTimeout(700); await p.screenshot({ path: `/tmp/shots/z${sel}.png` }); await p.$eval(".back", (e) => e.click()); await p.waitForTimeout(400); }
  await p.$eval(".chests", (e) => e.click()); await p.waitForTimeout(500); await p.$eval(".chest-open .go", (e) => e.click()); await p.waitForTimeout(1200); await p.screenshot({ path: `/tmp/shots/z-chest.png` });
  await p.goto("http://localhost:8765/?debug"); await p.waitForTimeout(1500);
  await p.$eval(".shadow", (e) => e.click()); await p.waitForTimeout(1800); await p.screenshot({ path: `/tmp/shots/z-shadow.png` });
  await b.close();
})();
