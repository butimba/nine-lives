// SILNIK NAUKI — bez AI, bez API, za 0 zł.
// - powtórki rozłożone w czasie (pudełka 0–5),
// - wykrywanie słabych umiejętności (średnia z ostatnich prób),
// - wykrywanie wzorców błędów (który zły wariant dziecko wybiera),
// - "back to basics": jak coś długo leży, dorzuca podstawy,
// - zmiany są stopniowe (średnie kroczące, nie reakcja na pojedynczy błąd).
import VOCAB from "../data/vocab.js";
import { SKILLS } from "../data/grammar.js";
import EVENTS, { activeEvent } from "../data/events.js";
import { rngFrom } from "./art.js";
import { shuffle, pick } from "./util.js";

const DAY = 86400000;
export const BOX_DAYS = [0, 1, 2, 4, 8, 16]; // ile dni do następnej powtórki po trafieniu w danym pudełku
const NEW_CAP = { vocab: 4, grammar: 2 };

// które błędy wzmacniają którą umiejętność
const CONFUSION_SKILL = {
  ps_for_pc: "pc_vs_ps", pc_for_ps: "pc_vs_ps", no_s: "ps_3s", s_overuse: "ps_3s", s_spelling: "ps_3s",
  ing_confusion: "ps_3s", s_after_does: "ps_neg", be_for_do: "ps_neg", do_for_be: "pc", ing_spelling: "pc",
  be_agreement: "be", missing_be: "pc", s_after_modal: "can", to_after_modal: "can", have_for_there: "there",
};
export const CONFUSION_PL = {
  ps_for_pc: "używa present simple tam, gdzie trzeba continuous (teraz)", pc_for_ps: "używa continuous przy rutynach (every day)",
  no_s: "gubi -s w 3. os. (he play)", s_overuse: "dodaje -s przy I/you/we/they", s_spelling: "błędy w pisowni -s/-es/-ies",
  ing_confusion: "myli present simple z -ing", s_after_does: "dodaje -s po doesn't/does", be_for_do: "myli do/does z is/are",
  do_for_be: "myli is/are z do/does w continuous", ing_spelling: "pisownia -ing (running, dancing)", be_agreement: "zły wybór am/is/are",
  missing_be: "pomija am/is/are przed -ing", s_after_modal: "dodaje -s po can", to_after_modal: "wstawia 'to' po can", have_for_there: "there have zamiast there is/are",
};

// ---------- katalog ----------
export function itemsForSkill(skill) {
  if (skill.startsWith("v:")) {
    const th = VOCAB[skill.slice(2)];
    return th ? th.words.map((w) => `v:${skill.slice(2)}:${w[0]}`) : [];
  }
  const sk = SKILLS[skill];
  return sk ? Object.keys(sk.patterns).map((p) => `g:${skill}:${p}`) : [];
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

// aktywne umiejętności gracza: plan od nauczyciela + wydarzenie + back-to-basics + wzorce błędów
export function activeSkills(save, profile, date = new Date()) {
  const set = new Map();
  for (const s of profile.focus || []) set.set(s, 1);
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
    if (score >= 2.5 && sk && (set.has(sk) || hasGrammar(set))) set.set(sk, Math.max(set.get(sk) || 0, 1.8));
  }
  if (profile.noReading) for (const k of [...set.keys()]) if (!k.startsWith("v:")) set.delete(k);
  return set;
}
const hasGrammar = (set) => [...set.keys()].some((k) => !k.startsWith("v:"));

// "zapomniane słowa" = jawne cienie + rzeczy mocno przeterminowane
export function shadowList(save, now = Date.now()) {
  const extra = Object.entries(save.srs).filter(([k, r]) => r.b >= 1 && r.due && now - r.due > 7 * DAY).map(([k]) => k);
  return [...new Set([...save.shadows, ...extra])].filter((k) => (isVocab(k) ? wordOf(k) : SKILLS[skillOf(k)]));
}

// ---------- wybór następnego zadania ----------
export class Session {
  constructor(save, profile, mode = "tower", seed = Date.now()) {
    this.save = save; this.profile = profile; this.mode = mode;
    this.rng = rngFrom(seed);
    this.recent = []; this.requeue = []; this.newCount = { vocab: 0, grammar: 0 }; this.i = 0;
    this.skills = activeSkills(save, profile);
    this.pool = mode === "shadow" ? shadowList(save) : [...this.skills.keys()].flatMap(itemsForSkill);
    this.introduced = new Set();
  }
  pickKey() {
    const now = Date.now();
    const rq = this.requeue.findIndex((r) => r.at <= this.i);
    if (rq >= 0) return this.requeue.splice(rq, 1)[0].key;
    const shadows = new Set(this.save.shadows);
    const cands = [];
    for (const key of this.pool) {
      if (this.recent.slice(-4).includes(key)) continue;
      const r = this.save.srs[key];
      const kind = isVocab(key) ? "vocab" : "grammar";
      const sk = this.save.skills[skillOf(key)] || { m: 0.3, n: 0 };
      let w;
      if (!r) w = this.newCount[kind] < NEW_CAP[kind] ? 3 : 0;
      else if (r.due <= now) w = 6 + (5 - r.b);
      else w = r.b <= 2 ? 0.8 : 0.15;
      if (this.mode === "shadow") w = 3;
      w *= (1.6 - sk.m) * (this.skills.get(skillOf(key)) || 1);
      if (shadows.has(key)) w *= 1.5;
      if (w > 0) cands.push([key, w]);
    }
    if (!cands.length) return this.pool.length ? pick(this.pool, this.rng) : null;
    let t = cands.reduce((a, c) => a + c[1], 0) * this.rng();
    for (const [k, w] of cands) { t -= w; if (t <= 0) return k; }
    return cands[cands.length - 1][0];
  }
  next() {
    const key = this.pickKey();
    if (!key) return null;
    this.i++;
    this.recent.push(key);
    const r = this.save.srs[key];
    if (!r) this.newCount[isVocab(key) ? "vocab" : "grammar"]++;
    return isVocab(key) ? this.vocabTask(key, r) : this.grammarTask(key, r);
  }
  // pomyłka wraca za 2–4 zadania
  failed(key) { this.requeue.push({ key, at: this.i + 2 + Math.floor(this.rng() * 3) }); }

  vocabTask(key, r) {
    const w = wordOf(key);
    const box = r ? r.b : 0;
    const voice = this.save.settings.voice;
    const noRead = this.profile.noReading;
    const first = !r && !this.introduced.has(key);
    let types;
    if (noRead) types = box <= 1 ? ["listen2pic", "listen2pic", "pic2listen"] : ["listen2pic", "pic2listen", "pic2listen"];
    else if (box <= 0) types = ["word2pic", "listen2pic", "pic2word"];
    else if (box === 1) types = ["word2pic", "pic2word", "listen2pic", "pic2word"];
    else if (box === 2) types = ["pic2word", "pl2en", "match", "listen2pic"];
    else if (box === 3) types = ["spell", "pl2en", "pic2word", "match"];
    else types = ["type", "spell", "type", "pl2en"];
    let type = pick(types, this.rng);
    if (type === "match" && this.pool.filter(isVocab).length < 4) type = "pic2word";
    const t = { key, skill: skillOf(key), kind: "vocab", type, word: w, intro: first, voice };
    if (first) this.introduced.add(key);
    // dystraktory: z tego samego tematu, potem z innych
    const same = VOCAB[w.theme].words.filter((x) => x[0] !== w.en && x[2] !== w.img);
    const other = Object.values(VOCAB).flatMap((th) => th.words).filter((x) => x[0] !== w.en && x[2] !== w.img && x[1] !== w.pl);
    const n = box <= 0 ? 2 : 3;
    const dis = shuffle(same, this.rng).slice(0, n);
    while (dis.length < n) { const o = pick(other, this.rng); if (!dis.find((d) => d[0] === o[0] || d[2] === o[2])) dis.push(o); }
    t.options = shuffle([[w.en, w.pl, w.img, true], ...dis.map((d) => [d[0], d[1], d[2], false])], this.rng)
      .map(([en, pl, img, ok]) => ({ en, pl, img, ok }));
    if (type === "match") {
      const pool = shuffle(this.pool.filter((k) => isVocab(k) && k !== key && this.save.srs[k]), this.rng)
        .map(wordOf).filter((x) => x && x.img !== w.img);
      const uniq = []; for (const x of pool) if (!uniq.find((u) => u.img === x.img || u.en === x.en)) uniq.push(x);
      t.pairs = shuffle([w, ...uniq.slice(0, 3)], this.rng);
      if (t.pairs.length < 3) t.type = "pic2word";
    }
    if (type === "spell") {
      const letters = w.en.replace(/[^a-zA-Z]/g, "").split("");
      const decoy = shuffle("aeioustrnlm".split("").filter((c) => !letters.includes(c)), this.rng).slice(0, 2);
      t.tiles = shuffle([...letters, ...decoy], this.rng);
      t.target = w.en;
    }
    return t;
  }

  grammarTask(key, r) {
    const [, skill, pat] = key.split(":");
    const q = SKILLS[skill].patterns[pat](this.rng);
    const box = r ? r.b : 0;
    let types = box <= 1 ? ["cloze"] : box === 2 ? ["cloze", "cloze", "fix", "judge"] : ["build", "fix", "cloze", "build"];
    let type = pick(types, this.rng);
    const singleWrong = q.wrong.filter((x) => !x.includes(" ") && !q.answer.includes(" "));
    // zadania w formacie "one box → two ___" albo "pytanie — ___" to nie są zdania: tylko luka do uzupełnienia
    const notSentence = /[→—]/.test(q.text);
    if (notSentence) type = "cloze";
    if (type === "fix" && !singleWrong.length) type = "cloze";
    if (type === "build" && (!q.full || q.full.split(" ").length > 9 || q.full.includes("—") || q.full.includes("→"))) type = "cloze";
    const t = { key, skill, kind: "grammar", type, q, voice: this.save.settings.voice };
    if (type === "cloze") t.options = shuffle([{ label: q.answer, ok: true }, ...q.wrong.slice(0, box <= 0 ? 2 : 3).map((x) => ({ label: x, ok: false, tag: q.tags[x] }))], this.rng);
    if (type === "fix") {
      const wrong = pick(singleWrong, this.rng);
      t.wrongWord = wrong; t.tag = q.tags[wrong];
      const raw = q.text.replace("___", "§").split(" ");
      t.badIdx = raw.findIndex((tok) => tok.includes("§")); // dokładnie to miejsce, nie pierwsze wystąpienie słowa
      t.tokens = raw.map((tok) => tok.replace("§", wrong));
    }
    if (type === "judge") {
      t.correct = this.rng() < 0.5;
      const wrong = pick(q.wrong, this.rng);
      t.sentence = t.correct ? q.full : q.text.replace("___", wrong);
      t.tag = t.correct ? null : q.tags[wrong];
    }
    if (type === "build") {
      t.words = q.full.split(" ");
      t.tiles = shuffle(t.words.map((w, i) => ({ w, i })), this.rng);
    }
    return t;
  }
}

// ---------- zapis wyniku ----------
export function record(save, task, ok, ms, tag, opts = {}) {
  const now = Date.now();
  const key = task.key;
  const r = save.srs[key] || { b: 0, due: 0, n: 0, ok: 0, last: 0 };
  const tooFast = ms < 700 && task.type !== "match";
  r.n++; r.last = now;
  if (ok) {
    r.ok++;
    if (!opts.hinted && !tooFast && (r.due <= now || r.b <= 1)) r.b = Math.min(5, r.b + 1);
    r.due = now + BOX_DAYS[r.b] * DAY - 3600000; // godzina zapasu, żeby "jutro rano" już liczyło się jako jutro
  } else {
    r.b = Math.max(0, r.b - 2);
    r.due = now;
  }
  save.srs[key] = r;
  const sk = save.skills[task.skill] || { m: 0.3, n: 0 };
  const a = sk.n < 5 ? 0.3 : 0.12; // na początku szybciej, potem stopniowo
  sk.m = sk.m * (1 - a) + (ok ? (opts.hinted ? 0.6 : 1) : 0) * a; sk.n++;
  save.skills[task.skill] = sk;
  for (const k of Object.keys(save.confusions)) { save.confusions[k] *= 0.97; if (save.confusions[k] < 0.2) delete save.confusions[k]; }
  if (!ok && tag) save.confusions[tag] = (save.confusions[tag] || 0) + 1;
  if (!ok) { if (!save.shadows.includes(key)) save.shadows.push(key); if (save.shadows.length > 40) save.shadows.shift(); }
  else if (opts.shadowMode) save.shadows = save.shadows.filter((k) => k !== key);
  save.log.push([now, key, ok ? 1 : 0, Math.round(ms), tag || ""]);
  if (save.log.length > 1500) save.log.splice(0, save.log.length - 1500);
  save.stats.answers++; if (ok) save.stats.correct++;
}

// ---------- album: karty = opanowanie słówek / umiejętności ----------
export function cardTier(r) {
  if (!r) return 0;          // nieodkryta
  if (r.b >= 5) return 4;    // złota
  if (r.b >= 3) return 3;    // srebrna
  if (r.b >= 1) return 2;    // brązowa
  return 1;                  // szara (widziana)
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
  if (r.conf.length) { L.push(`\nWZORCE BŁĘDÓW:`); for (const c of r.conf) L.push(`- ${c.pl} (siła ${c.score})`); }
  if (r.weakItems.length) { L.push(`\nNAJSŁABSZE ELEMENTY:`); for (const w of r.weakItems) L.push(`- ${w.label}: ${w.acc}% z ${w.n}`); }
  return L.join("\n");
}
