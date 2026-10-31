// WALIDATOR TREŚCI I ZADAŃ — uruchom przed każdą publikacją: node tools/check-grammar.mjs  (musi być: ALL BAD 0)
// 1) każdy wzorzec gramatyki × 2000 zdań: kształt, tagi, wyjaśnienia, sensowność (zwierzęta, pory dnia, wiek),
//    "mini-wyrocznia": żadna zła opcja nie może dawać poprawnego zdania (np. "Do you swim?" przy can),
// 2) słówka: duplikaty, emoji, mylące się pary,
// 3) symulacja KAŻDEGO typu zadania i KAŻDEGO przypisania mechaniki (planTask) dla każdego słówka i wzorca na każdym pudełku,
//    także dla profilu nieczytającego (Bruno),
// 4) symulacja sesji/dni gry: udział tematu głównego, różnorodność zadań, limity nowych rzeczy, złoto tylko za "mocne" zadania.
import { SKILLS, VERBS } from "../data/grammar.js";
import VOCAB, { CONFUSABLE } from "../data/vocab.js";
import { rngFrom } from "../js/art.js";
import { Session, record, buildable, vocabConflict, STRONG, MAIN_SHARE, feedbackFor, CONFUSION_PL, wordOf } from "../js/engine.js";
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
  [/^(Grandma|My mum|The witch|My parents) (is|are) ten years old/, "wiek nie pasuje"],
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
const BASE = new Set(VERBS.map((v) => v.b).concat(["swim", "cook", "jump", "count", "whistle", "climb", "dance", "sing", "ride", "speak", "walk", "fly", "run", "drive"]));
const AGREES = { do: ["1s", "pl"], does: ["3s"], "don't": ["1s", "pl"], "doesn't": ["3s"], am: ["1s"], "am not": ["1s"], is: ["3s"], "isn't": ["3s"], are: ["pl"], "aren't": ["pl"], have: ["1s", "pl"], has: ["3s"], "haven't": ["1s", "pl"], "hasn't": ["3s"] };
// mini-wyrocznia: czy zła opcja wstawiona w lukę daje poprawne zdanie?
function alsoCorrect(q, w) {
  const m = q.text.match(/^(?:(Look!|Listen!|Shh!) )?(.*?)\s*___\s*(.*)$/);
  if (!m) return false;
  const before = m[2].trim(), after = m[3].trim();
  const next = after.split(" ")[0] || "";
  const lw = w.toLowerCase();
  if (AGREES[lw]) {
    let subj = before;
    if (!before) subj = after.split(" ").slice(0, after.startsWith("your ") || after.startsWith("the ") || after.startsWith("my ") ? 2 : 1).join(" "); // pytanie: ___ you swim?
    if (/ and /.test(after) && !before) subj = "tom and mia";
    if (before === "There") subj = /^(a|an) /.test(after) ? "it" : "they";
    if (!AGREES[lw].includes(SUBJ_NUM(subj))) return false;
    const vAfter = before ? next : after.split(" ")[subj.split(" ").length] || "";
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
    for (const a of list) for (const b of list) if (a < b && !vocabConflict([a, "", "x"], [b, "", "y"])) bad("vocab", `emoji ${img} dla "${a}" i "${b}" bez wpisu w CONFUSABLE`);
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
function checkGrammarTask(t, where) {
  const q = t.q;
  inc(counts.types, "g:" + t.type);
  if (t.type === "cloze") {
    const labels = t.options.map((o) => o.label);
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
    if (t.tiles.map((x) => x.w).sort().join("|") !== [...t.words].sort().join("|")) bad("task", `${where} klocki ≠ słowa`);
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
      const s = new Session(save, { focus: [sk] }, "tower", sk.length * 31 + (box ?? 9) + p.length);
      for (let i = 0; i < 250; i++) {
        const t = s.grammarTask(key, save.srs[key]); n++;
        checkGrammarTask(t, `${key}@${box}`);
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
console.log("task types:", JSON.stringify(counts.types));
console.log("mechanics:", JSON.stringify(counts.mechs));

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
    let mainN = 0, tot = 0, mainIntroN = 0, totIntro = 0; const types = {}; let goldWeak = 0;
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
          const r = save.srs[t.key];
          const pKnow = r ? 0.55 + r.b * 0.08 : 0.5;
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
    if (share < 0.58 || share > 0.8) bad("session", `${name}: udział tematu głównego ${(share * 100).toFixed(0)}% poza 58–80%`);
    if (prof.noReading && Object.keys(types).some((k) => !["listen2pic", "pic2listen"].includes(k))) bad("session", `${name}: nieczytający dostał tekst`, types);
    if (!prof.noReading && Object.keys(types).length < 5) bad("session", `${name}: mało różnorodności`, types);
  }
  Date.now = realNow;
}

console.log("\nBAD by section:", JSON.stringify(BAD));
console.log("ALL BAD", ALLBAD);
if (ALLBAD) process.exitCode = 1;
