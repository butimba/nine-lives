// CATCH: letters (spell) or words (build) float down on little parachutes. The cat runs along the ledge
// (drag the pointer / arrow keys) and catches them in its basket — or TAP a falling item and the cat leaps
// up and grabs it. Caught items fill the slots in order.
// Grading = v1 rules, exactly like spell tiles / build blocks:
//   spell: when every letter slot is filled -> ok = letters (case-insensitive) === target letters; wrong tag 'spelling'.
//   build: when every word is placed        -> ok = words joined === task.words joined;          wrong tag 'word_order'.
// Taking items back (undo block / tap a slot / Backspace) is free, like v1 backspace / tap-to-return.
// Dexterity never decides the answer: items fall slowly, lanes are wide, one item per lane, arrivals are spaced,
// and a missed item just comes back later.
import { base, word, textW, ease, clamp01, wait, COL, fxSafe, glowRect, arrowDown } from "./common.js";

const CHUTE = ["#e8434f", "#ffd23f", "#7ec4ff", "#93e04c", "#d867d0", "#ff9a3d"];

export function create(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const g0 = stage.ctx;
  const isBuild = task.type === "build";
  const cat = ctx.cat || { x: 64, y: A.y + A.h + 40 };

  // ---------------- answer model ----------------
  let goalTokens, slots = [], tokens;
  const isL = (c) => /[a-zA-Z]/.test(c);
  if (isBuild) {
    goalTokens = task.words.slice();
    tokens = [...new Set([...goalTokens, ...(task.tiles || []).map((t) => t.w)])];
  } else {
    const chars = task.target.split("");
    slots = chars.map((c) => ({ fixed: !isL(c), ch: isL(c) ? "" : c, pop: 0 }));
    goalTokens = chars.filter(isL).map((c) => c.toLowerCase());
    tokens = [...new Set([...goalTokens, ...(task.tiles || []).map((c) => String(c).toLowerCase()).filter((c) => isL(c))])];
  }
  const removed = new Set(); // decoys taken away by a hint
  const realSet = new Set(goalTokens);
  const placed = []; // tokens in order
  const onTrack = () => placed.every((p, i) => p === goalTokens[i]);
  const nextNeed = () => (onTrack() && placed.length < goalTokens.length ? goalTokens[placed.length] : null);

  // ---------------- layout ----------------
  const FS = 10;
  const itemW = (tok) => (isBuild ? Math.min(46, Math.max(26, Math.ceil(textW(g0, tok, FS)) + 10)) : 22);
  const ITEM_H = isBuild ? 18 : 22;
  const LANES = isBuild ? [62, 110, 158] : [60, 92, 124, 156];
  const groundY = () => home.y;                // feet of the cat on the ledge (screen y)
  const catchY = () => home.y - 46;            // basket line (item centre)
  // slot row / word line at the top of the arena
  const slotTop = A.y + 8;
  const sw = isBuild ? 0 : Math.min(16, Math.floor((A.w - 40) / Math.max(1, slots.length)));
  const sx0 = A.x + (A.w - 30 - sw * slots.length) / 2;
  const lineRowsH = isBuild ? 2 * 22 : 22;
  const undoBtn = { x: A.x + A.w - 26, y: slotTop - 1, w: 24, h: 22, press: 0 };
  const spawnY = () => Math.min(slotTop + lineRowsH + 18, catchY() - 70);

  // word line layout (build): flow placed words
  const lineLayout = () => {
    const out = []; let x = A.x + 2, y = slotTop; const maxX = A.x + A.w - 30;
    placed.forEach((w) => { const bw = itemW(w); if (x + bw > maxX && x > A.x + 2) { x = A.x + 2; y += 22; } out.push({ x, y, w: bw }); x += bw + 3; });
    return out;
  };

  // ---------------- items ----------------
  const items = [];
  let spawnIn = 0.25, tt = 0, introK = 0, frozen = false, checkState = null, shakeK = 0, hintGlow = false;
  const speed = () => 19 + 10 * d; // logical px / s — slow
  const laneBusy = (li) => items.some((it) => it.lane === li && (it.state === "fall" || it.state === "grab"));
  function pickToken() {
    const falling = new Set(items.filter((it) => it.state === "fall").map((it) => it.tok));
    const need = nextNeed();
    const pool = tokens.filter((t) => !removed.has(t) && !falling.has(t));
    if (need && !falling.has(need) && (Math.random() < 0.7 || !pool.length)) return need;
    // after a wrong catch the needed thing might be the one already falling; still spawn others
    const other = pool.filter((t) => t !== need);
    if (!other.length) return need && !falling.has(need) ? need : null;
    // prefer real letters/words a bit so the slots fill sensibly
    const real = other.filter((t) => realSet.has(t));
    return Math.random() < 0.55 && real.length ? real[Math.floor(Math.random() * real.length)] : other[Math.floor(Math.random() * other.length)];
  }
  function spawn() {
    const free = LANES.map((_, i) => i).filter((i) => !laneBusy(i));
    if (!free.length) return false;
    const y0 = spawnY();
    // arrivals spaced: no other falling item close to the top
    if (items.some((it) => it.state === "fall" && Math.abs(it.y - y0) < 26)) return false;
    const tok = pickToken();
    if (!tok) return false;
    // keep the needed item away from the lane the cat stands in when possible (no accidental auto-catch of wrong ones next to it)
    const lane = free[Math.floor(Math.random() * free.length)];
    items.push({ tok, lane, x: LANES[lane], y: y0 - 30, state: "fall", k: 0, sway: Math.random() * 6, col: CHUTE[(Math.random() * CHUTE.length) | 0], w: itemW(tok), born: 0 });
    return true;
  }

  // ---------------- cat control ----------------
  const home = { x: cat.x, y: cat.y };
  let catLane = LANES.reduce((bi, x, i) => (Math.abs(x - cat.x) < Math.abs(LANES[bi] - cat.x) ? i : bi), 0);
  let catTarget = LANES[catLane], leap = null, catBob = 0;
  const setLane = (li) => { li = Math.max(0, Math.min(LANES.length - 1, li)); if (li !== catLane) { catLane = li; B.S("tap"); } catTarget = LANES[li]; };
  const laneAt = (x) => LANES.reduce((bi, lx, i) => (Math.abs(lx - x) < Math.abs(LANES[bi] - x) ? i : bi), 0);
  if (cat.setAnim) cat.setAnim("idle");

  // ---------------- placing / undo / check ----------------
  function place(it, how) {
    it.state = "fly"; it.k = 0;
    const s = targetOf(placed.length);
    it.fx0 = it.x; it.fy0 = it.y; it.tx = s.x; it.ty = s.y;
    placed.push(it.tok);
    B.S(how === "grab" ? "pop" : "type");
    fx.burst(it.x, it.y, { n: 6, colors: [it.col, "#ffffff"], speed: 40, gravity: 40, size: 1 });
    // the parachute floats away
    chutes.push({ x: it.x, y: it.y - ITEM_H / 2 - 6, col: it.col, t: 0 });
  }
  const chutes = [];
  function targetOf(i) {
    if (isBuild) {
      const L = lineLayout(); // after push the new one is last
      const prevW = L.length ? L[L.length - 1] : null;
      // approximate: centre of where it will land
      let x = A.x + 2, y = slotTop;
      if (prevW) { x = prevW.x + prevW.w + 3; y = prevW.y; }
      const bw = itemW(task.words[i] || "");
      if (x + bw > A.x + A.w - 30) { x = A.x + 2; y += 22; }
      return { x: x + bw / 2, y: y + 9 };
    }
    const letterIdx = slots.map((s, j) => (s.fixed ? -1 : j)).filter((j) => j >= 0);
    const si = letterIdx[i];
    return { x: sx0 + si * sw + sw / 2, y: slotTop + 10 };
  }
  function undo() {
    if (!placed.length || checkState) return false;
    placed.pop();
    if (!isBuild) { const letterIdx = slots.map((s, j) => (s.fixed ? -1 : j)).filter((j) => j >= 0); slots[letterIdx[placed.length]].ch = ""; }
    undoBtn.press = 1;
    B.S("tap");
    return true;
  }
  async function check() {
    const ok = isBuild ? placed.join(" ") === task.words.join(" ") : placed.join("") === goalTokens.join("");
    const res = B.finish(ok, isBuild ? "word_order" : "spelling", isBuild ? placed.join(" ") : placed.join(""));
    if (!res) return;
    checkState = ok ? "ok" : "bad";
    for (const it of items) if (it.state === "fall") { it.state = "poof"; it.k = 0; }
    if (ok) {
      B.S("cast"); B.S("correct");
      ctx.cat && ctx.cat.attack && ctx.cat.attack();
      const cx = A.x + A.w / 2, cy = slotTop + 10;
      fx.ring(cx, cy, COL.gold, { r: 6, vr: 120 });
      for (let i = 0; i < 5; i++) fx.burst(A.x + 20 + i * (A.w - 40) / 4, cy, { n: 4, colors: [COL.gold, "#ffffff", COL.magic], speed: 50, gravity: 40, size: 1 });
      stage.hitstop && stage.hitstop(60); stage.shake && stage.shake(2, 140);
      await wait(380);
    } else {
      B.S("deflect"); shakeK = 1; stage.shake && stage.shake(1, 100);
      await wait(420);
    }
    B.settle();
  }

  // ---------------- input ----------------
  const hitItem = (x, y) => {
    let best = null, bd = 1e9;
    for (const it of items) {
      if (it.state !== "fall") continue;
      const hw = it.w / 2 + 6, hh = ITEM_H / 2 + 10; // generous, includes the parachute
      if (Math.abs(x - it.x) <= hw && y >= it.y - hh - 6 && y <= it.y + hh) { const dd = Math.abs(x - it.x) + Math.abs(y - it.y); if (dd < bd) { bd = dd; best = it; } }
    }
    return best;
  };
  const inUndo = (x, y) => x >= undoBtn.x - 3 && x <= undoBtn.x + undoBtn.w + 3 && y >= undoBtn.y - 3 && y <= undoBtn.y + undoBtn.h + 3;
  const inLine = (x, y) => y >= slotTop - 4 && y <= slotTop + lineRowsH && x < undoBtn.x - 2;
  function grab(it) {
    if (leap || checkState) return false;
    setLane(it.lane);
    it.state = "grab"; it.k = 0;
    leap = { it, t: 0, x0: cat.x, dur: 0.28 };
    if (cat.setAnim) cat.setAnim("jump");
    B.S("jump");
    return true;
  }
  B.onDown((e) => {
    if (checkState) return false;
    if (inUndo(e.x, e.y) || (placed.length && inLine(e.x, e.y))) { undo(); return true; }
    const it = hitItem(e.x, e.y);
    if (it) { if (placed.length < goalTokens.length) grab(it); return true; }
    if (e.y > spawnY() - 20 && e.y < groundY() + 12) { setLane(laneAt(e.x)); return true; }
    return false;
  });
  const offMove = stage.input.on("move", (e) => {
    if (!e.down || B.done || !B.live || checkState || leap) return false;
    if (e.y > spawnY() - 20 && e.y < groundY() + 12) setLane(laneAt(e.x));
    return false;
  });
  const offKey = stage.input.on("key", (e) => {
    if (B.done || !B.live || checkState || B.revealing) return false;
    const k = e.key;
    if (k === "ArrowLeft" || k === "a" || k === "A") { setLane(catLane - 1); return true; }
    if (k === "ArrowRight" || k === "d" || k === "D") { setLane(catLane + 1); return true; }
    if (k === "Backspace") { undo(); return true; }
    return false;
  });
  B.offs.push(offMove, offKey);

  // ---------------- update / draw ----------------
  const inst = {
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.6); if (introK >= 1 && !B.live) B.start(); }
      tt += dt;
      if (shakeK > 0) shakeK = Math.max(0, shakeK - dt * 2);
      if (undoBtn.press > 0) undoBtn.press = Math.max(0, undoBtn.press - dt * 6);
      for (const s of slots) if (s.pop) s.pop = Math.max(0, s.pop - dt * 5);
      // cat moves along the ledge
      if (!leap) {
        const dx = catTarget - cat.x;
        const step = 240 * dt;
        if (Math.abs(dx) > 0.5) { cat.x = cat.x + Math.sign(dx) * Math.min(Math.abs(dx), step); if (cat.setFlip) cat.setFlip(dx < 0); catBob += dt * 18; if (cat.setAnim) cat.setAnim("jump"); }
        else if (catBob) { catBob = 0; if (cat.setAnim) cat.setAnim("idle"); if (cat.setFlip) cat.setFlip(false); }
        cat.y = home.y - (catBob ? Math.abs(Math.sin(catBob)) * 3 : 0);
      } else {
        leap.t += dt;
        const k = clamp01(leap.t / leap.dur);
        const it = leap.it;
        cat.x = leap.x0 + (LANES[it.lane] - leap.x0) * ease.out(k);
        const peak = Math.max(10, home.y - 30 - it.y);
        cat.y = home.y - Math.sin(k * Math.PI) * Math.min(peak, 70);
        if (k >= 0.5 && it.state === "grab") { place(it, "grab"); if (cat.attack) cat.attack(); }
        if (k >= 1) { leap = null; cat.y = home.y; catBob = 0; if (cat.setAnim) cat.setAnim("idle"); }
      }
      // spawning
      if (B.live && !checkState && !B.revealing && !frozen) {
        spawnIn -= dt;
        if (spawnIn <= 0) { spawnIn = spawn() ? 1.0 + Math.random() * 0.4 : 0.2; }
      }
      // items
      const cy = catchY();
      for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        it.born = Math.min(1, it.born + dt * 4);
        if (it.state === "fall") {
          if (!frozen) it.y += speed() * dt * (it.y < spawnY() ? 3 : 1);
          // basket catch: item reaches the basket while the cat stands in its lane
          if (!leap && Math.abs(it.y - cy) < 5 && Math.abs(cat.x - LANES[it.lane]) < 12 && placed.length < goalTokens.length && !checkState) {
            place(it, "basket");
            if (cat.attack) cat.attack();
          } else if (it.y > groundY() - ITEM_H / 2) { it.state = "poof"; it.k = 0; fx.burst(it.x, groundY() - 4, { n: 6, colors: ["#d8ccb4", "#a89c86"], speed: 30, gravity: -20, size: 1 }); }
        } else if (it.state === "fly") {
          it.k = Math.min(1, it.k + dt * 4.5);
          if (it.k >= 1) {
            it.state = "gone";
            if (!isBuild) {
              const letterIdx = slots.map((s, j) => (s.fixed ? -1 : j)).filter((j) => j >= 0);
              // the letter shown in the slot = the token placed at that index
              letterIdx.forEach((j, n) => { slots[j].ch = placed[n] || ""; });
              const s = slots[letterIdx[Math.min(placed.length, letterIdx.length) - 1]]; if (s) s.pop = 1;
            }
          }
        } else if (it.state === "poof") { it.k = Math.min(1, it.k + dt * 4); if (it.k >= 1) it.state = "gone"; }
        if (it.state === "gone") items.splice(i, 1);
      }
      for (let i = chutes.length - 1; i >= 0; i--) { chutes[i].t += dt; if (chutes[i].t > 1.2) chutes.splice(i, 1); }
      if (!B.done && placed.length === goalTokens.length && !items.some((it) => it.state === "fly") && !leap) check();
    },
    draw(g, t) {
      // ---- slot row / word line ----
      const sh = shakeK ? Math.round(Math.sin(t * 60) * 2 * shakeK) : 0;
      // backing plate so it reads over the tower
      g.globalAlpha = 0.7; g.fillStyle = COL.ink; g.fillRect(A.x, slotTop - 4, A.w, lineRowsH + 6); g.globalAlpha = 1;
      if (!isBuild) {
        const rev = inst._reveal;
        slots.forEach((s, j) => {
          const x = Math.round(sx0 + j * sw) + sh, y = slotTop;
          if (s.fixed) { if (s.ch.trim()) word(g, s.ch, x + sw / 2, y + 10, { size: 12, color: COL.stoneL }); return; }
          const col = checkState === "ok" || rev ? COL.gold : checkState === "bad" ? COL.bad : s.ch ? COL.magic : COL.stone;
          g.fillStyle = COL.ink; g.fillRect(x + 1, y + 19, sw - 2, 3);
          g.fillStyle = col; g.fillRect(x + 1, y + 19, sw - 2, 2);
          const ch = rev ? task.target[j] : s.ch;
          if (ch) word(g, ch, x + sw / 2, y + 9 - (s.pop || 0) * 3, { size: sw < 13 ? 12 : 15, color: checkState === "bad" && !rev ? COL.bad : COL.paper, weight: 700, font: "Nine Pixel" });
        });
      } else {
        const words = inst._reveal ? task.words : placed;
        let x = A.x + 2, y = slotTop;
        words.forEach((w, j) => {
          const bw = itemW(w);
          if (x + bw > A.x + A.w - 30 && x > A.x + 2) { x = A.x + 2; y += 22; }
          // a just-caught word is still flying: draw it when it lands
          const flying = !inst._reveal && j >= placed.length - items.filter((it) => it.state === "fly").length;
          if (!flying) plate(g, x + sh, y, bw, 18, w, checkState === "ok" || inst._reveal ? "gold" : checkState === "bad" ? "bad" : "grass");
          x += bw + 3;
        });
        // how many words are still missing (dots, not widths: no answer leak)
        if (!inst._reveal) {
          const left = goalTokens.length - placed.length;
          for (let i = 0; i < left; i++) { g.fillStyle = COL.stone; g.fillRect(Math.round(x + 2 + i * 6), y + 12, 3, 3); }
        }
      }
      // undo block
      const ub = undoBtn, uy = Math.round(ub.y + (ub.press ? 2 : 0));
      g.globalAlpha = placed.length && !checkState ? 1 : 0.4;
      g.fillStyle = COL.ink; g.fillRect(ub.x, uy, ub.w, ub.h + 2);
      g.fillStyle = COL.woodD; g.fillRect(ub.x + 1, uy + 1, ub.w - 2, ub.h);
      g.fillStyle = COL.wood; g.fillRect(ub.x + 1, uy + 1, ub.w - 2, ub.h - 3);
      g.fillStyle = COL.woodL; g.fillRect(ub.x + 1, uy + 1, ub.w - 2, 1);
      backIcon(g, ub.x + ub.w / 2, uy + ub.h / 2 - 1);
      g.globalAlpha = 1;

      // ---- lane marks on the ledge ----
      const gy = Math.round(home.y);
      for (let i = 0; i < LANES.length; i++) {
        const on = i === catLane;
        g.fillStyle = on ? COL.goldL : "rgba(244,239,226,0.35)";
        g.fillRect(LANES[i] - 3, gy + 3, 7, 1); g.fillRect(LANES[i] - 1, gy + 4, 3, 1);
      }
      // ---- items ----
      const cy = catchY();
      const need = nextNeed();
      for (const it of items) {
        if (it.state === "gone") continue;
        let x = it.x, y = it.y, a = 1, s = 1;
        if (it.state === "fall" || it.state === "grab") x = LANES[it.lane] + (frozen ? 0 : Math.sin(tt * 1.6 + it.sway) * 2);
        it.x = x;
        if (it.state === "fly") { const k = ease.out(it.k); x = it.fx0 + (it.tx - it.fx0) * k; y = it.fy0 + (it.ty - it.fy0) * k - Math.sin(k * Math.PI) * 18; s = 1 - 0.15 * k; }
        if (it.state === "poof") { a = 1 - it.k; s = 1 + it.k * 0.5; }
        g.globalAlpha = a * (0.3 + 0.7 * it.born);
        // ground shadow (helps aiming)
        if (it.state === "fall") {
          const k = clamp01((it.y - spawnY()) / Math.max(1, cy - spawnY()));
          const sw2 = Math.round(4 + k * 10);
          g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(Math.round(LANES[it.lane] - sw2 / 2), gy - 1, sw2, 2);
        }
        if (it.state === "fall" || it.state === "grab") chute(g, x, y - ITEM_H / 2 - 2, it.col, t + it.sway, frozen);
        const w = Math.round(it.w * s), h = Math.round(ITEM_H * s);
        if (isBuild) plate(g, x - w / 2, y - h / 2, w, h, it.tok, "stone");
        else tile(g, x - w / 2, y - h / 2, w, h, it.tok);
        if (hintGlow && it.state === "fall" && it.tok === need) { glowRect(g, x - w / 2, y - h / 2, w, h, COL.gold, t); arrowDown(g, x, y - h / 2 - 22, t); }
        g.globalAlpha = 1;
      }
      // floating-away parachutes
      for (const c of chutes) { g.globalAlpha = Math.max(0, 1 - c.t / 1.2); chute(g, c.x + Math.sin(c.t * 6) * 4, c.y - c.t * 30, c.col, t, false); }
      g.globalAlpha = 1;
      // ---- basket over the cat's head ----
      const bx = Math.round(cat.x), by = Math.round(cat.y - 40);
      basket(g, bx, by);
      // freeze tint
      if (frozen) { g.globalAlpha = 0.12 + 0.04 * Math.sin(t * 3); g.fillStyle = "#bfe8ff"; g.fillRect(A.x, spawnY() - 20, A.w, cy - spawnY() + 40); g.globalAlpha = 1; }
      // first-time helper: arrows under the cat
      if (B.live && !placed.length && tt < 4 && !checkState) {
        g.globalAlpha = Math.min(1, (4 - tt));
        arrowSide(g, bx - 22, gy - 12, -1, t); arrowSide(g, bx + 22, gy - 12, 1, t);
        g.globalAlpha = 1;
      }
    },
    result: B.result,
    typing: false,
    hint() {
      if (B.done || checkState) return false;
      // off track -> take back the wrong ones (free) so the hint helps
      let did = false;
      while (placed.length && !onTrack()) { undo(); did = true; }
      if (isBuild) {
        if (placed.length < goalTokens.length - 1) {
          // put the next right word straight into the line
          const tok = goalTokens[placed.length];
          const it = { tok, lane: catLane, x: LANES[catLane], y: catchY(), state: "fall", w: itemW(tok), col: COL.gold, born: 1 };
          items.push(it); place(it, "grab"); did = true;
        }
      } else {
        const dec = tokens.filter((x) => !realSet.has(x) && !removed.has(x));
        if (dec.length) {
          const tok = dec[Math.floor(Math.random() * dec.length)];
          removed.add(tok);
          for (const it of items) if (it.tok === tok && it.state === "fall") { it.state = "poof"; it.k = 0; fx.burst(it.x, it.y, { n: 12, colors: ["#d8d4e8", "#a49fb8"], speed: 30, gravity: -20, size: 2 }); }
          did = true;
        }
      }
      hintGlow = true; did = true;
      B.S("pop"); B.hinted = true;
      return did;
    },
    async reveal() {
      inst._reveal = true;
      for (const it of items) if (it.state === "fall") { it.state = "poof"; it.k = 0; }
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() {
      B.destroy();
      try { cat.y = home.y; if (cat.setAnim) cat.setAnim("idle"); if (cat.setFlip) cat.setFlip(false); } catch {}
    },
    debug: {
      // the NEXT correct falling item is ok:true (the undo block if a wrong one is already caught)
      targets: () => {
        const need = nextNeed();
        const out = [];
        const fall = items.filter((it) => it.state === "fall");
        const nextIt = need ? fall.filter((it) => it.tok === need).sort((a, b) => b.y - a.y)[0] : null;
        for (const it of fall) out.push({ ...B.client(it.x, it.y), ok: it === nextIt, label: it.tok });
        if (placed.length) out.push({ ...B.client(undoBtn.x + undoBtn.w / 2, undoBtn.y + undoBtn.h / 2), ok: !onTrack(), label: "undo" });
        return out;
      },
      answer: (good) => {
        if (B.done) return;
        if (!B.live) B.start();
        placed.length = 0;
        const seq = good ? goalTokens.slice() : (() => { const r = [...goalTokens].reverse(); if (r.join("|") === goalTokens.join("|")) r[r.length - 1] = tokens.find((x) => x !== r[r.length - 1]) || "zz"; return r; })();
        placed.push(...seq);
        if (!isBuild) { const letterIdx = slots.map((s, j) => (s.fixed ? -1 : j)).filter((j) => j >= 0); letterIdx.forEach((j, n) => (slots[j].ch = placed[n] || "")); }
        for (const it of items) if (it.state === "fall") { it.state = "poof"; it.k = 0; }
      },
    },
  };
  return inst;
}

// ---------------- pixel bits ----------------
function tile(g, x, y, w, h, ch) {
  x = Math.round(x); y = Math.round(y);
  g.fillStyle = COL.ink; g.fillRect(x, y, w, h + 2);
  g.fillStyle = "#b8ab8c"; g.fillRect(x + 1, y + 1, w - 2, h);
  g.fillStyle = COL.paper; g.fillRect(x + 1, y + 1, w - 2, h - 3);
  g.fillStyle = "#ffffff"; g.fillRect(x + 1, y + 1, w - 2, 1);
  word(g, ch, x + w / 2, y + h / 2 - 1, { size: 15, color: COL.ink, weight: 700, font: "Nine Pixel", shadow: null });
}
function plate(g, x, y, w, h, txt, kind) {
  x = Math.round(x); y = Math.round(y);
  const P = kind === "gold" ? ["#a87a12", "#d9a22b", COL.goldL] : kind === "bad" ? [COL.badD, COL.bad, "#ff9a9a"] : kind === "grass" ? [COL.grassD, COL.grass, COL.grassL] : [COL.woodD, COL.wood, COL.woodL];
  g.fillStyle = COL.ink; g.fillRect(x, y, w, h + 2);
  g.fillStyle = P[0]; g.fillRect(x + 1, y + 1, w - 2, h);
  g.fillStyle = P[1]; g.fillRect(x + 1, y + 1, w - 2, h - 3);
  g.fillStyle = P[2]; g.fillRect(x + 1, y + 1, w - 2, 1);
  word(g, txt, x + w / 2, y + h / 2, { size: 10, maxW: w - 4, color: kind === "gold" ? COL.ink : COL.paper, shadow: kind === "gold" ? COL.goldL : COL.ink });
}
function chute(g, cx, by, col, t, still) {
  // small pixel parachute: dome 15 wide + 2 strings
  const sway = still ? 0 : Math.round(Math.sin(t * 2) * 1);
  const x = Math.round(cx - 8) + sway, y = Math.round(by - 9);
  const rows = ["....#######....", "..###########..", ".#############.", "###############", "#.#.#.#.#.#.#.#"];
  g.fillStyle = COL.ink;
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === "#") g.fillRect(x + i, y + j - 1, 1, 3); }));
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c === "#") { g.fillStyle = j === 0 || (i % 4 < 2 && j < 4) ? col : "#ffffff"; if (j === 0) g.fillStyle = "#ffffff"; g.fillRect(x + i, y + j, 1, 1); } }));
  g.fillStyle = "rgba(14,11,22,0.8)";
  for (let k = 0; k < 5; k++) { g.fillRect(x + 1 + Math.round(k * 0.6), y + 5 + k, 1, 1); g.fillRect(x + 13 - Math.round(k * 0.6), y + 5 + k, 1, 1); }
}
function basket(g, x, y) {
  const rows = ["#..........#", "##........##", "#o#o#o#o#o##", ".#oooooooo#.", "..########.."];
  const ox = x - 6;
  rows.forEach((r, j) => [...r].forEach((c, i) => {
    if (c === ".") return;
    g.fillStyle = c === "#" ? COL.ink : (i + j) % 2 ? COL.woodL : COL.wood;
    g.fillRect(ox + i, y + j, 1, 1);
  }));
}
function arrowSide(g, x, y, dir, t) {
  const b = Math.round(Math.abs(Math.sin(t * 6)) * 2) * dir;
  const rows = dir < 0 ? ["..#", ".##", "###", ".##", "..#"] : ["#..", "##.", "###", "##.", "#.."];
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== "#") return; g.fillStyle = COL.ink; g.fillRect(x + b + i * 2 - 1, y + j * 2 - 1, 4, 4); }));
  rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== "#") return; g.fillStyle = COL.gold; g.fillRect(x + b + i * 2, y + j * 2, 2, 2); }));
}
function backIcon(g, cx, cy) {
  const px = ["...#######", "..#.......", ".#..#..#..", "#....##...", ".#..#..#..", "..#.......", "...#######"];
  const ox = Math.round(cx - 5), oy = Math.round(cy - 4);
  g.fillStyle = COL.ink; px.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") g.fillRect(ox + x, oy + y + 1, 1, 1); }));
  g.fillStyle = COL.paper; px.forEach((r, y) => [...r].forEach((c, x) => { if (c === "#") g.fillRect(ox + x, oy + y, 1, 1); }));
  g.fillRect(ox + 10, oy, 1, 7);
}

export default { create, ready: true };
