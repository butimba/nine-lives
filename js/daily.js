// DAILY CHALLENGES — 3 per day, deterministic (date + save id), simple English (A1).
// Contract: docs/STAGE2-CONTRACTS.md (Daily). H draws the screen; run.js reports progress.
// List item: { id, ev, text, goal, n, done, claimed, reward: { fish, chest? }, icon, kind }
//  - ev = event name progressDaily() listens to ('correct' | 'skill:<id>' | 'combo' | 'boss' | 'noLifeBoss' |
//         'floor' | 'typed' | 'new' | 'cellar' | 'power')
//  - 'combo' keeps the best value (n = max), all other events add up.
// Slot 1 = the player's MAIN topic (first `focus` item) — learning first; slot 2 = learning; slot 3 = game.
import { today } from "./util.js";
import VOCAB from "../data/vocab.js";

// grammar skill id -> simple English name for the challenge text (grammar.js names are partly Polish)
export const SKILL_EN = {
  be: "am / is / are", have_got: "have got", can: "can / can't", there: "there is / there are", plural: "plurals",
  ps_3s: "present simple", ps_neg: "don't / doesn't", ps_q: "Do / Does questions", pc: "present continuous",
  pc_vs_ps: "present simple or continuous",
};
export function topicName(skill) {
  if (!skill) return "English";
  if (skill.startsWith("v:")) { const t = VOCAB[skill.slice(2)]; return t ? t.name.toLowerCase() : "words"; }
  return SKILL_EN[skill] || "English";
}

function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  let s = (h >>> 0) || 1;
  return () => ((s = Math.imul(s ^ (s >>> 15), 2246822519) + 0x6d2b79f5 >>> 0) % 1000003) / 1000003;
}
const pickW = (list, rng) => { const tot = list.reduce((a, x) => a + (x.w || 1), 0); let r = rng() * tot; for (const x of list) if ((r -= x.w || 1) <= 0) return x; return list[0]; };

export function mainFocus(profile = {}) {
  const f = (profile && profile.focus) || [];
  if (profile && profile.noReading) return f.find((s) => s.startsWith("v:")) || null;
  return f[0] || null;
}

export function makeDaily(save, profile = {}, date = new Date()) {
  profile = profile || {};
  const d = today(date);
  const rng = seeded(`${d}|${save.id || "x"}`);
  const young = !!profile.noReading;
  const main = mainFocus(profile);
  const list = [];
  // 1) main topic
  if (main) {
    const n = young ? 10 : 12 + Math.floor(rng() * 2) * 3; // 12 or 15
    list.push({ ev: "skill:" + main, goal: n, text: `Answer ${n} questions about ${topicName(main)}`, icon: "cards", kind: "learn", reward: { fish: 40 } });
  } else list.push({ ev: "correct", goal: 15, text: "Get 15 right answers", icon: "check", kind: "learn", reward: { fish: 40 } });
  // 2) learning
  const learn = [
    { ev: "correct", goal: 20, text: "Get 20 right answers", icon: "check", w: 3 },
    { ev: "new", goal: 3, text: "Learn 3 new words", icon: "star", w: 2 },
  ];
  if (!young) learn.push({ ev: "typed", goal: 6, text: "Spell 6 words", icon: "xp", w: 2 });
  if ((save.shadows || []).length >= 3) learn.push({ ev: "cellar", goal: 1, text: "Clean the Shadow Cellar", icon: "door", w: 3 });
  if (list[0].ev === "correct") learn.shift();
  list.push({ ...pickW(learn, rng), kind: "learn", reward: { fish: 30 } });
  // 3) game
  const owned = (save.powers && save.powers.owned) || [];
  const game = [
    { ev: "combo", goal: young ? 8 : 10, text: `Get a combo of ${young ? 8 : 10}`, icon: "flame", w: 3, reward: { fish: 50, chest: "wood" } },
    { ev: "boss", goal: 1, text: "Beat a boss", icon: "skull", w: 2, reward: { fish: 50, chest: "wood" } },
    { ev: "noLifeBoss", goal: 1, text: "Beat a boss without losing a life", icon: "heart", w: young ? 1 : 2, reward: { fish: 60, chest: "silver" } },
    { ev: "floor", goal: 8, text: "Climb 8 floors", icon: "arrowR", w: 2, reward: { fish: 50, chest: "wood" } },
  ];
  if (owned.length) game.push({ ev: "power", goal: 2, text: "Use a power 2 times", icon: "power_" + owned[0], w: 2, reward: { fish: 50, chest: "wood" } });
  list.push({ ...pickW(game, rng), kind: "game" });
  return list.map((c, i) => ({ id: `${d}:${i}`, ev: c.ev, text: c.text, goal: c.goal, n: 0, done: false, claimed: false, reward: { ...c.reward }, icon: c.icon, kind: c.kind }));
}

export function ensureDaily(save, profile, date = new Date()) {
  if (!save.challenges || typeof save.challenges !== "object") save.challenges = { date: null, list: [] };
  const d = today(date);
  if (save.challenges.date !== d || !Array.isArray(save.challenges.list) || !save.challenges.list.length) {
    save.challenges.date = d;
    save.challenges.list = makeDaily(save, profile, date);
  }
  return save.challenges;
}

// -> array of challenges completed by this event (run.js shows a toast)
export function progressDaily(save, event, amount = 1, date = new Date()) {
  const ch = save && save.challenges;
  if (!ch || !Array.isArray(ch.list) || ch.date !== today(date)) return [];
  const doneNow = [];
  for (const c of ch.list) {
    if (c.done || c.ev !== event) continue;
    if (event === "combo") c.n = Math.max(c.n, amount);
    else c.n += amount;
    if (c.n >= c.goal) { c.n = c.goal; c.done = true; doneNow.push(c); }
  }
  return doneNow;
}

export function claimDaily(save, id) {
  const ch = save && save.challenges;
  const c = ch && Array.isArray(ch.list) && ch.list.find((x) => x.id === id);
  if (!c || !c.done || c.claimed) return null;
  c.claimed = true;
  const fish = (c.reward && c.reward.fish) || 0;
  const chest = (c.reward && c.reward.chest) || null;
  save.coins += fish;
  if (chest) save.chests.push(chest);
  return { fish, chest };
}
