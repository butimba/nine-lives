// WALIDATOR TREŚCI I ZADAŃ — uruchom przed każdą publikacją: node tools/check-grammar.mjs  (musi być: ALL BAD 0)
// 1) każdy wzorzec gramatyki × 2000 zdań: kształt, tagi, wyjaśnienia, sensowność (zwierzęta, pory dnia, wiek),
//    "mini-wyrocznia": żadna zła opcja nie może dawać poprawnego zdania (np. "Do you swim?" przy can),
// 2) słówka: duplikaty, emoji, mylące się pary,
// 3) symulacja KAŻDEGO typu zadania i KAŻDEGO przypisania mechaniki (planTask) dla każdego słówka i wzorca na każdym pudełku,
//    także dla profilu nieczytającego (Bruno),
// 4) symulacja sesji/dni gry: udział tematu głównego, różnorodność zadań, limity nowych rzeczy, złoto tylko za "mocne" zadania,
// 5) tryb "3s" (Łucja, Matylda): żadnych I / you / we / they ani podmiotów w liczbie mnogiej,
// 6) ŚCIEŻKA: 30 dni gry profilami Łucji i Matyldy — kroki otwierają się stopniowo (max 1 dziennie), powtórki dominują.
import { SKILLS, VERBS, EXTRA_VERBS } from "../data/grammar.js";
import EVENTS, { activeEvent } from "../data/events.js";
import VOCAB, { CONFUSABLE } from "../data/vocab.js";
import { rngFrom } from "../js/art.js";
import { Session, record, buildable, vocabConflict, STRONG, MAIN_SHARE, feedbackFor, CONFUSION_PL, wordOf, pathState, pathStatus, expandPath, itemsForSkill, setCurriculum } from "../js/engine.js";
import { existsSync, readFileSync } from "fs";
const ROSTER_SRC = JSON.parse(readFileSync(new URL("./roster-src.json", import.meta.url)));
if (existsSync(new URL("../data/curriculum.js", import.meta.url))) setCurriculum(await import("../data/curriculum.js"));
import { planTask, MECHANICS, answerOf } from "../js/game/mechanics/index.js";

const BAD = {}; let ALLBAD = 0;
const shown = {};
function bad(section, msg, obj) {
  BAD[section] = (BAD[section] || 0) + 1; ALLBAD++;
  shown[section] = (shown[section] || 0) + 1;
  if (shown[section] <= 8) console.log(`  ✗ [${section}] ${msg}`, obj ? JSON.stringify(obj).slice(0, 300) : "");
}

// ---------------------------------------------------------------- 1) wzorce gramatyki
const ANIMAL_RX = /^(?:Look! |Listen! |Shh! |Does |Do |Is |Are )?(my cat|the dog|the cats|the cat|your cat|your dog)\b/i;
const ANIMAL_VERBS = /\b(play(s|ing)? with a ball|likes? (fish|milk)|eat(s|ing)? fish|drink(s|ing)? (milk|water)|sleep(s|ing)?|run(s|ning)? in the park|climb(s|ing)? trees|go(es|ing)? to the park|watch(es|ing)? birds|sitting|hiding|running|eating|sleeping|blue eyes|long hair|a toy mouse|a car|a phone|any brothers|cold|sad|at home|happy|tired|hungry|scared|in the garden|ten years old|my friends?|isn't|aren't|swim|jump high|climb trees|milk|fish|eat|sleep)\b/;
const SENSE = [
  [/breakfast.*every evening|dinner.*every morning|lunch.*every (morning|evening)/, "pora dnia nie pasuje"],
  [/to school (at the weekend|after school|every evening)/, "do szkoły w weekend/wieczorem"],
  [/^I am my friend|^We are my friends|^My friends are my friends/, "bez sensu: my friend"],
  [/^(Grandma|My mum|The witch|My parents|My teacher|My dad) (is|are) ten years old/, "wiek nie pasuje"],
  [/likes? .* (every|on |at the|after)/, "like + określenie czasu"],
  [/^Listen! .* (sleeping|reading|writing|drawing|eating|drinking|cooking|dancing)/, "Listen! przy cichej czynności"],
  [/\bnow\b.*\bnow\b/, "podwójne now"],
  [/fishes|busses/, "dystraktor może być poprawny (fishes / busses)"],
];
const SUBJ_NUM = (s) => {
  const x = s.toLowerCase();
  if (x === "i") return "1s";
  if (["you", "we", "they", "my friends", "tom and mia", "the cats", "my parents"].includes(x)) return "pl";
  return "3s";
};
const BASE = new Set(VERBS.map((v) => v.b).concat(EXTRA_VERBS, ["swim", "cook", "jump", "count", "whistle", "climb", "dance", "sing", "ride", "speak", "walk", "fly", "run", "drive"]));
const FAMILY = (w) => (/^(do|does|don't|doesn't)$/i.test(w) ? "do" : /^(have|has|haven't|hasn't)$/i.test(w) ? "have" : /^(am|is|are|am not|isn't|aren't)$/i.test(w) ? "be" : /^(can|can't)$/i.test(w) ? "can" : null);
const WH = /^(What|Where|When|What time|Who|How often)$/;
const AGREES = { do: ["1s", "pl"], does: ["3s"], "don't": ["1s", "pl"], "doesn't": ["3s"], am: ["1s"], "am not": ["1s"], is: ["3s"], "isn't": ["3s"], are: ["pl"], "aren't": ["pl"], have: ["1s", "pl"], has: ["3s"], "haven't": ["1s", "pl"], "hasn't": ["3s"] };
// mini-wyrocznia: czy zła opcja wstawiona w lukę daje poprawne zdanie?
function alsoCorrect(q, w) {
  const m = q.text.match(/^(?:(Look!|Listen!|Shh!) )?(.*?)\s*___\s*(.*)$/);
  if (!m) return false;
  const before = m[2].trim(), after = m[3].trim();
  const next = after.split(" ")[0] || "";
  const lw = w.toLowerCase();
  // krótka odpowiedź: "Has Mia got a dog? — Yes, she ___." / "Who plays…? — Tom ___." → ta sama rodzina operatora co w pytaniu + zgoda z osobą
  const sa = before.match(/^(.*\?) — (?:(?:Yes|No), )?(.*)$/);
  if (sa && AGREES[lw]) {
    const qw = sa[1].split(" ");
    const fam = qw[0] === "Who" ? (FAMILY(qw[1]) || "do") : FAMILY(qw[0]);
    return FAMILY(lw) === fam && AGREES[lw].includes(SUBJ_NUM(sa[2]));
  }
  if (AGREES[lw]) {
    let subj = before;
    if (WH.test(before)) subj = after.split(" ").slice(0, /^(your|the|my) /.test(after) ? 2 : 1).join(" ");
    if (!before) subj = after.split(" ").slice(0, after.startsWith("your ") || after.startsWith("the ") || after.startsWith("my ") ? 2 : 1).join(" "); // pytanie: ___ you swim?
    if (/ and /.test(after) && !before) subj = "tom and mia";
    if (before === "There") subj = /^(a|an) /.test(after) ? "it" : "they";
    if (!AGREES[lw].includes(SUBJ_NUM(subj))) return false;
    const vAfter = before && !WH.test(before) ? next : after.split(" ")[subj.split(" ").length] || "";
    const v = vAfter.replace(/[.?!]$/, "");
    if (["do", "does", "don't", "doesn't"].includes(lw)) return BASE.has(v);
    if (["have", "has", "haven't", "hasn't"].includes(lw)) return v === "got";
    return !BASE.has(v) && v !== "got"; // be + -ing / przymiotnik / miejsce (nie: is got)
  }
  return false;
}
for (const [sk, def] of Object.entries(SKILLS)) for (const [p, fn] of Object.entries(def.patterns)) {
  const rng = rngFrom(sk + p);
  const seen = new Set();
  for (let i = 0; i < 2000; i++) {
    const q = fn(rng);
    const all = [q.answer, ...q.wrong];
    const s = JSON.stringify(q);
    const id = `${sk}:${p}`;
    if (s.includes("undefined") || s.includes("NaN")) bad("pattern", `${id} undefined`, q);
    if (new Set(all).size !== all.length) bad("pattern", `${id} dup opts`, q);
    if (q.wrong.length < 1) bad("pattern", `${id} no wrong`, q);
    if ((q.text.match(/___/g) || []).length !== 1) bad("pattern", `${id} gap count`, q);
    if (/  /.test(q.text) || /  /.test(q.full) || / [.?!]/.test(q.full)) bad("pattern", `${id} spacing`, q);
    if (!/[→]/.test(q.text) && q.full !== q.text.replace("___", q.answer)) bad("pattern", `${id} full ≠ text+answer`, q);
    if (!q.hint || !q.why) bad("pattern", `${id} brak hint/why`, q);
    for (const w of q.wrong) if (!q.tags[w]) bad("pattern", `${id} zła opcja bez tagu: ${w}`, q);
    for (const w of q.wrong) if (q.tags[w] && !CONFUSION_PL[q.tags[w]]) bad("pattern", `${id} tag bez opisu PL: ${q.tags[w]}`);
    if (!Array.isArray(q.fixable) || !Array.isArray(q.judgeable)) bad("pattern", `${id} brak fixable/judgeable`);
    for (const w of q.fixable || []) if (!q.wrong.includes(w) || w.includes(" ")) bad("pattern", `${id} fixable spoza wrong`, q);
    for (const w of q.judgeable || []) if (!q.wrong.includes(w)) bad("pattern", `${id} judgeable spoza wrong`, q);
    if (q.typeText && !q.typeText.includes("___")) bad("pattern", `${id} typeText bez luki`, q);
    if (q.typeText && !/^[a-z]+$/.test(q.answer)) bad("pattern", `${id} wpisywanie z nie-jednym słowem`, q);
    if (q.typeText && q.cue && !q.typeText.includes(`(${q.cue})`)) bad("pattern", `${id} typeText bez podpowiedzi`, q);
    // sensowność
    const am = q.full.match(ANIMAL_RX);
    if (am && !ANIMAL_VERBS.test(q.full.slice(am.index + am[0].length))) bad("sense", `${id} zwierzę robi coś dziwnego: "${q.full}"`);
    for (const [rx, why] of SENSE) if (rx.test(q.full) || q.wrong.some((w) => rx === SENSE[7][0] && rx.test(w))) bad("sense", `${id} ${why}: "${q.full}"`);
    for (const w of q.wrong) if (alsoCorrect(q, w)) bad("ambiguous", `${id} zła opcja daje poprawne zdanie: "${q.text.replace("___", w)}"`);
    seen.add(q.full);
  }
  console.log(`${(sk + ":" + p).padEnd(22)} ${String(seen.size).padStart(5)} unique | ${[...seen].slice(0, 2).join(" | ")}`);
}

// ---------------------------------------------------------------- 1b) tryb "3s": tylko he / she / it
const NOT3S = /\b(I|[Yy]ou|[Ww]e|[Tt]hey|My friends|my friends|Tom and Mia|The cats|My parents|Birds|Fish|Cats|Dogs)\b/;
{
  let n = 0;
  for (const [sk, def] of Object.entries(SKILLS)) for (const [p, fn] of Object.entries(def.patterns)) {
    if ((def.skip3s || []).includes(p)) continue;
    const rng = rngFrom("3s" + sk + p);
    for (let i = 0; i < 600; i++) {
      const q = fn(rng, { subjects: "3s" }); n++;
      const subjPart = q.full.replace(/ — .*$/, "");
      // "my friend" jako orzecznik jest OK; sprawdzamy podmioty i zaimki
      if (NOT3S.test(subjPart.replace(/is my friend/, "")) || NOT3S.test(q.full)) bad("3s", `${sk}:${p} podmiot spoza 3. osoby: "${q.full}"`);
      for (const w of q.wrong) if (alsoCorrect(q, w)) bad("ambiguous", `${sk}:${p} (3s) zła opcja daje poprawne zdanie: "${q.text.replace("___", w)}"`);
      if (def.only3s && /\b(do|don't|are|aren't|have|haven't)\b/.test(q.full.replace(/ — .*$/, "").replace(/\bhave (breakfast|lunch|dinner)\b/, "").replace(/\bdo (his|her) homework\b/, ""))) bad("3s", `${sk}:${p} forma nie-3s w poprawnym zdaniu: "${q.full}"`);
    }
  }
  // silnik: profil 3s nie dostaje wzorców skip3s
  const s3 = new Session({ id: "t", srs: {}, skills: {}, confusions: {}, shadows: ["g:ps_3s:no_s", "g:can:facts"], settings: { voice: false }, log: [], stats: { answers: 0, correct: 0 } },
    { focus: ["ps_3s", "can"], subjects: "3s" }, "tower", 1);
  if (s3.pool.some((k) => k === "g:ps_3s:no_s" || k === "g:can:facts")) bad("3s", "Session 3s: w puli jest wzorzec skip3s");
  const s3s = new Session({ id: "t", srs: {}, skills: {}, confusions: {}, shadows: ["g:ps_3s:no_s", "g:ps_3s:plain"], settings: { voice: false }, log: [], stats: { answers: 0, correct: 0 } },
    { focus: ["ps_3s"], subjects: "3s" }, "shadow", 1);
  if (s3s.pool.includes("g:ps_3s:no_s")) bad("3s", "Shadow Cellar 3s: wzorzec skip3s w puli");
  console.log(`3s mode: ${n} zdań sprawdzonych`);
}

// ---------------------------------------------------------------- 2) słówka
{
  const words = [];
  for (const [th, def] of Object.entries(VOCAB)) {
    const ens = new Set();
    for (const w of def.words) {
      if (w.length !== 3 || !w[0] || !w[1] || !w[2]) bad("vocab", `${th} zły wpis`, w);
      if (ens.has(w[0])) bad("vocab", `${th} duplikat ${w[0]}`);
      ens.add(w[0]);
      if (/[🩷🪟🪨🪆]/u.test(w[2])) bad("vocab", `${th} zakazane emoji ${w[0]}`);
      words.push([th, ...w]);
    }
    if (def.words.length < 4) bad("vocab", `${th} za mało słów na dystraktory`);
  }
  // to samo emoji = to samo słowo angielskie (albo para w CONFUSABLE) — inaczej obrazek jest dwuznaczny
  const byImg = new Map();
  for (const [th, en, , img] of words) (byImg.get(img) || byImg.set(img, new Set()).get(img)).add(en);
  for (const [img, ens] of byImg) {
    const list = [...ens];
    for (const a of list) for (const b of list) if (a < b && !vocabConflict([a, "p1", "x"], [b, "p2", "y"])) bad("vocab", `emoji ${img} dla "${a}" i "${b}" bez wpisu w CONFUSABLE`);
  }
  const allEn = new Set(words.map((w) => w[1]));
  for (const g of CONFUSABLE) for (const x of g) if (!allEn.has(x.replace(/^\*/, ""))) bad("vocab", `CONFUSABLE: nieznane słowo "${x}"`);
  console.log(`vocab: ${words.length} słów w ${Object.keys(VOCAB).length} tematach, ${CONFUSABLE.length} grup mylących się słów`);
}

// ---------------------------------------------------------------- 3) symulacja zadań + mechanik
const freshSave = () => ({ id: "t", srs: {}, skills: {}, confusions: {}, shadows: [], settings: { voice: false, pl: true }, log: [], stats: { answers: 0, correct: 0 } });
const counts = { types: {}, mechs: {} };
const inc = (o, k) => (o[k] = (o[k] || 0) + 1);
function checkPlan(task, profile, where) {
  let plan;
  try { plan = planTask({ ...task, q: task.q, word: task.word }, profile, { voice: !!profile.voice, pl: true }); } catch (e) { bad("plan", `${where} planTask throws ${e.message}`); return; }
  if (!MECHANICS[plan.mech]) bad("plan", `${where} nieznana mechanika ${plan.mech}`);
  const p = plan.prompt;
  if (p.say && /___|[→—]/.test(p.say)) bad("plan", `${where} TTS czyta symbole: ${p.say}`);
  if (profile.noReading) {
    if (!["listen2pic", "pic2listen"].includes(plan.task.type)) bad("noread", `${where} nieczytający dostał ${plan.task.type}`);
    if (p.text) bad("noread", `${where} tekst dla nieczytającego: ${p.text}`);
    if (plan.task.type === "listen2pic" && !(p.say && p.autoSay)) bad("noread", `${where} listen2pic bez dźwięku`);
    if (plan.task.type === "pic2listen" && !p.img) bad("noread", `${where} pic2listen bez obrazka`);
  }
  if (["spell", "type"].includes(plan.task.type) && plan.task.kind === "grammar" && !p.text.includes("___")) bad("plan", `${where} wpisywanie bez zdania`);
  if (plan.task.type === "pic2word" && !p.img) bad("plan", `${where} pic2word bez obrazka`);
  if (plan.task.type === "word2pic" && !p.text && !profile.noReading) bad("plan", `${where} word2pic bez słowa`);
  const a = answerOf(plan.task);
  if (!a || !a.en) bad("plan", `${where} brak odpowiedzi do odsłony`);
  inc(counts.mechs, plan.mech);
}
// P1-5: tylko realne błędy pisowni (reguła -es / -ies / has / podwajanie / nieme -e)
const SPELL_WHITELIST = new Set(["watchs", "gos", "dos", "washs", "brushs", "haves", "studys", "flys", "carrys", "teachs", "tidys",
  "runing", "swiming", "siting", "shoping", "danceing", "smileing", "skateing", "hideing", "rideing"]);
function checkGrammarTask(t, where) {
  const q = t.q;
  inc(counts.types, "g:" + t.type);
  if (t.type === "cloze") {
    const labels = t.options.map((o) => o.label);
    const box = t.firstTry ? 0 : (t._box ?? 9);
    for (const o of t.options) if (!o.ok && ["s_spelling", "ing_spelling"].includes(o.tag)) {
      if (!SPELL_WHITELIST.has(o.label)) bad("spelling", `${where} nierealna literówka: ${o.label}`);
      if (box < 2 && q.wrong.some((w) => !["s_spelling", "ing_spelling"].includes(q.tags[w]))) bad("spelling", `${where} literówka w luce przy pudełku ${box}: ${o.label}`);
    }
    if (new Set(labels).size !== labels.length) bad("task", `${where} cloze dup`, labels);
    if (t.options.filter((o) => o.ok).length !== 1) bad("task", `${where} cloze ≠1 dobra`);
    if (!t.options.find((o) => o.ok && o.label === q.answer)) bad("task", `${where} cloze brak odpowiedzi`);
    if (t.options.length < 2) bad("task", `${where} cloze <2 opcje`);
    for (const o of t.options) if (!o.ok && !o.tag) bad("task", `${where} cloze opcja bez tagu`, o);
  } else if (t.type === "fix") {
    const fixed = t.tokens.map((w, j) => (j === t.badIdx ? w.replace(t.wrongWord, q.answer) : w)).join(" ");
    if (t.badIdx < 0) bad("task", `${where} badIdx<0`);
    if (fixed !== q.full) bad("task", `${where} fix→ "${fixed}" ≠ "${q.full}"`);
    // niezależnie od grammar.js: błąd zgodności podmiotu (he play → we play), pomocnika (isn't play → isn't playing)
    // czy znaczenia (can walk → can swim) da się "naprawić" w innym klocku → nie wolno
    const FIX_OK = ["s_spelling", "ing_spelling", "ing_confusion", "missing_be", "there_agreement"];
    const tg = q.tags[t.wrongWord];
    if (!(FIX_OK.includes(tg) || (tg === "ps_for_pc" && /(right now|at the moment)\.$/.test(q.full)))) bad("task", `${where} fix z błędem naprawialnym gdzie indziej (${tg}): ${t.tokens.join(" ")}`);
    if (!q.fixable.includes(t.wrongWord)) bad("task", `${where} fix na niebezpiecznym błędzie ${t.wrongWord} (${q.tags[t.wrongWord]})`);
    if (/[→—]/.test(t.tokens.join(" "))) bad("task", `${where} fix na nie-zdaniu`);
    if (t.tokens.filter((x) => x === t.tokens[t.badIdx]).length > 1) bad("task", `${where} fix: błędny klocek występuje 2×`, t.tokens);
  } else if (t.type === "judge") {
    if (/[→—]/.test(t.sentence)) bad("task", `${where} judge na nie-zdaniu`);
    if (t.correct && t.sentence !== q.full) bad("task", `${where} judge correct≠full`);
    if (!t.correct && ["ps_for_pc", "pc_for_ps", "can_meaning"].includes(t.tag)) bad("task", `${where} judge: zdanie może być poprawne w innym znaczeniu: ${t.sentence}`);
    if (!t.correct && (t.sentence === q.full || !q.judgeable.some((w) => q.text.replace("___", w) === t.sentence))) bad("task", `${where} judge zły wariant spoza judgeable`, t.sentence);
  } else if (t.type === "build") {
    if (!buildable(q)) bad("task", `${where} build na niejednoznacznym zdaniu`, q.full);
    if (t.words.join(" ") !== q.full) bad("task", `${where} build≠full`);
    if (t.tiles.map((x) => x.w).sort().join("|") !== [...t.words, ...(t.decoy ? [t.decoy] : [])].sort().join("|")) bad("task", `${where} klocki ≠ słowa (+wabik)`);
    if (t.decoy) {
      // P1-3: wabik = zła forma z q.wrong; zdanie z wabikiem w miejscu odpowiedzi jest niepoprawne; dokładnie 1 wabik
      const core = t.decoy.replace(/[.?!,]$/, "");
      if (!q.wrong.some((w) => w.toLowerCase() === core.toLowerCase())) bad("task", `${where} wabik spoza złych opcji: ${t.decoy}`);
      if (t.words.includes(t.decoy)) bad("task", `${where} wabik = słowo ze zdania`);
      if (t.tiles.filter((x) => x.i === -1).length !== 1) bad("task", `${where} ≠1 wabik`);
      counts.decoy = (counts.decoy || 0) + 1;
    } else if (/^(ps_3s|ps_neg:base_after|ps_q)/.test(t.key.slice(2)) && !q.answer.includes(" ") && q.wrong.some((w) => ["no_s", "s_after_does", "do_agreement"].includes(q.tags[w]))) bad("task", `${where} build bez wabika`);
  } else if (t.type === "type") {
    if (!t.word || t.word.en !== q.answer || !/^[a-z]+$/.test(q.answer)) bad("task", `${where} type: zła odpowiedź`, q);
    if (!t.typeText || !t.typeText.includes("___")) bad("task", `${where} type bez luki`);
  } else bad("task", `${where} nieznany typ ${t.type}`);
}
// gramatyka: każdy wzorzec × każde pudełko
{
  let n = 0;
  const save = freshSave();
  for (const [sk, def] of Object.entries(SKILLS)) for (const p of Object.keys(def.patterns)) {
    const key = `g:${sk}:${p}`;
    for (const box of [null, 0, 1, 2, 3, 4, 5]) {
      if (box === null) delete save.srs[key]; else save.srs[key] = { b: box, due: 0, n: 1, ok: 1, last: 0 };
      const prof3 = box === 3 || box === 1 ? { focus: [sk], subjects: "3s" } : { focus: [sk] };
      if (prof3.subjects && (def.skip3s || []).includes(p)) continue;
      const s = new Session(save, prof3, "tower", sk.length * 31 + (box ?? 9) + p.length);
      for (let i = 0; i < 250; i++) {
        const t = s.grammarTask(key, save.srs[key]); n++; t._box = save.srs[key] ? save.srs[key].b : 0;
        checkGrammarTask(t, `${key}@${box}`);
        if (prof3.subjects && NOT3S.test(t.q.full)) bad("3s", `${key}@${box} zadanie 3s z podmiotem spoza 3. osoby: ${t.q.full}`);
        checkPlan(t, {}, `${key}@${box}`);
        const fb = feedbackFor(t, false, t.tag || (t.options && t.options.find((o) => !o.ok)?.tag) || null);
        if (!fb || !fb.why) bad("feedback", `${key} brak wyjaśnienia`);
      }
    }
  }
  console.log(`grammar task sim: ${n}`);
}
// słówka: każde słowo × każde pudełko, czytający i nieczytający
{
  let n = 0;
  const save = freshSave();
  const ALL = Object.entries(VOCAB).flatMap(([th, d]) => d.words.map((w) => `v:${th}:${w[0]}`));
  for (const prof of [{ focus: ["v:animals"] }, { focus: ["v:animals"], noReading: true, voice: true }]) for (const key of ALL) {
    const w = wordOf(key);
    for (const box of [null, 0, 1, 2, 3, 4, 5]) {
      if (box === null) delete save.srs[key]; else save.srs[key] = { b: box, due: 0, n: 1, ok: 1, last: 0 };
      const s = new Session(save, prof, "tower", key.length * 7 + (box ?? 9));
      for (let i = 0; i < 12; i++) {
        const t = s.vocabTask(key, save.srs[key]); n++;
        const where = `${key}@${box}${prof.noReading ? "/noread" : ""}`;
        inc(counts.types, (prof.noReading ? "nr:" : "v:") + t.type);
        const o = t.options;
        if (o.filter((x) => x.ok).length !== 1 || !o.find((x) => x.ok && x.en === w.en)) bad("task", `${where} ≠1 dobra / brak odpowiedzi`);
        for (let a = 0; a < o.length; a++) for (let b = a + 1; b < o.length; b++)
          if (vocabConflict([o[a].en, o[a].pl, o[a].img], [o[b].en, o[b].pl, o[b].img])) bad("conflict", `${where} mylące opcje: ${o[a].en} ${o[a].img} / ${o[b].en} ${o[b].img}`);
        if (o.length < 3) bad("task", `${where} <3 opcje`);
        if (t.type === "spell") {
          const need = w.en.replace(/[^a-zA-Z]/g, "").split("").sort().join("");
          const have = [...t.tiles]; let okT = true;
          for (const ch of need) { const k = have.indexOf(ch); if (k < 0) okT = false; else have.splice(k, 1); }
          if (!okT) bad("task", `${where} literki nie pozwalają ułożyć słowa`, t.tiles);
          if (need.length > 9) bad("load", `${where} za długie do literek`);
        }
        if (t.type === "type" && w.en.replace(/[^a-zA-Z]/g, "").length > 10) bad("load", `${where} za długie do wpisania`);
        checkPlan(t, prof, where);
        const wrong = o.find((x) => !x.ok);
        const fb = feedbackFor(t, false, wrong.tag);
        if (!fb || !fb.picked || fb.picked.en !== wrong.en) bad("feedback", `${where} odsłona nie pokazuje wybranego słowa`);
      }
    }
  }
  console.log(`vocab task sim: ${n}`);
}
console.log("task types:", JSON.stringify(counts.types), "| build z wabikiem:", counts.decoy || 0);
console.log("mechanics:", JSON.stringify(counts.mechs));

// ---------------------------------------------------------------- 3b) terminy powtórek (P1-1) i opóźniony pierwszy test (P1-6)
{
  const realNow = Date.now;
  let clock = new Date("2026-11-02T20:00:00").getTime();
  Date.now = () => clock;
  const save = freshSave();
  const task = (key, extra = {}) => ({ key, skill: key.split(":").slice(0, 2).join(":"), kind: "vocab", type: "pic2word", options: [1, 2, 3, 4], canStrong: true, ...extra });
  const k = "v:animals:dog";
  record(save, task(k, { justIntroduced: true }), true, 2500, null);
  if (save.srs[k].b !== 0) bad("srs", `P1-6: awans 0→1 tuż po karcie NEW (b=${save.srs[k].b})`);
  clock += 60000; record(save, task(k), true, 2500, null);
  if (save.srs[k].b !== 1) bad("srs", `P1-6: opóźnione trafienie nie dało 0→1 (b=${save.srs[k].b})`);
  const due1 = save.srs[k].due;
  for (let i = 0; i < 10; i++) { clock += 60000; record(save, task(k), true, 2500, null); }
  if (save.srs[k].due !== due1 || save.srs[k].b !== 1) bad("srs", "P1-1: 10 dobrych odpowiedzi tego samego dnia zmieniło termin / pudełko");
  clock = new Date("2026-11-03T09:00:00").getTime();
  if (!(save.srs[k].due <= clock)) bad("srs", "P1-1: rzecz z 20:00 nie jest wymagalna następnego dnia o 9:00");
  record(save, task(k), true, 2500, null);
  if (save.srs[k].b !== 2) bad("srs", `P1-1: wymagalna dobra odpowiedź nie dała awansu (b=${save.srs[k].b})`);
  clock += 60000; record(save, task(k), false, 2500, "x");
  if (save.srs[k].b !== 2) bad("srs", `P1-1: pierwszy błąd przy niewymagalnej powtórce cofnął pudełko (b=${save.srs[k].b})`);
  clock += 60000; record(save, task(k), false, 2500, "x");
  if (save.srs[k].b !== 1) bad("srs", `P1-1: drugi błąd tego dnia powinien dać −1 (b=${save.srs[k].b})`);
  if (!(save.srs[k].due <= new Date("2026-11-04T00:00:00").getTime())) bad("srs", "P1-1: po błędzie rzecz nie wraca najpóźniej jutro");
  // P1-6 w sesji: nowa rzecz wraca w tym samym biegu po 3–5 zadaniach
  let back = 0, intro = 0;
  for (let run = 0; run < 40; run++) {
    const sv = freshSave();
    const ses = new Session(sv, { focus: ["v:animals", "v:food"], noEvents: true }, "tower", run);
    const firstAt = {};
    for (let i = 0; i < 25; i++) {
      const t = ses.next(); if (!t) break;
      if (t.justIntroduced) { firstAt[t.key] = i; intro++; }
      else if (firstAt[t.key] != null && !t._seen2) { const d = i - firstAt[t.key]; if (d >= 3 && d <= 6) back++; firstAt[t.key] = null; }
      record(sv, t, true, 2500, null);
      if (t.justIntroduced && sv.srs[t.key].b !== 0) bad("srs", "P1-6: awans przy justIntroduced w sesji");
    }
  }
  console.log(`P1-6: nowe rzeczy wracające po 3–5 zadaniach: ${back}/${intro}`);
  Date.now = realNow;
}

// ---------------------------------------------------------------- 4) symulacja dni gry (uczeń-model)
{
  const realNow = Date.now;
  let clock = new Date("2026-11-02T16:00:00").getTime();
  Date.now = () => clock;
  const profiles = {
    lucja: { focus: ["ps_3s", "ps_neg", "ps_q", "pc", "pc_vs_ps", "v:actions", "v:animals"], noEvents: true },
    nina: { focus: ["v:animals", "v:food", "v:colors", "v:numbers", "v:toys", "v:sports", "can"], noEvents: true, voice: true },
    bruno: { focus: ["v:animals", "v:colors", "v:numbers", "v:toys", "v:food"], noReading: true, voice: true, noEvents: true },
  };
  for (const [name, prof] of Object.entries(profiles)) {
    clock = new Date("2026-11-02T16:00:00").getTime();
    const save = freshSave();
    const rng = rngFrom("learner" + name);
    let mainN = 0, tot = 0, mainIntroN = 0, totIntro = 0; const types = {}; let goldWeak = 0, mainLate = 0, mainStrong = 0;
    for (let day = 0; day < 21; day++) {
      for (let run = 0; run < 2; run++) {
        const s = new Session(save, prof, "tower", day * 10 + run);
        const newIn = { vocab: 0, grammar: 0 };
        for (let i = 0; i < 25; i++) {
          const t = s.next(); if (!t) break;
          if (!save.srs[t.key]) newIn[t.kind]++;
          tot++; if (s.isMain(t.key)) mainN++;
          if (i >= 5) { totIntro++; if (s.isMain(t.key)) mainIntroN++; }
          inc(types, t.type);
          if (day >= 14 && s.isMain(t.key) && t.kind === "grammar") { mainLate++; if (["build", "fix", "type"].includes(t.type)) mainStrong++; }
          const r = save.srs[t.key];
          const pKnow = name === "lucja" ? (r ? Math.min(0.97, 0.75 + r.b * 0.05) : 0.6) : r ? 0.55 + r.b * 0.08 : 0.5; // Łucja ~85%
          const pg = t.options ? 1 / t.options.length : t.type === "judge" ? 0.5 : 0;
          const ok = rng() < pKnow + (1 - pKnow) * pg;
          const before = r ? r.b : 0;
          record(save, t, ok, 2500, ok ? null : (t.tag || "x"), {});
          if (save.srs[t.key].b >= 4 && before < 4 && t.canStrong && !STRONG.has(t.type)) goldWeak++;
          if (!ok) s.failed(t.key);
          clock += 8000;
        }
        if (newIn.vocab > 6 || newIn.grammar > 3) bad("session", `${name} za dużo nowych w biegu`, newIn);
        clock += 3600000;
      }
      clock += 22 * 3600000;
    }
    const share = mainIntroN / Math.max(1, totIntro);
    console.log(`sim ${name}: main share ${(share * 100).toFixed(0)}% (target ${(MAIN_SHARE * 100).toFixed(0)}%), types ${JSON.stringify(types)}, gold ${Object.values(save.srs).filter((r) => r.b >= 5).length}/${Object.keys(save.srs).length}`);
    if (goldWeak) bad("session", `${name}: ${goldWeak}× awans do złota zadaniem rozpoznawania`);
    if (name === "lucja") {
      const bx = Object.keys(SKILLS.ps_3s.patterns).map((p) => (save.srs["g:ps_3s:" + p] || { b: 0 }).b).sort((a, b) => a - b);
      const med = bx[Math.floor(bx.length / 2)];
      console.log(`  P1-1: pudełka ps_3s po 21 dniach: ${bx.join(",")} (mediana ${med}); build+fix+type w temacie głównym (dni 15–21): ${(mainStrong / Math.max(1, mainLate) * 100).toFixed(0)}%`);
      if (med < 3) bad("srs", `lucja: mediana pudełka ps_3s ${med} < 3 (P1-1)`);
      if (mainStrong / Math.max(1, mainLate) < 0.25) bad("srs", `lucja: za mało zadań build/fix/type w temacie głównym (P1-1)`);
    }
    if (share < 0.58 || share > 0.8) bad("session", `${name}: udział tematu głównego ${(share * 100).toFixed(0)}% poza 58–80%`);
    if (prof.noReading && Object.keys(types).some((k) => !["listen2pic", "pic2listen"].includes(k))) bad("session", `${name}: nieczytający dostał tekst`, types);
    if (!prof.noReading && Object.keys(types).length < 5) bad("session", `${name}: mało różnorodności`, types);
  }
  Date.now = realNow;
}

// ---------------------------------------------------------------- 6) ścieżka: 30 dni (Łucja 0.85, Matylda 0.75)
{
  const realNow = Date.now;
  let clock;
  Date.now = () => clock;
  const DAY = 86400000;
  for (const [name, skill] of [["lucja", 0.85], ["matylda", 0.75]]) {
    const prof = { ...ROSTER_SRC.students[name] };
    if (!prof.path) { bad("path", `${name}: brak path w roster-src.json`); continue; }
    const ids = expandPath(prof);
    if (ids.includes("v:numbers")) bad("path", `${name}: łatwe liczby w ścieżce`);
    clock = new Date("2026-11-09T16:00:00").getTime();
    const save = freshSave();
    const rng = rngFrom("path" + name);
    const unlockDay = {}; let rev = 0, tot = 0, revDue = 0, heurN = 0, heurOk = 0;
    const timeline = [];
    for (let day = 0; day < 30; day++) {
      const before = new Set(pathState(save, prof, clock).unlocked);
      const runs = day % 7 === 5 ? 0 : 2; // jeden dzień w tygodniu bez grania
      for (let run = 0; run < runs; run++) {
        const s = new Session(save, prof, "tower", day * 10 + run + name.length);
        for (let i = 0; i < 25; i++) {
          const t = s.next(); if (!t) break;
          const r = save.srs[t.key];
          tot++; if (r) rev++; if (r && r.due <= clock) revDue++;
          if (t.kind === "grammar" && NOT3S.test(t.q.full)) bad("3s", `${name}: zadanie spoza 3. osoby: ${t.q.full}`);
          if (t.kind === "grammar" && t.type === "cloze" && /^(ps_|ps3_)/.test(t.skill)) {
            // P1-2: heurystyka "wybierz najkrótszą opcję na -s" bez czytania zdania
            const sOpts = t.options.filter((o) => /^[a-z]+s$/i.test(o.label) && !/^(is|does|has)$/i.test(o.label)).sort((a, b) => a.label.length - b.label.length);
            const guess = sOpts.length ? sOpts[0] : t.options[Math.floor(rng() * t.options.length)];
            heurN++; if (guess.ok) heurOk++;
          }
          const ev = activeEvent(new Date(clock), EVENTS);
          if (!ids.includes(t.skill) && !(prof.focus || []).includes(t.skill) && !(ev && t.skill === "v:" + ev.vocab)) bad("path", `${name}: zadanie spoza otwartej ścieżki ${t.key}`);
          const pKnow = r ? Math.min(0.97, skill - 0.15 + r.b * 0.06) : skill - 0.25;
          const pg = t.options ? 1 / t.options.length : t.type === "judge" ? 0.5 : 0;
          const ok = rng() < pKnow + (1 - pKnow) * pg;
          record(save, t, ok, 2500, ok ? null : (t.tag || "x"), {});
          if (!ok) s.failed(t.key);
          clock += 9000;
        }
        clock += 3 * 3600000;
      }
      const ps = pathState(save, prof, clock);
      const added = ps.unlocked.filter((x) => !before.has(x));
      // otwarte dziś po mastery + rozpoczęte dziś: liczymy kroki "rozpoczęte" (pierwsze zadanie) danego dnia
      const started = ps.steps.filter((x) => x.since != null && x.since >= clock - 20 * 3600000 && x.i >= (prof.pathStart ?? 2)).length;
      if (started > 1) bad("path", `${name} dzień ${day + 1}: rozpoczęto ${started} nowe kroki (max 1)`);
      for (const a of added) unlockDay[a] = day + 1;
      timeline.push(ps.unlocked.length);
      clock = new Date(clock).setHours(16, 0, 0, 0) + DAY;
    }
    const ps = pathState(save, prof, clock);
    const share = rev / Math.max(1, tot);
    console.log(`path ${name} (skill ${skill}): odblokowane ${ps.unlocked.length}/${ps.steps.length} po 30 dniach; dzień→liczba kroków: ${timeline.join(" ")}`);
    console.log(`  powtórki ${(share * 100).toFixed(0)}% zadań (z czego zaległe ${(revDue / Math.max(1, tot) * 100).toFixed(0)}%), nowe ${(100 - share * 100).toFixed(0)}%; blokada teraz: ${ps.blocked}`);
    console.log(`  ` + pathStatus(save, prof, clock).map((x) => `${x.unlocked ? (x.current ? "▶" : "✓") : "·"}${x.id}:${Math.round(x.mastery * 100)}%`).join(" "));
    console.log(`  P1-2: heurystyka "-s" trafia ${(heurOk / Math.max(1, heurN) * 100).toFixed(0)}% luk present simple (${heurN} zadań)`);
    if (heurOk / Math.max(1, heurN) > 0.6) bad("path", `${name}: heurystyka "-s" > 60% (P1-2)`);
    if (share < 0.75) bad("path", `${name}: za mało powtórek (${(share * 100).toFixed(0)}%)`);
    if (ps.unlocked.length < 5) bad("path", `${name}: za wolno — tylko ${ps.unlocked.length} kroków po 30 dniach`);
    if (ps.unlocked.length > 20) bad("path", `${name}: za szybko — ${ps.unlocked.length} kroków po 30 dniach`);
    for (let i = 1; i < timeline.length; i++) if (timeline[i] - timeline[i - 1] > 1) bad("path", `${name}: >1 krok w dniu ${i + 1}`);
  }
  Date.now = realNow;
}

console.log("\nBAD by section:", JSON.stringify(BAD));
console.log("ALL BAD", ALLBAD);
if (ALLBAD) process.exitCode = 1;
