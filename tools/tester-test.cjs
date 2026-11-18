const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("http://localhost:8765/"); await p.fill(".login input", "Max"); await p.$eval(".login .go", (e) => e.click()); await p.waitForTimeout(800);
  if (await p.$(".namecat")) { await p.$eval(".chips .chip", (e) => e.click()); await p.$eval(".namecat .go", (e) => e.click()); }
  await p.waitForTimeout(600); await p.$eval(".set", (e) => e.click()); await p.waitForTimeout(400);
  for (const c of [".t-coins", ".t-xp", ".t-chest"]) { await p.$eval(c, (e) => e.click()); await p.waitForTimeout(200); }
  await p.$eval(".back", (e) => e.click()); await p.waitForTimeout(500);
  console.log((await p.innerText(".topbar")).replace(/\s+/g, " "), "| chests:", await p.$eval(".chests", (e) => e.innerText.replace(/\s+/g, " ")));
  await p.$eval(".set", (e) => e.click()); await p.waitForTimeout(300); await p.$eval(".t-reset", (e) => e.click()); await p.waitForTimeout(500);
  console.log("after reset screen:", !!(await p.$(".namecat"))); await b.close(); })();
