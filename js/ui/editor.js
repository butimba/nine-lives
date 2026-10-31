// EDYTOR SKÓREK (DIY): dziecko maluje na szablonie kota (prawdziwy rozmiar sprite'a), ograniczona paleta,
// narzędzia: pędzel, wiadro, gumka, lustro, cofnij. Żywy podgląd animowanego kota. Wyślij → save.mySkin (pending)
// + cloud.submitSkin(). Bez tabeli w chmurze: „Sending is not ready yet”, rysunek zostaje lokalnie.
import { h, esc, app, pxButton, panel, sticker, stamp, pageHead, toast, modal, onAct, liveCat, replay, pixelSVG } from "./components.js";
import { go } from "./router.js";
import { persist } from "../state.js";
import { sfx } from "../audio.js";
import * as cloud from "../cloud.js";
import { PAL } from "../pixel/palette.js";
import { TEMPLATE, EDIT_PALETTE, blankPixels, isValidPixels, cellColor, registerSkin } from "../pixel/custom.js";
import { CAT_TEMPLATE } from "../pixel/cat.js";
import { ensureMySkin, MY_SKIN } from "../meta.js";

const DRAFT = "custom:draft";
const K = "#0e0b16";
const TOOL_ICONS = {
  brush: pixelSVG(["......XX.", ".....XWWX", "....XWWX.", "...XWWX..", "..XWWX...", ".XOOX....", "XOOOX....", "XOOX.....", ".XX......"], { X: K, W: "#ffd23f", O: "#e8434f" }),
  fill: pixelSVG(["...XX....", "..XWWX...", ".XWWWWX..", "XWWWWWWX.", ".XWWWWXBB", "..XWWX.BB", "...XX..BB", ".......B.", "........."], { X: K, W: "#a9b6cb", B: "#3b78d8" }),
  eraser: pixelSVG([".........", "....XXXX.", "...XPPPX.", "..XPPPX..", ".XWWWX...", "XWWWX....", "XXXX.....", ".........", "XXXXXXXXX"], { X: K, P: "#ff8fa3", W: "#f4efe2" }),
  mirror: pixelSVG(["....X....", "X...X...X", "XX..X..XX", "XWX.X.XWX", "XWWXXXWWX", "XWX.X.XWX", "XX..X..XX", "X...X...X", "....X...."], { X: K, W: "#6fe3d3" }),
  undo: pixelSVG([".........", "..X......", ".XX......", "XXXXXXX..", ".XX....X.", "..X.....X", "........X", ".......X.", "....XXX.."], { X: K }),
};

export const editorScreen = {
  mount(root) {
    const save = app.save;
    if (!save) { go("login"); return; }
    const m = ensureMySkin(save);
    let pixels = isValidPixels(m.pixels) ? m.pixels : blankPixels();
    let color = "O", tool = "brush", mirror = false;
    const undo = [];
    const { w: GW, h: GH, cells } = TEMPLATE;
    const headAxis = CAT_TEMPLATE.FRAMES[0].hx + 6 - TEMPLATE.ox; // oś symetrii pyszczka

    const el = h(`<div class="screen page editor">${pageHead("Paint a skin", save, { fish: false })}
      <div class="ed-layout">
        <div class="ed-left">
          <div class="ed-top">
            <div class="ed-preview"><i class="spot"></i><div class="ed-cat"></div><div class="ed-status"></div></div>
            <div class="ed-tools">
              ${["brush", "fill", "eraser", "mirror", "undo"].map((t) => `<button class="ed-tool" data-act="tool" data-tool="${t}" aria-label="${t}"><img src="${TOOL_ICONS[t]}" alt=""><span>${t === "fill" ? "fill" : t}</span></button>`).join("")}
            </div>
          </div>
          <div class="ed-canvas-wrap"><canvas class="ed-canvas"></canvas><span class="hand ed-hint">paint the cat!</span></div>
        </div>
        <div class="ed-right">
          <div class="ed-palette">${EDIT_PALETTE.map((c) => `<button class="ed-sw" data-act="color" data-c="${c}" style="--c:${PAL[c]}" aria-label="colour"></button>`).join("")}</div>
          ${panel(`<label class="field-label" for="ed-name">Skin name</label>
            <input id="ed-name" class="px-input" maxlength="16" autocomplete="off" spellcheck="false" placeholder="My Cat" value="${esc(m.name || "")}">
            <div class="ed-actions">
              ${pxButton("Wear it", { act: "skin-wear", variant: "paper", cls: "px-btn--sm" })}
              ${pxButton("New", { act: "skin-new", variant: "paper", cls: "px-btn--sm" })}
            </div>
            ${pxButton("Send to teacher", { act: "skin-send", big: true, variant: "ok", cls: "px-btn--block ed-send" })}
            <p class="ed-note lex">Your teacher looks at it. Then everyone can win it!</p>`, { cls: "ed-card", tilt: -0.6 })}
        </div>
      </div>
    </div>`);
    root.append(el);
    const $ = (s) => el.querySelector(s);

    // ---- podgląd ----
    registerSkin(DRAFT, pixels, { name: m.name });
    const cat = liveCat({ skin: DRAFT, hat: "none", anim: "idle", scale: 3 });
    $(".ed-cat").append(cat.el);
    const anims = ["idle", "dance", "attack", "jump", "idle", "hurt"];
    let ai = 0;
    const animT = setInterval(() => { ai = (ai + 1) % anims.length; cat.play(anims[ai], 1500); }, 1800);
    let prevT = 0;
    const refreshPreview = () => {
      clearTimeout(prevT);
      prevT = setTimeout(() => { registerSkin(DRAFT, pixels, { name: m.name }); cat.refresh(); }, 90);
    };
    const renderStatus = () => {
      const changed = m.sent && m.sent !== pixels;
      const st = changed ? "changed" : m.status;
      const label = { pending: "waiting for teacher", approved: "in the game!", rejected: "try again", changed: "not sent yet" }[st];
      $(".ed-status").innerHTML = label ? sticker(`<span class="sticker-label ${st === "approved" ? "sticker-label--green" : st === "rejected" ? "sticker-label--red" : ""}">${label}</span>`, { tilt: -4 }) : "";
    };
    renderStatus();

    // ---- płótno ----
    const cv = $(".ed-canvas"), ctx = cv.getContext("2d");
    let cs = 14, hover = -1;
    const isCat = (i) => !!cells[i];
    const outlineCells = new Set();
    for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) {
      if (isCat(y * GW + x)) continue;
      if ((x > 0 && isCat(y * GW + x - 1)) || (x < GW - 1 && isCat(y * GW + x + 1)) || (y > 0 && isCat((y - 1) * GW + x)) || (y < GH - 1 && isCat((y + 1) * GW + x))) outlineCells.add(y * GW + x);
    }
    const PADC = 1; // ramka 1 komórki na kontur poza siatką
    const size = () => {
      const wrap = $(".ed-canvas-wrap");
      const avail = Math.min(wrap.clientWidth || 340, 560);
      cs = Math.max(10, Math.floor(avail / (GW + PADC * 2)));
      const dpr = Math.max(1, Math.round(window.devicePixelRatio || 1));
      cv.width = (GW + PADC * 2) * cs * dpr; cv.height = (GH + PADC * 2) * cs * dpr;
      cv.style.width = (GW + PADC * 2) * cs + "px"; cv.style.height = (GH + PADC * 2) * cs + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw();
    };
    const draw = () => {
      const W = (GW + PADC * 2) * cs, H = (GH + PADC * 2) * cs;
      ctx.clearRect(0, 0, W, H);
      // papier w kratkę
      ctx.fillStyle = "#f4efe2"; ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < GH + PADC * 2; y++) for (let x = 0; x < GW + PADC * 2; x++) if ((x + y) % 2) { ctx.fillStyle = "#ebe4d2"; ctx.fillRect(x * cs, y * cs, cs, cs); }
      const ox = PADC * cs, oy = PADC * cs;
      for (const i of outlineCells) { ctx.fillStyle = K; ctx.fillRect(ox + (i % GW) * cs, oy + Math.floor(i / GW) * cs, cs, cs); }
      for (let i = 0; i < cells.length; i++) {
        const c = cells[i]; if (!c) continue;
        ctx.fillStyle = cellColor(pixels, i);
        ctx.fillRect(ox + (i % GW) * cs, oy + Math.floor(i / GW) * cs, cs, cs);
      }
      // kontur poza siatką (górny rząd głowy / lewy ogon)
      ctx.strokeStyle = "rgba(14,11,22,.13)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= GW; x++) { ctx.moveTo(ox + x * cs + 0.5, oy); ctx.lineTo(ox + x * cs + 0.5, oy + GH * cs); }
      for (let y = 0; y <= GH; y++) { ctx.moveTo(ox, oy + y * cs + 0.5); ctx.lineTo(ox + GW * cs, oy + y * cs + 0.5); }
      ctx.stroke();
      if (hover >= 0 && cells[hover] && !cells[hover].locked) {
        ctx.strokeStyle = tool === "eraser" ? "#e8434f" : "#0e0b16"; ctx.lineWidth = 2;
        ctx.strokeRect(ox + (hover % GW) * cs + 1, oy + Math.floor(hover / GW) * cs + 1, cs - 2, cs - 2);
        if (mirror) { const mx = 2 * headAxis - (hover % GW); if (mx >= 0 && mx < GW) { ctx.setLineDash([3, 3]); ctx.strokeRect(ox + mx * cs + 1, oy + Math.floor(hover / GW) * cs + 1, cs - 2, cs - 2); ctx.setLineDash([]); } }
      }
      if (mirror) { ctx.strokeStyle = "rgba(42,143,138,.8)"; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(ox + (headAxis + 0.5) * cs, 0); ctx.lineTo(ox + (headAxis + 0.5) * cs, H); ctx.stroke(); ctx.setLineDash([]); }
    };
    const cellAt = (e) => {
      const r = cv.getBoundingClientRect();
      const x = Math.floor((e.clientX - r.left) / cs) - PADC, y = Math.floor((e.clientY - r.top) / cs) - PADC;
      return x >= 0 && y >= 0 && x < GW && y < GH ? y * GW + x : -1;
    };
    const DEFAULT_OF = (i) => blankPixels()[i];
    const setCell = (i, ch) => {
      if (i < 0 || !cells[i] || cells[i].locked) return false;
      if (pixels[i] === ch) return false;
      pixels = pixels.slice(0, i) + ch + pixels.slice(i + 1);
      return true;
    };
    const paintAt = (i) => {
      const ch = tool === "eraser" ? DEFAULT_OF(i) : color;
      let ch2 = setCell(i, ch);
      if (mirror) { const x = i % GW, y = Math.floor(i / GW), mx = 2 * headAxis - x; if (mx >= 0 && mx < GW) ch2 = setCell(y * GW + mx, tool === "eraser" ? DEFAULT_OF(y * GW + mx) : color) || ch2; }
      return ch2;
    };
    const fillAt = (i) => {
      if (i < 0 || !cells[i] || cells[i].locked) return false;
      const from = pixels[i];
      if (from === color) return false;
      const arr = pixels.split(""), q = [i], seen = new Set([i]);
      while (q.length) {
        const j = q.pop(); arr[j] = color;
        const x = j % GW, y = Math.floor(j / GW);
        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
          if (nx < 0 || ny < 0 || nx >= GW || ny >= GH) continue;
          const n = ny * GW + nx;
          if (seen.has(n) || !cells[n] || cells[n].locked || arr[n] !== from) continue;
          seen.add(n); q.push(n);
        }
      }
      pixels = arr.join("");
      return true;
    };
    let saveT = 0;
    const changed = () => {
      draw(); refreshPreview(); renderStatus();
      m.pixels = pixels;
      clearTimeout(saveT); saveT = setTimeout(() => { if (save.equipped.skin === MY_SKIN) registerSkin(MY_SKIN, pixels, { name: m.name }); persist(); }, 600);
    };
    const pushUndo = () => { undo.push(pixels); if (undo.length > 40) undo.shift(); };
    let down = false, last = -1, strokeChanged = false;
    const line = (a, b) => { // komórki między a i b (szybki ruch palcem)
      const out = []; if (a < 0) return [b];
      let x0 = a % GW, y0 = Math.floor(a / GW); const x1 = b % GW, y1 = Math.floor(b / GW);
      const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
      for (let k = 0; k < 64; k++) { out.push(y0 * GW + x0); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
      return out;
    };
    cv.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      const i = cellAt(e);
      if (i < 0 || !cells[i]) return;
      if (cells[i].locked) { replay(cv, "nope"); return; }
      pushUndo();
      if (tool === "fill") { if (fillAt(i)) { sfx.pop ? sfx.pop() : sfx.tap(); changed(); } else undo.pop(); return; }
      down = true; last = i; strokeChanged = paintAt(i);
      try { cv.setPointerCapture(e.pointerId); } catch {}
      if (strokeChanged) { sfx.tap(); changed(); }
    });
    cv.addEventListener("pointermove", (e) => {
      const i = cellAt(e);
      if (down && i >= 0 && i !== last) {
        let ch = false; for (const j of line(last, i)) ch = paintAt(j) || ch;
        last = i; if (ch) { strokeChanged = true; changed(); }
      }
      if (i !== hover) { hover = i; draw(); }
    });
    const up = () => { if (down && !strokeChanged) undo.pop(); down = false; last = -1; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", up);
    cv.addEventListener("pointerleave", () => { hover = -1; if (!down) draw(); });

    const renderTools = () => {
      el.querySelectorAll(".ed-tool").forEach((b) => b.classList.toggle("on", b.dataset.tool === tool || (b.dataset.tool === "mirror" && mirror)));
      el.querySelectorAll(".ed-sw").forEach((b) => b.classList.toggle("on", b.dataset.c === color && tool !== "eraser"));
      el.querySelector(".ed-tool[data-tool=undo]").disabled = !undo.length;
    };
    renderTools();
    size();
    const onResize = () => size();
    window.addEventListener("resize", onResize);

    const nameVal = () => ($("#ed-name").value || "").trim().slice(0, 16);
    $("#ed-name").addEventListener("change", () => { m.name = nameVal(); persist(); });

    let busy = false;
    const off = onAct(el, {
      back: () => { sfx.tap(); go("wardrobe", { tab: "skins" }); },
      tool: (b) => {
        const t = b.dataset.tool;
        if (t === "undo") { if (undo.length) { pixels = undo.pop(); sfx.tap(); changed(); } renderTools(); return; }
        if (t === "mirror") { mirror = !mirror; sfx.tap(); draw(); renderTools(); return; }
        tool = t; sfx.tap(); renderTools();
      },
      color: (b) => { color = b.dataset.c; if (tool === "eraser") tool = "brush"; sfx.tap(); renderTools(); replay(b, "pop-in"); },
      "skin-new": async () => {
        if (!(await modal({ title: "Start again?", body: "Your cat will be white again.", actions: [{ label: "Yes", value: true, variant: "danger" }, { label: "No", value: false }] }))) return;
        pushUndo(); pixels = blankPixels(); changed(); renderTools();
      },
      "skin-wear": () => {
        m.pixels = pixels; m.name = nameVal() || m.name || "My Cat";
        registerSkin(MY_SKIN, pixels, { name: m.name });
        save.equipped.skin = MY_SKIN; persist(true);
        sfx.perk ? sfx.perk() : sfx.tap(); cat.play("dance", 1600); toast("You look great!", { icon: "star" });
      },
      "skin-send": async (b) => {
        if (busy) return;
        const name = nameVal();
        if (!name) { const i = $("#ed-name"); replay(i, "shake"); sfx.wrong(); i.focus(); toast("Give it a name!"); return; }
        if (pixels === blankPixels()) { replay(cv, "nope"); sfx.wrong(); toast("Paint your cat first!"); return; }
        m.pixels = pixels; m.name = name; persist();
        busy = true; b.disabled = true;
        const reuse = m.status === "pending" && m.id;
        const id = reuse ? m.id : `${String(save.id).slice(0, 10)}-${Date.now().toString(36)}`;
        try {
          await cloud.submitSkin({ id, author_id: save.id, name, pixels });
          Object.assign(m, { id, status: "pending", sent: pixels, at: Date.now() });
          persist(true);
          sfx.win(); cat.play("dance", 2200);
          const st = h(`<div class="ed-sent">${stamp("Sent!", { color: "ok", cls: "slam" })}</div>`);
          $(".ed-preview").append(st); setTimeout(() => st.remove(), 2200);
          toast("Your teacher will look at it!", { icon: "star", ms: 3200 });
        } catch (e) {
          if (e && e.noTable) toast("Sending is not ready yet. Your cat is safe here!", { icon: "lock", ms: 3600 });
          else { console.warn("submitSkin", e); toast("Oops! Try again later."); }
        }
        busy = false; b.disabled = false; renderStatus();
      },
    });
    return () => { off(); clearInterval(animT); clearTimeout(prevT); window.removeEventListener("resize", onResize); if (saveT) { clearTimeout(saveT); persist(); } };
  },
};
