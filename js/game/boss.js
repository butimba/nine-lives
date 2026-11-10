// BOSS — intro card + slow projectiles the player taps to deflect.
// A missed projectile costs a shield (talent nine_lives) or breaks the combo. NEVER a life.
// Paths are curved (random bend per shot); speed grows with damage dealt: progress()=0 -> 1x, progress()=1 -> 1.5x.
// Deflects in a row build a streak (NICE! -> GREAT! -> SUPER! -> WOW!, onDeflect(proj, streak)); a miss resets it.
// Sometimes the boss drops a GOLDEN shot: tap it for a prize (onBonus), missing it costs nothing.
// guide: the very first shot of the player's first boss is slow and has a tapping hand on it (tutorial).
// Projectiles freeze while `paused` (intro / reveal / typing / cards).

export async function bossIntro({ ui, stage, fx, monster, sfx = {}, king = false }) {
  let portrait = "";
  try { portrait = monster.portraitURL ? monster.portraitURL(4) : ""; } catch {}
  try { sfx.bossIntro && sfx.bossIntro(); } catch {}
  stage.shake(3, 400);
  fx.flash("#ff3a3a", 140);
  await ui.bossCard({ name: monster.name || "Boss", portrait, stamp: king ? "KING!" : "BOSS!" });
}

/**
 * createBossFight({ stage, fx, rng, sfx, from:()=>{x,y}, to:()=>{x,y}, colors, onMiss(proj), onDeflect(proj) })
 * -> { update(dt,t), draw(ctx,t), paused, phase, setPhase(n), clear(), destroy(), projectiles }
 */
export function createBossFight({ stage, fx, rng = Math.random, sfx = {}, from, to, colors = ["#ff6b2c", "#ffcf3f"], onMiss, onDeflect, onBonus, progress = () => 0, guide = false, king = false }) {
  const P = [];
  let spawnIn = guide ? 0.8 : 2.6, phase = 1, alive = true, streak = 0, shots = 0;
  const prog = () => { try { return Math.max(0, Math.min(1, progress() || 0)); } catch { return 0; } };
  // 2nd shot in the air once the boss is half down; phase 2 throws more often
  // SPEED = px/s along the path. Tuned down for 7-year-olds (was 36 and up to 2x): a shot now takes ~7 s at the start of a fight and ~4.5 s at the end (was ~5 s and ~2.5 s).
  // king (every 25th floor): a 3rd shot in the air in phase 2
  const cfg = () => ({ speed: 28, every: phase === 1 ? 4.2 : 3.1, max: phase === 1 && prog() < 0.5 ? 1 : king && phase === 2 ? 3 : 2 });
  const WORDS = ["NICE!", "GREAT!", "SUPER!", "WOW!"];
  const GOLD = ["#ffd23f", "#fff1a8"];
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
    if (best.gold) { // prize shot: pops into sparkles, the run decides the prize
      P.splice(P.indexOf(best), 1);
      try { sfx.coin ? sfx.coin() : sfx.tap && sfx.tap(); } catch {}
      fx.burst(best.x, best.y, { n: 18, colors: [...GOLD, "#ffffff"], speed: 80, gravity: 60, size: 2 });
      fx.ring(best.x, best.y, GOLD[0]);
      onBonus && onBonus(best);
      return true;
    }
    best.state = "back"; best.t = 0; streak++;
    const s = from();
    best.bx = best.x; best.by = best.y; best.tx = s.x; best.ty = s.y - 10;
    try { sfx.deflect ? sfx.deflect() : sfx.tap && sfx.tap(); } catch {}
    fx.burst(best.x, best.y, { n: 10, colors: ["#ffffff", colors[1]], speed: 70, gravity: 60 });
    fx.ring(best.x, best.y, "#ffffff");
    stage.hitstop(45);
    fx.float(best.x, best.y - 8, WORDS[Math.min(WORDS.length, streak) - 1], { color: streak >= 3 ? GOLD[0] : "#ffffff", big: streak >= 4 });
    onDeflect && onDeflect(best, streak);
    return true;
  }, { priority: 10 });

  function spawn() {
    const s = from(), d = to();
    const sx = s.x - 8, sy = s.y - 14, tx = d.x, ty = d.y - 8;
    const len = Math.hypot(tx - sx, ty - sy) || 1;
    // cubic bezier: two control points pushed sideways by random amounts -> big arcs, dips and S-curves, never the same
    const nx = -(ty - sy) / len, ny = (tx - sx) / len;
    // (+ = away from the floor) mostly high arcs, sometimes a low skim, 40% a hump that dives at the end (S-curve)
    const amp = 70 + prog() * 50;
    const b1 = amp * (0.25 + 0.75 * rng()) * (rng() < 0.85 ? 1 : -0.3);
    const b2 = rng() < 0.4 ? -amp * (0.2 + 0.4 * rng()) : amp * rng();
    const c1x = sx + (tx - sx) * 0.3 + nx * b1, c1y = sy + (ty - sy) * 0.3 + ny * b1 - 20 * rng();
    const c2x = sx + (tx - sx) * 0.7 + nx * b2, c2y = sy + (ty - sy) * 0.7 + ny * b2 - 20 * rng();
    const floorY = Math.max(sy, ty) + 25; // dips may go low, but never through the floor (the curve stays inside its control points)
    const g = guide; guide = false;
    const gold = !g && shots++ > 0 && rng() < 0.16; // never the very first shot of a fight
    const speed = cfg().speed * (1 + 0.5 * prog()) * (g ? 0.5 : 1) * (gold ? 0.8 : 1);
    P.push({ x: sx, y: sy, sx, sy, c1x, c1y: Math.min(c1y, floorY), c2x, c2y: Math.min(c2y, floorY), tx, ty, t: 0, state: "fly", guide: g, gold,
      dur: (len * 1.5) / speed, wob: rng() * 6.28, wa: 1 + rng() * 3 + prog() * 2, wf: 3 + rng() * 4,
      sneak: !gold && rng() < 0.35 + prog() * 0.3, trail: 0 }); // sneak: starts slow, speeds up
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
          const k = p.sneak ? k0 * (0.7 + 0.3 * k0) : k0; // ends at k=1 either way
          const u = 1 - k; // cubic bezier + a little wobble across the path
          p.x = u * u * u * p.sx + 3 * u * u * k * p.c1x + 3 * u * k * k * p.c2x + k * k * k * p.tx + Math.sin(p.t * p.wf + p.wob) * p.wa;
          p.y = u * u * u * p.sy + 3 * u * u * k * p.c1y + 3 * u * k * k * p.c2y + k * k * k * p.ty + Math.cos(p.t * p.wf * 0.8 + p.wob) * p.wa * 0.6;
          p.trail += dt;
          if (p.trail > 0.06) { p.trail = 0; fx.burst(p.x, p.y, { n: 1, colors: p.gold ? GOLD : colors, speed: 6, gravity: -10, life: 0.35 }); }
          if (k >= 1) {
            P.splice(i, 1);
            if (p.gold) { fx.burst(p.x, p.y, { n: 8, colors: GOLD, speed: 40 }); continue; } // a missed prize just fizzles
            fx.burst(p.x, p.y, { n: 12, colors: [...colors, "#ffffff"], speed: 60 });
            stage.shake(2, 160);
            streak = 0;
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
        if (p.gold) { drawGold(ctx, x, y, t, pulse); continue; }
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
  // golden prize shot: a shiny star with a tap ring, no angry face
  function drawGold(ctx, x, y, t, pulse) {
    ctx.fillStyle = pulse ? "#ffffff" : GOLD[0];
    for (let a = 0; a < 16; a += 2) { const an = a / 16 * Math.PI * 2 - t * 2; ctx.fillRect(Math.round(x + Math.cos(an) * 12), Math.round(y + Math.sin(an) * 12), 2, 2); }
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(x - 2, y - 8, 5, 17); ctx.fillRect(x - 8, y - 2, 17, 5); ctx.fillRect(x - 5, y - 5, 11, 11);
    ctx.fillStyle = GOLD[0]; ctx.fillRect(x - 1, y - 7, 3, 15); ctx.fillRect(x - 7, y - 1, 15, 3); ctx.fillRect(x - 4, y - 4, 9, 9);
    ctx.fillStyle = GOLD[1]; ctx.fillRect(x - 2, y - 2, 5, 5);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 2, y - 3, 2, 2);
  }
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
