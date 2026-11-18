// CHMURA (Supabase, darmowy plan). Działa tylko, gdy w config.js są url i klucz.
// Bez tego gra zapisuje wszystko lokalnie w przeglądarce i nadal działa.
import CONFIG from "../config.js";

export const enabled = () => !!(CONFIG.supabaseUrl && CONFIG.supabaseKey);
const H = () => ({ apikey: CONFIG.supabaseKey, Authorization: `Bearer ${CONFIG.supabaseKey}`, "Content-Type": "application/json" });
const U = (p) => `${CONFIG.supabaseUrl.replace(/\/$/, "")}/rest/v1/${p}`;

// limit czasu: wolny internet / uśpiona baza nie może zawiesić logowania (wtedy gra bierze zapis z telefonu)
// lustro ucznia (state.loadSave) tylko czyta: żadnego zapisu, bossa tygodnia ani skórek
let readOnly = false;
export const setReadOnly = (v) => { readOnly = !!v; };
async function req(path, opts = {}) {
  if (readOnly && opts.method && opts.method !== "GET" && !opts.ro) throw new Error("read-only (mirror)");
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const tm = ctl && setTimeout(() => ctl.abort(), 8000);
  let r;
  try { r = await fetch(U(path), { ...opts, signal: ctl && ctl.signal, headers: { ...H(), ...(opts.headers || {}) } }); }
  finally { clearTimeout(tm); }
  if (!r.ok) throw new Error(`${r.status} ${await r.text()}`);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// zapisy tylko przez funkcje w bazie (tools/supabase-v4-czesc1.sql): bez listy wszystkich, jeden zapis po id
const rpc = (fn, args) => req(`rpc/${fn}`, { method: "POST", body: JSON.stringify(args) });
export async function loadSave(id) {
  return (await req(`rpc/nl_load`, { method: "POST", ro: true, body: JSON.stringify({ p_id: id }) })) || null;
}
// publiczny status duetu (bez imion — tylko dni, liczby i id zapisu przyjaciółki); czyta go partner przez loadPublic
export function duoPub(data) {
  const d = data && data.duo;
  if (!d) return null;
  const sent = Array.isArray(d.sent) ? d.sent.filter((x) => typeof x === "string").slice(-7) : [];
  return { day: d.nDay || null, duoN: Math.max(0, d.n | 0), giftTo: d.partner || null, giftDay: d.sentDay || null, gifts: sent };
}
export async function saveSave(id, data) {
  const pub = { name: data.catName, skin: data.equipped.skin, hat: data.equipped.hat, best: data.tower.best, lvl: data._lvl || 1, last: data.updatedAt };
  const duo = duoPub(data);
  if (duo) pub.duo = duo;
  await rpc("nl_save", { p_id: id, p_data: data, p_pub: pub });
}
// publiczne info o innym graczu (do duetów): imię kota, skórka, najwyższe piętro
export async function loadPublic(id) {
  return (await req(`rpc/nl_pub`, { method: "POST", ro: true, body: JSON.stringify({ p_id: id }) })) || null;
}
// panel nauczyciela: hasło sprawdza baza (nl_teacher_ok); w kodzie strony go nie ma
export async function listAll(pass) {
  return await req(`rpc/nl_teacher_saves`, { method: "POST", ro: true, body: JSON.stringify({ p_pass: pass }) });
}
// boss tygodnia — suma obrażeń wszystkich graczy
export async function weeklyAdd(week, id, dmg) {
  await req("weekly", { method: "POST", headers: { Prefer: "resolution=merge-duplicates" }, body: JSON.stringify({ week, id, dmg }) });
}
export async function weeklyStatus(week) {
  const rows = await req(`weekly?week=eq.${encodeURIComponent(week)}&select=id,dmg`);
  return { total: rows.reduce((a, r) => a + (r.dmg || 0), 0), players: rows.length, rows };
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
export async function listSkins(pass) {
  try { return await req(`rpc/nl_teacher_skins`, { method: "POST", ro: true, body: JSON.stringify({ p_pass: pass }) }); }
  catch (e) { throw skinErr(e); }
}
export async function setSkinStatus(pass, id, status) {
  try { await rpc("nl_teacher_skin_status", { p_pass: pass, p_id: id, p_status: status }); }
  catch (e) { throw skinErr(e); }
}
