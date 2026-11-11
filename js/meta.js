// Meta-gra: skrzynki, sklep, talenty, seria dni, boss tygodnia, duety.
import { SKINS, HATS } from "../data/cosmetics.js";
import { CHESTS, ECON, TALENTS, DUP_COINS } from "../data/progression.js";
import EVENTS, { activeEvent, eventAllows } from "../data/events.js";
import { today, dayDiff, isoWeek } from "./util.js";
import * as cloud from "./cloud.js";
import ROSTER from "../data/roster.js";
import { FURNITURE } from "../data/base.js";

export const tr = (save, id) => save.talents[id] || 0;

// SKLEP TYGODNIA: co tydzień (od poniedziałku) jedna wyjątkowa skórka, do kupienia tylko w tym tygodniu.
// Kolejka się zapętla (rzecz wraca po FEATURED.length tygodniach). Nowa skórka do rotacji = source "featured" + id tutaj.
export const FEATURED = ["zapcat", "deepsea", "thunderking", "rockstar", "lovecat", "diamond"];
export const weekIndex = (date = new Date()) => { const [y, w] = isoWeek(date).split("-W").map(Number); return y * 53 + w; };
export function featuredItem(date = new Date()) {
  const id = FEATURED[weekIndex(date) % FEATURED.length];
  return SKINS.find((s) => s.id === id && !s.retired) || null;
}
export const daysLeftInWeek = (date = new Date()) => 8 - (date.getDay() || 7); // pon = 7 … niedz = 1

export function shopItems(save, date = new Date()) {
  const ev = activeEvent(date, EVENTS), feat = featuredItem(date);
  const ok = (it) => !it.retired && !it.community && it.price && (it.source === "shop" || eventAllows(ev, it.source));
  return {
    skins: SKINS.filter(ok).map((s) => ({ ...s, kind: "skin", owned: save.owned.skins.includes(s.id) })),
    hats: HATS.filter(ok).map((s) => ({ ...s, kind: "hat", owned: save.owned.hats.includes(s.id) })),
    featured: feat && { ...feat, kind: "skin", owned: save.owned.skins.includes(feat.id) },
    event: ev,
  };
}
export function buy(save, item) {
  if (item.owned || save.coins < item.price) return false;
  save.coins -= item.price;
  (item.kind === "skin" ? save.owned.skins : save.owned.hats).push(item.id);
  return true;
}

// ---- MOON BASE (domek kota, od strony 25) i paczka ze statku Króla (od strony 45, raz dziennie) ----
export const BASE_PAGE = 25, SHIP_PAGE = 45;
export const baseUnlocked = (save) => (save.story || 0) >= BASE_PAGE;
export function buyFurniture(save, f) {
  if (!f || !f.price || save.base.owned.includes(f.id) || save.coins < f.price) return false;
  save.coins -= f.price; save.base.owned.push(f.id);
  return true;
}
export function placeFurniture(save, slot, id) {
  if (id && !save.base.owned.includes(id)) return false;
  for (const k of Object.keys(save.base.placed)) if (save.base.placed[k] === id) delete save.base.placed[k];
  if (id) save.base.placed[slot] = id; else delete save.base.placed[slot];
  return true;
}
// paczka: 1/dzień (save.daily.shipDay). 1 na 4 — mebel tylko ze statku (jeśli jakiś brakuje), inaczej 15–30 rybek.
export function openParcel(save, d = today(), rng = Math.random) {
  if ((save.story || 0) < SHIP_PAGE || save.daily.shipDay === d) return null;
  save.daily.shipDay = d;
  const left = FURNITURE.filter((f) => f.source === "ship" && !save.base.owned.includes(f.id));
  if (left.length && rng() < 0.25) { const f = left[Math.floor(rng() * left.length)]; save.base.owned.push(f.id); return { item: f }; }
  const fish = 15 + Math.floor(rng() * 16);
  save.coins += fish;
  return { fish };
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
// co może wypaść ze skrzyni: przedmioty "chest" + tanie (common/rare) ze sklepu.
// Epickie i legendarne ze sklepu tylko za rybki — żeby rybki zawsze miały cel.
const fromChest = (s) => s.source === "chest" || (s.source === "shop" && (s.rarity === "common" || s.rarity === "rare"));
const RAR = ["common", "rare", "epic", "legendary"];
// pula nieposiadanych przedmiotów danej rzadkości dla skrzyni `type`
function chestPool(save, rarity, type, date) {
  const own = (it) => (it.kind === "skin" ? save.owned.skins : save.owned.hats).includes(it.id);
  // mityczna (nagroda tygodnia) może też dać epickie/legendarne ze sklepu; skórki "mythic" tylko stąd, podwójna waga
  const ok = (s) => !s.retired && s.rarity === rarity && (fromChest(s) || (type === "mythic" && s.source === "shop"));
  const all = [...SKINS.filter(ok).map((s) => ({ ...s, kind: "skin" })), ...HATS.filter(ok).map((s) => ({ ...s, kind: "hat" }))];
  const mythic = type === "mythic" && rarity === "legendary" ? SKINS.filter((s) => !s.retired && s.source === "mythic").map((s) => ({ ...s, kind: "skin" })) : [];
  // w czasie wydarzenia: przedmioty wydarzenia mają podwójną wagę (żeby skrzynie pachniały świętami)
  const ev = eventChestItems(date).filter((it) => it.rarity === rarity);
  return [...mythic, ...mythic, ...all, ...ev, ...ev].filter((it) => !own(it));
}
// Drabinka skrzyń: każda wyższa gwarantuje lepszą rzadkość (CHESTS[type].min). Gdy wylosowana rzadkość jest
// wyczerpana, schodzimy niżej aż do `min`; dopiero gdy nic nie zostało — zwykłe rybki tej skrzyni.
export function openChest(save, type, date = new Date()) {
  if (isGift(type)) return openGift(save, type);
  const c = CHESTS[type] || CHESTS.wood;
  const luck = tr(save, "treasure") * 8;
  const w = { ...c.rolls };
  // talent Treasure Nose: mniej rybek, więcej lepszych rzeczy — tylko w kategoriach, które ta skrzynia w ogóle ma
  if (luck) { if (w.coins) w.coins = Math.max(5, w.coins - luck); for (const [k, m] of [["rare", 0.5], ["epic", 0.35], ["legendary", 0.15]]) if (w[k]) w[k] += luck * m; }
  let roll = Math.random() * Object.values(w).reduce((a, b) => a + b, 0);
  let cat = "coins";
  for (const [k, v] of Object.entries(w)) { if (!v) continue; roll -= v; if (roll <= 0) { cat = k; break; } }
  if (cat !== "coins") {
    for (let i = RAR.indexOf(cat), lo = RAR.indexOf(c.min || "common"); i >= lo; i--) {
      const pool = chestPool(save, RAR[i], type, date);
      if (!pool.length) continue;
      const it = pool[Math.floor(Math.random() * pool.length)];
      (it.kind === "skin" ? save.owned.skins : save.owned.hats).push(it.id);
      return { kind: it.kind, item: it };
    }
  }
  const [a, b] = c.coins || [20, 50];
  const amt = Math.round(a + Math.random() * (b - a));
  save.coins += amt;
  return cat === "coins" ? { kind: "coins", amount: amt } : { kind: "coins", amount: amt, dup: cat };
}
// Skrzynia za bossa na piętrze `floor` (wielokrotność 5). Trzy stopnie, łatwe dla dziecka:
//   zwykły boss → drewniana albo srebrna (wyżej częściej srebrna), od piętra 40 rzadka niespodzianka: epicka (3%),
//   Król (co 25 pięter) → złota, a co 50 pięter → epicka.
// Mityczna NIE wypada z wieży — tylko za pokonanie bossa tygodnia (weeklyReward).
// Symulacja (tools/sim-chests.mjs): wcześniej 3,5–5,5 skrzyni/dzień i ~1 złota/epicka dziennie → wszystkie przedmioty w 2–4 tyg.
export function chestForFloor(floor, save, rng = Math.random) {
  if (floor % ECON.kingEvery === 0) return floor % (ECON.kingEvery * 2) === 0 ? "epic" : "gold";
  const r = rng();
  if (floor >= 40 && r < 0.03) return "epic";
  return r < (floor >= 50 ? 0.45 : floor >= 10 ? 0.3 : 0.15) ? "silver" : "wood";
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
  if (s.count % 7 === 0) { const c = s.count % 28 === 0 ? "epic" : "silver"; save.chests.push(c); events.push({ type: "streakChest", n: s.count, chest: c }); }
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
// Boss tygodnia (decyzja Maxa): wspólna pula rybek dzielona wg obrażeń, HP rośnie z wysiłkiem z zeszłego tygodnia.
// Konta testowe (tester w rosterze) nie liczą się do HP ani puli innych.
const isTester = (id) => !!(ROSTER.players && ROSTER.players[id] && ROSTER.players[id].tester);
export function weeklyNumbers({ total, players, lastTotal = 0, lastPlayers = 0, mine = 0 }) {
  const per = ECON.weeklyHpPerPlayer;
  const hp = Math.max(per * Math.max(1, players, lastPlayers), Math.round(lastTotal * ECON.weeklyLastWeek));
  const pool = Math.round(hp * ECON.weeklyFishPerHp);
  const share = mine > 0 ? Math.max(ECON.weeklyMinShare, Math.round(pool * mine / Math.max(total, hp, mine))) : 0;
  return { hp, pool, share };
}
export async function weeklyStatus(save) {
  const w = ensureWeek(save), mine = save.weekly.dmg;
  if (cloud.enabled()) {
    try {
      const kids = (rows) => rows.filter((r) => r.id === save.id || !isTester(r.id));
      const now = kids((await cloud.weeklyStatus(w)).rows);
      let last = [];
      try { last = kids((await cloud.weeklyStatus(isoWeek(new Date(Date.now() - 7 * 864e5)))).rows); } catch {}
      const sum = (rows) => rows.reduce((a, r) => a + (r.dmg || 0), 0);
      const total = Math.max(sum(now), mine);
      const n = weeklyNumbers({ total, players: now.length, lastTotal: sum(last), lastPlayers: last.length, mine });
      return { week: w, total, mine, ...n, players: now.length, cloud: true };
    } catch (e) { console.warn(e); }
  }
  return { week: w, total: mine, mine, ...weeklyNumbers({ total: mine, players: 1, mine }), players: 1, cloud: false };
}
// nagroda za pokonanie: MITYCZNA skrzynia (jedyne źródło) + następna skórka z kolejki + mój bonus z puli rybek (tylko jeśli biłem bossa).
// Rybki za same trafienia (ECON.weeklyFishPerHit) dostaje się od razu po biegu — rewards.applyRunResults.
export function weeklyReward(save, w) {
  const fish = (w && w.share) || ECON.weeklyMinShare;
  const queue = SKINS.filter((s) => s.source === "weekly" && !s.retired).sort((a, b) => a.order - b.order);
  const next = queue.find((s) => !save.owned.skins.includes(s.id));
  save.coins += fish;
  save.chests.push("mythic");
  if (next) { save.owned.skins.push(next.id); save.weeklySkins++; return { skin: next, chest: "mythic", coins: fish }; }
  return { chest: "mythic", coins: fish };
}

// ---- skórki dzieci: rysunek ucznia + zatwierdzone skórki z chmury ----
import { registerSkin, addCommunitySkins } from "./pixel/custom.js";
const SKIN_CACHE = "ninelives:skins";
export const MY_SKIN = "custom:mine";
// Wysyłanie rysunku do nauczyciela: na razie WYŁĄCZONE (decyzja Maxa). Dziecko dalej maluje i nosi swojego kota.
// true = wraca przycisk „Send to teacher” w edytorze i naklejki statusu; reszta kodu (chmura, panel) jest nietknięta.
export const SKIN_SENDING = false;
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
