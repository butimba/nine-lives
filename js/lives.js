// NINE LIVES — system żyć i malejących nagród (DESIGN.md §4).
// - 9 żyć na dzień, reset do 9 o północy lokalnej.
// - +1 życie co 20 min (licząc od lives.at), +1 za combo 8 (max 9).
// - Zła odpowiedź = −1 życie. Zręczność nigdy nie zabiera życia (to pilnuje run.js).
// - Nagrody (rybki, XP) maleją z czasem gry dziennie; Shadow Cellar zawsze 100%.
// Zapis: save.lives = { n, at, date }, save.daily.ms = czas gry dziś (ms).
import { today } from "./util.js";

export const MAX_LIVES = 9, REGEN_MS = 20 * 60 * 1000, COMBO_LIFE = 8;
// ŁAGODNE ŻYCIA (etap 2, dla 7-latków): błąd NIE zabiera życia, gdy
//  1) to jeden z pierwszych FREE_PER_DAY błędów dnia ("warm-up", licznik save.lives.free, reset o północy),
//  2) to pierwsze w historii podejście do danej rzeczy (nowe słowo / nowy wzorzec — nie da się znać czegoś, czego się nie uczyło),
//  3) ta sama rzecz była już źle w tym biegu (silnik i tak ją powtarza — nie karzemy dwa razy za tę samą lukę).
// Nauka (srs, log, cienie) liczy się normalnie; zmienia się tylko koszt w życiach.
export const FREE_PER_DAY = 3;
// progi minut gry dziennie → mnożnik nagród
export const REWARD_TIERS = [
  { min: 0, mult: 1 },
  { min: 20, mult: 0.7 },
  { min: 30, mult: 0.35 },
  { min: 45, mult: 0.15 },
];

const dayOf = (now) => today(new Date(now));

function ensure(save, now) {
  if (!save.lives || typeof save.lives !== "object") save.lives = { n: MAX_LIVES, at: now, date: dayOf(now) };
  const l = save.lives;
  if (typeof l.n !== "number" || isNaN(l.n)) l.n = MAX_LIVES;
  if (typeof l.at !== "number" || isNaN(l.at)) l.at = now;
  if (!l.date) l.date = dayOf(now);
  return l;
}

// Północ → 9 żyć; regeneracja co REGEN_MS. Idempotentne (można wołać ile razy się chce).
export function tickLives(save, now = Date.now()) {
  const l = ensure(save, now);
  const d = dayOf(now);
  if (typeof l.free !== "number" || isNaN(l.free)) l.free = 0;
  if (l.date !== d) { l.n = MAX_LIVES; l.at = now; l.date = d; l.free = 0; return l.n; }
  if (l.at > now) l.at = now; // zegar cofnięty
  if (l.n >= MAX_LIVES) { l.n = MAX_LIVES; return l.n; }
  if (l.n < 0) l.n = 0;
  const k = Math.floor((now - l.at) / REGEN_MS);
  if (k > 0) {
    l.n = Math.min(MAX_LIVES, l.n + k);
    l.at = l.n >= MAX_LIVES ? now : l.at + k * REGEN_MS;
  }
  return l.n;
}

export function livesState(save, now = Date.now()) {
  tickLives(save, now);
  const l = save.lives;
  const n = l.n;
  return { n, max: MAX_LIVES, asleep: n === 0, nextInMs: n < MAX_LIVES ? Math.max(0, REGEN_MS - (now - l.at)) : 0 };
}

export function loseLife(save, now = Date.now()) {
  tickLives(save, now);
  const l = save.lives;
  if (l.n >= MAX_LIVES) l.at = now; // regeneracja liczy się od pierwszej straty
  l.n = Math.max(0, l.n - 1);
  return l.n;
}

// Czy ten błąd kosztuje życie? -> { free: null | 'warmup' | 'new' | 'repeat' }. Wywołuje run.js (tylko wieża;
// Shadow Cellar ma własne zasady). Jeśli 'warmup', zużywa jeden darmowy błąd dnia.
// ctx = { newItem: pierwsze podejście do rzeczy, repeat: ta sama rzecz już źle w tym biegu }
export function mistakeCost(save, ctx = {}, now = Date.now()) {
  tickLives(save, now);
  const l = save.lives;
  if (ctx.newItem) return { free: "new" };
  if (ctx.repeat) return { free: "repeat" };
  if (l.free < FREE_PER_DAY) { l.free++; return { free: "warmup", left: FREE_PER_DAY - l.free }; }
  return { free: null };
}

// reason: 'combo' | 'catnip' | 'catnap' | 'merchant' | 'powerup' ... (tylko informacyjnie)
export function gainLife(save, reason, now = Date.now()) {
  tickLives(save, now);
  const l = save.lives;
  if (l.n < MAX_LIVES) l.n++;
  if (l.n >= MAX_LIVES) l.at = now;
  return l.n;
}

function rollDaily(save, now = Date.now()) {
  const d = dayOf(now);
  if (!save.daily) save.daily = { date: d, runs: 0, ms: 0 };
  if (save.daily.date !== d) { save.daily.date = d; save.daily.runs = 0; save.daily.ms = 0; }
  if (typeof save.daily.ms !== "number" || isNaN(save.daily.ms)) save.daily.ms = 0;
  return save.daily;
}

export function addPlayTime(save, ms, now = Date.now()) {
  const d = rollDaily(save, now);
  if (ms > 0 && isFinite(ms)) d.ms += Math.min(ms, 10 * 60 * 1000); // jedno zadanie liczy się max 10 min (kot zostawiony)
  return d.ms;
}

export function playMinutes(save, now = Date.now()) {
  const d = save.daily;
  if (!d || d.date !== dayOf(now)) return 0;
  return (d.ms || 0) / 60000;
}

export function sleepyTier(save, now = Date.now()) {
  const m = playMinutes(save, now);
  let t = 0;
  REWARD_TIERS.forEach((r, i) => { if (m >= r.min) t = i; });
  return t;
}

export function rewardMult(save, mode, now = Date.now()) {
  if (mode === "shadow") return 1;
  return REWARD_TIERS[sleepyTier(save, now)].mult;
}
