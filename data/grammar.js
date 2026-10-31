// GRAMATYKA — generator zdań. Każda umiejętność ma "wzorce" (patterns).
// Klucz postępu: "g:<skill>:<pattern>". Nie zmieniaj istniejących id — dodawaj nowe.
// make(rng) zwraca:
//   { text: "Tom ___ football every day.", answer, wrong:[...], tags:{opcja:tag}, full, hint, why,
//     fixable:[...], judgeable:[...], cue?, typeText? }
//   full      = pełne poprawne zdanie (układanie z klocków, "znajdź błąd", odsłona)
//   hint      = polska reguła (pokazywana pod odpowiedzią, gdy PL włączone)
//   why       = krótkie wyjaśnienie po angielsku (A1), konkretne dla tego zdania
//   tags      = KAŻDA zła opcja ma tag błędu (silnik liczy wzorce błędów)
//   fixable   = złe opcje, które wolno użyć w "Smash the mistake" (błąd da się naprawić TYLKO w tym jednym klocku)
//   judgeable = złe opcje, które są niepoprawne w KAŻDYM odczytaniu (do "Right or wrong?")
//   cue       = forma podstawowa w nawiasie → wolno zadanie "wpisz" (jedyna możliwa odpowiedź)
// Audyt treści: docs/LEARNING-AUDIT.md. Walidator: node tools/check-grammar.mjs

const pick = (rng, a) => a[Math.floor(rng() * a.length)];

// ---------- dane ----------
export const VERBS = [
  // base, 3rd person, -ing, obiekty pasujące (ludzie)
  { b: "play", s: "plays", ing: "playing", objs: ["football", "tennis", "the piano", "video games", "chess"] },
  { b: "like", s: "likes", ing: null, objs: ["pizza", "spiders", "ice cream", "cats", "school", "Halloween"] },
  { b: "eat", s: "eats", ing: "eating", objs: ["apples", "pizza", "candy", "breakfast", "a sandwich"] },
  { b: "drink", s: "drinks", ing: "drinking", objs: ["milk", "juice", "water", "hot chocolate"] },
  { b: "read", s: "reads", ing: "reading", objs: ["books", "comics", "a story"] },
  { b: "ride", s: "rides", ing: "riding", objs: ["a bike", "a horse", "a scooter"] },
  { b: "watch", s: "watches", ing: "watching", objs: ["TV", "cartoons", "a film"] },
  { b: "go", s: "goes", ing: "going", objs: ["to school", "to the park", "swimming", "shopping"] },
  { b: "do", s: "does", ing: "doing", objs: ["homework", "the dishes", "yoga"] },
  { b: "have", s: "has", ing: "having", objs: ["breakfast", "a shower", "lunch"] },
  { b: "wash", s: "washes", ing: "washing", objs: ["the car", "the dishes", "the dog"] },
  { b: "study", s: "studies", ing: "studying", objs: ["English", "maths"] },
  { b: "fly", s: "flies", ing: "flying", objs: ["a kite"] },
  { b: "cry", s: "cries", ing: "crying", objs: [""] },
  { b: "swim", s: "swims", ing: "swimming", objs: ["in the sea", "in the pool"] },
  { b: "run", s: "runs", ing: "running", objs: ["in the park", "to school"] },
  { b: "sing", s: "sings", ing: "singing", objs: ["songs", "in the shower", "a song"] },
  { b: "dance", s: "dances", ing: "dancing", objs: ["at parties", "in the kitchen"] },
  { b: "write", s: "writes", ing: "writing", objs: ["a letter", "stories", "an email"] },
  { b: "cook", s: "cooks", ing: "cooking", objs: ["dinner", "pancakes", "soup"] },
  { b: "sleep", s: "sleeps", ing: "sleeping", objs: ["on the sofa"] },
  { b: "draw", s: "draws", ing: "drawing", objs: ["cats", "monsters", "a picture"] },
  { b: "climb", s: "climbs", ing: "climbing", objs: ["trees", "the wall"] },
  { b: "brush", s: "brushes", ing: "brushing", objs: ["the cat", "the horse", "the dog"] },
  { b: "carry", s: "carries", ing: "carrying", objs: ["a bag", "a box"] },
];
const vb = (b) => VERBS.find((v) => v.b === b);

// osoby 3. osoby liczby pojedynczej i inne
const SUBJ_3S = ["He", "She", "Tom", "Mia", "My cat", "My mum", "The dog", "My brother", "Grandma", "The witch", "Zoe", "Leo"];
const SUBJ_PL = ["I", "You", "We", "They", "My friends", "Tom and Mia", "The cats", "My parents"];
const subjFix = (s) => (s === "I" ? "I" : ["He", "She", "You", "We", "They", "It"].includes(s) || s.startsWith("My ") || s.startsWith("The ") ? s[0].toLowerCase() + s.slice(1) : s);

// ZWIERZĘTA jako podmiot: tylko czynności, które zwierzę naprawdę robi (żadnego "The dog writes an email").
const ANIMAL = new Set(["my cat", "the dog", "the cats", "the cat", "your cat", "your dog"]);
const isAnimal = (s) => ANIMAL.has(String(s).toLowerCase());
const ANIMAL_OBJS = {
  play: ["with a ball"], like: ["fish", "milk"], eat: ["fish"], drink: ["milk", "water"],
  sleep: ["in a box", "in the sun", "on the sofa"], run: ["in the park"], climb: ["trees"], go: ["to the park"], watch: ["birds"],
};
// pora dnia musi pasować do obiektu (żadnego "has breakfast every evening")
const PS_TIME = ["every day", "every morning", "on Mondays", "at the weekend", "after school", "every evening"];
const TIME_FOR = {
  breakfast: ["every morning", "every day"], lunch: ["every day", "on Mondays", "at the weekend"], dinner: ["every evening", "every day"],
  "to school": ["every day", "every morning", "on Mondays"], "on the sofa": ["after school", "every evening"], homework: ["every day", "after school", "every evening", "on Mondays"],
};
const STATIVE = new Set(["like"]); // "like" bez określenia czasu ("Tom likes pizza.")
// sygnały "teraz": tylko jednoznaczne (gołe "now" przy present simple bywa poprawne: "He plays football now" = obecnie)
const PC_TIME_END = ["right now", "at the moment"];
// "Listen!" tylko przy czynnościach, które słychać; "Shh!" przy cichych
const pcCue = (rng, v, o) => {
  const opts = ["Look!"];
  if (v.b === "sing" || (v.b === "play" && o.includes("piano"))) opts.push("Listen!", "Listen!");
  if (["sleep", "read", "write", "draw", "watch"].includes(v.b)) opts.push("Shh!", "Shh!");
  return pick(rng, opts);
};

const beFor = (s) => (s === "I" ? "am" : SUBJ_3S.includes(s) || s === "It" || s === "The cat" ? "is" : "are");

// podmiot + czasownik + obiekt, które do siebie pasują
function sv(rng, subjects, verbs) {
  const v = vb(pick(rng, verbs));
  let pool = subjects;
  if (!ANIMAL_OBJS[v.b]) pool = subjects.filter((s) => !isAnimal(s));
  const s = pick(rng, pool);
  const o = isAnimal(s) ? pick(rng, ANIMAL_OBJS[v.b]) : pick(rng, v.objs);
  return { v, s, o, os: o ? " " + o : "" };
}
const timeFor = (rng, o) => pick(rng, TIME_FOR[o] || PS_TIME);

// ---------- tagi → co wolno w jakim zadaniu ----------
// "Smash the mistake": błąd musi siedzieć w JEDNYM klocku i nie może dać się naprawić gdzie indziej.
// Błędy zgodności podmiotu (he play) odpadają: "He play" → "We play" też jest poprawne.
const FIX_SAFE = new Set(["s_spelling", "ing_spelling", "ing_confusion", "missing_be", "there_agreement"]);
const TENSE = new Set(["ps_for_pc", "pc_for_ps"]);
// "Right or wrong?": zdanie złe w każdym odczytaniu. Zamiana czasów bywa poprawna w innym znaczeniu,
// a "Fish can walk" jest gramatycznie poprawne (tylko nieprawdziwe).
const NOT_JUDGEABLE = new Set(["ps_for_pc", "pc_for_ps", "can_meaning"]);

function finalize(q, { cueSafe = false } = {}) {
  q.wrong = [...new Set(q.wrong.filter((w) => w && w !== q.answer))];
  q.fixable = q.wrong.filter((w) => !w.includes(" ") && !q.answer.includes(" ") && (FIX_SAFE.has(q.tags[w]) || (cueSafe && TENSE.has(q.tags[w]))));
  q.judgeable = q.wrong.filter((w) => !NOT_JUDGEABLE.has(q.tags[w]));
  if (q.cue) q.typeText = q.text.replace("___", `___ (${q.cue})`);
  else if (q.typeable) q.typeText = q.text;
  delete q._f; delete q.typeable;
  return q;
}
function mk(text, answer, wrong, tags, full, hint, why, extra = {}) {
  const q = { text, answer, wrong, tags: tags || {}, full: full || text.replace("___", answer), hint, why, ...extra };
  return finalize(q, extra._f || {});
}
const tagAll = (ws, tag) => Object.fromEntries(ws.map((w) => [w, tag]));
const pron = (s) => (s === "I" ? "I" : ["You", "We", "They"].includes(s) ? s.toLowerCase() : SUBJ_PL.includes(s) || s === "The cats" ? "they" : "he / she / it");
const BE_WHY = (s, a) => `${s} → ${a}`;

// ---------- umiejętności ----------
export const SKILLS = {
  // TO BE
  be: {
    name: "am / is / are", level: "A1", prereq: [],
    patterns: {
      basic: (rng) => {
        const ADJ = [
          ["happy", []], ["tired", []], ["hungry", []], ["scared", []], ["in the garden", []],
          ["ten years old", ["My mum", "Grandma", "The witch", "My parents", "They", "You", "My friends"]],
          ["at school", ["My cat", "The dog", "The cats", "Grandma", "The witch", "My parents"]],
          ["my friend", ["I", "We", "My friends", "My parents"]],
        ];
        const [adj, no] = pick(rng, ADJ);
        const s = pick(rng, ["I", ...SUBJ_3S, ...SUBJ_PL.slice(1)].filter((x) => !no.includes(x)));
        const a = beFor(s);
        const adjOk = adj === "my friend" && a === "are" ? "my friends" : adj;
        const wrong = ["am", "is", "are"].filter((x) => x !== a);
        return mk(`${s} ___ ${adjOk}.`, a, wrong, tagAll(wrong, "be_agreement"), `${s} ${a} ${adjOk}.`,
          "I → am, he / she / it → is, you / we / they → are", BE_WHY(s, a));
      },
      neg: (rng) => {
        const s = pick(rng, ["I", "He", "She", "We", "They", "My cat", "It"]);
        const a = s === "I" ? "am not" : beFor(s) === "is" ? "isn't" : "aren't";
        const opts = ["am not", "isn't", "aren't"].filter((x) => x !== a);
        const adj = pick(rng, s === "It" ? ["cold", "late"] : s === "My cat" ? ["cold", "sad", "at home"] : ["cold", "sad", "at home", "late"]);
        return mk(`${s} ___ ${adj}.`, a, opts, tagAll(opts, "be_agreement"), `${s} ${a} ${adj}.`,
          "Przeczenie: I am not, he / she / it isn't, you / we / they aren't", BE_WHY(s, a));
      },
      q: (rng) => {
        const s = pick(rng, ["you", "he", "she", "they", "your mum", "it"]);
        const a = s === "you" || s === "they" ? "Are" : "Is";
        const adj = pick(rng, ["hungry", "OK", "at home", "ready", "scared"]);
        const wrong = ["Am", "Is", "Are"].filter((x) => x !== a);
        return mk(`___ ${s} ${adj}?`, a, wrong, tagAll(wrong, "be_agreement"), `${a} ${s} ${adj}?`,
          "Pytanie: am / is / are idzie na początek", `Question: ${a} + ${s}`);
      },
    },
  },
  // HAVE GOT
  have_got: {
    name: "have got / has got", level: "A1", prereq: [],
    patterns: {
      basic: (rng) => {
        const s = pick(rng, [...SUBJ_3S.slice(0, 8), ...SUBJ_PL]);
        const a = SUBJ_3S.includes(s) ? "has" : "have";
        const o = pick(rng, isAnimal(s) ? ["blue eyes", "long hair", "a toy mouse"] : ["a dog", "a black cat", "two sisters", "a new bike", "blue eyes", "long hair", "a big pumpkin"]);
        const w1 = a === "has" ? "have" : "has";
        return mk(`${s} ___ got ${o}.`, a, [w1, "is"], { [w1]: "have_agreement", is: "be_for_have" }, `${s} ${a} got ${o}.`,
          "he / she / it → has got, I / you / we / they → have got", `${s} → ${a} got`);
      },
      neg: (rng) => {
        const s = pick(rng, ["I", "He", "She", "We", "They", "My cat"]);
        const a = ["He", "She", "My cat"].includes(s) ? "hasn't" : "haven't";
        const o = pick(rng, s === "My cat" ? ["a car", "a phone", "any brothers"] : ["a car", "any brothers", "a phone", "a tail"]);
        const w1 = a === "hasn't" ? "haven't" : "hasn't";
        return mk(`${s} ___ got ${o}.`, a, [w1, "doesn't"], { [w1]: "have_agreement", "doesn't": "do_for_have" }, `${s} ${a} got ${o}.`,
          "Przeczenie: haven't got / hasn't got (nie: doesn't got)", `${s} → ${a} got`);
      },
    },
  },
  // CAN
  can: {
    name: "can / can't", level: "A1", prereq: [],
    patterns: {
      facts: (rng) => {
        const f = pick(rng, [
          ["Birds", "can", "fly"], ["Fish", "can", "swim"], ["Fish", "can't", "walk"], ["Cats", "can", "climb trees"],
          ["Dogs", "can't", "fly"], ["Penguins", "can't", "fly"], ["Penguins", "can", "swim"], ["Snakes", "can't", "run"],
          ["Monkeys", "can", "climb"], ["Kangaroos", "can", "jump"], ["Horses", "can", "run fast"], ["Cows", "can't", "climb trees"],
          ["Babies", "can't", "drive"], ["Frogs", "can", "jump"], ["Elephants", "can't", "fly"],
        ]);
        const w = f[1] === "can" ? "can't" : "can";
        return mk(`${f[0]} ___ ${f[2]}.`, f[1], [w], { [w]: "can_meaning" }, `${f[0]} ${f[1]} ${f[2]}.`,
          "can = umie / potrafi, can't = nie umie", `${f[0]} ${f[1]} ${f[2]}: ${f[1] === "can" ? "yes!" : "no!"}`);
      },
      form: (rng) => {
        const s = pick(rng, ["She", "He", "My cat", "Tom", "I", "We"]);
        const v = pick(rng, s === "My cat" ? ["swim", "climb trees", "jump high"] : ["swim", "dance", "sing", "ride a bike", "play chess", "speak English"]);
        const [head, ...rest] = v.split(" ");
        const tail = rest.length ? " " + rest.join(" ") : "";
        const ws = head + "s" + tail, wt = "to " + v;
        return mk(`${s} can ___.`, v, [ws, wt], { [ws]: "s_after_modal", [wt]: "to_after_modal" }, `${s} can ${v}.`,
          "Po can zawsze forma podstawowa: can swim (nie: can swims, can to swim)", `can + ${head} (no -s, no "to")`);
      },
      q: (rng) => {
        const s = pick(rng, ["you", "he", "she", "your dog", "they"]);
        const v = pick(rng, ["swim", "cook", "jump high", "count to ten", "whistle"]);
        // dystraktory nie mogą tworzyć poprawnego pytania ("Do you swim?" jest poprawne!)
        const plural = s === "you" || s === "they";
        const wrong = plural ? ["Does", "Are"] : ["Do", "Is"];
        return mk(`___ ${s} ${v}?`, "Can", wrong, { Does: "do_for_modal", Do: "do_for_modal", Are: "be_for_modal", Is: "be_for_modal" }, `Can ${s} ${v}?`,
          "Pytanie: Can + osoba + czasownik?", "Question: Can + person + verb");
      },
    },
  },
  // THERE IS / ARE
  there: {
    name: "there is / there are", level: "A1", prereq: ["be"],
    patterns: {
      basic: (rng) => {
        const sing = rng() < 0.5;
        const n = sing ? pick(rng, ["a cat", "a ghost", "an apple", "a spider", "a big pumpkin", "a book"]) :
          pick(rng, ["two cats", "three bats", "some candies", "five apples", "two ghosts", "four books"]);
        const where = pick(rng, ["on the bed", "in the box", "under the table", "in the garden", "on the roof"]);
        const a = sing ? "is" : "are";
        const w1 = sing ? "are" : "is";
        return mk(`There ___ ${n} ${where}.`, a, [w1, "have"], { [w1]: "there_agreement", have: "have_for_there" }, `There ${a} ${n} ${where}.`,
          "There is + jedna rzecz, there are + kilka rzeczy", sing ? `one thing (${n}) → there is` : `many things (${n}) → there are`);
      },
    },
  },
  // LICZBA MNOGA (format "one cat → two ___" — to nie jest zdanie, więc tylko luka / wpisywanie)
  plural: {
    name: "liczba mnoga", level: "A1", prereq: [],
    patterns: {
      regular: (rng) => pl(rng, [["cat", "cats", "cates"], ["dog", "dogs", "doges"], ["book", "books", "bookes"], ["bat", "bats", "bates"], ["car", "cars", "carz"], ["ghost", "ghosts", "ghostes"], ["bird", "birds", "birdes"]],
        "Zwykle dodajemy -s", (o, m) => `${o} + s → ${m}`),
      es: (rng) => pl(rng, [["box", "boxes", "boxs"], ["watch", "watches", "watchs"], ["dress", "dresses", "dresss"], ["witch", "witches", "witchs"], ["fox", "foxes", "foxs"], ["brush", "brushes", "brushs"]],
        "Po -s, -x, -ch, -sh dodajemy -es", (o, m) => `${o} + es → ${m}`),
      ies: (rng) => pl(rng, [["baby", "babies", "babys"], ["candy", "candies", "candys"], ["butterfly", "butterflies", "butterflys"], ["party", "parties", "partys"], ["city", "cities", "citys"]],
        "Spółgłoska + y → -ies", (o, m) => `${o.slice(0, -1)}y → ${m}`),
      irregular: (rng) => pl(rng, [["mouse", "mice", "mouses"], ["child", "children", "childs"], ["man", "men", "mans"], ["woman", "women", "womans"], ["tooth", "teeth", "tooths"], ["foot", "feet", "foots"], ["sheep", "sheep", "sheeps"]],
        "Wyjątki trzeba zapamiętać!", (o, m) => `one ${o}, two ${m}`),
    },
  },
  // PRESENT SIMPLE — końcówka -s
  ps_3s: {
    name: "present simple: he plays", level: "A1", prereq: [],
    patterns: {
      plain: (rng) => ps3(rng, ["play", "like", "eat", "drink", "read", "ride", "sing", "cook", "draw", "climb", "sleep", "write", "dance", "run", "swim"]),
      es: (rng) => ps3(rng, ["watch", "go", "do", "wash", "brush"]),
      ies: (rng) => ps3(rng, ["study", "fly", "carry"]),
      has: (rng) => ps3(rng, ["have"]),
      no_s: (rng) => {
        const { v, s, os } = sv(rng, SUBJ_PL, ["play", "like", "eat", "read", "watch", "go"]);
        const t = STATIVE.has(v.b) ? "" : " " + timeFor(rng, os.trim());
        const wrong = [v.s, v.ing].filter(Boolean);
        return mk(`${s} ___${os}${t}.`, v.b, wrong, { [v.s]: "s_overuse", ...(v.ing ? { [v.ing]: "ing_confusion" } : {}) }, `${s} ${v.b}${os}${t}.`,
          "I / you / we / they → bez -s (I play, they play)", `${s} = ${pron(s)} → ${v.b} (no -s)`);
      },
    },
  },
  ps_neg: {
    name: "present simple: don't / doesn't", level: "A1", prereq: ["ps_3s"],
    patterns: {
      neg: (rng) => {
        const s3 = rng() < 0.55;
        const { v, s, os } = sv(rng, s3 ? SUBJ_3S : SUBJ_PL, ["like", "play", "eat", "watch", "go", "drink"]);
        const a = s3 ? "doesn't" : "don't";
        const w1 = s3 ? "don't" : "doesn't", w2 = s3 ? "isn't" : "aren't";
        return mk(`${s} ___ ${v.b}${os}.`, a, [w1, w2], { [w1]: "do_agreement", [w2]: "be_for_do" }, `${s} ${a} ${v.b}${os}.`,
          "he / she / it → doesn't, I / you / we / they → don't. Po nich czasownik bez -s!", `${s} → ${a} + ${v.b}`);
      },
      base_after: (rng) => {
        const { v, s, os } = sv(rng, SUBJ_3S, ["like", "play", "eat", "watch", "go", "drink", "read"]);
        return mk(`${s} doesn't ___${os}.`, v.b, [v.s], { [v.s]: "s_after_does" }, `${s} doesn't ${v.b}${os}.`,
          "Po doesn't czasownik BEZ -s: she doesn't like (nie: likes)", `doesn't + ${v.b} (no -s)`);
      },
    },
  },
  ps_q: {
    name: "present simple: Do / Does…?", level: "A1", prereq: ["ps_3s"],
    patterns: {
      q: (rng) => {
        const s3 = rng() < 0.55;
        const r = sv(rng, s3 ? SUBJ_3S : SUBJ_PL.filter((x) => x !== "I"), ["like", "play", "eat", "watch", "go", "drink", "read"]);
        const s = subjFix(r.s), v = r.v;
        const a = s3 ? "Does" : "Do";
        const w1 = s3 ? "Do" : "Does", w2 = s3 ? "Is" : "Are";
        return mk(`___ ${s} ${v.b}${r.os}?`, a, [w1, w2], { [w1]: "do_agreement", [w2]: "be_for_do" }, `${a} ${s} ${v.b}${r.os}?`,
          "Does + he / she / it, Do + I / you / we / they", `${s} → ${a}`);
      },
      short: (rng) => {
        const s3 = rng() < 0.5;
        const s = s3 ? pick(rng, ["she", "he", "your cat"]) : pick(rng, ["you", "they"]);
        const v = s === "your cat" ? pick(rng, ["like milk", "eat fish"]) : pick(rng, ["like pizza", "play football", "eat candy"]);
        const yes = rng() < 0.5;
        const p = s === "you" ? "I" : s === "your cat" ? "it" : s;
        const Y = yes ? "Yes" : "No";
        const a = `${Y}, ${p} ${s3 ? (yes ? "does" : "doesn't") : (yes ? "do" : "don't")}.`;
        const w1 = `${Y}, ${p} ${s3 ? (yes ? "do" : "don't") : (yes ? "does" : "doesn't")}.`;
        const w2 = `${Y}, ${p} ${yes ? (p === "I" ? "am" : s3 ? "is" : "are") : (p === "I" ? "am not" : s3 ? "isn't" : "aren't")}.`;
        const text = `${s3 ? "Does" : "Do"} ${s} ${v}? — ___`;
        return mk(text, a, [w1, w2], { [w1]: "do_agreement", [w2]: "be_for_do" }, text.replace("___", a),
          "Krótka odpowiedź powtarza do / does", `${s3 ? "Does" : "Do"}…? → ${a}`);
      },
    },
  },
  // PRESENT CONTINUOUS
  pc: {
    name: "present continuous: is playing", level: "A1", prereq: ["be"],
    patterns: {
      form: (rng) => {
        const { v, s, os } = sv(rng, [...SUBJ_3S, ...SUBJ_PL], ["play", "eat", "read", "watch", "sing", "dance", "cook", "sleep", "draw", "write", "drink"]);
        const be = beFor(s);
        const a = `${be} ${v.ing}`;
        const wrongBe = be === "is" ? "are" : "is";
        const pre = rng() < 0.5;
        const t = pre ? pcCue(rng, v, os) : pick(rng, PC_TIME_END);
        const text = pre ? `${t} ${s} ___${os}.` : `${s} ___${os} ${t}.`;
        const simple = SUBJ_3S.includes(s) ? v.s : v.b;
        const wrong = [simple, `${wrongBe} ${v.ing}`, v.ing];
        return mk(text, a, wrong, { [simple]: "ps_for_pc", [`${wrongBe} ${v.ing}`]: "be_agreement", [v.ing]: "missing_be" },
          pre ? `${t} ${s} ${a}${os}.` : `${s} ${a}${os} ${t}.`,
          "Teraz, w tej chwili → am / is / are + -ing", `"${t}" = now → ${be} + ${v.ing}`, { _f: { cueSafe: !pre } });
      },
      spelling: (rng) => {
        const [b, ing] = pick(rng, [["run", "running"], ["swim", "swimming"], ["sit", "sitting"], ["shop", "shopping"], ["dance", "dancing"], ["smile", "smiling"], ["skate", "skating"], ["hide", "hiding"]]);
        const human = SUBJ_3S.filter((x) => !isAnimal(x));
        const s = pick(rng, ["run", "sit", "hide"].includes(b) ? SUBJ_3S : human);
        const w1 = b + "ing";
        return mk(`${s} is ___ now.`, ing, [w1, b], { [w1]: "ing_spelling", [b]: "missing_ing" }, `${s} is ${ing} now.`,
          b.endsWith("e") ? "Nieme -e znika: dance → dancing" : "Krótki czasownik: podwajamy ostatnią literę: run → running",
          b.endsWith("e") ? `${b} → ${ing} (no e)` : `${b} → ${ing} (double ${b.slice(-1)})`, { cue: b });
      },
      neg: (rng) => {
        const v = vb(pick(rng, ["play", "eat", "sleep", "watch", "read"]));
        const s = pick(rng, v.b === "sleep" || v.b === "eat" ? ["I", "He", "She", "We", "They", "The cat"] : ["I", "He", "She", "We", "They"]);
        const a = s === "I" ? "am not" : beFor(s) === "is" ? "isn't" : "aren't";
        const be = ["am not", "isn't", "aren't"].filter((x) => x !== a);
        const opts = [be[0], "doesn't"];
        return mk(`${s} ___ ${v.ing} now.`, a, opts, { [be[0]]: "be_agreement", "doesn't": "do_for_be" }, `${s} ${a} ${v.ing} now.`,
          "Przeczenie: am not / isn't / aren't + -ing", `${s} → ${a} + ${v.ing}`);
      },
      q: (rng) => {
        const s = pick(rng, ["you", "he", "she", "they", "your cat", "Tom"]);
        const v = vb(pick(rng, s === "your cat" ? ["eat", "sleep"] : ["play", "eat", "sleep", "watch", "read", "cook"]));
        const a = s === "you" || s === "they" ? "Are" : "Is";
        const w1 = a === "Is" ? "Are" : "Is";
        return mk(`___ ${s} ${v.ing} now?`, a, [w1, "Does"], { [w1]: "be_agreement", Does: "do_for_be" }, `${a} ${s} ${v.ing} now?`,
          "Pytanie: Is / Are + osoba + -ing?", `${s} → ${a} … ${v.ing}?`);
      },
    },
  },
  pc_vs_ps: {
    name: "simple czy continuous?", level: "A2", prereq: ["ps_3s", "pc"],
    patterns: {
      mix: (rng) => {
        const { v, s, os } = sv(rng, SUBJ_3S, ["play", "eat", "read", "watch", "cook", "swim", "sing", "draw", "ride"]);
        const now = rng() < 0.5;
        if (now) {
          const t = pick(rng, PC_TIME_END);
          return mk(`${s} ___${os} ${t}.`, `is ${v.ing}`, [v.s, v.b], { [v.s]: "ps_for_pc", [v.b]: "ps_for_pc" }, `${s} is ${v.ing}${os} ${t}.`,
            `"${t}" = teraz → is + -ing`, `"${t}" = now → is ${v.ing}`, { _f: { cueSafe: true } });
        }
        const t = pick(rng, ["every day", "usually", "on Saturdays", "often", "every weekend"]);
        const adv = t === "usually" || t === "often";
        const text = adv ? `${s} ${t} ___${os}.` : `${s} ___${os} ${t}.`;
        const full = adv ? `${s} ${t} ${v.s}${os}.` : `${s} ${v.s}${os} ${t}.`;
        return mk(text, v.s, [`is ${v.ing}`, v.b], { [`is ${v.ing}`]: "pc_for_ps", [v.b]: "no_s" }, full,
          `"${t}" = zwykle / regularnie → present simple (+s)`, `"${t}" = a habit → ${v.s}`);
      },
    },
  },
};

// ---------- helpers ----------
function ps3(rng, verbs) {
  const { v, s, o, os } = sv(rng, SUBJ_3S, verbs);
  const t = STATIVE.has(v.b) ? "" : " " + timeFor(rng, o);
  // zła pisownia -s: play → plaies, study → studys, watch → watchs, go → gos, have → haves, like → likees
  const bad = v.b === "have" ? "haves" : /[aeiou]y$/.test(v.b) ? v.b.slice(0, -1) + "ies" : v.b.endsWith("y") ? v.b + "s" : /(ch|sh|o)$/.test(v.b) ? v.b + "s" : v.b + "es";
  const wrong = [v.b, rng() < 0.5 && v.ing ? v.ing : bad];
  const why = v.b === "have" ? `${s} → has (not haves)` : /(ch|sh|o|ss|x)$/.test(v.b) ? `${s} → ${v.b} + es → ${v.s}` : /[^aeiou]y$/.test(v.b) ? `${s} → ${v.b} → ${v.s} (y → ies)` : `${s} → ${v.b} + s → ${v.s}`;
  return mk(`${s} ___${os}${t}.`, v.s, wrong, { [v.b]: "no_s", ...(v.ing ? { [v.ing]: "ing_confusion" } : {}), [bad]: "s_spelling" }, `${s} ${v.s}${os}${t}.`,
    v.b === "have" ? "he / she / it + have → has" : /(ch|sh|o|ss|x)$/.test(v.b) ? `Po -ch, -sh, -o dodajemy -es: ${v.s}` : /[^aeiou]y$/.test(v.b) ? `Spółgłoska + y → -ies: ${v.s}` : `he / she / it → dodaj -s: ${v.s}`,
    why);
}
function pl(rng, triples, hint, whyFn) {
  const [one, many, overreg] = pick(rng, triples);
  const n = pick(rng, ["two", "three", "four", "five", "ten"]);
  const wrong = [one === many ? null : one, overreg].filter(Boolean);
  if (wrong.length < 2) wrong.push(one + "es");
  const tags = { [overreg]: "plural_form" };
  for (const w of wrong) tags[w] = tags[w] || (w === one ? "plural_missing" : "plural_form");
  return mk(`one ${one} → ${n} ___`, many, wrong, tags, `${n} ${many}`, hint, whyFn(one, many), { typeable: true });
}
