// Generator imion kota: 2 słowa, zabawne, proste (A1). Bez generycznych „Luna/Mochi”.
// 40 × 40 = 1600 kombinacji, np. "Captain Noodle", "Sir Pickles", "Professor Waffles".
export const CAT_TITLES = [
  "Captain", "Sir", "Lady", "Professor", "Doctor", "Mister", "Miss", "Lord",
  "Princess", "Prince", "King", "Queen", "Baron", "Duke", "Chief", "Agent",
  "Little", "Big", "Tiny", "Mega", "Super", "Sleepy", "Fluffy", "Grumpy",
  "Happy", "Lucky", "Brave", "Silly", "Sneaky", "Speedy", "Cosmic", "Turbo",
  "Funky", "Jolly", "Crazy", "Mighty", "Wobbly", "Bouncy", "Sparkly", "Royal",
];
export const CAT_NOUNS = [
  "Noodle", "Pickles", "Waffles", "Muffin", "Pancake", "Biscuit", "Cookie", "Nugget",
  "Meatball", "Dumpling", "Pretzel", "Popcorn", "Cupcake", "Donut", "Taco", "Burrito",
  "Pudding", "Toast", "Bagel", "Pepper", "Peanut", "Bean", "Potato", "Carrot",
  "Banana", "Mango", "Cheese", "Butter", "Jelly", "Marshmallow", "Sprinkles", "Nacho",
  "Sausage", "Sushi", "Socks", "Button", "Rocket", "Pebble", "Teapot", "Kiwi",
];

export function randomCatName(rng = Math.random) {
  const pick = (a) => a[Math.min(a.length - 1, Math.floor(rng() * a.length))];
  for (let i = 0; i < 5; i++) {
    const t = pick(CAT_TITLES), n = pick(CAT_NOUNS);
    const name = `${t} ${n}`;
    if (name.length <= 18) return name; // mieści się na naklejce
  }
  return "Captain Noodle";
}
