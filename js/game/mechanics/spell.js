// SPELL CAST.
//  'type'  -> real <input> in stage.overlay (.spell-input input + [data-act=cast]); every key lights a rune
//             over a magic circle. v1 rules: norm() compare; one retry if lev <= max(1, floor(len/6)) (marks hinted);
//             otherwise wrong with tag 'spelling'. "First letter" button = hinted (as v1). No timer.
//  'spell' -> letter blocks: tap in order to fill the slots (+ backspace block). v1 rules: check when all
//             letter slots are filled, case-insensitive vs target letters; wrong tag 'spelling'.
import { base, word, textW, ease, clamp01, race, wait, COL, fxSafe, norm, lev, esc } from "./common.js";

const RUNE_COLS = [COL.magic, "#9df2ff", COL.goldL, COL.magic2];

export function create(ctx) {
  return ctx.task.type === "spell" ? tiles(ctx) : typeMode(ctx);
}

// ---------------------------------------------------------------- shared: magic circle
function magicCircle(g, cx, cy, R, t, k = 1, col = COL.magic) {
  const N = Math.max(24, Math.round(R * 5));
  g.fillStyle = col;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2 + t * 0.6;
    const on = (i + Math.floor(t * 8)) % 4 !== 0;
    if (!on) continue;
    g.globalAlpha = 0.55 * k;
    g.fillRect(Math.round(cx + Math.cos(a) * R), Math.round(cy + Math.sin(a) * R * 0.38), 1, 1);
  }
  // inner star points
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - t * 0.9;
    g.globalAlpha = 0.8 * k;
    g.fillRect(Math.round(cx + Math.cos(a) * R * 0.66) - 1, Math.round(cy + Math.sin(a) * R * 0.25), 2, 1);
  }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------- TYPE
function typeMode(ctx) {
  const { task, arena: A, stage, prompt = {} } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const goal = norm(task.word.en);
  let tries = 0, runes = [], introK = 0, castK = 0, state = "idle", firstUsed = false;
  const circle = { x: A.x + A.w / 2, y: A.y + Math.min(A.h - 24, Math.max(96, A.h * 0.6)) };
  const target = ctx.target || { x: A.x + A.w * 0.8, y: A.y + A.h };

  // ---- DOM ----
  const pct = (y) => `${(y / stage.h) * 100}%`;
  const form = document.createElement("form");
  form.className = "spell-input";
  form.style.top = pct(A.y + 6);
  form.setAttribute("autocomplete", "off");
  form.innerHTML = `<input type="text" inputmode="text" enterkeyhint="go" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" maxlength="30" placeholder="type here…" aria-label="Type the word"><button type="submit" data-act="cast">Cast!</button>`;
  const tools = document.createElement("div");
  tools.className = "spell-tools";
  tools.style.top = pct(A.y + 40);
  tools.innerHTML = `<button type="button" data-act="first-letter">${esc(task.word.en[0])}… first letter</button>`;
  const inp = form.querySelector("input"), castBtn = form.querySelector("[data-act=cast]"), firstBtn = tools.querySelector("button");
  if (stage.overlay) { stage.overlay.append(form, tools); B.els.push(form, tools); }
  let msgEl = null;
  const msg = (en, pl) => {
    if (msgEl) msgEl.remove();
    msgEl = document.createElement("div"); msgEl.className = "spell-msg"; msgEl.style.top = pct(A.y + 56);
    msgEl.innerHTML = `${esc(en)}${pl && prompt.pl ? `<small>${esc(pl)}</small>` : ""}`;
    stage.overlay && stage.overlay.append(msgEl); B.els.push(msgEl);
    const el = msgEl; setTimeout(() => el.remove(), 1800);
  };
  setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch {} }, 60);

  const layoutRunes = () => {
    const v = inp.value.slice(0, 30);
    const n = v.length;
    const step = Math.min(17, (A.w - 16) / Math.max(1, n));
    const x0 = circle.x - ((n - 1) * step) / 2;
    const old = runes;
    runes = [...v].map((ch, i) => {
      const r = old[i] && old[i].ch === ch ? old[i] : { ch, born: 0, col: RUNE_COLS[i % RUNE_COLS.length] };
      r.tx = x0 + i * step; r.ty = circle.y - 30; r.size = step < 12 ? 12 : 17;
      if (r.x === undefined) { r.x = circle.x; r.y = circle.y; }
      return r;
    });
    return n > old.length;
  };
  inp.addEventListener("input", () => {
    if (state !== "idle") return;
    inp.classList.remove("almost");
    const grew = layoutRunes();
    if (grew) {
      B.S("type");
      const r = runes[runes.length - 1];
      fx.burst(circle.x, circle.y, { n: 5, colors: [r.col, "#ffffff"], speed: 40, gravity: -30, size: 1 });
    }
  });
  firstBtn.addEventListener("click", () => {
    if (B.done) return;
    useFirst();
    inp.focus();
  });
  const useFirst = () => {
    if (firstUsed) return false;
    firstUsed = true; B.hinted = true;
    inp.value = task.word.en[0]; layoutRunes(); firstBtn.remove();
    B.S("perk");
    return true;
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (B.done || !B.live) return;
    const v = norm(inp.value);
    if (!v) return;
    if (v === goal) return cast(true);
    if (tries === 0 && lev(v, goal) <= Math.max(1, Math.floor(goal.length / 6))) {
      tries++; B.hinted = true; inp.classList.remove("almost"); void inp.offsetWidth; inp.classList.add("almost");
      B.S("wrong");
      for (const r of runes) r.wobble = 1;
      msg("Almost! Fix it ✏️", "Prawie! Popraw literówkę");
      inp.focus();
      return;
    }
    cast(false);
  });

  async function cast(ok) {
    const res = B.finish(ok, "spelling", inp.value);
    if (!res) return;
    state = ok ? "cast" : "fizzle";
    inp.classList.add(ok ? "right" : "wrong");
    inp.disabled = true; castBtn.disabled = true; firstBtn.disabled = true;
    try { inp.blur(); } catch {}
    if (ok) {
      B.S("cast");
      castK = 0.001;
      ctx.cat && ctx.cat.attack && ctx.cat.attack();
      await wait(380);
      stage.hitstop && stage.hitstop(70); stage.shake && stage.shake(3, 160);
      fx.burst(target.x, target.y - 10, { n: 24, colors: [COL.magic, COL.magic2, "#ffffff", COL.gold], speed: 90, gravity: 60, size: 2 });
      fx.ring(target.x, target.y - 10, COL.magic);
      B.S("correct");
      await wait(160);
    } else {
      B.S("deflect");
      for (const r of runes) { r.vy = -20 - Math.random() * 30; r.vx = (Math.random() - 0.5) * 40; }
      stage.shake && stage.shake(1, 100);
      await wait(380);
    }
    B.settle();
  }

  const inst = {
    typing: true,
    update(dt, t) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 3); if (introK >= 1 && !B.live) B.start(); }
      for (const r of runes) {
        r.born = Math.min(1, r.born + dt * 5);
        if (state === "fizzle") { r.vy += 300 * dt; r.x += r.vx * dt; r.y += r.vy * dt; continue; }
        if (state === "cast" && castK > 0) continue;
        r.x += (r.tx - r.x) * Math.min(1, dt * 14); r.y += (r.ty - r.y) * Math.min(1, dt * 14);
        if (r.wobble) r.wobble = Math.max(0, r.wobble - dt * 2);
      }
      if (castK > 0) castK = Math.min(1, castK + dt * 2.8);
    },
    draw(g, t) {
      const pulse = state === "cast" ? 1 : 0.7 + 0.3 * Math.sin(t * 3);
      const glow = Math.min(1, 0.55 + runes.length * 0.08);
      magicCircle(g, circle.x, circle.y, 52 * ease.out(introK), t, pulse * glow * 1.4, state === "fizzle" ? COL.stone : COL.magic);
      magicCircle(g, circle.x, circle.y, 36 * ease.out(introK), -t * 1.3, pulse * glow * 1.3, state === "fizzle" ? COL.stone : COL.magic2);
      magicCircle(g, circle.x, circle.y, 20 * ease.out(introK), t * 2, pulse * glow, state === "fizzle" ? COL.stone : COL.goldL);
      runes.forEach((r, i) => {
        let x = r.x, y = r.y + Math.sin(t * 4 + i * 0.7) * 1.5;
        let col = state === "fizzle" ? COL.stone : inst._reveal ? COL.gold : r.col;
        if (state === "cast" && castK > 0) {
          // runes converge, then streak to the target
          const k = ease.inOut(castK);
          const mx = circle.x, my = circle.y - 40;
          if (k < 0.45) { const q = k / 0.45; x = r.tx + (mx - r.tx) * q; y = r.ty + (my - r.ty) * q; }
          else { const q = (k - 0.45) / 0.55; x = mx + (target.x - mx) * q; y = my + (target.y - 10 - my) * q - Math.sin(q * Math.PI) * 20; }
          col = COL.gold;
          if (k > 0.98) return;
        }
        if (r.wobble) x += Math.sin(t * 50 + i) * 2 * r.wobble;
        const sc = 0.4 + 0.6 * ease.back(r.born);
        g.globalAlpha = 0.22; g.fillStyle = col;
        g.fillRect(Math.round(x) - 6, Math.round(y) - 9, 13, 18);
        g.globalAlpha = 0.5; g.fillRect(Math.round(x) - 1, Math.round(y) + 10, 3, 1); g.fillRect(Math.round(x), Math.round(circle.y - 2), 1, 2);
        g.globalAlpha = 1;
        word(g, r.ch, x, y, { size: r.size * sc, color: col, weight: 700, font: "Pixelify Sans" });
      });
      if (inst._reveal) {
        word(g, task.word.en, circle.x, circle.y - 30, { size: 16, color: COL.gold, weight: 700, font: "Pixelify Sans", maxW: A.w - 8 });
      }
    },
    result: B.result,
    hint: () => (B.done ? false : useFirst()),
    async reveal() {
      inst._reveal = true; runes = [];
      form.style.display = "none"; tools.style.display = "none";
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze() {},
    destroy() { B.destroy(); },
    debug: {
      targets: () => {
        const r1 = inp.getBoundingClientRect(), r2 = castBtn.getBoundingClientRect();
        return [{ x: r1.left + r1.width / 2, y: r1.top + r1.height / 2, ok: true, label: "input" }, { x: r2.left + r2.width / 2, y: r2.top + r2.height / 2, ok: true, label: "cast" }];
      },
      answer: (good) => {
        if (B.done) return;
        if (!B.live) B.start();
        inp.value = good ? task.word.en : "qqqqqqqqq"; layoutRunes();
        tries = 1; // a bad debug answer must not get the "almost" retry
        form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
      },
    },
  };
  return inst;
}

// ---------------------------------------------------------------- TILES
function tiles(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const g0 = stage.ctx;
  const chars = task.target.split("");
  const isL = (c) => /[a-zA-Z]/.test(c);
  const letterIdx = chars.map((c, i) => (isL(c) ? i : -1)).filter((i) => i >= 0);
  const goal = task.target.replace(/[^a-zA-Z]/g, "").toLowerCase();

  // slots
  const sw = Math.min(16, Math.floor((A.w - 8) / chars.length));
  const slotY = A.y + 14;
  const sx0 = A.x + (A.w - sw * chars.length) / 2;
  const slots = chars.map((c, i) => ({ x: sx0 + i * sw, y: slotY, w: sw - 2, h: 20, fixed: !isL(c), ch: isL(c) ? "" : c, tile: null }));

  // tiles (+ backspace)
  const T = 32, gap = 5;
  const all = [...task.tiles.map((ch, i) => ({ ch, i, back: false })), { ch: "⌫", i: -1, back: true }];
  const perRow = Math.max(3, Math.min(all.length, Math.floor((A.w + gap) / (T + gap))));
  const nRows = Math.ceil(all.length / perRow);
  const gridTop = Math.min(A.y + A.h - nRows * (T + gap) - 4, slotY + 44);
  const tilesArr = all.map((t, k) => {
    const row = Math.floor(k / perRow), col = k % perRow;
    const inRow = Math.min(perRow, all.length - row * perRow);
    const x = A.x + (A.w - (inRow * T + (inRow - 1) * gap)) / 2 + col * (T + gap);
    const y = gridTop + row * (T + gap);
    return { ...t, hx: x, hy: y, x, y, state: "idle", ph: Math.random() * 6, k: 0 };
  });
  // decoys: greedy match target letters
  const need = [...goal];
  for (const t of tilesArr) if (!t.back) { const j = need.indexOf(t.ch.toLowerCase()); if (j >= 0) { need.splice(j, 1); t.real = true; } }
  const placed = [];
  let tt = 0, introK = 0, frozen = false, checkState = null, shakeK = 0;

  const tpos = (t) => {
    if (t.state === "fly") { const k = ease.out(t.k); return { x: t.fx + (t.tx - t.fx) * k, y: t.fy + (t.ty - t.fy) * k - Math.sin(k * Math.PI) * 14 }; }
    const bob = frozen ? 0 : Math.sin(tt * (1.5 + d * 1.5) + t.ph) * (1 + 2 * d);
    const sway = frozen ? 0 : Math.sin(tt * 0.6 + t.ph) * 6 * d * d;
    const drop = (1 - ease.back(clamp01(introK * 1.3 - t.ph * 0.03))) * -40;
    return { x: t.hx + sway, y: t.hy + bob + drop };
  };
  const hitAt = (x, y) => tilesArr.find((t) => t.state === "idle" && (() => { const p = tpos(t); return x >= p.x - 3 && x <= p.x + T + 3 && y >= p.y - 3 && y <= p.y + T + 3; })());

  const place = (t) => {
    const si = letterIdx[placed.length];
    const s = slots[si];
    const p = tpos(t);
    t.state = "fly"; t.k = 0; t.fx = p.x; t.fy = p.y; t.tx = s.x + s.w / 2 - T / 2; t.ty = s.y + s.h / 2 - T / 2; t.slot = s;
    placed.push(t);
    B.S("type");
  };
  const back = () => {
    const t = placed.pop(); if (!t) return;
    t.slot.ch = ""; t.slot.tile = null; t.state = "idle"; t.slot = null;
    B.S("tap");
  };
  async function check() {
    const w = letterIdx.map((i) => slots[i].ch).join("").toLowerCase();
    const ok = w === goal;
    const res = B.finish(ok, "spelling", w);
    if (!res) return;
    checkState = ok ? "ok" : "bad";
    const cx = A.x + A.w / 2, cy = slotY + 10;
    if (ok) {
      B.S("cast"); B.S("correct");
      ctx.cat && ctx.cat.attack && ctx.cat.attack();
      for (const s of slots) fx.burst(s.x + s.w / 2, s.y + 10, { n: 4, colors: [COL.gold, "#ffffff", COL.magic], speed: 50, gravity: 40, size: 1 });
      fx.ring(cx, cy, COL.gold, { r: 6, vr: 120 });
      stage.hitstop && stage.hitstop(60); stage.shake && stage.shake(2, 140);
      for (const t of tilesArr) if (t.state === "idle") t.state = "fade";
    } else {
      B.S("deflect"); shakeK = 1;
      stage.shake && stage.shake(1, 100);
    }
    await wait(ok ? 320 : 400);
    B.settle();
  }

  B.onDown((e) => {
    if (checkState) return false;
    const t = hitAt(e.x, e.y);
    if (!t) return false;
    if (t.back) { back(); t.press = 1; return true; }
    if (placed.length >= letterIdx.length) return true;
    place(t);
    return true;
  });

  const inst = {
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.6); if (introK >= 1 && !B.live) B.start(); }
      if (!frozen) tt += dt;
      if (shakeK > 0) shakeK = Math.max(0, shakeK - dt * 2);
      for (const t of tilesArr) {
        if (t.press) t.press = Math.max(0, t.press - dt * 6);
        if (t.state === "fly") { t.k = Math.min(1, t.k + dt * 5.5); if (t.k >= 1) { t.state = "placed"; t.slot.ch = t.ch; t.slot.tile = t; t.slot.pop = 1; fx.burst(t.slot.x + t.slot.w / 2, t.slot.y + t.slot.h, { n: 4, colors: [COL.stoneL, COL.magic], speed: 30, gravity: 60, size: 1 }); } }
        if (t.state === "fade") t.k = Math.min(1, (t.k || 0) + dt * 3);
      }
      for (const s of slots) if (s.pop) s.pop = Math.max(0, s.pop - dt * 5);
      if (!B.done && placed.length === letterIdx.length && placed.every((x) => x.state === "placed")) check();
    },
    draw(g, t) {
      // slots
      const sh = shakeK ? Math.round(Math.sin(t * 60) * 2 * shakeK) : 0;
      for (const s of slots) {
        const x = Math.round(s.x) + sh, y = Math.round(s.y);
        if (s.fixed) { if (s.ch.trim()) word(g, s.ch, x + s.w / 2, y + 10, { size: 12, color: COL.stoneL }); continue; }
        const col = checkState === "ok" || inst._reveal ? COL.gold : checkState === "bad" ? COL.bad : s.ch ? COL.magic : COL.stone;
        g.fillStyle = COL.ink; g.fillRect(x, y + s.h - 1, s.w, 3);
        g.fillStyle = col; g.fillRect(x, y + s.h - 1, s.w, 2);
        const ch = inst._reveal ? s._rev : s.ch;
        if (ch) word(g, ch, x + s.w / 2, y + 9 - (s.pop || 0) * 3, { size: sw < 13 ? 12 : 15, color: checkState === "bad" && !inst._reveal ? COL.bad : COL.paper, weight: 700, font: "Pixelify Sans" });
      }
      // tiles
      for (const tl of tilesArr) {
        if (tl.state === "placed" || tl.state === "gone") continue;
        if (tl.state === "fade" && tl.k >= 1) continue;
        const p = tpos(tl);
        g.globalAlpha = tl.state === "fade" ? 1 - tl.k : 1;
        const sc = tl.state === "fly" ? 1 - 0.45 * ease.out(tl.k) : 1;
        const S = Math.round(T * sc), x = Math.round(p.x + (T - S) / 2), y = Math.round(p.y + (T - S) / 2 + (tl.press ? 2 : 0));
        stoneBlock(g, x, y, S, tl.back);
        if (tl.back) backIcon(g, x + S / 2, y + S / 2 - 1);
        else word(g, tl.ch, x + S / 2, y + S / 2 - 1, { size: 17 * sc, color: COL.paper, weight: 700, font: "Pixelify Sans" });
        g.globalAlpha = 1;
      }
    },
    result: B.result,
    hint() {
      if (B.done) return false;
      const dec = tilesArr.filter((x) => !x.back && !x.real && x.state === "idle");
      if (!dec.length) return false;
      const tl = dec[Math.floor(Math.random() * dec.length)];
      const p = tpos(tl);
      tl.state = "gone";
      fx.burst(p.x + T / 2, p.y + T / 2, { n: 12, colors: ["#d8d4e8", "#a49fb8"], speed: 30, gravity: -20, size: 2 });
      B.S("pop"); B.hinted = true;
      return true;
    },
    async reveal() {
      inst._reveal = true;
      chars.forEach((c, i) => (slots[i]._rev = isL(c) ? c : ""));
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() { B.destroy(); },
    debug: {
      // sequence: only the NEXT correct tile is ok:true (backspace if a wrong letter is already placed)
      targets: () => {
        const sofar = placed.map((x) => x.ch.toLowerCase()).join("");
        const onTrack = goal.startsWith(sofar);
        const nextCh = goal[placed.length];
        const idle = tilesArr.filter((x) => x.state === "idle");
        const nextTile = onTrack ? idle.find((x) => !x.back && x.ch.toLowerCase() === nextCh) : idle.find((x) => x.back);
        return idle.map((x) => { const p = tpos(x); return { ...B.client(p.x + T / 2, p.y + T / 2), ok: x === nextTile, label: x.ch }; });
      },
      answer: (good) => {
        if (B.done) return;
        if (!B.live) B.start();
        while (placed.length) back();
        const seq = [];
        const pool = tilesArr.filter((x) => !x.back && x.state === "idle");
        if (good) for (const c of goal) { const j = pool.findIndex((x) => x.ch.toLowerCase() === c); seq.push(pool.splice(j, 1)[0]); }
        else { const rev = [...goal].reverse().join("") === goal ? pool : [...pool].reverse(); for (let i = 0; i < goal.length; i++) seq.push(rev[i]); }
        seq.forEach((x) => x && place(x));
      },
    },
  };
  return inst;
}

function stoneBlock(g, x, y, S, wood) {
  const L = wood ? COL.woodL : COL.stoneL, M = wood ? COL.wood : COL.stone, D = wood ? COL.woodD : COL.stoneD;
  g.fillStyle = COL.ink; g.fillRect(x, y, S, S + 2);
  g.fillStyle = D; g.fillRect(x + 1, y + 1, S - 2, S);
  g.fillStyle = M; g.fillRect(x + 1, y + 1, S - 2, S - 3);
  g.fillStyle = L; g.fillRect(x + 1, y + 1, S - 2, 1); g.fillRect(x + 1, y + 1, 1, S - 4);
  // texture specks (deterministic)
  g.fillStyle = D;
  const sp = [[4, 5], [S - 7, 4], [6, S - 8], [S - 6, S - 9], [Math.floor(S / 2), 3]];
  for (const [a, b] of sp) if (a > 1 && b > 1 && a < S - 2 && b < S - 3) g.fillRect(x + a, y + b, 2, 1);
}
function backIcon(g, cx, cy) {
  const px = ["...#######", "..#.......", ".#..#..#..", "#....##...", ".#..#..#..", "..#.......", "...#######"];
  const ox = Math.round(cx - 5), oy = Math.round(cy - 4);
  g.fillStyle = COL.ink; px.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") g.fillRect(ox + x * 1 - 0, oy + y + 1, 1, 1); }));
  g.fillStyle = COL.paper; px.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") g.fillRect(ox + x, oy + y, 1, 1); }));
  g.fillRect(ox + 10, oy, 1, 7);
}

export default { create };
