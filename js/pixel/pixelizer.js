// STUB
const cache = new Map();
export function pixelImage(img, size = 18) {
  const key = img + '|' + size; if (cache.has(key)) return cache.get(key);
  const c = document.createElement('canvas'); c.width = c.height = size + 2; const ctx = c.getContext('2d');
  if (String(img).startsWith('color:')) { ctx.fillStyle = img.slice(6); ctx.fillRect(2, 2, size - 2, size - 2); }
  else { ctx.font = `${size - 2}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(img).replace('num:', ''), (size + 2) / 2, (size + 2) / 2); }
  cache.set(key, c); return c;
}
export function pixelURL(img, scale = 3) { const c = pixelImage(img); const o = document.createElement('canvas'); o.width = c.width * scale; o.height = c.height * scale; const x = o.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL(); }
