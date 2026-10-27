// FIX THE LINE: the sentence is a row of grass/dirt blocks (Minecraft-like). Tap the wrong block ->
// cat jumps on it and swings a pickaxe. v1 rules: ok = tapped index === task.badIdx; wrong tag = task.tag || 'fix'.
// On success the bad block shatters and the correct word block drops in.
import { base, word, textW, ease, clamp01, race, wait, COL, fxSafe, glowRect, arrowDown } from "./common.js";

export function create(ctx) {
  return ctx.task.type === "build" ? build(ctx) : fix(ctx);
}

function fix(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const g0 = stage.ctx;
  const FS = 10, H = 26, GAP = 3, PAD = 7, MINW = 30;
  const fixedTok = task.tokens[task.badIdx].replace(task.wrongWord, task.q.answer);

  // layout rows (wrap)
  const toks = task.tokens.map((w, i) => ({ w, i, bw: Math.max(MINW, Math.ceil(textW(g0, w, FS)) + PAD * 2) }));
  const maxW = A.w - 4;
  const rows = [[]]; let rw = 0;
  for (const t of toks) {
    const need = (rows[rows.length - 1].length ? GAP : 0) + t.bw;
    if (rw + need > maxW && rows[rows.length - 1].length) { rows.push([]); rw = 0; }
    rows[rows.length - 1].push(t); rw += (rows[rows.length - 1].length > 1 ? GAP : 0) + t.bw;
  }
  for (const t of toks) if (t.bw > maxW) t.bw = maxW;
  const rowGap = 14;
  const totalH = rows.length * H + (rows.length - 1) * rowGap;
  const top = A.y + Math.max(18, Math.min(60, (A.h - totalH) * 0.4));
  rows.forEach((row, ri) => {
    const w = row.reduce((a, t) => a + t.bw, 0) + GAP * (row.length - 1);
    let x = A.x + (A.w - w) / 2;
    for (const t of row) { t.x = x; t.y = top + ri * (H + rowGap); x += t.bw + GAP; t.state = "idle"; t.ph = t.i * 0.5; t.hit = 0; }
  });

  let tt = 0, introK = 0, frozen = false, pick = null, newBlock = null;
  const pos = (t) => {
    const bob = frozen || d < 0.4 ? 0 : Math.sin(tt * 2 + t.ph) * (d - 0.3) * 2.5;
    const drop = (1 - ease.back(clamp01(introK * 1.5 - t.i * 0.06))) * -(t.y - A.y + 40);
    const shake = t.hit ? Math.round(Math.sin(tt * 70) * 2 * t.hit) : 0;
    return { x: t.x + shake, y: t.y + bob + drop };
  };
  const hitAt = (x, y) => toks.find((t) => { if (t.state !== "idle") return false; const p = pos(t); return x >= p.x - 1 && x <= p.x + t.bw + 1 && y >= p.y - 5 && y <= p.y + H + 5; });

  async function choose(t) {
    const ok = t.i === task.badIdx;
    const res = B.finish(ok, task.tag || "fix", t.i);
    if (!res) return;
    t.state = "target";
    const p = pos(t);
    const cx = p.x + t.bw / 2;
    B.S("tap");
    if (ctx.cat) { await race(ctx.cat.jumpTo && ctx.cat.jumpTo(cx - 6, p.y - 2), 420); ctx.cat.attack && ctx.cat.attack(); }
    // pickaxe swing
    pick = { x: cx + 4, y: p.y - 4, k: 0 };
    await wait(170);
    stage.hitstop && stage.hitstop(80);
    const bad = toks[task.badIdx], bp = pos(bad);
    if (ok) {
      stage.shake && stage.shake(3, 170);
      t.state = "broken";
      B.S("smash"); B.S("correct");
      fx.burst(cx, p.y + H / 2, { n: 26, colors: [COL.dirt, COL.dirtD, COL.dirtL, COL.grass, COL.grassL], speed: 95, gravity: 220, size: 2 });
      fx.burst(cx, p.y + H / 2, { n: 6, colors: ["#ffffff"], speed: 40, gravity: 0, size: 1 });
      await wait(140);
      newBlock = { w: fixedTok, x: bp.x, y: bp.y, bw: Math.max(MINW, Math.ceil(textW(g0, fixedTok, FS)) + PAD * 2), k: 0 };
      newBlock.x = bad.x + bad.bw / 2 - newBlock.bw / 2;
    } else {
      stage.shake && stage.shake(1, 100);
      t.hit = 1; t.state = "idle-dead";
      B.S("deflect");
      fx.burst(cx, p.y, { n: 10, colors: ["#ffffff", COL.gold, COL.stoneL], speed: 70, gravity: 160, size: 1 });
      fx.float && fx.float(cx, p.y - 6, "CLANK", { color: COL.stoneL });
      await wait(150);
    }
    await wait(ok ? 250 : 230);
    B.settle();
  }

  B.onDown((e) => { const t = hitAt(e.x, e.y); if (!t) return false; choose(t); return true; });

  const inst = {
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.2); if (introK >= 1 && !B.live) B.start(); }
      if (!frozen) tt += dt;
      for (const t of toks) if (t.hit) t.hit = Math.max(0, t.hit - dt * 2.5);
      if (pick) { pick.k += dt * 4; if (pick.k >= 1) pick = null; }
      if (newBlock && newBlock.k < 1) newBlock.k = Math.min(1, newBlock.k + dt * 3.5);
    },
    draw(g, t) {
      for (const tk of toks) {
        if (tk.state === "broken" || tk.state === "safe-gone") continue;
        const p = pos(tk);
        const bad = inst._reveal && tk.i === task.badIdx;
        block(g, p.x, p.y, tk.bw, H, tk.state === "safe" ? "stone" : "grass", tk.i);
        word(g, tk.w, p.x + tk.bw / 2, p.y + H / 2 + 2, { size: FS, maxW: tk.bw - 4, color: tk.state === "safe" ? COL.stoneL : COL.paper });
        if (bad) { glowRect(g, p.x, p.y, tk.bw, H, COL.bad, t); crackLines(g, p.x, p.y, tk.bw, H); }
      }
      if (newBlock) {
        const k = ease.back(newBlock.k);
        const y = newBlock.y - (1 - k) * 40;
        g.globalAlpha = clamp01(newBlock.k * 3);
        block(g, newBlock.x, y, newBlock.bw, H, "gold", 3);
        word(g, newBlock.w, newBlock.x + newBlock.bw / 2, y + H / 2 + 2, { size: FS, maxW: newBlock.bw - 4, color: COL.ink, shadow: COL.goldL });
        g.globalAlpha = 1;
        if (inst._reveal) arrowDown(g, newBlock.x + newBlock.bw / 2, y - 3, t);
      }
      if (pick) drawPickaxe(g, pick.x, pick.y, pick.k);
    },
    result: B.result,
    hint() {
      if (B.done) return false;
      const alive = toks.filter((x) => x.state === "idle");
      const good = alive.filter((x) => x.i !== task.badIdx);
      if (alive.length <= 2 || !good.length) return false;
      const tk = good[Math.floor(Math.random() * good.length)];
      tk.state = "safe";
      const p = pos(tk);
      fx.burst(p.x + tk.bw / 2, p.y + H / 2, { n: 10, colors: ["#d8d4e8", "#a49fb8"], speed: 30, gravity: -20, size: 2 });
      B.S("pop"); B.hinted = true;
      return true;
    },
    async reveal() {
      inst._reveal = true;
      const bad = toks[task.badIdx];
      // show which block was wrong, then drop the right word on top of it
      await wait(500);
      bad.state = "broken";
      fx.burst(bad.x + bad.bw / 2, bad.y + H / 2, { n: 16, colors: [COL.dirt, COL.dirtD, COL.grass], speed: 70, gravity: 200, size: 2 });
      B.S("smash");
      newBlock = { w: fixedTok, y: bad.y, bw: Math.max(MINW, Math.ceil(textW(g0, fixedTok, FS)) + PAD * 2), k: 0 };
      newBlock.x = bad.x + bad.bw / 2 - newBlock.bw / 2;
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() { B.destroy(); },
    debug: {
      targets: () => toks.filter((x) => x.state === "idle").map((x) => { const p = pos(x); return { ...B.client(p.x + x.bw / 2, p.y + H / 2), ok: x.i === task.badIdx, label: x.w }; }),
      answer: (good) => { if (B.done) return; if (!B.live) B.start(); const tk = toks.find((x) => x.state === "idle" && (x.i === task.badIdx) === !!good); if (tk) choose(tk); },
    },
  };
  return inst;
}

// ---------------------------------------------------------------- BUILD THE LINE
// v1 'build' rules: tap words in order; a placed block can be tapped to take it back; when every word is
// placed: ok = placed words joined === task.words joined, wrong tag 'word_order'.
function build(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const g0 = stage.ctx;
  const FS = 10, H = 24, GAP = 3, PAD = 6, MINW = 26, ROWG = 6;
  const maxW = A.w - 4;
  const wOf = (w) => Math.min(maxW, Math.max(MINW, Math.ceil(textW(g0, w, FS)) + PAD * 2));
  const blocks = task.tiles.map((tl, k) => ({ w: tl.w, i: tl.i, k, bw: wOf(tl.w), state: "pile", ph: k * 0.9, f: 1 }));
  // flow layout helper: returns positions for a list of widths starting at y
  const flow = (ws, y0) => {
    const out = []; let row = [], rw = 0, y = y0; const rows = [];
    ws.forEach((w, j) => { const need = (row.length ? GAP : 0) + w; if (rw + need > maxW && row.length) { rows.push(row); row = []; rw = 0; } row.push(j); rw += (row.length > 1 ? GAP : 0) + w; });
    if (row.length) rows.push(row);
    rows.forEach((r, ri) => {
      const tw = r.reduce((a, j) => a + ws[j], 0) + GAP * (r.length - 1);
      let x = A.x + (A.w - tw) / 2;
      for (const j of r) { out[j] = { x, y: y + ri * (H + ROWG) }; x += ws[j] + GAP; }
    });
    return { pos: out, rows: rows.length };
  };
  const lineRows = flow(task.words.map(wOf), 0).rows;
  const lineTop = A.y + 10;
  const lineH = lineRows * (H + ROWG);
  const pileTop = Math.min(A.y + A.h - 2 * (H + ROWG) - 4, lineTop + lineH + 26);
  const pileLayout = flow(blocks.map((b) => b.bw), pileTop).pos;
  blocks.forEach((b, j) => { b.px = pileLayout[j].x; b.py = pileLayout[j].y; b.x = b.px; b.y = b.py; });
  const placed = [];
  let tt = 0, introK = 0, frozen = false, checkState = null, shakeK = 0;
  const relayout = () => {
    const L = flow(placed.map((b) => b.bw), lineTop).pos;
    placed.forEach((b, j) => { b.tx = L[j].x; b.ty = L[j].y; });
    for (const b of blocks) if (b.state === "pile") { b.tx = b.px; b.ty = b.py; }
  };
  blocks.forEach((b) => { b.tx = b.px; b.ty = b.py; });
  const pos = (b) => {
    const bob = b.state === "pile" && !frozen ? Math.sin(tt * (1.6 + d) + b.ph) * (1 + 2 * d) : 0;
    const drop = (1 - ease.back(clamp01(introK * 1.4 - b.k * 0.05))) * 50;
    const sh = checkState === "bad" && b.state === "line" ? Math.round(Math.sin(tt * 60 + b.k) * 2 * shakeK) : 0;
    return { x: b.x + sh, y: b.y + bob + drop };
  };
  const hitAt = (x, y) => blocks.find((b) => { if (b.state === "gone") return false; const p = pos(b); return x >= p.x - 1 && x <= p.x + b.bw + 1 && y >= p.y - 4 && y <= p.y + H + 4; });

  async function check() {
    const ok = placed.map((b) => b.w).join(" ") === task.words.join(" ");
    const res = B.finish(ok, "word_order", placed.map((b) => b.w).join(" "));
    if (!res) return;
    checkState = ok ? "ok" : "bad";
    if (ok) {
      B.S("cast"); B.S("correct");
      ctx.cat && ctx.cat.attack && ctx.cat.attack();
      placed.forEach((b, j) => setTimeout(() => { b.jump = 1; fx.burst(b.x + b.bw / 2, b.y, { n: 5, colors: [COL.gold, COL.grassL, "#ffffff"], speed: 50, gravity: 80, size: 1 }); B.S("type"); }, j * 55));
      stage.shake && stage.shake(2, 140);
      await wait(260 + placed.length * 55);
    } else {
      B.S("deflect"); shakeK = 1; stage.shake && stage.shake(1, 100);
      await wait(420);
    }
    B.settle();
  }

  B.onDown((e) => {
    if (checkState) return false;
    const b = hitAt(e.x, e.y);
    if (!b) return false;
    if (b.state === "line") { placed.splice(placed.indexOf(b), 1); b.state = "pile"; B.S("tap"); }
    else { b.state = "line"; placed.push(b); B.S("type"); fx.burst(b.x + b.bw / 2, b.y + H / 2, { n: 4, colors: [COL.dirtL, COL.grassL], speed: 30, gravity: 60, size: 1 }); }
    relayout();
    return true;
  });

  const inst = {
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.4); if (introK >= 1 && !B.live) B.start(); }
      if (!frozen) tt += dt;
      if (shakeK > 0) shakeK = Math.max(0, shakeK - dt * 2);
      let settled = true;
      for (const b of blocks) {
        const k = Math.min(1, dt * 16);
        b.x += (b.tx - b.x) * k; b.y += (b.ty - b.y) * k;
        if (Math.abs(b.tx - b.x) > 0.5 || Math.abs(b.ty - b.y) > 0.5) settled = false;
        if (b.jump) b.jump = Math.max(0, b.jump - dt * 4);
      }
      if (!B.done && settled && placed.length === task.words.length) check();
    },
    draw(g, t) {
      // empty line ground (one ledge per row; no per-word widths, so it doesn't leak the answer)
      const L = flow(task.words.map(wOf), lineTop).pos;
      const ext = {};
      L.forEach((p, j) => { const e = (ext[p.y] = ext[p.y] || { a: 1e9, b: -1e9 }); e.a = Math.min(e.a, p.x); e.b = Math.max(e.b, p.x + wOf(task.words[j])); });
      g.globalAlpha = 0.6;
      for (const [y, e] of Object.entries(ext)) {
        const yy = Math.round(+y + H - 1);
        g.fillStyle = COL.ink; g.fillRect(Math.round(e.a), yy, Math.round(e.b - e.a), 3);
        g.fillStyle = COL.stoneD; for (let x = Math.round(e.a) + 1; x < e.b - 1; x += 4) g.fillRect(x, yy + 1, 2, 1);
      }
      g.globalAlpha = 1;
      for (const b of blocks) {
        if (b.state === "gone") continue;
        const p = pos(b);
        const y = p.y - (b.jump ? Math.sin(b.jump * Math.PI) * 6 : 0);
        const kind = checkState === "ok" || (inst._reveal) ? "gold" : checkState === "bad" && b.state === "line" ? "bad" : b.state === "line" ? "grass" : "stone";
        block(g, p.x, y, b.bw, H, kind === "bad" ? "stone" : kind, b.k);
        if (kind === "bad") { g.globalAlpha = 0.35; g.fillStyle = COL.bad; g.fillRect(Math.round(p.x) + 1, Math.round(y) + 1, Math.round(b.bw) - 2, H - 1); g.globalAlpha = 1; }
        word(g, b.w, p.x + b.bw / 2, y + H / 2 + 2, { size: FS, maxW: b.bw - 4, color: kind === "gold" ? COL.ink : COL.paper, shadow: kind === "gold" ? COL.goldL : COL.ink });
      }
    },
    result: B.result,
    hint() {
      // put the next correct word in place (only when the line so far is right)
      if (B.done) return false;
      const sofar = placed.map((b) => b.w);
      if (sofar.some((w, j) => w !== task.words[j]) || placed.length >= task.words.length - 1) return false;
      const b = blocks.find((x) => x.state === "pile" && x.w === task.words[placed.length]);
      if (!b) return false;
      b.state = "line"; placed.push(b); relayout();
      B.S("pop"); B.hinted = true;
      return true;
    },
    async reveal() {
      inst._reveal = true;
      // rebuild the line in the right order
      placed.length = 0;
      const used = new Set();
      for (const w of task.words) { const b = blocks.find((x) => !used.has(x) && x.w === w); used.add(b); b.state = "line"; placed.push(b); }
      relayout(); B.S("cast");
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() { B.destroy(); },
    debug: {
      // sequence: only the NEXT right block is ok (or the last placed block, to take it back, if the line is wrong)
      targets: () => {
        const onTrack = placed.every((b, j) => b.w === task.words[j]);
        const next = onTrack ? blocks.find((x) => x.state === "pile" && x.w === task.words[placed.length]) : placed[placed.length - 1];
        return blocks.filter((x) => x.state !== "gone").map((x) => { const p = pos(x); return { ...B.client(p.x + x.bw / 2, p.y + H / 2), ok: x === next, label: x.w, placed: x.state === "line" }; });
      },
      answer: (good) => {
        if (B.done) return;
        if (!B.live) B.start();
        while (placed.length) placed.pop().state = "pile";
        const order = good ? task.words.map((w) => w) : [...task.words].reverse();
        if (!good && order.join(" ") === task.words.join(" ")) order.push(order.shift());
        const used = new Set();
        for (const w of order) { const b = blocks.find((x) => !used.has(x) && x.w === w); used.add(b); b.state = "line"; placed.push(b); }
        relayout();
      },
    },
  };
  return inst;
}

// grass-topped dirt block (or stone / gold), deterministic speckles
function block(g, x, y, w, h, kind, seed) {
  x = Math.round(x); y = Math.round(y); w = Math.round(w);
  const P = kind === "stone" ? [COL.stoneD, COL.stone, COL.stoneL, COL.stone, COL.stoneL]
    : kind === "gold" ? ["#a87a12", "#d9a22b", COL.gold, COL.goldL, "#ffffff"]
    : [COL.dirtD, COL.dirt, COL.dirtL, COL.grass, COL.grassL];
  g.fillStyle = COL.ink; g.fillRect(x, y, w, h + 2);
  g.fillStyle = P[0]; g.fillRect(x + 1, y + 1, w - 2, h);
  g.fillStyle = P[1]; g.fillRect(x + 1, y + 1, w - 2, h - 2);
  // speckles
  let s = (seed + 1) * 9301;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < w / 3; i++) { g.fillStyle = rnd() < 0.5 ? P[0] : P[2]; g.fillRect(x + 2 + Math.floor(rnd() * (w - 5)), y + 7 + Math.floor(rnd() * (h - 10)), 2, 1); }
  // top layer (grass / highlight)
  g.fillStyle = P[3]; g.fillRect(x + 1, y + 1, w - 2, 5);
  g.fillStyle = P[4]; g.fillRect(x + 1, y + 1, w - 2, 1);
  g.fillStyle = P[3];
  for (let xx = x + 2; xx < x + w - 2; xx += 3) g.fillRect(xx, y + 6, 1, 1 + ((xx * 7) % 3 === 0 ? 2 : 0));
  // text plate darkening for legibility
  g.globalAlpha *= 0.25; g.fillStyle = COL.ink; g.fillRect(x + 2, y + 9, w - 4, h - 11); g.globalAlpha /= 0.25;
}
function crackLines(g, x, y, w, h) {
  g.fillStyle = COL.ink;
  const cx = Math.round(x + w / 2);
  for (let i = 0; i < h; i += 2) g.fillRect(cx + ((i / 2) % 3) - 1 - Math.floor(i / 6), Math.round(y) + i, 1, 2);
}
function drawPickaxe(g, x, y, k) {
  // three-step swing: raised -> mid -> hit
  const stepI = k < 0.33 ? 0 : k < 0.66 ? 1 : 2;
  const frames = [
    ["..###...", ".#...#..", "....#...", "...#....", "..#.....", ".#......"],
    ["........", "#.......", "##......", ".###....", "..#.##..", "..#...#."],
    ["........", "........", "#.......", "#.......", "#######.", "#......."],
  ];
  const f = frames[stepI];
  const ox = Math.round(x), oy = Math.round(y - 6);
  f.forEach((row, yy) => [...row].forEach((c, xx) => {
    if (c !== "#") return;
    g.fillStyle = COL.ink; g.fillRect(ox + xx * 2 - 1, oy + yy * 2 - 1, 4, 4);
  }));
  f.forEach((row, yy) => [...row].forEach((c, xx) => {
    if (c !== "#") return;
    const head = stepI === 0 ? yy <= 1 : stepI === 1 ? yy <= 2 && xx <= 1 : xx === 0;
    g.fillStyle = head ? COL.stoneL : COL.woodL; g.fillRect(ox + xx * 2, oy + yy * 2, 2, 2);
  }));
}

export default { create };
