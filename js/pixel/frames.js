// STUB
export function drawPanel(ctx, x, y, w, h, style = 'wood', { tint } = {}) {
  ctx.fillStyle = '#0e0b16'; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = tint || ({ wood: '#8e5434', stone: '#7a7290', bubble: '#f4efe2', paper: '#f4efe2', block: '#3aa34f' }[style] || '#8e5434');
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
}
