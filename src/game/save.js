import { G } from '../state.js';
const KEY = 'lumis_save_v1';
export const SAVE_VERSION = 1;
export function serialize() {
  const p = G.player;
  return {
    v: SAVE_VERSION, seed: G.seed, savedAt: Date.now(), time: G.time, day: G.day,
    player: { x: p.x, y: p.y, level: p.level, xp: p.xp, statPoints: p.statPoints, alloc: p.alloc, inventory: p.inventory, coins: p.coins, equip: p.equip, wands: p.wands, pets: p.pets, activePets: p.activePets, petUid: p.petUid, hp: p.hp, mana: p.mana, respawn: p.respawn, craftedWands: p.craftedWands, craftedArmor: p.craftedArmor, tamedIds: p.tamedIds, reviveUsedDay: p.reviveUsedDay },
    quickSlots: G.quickSlots, stats: G.stats, flags: G.flags, discovered: G.discovered, questState: G.questState, achievements: G.achievements,
    world: { changes: G.world.changes, chests: G.world.chestsOpened, bossKilled: G.bossKilled, tamedSpawns: G.tamedSpawns },
    settings: G.settings,
  };
}
export function save(manual = false) {
  try { const data = serialize(); localStorage.setItem(KEY, JSON.stringify(data)); G.lastSave = Date.now(); if (manual) G.notify('Game saved.', '#8fe04a'); return true; }
  catch (e) { console.error(e); G.notify('Save failed: ' + e.message, '#d43a3a'); return false; }
}
export function load() { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
export function hasSave() { try { return !!localStorage.getItem(KEY); } catch (e) { return false; } }
export function clearSave() { try { localStorage.removeItem(KEY); } catch (e) {} }
export function exportJson() {
  const data = serialize(); const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `lumis-save-day${G.day}-lvl${G.player.level}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 100);
  G.notify('Save exported as JSON file.', '#8fe04a');
}
export function importJson(cb) {
  const input = document.getElementById('importFile'); input.value = '';
  input.onchange = () => { const f = input.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { try { const data = JSON.parse(r.result); if (!data || !data.player || !data.world) throw new Error('Not a Lumis save'); localStorage.setItem(KEY, JSON.stringify(data)); cb(data); } catch (e) { G.notify('Import failed: ' + e.message, '#d43a3a'); } }; r.readAsText(f); };
  input.click();
}
