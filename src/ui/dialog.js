import { G } from '../state.js';
import { text, textW, panel, rect, button, RARITY_COLORS, wrap } from '../engine/draw.js';
import { Input } from '../engine/input.js';
import { Audio } from '../engine/audio.js';
import { ITEMS, itemIcon } from '../data/items.js';
import { ARMOR, armorIcon } from '../data/armor.js';
import { WANDS } from '../data/wands.js';
import { npcSprite } from '../data/npcs.js';
import { QUESTS } from '../data/quests.js';
import { Quests } from '../game/questsys.js';
import { tooltip } from './hud.js';
let clickUsed = false;
function hit(x, y, w, h) { const m = Input.mouse; return m.x >= x && m.x < x + w && m.y >= y && m.y < y + h; }
function btn(ctx, x, y, w, h, label, style = 'wood', size = 6, disabled = false) { const hv = hit(x, y, w, h); button(ctx, x, y, w, h, label, hv && !disabled, style, size, disabled); if (hv && Input.mouse.pressed && !clickUsed && !disabled) { clickUsed = true; Audio.play('ui'); return true; } return false; }
export function openDialog(npc) {
  G.dialog = npc; G.dialogFrame = G.frame; G.player.face = npc.x > G.player.x ? 1 : -1; npc.face = -G.player.face; Audio.play('open');
  Quests.onTalk(npc.id); Quests.refresh();
  const done = Quests.activeFor(npc.id).filter(q => Quests.isComplete(q)); const avail = Quests.available(npc.id); const act = Quests.activeFor(npc.id);
  if (done.length) G.dialogState = { mode: 'turnin', quest: done[0] };
  else if (avail.length) G.dialogState = { mode: 'offer', quest: avail[0] };
  else if (act.length) G.dialogState = { mode: 'talk', line: `${act[0].name}: ${Quests.objText(act[0], 0)}`, reminder: true };
  else G.dialogState = { mode: 'talk', line: npc.def.lines[Math.floor(Math.random() * npc.def.lines.length)] };
  G.dialogState.shopTab = 'buy'; G.dialogState.scroll = 0;
}
export function closeDialog() { G.dialog = null; G.dialogState = null; Audio.play('close'); }
export function drawDialog(ctx) {
  const npc = G.dialog; if (!npc) return; clickUsed = false; G.uiHover = true; const st = G.dialogState; const p = G.player;
  if (Input.hit('Escape') || (Input.hit('f') && st.mode !== 'shop' && G.frame !== G.dialogFrame)) { closeDialog(); return; }
  const W = G.W, H = G.H; let tip = null;
  if (st.mode === 'shop') {
    const X = 60, Y = 30, PW = 520, PH = 300; rect(ctx, 0, 0, W, H, 'rgba(0,0,0,0.5)'); panel(ctx, X, Y, PW, PH, 'wood');
    ctx.drawImage(npcSprite(npc.id), X + 10, Y + 8, 24, 26); text(ctx, `${npc.def.name}'s Shop`, X + 40, Y + 10, '#f5d33a', 8); text(ctx, `Your coins: ${p.coins}`, X + 40, Y + 22, '#c9a227', 6);
    if (btn(ctx, X + PW - 170, Y + 8, 50, 14, 'BUY', st.shopTab === 'buy' ? 'gold' : 'dark', 6)) { st.shopTab = 'buy'; st.scroll = 0; } if (btn(ctx, X + PW - 116, Y + 8, 50, 14, 'SELL', st.shopTab === 'sell' ? 'gold' : 'dark', 6)) { st.shopTab = 'sell'; st.scroll = 0; } if (btn(ctx, X + PW - 60, Y + 8, 50, 14, 'CLOSE', 'red', 6)) { closeDialog(); return; }
    const ly = Y + 40, lh = PH - 50; const rowH = 20; const vis = Math.floor(lh / rowH);
    if (st.shopTab === 'buy') {
      const items = npc.def.shop || []; if (hit(X, ly, PW, lh)) st.scroll = Math.max(0, Math.min(Math.max(0, items.length - vis), st.scroll + Input.mouse.wheel)); Input.mouse.wheel = 0;
      text(ctx, 'Click an item to buy one. Shift-click buys 5.', X + 10, Y + 31, '#a8a8b8', 5);
      for (let i = 0; i < vis; i++) { const id = items[i + st.scroll]; if (!id) break; const d = ITEMS[id] || ARMOR[id]; if (!d) continue; const ry = ly + i * rowH; const price = Math.max(1, Math.round(d.value * 2.5)); const can = p.coins >= price; const hv = hit(X + 8, ry, PW - 16, rowH - 1); rect(ctx, X + 8, ry, PW - 16, rowH - 1, hv ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)'); const ic = ARMOR[id] ? armorIcon(id) : itemIcon(id); if (ic) ctx.drawImage(ic, X + 12, ry + 3, 12, 12); text(ctx, d.name, X + 30, ry + 3, RARITY_COLORS[d.rarity], 6); text(ctx, (d.desc || '').slice(0, 60), X + 30, ry + 11, '#a8a8b8', 5); text(ctx, `${price}c`, X + PW - 14, ry + 6, can ? '#f5d33a' : '#d43a3a', 6, 'right'); text(ctx, `have ${p.countItem(id)}`, X + PW - 60, ry + 7, '#6b6b7b', 5, 'right'); if (hv && Input.mouse.pressed && !clickUsed) { clickUsed = true; const n = Input.key('Shift') ? 5 : 1; let bought = 0; for (let k = 0; k < n; k++) { if (p.coins >= price && p.addItem(id, 1, true)) { p.coins -= price; bought++; } else break; } if (bought) { Audio.play('coin'); G.notify(`Bought ${bought}x ${d.name}.`, '#8fe04a'); } else Audio.play('fail'); } }
    } else {
      const inv = p.inventory.filter(s => (ITEMS[s.id] || ARMOR[s.id])); if (hit(X, ly, PW, lh)) st.scroll = Math.max(0, Math.min(Math.max(0, inv.length - vis), st.scroll + Input.mouse.wheel)); Input.mouse.wheel = 0;
      text(ctx, 'Click to sell one. Shift-click sells the whole stack.', X + 10, Y + 31, '#a8a8b8', 5);
      if (!inv.length) text(ctx, 'Nothing to sell.', X + 20, ly + 10, '#6b6b7b', 6);
      for (let i = 0; i < vis; i++) { const s = inv[i + st.scroll]; if (!s) break; const d = ITEMS[s.id] || ARMOR[s.id]; const ry = ly + i * rowH; const price = Math.max(1, Math.round(d.value * 0.6)); const hv = hit(X + 8, ry, PW - 16, rowH - 1); rect(ctx, X + 8, ry, PW - 16, rowH - 1, hv ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)'); const ic = ARMOR[s.id] ? armorIcon(s.id) : itemIcon(s.id); if (ic) ctx.drawImage(ic, X + 12, ry + 3, 12, 12); text(ctx, `${d.name} x${s.n}`, X + 30, ry + 3, RARITY_COLORS[d.rarity], 6); text(ctx, (d.desc || '').slice(0, 60), X + 30, ry + 11, '#a8a8b8', 5); text(ctx, `+${price}c`, X + PW - 14, ry + 6, '#8fe04a', 6, 'right'); if (hv && Input.mouse.pressed && !clickUsed) { clickUsed = true; const n = Input.key('Shift') ? s.n : 1; p.removeItem(s.id, n); p.coins += price * n; Audio.play('coin'); G.notify(`Sold ${n}x ${d.name} for ${price * n}c.`, '#f5d33a'); } }
    }
    return;
  }
  // talk box
  const X = 70, Y = H - 96, PW = 500, PH = 86; panel(ctx, X, Y, PW, PH, 'wood');
  ctx.drawImage(npcSprite(npc.id), X + 10, Y + 10, 36, 40);
  text(ctx, npc.def.name, X + 54, Y + 8, '#f5d33a', 8); text(ctx, npc.def.title, X + 54 + textW(ctx, npc.def.name, 8) + 8, Y + 10, '#a8a8b8', 5);
  if (st.mode === 'talk') { const lines = wrap(ctx, st.line, PW - 70, 6); lines.forEach((l, i) => text(ctx, l, X + 54, Y + 22 + i * 9, '#f4f4f8', 6)); let bx = X + 54; if (npc.def.shop) { if (btn(ctx, bx, Y + PH - 22, 70, 16, 'SHOP', 'gold', 6)) { st.mode = 'shop'; } bx += 76; } const act = Quests.activeFor(npc.id); if (act.length && !st.reminder) { if (btn(ctx, bx, Y + PH - 22, 90, 16, 'QUEST?', 'stone', 6)) { st.mode = 'talk'; st.line = `${act[0].name}: ${Quests.objText(act[0], 0)}`; st.reminder = true; } bx += 96; } if (btn(ctx, bx, Y + PH - 22, 60, 16, 'BYE [F]', 'dark', 6)) closeDialog(); }
  else if (st.mode === 'offer') { const q = st.quest; text(ctx, (q.main ? '[MAIN] ' : '') + q.name, X + 54, Y + 20, q.main ? '#f5d33a' : '#fff8c0', 7); const lines = wrap(ctx, q.desc, PW - 70, 5); lines.slice(0, 3).forEach((l, i) => text(ctx, l, X + 54, Y + 31 + i * 7, '#d8d8e0', 5)); text(ctx, `Reward: ${q.rewards.coins || 0}c, ${q.rewards.xp || 0} XP${(q.rewards.items || []).length ? ', ' + q.rewards.items.map(([id, n]) => n + 'x ' + ((ITEMS[id] || ARMOR[id] || WANDS[id] || { name: id }).name)).join(', ') : ''}`, X + 54, Y + 54, '#c9a227', 5); if (btn(ctx, X + 54, Y + PH - 22, 80, 16, 'ACCEPT', 'green', 6)) { Quests.accept(q.id); const more = Quests.available(npc.id); if (more.length) st.quest = more[0]; else { st.mode = 'talk'; st.line = npc.def.lines[0]; } } if (btn(ctx, X + 140, Y + PH - 22, 80, 16, 'LATER', 'dark', 6)) { st.mode = 'talk'; st.line = npc.def.lines[Math.floor(Math.random() * npc.def.lines.length)]; } }
  else if (st.mode === 'turnin') { const q = st.quest; text(ctx, `Quest complete: ${q.name}!`, X + 54, Y + 22, '#8fe04a', 7); text(ctx, `Reward: ${q.rewards.coins || 0} coins, ${q.rewards.xp || 0} XP`, X + 54, Y + 34, '#c9a227', 6); text(ctx, (q.rewards.items || []).map(([id, n]) => n + 'x ' + ((ITEMS[id] || ARMOR[id] || WANDS[id] || { name: id }).name)).join(', '), X + 54, Y + 44, '#d8d8e0', 5); if (btn(ctx, X + 54, Y + PH - 22, 100, 16, 'TURN IN', 'gold', 6)) { Quests.turnIn(q.id); const done = Quests.activeFor(npc.id).filter(z => Quests.isComplete(z)); const avail = Quests.available(npc.id); if (done.length) st.quest = done[0]; else if (avail.length) { st.mode = 'offer'; st.quest = avail[0]; } else { st.mode = 'talk'; st.line = 'Thank you, wizard!'; } } }
}
