// BUBBLE POP: bubbles rise (and wrap) with pictures, speakers (pic2listen) or ✓/✗ (judge).
// listen2pic: tap the right picture.  pic2listen: 1st tap plays the word, tapping the same bubble again chooses it.
// judge: two big bubbles (right / wrong), they bob in place.
import { base, drawPic, drawSpeaker, ease, clamp01, race, wait, COL, fxSafe, word } from "./common.js";

const bubbleCache = new Map();
function bubbleSprite(r, tint) {
  const key = r + tint;
  if (bubbleCache.has(key)) return bubbleCache.get(key);
  const D = r * 2 + 2, cv = document.createElement("canvas"); cv.width = cv.height = D;
  const c = cv.getContext("2d");
  const cx = r + 1, cy = r + 1;
  for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.sqrt(dx * dx + dy * dy);
    if (d > r + 0.5) continue;
    let col;
    if (d > r - 0.7) col = COL.ink;
    else if (d > r - 1.9) col = tint === "ok" ? COL.okD : tint === "bad" ? COL.badD : COL.bubbleD;
    else if (d > r - 3.2) col = tint === "ok" ? COL.ok : tint === "bad" ? COL.bad : COL.bubble;
    else { c.globalAlpha = tint ? 0.3 : 0.42; c.fillStyle = tint === "ok" ? COL.ok : tint === "bad" ? COL.bad : COL.bubbleL; c.fillRect(x, y, 1, 1); c.globalAlpha = 1; continue; }
    c.fillStyle = col; c.fillRect(x, y, 1, 1);
  }
  // shine
  c.fillStyle = "#ffffff";
  const sx = Math.round(cx - r * 0.55), sy = Math.round(cy - r * 0.55);
  c.fillRect(sx, sy + 2, 2, 4); c.fillRect(sx + 2, sy, 4, 2); c.fillRect(sx + 1, sy + 1, 2, 2);
  c.fillRect(Math.round(cx + r * 0.45), Math.round(cy + r * 0.4), 2, 2);
  bubbleCache.set(key, cv);
  return cv;
}

export function create(ctx) {
  const { task, arena: A, stage } = ctx;
  const B = base(ctx);
  const fx = fxSafe(ctx.fx);
  const d = Math.max(0, Math.min(1, ctx.difficulty || 0));
  const kind = task.type === "judge" ? "judge" : task.type === "pic2listen" ? "listen" : "pic";
  const opts = kind === "judge"
    ? [{ ok: task.correct === true, says: true, label: "right" }, { ok: task.correct === false, says: false, label: "wrong" }]
    : task.options;
  const n = opts.length;
  const r = kind === "judge" ? 30 : n >= 4 ? 24 : 26;
  const colW = A.w / n;
  const span = A.h + r * 2; // wrap distance
  const speed = kind === "judge" ? 0 : 5 + 13 * d; // px/s upwards
  const bubbles = opts.map((o, i) => ({
    o, ok: !!o.ok, i, alive: true, state: "idle", sel: false, played: false,
    bx: A.x + colW * (i + 0.5), ph: Math.random() * 6,
    // stagger heights so they never all wrap together
    off: kind === "judge" ? 0 : ((i * 0.37 + (i % 2) * 0.5) % 1) * (A.h - r * 2) + r, k: 1,
  }));
  if (kind !== "judge") bubbles.sort(() => Math.random() - 0.5).forEach((b, j) => (b.off = ((j + 0.5) / n) * (A.h - 2 * r) + r));
  let tt = 0, introK = 0, frozen = false;
  const pos = (b) => {
    const wob = Math.sin(tt * (1.1 + d) + b.ph) * (3 + 5 * d);
    if (kind === "judge") return { x: b.bx + wob * 0.5, y: A.y + A.h * 0.5 + Math.sin(tt * 1.6 + b.ph) * 4 + (1 - ease.back(clamp01(introK))) * 60, a: clamp01(introK * 2) };
    // y from bottom; rises; wraps through the bottom edge
    const rise = b.off + b.t0rise;
    const yy = ((rise % span) + span) % span; // 0..span
    const y = A.y + A.h + r - yy;
    // fade near edges
    const edge = Math.min(y - (A.y + r * 0.6), A.y + A.h - r * 0.6 - y);
    return { x: b.bx + wob, y: y + (1 - ease.out(clamp01(introK))) * 30, a: clamp01(edge / 10) * clamp01(introK * 2) };
  };
  for (const b of bubbles) b.t0rise = 0;

  const hitAt = (x, y) => {
    let best = null, bd = 1e9;
    for (const b of bubbles) {
      if (!b.alive || b.state !== "idle") continue;
      const p = pos(b); if (p.a < 0.5) continue;
      const dd = Math.hypot(x - p.x, y - p.y);
      if (dd <= r + 4 && dd < bd) { bd = dd; best = b; }
    }
    return best;
  };

  async function choose(b) {
    const ok = kind === "judge" ? b.o.says === task.correct : b.ok;
    const tag = kind === "judge" ? task.tag || "judge" : b.o.tag;
    const res = B.finish(ok, tag, kind === "judge" ? b.o.says : b.o);
    if (!res) return;
    const p = pos(b);
    b.state = "target"; b.fx = p.x; b.fy = p.y; b.fa = p.a;
    B.S("tap");
    if (ctx.cat) { await race(ctx.cat.jumpTo && ctx.cat.jumpTo(p.x, p.y + r), 400); ctx.cat.attack && ctx.cat.attack(); }
    await wait(50);
    stage.hitstop && stage.hitstop(60);
    b.alive = false; b.state = "pop";
    B.S("pop");
    if (ok) {
      B.S("correct");
      fx.burst(p.x, p.y, { n: 24, colors: [COL.bubbleL, COL.bubble, "#ffffff", COL.gold], speed: 80, gravity: 40, size: 2 });
      fx.ring(p.x, p.y, COL.bubbleL, { r: r * 0.7, vr: 90 });
      stage.shake && stage.shake(2, 120);
      for (const o of bubbles) if (o !== b) o.state = "flee";
    } else {
      B.S("deflect");
      fx.burst(p.x, p.y, { n: 16, colors: [COL.bad, COL.badD, COL.bubbleL], speed: 60, gravity: 140, size: 2 });
      stage.shake && stage.shake(2, 100);
    }
    await wait(ok ? 260 : 320);
    B.settle();
  }

  B.onDown((e) => {
    const b = hitAt(e.x, e.y);
    if (!b) return false;
    if (kind === "listen") {
      if (b.sel) { choose(b); return true; }
      bubbles.forEach((x) => (x.sel = false));
      b.sel = true; b.played = true; b.ring = 1;
      B.say(b.o.en); B.S("tap");
      const p = pos(b); fx.ring(p.x, p.y, COL.gold, { r: r * 0.8, vr: 40 });
      return true;
    }
    choose(b);
    return true;
  });

  const inst = {
    update(dt) {
      dt = Math.min(dt, 0.05);
      if (introK < 1) { introK = Math.min(1, introK + dt * 2.4); if (introK >= 1 && !B.live) B.start(); }
      if (!frozen) tt += dt;
      for (const b of bubbles) {
        // the selected (listen) bubble stays still so the second tap is easy
        if (!frozen && !b.sel && b.state === "idle" && !inst._reveal) b.t0rise += speed * dt;
        if (b.state === "flee") { b.t0rise += 160 * dt; b.k = Math.max(0, b.k - dt * 2.5); }
        if (b.ring > 0) b.ring = Math.max(0, b.ring - dt);
      }
    },
    draw(g, t) {
      g.save();
      g.beginPath(); g.rect(A.x - 6, A.y - 4, A.w + 12, A.h + 8); g.clip();
      for (const b of bubbles) {
        if (b.state === "pop") continue;
        const p = pos(b);
        let a = p.a * (b.state === "flee" ? b.k : 1);
        if (inst._reveal && !b.ok) a *= 0.35;
        if (a <= 0.02) continue;
        g.globalAlpha = a;
        const tint = kind === "judge" ? (b.o.says ? "ok" : "bad") : "";
        const spr = bubbleSprite(r, tint);
        const breathe = b.sel ? Math.round(Math.sin(t * 10) * 1) : 0;
        const x0 = Math.round(p.x - r - 1), y0 = Math.round(p.y - r - 1);
        g.drawImage(spr, x0 - breathe, y0 - breathe, spr.width + breathe * 2, spr.height + breathe * 2);
        if (kind === "pic") drawPic(g, b.o.img, p.x, p.y + 1, 2, 1);
        else if (kind === "listen") {
          drawSpeaker(g, p.x - 1, p.y - 1, 2, COL.ink);
          // number badge so kids can tell them apart
          const bx = Math.round(p.x + r * 0.55), by = Math.round(p.y - r * 0.75);
          g.fillStyle = COL.ink; g.fillRect(bx - 5, by - 5, 11, 11); g.fillStyle = b.played ? COL.gold : COL.paper; g.fillRect(bx - 4, by - 4, 9, 9);
          word(g, String(b.i + 1), bx + 0.5, by + 0.8, { size: 8, color: COL.ink, shadow: null, weight: 700, font: "Pixelify Sans" });
          if (b.sel) {
            // sound waves + "tap again" check badge
            const w = (t * 2) % 1;
            g.fillStyle = COL.gold; g.globalAlpha = a * (1 - w);
            const rr = r + 2 + w * 8; const N = 28;
            for (let k = 0; k < N; k++) { const an = (k / N) * Math.PI * 2; g.fillRect(Math.round(p.x + Math.cos(an) * rr), Math.round(p.y + Math.sin(an) * rr), 1, 1); }
            g.globalAlpha = a;
            const cy = Math.round(p.y + r + 8);
            g.fillStyle = COL.ink; g.fillRect(Math.round(p.x) - 9, cy - 6, 19, 12);
            g.fillStyle = COL.ok; g.fillRect(Math.round(p.x) - 8, cy - 5, 17, 10);
            checkMark(g, Math.round(p.x) - 4, cy - 3, COL.ink);
          }
        } else {
          // judge icons
          if (b.o.says) checkMark(g, Math.round(p.x) - 9, Math.round(p.y) - 6, COL.paper, 2);
          else crossMark(g, Math.round(p.x) - 7, Math.round(p.y) - 7, COL.paper, 2);
        }
        if (inst._reveal && b.ok) {
          g.globalAlpha = 1;
          const rr = r + 3 + Math.round((Math.sin(t * 8) + 1) * 1.5);
          g.fillStyle = COL.gold; const N = 40;
          for (let k = 0; k < N; k++) { const an = (k / N) * Math.PI * 2; g.fillRect(Math.round(p.x + Math.cos(an) * rr), Math.round(p.y + Math.sin(an) * rr), 2, 2); }
        }
      }
      g.restore();
    },
    result: B.result,
    hint() {
      if (B.done || kind === "judge") return false;
      const alive = bubbles.filter((b) => b.alive && b.state === "idle");
      const wrong = alive.filter((b) => !b.ok);
      if (!wrong.length || alive.length <= 2) return false;
      const b = wrong[Math.floor(Math.random() * wrong.length)];
      const p = pos(b);
      b.alive = false; b.state = "pop"; b.sel = false;
      fx.burst(p.x, p.y, { n: 12, colors: ["#d8d4e8", "#a49fb8"], speed: 30, gravity: -20, size: 2 });
      B.S("pop"); B.hinted = true;
      return true;
    },
    async reveal() {
      inst._reveal = true;
      const b = bubbles.find((x) => x.ok);
      if (b) {
        b.alive = true; b.state = "idle"; b.sel = false; b.k = 1;
        // park it in the middle so it's clearly visible
        const target = A.h / 2 + r; b.t0rise = target - b.off;
        if (kind === "listen") B.say(b.o.en);
      }
      for (const o of bubbles) if (!o.ok && o.state !== "pop") o.state = "flee";
      await B.revealCard(task, kind === "judge" && !task.correct ? `<div class="mech-ans__pl">${esc2(task.sentence)} ✗</div>` : "");
      inst._reveal = false;
    },
    freeze(on) { frozen = !!on; },
    destroy() { B.destroy(); },
    debug: {
      targets: () => bubbles.filter((b) => b.alive && b.state === "idle").map((b) => { const p = pos(b); return { ...B.client(p.x, p.y), ok: kind === "judge" ? b.o.says === task.correct : b.ok, label: kind === "judge" ? b.o.label : b.o.en, visible: p.a >= 0.5 }; }),
      answer: (good) => {
        if (B.done) return;
        if (!B.live) B.start();
        const b = bubbles.find((x) => x.alive && x.state === "idle" && (kind === "judge" ? (x.o.says === task.correct) === !!good : x.ok === !!good));
        if (b) choose(b);
      },
    },
  };
  return inst;
}

const esc2 = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

function checkMark(g, x, y, col, s = 1) {
  const px = ["......##", ".....##.", "#...##..", "##.##...", ".###....", "..#....."];
  g.fillStyle = COL.ink;
  px.forEach((row, yy) => [...row].forEach((c, xx) => { if (c === "#") g.fillRect(x + xx * s - 1, y + yy * s - 1, s + 2, s + 2); }));
  g.fillStyle = col;
  px.forEach((row, yy) => [...row].forEach((c, xx) => { if (c === "#") g.fillRect(x + xx * s, y + yy * s, s, s); }));
}
function crossMark(g, x, y, col, s = 1) {
  const px = ["##....##", ".##..##.", "..####..", "...##...", "..####..", ".##..##.", "##....##"];
  g.fillStyle = COL.ink;
  px.forEach((row, yy) => [...row].forEach((c, xx) => { if (c === "#") g.fillRect(x + xx * s - 1, y + yy * s - 1, s + 2, s + 2); }));
  g.fillStyle = col;
  px.forEach((row, yy) => [...row].forEach((c, xx) => { if (c === "#") g.fillRect(x + xx * s, y + yy * s, s, s); }));
}

export default { create };
