// Ekran logowania (logo NINE LIVES + kot) i ekran nadawania imienia kotu.
import { h, esc, pxButton, panel, liveCat, onAct, sticker, replay, app } from "./components.js";
import { go } from "./router.js";
import { normLogin, loginHash } from "../util.js";
import { loadSave, persist } from "../state.js";
import { tickLives } from "../lives.js";
import { sfx, setAudio, stopMusic } from "../audio.js";
import { randomCatName } from "../../data/catnames.js";
import ROSTER from "../../data/roster.js";
import { claimGifts, ensureMySkin, syncCommunity } from "../meta.js";

const LAST = "ninelives:last";

export async function login(name) {
  app.loginName = name;
  const id = loginHash(name);
  app.profile = ROSTER.players[id] || { ...(ROSTER.default || {}), guest: true };
  app.save = await loadSave(id, app.profile);
  try { localStorage.setItem(LAST, name); } catch {}
  setAudio(app.save.settings);
  tickLives(app.save);
  // prezenty od nauczyciela → skrzynie "gift:…"; własna skórka ucznia; zatwierdzone skórki dzieci (w tle)
  ensureMySkin(app.save);
  if (claimGifts(app.save, app.profile).length) persist(true);
  const s0 = app.save;
  syncCommunity(s0).then((r) => {
    if (app.save !== s0) return;
    if (r.status) { app.notes.push(r.status === "approved" ? "skin-ok" : "skin-no"); persist(); }
    if (r.status || r.added) window.dispatchEvent(new CustomEvent("nl:skins"));
  }).catch(() => {});
  if (!app.save.catName) return go("name");
  go("home");
}

export function logout() {
  try { localStorage.removeItem(LAST); } catch {}
  app.save = null; app.profile = null; app.loginName = "";
  go("login");
}

export const lastLogin = () => { try { return localStorage.getItem(LAST); } catch { return null; } };

export const loginScreen = {
  mount(root) {
    stopMusic();
    const el = h(`<div class="screen login">
      <div class="logo" aria-label="Nine Lives">
        <i class="logo-moon"></i>
        <span class="logo-word">NINE</span>
        <span class="logo-word logo-word--2">LIVES</span>
        <div class="logo-cat"></div>
      </div>
      <p class="logo-tag">climb the tower · find the Moon</p>
      <form class="login-form" autocomplete="off">
        ${panel(`
          <label for="login-name">Your name</label>
          <input id="login-name" class="px-input" name="n" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="24" placeholder="name">
          ${pxButton("Play", { act: "login", big: true, variant: "ok", cls: "px-btn--block", attrs: 'type="submit"' })}
        `, { cls: "login-card", tilt: -1.5 })}
      </form>
      <p class="login-foot">v2 · made with kids</p>
    </div>`);
    root.append(el);
    const cat = liveCat({ skin: "ginger", hat: "wizard", anim: "idle", scale: 4 });
    el.querySelector(".logo-cat").append(cat.el);
    const inp = el.querySelector("#login-name");
    let busy = false;
    const submit = async (e) => {
      e && e.preventDefault();
      if (busy) return;
      if (normLogin(inp.value).length < 2) { replay(inp, "shake"); sfx.wrong(); inp.focus(); return; }
      busy = true; sfx.tap(); cat.play("dance", 2000);
      const b = el.querySelector("[data-act=login]"); b.disabled = true; b.querySelector("span").textContent = "…";
      try { await login(inp.value.trim()); } catch (err) { console.error(err); busy = false; b.disabled = false; b.querySelector("span").textContent = "Play"; }
    };
    el.querySelector("form").addEventListener("submit", submit);
    const off = onAct(el, { login: () => submit() });
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch {} }, 50);
    return off;
  },
};

export const nameScreen = {
  mount(root) {
    const s = app.save;
    const el = h(`<div class="screen namecat">
      <h1>Name your cat!</h1>
      <div class="name-stage"><i class="spot"></i><div class="cat-slot"></div>
        <div class="name-tag">${sticker(`<span class="sticker-label">new cat!</span>`, { tilt: 8 })}</div></div>
      <form class="name-form" autocomplete="off" style="width:min(380px,100%)">
        ${panel(`
          <label class="field-label" for="cat-name">Cat name</label>
          <div class="name-row" style="margin-top:10px">
            <input id="cat-name" class="px-input" maxlength="18" autocomplete="off" spellcheck="false" placeholder="?">
            <button type="button" class="px-btn px-btn--paper dice" data-act="name-random" aria-label="Random name"><i></i></button>
          </div>
          <div style="margin-top:14px">${pxButton("OK!", { act: "name-ok", big: true, variant: "ok", cls: "px-btn--block", attrs: 'type="submit"' })}</div>
        `, { tilt: 1 })}
      </form>
    </div>`);
    root.append(el);
    const cat = liveCat({ skin: s.equipped.skin, hat: s.equipped.hat, anim: "idle", scale: 5 });
    el.querySelector(".cat-slot").append(cat.el);
    const inp = el.querySelector("#cat-name");
    inp.value = randomCatName();
    const ok = (e) => {
      e && e.preventDefault();
      const v = inp.value.trim();
      if (!v) { replay(inp, "shake"); sfx.wrong(); return; }
      s.catName = v.slice(0, 18); persist(true); sfx.win();
      cat.play("dance", 900);
      setTimeout(() => go("home", { first: true }), 450);
    };
    el.querySelector("form").addEventListener("submit", ok);
    return onAct(el, {
      "name-random": (b) => { inp.value = randomCatName(); replay(b, "roll"); sfx.tap(); cat.hop(); },
      "name-ok": () => ok(),
    });
  },
};
