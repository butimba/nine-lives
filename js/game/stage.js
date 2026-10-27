// STAGE — one crisp pixel canvas + a DOM overlay exactly on top of it.
// Logical width is fixed (240). Height flexes between minH..maxH with the screen aspect.
// Integer scale in *device* pixels => every logical pixel is an exact block of device pixels.
// One rAF loop, fixed 60 Hz update, hit-stop, screen shake, pause when the tab is hidden.

const STEP = 1 / 60;

export function createStage(hostEl, { lw = 240, minH = 320, maxH = 432, maxBacking = 1600 } = {}) {
  const wrap = document.createElement("div");
  wrap.className = "stage-wrap";
  wrap.style.cssText = "position:absolute;inset:0;overflow:hidden;";
  const canvas = document.createElement("canvas");
  canvas.className = "stage-canvas";
  canvas.style.cssText = "position:absolute;image-rendering:pixelated;image-rendering:crisp-edges;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;";
  const overlay = document.createElement("div");
  overlay.className = "stage-overlay";
  overlay.style.cssText = "position:absolute;pointer-events:none;";
  wrap.append(canvas, overlay);
  if (getComputedStyle(hostEl).position === "static") hostEl.style.position = "relative";
  hostEl.append(wrap);
  const ctx = canvas.getContext("2d", { alpha: false });

  const st = {
    canvas, ctx, overlay, wrap, w: lw, h: minH, scale: 1, cssScale: 1,
    time: 0, frame: 0, paused: false,
  };
  let manualPause = false, hiddenPause = document.hidden;
  Object.defineProperty(st, "paused", { get: () => manualPause || hiddenPause, set: (v) => { manualPause = !!v; last = 0; } });

  // ---------- sizing ----------
  const resizeFns = [];
  let lastHostW = 0, lastHostH = 0;
  function layout(force = false) {
    const r = hostEl.getBoundingClientRect();
    const hw = Math.max(1, r.width), hh = Math.max(1, r.height);
    if (!force && hw === lastHostW && hh === lastHostH) return;
    // mobile keyboard: the viewport shrinks while an input in our overlay is focused -> keep layout
    const ae = document.activeElement;
    const typing = ae && overlay.contains(ae) && /^(INPUT|TEXTAREA)$/.test(ae.tagName);
    if (!force && typing && hw === lastHostW && hh < lastHostH) return;
    lastHostW = hw; lastHostH = hh;
    const dpr = Math.max(1, Math.min(4, window.devicePixelRatio || 1));
    let S = Math.floor(Math.min((hw * dpr) / lw, (hh * dpr) / minH));
    S = Math.max(1, Math.min(S, Math.floor(maxBacking / lw) || 1));
    const h = Math.max(minH, Math.min(maxH, Math.floor((hh * dpr) / S)));
    const changed = h !== st.h || S !== st.scale;
    st.h = h; st.scale = S;
    canvas.width = lw * S; canvas.height = h * S;
    const cw = (lw * S) / dpr, ch = (h * S) / dpr;
    st.cssScale = S / dpr;
    const left = Math.round((hw - cw) / 2), top = Math.round(Math.max(0, (hh - ch) / 2));
    for (const el of [canvas, overlay]) {
      el.style.width = cw + "px"; el.style.height = ch + "px";
      el.style.left = left + "px"; el.style.top = top + "px";
    }
    overlay.style.setProperty("--u", st.cssScale + "px"); // 1 logical px in CSS px
    overlay.style.setProperty("--lw", lw); overlay.style.setProperty("--lh", h);
    ctx.imageSmoothingEnabled = false;
    if (changed) for (const fn of resizeFns) try { fn(st); } catch (e) { console.error(e); }
  }
  st.onResize = (fn) => { resizeFns.push(fn); return () => resizeFns.splice(resizeFns.indexOf(fn) >>> 0, 1); };
  let roTimer = 0;
  const ro = new ResizeObserver(() => { clearTimeout(roTimer); roTimer = setTimeout(() => layout(), 60); });
  ro.observe(hostEl);
  layout(true);

  st.toClient = (x, y) => {
    const r = canvas.getBoundingClientRect();
    return { x: r.left + (x / lw) * r.width, y: r.top + (y / st.h) * r.height };
  };
  st.toLogical = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    return { x: ((cx - r.left) / r.width) * lw, y: ((cy - r.top) / r.height) * st.h };
  };

  // ---------- input ----------
  // handlers: on(evt, fn, {priority}) — higher priority first; returning true consumes the event.
  const handlers = { down: [], move: [], up: [], key: [] };
  const pointer = { x: -99, y: -99, down: false, id: null };
  function emit(type, e) {
    for (const hd of handlers[type].slice()) {
      let stop = false;
      e.stop = () => (stop = true);
      try { if (hd.fn(e) === true) stop = true; } catch (err) { console.error(err); }
      if (stop) return true;
    }
    return false;
  }
  const input = {
    pointer,
    on(evt, fn, { priority = 0 } = {}) {
      const list = handlers[evt]; if (!list) throw new Error("bad input event " + evt);
      const hd = { fn, priority };
      list.push(hd); list.sort((a, b) => b.priority - a.priority);
      return () => { const i = list.indexOf(hd); if (i >= 0) list.splice(i, 1); };
    },
  };
  st.input = input;
  const onDown = (ev) => {
    if (pointer.id !== null && ev.pointerId !== pointer.id && ev.pointerType !== "mouse") return;
    pointer.id = ev.pointerId;
    const p = st.toLogical(ev.clientX, ev.clientY);
    Object.assign(pointer, p, { down: true });
    try { canvas.setPointerCapture(ev.pointerId); } catch {}
    ev.preventDefault();
    // tapping the canvas closes the mobile keyboard nicely
    const ae = document.activeElement; if (ae && overlay.contains(ae) && ae.blur && !ae.closest(".keep-focus")) {}
    emit("down", { x: p.x, y: p.y, type: ev.pointerType });
  };
  const onMove = (ev) => {
    if (pointer.id !== null && ev.pointerId !== pointer.id) return;
    const p = st.toLogical(ev.clientX, ev.clientY);
    pointer.x = p.x; pointer.y = p.y;
    emit("move", { x: p.x, y: p.y, down: pointer.down, type: ev.pointerType });
  };
  const onUp = (ev) => {
    if (pointer.id !== null && ev.pointerId !== pointer.id) return;
    const p = st.toLogical(ev.clientX, ev.clientY);
    pointer.x = p.x; pointer.y = p.y; pointer.down = false; pointer.id = null;
    emit("up", { x: p.x, y: p.y, type: ev.pointerType });
  };
  const onKey = (ev) => {
    const ae = document.activeElement;
    if (ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)) return; // typing goes to the input
    if (st.paused) return;
    if (emit("key", { key: ev.key, x: pointer.x, y: pointer.y })) ev.preventDefault();
  };
  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  window.addEventListener("keydown", onKey);

  // ---------- juice: hitstop + shake ----------
  let stopLeft = 0, shakeAmp = 0, shakeLeft = 0, shakeDur = 1;
  st.hitstop = (ms) => { stopLeft = Math.max(stopLeft, ms / 1000); };
  st.shake = (px, ms = 200) => { if (px >= shakeAmp * (shakeLeft / shakeDur)) { shakeAmp = px; shakeLeft = shakeDur = ms / 1000; } };
  Object.defineProperty(st, "frozen", { get: () => stopLeft > 0 });

  // sim-time timers (respect pause + hitstop) — handy for sequencing
  const timers = [];
  st.sleep = (ms) => new Promise((res) => timers.push({ at: st.time + ms / 1000, res }));

  // ---------- scene + loop ----------
  let scene = null;
  st.setScene = (s) => { if (scene && scene !== s && scene.destroy) try { scene.destroy(); } catch (e) { console.error(e); } scene = s; };
  let raf = 0, last = 0, acc = 0, alive = true;
  function tick(now) {
    if (!alive) return;
    raf = requestAnimationFrame(tick);
    if (st.paused) { last = 0; return; }
    if (!last) last = now;
    let dt = (now - last) / 1000; last = now;
    if (dt > 0.25) dt = 0.25;
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 5) {
      acc -= STEP; steps++;
      if (shakeLeft > 0) shakeLeft = Math.max(0, shakeLeft - STEP);
      if (stopLeft > 0) { stopLeft -= STEP; continue; }
      st.time += STEP; st.frame++;
      for (let i = timers.length - 1; i >= 0; i--) if (timers[i].at <= st.time) { const t = timers.splice(i, 1)[0]; t.res(); }
      if (scene && scene.update) try { scene.update(STEP, st.time); } catch (e) { console.error(e); }
    }
    if (steps >= 5) acc = 0;
    draw();
  }
  function draw() {
    const S = st.scale;
    let sx = 0, sy = 0;
    if (shakeLeft > 0) {
      const a = shakeAmp * (shakeLeft / shakeDur);
      sx = Math.round((Math.random() * 2 - 1) * a * S) / S;
      sy = Math.round((Math.random() * 2 - 1) * a * S) / S;
    }
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "#0e0b16"; ctx.fillRect(0, 0, lw, st.h);
    ctx.setTransform(S, 0, 0, S, sx * S, sy * S);
    if (scene && scene.draw) try { scene.draw(ctx, st.time); } catch (e) { console.error(e); }
  }
  raf = requestAnimationFrame(tick);
  st.redraw = draw;

  const onVis = () => { hiddenPause = document.hidden; last = 0; };
  document.addEventListener("visibilitychange", onVis);

  st.destroy = () => {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    if (scene && scene.destroy) try { scene.destroy(); } catch {}
    scene = null;
    ro.disconnect(); clearTimeout(roTimer);
    window.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onVis);
    for (const t of timers) t.res(); timers.length = 0;
    wrap.remove();
  };
  Object.defineProperty(st, "alive", { get: () => alive });
  return st;
}
