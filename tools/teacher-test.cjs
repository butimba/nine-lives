const { chromium } = require("playwright");
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1100, height: 900 } });
  p.on("pageerror", (e) => console.log("ERR", e.message));
  await p.goto("http://localhost:8765/teacher.html"); await p.fill("input", "4721"); await p.$eval("button", (e) => e.click()); await p.waitForTimeout(2500);
  console.log((await p.innerText("body")).slice(0, 300)); await p.screenshot({ path: "/tmp/shots/teacher.png" }); await b.close(); })();
