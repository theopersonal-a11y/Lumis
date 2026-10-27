import { G } from '../state.js';
import { QUESTS, QUEST_LIST } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { PETS } from '../data/pets.js';
import { ARMOR } from '../data/armor.js';
import { WANDS } from '../data/wands.js';
import { ENEMIES } from '../data/enemies.js';
import { Audio } from '../engine/audio.js';
import { RARITY_COLORS } from '../engine/draw.js';
// questState[id] = { status: 'active'|'done', prog: [n per objective] }
export const Quests = {
  state() { return G.questState; },
  available(npcId) { return QUEST_LIST.filter(q => q.giver === npcId && !G.questState[q.id] && (!q.requires || (G.questState[q.requires] && G.questState[q.requires].status === 'done'))); },
  activeFor(npcId) { return QUEST_LIST.filter(q => q.giver === npcId && G.questState[q.id] && G.questState[q.id].status === 'active'); },
  active() { return QUEST_LIST.filter(q => G.questState[q.id] && G.questState[q.id].status === 'active'); },
  accept(id) { const q = QUESTS[id]; G.questState[id] = { status: 'active', prog: q.objectives.map(() => 0) }; Audio.play('quest'); G.notify('Quest accepted: ' + q.name, '#f5d33a'); this.refresh(); },
  progress(q, i) { const st = G.questState[q.id]; const o = q.objectives[i]; const p = G.player;
    switch (o.type) {
      case 'kill': return Math.min(o.n, st.prog[i]);
      case 'gather': return Math.min(o.n, p.countItem(o.item));
      case 'visit': return G.discovered[o.poi] ? 1 : 0;
      case 'talk': return st.prog[i];
      case 'craft': return (Array.isArray(o.id) ? o.id.some(x => p.craftedWands[x] || p.craftedArmor[x]) : (p.craftedWands[o.id] || p.craftedArmor[o.id])) ? 1 : 0;
      case 'level': return p.level >= o.n ? 1 : 0;
      case 'boss': return G.flags['boss_' + o.id] ? 1 : 0;
      case 'harvest': return Math.min(o.n, st.prog[i]);
      case 'tame': if (o.pet) return p.tamedIds[o.pet] ? 1 : 0; if (o.fly) return Object.keys(p.tamedIds).some(id => PETS[id] && PETS[id].fly) ? 1 : 0; if (o.species) return Math.min(o.n || 1, Object.keys(p.tamedIds).filter(id => PETS[id] && PETS[id].species === o.species).length); return Math.min(o.n, Object.keys(p.tamedIds).length);
      case 'ride': return G.flags.rodeOverWater ? 1 : 0;
      case 'discover': return Math.min(o.n, Object.keys(G.discovered).length);
      case 'chests': return Math.min(o.n, G.stats.chests);
      case 'armorset': return p.setBonus ? 1 : 0;
      case 'wands': return Math.min(o.n, Object.keys(p.craftedWands).length);
      case 'beacon': return G.flags.beaconLit ? 1 : 0;
    } return 0; },
  goal(o) { return o.n || 1; },
  objText(q, i) { const o = q.objectives[i]; const pr = this.progress(q, i); const g = this.goal(o); const name = { kill: () => `Defeat ${ENEMIES[o.target] ? ENEMIES[o.target].name : o.target}`, gather: () => `Collect ${ITEMS[o.item] ? ITEMS[o.item].name : o.item}`, visit: () => `Visit ${o.poi.replace(/_/g, ' ')}`, talk: () => `Talk to ${o.npc}`, craft: () => `Craft ${Array.isArray(o.id) ? 'an elemental wand' : (WANDS[o.id] || ARMOR[o.id] || { name: o.id }).name}`, level: () => `Reach level ${o.n}`, boss: () => `Slay ${ENEMIES[o.id].name}`, harvest: () => `Gather ${o.what}`, tame: () => o.pet ? `Tame ${PETS[o.pet].name}` : o.fly ? 'Tame a flying pet' : o.species ? `Tame ${o.species}s` : 'Tame creatures', ride: () => 'Ride a pet over water', discover: () => 'Discover locations', chests: () => 'Open chests', armorset: () => 'Wear a full armor set', wands: () => 'Craft different wands', beacon: () => 'Light the Beacon' }[o.type](); return `${name} (${pr}/${g})`; },
  isComplete(q) { return q.objectives.every((o, i) => this.progress(q, i) >= this.goal(o)); },
  turnIn(id) {
    const q = QUESTS[id]; const p = G.player; if (!this.isComplete(q)) return false;
    for (const o of q.objectives) if (o.type === 'gather') p.removeItem(o.item, o.n);
    G.questState[id].status = 'done';
    if (q.rewards.coins) p.coins += q.rewards.coins; if (q.rewards.xp) p.gainXp(q.rewards.xp);
    for (const [it, n] of q.rewards.items || []) p.addItem(it, n);
    Audio.play('quest'); G.notify(`Quest complete: ${q.name}! +${q.rewards.coins || 0} coins, +${q.rewards.xp || 0} XP`, '#f5d33a', 5);
    if (q.main && id === 'm8') G.onVictory();
    this.refresh(); return true;
  },
  onKill(e) { for (const q of this.active()) q.objectives.forEach((o, i) => { if (o.type === 'kill' && o.target === e.id) G.questState[q.id].prog[i]++; }); },
  onHarvest(type) { for (const q of this.active()) q.objectives.forEach((o, i) => { if (o.type === 'harvest' && o.what === type) G.questState[q.id].prog[i]++; }); },
  onTalk(npcId) { for (const q of this.active()) q.objectives.forEach((o, i) => { if (o.type === 'talk' && o.npc === npcId) G.questState[q.id].prog[i] = 1; }); },
  refresh() { for (const q of this.active()) { if (this.isComplete(q) && !G.questState[q.id].notified) { G.questState[q.id].notified = true; G.notify(`Quest ready to turn in: ${q.name} (see ${q.giver})`, '#8fe04a', 4); } } },
  marker(npcId) { if (this.activeFor(npcId).some(q => this.isComplete(q))) return '?'; if (this.available(npcId).length) return '!'; return null; },
};
