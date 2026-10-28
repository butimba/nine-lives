// RUN UI — the HTML pieces that sit on the stage overlay during a run.
// Everything is positioned in logical units via the --u CSS variable (1 logical px in CSS px) set by stage.js.
// All text in simple English. Polish only as the small optional line under a prompt / reveal.

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

// English perk texts (data/progression.js has Polish descriptions)
export const PERK_EN = {
  fishbone: { name: "Fishbone Sword", desc: "Crits hit +1" },
  catnip: { name: "Catnip", desc: "+1 life now" },
  bell: { name: "Golden Bell", desc: "+50% fish" },
  lightning: { name: "Lightning Paws", desc: "Fast answer = +1 hit" },
  bubble: { name: "Bubble Shield", desc: "Blocks the next boss shot" },
  fire_combo: { name: "Fire Combo", desc: "Combo 3+ = x2 hit" },
  clover: { name: "Lucky Clover", desc: "More crits" },
  magnet: { name: "Star Magnet", desc: "+30% XP" },
  big_heart: { name: "Big Heart", desc: "+1 life and +1 shield" },
};

const SPEAKER = `<svg viewBox="0 0 9 8" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M0 3h2v2H0zM2 2h1v4H2zM3 1h1v6H3zM4 0h1v8H4zM6 2h1v1H6zM6 5h1v1H6zM7 3h1v2H7zM8 1h1v1H8zM8 6h1v1H8z"/></svg>`;
const BULB = `<svg viewBox="0 0 7 9" width="100%" height="100%" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M2 0h3v1H2zM1 1h1v1H1zM5 1h1v1H5zM0 2h1v3H0zM6 2h1v3H6zM1 5h1v1H1zM5 5h1v1H5zM2 6h3v1H2zM2 8h3v1H2z"/><path fill="#ffd23f" d="M2 1h3v1H2zM1 2h5v3H1zM2 5h3v1H2z"/></svg>`;

export function createRunUI(overlay, { showPl = true, speak = () => {}, sfx = {}, imgURL = null, iconURL = null } = {}) {
  const root = el(`<div class="rui"></div>`);
  overlay.append(root);
  const tap = () => { try { sfx.tap && sfx.tap(); } catch {} };
  const pic = (img, cls = "") => {
    if (!img) return "";
    if (imgURL) { try { const u = imgURL(img); if (u) return `<img class="rui-pic ${cls}" src="${u}" alt="">`; } catch {} }
    if (img.startsWith("color:")) return `<span class="rui-pic rui-swatch ${cls}" style="background:${esc(img.slice(6))}"></span>`;
    if (img.startsWith("num:")) return `<span class="rui-pic rui-num ${cls}">${esc(img.slice(4))}</span>`;
    return `<span class="rui-pic rui-emoji ${cls}">${esc(img)}</span>`;
  };
  const say = (txt) => { if (txt) try { speak(txt); } catch {} };

  // ---- top buttons ----
  const top = el(`<div class="rui-top">
      <button class="rui-btn rui-ico rui-quit" data-act="quit" title="Quit"><span class="rui-x">X</span></button>
    </div>`);
  const bottom = el(`<div class="rui-bottom">
      <div class="rui-powers"></div>
      <button class="rui-btn rui-ico rui-hint" data-act="hint" title="Hint" hidden><span class="rui-i">${BULB}</span><b class="rui-hint-n">1</b></button>
    </div>`);
  root.append(top, bottom);
  let onQuit = null, onHint = null, onModal = null, onPower = null;
  const powersEl = bottom.querySelector(".rui-powers");
  top.querySelector(".rui-quit").onclick = () => { tap(); openQuit(); };
  bottom.querySelector(".rui-hint").onclick = () => { if (onHint) onHint(); };

  // ---- quit modal ----
  let quitModal = null;
  function openQuit() {
    if (quitModal) return;
    quitModal = el(`<div class="rui-modal"><div class="rui-card paper pop">
        <div class="rui-tape tape"></div>
        <div class="rui-title px">Leave the tower?</div>
        <div class="rui-sub lex">Your fish stay with you.</div>
        <div class="rui-row"><button class="rui-btn rui-btn--ghost px-btn" data-act="stay">Stay</button><button class="rui-btn rui-btn--danger px-btn" data-act="quit-yes">Leave</button></div>
      </div></div>`);
    root.append(quitModal);
    ui.modalOpen = true; onModal && onModal(true);
    quitModal.querySelector("[data-act=stay]").onclick = () => { tap(); closeQuit(); };
    quitModal.querySelector("[data-act=quit-yes]").onclick = () => { tap(); closeQuit(); onQuit && onQuit(); };
  }
  function closeQuit() { const was = !!quitModal; if (quitModal) quitModal.remove(); quitModal = null; ui.modalOpen = false; if (was && onModal) onModal(false); }

  // ---- prompt banner ----
  const banner = el(`<div class="rui-prompt" hidden></div>`);
  root.append(banner);

  // ---- card layer ----
  const layer = el(`<div class="rui-layer"></div>`);
  root.append(layer);
  const card = (html, cls = "") => {
    layer.innerHTML = "";
    const c = el(`<div class="rui-cardwrap ${cls}"><div class="rui-card paper pop">${html}</div></div>`);
    layer.append(c);
    c.querySelectorAll("[data-say]").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); say(b.dataset.say); }));
    return c;
  };
  const waitAct = (c, sel) => new Promise((res) => {
    const b = c.querySelector(sel);
    const go = (e) => { if (e) e.stopPropagation(); tap(); res(); };
    b.onclick = go;
    setTimeout(() => { try { b.focus({ preventScroll: true }); } catch {} }, 50);
  });
  const clearLayer = () => { layer.innerHTML = ""; };
  const spk = (txt) => (txt ? `<button class="rui-btn rui-ico rui-spk" data-say="${esc(txt)}" title="Listen"><span class="rui-i">${SPEAKER}</span></button>` : "");

  const ui = {
    root, modalOpen: false,
    set onQuit(fn) { onQuit = fn; },
    set onHint(fn) { onHint = fn; },
    set onModal(fn) { onModal = fn; },
    set onPower(fn) { onPower = fn; },
    // ---- active powers (max 2): [{ id, name, icon, color, charge }] ----
    setPowers(list = []) {
      powersEl.innerHTML = "";
      for (const p of list) {
        let src = ""; if (iconURL) try { src = iconURL(p.icon, 3) || ""; } catch {}
        const pips = Array.from({ length: p.charge }, () => `<i></i>`).join("");
        const b = el(`<button class="rui-btn rui-ico rui-power" data-act="power" data-id="${esc(p.id)}" title="${esc(p.name)}" style="--pc:${esc(p.color || "#ffd23f")}">
            <span class="rui-pw-fill"></span>${src ? `<img src="${src}" alt="">` : `<b>${esc(p.name[0])}</b>`}
            <span class="rui-pw-pips">${pips}</span><span class="rui-pw-go px">GO!</span></button>`);
        b.onclick = (e) => { e.stopPropagation(); if (onPower) onPower(p.id); };
        powersEl.append(b);
      }
    },
    // state = [{ id, n, charge, ready }]
    updatePowers(state = []) {
      for (const st of state) {
        const b = powersEl.querySelector(`[data-id="${st.id}"]`);
        if (!b) continue;
        b.style.setProperty("--k", Math.min(1, st.n / st.charge));
        b.querySelectorAll(".rui-pw-pips i").forEach((pip, i) => pip.classList.toggle("on", i < st.n));
        const was = b.classList.contains("is-ready");
        b.classList.toggle("is-ready", !!st.ready);
        if (st.ready && !was) { b.classList.remove("pw-pop"); void b.offsetWidth; b.classList.add("pw-pop"); }
      }
    },
    powerFeedback(id, kind /*'fire'|'no'*/) {
      const b = powersEl.querySelector(`[data-id="${id}"]`);
      if (!b) return;
      const cls = kind === "fire" ? "pw-fire" : "pw-no";
      b.classList.remove(cls); void b.offsetWidth; b.classList.add(cls);
      setTimeout(() => b.classList.remove(cls), 600);
    },
    // ---- small sticker toast at the top (daily challenge done, events) ----
    toast(title, sub = "", icon = "") {
      let src = ""; if (icon && iconURL) try { src = iconURL(icon, 3) || ""; } catch {}
      const t = el(`<div class="rui-toast sticker"><div class="rui-toast-in">${src ? `<img src="${src}" alt="">` : ""}<div><b class="px">${esc(title)}</b>${sub ? `<small class="lex">${esc(sub)}</small>` : ""}</div></div></div>`);
      root.append(t);
      setTimeout(() => t.classList.add("out"), 2400);
      setTimeout(() => t.remove(), 2800);
    },
    // ---- merchant cat: 3 offers -> resolves with the offer or null ([data-act=merchant-buy] / [data-act=merchant-skip]) ----
    merchantCard({ portrait = "", offers = [], wallet = 0 }) {
      const c = card(`<div class="rui-merchant">
          <div class="rui-sticker sticker px">SHOP!</div>
          <div class="rui-merch-top">${portrait ? `<img class="rui-merch-cat" src="${portrait}" alt="">` : ""}
            <div class="rui-merch-say lex">Hello! Do you want to buy something?</div></div>
          <div class="rui-merch-wallet px">${iconURL ? `<img src="${iconURL("fish", 2)}" alt="">` : ""} ${wallet}</div>
          <div class="rui-merch-offers">${offers.map((o, i) => {
            let src = ""; if (iconURL) try { src = iconURL(o.icon, 3) || ""; } catch {}
            const can = wallet >= o.price;
            return `<button class="rui-merch-offer px-btn ${can ? "" : "is-poor"}" data-act="merchant-buy" data-i="${i}" ${can ? "" : "disabled"} style="--tilt:${[-2, 1.5, -1][i % 3]}deg">
              <span class="rui-perk-ico">${src ? `<img src="${src}" alt="">` : ""}</span>
              <b class="px">${esc(o.name)}</b><small class="lex">${esc(o.desc)}</small>
              <span class="rui-price px">${iconURL ? `<img src="${iconURL("fish", 2)}" alt="">` : ""}${o.price}</span></button>`;
          }).join("")}</div>
          <div class="rui-row"><button class="rui-btn rui-btn--ghost px-btn" data-act="merchant-skip">No, thanks</button></div>
        </div>`, "rui-cardwrap--merchant");
      return new Promise((res) => {
        c.querySelectorAll("[data-act=merchant-buy]").forEach((b) => (b.onclick = (e) => {
          e.stopPropagation(); if (b.disabled) return;
          tap(); b.classList.add("is-picked");
          c.querySelectorAll("[data-act=merchant-buy]").forEach((x) => (x.disabled = true));
          setTimeout(() => { clearLayer(); res(offers[+b.dataset.i]); }, 320);
        }));
        c.querySelector("[data-act=merchant-skip]").onclick = (e) => { e.stopPropagation(); tap(); clearLayer(); res(null); };
      });
    },
    openQuit, closeQuit,
    setHints(n, visible = true) {
      const b = bottom.querySelector(".rui-hint");
      b.hidden = !visible || n <= 0; b.querySelector(".rui-hint-n").textContent = n;
    },
    // prompt = { text?, pl?, img?, say?, autoSay }
    prompt(p, { onSay } = {}) {
      if (!p || (!p.text && !p.img && !p.say && !p.title)) { banner.hidden = true; banner.innerHTML = ""; return 0; }
      const text = p.text ? esc(p.text).replace(/_{2,}/g, '<span class="rui-gap">___</span>') : "";
      banner.innerHTML = `<div class="rui-prompt-in paper">
          ${p.img ? `<div class="rui-prompt-img">${pic(p.img, "md")}</div>` : ""}
          <div class="rui-prompt-txt">
            ${p.title ? `<div class="rui-ptitle px ${text ? "" : "rui-ptitle--big"}">${esc(p.title)}</div>` : ""}
            ${text ? `<div class="rui-q lex${p.lang === "pl" ? " rui-q--pl" : ""}">${text}</div>` : ""}
            ${p.pl && showPl ? `<div class="rui-pl lex">${esc(p.pl)}</div>` : ""}
          </div>
          ${p.say ? spk(p.say) : ""}
        </div>`;
      banner.hidden = false;
      const s = banner.querySelector(".rui-spk");
      if (s) s.onclick = (e) => { e.stopPropagation(); onSay ? onSay() : say(p.say); };
      return ui.promptBottom();
    },
    clearPrompt() { banner.hidden = true; banner.innerHTML = ""; },
    // bottom edge of the prompt banner in CSS px relative to the overlay
    promptBottom() {
      if (banner.hidden) return 0;
      const r = banner.getBoundingClientRect(), o = overlay.getBoundingClientRect();
      return r.bottom - o.top;
    },
    // "Not quite!" — shows the right answer, waits for [data-act=next]
    revealCard(task) {
      let body = "";
      if (task.kind === "vocab" && task.word) {
        body = `<div class="rui-reveal">${pic(task.word.img, "lg")}<div class="rui-word lex">${esc(task.word.en)} ${spk(task.word.en)}</div>${showPl ? `<div class="rui-pl lex">= ${esc(task.word.pl)}</div>` : ""}</div>`;
      } else if (task.q) {
        const q = task.q;
        let line = esc(q.full || "");
        if (q.text && q.answer && q.text.includes("___")) {
          const [a, b] = q.text.split("___");
          line = `${esc(a)}<b class="rui-ans">${esc(q.answer)}</b>${esc(b)}`;
        }
        body = `<div class="rui-reveal"><div class="rui-sent lex">${line} ${spk(q.full)}</div>${q.hint && showPl ? `<div class="rui-pl lex">${esc(q.hint)}</div>` : ""}</div>`;
      }
      const c = card(`<div class="rui-sticker sticker rui-sticker--bad px">Not quite!</div>${body}
        <div class="rui-row"><button class="rui-btn rui-btn--big px-btn px-btn--big" data-act="next">OK</button></div>`, "rui-cardwrap--reveal");
      return waitAct(c, "[data-act=next]").then(clearLayer);
    },
    // new word intro
    introCard(task, { autoSay = false } = {}) {
      const w = task.word || {};
      const c = card(`<div class="rui-sticker sticker px">NEW WORD!</div>
        <div class="rui-intro">${pic(w.img, "xl")}<div class="rui-word rui-word--big lex">${esc(w.en)} ${spk(w.en)}</div>${showPl ? `<div class="rui-pl lex">${esc(w.pl)}</div>` : ""}</div>
        <div class="rui-row"><button class="rui-btn rui-btn--big px-btn px-btn--big" data-act="next">Got it!</button></div>`, "rui-cardwrap--intro");
      if (autoSay) say(w.en);
      return waitAct(c, "[data-act=next]").then(clearLayer);
    },
    // choose 1 of 3 perks -> resolves with the perk object
    perkCards(choices, title = "Pick a perk!") {
      const c = card(`<div class="rui-title px">${esc(title)}</div>
        <div class="rui-perks">${choices.map((p, i) => {
          const en = { name: p.name || (PERK_EN[p.id] || {}).name, desc: p.desc || (PERK_EN[p.id] || {}).desc };
          let icon = "";
          if (iconURL) try { icon = iconURL("perk_" + p.id, 3) || ""; } catch {}
          return `<button class="rui-perk px-btn" data-act="perk" data-i="${i}" style="--tilt:${[-2, 1.5, -1][i % 3]}deg">
            <span class="rui-perk-ico">${icon ? `<img src="${icon}" alt="">` : `<span class="rui-emoji">${esc(p.icon || "")}</span>`}</span>
            <b class="px">${esc(en.name)}</b><small class="lex">${esc(en.desc)}</small></button>`;
        }).join("")}</div>`, "rui-cardwrap--perk");
      return new Promise((res) => {
        c.querySelectorAll("[data-act=perk]").forEach((b) => (b.onclick = () => {
          tap(); b.classList.add("is-picked");
          c.querySelectorAll("[data-act=perk]").forEach((x) => (x.disabled = true));
          setTimeout(() => { clearLayer(); res(choices[+b.dataset.i]); }, 260);
        }));
      });
    },
    // boss intro card (auto closes)
    bossCard({ name, portrait, ms = 2300 }) {
      const c = card(`<div class="rui-boss">
          <div class="rui-boss-stamp stamp px">BOSS!</div>
          ${portrait ? `<img class="rui-boss-img" src="${portrait}" alt="">` : ""}
          <div class="rui-boss-name px">${esc(name)}</div>
          <div class="rui-sub lex">Tap the fireballs!</div>
        </div>`, "rui-cardwrap--boss");
      return new Promise((res) => {
        let done = false;
        const fin = () => { if (done) return; done = true; c.classList.add("out"); setTimeout(() => { clearLayer(); res(); }, 180); };
        c.onclick = fin; setTimeout(fin, ms);
      });
    },
    // simple message card with one button ([data-act=next])
    messageCard({ title, sub = "", btn = "OK", cls = "" }) {
      const c = card(`<div class="rui-title px">${esc(title)}</div>${sub ? `<div class="rui-sub lex">${esc(sub)}</div>` : ""}
        <div class="rui-row"><button class="rui-btn rui-btn--big px-btn px-btn--big" data-act="next">${esc(btn)}</button></div>`, cls);
      return waitAct(c, "[data-act=next]").then(clearLayer);
    },
    clearCards: clearLayer,
    hideTop(v) { top.hidden = !!v; bottom.hidden = !!v; },
    destroy() { root.remove(); },
  };
  return ui;
}
