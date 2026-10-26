// ZAPIS GRY — wersjonowany, z migracjami.
// ZASADY BEZPIECZNYCH ZMIAN (żeby update nigdy nie skasował postępów):
// 1. Nigdy nie zmieniaj znaczenia istniejącego pola — dodaj nowe.
// 2. Każda zmiana kształtu zapisu = nowa funkcja w MIGRATIONS i SAVE_VERSION + 1.
// 3. Id przedmiotów/słówek/umiejętności są wieczne. Nieznane id są po cichu ignorowane, nie usuwane.
// 4. Wartości wyliczalne (level, karty albumu, statystyki) liczymy z danych, nie zapisujemy na sztywno.
// 5. Surowy dziennik odpowiedzi (log) pozwala przeliczyć wszystko od nowa po zmianie zasad.
import { today } from "./util.js";
import * as cloud from "./cloud.js";

export const SAVE_VERSION = 1;
const LS_KEY = (id) => `ninelives:save:${id}`;
const LOG_MAX = 1500;

export function freshSave(id, profile) {
  return {
    v: SAVE_VERSION, rev: 0, id, createdAt: Date.now(), updatedAt: Date.now(),
    catName: "", xp: 0, coins: 50, spentTalent: 0,
    talents: {},
    owned: { skins: ["ginger"], hats: ["none"] },
    equipped: { skin: "ginger", hat: "none" },
    tower: { checkpoint: 0, best: 0, bossesBeaten: 0 },
    daily: { date: today(), runs: 0 },
    streak: { count: 0, last: null, freezes: 0, best: 0 },
    srs: {},          // itemKey -> { b: pudełko 0-5, due: ms, n: próby, ok: dobre, last: ms }
    skills: {},       // skillId -> { m: opanowanie 0-1, n: próby }
    confusions: {},   // tag błędu -> licznik (z wygaszaniem)
    shadows: [],      // itemKey zapomnianych/pomylonych słów (Jaskinia Cieni)
    story: 0,         // ile stron Dziennika Księżyca odblokowanych
    chests: [],       // nieotwarte skrzynki: ["wood", "gold"...]
    weekly: { week: null, dmg: 0, claimed: [] },
    weeklySkins: 0,   // ile skórek z kolejki "weekly" już dostał
    settings: { voice: !!(profile && profile.voice), sfx: true, music: true, pl: true },
    log: [],          // [t, itemKey, ok(1/0), ms, chosenTag]
    stats: { runs: 0, answers: 0, correct: 0, playMs: 0, shadowRuns: 0 },
  };
}

const MIGRATIONS = {
  // przykład na przyszłość:
  // 2: (s) => { s.newField = s.newField ?? defaultValue; return s; },
};

export function migrate(s, profile) {
  if (!s || typeof s !== "object") return null;
  const base = freshSave(s.id, profile);
  // uzupełnij brakujące pola (bez nadpisywania istniejących)
  for (const k of Object.keys(base)) if (s[k] === undefined) s[k] = base[k];
  for (const k of ["owned", "equipped", "tower", "daily", "streak", "weekly", "settings", "stats"])
    for (const kk of Object.keys(base[k])) if (s[k][kk] === undefined) s[k][kk] = base[k][kk];
  let v = s.v || 1;
  while (v < SAVE_VERSION) { v++; if (MIGRATIONS[v]) s = MIGRATIONS[v](s); s.v = v; }
  if (s.log.length > LOG_MAX) s.log = s.log.slice(-LOG_MAX);
  return s;
}

let current = null;
let saveTimer = null;
export const getSave = () => current;

export async function loadSave(id, profile) {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(LS_KEY(id)) || "null"); } catch {}
  let remote = null;
  if (cloud.enabled()) { try { remote = await cloud.loadSave(id); } catch (e) { console.warn("cloud load", e); } }
  let s = [local, remote].filter(Boolean).sort((a, b) => (b.rev || 0) - (a.rev || 0))[0];
  s = s ? migrate(s, profile) : freshSave(id, profile);
  current = s;
  return s;
}

export function persist(immediate = false) {
  if (!current) return;
  current.rev = (current.rev || 0) + 1;
  current.updatedAt = Date.now();
  try { localStorage.setItem(LS_KEY(current.id), JSON.stringify(current)); } catch {}
  if (!cloud.enabled()) return;
  clearTimeout(saveTimer);
  const push = () => cloud.saveSave(current.id, current).catch((e) => console.warn("cloud save", e));
  if (immediate) push(); else saveTimer = setTimeout(push, 1500);
}

export function exportCode() { return btoa(unescape(encodeURIComponent(JSON.stringify(current)))); }
export function importCode(code) {
  const s = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
  if (!s.id) throw new Error("zły kod");
  current = migrate(s); persist(true); return current;
}

// ---- level z XP (wyliczany, nie zapisywany) ----
import { ECON } from "../data/progression.js";
export function levelInfo(xp) {
  let lvl = 1, rest = xp;
  while (rest >= ECON.levelXp(lvl)) { rest -= ECON.levelXp(lvl); lvl++; }
  return { lvl, into: rest, need: ECON.levelXp(lvl) };
}
export const talentPoints = (s) => levelInfo(s.xp).lvl - 1 - Object.values(s.talents).reduce((a, b) => a + b, 0);
