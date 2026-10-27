// Zrzuty ekranu v2: dom o 7/13/19/23, bieg, intro bossa, każda mechanika, Wardrobe, rytuał skrzyni, wyniki.
// Użycie: node tools/shots-v2.cjs [port=8765] [login=lucja] [viewports=mobile,desktop]
// Wynik: $SHOTS_DIR (domyślnie /tmp/shots)/v2-<viewport>-<nazwa>.png
const fs = require("fs");
const { chromium } = require("playwright");
const B = require("./bot.cjs");

const [port = "8765", loginName = "lucja", vps = "mobile,desktop"] = process.argv.slice(2);

(async () => {
  fs.mkdirSync(B.SHOTS, { recursive: true });
  const browser = await chromium.launch();
  const allErrors = [];
  for (const vp of vps.split(",")) {
    const p = await B.newGame(browser, { vp, port: +port });
    const shot = (name) => p.screenshot({ path: `${B.SHOTS}/v2-${vp}-${name}.png` }).catch(() => {});
    const made = [];
    const S = async (name) => { await shot(name); made.push(name); };
    try {
      if (!(await B.login(p, loginName))) throw new Error("login failed");
      // zapis pod zrzuty: skrzynie do otwarcia, trochę rybek, życia pełne
      await B.patchSave(p, `s.chests = ["gold", "epic", "wood"]; s.coins = Math.max(s.coins, 900); s.lives = { n: 9, at: Date.now(), date: s.lives && s.lives.date || "" }; s.daily.ms = 0;`);
      // dom o różnych porach dnia
      for (const hour of [7, 13, 19, 23]) {
        await B.goHome(p, loginName, `hour=${hour}`);
        await B.sleep(900);
        await S(`home-h${hour}`);
      }
      await B.goHome(p, loginName);
      // bieg: dobre odpowiedzi, zrzut każdej mechaniki, perk, intro bossa, ujawnienie błędu
      const seen = new Set();
      const counts = { types: {}, mechs: {}, tasks: 0, clicks: 0, fallbacks: 0, wrongPlanned: 0 };
      let ranShot = false;
      const res = await B.playRun(p, {
        acc: 0.9, counts,
        onEvent: async (kind, st) => {
          if (kind === "mech") {
            if (!ranShot) { ranShot = true; await S("run"); }
            if (st.mech && !seen.has(st.mech)) { seen.add(st.mech); await B.sleep(300); await S(`mech-${st.mech}`); }
          }
          if (kind === "bossIntro" && !made.includes("boss-intro")) { await B.sleep(500); await S("boss-intro"); }
          if (kind === "perk" && !made.includes("perk")) await S("perk");
          if (kind === "reveal" && !made.includes("reveal")) await S("reveal");
        },
      });
      if (res.error) console.log(`[${vp}] run: ${res.error}`);
      await B.sleep(800); await S("results");
      await B.tap(p, "[data-act=continue]");
      if (!(await B.waitFor(p, "[data-act=climb]", 5000))) await B.goHome(p, loginName);
      // Wardrobe
      if (await B.tap(p, "[data-act=wardrobe]")) {
        await B.sleep(700); await S("wardrobe");
        await B.tap(p, "[data-act=back]");
        if (!(await B.waitFor(p, "[data-act=climb]", 4000))) await B.goHome(p, loginName);
      }
      // rytuał skrzyni
      await B.chestRitual(p, async (n) => S(n));
      console.log(`[${vp}] shots: ${made.join(", ")}`);
      console.log(`[${vp}] mechanics seen: ${[...seen].join(", ") || "none"}`);
    } catch (e) {
      console.log(`[${vp}] FAILURE: ${e.message}`);
      await shot("failure");
    }
    allErrors.push(...p.__errors.map((e) => `[${vp}] ${e}`));
    await p.context().close();
  }
  console.log("ERRORS:", allErrors.length ? "\n" + [...new Set(allErrors)].slice(0, 15).join("\n") : "none");
  await browser.close();
})();
