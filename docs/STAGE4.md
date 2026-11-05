# Stage 4: Max's requests (05.11.2026) and agent ownership

The live game: branch `main` (= `v2`). Rules: `CLAUDE.md`, `DESIGN.md`, save compatibility above all. Nobody commits (only the lead does).

## Max's requests
1. **Duet (co-op without rankings):**
   - a gift of 5 fish to your friend once a day ("Matylda sent you a fish!");
   - a shared duet challenge every day ("Together: 30 right answers"); both girls get the reward if both contribute;
   - your friend's small flag on the floor of the tower she has already passed.
2. **Content for Łucja and Matylda:**
   - Present simple ONLY in the 3rd person singular (he/she/it, my teacher, Tom, "Who…?"), with NO they/we/I/you in the tasks for them.
   - Vocabulary at grade 3–4 level of a Polish primary school.
   - No easy numbers (if numbers at all, then harder ones, e.g. 20–100, ordinal numbers).
3. **Curriculum:** a list of all vocabulary for grades 1–6 (Polish core curriculum + the typical topics of textbooks; reference for grade 3: Bugs Team 3, Macmillan). Grammar based on the grade 3 textbook.
4. **Progression:** after enough right answers, the algorithm unlocks harder words and grammar points (a ladder), but REPETITION remains the most important thing (reviews always have priority over new material).
5. **Analysis of task types and teaching methods** (high effort) with implementation of the conclusions.
6. **Christmas event** (switches on automatically on 1 December after Halloween ends):
   - lots of Christmas skins: Santa Cat, Lightbulb Cat (Christmas lights), Christmas Tree Cat, Firework/New Year's Cat;
   - plus Shark Cat (all year round) and Toxic Cat available outside events (in the shop).
7. At the end: review of the whole game/UI — what is missing.

## Ownership (each agent edits ONLY its own files)
- **V (vocabulary: research + entry):** `docs/curriculum/` (new), `data/vocab.js` (only NEW themes and words; no changes to existing English words or theme ids), `data/curriculum.js` (new: words/themes → grade level 1–6 and order).
- **G (grammar + progression):** `data/grammar.js`, `js/engine.js`, `js/game/mechanics/index.js`, `tools/check-grammar.mjs`, `tools/roster-src.json` + `data/roster.js` (build-roster), `docs/GRAMMAR-PLAN.md`.
- **P (pedagogy):** `docs/PEDAGOGY-REVIEW.md` (analysis, then a list of changes for G/D; it does not edit code unless the lead asks).
- **D (duet + Christmas + UI):** `js/meta.js`, `js/cloud.js`, `js/daily.js`, `js/state.js`, `js/rewards.js`, `js/ui/*`, `css/*`, `data/cosmetics.js`, `data/events.js`, `data/progression.js`, `js/pixel/*`, `js/game/world.js`, `js/game/run.js`, `js/game/runui.js`, `tools/test-systems.mjs`, `tools/bot.cjs`, `tools/shots-v2.cjs`, `index.html`, `teacher.html`.

Duet without new SQL: each player publishes a public status in `saves.pub` (e.g. `pub.duo = { day, giftTo, giftAt, duoN }`). The friend reads it via `cloud.loadPublic(partnerId)`. The recipient records a received gift in its own save (`save.duo.gotGifts[day]`) so it never counts twice. `pub.best` already exists (for the flag).
