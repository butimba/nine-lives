// GRAMATYKA — generator zdań. Każda umiejętność ma "wzorce" (patterns).
// Klucz postępu: "g:<skill>:<pattern>". Nie zmieniaj istniejących id — dodawaj nowe.
// make(rng) zwraca: { text: "Tom ___ football.", answer, wrong:[...], tags:{opcja:tag}, full, hint }
// "full" = pełne poprawne zdanie (używane do układania z klocków i "znajdź błąd").

const pick = (rng, a) => a[Math.floor(rng() * a.length)];

// ---------- dane ----------
export const VERBS = [
  // base, 3rd person, -ing, polski (bezokolicznik), obiekty pasujące
  { b: "play", s: "plays", ing: "playing", objs: ["football", "tennis", "the piano", "video games", "with a ball"] },
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
  { b: "fly", s: "flies", ing: "flying", objs: ["a kite", "to London"] },
  { b: "cry", s: "cries", ing: "crying", objs: [""] },
  { b: "swim", s: "swims", ing: "swimming", objs: ["in the sea", "in the pool"] },
  { b: "run", s: "runs", ing: "running", objs: ["in the park", "fast", "to school"] },
  { b: "sing", s: "sings", ing: "singing", objs: ["songs", "in the shower", "a song"] },
  { b: "dance", s: "dances", ing: "dancing", objs: ["at parties", "in the kitchen"] },
  { b: "write", s: "writes", ing: "writing", objs: ["a letter", "stories", "an email"] },
  { b: "cook", s: "cooks", ing: "cooking", objs: ["dinner", "pancakes", "soup"] },
  { b: "sleep", s: "sleeps", ing: "sleeping", objs: ["on the sofa", "in a box", "in the sun"] },
  { b: "draw", s: "draws", ing: "drawing", objs: ["cats", "monsters", "a picture"] },
  { b: "climb", s: "climbs", ing: "climbing", objs: ["trees", "the wall"] },
  { b: "brush", s: "brushes", ing: "brushing", objs: ["the cat", "the horse", "the dog"] },
  { b: "carry", s: "carries", ing: "carrying", objs: ["a bag", "a pumpkin", "a box"] },
];
const vb = (b) => VERBS.find((v) => v.b === b);

// osoby 3. osoby liczby pojedynczej i inne
const SUBJ_3S = ["He", "She", "Tom", "Mia", "My cat", "My mum", "The dog", "My brother", "Grandma", "The witch", "Zoe", "Leo"];
const SUBJ_PL = ["I", "You", "We", "They", "My friends", "Tom and Mia", "The cats", "My parents"];
const subjFix = (s) => (s === "I" ? "I" : ["He", "She", "You", "We", "They", "It"].includes(s) || s.startsWith("My ") || s.startsWith("The ") ? s[0].toLowerCase() + s.slice(1) : s);

const PS_TIME = ["every day", "every morning", "on Mondays", "at the weekend", "after school", "every evening"];
const PC_TIME_END = ["now", "right now", "at the moment"];
const PC_TIME_START = ["Look!", "Listen!", "Shh!"];

const beFor = (s) => (s === "I" ? "am" : SUBJ_3S.includes(s) || s === "It" ? "is" : "are");
const objFor = (v, rng) => { const o = pick(rng, v.objs); return o ? " " + o : ""; };

// ---------- umiejętności ----------
export const SKILLS = {
  // TO BE
  be: {
    name: "am / is / are", level: "A1", prereq: [],
    patterns: {
      basic: (rng) => {
        const s = pick(rng, ["I", ...SUBJ_3S, ...SUBJ_PL.slice(1)]);
        const adj = pick(rng, ["happy", "tired", "hungry", "scared", "ten years old", "at school", "in the garden", "my friend"]);
        const a = beFor(s);
        const adjOk = adj === "my friend" && SUBJ_PL.includes(s) && s !== "I" ? "my friends" : adj;
        return mk(`${s} ___ ${adjOk}.`, a, ["am", "is", "are"].filter((x) => x !== a), {}, `${s} ${a} ${adjOk}.`,
          "I → am, he/she/it → is, you/we/they → are");
      },
      neg: (rng) => {
        const s = pick(rng, ["I", "He", "She", "We", "They", "My cat", "It"]);
        const a = s === "I" ? "am not" : beFor(s) === "is" ? "isn't" : "aren't";
        const opts = ["am not", "isn't", "aren't"].filter((x) => x !== a);
        const adj = pick(rng, ["cold", "sad", "at home", "late"]);
        return mk(`${s} ___ ${adj}.`, a, opts, {}, `${s} ${a} ${adj}.`, "Przeczenie: am not / isn't / aren't");
      },
      q: (rng) => {
        const s = pick(rng, ["you", "he", "she", "they", "your mum", "it"]);
        const a = s === "you" || s === "they" ? "Are" : "Is";
        const adj = pick(rng, ["hungry", "OK", "at home", "ready", "scared"]);
        return mk(`___ ${s} ${adj}?`, a, ["Am", "Is", "Are"].filter((x) => x !== a), {}, `${a} ${s} ${adj}?`,
          "Pytanie: przestaw am/is/are na początek");
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
        const o = pick(rng, ["a dog", "a black cat", "two sisters", "a new bike", "blue eyes", "long hair", "a big pumpkin"]);
        return mk(`${s} ___ got ${o}.`, a, [a === "has" ? "have" : "has", "is"], { is: "be" }, `${s} ${a} got ${o}.`,
          "he/she/it → has got, reszta → have got");
      },
      neg: (rng) => {
        const s = pick(rng, ["I", "He", "She", "We", "They", "My cat"]);
        const a = ["He", "She", "My cat"].includes(s) ? "hasn't" : "haven't";
        const o = pick(rng, ["a car", "any brothers", "a phone", "a tail"]);
        return mk(`${s} ___ got ${o}.`, a, [a === "hasn't" ? "haven't" : "hasn't", "doesn't"], {}, `${s} ${a} got ${o}.`,
          "Przeczenie: haven't got / hasn't got");
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
          ["Babies", "can't", "drive"], ["Ghosts", "can", "fly"], ["Frogs", "can", "jump"], ["Elephants", "can't", "fly"],
        ]);
        return mk(`${f[0]} ___ ${f[2]}.`, f[1], [f[1] === "can" ? "can't" : "can"], {}, `${f[0]} ${f[1]} ${f[2]}.`,
          "can = umie / potrafi, can't = nie umie");
      },
      form: (rng) => {
        const s = pick(rng, ["She", "He", "My cat", "Tom", "I", "We"]);
        const v = pick(rng, ["swim", "dance", "sing", "ride a bike", "play chess", "speak English"]);
        return mk(`${s} can ___.`, v, [v.split(" ")[0] + (v.split(" ")[0].endsWith("e") ? "s" : "s") + v.slice(v.split(" ")[0].length), "to " + v],
          { [v.split(" ")[0] + "s" + v.slice(v.split(" ")[0].length)]: "s_after_modal", ["to " + v]: "to_after_modal" },
          `${s} can ${v}.`, "Po can zawsze forma podstawowa: can swim (nie: can swims, can to swim)");
      },
      q: (rng) => {
        const s = pick(rng, ["you", "he", "she", "your dog", "they"]);
        const v = pick(rng, ["swim", "cook", "jump high", "count to ten", "whistle"]);
        return mk(`___ ${s} ${v}?`, "Can", ["Do", "Are"], {}, `Can ${s} ${v}?`, "Pytanie: Can + osoba + czasownik?");
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
          pick(rng, ["two cats", "three bats", "some candies", "five apples", "many stars", "two ghosts"]);
        const where = pick(rng, ["on the bed", "in the box", "under the table", "in the garden", "on the roof"]);
        const a = sing ? "is" : "are";
        return mk(`There ___ ${n} ${where}.`, a, [sing ? "are" : "is", "have"], { have: "have_for_there" }, `There ${a} ${n} ${where}.`,
          "There is + jedna rzecz, there are + kilka rzeczy");
      },
    },
  },
  // LICZBA MNOGA
  plural: {
    name: "liczba mnoga", level: "A1", prereq: [],
    patterns: {
      regular: (rng) => pl(rng, [["cat", "cats"], ["dog", "dogs"], ["book", "books"], ["apple", "apples"], ["bat", "bats"], ["car", "cars"], ["ghost", "ghosts"]], "Zwykle dodajemy -s"),
      es: (rng) => pl(rng, [["box", "boxes"], ["bus", "buses"], ["watch", "watches"], ["dress", "dresses"], ["witch", "witches"], ["fox", "foxes"]], "Po -s, -x, -ch, -sh dodajemy -es"),
      ies: (rng) => pl(rng, [["baby", "babies"], ["candy", "candies"], ["butterfly", "butterflies"], ["party", "parties"], ["city", "cities"]], "Spółgłoska + y → -ies"),
      irregular: (rng) => pl(rng, [["mouse", "mice"], ["child", "children"], ["man", "men"], ["woman", "women"], ["tooth", "teeth"], ["foot", "feet"], ["sheep", "sheep"], ["fish", "fish"]], "Wyjątki trzeba zapamiętać!"),
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
        const v = vb(pick(rng, ["play", "like", "eat", "read", "watch", "go"]));
        const s = pick(rng, SUBJ_PL);
        const t = pick(rng, PS_TIME);
        return mk(`${s} ___${objFor(v, rng)} ${t}.`, v.b, [v.s, v.ing].filter(Boolean),
          { [v.s]: "s_overuse", [v.ing]: "ing_confusion" }, null,
          "I / you / we / they → bez -s (I play, they play)", (a) => `${s} ${a}`);
      },
    },
  },
  ps_neg: {
    name: "present simple: don't / doesn't", level: "A1", prereq: ["ps_3s"],
    patterns: {
      neg: (rng) => {
        const v = vb(pick(rng, ["like", "play", "eat", "watch", "go", "drink"]));
        const s3 = rng() < 0.55;
        const s = pick(rng, s3 ? SUBJ_3S : SUBJ_PL);
        const a = s3 ? "doesn't" : "don't";
        return mk(`${s} ___ ${v.b}${objFor(v, rng)}.`, a, [s3 ? "don't" : "doesn't", s3 ? "isn't" : "aren't"],
          { isn: "be_for_do", "isn't": "be_for_do", "aren't": "be_for_do" }, null,
          "he/she/it → doesn't, reszta → don't. Po nich czasownik bez -s!", (x) => `${s} ${x} ${v.b}`);
      },
      base_after: (rng) => {
        const v = vb(pick(rng, ["like", "play", "eat", "watch", "go", "drink", "read"]));
        const s = pick(rng, SUBJ_3S);
        return mk(`${s} doesn't ___${objFor(v, rng)}.`, v.b, [v.s], { [v.s]: "s_after_does" }, null,
          "Po doesn't czasownik BEZ -s: she doesn't like (nie: likes)", (x) => `${s} doesn't ${x}`);
      },
    },
  },
  ps_q: {
    name: "present simple: Do / Does…?", level: "A1", prereq: ["ps_3s"],
    patterns: {
      q: (rng) => {
        const v = vb(pick(rng, ["like", "play", "eat", "watch", "go", "drink", "read"]));
        const s3 = rng() < 0.55;
        const s = subjFix(pick(rng, s3 ? SUBJ_3S : SUBJ_PL.filter((x) => x !== "I")));
        const a = s3 ? "Does" : "Do";
        return mk(`___ ${s} ${v.b}${objFor(v, rng)}?`, a, [s3 ? "Do" : "Does", s3 ? "Is" : "Are"],
          { Is: "be_for_do", Are: "be_for_do" }, null, "Does + he/she/it, Do + I/you/we/they", (x) => `${x} ${s} ${v.b}`);
      },
      short: (rng) => {
        const s3 = rng() < 0.5;
        const s = s3 ? pick(rng, ["she", "he", "your cat"]) : pick(rng, ["you", "they"]);
        const v = pick(rng, ["like pizza", "play football", "eat candy"]);
        const yes = rng() < 0.5;
        const pron = s === "you" ? "I" : s === "your cat" ? "it" : s;
        const a = `${yes ? "Yes" : "No"}, ${pron} ${s3 ? (yes ? "does" : "doesn't") : (yes ? "do" : "don't")}.`;
        const w1 = `${yes ? "Yes" : "No"}, ${pron} ${s3 ? (yes ? "do" : "don't") : (yes ? "does" : "doesn't")}.`;
        const w2 = `${yes ? "Yes" : "No"}, ${pron} ${yes ? "is" : "isn't"}.`;
        const text = `${s3 ? "Does" : "Do"} ${s} ${v}? — ___`;
        return { text, answer: a, wrong: [w1, w2], tags: {}, full: text.replace("___", a), hint: "Krótka odpowiedź powtarza do / does" };
      },
    },
  },
  // PRESENT CONTINUOUS
  pc: {
    name: "present continuous: is playing", level: "A1", prereq: ["be"],
    patterns: {
      form: (rng) => {
        const v = vb(pick(rng, ["play", "eat", "read", "watch", "sing", "dance", "cook", "sleep", "draw", "write", "drink"]));
        const s = pick(rng, [...SUBJ_3S, ...SUBJ_PL]);
        const be = beFor(s);
        const a = `${be} ${v.ing}`;
        const wrongBe = be === "is" ? "are" : be === "am" ? "is" : "is";
        const pre = rng() < 0.5;
        const t = pre ? pick(rng, PC_TIME_START) : pick(rng, PC_TIME_END);
        const o = objFor(v, rng);
        const text = pre ? `${t} ${s} ___${o}.` : `${s} ___${o} ${t}.`;
        return { text, answer: a, wrong: [v.s && SUBJ_3S.includes(s) ? v.s : v.b, `${wrongBe} ${v.ing}`, v.ing],
          tags: { [v.s]: "ps_for_pc", [v.b]: "ps_for_pc", [`${wrongBe} ${v.ing}`]: "be_agreement", [v.ing]: "missing_be" },
          full: (pre ? `${t} ${s} ${a}${o}.` : `${s} ${a}${o} ${t}.`), hint: "Teraz, w tej chwili → am/is/are + -ing" };
      },
      spelling: (rng) => {
        const [b, ing] = pick(rng, [["run", "running"], ["swim", "swimming"], ["sit", "sitting"], ["shop", "shopping"], ["dance", "dancing"], ["smile", "smiling"], ["skate", "skating"], ["hide", "hiding"]]);
        const s = pick(rng, SUBJ_3S);
        const wrong = b.endsWith("e") ? [b + "ing", b.slice(0, -1) + b.slice(-1) + "ing"] : [b + "ing", b + b.slice(-1) + b.slice(-1) + "ing"];
        const w = [...new Set(wrong.filter((x) => x !== ing))].slice(0, 2);
        return mk(`${s} is ___ now.`, ing, w, Object.fromEntries(w.map((x) => [x, "ing_spelling"])), `${s} is ${ing} now.`,
          b.endsWith("e") ? "Nieme -e znika: dance → dancing" : "Krótki czasownik: podwajamy literę: run → running");
      },
      neg: (rng) => {
        const v = vb(pick(rng, ["play", "eat", "sleep", "watch", "read"]));
        const s = pick(rng, ["I", "He", "She", "We", "They", "The cat"]);
        const a = s === "I" ? "am not" : beFor(s === "The cat" ? "He" : s) === "is" ? "isn't" : "aren't";
        const opts = ["am not", "isn't", "aren't", "doesn't"].filter((x) => x !== a).slice(0, 2);
        return mk(`${s} ___ ${v.ing} now.`, a, opts, { "doesn't": "do_for_be" }, `${s} ${a} ${v.ing} now.`, "Przeczenie: am not / isn't / aren't + -ing");
      },
      q: (rng) => {
        const v = vb(pick(rng, ["play", "eat", "sleep", "watch", "read", "cook"]));
        const s = pick(rng, ["you", "he", "she", "they", "your cat", "Tom"]);
        const a = s === "you" || s === "they" ? "Are" : "Is";
        return mk(`___ ${s} ${v.ing} now?`, a, [a === "Is" ? "Are" : "Is", "Does"], { Does: "do_for_be" }, `${a} ${s} ${v.ing} now?`,
          "Pytanie: Is/Are + osoba + -ing?");
      },
    },
  },
  pc_vs_ps: {
    name: "simple czy continuous?", level: "A2", prereq: ["ps_3s", "pc"],
    patterns: {
      mix: (rng) => {
        const v = vb(pick(rng, ["play", "eat", "read", "watch", "cook", "swim", "sing", "draw", "ride"]));
        const s = pick(rng, SUBJ_3S);
        const now = rng() < 0.5;
        const o = objFor(v, rng);
        if (now) {
          const t = pick(rng, ["now", "right now", "at the moment"]);
          return { text: `${s} ___${o} ${t}.`, answer: `is ${v.ing}`, wrong: [v.s, v.b], tags: { [v.s]: "ps_for_pc", [v.b]: "ps_for_pc" },
            full: `${s} is ${v.ing}${o} ${t}.`, hint: `"${t}" = teraz → is + -ing` };
        }
        const t = pick(rng, ["every day", "usually", "on Saturdays", "often", "every weekend"]);
        const text = t === "usually" || t === "often" ? `${s} ${t} ___${o}.` : `${s} ___${o} ${t}.`;
        const full = t === "usually" || t === "often" ? `${s} ${t} ${v.s}${o}.` : `${s} ${v.s}${o} ${t}.`;
        return { text, answer: v.s, wrong: [`is ${v.ing}`, v.b], tags: { [`is ${v.ing}`]: "pc_for_ps", [v.b]: "no_s" }, full,
          hint: `"${t}" = zwykle/regularnie → present simple (+s)` };
      },
    },
  },
};

// ---------- helpers ----------
function mk(text, answer, wrong, tags, full, hint, fullFn) {
  const f = full || (fullFn ? null : text.replace("___", answer));
  return { text, answer, wrong: [...new Set(wrong.filter((w) => w && w !== answer))], tags: tags || {}, full: f || text.replace("___", answer), hint };
}
function ps3(rng, verbs) {
  const v = vb(pick(rng, verbs));
  const s = pick(rng, SUBJ_3S);
  const t = pick(rng, PS_TIME);
  const o = objFor(v, rng);
  const bad = v.b === "have" ? "haves" : v.b.endsWith("y") ? v.b + "s" : /(ch|sh|o)$/.test(v.b) ? v.b + "s" : v.b + "es";
  const wrong = [v.b, rng() < 0.5 && v.ing ? v.ing : bad];
  return {
    text: `${s} ___${o} ${t}.`, answer: v.s, wrong: [...new Set(wrong.filter((w) => w !== v.s))],
    tags: { [v.b]: "no_s", [v.ing]: "ing_confusion", [bad]: "s_spelling" },
    full: `${s} ${v.s}${o} ${t}.`,
    hint: v.b === "have" ? "he/she/it + have → has" : /(ch|sh|o|ss|x)$/.test(v.b) ? `Po -ch, -sh, -o dodajemy -es: ${v.s}` : v.b.endsWith("y") ? `Spółgłoska + y → -ies: ${v.s}` : `he/she/it → dodaj -s: ${v.s}`,
  };
}
function pl(rng, pairs, hint) {
  const [one, many] = pick(rng, pairs);
  const n = pick(rng, ["two", "three", "four", "five", "ten"]);
  const wrong = [one, one + "s", one + "es"].filter((w) => w !== many);
  if (one.endsWith("y")) wrong.push(one + "s");
  return mk(`one ${one} → ${n} ___`, many, [...new Set(wrong)].slice(0, 2), {}, `${n} ${many}`, hint);
}
