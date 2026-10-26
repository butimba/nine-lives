// node tools/build-roster.mjs  → zapisuje data/roster.js (bez imion, same hashe)
import { readFileSync, writeFileSync } from "fs";
import { loginHash } from "../js/util.js";
const src = JSON.parse(readFileSync(new URL("./roster-src.json", import.meta.url)));
const out = {};
for (const [login, p] of Object.entries(src.students)) {
  out[loginHash(login)] = { ...p, duo: p.duo ? loginHash(p.duo) : null };
}
const js = `// WYGENEROWANE przez tools/build-roster.mjs — nie edytuj ręcznie (edytuj tools/roster-src.json).
// Klucze to hashe loginów, żeby imiona uczniów nie były publiczne.
export default ${JSON.stringify({ players: out, default: src.default }, null, 1)};
`;
writeFileSync(new URL("../data/roster.js", import.meta.url), js);
console.log("roster:", Object.keys(out).length, "graczy");
