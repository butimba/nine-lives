// DŹWIĘK: chiptune generowany w WebAudio (bez plików, bez muzyki Maxa) + lektor (głos przeglądarki).
// sfx.<klucz>() — krótkie efekty; nieznany klucz = cisza (Proxy), więc nowy kod nie wywali gry.
// startMusic(mood) — mała generatywna pętla: 'home-day' | 'home-night' | 'tower' | 'boss' | 'shadow' | 'chest'.
let ctx = null, master = null, sfxBus = null, musicBus = null;
let sfxOn = true, musicOn = true;
const HAS_WIN = typeof window !== "undefined";

function ac() {
  if (!HAS_WIN) return null;
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
    master = ctx.createGain(); master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ctx.destination);
    sfxBus = ctx.createGain(); sfxBus.gain.value = 1; sfxBus.connect(master);
    musicBus = ctx.createGain(); musicBus.gain.value = 0.55; musicBus.connect(master);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

export function setAudio({ sfx, music } = {}) {
  if (sfx !== undefined) sfxOn = !!sfx;
  if (music !== undefined) {
    const was = musicOn; musicOn = !!music;
    if (!musicOn) stopMusic(true);
    else if (!was && wantedMood) startMusic(wantedMood);
  }
}

// ---- fale pulsowe (12.5% / 25% / 50%) jak w NES ----
const waves = {};
function pulse(duty) {
  const c = ac(); if (!c) return null;
  if (waves[duty]) return waves[duty];
  const N = 32, re = new Float32Array(N), im = new Float32Array(N);
  for (let n = 1; n < N; n++) re[n] = (2 / (n * Math.PI)) * Math.sin(n * Math.PI * duty);
  return (waves[duty] = c.createPeriodicWave(re, im));
}

// type: 'p12' | 'p25' | 'square' | 'triangle' | 'sawtooth' | 'sine'
function osc(c, type) {
  const o = c.createOscillator();
  if (type === "p12") o.setPeriodicWave(pulse(0.125));
  else if (type === "p25") o.setPeriodicWave(pulse(0.25));
  else o.type = type;
  return o;
}

function tone(freq, dur = 0.1, type = "square", vol = 0.12, when = 0, slide = 0, bus = null, at = null) {
  const c = ac(); if (!c) return;
  if (!bus && !sfxOn) return;
  const t = at != null ? at : c.currentTime + when;
  const o = osc(c, type), g = c.createGain();
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.setValueAtTime(vol, t + dur * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(bus || sfxBus); o.start(t); o.stop(t + dur + 0.03);
}

let noiseBuf = null;
function noise(dur = 0.12, vol = 0.12, when = 0, { freq = 3000, type = "lowpass", slide = 0, bus = null, at = null } = {}) {
  const c = ac(); if (!c) return;
  if (!bus && !sfxOn) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    // "chiptune" noise: wartości trzymane po kilka próbek (bardziej 8-bitowo)
    let v = 0; for (let i = 0; i < d.length; i++) { if (i % 3 === 0) v = Math.random() * 2 - 1; d[i] = v; }
  }
  const t = at != null ? at : c.currentTime + when;
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = type; f.frequency.setValueAtTime(freq, t);
  if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(60, freq + slide), t + dur);
  s.buffer = noiseBuf; s.loop = true;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(bus || sfxBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
}

// szybkie arpeggio: freqs, krok w sekundach
function arp(freqs, step = 0.05, type = "p25", vol = 0.1, len = null) {
  freqs.forEach((f, i) => tone(f, len || step * 1.6, type, vol, i * step));
}

const N = (semi) => 440 * Math.pow(2, (semi - 9) / 12) / 2; // N(0) = C4 (~261.6)

const bank = {
  tap: () => tone(N(24), 0.04, "p12", 0.06),
  type: () => tone(N(19) + Math.random() * 40, 0.025, "p12", 0.04),
  correct: () => arp([N(12), N(16), N(19), N(24)], 0.045, "p25", 0.1),
  wrong: () => { tone(N(3), 0.12, "square", 0.08); tone(N(2), 0.2, "square", 0.08, 0.1, -40); },
  hit: () => { noise(0.09, 0.18, 0, { freq: 2400, slide: -1800 }); tone(N(0), 0.08, "square", 0.08, 0, -120); },
  crit: () => { noise(0.14, 0.22, 0, { freq: 4000, slide: -3000 }); arp([N(19), N(24), N(31)], 0.035, "p12", 0.1); },
  smash: () => { noise(0.16, 0.24, 0, { freq: 3200, slide: -2600 }); tone(N(-5), 0.12, "square", 0.1, 0, -60); tone(N(7), 0.05, "p12", 0.06, 0.02); },
  hurt: () => { tone(N(7), 0.18, "square", 0.09, 0, -220); noise(0.08, 0.08); },
  jump: () => tone(N(7), 0.12, "p25", 0.08, 0, 500),
  pop: () => { tone(N(24), 0.05, "sine", 0.12, 0, 600); noise(0.04, 0.08, 0.01, { freq: 6000, type: "highpass" }); },
  deflect: () => { tone(N(28), 0.06, "p12", 0.08); tone(N(35), 0.09, "triangle", 0.1, 0.04); noise(0.05, 0.06, 0, { freq: 7000, type: "highpass" }); },
  coin: () => { tone(N(35), 0.05, "p25", 0.06); tone(N(40), 0.12, "p25", 0.06, 0.05); },
  win: () => { arp([N(12), N(16), N(19), N(24), N(19), N(24), N(28)], 0.09, "p25", 0.1, 0.12); tone(N(0), 0.6, "triangle", 0.12); },
  lose: () => arp([N(7), N(3), N(0), N(-5)], 0.16, "triangle", 0.12, 0.22),
  chest: () => arp([N(19), N(23), N(26), N(31), N(35)], 0.06, "p25", 0.09),
  level: () => { arp([N(12), N(19), N(24), N(28), N(31), N(36)], 0.07, "p12", 0.09); tone(N(0), 0.5, "triangle", 0.12, 0.1); },
  perk: () => { tone(N(24), 0.07, "p25", 0.09); tone(N(31), 0.14, "p25", 0.09, 0.06); },
  bossIntro: () => {
    [N(-12), N(-11), N(-12), N(-9)].forEach((f, i) => tone(f, 0.24, "square", 0.11, i * 0.22));
    noise(0.6, 0.1, 0.0, { freq: 400, slide: 2000 });
    tone(N(-24), 1.0, "triangle", 0.16, 0.9);
  },
  lifeLost: () => { tone(N(12), 0.1, "p25", 0.09); tone(N(7), 0.1, "p25", 0.09, 0.09); tone(N(0), 0.25, "triangle", 0.11, 0.18, -60); },
  lifeGain: () => arp([N(12), N(16), N(19), N(24), N(28)], 0.05, "triangle", 0.13),
  crack: () => { noise(0.07, 0.2, 0, { freq: 5000, type: "bandpass" }); tone(N(-7) + Math.random() * 30, 0.06, "square", 0.08); },
  burst: () => { noise(0.45, 0.22, 0, { freq: 800, slide: 6000 }); arp([N(24), N(28), N(31), N(36), N(40)], 0.04, "p12", 0.08); },
  stamp: () => { noise(0.06, 0.26, 0, { freq: 900 }); tone(N(-12), 0.09, "square", 0.12, 0, -40); },
  purr: () => { for (let i = 0; i < 6; i++) { tone(N(-24), 0.09, "triangle", 0.12, i * 0.11, 8); noise(0.08, 0.03, i * 0.11, { freq: 300 }); } },
  snore: () => { noise(0.7, 0.05, 0, { freq: 300, slide: 500, type: "bandpass" }); tone(N(-17), 0.7, "triangle", 0.06, 0, 30); },
  cast: () => { arp([N(24), N(31), N(28), N(36)], 0.04, "p12", 0.08); noise(0.3, 0.07, 0.05, { freq: 6000, type: "highpass", slide: -3000 }); },
};

const noop = () => {};
// Proxy: sfx.cokolwiek() nigdy nie wywali gry; dźwięk nie może rzucić wyjątku.
export const sfx = new Proxy(bank, {
  get(t, k) {
    const fn = t[k];
    if (typeof fn !== "function") return noop;
    return (...a) => { try { fn(...a); } catch { /* audio nie jest krytyczne */ } };
  },
});

// ================= MUZYKA (generatywna, cicha) =================
// Każdy nastrój: tempo, skala, progresja akordów, instrumenty. Melodia = motyw 2-taktowy
// powtarzany z wariacją (A A' B A), więc brzmi jak piosenka, a nie losowy szum.
const MOODS = {
  "home-day":   { bpm: 96,  root: 0,  scale: [0, 2, 4, 7, 9], chords: [[0, 4, 7], [9, 0, 4], [5, 9, 0], [7, 11, 2]], lead: "p25", bass: "triangle", hat: 0.25, density: 0.55, vol: 0.05 },
  "home-night": { bpm: 70,  root: -3, scale: [0, 3, 5, 7, 10], chords: [[0, 3, 7], [8, 0, 3], [5, 8, 0], [7, 10, 2]], lead: "triangle", bass: "triangle", hat: 0, density: 0.35, vol: 0.05, echo: true },
  tower:        { bpm: 118, root: 2,  scale: [0, 2, 3, 5, 7, 9, 10], chords: [[0, 3, 7], [10, 2, 5], [8, 0, 3], [7, 10, 2]], lead: "p12", bass: "p25", hat: 0.5, density: 0.6, vol: 0.04 },
  boss:         { bpm: 140, root: 4,  scale: [0, 2, 3, 5, 7, 8, 11], chords: [[0, 3, 7], [0, 3, 7], [8, 0, 3], [7, 11, 2]], lead: "p25", bass: "square", hat: 0.9, density: 0.7, vol: 0.04, drive: true },
  shadow:       { bpm: 76,  root: -5, scale: [0, 1, 3, 5, 7, 8], chords: [[0, 3, 7], [1, 5, 8], [0, 3, 7], [10, 1, 5]], lead: "triangle", bass: "triangle", hat: 0.1, density: 0.3, vol: 0.05, echo: true },
  chest:        { bpm: 108, root: 5,  scale: [0, 2, 4, 7, 9, 11], chords: [[0, 4, 7, 11], [5, 9, 0, 4], [2, 5, 9, 0], [7, 11, 2, 5]], lead: "p12", bass: "triangle", hat: 0.3, density: 0.0, arp: true, vol: 0.045 },
};
const ALIAS = { home: "home-day", night: "home-night", cellar: "shadow" };

let musicTimer = null, currentMood = null, wantedMood = null, nextT = 0, step16 = 0, motif = null, rng = Math.random;
const freqOf = (semi) => 261.63 * Math.pow(2, semi / 12);

function makeMotif(m) {
  // 32 szesnastek (2 takty): indeks stopnia skali albo null (pauza)
  const out = []; let deg = 2;
  for (let i = 0; i < 32; i++) {
    const strong = i % 4 === 0;
    if (rng() < (strong ? m.density + 0.25 : m.density * 0.45)) {
      deg = Math.max(0, Math.min(m.scale.length * 2 - 1, deg + Math.round((rng() - 0.5) * 3.2)));
      out.push(deg);
    } else out.push(null);
  }
  return out;
}

function schedule() {
  const c = ac(); if (!c || !currentMood) return;
  const m = MOODS[currentMood];
  const s16 = 60 / m.bpm / 4;
  if (nextT < c.currentTime) nextT = c.currentTime + 0.05;
  while (nextT < c.currentTime + 0.35) {
    if (!(HAS_WIN && document.hidden)) playStep(m, step16, nextT, s16);
    nextT += s16; step16++;
  }
}

function playStep(m, i, t, s16) {
  const bar = Math.floor(i / 16) % 4;          // 4 takty = jedna progresja
  const section = Math.floor(i / 64) % 4;      // A A' B A
  const chord = m.chords[bar];
  const v = m.vol;
  const bus = musicBus;
  const pos = i % 16;
  // bas: na 1 i 3 (drive: ósemki)
  if (m.drive ? pos % 2 === 0 : (pos === 0 || pos === 8 || (pos === 12 && rng() < 0.3))) {
    const r = chord[0] + m.root - 24 + (m.drive && pos % 4 === 2 ? 12 : 0);
    tone(freqOf(r), s16 * (m.drive ? 1.6 : 3.5), m.bass, v * 1.3, 0, 0, bus, t);
  }
  // perkusja z szumu
  if (m.hat && pos % 2 === 0 && rng() < m.hat) noise(0.03, v * 0.5, 0, { freq: 8000, type: "highpass", bus, at: t });
  if (m.drive && pos % 8 === 4) noise(0.08, v * 0.9, 0, { freq: 1800, bus, at: t });
  // arpeggio (skrzynia) — akord w górę i w dół
  if (m.arp) {
    const seq = [...chord, ...chord.slice(1, -1).reverse()];
    const semi = seq[pos % seq.length] + m.root + 12;
    tone(freqOf(semi), s16 * 0.9, m.lead, v, 0, 0, bus, t);
    return;
  }
  // melodia z motywu
  if (!motif || (i % 128 === 0 && rng() < 0.35)) motif = makeMotif(m);
  let idx = i % 32;
  let d = motif[idx];
  if (section === 1 && d != null && idx >= 24) d += rng() < 0.5 ? 1 : -1;            // A' — inne zakończenie
  if (section === 2 && d != null) d += 2;                                               // B — wyżej
  if (d == null) return;
  d = Math.max(0, d);
  const oct = Math.floor(d / m.scale.length), deg = m.scale[d % m.scale.length];
  let semi = deg + 12 * oct + m.root;
  // na mocnej części taktu przyciągnij do dźwięku akordu (ładniej brzmi)
  if (pos % 4 === 0) {
    const pc12 = (x) => ((x % 12) + 12) % 12, dist = (a, b) => Math.min(Math.abs(a - b), 12 - Math.abs(a - b));
    const pc = pc12(semi);
    const best = chord.map((x) => pc12(x + m.root)).reduce((a, b) => (dist(b, pc) < dist(a, pc) ? b : a));
    let delta = best - pc; if (delta > 6) delta -= 12; if (delta < -6) delta += 12;
    semi += delta;
  }
  const len = s16 * (rng() < 0.3 ? 2.5 : 1.4);
  tone(freqOf(semi), len, m.lead, v, 0, 0, bus, t);
  if (m.echo) tone(freqOf(semi), len, m.lead, v * 0.35, 0, 0, bus, t + s16 * 3);
}

export function startMusic(mood = "tower") {
  mood = ALIAS[mood] || mood;
  if (!MOODS[mood]) mood = "tower";
  wantedMood = mood;
  if (!musicOn) return;
  if (currentMood === mood && musicTimer) return; // ten sam nastrój gra dalej, bez restartu
  stopMusic(true);
  const c = ac(); if (!c) return;
  currentMood = mood; step16 = 0; motif = null; nextT = c.currentTime + 0.1;
  musicBus.gain.cancelScheduledValues(c.currentTime);
  musicBus.gain.setValueAtTime(0.0001, c.currentTime);
  musicBus.gain.exponentialRampToValueAtTime(0.55, c.currentTime + 0.6);
  musicTimer = setInterval(schedule, 90);
  schedule();
}
export function stopMusic(keepWanted = false) {
  clearInterval(musicTimer); musicTimer = null; currentMood = null;
  if (!keepWanted) wantedMood = null;
}
export const musicMood = () => currentMood;

// ---- lektor ----
let voice = null;
const HAS_TTS = HAS_WIN && "speechSynthesis" in window;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /en-GB/i.test(v.lang) && /female|google|natural|sonia|libby|serena/i.test(v.name))
    || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if (HAS_TTS) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, rate = 0.85) {
  if (!HAS_TTS || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/___/g, "…").replace(/[🌀-🫶]/gu, ""));
  if (voice) u.voice = voice; u.lang = voice ? voice.lang : "en-GB"; u.rate = rate; u.pitch = 1.05;
  speechSynthesis.speak(u);
}
export const canSpeak = () => HAS_TTS;
