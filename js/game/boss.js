// BOSS — intro card + slow projectiles the player taps to deflect.
// A missed projectile costs a shield (talent nine_lives) or breaks the combo. NEVER a life.
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
export function createBossFight({ stage, fx, rng = Math.random, sfx = {}, from, to, colors = ["#ff6b2c", "#ffcf3f"], onMiss, onDeflect }) {
  const P = [];
  let spawnIn = 2.6, phase = 1, alive = true;
  const cfg = () => (phase === 1 ? { speed: 20, every: 5.2, max: 1 } : { speed: 28, every: 3.4, max: 2 });
  const R = 11; // generous tap radius (logical px) — kids' fingers

  const off = stage.input.on("down", (e) => {
    if (!alive || fight.paused) return false;
    let best = null, bd = 1e9;
    for (const p of P) {
      if (p.state !== "fly") continue;
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < R + 4 && d < bd) { bd = d; best = p; }
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
    P.push({ x: s.x - 8, y: s.y - 14, sx: s.x - 8, sy: s.y - 14, tx: d.x, ty: d.y - 8, t: 0, state: "fly",
      dur: Math.hypot(d.x - s.x, d.y - s.y) / cfg().speed, wob: rng() * 6.28, trail: 0 });
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
          const k = Math.min(1, p.t / p.dur);
          const arc = Math.sin(k * Math.PI) * -22; // gentle lob
          p.x = p.sx + (p.tx - p.sx) * k + Math.sin(p.t * 5 + p.wob) * 2;
          p.y = p.sy + (p.ty - p.sy) * k + arc;
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
        // tap ring hint (so kids know to tap) — blinks
        if (!back && pulse) { ctx.fillStyle = "rgba(255,255,255,0.55)"; for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2 + t * 2; ctx.fillRect(Math.round(x + Math.cos(an) * 9), Math.round(y + Math.sin(an) * 9), 1, 1); } }
        ctx.fillStyle = "#0e0b16"; ctx.fillRect(x - 4, y - 3, 9, 7); ctx.fillRect(x - 3, y - 4, 7, 9);
        ctx.fillStyle = back ? "#ffffff" : colors[0]; ctx.fillRect(x - 3, y - 2, 7, 5); ctx.fillRect(x - 2, y - 3, 5, 7);
        ctx.fillStyle = back ? "#bfe8ff" : colors[1]; ctx.fillRect(x - 2, y - 2, 4, 4);
        ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 1, y - 2, 1, 1);
        if (pulse) { ctx.fillStyle = colors[1]; ctx.fillRect(x - 5, y, 1, 1); ctx.fillRect(x + 5, y - 1, 1, 1); ctx.fillRect(x, y - 5, 1, 1); }
      }
    },
    destroy() { alive = false; off(); P.length = 0; },
  };
  return fight;
}
