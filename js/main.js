// NINE LIVES v2 — start aplikacji: paleta, router, logowanie, ekrany, tryb debug.
import { register, go, current, onRoute } from "./ui/router.js";
import { app, h, toast } from "./ui/components.js";
import { loginScreen, nameScreen, login, lastLogin } from "./ui/login.js";
import { homeScreen } from "./ui/home.js";
import { wardrobeScreen } from "./ui/wardrobe.js";
import { chestScreen } from "./ui/chest.js";
import { resultsScreen } from "./ui/results.js";
import { skillsScreen, cardsScreen, storyScreen, weeklyScreen, settingsScreen } from "./ui/pages.js";
import { dailyScreen } from "./ui/daily.js";
import { editorScreen } from "./ui/editor.js";
import { persist, getSave } from "./state.js";
import { tickLives } from "./lives.js";
import { applyRunResults } from "./rewards.js";
import { stopMusic } from "./audio.js";
import { applyCssVars } from "./pixel/palette.js";

applyCssVars(document.documentElement);

// ---------- ekran biegu: run.js (B) rysuje wszystko w hoście ----------
const runScreen = {
  async mount(root, { mode = "tower" } = {}) {
    const host = h(`<div class="screen run-host" data-mode="${mode}"></div>`);
    root.append(host);
    let stats = null;
    try {
      const { runGame } = await import("./game/run.js");
      stats = await runGame(host, app.save, app.profile, mode);
    } catch (e) {
      console.error("run", e);
      if (current() === "run") { toast("Oops! Try again."); go("home"); }
      return;
    }
    if (current() !== "run") return;
    if (!stats || stats.empty) { toast("No tasks yet. Ask your teacher!"); go("home"); return; }
    const res = applyRunResults(app.save, stats);
    persist(true);
    go("results", res);
  },
};

register("login", loginScreen);
register("name", nameScreen);
register("home", homeScreen);
register("run", runScreen);
register("results", resultsScreen);
register("wardrobe", wardrobeScreen);
register("chest", chestScreen);
register("skills", skillsScreen);
register("cards", cardsScreen);
register("story", storyScreen);
register("weekly", weeklyScreen);
register("settings", settingsScreen);
register("daily", dailyScreen);
register("editor", editorScreen);

// ---------- debug / boty (?debug) ----------
const DEBUG = new URLSearchParams(location.search).has("debug");
function nl() {
  const o = (window.__nl = window.__nl || {});
  if (!o.save) o.save = () => getSave();
  o.go = go;
  return o;
}
if (DEBUG) {
  nl();
  onRoute((name) => { const o = nl(); o.screen = name; if (name !== "run") { o.runState = "idle"; o.task = null; o.mech = null; } });
}

// ---------- start ----------
async function boot() {
  const last = lastLogin();
  if (last) {
    try { await login(last); return; } catch (e) { console.error("auto-login", e); }
  }
  go("login");
}

// zapis przy chowaniu karty; życia tykają, gdy wracamy do gry
window.addEventListener("beforeunload", () => { if (app.save) persist(true); });
document.addEventListener("visibilitychange", () => {
  if (!app.save) return;
  if (document.hidden) persist(true);
  else tickLives(app.save);
});
// pierwsze dotknięcie odblokowuje mowę (wymóg przeglądarek)
document.addEventListener("pointerdown", () => { try { speechSynthesis.getVoices(); } catch {} }, { once: true });
window.addEventListener("pagehide", () => stopMusic());

boot();
