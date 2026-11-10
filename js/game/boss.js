// BOSS — intro card + slow projectiles the player taps to deflect.
// A missed projectile costs a shield (talent nine_lives) or breaks the combo. NEVER a life.
// Paths are curved (random bend per shot); speed grows with damage dealt: progress()=0 -> 1x, progress()=1 -> 2x.
// guide: the very first shot of the player's first boss is slow and has a tapping hand on it (tutorial).
// Projectiles freeze while `paused` (intro / reveal / typing / cards).

export async function bossIntro({ ui, stage, fx, monster, sfx = {} }) {
  let portrait = "";
  try { portrait = monster.portraitURL ? monster.portraitURL(4) : ""; } catch {}
  try { sfx.bossIntro && sfx.bossIntro(); } catch {}
  stage.shake(3, 400);
  fx.flash("#ff3a3a", 140);
  await ui.bossCard({ name: monster.name || "Boss", portrait });
}

/**
 * createBossFight({ stage, fx, rng, sfx, from:()=>{x,y}, to:()=>{x,y}, colors, onMiss(proj), onDeflect(proj) })
 * -> { update(dt,t), draw(ctx,t), paused, phase, setPhase(n), clear(), destroy(), projectiles }
 */
export function createBossFight({ stage, fx, rng = Math.random, sfx = {}, from, to, colors = ["#ff6b2c", "#ffcf3f"], onMiss, onDeflect, progress = () => 0, guide = false }) {
  const P = [];
  let spawnIn = guide ? 0.8 : 2.6, phase = 1, alive = true;
  const prog = () => { try { return Math.max(0, Math.min(1, progress() || 0)); } catch { return 0; } };
  const cfg = () => (phase === 1 ? { speed: 22, every: 4.8, max: 1 } : { speed: 22, every: 3.2, max: 2 });
  const R = 12; // tap radius (logical px): still kid-sized, but you have to aim

  const off = stage.input.on("down", (e) => {
    if (!alive || fight.paused) return false;
    let best = null, bd = 1e9;
    for (const p of P) {
      if (p.state !== "fly") continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < R + 3 && d < bd) { bd = d; best = p; }
    }
    if (!best) return false;
    best.state = "back"; best.t = 0;
    const s = from();
    best.bx = best.x; best.by = best.y; best.tx = s.x; best.ty = s.y - 10;
    try { sfx.deflect ? sfx.deflect() : sfx.tap && sfx.tap(); } catch {}
    fx.burst(best.x, best.y, { n: 10, colors: ["#ffffff", colors[1]], speed: 70, gravity: 60 });
    fx.ring(best.x, best.y, "#ffffff");
    stage.hitstop(45);
    fx.float(best.x, best.y - 8, "NICE!", { color: "#ffffff" });
    onDeflect && onDeflect(best);
    return true;
  }, { priority: 10 });

  function spawn() {
    const s = from(), d = to();
    const sx = s.x - 8, sy = s.y - 14, tx = d.x, ty = d.y - 8;
    const len = Math.hypot(tx - sx, ty - sy) || 1;
    // bend: control point pushed sideways (up or down) from the middle of the line, random size
    const bend = (rng() < 0.5 ? -1 : 1) * (18 + rng() * 34) * (0.6 + prog() * 0.6);
    const nx = -(ty - sy) / len, ny = (tx - sx) / len;
    const cx = (sx + tx) / 2 + nx * bend, cy = (sy + ty) / 2 + ny * bend - 10;
    const g = guide; guide = false;
    const speed = cfg().speed * (1 + prog()) * (g ? 0.5 : 1);
    P.push({ x: sx, y: sy, sx, sy, cx, cy, tx, ty, t: 0, state: "fly", guide: g,
      dur: (len * 1.15) / speed, wob: rng() * 6.28, wa: 1 + rng() * 3 + prog() * 2, wf: 3 + rng() * 4,
      sneak: rng() < 0.35 + prog() * 0.3, trail: 0 }); // sneak: starts slow, speeds up
    try { sfx.pop && sfx.pop(); } catch {}
  }

  const fight = {
    paused: true,
    projectiles: P,
    get phase() { return phase; },
    setPhase(n) { phase = n; spawnIn = Math.min(spawnIn, 1.2); },
    clear() { for (const p of P) fx.burst(p.x, p.y, { n: 6, colors, speed: 40 }); P.length = 0; },
    update(dt, t) {
      if (!alive) return;
      if (fight.paused) return;
      const c = cfg();
      spawnIn -= dt;
      if (spawnIn <= 0) { spawnIn = c.every * (0.8 + rng() * 0.4); if (P.filter((p) => p.state === "fly").length < c.max) spawn(); }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.t += dt;
        if (p.state === "fly") {
          const k0 = Math.min(1, p.t / p.dur);
          const k = p.sneak ? k0 * (0.55 + 0.45 * k0) : k0; // ends at k=1 either way
          const u = 1 - k; // quadratic bezier sx -> cx -> tx + a little wobble across the path
          p.x = u * u * p.sx + 2 * u * k * p.cx + k * k * p.tx + Math.sin(p.t * p.wf + p.wob) * p.wa;
          p.y = u * u * p.sy + 2 * u * k * p.cy + k * k * p.ty + Math.cos(p.t * p.wf * 0.8 + p.wob) * p.wa * 0.6;
          p.trail += dt;
          if (p.trail > 0.06) { p.trail = 0; fx.burst(p.x, p.y, { n: 1, colors, speed: 6, gravity: -10, life: 0.35 }); }
          if (k >= 1) {
            P.splice(i, 1);
            fx.burst(p.x, p.y, { n: 12, colors: [...colors, "#ffffff"], speed: 60 });
            stage.shake(2, 160);
            onMiss && onMiss(p);
          }
        } else {
          const k = Math.min(1, p.t / 0.35);
          p.x = p.bx + (p.tx - p.bx) * k; p.y = p.by + (p.ty - p.by) * k - Math.sin(k * Math.PI) * 14;
          if (k >= 1) { P.splice(i, 1); fx.burst(p.x, p.y, { n: 8, colors: ["#ffffff", colors[0]], speed: 50 }); }
        }
      }
    },
    draw(ctx, t) {
      for (const p of P) {
        const x = Math.round(p.x), y = Math.round(p.y);
        const pulse = Math.floor(t * 8) % 2;
        const back = p.state === "back";
        // blinking tap ring so kids know to tap it
        if (!back) { ctx.fillStyle = pulse ? "#ffffff" : colors[1]; const rr = 12 + pulse; for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2 + t * 2; if (a % 2) continue; ctx.fillRect(Math.round(x + Math.cos(an) * rr), Math.round(y + Math.sin(an) * rr), 2, 2); } }
        // spiky orb, 13x13
        ctx.fillStyle = "#0e0b16"; ctx.fillRect(x - 6, y - 4, 13, 9); ctx.fillRect(x - 4, y - 6, 9, 13); ctx.fillRect(x - 5, y - 5, 11, 11);
        ctx.fillStyle = back ? "#ffffff" : colors[0]; ctx.fillRect(x - 5, y - 3, 11, 7); ctx.fillRect(x - 3, y - 5, 7, 11); ctx.fillRect(x - 4, y - 4, 9, 9);
        ctx.fillStyle = back ? "#bfe8ff" : colors[1]; ctx.fillRect(x - 3, y - 3, 6, 6);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 2, y - 3, 2, 2);
        if (p.guide && !back) drawHand(ctx, x + 6, y + 6, t);
        // angry eyes
        if (!back) { ctx.fillStyle = "#0e0b16"; ctx.fillRect(x - 2, y, 1, 2); ctx.fillRect(x + 2, y, 1, 2); }
        // spikes
        ctx.fillStyle = colors[pulse ? 1 : 0];
        ctx.fillRect(x - 8, y, 2, 1); ctx.fillRect(x + 7, y, 2, 1); ctx.fillRect(x, y - 8, 1, 2); ctx.fillRect(x, y + 7, 1, 2);
      }
    },
    destroy() { alive = false; off(); P.length = 0; },
  };
  return fight;
}

// pixel pointing hand (tutorial), fingertip at (x, y), taps up and down
const HAND = ["..##......", "..#W#.....", "..#W#.....", "..#W###...", "..#WW#W##.", "###WWWWW#W#", "#WW#WWWWWW#", ".#WWWWWWWW#", "..#WWWWWW#.", "...#WWWW#..", "...######.."];
export function drawHand(ctx, x, y, t) {
  const b = Math.round(Math.abs(Math.sin(t * 5)) * 4);
  const ox = Math.round(x - 3), oy = Math.round(y + b);
  HAND.forEach((r, j) => [...r].forEach((c, i) => {
    if (c === ".") return;
    ctx.fillStyle = c === "W" ? "#ffffff" : "#0e0b16";
    ctx.fillRect(ox + i, oy + j, 1, 1);
  }));
}
