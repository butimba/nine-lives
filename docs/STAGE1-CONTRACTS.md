# Stage 1 — kontrakty między agentami (READ-ONLY dla agentów; zmiany tylko przez leada)

Źródło prawdy o grze: `DESIGN.md`. Zasady kompatybilności: `CLAUDE.md`.

## Decyzje leada
1. TTS: migracja v2 ustawia `settings.voice = !!profile.noReading` (wyłączone dla wszystkich poza noReading).
2. 0 żyć: Wieża zablokowana (kot śpi, odliczanie). **Shadow Cellar dostępny także przy 0 życiach**: błędy w Cellar nie zabierają żyć wcale, gdy n===0 („dream mode”); przy n>0 pierwsze 2 błędy darmowe, kolejne zabierają życie. Bieg w Cellar kończy się po 6 potworach, przy 0 żyć także po 3. błędzie.
3. Talenty (id bez zmian): `nine_lives` = +r tarcz na pociski bossa na bieg; `thick_fur` = r×10% szansy, że błąd nie zabierze życia; `cat_nap` = +1 życie po pokonaniu bossa (r≥1), +2 przy r=2. Reszta jak w v1.
4. `js/art.js` zostaje jako zamrożony plik legacy (importują go engine.js, teacher.html, tools). Nikt go nie edytuje; nowy kod go nie importuje.
5. Nikt nie edytuje `js/engine.js`, `js/cloud.js`, `data/vocab.js`, `data/grammar.js`, `data/events.js`, `data/roster.js`.
6. Nikt nie robi `git commit` — commituje lead.

## Zasady wspólne
- Edytujesz tylko pliki, których jesteś właścicielem. Potrzebna zmiana cudzego pliku → opisz ją w raporcie końcowym.
- Najpierw (≈10% pracy) wystaw **stub z kompletnym API** każdego eksportu (prostokąty, stałe), potem dopracuj.
- Bez zewnętrznych bibliotek i CDN. Moduły ES, ścieżki względne. Fonty: `css/fonts.css` (Pixelify Sans, Caveat Brush, Lexend).
- Tekst w grze po angielsku, prosty (A1). Polski tylko jako `prompt.pl` pod poleceniem zadania.
- Wydajność: jedna pętla rAF (stage), cache sprite'ów, bez przebudowy co klatkę.

## Interfejsy

```js
// ===== A: js/pixel/palette.js =====
export const PAL = { '.':null, k:'#0e0b16', w:'#f4efe2', /* ~32 single-char keys */ };
export const UI = { ink, paper, paperDark, accent, danger, ok, gold, shadow, night, sky }; // hex
export function applyCssVars(rootEl) // sets --px-ink --px-paper --px-paper-dark --px-accent --px-danger --px-ok --px-gold --px-shadow --px-night --px-sky
export const RARITY_COLOR = { common, rare, epic, legendary };

// ===== A: js/pixel/sprite.js =====
export function defineSprite({ id, w, h, frames /*string[][] rows*/, map /*{ch: hex|PALkey}*/, anchor:{x,y} /*feet*/, points /*[{head:{x,y}}] per frame*/ }) -> Sprite
// Sprite = { id, w, h, nFrames, anchor, points, canvas(frame) -> HTMLCanvasElement (1x, cached) }
export function recolor(sprite, mapOverride, newId) -> Sprite
export function drawSprite(ctx, sprite, frame, x, y, { scale=1, flip=false, alpha=1, flash=false, silhouette=false } = {}) // x,y = anchor, logical px, rounded
export function spriteURL(sprite, frame, scale) -> dataURL

// ===== A: js/pixel/cat.js / hats.js =====
export const CAT_ANIMS = { idle:{frames:[0,1],fps:2}, jump:{frames:[2],fps:1}, attack:{frames:[3,4],fps:12}, hurt:{frames:[5],fps:1}, sleep:{frames:[6],fps:1}, dance:{frames:[7,8,7,0],fps:6} };
export function getCat(skinId, hatId='none') -> { w, h, draw(ctx, x, y, { anim='idle', t, scale=1, flip=false, flash=false, silhouette=false }) }
export function catURL(skinId, hatId, scale=4, { silhouette=false, anim='idle', frame=0 }={}) -> dataURL
export function hatSprite(hatId) -> Sprite | null   // 'none' -> null

// ===== A: monsters.js / chests.js / icons.js / frames.js / font.js / pixelizer.js =====
export function makeMonster(seed, palette /*hex[]*/, { boss=false, shadow=false }={}) -> { name, boss, w, h, draw(ctx,x,y,{anim:'idle'|'hurt'|'lunge'|'die', t, flash, scale}), portraitURL(scale) }
export function chestSprite(type /*'wood'|'silver'|'gold'|'epic'*/) -> { w, h, draw(ctx,x,y,{ cracks:0..3, open=false, shake=0, scale=1 }) }
export const ICONS = { fish, heart, heartEmpty, catHead, flame, xp, speaker, check, cross, lock, star, shield, wardrobe, skills, cards, daily, moon, door, perk_<perkId>... } // Sprites
export function iconURL(name, scale=3) -> dataURL
export function drawPanel(ctx, x, y, w, h, style /*'wood'|'stone'|'bubble'|'paper'|'block'*/, { tint } = {})
export function drawText(ctx, str, x, y, { color, align='left', scale=1, outline=UI.ink }={}) // 5x7 bitmap: A-Z 0-9 +-x!?/:%
export function pixelImage(img /*'🐶'|'color:#hex'|'num:7'*/, size=18) -> HTMLCanvasElement // (size+2)^2, cached
export function pixelURL(img, scale=3) -> dataURL
```

```js
// ===== B: js/game/stage.js =====
export function createStage(hostEl, { lw=240, minH=320, maxH=432, maxBacking=1600 }={}) -> Stage
// S = floor(min(hostW*dpr/lw, hostH*dpr/h)); backing = lw*S x h*S; ctx.setTransform(S,0,0,S,0,0); imageSmoothingEnabled=false
Stage = { canvas, ctx, w /*240*/, h, scale, overlay /*DOM layer over canvas*/, toClient(x,y) -> {x,y},
  input: { on(evt /*'down'|'move'|'up'|'key'*/, fn(e:{x,y,key?})) -> off, pointer:{x,y,down} },
  setScene(scene /*{update(dt,t), draw(ctx,t), destroy?()}*/), hitstop(ms), shake(px, ms), time, paused, destroy() }
// pauses on document.hidden; resize (mobile keyboard) does not reset the scene

// ===== B: js/game/juice.js =====
export function createFx() -> { burst(x,y,{n=10,colors,speed=60,gravity=120,size=1}), float(x,y,text,{color,big}), ring(x,y,color), update(dt), draw(ctx) } // cap 200

// ===== B: js/game/world.js / biomes.js =====
export function dayPhase(date=new Date()) -> { phase:'dawn'|'day'|'dusk'|'night', k, hour } // honours ?hour=NN
export function drawSky(ctx, w, h, phase, t)
export function drawMoonOutline(ctx, x, y, t)
export function drawTower(ctx, { w, h, camY, floorFrom, floorTo, biomeFor=biomeForFloor, t, trophies=[] })
export function floorY(floor) -> world Y of floor ledge
export const BIOMES; export function biomeForFloor(floor) -> { id, label, tier, mon:hex[], wall, brick, accent, ... }

// ===== B: js/game/run.js =====
export async function runGame(hostEl, save, profile, mode /*'tower'|'shadow'*/, opts={}) -> RunStats
RunStats = { mode, startFloor, floorReached, bossBeaten, quit, asleep, answers, correct, bestCombo, kills,
             coins /*already × lives.rewardMult*/, xp /*same*/, weeklyDmg, ms, perks:[] }
// per answer: plan = planTask(task, profile, save.settings); mech = MECHANICS[plan.mech].create(ctx);
// res = await mech.result; (task.type is final); record(save, task, res.ok, res.ms, res.tag, {hinted:res.hinted, shadowMode});
// wrong -> session.failed(key); lives.loseLife(save) (unless Cellar free/dream or thick_fur); await mech.reveal();
// right -> combo; combo % 8 === 0 -> lives.gainLife(save,'combo'); lives.addPlayTime(save, ms); persist();
// ends: boss beaten | livesState(save).n === 0 (tower) | quit
```

```js
// ===== C: js/game/mechanics/index.js =====
export function planTask(task, profile, settings) -> { mech, task /*same object, normalized*/, prompt }
Prompt = { text?, pl? /*only if settings.pl*/, img?, say?, autoSay }
export const MECHANICS = { signs, bubbles, spell, fixline, catch? }
// word2pic→signs(img) | pic2word, pl2en→signs(words) | match→signs(words; type:='pic2word')
// listen2pic→bubbles(img, autoSay) | pic2listen→bubbles(speaker; tap=play, tap again=choose)
// spell→catch(letters) else spell(tiles) | type→spell(input)
// cloze→signs(words) | fix→fixline | judge→bubbles(✓/✗) | build→catch(words) else signs(cloze rebuilt from q; type:='cloze')
mechanic.create(MechCtx) -> MechInstance
MechCtx = { stage, fx, arena:{x,y,w,h}, task, prompt, rng, difficulty /*0..1*/, sprites, sfx, speak,
            cat:{ x, y, jumpTo(x,y)->Promise, attack()->Promise }, hints:{ left } }
MechInstance = { update(dt,t), draw(ctx,t), result: Promise<{ ok, ms /*from interactive*/, tag, hinted, choice }>,
  hint() -> boolean, reveal() -> Promise /*shows correct, waits for [data-act=next]*/, destroy(),
  debug: { targets() -> [{x,y /*client px*/, ok, label}], answer(good) } }
// run.js offers 'down' to boss projectiles first, then mechanic. Projectiles paused during intro/reveal/typing.
```

```js
// ===== D: js/state.js =====  SAVE_VERSION = 2
MIGRATIONS[2] = (s, profile) => { s.lives ??= { n:9, at:Date.now(), date:today() }; s.daily.ms ??= 0;
  s.challenges ??= { date:null, list:[] }; s.powers ??= { owned:[], equipped:[] }; s.settings.voice = !!(profile && profile.noReading); return s; }
// freshSave has same fields; 'lives' in nested-default list; migrate(s, profile) passes profile

// ===== D: js/lives.js =====
export const MAX_LIVES = 9, REGEN_MS = 20*60*1000, COMBO_LIFE = 8;
export function tickLives(save, now=Date.now())   // midnight reset to 9 + regen; idempotent
export function livesState(save, now) -> { n, max:9, asleep:n===0, nextInMs }
export function loseLife(save) -> n;  export function gainLife(save, reason) -> n
export function addPlayTime(save, ms)
export function rewardMult(save, mode) -> 1 | 0.7 | 0.35 | 0.15   // shadow → 1; 0–20/20–30/30–45/45+ min
export function sleepyTier(save) -> 0..3

// ===== D: js/rewards.js =====
export function applyRunResults(save, stats) -> Results
Results = { ...stats, coins, xp, lvlBefore, lvlAfter, chest, story, streakEvents, sleepy }

// ===== D: js/audio.js ===== (existing exports kept)
export const sfx  // Proxy, unknown key = no-op. Keys: tap correct wrong hit crit hurt coin win lose chest level perk jump smash pop deflect bossIntro lifeLost lifeGain crack burst stamp purr snore type cast
export function startMusic(mood /*'home-day'|'home-night'|'tower'|'boss'|'shadow'|'chest'*/), stopMusic(), setAudio(), speak(), canSpeak()

// ===== D: data/catnames.js =====
export function randomCatName(rng=Math.random) -> "Captain Noodle"

// ===== E: js/ui/router.js =====
export function register(name, { mount(root, params) -> unmount? })
export function go(name, params={})  // login name home run results wardrobe chest skills cards story weekly settings
export const current = () => name
// 'run': stats = await runGame(host, save, profile, mode); go('results', applyRunResults(save, stats))
// tickLives(save) on boot, home mount, every 30s on home
```

## Debug / bot contract (`?debug`)
```js
window.__nl = { screen, runState /*'bossIntro'|'intro'|'task'|'reveal'|'perk'|'idle'*/, task, mech /*{name,targets(),answer(good)}*/, save: () => getSave() }
```
DOM hooks: `[data-act=login]` + `#login-name`, `[data-act=name-random]`, `[data-act=name-ok]`, `[data-act=climb]`, `[data-act=cellar]`, `[data-act=wardrobe]`, `[data-act=skills]`, `[data-act=cards]`, `[data-act=moon]`, `[data-act=settings]`, `[data-act=chest]`, `[data-act=next]`, `[data-act=perk]`, `.spell-input input` + `[data-act=cast]`, `[data-act=quit]`, `[data-act=continue]`, `[data-act=back]`, `[data-act=tap-chest]`.

Shared CSS classes (E defines): `.px-btn`, `.px-btn--big`, `.px-panel`, `.paper`, `.tape`, `.sticker`, `.stamp`, `.hand`, `.lex`, `.px`.
`index.html` (E): `css/fonts.css`, `css/style.css`, `css/run.css`, `css/mech.css`, `js/main.js?v=3`; no Google Fonts; `lang="en"`.
