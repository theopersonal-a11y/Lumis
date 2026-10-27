import { G } from '../state.js';
import { text, textW, panel, bar, rect, frame, RARITY_COLORS, ELEMENT_COLORS, wrap } from '../engine/draw.js';
import { Input } from '../engine/input.js';
import { ABILITIES } from '../data/abilities.js';
import { ITEMS, itemIcon } from '../data/items.js';
import { wandSprite, wandLevelXp } from '../data/wands.js';
import { petSprite } from '../data/pets.js';
import { OBJ } from '../data/tiles.js';
import { Quests } from '../game/questsys.js';
import { XP_NEED, foodName } from '../game/player.js';
import { BIOME_NAMES } from '../world/world.js';
import { abilityIcon } from './icons.js';
export function drawHUD(ctx) {
  const p = G.player; const W = G.W, H = G.H; G.uiHover = false;
  // ---- top-left: vitals ----
  panel(ctx, 4, 4, 150, 46, 'dark');
  bar(ctx, 10, 10, 120, 8, p.hp / p.maxHp, p.hp / p.maxHp < 0.3 ? '#ff3a3a' : '#d43a3a', '#2a0a0a', '#10101a', '#ff8a8a');
  text(ctx, `${Math.ceil(p.hp)}/${p.maxHp}`, 70, 11, '#fff', 6, 'center');
  if (p.shield.val > 0) { bar(ctx, 10, 19, Math.min(120, p.shield.val), 2, 1, '#5ad8f0'); }
  bar(ctx, 10, 23, 120, 6, p.mana / p.maxMana, '#3a6ad4', '#0a0a2a', '#10101a', '#8ab0ff');
  text(ctx, `${Math.floor(p.mana)}/${p.maxMana}`, 70, 23, '#fff', 6, 'center');
  bar(ctx, 10, 32, 120, 3, p.xp / XP_NEED(p.level), '#c070ff', '#1a0a2a');
  text(ctx, `LV ${p.level}`, 134, 9, '#f5d33a', 7);
  text(ctx, `${p.coins}c`, 134, 24, '#f5d33a', 6);
  if (p.statPoints > 0) text(ctx, `+${p.statPoints} [T]`, 134, 33, '#8fe04a', 5);
  // wand
  const w = p.wandDef(); const wl = p.wands[w.id] || { lvl: 1, xp: 0 };
  ctx.drawImage(wandSprite(w.id), 8, 37);
  text(ctx, `${w.name} Lv${wl.lvl}`, 22, 39, RARITY_COLORS[w.rarity], 6);
  bar(ctx, 22, 46, 100, 2, wl.xp / wandLevelXp(wl.lvl), '#5ad8f0', '#0a1a2a');
  // buffs
  let bx = 8, by = 54; for (const k in p.buffs) { const b = p.buffs[k]; const col = { speed: '#f5d33a', dmg: '#d43a3a', def: '#a8a8b8', regen: '#8fe04a', crit: '#c070ff', invis: '#6b6b7b', luck: '#8fe04a', ghost: '#c8f0ff', multishot: '#c070ff', phoenix: '#ff9a3a', dragon: '#d43a3a', fly: '#c8f0ff', divine: '#fff8c0', lifesteal: '#a04ad8', frozen: '#5ad8f0', stunned: '#f5d33a', rate: '#ff9a3a' }[k] || '#fff'; rect(ctx, bx, by, 30, 9, 'rgba(0,0,0,0.6)'); rect(ctx, bx, by + 7, Math.round(30 * Math.min(1, b.t / 10)), 2, col); text(ctx, k.slice(0, 6).toUpperCase(), bx + 1, by + 1, col, 5, 'left', false); bx += 32; if (bx > 150) { bx = 8; by += 11; } }
  // ---- abilities bar ----
  const keys = ['LMB', 'E', 'Q', 'C', 'V']; const abx = W / 2 - 5 * 30 / 2, aby = H - 36;
  for (let i = 0; i < 5; i++) {
    const x = abx + i * 30; const key = keys[i]; const aid = i === 0 ? null : w.abilities[key]; const ab = aid ? ABILITIES[aid] : null;
    const locked = i === 4 && !aid; panel(ctx, x, aby, 28, 28, locked ? 'dark' : i === 4 ? 'purple' : i === 0 ? 'stone' : 'wood');
    if (i === 0) { ctx.drawImage(wandSprite(w.id), x + 8, aby + 7); }
    else if (ab) { const col = ab.ultimate ? '#ff3a7a' : ELEMENT_COLORS[w.element] || '#fff'; rect(ctx, x + 5, aby + 5, 18, 18, 'rgba(0,0,0,0.35)'); ctx.drawImage(abilityIcon(ab.id, col), x + 9, aby + 9); const cd = p.cds[key]; if (cd > 0) { rect(ctx, x + 4, aby + 4 + Math.round(20 * (1 - cd / (ab.cd * (1 - Math.min(0.6, p.stats.cdr || 0))))), 20, Math.round(20 * cd / (ab.cd * (1 - Math.min(0.6, p.stats.cdr || 0)))), 'rgba(0,0,0,0.7)'); text(ctx, Math.ceil(cd), x + 14, aby + 10, '#fff', 7, 'center'); } else if (p.mana < ab.mana) rect(ctx, x + 4, aby + 4, 20, 20, 'rgba(20,30,120,0.5)'); }
    else if (locked) { text(ctx, '?', x + 14, aby + 10, '#5a2a8a', 10, 'center'); }
    text(ctx, key, x + 14, aby + 29, i === 4 ? '#c070ff' : '#f0c8a0', 5, 'center');
    const mx = Input.mouse.x, my = Input.mouse.y;
    if (mx >= x && mx < x + 28 && my >= aby && my < aby + 28) { G.uiHover = true; if (ab) tooltip(ctx, mx, my - 10, [[ab.name, ab.ultimate ? '#ff3a7a' : '#fff8c0'], ...wrap(ctx, ab.desc, 180, 6).map(l => [l, '#d8d8e0']), [`CD ${ab.cd}s  Mana ${ab.mana}`, '#5ad8f0']]); else if (i === 0) tooltip(ctx, mx, my - 10, [[w.name, RARITY_COLORS[w.rarity]], [`${Math.round(p.wandDmg())} dmg  ${w.rate}/s  ${w.element}`, '#d8d8e0'], ...wrap(ctx, w.desc, 180, 6).map(l => [l, '#a8a8b8'])]); else if (locked) tooltip(ctx, mx, my - 10, [['Secret ability', '#c070ff'], ['Only mythic & secret wands', '#a8a8b8'], ['unlock the V key.', '#a8a8b8']]); }
  }
  // ---- quick slots ----
  const qx = W - 4 - 5 * 20, qy = H - 26;
  for (let i = 0; i < 5; i++) { const x = qx + i * 20; panel(ctx, x, qy, 19, 19, 'dark'); const id = G.quickSlots[i]; if (id && ITEMS[id]) { const ic = itemIcon(id); ctx.drawImage(ic, x + 5, qy + 5); const n = p.countItem(id); text(ctx, n, x + 16, qy + 12, n > 0 ? '#fff' : '#d43a3a', 5, 'right'); } text(ctx, i + 1, x + 2, qy + 1, '#a8a8b8', 5); const mx = Input.mouse.x, my = Input.mouse.y; if (mx >= x && mx < x + 19 && my >= qy && my < qy + 19) { G.uiHover = true; if (id && ITEMS[id]) tooltip(ctx, mx - 60, my - 24, [[ITEMS[id].name, '#fff8c0'], ...wrap(ctx, ITEMS[id].desc, 140, 6).map(l => [l, '#a8a8b8'])]); else tooltip(ctx, mx - 60, my - 16, [['Right-click an item in', '#a8a8b8'], ['inventory to assign.', '#a8a8b8']]); } }
  // ---- pets ----
  let py = H - 30; for (const pt of G.pets) { panel(ctx, 4, py - 6, 60, 26, 'green'); const spr = petSprite(pt.def.id); ctx.globalAlpha = pt.ko ? 0.4 : 1; ctx.drawImage(spr, 8, py - 3, 12, 12); ctx.globalAlpha = 1; text(ctx, (pt.data.name || pt.def.name).slice(0, 8), 22, py - 3, RARITY_COLORS[pt.def.rarity], 5); bar(ctx, 22, py + 5, 36, 3, pt.hp / pt.maxHp, '#8fe04a', '#0a2a0a'); text(ctx, pt.ko ? `KO ${Math.ceil(pt.koT)}s` : `L${pt.lvl}${pt.riding ? ' RIDE' : ''}`, 22, py + 10, pt.ko ? '#d43a3a' : '#a8a8b8', 5); py -= 30; }
  // ---- minimap ----
  const mmx = W - 80, mmy = 4; panel(ctx, mmx - 4, mmy, 80, 106, 'dark');
  if (G.mapCanvas) { const ptx = p.x / 16, pty = p.y / 16; ctx.drawImage(G.mapCanvas, ptx - 36, pty - 36, 72, 72, mmx, mmy + 4, 72, 72);
    for (const poi of G.world.pois) { const dx = poi.tx - ptx, dy = poi.ty - pty; if (Math.abs(dx) < 36 && Math.abs(dy) < 36) { rect(ctx, mmx + 36 + dx - 1, mmy + 40 + dy - 1, 3, 3, G.discovered[poi.id] ? poi.def.icon : '#6b6b7b'); } }
    for (const e of G.enemies) { const dx = e.x / 16 - ptx, dy = e.y / 16 - pty; if (Math.abs(dx) < 36 && Math.abs(dy) < 36) rect(ctx, mmx + 36 + dx, mmy + 40 + dy, e.def.boss ? 2 : 1, e.def.boss ? 2 : 1, e.def.boss ? '#ff3a7a' : '#d43a3a'); }
    for (const wp of G.wildPets) { const dx = wp.x / 16 - ptx, dy = wp.y / 16 - pty; if (Math.abs(dx) < 36 && Math.abs(dy) < 36) rect(ctx, mmx + 36 + dx, mmy + 40 + dy, 1, 1, '#f07ad0'); }
    for (const n of G.npcs) { const dx = n.x / 16 - ptx, dy = n.y / 16 - pty; if (Math.abs(dx) < 36 && Math.abs(dy) < 36) rect(ctx, mmx + 36 + dx, mmy + 40 + dy, 1, 1, '#f5d33a'); }
    rect(ctx, mmx + 35, mmy + 39, 2, 2, '#fff'); }
  const night = G.time > 0.74 || G.time < 0.22; const hour = Math.floor(((G.time + 0.25) % 1) * 24); const mins = Math.floor((((G.time + 0.25) % 1) * 24 - hour) * 60);
  text(ctx, `Day ${G.day}  ${String(hour).padStart(2, '0')}:${String(mins).padStart(2, '0')}`, mmx + 36, mmy + 79, night ? '#c8f0ff' : '#f5d33a', 5, 'center');
  const biome = G.world.biomeAt(Math.floor(p.x / 16), Math.floor(p.y / 16)); text(ctx, BIOME_NAMES[biome] || biome, mmx + 36, mmy + 87, '#a8a8b8', 5, 'center');
  if (G.event && G.event.day === G.day) { const ev = G.EVENTS[G.event.type]; text(ctx, ev.name, mmx + 36, mmy + 97, ev.color, 5, 'center'); }
  // ---- quest tracker ----
  const act = Quests.active().slice(0, 3); let qy2 = 116;
  for (const q of act) { const done = Quests.isComplete(q); text(ctx, (done ? '[DONE] ' : '') + q.name, W - 6, qy2, done ? '#8fe04a' : '#f5d33a', 5, 'right'); qy2 += 7; q.objectives.forEach((o, i) => { text(ctx, Quests.objText(q, i), W - 6, qy2, Quests.progress(q, i) >= Quests.goal(o) ? '#8fe04a' : '#d8d8e0', 5, 'right'); qy2 += 7; }); qy2 += 3; }
  // ---- boss bar ----
  const boss = G.enemies.find(e => e.def.boss && Math.hypot(e.x - p.x, e.y - p.y) < 500);
  if (boss) { panel(ctx, W / 2 - 110, 4, 220, 20, 'red'); text(ctx, boss.def.name, W / 2, 7, '#fff8c0', 6, 'center'); bar(ctx, W / 2 - 100, 15, 200, 5, boss.hp / boss.maxHp, '#d43a3a', '#2a0a0a', '#10101a', '#ff8a8a'); }
  // ---- notices ----
  let ny = boss ? 30 : 8; for (const n of G.notices) { const a = Math.min(1, n.t / 0.5); ctx.globalAlpha = a; const tw = textW(ctx, n.msg, 6) + 12; rect(ctx, W / 2 - tw / 2, ny, tw, 11, 'rgba(0,0,0,0.7)'); text(ctx, n.msg, W / 2, ny + 2, n.color, 6, 'center'); ctx.globalAlpha = 1; ny += 13; }
  // ---- interaction hint ----
  const hint = interactionHint(); if (hint && !G.menu && !G.dialog) { const tw = textW(ctx, hint, 6) + 10; rect(ctx, W / 2 - tw / 2, H - 60, tw, 11, 'rgba(0,0,0,0.6)'); text(ctx, hint, W / 2, H - 58, '#fff8c0', 6, 'center'); }
  if (G.timeStop > 0) { text(ctx, 'TIME STOPPED', W / 2, 60, '#60a890', 10, 'center'); }
  if (p.dead) { rect(ctx, 0, 0, W, H, 'rgba(60,0,0,0.5)'); text(ctx, 'YOU DIED', W / 2, H / 2 - 20, '#d43a3a', 20, 'center'); text(ctx, 'Respawning...', W / 2, H / 2 + 6, '#fff', 8, 'center'); }
  if (G.victory) { text(ctx, 'THE LIGHT RETURNS', W / 2, 70, '#fff8c0', 14, 'center'); }
}
export function interactionHint() {
  const p = G.player; const near = (list, r) => { let best = null, bd = r; for (const e of list) { const d = Math.hypot(e.x - p.x, e.y - p.y); if (d < bd) { bd = d; best = e; } } return best; };
  const npc = near(G.npcs, 30); if (npc) return `[F] Talk to ${npc.def.name}`;
  const wp = near(G.wildPets, 26); if (wp) { const has = p.inventory.some(s => ITEMS[s.id] && ITEMS[s.id].food && (ITEMS[s.id].food === wp.def.food || ITEMS[s.id].food === 'any')); return `[F] Feed ${wp.def.name} (${foodName(wp.def.food).split(' ')[0]})${has ? '' : ' - none!'}`; }
  const ft = p.facingTile(); const px = Math.floor(p.x / 16), py = Math.floor((p.y - 2) / 16); const cands = [ft]; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cands.push({ x: px + dx, y: py + dy });
  for (const c of cands) { const o = G.world.obj(c.x, c.y); if (!o) continue; const d = OBJ[o]; if (d.interact === 'chest') return '[F] Open ' + d.name; if (d.station) return `[F] Use ${d.name} (craft)`; if (d.interact) return '[F] ' + d.name; if (d.harvest) return `[F] ${d.harvest.type === 'wood' ? 'Chop' : 'Mine'} ${d.name}`; }
  for (const c of cands) { const t = G.world.get(c.x, c.y); if ([3, 4, 37].includes(t)) return '[F] Fish'; }
  return null;
}
export function tooltip(ctx, x, y, lines, size = 6) {
  const w = Math.max(...lines.map(l => textW(ctx, l[0], size))) + 10; const h = lines.length * (size + 2) + 6;
  x = Math.min(G.W - w - 2, Math.max(2, x)); y = Math.max(2, Math.min(G.H - h - 2, y - h));
  panel(ctx, x, y, w, h, 'dark'); lines.forEach((l, i) => text(ctx, l[0], x + 5, y + 4 + i * (size + 2), l[1] || '#fff', size));
}
