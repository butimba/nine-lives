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
  bubble: { name: "Bubble Shield", desc: "Blocks 1 mistake" },
  fire_combo: { name: "Fire Combo", desc: "Combo 3+ = x2 hit" },
  clover: { name: "Lucky Clover", desc: "More crits" },
  magnet: { name: "Star Magnet", desc: "+30% XP" },
  big_heart: { name: "Big Heart", desc: "+1 life and a bubble" },
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
      <button class="rui-btn rui-ico rui-hint" data-act="hint" title="Hint" hidden><span class="rui-i">${BULB}</span><b class="rui-hint-n">1</b></button>
      <button class="rui-btn rui-ico rui-quit" data-act="quit" title="Quit"><span class="rui-x">X</span></button>
    </div>`);
  root.append(top);
  let onQuit = null, onHint = null;
  top.querySelector(".rui-quit").onclick = () => { tap(); openQuit(); };
  top.querySelector(".rui-hint").onclick = () => { if (onHint) onHint(); };

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
    ui.modalOpen = true;
    quitModal.querySelector("[data-act=stay]").onclick = () => { tap(); closeQuit(); };
    quitModal.querySelector("[data-act=quit-yes]").onclick = () => { tap(); closeQuit(); onQuit && onQuit(); };
  }
  function closeQuit() { if (quitModal) quitModal.remove(); quitModal = null; ui.modalOpen = false; }

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
    openQuit, closeQuit,
    setHints(n, visible = true) {
      const b = top.querySelector(".rui-hint");
      b.hidden = !visible || n <= 0; b.querySelector(".rui-hint-n").textContent = n;
    },
    // prompt = { text?, pl?, img?, say?, autoSay }
    prompt(p, { onSay } = {}) {
      if (!p || (!p.text && !p.img && !p.say)) { banner.hidden = true; banner.innerHTML = ""; return 0; }
      const text = p.text ? esc(p.text).replace(/_{2,}/g, '<span class="rui-gap">___</span>') : "";
      banner.innerHTML = `<div class="rui-prompt-in paper">
          ${p.img ? `<div class="rui-prompt-img">${pic(p.img, "md")}</div>` : ""}
          <div class="rui-prompt-txt">
            ${text ? `<div class="rui-q lex">${text}</div>` : ""}
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
    perkCards(choices) {
      const c = card(`<div class="rui-title px">Pick a power!</div>
        <div class="rui-perks">${choices.map((p, i) => {
          const en = PERK_EN[p.id] || { name: p.name, desc: p.desc };
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
    hideTop(v) { top.hidden = !!v; },
    destroy() { root.remove(); },
  };
  return ui;
}
