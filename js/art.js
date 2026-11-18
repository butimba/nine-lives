// Grafika: kot (SVG ze skórkami i czapkami), potworki składane z klocków, tła biomów.
import { SKINS, HATS } from "../data/cosmetics.js";

const skinById = (id) => SKINS.find((s) => s.id === id) || SKINS[0];

// ---------------- KOT ----------------
export function catSVG(skinId = "ginger", hatId = "none", opts = {}) {
  const s = skinById(skinId);
  const c = s.colors;
  const fx = s.fx || [];
  const uid = "c" + Math.random().toString(36).slice(2, 8);
  const furFill = fx.includes("rainbow") ? `url(#${uid}rb)` : fx.includes("galaxy") ? `url(#${uid}gx)` : c.fur;
  const ghostOp = fx.includes("ghost") ? 0.82 : 1;

  let defs = `
    <radialGradient id="${uid}sh" cx="50%" cy="40%" r="60%"><stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <linearGradient id="${uid}rb" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff6b6b"/><stop offset=".2" stop-color="#ffb84d"/><stop offset=".4" stop-color="#ffe94d"/>
      <stop offset=".6" stop-color="#6bdc6b"/><stop offset=".8" stop-color="#5bb5ff"/><stop offset="1" stop-color="#b46bff"/></linearGradient>
    <radialGradient id="${uid}gx" cx="40%" cy="40%" r="70%"><stop offset="0" stop-color="${c.belly}"/><stop offset="1" stop-color="${c.fur}"/></radialGradient>
    <clipPath id="${uid}hd"><circle cx="128" cy="88" r="44"/></clipPath>
    <clipPath id="${uid}bd"><ellipse cx="92" cy="140" rx="54" ry="36"/></clipPath>`;

  // efekty "pod" kotem
  let under = "";
  if (fx.includes("fire")) under += `<g class="fx-fire">${[60, 90, 120, 150].map((x, i) => `<path d="M${x} 175 q-14 -30 4 -60 q4 22 16 28 q6 -16 2 -30 q22 26 6 62z" fill="${i % 2 ? "#ffcf3f" : "#ff6b2c"}" opacity=".75" style="animation-delay:${i * 0.15}s"/>`).join("")}</g>`;
  if (fx.includes("toxic")) under += `<ellipse cx="100" cy="176" rx="70" ry="10" fill="#8fe04a" opacity=".45" class="fx-pulse"/>`;
  if (fx.includes("golden")) under += `<circle cx="105" cy="110" r="88" fill="#ffd84d" opacity=".18" class="fx-pulse"/>`;
  if (fx.includes("ice")) under += [40, 170, 60, 160].map((x, i) => `<path d="M${x} ${150 - i * 18} l6 -16 l6 16 l-6 16z" fill="#dff6ff" opacity=".9" class="fx-twinkle" style="animation-delay:${i * .3}s"/>`).join("");

  // ogon
  let tail = `<path d="M44 140 C10 130 8 90 30 72" stroke="${furFill}" stroke-width="15" fill="none" stroke-linecap="round" class="cat-tail"/>`;
  if (fx.includes("shrimp")) tail = `<g class="cat-tail"><path d="M44 140 C18 132 14 104 28 88" stroke="${c.fur}" stroke-width="15" fill="none" stroke-linecap="round"/>
      <path d="M28 88 l-18 -14 l10 22 l-14 2 l22 6z" fill="${c.stripe}"/>
      ${[0, 1, 2].map((i) => `<path d="M${40 - i * 8} ${134 - i * 15} q6 -4 12 2" stroke="${c.stripe}" stroke-width="3" fill="none"/>`).join("")}</g>`;
  if (fx.includes("robot")) tail = `<path d="M44 140 L22 120 L30 96 L20 76" stroke="${c.stripe}" stroke-width="9" fill="none" stroke-linejoin="round" class="cat-tail"/><circle cx="20" cy="74" r="7" fill="${c.ear}" class="fx-pulse"/>`;

  // tułów
  let bodyPattern = "";
  if (s.pattern === "stripes") bodyPattern = [70, 92, 114].map((x) => `<path d="M${x} 106 q6 18 0 30" stroke="${c.stripe}" stroke-width="7" fill="none" stroke-linecap="round" clip-path="url(#${uid}bd)"/>`).join("");
  if (s.pattern === "spots") bodyPattern = [[70, 124, 9], [100, 116, 7], [118, 134, 6], [58, 146, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c.stripe}" clip-path="url(#${uid}bd)"/>`).join("");
  const legs = [[58, 166], [78, 170], [108, 170], [128, 166]].map(([x, y]) =>
    `<rect x="${x - 9}" y="${y - 20}" width="18" height="24" rx="9" fill="${s.pattern === "socks" || s.pattern === "tux" ? c.belly : furFill}"/>`).join("");
  let body = `<ellipse cx="92" cy="140" rx="54" ry="36" fill="${furFill}"/>${bodyPattern}
    <ellipse cx="108" cy="150" rx="${s.pattern === "tux" ? 34 : 26}" ry="20" fill="${c.belly}"/>`;
  if (fx.includes("shrimp")) body += [70, 90, 110].map((x) => `<path d="M${x} 106 q-6 34 0 68" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" clip-path="url(#${uid}bd)"/>`).join("");
  if (fx.includes("robot")) body += `<rect x="72" y="124" width="26" height="18" rx="3" fill="${c.stripe}"/><circle cx="79" cy="133" r="3" fill="#38e8ff" class="fx-pulse"/><circle cx="91" cy="133" r="3" fill="#ffd23f"/>`;
  if (fx.includes("zombie")) body += `<path d="M66 128 l20 4 M70 124 l2 10 M78 126 l2 10" stroke="#3a2a2a" stroke-width="2.5"/>`;
  if (fx.includes("candy")) body += [60, 84, 108, 132].map((x, i) => `<circle cx="${x}" cy="${118 + (i % 2) * 14}" r="4" fill="${["#ff4f9a", "#5bd1ff", "#ffe14d", "#7cf07c"][i]}" clip-path="url(#${uid}bd)"/>`).join("");

  // głowa
  const earL = `<path d="M96 62 L100 24 L126 48 Z" fill="${furFill}"/><path d="M102 54 L104 36 L117 48 Z" fill="${c.ear}"/>`;
  const earR = `<path d="M140 46 L164 22 L168 64 Z" fill="${furFill}"/><path d="M146 46 L160 33 L162 56 Z" fill="${c.ear}"/>`;
  let headPattern = "";
  if (s.pattern === "stripes") headPattern = `<g clip-path="url(#${uid}hd)" stroke="${c.stripe}" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M118 46 l2 14"/><path d="M130 44 l0 15"/><path d="M142 46 l-2 14"/><path d="M86 86 l12 2"/><path d="M86 98 l12 -1"/></g>`;
  if (s.pattern === "spots") headPattern = `<circle cx="150" cy="62" r="8" fill="${c.stripe}" clip-path="url(#${uid}hd)"/>`;
  if (s.pattern === "tux") headPattern = `<path d="M128 132 Q104 112 112 96 Q128 106 144 96 Q152 112 128 132z" fill="${c.belly}" clip-path="url(#${uid}hd)"/>`;
  const eyeY = 88;
  const eyes = opts.sad
    ? `<path d="M110 ${eyeY} q8 -6 16 0" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M138 ${eyeY} q8 -6 16 0" stroke="#222" stroke-width="4" fill="none" stroke-linecap="round"/>`
    : `<g class="cat-eyes">
      <ellipse cx="117" cy="${eyeY}" rx="9" ry="11" fill="#fff"/><ellipse cx="147" cy="${eyeY}" rx="9" ry="11" fill="#fff"/>
      <ellipse cx="119" cy="${eyeY + 1}" rx="6.5" ry="8.5" fill="${c.eye}"/><ellipse cx="149" cy="${eyeY + 1}" rx="6.5" ry="8.5" fill="${c.eye}"/>
      <ellipse cx="120" cy="${eyeY + 2}" rx="3" ry="5.5" fill="#15121c"/><ellipse cx="150" cy="${eyeY + 2}" rx="3" ry="5.5" fill="#15121c"/>
      <circle cx="122" cy="${eyeY - 3}" r="2.6" fill="#fff"/><circle cx="152" cy="${eyeY - 3}" r="2.6" fill="#fff"/></g>`;
  let face = `${eyes}
    <path d="M131 101 l6 0 l-3 4 z" fill="${c.nose}"/>
    <path d="M134 105 q-4 6 -9 3 M134 105 q4 6 9 3" stroke="#3a2a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
    <ellipse cx="108" cy="104" rx="7" ry="4" fill="#ff7b9c" opacity=".35"/><ellipse cx="160" cy="104" rx="7" ry="4" fill="#ff7b9c" opacity=".35"/>
    <g stroke="#3a2a2a" stroke-width="1.6" stroke-linecap="round" opacity=".55">
      <path d="M100 100 l-22 -4"/><path d="M100 106 l-22 2"/><path d="M168 100 l22 -4"/><path d="M168 106 l22 2"/></g>`;
  let headExtra = "";
  if (fx.includes("shrimp")) headExtra += `<path d="M120 50 C112 20 96 12 84 14" stroke="${c.stripe}" stroke-width="3" fill="none" class="fx-wiggle"/><path d="M138 48 C142 16 160 8 176 10" stroke="${c.stripe}" stroke-width="3" fill="none" class="fx-wiggle"/>`;
  if (fx.includes("robot")) headExtra += `<path d="M132 44 L132 22" stroke="${c.stripe}" stroke-width="4"/><circle cx="132" cy="19" r="6" fill="${c.ear}" class="fx-pulse"/><circle cx="96" cy="88" r="3" fill="${c.stripe}"/><circle cx="168" cy="88" r="3" fill="${c.stripe}"/>`;
  if (fx.includes("pumpkin")) headExtra += `<path d="M130 46 q-2 -12 8 -16" stroke="#3d7a1a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M138 32 q10 -6 14 4 q-8 2 -14 -4z" fill="#5fae2e"/>`;
  if (fx.includes("zombie")) headExtra += `<path d="M150 64 l14 10 M152 72 l6 -6 M158 76 l6 -6" stroke="#3a2a2a" stroke-width="2.4"/>`;
  if (fx.includes("toxic")) headExtra += `<path d="M104 116 q2 12 -2 18 q-4 -6 2 -18z" fill="#8fe04a" class="fx-drip"/><path d="M152 118 q2 10 -2 14 q-4 -5 2 -14z" fill="#8fe04a" class="fx-drip" style="animation-delay:.6s"/>`;
  if (fx.includes("galaxy")) headExtra += [[110, 60], [150, 70], [80, 130], [120, 150], [60, 120], [140, 120]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 1.6 : 2.4}" fill="#fff" class="fx-twinkle" style="animation-delay:${i * .25}s"/>`).join("");
  if (fx.includes("golden") || fx.includes("rainbow")) headExtra += [[176, 40], [86, 30], [184, 120]].map(([x, y], i) => `<path d="M${x} ${y - 7} l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" fill="#fff6a8" class="fx-twinkle" style="animation-delay:${i * .4}s"/>`).join("");

  const head = `<g class="cat-head">${earL}${earR}<circle cx="128" cy="88" r="44" fill="${furFill}"/>${headPattern}
    <ellipse cx="134" cy="106" rx="20" ry="13" fill="${c.belly}" opacity="${s.pattern === "tux" ? 0 : .7}"/>${face}${headExtra}${hatSVG(hatId)}</g>`;

  return `<svg viewBox="0 0 200 200" class="cat-svg ${opts.cls || ""}" style="opacity:${ghostOp}" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>
    <ellipse cx="96" cy="182" rx="62" ry="8" fill="#000" opacity=".18" class="cat-shadow"/>
    ${under}<g class="cat-body-g">${tail}${legs}${body}</g>${head}
  </svg>`;
}

export function hatSVG(id) {
  switch (id) {
    case "bow": return `<g transform="translate(150 44) rotate(15)"><path d="M0 0 l-16 -10 l0 20z M0 0 l16 -10 l0 20z" fill="#ff4f8b"/><circle r="5" fill="#ff8fb5"/></g>`;
    case "cap": return `<path d="M92 56 Q128 18 164 52 Z" fill="#2f7bff"/><path d="M150 50 q30 2 34 12 q-20 2 -36 -4z" fill="#1f5fd1"/><circle cx="128" cy="30" r="4" fill="#fff"/>`;
    case "flower": return `<g transform="translate(152 46)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="6" ry="10" transform="rotate(${a}) translate(0 -9)" fill="#ffb3d1"/>`).join("")}<circle r="6" fill="#ffd23f"/></g>`;
    case "party": return `<path d="M112 46 L134 0 L152 46 Z" fill="#7a5cff"/><path d="M118 34 l26 0 M124 20 l14 0" stroke="#ffd23f" stroke-width="4"/><circle cx="134" cy="0" r="6" fill="#ff4f8b"/>`;
    case "tophat": return `<rect x="104" y="42" width="52" height="8" rx="3" fill="#1f1d2b"/><rect x="112" y="8" width="36" height="36" rx="3" fill="#2b2a3a"/><rect x="112" y="32" width="36" height="6" fill="#d6304f"/>`;
    case "headphones": return `<path d="M88 92 Q88 34 128 34 Q168 34 168 92" stroke="#2b2a3a" stroke-width="7" fill="none"/><rect x="80" y="82" width="16" height="26" rx="7" fill="#ff4f8b"/><rect x="160" y="82" width="16" height="26" rx="7" fill="#ff4f8b"/>`;
    case "wizard": return `<path d="M98 52 Q130 -20 158 50 Z" fill="#3c3aa8"/><ellipse cx="128" cy="52" rx="38" ry="7" fill="#2c2a8a"/><path d="M128 20 l3 7 l7 1 l-5 5 l1 7 l-6 -3 l-6 3 l1 -7 l-5 -5 l7 -1z" fill="#ffd23f"/>`;
    case "horns": return `<path d="M108 52 q-10 -22 4 -32 q-2 16 8 26z" fill="#d6304f"/><path d="M148 50 q10 -22 -2 -32 q0 16 -10 26z" fill="#d6304f"/>`;
    case "halo": return `<ellipse cx="130" cy="28" rx="26" ry="7" fill="none" stroke="#ffe14d" stroke-width="5" class="fx-float"/>`;
    case "crown": return `<path d="M104 48 L106 18 L118 32 L130 12 L142 32 L154 18 L156 48 Z" fill="#ffcf3f" stroke="#d99a00" stroke-width="2"/><circle cx="130" cy="38" r="4" fill="#ff3d6e"/><circle cx="116" cy="40" r="3" fill="#3d9bff"/><circle cx="144" cy="40" r="3" fill="#3d9bff"/>`;
    case "witch": return `<ellipse cx="128" cy="50" rx="46" ry="9" fill="#2b2140"/><path d="M104 50 Q118 -6 160 -2 Q138 10 152 50 Z" fill="#3a2b58"/><rect x="108" y="40" width="44" height="7" fill="#ff8a1f"/>`;
    case "pumpkinhat": return `<ellipse cx="128" cy="38" rx="28" ry="18" fill="#ff8a1f"/><path d="M114 24 q-4 14 0 28 M142 24 q4 14 0 28 M128 20 v34" stroke="#d45f00" stroke-width="2" fill="none"/><path d="M128 20 q-2 -10 6 -12" stroke="#3d7a1a" stroke-width="4" fill="none"/>`;
    case "santa": return `<path d="M98 54 Q120 0 166 30 L170 48 Z" fill="#e53935"/><ellipse cx="132" cy="52" rx="40" ry="8" fill="#fff"/><circle cx="172" cy="34" r="8" fill="#fff"/>`;
    case "bunnyears": return `<ellipse cx="114" cy="22" rx="9" ry="26" fill="#fff"/><ellipse cx="114" cy="24" rx="4" ry="18" fill="#ffb8d1"/><ellipse cx="146" cy="20" rx="9" ry="26" fill="#fff" transform="rotate(14 146 20)"/><ellipse cx="146" cy="22" rx="4" ry="18" fill="#ffb8d1" transform="rotate(14 146 22)"/>`;
    case "sunhat": return `<ellipse cx="128" cy="50" rx="56" ry="10" fill="#f2d48a"/><path d="M104 50 Q106 22 128 22 Q150 22 152 50z" fill="#f7e2a8"/><rect x="104" y="40" width="48" height="6" fill="#ff6fa5"/>`;
    default: return "";
  }
}

// ---------------- POTWORKI ----------------
export function rngFrom(seed) {
  let a = typeof seed === "number" ? seed : [...String(seed)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261);
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const P = (r, a) => a[Math.floor(r() * a.length)];

const ADJ = ["Grumpy", "Sneaky", "Wobbly", "Sleepy", "Spooky", "Bouncy", "Cheeky", "Fuzzy", "Gloomy", "Silly", "Sticky", "Tiny", "Mega", "Snappy", "Moody", "Jelly"];
const NOUN = ["Blob", "Goo", "Gloop", "Boo", "Muncher", "Fang", "Bubble", "Spud", "Grub", "Noodle", "Pickle", "Wisp", "Gremlin", "Toad", "Slime", "Mop"];
const BOSS_T = ["King", "Queen", "Lord", "Duke", "Captain", "Count", "Baron", "Professor"];

export function makeMonster(seed, palette, boss = false, kind = "normal") {
  const r = rngFrom(seed);
  const shape = kind === "shadow" ? "ghost" : P(r, ["blob", "ghost", "box", "spiky", "round", "bean"]);
  const col = P(r, palette);
  const eyes = boss ? P(r, [1, 2, 3]) : P(r, [1, 2, 2, 3]);
  const mouth = P(r, ["teeth", "smile", "o", "fangs", "zigzag"]);
  const acc = P(r, ["none", "horns", "antenna", "wings", "hat", "leaf", "none"]);
  const name = boss ? `${P(r, BOSS_T)} ${P(r, NOUN)}` : `${P(r, ADJ)} ${P(r, NOUN)}`;
  return { seed, shape, col, eyes, mouth, acc, boss, name: kind === "shadow" ? "Shadow " + P(r, NOUN) : name, kind };
}

export function monsterSVG(m) {
  const c = m.col;
  const dark = shade(c, -0.35);
  const light = shade(c, 0.35);
  const uid = "m" + Math.random().toString(36).slice(2, 7);
  let body;
  switch (m.shape) {
    case "ghost": body = `<path d="M40 170 L40 90 Q40 30 100 30 Q160 30 160 90 L160 170 L140 152 L120 170 L100 152 L80 170 L60 152 Z" fill="url(#${uid}g)"/>`; break;
    case "box": body = `<rect x="38" y="44" width="124" height="124" rx="26" fill="url(#${uid}g)"/>`; break;
    case "spiky": body = `<path d="M100 26 L118 54 L152 44 L146 78 L176 98 L146 116 L154 150 L120 142 L100 172 L80 142 L46 150 L54 116 L24 98 L54 78 L48 44 L82 54 Z" fill="url(#${uid}g)"/>`; break;
    case "round": body = `<circle cx="100" cy="104" r="68" fill="url(#${uid}g)"/>`; break;
    case "bean": body = `<path d="M60 170 Q30 120 50 70 Q70 26 116 34 Q170 46 160 112 Q152 176 60 170 Z" fill="url(#${uid}g)"/>`; break;
    default: body = `<path d="M30 168 Q20 110 50 70 Q80 30 120 40 Q172 54 170 120 Q172 168 150 168 Z" fill="url(#${uid}g)"/>`;
  }
  const ey = m.shape === "box" ? 92 : 90;
  const eyeXs = m.eyes === 1 ? [100] : m.eyes === 2 ? [80, 120] : [72, 100, 128];
  const er = m.eyes === 1 ? 20 : 13;
  const eyes = eyeXs.map((x, i) => `<g class="mon-eye"><circle cx="${x}" cy="${ey - (m.eyes === 3 && i === 1 ? 12 : 0)}" r="${er}" fill="#fff"/><circle cx="${x + 2}" cy="${ey + 2 - (m.eyes === 3 && i === 1 ? 12 : 0)}" r="${er * 0.5}" fill="#1a1426"/><circle cx="${x + 5}" cy="${ey - 3 - (m.eyes === 3 && i === 1 ? 12 : 0)}" r="${er * 0.18}" fill="#fff"/></g>`).join("");
  const my = 132;
  const mouths = {
    teeth: `<path d="M70 ${my} Q100 ${my + 26} 130 ${my} Z" fill="#2a0f1f"/><path d="M78 ${my + 2} l6 8 l6 -8 M104 ${my + 2} l6 8 l6 -8" fill="#fff"/>`,
    smile: `<path d="M74 ${my} Q100 ${my + 20} 126 ${my}" stroke="#2a0f1f" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    o: `<ellipse cx="100" cy="${my + 4}" rx="10" ry="12" fill="#2a0f1f"/>`,
    fangs: `<path d="M76 ${my} L124 ${my}" stroke="#2a0f1f" stroke-width="5" stroke-linecap="round"/><path d="M84 ${my} l5 12 l5 -12 M106 ${my} l5 12 l5 -12" fill="#fff"/>`,
    zigzag: `<path d="M72 ${my} l8 8 l8 -8 l8 8 l8 -8 l8 8 l8 -8" stroke="#2a0f1f" stroke-width="4" fill="none" stroke-linejoin="round"/>`,
  };
  const accs = {
    none: "",
    horns: `<path d="M62 52 q-14 -26 6 -40 q-2 20 14 32z" fill="${dark}"/><path d="M138 52 q14 -26 -6 -40 q2 20 -14 32z" fill="${dark}"/>`,
    antenna: `<path d="M100 34 L100 8" stroke="${dark}" stroke-width="4"/><circle cx="100" cy="8" r="7" fill="${light}" class="fx-pulse"/>`,
    wings: `<path d="M36 100 Q2 70 10 120 Q22 108 36 120z" fill="${dark}" class="mon-wing"/><path d="M164 100 Q198 70 190 120 Q178 108 164 120z" fill="${dark}" class="mon-wing"/>`,
    hat: `<path d="M70 44 Q100 -10 132 44 Z" fill="#2b2140"/><ellipse cx="100" cy="44" rx="42" ry="7" fill="#2b2140"/>`,
    leaf: `<path d="M100 34 q-4 -16 10 -24 q4 16 -10 24z" fill="#5fae2e"/>`,
  };
  const crown = m.boss ? `<path d="M68 40 L72 8 L86 24 L100 2 L114 24 L128 8 L132 40 Z" fill="#ffcf3f" stroke="#d99a00" stroke-width="2"/>` : "";
  const shadowFx = m.kind === "shadow" ? `opacity=".88" filter="url(#${uid}blur)"` : "";
  return `<svg viewBox="0 0 200 200" class="mon-svg ${m.boss ? "boss" : ""}" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="${uid}g" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="${light}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${dark}"/></radialGradient>
    <filter id="${uid}blur"><feGaussianBlur stdDeviation="0.6"/></filter></defs>
    <ellipse cx="100" cy="184" rx="60" ry="8" fill="#000" opacity=".2"/>
    <g class="mon-body" ${shadowFx}>${m.acc === "wings" ? accs.wings : ""}${body}${m.acc !== "wings" ? accs[m.acc] : ""}${eyes}${mouths[m.mouth]}${crown}</g>
  </svg>`;
}

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return "#" + [f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

// ---------------- BIOMY ----------------
// Co 10 pięter nowy biom; po przejściu wszystkich wracają w "wersji II, III…" z przesuniętym kolorem.
export const BIOMES = [
  { id: "garden", name: "Moonlit Garden", sky: ["#2b2d6e", "#6a4fb0", "#f7a4c0"], ground: "#3c6e47", deco: "🌷🌳🍄", mon: ["#7ad151", "#ff8fb1", "#ffd23f", "#5bc0ff"] },
  { id: "attic", name: "Dusty Attic", sky: ["#2a1e2e", "#5a3a4a", "#b07a5a"], ground: "#5a3b2a", deco: "📦🕯️🕸️", mon: ["#c9a26b", "#9a7bd1", "#e86a5a", "#8fb5a8"] },
  { id: "candy", name: "Candy Forest", sky: ["#ff9ad5", "#ffc4e1", "#fff0b3"], ground: "#ff6fb5", deco: "🍭🍬🧁", mon: ["#ff4f9a", "#7ad6ff", "#b38cff", "#ffd23f"] },
  { id: "swamp", name: "Toxic Swamp", sky: ["#1b2e1b", "#2f5a2a", "#9adf5a"], ground: "#2a4a1a", deco: "🍄🐸🌿", mon: ["#8fe04a", "#c45cff", "#3ad6a0", "#e0d43a"] },
  { id: "volcano", name: "Lava Peaks", sky: ["#2a0e0e", "#7a1e14", "#ff8a3d"], ground: "#3a1a14", deco: "🌋🔥🪨", mon: ["#ff6b2c", "#ffcf3f", "#b83a2a", "#5a3a3a"] },
  { id: "ice", name: "Frozen Tower", sky: ["#123a6a", "#4a8ad1", "#dff6ff"], ground: "#cfeaff", deco: "❄️⛄🧊", mon: ["#7cc8f0", "#ffffff", "#9a8cff", "#4ad1c8"] },
  { id: "clouds", name: "Dream Clouds", sky: ["#8a7bff", "#c9b8ff", "#ffe3f3"], ground: "#ffffff", deco: "☁️🌙⭐", mon: ["#ffb8ec", "#b8e1ff", "#fff1a8", "#c9b8ff"] },
  { id: "space", name: "Star Station", sky: ["#05051a", "#1a1450", "#4a2a8a"], ground: "#2a2a40", deco: "🪐⭐🛸", mon: ["#38e8ff", "#ff5ddf", "#a3ff5d", "#ffd23f"] },
];
export function biomeForFloor(floor) {
  const idx = Math.floor((floor - 1) / 10);
  const b = BIOMES[idx % BIOMES.length];
  const tier = Math.floor(idx / BIOMES.length);
  if (tier === 0) return { ...b, tier, label: b.name };
  const hue = tier * 40;
  return { ...b, tier, label: `${b.name} ${["", "II", "III", "IV", "V", "VI", "VII"][tier] || tier + 1}`, hue };
}
