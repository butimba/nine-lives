// PROGRAM NAUCZANIA SŁÓWEK — klasa (1–6) każdego tematu z data/vocab.js i kolejność nauki (drabinka).
// Źródła i pełna lista słów kl. 1–6: docs/curriculum/VOCAB-SOURCES.md, docs/curriculum/VOCAB-1-6.md.
// THEME_GRADE: id tematu → klasa szkoły podstawowej, w której temat typowo się pojawia (podstawa programowa + podręczniki).
// LADDER.gradeN: tematy w kolejności nauki dla ucznia tej klasy. Najpierw nowe tematy klasy przeplatane z powtórką
// starszych (kolejność klasy 3 = kolejność rozdziałów Bugs Team 3), na końcu starsze tematy do uzupełnienia luk.
// Tematy sezonowe (halloween, winter, spring, summer) dorzuca wydarzenie — nie ma ich w drabinkach.
// "numbers" (1–15) jest tylko w drabinkach klas 1–2 (Max: dla klas 3–4 bez łatwych liczb; jest "bignumbers" 13–100).
// Id tematów są kluczami postępu — nie zmieniać; nowy temat = dopisać tutaj w THEME_GRADE i w odpowiednich LADDER.

export const THEME_GRADE = {
  // klasa 1 (Bugs Team 1 / podstawa I etap: ja i moi bliscy, moja szkoła, jedzenie, zabawy, przyroda, święta)
  colors: 1, numbers: 1, family: 1, body: 1, toys: 1, animals: 1, food: 1, school: 1,
  halloween: 1, winter: 1, spring: 1, summer: 1,
  // klasa 2 (Bugs Team 2: ubrania i pogoda, dom, samopoczucie, transport; świat baśni)
  clothes: 2, weather: 2, home: 2, feelings: 2, transport: 2, actions: 2, bugs: 2, fruitveg: 2, fairytale: 2,
  // klasa 3 (Bugs Team 3: safari, liczby 10–100, talenty i sport, mój dzień i zawody, miasto, wakacje)
  wild: 3, bignumbers: 3, sports: 3, freetime: 3, jobs: 3, myday: 3, town: 3, holiday: 3, nature: 3,
  // klasa 4 (English Class A1 / Brainy 4: moje rzeczy, dom, zwierzęta, jedzenie, liczebniki porządkowe)
  things: 4, household: 4, forest: 4, food2: 4, ordinals: 4,
  // klasa 5 (Brainy 5/6: sport i sprzęt, zdrowie, kosmos)
  sports2: 5, health: 5, space: 5,
  // klasa 6 (nauka i technika, świat przyrody)
  tech: 6, nature2: 6,
};

export const LADDER = {
  grade1: ["colors", "animals", "toys", "numbers", "family", "body", "food", "school"],
  grade2: ["animals", "colors", "clothes", "home", "fruitveg", "bugs", "weather", "feelings", "transport", "actions",
    "fairytale", "family", "body", "toys", "food", "school", "numbers"],
  // Łucja, Matylda (9 lat): rozdziały Bugs Team 3 po kolei, każdy nowy temat poprzedzony pokrewną powtórką
  grade3: ["animals", "wild", "bignumbers", "body", "sports", "freetime", "jobs", "myday", "food", "town",
    "weather", "holiday", "nature", "clothes", "family", "feelings", "home", "school", "actions", "transport",
    "toys", "bugs", "fruitveg", "fairytale"],
  grade4: ["wild", "forest", "food", "food2", "home", "household", "freetime", "things", "myday", "ordinals",
    "town", "holiday", "bignumbers", "jobs", "sports", "nature", "transport", "feelings", "weather", "clothes",
    "body", "actions", "bugs", "fruitveg", "fairytale"],
  grade5: ["food2", "health", "sports", "sports2", "space", "forest", "things", "household", "town", "holiday",
    "myday", "freetime", "ordinals", "wild", "jobs", "nature", "bignumbers"],
  grade6: ["tech", "nature2", "space", "health", "sports2", "things", "household", "food2", "town", "holiday",
    "ordinals", "forest", "wild", "bignumbers"],
};

export default { THEME_GRADE, LADDER };
