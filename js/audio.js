// Dźwięki generowane w przeglądarce (bez plików) + lektor (głos przeglądarki, darmowy).
let ctx = null;
let sfxOn = true, musicOn = true;
export function setAudio({ sfx, music }) { sfxOn = sfx; musicOn = music; if (!musicOn) stopMusic(); }
function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; } } if (ctx.state === "suspended") ctx.resume(); return ctx; }

function tone(freq, dur = 0.12, type = "sine", vol = 0.18, when = 0, slide = 0) {
  const c = ac(); if (!c || !sfxOn) return;
  const t = c.currentTime + when;
  const o = c.createOscillator(), g = c.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur = 0.15, vol = 0.15, when = 0) {
  const c = ac(); if (!c || !sfxOn) return;
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const s = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
  f.type = "lowpass"; f.frequency.value = 1800; s.buffer = b; g.gain.value = vol;
  s.connect(f).connect(g).connect(c.destination); s.start(c.currentTime + when);
}

export const sfx = {
  tap: () => tone(660, 0.05, "triangle", 0.08),
  correct: () => { tone(660, 0.09, "triangle", 0.16); tone(990, 0.14, "triangle", 0.16, 0.08); },
  wrong: () => { tone(220, 0.18, "sawtooth", 0.08, 0, -80); },
  hit: () => { noise(0.12, 0.2); tone(180, 0.1, "square", 0.08, 0, -100); },
  crit: () => { noise(0.18, 0.25); tone(880, 0.1, "square", 0.1); tone(1320, 0.18, "triangle", 0.12, 0.08); },
  hurt: () => { tone(300, 0.2, "sawtooth", 0.1, 0, -200); },
  coin: () => { tone(1320, 0.06, "square", 0.06); tone(1760, 0.1, "square", 0.06, 0.05); },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, "triangle", 0.15, i * 0.1)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.25, "triangle", 0.12, i * 0.15)),
  chest: () => [784, 988, 1175, 1568, 1976].forEach((f, i) => tone(f, 0.12, "triangle", 0.12, i * 0.07)),
  level: () => [523, 784, 1046, 1568].forEach((f, i) => tone(f, 0.22, "sine", 0.16, i * 0.09)),
  perk: () => { tone(880, 0.08, "sine", 0.12); tone(1320, 0.16, "sine", 0.12, 0.06); },
};

// prosta pętla muzyczna (cicha, generatywna)
let musicTimer = null;
export function startMusic(mood = "tower") {
  stopMusic(); if (!musicOn) return;
  const scales = { tower: [262, 294, 330, 392, 440], boss: [220, 247, 262, 330, 349], home: [349, 392, 440, 523, 587], shadow: [196, 233, 262, 294, 349] };
  const sc = scales[mood] || scales.tower;
  let step = 0;
  musicTimer = setInterval(() => {
    if (!musicOn || document.hidden) return;
    const c = ac(); if (!c) return;
    if (step % 8 === 0) tone(sc[0] / 2, 0.5, "sine", 0.05);
    if (Math.random() < 0.65) tone(sc[Math.floor(Math.random() * sc.length)] * (Math.random() < 0.3 ? 2 : 1), 0.22, "triangle", 0.035);
    step++;
  }, mood === "boss" ? 230 : 300);
}
export function stopMusic() { clearInterval(musicTimer); musicTimer = null; }

// ---- lektor ----
let voice = null;
function pickVoice() {
  const vs = speechSynthesis.getVoices();
  voice = vs.find((v) => /en-GB/i.test(v.lang) && /female|google|natural|sonia|libby|serena/i.test(v.name))
    || vs.find((v) => /en-GB/i.test(v.lang)) || vs.find((v) => /^en/i.test(v.lang)) || null;
}
if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
export function speak(text, rate = 0.85) {
  if (!("speechSynthesis" in window) || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(text).replace(/___/g, "…").replace(/[🌀-🫶]/gu, ""));
  if (voice) u.voice = voice; u.lang = voice ? voice.lang : "en-GB"; u.rate = rate; u.pitch = 1.05;
  speechSynthesis.speak(u);
}
export const canSpeak = () => "speechSynthesis" in window;
