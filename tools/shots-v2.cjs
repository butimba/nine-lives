// Zrzuty ekranu v2: dom o 7/13/19/23, bieg, intro bossa, każda mechanika, wyniki, rytuał prezentu (gift) i skrzyni,
// Daily, wybór mocy, Skills, Cards (+ duża karta), Moon Diary, Wardrobe, edytor skórek.
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
      // zapis pod zrzuty (zmiana w pamięci + przeładowanie; patchSave przez localStorage nadpisuje beforeunload):
      // prezent od nauczyciela zostaje pierwszy, skrzynie do otwarcia, rybki, pełne życia, level 5 (moce), 3 strony fabuły
      const patch = async (src) => { await p.evaluate((src) => { new Function("s", src)(window.__nl.save()); }, src); return B.goHome(p, loginName); };
      await patch(`s.chests = [...s.chests.filter((c) => String(c).startsWith("gift:")), "gold", "epic", "wood"]; s.coins = Math.max(s.coins, 900); s.lives = { n: 9, at: Date.now(), date: s.lives && s.lives.date || "" }; s.daily.ms = 0; if (s.xp < 700) s.xp = 700; s.story = Math.max(s.story || 0, 3);`);
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
      // rytuał prezentu od nauczyciela (gift:… jest pierwszy w kolejce) + zwykłej skrzyni
      await B.sleep(3000); // toasty po powrocie do domu
      await S("home-gift");
      await B.chestRitual(p, async (n) => S("gift-" + n));
      if (!(await B.waitFor(p, "[data-act=climb]", 3000))) await B.goHome(p, loginName);
      await B.chestRitual(p, async (n) => S(n));
      if (!(await B.waitFor(p, "[data-act=climb]", 3000))) await B.goHome(p, loginName);
      const page = async (act, name, after) => {
        await B.sleep(600);
        if (!(await B.tap(p, `[data-act=${act}]`))) return;
        await B.sleep(800);
        if (after) await after();
        await S(name);
        await p.screenshot({ path: `${B.SHOTS}/v2-${vp}-${name}-full.png`, fullPage: true }).catch(() => {});
        await B.tap(p, "[data-act=back]");
        if (!(await B.waitFor(p, "[data-act=climb]", 4000))) await B.goHome(p, loginName);
      };
      // Daily, moce, Skills, Cards, Moon Diary
      await page("daily", "daily");
      if (await B.tap(p, "[data-act=power-pick]")) {
        await B.sleep(500); await B.tap(p, "[data-act=power-toggle]"); await B.sleep(300); await S("power-pick");
        await B.tap(p, "[data-act=power-done]"); await B.sleep(400);
      }
      await page("skills", "skills");
      await page("cards", "cards", async () => {
        if (await B.tap(p, "[data-act=card]")) { await B.sleep(600); await S("card-big"); await B.tap(p, ".card-back [data-act=close]"); await B.sleep(300); }
      });
      await page("moon", "story");
      // Wardrobe + edytor skórek (kilka pociągnięć pędzlem i wiadrem)
      await B.sleep(600);
      if (await B.tap(p, "[data-act=wardrobe]") && await B.waitFor(p, "[data-act=skin-editor]", 4000)) {
        await B.sleep(700); await S("wardrobe");
        if (await B.tap(p, "[data-act=skin-editor]")) {
          await B.sleep(700);
          const box = await p.evaluate(() => { const r = document.querySelector(".ed-canvas").getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; });
          await B.tap(p, "[data-act=color][data-c=b]"); await B.tap(p, "[data-act=tool][data-tool=fill]");
          await p.mouse.click(box.x + box.w * 0.45, box.y + box.h * 0.75);
          await B.tap(p, "[data-act=color][data-c=y]"); await B.tap(p, "[data-act=tool][data-tool=brush]");
          await p.mouse.move(box.x + box.w * 0.3, box.y + box.h * 0.6); await p.mouse.down();
          await p.mouse.move(box.x + box.w * 0.6, box.y + box.h * 0.62, { steps: 8 }); await p.mouse.up();
          await B.sleep(900); await S("editor");
          await B.tap(p, "[data-act=skin-send]"); await B.sleep(600); await S("editor-send");
          await B.tap(p, "[data-act=back]"); await B.sleep(600); await S("wardrobe-diy");
        }
        await B.tap(p, "[data-act=back]");
        if (!(await B.waitFor(p, "[data-act=climb]", 4000))) await B.goHome(p, loginName);
      }
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
