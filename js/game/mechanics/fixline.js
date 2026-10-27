// FIX THE LINE: the sentence is a row of grass/dirt blocks (Minecraft-like). Tap the wrong block ->
// cat jumps on it and swings a pickaxe. v1 rules: ok = tapped index === task.badIdx; wrong tag = task.tag || 'fix'.
// On success the bad block shatters and the correct word block drops in.
import { base, word, textW, ease, clamp01, race, wait, COL, fxSafe, glowRect, arrowDown } from "./common.js";

export function create(ctx) {
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
      B.S("wrong");
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
