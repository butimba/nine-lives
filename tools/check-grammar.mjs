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
