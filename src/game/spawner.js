import { G } from '../state.js';
import { ENEMIES, ENEMY_LIST } from '../data/enemies.js';
import { PETS, PET_LIST } from '../data/pets.js';
import { Enemy, WildPet, NPCEnt, spawnParticles } from './entities.js';
import { hash2 } from '../engine/rng.js';
import { Audio } from '../engine/audio.js';
const BIOME_ENEMIES = {}; const BIOME_PETS = {};
for (const e of ENEMY_LIST) for (const b of e.biomes) { if (b.startsWith('poi:')) continue; (BIOME_ENEMIES[b] = BIOME_ENEMIES[b] || []).push(e.id); }
for (const p of PET_LIST) for (const b of p.where) { if (b.startsWith('poi:') || b.startsWith('egg:')) continue; (BIOME_PETS[b] = BIOME_PETS[b] || []).push(p.id); }
export const Spawner = {
  t: 0, petT: 0, poiT: 0,
  init() {
    G.enemies = []; G.wildPets = []; G.npcs = []; G.pets = []; G.allies = [];
    for (const s of G.world.npcSpawns) G.npcs.push(new NPCEnt(s.id, s.x, s.y, s.poi));
    for (const s of G.world.petSpawns) { s.respawn = 0; s.ent = null; }
    for (const s of G.world.enemySpawns) { s.respawn = 0; s.ent = null; }
    G.bossKilled = G.bossKilled || {}; G.tamedSpawns = G.tamedSpawns || {};
  },
  isNight() { return G.time > 0.74 || G.time < 0.22; },
  update(dt) {
    const p = G.player; const w = G.world;
    this.t += dt; this.petT += dt; this.poiT += dt;
    // ambient enemy spawns near player
    if (this.t > 1.2) {
      this.t = 0;
      const near = G.enemies.filter(e => !e.def.boss && Math.hypot(e.x - p.x, e.y - p.y) < 420).length;
      const poi = w.poiAt(p.x, p.y); const safe = poi && poi.def.safe;
      const cap = ((this.isNight() ? 9 : 5) + Math.floor(p.level / 5)) * (G.eventIs('blood_moon') && this.isNight() ? 2 : 1);
      if (!safe && near < cap && Math.random() < (this.isNight() ? 0.75 : 0.45)) {
        const a = Math.random() * Math.PI * 2, d = 230 + Math.random() * 120; const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d;
        const tx = Math.floor(x / 16), ty = Math.floor(y / 16);
        if (w.inb(tx, ty) && !w.solid(tx, ty)) {
          const b = w.biomeAt(tx, ty); let pool = (BIOME_ENEMIES[b] || []).slice();
          const dC = Math.hypot(tx - 128, ty - 128) / 128; const maxLvl = 1 + Math.floor(dC * 7) + (this.isNight() ? 1 : 0);
          pool = pool.filter(id => ENEMIES[id].lvl <= maxLvl && (!ENEMIES[id].night || this.isNight() || Math.random() < 0.2));
          if (this.isNight() && b !== 'ocean' && Math.random() < 0.3) pool.push('skeleton', 'zombie', 'bat');
          if (pool.length) { const id = pool[Math.floor(Math.random() * pool.length)]; const e = new Enemy(id, x, y, { hpMult: G.eventIs('blood_moon') && this.isNight() ? 1.4 : 1 }); G.enemies.push(e); }
        }
      }
      // despawn far
      G.enemies = G.enemies.filter(e => e.def.boss || e.spawnRef || Math.hypot(e.x - p.x, e.y - p.y) < 900);
      G.wildPets = G.wildPets.filter(wp => wp.spawnRef || Math.hypot(wp.x - p.x, wp.y - p.y) < 900);
    }
    // ambient wild pets
    if (this.petT > 4) {
      this.petT = 0;
      const near = G.wildPets.filter(wp => Math.hypot(wp.x - p.x, wp.y - p.y) < 400).length;
      if (near < (G.eventIs('fairy_festival') ? 10 : 4) && Math.random() < 0.6) {
        const a = Math.random() * Math.PI * 2, d = 200 + Math.random() * 150; const x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d; const tx = Math.floor(x / 16), ty = Math.floor(y / 16);
        if (w.inb(tx, ty) && !w.solid(tx, ty)) { const b = w.biomeAt(tx, ty); const pool = BIOME_PETS[b === 'village' ? 'meadow' : b] || []; if (pool.length) { // rarity-weighted
            const weights = pool.map(id => ({ common: 10, uncommon: 5, rare: 2, epic: 0.8, legendary: 0.3, mythic: 0.1 }[PETS[id].rarity] || 1)); let r = Math.random() * weights.reduce((a, b) => a + b, 0); let pick = pool[0]; for (let i = 0; i < pool.length; i++) { r -= weights[i]; if (r <= 0) { pick = pool[i]; break; } }
            G.wildPets.push(new WildPet(pick, x, y, null)); } }
      }
    }
    // POI spawners (markers)
    if (this.poiT > 2) {
      this.poiT = 0;
      for (const s of w.petSpawns) {
        const d = Math.hypot(s.x - p.x, s.y - p.y); if (d > 600) continue;
        if (s.respawn > 0) { s.respawn -= 2; continue; }
        if (s.ent && (G.wildPets.includes(s.ent))) continue;
        const pool = s.pets && s.pets.length ? s.pets : (BIOME_PETS[s.biome] || BIOME_PETS.meadow);
        const id = pool[Math.floor(hash2(s.x, s.y, G.day * 7 + Math.floor(G.time * 4)) * pool.length)];
        if (d < 260) continue; // don't pop in view
        s.ent = new WildPet(id, s.x, s.y, s); G.wildPets.push(s.ent);
      }
      for (const s of w.enemySpawns) {
        const d = Math.hypot(s.x - p.x, s.y - p.y); if (d > 600 || d < 200) continue;
        if (s.ent && !s.ent.dead && G.enemies.includes(s.ent)) continue;
        if (s.respawn > 0) { s.respawn -= 2; continue; }
        if (!s.enemies.length) continue;
        const id = s.enemies[Math.floor(Math.random() * s.enemies.length)]; s.ent = new Enemy(id, s.x, s.y, { poi: s.poi, spawnRef: s }); G.enemies.push(s.ent); s.respawn = 60;
      }
      for (const s of w.bossSpawns) {
        if (!s.boss) continue; const d = Math.hypot(s.x - p.x, s.y - p.y);
        if (d > 200) continue;
        if (s.ent && !s.ent.dead && G.enemies.includes(s.ent)) continue;
        const killedDay = G.bossKilled[s.poi]; if (killedDay !== undefined && G.day - killedDay < 2) continue;
        if (s.boss === 'chaos_jester' && !this.isNight()) continue;
        s.ent = new Enemy(s.boss, s.x, s.y, { poi: s.poi, spawnRef: s }); s.ent.aggro = true; G.enemies.push(s.ent);
        G.notify(`${ENEMIES[s.boss].name} awakens!`, '#d43a3a', 4); Audio.play('boss'); spawnParticles(s.x, s.y, 40, '#d43a3a', { speed: 80, life: 0.8 });
      }
    }
  },
  spawnAt(id, x, y) { const e = new Enemy(id, x, y); e.aggro = true; G.enemies.push(e); return e; },
};
