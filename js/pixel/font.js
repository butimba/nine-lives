// STUB
import { UI } from './palette.js';
export function drawText(ctx, str, x, y, { color = UI.paper, align = 'left', scale = 1, outline = UI.ink } = {}) {
  ctx.fillStyle = color; ctx.font = `${7 * scale}px monospace`; ctx.textAlign = align; ctx.textBaseline = 'top'; ctx.fillText(String(str), x, y);
}
export function textWidth(str, scale = 1) { return String(str).length * 6 * scale; }
