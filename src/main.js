import { G } from './state.js';
import { Input } from './engine/input.js';
import { Audio } from './engine/audio.js';
import { text, textW, panel, rect, button, RARITY_COLORS, ELEMENT_COLORS, wrap } from './engine/draw.js';
import { makeSprite, flipSprite, PAL } from './engine/sprites.js';
import { hash2, mulberry32 } from './engine/rng.js';
import { World, BIOME_NAMES } from './world/world.js';
import { T, TILE_DEFS, OBJ, objSprite, tileSprite, isLiquidTile } from './data/tiles.js';
import { ITEMS, itemIcon } from './data/items.js';
import { WANDS, WAND_LIST } from './data/wands.js';
import { ARMOR, ARMOR_LIST } from './data/armor.js';
import { PETS, PET_LIST } from './data/pets.js';
import { ENEMIES } from './data/enemies.js';
import { Player } from './game/player.js';
import { Enemy, Drop, updateEntities, drawEffects, drawProjectiles, drawParticles, drawDrops, drawAlly, spawnParticles, spawnEffect } from './game/entities.js';
import { Spawner } from './game/spawner.js';
import { Quests } from './game/questsys.js';
import { save, load, hasSave, clearSave, importJson } from './game/save.js';
import { drawHUD } from './ui/hud.js';
import { drawMenu, updateMenuInput, openMenu, closeMenu, ACHIEVEMENTS } from './ui/menus.js';
import { openDialog, closeDialog, drawDialog } from './ui/dialog.js';

const canvas = document.getElementById('game'); const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = false;
G.canvas = canvas; G.ctx = ctx; G.settings = { volume: 0.5, music: 0.35, shake: true, floats: true }; G.quickSlots = [null, null, null, null, null];
const lightCanvas = document.createElement('canvas'); lightCanvas.width = G.W; lightCanvas.height = G.H; const lctx = lightCanvas.getContext('2d');
let weatherParts = []; let discoverT = 0; let achT = 0; let last = performance.now(); let titleParts = [];
function resize() { const s = Math.min(window.innerWidth / G.W, window.innerHeight / G.H); const sc = s >= 1 ? Math.max(1, Math.floor(s * 2) / 2) : s; canvas.style.width = Math.floor(G.W * sc) + 'px'; canvas.style.height = Math.floor(G.H * sc) + 'px'; }
window.addEventListener('resize', resize); resize();
Input.init(canvas);
const unlockAudio = () => { Audio.init(); Audio.resume(); Audio.setVolume(G.settings.volume); Audio.setMusicVol(G.settings.music); }; window.addEventListener('mousedown', unlockAudio, { once: true }); window.addEventListener('keydown', unlockAudio, { once: true }); window.addEventListener('touchstart', unlockAudio, { once: true });

// ---------------- G helpers ----------------
G.aim = { x: 0, y: 0 };
G.aimDir = () => { const p = G.player; const dx = G.aim.x - p.x, dy = G.aim.y - (p.y - 6); const d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; };
G.dropItem = (id, n, x, y) => { if (!ITEMS[id] && !ARMOR[id] && !WANDS[id]) { console.warn('drop unknown', id); return; } G.drops.push(new Drop(id, n, x, y)); if (G.drops.length > 300) G.drops.shift(); };
G.openDialog = openDialog; G.openMenu = openMenu;
G.nearStations = () => { const p = G.player; const out = []; for (const s of G.world.stations) { if (Math.hypot(s.x * 16 + 8 - p.x, s.y * 16 + 8 - p.y) < 72 && !out.includes(s.type)) out.push(s.type); } return out; };
G.spawnEnemyAt = (id, x, y) => Spawner.spawnAt(id, x, y);
G.questMarker = id => Quests.marker(id);
G.onKill = e => { Quests.onKill(e); G.flags['seen_' + e.id] = true; Quests.refresh(); };
G.onBossKilled = e => { G.flags['boss_' + e.id] = true; if (e.poi) G.bossKilled[e.poi] = G.day; G.notify(`${e.def.name} has been defeated!`, '#f5d33a', 6); Quests.refresh(); save(); };
G.onTame = id => { Quests.refresh(); };
G.onRide = pt => { };
G.onHarvest = type => { Quests.onHarvest(type); Quests.refresh(); };
G.onItemGained = id => { if (id === 'fish') G.stats.fish = (G.stats.fish || 0) + 1; Quests.refresh(); };
G.onLevel = lvl => { Quests.refresh(); };
G.sleep = () => { G.time = 0.27; G.day++; G.world.refillChests(G.day); G.player.heal(G.player.maxHp); G.player.mana = G.player.maxMana; G.notify(`You slept. Day ${G.day} begins.`, '#f5d33a'); G.enemies = G.enemies.filter(e => e.def.boss); spawnEffect('flash', 0, 0, { color: '#000', dur: 1.2 }); save(); };
G.onBeacon = () => { const p = G.player; if (G.flags.beaconLit) { G.notify('The Beacon burns bright. The world is safe... for now.', '#fff8c0', 4); return; } if (p.wands.lumis) { G.flags.beaconLit = true; G.victory = true; G.notify('THE LUMIS BEACON IS LIT! Light floods the world!', '#fff8c0', 8); Audio.play('levelup'); spawnEffect('flash', 0, 0, { color: '#fff8c0', dur: 2 }); for (let i = 0; i < 10; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.3, fn: () => spawnParticles(G.world.beacon.x * 16 + 8, G.world.beacon.y * 16 - 10, 40, ['#fff8c0', '#f5d33a', '#ffffff', '#5ad8f0'], { speed: 120, life: 1.5, gravity: -30 }) }); G.player.addBuff('luck', 0.5, 600); Quests.refresh(); save(); setTimeout(() => { G.victory = false; }, 15000); } else G.notify('The Beacon is dark. It needs the light of The Lumis wand...', '#a8a8b8', 4); };
G.onVictory = () => { G.achievements.light = true; };
G.craft = r => {
  const p = G.player; const near = G.nearStations(); for (const [id, n] of r.ingredients) if (p.countItem(id) < n) return; if (r.station && !near.includes(r.station)) return;
  if (r.type !== 'item' || p.inventory.length < p.maxSlots || p.inventory.some(s => s.id === r.id)) { for (const [id, n] of r.ingredients) p.removeItem(id, n); } else { G.notify('Inventory full!', '#d43a3a'); return; }
  if (r.type === 'wand') { p.wands[r.id] = { lvl: 1, xp: 0 }; p.craftedWands[r.id] = true; p.equipItem(r.id); G.notify(`Crafted ${r.name}! Equipped.`, RARITY_COLORS[r.rarity], 4); if (r.tier >= 6) spawnEffect('flash', 0, 0, { color: ELEMENT_COLORS[r.def.element], dur: 0.6 }); }
  else if (r.type === 'armor') { p.addItem(r.id, 1); p.craftedArmor[r.id] = true; G.notify(`Crafted ${r.name}!`, RARITY_COLORS[r.rarity]); }
  else { p.addItem(r.id, r.n || 1); G.notify(`Crafted ${r.n > 1 ? r.n + 'x ' : ''}${r.name}!`, RARITY_COLORS[r.rarity]); }
  G.stats.crafted++; Audio.play('craft'); spawnParticles(p.x, p.y - 8, 15, '#f5d33a', { speed: 40, life: 0.6, gravity: -20 }); Quests.refresh();
};
const LOOT = {
  1: [['coins', 5, 20, 1], ['potion_hp', 1, 2, 0.6], ['apple', 2, 4, 0.5], ['wood', 3, 8, 0.5], ['copper_ore', 2, 4, 0.5], ['string', 1, 3, 0.4], ['magic_treat', 1, 1, 0.12], ['leather', 1, 2, 0.3], ['seed', 2, 4, 0.3]],
  2: [['coins', 15, 40, 1], ['potion_hp', 1, 3, 0.6], ['potion_mana', 1, 2, 0.5], ['iron_ore', 2, 4, 0.5], ['crystal', 1, 3, 0.4], ['arcane_dust', 1, 3, 0.4], ['xp_tome', 1, 1, 0.1], ['egg_mystery', 1, 1, 0.06], ['leather_head', 1, 1, 0.08], ['iron_body', 1, 1, 0.05], ['magic_treat', 1, 2, 0.2], ['bomb', 1, 2, 0.2]],
  3: [['coins', 30, 80, 1], ['gold_ore', 1, 3, 0.5], ['potion_hp2', 1, 1, 0.4], ['ember_core', 1, 1, 0.12], ['frost_core', 1, 1, 0.12], ['storm_core', 1, 1, 0.12], ['nature_essence', 1, 1, 0.12], ['shadow_essence', 1, 1, 0.1], ['holy_essence', 1, 1, 0.1], ['egg_mystery', 1, 1, 0.1], ['runestone', 1, 1, 0.3], ['ancient_coin', 1, 2, 0.4], ['magic_treat', 1, 3, 0.3], ['wand_tome', 1, 1, 0.1]],
  4: [['coins', 60, 150, 1], ['mithril_ore', 1, 3, 0.4], ['star_fragment', 1, 1, 0.1], ['egg_fire', 1, 1, 0.05], ['egg_ice', 1, 1, 0.05], ['egg_storm', 1, 1, 0.05], ['egg_shadow', 1, 1, 0.05], ['egg_nature', 1, 1, 0.05], ['xp_tome', 1, 2, 0.3], ['celestial_dust', 1, 1, 0.1], ['potion_hp2', 1, 2, 0.5], ['elixir', 1, 1, 0.1], ['golden_treat', 1, 1, 0.05], ['gold_bar', 1, 2, 0.3], ['dragon_scale', 1, 1, 0.1]],
  5: [['coins', 120, 300, 1], ['star_fragment', 1, 2, 0.4], ['celestial_dust', 1, 2, 0.4], ['egg_cosmic', 1, 1, 0.05], ['golden_treat', 1, 1, 0.15], ['elixir', 1, 2, 0.3], ['mithril_bar', 1, 2, 0.3], ['chaos_orb', 1, 1, 0.08], ['void_shard', 1, 1, 0.08], ['phoenix_feather', 1, 1, 0.06], ['xp_tome', 2, 3, 0.4], ['time_shard', 1, 1, 0.03]],
};
G.openChest = (tx, ty) => {
  const p = G.player; const k = tx + ',' + ty; const st = G.world.objState.get(k) || { tier: 1 }; const gold = G.world.obj(tx, ty) === 'gold_chest';
  if (gold && !p.hasItem('gold_key')) { G.notify('This golden chest is locked. You need a Golden Key (mimics drop them, or craft one).', '#f5d33a', 4); Audio.play('fail'); return; }
  if (gold) p.removeItem('gold_key', 1);
  const wx = tx * 16 + 8, wy = ty * 16 + 8;
  if (!gold && st.tier >= 3 && Math.random() < 0.15) { G.world.setObj(tx, ty, null, true); G.world.chestsOpened[k] = G.day; const m = new Enemy('mimic', wx, wy + 4); m.aggro = true; G.enemies.push(m); G.notify('It\'s a MIMIC!', '#d43a3a'); Audio.play('boss'); return; }
  G.world.setObj(tx, ty, 'chest_open', true); G.world.chestsOpened[k] = G.day; G.stats.chests++; Audio.play('chest'); spawnParticles(wx, wy - 4, 20, ['#f5d33a', '#fff8c0'], { speed: 50, life: 0.7, gravity: -20 });
  const tier = Math.min(5, st.tier + (gold ? 1 : 0)); const table = LOOT[tier]; const luck = 1 + p.stats.luck; let got = 0;
  for (let pass = 0; pass < (gold ? 2 : 1); pass++) for (const [id, mn, mx, ch] of table) { if (Math.random() < ch * luck) { const n = mn + Math.floor(Math.random() * (mx - mn + 1)); G.dropItem(id, n, wx + (Math.random() - 0.5) * 24, wy + 6 + Math.random() * 10); got++; } }
  if (!got) G.dropItem('coins', 5, wx, wy + 8);
  Quests.refresh();
};
// ---------------- init ----------------
function buildMapCanvas() { const w = G.world; const c = document.createElement('canvas'); c.width = w.W; c.height = w.H; const cx = c.getContext('2d'); const img = cx.createImageData(w.W, w.H); for (let i = 0; i < w.W * w.H; i++) { const d = TILE_DEFS[w.tiles[i]]; const col = d.base; const r = parseInt(col.slice(1, 3), 16), g = parseInt(col.slice(3, 5), 16), b = parseInt(col.slice(5, 7), 16); const o = w.objs[i]; let rr = r, gg = g, bb = b; if (o && OBJ[o] && o.startsWith('tree')) { rr = 0x2a; gg = 0x6a; bb = 0x2a; } img.data[i * 4] = rr; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = bb; img.data[i * 4 + 3] = 255; } cx.putImageData(img, 0, 0); G.mapCanvas = c; }
function newGame(seed) {
  G.seed = seed || Math.floor(Math.random() * 1e9); G.world = new World(G.seed); G.player = new Player(); G.player.x = G.world.spawn.x; G.player.y = G.world.spawn.y; G.player.respawn = { ...G.world.spawn };
  G.time = 0.3; G.day = 1; G.stats = { kills: 0, bossKills: 0, chests: 0, tamed: 0, crafted: 0, wood: 0, stone: 0, deaths: 0, distance: 0, playTime: 0, fish: 0 }; G.flags = {}; G.discovered = { village: true }; G.questState = {}; G.achievements = {}; G.bossKilled = {}; G.tamedSpawns = {}; G.quickSlots = [null, null, null, null, null];
  G.enemies = []; G.pets = []; G.wildPets = []; G.projectiles = []; G.particles = []; G.drops = []; G.npcs = []; G.effects = []; G.floats = []; G.hazards = []; G.allies = [];
  Spawner.init(); buildMapCanvas(); G.player.addItem('apple', 3); G.player.addItem('potion_hp', 2); G.player.addItem('berry', 3); G.quickSlots[0] = 'potion_hp'; G.quickSlots[1] = 'apple';
  G.scene = 'game'; G.notify('Welcome to LUMIS. Talk to Elder Rowan (north). [F] interacts.', '#fff8c0', 6); G.notify('WASD move, mouse aim, click to shoot. E/Q/C abilities.', '#a8a8b8', 6);
  save();
}
function loadGame(data) {
  G.seed = data.seed; G.world = new World(G.seed); G.player = new Player(); const p = G.player; const d = data.player;
  Object.assign(p, { x: d.x, y: d.y, level: d.level, xp: d.xp, statPoints: d.statPoints, alloc: d.alloc, inventory: d.inventory, coins: d.coins, equip: d.equip, wands: d.wands, pets: d.pets, petUid: d.petUid, respawn: d.respawn, craftedWands: d.craftedWands || {}, craftedArmor: d.craftedArmor || {}, tamedIds: d.tamedIds || {}, reviveUsedDay: d.reviveUsedDay || 0 });
  G.time = data.time; G.day = data.day; G.stats = Object.assign({ fish: 0 }, data.stats); G.flags = data.flags || {}; G.discovered = data.discovered || { village: true }; G.questState = data.questState || {}; G.achievements = data.achievements || {}; G.bossKilled = (data.world && data.world.bossKilled) || {}; G.tamedSpawns = {}; G.quickSlots = data.quickSlots || [null, null, null, null, null]; if (data.settings) Object.assign(G.settings, data.settings);
  G.enemies = []; G.pets = []; G.wildPets = []; G.projectiles = []; G.particles = []; G.drops = []; G.npcs = []; G.effects = []; G.floats = []; G.hazards = []; G.allies = [];
  G.world.applyChanges(data.world.changes, data.world.chests, data.day); Spawner.init(); buildMapCanvas();
  p.activePets = []; for (const uid of d.activePets || []) p.setPetActive(uid, true);
  p.recalc(); p.hp = Math.min(d.hp, p.maxHp); p.mana = Math.min(d.mana, p.maxMana); if (!WANDS[p.equip.wand]) p.equip.wand = 'wand_wood'; if (!p.wands[p.equip.wand]) p.wands[p.equip.wand] = { lvl: 1, xp: 0 };
  Audio.setVolume(G.settings.volume); Audio.setMusicVol(G.settings.music);
  G.scene = 'game'; G.notify(`Welcome back! Day ${G.day}, level ${p.level}.`, '#fff8c0', 4);
}
// ---------------- update ----------------
function update(dt) {
  const p = G.player; G.dt = dt; G.frame++; G.stats.playTime += dt;
  const r = canvas.getBoundingClientRect();
  G.aim.x = Input.mouse.x + G.camera.x; G.aim.y = Input.mouse.y + G.camera.y;
  updateMenuInput();
  if (G.dialog) { p.update(dt); for (const n of G.npcs) n.update(dt); return; }
  if (G.menu) { return; }
  // time
  G.time += dt / G.dayLength; if (G.time >= 1) { G.time -= 1; G.day++; G.notify(`Day ${G.day}`, '#f5d33a'); G.world.refillChests(G.day); }
  if (G.timeStop > 0) G.timeStop -= dt; if (G.timeSlow > 0) G.timeSlow -= dt;
  p.update(dt); Spawner.update(dt); updateEntities(dt); G.world.tick(dt);
  if (G.shakeObj) { G.shakeObj.t -= dt; if (G.shakeObj.t <= 0) G.shakeObj = null; }
  for (const n of G.notices) n.t -= dt; G.notices = G.notices.filter(n => n.t > 0);
  // discovery
  discoverT += dt; if (discoverT > 0.5) { discoverT = 0; for (const poi of G.world.pois) { if (G.discovered[poi.id]) continue; if (Math.hypot(poi.x - p.x, poi.y - p.y) < poi.radius * 16 + 24) { G.discovered[poi.id] = true; G.notify(`Discovered: ${poi.name}`, poi.def.icon, 5); G.notify(poi.def.desc, '#a8a8b8', 5); p.gainXp(20 + Math.round(poi.def.pos[1] * 1.5)); Audio.play('quest'); Quests.refresh(); } }
    for (const e of G.enemies) if (Math.hypot(e.x - p.x, e.y - p.y) < 300) G.flags['seen_' + e.id] = true;
    const rp = p.ridingPet(); if (rp && rp.def.fly && isLiquidTile(G.world.get(Math.floor(p.x / 16), Math.floor(p.y / 16))) && !G.flags.rodeOverWater) { G.flags.rodeOverWater = true; G.notify('Achievement: Sky Rider!', '#f5d33a'); } }
  achT += dt; if (achT > 2) { achT = 0; for (const a of ACHIEVEMENTS) { if (!G.achievements[a.id] && a.check()) { G.achievements[a.id] = true; G.notify(`Achievement unlocked: ${a.name}!`, '#f5d33a', 5); Audio.play('quest'); } } }
  // weather
  updateWeather(dt);
  // autosave
  G.saveTimer += dt; if (G.saveTimer > 30) { G.saveTimer = 0; save(); }
  // music
  const boss = G.enemies.some(e => e.def.boss && Math.hypot(e.x - p.x, e.y - p.y) < 500); const night = G.time > 0.74 || G.time < 0.22; const biome = G.world.biomeAt(Math.floor(p.x / 16), Math.floor(p.y / 16));
  Audio.music(dt, boss ? 'boss' : night ? 'night' : ['dark_forest', 'graveyard', 'volcanic'].includes(biome) ? 'cave' : 'day');
  // camera
  const sh = G.settings.shake ? G.camera.shake : 0; G.camera.shake = Math.max(0, G.camera.shake - dt * 30);
  G.camera.x = Math.round(Math.max(0, Math.min(G.world.W * 16 - G.W, p.x - G.W / 2 + (Math.random() - 0.5) * sh))); G.camera.y = Math.round(Math.max(0, Math.min(G.world.H * 16 - G.H, p.y - G.H / 2 + (Math.random() - 0.5) * sh)));
}
function updateWeather(dt) {
  const w = G.weather; const p = G.player; const biome = G.world.biomeAt(Math.floor(p.x / 16), Math.floor(p.y / 16));
  w.t -= dt; if (w.t <= 0) { w.t = 40 + Math.random() * 60; const r = Math.random(); w.type = biome === 'tundra' ? 'snow' : biome === 'volcanic' ? 'ash' : biome === 'mushroom' ? 'spores' : biome === 'desert' ? (r < 0.2 ? 'sand' : 'clear') : ['swamp', 'forest', 'meadow', 'dark_forest', 'graveyard'].includes(biome) ? (r < 0.3 ? 'rain' : 'clear') : 'clear'; if (w.type === 'rain' && Math.random() < 0.3) w.type = 'storm'; }
  if (w.type === 'clear') { weatherParts = []; return; }
  while (weatherParts.length < (w.type === 'spores' ? 30 : 90)) weatherParts.push({ x: Math.random() * G.W, y: Math.random() * G.H, v: 0.5 + Math.random() });
  for (const q of weatherParts) { if (w.type === 'rain' || w.type === 'storm') { q.y += (260 + q.v * 100) * dt; q.x -= 40 * dt; } else if (w.type === 'snow') { q.y += (30 + q.v * 20) * dt; q.x += Math.sin(q.y / 20 + q.v) * 20 * dt; } else if (w.type === 'ash') { q.y += (20 + q.v * 15) * dt; q.x += Math.sin(q.y / 30) * 10 * dt; } else if (w.type === 'spores') { q.y -= (8 + q.v * 6) * dt; q.x += Math.sin(q.y / 15 + q.v * 3) * 12 * dt; } else if (w.type === 'sand') { q.x += (200 + q.v * 100) * dt; q.y += 10 * dt; } if (q.y > G.H) { q.y = -5; q.x = Math.random() * G.W; } if (q.y < -5) { q.y = G.H; q.x = Math.random() * G.W; } if (q.x < -5) q.x = G.W; if (q.x > G.W + 5) q.x = -5; }
  if (w.type === 'storm' && Math.random() < dt * 0.08) { spawnEffect('flash', 0, 0, { color: '#c8d8ff', dur: 0.15 }); Audio.play('thunder'); }
}
// ---------------- render ----------------
function render() {
  const p = G.player; const cx = G.camera.x, cy = G.camera.y; const w = G.world; const time = performance.now() / 1000;
  ctx.fillStyle = '#0b0a14'; ctx.fillRect(0, 0, G.W, G.H);
  const tx0 = Math.floor(cx / 16), ty0 = Math.floor(cy / 16), tx1 = tx0 + Math.ceil(G.W / 16) + 1, ty1 = ty0 + Math.ceil(G.H / 16) + 2;
  const drawables = []; const lights = [];
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    if (!w.inb(tx, ty)) continue; const t = w.get(tx, ty); const v = Math.floor(hash2(tx, ty, 5) * 4);
    const sx = tx * 16 - cx, sy = ty * 16 - cy;
    ctx.drawImage(tileSprite(t, v), sx, sy);
    const d = TILE_DEFS[t];
    if (d.liquid || t === T.SHALLOW) { const ph = Math.floor(time * 3 + tx * 1.7 + ty * 2.3) % 16; ctx.fillStyle = t === T.LAVA ? 'rgba(255,220,80,0.5)' : 'rgba(255,255,255,0.25)'; ctx.fillRect(sx + ph, sy + ((tx + ty) % 2) * 8 + 3, 4, 1); if (t !== T.LAVA && !isLiquidTile(w.get(tx, ty - 1)) && w.get(tx, ty - 1) !== T.SHALLOW) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(sx, sy, 16, 1); } }
    if (d.wall) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sx, sy + 13, 16, 3); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(sx, sy, 16, 2); }
    if (d.light) lights.push({ x: tx * 16 + 8, y: ty * 16 + 8, r: 28, c: d.light });
    const o = w.obj(tx, ty); if (!o) continue; const od = OBJ[o]; if (!od) continue;
    const spr = objSprite(o); if (!spr) continue;
    const ox = tx * 16 + (16 - spr.width) / 2, oy = ty * 16 + 16 - spr.height; let shx = 0; if (G.shakeObj && G.shakeObj.x === tx && G.shakeObj.y === ty) shx = Math.sin(time * 80) * 2;
    if (od.ground || (!od.solid && !od.tall)) ctx.drawImage(spr, Math.round(ox - cx + shx), Math.round(oy - cy)); else drawables.push({ y: ty * 16 + 16, draw: () => { if (od.tall) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(tx * 16 + 8 - cx, ty * 16 + 14 - cy, 7, 3, 0, 0, Math.PI * 2); ctx.fill(); } ctx.drawImage(spr, Math.round(ox - cx + shx), Math.round(oy - cy)); } });
    if (od.light) lights.push({ x: tx * 16 + 8, y: ty * 16 + 4, r: o === 'beacon' ? 90 : o === 'campfire' || o === 'lamp' ? 48 : 36, c: od.light, flicker: o === 'campfire' || o === 'torch' || o === 'brazier' });
  }
  drawDrops(ctx, cx, cy);
  for (const e of G.enemies) drawables.push({ y: e.y, draw: () => e.draw(ctx, cx, cy) });
  for (const pt of G.pets) if (!pt.riding) drawables.push({ y: pt.y, draw: () => pt.draw(ctx, cx, cy) });
  for (const wp of G.wildPets) drawables.push({ y: wp.y, draw: () => wp.draw(ctx, cx, cy) });
  for (const n of G.npcs) drawables.push({ y: n.y, draw: () => n.draw(ctx, cx, cy) });
  for (const a of G.allies) drawables.push({ y: a.y, draw: () => drawAlly(ctx, a, cx, cy) });
  drawables.push({ y: p.y + 0.1, draw: () => p.draw(ctx, cx, cy) });
  drawables.sort((a, b) => a.y - b.y); for (const d of drawables) d.draw();
  drawEffects(ctx, cx, cy); drawProjectiles(ctx, cx, cy); drawParticles(ctx, cx, cy);
  // lighting
  const night = nightAlpha(); const biome = w.biomeAt(Math.floor(p.x / 16), Math.floor(p.y / 16)); const ambient = ['dark_forest', 'graveyard'].includes(biome) ? 0.3 : 0; const dark = Math.max(night, ambient);
  if (dark > 0.02) {
    lctx.globalCompositeOperation = 'source-over'; lctx.fillStyle = `rgba(8,6,30,${dark})`; lctx.fillRect(0, 0, G.W, G.H);
    lctx.globalCompositeOperation = 'destination-out';
    const wd = p.wandDef(); lights.push({ x: p.x, y: p.y - 6, r: 44 + wd.tier * 6, c: ELEMENT_COLORS[wd.element] });
    for (const pt of G.pets) if (pt.def.abil === 'light') lights.push({ x: pt.x, y: pt.y - 6, r: 70, c: '#fff' });
    for (const pr of G.projectiles) lights.push({ x: pr.x, y: pr.y, r: 14, c: pr.color });
    for (const h of G.hazards) lights.push({ x: h.x, y: h.y, r: h.r, c: h.color });
    for (const e of G.enemies) if (e.def.light) lights.push({ x: e.x, y: e.y - 6, r: 30, c: e.def.light });
    for (const l of lights) { const rr = l.r * (l.flicker ? 0.9 + Math.sin(time * 12 + l.x) * 0.1 : 1); const g = lctx.createRadialGradient(l.x - cx, l.y - cy, 0, l.x - cx, l.y - cy, rr); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)'); lctx.fillStyle = g; lctx.fillRect(l.x - cx - rr, l.y - cy - rr, rr * 2, rr * 2); }
    ctx.drawImage(lightCanvas, 0, 0);
    // warm glow tint for lights
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.12 * dark; for (const l of lights) { if (!l.c) continue; const g = ctx.createRadialGradient(l.x - cx, l.y - cy, 0, l.x - cx, l.y - cy, l.r); g.addColorStop(0, l.c); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(l.x - cx - l.r, l.y - cy - l.r, l.r * 2, l.r * 2); } ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  } else if (G.time > 0.62 && G.time < 0.78) { ctx.fillStyle = `rgba(255,140,60,${(G.time - 0.62) / 0.16 * 0.18})`; ctx.fillRect(0, 0, G.W, G.H); }
  // weather
  const wt = G.weather.type; if (wt !== 'clear') { for (const q of weatherParts) { if (wt === 'rain' || wt === 'storm') { ctx.fillStyle = 'rgba(150,190,255,0.5)'; ctx.fillRect(q.x, q.y, 1, 6); } else if (wt === 'snow') { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(q.x, q.y, 2, 2); } else if (wt === 'ash') { ctx.fillStyle = 'rgba(120,120,130,0.7)'; ctx.fillRect(q.x, q.y, 2, 2); } else if (wt === 'spores') { ctx.fillStyle = `rgba(240,122,208,${0.4 + Math.sin(time * 3 + q.v * 10) * 0.3})`; ctx.fillRect(q.x, q.y, 2, 2); } else if (wt === 'sand') { ctx.fillStyle = 'rgba(226,207,144,0.5)'; ctx.fillRect(q.x, q.y, 6, 1); } } if (wt === 'rain' || wt === 'storm') { ctx.fillStyle = 'rgba(40,60,100,0.12)'; ctx.fillRect(0, 0, G.W, G.H); } if (wt === 'sand') { ctx.fillStyle = 'rgba(226,207,144,0.12)'; ctx.fillRect(0, 0, G.W, G.H); } }
  // floats
  if (G.settings.floats) for (const f of G.floats) { ctx.globalAlpha = Math.min(1, f.t); text(ctx, f.txt, Math.round(f.x - cx), Math.round(f.y - cy), f.color, f.size, 'center'); } ctx.globalAlpha = 1;
  drawHUD(ctx); drawDialog(ctx); drawMenu(ctx);
  // crosshair
  if (!G.menu && !G.dialog) { const mx = Input.mouse.x, my = Input.mouse.y; ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(mx - 4, my, 3, 1); ctx.fillRect(mx + 2, my, 3, 1); ctx.fillRect(mx, my - 4, 1, 3); ctx.fillRect(mx, my + 2, 1, 3); }
}
function nightAlpha() { const t = G.time; if (t >= 0.25 && t <= 0.7) return 0; if (t > 0.7 && t < 0.82) return (t - 0.7) / 0.12 * 0.72; if (t >= 0.82 || t < 0.15) return 0.72; return 0.72 * (1 - (t - 0.15) / 0.1); }
// ---------------- title ----------------
let titleT = 0; let titleMode = 'main';
function drawTitle(dt) {
  titleT += dt; const W = G.W, H = G.H; const m = Input.mouse;
  const grd = ctx.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#0b0a14'); grd.addColorStop(1, '#1e1030'); ctx.fillStyle = grd; ctx.fillRect(0, 0, W, H);
  while (titleParts.length < 60) titleParts.push({ x: Math.random() * W, y: Math.random() * H, v: 5 + Math.random() * 15, s: Math.random() });
  for (const q of titleParts) { q.y -= q.v * dt; if (q.y < -2) { q.y = H + 2; q.x = Math.random() * W; } ctx.fillStyle = `rgba(245,211,58,${0.2 + q.s * 0.5})`; ctx.fillRect(q.x, q.y, q.s > 0.7 ? 2 : 1, q.s > 0.7 ? 2 : 1); }
  // ground strip with sprites
  ctx.drawImage(tileSprite(T.GRASS, 0), 0, 0); for (let x = 0; x < W; x += 16) ctx.drawImage(tileSprite(T.DGRASS, (x / 16) % 4), x, H - 40);
  for (let x = 0; x < W; x += 16) ctx.drawImage(tileSprite(T.GRASS, (x / 16) % 4), x, H - 24);
  const show = ['tree_oak', 'tree_pine', 'tree_cherry', 'tree_crystal', 'tree_shroom', 'lamp', 'tree_palm', 'tree_snowpine']; show.forEach((o, i) => { const s = objSprite(o); ctx.drawImage(s, 20 + i * 82, H - 40 - s.height + 8); });
  if (G.petSprites) G.petSprites.forEach((spr, i) => { if (spr && spr.width) ctx.drawImage(spr, 40 + i * 58 + Math.sin(titleT * 2 + i) * 3, H - 38 + Math.sin(titleT * 4 + i) * 2); });
  // logo
  const bounce = Math.sin(titleT * 2) * 3;
  text(ctx, 'LUMIS', W / 2 + 4, 44 + bounce, '#8a1c1c', 44, 'center', false); text(ctx, 'LUMIS', W / 2, 40 + bounce, '#f5d33a', 44, 'center', false);
  text(ctx, 'A  W I Z A R D  W O R L D', W / 2, 96, '#c8a0f0', 8, 'center');
  text(ctx, `${WAND_LIST.length} wands  •  ${PET_LIST.length} pets  •  ${G.poiCount || 44} places  •  10 bosses`, W / 2, 112, '#a8a8b8', 6, 'center');
  const bx = W / 2 - 70, by = 140; let clicked = null;
  const btns = titleMode === 'main' ? [hasSave() ? ['continue', 'CONTINUE', 'gold'] : null, ['new', 'NEW GAME', 'green'], ['import', 'IMPORT SAVE (.json)', 'blue'], ['help', 'HOW TO PLAY', 'stone']].filter(Boolean) : [['back', 'BACK', 'stone']];
  btns.forEach(([id, label, style], i) => { const y = by + i * 26; const hv = m.x >= bx && m.x < bx + 140 && m.y >= y && m.y < y + 20; button(ctx, bx, y, 140, 20, label, hv, style, 7); if (hv && m.pressed) clicked = id; });
  if (titleMode === 'help') { const lines = ['WASD move • Mouse aim • Click to cast • Space dodge', 'E / Q / C: wand abilities. V: SECRET ability on mythic wands!', 'F: talk, open chests, chop trees, mine rocks, feed pets, fish', 'R: ride your pet. Flying pets cross water & lava.', 'Tame creatures by feeding them their favorite food (press F).', 'Craft better wands & armor at anvils, altars, and cauldrons (K).', 'Kill enemies to level up your wand. Nights are dangerous.', 'Find the 5 Lumis Fragments from bosses to relight the Beacon.', 'The game autosaves to this browser as JSON. Export it in Options.']; lines.forEach((l, i) => text(ctx, l, W / 2, 176 + i * 12, '#d8d8e0', 6, 'center')); }
  if (titleMode === 'main' && hasSave()) { const d = load(); if (d) text(ctx, `Save: Day ${d.day}, level ${d.player.level}, ${Object.keys(d.player.tamedIds || {}).length} pets, ${Object.keys(d.player.wands || {}).length} wands`, W / 2, by + btns.length * 26 + 4, '#8fe04a', 5, 'center'); }
  text(ctx, 'v1.0  •  saves locally as JSON  •  made with pixels & love', W / 2, H - 12, '#4a4a62', 5, 'center');
  if (Input.hit('Enter')) clicked = hasSave() ? 'continue' : 'new';
  if (clicked) { Audio.play('ui'); if (clicked === 'continue') { const d = load(); if (d) loadGame(d); else newGame(); } else if (clicked === 'new') { if (hasSave() && !confirm('Start a new game? Your existing save will be overwritten.')) return; clearSave(); newGame(); } else if (clicked === 'import') importJson(d => loadGame(d)); else if (clicked === 'help') titleMode = 'help'; else if (clicked === 'back') titleMode = 'main'; }
}
// ---------------- loop ----------------
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  try { if (G.scene === 'title') drawTitle(dt); else { update(dt); render(); } } catch (e) { console.error(e); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, G.W, 40); text(ctx, 'Error: ' + e.message, 4, 4, '#d43a3a', 6); }
  Input.endFrame(); requestAnimationFrame(frame);
}
async function start() {
  try { await document.fonts.load('8px "Press Start 2P"'); } catch (e) {}
  const pm = await import('./data/pets.js'); G.petSprites = ['dragon_red', 'cat_tabby', 'wolf_spirit', 'phoenix_fire', 'unicorn_white', 'slime_green', 'griffin_gold', 'kitsune_nine', 'capy', 'owl_barn'].map(id => pm.petSprite(id));
  const pois = await import('./data/pois.js'); G.poiCount = pois.POIS.length;
  document.getElementById('loading').classList.add('hide');
  G.saveTimer = 0; last = performance.now(); requestAnimationFrame(frame);
}
window.addEventListener('beforeunload', () => { if (G.scene === 'game' && G.player) save(); });
window.LUMIS = G;
start();
