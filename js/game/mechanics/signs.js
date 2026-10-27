// SIGN SMASH: 2–4 signs hang from ropes and sway; tap one -> cat jumps + attacks, sign smashes.
// Used for word2pic (pictures), pic2word / pl2en / match (words), cloze (words).
import { base, panel, word, textW, drawPic, glowRect, arrowDown, ease, clamp01, race, wait, COL, fxSafe } from "./common.js";

export function create(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const isPic = task.type === "word2pic";
  const opts = task.options || [];
  const labelOf = (o) => o.en ?? o.label ?? "";
  const c = stage.ctx;

  // ---- layout ----
  const n = opts.length;
  let sw, sh, rows;
  if (isPic) {
    sh = 50; sw = n <= 3 ? 54 : 50;
    rows = [opts.map((_, i) => i)];
    if (n * (sw + 6) > A.w) { rows = [[0, 1], [2, 3]]; }
  } else {
    sh = 30;
    const tw = Math.max(...opts.map((o) => textW(c, labelOf(o), 11)));
    sw = Math.max(56, Math.min(A.w / 2 - 8, Math.ceil(tw) + 18));
    rows = n * (sw + 8) <= A.w ? [opts.map((_, i) => i)] : n === 3 ? [[0, 1], [2]] : [[0, 1], [2, 3]];
  }
  const rowGap = isPic ? 26 : 22;
  const blockH = rows.length * sh + (rows.length - 1) * rowGap;
  const top0 = A.y + Math.max(14, Math.min(96, (A.h - blockH) * 0.3));
  const signs = [];
  const grid = [];
  rows.forEach((row, ri) => {
    const gap = Math.min(18, (A.w - row.length * sw) / (row.length + 1));
    const total = row.length * sw + (row.length - 1) * gap;
    row.forEach((oi, k) => {
      const hx = A.x + (A.w - total) / 2 + k * (sw + gap) + sw / 2;
      const hy = top0 + ri * (sh + rowGap);
      const parent = ri > 0 && grid[ri - 1] && grid[ri - 1][k] && rows[ri - 1].length === row.length ? grid[ri - 1][k] : null;
      const sg = {
        o: opts[oi], ok: !!opts[oi].ok, hx, hy, w: sw, h: sh, x: hx - sw / 2, y: hy, rope: hy - A.y,
        ph: oi * 1.7 + Math.random(), alive: true, state: "idle", k: 0, vy: 0, vx: 0, flash: 0, crack: 0, drop: 1, parent,
      };
      if (parent) sg.ph = parent.ph; // hang from the sign above: swing together
      signs.push(sg); (grid[ri] = grid[ri] || [])[k] = sg;
    });
  });

  // motion: horizontal sway (no rotation, stays pixel crisp) + slow drift with difficulty
  const swayA = 1.5 + 5 * d, swayW = 1.3 + 1.2 * d, driftA = 18 * d * d, driftW = 0.35 + 0.25 * d;
  let tt = 0, introK = 0, frozen = false;
  const pos = (s) => {
    const drift = Math.sin(tt * driftW) * driftA;
    const sway = frozen ? 0 : Math.sin(tt * swayW + s.ph) * swayA * (s.parent ? 1.5 : 1);
    let x = s.hx - s.w / 2 + sway + drift;
    x = Math.max(A.x + 1, Math.min(A.x + A.w - s.w - 1, x));
    const dropOff = (1 - ease.back(clamp01(introK * 1.4 - s.ph * 0.04))) * -(s.y - A.y + s.h + 10);
    return { x, y: s.hy + Math.sin(tt * swayW * 2 + s.ph) * (frozen ? 0 : 0.6 + d) + dropOff };
  };

  const hitAt = (x, y) => {
    let best = null;
    for (const s of signs) {
      if (!s.alive || s.state !== "idle") continue;
      const p = pos(s), m = 4;
      if (x >= p.x - m && x <= p.x + s.w + m && y >= p.y - m && y <= p.y + s.h + m) best = s;
    }
    return best;
  };

  async function choose(s) {
    const r = B.finish(s.ok, s.o.tag, s.o);
    if (!r) return;
    B.S("tap");
    if (task.voice && s.o.en && !isPic) B.say(s.o.en);
    const p = pos(s);
    s.state = "target";
    const cx = p.x + s.w / 2, cy = p.y + s.h / 2;
    if (ctx.cat) { await race(ctx.cat.jumpTo && ctx.cat.jumpTo(cx, p.y + s.h + 2), 420); ctx.cat.attack && ctx.cat.attack(); }
    await wait(60);
    stage.hitstop && stage.hitstop(70);
    if (s.ok) {
      stage.shake && stage.shake(3, 160);
      s.state = "smash"; s.alive = false;
      B.S("smash"); B.S("correct");
      fx.burst(cx, cy, { n: 22, colors: [COL.woodL, COL.wood, COL.woodD, COL.gold], speed: 90, gravity: 160, size: 2 });
      fx.burst(cx, cy, { n: 10, colors: ["#ffffff", COL.gold], speed: 50, gravity: 0, size: 1 });
      fx.ring(cx, cy, COL.gold);
      for (const o of signs) if (o !== s) { o.state = "fall"; o.vy = -30 - Math.random() * 30; o.vx = (o.hx - cx) * 0.6; }
    } else {
      stage.shake && stage.shake(2, 120);
      s.state = "wrong"; s.flash = 1; s.crack = 1;
      B.S("deflect");
      fx.burst(cx, cy, { n: 10, colors: [COL.woodD, COL.bad], speed: 60, gravity: 160, size: 1 });
      setTimeout(() => { s.state = "fall"; s.vy = -20; s.vx = 0; }, 260);
    }
    await wait(s.ok ? 260 : 330);
    B.settle();
  }

  B.onDown((e) => { const s = hitAt(e.x, e.y); if (s) { choose(s); return true; } });

  const inst = {
    update(dt, t) {
      dt = Math.min(dt, 0.05);
      if (!frozen) tt += dt;
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.6); if (introK >= 1 && !B.live) B.start(); }
      for (const s of signs) {
        if (s.flash > 0) s.flash = Math.max(0, s.flash - dt * 3);
        if (s.state === "fall") { s.vy += 420 * dt; s.hy += s.vy * dt; s.hx += s.vx * dt; s.drop = Math.max(0, s.drop - dt * 1.6); }
      }
    },
    draw(g, t) {
      for (const s of signs) {
        if (s.state === "smash") continue;
        if (s.state === "fall" && s.drop <= 0) continue;
        const p = pos(s);
        const a = s.state === "fall" ? s.drop : 1;
        g.save(); g.globalAlpha = a;
        // ropes
        if (s.state !== "fall") {
          g.fillStyle = COL.woodDD;
          const l1 = Math.round(p.x + 6), l2 = Math.round(p.x + s.w - 7);
          const par = s.parent && s.parent.state !== "fall" && s.parent.state !== "smash" ? s.parent : null;
          if (par) {
            const pp = pos(par), top = Math.round(pp.y + par.h - 1);
            ropeLine(g, Math.round(pp.x + 6), top, l1, Math.round(p.y));
            ropeLine(g, Math.round(pp.x + par.w - 7), top, l2, Math.round(p.y));
          } else {
            const ropeTop = Math.round(par === null && s.parent ? A.y : Math.min(p.y, s.hy) - Math.max(6, s.rope));
            const sx = Math.round((p.x + s.w / 2 - s.hx) * 0.5);
            ropeLine(g, l1 - sx, ropeTop, l1, Math.round(p.y));
            ropeLine(g, l2 - sx, ropeTop, l2, Math.round(p.y));
          }
        }
        const shakeX = s.state === "wrong" ? Math.round(Math.sin(t * 60) * 2) : 0;
        const tint = s.flash > 0 ? COL.bad : null;
        panel(g, p.x + shakeX, p.y, s.w, s.h, isPic ? "wood" : "wood", tint ? { tint } : {});
        // nails
        g.fillStyle = COL.ink; g.fillRect(Math.round(p.x + 6) + shakeX, Math.round(p.y) + 2, 1, 1); g.fillRect(Math.round(p.x + s.w - 7) + shakeX, Math.round(p.y) + 2, 1, 1);
        if (isPic) drawPic(g, s.o.img, p.x + s.w / 2 + shakeX, p.y + s.h / 2 + 1, 2);
        else word(g, labelOf(s.o), p.x + s.w / 2 + shakeX, p.y + s.h / 2 + 1, { size: 11, maxW: s.w - 8, color: COL.paper });
        if (s.crack) { g.fillStyle = COL.ink; const cx = Math.round(p.x + s.w * 0.6) + shakeX, cy = Math.round(p.y); for (let i = 0; i < s.h - 2; i += 2) g.fillRect(cx + ((i / 2) % 3) - 1, cy + i, 1, 2); }
        if (inst._reveal && s.ok) { glowRect(g, p.x, p.y, s.w, s.h, COL.gold, t); arrowDown(g, p.x + s.w / 2, p.y - 3, t); }
        g.restore();
      }
    },
    result: B.result,
    hint() {
      if (B.done) return false;
      const alive = signs.filter((s) => s.alive && s.state === "idle");
      const wrong = alive.filter((s) => !s.ok);
      if (!wrong.length || alive.length <= 2) return false;
      const s = wrong[Math.floor(Math.random() * wrong.length)];
      const p = pos(s);
      s.alive = false; s.state = "fall"; s.vy = -10; s.vx = 0;
      fx.burst(p.x + s.w / 2, p.y + s.h / 2, { n: 12, colors: ["#d8d4e8", "#a49fb8"], speed: 30, gravity: -20, size: 2 });
      B.S("pop"); B.hinted = true;
      return true;
    },
    async reveal() {
      inst._reveal = true;
      // bring the correct sign back if it fell
      const s = signs.find((x) => x.ok);
      if (s && s.state !== "idle") { s.state = "back"; }
      for (const o of signs) if (o.ok) { o.state = "idle"; o.alive = false; o.drop = 1; o.hy = o.y; o.hx = o.x + o.w / 2; }
      await B.revealCard(task);
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() { B.destroy(); },
    debug: {
      targets: () => signs.filter((s) => s.alive && s.state === "idle").map((s) => { const p = pos(s); return { ...B.client(p.x + s.w / 2, p.y + s.h / 2), ok: s.ok, label: isPic ? s.o.img : labelOf(s.o) }; }),
      answer: (good) => { const s = signs.find((x) => x.alive && x.state === "idle" && x.ok === !!good); if (s && !B.done) { if (!B.live) B.start(); choose(s); } },
    },
  };
  return inst;
}

function ropeLine(g, x0, y0, x1, y1) {
  const n = Math.max(1, Math.abs(y1 - y0));
  for (let i = 0; i <= n; i += 1) { const k = i / n; g.fillRect(Math.round(x0 + (x1 - x0) * k), Math.round(y0 + (y1 - y0) * k), 1, 1); }
}

export default { create };
