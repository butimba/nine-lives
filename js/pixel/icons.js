// STUB
import { spriteURL } from './sprite.js';
import { box } from './_stubutil.js';
import { PERKS } from '../../data/progression.js';
const names = ['fish', 'heart', 'heartEmpty', 'catHead', 'flame', 'xp', 'speaker', 'check', 'cross', 'lock', 'star', 'shield', 'wardrobe', 'skills', 'cards', 'daily', 'moon', 'door', ...PERKS.map((p) => 'perk_' + p.id)];
export const ICONS = Object.fromEntries(names.map((n) => [n, box('ic_' + n, 12, 12, '#ffd23f')]));
export function iconURL(name, scale = 3) { return spriteURL(ICONS[name] || ICONS.star, 0, scale); }
