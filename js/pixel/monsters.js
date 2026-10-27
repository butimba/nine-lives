// STUB
import { drawSprite, spriteURL } from './sprite.js';
import { box } from './_stubutil.js';
export function makeMonster(seed, palette = ['#93e04c'], { boss = false, shadow = false } = {}) {
  const s = boss ? 36 : 22;
  const spr = box('mon' + seed + boss + shadow, s, s, shadow ? '#272036' : palette[0]);
  return { name: boss ? 'Count Pickle' : 'Grumpy Gloop', boss, w: s, h: s,
    draw(ctx, x, y, o = {}) { drawSprite(ctx, spr, 0, x, y, o); }, portraitURL(scale = 3) { return spriteURL(spr, 0, scale); } };
}
