// CHMURA (Supabase, darmowy plan). Działa tylko, gdy w config.js są url i klucz.
// Bez tego gra zapisuje wszystko lokalnie w przeglądarce i nadal działa.
import CONFIG from "../config.js";

export const enabled = () => !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);
const H = () => ({ apikey: CONFIG.supabaseKey, Authorization: `Bearer ${CONFIG.supabaseKey}`, "Content-Type": "application/json" });
const U = (p) => `${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/${p}`;

async function req(path, opts = {}) {
  const r = await fetch(U(path), { ...opts, headers: { ...H(), ...(opts.headers || {}) } });
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

export async function loadSave(id) {
  const rows = await req(`saves?id=eq.${encodeURIComponent(id)}&select=data`);
  return rows && rows[0] ? rows[0].data : null;
}
export async function saveSave(id, data) {
  const pub = { name: data.catName, skin: data.equipped.skin, hat: data.equipped.hat, best: data.tower.best, lvl: data._lvl || 1, last: data.updatedAt };
  await req("saves", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ id, data, pub, updated_at: new Date().toISOString() }) });
}
// publiczne info o innym graczu (do duetów): imię kota, skórka, najwyższe piętro
export async function loadPublic(id) {
  const rows = await req(`saves?id=eq.${encodeURIComponent(id)}&select=pub,updated_at`);
  return rows && rows[0] ? { ...rows[0].pub, updated_at: rows[0].updated_at } : null;
}
export async function listAll() {
  return await req(`saves?select=id,data,updated_at&order=updated_at.desc`);
}
// boss tygodnia — suma obrażeń wszystkich graczy
export async function weeklyAdd(week, id, dmg) {
  await req("weekly", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ week, id, dmg }) });
}
export async function weeklyStatus(week) {
  const rows = await req(`weekly?week=eq.${encodeURIComponent(week)}&select=id,dmg`);
  return { total: rows.reduce((a, r) => a + (r.dmg || 0), 0), players: rows.length };
}

// ---------- skórki dzieci (tabela `skins`, tools/supabase-v3.sql) ----------
// Brak tabeli → błąd z .noTable = true (gra pokazuje „Sending is not ready yet” i trzyma rysunek lokalnie).
function skinErr(e) {
  const m = String(e && e.message || e);
  if (/^404|PGRST205|PGRST202|42P01|does not exist|schema cache/i.test(m)) { const x = new Error("skins table missing"); x.noTable = true; return x; }
  return e;
}
export async function submitSkin({ id, author_id, name, pixels }) {
  if (!enabled()) { const x = new Error("offline"); x.noTable = true; throw x; }
  try {
    await req("skins", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify({ id, author_id, name: String(name || "").slice(0, 24), pixels, status: "pending" }) });
  } catch (e) { throw skinErr(e); }
}
// zatwierdzone (dla wszystkich graczy)
export async function loadSkins() {
  if (!enabled()) return [];
  try { return await req(`skins?status=eq.approved&select=id,name,pixels,created_at&order=created_at.asc`); }
  catch (e) { throw skinErr(e); }
}
export async function skinStatus(id) {
  try { const rows = await req(`skins?id=eq.${encodeURIComponent(id)}&select=status`); return rows && rows[0] ? rows[0].status : null; }
  catch (e) { throw skinErr(e); }
}
// panel nauczyciela
export async function listSkins() {
  try { return await req(`skins?select=id,author_id,name,pixels,status,created_at&order=created_at.desc`); }
  catch (e) { throw skinErr(e); }
}
export async function setSkinStatus(id, status) {
  try { await req(`skins?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
  catch (e) { throw skinErr(e); }
}
