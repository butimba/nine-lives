// Rysowanie zadań. Każde zadanie zwraca Promise z wynikiem: { ok, ms, tag, hinted }.
import { h, esc, shuffle, sleep } from "./util.js";
import { speak } from "./audio.js";
import { sfx } from "./audio.js";

export function imgHTML(img, cls = "") {
  if (!img) return "";
  if (img.startsWith("color:")) return `<span class="img swatch ${cls}" style="--c:${img.slice(6)}"></span>`;
  if (img.startsWith("num:")) return `<span class="img num ${cls}">${img.slice(4)}</span>`;
  return `<span class="img emoji ${cls}">${img}</span>`;
}
const spk = (text) => `<button class="spk" data-say="${esc(text)}" aria-label="Posłuchaj">🔊</button>`;
const norm = (s) => s.toLowerCase().replace(/[-\s]+/g, " ").replace(/[^a-z ']/g, "").trim();
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

const TITLES = {
  word2pic: "Find the picture!", listen2pic: "Listen and tap!", pic2listen: "Which one is it?", pic2word: "What is it?",
  pl2en: "In English?", spell: "Spell it!", type: "Type it!", match: "Match them!", cloze: "Fill the gap!",
  fix: "Find the mistake! 🔍", judge: "Right or wrong?", build: "Build the sentence!",
};
const TITLES_PL = {
  word2pic: "Znajdź obrazek", listen2pic: "Posłuchaj i kliknij", pic2listen: "Posłuchaj, które to słowo", pic2word: "Co to jest?",
  pl2en: "Jak to po angielsku?", spell: "Ułóż słowo z literek", type: "Wpisz słowo", match: "Połącz pary", cloze: "Uzupełnij lukę",
  fix: "Kliknij błędne słowo", judge: "Dobrze czy źle?", build: "Ułóż zdanie",
};

// tekst odpowiedzi (do ekranu po błędzie)
export function answerReveal(t) {
  if (t.kind === "vocab") return `<div class="reveal">${imgHTML(t.word.img, "sm")} <b>${esc(t.word.en)}</b> = ${esc(t.word.pl)}</div>`;
  return `<div class="reveal"><b>${esc(t.q.full)}</b>${t.q.hint ? `<div class="hint-pl">💡 ${esc(t.q.hint)}</div>` : ""}</div>`;
}
export const sayText = (t) => (t.kind === "vocab" ? t.word.en : t.q.full);

export function renderIntro(t, box) {
  return new Promise((res) => {
    box.innerHTML = "";
    const el = h(`<div class="card intro pop">
      <div class="tag-new">✨ New word!</div>
      <div class="intro-img">${imgHTML(t.word.img, "xl")}</div>
      <div class="intro-word">${esc(t.word.en)} ${spk(t.word.en)}</div>
      <div class="intro-pl">${esc(t.word.pl)}</div>
      <button class="btn big go">Got it! 👍</button></div>`);
    box.append(el);
    speak(t.word.en);
    wireSpk(el);
    el.querySelector(".go").onclick = () => { sfx.tap(); res(); };
  });
}

function wireSpk(root) { root.querySelectorAll(".spk").forEach((b) => (b.onclick = (e) => { e.stopPropagation(); speak(b.dataset.say); })); }

export function renderTask(t, box, ctx = {}) {
  return new Promise((resolve) => {
    const t0 = performance.now();
    let hinted = false, done = false;
    const finish = (ok, tag, extra = {}) => { if (done) return; done = true; resolve({ ok, ms: performance.now() - t0, tag, hinted, ...extra }); };
    if (location.search.includes("debug")) window.__task = t;
    ctx.abort = () => finish(false, null, { aborted: true });
    box.innerHTML = "";
    const showPl = ctx.showPl !== false;
    const card = h(`<div class="card task pop t-${t.type}">
      <div class="task-title">${TITLES[t.type]}${showPl ? `<span class="task-pl">${TITLES_PL[t.type]}</span>` : ""}</div>
      <div class="prompt"></div><div class="answers"></div>
      <div class="task-tools"></div></div>`);
    box.append(card);
    const P = card.querySelector(".prompt"), A = card.querySelector(".answers"), T = card.querySelector(".task-tools");

    // podpowiedź (talent Sixth Sense) — usuwa jedną złą opcję
    const addHint = (removeFn) => {
      if (!ctx.hints || ctx.hints.left <= 0) return;
      const b = h(`<button class="btn ghost hint">💡 ${ctx.hints.left}</button>`);
      b.onclick = () => { if (ctx.hints.left <= 0) return; if (removeFn()) { ctx.hints.left--; hinted = true; b.textContent = `💡 ${ctx.hints.left}`; sfx.perk(); if (ctx.hints.left <= 0) b.remove(); } };
      T.append(b);
    };
    const optionButtons = (opts, labelFn, onPick) => {
      A.className = "answers grid-" + opts.length;
      const btns = opts.map((o) => {
        const b = h(`<button class="opt">${labelFn(o)}</button>`);
        b.onclick = () => onPick(o, b, btns);
        A.append(b); return b;
      });
      addHint(() => {
        const wrong = btns.filter((b, i) => !opts[i].ok && !b.disabled);
        if (!wrong.length || btns.filter((b) => !b.disabled).length <= 2) return false;
        const w = wrong[Math.floor(Math.random() * wrong.length)]; w.disabled = true; w.classList.add("gone"); return true;
      });
      return btns;
    };
    const mark = (btns, opts, chosen) => {
      btns.forEach((b, i) => { b.disabled = true; if (opts[i].ok) b.classList.add("right"); });
      if (!chosen.ok) btns[opts.indexOf(chosen)].classList.add("wrong");
    };
    const pickHandler = (opts) => (o, b, btns) => { mark(btns, opts, o); finish(o.ok, o.tag); };

    switch (t.type) {
      case "word2pic": {
        P.innerHTML = `<div class="big-word">${esc(t.word.en)} ${spk(t.word.en)}</div>`;
        if (t.voice) speak(t.word.en);
        optionButtons(t.options, (o) => imgHTML(o.img, "opt-img"), pickHandler(t.options));
        break;
      }
      case "listen2pic": {
        P.innerHTML = `<button class="spk huge" data-say="${esc(t.word.en)}">🔊</button><div class="sub">Tap to listen again</div>`;
        setTimeout(() => speak(t.word.en), 250);
        optionButtons(t.options, (o) => imgHTML(o.img, "opt-img"), pickHandler(t.options));
        break;
      }
      case "pic2listen": {
        P.innerHTML = `<div class="prompt-img">${imgHTML(t.word.img, "xl")}</div>`;
        A.className = "answers grid-" + t.options.length;
        let sel = null;
        const btns = t.options.map((o, i) => {
          const b = h(`<button class="opt listen"><span class="num-badge">${i + 1}</span> 🔊</button>`);
          b.onclick = () => { speak(o.en); btns.forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); sel = o; ok.disabled = false; };
          A.append(b); return b;
        });
        const ok = h(`<button class="btn big go" disabled>✔ To ten!</button>`);
        ok.onclick = () => { if (!sel) return; mark(btns, t.options, sel); ok.remove(); finish(sel.ok); };
        T.append(ok);
        break;
      }
      case "pic2word": {
        P.innerHTML = `<div class="prompt-img">${imgHTML(t.word.img, "xl")}</div>`;
        optionButtons(t.options, (o) => `<span class="w">${esc(o.en)}</span>`, (o, b, btns) => { if (t.voice) speak(o.en); pickHandler(t.options)(o, b, btns); });
        break;
      }
      case "pl2en": {
        P.innerHTML = `<div class="pl-word">🇵🇱 ${esc(t.word.pl)}</div>`;
        optionButtons(t.options, (o) => `<span class="w">${esc(o.en)}</span>`, pickHandler(t.options));
        break;
      }
      case "spell": {
        const target = t.target;
        P.innerHTML = `<div class="prompt-img">${imgHTML(t.word.img, "lg")}</div><div class="pl-small">${esc(t.word.pl)}</div>`;
        const slots = h(`<div class="slots"></div>`);
        const chars = target.split("");
        const slotEls = chars.map((c) => { const s = h(`<span class="slot ${/[a-zA-Z]/.test(c) ? "" : "fixed"}">${/[a-zA-Z]/.test(c) ? "" : c === " " ? "&nbsp;" : c}</span>`); slots.append(s); return s; });
        P.append(slots);
        const letterIdx = chars.map((c, i) => (/[a-zA-Z]/.test(c) ? i : -1)).filter((i) => i >= 0);
        const typed = [];
        A.className = "answers tiles";
        const tiles = t.tiles.map((ch) => {
          const b = h(`<button class="tile">${ch}</button>`);
          b.onclick = () => {
            if (b.disabled) return; sfx.tap();
            b.disabled = true; typed.push(b);
            slotEls[letterIdx[typed.length - 1]].textContent = ch;
            if (typed.length === letterIdx.length) check();
          };
          A.append(b); return b;
        });
        const back = h(`<button class="btn ghost">⌫</button>`);
        back.onclick = () => { const b = typed.pop(); if (!b) return; b.disabled = false; slotEls[letterIdx[typed.length]].textContent = ""; };
        T.append(back);
        const check = () => {
          const word = letterIdx.map((i) => slotEls[i].textContent).join("").toLowerCase();
          const ok = word === target.replace(/[^a-zA-Z]/g, "").toLowerCase();
          slots.classList.add(ok ? "right" : "wrong");
          tiles.forEach((b) => (b.disabled = true)); back.remove();
          finish(ok, ok ? null : "spelling");
        };
        break;
      }
      case "type": {
        P.innerHTML = `<div class="prompt-img">${imgHTML(t.word.img, "lg")}</div><div class="pl-small">${esc(t.word.pl)}</div>`;
        const form = h(`<form class="typebox"><input autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="type here…" maxlength="30"/><button class="btn go">✔</button></form>`);
        A.append(form);
        const inp = form.querySelector("input");
        setTimeout(() => inp.focus(), 50);
        let tries = 0;
        const firstLetter = h(`<button class="btn ghost" type="button">🔤 Pierwsza litera</button>`);
        firstLetter.onclick = () => { inp.value = t.word.en[0]; inp.focus(); hinted = true; firstLetter.remove(); };
        T.append(firstLetter);
        form.onsubmit = (e) => {
          e.preventDefault();
          const v = norm(inp.value), goal = norm(t.word.en);
          if (!v) return;
          if (v === goal) { inp.classList.add("right"); inp.disabled = true; return finish(true); }
          if (tries === 0 && lev(v, goal) <= Math.max(1, Math.floor(goal.length / 6))) {
            tries++; hinted = true; inp.classList.add("almost"); sfx.wrong();
            const m = h(`<div class="almost-msg">Prawie! Popraw literówkę ✏️</div>`); A.append(m); setTimeout(() => m.remove(), 1800); return;
          }
          inp.classList.add("wrong"); inp.disabled = true; finish(false, "spelling");
        };
        break;
      }
      case "match": {
        P.innerHTML = "";
        A.className = "answers match";
        const left = h(`<div class="mcol"></div>`), right = h(`<div class="mcol"></div>`);
        A.append(left, right);
        let selL = null, mistakes = 0, matched = 0;
        const L = t.pairs.map((p) => { const b = h(`<button class="opt mimg">${imgHTML(p.img, "opt-img")}</button>`); b.dataset.en = p.en; left.append(b); return b; });
        const R = shuffle(t.pairs).map((p) => { const b = h(`<button class="opt mword"><span class="w">${esc(p.en)}</span></button>`); b.dataset.en = p.en; right.append(b); return b; });
        L.forEach((b) => (b.onclick = () => { L.forEach((x) => x.classList.remove("sel")); b.classList.add("sel"); selL = b; sfx.tap(); }));
        R.forEach((b) => (b.onclick = () => {
          if (t.voice) speak(b.dataset.en);
          if (!selL) { b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 400); return; }
          if (selL.dataset.en === b.dataset.en) {
            selL.disabled = b.disabled = true; selL.classList.add("right"); b.classList.add("right"); selL.classList.remove("sel"); selL = null; matched++; sfx.correct();
            if (matched === t.pairs.length) finish(mistakes <= 1, mistakes > 1 ? "match" : null, { mistakes });
          } else { mistakes++; b.classList.add("wrong"); sfx.wrong(); setTimeout(() => b.classList.remove("wrong"), 500); }
        }));
        break;
      }
      case "cloze": {
        P.innerHTML = `<div class="sentence">${esc(t.q.text).replace("___", `<span class="gap">___</span>`)} ${spk(t.q.text.replace("___", "…"))}</div>`;
        if (t.voice) speak(t.q.text);
        optionButtons(t.options, (o) => `<span class="w">${esc(o.label)}</span>`, (o, b, btns) => {
          mark(btns, t.options, o);
          P.querySelector(".gap").textContent = t.q.answer; P.querySelector(".gap").classList.add(o.ok ? "right" : "fixed");
          finish(o.ok, o.tag);
        });
        break;
      }
      case "fix": {
        P.innerHTML = `<div class="sub">Jedno słowo jest złe. Kliknij je!</div>`;
        A.className = "answers tokens";
        const btns = t.tokens.map((tok, i) => {
          const b = h(`<button class="tok">${esc(tok)}</button>`);
          b.onclick = () => {
            btns.forEach((x) => (x.disabled = true));
            const ok = i === t.badIdx;
            btns[t.badIdx].classList.add(ok ? "right" : "bad");
            if (!ok) b.classList.add("wrong");
            finish(ok, ok ? null : t.tag || "fix");
          };
          A.append(b); return b;
        });
        break;
      }
      case "judge": {
        P.innerHTML = `<div class="sentence">${esc(t.sentence)}</div>`;
        if (t.voice) speak(t.sentence);
        A.className = "answers grid-2";
        const yes = h(`<button class="opt judge-yes">✅ Right</button>`), no = h(`<button class="opt judge-no">❌ Wrong</button>`);
        const go = (says) => { yes.disabled = no.disabled = true; const ok = says === t.correct; (t.correct ? yes : no).classList.add("right"); if (!ok) (says ? yes : no).classList.add("wrong"); finish(ok, ok ? null : t.tag || "judge"); };
        yes.onclick = () => go(true); no.onclick = () => go(false);
        A.append(yes, no);
        break;
      }
      case "build": {
        const line = h(`<div class="build-line"></div>`);
        P.innerHTML = `<div class="sub">Kliknij słowa po kolei</div>`; P.append(line);
        A.className = "answers tiles words";
        const placed = [];
        const tiles = t.tiles.map((tt) => {
          const b = h(`<button class="tile word">${esc(tt.w)}</button>`);
          b.onclick = () => {
            if (b.disabled) return; sfx.tap(); b.disabled = true;
            const chip = h(`<button class="chip">${esc(tt.w)}</button>`);
            chip.onclick = () => { if (done) return; chip.remove(); b.disabled = false; placed.splice(placed.indexOf(tt), 1); };
            line.append(chip); placed.push(tt);
            if (placed.length === t.words.length) {
              const ok = placed.map((p) => p.w).join(" ") === t.words.join(" ");
              line.classList.add(ok ? "right" : "wrong");
              tiles.forEach((x) => (x.disabled = true));
              finish(ok, ok ? null : "word_order");
            }
          };
          A.append(b); return b;
        });
        break;
      }
    }
    wireSpk(card);
  });
}
