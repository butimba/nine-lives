// SILNIK NAUKI — bez AI, bez API, za 0 zł.
// - powtórki rozłożone w czasie (pudełka 0–5),
// - wykrywanie słabych umiejętności (średnia z ostatnich prób),
// - wykrywanie wzorców błędów (który zły wariant dziecko wybiera),
// - "back to basics": jak coś długo leży, dorzuca podstawy,
// - zmiany są stopniowe (średnie kroczące, nie reakcja na pojedynczy błąd).
import VOCAB, { CONFUSABLE } from "../data/vocab.js";
import { SKILLS } from "../data/grammar.js";
import EVENTS, { activeEvent } from "../data/events.js";
import CURRICULUM_DATA from "../data/curriculum.js"; // Agent V: { THEME_GRADE, LADDER } — drabinka tematów słówek
import { rngFrom } from "./art.js";
import { shuffle, pick } from "./util.js";

const DAY = 86400000;
export const BOX_DAYS = [0, 1, 2, 4, 8, 16]; // ile dni do następnej powtórki po trafieniu w danym pudełku
// DIAMENT (tylko słówka): złota karta (pudełko 5) + 3 kolejne wymagalne powtórki bez błędu i podpowiedzi, co najmniej
// 6 tygodni od złota → słówko wypada z powtórek; wraca tylko na „sprawdzian diamentu” co ~4 miesiące.
// Błąd na sprawdzianie = karta wraca do złota (bez spadku pudełka, bez utraty życia — run.js), odliczanie od nowa.
// Pola w srs (opcjonalne, jak st/lw): g = kiedy złoto, gk = dobre powtórki od złota, dia = kiedy diament.
export const DIAMOND = { reviews: 3, minDays: 42, checkDays: 120 };
export const isDiamondCheck = (r, now = Date.now()) => !!(r && r.dia && r.due <= now);
const ALL_WORDS = Object.values(VOCAB).flatMap((th) => th.words);

// które błędy wzmacniają którą umiejętność
const CONFUSION_SKILL = {
  ps_for_pc: "pc_vs_ps", pc_for_ps: "pc_vs_ps", no_s: "ps_3s", s_overuse: "ps_3s", s_spelling: "ps_3s",
  ing_confusion: "ps_3s", s_after_does: "ps_neg", be_for_do: "ps_neg", do_for_be: "pc", ing_spelling: "pc",
  be_agreement: "be", missing_be: "pc", s_after_modal: "can", to_after_modal: "can", have_for_there: "there",
  do_agreement: "ps_neg", missing_ing: "pc", have_agreement: "have_got", be_for_have: "have_got", do_for_have: "have_got",
  do_for_modal: "can", be_for_modal: "can", can_meaning: "can", there_agreement: "there", plural_missing: "plural", plural_form: "plural",
  missing_do: "ps_neg", like_ing: "ps3_like", freq_order: "ps3_freq", who_meaning: "ps3_who",
};
export const CONFUSION_PL = {
  ps_for_pc: "używa present simple tam, gdzie trzeba continuous (teraz)", pc_for_ps: "używa continuous przy rutynach (every day)",
  no_s: "gubi -s w 3. os. (he play)", s_overuse: "dodaje -s przy I/you/we/they", s_spelling: "błędy w pisowni -s/-es/-ies",
  ing_confusion: "myli present simple z -ing", s_after_does: "dodaje -s po doesn't/does", be_for_do: "myli do/does z is/are",
  do_for_be: "myli is/are z do/does w continuous", ing_spelling: "pisownia -ing (running, dancing)", be_agreement: "zły wybór am/is/are",
  missing_be: "pomija am/is/are przed -ing", s_after_modal: "dodaje -s po can", to_after_modal: "wstawia 'to' po can", have_for_there: "there have zamiast there is/are",
  do_agreement: "myli do / does (don't / doesn't)", missing_ing: "zapomina o -ing po am/is/are", have_agreement: "myli have got / has got",
  be_for_have: "is got zamiast has got", do_for_have: "doesn't got zamiast hasn't got", do_for_modal: "Do/Does zamiast Can w pytaniu",
  be_for_modal: "Is/Are zamiast Can w pytaniu", can_meaning: "myli can / can't (znaczenie)", there_agreement: "myli there is / there are",
  plural_missing: "zapomina o liczbie mnogiej", plural_form: "zła forma liczby mnogiej (np. mouses, babys)",
  word_order: "szyk zdania (układanie z klocków)", spelling: "pisownia przy wpisywaniu", fix: "nie znajduje błędu w zdaniu",
  judge: "uznaje poprawne zdanie za błędne",
  missing_do: "pomija doesn't / don't w przeczeniu (she not like)", like_ing: "zapomina o -ing po like (she likes swim)",
  freq_order: "zły szyk: always / often / never stoi przed czasownikiem (goes always)",
  who_meaning: "Who…?: wskazuje złą osobę (nie rozumie zdania)",
};

// ---------- katalog ----------
// opts.subjects === "3s" (profil "subjects": "3s"): bez wzorców z listy skip3s (np. "they play" — ps_3s:no_s)
export function itemsForSkill(skill, opts) {
  if (skill.startsWith("v:")) {
    const th = VOCAB[skill.slice(2)];
    return th ? th.words.map((w) => `v:${skill.slice(2)}:${w[0]}`) : [];
  }
  const sk = SKILLS[skill];
  if (!sk) return [];
  const skip = opts && opts.subjects === "3s" ? sk.skip3s || [] : [];
  return Object.keys(sk.patterns).filter((p) => !skip.includes(p)).map((p) => `g:${skill}:${p}`);
}
// opcje generatora zdań dla profilu (przekazywane do patterns[p](rng, opts))
export const genOpts = (profile) => ({ subjects: profile && profile.subjects === "3s" ? "3s" : null });
// czy element wolno dać temu profilowi (tryb 3s wyklucza wzorce skip3s)
export function keyAllowed(key, opts) {
  if (isVocab(key) || !opts || opts.subjects !== "3s") return true;
  const [, sk, p] = key.split(":");
  return !(SKILLS[sk] && (SKILLS[sk].skip3s || []).includes(p));
}
export const skillOf = (key) => (key.startsWith("v:") ? key.split(":").slice(0, 2).join(":") : key.split(":")[1]);
export const isVocab = (key) => key.startsWith("v:");
export function wordOf(key) {
  const [, th, en] = key.split(":");
  const w = VOCAB[th] && VOCAB[th].words.find((x) => x[0] === en);
  return w ? { en: w[0], pl: w[1], img: w[2], theme: th } : null;
}
export function skillName(skill) {
  if (skill.startsWith("v:")) { const t = VOCAB[skill.slice(2)]; return t ? `${t.icon} ${t.name}` : skill; }
  return SKILLS[skill] ? SKILLS[skill].name : skill;
}

// ---------- ŚCIEŻKA (drabinka) ----------
// profile.path = uporządkowana lista kroków: id umiejętności ("ps_3s"), temat słówek ("v:family")
// albo "ladder:grade3:2" = 2 kolejne tematy z drabinki klasy 3 (data/curriculum.js → LADDER; "*" = wszystkie pozostałe).
// Stan odblokowania jest WYLICZANY z srs + log (bez nowego pola w zapisie):
//  - krok widziany (jakikolwiek element w srs) = odblokowany na zawsze (stare kroki zostają w powtórkach),
//  - pierwsze profile.pathStart (domyślnie 2) kroki są otwarte od początku,
//  - następny krok otwiera się, gdy: najnowszy krok ma ≥70% elementów w pudełku ≥2 i ≥75% trafień w ostatnich 20 próbach (min. 8),
//    każdy otwarty krok ma ≥50% w pudełku ≥2, zaległych powtórek ≤ 20, nie ma otwartego-a-niewidzianego kroku
//    i dziś nie otwarto (nie zaczęto) żadnego kroku → najwyżej 1 nowy krok dziennie.
export const PATH_RULES = { mastery: 0.7, acc: 0.75, accN: 20, minN: 8, floor: 0.5, maxDue: 20, start: 2 };
// awaryjna drabinka (gdy brak data/curriculum.js) — tylko istniejące tematy, bez "numbers" (za łatwe dla klas 3–4)
const FALLBACK_LADDER = {
  grade1: ["animals", "colors", "toys", "food", "family", "body"],
  grade2: ["clothes", "home", "school", "weather", "feelings", "actions"],
  grade3: ["family", "body", "clothes", "school", "home", "toys", "weather", "feelings", "sports", "actions", "food", "animals"],
  grade4: ["jobs", "transport", "nature", "sports", "home", "weather"],
};
let CURRICULUM = null; // { THEME_GRADE, LADDER } — ustawiane przez setCurriculum (data/curriculum.js, gdy istnieje)
export function setCurriculum(c) { const x = c && (c.LADDER ? c : c.default); CURRICULUM = x && x.LADDER ? x : null; }
setCurriculum(CURRICULUM_DATA);
// tematy czysto sezonowe (dorzuca je wydarzenie, a nie drabinka) — chyba że są wpisane w path wprost
const SEASONAL = new Set(["halloween", "winter", "spring", "summer", "christmas", "easter", "newyear", "valentines"]);
const ladderFor = (g) => ((CURRICULUM && CURRICULUM.LADDER && CURRICULUM.LADDER[g]) || FALLBACK_LADDER[g] || []).map((t) => String(t).replace(/^v:/, ""));

export function expandPath(profile) {
  const raw = (profile && profile.path) || [];
  const excl = new Set((profile && profile.pathExclude) || []);
  const explicit = new Set(raw.filter((x) => !x.startsWith("ladder:")));
  const used = new Set(), cursor = {}, out = [];
  const opts = genOpts(profile);
  const ok = (id) => !used.has(id) && !excl.has(id) && itemsForSkill(id, opts).length > 0 && !(profile.noReading && !id.startsWith("v:"));
  for (const x of raw) {
    if (!x.startsWith("ladder:")) { if (ok(x)) { out.push(x); used.add(x); } continue; }
    const [, g, nRaw] = x.split(":");
    const list = ladderFor(g);
    let n = nRaw === "*" || nRaw == null ? Infinity : +nRaw || 1;
    let i = cursor[g] || 0;
    while (n > 0 && i < list.length) {
      const id = "v:" + list[i++];
      if (explicit.has(id) || (SEASONAL.has(id.slice(2)) && !explicit.has(id)) || !ok(id)) continue;
      out.push(id); used.add(id); n--;
    }
    cursor[g] = i;
  }
  return out;
}

// element "opanowany" do drabinki: pudełko ≥2 (trafienie w dwóch różnych dniach) albo pewny dorobek (≥6 prób, ≥80% trafień)
// — zdania gramatyczne wracają często w ciągu dnia, a pomyłka cofa pudełko, więc samo pudełko zaniżałoby opanowanie
const known = (r) => r.b >= 2 || (r.n >= 6 && r.ok / r.n >= 0.8);
function dayStart(now) { const d = new Date(now); d.setHours(0, 0, 0, 0); return +d; }

// pełny stan ścieżki (dla silnika, UI i panelu nauczyciela)
export function pathState(save, profile, now = Date.now()) {
  const ids = expandPath(profile);
  if (!ids.length) return null;
  const opts = genOpts(profile);
  const R = { ...PATH_RULES, ...((profile && profile.pathRules) || {}) };
  const start = profile.pathStart ?? R.start;
  const first = new Map(), recent = new Map();
  const idSet = new Set(ids);
  for (const l of save.log || []) {
    const st = skillOf(l[1]);
    if (!idSet.has(st)) continue;
    if (!first.has(st)) first.set(st, l[0]);
    const a = recent.get(st) || []; a.push(l[2]); if (a.length > R.accN) a.shift(); recent.set(st, a);
  }
  const d0 = dayStart(now);
  const steps = ids.map((id, i) => {
    const items = itemsForSkill(id, opts);
    let seen = 0, good = 0, due = 0;
    for (const k of items) { const r = save.srs[k]; if (!r) continue; seen++; if (known(r)) good++; if (r.due <= now) due++; }
    const acc = recent.get(id) || [];
    return {
      id, i, name: skillName(id), items: items.length, seen, due,
      mastery: items.length ? good / items.length : 0,
      acc: acc.length ? acc.reduce((a, b) => a + b, 0) / acc.length : null, accN: acc.length,
      since: seen ? (first.get(id) ?? 0) : null, unlocked: i < start || seen > 0, current: false,
    };
  });
  const open = () => steps.filter((s) => s.unlocked);
  // najnowszy krok = najpóźniej rozpoczęty (albo otwarty, ale jeszcze niewidziany)
  const newestOf = (list) => list.reduce((a, s) => (!a || (s.since ?? Infinity) >= (a.since ?? Infinity) ? s : a), null);
  const frontier = steps.find((s) => !s.unlocked);
  let blocked = null;
  if (frontier) {
    const o = open(), newest = newestOf(o);
    const dueAll = o.reduce((a, s) => a + s.due, 0);
    if (o.some((s) => s.seen === 0)) blocked = "pending";            // otwarty krok czeka na pierwsze zadania
    else if (o.some((s) => s.since != null && s.since >= d0)) blocked = "today"; // max 1 nowy krok dziennie
    else if (dueAll > R.maxDue) blocked = "reviews";                  // najpierw powtórki
    else if (o.some((s) => s !== newest && s.mastery < R.floor)) blocked = "floor"; // żaden starszy krok nie może leżeć
    else if (!newest || newest.mastery < R.mastery || newest.accN < R.minN || newest.acc < R.acc) blocked = "mastery";
    if (!blocked) frontier.unlocked = true;
  }
  const o = open();
  const cur = newestOf(o); if (cur) cur.current = true;
  return { steps, unlocked: o.map((s) => s.id), current: cur ? cur.id : null, next: steps.find((s) => !s.unlocked)?.id || null, blocked };
}
// dla UI / panelu: [{ id, name, unlocked, mastery, ... }]
export function pathStatus(save, profile, now = Date.now()) {
  const ps = pathState(save, profile || {}, now);
  return ps ? ps.steps.map((s) => ({ id: s.id, name: s.name, unlocked: s.unlocked, mastery: Math.round(s.mastery * 100) / 100, current: s.current, seen: s.seen, items: s.items, acc: s.acc == null ? null : Math.round(s.acc * 100) / 100 })) : [];
}

// aktywne umiejętności gracza: (ścieżka albo plan od nauczyciela) + wydarzenie + back-to-basics + wzorce błędów
export function activeSkills(save, profile, date = new Date(Date.now())) {
  const set = new Map();
  profile = profile || {};
  const ps = profile.path ? pathState(save, profile, +date) : null;
  if (ps) for (const id of ps.unlocked) set.set(id, id === ps.current ? 1.2 : 1);
  for (const s of profile.focus || []) set.set(s, Math.max(set.get(s) || 0, 1));
  const ev = activeEvent(date, EVENTS);
  if (ev && ev.vocab && !profile.noEvents) set.set("v:" + ev.vocab, 1.2);
  // back to basics
  for (const s of [...set.keys()]) {
    const st = save.skills[s];
    if (SKILLS[s] && st && st.n >= 12 && st.m < 0.45)
      for (const p of SKILLS[s].prereq) set.set(p, Math.max(set.get(p) || 0, 1.5));
  }
  // wzorce błędów
  for (const [tag, score] of Object.entries(save.confusions)) {
    const sk = CONFUSION_SKILL[tag];
    // ze ścieżką: wzmacniamy tylko już otwarte umiejętności (bez przeskakiwania drabinki)
    if (score >= 2.5 && sk && (set.has(sk) || (!ps && hasGrammar(set)))) set.set(sk, Math.max(set.get(sk) || 0, 1.8));
  }
  if (profile.noReading) for (const k of [...set.keys()]) if (!k.startsWith("v:")) set.delete(k);
  return set;
}
const hasGrammar = (set) => [...set.keys()].some((k) => !k.startsWith("v:"));

// "zapomniane słowa" = jawne cienie + rzeczy mocno przeterminowane
export function shadowList(save, now = Date.now()) {
  const extra = Object.entries(save.srs).filter(([k, r]) => r.b >= 1 && !r.dia && r.due && now - r.due > 7 * DAY).map(([k]) => k);
  return [...new Set([...save.shadows, ...extra])].filter((k) => (isVocab(k) ? wordOf(k) : SKILLS[skillOf(k)]));
}

// ---------- wybór następnego zadania ----------
// Udział tematu głównego (pierwszy element focus) w zadaniach, gdy ma kandydatów. DESIGN.md §7: ~65–70%.
export const MAIN_SHARE = 0.68;
// Gra stawia na gramatykę (Max, 11.2026): gdy dziecko ma i zdania, i słówka, ~70% zadań to zdania (słówek w puli jest
// wielokrotnie więcej niż wzorców, więc wcześniej biegi były w ~90% słówkowe). Nieczytający: tylko słówka.
// forceGrammar (Glitch w biegu) = same zdania.
export const GRAMMAR_SHARE = 0.7;
// nowe rzeczy na jeden bieg (temat główny / reszta) i na dzień (obciążenie poznawcze dzieci 7–9 lat)
const NEW_CAP = { main: { vocab: 4, grammar: 2 }, other: { vocab: 2, grammar: 1 } };
const DAILY_NEW = { vocab: 10, grammar: 4 };
// zadania "produkcyjne" / o niskim prawdopodobieństwie zgadnięcia: tylko one awansują do pudełek 4–5 (złota karta)
export const STRONG = new Set(["type", "spell", "build", "fix"]);
const MAX_TYPE = 10, MAX_SPELL = 9, MAX_BUILD = 7;
const letters = (s) => s.replace(/[^a-zA-Z]/g, "");

// mylące się słowa (data/vocab.js CONFUSABLE): "*hub" = hub z każdym, inaczej każdy z każdym
const CONF = new Map();
const addConf = (a, b) => { if (a === b) return; (CONF.get(a) || CONF.set(a, new Set()).get(a)).add(b); (CONF.get(b) || CONF.set(b, new Set()).get(b)).add(a); };
for (const g of CONFUSABLE) {
  if (g[0].startsWith("*")) { const hub = g[0].slice(1); for (const x of g.slice(1)) addConf(hub, x); }
  else for (const a of g) for (const b of g) addConf(a, b);
}
// dwa słówka [en, pl, img] nie mogą stać obok siebie jako opcje
export function vocabConflict(a, b) {
  return a[0] === b[0] || a[1] === b[1] || a[2] === b[2] || !!(CONF.get(a[0]) && CONF.get(a[0]).has(b[0]));
}
// czy zdanie nadaje się do układania z klocków jednoznacznie (tylko jedna poprawna kolejność)
export function buildable(q) {
  if (!q || q.nobuild || !q.full || /[→—]/.test(q.full) || /[→—]/.test(q.text)) return false;
  const w = q.full.split(" ");
  if (w.length < 3 || w.length > MAX_BUILD) return false;
  if (/ and /.test(q.full)) return false;                       // "Tom and Mia" = "Mia and Tom"
  if (w.slice(0, -1).some((x) => /[.!?,]$/.test(x))) return false; // "Look! She…" = "She…. Look!"
  if (!/^[A-Z]/.test(w[0])) return false;
  return true;
}
const isSentence = (q) => !/[→—]/.test(q.text);
const wpick = (cands, rng) => {
  let t = cands.reduce((a, c) => a + c[1], 0) * rng();
  for (const c of cands) { t -= c[1]; if (t <= 0) return c[0]; }
  return cands[cands.length - 1][0];
};
// ze ścieżką: szansa, że przy zaległych powtórkach następne zadanie będzie powtórką (nowe rzeczy mają limity NEW_CAP / DAILY_NEW)
export const REVIEW_FIRST = 0.8;
const PS_PACK = new Set(["ps_3s", "ps_neg", "ps_q", "ps3_like", "ps3_routine", "ps3_who", "ps3_wh", "ps3_freq", "ps_iyou"]);
// wabik w układaniu zdań (P1-3): zła forma czasownika jako dodatkowy klocek — build sprawdza też -s / bez -s
const DECOY_TAGS = new Set(["no_s", "s_after_does", "s_after_modal", "do_agreement", "have_agreement", "like_ing", "s_overuse"]);
const DECOY_SKILLS = /^(ps_3s|ps_neg|ps_q|ps3_|ps_iyou|have_got)/;
const SPELL_TAGS = new Set(["s_spelling", "ing_spelling"]);

export class Session {
  constructor(save, profile, mode = "tower", seed = Date.now()) {
    this.save = save; this.profile = profile || {}; this.mode = mode;
    this.rng = rngFrom(seed);
    this.recent = []; this.requeue = []; this.newCount = { vocab: 0, grammar: 0 }; this.i = 0;
    this.newKeys = new Set();
    this.gopts = genOpts(this.profile);
    this.path = this.profile.path ? pathState(save, this.profile) : null;
    this.skills = activeSkills(save, this.profile);
    let pool = mode === "shadow" ? shadowList(save) : [...this.skills.keys()].flatMap((k) => itemsForSkill(k, this.gopts));
    pool = pool.filter((k) => keyAllowed(k, this.gopts));
    if (this.profile.noReading) pool = pool.filter(isVocab); // dziecko nieczytające: tylko zadania dźwięk/obrazek
    this.pool = pool;
    // temat główny: ze ścieżką = najnowszy otwarty krok, inaczej pierwszy element focus
    const f0 = this.path ? this.path.current : (this.profile.focus || [])[0];
    this.main = mode !== "shadow" && f0 && this.skills.has(f0) ? f0 : null;
    // P1-2: w trybie 3s temat główny "present simple" = pakiet (zwykłe zdanie +s, doesn't, Does…?, Who…?, What does…?),
    // żeby ~68% nie zjadało samo ps_3s (tam -s da się zgadnąć bez czytania podmiotu)
    if (this.main && this.gopts.subjects === "3s" && PS_PACK.has(this.main)) this.mainPack = new Set([...PS_PACK].filter((x) => this.skills.has(x)));
    // świeżo otwarty krok (jeszcze niewidziany) pokazujemy już w tym biegu, żeby otwarcie było trwałe (krok widziany = otwarty na zawsze)
    const pend = this.path && mode !== "shadow" && this.path.steps.find((x) => x.unlocked && x.seen === 0);
    this.pending = pend && this.skills.has(pend.id) ? pend.id : null;
    this.introduced = new Set();
    this.newToday = newToday(save);
  }
  isMain(key) { const sk = skillOf(key); return !!this.main && (sk === this.main || (this.mainPack && this.mainPack.has(sk))); }
  canIntroduce(key) {
    const kind = isVocab(key) ? "vocab" : "grammar";
    const grp = this.isMain(key) ? "main" : "other";
    let n = 0; for (const k of this.newKeys) if ((isVocab(k) ? "vocab" : "grammar") === kind && (this.isMain(k) ? "main" : "other") === grp) n++;
    return n < NEW_CAP[grp][kind] && this.newToday[kind] + this.newCount[kind] < DAILY_NEW[kind];
  }
  pickKey() {
    const now = Date.now();
    const rq = this.requeue.findIndex((r) => r.at <= this.i);
    if (rq >= 0) return this.requeue.splice(rq, 1)[0].key;
    if (this.pending && this.i >= 2) {
      const fresh = this.pool.filter((k) => skillOf(k) === this.pending && !this.save.srs[k] && !this.recent.includes(k) && this.canIntroduce(k));
      if (fresh.length) { this.pending = null; return pick(fresh, this.rng); }
      if (this.pool.some((k) => skillOf(k) === this.pending && this.save.srs[k])) this.pending = null;
    }
    const shadows = new Set(this.save.shadows);
    let mainC = [], otherC = [];
    for (const key of this.pool) {
      const main = this.isMain(key);
      // temat główny może wracać częściej (zdania gramatyczne są za każdym razem inne)
      const win = main ? (isVocab(key) ? 3 : 1) : 4;
      if (this.recent.slice(-win).includes(key)) continue;
      const r = this.save.srs[key];
      const sk = this.save.skills[skillOf(key)] || { m: 0.3, n: 0 };
      let w;
      if (!r) w = this.canIntroduce(key) ? 3 : 0;
      else if (r.dia && r.due > now) w = 0; // diament: poza powtórkami aż do sprawdzianu
      else if (r.due <= now) w = 6 + (5 - r.b);
      else w = r.b <= 2 ? 0.8 : 0.15;
      if (this.mode === "shadow") w = 3;
      w *= (1.6 - sk.m) * (this.skills.get(skillOf(key)) || 1);
      if (shadows.has(key)) w *= 1.5;
      if (w > 0) (main ? mainC : otherC).push([key, w, !!(r && r.due <= now)]);
    }
    // najpierw RODZAJ zadania: zdanie (GRAMMAR_SHARE; Glitch = zawsze) czy słówko — potem powtórki i temat główny w jego obrębie.
    // Temat główny-zdania zachowuje swój udział w całości (~MAIN_SHARE); temat główny-słówka dostaje MAIN_SHARE tylko z części słówkowej.
    let share = MAIN_SHARE;
    if (this.mode !== "shadow") {
      const isG = (c) => !isVocab(c[0]), all = [...mainC, ...otherC];
      if (all.some(isG) && !all.every(isG)) {
        const wantG = this.forceGrammar || this.rng() < GRAMMAR_SHARE, f = (c) => isG(c) === wantG;
        mainC = mainC.filter(f); otherC = otherC.filter(f);
        if (wantG && this.main && !this.main.startsWith("v:")) share = Math.min(0.95, MAIN_SHARE / GRAMMAR_SHARE);
      }
    }
    // ŚCIEŻKA: najpierw powtórki
    if (this.path && this.mode !== "shadow") {
      const due = [...mainC, ...otherC].filter((c) => c[2]);
      if (due.length && this.rng() < REVIEW_FIRST) return wpick(due, this.rng);
    }
    let cands = mainC.length && otherC.length ? (this.rng() < share ? mainC : otherC) : mainC.length ? mainC : otherC;
    if (!cands.length) return this.pool.length ? pick(this.pool, this.rng) : null;
    return wpick(cands, this.rng);
  }
  next() {
    const key = this.pickKey();
    if (!key) return null;
    this.i++;
    this.recent.push(key);
    const r = this.save.srs[key];
    const fresh = !r && !this.newKeys.has(key);
    if (!r) { this.newCount[isVocab(key) ? "vocab" : "grammar"]++; this.newKeys.add(key); }
    const t = isVocab(key) ? this.vocabTask(key, r) : this.grammarTask(key, r);
    // P1-6: pierwsze spotkanie (karta NEW) → to zadanie nie daje pudełka; rzecz wraca za 3–5 zadań i dopiero wtedy liczy się 0 → 1
    if (fresh) { t.justIntroduced = true; this.requeue.push({ key, at: this.i + 3 + Math.floor(this.rng() * 3) }); }
    return t;
  }
  // pomyłka wraca za 2–4 zadania (natychmiastowe ponowne odpytanie po informacji zwrotnej)
  failed(key) {
    if (this.requeue.some((x) => x.key === key)) return;
    this.requeue.push({ key, at: this.i + 2 + Math.floor(this.rng() * 3) });
  }

  vocabTask(key, r) {
    const w = wordOf(key);
    const box = r ? r.b : 0;
    const voice = this.save.settings.voice;
    const noRead = this.profile.noReading;
    const first = !r && !this.introduced.has(key);
    const L = letters(w.en).length;
    const canType = !noRead && L <= MAX_TYPE, canSpell = !noRead && L <= MAX_SPELL;
    let types;
    if (noRead) types = box <= 1 ? ["listen2pic", "listen2pic", "pic2listen"] : ["listen2pic", "pic2listen", "pic2listen"];
    // Czytający NIE dostają zadań opartych tylko na głosie syntezatora (jakość wymowy zależy od urządzenia).
    else if (box <= 0) types = ["word2pic", "pic2word", "word2pic"];
    else if (box === 1) types = ["word2pic", "pic2word", "pl2en", "word2pic"];
    else if (box === 2) types = ["pic2word", "pl2en", "word2pic", "spell"];
    else if (box === 3) types = ["spell", "type", "pl2en", "pic2word"];
    else types = ["type", "type", "spell", "pl2en"];
    let type = pick(types, this.rng);
    if (type === "type" && !canType) type = canSpell ? "spell" : "pl2en";
    if (type === "spell" && !canSpell) type = canType ? "type" : "pl2en";
    const t = { key, skill: skillOf(key), kind: "vocab", type, word: w, intro: first, voice, v: this.rng(), firstTry: !r, canStrong: canType || canSpell };
    if (first) this.introduced.add(key);
    // dystraktory: najpierw ten sam temat, potem inne; nigdy dwa takie same obrazki / słowa / tłumaczenia
    // ani dwa słowa, które przy tym obrazku mogłyby być dobre (CONFUSABLE)
    const me = [w.en, w.pl, w.img];
    const n = box <= 0 ? 2 : 3;
    const dis = [];
    const fits = (x) => !vocabConflict(x, me) && dis.every((d) => !vocabConflict(x, d));
    for (const x of shuffle(VOCAB[w.theme].words, this.rng)) { if (dis.length >= n) break; if (fits(x)) dis.push(x); }
    if (dis.length < n) for (const x of shuffle(ALL_WORDS, this.rng)) { if (dis.length >= n) break; if (fits(x)) dis.push(x); }
    t.options = shuffle([[w.en, w.pl, w.img, true], ...dis.map((d) => [d[0], d[1], d[2], false])], this.rng)
      .map(([en, pl, img, ok]) => (ok ? { en, pl, img, ok } : { en, pl, img, ok, tag: "pick:" + en }));
    if (type === "spell") {
      const ls = letters(w.en).split("");
      const low = ls.map((c) => c.toLowerCase());
      const decoy = shuffle("aeioustrnlm".split("").filter((c) => !low.includes(c)), this.rng).slice(0, 2);
      t.tiles = shuffle([...ls, ...decoy], this.rng);
      t.target = w.en;
    }
    return t;
  }

  grammarTask(key, r) {
    const [, skill, pat] = key.split(":");
    const q = SKILLS[skill].patterns[pat](this.rng, this.gopts);
    const box = r ? r.b : 0;
    const sent = isSentence(q);
    const can = {
      cloze: true,
      judge: sent && q.judgeable && q.judgeable.length > 0,
      fix: sent && q.fixable && q.fixable.length > 0,
      build: buildable(q),
      type: !!q.typeText && !this.profile.noReading,
    };
    const list = box <= 0 ? ["cloze"] : box === 1 ? ["cloze", "judge"] : box === 2 ? ["cloze", "fix", "judge", "build", "build"]
      : box === 3 ? ["build", "fix", "cloze", "type", "build"] : ["build", "type", "fix", "build", "cloze"];
    // losujemy z listy dla pudełka; niewykonalny typ → inny z tej samej listy (żeby nie zgubić produkcji), w ostateczności luka
    const type = shuffle(list, this.rng).find((x) => can[x]) || "cloze";
    const t = { key, skill, kind: "grammar", type, q, voice: this.save.settings.voice, v: this.rng(), firstTry: !r, canStrong: can.build || can.fix || can.type };
    if (type === "cloze") {
      // P1-5: literówki (watchs, runing) w luce dopiero od pudełka 2 — na początku dziecko nie ogląda błędnych form
      let ws = box < 2 ? q.wrong.filter((x) => !SPELL_TAGS.has(q.tags[x])) : q.wrong;
      if (!ws.length) ws = q.wrong;
      t.options = shuffle([{ label: q.answer, ok: true }, ...ws.slice(0, box <= 0 ? 2 : 3).map((x) => ({ label: x, ok: false, tag: q.tags[x] }))], this.rng);
    }
    if (type === "fix") {
      const wrong = pick(q.fixable, this.rng);
      t.wrongWord = wrong; t.tag = q.tags[wrong];
      const raw = q.text.replace("___", "§").split(" ");
      t.badIdx = raw.findIndex((tok) => tok.includes("§")); // dokładnie miejsce luki, nie pierwsze wystąpienie słowa
      t.tokens = raw.map((tok) => tok.replace("§", wrong));
    }
    if (type === "judge") {
      t.correct = this.rng() < 0.5;
      const wrong = pick(q.judgeable, this.rng);
      t.sentence = t.correct ? q.full : q.text.replace("___", wrong);
      t.tag = t.correct ? null : q.tags[wrong];
    }
    if (type === "build") {
      t.words = q.full.split(" ");
      const tiles = t.words.map((w, i) => ({ w, i }));
      if (DECOY_SKILLS.test(skill) && !q.answer.includes(" ")) {
        const lower = new Set(t.words.map((w) => w.toLowerCase().replace(/[.?!,]$/, "")));
        const d = q.wrong.find((x) => !x.includes(" ") && DECOY_TAGS.has(q.tags[x]) && !lower.has(x.toLowerCase()));
        if (d) {
          const idx = t.words.findIndex((w) => w.replace(/[.?!,]$/, "") === q.answer || w.replace(/[.?!,]$/, "") === q.answer[0].toUpperCase() + q.answer.slice(1));
          if (idx >= 0) {
            const orig = t.words[idx], core = orig.replace(/[.?!,]$/, ""), punct = orig.slice(core.length);
            const dw = (core[0] === core[0].toUpperCase() && core[0] !== core[0].toLowerCase() ? d[0].toUpperCase() + d.slice(1) : d) + punct;
            t.decoy = dw; tiles.push({ w: dw, i: -1 });
          }
        }
      }
      t.tiles = shuffle(tiles, this.rng);
    }
    if (type === "type") {
      // wpisywanie brakującego słowa (mechanika Spell Cast): odpowiedź jednoznaczna dzięki podpowiedzi w nawiasie
      t.word = { en: q.answer, pl: q.hint || "", img: null };
      t.typeText = q.typeText;
    }
    return t;
  }
}

// ile NOWYCH rzeczy dziecko poznało dziś (pierwsza próba dziś i wszystkie próby są w logu)
function newToday(save) {
  const d0 = new Date(Date.now()); d0.setHours(0, 0, 0, 0);
  const first = new Map(), cnt = new Map();
  for (const l of save.log || []) { if (!first.has(l[1])) first.set(l[1], l[0]); cnt.set(l[1], (cnt.get(l[1]) || 0) + 1); }
  const out = { vocab: 0, grammar: 0 };
  for (const [k, t0] of first) {
    const r = save.srs && save.srs[k];
    if (t0 >= +d0 && r && r.n <= cnt.get(k)) out[isVocab(k) ? "vocab" : "grammar"]++;
  }
  return out;
}

// prawdopodobieństwo trafienia na ślepo (do "czy to nie było zgadywanie")
export function guessRate(task) {
  if (!task) return 0;
  if (task.type === "judge") return 0.5;
  if (task.type === "fix") return task.tokens && task.tokens.length ? 1 / task.tokens.length : 0.2;
  if (STRONG.has(task.type)) return 0;
  if (task.options && task.options.length) return 1 / task.options.length;
  return 0;
}

// krótka informacja zwrotna po angielsku (A1) do karty odsłony: CO jest dobrze i DLACZEGO
export const TAG_WHY = {
  no_s: "he / she / it → verb + s", s_overuse: "I / you / we / they → no -s", s_spelling: "Look at the -s spelling!",
  ing_confusion: "A habit → no -ing here.", s_after_does: "After does / doesn't → no -s.", be_for_do: "Use do / does here.",
  do_for_be: "Use am / is / are + -ing.", ing_spelling: "Look at the -ing spelling!", be_agreement: "I am · he is · they are",
  missing_be: "Don't forget am / is / are!", missing_do: "she → doesn't + verb", like_ing: "likes + -ing: likes swimming",
  freq_order: "always / often / never → before the verb", who_meaning: "Look at the pictures: who does it?", missing_ing: "Add -ing!", s_after_modal: "After can → no -s.", to_after_modal: "After can → no \"to\".",
  have_for_there: "There is / there are (not have).", ps_for_pc: "Now → am / is / are + -ing.", pc_for_ps: "Every day → no -ing.",
  do_agreement: "he / she / it → does · I / you / we / they → do", have_agreement: "he / she / it → has got",
  be_for_have: "has got / have got (not is)", do_for_have: "hasn't got / haven't got", do_for_modal: "Can you…? Can he…?",
  be_for_modal: "Can you…? Can he…?", can_meaning: "Think: can it really do that?", there_agreement: "one → there is · many → there are",
  plural_missing: "Many things → plural!", plural_form: "Look at the plural!", word_order: "Look at the word order.",
  fix: "Look for the wrong word.", judge: "This sentence is OK!", spelling: "Look at the letters.",
};
export function feedbackFor(task, ok, tag) {
  if (ok || !task) return null;
  if (task.kind === "vocab") {
    const w = task.word;
    const fb = { why: null, picked: null };
    if (tag && tag.startsWith("pick:")) {
      const o = (task.options || []).find((x) => x.en === tag.slice(5));
      if (o) { fb.picked = { en: o.en, img: o.img }; fb.why = `That is "${o.en}". This is "${w.en}".`; }
    } else if (task.type === "type" || task.type === "spell") fb.why = `${w.en}: ${letters(w.en).toLowerCase().split("").join("-")}`;
    return fb;
  }
  const q = task.q || {};
  return { why: q.why || null, tagWhy: (tag && TAG_WHY[tag]) || null };
}

// ---------- zapis wyniku ----------
// Sukces liczy się do pudełka (powtórki rozłożone w czasie), gdy:
// - odpowiedź dobra, bez podpowiedzi, nie "za szybko" (<700 ms = klik na oślep),
// - powtórka była wymagalna (due) albo to pierwsze trafienie nowej rzeczy (0 → 1); w tym samym dniu nie skaczemy wyżej,
// - przy zadaniu z ≥50% szansą zgadnięcia (2 opcje, right/wrong) potrzebne są 2 dobre z rzędu,
// - do pudełek 4–5 (złota karta) awansuje tylko zadanie "mocne" (pisanie, literki, układanie zdania, znajdź błąd),
//   o ile dla tej rzeczy takie zadanie w ogóle istnieje (np. dziecko nieczytające → nie dotyczy).
export function record(save, task, ok, ms, tag, opts = {}) {
  const now = Date.now();
  const key = task.key;
  const r = save.srs[key] || { b: 0, due: 0, n: 0, ok: 0, last: 0 };
  const tooFast = ms < 700 && task.type !== "match";
  const pg = guessRate(task);
  r.n++; r.last = now;
  // Terminy liczone od początku lokalnego dnia (P1-1): "jutro" = od północy, niezależnie od godziny gry.
  // Odpowiedź na rzecz NIEwymagalną (powtórka w tym samym dniu) nie przesuwa terminu ani pudełka.
  const isDue = r.due <= now || r.b === 0;
  const diaMiss = !ok && !!r.dia;
  const d0 = dayStart(now);
  if (ok) {
    r.ok++;
    r.st = (r.st || 0) + 1; // dobre z rzędu (opcjonalne pole, brak = 0; nie zmienia kształtu zapisu)
    let up = !opts.hinted && !tooFast && isDue;
    if (pg > 0.34 && r.st < 2) up = false;
    if (r.b >= 3 && task.canStrong && !STRONG.has(task.type)) up = false;
    if (task.justIntroduced) up = false; // P1-6: pierwszy test tuż po karcie NEW nie liczy się do pudełka (wraca za 3–5 zadań)
    const wasGold = r.b >= 5;
    if (up) { r.b = Math.min(5, r.b + 1); r.due = d0 + BOX_DAYS[r.b] * DAY; }
    if (isVocab(key) && r.b >= 5) {
      if (r.dia) { if (isDue) r.due = d0 + DIAMOND.checkDays * DAY; } // zdany sprawdzian diamentu
      else if (!wasGold || !r.g) { r.g = r.g || now; r.gk = 0; }
      else if (up) {
        r.gk = (r.gk || 0) + 1;
        if (r.gk >= DIAMOND.reviews && now - r.g >= DIAMOND.minDays * DAY) { r.dia = now; r.due = d0 + DIAMOND.checkDays * DAY; }
      }
    }
    // brak awansu: rzecz zostaje wymagalna (np. czeka na 2. dobrą z rzędu albo na zadanie "mocne"), niewymagalna — bez zmian
  } else if (r.dia) {
    // sprawdzian diamentu nie wyszedł: z powrotem złota karta, bez kary; diament trzeba zdobyć od nowa
    r.st = 0; delete r.dia; r.g = now; r.gk = 0; r.due = d0 + DAY; r.lw = now;
  } else {
    r.st = 0; if (r.gk) r.gk = 0;
    if (isDue) { r.b = Math.max(0, r.b - 2); r.due = now; }
    else {
      // pomyłka przy powtórce w tym samym dniu: bez −2; drugi błąd tego dnia = −1; i tak wraca najpóźniej jutro (+ requeue w biegu)
      if (r.lw && r.lw >= d0) r.b = Math.max(0, r.b - 1);
      r.due = Math.min(r.due, d0 + DAY);
    }
    r.lw = now; // ostatni błąd (opcjonalne pole)
  }
  if (r.b < 5) { delete r.g; delete r.gk; }
  save.srs[key] = r;
  const sk = save.skills[task.skill] || { m: 0.3, n: 0 };
  let a = sk.n < 5 ? 0.3 : 0.12; // na początku szybciej, potem stopniowo
  if (ok) a *= 1 - pg; // trafienie, które mogło być zgadnięciem, mniej podnosi opanowanie
  sk.m = sk.m * (1 - a) + (ok ? (opts.hinted ? 0.6 : 1) : 0) * a; sk.n++;
  save.skills[task.skill] = sk;
  for (const k of Object.keys(save.confusions)) { save.confusions[k] *= 0.97; if (save.confusions[k] < 0.2) delete save.confusions[k]; }
  const vocabPick = tag && String(tag).startsWith("pick:");
  if (!ok && tag && !vocabPick) save.confusions[tag] = (save.confusions[tag] || 0) + 1;
  if (!ok && !diaMiss) { if (!save.shadows.includes(key)) save.shadows.push(key); if (save.shadows.length > 40) save.shadows.shift(); }
  else if (opts.shadowMode) save.shadows = save.shadows.filter((k) => k !== key);
  try { task.feedback = feedbackFor(task, ok, tag); } catch { task.feedback = null; }
  save.log.push([now, key, ok ? 1 : 0, Math.round(ms), tag || ""]);
  if (save.log.length > 1500) save.log.splice(0, save.log.length - 1500);
  save.stats.answers++; if (ok) save.stats.correct++;
}

// ---------- album: karty = opanowanie słówek / umiejętności ----------
export function cardTier(r) {
  if (!r) return 0;          // nieodkryta
  if (r.dia) return 5;       // diamentowa
  if (r.b >= 5) return 4;    // złota
  if (r.b >= 3) return 3;    // srebrna
  if (r.b >= 1) return 2;    // brązowa
  return 1;                  // szara (widziana)
}

// ---------- karty i odznaki ----------
// Karta albumu = pojedyncze słówko albo krótka fraza (≤ 3 słowa) z obrazkiem. Gramatyka nie ma kart, tylko odznaki.
export function isCardWord(key) {
  const w = isVocab(key) ? wordOf(key) : null;
  return !!(w && w.img && w.en && w.en.trim().split(/\s+/).length <= 3);
}
// ODZNAKA GRAMATYKI (wyliczana z srs/skills/log, nic nie zapisujemy): 0 brak, 1 brąz, 2 srebro, 3 złoto, 4 diament (sekretny).
//  brąz: każdy wzorzec zaliczony bez podpowiedzi (pudełko ≥ 1)
//  srebro: opanowanie ≥ 0.7 i każdy wzorzec w pudełku ≥ 3
//  złoto: opanowanie ≥ 0.85, każdy wzorzec w pudełku 5 (przetrwał powtórki), ≥ 16/20 dobrych w ostatnich 20 próbach
//  diament: złoto + 0 błędów w ostatnich 30 próbach
export const BADGE = { silverM: 0.7, goldM: 0.85, goldLast: 20, goldOk: 16, diamondLast: 30 };
export function badgeTier(save, skill, opts) {
  const keys = itemsForSkill(skill, opts);
  if (!keys.length || isVocab(skill)) return 0;
  const rs = keys.map((k) => save.srs[k]);
  if (!rs.every((r) => r && r.b >= 1)) return 0;
  const m = (save.skills[skill] || {}).m || 0;
  const tries = save.log.filter((l) => String(l[1]).startsWith(`g:${skill}:`));
  const last = (n) => tries.slice(-n);
  if (!(m >= BADGE.silverM && rs.every((r) => r.b >= 3))) return 1;
  const l20 = last(BADGE.goldLast);
  if (!(m >= BADGE.goldM && rs.every((r) => r.b >= 5) && l20.length >= BADGE.goldLast && l20.filter((l) => l[2]).length >= BADGE.goldOk)) return 2;
  const l30 = last(BADGE.diamondLast);
  return l30.length >= BADGE.diamondLast && l30.every((l) => l[2]) ? 4 : 3;
}

// ---------- raport dla nauczyciela ----------
export function report(save, profile) {
  const now = Date.now();
  const week = save.log.filter((l) => now - l[0] < 7 * DAY);
  const bySkill = {};
  for (const l of save.log.slice(-400)) {
    const s = skillOf(l[1]);
    (bySkill[s] = bySkill[s] || { n: 0, ok: 0 }); bySkill[s].n++; bySkill[s].ok += l[2];
  }
  const weakItems = Object.entries(save.srs).filter(([, r]) => r.n >= 2 && r.ok / r.n < 0.6)
    .sort((a, b) => a[1].ok / a[1].n - b[1].ok / b[1].n).slice(0, 12)
    .map(([k, r]) => ({ k, label: isVocab(k) ? `${wordOf(k)?.en} (${wordOf(k)?.pl})` : `${skillName(skillOf(k))} · ${k.split(":")[2]}`, acc: Math.round((r.ok / r.n) * 100), n: r.n }));
  const conf = Object.entries(save.confusions).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t, s]) => ({ tag: t, pl: CONFUSION_PL[t] || t, score: +s.toFixed(1) }));
  const days = new Set(save.log.map((l) => new Date(l[0]).toDateString()));
  return {
    weekAnswers: week.length, weekAcc: week.length ? Math.round((week.reduce((a, l) => a + l[2], 0) / week.length) * 100) : null,
    daysPlayed: days.size, streak: save.streak.count, floor: save.tower.best,
    skills: Object.entries(save.skills).map(([s, v]) => ({ s, name: skillName(s), m: Math.round(v.m * 100), n: v.n, recent: bySkill[s] ? Math.round((bySkill[s].ok / bySkill[s].n) * 100) : null }))
      .sort((a, b) => a.m - b.m),
    weakItems, conf,
    gold: Object.values(save.srs).filter((r) => r.b >= 5).length, seen: Object.keys(save.srs).length,
    shadows: shadowList(save).length, last: save.updatedAt,
    path: profile && profile.path ? pathStatus(save, profile, now) : null,
  };
}

export function reportText(save, profile, name) {
  const r = report(save, profile);
  const L = [];
  L.push(`RAPORT: ${name || save.catName || save.id} · ${new Date().toLocaleDateString("pl-PL")}`);
  L.push(`Ostatnie 7 dni: ${r.weekAnswers} odpowiedzi, skuteczność ${r.weekAcc ?? "–"}% · dni grania (łącznie): ${r.daysPlayed} · seria: ${r.streak} · najwyższe piętro: ${r.floor}`);
  L.push(`Słówka/wzorce: widziane ${r.seen}, opanowane na złoto ${r.gold}, cienie do powtórki ${r.shadows}`);
  L.push(`\nUMIEJĘTNOŚCI (opanowanie, od najsłabszych):`);
  for (const s of r.skills) L.push(`- ${s.name}: ${s.m}% (prób ${s.n}${s.recent != null ? `, ostatnio ${s.recent}%` : ""})`);
  if (r.path && r.path.length) {
    const ps = pathState(save, profile);
    const why = { pending: "czeka na pierwsze zadania z nowego kroku", today: "dziś już był nowy krok", reviews: "najpierw zaległe powtórki", floor: "któryś starszy krok < 50% — najpierw powtórki", mastery: "bieżący krok jeszcze nieopanowany (70% / 75%)" };
    L.push(`\nŚCIEŻKA (${r.path.filter((s) => s.unlocked).length}/${r.path.length} kroków otwartych${ps && ps.blocked ? `; następny: ${why[ps.blocked] || ps.blocked}` : ""}):`);
    for (const s of r.path) L.push(`${s.unlocked ? (s.current ? "▶" : "✓") : "·"} ${s.name}: ${Math.round(s.mastery * 100)}% opanowane${s.acc != null ? `, ostatnio ${Math.round(s.acc * 100)}%` : ""}`);
  }
  if (r.conf.length) { L.push(`\nWZORCE BŁĘDÓW:`); for (const c of r.conf) L.push(`- ${c.pl} (siła ${c.score})`); }
  if (r.weakItems.length) { L.push(`\nNAJSŁABSZE ELEMENTY:`); for (const w of r.weakItems) L.push(`- ${w.label}: ${w.acc}% z ${w.n}`); }
  return L.join("\n");
}
