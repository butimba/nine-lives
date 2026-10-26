// WYDARZENIA SEZONOWE — włączają się same według daty. Nic nie trzeba robić.
// from/to w formacie "MM-DD" (rok nieważny; okno może przechodzić przez Nowy Rok).
// vocab: temat słówek dorzucany każdemu w czasie wydarzenia. deco: emoji w tle.

export default [
  { id: "halloween", name: "Halloween Night", from: "10-15", to: "11-07", vocab: "halloween", deco: "🎃🦇👻🕸️",
    tint: ["#1a0f2e", "#5a2a7a", "#ff8a1f"], banner: "🎃 Halloween! Nowe skórki w sklepie", monTint: ["#ff8a1f", "#7a3cff", "#3ad65a"] },
  { id: "winter", name: "Winter Wonder", from: "12-01", to: "01-06", vocab: "winter", deco: "❄️⛄🎄✨",
    tint: ["#0f2a4a", "#3a6aa8", "#dff6ff"], banner: "❄️ Zima! Świąteczne skórki w sklepie", monTint: ["#ffffff", "#e53935", "#43a047"] },
  { id: "friendship", name: "Friendship Week", from: "02-08", to: "02-16", vocab: "feelings", deco: "💌🤝🌸",
    tint: ["#5a1a3a", "#d14a8a", "#ffd0e6"], banner: "💌 Tydzień przyjaźni!", monTint: ["#ff6fa5", "#ffb3d1", "#ff3d6e"] },
  { id: "spring", name: "Spring Hunt", from: "03-21", to: "04-20", vocab: "spring", deco: "🐣🌷🦋🥚",
    tint: ["#2a5a3a", "#7ad18a", "#fff3b0"], banner: "🐣 Wiosna! Szukaj jajek", monTint: ["#ffd23f", "#ff8fb1", "#7ad151"] },
  { id: "summer", name: "Summer Splash", from: "06-20", to: "08-31", vocab: "summer", deco: "🏖️🌊🍉☀️",
    tint: ["#0a4a7a", "#2ab0e0", "#ffe9a8"], banner: "🏖️ Wakacje! Letnie skórki", monTint: ["#2ab0e0", "#ffd23f", "#ff6b6b"] },
  { id: "school", name: "Back to School", from: "09-01", to: "09-14", vocab: "school", deco: "🎒✏️📚",
    tint: ["#2a2a5a", "#5a5ab0", "#ffe3a8"], banner: "🎒 Powrót do szkoły!", monTint: ["#5b8cff", "#ffd23f", "#ff6b6b"] },
];

export function activeEvent(date = new Date(), list) {
  const md = (date.getMonth() + 1) * 100 + date.getDate();
  const num = (s) => +s.slice(0, 2) * 100 + +s.slice(3);
  return (list || []).find((e) => {
    const a = num(e.from), b = num(e.to);
    return a <= b ? md >= a && md <= b : md >= a || md <= b;
  }) || null;
}
