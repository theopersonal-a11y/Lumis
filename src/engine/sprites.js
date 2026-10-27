// Pixel-art sprite system: sprites are arrays of strings; chars map to colors via a palette.
export const PAL = {
  '.': null,
  'k': '#10101a', 'K': '#2b2b3a', 'g': '#6b6b7b', 'G': '#a8a8b8', 'w': '#f4f4f8',
  'r': '#d43a3a', 'R': '#8a1c1c', 'o': '#f08a2a', 'O': '#b8541a', 'y': '#f5d33a', 'Y': '#c9a227',
  'l': '#8fe04a', 'L': '#3c8a2e', 'd': '#1f5a24', 'c': '#5ad8f0', 'C': '#2a8ab0', 'b': '#3a6ad4', 'B': '#1f3a8a',
  'p': '#a04ad8', 'P': '#5a2a8a', 'm': '#f07ad0', 'M': '#b03a8a', 'n': '#8a5a2a', 'N': '#4a2e14',
  't': '#d8b070', 'T': '#f0c8a0', 's': '#e8d8a0', 'S': '#c0a060', 'i': '#c8f0ff', 'e': '#30c080',
  'v': '#c8a0f0', 'x': '#ff6a1a', 'a': '#4a4a52', 'h': '#fff8c0', 'f': '#f5a0a0', 'z': '#1a4a4a',
  'q': '#b8f080', 'u': '#90c0f0', 'j': '#60a890', 'A': '#8a8a9a', 'D': '#3a3a48', 'I': '#e8f8ff',
  'X': '#ffd27a', 'Z': '#0a1a0a', 'Q': '#5a3a9a', 'U': '#c070ff', 'V': '#ff3a7a', 'W': '#fff0e0', 'H': '#ffb0b0',
  'F': '#ff9a3a', 'J': '#2a6a3a', 'E': '#80ff80',
};
const cache = new Map();
export function makeSprite(rows, pal = null, key = null) {
  const k = key || (rows.join('|') + (pal ? JSON.stringify(pal) : ''));
  let c = cache.get(k);
  if (c) return c;
  const w = Math.max(...rows.map(r => r.length)), h = rows.length;
  c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      let col = pal && (ch in pal) ? pal[ch] : PAL[ch];
      if (col === undefined) col = PAL['k'];
      if (!col) continue;
      ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1);
    }
  }
  cache.set(k, c);
  return c;
}
export function flipSprite(spr) {
  const k = '__flip__' + spr.width + 'x' + spr.height + ':' + (spr.__id || '');
  if (spr.__flip) return spr.__flip;
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const ctx = c.getContext('2d'); ctx.translate(spr.width, 0); ctx.scale(-1, 1); ctx.drawImage(spr, 0, 0);
  spr.__flip = c; return c;
}
export function tintSprite(spr, color, alpha = 0.6) {
  const key = color + alpha;
  spr.__tints = spr.__tints || {};
  if (spr.__tints[key]) return spr.__tints[key];
  const c = document.createElement('canvas'); c.width = spr.width; c.height = spr.height;
  const ctx = c.getContext('2d'); ctx.drawImage(spr, 0, 0);
  ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, c.width, c.height);
  spr.__tints[key] = c; return c;
}
export function silhouette(spr, color) { return tintSprite(spr, color, 1); }
// compose overlay rows on top of base rows (same size or smaller, offset)
export function overlayRows(base, over, ox = 0, oy = 0) {
  const rows = base.map(r => r.split(''));
  const w = Math.max(...base.map(r => r.length));
  for (let y = 0; y < over.length; y++) {
    const ty = y + oy; if (ty < 0 || ty >= rows.length) continue;
    for (let x = 0; x < over[y].length; x++) {
      const tx = x + ox; if (tx < 0 || tx >= w) continue;
      const ch = over[y][x]; if (ch === '.') continue;
      while (rows[ty].length <= tx) rows[ty].push('.');
      rows[ty][tx] = ch;
    }
  }
  return rows.map(r => r.join(''));
}
// Generate a procedural 16x16 tile texture canvas
export function makeTile(base, speckles, seed = 1, opts = {}) {
  const key = 'tile:' + base + speckles.join(',') + seed + JSON.stringify(opts);
  let c = cache.get(key); if (c) return c;
  c = document.createElement('canvas'); c.width = 16; c.height = 16;
  const ctx = c.getContext('2d'); ctx.fillStyle = base; ctx.fillRect(0, 0, 16, 16);
  let s = seed * 7919 + 13;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const n = opts.count ?? 14;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = speckles[Math.floor(rnd() * speckles.length)];
    const x = Math.floor(rnd() * 16), y = Math.floor(rnd() * 16);
    const w = opts.wide ? 1 + Math.floor(rnd() * 3) : 1;
    ctx.fillRect(x, y, w, 1);
  }
  if (opts.border) { ctx.fillStyle = opts.border; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16); }
  cache.set(key, c); return c;
}
