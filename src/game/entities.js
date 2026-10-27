import { G } from '../state.js';
import { ENEMIES, enemySprite } from '../data/enemies.js';
import { PETS, petSprite, PET_SPECIES } from '../data/pets.js';
import { ITEMS, itemIcon } from '../data/items.js';
import { NPCS, npcSprite } from '../data/npcs.js';
import { OBJ, objSprite, T, TILE_DEFS } from '../data/tiles.js';
import { flipSprite, tintSprite, silhouette, makeSprite, PAL } from '../engine/sprites.js';
import { Audio } from '../engine/audio.js';
import { ELEMENT_COLORS, RARITY_COLORS } from '../engine/draw.js';
import { hash2 } from '../engine/rng.js';

export const ELEMENT_WEAK = { fire: ['ice', 'nature'], ice: ['nature', 'water'], lightning: ['water', 'wind'], nature: ['earth', 'water'], water: ['fire', 'earth'], wind: ['poison', 'fire'], dark: ['holy', 'arcane'], holy: ['dark', 'shadow'], arcane: ['crystal', 'chaos'], poison: ['nature', 'neutral'], earth: ['lightning', 'crystal'], chaos: ['arcane', 'neutral'], light: ['dark', 'shadow'], crystal: ['earth', 'arcane'], blood: ['neutral', 'holy'], time: ['chaos'] };
export function elementMult(atk, def) { if (!atk || !def || atk === 'neutral') return 1; if (atk === def) return 0.5; if ((ELEMENT_WEAK[atk] || []).includes(def)) return 1.5; return 1; }

// ------------- movement helpers -------------
export function tryMove(ent, dx, dy, flags = {}) {
  const w = G.world; const r = ent.r || 5;
  const free = (x, y) => !w.solid(Math.floor((x - r) / 16), Math.floor((y - r * 0.6) / 16), flags) && !w.solid(Math.floor((x + r) / 16), Math.floor((y - r * 0.6) / 16), flags) && !w.solid(Math.floor((x - r) / 16), Math.floor((y + r * 0.6) / 16), flags) && !w.solid(Math.floor((x + r) / 16), Math.floor((y + r * 0.6) / 16), flags);
  let moved = false;
  if (dx && free(ent.x + dx, ent.y)) { ent.x += dx; moved = true; }
  if (dy && free(ent.x, ent.y + dy)) { ent.y += dy; moved = true; }
  ent.x = Math.max(8, Math.min(w.W * 16 - 8, ent.x)); ent.y = Math.max(8, Math.min(w.H * 16 - 8, ent.y));
  return moved;
}
export function tileSlow(x, y) { const t = G.world.get(Math.floor(x / 16), Math.floor(y / 16)); const d = TILE_DEFS[t]; let m = d.slow || 1; const o = G.world.obj(Math.floor(x / 16), Math.floor(y / 16)); if (o && OBJ[o].slow) m *= OBJ[o].slow; return m; }
export function drawShadow(ctx, x, y, w) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, w / 2, w / 5, 0, 0, Math.PI * 2); ctx.fill(); }

// ------------- queries -------------
export function enemiesInRadius(x, y, r) { return G.enemies.filter(e => !e.dead && Math.hypot(e.x - x, e.y - y) <= r + e.r); }
export function nearestEnemy(x, y, r = 9999) { let best = null, bd = r; for (const e of G.enemies) { if (e.dead || e.untargetable) continue; const d = Math.hypot(e.x - x, e.y - y); if (d < bd) { bd = d; best = e; } } return best; }
export function nearestTarget(x, y, r) { // for enemies: player, pets, allies, decoys
  let best = G.player, bd = Math.hypot(G.player.x - x, G.player.y - y); if (G.player.buffs.invis || G.player.buffs.ghost) bd = 9999;
  for (const a of G.allies) { const d = Math.hypot(a.x - x, a.y - y) - (a.decoy ? 60 : 0); if (d < bd) { bd = d; best = a; } }
  for (const p of G.pets) { if (p.ko || p.riding) continue; const d = Math.hypot(p.x - x, p.y - y) - (p.def.abil === 'taunt' ? 80 : 0); if (d < bd) { bd = d; best = p; } }
  return bd < r ? best : null;
}

// ------------- damage -------------
export function hitEnemy(e, dmg, element, fx = {}) {
  if (!e || e.dead || e.invuln > 0) return 0;
  const p = G.player;
  let d = dmg * elementMult(element, e.def.element);
  let crit = false;
  if (fx.noCrit !== true && Math.random() < p.stats.crit) { d *= 2; crit = true; }
  if (e.shock > 0) d *= 1.25;
  d = Math.max(1, d - e.def.armor);
  d = Math.round(d);
  e.hp -= d; e.hitFlash = 0.12; e.aggro = true; e.target = p;
  G.float(e.x + (Math.random() - 0.5) * 8, e.y - e.h, crit ? d + '!' : '' + d, crit ? '#f5d33a' : element && ELEMENT_COLORS[element] ? ELEMENT_COLORS[element] : '#ffffff', crit ? 10 : 8);
  spawnParticles(e.x, e.y - e.h / 2, crit ? 10 : 5, ELEMENT_COLORS[element] || '#fff', { speed: 50, life: 0.35 });
  if (fx.knock && !e.def.boss) { const kx = fx.kx ?? (e.x - p.x), ky = fx.ky ?? (e.y - p.y); const l = Math.hypot(kx, ky) || 1; e.kvx = (e.kvx || 0) + kx / l * fx.knock; e.kvy = (e.kvy || 0) + ky / l * fx.knock; }
  if (fx.burn) e.burn = Math.max(e.burn || 0, fx.burn); if (fx.poison) e.poison = Math.max(e.poison || 0, fx.poison);
  if (fx.freeze && !e.def.boss) e.freeze = Math.max(e.freeze || 0, fx.freeze); else if (fx.freeze) e.slow = Math.max(e.slow || 0, fx.freeze);
  if (fx.shock) e.shock = Math.max(e.shock || 0, fx.shock); if (fx.root && !e.def.boss) e.root = Math.max(e.root || 0, fx.root);
  if (fx.stun && !e.def.boss) e.stun = Math.max(e.stun || 0, fx.stun); else if (fx.stun) e.stun = Math.max(e.stun || 0, fx.stun * 0.3);
  if (fx.slow) e.slow = Math.max(e.slow || 0, fx.slow);
  if (p.stats.lifesteal > 0) p.heal(d * p.stats.lifesteal, true);
  Audio.play('hit');
  if (e.hp <= 0) killEnemy(e, element);
  return d;
}
export function killEnemy(e, element) {
  if (e.dead) return; e.dead = true;
  const p = G.player;
  Audio.play(e.def.boss ? 'explode' : 'kill');
  spawnParticles(e.x, e.y - e.h / 2, e.def.boss ? 60 : 14, e.def.boss ? '#f5d33a' : '#d43a3a', { speed: e.def.boss ? 140 : 60, life: 0.6 });
  if (e.def.boss) { G.shake(16); spawnEffect('explosion', e.x, e.y - e.h / 2, { r: 60, color: '#fff8c0', dur: 0.6 }); }
  // xp
  const xp = Math.round(e.def.xp * (1 + p.stats.xp));
  p.gainXp(xp); p.gainWandXp(Math.round(e.def.xp * 0.6)); for (const pt of G.pets) if (!pt.ko) pt.gainXp(Math.round(e.def.xp * 0.5));
  if (p.buffs.lifesteal) p.heal(p.maxHp * 0.05);
  // drops
  const luck = 1 + p.stats.luck;
  for (const [id, mn, mx, ch] of e.def.drops || []) { if (Math.random() < (ch ?? 1) * luck) { const n = mn + Math.floor(Math.random() * (mx - mn + 1)); if (n > 0) G.dropItem(id, n, e.x + (Math.random() - 0.5) * 20, e.y + (Math.random() - 0.5) * 12); } }
  if (e.def.coins) { const [a, b] = e.def.coins; let c = Math.round((a + Math.random() * (b - a)) * (1 + p.stats.coinBonus)); if (c > 0) G.dropItem('coins', c, e.x, e.y); }
  if (Math.random() < 0.02 * luck) G.dropItem('egg_mystery', 1, e.x, e.y);
  if (Math.random() < 0.05 * luck && e.def.lvl >= 3) G.dropItem('magic_treat', 1, e.x, e.y);
  G.stats.kills++; if (e.def.boss) { G.stats.bossKills++; G.onBossKilled(e); }
  G.onKill(e);
}
export function damagePlayerFrom(src, dmg, element, fx = {}) { G.player.damage(dmg, element, src, fx); }

// ------------- spawn API -------------
export function spawnProjectile(o) {
  const p = { x: o.x, y: o.y, vx: o.vx, vy: o.vy, dmg: o.dmg, life: o.life || 1.5, r: o.r || 3, color: o.color || '#fff', element: o.element || 'neutral', owner: o.owner || 'player', pierce: o.pierce || 0, homing: o.homing || 0, effects: o.effects || {}, trail: o.trail !== false, size: o.size || 1, bounce: o.bounce || 0, explode: o.explode || 0, gravity: o.gravity || 0, hit: new Set(), t: 0, spray: o.spray, zap: o.zap, onExpire: o.onExpire, rainbow: o.rainbow, src: o.src };
  G.projectiles.push(p); if (G.projectiles.length > 600) G.projectiles.shift(); return p;
}
export function spawnParticles(x, y, n, color, o = {}) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (o.speed || 40) * (0.3 + Math.random() * 0.7); G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s + (o.vy || 0), life: (o.life || 0.5) * (0.5 + Math.random() * 0.5), max: o.life || 0.5, color: Array.isArray(color) ? color[Math.floor(Math.random() * color.length)] : color, size: o.size || (1 + Math.floor(Math.random() * 2)), gravity: o.gravity || 0, glow: o.glow }); }
  if (G.particles.length > 900) G.particles.splice(0, G.particles.length - 900);
}
export function spawnEffect(type, x, y, o = {}) { const e = { type, x, y, t: 0, ...o }; G.effects.push(e); return e; }
export function spawnHazard(o) { const h = { x: o.x, y: o.y, r: o.r || 40, dmg: o.dmg || 0, dur: o.dur || 3, tick: o.tick || 0.5, tt: 0, color: o.color || '#fff', element: o.element || 'neutral', owner: o.owner || 'player', effects: o.effects || {}, slow: o.slow, pull: o.pull, follow: o.follow, healPlayer: o.healPlayer, vx: o.vx || 0, vy: o.vy || 0, core: o.core, t: 0, hitTimers: new Map() }; G.hazards.push(h); return h; }
export function spawnAlly(type, x, y, dur) {
  const defs = { skeleton: { sprite: () => enemySprite('skeleton'), hp: 60, dmg: 10, spd: 80, ai: 'melee' }, sprout: { sprite: () => petSprite('treant_oak'), hp: 50, dmg: 8, spd: 0, ai: 'ranged', element: 'nature', color: '#8fe04a' }, clone: { sprite: () => G.player.sprite(), hp: 40, dmg: 0, spd: 0, ai: 'decoy', tint: '#5a2a8a', decoy: true }, mirror: { sprite: () => G.player.sprite(), hp: 30, dmg: 0, spd: 0, ai: 'mirror', tint: '#c070ff', decoy: true }, bee: { sprite: () => petSprite('bee_honey'), hp: 15, dmg: 5, spd: 140, ai: 'melee', fly: true }, wolf: { sprite: () => petSprite('wolf_spirit'), hp: 50, dmg: 12, spd: 120, ai: 'melee', tint: '#c8f0ff' }, ice_block: { sprite: () => objSprite('icespike'), hp: 80, dmg: 0, spd: 0, ai: 'static', decoy: true, solid: true }, tentacle: { sprite: () => petSprite('octo_kraken'), hp: 100, dmg: 14, spd: 0, ai: 'melee', tint: '#3a6ad4' } };
  const d = defs[type]; if (!d) return null;
  const a = { type, x, y, hp: d.hp * (1 + G.player.stats.petDmg * 0.5), maxHp: d.hp, dmg: d.dmg * (1 + G.player.stats.petDmg), spd: d.spd, ai: d.ai, dur, t: 0, r: 5, h: 12, cd: 0, decoy: d.decoy, tint: d.tint, element: d.element || 'neutral', color: d.color, fly: d.fly, spriteFn: d.sprite, face: 1 };
  G.allies.push(a); spawnParticles(x, y, 12, '#c070ff', { speed: 40, life: 0.4 }); return a;
}

// ------------- Enemy -------------
export class Enemy {
  constructor(id, x, y, opts = {}) {
    const d = ENEMIES[id]; this.id = id; this.def = d; this.x = x; this.y = y; this.sx = x; this.sy = y;
    const lvlScale = 1 + (G.player ? Math.max(0, G.player.level - d.lvl * 2) * 0.04 : 0);
    this.maxHp = Math.round(d.hp * lvlScale * (opts.hpMult || 1)); this.hp = this.maxHp; this.dmg = d.dmg * (1 + (lvlScale - 1) * 0.5);
    this.spd = d.spd; this.r = 5 * d.size; this.h = 12 * d.size; this.w = 12 * d.size; this.face = 1; this.cd = 0; this.t = Math.random() * 10;
    this.aggro = false; this.target = null; this.wander = { x: x, y: y, t: 0 }; this.hitFlash = 0; this.burn = 0; this.poison = 0; this.freeze = 0; this.shock = 0; this.root = 0; this.stun = 0; this.slow = 0; this.fear = 0; this.confused = 0; this.invuln = 0; this.kvx = 0; this.kvy = 0; this.dead = false;
    this.phase = 0; this.ptimer = 0; this.anim = 0; this.poi = opts.poi; this.spawnRef = opts.spawnRef; this.posHistory = { x, y }; this.histT = 0; this.jumpT = 0; this.burrowed = false;
  }
  get sprite() { return enemySprite(this.id); }
  update(dt) {
    if (G.timeStop > 0) { this.invuln = 0; return; }
    const p = G.player; this.t += dt; this.anim += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt; if (this.invuln > 0) this.invuln -= dt;
    this.histT += dt; if (this.histT > 5) { this.histT = 0; this.posHistory = { x: this.x, y: this.y }; }
    // statuses
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < dt * 4) { this.hp -= Math.max(1, Math.round(this.maxHp * 0.01 + 2)); spawnParticles(this.x, this.y - this.h / 2, 2, ['#ff6a1a', '#f5d33a'], { speed: 20, life: 0.4, vy: -30 }); if (this.hp <= 0) killEnemy(this, 'fire'); } }
    if (this.poison > 0) { this.poison -= dt; if (Math.random() < dt * 3) { this.hp -= Math.max(1, Math.round(this.maxHp * 0.008 + 2)); spawnParticles(this.x, this.y - this.h / 2, 2, '#8fe04a', { speed: 15, life: 0.5, vy: -20 }); if (this.hp <= 0) killEnemy(this, 'poison'); } }
    if (this.dead) return;
    if (this.shock > 0) this.shock -= dt; if (this.root > 0) this.root -= dt; if (this.fear > 0) this.fear -= dt; if (this.confused > 0) this.confused -= dt; if (this.slow > 0) this.slow -= dt;
    if (this.freeze > 0) { this.freeze -= dt; return; } if (this.stun > 0) { this.stun -= dt; return; }
    if (this.def.regen) this.hp = Math.min(this.maxHp, this.hp + this.def.regen * dt);
    // knockback
    if (Math.abs(this.kvx) > 1 || Math.abs(this.kvy) > 1) { tryMove(this, this.kvx * dt, this.kvy * dt, { fly: this.def.fly, swim: this.def.swim }); this.kvx *= 0.85; this.kvy *= 0.85; }
    const dist = Math.hypot(p.x - this.x, p.y - this.y);
    if (!this.aggro && dist < (this.def.boss ? 160 : 110) && !p.buffs.invis) this.aggro = true;
    if (this.aggro && dist > 420 && !this.def.boss) { this.aggro = false; this.target = null; }
    if (this.aggro && G.calmAura && dist < 90 && Math.random() < dt * 0.5) this.aggro = false;
    let speedMul = (G.timeSlow > 0 ? 0.3 : 1) * (this.slow > 0 ? 0.5 : 1) * tileSlow(this.x, this.y);
    if (this.cd > 0) this.cd -= dt;
    if (!this.aggro) { // wander
      this.wander.t -= dt; if (this.wander.t <= 0) { this.wander.t = 2 + Math.random() * 3; this.wander.x = this.sx + (Math.random() - 0.5) * 80; this.wander.y = this.sy + (Math.random() - 0.5) * 80; }
      const dx = this.wander.x - this.x, dy = this.wander.y - this.y, d = Math.hypot(dx, dy); if (d > 6) { tryMove(this, dx / d * this.spd * 0.4 * speedMul * dt, dy / d * this.spd * 0.4 * speedMul * dt, { fly: this.def.fly, swim: this.def.swim, avoidLava: true }); this.face = dx > 0 ? 1 : -1; }
      return;
    }
    // choose target
    this.target = nearestTarget(this.x, this.y, 400) || p;
    const tx = this.target.x, ty = this.target.y; let dx = tx - this.x, dy = ty - this.y; const d = Math.hypot(dx, dy) || 1;
    if (this.fear > 0) { dx = -dx; dy = -dy; } if (this.confused > 0) { const a = this.t * 3; dx = Math.cos(a); dy = Math.sin(a); }
    this.face = dx > 0 ? 1 : -1;
    const flags = { fly: this.def.fly, swim: this.def.swim, avoidLava: !this.def.fireproof && this.def.element !== 'fire' };
    if (this.def.boss) { const dSpawn = Math.hypot(this.x - this.sx, this.y - this.sy); if (d > 520 || dSpawn > 420) { this.x = this.sx; this.y = this.sy; this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.5); this.aggro = false; this.charge = 0; this.breath = 0; G.notify(`${this.def.name} returns to its lair.`, '#a8a8b8'); return; } this.bossAI(dt, d, dx, dy, speedMul); return; }
    const ai = this.def.ai;
    const move = (mul) => { if (this.root > 0) return; tryMove(this, dx / d * this.spd * mul * speedMul * dt, dy / d * this.spd * mul * speedMul * dt, flags); };
    if (ai === 'melee' || ai === 'jump' || ai === 'charge' || ai === 'swoop' || ai === 'burrow') {
      if (ai === 'jump') { this.jumpT -= dt; if (this.jumpT <= 0) { this.jumpT = 1.2; this.jumpV = 1; } if (this.jumpV > 0) { this.jumpV -= dt * 1.4; move(1.6); } }
      else if (ai === 'charge') { if (this.cd <= 0 && d < 140 && d > 40 && Math.random() < dt * 1.5) { this.charge = 0.5; this.cd = 3; this.cdx = dx / d; this.cdy = dy / d; } if (this.charge > 0) { this.charge -= dt; tryMove(this, this.cdx * this.spd * 3 * dt, this.cdy * this.spd * 3 * dt, flags); } else move(1); }
      else if (ai === 'swoop') { this.swoopT = (this.swoopT || 0) + dt; const sw = Math.sin(this.swoopT * 4) * 0.8; tryMove(this, (dx / d + -dy / d * sw) * this.spd * speedMul * dt, (dy / d + dx / d * sw) * this.spd * speedMul * dt, flags); }
      else if (ai === 'burrow') { this.burrowT = (this.burrowT || 0) + dt; if (this.burrowT > 4) { this.burrowed = !this.burrowed; this.burrowT = 0; if (!this.burrowed) { this.x = tx + (Math.random() - 0.5) * 40; this.y = ty + (Math.random() - 0.5) * 40; spawnParticles(this.x, this.y, 20, '#e8d8a0', { speed: 60, life: 0.5 }); G.shake(4); } } this.untargetable = this.burrowed; if (this.burrowed) { move(1.5); return; } else move(0.6); }
      else move(1);
      if (d < this.r + (this.target.r || 5) + 6 && this.cd <= 0) { this.cd = 1.0; this.attack(this.target); }
    } else if (ai === 'ranged') {
      if (d > 120) move(1); else if (d < 60) move(-0.7); else if (Math.random() < 0.02) move(0.5);
      if (this.cd <= 0 && d < 200) { this.cd = 1.6 + Math.random() * 0.6; this.shootAt(tx, ty); }
    } else if (ai === 'teleport') {
      this.tpT = (this.tpT || 0) + dt; if (this.tpT > 3) { this.tpT = 0; spawnParticles(this.x, this.y - 6, 12, '#a04ad8', { speed: 40, life: 0.4 }); const a = Math.random() * Math.PI * 2; this.x = tx + Math.cos(a) * 70; this.y = ty + Math.sin(a) * 70; spawnParticles(this.x, this.y - 6, 12, '#a04ad8', { speed: 40, life: 0.4 }); }
      if (d > 50) move(0.6); if (this.cd <= 0 && d < 180) { this.cd = 1.8; this.shootAt(tx, ty); }
    }
  }
  attack(target) {
    spawnParticles(target.x, target.y - 6, 4, '#d43a3a', { speed: 30, life: 0.3 });
    const fx = { burn: this.def.burn ? 2 : 0, poison: this.def.poison ? 3 : 0 };
    if (target === G.player) G.player.damage(this.dmg, this.def.element, this, fx); else if (target.takeDamage) target.takeDamage(this.dmg, this.def.element, this);
  }
  shootAt(tx, ty, opts = {}) {
    const pr = this.def.proj || { speed: 150, color: '#fff', r: 3 }; const dx = tx - this.x, dy = ty - (this.y - 6), d = Math.hypot(dx, dy) || 1;
    const n = opts.n || 1, spread = opts.spread || 0; const base = Math.atan2(dy, dx);
    for (let i = 0; i < n; i++) { const a = n === 1 ? base : base - spread / 2 + spread * i / (n - 1); spawnProjectile({ x: this.x, y: this.y - 6, vx: Math.cos(a) * (opts.speed || pr.speed), vy: Math.sin(a) * (opts.speed || pr.speed), dmg: this.dmg * (opts.mul || 0.8), life: opts.life || 2.5, r: pr.r || 3, color: pr.color, element: this.def.element, owner: 'enemy', effects: pr.effects || {}, homing: opts.homing ?? pr.homing ?? 0, bounce: pr.bounce || 0, explode: pr.explode || 0, size: pr.r > 3 ? 2 : 1, src: this }); }
    Audio.play('shoot2');
  }
  ring(n, speed = 120, mul = 0.7) { for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n + this.t; spawnProjectile({ x: this.x, y: this.y - 6, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: this.dmg * mul, life: 3, r: 4, color: (this.def.proj && this.def.proj.color) || ELEMENT_COLORS[this.def.element], element: this.def.element, owner: 'enemy', effects: (this.def.proj && this.def.proj.effects) || {}, size: 2, src: this }); } }
  summon(id, n, hpMult = 1) { for (let i = 0; i < n; i++) { const a = Math.PI * 2 * i / n; const e = new Enemy(id, this.x + Math.cos(a) * 30, this.y + Math.sin(a) * 30, { hpMult }); e.aggro = true; e.minion = true; G.enemies.push(e); spawnParticles(e.x, e.y, 10, '#a04ad8', { speed: 40, life: 0.4 }); } }
  bossAI(dt, d, dx, dy, speedMul) {
    const p = G.player; const flags = { fly: this.def.fly, swim: this.def.swim };
    const move = (mul) => tryMove(this, dx / d * this.spd * mul * speedMul * dt, dy / d * this.spd * mul * speedMul * dt, flags);
    this.ptimer -= dt; const hpPct = this.hp / this.maxHp; const tx = this.target.x, ty = this.target.y;
    const melee = () => { if (d < this.r + 10 && this.cd <= 0) { this.cd = 1.2; this.attack(this.target); } };
    const ai = this.def.ai;
    if (ai === 'boss_slime') {
      if (!this.split1 && hpPct < 0.66) { this.split1 = true; this.summon('slime', 4); G.notify('The Slime King splits!', '#8fe04a'); } if (!this.split2 && hpPct < 0.33) { this.split2 = true; this.summon('slime_blue', 4); }
      this.jumpT -= dt; if (this.jumpT <= 0) { this.jumpT = 2; this.jumpV = 1; if (d < 90) { this.cd = 0; } }
      if (this.jumpV > 0) { this.jumpV -= dt * 1.6; move(2.2); if (this.jumpV <= 0) { G.shake(8); spawnEffect('ring', this.x, this.y, { r: 50, color: '#8fe04a', dur: 0.4 }); if (d < 56) p.damage(this.dmg * 1.3, 'nature', this, { knock: 200 }); if (this.ptimer <= 0) { this.ptimer = 5; this.ring(10, 110); } } }
      melee();
    } else if (ai === 'boss_warlord') {
      if (hpPct < 0.3 && !this.enraged) { this.enraged = true; this.spd *= 1.4; this.dmg *= 1.3; G.notify('The Warlord is ENRAGED!', '#d43a3a'); }
      if (this.ptimer <= 0) { this.ptimer = 4; const r = Math.random(); if (r < 0.4 && d > 50) { this.charge = 0.7; this.cdx = dx / d; this.cdy = dy / d; } else if (r < 0.7 && G.enemies.filter(e => e.minion && !e.dead).length < 6) this.summon('goblin', 3); else this.ring(12, 140, 0.8); }
      if (this.charge > 0) { this.charge -= dt; tryMove(this, this.cdx * this.spd * 3.5 * dt, this.cdy * this.spd * 3.5 * dt, flags); if (d < 20 && this.cd <= 0) { this.cd = 0.8; p.damage(this.dmg * 1.5, 'neutral', this, { knock: 250 }); } } else move(1);
      melee();
    } else if (ai === 'boss_lich') {
      if (d > 80) move(0.6); else if (d < 40) move(-0.8);
      if (this.ptimer <= 0) { this.ptimer = 3; const r = Math.random(); if (r < 0.35) this.shootAt(tx, ty, { n: 5, spread: 0.8, homing: 1.5 }); else if (r < 0.55 && G.enemies.filter(e => e.minion && !e.dead).length < 6) this.summon('skeleton', 3); else if (r < 0.8) spawnHazard({ x: tx, y: ty, r: 44, dmg: this.dmg * 0.4, dur: 4, tick: 0.5, color: '#c8f0ff', element: 'ice', owner: 'enemy', effects: { freeze: 1 }, slow: 0.5 }); else { spawnParticles(this.x, this.y - 10, 20, '#a04ad8', { speed: 50, life: 0.4 }); const a = Math.random() * Math.PI * 2; this.x = tx + Math.cos(a) * 100; this.y = ty + Math.sin(a) * 100; } }
      if (this.cd <= 0 && d < 220) { this.cd = 1.4; this.shootAt(tx, ty); }
    } else if (ai === 'boss_dragon') {
      if (!this.half && hpPct < 0.5) { this.half = true; this.summon('drake', 2); G.notify('Ignis calls her brood!', '#ff6a1a'); }
      if (this.ptimer <= 0) { this.ptimer = 3.5; const r = Math.random(); if (r < 0.4) { this.breath = 1.2; } else if (r < 0.7) { for (let i = 0; i < 6; i++) { const mx = tx + (Math.random() - 0.5) * 160, my = ty + (Math.random() - 0.5) * 120; spawnEffect('target', mx, my, { r: 30, color: '#ff6a1a', dur: 0.8 }); spawnEffect('delayed', mx, my, { delay: 0.8, fn: () => { spawnEffect('explosion', mx, my, { r: 30, color: '#ff6a1a', dur: 0.4 }); if (Math.hypot(p.x - mx, p.y - my) < 34) p.damage(this.dmg * 1.2, 'fire', this, { burn: 3 }); G.shake(5); } }); } } else { this.charge = 0.8; this.cdx = dx / d; this.cdy = dy / d; } }
      if (this.breath > 0) { this.breath -= dt; if (Math.random() < dt * 14) this.shootAt(tx + (Math.random() - 0.5) * 40, ty + (Math.random() - 0.5) * 40, { mul: 0.45, speed: 220, life: 0.8 }); }
      else if (this.charge > 0) { this.charge -= dt; tryMove(this, this.cdx * this.spd * 3 * dt, this.cdy * this.spd * 3 * dt, flags); if (d < 24 && this.cd <= 0) { this.cd = 0.8; p.damage(this.dmg * 1.4, 'fire', this, { knock: 240, burn: 2 }); } }
      else { if (d > 70) move(1); else if (d < 40) move(-0.5); }
      melee();
    } else if (ai === 'boss_kraken') {
      this.subT = (this.subT || 0) + dt; if (this.subT > 10) { this.subT = 0; this.submerged = !this.submerged; this.untargetable = this.submerged; this.invuln = this.submerged ? 4 : 0; if (this.submerged) { spawnParticles(this.x, this.y, 30, '#3a6ad4', { speed: 60, life: 0.6 }); this.x = tx + (Math.random() - 0.5) * 120; this.y = ty + (Math.random() - 0.5) * 80; } else { spawnEffect('ring', this.x, this.y, { r: 70, color: '#3a6ad4', dur: 0.5 }); if (d < 70) p.damage(this.dmg, 'water', this, { knock: 200 }); G.shake(10); } }
      if (this.submerged) { if (this.subT > 3.9) this.invuln = 0.2; return; }
      if (this.ptimer <= 0) { this.ptimer = 3; const r = Math.random(); if (r < 0.4) this.shootAt(tx, ty, { n: 7, spread: 1.2, mul: 0.6 }); else if (r < 0.7) spawnHazard({ x: tx, y: ty, r: 60, dmg: this.dmg * 0.3, dur: 4, tick: 0.5, color: '#3a6ad4', element: 'water', owner: 'enemy', pull: 80 }); else { for (let i = 0; i < 3; i++) { const a = Math.random() * Math.PI * 2; const e = new Enemy('water_elemental', this.x + Math.cos(a) * 40, this.y + Math.sin(a) * 40); e.aggro = true; e.minion = true; G.enemies.push(e); } } }
      if (d > 60) move(0.8); melee();
    } else if (ai === 'boss_titan') {
      if (this.ptimer <= 0) { this.ptimer = 3.5; const r = Math.random(); if (r < 0.35 && d < 90) { G.shake(14); spawnEffect('ring', this.x, this.y, { r: 90, color: '#c8f0ff', dur: 0.5 }); if (d < 90) p.damage(this.dmg * 1.2, 'ice', this, { knock: 220, stun: 1 }); } else if (r < 0.65) this.ring(14, 130, 0.7); else spawnHazard({ x: tx, y: ty, r: 56, dmg: this.dmg * 0.35, dur: 5, tick: 0.5, color: '#c8f0ff', element: 'ice', owner: 'enemy', effects: { freeze: 1 }, slow: 0.5 }); }
      if (!this.half && hpPct < 0.5) { this.half = true; this.summon('ice_elemental', 2); }
      move(1); melee();
    } else if (ai === 'boss_void') {
      if (!this.p2 && hpPct < 0.5) { this.p2 = true; G.notify('The Void Lord opens the abyss!', '#a04ad8'); this.summon('void_wraith', 3); }
      this.tpT = (this.tpT || 0) + dt; if (this.tpT > 4) { this.tpT = 0; spawnParticles(this.x, this.y - 10, 20, '#5a2a8a', { speed: 60, life: 0.5 }); const a = Math.random() * Math.PI * 2; this.x = tx + Math.cos(a) * 90; this.y = ty + Math.sin(a) * 90; }
      if (this.ptimer <= 0) { this.ptimer = this.p2 ? 2.2 : 3; const r = Math.random(); if (r < 0.4) this.shootAt(tx, ty, { n: 6, spread: 1.0, homing: 2.5, mul: 0.7 }); else if (r < 0.7) spawnHazard({ x: tx + (Math.random() - 0.5) * 60, y: ty + (Math.random() - 0.5) * 60, r: 50, dmg: this.dmg * 0.4, dur: 4, tick: 0.4, color: '#5a2a8a', element: 'dark', owner: 'enemy', pull: 100 }); else this.ring(16, 150, 0.6); }
      if (d > 90) move(0.7); if (this.cd <= 0 && d < 260) { this.cd = 1.2; this.shootAt(tx, ty, { homing: 2 }); }
    } else if (ai === 'boss_jester') {
      if (this.ptimer <= 0) { this.ptimer = 2.5; const r = Math.random(); if (r < 0.25) { const ox = this.x, oy = this.y; this.x = p.x; this.y = p.y; p.teleport(ox, oy); G.notify('Swapped!', '#ff3a7a'); } else if (r < 0.5) { for (let i = 0; i < 8; i++) spawnProjectile({ x: this.x, y: this.y - 6, vx: (Math.random() - 0.5) * 300, vy: (Math.random() - 0.5) * 300, dmg: this.dmg * 0.6, life: 4, r: 4, color: ['#ff3a7a', '#f5d33a', '#5ad8f0'][i % 3], element: 'chaos', owner: 'enemy', bounce: 5, size: 2, src: this }); } else if (r < 0.75) { this.summon(['goblin', 'slime', 'skeleton', 'bandit'][Math.floor(Math.random() * 4)], 3); } else { this.ring(20, 160, 0.5); } }
      this.swoopT = (this.swoopT || 0) + dt; const sw = Math.sin(this.swoopT * 3); tryMove(this, (dx / d + -dy / d * sw) * this.spd * speedMul * dt, (dy / d + dx / d * sw) * this.spd * speedMul * dt, flags);
      melee();
    } else if (ai === 'boss_golem') {
      if (this.ptimer <= 0) { this.ptimer = 4; const r = Math.random(); if (r < 0.4) { for (let i = 0; i < 3; i++) spawnProjectile({ x: this.x, y: this.y - 10, vx: dx / d * 140 + (Math.random() - 0.5) * 60, vy: dy / d * 140 + (Math.random() - 0.5) * 60, dmg: this.dmg * 1.2, life: 3, r: 6, color: '#a8a8b8', element: 'earth', owner: 'enemy', size: 3, effects: { knock: 200 }, src: this }); } else if (r < 0.7) { G.shake(16); spawnEffect('ring', this.x, this.y, { r: 120, color: '#b8541a', dur: 0.6 }); if (d < 120) p.damage(this.dmg * 0.8, 'earth', this, { stun: 1.5 }); } else if (G.enemies.filter(e => e.minion && !e.dead).length < 4) this.summon('golem', 2, 0.5); }
      move(1); melee();
    } else if (ai === 'boss_spider') {
      if (this.ptimer <= 0) { this.ptimer = 3; const r = Math.random(); if (r < 0.4) spawnHazard({ x: tx, y: ty, r: 50, dmg: this.dmg * 0.15, dur: 6, tick: 0.5, color: '#e8e8f0', element: 'poison', owner: 'enemy', slow: 0.35 }); else if (r < 0.7 && G.enemies.filter(e => e.minion && !e.dead).length < 8) this.summon('spider', 4); else this.shootAt(tx, ty, { n: 5, spread: 0.9 }); }
      if (this.cd <= 0 && d < 90 && d > 30 && Math.random() < dt) { this.charge = 0.4; this.cdx = dx / d; this.cdy = dy / d; this.cd = 2; }
      if (this.charge > 0) { this.charge -= dt; tryMove(this, this.cdx * this.spd * 3 * dt, this.cdy * this.spd * 3 * dt, flags); if (d < 20) { p.damage(this.dmg, 'poison', this, { poison: 4 }); this.charge = 0; } } else move(1);
      melee();
    }
  }
  draw(ctx, cx, cy) {
    if (this.untargetable && this.def.ai !== 'boss_kraken') { ctx.globalAlpha = 0.25; }
    if (this.submerged) ctx.globalAlpha = 0.2;
    let spr = this.sprite; if (this.face < 0) spr = flipSprite(spr);
    if (this.hitFlash > 0) spr = silhouette(spr, '#ffffff'); else if (this.freeze > 0) spr = tintSprite(spr, '#5ad8f0', 0.6); else if (this.poison > 0) spr = tintSprite(spr, '#8fe04a', 0.35); else if (this.burn > 0) spr = tintSprite(spr, '#ff6a1a', 0.3); else if (this.shock > 0) spr = tintSprite(spr, '#f5d33a', 0.3);
    const s = this.def.size; const w = spr.width * s, h = spr.height * s;
    const bob = this.def.fly ? Math.sin(this.anim * 6) * 2 - 6 : (this.jumpV > 0 ? -Math.sin(this.jumpV * Math.PI) * 10 : 0);
    drawShadow(ctx, this.x - cx, this.y - cy, w * 0.8);
    ctx.drawImage(spr, Math.round(this.x - cx - w / 2), Math.round(this.y - cy - h + 2 + bob), w, h);
    ctx.globalAlpha = 1;
    if (this.hp < this.maxHp && !this.def.boss) { const bw = Math.max(12, w); const bx = Math.round(this.x - cx - bw / 2), by = Math.round(this.y - cy - h - 4 + bob); ctx.fillStyle = '#10101a'; ctx.fillRect(bx - 1, by - 1, bw + 2, 4); ctx.fillStyle = '#d43a3a'; ctx.fillRect(bx, by, Math.round(bw * this.hp / this.maxHp), 2); }
    if (this.stun > 0) { ctx.fillStyle = '#f5d33a'; for (let i = 0; i < 3; i++) { const a = this.anim * 5 + i * 2.1; ctx.fillRect(Math.round(this.x - cx + Math.cos(a) * 7), Math.round(this.y - cy - h - 2 + bob + Math.sin(a) * 2), 2, 2); } }
    if (this.root > 0) { ctx.fillStyle = '#3c8a2e'; for (let i = 0; i < 4; i++) ctx.fillRect(Math.round(this.x - cx - 6 + i * 4), Math.round(this.y - cy - 2), 2, 3); }
  }
}

// ------------- Pet (companion) -------------
export class Pet {
  constructor(data, x, y) { // data: {id, lvl, xp, name?}
    this.data = data; this.def = PETS[data.id]; this.x = x; this.y = y; this.r = 5; this.h = 12; this.face = 1; this.cd = 0; this.abilT = 0; this.anim = Math.random() * 10; this.ko = false; this.koT = 0; this.riding = false; this.hitFlash = 0;
    this.recalc();
    this.hp = this.maxHp;
  }
  get lvl() { return this.data.lvl || 1; }
  recalc() { const p = G.player; const lv = this.lvl; this.maxHp = Math.round(this.def.hp * (1 + (lv - 1) * 0.1) * (1 + (p ? p.stats.petHp : 0))); this.dmg = this.def.dmg * (1 + (lv - 1) * 0.08) * (1 + (p ? p.stats.petDmg : 0)); this.spd = this.def.spd; if (this.hp > this.maxHp) this.hp = this.maxHp; }
  gainXp(n) { this.data.xp = (this.data.xp || 0) + n; const need = Math.floor(30 * Math.pow(this.lvl, 1.5)); if (this.data.xp >= need) { this.data.xp -= need; this.data.lvl = this.lvl + 1; this.recalc(); this.hp = this.maxHp; G.notify(`${this.data.name || this.def.name} reached level ${this.lvl}!`, '#8fe04a'); G.float(this.x, this.y - 16, 'LEVEL UP', '#8fe04a'); Audio.play('levelup'); G.player.recalc(); } }
  takeDamage(d, element, src) { if (this.ko || this.riding) return; d = Math.max(1, Math.round(d * elementMult(element, this.def.element) * 0.7)); this.hp -= d; this.hitFlash = 0.1; G.float(this.x, this.y - 14, '' + d, '#f5a0a0', 7); if (this.def.abil === 'thorns' && src && src.hp !== undefined && src.def) hitEnemy(src, this.dmg * 0.8, this.def.element, { noCrit: true }); if (this.hp <= 0) { this.ko = true; this.koT = 30; this.hp = 0; G.notify(`${this.data.name || this.def.name} is knocked out! Returns in 30s.`, '#d43a3a'); } }
  update(dt) {
    const p = G.player; this.anim += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.ko) { this.koT -= dt; this.x = p.x; this.y = p.y; if (this.koT <= 0) { this.ko = false; this.hp = this.maxHp * 0.5; G.notify(`${this.data.name || this.def.name} is back!`, '#8fe04a'); } return; }
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.01 * dt);
    if (this.riding) { this.x = p.x; this.y = p.y; this.face = p.face; return; }
    if (this.cd > 0) this.cd -= dt; this.abilT += dt;
    const flags = { fly: this.def.fly, swim: this.def.swim, avoidLava: this.def.element !== 'fire' };
    const dp = Math.hypot(p.x - this.x, p.y - this.y);
    if (dp > 300) { this.x = p.x; this.y = p.y; }
    const attackTypes = ['bite', 'charge', 'shoot', 'shoot3', 'breath', 'spores'];
    let target = null; if (attackTypes.includes(this.def.abil) && dp < 200) target = nearestEnemy(this.x, this.y, 130);
    if (target) {
      const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy) || 1; this.face = dx > 0 ? 1 : -1;
      const ranged = ['shoot', 'shoot3', 'breath', 'spores'].includes(this.def.abil);
      if (ranged) { if (d > 90) tryMove(this, dx / d * this.spd * dt, dy / d * this.spd * dt, flags); if (this.cd <= 0) { this.cd = this.def.abil === 'breath' ? 0.5 : 1.4; const n = this.def.abil === 'shoot3' ? 3 : this.def.abil === 'breath' ? 2 : 1; for (let i = 0; i < n; i++) { const a = Math.atan2(dy, dx) + (i - (n - 1) / 2) * 0.25; spawnProjectile({ x: this.x, y: this.y - 5, vx: Math.cos(a) * 200, vy: Math.sin(a) * 200, dmg: this.dmg * (this.def.abil === 'breath' ? 0.6 : 1), life: 1.2, r: 3, color: ELEMENT_COLORS[this.def.element] || '#fff', element: this.def.element, owner: 'pet', effects: this.def.abil === 'spores' ? { poison: 3 } : this.def.element === 'fire' ? { burn: 2 } : this.def.element === 'ice' ? { freeze: 1 } : {}, trail: true }); } } }
      else { if (d > this.r + target.r + 2) tryMove(this, dx / d * this.spd * (this.def.abil === 'charge' ? 1.4 : 1) * dt, dy / d * this.spd * dt, flags); else if (this.cd <= 0) { this.cd = 1; hitEnemy(target, this.dmg, this.def.element, { noCrit: true, knock: this.def.abil === 'charge' ? 150 : 40, kx: dx, ky: dy }); } }
    } else {
      const want = 22; if (dp > want) { const dx = p.x - this.x, dy = p.y - this.y; const sp = Math.min(this.spd * 1.3, dp * 4); tryMove(this, dx / dp * sp * dt, dy / dp * sp * dt, flags); this.face = dx > 0 ? 1 : -1; }
    }
    // periodic abilities
    const ab = this.def.abil; const lvB = 1 + this.lvl * 0.05;
    if (ab === 'heal' && this.abilT > 6) { this.abilT = 0; if (p.hp < p.maxHp) { p.heal(p.maxHp * 0.05 * lvB + 5); spawnParticles(p.x, p.y - 8, 8, '#8fe04a', { speed: 20, life: 0.6, vy: -30 }); } }
    if (ab === 'shield' && this.abilT > 15) { this.abilT = 0; p.addShield(15 + this.lvl * 3, 10); }
    if (ab === 'roar' && this.abilT > 8) { const es = enemiesInRadius(this.x, this.y, 70); if (es.length) { this.abilT = 0; for (const e of es) { e.stun = Math.max(e.stun, 1.5); } spawnEffect('ring', this.x, this.y, { r: 70, color: '#f5d33a', dur: 0.4 }); } }
    if (ab === 'slow') for (const e of enemiesInRadius(this.x, this.y, 60)) e.slow = Math.max(e.slow, 0.3);
    if (ab === 'calm') G.calmAura = true;
    if (ab === 'dig' && this.abilT > 25) { this.abilT = 0; const pool = ['stone', 'copper_ore', 'iron_ore', 'coal', 'bone', 'ancient_coin', 'crystal', 'gold_ore', 'seed']; G.dropItem(pool[Math.floor(Math.random() * pool.length)], 1, this.x, this.y); spawnParticles(this.x, this.y, 8, '#8a5a2a', { speed: 30, life: 0.4 }); }
    if (ab === 'magnet') for (const d of G.drops) { const dd = Math.hypot(d.x - this.x, d.y - this.y); if (dd < 100) { d.x += (p.x - d.x) / dd * 160 * dt; d.y += (p.y - d.y) / dd * 160 * dt; } }
  }
  draw(ctx, cx, cy) {
    if (this.ko) return;
    let spr = petSprite(this.def.id); if (this.face < 0) spr = flipSprite(spr); if (this.hitFlash > 0) spr = silhouette(spr, '#fff');
    const s = this.def.size || 1; const w = spr.width * s, h = spr.height * s; const bob = this.def.fly ? Math.sin(this.anim * 6) * 2 - 5 : Math.abs(Math.sin(this.anim * 8)) * (this.riding ? 0 : 1);
    if (!this.riding) drawShadow(ctx, this.x - cx, this.y - cy, w * 0.8);
    ctx.drawImage(spr, Math.round(this.x - cx - w / 2), Math.round(this.y - cy - h + 3 - bob), w, h);
    if (this.hp < this.maxHp && !this.riding) { const bx = Math.round(this.x - cx - 6), by = Math.round(this.y - cy - h - 3); ctx.fillStyle = '#10101a'; ctx.fillRect(bx - 1, by - 1, 14, 4); ctx.fillStyle = '#8fe04a'; ctx.fillRect(bx, by, Math.round(12 * this.hp / this.maxHp), 2); }
  }
}

// ------------- Wild pet (tameable) -------------
export class WildPet {
  constructor(id, x, y, spawnRef) { this.id = id; this.def = PETS[id]; this.x = x; this.y = y; this.sx = x; this.sy = y; this.r = 5; this.h = 12; this.face = 1; this.anim = Math.random() * 10; this.wander = { x, y, t: 0 }; this.spawnRef = spawnRef; this.flee = 0; this.heart = 0; }
  update(dt) {
    this.anim += dt; const p = G.player; const dp = Math.hypot(p.x - this.x, p.y - this.y);
    if (this.heart > 0) this.heart -= dt;
    this.wander.t -= dt; if (this.wander.t <= 0) { this.wander.t = 1.5 + Math.random() * 3; this.wander.x = this.sx + (Math.random() - 0.5) * 70; this.wander.y = this.sy + (Math.random() - 0.5) * 70; }
    const dx = this.wander.x - this.x, dy = this.wander.y - this.y, d = Math.hypot(dx, dy);
    if (this.flee > 0) { this.flee -= dt; const fx = this.x - p.x, fy = this.y - p.y, fd = Math.hypot(fx, fy) || 1; tryMove(this, fx / fd * this.def.spd * dt, fy / fd * this.def.spd * dt, { fly: this.def.fly, swim: this.def.swim, avoidLava: true }); this.face = fx > 0 ? 1 : -1; }
    else if (d > 4 && this.wander.t < 2.5) { tryMove(this, dx / d * this.def.spd * 0.35 * dt, dy / d * this.def.spd * 0.35 * dt, { fly: this.def.fly, swim: this.def.swim, avoidLava: true }); this.face = dx > 0 ? 1 : -1; }
  }
  draw(ctx, cx, cy) {
    let spr = petSprite(this.id); if (this.face < 0) spr = flipSprite(spr); const s = this.def.size || 1; const w = spr.width * s, h = spr.height * s; const bob = this.def.fly ? Math.sin(this.anim * 6) * 2 - 5 : 0;
    drawShadow(ctx, this.x - cx, this.y - cy, w * 0.8);
    ctx.drawImage(spr, Math.round(this.x - cx - w / 2), Math.round(this.y - cy - h + 3 + bob), w, h);
    if (this.heart > 0) { ctx.fillStyle = '#f07ad0'; const hy = this.y - cy - h - 4 - (1 - this.heart) * 6; ctx.fillRect(this.x - cx - 2, hy, 2, 2); ctx.fillRect(this.x - cx + 1, hy, 2, 2); ctx.fillRect(this.x - cx - 2, hy + 1, 5, 2); ctx.fillRect(this.x - cx - 1, hy + 3, 3, 1); ctx.fillRect(this.x - cx, hy + 4, 1, 1); }
    const dp = Math.hypot(G.player.x - this.x, G.player.y - this.y);
    if (dp < 40) { const col = RARITY_COLORS[this.def.rarity]; ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(this.def.name, Math.round(this.x - cx) + 1, Math.round(this.y - cy - h - 6 + bob) + 1); ctx.fillStyle = col; ctx.fillText(this.def.name, Math.round(this.x - cx), Math.round(this.y - cy - h - 6 + bob)); }
  }
}

// ------------- NPC entity -------------
export class NPCEnt {
  constructor(id, x, y, poi) { this.id = id; this.def = NPCS[id]; this.x = x; this.y = y; this.sx = x; this.sy = y; this.poi = poi; this.r = 5; this.h = 13; this.anim = Math.random() * 10; this.face = 1; this.wt = 0; }
  update(dt) { this.anim += dt; this.wt -= dt; if (this.wt <= 0) { this.wt = 2 + Math.random() * 4; this.tx = this.sx + (Math.random() - 0.5) * 24; this.ty = this.sy + (Math.random() - 0.5) * 24; } if (this.tx !== undefined) { const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy); if (d > 2 && !G.dialog) { tryMove(this, dx / d * 20 * dt, dy / d * 20 * dt); this.face = dx > 0 ? 1 : -1; } } }
  draw(ctx, cx, cy) { let spr = npcSprite(this.id); if (this.face < 0) spr = flipSprite(spr); drawShadow(ctx, this.x - cx, this.y - cy, 10); ctx.drawImage(spr, Math.round(this.x - cx - spr.width / 2), Math.round(this.y - cy - spr.height + 2)); const dp = Math.hypot(G.player.x - this.x, G.player.y - this.y); const qs = G.questMarker ? G.questMarker(this.id) : null; if (qs) { ctx.font = '8px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(qs, Math.round(this.x - cx) + 1, Math.round(this.y - cy - spr.height - 8 + Math.sin(this.anim * 3) * 2) + 1); ctx.fillStyle = qs === '!' ? '#f5d33a' : '#8fe04a'; ctx.fillText(qs, Math.round(this.x - cx), Math.round(this.y - cy - spr.height - 8 + Math.sin(this.anim * 3) * 2)); } if (dp < 40) { ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'center'; ctx.fillStyle = '#000'; ctx.fillText(this.def.name, Math.round(this.x - cx) + 1, Math.round(this.y - cy - spr.height - 4) + 1); ctx.fillStyle = '#fff8c0'; ctx.fillText(this.def.name, Math.round(this.x - cx), Math.round(this.y - cy - spr.height - 4)); } }
}

// ------------- Drops -------------
export class Drop { constructor(id, n, x, y) { this.id = id; this.n = n; this.x = x; this.y = y; this.vx = (Math.random() - 0.5) * 60; this.vy = -40 - Math.random() * 30; this.z = 0; this.t = 0; this.life = 240; this.anim = Math.random() * 10; } }

// ------------- update all -------------
export function updateEntities(dt) {
  const p = G.player; const w = G.world;
  G.calmAura = false;
  for (const e of G.enemies) e.update(dt);
  G.enemies = G.enemies.filter(e => !e.dead);
  for (const pt of G.pets) pt.update(dt);
  for (const wp of G.wildPets) wp.update(dt);
  for (const n of G.npcs) n.update(dt);
  // allies
  for (const a of G.allies) {
    a.t += dt; if (a.cd > 0) a.cd -= dt;
    if (a.ai === 'melee') { const e = nearestEnemy(a.x, a.y, 160); if (e) { const dx = e.x - a.x, dy = e.y - a.y, d = Math.hypot(dx, dy) || 1; a.face = dx > 0 ? 1 : -1; if (d > e.r + 6) tryMove(a, dx / d * a.spd * dt, dy / d * a.spd * dt, { fly: a.fly }); else if (a.cd <= 0) { a.cd = 0.9; hitEnemy(e, a.dmg, a.element, { noCrit: true, knock: 40, kx: dx, ky: dy }); } } else { const dx = p.x - a.x, dy = p.y - a.y, d = Math.hypot(dx, dy); if (d > 30) tryMove(a, dx / d * a.spd * dt, dy / d * a.spd * dt, { fly: a.fly }); } }
    else if (a.ai === 'ranged') { const e = nearestEnemy(a.x, a.y, 180); if (e && a.cd <= 0) { a.cd = 1.2; const dx = e.x - a.x, dy = e.y - (a.y - 5), d = Math.hypot(dx, dy) || 1; a.face = dx > 0 ? 1 : -1; spawnProjectile({ x: a.x, y: a.y - 5, vx: dx / d * 200, vy: dy / d * 200, dmg: a.dmg, life: 1.2, r: 3, color: a.color, element: a.element, owner: 'pet', effects: { poison: 2 } }); } }
    else if (a.ai === 'mirror') { if (p.shootDir && a.cd <= 0 && p.lastShot < 0.1) { a.cd = 0.35; spawnProjectile({ x: a.x, y: a.y - 5, vx: p.shootDir.x * 220, vy: p.shootDir.y * 220, dmg: p.wandDmg() * 0.5, life: 1.2, r: 3, color: '#c070ff', element: 'arcane', owner: 'pet' }); } }
  }
  G.allies = G.allies.filter(a => a.t < a.dur && a.hp > 0);
  // projectiles
  for (const pr of G.projectiles) {
    pr.t += dt; pr.life -= dt; if (pr.life <= 0) { pr.dead = true; if (pr.onExpire) pr.onExpire(pr); if (pr.explode) explodeAt(pr); continue; }
    if (pr.homing) { let tgt = null; if (pr.owner === 'enemy') tgt = p; else tgt = nearestEnemy(pr.x, pr.y, 140); if (tgt) { const dx = tgt.x - pr.x, dy = tgt.y - 6 - pr.y, d = Math.hypot(dx, dy) || 1; const sp = Math.hypot(pr.vx, pr.vy); pr.vx += dx / d * sp * pr.homing * dt; pr.vy += dy / d * sp * pr.homing * dt; const ns = Math.hypot(pr.vx, pr.vy) || 1; pr.vx = pr.vx / ns * sp; pr.vy = pr.vy / ns * sp; } }
    if (pr.gravity) pr.vy += pr.gravity * dt;
    const nx = pr.x + pr.vx * dt, ny = pr.y + pr.vy * dt;
    const tx = Math.floor(nx / 16), ty = Math.floor(ny / 16);
    const tdef = TILE_DEFS[w.get(tx, ty)]; const ob = w.obj(tx, ty);
    const blocked = (tdef.wall) || (ob && OBJ[ob].solid && !OBJ[ob].harvest && ob !== 'chest' && ob !== 'gold_chest') || !w.inb(tx, ty);
    if (blocked) {
      if (pr.bounce > 0) { pr.bounce--; const ox = Math.floor(pr.x / 16), oy = Math.floor(pr.y / 16); if (ox !== tx) pr.vx = -pr.vx; if (oy !== ty) pr.vy = -pr.vy; if (ox === tx && oy === ty) { pr.vx = -pr.vx; pr.vy = -pr.vy; } spawnParticles(pr.x, pr.y, 3, pr.color, { speed: 30, life: 0.2 }); continue; }
      pr.dead = true; spawnParticles(pr.x, pr.y, 4, pr.color, { speed: 40, life: 0.25 }); if (pr.explode) explodeAt(pr); continue;
    }
    pr.x = nx; pr.y = ny;
    if (pr.trail && Math.random() < 0.6) G.particles.push({ x: pr.x, y: pr.y, vx: (Math.random() - 0.5) * 10, vy: (Math.random() - 0.5) * 10, life: 0.25, max: 0.25, color: pr.rainbow ? `hsl(${(pr.t * 500) % 360},100%,60%)` : pr.color, size: 1 });
    if (pr.spray) { pr.sprayT = (pr.sprayT || 0) + dt; if (pr.sprayT > pr.spray.every) { pr.sprayT = 0; for (let i = 0; i < pr.spray.n; i++) { const a = Math.random() * Math.PI * 2; spawnProjectile({ x: pr.x, y: pr.y, vx: Math.cos(a) * pr.spray.speed, vy: Math.sin(a) * pr.spray.speed, dmg: pr.spray.dmg, life: 0.7, r: 2, color: pr.spray.color, element: pr.spray.element, owner: pr.owner, effects: pr.effects }); } } }
    if (pr.zap) { pr.zapT = (pr.zapT || 0) + dt; if (pr.zapT > pr.zap.every) { pr.zapT = 0; const e = nearestEnemy(pr.x, pr.y, pr.zap.range); if (e) { spawnEffect('bolt', pr.x, pr.y, { x2: e.x, y2: e.y - 6, color: pr.color, dur: 0.15 }); hitEnemy(e, pr.zap.dmg, 'lightning', { shock: 0.5 }); } } }
    // collisions
    if (pr.owner === 'enemy') {
      if (!p.dead && p.invuln <= 0 && !p.buffs.ghost && Math.hypot(p.x - pr.x, p.y - 6 - pr.y) < pr.r + 5) { p.damage(pr.dmg, pr.element, pr.src, pr.effects); pr.dead = true; if (pr.explode) explodeAt(pr); continue; }
      for (const pt of G.pets) { if (pt.ko || pt.riding) continue; if (Math.hypot(pt.x - pr.x, pt.y - 5 - pr.y) < pr.r + 5) { pt.takeDamage(pr.dmg, pr.element, pr.src); pr.dead = true; break; } }
      for (const a of G.allies) { if (Math.hypot(a.x - pr.x, a.y - 5 - pr.y) < pr.r + 5) { a.hp -= pr.dmg; pr.dead = true; break; } }
    } else {
      for (const e of G.enemies) {
        if (e.dead || pr.hit.has(e) || e.untargetable) continue;
        if (Math.hypot(e.x - pr.x, e.y - e.h / 2 - pr.y) < pr.r + e.r + 2) {
          hitEnemy(e, pr.dmg, pr.element, { ...pr.effects, kx: pr.vx, ky: pr.vy, knock: pr.effects.knock || 30 + pr.size * 10 });
          pr.hit.add(e);
          if (pr.explode) { explodeAt(pr); pr.dead = true; break; }
          if (pr.pierce > 0) pr.pierce--; else { pr.dead = true; break; }
        }
      }
    }
  }
  G.projectiles = G.projectiles.filter(pr => !pr.dead);
  // hazards
  for (const h of G.hazards) {
    h.t += dt; h.tt += dt; if (h.follow) { h.x = h.follow.x; h.y = h.follow.y; } if (h.vx || h.vy) { h.x += h.vx * dt; h.y += h.vy * dt; }
    if (Math.random() < dt * 25) { const a = Math.random() * Math.PI * 2, rr = Math.random() * h.r; G.particles.push({ x: h.x + Math.cos(a) * rr, y: h.y + Math.sin(a) * rr, vx: h.pull ? -Math.cos(a) * 40 : (Math.random() - 0.5) * 20, vy: h.pull ? -Math.sin(a) * 40 : -20 - Math.random() * 20, life: 0.5, max: 0.5, color: h.color, size: 1 + Math.floor(Math.random() * 2) }); }
    if (h.owner === 'player') {
      for (const e of enemiesInRadius(h.x, h.y, h.r)) { if (h.pull) { const dx = h.x - e.x, dy = h.y - e.y, d = Math.hypot(dx, dy) || 1; if (!e.def.boss && d > 4) tryMove(e, dx / d * h.pull * dt, dy / d * h.pull * dt, { fly: e.def.fly, swim: e.def.swim }); } if (h.slow) e.slow = Math.max(e.slow, 0.2); if (h.effects.root) e.root = Math.max(e.root, 0.3); }
      if (h.tt >= h.tick) { h.tt = 0; for (const e of enemiesInRadius(h.x, h.y, h.r)) hitEnemy(e, h.dmg, h.element, { ...h.effects, noCrit: true, knock: h.effects.knock || 0 }); if (h.healPlayer && Math.hypot(p.x - h.x, p.y - h.y) < h.r) p.heal(h.healPlayer); }
    } else {
      const dp = Math.hypot(p.x - h.x, p.y - h.y);
      if (dp < h.r) { if (h.pull && !p.buffs.ghost) { const dx = h.x - p.x, dy = h.y - p.y, d = dp || 1; tryMove(p, dx / d * h.pull * dt, dy / d * h.pull * dt, p.moveFlags()); } if (h.slow) p.hazardSlow = h.slow; if (h.tt >= h.tick) { h.tt = 0; p.damage(h.dmg, h.element, null, h.effects); } }
    }
  }
  G.hazards = G.hazards.filter(h => h.t < h.dur);
  // effects (delayed callbacks)
  for (const e of G.effects) { e.t += dt; if (e.type === 'delayed' && !e.fired && e.t >= e.delay) { e.fired = true; try { e.fn(); } catch (err) { console.error(err); } } }
  G.effects = G.effects.filter(e => e.type === 'delayed' ? !e.fired : e.t < (e.dur || 0.5));
  // particles
  for (const pa of G.particles) { pa.life -= dt; pa.x += pa.vx * dt; pa.y += pa.vy * dt; if (pa.gravity) pa.vy += pa.gravity * dt; }
  G.particles = G.particles.filter(pa => pa.life > 0);
  // drops
  for (const d of G.drops) {
    d.t += dt; d.life -= dt; d.anim += dt;
    if (d.t < 0.5) { d.x += d.vx * dt; d.vy += 200 * dt; d.z = Math.max(0, d.z - d.vy * dt); if (d.z <= 0) { d.z = 0; d.vy = 0; } }
    const dp = Math.hypot(p.x - d.x, p.y - d.y);
    if (d.t > 0.4 && dp < 28 + (p.stats.magnet || 0)) { const sp = 220; d.x += (p.x - d.x) / dp * sp * dt; d.y += (p.y - d.y) / dp * sp * dt; }
    if (d.t > 0.4 && dp < 8) { if (p.addItem(d.id, d.n)) { d.dead = true; Audio.play(d.id === 'coins' ? 'coin' : 'pickup'); if (d.id !== 'coins') G.float(p.x, p.y - 18, `+${d.n} ${ITEMS[d.id] ? ITEMS[d.id].name : d.id}`, '#fff8c0', 7); } else d.t = -1; }
  }
  G.drops = G.drops.filter(d => !d.dead && d.life > 0);
  // floats
  for (const f of G.floats) { f.t -= dt; f.y += f.vy * dt; } G.floats = G.floats.filter(f => f.t > 0);
}
function explodeAt(pr) {
  spawnEffect('explosion', pr.x, pr.y, { r: pr.explode, color: pr.color, dur: 0.35 }); spawnParticles(pr.x, pr.y, 16, pr.color, { speed: pr.explode * 2.5, life: 0.4 });
  if (pr.owner === 'enemy') { const p = G.player; if (Math.hypot(p.x - pr.x, p.y - pr.y) < pr.explode + 5) p.damage(pr.dmg * 0.8, pr.element, pr.src, pr.effects); }
  else for (const e of enemiesInRadius(pr.x, pr.y, pr.explode)) if (!pr.hit.has(e)) { hitEnemy(e, pr.dmg * 0.8, pr.element, { ...pr.effects, kx: e.x - pr.x, ky: e.y - pr.y, knock: 120 }); pr.hit.add(e); }
  G.shake(3);
}
export function drawEffects(ctx, cx, cy) {
  for (const e of G.effects) {
    const t = e.t / (e.dur || 0.5);
    if (e.type === 'ring') { ctx.strokeStyle = e.color; ctx.globalAlpha = 1 - t; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(e.x - cx, e.y - cy, e.r * (0.3 + 0.7 * t), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (e.type === 'explosion') { ctx.globalAlpha = (1 - t) * 0.7; ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(e.x - cx, e.y - cy, e.r * (0.5 + 0.5 * t), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1 - t; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x - cx, e.y - cy, e.r * 0.4 * (1 - t), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    else if (e.type === 'target') { ctx.strokeStyle = e.color; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(e.x - cx, e.y - cy, e.r, 0, Math.PI * 2); ctx.stroke(); ctx.beginPath(); ctx.arc(e.x - cx, e.y - cy, e.r * t, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (e.type === 'beam') { ctx.strokeStyle = e.color; ctx.globalAlpha = 1 - t; ctx.lineWidth = e.w * (1 - t * 0.5); ctx.beginPath(); ctx.moveTo(e.x - cx, e.y - cy); ctx.lineTo(e.x2 - cx, e.y2 - cy); ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = e.w * 0.3 * (1 - t); ctx.stroke(); ctx.globalAlpha = 1; }
    else if (e.type === 'bolt') { ctx.strokeStyle = e.color; ctx.globalAlpha = 1 - t; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(e.x - cx, e.y - cy); const segs = 6; for (let i = 1; i <= segs; i++) { const f = i / segs; const jx = i < segs ? (hash2(i, Math.floor(e.t * 30), 3) - 0.5) * 12 : 0; const jy = i < segs ? (hash2(i, Math.floor(e.t * 30), 7) - 0.5) * 12 : 0; ctx.lineTo(e.x + (e.x2 - e.x) * f + jx - cx, e.y + (e.y2 - e.y) * f + jy - cy); } ctx.stroke(); ctx.globalAlpha = 1; }
    else if (e.type === 'flash') { ctx.globalAlpha = (1 - t) * 0.8; ctx.fillStyle = e.color; ctx.fillRect(0, 0, G.W, G.H); ctx.globalAlpha = 1; }
  }
  for (const h of G.hazards) { ctx.globalAlpha = 0.18 + Math.sin(h.t * 6) * 0.05; ctx.fillStyle = h.color; ctx.beginPath(); ctx.arc(h.x - cx, h.y - cy, h.r, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 0.5; ctx.strokeStyle = h.color; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(h.x - cx, h.y - cy, h.r * (0.6 + 0.4 * Math.abs(Math.sin(h.t * 2))), 0, Math.PI * 2); ctx.stroke(); if (h.core) { ctx.fillStyle = '#000'; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(h.x - cx, h.y - cy, 12, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1; }
}
export function drawProjectiles(ctx, cx, cy) {
  for (const pr of G.projectiles) {
    const col = pr.rainbow ? `hsl(${(pr.t * 500) % 360},100%,60%)` : pr.color;
    ctx.fillStyle = col; const r = pr.r;
    ctx.beginPath(); ctx.arc(pr.x - cx, pr.y - cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(pr.x - cx - r * 0.25, pr.y - cy - r * 0.25, Math.max(1, r * 0.4), 0, Math.PI * 2); ctx.fill();
  }
}
export function drawParticles(ctx, cx, cy) { for (const pa of G.particles) { ctx.globalAlpha = Math.max(0, Math.min(1, pa.life / pa.max)); ctx.fillStyle = pa.color; ctx.fillRect(Math.round(pa.x - cx), Math.round(pa.y - cy), pa.size, pa.size); } ctx.globalAlpha = 1; }
export function drawDrops(ctx, cx, cy) { for (const d of G.drops) { const ic = itemIcon(d.id); if (!ic) continue; const bob = Math.sin(d.anim * 4) * 1.5; drawShadow(ctx, d.x - cx, d.y - cy, 6); ctx.drawImage(ic, Math.round(d.x - cx - 4), Math.round(d.y - cy - 8 - d.z + bob)); if (d.n > 1) { ctx.font = '6px "Press Start 2P"'; ctx.textAlign = 'left'; ctx.fillStyle = '#000'; ctx.fillText(d.n, Math.round(d.x - cx + 3), Math.round(d.y - cy - 2 - d.z + bob)); ctx.fillStyle = '#fff'; ctx.fillText(d.n, Math.round(d.x - cx + 2), Math.round(d.y - cy - 3 - d.z + bob)); } } }
export function drawAlly(ctx, a, cx, cy) { let spr = a.spriteFn(); if (!spr) return; if (a.face < 0) spr = flipSprite(spr); if (a.tint) spr = tintSprite(spr, a.tint, 0.5); const fade = a.dur - a.t < 1 ? a.dur - a.t : 1; ctx.globalAlpha = 0.85 * fade; drawShadow(ctx, a.x - cx, a.y - cy, 10); ctx.drawImage(spr, Math.round(a.x - cx - spr.width / 2), Math.round(a.y - cy - spr.height + 2 + (a.fly ? Math.sin(a.t * 8) * 2 - 4 : 0))); ctx.globalAlpha = 1; }
