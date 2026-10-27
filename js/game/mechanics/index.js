// Mechanics registry + planner: engine task -> arcade mechanic + prompt.
// Contract: docs/STAGE1-CONTRACTS.md (C). Grading rules are identical to v1 js/tasks.js.
import signs from "./signs.js";
import bubbles from "./bubbles.js";
import spell from "./spell.js";
import fixline from "./fixline.js";
import catchMech from "./catch.js";

export const MECHANICS = { signs, bubbles, spell, fixline };
if (catchMech && catchMech.ready) MECHANICS.catch = catchMech;

const TITLES = {
  word2pic: "Find the picture!", listen2pic: "Listen and tap!", pic2listen: "Which one is it?", pic2word: "What is it?",
  pl2en: "In English?", spell: "Spell it!", type: "Type it!", match: "What is it?", cloze: "Fill the gap!",
  fix: "Smash the mistake!", judge: "Right or wrong?", build: "Build the sentence!",
};
const TITLES_PL = {
  word2pic: "Znajdź obrazek", listen2pic: "Posłuchaj i kliknij", pic2listen: "Posłuchaj, które to słowo", pic2word: "Co to jest?",
  pl2en: "Jak to po angielsku?", spell: "Ułóż słowo z literek", type: "Wpisz słowo", match: "Co to jest?", cloze: "Uzupełnij lukę",
  fix: "Rozbij błędne słowo", judge: "Dobrze czy źle?", build: "Ułóż zdanie",
};

// build -> cloze (same as engine's cloze construction for box >= 3: answer + 3 wrong, with tags)
function rebuildCloze(task) {
  const q = task.q;
  const opts = [{ label: q.answer, ok: true }, ...q.wrong.slice(0, 3).map((x) => ({ label: x, ok: false, tag: q.tags[x] }))];
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  task.type = "cloze";
  task.options = opts;
  delete task.words; delete task.tiles;
}

export function planTask(task, profile = {}, settings = {}) {
  profile = profile || {}; settings = settings || {};
  let mech;
  switch (task.type) {
    case "word2pic": case "pic2word": case "pl2en": case "cloze": mech = "signs"; break;
    case "match": task.type = "pic2word"; mech = "signs"; break;
    case "listen2pic": case "pic2listen": case "judge": mech = "bubbles"; break;
    case "type": mech = "spell"; break;
    case "spell": mech = MECHANICS.catch ? "catch" : "spell"; break;
    case "fix": mech = "fixline"; break;
    case "build":
      if (MECHANICS.catch) mech = "catch";
      else { rebuildCloze(task); mech = "signs"; }
      break;
    default: mech = "signs";
  }
  const type = task.type;
  const noRead = !!profile.noReading;
  const voiceOn = !!settings.voice || noRead;
  const p = { title: TITLES[type] || "", text: null, img: null, say: null, autoSay: false, type };
  if (settings.pl !== false && TITLES_PL[type]) p.pl = TITLES_PL[type];
  const w = task.word;
  switch (type) {
    case "word2pic": p.text = w.en; p.say = w.en; p.autoSay = voiceOn; break;
    case "listen2pic": p.say = w.en; p.autoSay = true; p.speaker = true; break;
    case "pic2listen": p.img = w.img; break; // options are audio
    case "pic2word": p.img = w.img; p.say = null; break;
    case "pl2en": p.text = w.pl; p.lang = "pl"; break;
    case "spell": case "type": p.img = w.img; p.text = w.pl; p.lang = "pl"; break;
    case "cloze": p.text = task.q.text; p.say = task.q.text.replace("___", "…"); p.autoSay = voiceOn; break;
    case "judge": p.text = task.sentence; p.say = task.sentence; p.autoSay = voiceOn; break;
    case "fix": p.text = null; break; // sentence is the row of blocks
    case "build": p.text = null; p.img = null; break;
  }
  if (noRead) { if (p.lang === "pl") p.text = null; }
  return { mech, task, prompt: p };
}

// For reveal cards / B's run UI.
export function answerOf(task) {
  if (task.kind === "vocab") return { img: task.word.img, en: task.word.en, pl: task.word.pl, say: task.word.en };
  return { en: task.q.full, pl: task.q.hint || null, say: task.q.full };
}
