import { G } from '../state.js';
import { text, textW, panel, bar, rect, frame, button, RARITY_COLORS, ELEMENT_COLORS, wrap } from '../engine/draw.js';
import { Input } from '../engine/input.js';
import { Audio } from '../engine/audio.js';
import { ITEMS, itemIcon } from '../data/items.js';
import { WANDS, WAND_LIST, wandSprite, wandDamage, wandLevelXp } from '../data/wands.js';
import { ARMOR, armorIcon } from '../data/armor.js';
import { PETS, PET_LIST, petSprite, PET_ABILITY_DESC } from '../data/pets.js';
import { ABILITIES } from '../data/abilities.js';
import { ENEMIES, ENEMY_LIST, enemySprite } from '../data/enemies.js';
import { allRecipes, canCraft, STATION_NAMES } from '../game/crafting.js';
import { Quests } from '../game/questsys.js';
import { QUEST_LIST } from '../data/quests.js';
import { XP_NEED, foodName } from '../game/player.js';
import { save, exportJson, importJson, clearSave } from '../game/save.js';
import { tooltip } from './hud.js';
import { BIOME_NAMES } from '../world/world.js';
import { silhouette } from '../engine/sprites.js';
import { NPCS } from '../data/npcs.js';
import { RARITY_ORDER } from '../state.js';
import { spawnParticles } from '../game/entities.js';
const ENCHANTS = [['dmg', 0.05, 0.12, 'Damage'], ['crit', 0.03, 0.08, 'Crit'], ['speed', 0.03, 0.08, 'Speed'], ['luck', 0.04, 0.1, 'Luck'], ['regen', 0.5, 1.2, 'HP Regen'], ['manaRegen', 0.5, 1.2, 'Mana Regen'], ['lifesteal', 0.02, 0.05, 'Lifesteal'], ['cdr', 0.03, 0.08, 'Cooldown Reduction']];
export function enchantText(en) { return Object.keys(en || {}).map(k => '+' + fmtStat(k, en[k])).join(', '); }
const TABS = [['inv', 'Inventory', 'i'], ['craft', 'Craft', 'k'], ['pets', 'Pets', 'p'], ['quests', 'Quests', 'j'], ['map', 'Map', 'm'], ['stats', 'Stats', 't'], ['bestiary', 'Bestiary', 'b'], ['settings', 'Options', 'o']];
const S = { craftCat: 'wands', craftSel: null, craftScroll: 0, petSel: null, petScroll: 0, questSel: null, bestScroll: 0, bestTab: 'pets', invSel: null, confirmReset: false, hover: null, tip: null, mapHover: null };
let clickUsed = false;
function hit(x, y, w, h) { const m = Input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }
function btn(ctx, x, y, w, h, label, style = 'wood', size = 6, disabled = false) { const hv = hit(x, y, w, h); button(ctx, x, y, w, h, label, hv && !disabled, style, size, disabled); if (hv) G.uiHover = true; if (hv && Input.mouse.pressed && !clickUsed && !disabled) { clickUsed = true; Audio.play('ui'); return true; } return false; }
function itemName(id) { return (ITEMS[id] || ARMOR[id] || WANDS[id] || { name: id }).name; }
function itemRarity(id) { return (ITEMS[id] || ARMOR[id] || WANDS[id] || { rarity: 'common' }).rarity; }
function icon(id) { if (ARMOR[id]) return armorIcon(id); if (WANDS[id]) return wandSprite(id); return itemIcon(id); }
function itemTip(id, extra = []) { const d = ITEMS[id] || ARMOR[id]; if (!d) return [[id, '#fff']]; const lines = [[d.name, RARITY_COLORS[d.rarity]]]; if (ARMOR[id]) { lines.push([`${d.slot.toUpperCase()}  DEF ${d.def}  (${d.setName || 'Charm'})`, '#a8a8b8']); for (const k in d.buffs) lines.push([`+${fmtStat(k, d.buffs[k])}`, '#8fe04a']); if (d.setBonus) lines.push([`Set (4): ${Object.keys(d.setBonus).map(k => '+' + fmtStat(k, d.setBonus[k])).join(' ')}`, '#f5d33a']); } lines.push(...wrap(G.ctx, d.desc || '', 170, 6).map(l => [l, '#d8d8e0'])); if (d.food) lines.push([`Food: ${d.food} creatures love this`, '#f07ad0']); lines.push([`Value ${d.value}c`, '#c9a227']); return [...lines, ...extra]; }
export function fmtStat(k, v) { const pct = ['speed', 'crit', 'dmg', 'luck', 'petDmg', 'petHp', 'xp', 'coinBonus', 'lifesteal', 'fireRes', 'iceRes', 'cdr', 'tame', 'rate']; const names = { hp: 'HP', mana: 'Mana', def: 'Defense', speed: 'Speed', crit: 'Crit', dmg: 'Damage', luck: 'Luck', regen: 'HP Regen/s', manaRegen: 'Mana Regen/s', petDmg: 'Pet Damage', petHp: 'Pet HP', xp: 'XP Gain', coinBonus: 'Coin Drops', lifesteal: 'Lifesteal', fireRes: 'Fire Resist', iceRes: 'Ice Resist', cdr: 'Cooldown Reduction', tame: 'Taming', revive: 'Revive/day', thorns_burn: 'Burn attackers', thorns_freeze: 'Freeze attackers', rate: 'Fire Rate', magnet: 'Pickup Range' }; return `${pct.includes(k) ? Math.round(v * 100) + '%' : (+v.toFixed(1))} ${names[k] || k}`; }
export function openMenu(tab) { if (G.menu === tab) { closeMenu(); return; } G.menu = tab; Audio.play('open'); S.tip = null; }
export function closeMenu() { G.menu = null; Audio.play('close'); S.confirmReset = false; }
export function updateMenuInput() {
  if (G.dialog) return;
  for (const [id, , key] of TABS) if (Input.hit(key)) { if (G.menu) { if (G.menu === id) closeMenu(); else G.menu = id; } else openMenu(id); }
  if (Input.hit('Escape') || Input.hit('Tab')) { if (G.menu) closeMenu(); else if (Input.hit('Tab')) openMenu('inv'); }
}
export function drawMenu(ctx) {
  if (!G.menu) return; clickUsed = false; S.tip = null;
  const X = 40, Y = 22, W = 560, H = 316; G.uiHover = true;
  rect(ctx, 0, 0, G.W, G.H, 'rgba(0,0,0,0.55)');
  panel(ctx, X, Y, W, H, 'wood');
  // tabs
  let tx = X + 6; for (const [id, name, key] of TABS) { const w = textW(ctx, name, 6) + 12; const act = G.menu === id; const hv = hit(tx, Y - 10, w, 16); panel(ctx, tx, Y - 10, w, 16, act ? 'gold' : hv ? 'stone' : 'dark'); text(ctx, name, tx + w / 2, Y - 6, act ? '#fff8c0' : '#a8a8b8', 6, 'center'); if (hv && Input.mouse.pressed && !clickUsed) { clickUsed = true; G.menu = id; Audio.play('ui'); } tx += w + 3; }
  text(ctx, '[ESC] close', X + W - 8, Y - 6, '#6b6b7b', 5, 'right');
  const fn = { inv: drawInventory, craft: drawCraft, pets: drawPets, quests: drawQuests, map: drawMap, stats: drawStats, bestiary: drawBestiary, settings: drawSettings }[G.menu];
  if (fn) fn(ctx, X + 8, Y + 10, W - 16, H - 18);
  if (S.tip) tooltip(ctx, S.tip.x, S.tip.y, S.tip.lines);
  Input.mouse.wheel = 0;
}
// ================= INVENTORY =================
function drawInventory(ctx, x, y, w, h) {
  const p = G.player;
  // equipment column
  text(ctx, 'EQUIPMENT', x + 4, y, '#f5d33a', 7);
  const slots = [['wand', 'Wand'], ['head', 'Head'], ['body', 'Body'], ['legs', 'Legs'], ['feet', 'Feet'], ['charm', 'Charm']];
  slots.forEach(([slot, label], i) => { const sx = x + 4, sy = y + 12 + i * 24; panel(ctx, sx, sy, 22, 22, 'stone'); const id = p.equip[slot]; if (id) { const ic = icon(id); if (ic) ctx.drawImage(ic, sx + 5, sy + 5, 12, 12); } text(ctx, label, sx + 26, sy + 2, '#a8a8b8', 5); text(ctx, id ? itemName(id) : '-', sx + 26, sy + 10, id ? RARITY_COLORS[itemRarity(id)] : '#6b6b7b', 5); if (hit(sx, sy, 22, 22)) { if (id) S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: itemTip(id, slot !== 'wand' ? [['Click to unequip', '#6b6b7b']] : []) }; if (Input.mouse.pressed && !clickUsed && slot !== 'wand' && id) { clickUsed = true; p.unequip(slot); } } });
  // stats summary
  const s = p.stats; const sy = y + 160; text(ctx, 'STATS', x + 4, sy, '#f5d33a', 7);
  const lines = [`DMG x${(1 + s.dmg).toFixed(2)}  DEF ${Math.round(s.def)}`, `CRIT ${Math.round(s.crit * 100)}%  SPD ${Math.round(p.speed)}`, `LUCK ${Math.round(s.luck * 100)}%  REGEN ${s.regen.toFixed(1)}/s`, `MANA REGEN ${s.manaRegen.toFixed(1)}/s`, `PET DMG +${Math.round(s.petDmg * 100)}%  XP +${Math.round(s.xp * 100)}%`]; lines.forEach((l, i) => text(ctx, l, x + 4, sy + 10 + i * 8, '#d8d8e0', 5)); if (p.setBonus) text(ctx, `SET BONUS: ${p.setBonus}`, x + 4, sy + 52, '#8fe04a', 5);
  // wands owned
  text(ctx, 'WANDS (click to equip)', x + 150, y + 190, '#f5d33a', 6);
  const owned = Object.keys(p.wands); let wx = x + 150, wy = y + 200; for (const id of owned) { const wd = WANDS[id]; const act = p.equip.wand === id; panel(ctx, wx, wy, 20, 20, act ? 'gold' : 'dark'); ctx.drawImage(wandSprite(id), wx + 4, wy + 4); if (hit(wx, wy, 20, 20)) { const wl = p.wands[id]; S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: [[wd.name + ` Lv${wl.lvl}`, RARITY_COLORS[wd.rarity]], [`${Math.round(wandDamage(wd, wl.lvl))} dmg  ${wd.rate}/s  ${wd.element}`, '#d8d8e0'], ...(wl.ench ? [['Enchanted: ' + enchantText(wl.ench), '#c070ff']] : []), [`E: ${ABILITIES[wd.abilities.E].name}  Q: ${ABILITIES[wd.abilities.Q].name}`, '#5ad8f0'], [`C: ${ABILITIES[wd.abilities.C].name}${wd.abilities.V ? '  V: ' + ABILITIES[wd.abilities.V].name : ''}`, '#5ad8f0'], ...wrap(ctx, wd.desc, 170, 6).map(l => [l, '#a8a8b8'])] }; if (Input.mouse.pressed && !clickUsed) { clickUsed = true; p.equipItem(id); } } wx += 22; if (wx > x + w - 30) { wx = x + 150; wy += 22; } }
  // enchanting (needs an altar nearby)
  const nearAltar = G.nearStations().includes('altar'); const cw = p.wands[p.equip.wand] || {}; const nEn = Object.keys(cw.ench || {}).length; const cost = 10 + nEn * 10, ccost = 50 + nEn * 100;
  const ey = y + 258; text(ctx, nearAltar ? `Altar nearby: enchant ${p.wandDef().name} (${cost} arcane dust + ${ccost}c)` : 'Stand near an Arcane Altar to enchant your wand.', x + 150, ey, nearAltar ? '#c070ff' : '#6b6b7b', 5);
  if (nearAltar) { const can = nEn < 3 && p.countItem('arcane_dust') >= cost && p.coins >= ccost; if (btn(ctx, x + 150, ey + 8, 90, 14, nEn >= 3 ? 'MAX ENCHANTS' : 'ENCHANT', can ? 'purple' : 'dark', 5, !can)) { p.removeItem('arcane_dust', cost); p.coins -= ccost; const [k, lo, hi, nm] = ENCHANTS[Math.floor(Math.random() * ENCHANTS.length)]; cw.ench = cw.ench || {}; const v = +(lo + Math.random() * (hi - lo)).toFixed(3); cw.ench[k] = +((cw.ench[k] || 0) + v).toFixed(3); p.recalc(); Audio.play('tame'); spawnParticles(p.x, p.y - 8, 30, '#c070ff', { speed: 60, life: 0.8 }); G.notify(`${p.wandDef().name} enchanted: +${fmtStat(k, v)}!`, '#c070ff', 4); } if (cw.ench) text(ctx, enchantText(cw.ench), x + 246, ey + 11, '#c070ff', 5); }
  // grid
  text(ctx, `INVENTORY  ${p.inventory.length}/${p.maxSlots}   ${p.coins} coins`, x + 150, y, '#f5d33a', 7);
  text(ctx, 'L-click: use/equip   R-click: quick slot', x + w - 4, y + 1, '#6b6b7b', 5, 'right');
  const cols = 10, size = 22; const gx = x + 150, gy = y + 12;
  for (let i = 0; i < p.maxSlots; i++) { const cx = gx + (i % cols) * size, cy = gy + Math.floor(i / cols) * size; const slot = p.inventory[i]; panel(ctx, cx, cy, size - 1, size - 1, slot ? (ARMOR[slot.id] ? 'blue' : 'dark') : 'dark'); if (slot) { const ic = icon(slot.id); if (ic) ctx.drawImage(ic, cx + 5, cy + 4, 12, 12); if (slot.n > 1) text(ctx, slot.n, cx + size - 3, cy + size - 8, '#fff', 5, 'right'); if (hit(cx, cy, size, size)) { const d = ITEMS[slot.id]; const extra = []; if (ARMOR[slot.id]) extra.push(['Click to equip', '#6b6b7b']); else if (d && (d.use || d.heal)) extra.push(['Click to use', '#6b6b7b'], ['Right-click: quick slot', '#6b6b7b']); S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: itemTip(slot.id, extra) }; if (Input.mouse.pressed && !clickUsed) { clickUsed = true; if (ARMOR[slot.id]) p.equipItem(slot.id); else if (!p.useItem(slot.id)) G.notify('Cannot use that.', '#6b6b7b'); } if (Input.mouse.rpressed) { if (d && (d.use || d.heal)) { const free = G.quickSlots.indexOf(slot.id) >= 0 ? G.quickSlots.indexOf(slot.id) : G.quickSlots.indexOf(null); if (free >= 0) { G.quickSlots[free] = slot.id; G.notify(`${d.name} assigned to slot ${free + 1}.`); } else { G.quickSlots[0] = slot.id; G.notify(`${d.name} assigned to slot 1.`); } Audio.play('ui'); } } } } }
}
// ================= CRAFT =================
function drawCraft(ctx, x, y, w, h) {
  const p = G.player; const cats = [['wands', 'Wands'], ['armor', 'Armor'], ['charms', 'Charms'], ['materials', 'Materials'], ['potions', 'Potions'], ['food', 'Food'], ['pet', 'Pet Items']];
  let cx = x; for (const [id, name] of cats) { const cw = textW(ctx, name, 5) + 10; if (btn(ctx, cx, y, cw, 13, name, S.craftCat === id ? 'gold' : 'dark', 5)) { S.craftCat = id; S.craftScroll = 0; S.craftSel = null; } cx += cw + 2; }
  const near = G.nearStations(); text(ctx, 'Nearby: ' + (near.length ? near.map(s => STATION_NAMES[s]).join(', ') : 'none'), x + w - 4, y + 3, near.length ? '#8fe04a' : '#6b6b7b', 5, 'right');
  const list = allRecipes().filter(r => r.cat === S.craftCat).sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  const lx = x, ly = y + 18, lw = 230, lh = h - 22; panel(ctx, lx, ly, lw, lh, 'dark');
  const rowH = 18; const vis = Math.floor((lh - 6) / rowH); if (hit(lx, ly, lw, lh)) S.craftScroll = Math.max(0, Math.min(Math.max(0, list.length - vis), S.craftScroll + Input.mouse.wheel));
  for (let i = 0; i < vis; i++) { const r = list[i + S.craftScroll]; if (!r) break; const ry = ly + 3 + i * rowH; const sel = S.craftSel === r.id; const cc = canCraft(p, r, near); const ownedWand = r.type === 'wand' && p.wands[r.id]; if (sel) rect(ctx, lx + 3, ry, lw - 6, rowH - 1, 'rgba(201,162,39,0.25)'); else if (hit(lx + 3, ry, lw - 6, rowH)) rect(ctx, lx + 3, ry, lw - 6, rowH - 1, 'rgba(255,255,255,0.06)'); const ic = r.type === 'wand' ? wandSprite(r.id) : r.type === 'armor' ? armorIcon(r.id) : itemIcon(r.id); if (ic) ctx.drawImage(ic, lx + 6, ry + 2, 12, 12); text(ctx, r.name + (r.n > 1 ? ` x${r.n}` : ''), lx + 22, ry + 2, ownedWand ? '#6b6b7b' : RARITY_COLORS[r.rarity], 6); text(ctx, ownedWand ? 'OWNED' : cc.ok ? 'READY' : r.station && !near.includes(r.station) ? STATION_NAMES[r.station] : 'missing', lx + lw - 6, ry + 3, ownedWand ? '#6b6b7b' : cc.ok ? '#8fe04a' : '#d43a3a', 5, 'right'); if (r.type !== 'item') text(ctx, `T${r.tier}`, lx + 22, ry + 10, '#6b6b7b', 5); if (hit(lx + 3, ry, lw - 6, rowH) && Input.mouse.pressed && !clickUsed) { clickUsed = true; S.craftSel = r.id; Audio.play('ui'); } }
  if (list.length > vis) text(ctx, `${S.craftScroll + 1}-${Math.min(list.length, S.craftScroll + vis)}/${list.length} (scroll)`, lx + lw / 2, ly + lh - 8, '#6b6b7b', 5, 'center');
  // details
  const r = list.find(q => q.id === S.craftSel) || list[0]; if (!r) return; const dx = x + lw + 8, dy = y + 18, dw = w - lw - 8;
  panel(ctx, dx, dy, dw, lh, 'stone');
  const ic = r.type === 'wand' ? wandSprite(r.id) : r.type === 'armor' ? armorIcon(r.id) : itemIcon(r.id); if (ic) ctx.drawImage(ic, dx + 8, dy + 8, 24, 24);
  text(ctx, r.name, dx + 38, dy + 8, RARITY_COLORS[r.rarity], 7); text(ctx, `${r.rarity.toUpperCase()}${r.type !== 'item' ? '  Tier ' + r.tier : ''}${r.station ? '  @ ' + STATION_NAMES[r.station] : ''}`, dx + 38, dy + 18, '#a8a8b8', 5);
  let yy = dy + 36;
  if (r.type === 'wand') { const d = r.def; const stat = [`Damage ${d.dmg}  Rate ${d.rate}/s  Speed ${d.speed}`, `Element: ${d.element}${d.proj.count ? '  Shots x' + d.proj.count : ''}${d.proj.pierce ? '  Pierce ' + d.proj.pierce : ''}${d.proj.homing ? '  Homing' : ''}${d.proj.bounce ? '  Bounce' : ''}${d.proj.explode ? '  Explosive' : ''}`]; for (const l of stat) { text(ctx, l, dx + 8, yy, '#d8d8e0', 5); yy += 8; } const fx = Object.keys(d.effects).filter(k => d.effects[k]); if (fx.length) { text(ctx, 'On hit: ' + fx.join(', '), dx + 8, yy, '#f0c8a0', 5); yy += 8; } yy += 2; for (const k of ['E', 'Q', 'C', 'V']) { const a = d.abilities[k]; if (!a) continue; const ab = ABILITIES[a]; text(ctx, `[${k}] ${ab.name}`, dx + 8, yy, k === 'V' ? '#ff3a7a' : '#5ad8f0', 6); yy += 8; for (const l of wrap(ctx, ab.desc, dw - 20, 5)) { text(ctx, l, dx + 12, yy, '#a8a8b8', 5); yy += 7; } } yy += 2; for (const l of wrap(ctx, d.desc, dw - 16, 5)) { text(ctx, l, dx + 8, yy, '#c8a0f0', 5); yy += 7; } }
  else if (r.type === 'armor') { const d = r.def; text(ctx, `Slot: ${d.slot}   Defense ${d.def}`, dx + 8, yy, '#d8d8e0', 5); yy += 8; for (const k in d.buffs) { text(ctx, '+' + fmtStat(k, d.buffs[k]), dx + 8, yy, '#8fe04a', 5); yy += 8; } if (d.setBonus) { text(ctx, `Set bonus (4 pieces):`, dx + 8, yy, '#f5d33a', 5); yy += 8; for (const k in d.setBonus) { text(ctx, '+' + fmtStat(k, d.setBonus[k]), dx + 12, yy, '#f5d33a', 5); yy += 7; } } for (const l of wrap(ctx, d.desc, dw - 16, 5)) { text(ctx, l, dx + 8, yy, '#c8a0f0', 5); yy += 7; } }
  else { for (const l of wrap(ctx, r.def ? r.def.desc : '', dw - 16, 5)) { text(ctx, l, dx + 8, yy, '#d8d8e0', 5); yy += 7; } }
  yy += 6; text(ctx, 'INGREDIENTS', dx + 8, yy, '#f5d33a', 6); yy += 9;
  for (const [id, n] of r.ingredients) { const have = p.countItem(id); const ii = icon(id); if (ii) ctx.drawImage(ii, dx + 8, yy - 1, 8, 8); text(ctx, `${itemName(id)}`, dx + 20, yy, have >= n ? '#d8d8e0' : '#d43a3a', 5); text(ctx, `${have}/${n}`, dx + dw - 8, yy, have >= n ? '#8fe04a' : '#d43a3a', 5, 'right'); yy += 9; }
  const cc = canCraft(p, r, near);
  if (btn(ctx, dx + dw / 2 - 40, dy + lh - 24, 80, 18, cc.ok ? 'CRAFT' : cc.why, cc.ok ? 'green' : 'dark', 6, !cc.ok)) G.craft(r);
}
// ================= PETS =================
function drawPets(ctx, x, y, w, h) {
  const p = G.player; text(ctx, `YOUR PETS (${p.pets.length})   Active: ${p.activePets.length}/${p.maxActivePets()}   Tamed species: ${Object.keys(p.tamedIds).length}/${PET_LIST.length}`, x + 4, y, '#f5d33a', 7);
  const lx = x, ly = y + 12, lw = 250, lh = h - 14; panel(ctx, lx, ly, lw, lh, 'dark'); const rowH = 20; const vis = Math.floor((lh - 6) / rowH);
  if (hit(lx, ly, lw, lh)) S.petScroll = Math.max(0, Math.min(Math.max(0, p.pets.length - vis), S.petScroll + Input.mouse.wheel));
  if (!p.pets.length) { ['No pets yet!', 'Find wild creatures, carry their favorite', 'food, and press F next to them.', 'Fruit: apples, berries. Meat, fish, bugs...', 'Beastmaster Tilly sells treats.'].forEach((l, i) => text(ctx, l, lx + 10, ly + 12 + i * 10, '#a8a8b8', 6)); }
  for (let i = 0; i < vis; i++) { const pd = p.pets[i + S.petScroll]; if (!pd) break; const def = PETS[pd.id]; const ry = ly + 3 + i * rowH; const act = p.activePets.includes(pd.uid); const sel = S.petSel === pd.uid; if (sel) rect(ctx, lx + 3, ry, lw - 6, rowH - 1, 'rgba(201,162,39,0.25)'); else if (act) rect(ctx, lx + 3, ry, lw - 6, rowH - 1, 'rgba(60,138,46,0.2)'); ctx.drawImage(petSprite(pd.id), lx + 6, ry + 3, 14, 14); text(ctx, pd.name, lx + 24, ry + 3, RARITY_COLORS[def.rarity], 6); text(ctx, `Lv${pd.lvl} ${def.element}${act ? '  ACTIVE' : ''}${p.ridingUid === pd.uid ? ' RIDING' : ''}`, lx + 24, ry + 11, act ? '#8fe04a' : '#a8a8b8', 5); if (hit(lx + 3, ry, lw - 6, rowH) && Input.mouse.pressed && !clickUsed) { clickUsed = true; S.petSel = pd.uid; Audio.play('ui'); } }
  const pd = p.pets.find(q => q.uid === S.petSel) || p.pets[0]; if (!pd) return; const def = PETS[pd.id]; const dx = x + lw + 8, dy = y + 12, dw = w - lw - 8; panel(ctx, dx, dy, dw, lh, 'green');
  ctx.drawImage(petSprite(pd.id), dx + 10, dy + 10, 36, 36); text(ctx, pd.name, dx + 52, dy + 10, RARITY_COLORS[def.rarity], 7); text(ctx, `${def.name}  ${def.rarity.toUpperCase()}`, dx + 52, dy + 20, '#a8a8b8', 5); text(ctx, `Level ${pd.lvl}   XP ${pd.xp}/${Math.floor(30 * Math.pow(pd.lvl, 1.5))}`, dx + 52, dy + 28, '#d8d8e0', 5); bar(ctx, dx + 52, dy + 36, 100, 3, pd.xp / Math.floor(30 * Math.pow(pd.lvl, 1.5)), '#c070ff');
  let yy = dy + 54; const live = G.pets.find(q => q.data.uid === pd.uid);
  text(ctx, `HP ${live ? Math.round(live.hp) + '/' + live.maxHp : Math.round(def.hp * (1 + (pd.lvl - 1) * 0.1))}   DMG ${Math.round(def.dmg * (1 + (pd.lvl - 1) * 0.08))}   SPD ${def.spd}`, dx + 8, yy, '#d8d8e0', 5); yy += 9;
  text(ctx, `Element: ${def.element}   Food: ${foodName(def.food).split(' ')[0]}`, dx + 8, yy, '#d8d8e0', 5); yy += 9;
  text(ctx, `Ability: ${PET_ABILITY_DESC[def.abil] || def.abil}`, dx + 8, yy, '#5ad8f0', 5); yy += 9;
  text(ctx, 'Buffs while active: ' + Object.keys(def.buff).map(k => '+' + fmtStat(k, def.buff[k] * (1 + (pd.lvl - 1) * 0.05))).join(', '), dx + 8, yy, '#8fe04a', 5); yy += 9;
  text(ctx, `${def.ride ? 'RIDEABLE (x' + def.ride + ' speed)' : 'Not rideable'}${def.fly ? '  FLIES over water & lava' : def.swim ? '  SWIMS' : ''}`, dx + 8, yy, def.ride ? '#f5d33a' : '#6b6b7b', 5); yy += 14;
  const act = p.activePets.includes(pd.uid);
  if (btn(ctx, dx + 8, yy, 90, 16, act ? 'DISMISS' : 'SUMMON', act ? 'dark' : 'green')) p.setPetActive(pd.uid, !act);
  if (def.ride && act && btn(ctx, dx + 104, yy, 70, 16, p.ridingUid === pd.uid ? 'DISMOUNT' : 'RIDE [R]', 'gold')) { if (p.ridingUid === pd.uid) p.dismount(); else { p.dismount(); const pt = G.pets.find(q => q.data.uid === pd.uid); if (pt) { p.ridingUid = pt.data.uid; pt.riding = true; Audio.play('ride'); } } }
  const evo = PET_LIST.filter(q => q.species === def.species && RARITY_ORDER.indexOf(q.rarity) === RARITY_ORDER.indexOf(def.rarity) + 1);
  if (evo.length) { const ready = pd.lvl >= 10; if (btn(ctx, dx + 180, yy, 80, 16, ready ? 'EVOLVE!' : `EVOLVE (L10)`, ready ? 'purple' : 'dark', 5, !ready)) { const nd = evo[Math.floor(Math.random() * evo.length)]; const oldName = pd.name; const wasDefault = pd.name === def.name; const wasActive = p.activePets.includes(pd.uid); if (wasActive) p.setPetActive(pd.uid, false); pd.id = nd.id; if (wasDefault) pd.name = nd.name; pd.lvl = Math.max(1, pd.lvl - 5); p.tamedIds[nd.id] = true; if (wasActive) p.setPetActive(pd.uid, true); p.recalc(); Audio.play('tame'); spawnParticles(p.x, p.y - 8, 40, ['#c070ff', '#f5d33a', '#fff'], { speed: 80, life: 1 }); G.notify(`${oldName} evolved into a ${nd.name}!`, RARITY_COLORS[nd.rarity], 5); } }
  yy += 20; if (btn(ctx, dx + 8, yy, 90, 16, 'RENAME', 'stone')) { const n = prompt('Name your pet:', pd.name); if (n && n.trim()) pd.name = n.trim().slice(0, 14); }
  if (btn(ctx, dx + 104, yy, 70, 16, 'RELEASE', 'red')) { if (confirm(`Release ${pd.name} back into the wild?`)) { p.releasePet(pd.uid); S.petSel = null; } }
  yy += 24; ['Tips:', '- Pets gain XP from your kills.', '- Pets at 0 HP return after 30s.', '- Pet Beds (Sanctuary) heal pets fully.', '- Level 10 & 20 unlock more active pets.', '- Pets can EVOLVE at level 10 into rarer forms!'].forEach(l => { text(ctx, l, dx + 8, yy, '#a8a8b8', 5); yy += 7; });
}
// ================= QUESTS =================
function drawQuests(ctx, x, y, w, h) {
  const act = Quests.active(); const done = QUEST_LIST.filter(q => G.questState[q.id] && G.questState[q.id].status === 'done').length;
  text(ctx, `ACTIVE QUESTS (${act.length})   Completed: ${done}/${QUEST_LIST.length}`, x + 4, y, '#f5d33a', 7);
  const lx = x, ly = y + 12, lw = 220, lh = h - 14; panel(ctx, lx, ly, lw, lh, 'dark');
  if (!act.length) text(ctx, 'Talk to NPCs with a ! to get quests.', lx + 8, ly + 10, '#a8a8b8', 6);
  act.forEach((q, i) => { const ry = ly + 4 + i * 16; const sel = S.questSel === q.id; const comp = Quests.isComplete(q); if (sel) rect(ctx, lx + 3, ry, lw - 6, 15, 'rgba(201,162,39,0.25)'); text(ctx, (q.main ? '* ' : '') + q.name, lx + 8, ry + 2, comp ? '#8fe04a' : q.main ? '#f5d33a' : '#d8d8e0', 6); text(ctx, comp ? 'READY' : '', lx + lw - 8, ry + 3, '#8fe04a', 5, 'right'); if (hit(lx + 3, ry, lw - 6, 15) && Input.mouse.pressed && !clickUsed) { clickUsed = true; S.questSel = q.id; } });
  const q = act.find(z => z.id === S.questSel) || act[0]; if (!q) return; const dx = x + lw + 8, dy = y + 12, dw = w - lw - 8; panel(ctx, dx, dy, dw, lh, 'stone');
  text(ctx, q.name, dx + 8, dy + 8, q.main ? '#f5d33a' : '#fff8c0', 7); text(ctx, `From: ${NPCS[q.giver] ? NPCS[q.giver].name : q.giver}${q.main ? '   [MAIN STORY]' : ''}`, dx + 8, dy + 18, '#a8a8b8', 5);
  let yy = dy + 30; for (const l of wrap(ctx, q.desc, dw - 16, 5)) { text(ctx, l, dx + 8, yy, '#d8d8e0', 5); yy += 7; } yy += 6; text(ctx, 'OBJECTIVES', dx + 8, yy, '#f5d33a', 6); yy += 9;
  q.objectives.forEach((o, i) => { const ok = Quests.progress(q, i) >= Quests.goal(o); text(ctx, (ok ? '[x] ' : '[ ] ') + Quests.objText(q, i), dx + 8, yy, ok ? '#8fe04a' : '#d8d8e0', 5); yy += 8; });
  yy += 6; text(ctx, 'REWARDS', dx + 8, yy, '#f5d33a', 6); yy += 9; text(ctx, `${q.rewards.coins || 0} coins, ${q.rewards.xp || 0} XP`, dx + 8, yy, '#c9a227', 5); yy += 8; for (const [id, n] of q.rewards.items || []) { const ic = icon(id); if (ic) ctx.drawImage(ic, dx + 8, yy, 8, 8); text(ctx, `${n}x ${itemName(id)}`, dx + 20, yy + 1, RARITY_COLORS[itemRarity(id)], 5); yy += 9; }
}
// ================= MAP =================
function drawMap(ctx, x, y, w, h) {
  const p = G.player; const size = 256; const mx = x + 8, my = y + 2; const sc = (h - 6) / size;
  panel(ctx, mx - 2, my - 2, size * sc + 4, size * sc + 4, 'dark');
  if (G.mapCanvas) ctx.drawImage(G.mapCanvas, mx, my, size * sc, size * sc);
  S.mapHover = null;
  for (const poi of G.world.pois) { const px = mx + poi.tx * sc, py = my + poi.ty * sc; const disc = G.discovered[poi.id]; if (disc) { rect(ctx, px - 2, py - 2, 5, 5, '#10101a'); rect(ctx, px - 1, py - 1, 3, 3, poi.def.icon); } else { rect(ctx, px - 1, py - 1, 3, 3, 'rgba(255,255,255,0.25)'); } if (hit(px - 4, py - 4, 9, 9)) S.mapHover = poi; }
  const ppx = mx + p.x / 16 * sc, ppy = my + p.y / 16 * sc; rect(ctx, ppx - 2, ppy - 2, 5, 5, '#fff'); rect(ctx, ppx - 1, ppy - 1, 3, 3, '#d43a3a');
  const lx = mx + size * sc + 14; text(ctx, 'WORLD MAP', lx, y + 2, '#f5d33a', 7);
  const disc = Object.keys(G.discovered).length; text(ctx, `Discovered ${disc}/${G.world.pois.length} locations`, lx, y + 14, '#d8d8e0', 5);
  if (S.mapHover) { const poi = S.mapHover; const d = G.discovered[poi.id]; text(ctx, d ? poi.name : '???', lx, y + 30, d ? poi.def.icon : '#a8a8b8', 7); let yy = y + 42; for (const l of wrap(ctx, d ? poi.def.desc : 'Travel there to discover it.', w - (lx - x) - 10, 5)) { text(ctx, l, lx, yy, '#d8d8e0', 5); yy += 7; } if (d) { const dist = Math.round(Math.hypot(poi.x - p.x, poi.y - p.y) / 16); text(ctx, `${dist} tiles away`, lx, yy + 4, '#a8a8b8', 5); if (poi.def.boss) text(ctx, `Boss: ${ENEMIES[poi.def.boss].name}`, lx, yy + 12, '#d43a3a', 5); } }
  else { let yy = y + 30; ['Hover a marker for details.', '', 'Biomes:'].forEach(l => { text(ctx, l, lx, yy, '#a8a8b8', 5); yy += 8; }); const bio = [['meadow', '#4f9a3a'], ['forest', '#2e6a2a'], ['dark_forest', '#1a4a1a'], ['desert', '#e2cf90'], ['tundra', '#e8f0f8'], ['swamp', '#3f5a2a'], ['volcanic', '#4a4446'], ['mountain', '#7a7a86'], ['mushroom', '#5a8a5a'], ['beach', '#e8d8a0'], ['graveyard', '#2a3a2a']]; for (const [b, c] of bio) { rect(ctx, lx, yy, 6, 6, c); text(ctx, BIOME_NAMES[b], lx + 10, yy, '#d8d8e0', 5); yy += 8; } }
  const legendY = y + h - 40; text(ctx, 'Legend:', lx, legendY, '#a8a8b8', 5); rect(ctx, lx, legendY + 9, 3, 3, '#d43a3a'); text(ctx, 'You', lx + 8, legendY + 8, '#d8d8e0', 5); rect(ctx, lx, legendY + 17, 3, 3, '#f5d33a'); text(ctx, 'Discovered place', lx + 8, legendY + 16, '#d8d8e0', 5); rect(ctx, lx, legendY + 25, 3, 3, 'rgba(255,255,255,0.4)'); text(ctx, 'Unknown place', lx + 8, legendY + 24, '#d8d8e0', 5);
}
// ================= STATS =================
function drawStats(ctx, x, y, w, h) {
  const p = G.player; text(ctx, `LEVEL ${p.level}   XP ${p.xp}/${XP_NEED(p.level)}   Stat points: ${p.statPoints}`, x + 4, y, '#f5d33a', 7);
  const st = [['str', 'Strength', '+2% damage'], ['vit', 'Vitality', '+8 max HP'], ['int', 'Intellect', '+10 mana, +0.2 regen'], ['agi', 'Agility', '+1% speed, +0.5% crit'], ['luck', 'Luck', '+1% luck (drops, taming)']];
  st.forEach(([k, name, desc], i) => { const ry = y + 16 + i * 22; panel(ctx, x, ry, 230, 20, 'dark'); text(ctx, `${name}  ${p.alloc[k]}`, x + 6, ry + 3, '#fff8c0', 6); text(ctx, desc, x + 6, ry + 11, '#a8a8b8', 5); if (btn(ctx, x + 200, ry + 2, 26, 16, '+', p.statPoints > 0 ? 'green' : 'dark', 8, p.statPoints <= 0)) { p.alloc[k]++; p.statPoints--; p.recalc(); } });
  if (btn(ctx, x, y + 128, 110, 14, 'RESET (100c)', 'stone', 5, p.coins < 100)) { p.coins -= 100; let total = 0; for (const k in p.alloc) { total += p.alloc[k]; p.alloc[k] = 0; } p.statPoints += total; p.recalc(); }
  const s = p.stats; let yy = y + 150; text(ctx, 'DERIVED', x + 4, yy, '#f5d33a', 6); yy += 9;
  [`Max HP ${p.maxHp}   Max Mana ${p.maxMana}`, `Damage x${(1 + s.dmg).toFixed(2)}   Defense ${Math.round(s.def)}`, `Crit ${Math.round(s.crit * 100)}%   Speed ${Math.round(p.speed)}`, `Luck ${Math.round(s.luck * 100)}%   Lifesteal ${Math.round(s.lifesteal * 100)}%`, `Regen ${s.regen.toFixed(1)}/s   Mana regen ${s.manaRegen.toFixed(1)}/s`, `Pet dmg +${Math.round(s.petDmg * 100)}%  Pet HP +${Math.round(s.petHp * 100)}%`, `XP +${Math.round(s.xp * 100)}%   Coins +${Math.round(s.coinBonus * 100)}%   CDR ${Math.round((s.cdr || 0) * 100)}%`].forEach(l => { text(ctx, l, x + 4, yy, '#d8d8e0', 5); yy += 8; });
  // records
  const rx = x + 250; text(ctx, 'RECORDS', rx, y, '#f5d33a', 7); const R = G.stats; let ry = y + 12;
  [`Kills: ${R.kills}`, `Bosses slain: ${R.bossKills}`, `Chests opened: ${R.chests}`, `Creatures tamed: ${Object.keys(p.tamedIds).length} / ${PET_LIST.length}`, `Wands crafted: ${Object.keys(p.craftedWands).length} / ${WAND_LIST.length}`, `Items crafted: ${R.crafted}`, `Wood chopped: ${R.wood}   Stone mined: ${R.stone}`, `Distance: ${Math.round(R.distance)} tiles`, `Deaths: ${R.deaths}`, `Days survived: ${G.day}`, `Play time: ${Math.floor(R.playTime / 60)}m`, `Locations found: ${Object.keys(G.discovered).length} / ${G.world.pois.length}`].forEach(l => { text(ctx, l, rx, ry, '#d8d8e0', 5); ry += 8; });
  ry += 6; text(ctx, 'ACHIEVEMENTS', rx, ry, '#f5d33a', 7); ry += 11;
  const got = Object.keys(G.achievements).length; text(ctx, `${got}/${ACHIEVEMENTS.length} unlocked`, rx, ry, '#a8a8b8', 5); ry += 9;
  let col = 0; for (const a of ACHIEVEMENTS) { const un = G.achievements[a.id]; const ax = rx + col * 150; rect(ctx, ax, ry, 6, 6, un ? '#f5d33a' : '#2b2b3a'); text(ctx, a.name, ax + 9, ry, un ? '#fff8c0' : '#6b6b7b', 5); if (hit(ax, ry, 140, 7)) S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: [[a.name, '#f5d33a'], [a.desc, '#d8d8e0']] }; col++; if (col === 2) { col = 0; ry += 8; } if (ry > y + h - 8) break; }
}
export const ACHIEVEMENTS = [
  { id: 'first_kill', name: 'First Blood', desc: 'Defeat an enemy', check: () => G.stats.kills >= 1 }, { id: 'kills_100', name: 'Monster Hunter', desc: 'Defeat 100 enemies', check: () => G.stats.kills >= 100 }, { id: 'kills_1000', name: 'Legend', desc: 'Defeat 1000 enemies', check: () => G.stats.kills >= 1000 },
  { id: 'lvl10', name: 'Apprentice', desc: 'Reach level 10', check: () => G.player.level >= 10 }, { id: 'lvl25', name: 'Archmage', desc: 'Reach level 25', check: () => G.player.level >= 25 }, { id: 'lvl50', name: 'Lumis Incarnate', desc: 'Reach level 50', check: () => G.player.level >= 50 },
  { id: 'tame1', name: 'Best Friend', desc: 'Tame a creature', check: () => Object.keys(G.player.tamedIds).length >= 1 }, { id: 'tame25', name: 'Zookeeper', desc: 'Tame 25 species', check: () => Object.keys(G.player.tamedIds).length >= 25 }, { id: 'tame75', name: 'Beastmaster', desc: 'Tame 75 species', check: () => Object.keys(G.player.tamedIds).length >= 75 }, { id: 'tameall', name: 'Gotta Tame Them All', desc: 'Tame every species', check: () => Object.keys(G.player.tamedIds).length >= PET_LIST.length },
  { id: 'wand10', name: 'Collector', desc: 'Craft 10 wands', check: () => Object.keys(G.player.craftedWands).length >= 10 }, { id: 'wandall', name: 'Wandmaker', desc: 'Craft every wand', check: () => Object.keys(G.player.craftedWands).length >= WAND_LIST.length }, { id: 'mythic', name: 'Mythic', desc: 'Craft a mythic wand', check: () => Object.keys(G.player.craftedWands).some(id => WANDS[id].rarity === 'mythic') }, { id: 'secret', name: 'Secret Keeper', desc: 'Craft a secret wand', check: () => Object.keys(G.player.craftedWands).some(id => WANDS[id].rarity === 'secret') },
  { id: 'boss1', name: 'Slayer', desc: 'Defeat a boss', check: () => G.stats.bossKills >= 1 }, { id: 'bossall', name: 'Worldsaver', desc: 'Defeat all 10 bosses', check: () => ENEMY_LIST.filter(e => e.boss).every(e => G.flags['boss_' + e.id]) },
  { id: 'poi20', name: 'Explorer', desc: 'Discover 20 locations', check: () => Object.keys(G.discovered).length >= 20 }, { id: 'poiall', name: 'Cartographer', desc: 'Discover every location', check: () => Object.keys(G.discovered).length >= G.world.pois.length },
  { id: 'chest50', name: 'Treasure Hunter', desc: 'Open 50 chests', check: () => G.stats.chests >= 50 }, { id: 'fly', name: 'Sky Rider', desc: 'Ride a flying pet over water', check: () => G.flags.rodeOverWater }, { id: 'day10', name: 'Survivor', desc: 'Survive 10 days', check: () => G.day >= 10 }, { id: 'rich', name: 'Dragon Hoard', desc: 'Hold 5000 coins', check: () => G.player.coins >= 5000 }, { id: 'armorset', name: 'Fully Dressed', desc: 'Wear a full armor set', check: () => !!G.player.setBonus }, { id: 'light', name: 'The Light Returns', desc: 'Relight the Lumis Beacon', check: () => G.flags.beaconLit }, { id: 'fish', name: 'Angler', desc: 'Catch 25 fish', check: () => (G.stats.fish || 0) >= 25 }, { id: 'ultimate', name: 'Unleashed', desc: 'Use a V ability', check: () => G.flags.usedV },
];
// ================= BESTIARY =================
function drawBestiary(ctx, x, y, w, h) {
  const p = G.player;
  if (btn(ctx, x, y - 2, 60, 13, 'PETS', S.bestTab === 'pets' ? 'gold' : 'dark', 5)) S.bestTab = 'pets'; if (btn(ctx, x + 64, y - 2, 60, 13, 'ENEMIES', S.bestTab === 'enemies' ? 'gold' : 'dark', 5)) S.bestTab = 'enemies';
  if (S.bestTab === 'pets') {
    text(ctx, `${Object.keys(p.tamedIds).length}/${PET_LIST.length} tamed.  Hover for hints.`, x + 140, y, '#a8a8b8', 5);
    const cols = 26, size = 20; const gy = y + 14; const rows = Math.ceil(PET_LIST.length / cols); const visRows = Math.floor((h - 20) / size); if (hit(x, gy, w, h - 14)) S.bestScroll = Math.max(0, Math.min(Math.max(0, rows - visRows), S.bestScroll + Input.mouse.wheel));
    PET_LIST.forEach((pd, i) => { const r = Math.floor(i / cols) - S.bestScroll; if (r < 0 || r >= visRows) return; const cx = x + (i % cols) * size + 4, cy = gy + r * size; const tamed = p.tamedIds[pd.id]; rect(ctx, cx, cy, size - 2, size - 2, tamed ? 'rgba(60,138,46,0.3)' : 'rgba(0,0,0,0.35)'); frame(ctx, cx, cy, size - 2, size - 2, RARITY_COLORS[pd.rarity] + '66'); const spr = petSprite(pd.id); ctx.drawImage(tamed ? spr : silhouette(spr, '#2b2b3a'), cx + 3, cy + 3, 12, 12); if (hit(cx, cy, size, size)) { const where = pd.where.map(wh => wh.startsWith('poi:') ? (G.world.pois.find(q => q.id === wh.slice(4)) || { name: wh }).name : wh.startsWith('egg:') ? `${wh.slice(4)} egg` : BIOME_NAMES[wh] || wh).join(', '); S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: [[tamed ? pd.name : '???  (' + pd.rarity + ')', RARITY_COLORS[pd.rarity]], [`Found: ${where}`, '#d8d8e0'], [`Likes: ${foodName(pd.food)}`, '#f07ad0'], [tamed ? `Buff: ${Object.keys(pd.buff).map(k => '+' + fmtStat(k, pd.buff[k])).join(', ')}` : 'Tame it to learn more.', '#8fe04a'], [`${PET_ABILITY_DESC[pd.abil]}${pd.ride ? ' | Rideable' : ''}${pd.fly ? ' | Flies' : ''}${pd.swim ? ' | Swims' : ''}`, '#5ad8f0']] }; } });
  } else {
    text(ctx, `${Object.keys(G.flags).filter(k => k.startsWith('seen_')).length}/${ENEMY_LIST.length} encountered`, x + 140, y, '#a8a8b8', 5);
    const cols = 13, size = 38; const gy = y + 14; const rows = Math.ceil(ENEMY_LIST.length / cols); const visRows = Math.floor((h - 20) / size); if (hit(x, gy, w, h - 14)) S.bestScroll = Math.max(0, Math.min(Math.max(0, rows - visRows), S.bestScroll + Input.mouse.wheel));
    ENEMY_LIST.forEach((e, i) => { const r = Math.floor(i / cols) - S.bestScroll; if (r < 0 || r >= visRows) return; const cx = x + (i % cols) * size + 4, cy = gy + r * size; const seen = G.flags['seen_' + e.id]; rect(ctx, cx, cy, size - 2, size - 2, e.boss ? 'rgba(138,28,28,0.3)' : 'rgba(0,0,0,0.35)'); const spr = enemySprite(e.id); const sz = e.boss ? 28 : 20; ctx.drawImage(seen ? spr : silhouette(spr, '#2b2b3a'), cx + (size - 2 - sz) / 2, cy + 2, sz, sz); text(ctx, seen ? e.name.slice(0, 9) : '???', cx + size / 2 - 1, cy + size - 10, seen ? '#d8d8e0' : '#6b6b7b', 4, 'center'); if (hit(cx, cy, size, size)) S.tip = { x: Input.mouse.x, y: Input.mouse.y, lines: seen ? [[e.name, e.boss ? '#d43a3a' : '#fff8c0'], [`HP ${e.hp}  DMG ${e.dmg}  ${e.element}  Lv${e.lvl}`, '#d8d8e0'], [`Drops: ${e.drops.map(d => itemName(d[0])).slice(0, 4).join(', ')}`, '#8fe04a'], [`Where: ${e.biomes.map(b => b.startsWith('poi:') ? (G.world.pois.find(q => q.id === b.slice(4)) || { name: b }).name : BIOME_NAMES[b] || b).slice(0, 3).join(', ') || (e.poi ? G.world.pois.find(q => q.id === e.poi).name : '?')}`, '#a8a8b8']] : [['Unknown creature', '#6b6b7b']] }; });
  }
}
// ================= SETTINGS =================
function drawSettings(ctx, x, y, w, h) {
  text(ctx, 'OPTIONS', x + 4, y, '#f5d33a', 7);
  const st = G.settings; let yy = y + 16;
  text(ctx, `Sound volume: ${Math.round(st.volume * 100)}%`, x + 4, yy, '#d8d8e0', 6); if (btn(ctx, x + 160, yy - 2, 20, 12, '-', 'stone', 6)) { st.volume = Math.max(0, +(st.volume - 0.1).toFixed(1)); Audio.setVolume(st.volume); } if (btn(ctx, x + 184, yy - 2, 20, 12, '+', 'stone', 6)) { st.volume = Math.min(1, +(st.volume + 0.1).toFixed(1)); Audio.setVolume(st.volume); } yy += 16;
  text(ctx, `Music volume: ${Math.round(st.music * 100)}%`, x + 4, yy, '#d8d8e0', 6); if (btn(ctx, x + 160, yy - 2, 20, 12, '-', 'stone', 6)) { st.music = Math.max(0, +(st.music - 0.1).toFixed(1)); Audio.setMusicVol(st.music); } if (btn(ctx, x + 184, yy - 2, 20, 12, '+', 'stone', 6)) { st.music = Math.min(1, +(st.music + 0.1).toFixed(1)); Audio.setMusicVol(st.music); } yy += 16;
  if (btn(ctx, x + 4, yy, 120, 14, `Music: ${Audio.musicOn ? 'ON' : 'OFF'}`, 'stone', 5)) Audio.musicOn = !Audio.musicOn; yy += 18;
  if (btn(ctx, x + 4, yy, 120, 14, `Screen shake: ${st.shake ? 'ON' : 'OFF'}`, 'stone', 5)) st.shake = !st.shake; yy += 18;
  if (btn(ctx, x + 4, yy, 120, 14, `Damage numbers: ${st.floats ? 'ON' : 'OFF'}`, 'stone', 5)) st.floats = !st.floats; yy += 24;
  text(ctx, 'SAVE DATA (stored as JSON in this browser)', x + 4, yy, '#f5d33a', 6); yy += 12;
  if (btn(ctx, x + 4, yy, 100, 16, 'SAVE NOW', 'green', 6)) save(true); if (btn(ctx, x + 108, yy, 120, 16, 'EXPORT .JSON', 'blue', 6)) exportJson(); if (btn(ctx, x + 232, yy, 120, 16, 'IMPORT .JSON', 'blue', 6)) importJson(data => { G.notify('Save imported. Reloading...', '#8fe04a'); setTimeout(() => location.reload(), 600); }); yy += 20;
  text(ctx, `Last saved: ${G.lastSave ? Math.round((Date.now() - G.lastSave) / 1000) + 's ago' : 'never'}  (autosaves every 30s)`, x + 4, yy, '#a8a8b8', 5); yy += 16;
  if (!S.confirmReset) { if (btn(ctx, x + 4, yy, 120, 16, 'NEW GAME', 'red', 6)) S.confirmReset = true; } else { text(ctx, 'Delete your save and start over?', x + 4, yy + 4, '#d43a3a', 6); if (btn(ctx, x + 200, yy, 60, 16, 'YES', 'red', 6)) { clearSave(); location.reload(); } if (btn(ctx, x + 264, yy, 60, 16, 'NO', 'stone', 6)) S.confirmReset = false; }
  // controls
  const cx = x + 300; let cy = y + 16; text(ctx, 'CONTROLS', cx, y, '#f5d33a', 7);
  [['WASD / Arrows', 'Move'], ['Mouse', 'Aim'], ['Left click (hold)', 'Fire wand'], ['E / Q / C', 'Wand abilities'], ['V', 'SECRET ability (rare wands)'], ['Space', 'Dodge roll'], ['F', 'Interact / harvest / tame / fish'], ['R', 'Ride / dismount pet'], ['1-5', 'Quick-use items'], ['I / Tab', 'Inventory'], ['K', 'Crafting'], ['P', 'Pets'], ['J', 'Quests'], ['M', 'Map'], ['T', 'Stats'], ['B', 'Bestiary'], ['O', 'Options'], ['Esc', 'Close menu']].forEach(([k, v]) => { text(ctx, k, cx, cy, '#fff8c0', 5); text(ctx, v, cx + 100, cy, '#d8d8e0', 5); cy += 8; });
}
