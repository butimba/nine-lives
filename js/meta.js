// Meta-gra: skrzynki, sklep, talenty, seria dni, boss tygodnia, duety.
import { SKINS, HATS } from "../data/cosmetics.js";
import { CHESTS, ECON, TALENTS, DUP_COINS } from "../data/progression.js";
import EVENTS, { activeEvent, eventAllows } from "../data/events.js";
import { today, dayDiff, isoWeek } from "./util.js";
import * as cloud from "./cloud.js";

export const tr = (save, id) => save.talents[id] || 0;

export function shopItems(save, date = new Date()) {
  const ev = activeEvent(date, EVENTS);
  const ok = (it) => !it.retired && !it.community && it.price && (it.source === "shop" || eventAllows(ev, it.source));
  return {
    skins: SKINS.filter(ok).map((s) => ({ ...s, kind: "skin", owned: save.owned.skins.includes(s.id) })),
    hats: HATS.filter(ok).map((s) => ({ ...s, kind: "hat", owned: save.owned.hats.includes(s.id) })),
    event: ev,
  };
}
export function buy(save, item) {
  if (item.owned || save.coins < item.price) return false;
  save.coins -= item.price;
  (item.kind === "skin" ? save.owned.skins : save.owned.hats).push(item.id);
  return true;
}

// ---- prezenty od nauczyciela (roster: profile.gifts = ["skin:shrimp", "hat:crown", "chest:gold", "fish:200"]) ----
export const isGift = (type) => typeof type === "string" && type.startsWith("gift:");
export function giftItem(type) {
  const [, kind, id] = String(type).split(":");
  if (kind === "skin") { const it = SKINS.find((s) => s.id === id); return it ? { kind, item: it } : null; }
  if (kind === "hat") { const it = HATS.find((s) => s.id === id); return it ? { kind, item: it } : null; }
  if (kind === "chest") return { kind, chest: CHESTS[id] ? id : "gold" };
  if (kind === "fish") return { kind, amount: Math.max(1, Math.min(5000, +id || 100)) };
  return null;
}
// przy logowaniu: każdy nieodebrany prezent → skrzynia "gift:<kind>:<id>" na początek kolejki
export function claimGifts(save, profile) {
  save.gifts ??= { claimed: [] };
  save.gifts.claimed ??= [];
  const out = [];
  for (const g of (profile && profile.gifts) || []) {
    if (typeof g !== "string" || save.gifts.claimed.includes(g)) continue;
    save.gifts.claimed.push(g);
    save.chests.unshift("gift:" + g);
    out.push(g);
  }
  return out;
}
function openGift(save, type) {
  const g = giftItem(type);
  if (g && (g.kind === "skin" || g.kind === "hat")) {
    const list = g.kind === "skin" ? save.owned.skins : save.owned.hats;
    const it = { ...g.item, kind: g.kind };
    if (list.includes(it.id)) { const bonus = DUP_COINS[it.rarity] || 150; save.coins += bonus; return { kind: "coins", amount: bonus, gift: true, had: it }; }
    list.push(it.id);
    return { kind: g.kind, item: it, gift: true };
  }
  if (g && g.kind === "chest") { save.chests.unshift(g.chest); return { kind: "chest", chest: g.chest, gift: true }; }
  const amt = g && g.kind === "fish" ? g.amount : 150;
  save.coins += amt;
  return { kind: "coins", amount: amt, gift: true };
}

// ---- skrzynki ----
// przedmioty wydarzenia, które mogą wypaść ze skrzyni TERAZ (chest: true albo bez ceny = tylko ze skrzyni)
export function eventChestItems(date = new Date()) {
  const ev = activeEvent(date, EVENTS);
  if (!ev) return [];
  const ok = (it) => !it.retired && eventAllows(ev, it.source) && (it.chest || !it.price);
  return [...SKINS.filter(ok).map((s) => ({ ...s, kind: "skin" })), ...HATS.filter(ok).map((s) => ({ ...s, kind: "hat" }))];
}
export function openChest(save, type, date = new Date()) {
  if (isGift(type)) return openGift(save, type);
  const c = CHESTS[type] || CHESTS.wood;
  const luck = tr(save, "treasure") * 8;
  const w = { ...c.rolls };
  if (luck) { w.coins = Math.max(5, w.coins - luck); w.rare += luck * 0.5; w.epic += luck * 0.35; w.legendary += luck * 0.15; }
  let roll = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  let cat = "coins";
  for (const [k, v] of Object.entries(w)) { roll -= v; if (roll <= 0) { cat = k; break; } }
  const coinAmt = c.coins || [40, 90];
  if (cat !== "coins") {
    const pool = [
      ...SKINS.filter((s) => !s.retired && s.rarity === cat && (s.source === "chest" || s.source === "shop") && !save.owned.skins.includes(s.id)).map((s) => ({ ...s, kind: "skin" })),
      ...HATS.filter((s) => !s.retired && s.rarity === cat && (s.source === "chest" || s.source === "shop") && !save.owned.hats.includes(s.id)).map((s) => ({ ...s, kind: "hat" })),
    ];
    // w czasie wydarzenia: przedmioty wydarzenia mają podwójną wagę (żeby skrzynie pachniały świętami)
    const evPool = eventChestItems(date).filter((it) => it.rarity === cat && !(it.kind === "skin" ? save.owned.skins : save.owned.hats).includes(it.id));
    if (evPool.length) pool.push(...evPool, ...evPool);
    if (pool.length) {
      const it = pool[Math.floor(Math.random() * pool.length)];
      (it.kind === "skin" ? save.owned.skins : save.owned.hats).push(it.id);
      return { kind: it.kind, item: it };
    }
    // wszystko już ma → monety za duplikat
    const bonus = DUP_COINS[cat] || 60;
    save.coins += bonus;
    return { kind: "coins", amount: bonus, dup: cat };
  }
  const amt = Math.round(coinAmt[0] + Math.random() * (coinAmt[1] - coinAmt[0]));
  save.coins += amt;
  return { kind: "coins", amount: amt };
}
// skrzynia za bossa na piętrze `floor` (wielokrotność 5): 'wood'|'silver'|'gold'|'epic'
export function chestForFloor(floor, save) {
  const r = Math.random();
  if (floor % 50 === 0) return "epic";
  if (floor % 25 === 0) return "gold";
  if (floor >= 40 && r < 0.06) return "epic";
  if (floor >= 30 && r < 0.25) return "gold";
  if (floor >= 10 && r < 0.5) return "silver";
  return r < 0.2 ? "silver" : "wood";
}

// ---- talenty ----
export function canRaise(save, t, points) {
  if (points <= 0) return false;
  if (tr(save, t.id) >= t.max) return false;
  if (t.req && tr(save, t.req) < 1) return false;
  return true;
}

// ---- seria dni (z "zamrożeniem" na 1 dzień, jak w Duolingo) ----
export function touchStreak(save) {
  const d = today();
  const s = save.streak;
  const events = [];
  if (s.last === d) return events;
  if (!s.last) s.count = 1;
  else {
    const gap = dayDiff(s.last, d);
    if (gap === 1) s.count++;
    else if (gap > 1 && s.freezes >= gap - 1) { s.freezes -= gap - 1; s.count++; events.push({ type: "freezeUsed", n: gap - 1 }); }
    else { if (s.count > 1) events.push({ type: "streakLost", was: s.count }); s.count = 1; }
  }
  s.last = d;
  s.best = Math.max(s.best || 0, s.count);
  if (s.count === 3 && !s.freeGiven) { s.freeGiven = true; s.freezes = Math.min(ECON.freezeMax, s.freezes + 1); events.push({ type: "freeFreeze" }); }
  if (s.count % 7 === 0) { save.chests.push("silver"); events.push({ type: "streakChest", n: s.count }); }
  return events;
}
export function streakAlive(save) {
  const s = save.streak;
  if (!s.last) return { alive: false, count: 0 };
  const gap = dayDiff(s.last, today());
  return { alive: gap <= 1 || s.freezes >= gap - 1, count: s.count, playedToday: gap === 0, gap };
}

// ---- boss tygodnia ----
export function weeklyBossInfo(week = isoWeek()) {
  // wygląd bossa tygodnia losowany z numeru tygodnia — zawsze ten sam dla wszystkich
  return { week, seed: "weekly-" + week };
}
export function ensureWeek(save) {
  const w = isoWeek();
  if (save.weekly.week !== w) { save.weekly.week = w; save.weekly.dmg = 0; }
  return w;
}
export async function weeklyStatus(save) {
  const w = ensureWeek(save);
  if (cloud.enabled()) {
    try {
      const st = await cloud.weeklyStatus(w);
      const players = Math.max(1, st.players);
      return { week: w, total: Math.max(st.total, save.weekly.dmg), hp: ECON.weeklyHpPerPlayer * players, cloud: true };
    } catch (e) { console.warn(e); }
  }
  return { week: w, total: save.weekly.dmg, hp: ECON.weeklyHpPerPlayer, cloud: false };
}
export function weeklyReward(save) {
  const queue = SKINS.filter((s) => s.source === "weekly" && !s.retired).sort((a, b) => a.order - b.order);
  const next = queue.find((s) => !save.owned.skins.includes(s.id));
  save.coins += 100;
  if (next) { save.owned.skins.push(next.id); save.weeklySkins++; return { skin: next, coins: 100 }; }
  save.chests.push("gold");
  return { chest: "gold", coins: 100 };
}

// ---- skórki dzieci: rysunek ucznia + zatwierdzone skórki z chmury ----
import { registerSkin, addCommunitySkins } from "./pixel/custom.js";
const SKIN_CACHE = "ninelives:skins";
export const MY_SKIN = "custom:mine";
export function ensureMySkin(save) {
  save.mySkin ??= { pixels: null, status: "none", at: 0 };
  const m = save.mySkin;
  if (m.pixels) registerSkin(MY_SKIN, m.pixels, { name: m.name || "My Cat" });
  if (save.equipped.skin === MY_SKIN && !m.pixels) save.equipped.skin = "ginger";
  return m;
}
// na starcie: najpierw kopia z localStorage (działa offline), potem chmura. Zwraca { added, status } (status mojej skórki, jeśli się zmienił)
export async function syncCommunity(save) {
  ensureMySkin(save);
  try { addCommunitySkins(JSON.parse(localStorage.getItem(SKIN_CACHE) || "[]")); } catch {}
  const res = { added: 0, status: null };
  if (!cloud.enabled()) return res;
  try {
    const rows = await cloud.loadSkins();
    res.added = addCommunitySkins(rows);
    try { localStorage.setItem(SKIN_CACHE, JSON.stringify(rows)); } catch {}
  } catch (e) { if (!e.noTable) console.warn("skins", e); }
  const m = save.mySkin;
  if (m && m.id && m.status === "pending") {
    try {
      const st = await cloud.skinStatus(m.id);
      if (st && st !== "pending") {
        m.status = st; res.status = st;
        if (st === "approved" && !save.owned.skins.includes("custom:" + m.id)) save.owned.skins.push("custom:" + m.id);
      }
    } catch {}
  }
  return res;
}

// ---- DUET (co-op, bez rankingów): prezent 5 rybek raz dziennie + wspólne wyzwanie dnia + flaga przyjaciółki ----
// Bez nowego SQL: mój status idzie w saves.pub.duo (cloud.saveSave), partner czyta go przez cloud.loadPublic(profile.duo).
// Wszystko offline-safe: brak chmury / brak partnera / błąd sieci → duetUI się chowa (partner = null).
import { freshDuo } from "./state.js";
export const DUO = { gift: 5, goal: 30, goalYoung: 20, fish: 30, chest: "wood" };
export function ensureDuo(save, d = today()) {
  if (!save.duo || typeof save.duo !== "object") save.duo = freshDuo();
  const u = save.duo;
  if (!Array.isArray(u.got)) u.got = [];
  if (!Array.isArray(u.sent)) u.sent = [];
  if (u.nDay !== d) { u.nDay = d; u.n = 0; }
  return u;
}
// moje dobre odpowiedzi dziś (wkład do wspólnego wyzwania) — rewards.applyRunResults
export function duoAddCorrect(save, n, d = today()) {
  const u = ensureDuo(save, d);
  u.n += Math.max(0, Math.floor(+n || 0));
  return u.n;
}
export const canSendGift = (save, d = today()) => ensureDuo(save, d).sentDay !== d;
// wysłanie prezentu nic nie kosztuje i nic nie daje wysyłającemu (bez przewagi w nauce)
export function sendGift(save, profile, d = today()) {
  if (!profile || !profile.duo) return false;
  const u = ensureDuo(save, d);
  if (u.sentDay === d) return false;
  u.partner = profile.duo; u.sentDay = d;
  u.sent = [...u.sent.filter((x) => x !== d), d].slice(-7);
  return true;
}
// prezenty od partnera dla MNIE (pub = cloud.loadPublic(partnerId)). Każdy dzień liczy się raz. -> { n, fish }
export function receiveGifts(save, pub, d = today()) {
  const u = ensureDuo(save, d);
  const g = pub && pub.duo;
  if (!g || !save.id || g.giftTo !== save.id) return { n: 0, fish: 0 };
  const days = (Array.isArray(g.gifts) && g.gifts.length ? g.gifts : g.giftDay ? [g.giftDay] : [])
    .filter((x) => typeof x === "string" && /^\d{4}-\d\d-\d\d$/.test(x) && x <= d && dayDiff(x, d) <= 7);
  const fresh = [...new Set(days)].filter((x) => !u.got.includes(x));
  if (!fresh.length) return { n: 0, fish: 0 };
  u.got = [...u.got, ...fresh].sort().slice(-14);
  u.gotGiftDay = u.got[u.got.length - 1];
  const fish = DUO.gift * fresh.length;
  save.coins += fish;
  return { n: fresh.length, fish };
}
// wspólne wyzwanie dnia: oboje dostają nagrodę, gdy razem osiągną cel I każde dało co najmniej 1
export function duoChallenge(save, profile, pub, { young = false } = {}, d = today()) {
  const u = ensureDuo(save, d);
  const g = pub && pub.duo;
  const them = g && g.day === d ? Math.max(0, g.duoN | 0) : 0;
  const goal = young || (profile && profile.noReading) ? DUO.goalYoung : DUO.goal;
  const me = u.n;
  const done = me >= 1 && them >= 1 && me + them >= goal;
  return { goal, me, them, total: Math.min(goal, me + them), done, claimed: u.duoClaimDay === d, needMe: me < 1, needThem: them < 1,
    text: `Together: ${goal} right answers` };
}
export function claimDuo(save, profile, pub, opts = {}, d = today()) {
  const c = duoChallenge(save, profile, pub, opts, d);
  if (!c.done || c.claimed) return null;
  save.duo.duoClaimDay = d;
  save.coins += DUO.fish;
  save.chests.push(DUO.chest);
  return { fish: DUO.fish, chest: DUO.chest };
}
// partner z chmury (cache 45 s). null = brak duetu / offline / błąd → UI duetu się chowa.
let partnerCache = { id: null, at: 0, pub: null };
export async function loadPartner(profile, { fresh = false } = {}) {
  if (!profile || !profile.duo || !cloud.enabled()) return null;
  if (!fresh && partnerCache.id === profile.duo && Date.now() - partnerCache.at < 45000) return partnerCache.pub;
  try {
    const pub = await cloud.loadPublic(profile.duo);
    partnerCache = { id: profile.duo, at: Date.now(), pub: pub && pub.name ? pub : null };
  } catch (e) { partnerCache = { id: profile.duo, at: Date.now(), pub: null }; }
  return partnerCache.pub;
}
export const forgetPartner = () => { partnerCache = { id: null, at: 0, pub: null }; };
