// Generuje tysiące zdań z każdego wzorca i sprawdza: unikalne opcje, odpowiedź poza złymi, brak "undefined", podwójnych spacji.
import { SKILLS } from "../data/grammar.js";
import { rngFrom } from "../js/art.js";
let bad = 0, total = 0; const samples = {};
for (const [sk, def] of Object.entries(SKILLS)) for (const [p, fn] of Object.entries(def.patterns)) {
  const rng = rngFrom(sk + p);
  for (let i = 0; i < 2000; i++) {
    const q = fn(rng); total++;
    const all = [q.answer, ...q.wrong];
    const s = JSON.stringify(q);
    const errs = [];
    if (s.includes("undefined") || s.includes("null,") && false) errs.push("undefined");
    if (new Set(all).size !== all.length) errs.push("dup opts");
    if (q.wrong.length < 1) errs.push("no wrong");
    if (!q.text.includes("___")) errs.push("no gap");
    if (/  /.test(q.text) || /  /.test(q.full)) errs.push("double space");
    if (q.full.includes("___")) errs.push("gap in full");
    if (errs.length) { bad++; if (bad < 15) console.log(sk, p, errs, q); }
    (samples[sk + ":" + p] = samples[sk + ":" + p] || new Set()).add(q.full);
  }
}
console.log("total", total, "bad", bad);
for (const [k, v] of Object.entries(samples)) console.log(k.padEnd(22), v.size, "unique |", [...v].slice(0, 3).join(" | "));

// --- symulacja zadań fix/judge/build dla każdego wzorca (łapie zadania, które nie mogą trafić do gry) ---
import { Session } from "../js/engine.js";
{
  let bad2 = 0, n = 0;
  const fake = { id: "t", srs: {}, skills: {}, confusions: {}, shadows: [], settings: { voice: false }, log: [], stats: {} };
  for (const [sk, def] of Object.entries(SKILLS)) for (const p of Object.keys(def.patterns)) {
    for (const box of [0, 2, 3, 5]) {
      fake.srs[`g:${sk}:${p}`] = { b: box, due: 0, n: 1, ok: 1, last: 0 };
      const s = new Session(fake, { focus: [sk] }, "tower", sk.length * 31 + box);
      for (let i = 0; i < 300; i++) {
        const t = s.grammarTask(`g:${sk}:${p}`, fake.srs[`g:${sk}:${p}`]); n++;
        const err = [];
        if (t.type === "fix") {
          const fixed = t.tokens.map((w, j) => (j === t.badIdx ? w.replace(t.wrongWord, t.q.answer) : w)).join(" ");
          if (t.badIdx < 0) err.push("badIdx<0");
          if (fixed !== t.q.full) err.push(`fix→ "${fixed}" ≠ "${t.q.full}"`);
          if (/[→—]/.test(t.tokens.join(" "))) err.push("fix na nie-zdaniu");
        }
        if ((t.type === "judge" || t.type === "build") && /[→—]/.test(t.q.text)) err.push(t.type + " na nie-zdaniu");
        if (t.type === "build" && t.words.join(" ") !== t.q.full) err.push("build≠full");
        if (err.length) { bad2++; if (bad2 < 10) console.log("ZADANIE", sk, p, t.type, err.join("; ")); }
      }
    }
  }
  console.log("task sim", n, "bad", bad2);
  if (bad2) process.exitCode = 1;
}
