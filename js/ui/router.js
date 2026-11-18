// Prosty router ekranów. Każdy ekran: register(name, { mount(root, params) -> unmount? }).
// go(name, params) odmontowuje poprzedni ekran i montuje nowy w #app.
const screens = new Map();
let cur = null, curUnmount = null, root = null, seq = 0;
const listeners = new Set();

export function register(name, def) { screens.set(name, def); }
export const current = () => cur;
export function onRoute(fn) { listeners.add(fn); return () => listeners.delete(fn); }

export async function go(name, params = {}) {
  root = root || document.getElementById("app");
  const def = screens.get(name);
  if (!def) { console.warn("router: unknown screen", name); return; }
  const my = ++seq;
  if (curUnmount) { try { curUnmount(); } catch (e) { console.warn("unmount", e); } }
  curUnmount = null;
  root.innerHTML = "";
  root.dataset.screen = name;
  document.body.dataset.screen = name;
  cur = name;
  window.scrollTo(0, 0);
  for (const fn of listeners) { try { fn(name, params); } catch {} }
  try {
    const un = await def.mount(root, params);
    if (my !== seq) { if (typeof un === "function") un(); return; } // w międzyczasie inny go()
    curUnmount = typeof un === "function" ? un : null;
  } catch (e) {
    console.error("mount " + name, e);
    if (my === seq && name !== "home" && screens.has("home")) setTimeout(() => go("home"), 0);
  }
}
