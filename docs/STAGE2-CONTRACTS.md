# Stage 2+3: contracts between agents (READ-ONLY for agents; only the lead changes this)

Source of truth: `DESIGN.md` (sections 3–7, 9). Compat rules: `CLAUDE.md`. Stage 1 contracts (still valid): `docs/STAGE1-CONTRACTS.md`.
Stage 1 is live. Changes must not break save compatibility. Do not git commit (the lead commits).

## Who owns what
- **F (learning + content):** `js/engine.js`, `data/grammar.js`, `data/vocab.js`, `js/game/mechanics/index.js` (planTask/routing), `tools/check-grammar.mjs`, `docs/LEARNING-AUDIT.md` (new).
- **G (gameplay stage 2):** `js/game/run.js`, `js/game/boss.js`, `js/game/runui.js`, `css/run.css`, `js/game/mechanics/catch.js`, `js/daily.js` (new), `js/state.js`, `js/lives.js`, `js/rewards.js`, `data/progression.js`, `data/events.js`, `tools/test-systems.mjs`, `tools/bot.cjs`.
- **H (UI + meta + community skins):** `js/ui/*`, `js/main.js`, `index.html`, `css/style.css`, `teacher.html`, `js/meta.js`, `js/cloud.js`, `data/cosmetics.js`, `js/pixel/custom.js` (new), `tools/supabase-v3.sql` (new), `tools/shots-v2.cjs`.
- Do not change other files without consulting the lead (A/B/C files like `js/pixel/*` except `custom.js`, `stage.js`, `world.js`, and the other mechanics belong to nobody; small fixes are allowed when necessary, and you must describe them in your report).

## Save v3 (G implements in state.js; H and F only read/write these fields)
```js
SAVE_VERSION = 3
MIGRATIONS[3] = (s) => {
  s.gifts ??= { claimed: [] };                         // ids of claimed teacher gifts, e.g. "skin:shrimp"
  s.mySkin ??= { pixels: null, status: "none", at: 0 }; // own 16x16 skin: status none|pending|approved|rejected
  s.challenges ??= { date: null, list: [] };            // already in v2
  s.powers ??= { owned: [], equipped: [] };             // already in v2
  s.stats.events ??= {};                                 // run-event counters (golden, mimic, merchant…)
  return s; }
```

## Daily (G: js/daily.js)
```js
export function ensureDaily(save, profile, date=new Date())   // 3 challenges per day, deterministic from date+id, simple English text, mixed (learning/game)
// list item: { id, text /*EN, A1*/, goal, n, done, claimed, reward:{fish, chest?} }
export function progressDaily(save, event /*'correct'|'boss'|'noLifeBoss'|'combo'|'skill:<id>'|'cellar'|'typed'|…*/, amount=1)
export function claimDaily(save, id) -> { fish, chest } | null
```
run.js calls progressDaily during the run; H draws the Daily screen (currently "soon").

## Powers (G: data/progression.js POWERS + run.js; H: selection UI)
```js
export const POWERS = [{ id, name, desc /*EN A1*/, icon /*ICONS key power_*/, charge /*correct answers to charge*/, unlockLevel }]
// save.powers.owned: unlocked by level (G in rewards.js on level-up) or as a chest reward; save.powers.equipped: max 2 (H UI before climbing / in Skills)
// run.js: a power meter fills with correct answers; tapping the power icon activates it.
```

## Gifts from the teacher (H)
- `profile.gifts` in the roster (e.g. Łucja: `["skin:shrimp"]`). `meta.claimGifts(save, profile)` on login: every unclaimed gift goes into `save.chests` as the string `"gift:skin:shrimp"` and its id into `save.gifts.claimed`.
- The opening ritual for a `gift:` chest: an epic chest sprite with a guaranteed item, a "A gift from your teacher!" label, and full dopamine. `openChest(save, "gift:skin:shrimp")` gives exactly that item.

## Community skins (H) — kids' DIY skin editor
- Editor: a 16x16 grid with a limited palette (from `js/pixel/palette.js`), drawing a cat silhouette from a template (the kid paints on the cat, not on an empty grid). Send → `save.mySkin` = pending + a record in the cloud.
- Cloud: `tools/supabase-v3.sql` (new table `skins`: id, author_id, name, pixels text, status, created_at; RLS like saves). The lead will ask Max to run the SQL. Without the table the game must work (graceful fallback: "Sending is not ready yet").
- Teacher panel: list of pending skins with a preview → Approve / Reject. Approved ones go into the catalogue for everyone (as the weekly boss reward queue or the shop), loaded at start (`cloud.loadSkins()`), rendered by `js/pixel/custom.js` as the cat skin (getCat must accept a `custom:<id>` id → H adds support in custom.js and a small hook in cat.js if needed).
- Without an author's signature in the game (Max's decision).

## Debug/bot
`window.__nl` as in stage 1. New hooks: `[data-act=daily]`, `[data-act=claim]`, `[data-act=power]` (in the run), `[data-act=power-pick]`, `[data-act=skin-editor]`, `[data-act=skin-send]`, `[data-act=merchant-buy]`, `[data-act=merchant-skip]`.
