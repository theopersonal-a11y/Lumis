// Drawing helpers: pixel text, panels, bars, icons
export const FONT = "'Press Start 2P', monospace";
export function text(ctx, str, x, y, color = '#f4f4f8', size = 8, align = 'left', shadow = true) {
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  if (shadow) { ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(str, x + 1, y + 1); }
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
export function textW(ctx, str, size = 8) { ctx.font = `${size}px ${FONT}`; return ctx.measureText(str).width; }
export function wrap(ctx, str, maxW, size = 8) {
  ctx.font = `${size}px ${FONT}`;
  const words = String(str).split(' '); const lines = []; let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
export function rect(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
export function frame(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h); }
// Pixel-style UI panel with bevelled border
export function panel(ctx, x, y, w, h, style = 'wood') {
  x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
  const S = {
    wood: { bg: '#2a1e14', border: '#8a5a2a', light: '#c08a4a', dark: '#140c06', inner: '#3a2a1a' },
    stone: { bg: '#2a2a36', border: '#6b6b7b', light: '#a8a8b8', dark: '#10101a', inner: '#34343f' },
    dark: { bg: 'rgba(10,10,20,0.9)', border: '#4a4a62', light: '#7a7a92', dark: '#05050a', inner: 'rgba(20,20,36,0.9)' },
    gold: { bg: '#2a2210', border: '#c9a227', light: '#f5d33a', dark: '#140f04', inner: '#3a2e14' },
    purple: { bg: '#1e1030', border: '#7a3ab8', light: '#b070f0', dark: '#0a0414', inner: '#2a1a44' },
    green: { bg: '#102a14', border: '#3c8a2e', light: '#8fe04a', dark: '#041204', inner: '#1a3a20' },
    red: { bg: '#2a1010', border: '#8a1c1c', light: '#d43a3a', dark: '#140404', inner: '#3a1a1a' },
    blue: { bg: '#101a30', border: '#2a4aa0', light: '#5a8af0', dark: '#040a14', inner: '#182440' },
  }[style] || {};
  ctx.fillStyle = S.dark; ctx.fillRect(x, y, w, h);
  ctx.fillStyle = S.bg; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = S.inner; ctx.fillRect(x + 3, y + 3, w - 6, h - 6);
  ctx.fillStyle = S.border; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2); ctx.fillRect(x + 1, y + h - 2, w - 2, 1); ctx.fillRect(x + w - 2, y + 1, 1, h - 2);
  ctx.fillStyle = S.light; ctx.fillRect(x + 2, y + 2, w - 4, 1); ctx.fillRect(x + 2, y + 2, 1, h - 4);
  ctx.fillStyle = S.dark; ctx.fillRect(x + 2, y + h - 3, w - 4, 1); ctx.fillRect(x + w - 3, y + 2, 1, h - 4);
  // corner studs
  ctx.fillStyle = S.light; [[x + 1, y + 1], [x + w - 3, y + 1], [x + 1, y + h - 3], [x + w - 3, y + h - 3]].forEach(([cx, cy]) => ctx.fillRect(cx, cy, 2, 2));
}
export function bar(ctx, x, y, w, h, pct, color, bg = '#10101a', border = '#2b2b3a', color2 = null) {
  pct = Math.max(0, Math.min(1, pct));
  ctx.fillStyle = border; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
  ctx.fillStyle = bg; ctx.fillRect(x, y, w, h);
  const fw = Math.round(w * pct);
  if (fw > 0) { ctx.fillStyle = color; ctx.fillRect(x, y, fw, h); if (h > 2) { ctx.fillStyle = color2 || 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, fw, 1); } }
}
export function button(ctx, x, y, w, h, label, hover = false, style = 'wood', size = 8, disabled = false) {
  panel(ctx, x, y, w, h, disabled ? 'dark' : hover ? 'gold' : style);
  text(ctx, label, x + w / 2, y + Math.floor((h - size) / 2) + 1, disabled ? '#6b6b7b' : hover ? '#fff8c0' : '#f4f4f8', size, 'center');
}
export function circle(ctx, x, y, r, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
export function pixelCircle(ctx, cx, cy, r, color) {
  ctx.fillStyle = color;
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}
export function ring(ctx, cx, cy, r, color, width = 1) { ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
export const RARITY_COLORS = { common: '#d8d8e0', uncommon: '#8fe04a', rare: '#5a8af0', epic: '#c070ff', legendary: '#f5a623', mythic: '#ff3a7a', secret: '#5ad8f0' };
export const ELEMENT_COLORS = { neutral: '#d8d8e0', fire: '#ff6a1a', ice: '#5ad8f0', lightning: '#f5d33a', nature: '#8fe04a', water: '#3a6ad4', wind: '#c8f0ff', dark: '#a04ad8', holy: '#fff8c0', arcane: '#c070ff', poison: '#8fe04a', earth: '#b8541a', chaos: '#ff3a7a', time: '#60a890', light: '#ffffff', shadow: '#5a2a8a', crystal: '#c8a0f0', blood: '#d43a3a' };
