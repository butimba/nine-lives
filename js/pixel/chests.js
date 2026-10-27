// STUB
import { drawSprite } from './sprite.js';
import { box } from './_stubutil.js';
const C = { wood: '#8e5434', silver: '#a9b6cb', gold: '#ffd23f', epic: '#8a55d6' };
export function chestSprite(type = 'wood') { const spr = box('chest_' + type, 20, 16, C[type] || C.wood);
  return { w: 20, h: 16, draw(ctx, x, y, o = {}) { drawSprite(ctx, spr, 0, x + (o.shake ? Math.sin(Date.now() / 30) * o.shake : 0), y, o); } }; }
