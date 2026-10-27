import { G } from '../state.js';
import { WANDS, wandDamage, wandLevelXp } from '../data/wands.js';
import { ABILITIES } from '../data/abilities.js';
import { ARMOR } from '../data/armor.js';
import { ITEMS } from '../data/items.js';
import { PETS, PET_LIST } from '../data/pets.js';
import { OBJ, T, TILE_DEFS, isLiquidTile } from '../data/tiles.js';
import { makeSprite, PAL, flipSprite, silhouette } from '../engine/sprites.js';
import { Audio } from '../engine/audio.js';
import { Input } from '../engine/input.js';
import { spawnProjectile, spawnParticles, spawnEffect, tryMove, tileSlow, Pet, drawShadow, elementMult, enemiesInRadius, hitEnemy } from './entities.js';
import { ELEMENT_COLORS, RARITY_COLORS } from '../engine/draw.js';
const WIZ = ['.....hhhh...', '....hhhhh...', '...hhhhhhh..', '..hhhhhhhhh.', '.hhhhhhhhhhh', '...TTkTkT...', '...TTTTTT...', '....TTTT....', '..rrrrrrrr..', '.rrrrrrrrrr.', '.r.rrrrrr.r.', '.T.rrrrrr.T.', '...rrrrrr...', '...rrrrrr...', '...bbb.bbb..', '...NNN.NNN..'];
const TAME_BASE = { common: 0.6, uncommon: 0.42, rare: 0.28, epic: 0.16, legendary: 0.09, mythic: 0.05, secret: 0.03 };
export const XP_NEED = lvl => Math.floor(50 * Math.pow(lvl, 1.55));
export class Player {
  constructor() {
    this.x = 0; this.y = 0; this.r = 5; this.h = 16; this.face = 1; this.anim = 0; this.moving = false;
    this.level = 1; this.xp = 0; this.statPoints = 0; this.alloc = { str: 0, vit: 0, int: 0, agi: 0, luck: 0 };
    this.inventory = []; this.maxSlots = 40; this.coins = 0;
    this.equip = { wand: 'wand_wood', head: null, body: null, legs: null, feet: null, charm: null };
    this.wands = { wand_wood: { lvl: 1, xp: 0 } }; this.pets = []; this.activePets = []; this.ridingUid = null; this.petUid = 1;
    this.buffs = {}; this.cds = { E: 0, Q: 0, C: 0, V: 0 }; this.shield = { val: 0, t: 0 }; this.invuln = 0; this.dashT = 0; this.dashVx = 0; this.dashVy = 0;
    this.hp = 100; this.mana = 50; this.hitFlash = 0; this.lastShot = 1; this.shootDir = null; this.fishing = null; this.dead = false; this.respawn = null; this.reviveUsedDay = 0; this.hpHistory = 100; this.histT = 0; this.hazardSlow = 1; this.craftedWands = {}; this.craftedArmor = {}; this.tamedIds = {};
    this.recalc(); this.hp = this.maxHp; this.mana = this.maxMana;
  }
  // ---------- stats ----------
  recalc() {
    const s = { hp: 0, mana: 0, def: 0, speed: 0, crit: 0.05, dmg: 0, luck: 0, regen: 0.5, manaRegen: 3, petDmg: 0, petHp: 0, xp: 0, coinBonus: 0, lifesteal: 0, fireRes: 0, iceRes: 0, cdr: 0, tame: 0, revive: 0, magnet: 0, rate: 0 };
    const a = this.alloc; s.dmg += a.str * 0.02; s.hp += a.vit * 8; s.mana += a.int * 10; s.manaRegen += a.int * 0.2; s.speed += a.agi * 0.01; s.crit += a.agi * 0.005; s.luck += a.luck * 0.01;
    const sets = {};
    for (const slot of ['head', 'body', 'legs', 'feet', 'charm']) { const id = this.equip[slot]; if (!id || !ARMOR[id]) continue; const ar = ARMOR[id]; s.def += ar.def; for (const k in ar.buffs) s[k] = (s[k] || 0) + ar.buffs[k]; if (ar.set) sets[ar.set] = (sets[ar.set] || 0) + 1; }
    this.setBonus = null; for (const k in sets) if (sets[k] >= 4) { const ar = ARMOR_FIRST(k); if (ar && ar.setBonus) { this.setBonus = ar.setName; for (const b in ar.setBonus) s[b] = (s[b] || 0) + ar.setBonus[b]; } }
    for (const uid of this.activePets) { const pd = this.pets.find(p => p.uid === uid); if (!pd) continue; const def = PETS[pd.id]; if (!def) continue; const lv = 1 + (pd.lvl - 1) * 0.05; for (const k in def.buff) s[k] = (s[k] || 0) + def.buff[k] * lv; if (def.abil === 'luck') s.luck += 0.1; if (def.abil === 'regen') s.regen += 1; if (def.abil === 'light') s.light = true; }
    const w = WANDS[this.equip.wand]; if (w) { if (w.luck) s.luck += w.luck; if (w.crit) s.crit += w.crit; if (w.regen) s.regen += w.regen; if (w.lifesteal) s.lifesteal += w.lifesteal; }
    for (const k in this.buffs) { const b = this.buffs[k]; if (k in s) s[k] += b.val; else if (k === 'dmg' || k === 'speed' || k === 'crit' || k === 'luck' || k === 'regen' || k === 'def' || k === 'rate') s[k] += b.val; }
    this.stats = s;
    this.maxHp = Math.round(100 + (this.level - 1) * 6 + s.hp); this.maxMana = Math.round(50 + (this.level - 1) * 4 + s.mana);
    if (this.hp > this.maxHp) this.hp = this.maxHp; if (this.mana > this.maxMana) this.mana = this.maxMana;
    this.speed = 78 * (1 + s.speed);
    for (const pt of G.pets) pt.recalc();
  }
  wandDef() { return WANDS[this.equip.wand] || WANDS.wand_wood; }
  wandLvl() { return (this.wands[this.equip.wand] || { lvl: 1 }).lvl; }
  wandDmg() { const w = this.wandDef(); let d = wandDamage(w, this.wandLvl()) * (1 + this.stats.dmg); if (w.nightBonus && (G.time > 0.75 || G.time < 0.22)) d *= 1 + w.nightBonus; return d; }
  moveFlags() { const rp = this.ridingPet(); return { fly: !!(this.buffs.fly || (rp && rp.def.fly)), swim: !!(rp && rp.def.swim), ghost: !!this.buffs.ghost, fireproof: !!(rp && rp.def.element === 'fire') || !!this.buffs.phoenix || !!this.buffs.dragon, avoidLava: false }; }
  ridingPet() { return this.ridingUid ? G.pets.find(p => p.data.uid === this.ridingUid) : null; }
  sprite() {
    const body = this.equip.body ? ARMOR[this.equip.body].cols.split(',') : ['b', 'B', 'c']; const head = this.equip.head ? ARMOR[this.equip.head].cols.split(',') : ['b', 'B', 'c'];
    const feet = this.equip.feet ? ARMOR[this.equip.feet].cols.split(',')[0] : 'N';
    const key = 'player:' + body[0] + head[0] + feet;
    return makeSprite(WIZ, { r: PAL[body[0]], h: PAL[head[0]], b: PAL[feet], T: PAL.T, N: PAL.N }, key);
  }
  // ---------- inventory ----------
  countItem(id) { if (id === 'coins') return this.coins; let n = 0; for (const s of this.inventory) if (s.id === id) n += s.n; return n; }
  hasItem(id, n = 1) { return this.countItem(id) >= n; }
  addItem(id, n = 1, silent = false) {
    if (id === 'coins') { this.coins += n; return true; }
    const def = ITEMS[id] || ARMOR[id] || WANDS[id]; if (!def) { console.warn('unknown item', id); return true; }
    if (WANDS[id]) { if (!this.wands[id]) this.wands[id] = { lvl: 1, xp: 0 }; return true; }
    const stack = def.stack || 99;
    for (const s of this.inventory) { if (s.id === id && s.n < stack) { const add = Math.min(n, stack - s.n); s.n += add; n -= add; if (n <= 0) return true; } }
    while (n > 0) { if (this.inventory.length >= this.maxSlots) { if (!silent) G.notify('Inventory full!', '#d43a3a'); return false; } const add = Math.min(n, stack); this.inventory.push({ id, n: add }); n -= add; }
    G.onItemGained && G.onItemGained(id);
    return true;
  }
  removeItem(id, n = 1) { if (id === 'coins') { if (this.coins < n) return false; this.coins -= n; return true; } if (this.countItem(id) < n) return false; for (let i = this.inventory.length - 1; i >= 0 && n > 0; i--) { const s = this.inventory[i]; if (s.id !== id) continue; const take = Math.min(n, s.n); s.n -= take; n -= take; if (s.n <= 0) this.inventory.splice(i, 1); } return true; }
  equipItem(id) {
    if (WANDS[id]) { if (!this.wands[id]) return false; this.equip.wand = id; this.cds = { E: 0, Q: 0, C: 0, V: 0 }; this.recalc(); Audio.play('craft'); G.notify('Equipped ' + WANDS[id].name, RARITY_COLORS[WANDS[id].rarity]); return true; }
    const a = ARMOR[id]; if (!a) return false; if (!this.hasItem(id)) return false;
    const old = this.equip[a.slot]; this.removeItem(id, 1); if (old) this.addItem(old, 1); this.equip[a.slot] = id; this.recalc(); Audio.play('craft'); G.notify('Equipped ' + a.name, RARITY_COLORS[a.rarity]); return true;
  }
  unequip(slot) { const id = this.equip[slot]; if (!id || slot === 'wand') return; if (this.addItem(id, 1)) { this.equip[slot] = null; this.recalc(); } }
  useItem(id) {
    const it = ITEMS[id]; if (!it || !this.hasItem(id)) return false;
    if (ARMOR[id]) return this.equipItem(id);
    const u = it.use;
    if (!u && it.heal) { this.removeItem(id); this.heal(it.heal); Audio.play('eat'); return true; }
    if (!u) return false;
    switch (u) {
      case 'heal': if (this.hp >= this.maxHp) { G.notify('Already at full health.'); return false; } this.heal(it.val); break;
      case 'mana': if (this.mana >= this.maxMana) { G.notify('Mana is full.'); return false; } this.mana = Math.min(this.maxMana, this.mana + it.val); break;
      case 'buff': this.addBuff(it.buff, it.val, it.dur); G.notify(it.name + ' active!', '#8fe04a'); break;
      case 'elixir': this.heal(this.maxHp); this.mana = this.maxMana; this.addBuff('dmg', 0.3, 30); this.addBuff('speed', 0.3, 30); this.addBuff('def', 10, 30); this.addBuff('regen', 3, 30); this.addBuff('luck', 0.3, 30); break;
      case 'xp': this.gainXp(it.val); break;
      case 'wandxp': this.gainWandXp(it.val); break;
      case 'petxp': { const pt = G.pets[0]; if (!pt) { G.notify('No active pet.'); return false; } pt.gainXp(it.val); break; }
      case 'recall': this.teleport(G.world.spawn.x, G.world.spawn.y); G.notify('Recalled to Everdawn.', '#5ad8f0'); Audio.play('portal'); break;
      case 'bomb': { const mx = G.aim.x, my = G.aim.y; const dx = mx - this.x, dy = my - this.y, d = Math.hypot(dx, dy) || 1; const dist = Math.min(d, 140); spawnProjectile({ x: this.x, y: this.y - 6, vx: dx / d * 180, vy: dy / d * 180, dmg: 60 * (1 + this.stats.dmg), life: dist / 180, r: 5, color: '#ff6a1a', element: 'fire', owner: 'player', size: 2, explode: 40, effects: { burn: 3 } }); break; }
      case 'whistle': for (const pt of G.pets) { pt.x = this.x; pt.y = this.y; } G.notify('Your pets come running!'); break;
      case 'hatch': { const pool = PET_LIST.filter(p => it.element === 'any' ? !p.where.some(w => w.startsWith('egg:cosmic')) && p.rarity !== 'mythic' : it.element === 'cosmic' ? (p.where.some(w => w === 'egg:cosmic') || p.rarity === 'legendary') : (p.where.some(w => w === 'egg:' + it.element) || (p.element === it.element && ['rare', 'epic', 'legendary'].includes(p.rarity)))); if (!pool.length) return false; const pick = pool[Math.floor(Math.random() * pool.length)]; this.removeItem(id); this.addPet(pick.id, true); spawnParticles(this.x, this.y - 8, 40, ['#f5d33a', '#fff8c0', ELEMENT_COLORS[pick.element]], { speed: 80, life: 0.8 }); Audio.play('tame'); G.notify(`The egg hatched into a ${pick.name}!`, RARITY_COLORS[pick.rarity], 5); return true; }
      default: return false;
    }
    this.removeItem(id); Audio.play(u === 'heal' || u === 'mana' ? 'heal' : 'eat'); return true;
  }
  // ---------- pets ----------
  addPet(id, notify = true) { const def = PETS[id]; const uid = this.petUid++; this.pets.push({ id, uid, lvl: 1, xp: 0, name: def.name }); this.tamedIds[id] = true; G.stats.tamed = Object.keys(this.tamedIds).length; if (this.activePets.length < this.maxActivePets()) this.setPetActive(uid, true); if (notify) G.notify(`${def.name} joined your party!`, RARITY_COLORS[def.rarity]); G.onTame && G.onTame(id); return uid; }
  maxActivePets() { return 1 + Math.min(2, Math.floor(this.level / 10)); }
  setPetActive(uid, on) {
    const pd = this.pets.find(p => p.uid === uid); if (!pd) return;
    if (on) { if (this.activePets.includes(uid)) return; if (this.activePets.length >= this.maxActivePets()) { G.notify(`Max ${this.maxActivePets()} active pets (more at level 10/20).`, '#d43a3a'); return; } this.activePets.push(uid); const pt = new Pet(pd, this.x + 10, this.y); G.pets.push(pt); }
    else { if (this.ridingUid === uid) this.dismount(); this.activePets = this.activePets.filter(u => u !== uid); G.pets = G.pets.filter(p => p.data.uid !== uid); }
    this.recalc();
  }
  releasePet(uid) { this.setPetActive(uid, false); this.pets = this.pets.filter(p => p.uid !== uid); }
  toggleRide() {
    if (this.ridingUid) { this.dismount(); return; }
    const pt = G.pets.find(p => p.def.ride && !p.ko); if (!pt) { G.notify('No rideable pet active. (Wolves, horses, dragons...)', '#d43a3a'); return; }
    this.ridingUid = pt.data.uid; pt.riding = true; pt.x = this.x; pt.y = this.y; Audio.play('ride'); G.notify(`Riding ${pt.data.name}!`, '#8fe04a'); G.onRide && G.onRide(pt);
  }
  dismount() { const pt = this.ridingPet(); if (pt) pt.riding = false; this.ridingUid = null; // if over water, hop to nearest land
    if (G.world.solid(Math.floor(this.x / 16), Math.floor(this.y / 16))) { for (let r = 1; r < 12; r++) { let done = false; for (let a = 0; a < 16 && !done; a++) { const tx = Math.floor(this.x / 16) + Math.round(Math.cos(a) * r), ty = Math.floor(this.y / 16) + Math.round(Math.sin(a) * r); if (!G.world.solid(tx, ty)) { this.x = tx * 16 + 8; this.y = ty * 16 + 8; done = true; } } if (done) break; } } }
  // ---------- xp ----------
  gainXp(n) { this.xp += n; G.float(this.x, this.y - 22, '+' + n + ' XP', '#c070ff', 7); while (this.xp >= XP_NEED(this.level)) { this.xp -= XP_NEED(this.level); this.level++; this.statPoints += 3; this.recalc(); this.hp = this.maxHp; this.mana = this.maxMana; Audio.play('levelup'); G.notify(`LEVEL UP! You are now level ${this.level}. +3 stat points (press T).`, '#f5d33a', 5); spawnParticles(this.x, this.y - 8, 40, ['#f5d33a', '#fff8c0'], { speed: 80, life: 1, gravity: -30 }); spawnEffect('ring', this.x, this.y, { r: 60, color: '#f5d33a', dur: 0.8 }); G.onLevel && G.onLevel(this.level); } }
  gainWandXp(n) { const w = this.wands[this.equip.wand]; if (!w) return; w.xp += n; while (w.xp >= wandLevelXp(w.lvl) && w.lvl < 50) { w.xp -= wandLevelXp(w.lvl); w.lvl++; G.notify(`${this.wandDef().name} reached level ${w.lvl}! (+8% damage)`, '#5ad8f0'); Audio.play('craft'); } }
  // ---------- combat ----------
  heal(n, silent = false) { if (this.dead) return; const before = this.hp; this.hp = Math.min(this.maxHp, this.hp + n); if (!silent && this.hp - before >= 1) G.float(this.x, this.y - 20, '+' + Math.round(this.hp - before), '#8fe04a', 7); }
  addShield(v, t) { this.shield = { val: Math.max(this.shield.val, v), t }; spawnEffect('ring', this.x, this.y, { r: 20, color: '#5ad8f0', dur: 0.4 }); }
  addBuff(id, val, dur) { this.buffs[id] = { val, t: dur }; this.recalc(); }
  damage(dmg, element = 'neutral', src = null, fx = {}) {
    if (this.dead || this.invuln > 0 || this.buffs.divine) return;
    let d = dmg; if (element === 'fire') d *= Math.max(0.1, 1 - this.stats.fireRes); if (element === 'ice') d *= Math.max(0.1, 1 - this.stats.iceRes);
    d = Math.max(1, Math.round(d - this.stats.def * 0.5 - Math.sqrt(this.stats.def)));
    if (this.shield.val > 0) { const ab = Math.min(this.shield.val, d); this.shield.val -= ab; d -= ab; G.float(this.x, this.y - 22, 'BLOCK', '#5ad8f0', 6); }
    if (d <= 0) return;
    this.hp -= d; this.hitFlash = 0.15; this.invuln = 0.35; G.shake(3); Audio.play('hurt');
    G.float(this.x + (Math.random() - 0.5) * 6, this.y - 20, '-' + d, '#d43a3a', 8);
    if (fx.knock && src) { const kx = this.x - src.x, ky = this.y - src.y, l = Math.hypot(kx, ky) || 1; this.dashVx = kx / l * fx.knock; this.dashVy = ky / l * fx.knock; this.dashT = 0.15; }
    if (fx.burn) this.burn = Math.max(this.burn || 0, fx.burn); if (fx.poison) this.poison = Math.max(this.poison || 0, fx.poison); if (fx.freeze) this.addBuff('frozen', 1, fx.freeze * 0.5); if (fx.stun) this.addBuff('stunned', 1, fx.stun * 0.5);
    if (src && src.def && this.setBonus) { if (this.stats.thorns_burn) src.burn = Math.max(src.burn || 0, 2); if (this.stats.thorns_freeze) src.freeze = Math.max(src.freeze || 0, 1); }
    if (this.hp <= 0) this.die();
  }
  die() {
    if (this.stats.revive > 0 && this.reviveUsedDay !== G.day) { this.reviveUsedDay = G.day; this.hp = this.maxHp; this.invuln = 3; G.notify('You were reborn in flames!', '#ff9a3a', 4); spawnParticles(this.x, this.y - 8, 60, ['#ff6a1a', '#f5d33a'], { speed: 100, life: 1 }); Audio.play('levelup'); return; }
    const rp = G.pets.find(p => p.def.abil === 'revive' && !p.ko); if (rp && rp.reviveDay !== G.day) { rp.reviveDay = G.day; this.hp = this.maxHp; this.invuln = 3; G.notify(`${rp.data.name} brought you back to life!`, '#ff9a3a', 4); spawnParticles(this.x, this.y - 8, 60, ['#ff6a1a', '#fff8c0'], { speed: 100, life: 1 }); Audio.play('levelup'); return; }
    this.dead = true; this.hp = 0; G.stats.deaths++; this.deathT = 3; Audio.play('fail'); G.notify('You died... Respawning at your bed.', '#d43a3a', 4);
    const lost = Math.floor(this.coins * 0.1); this.coins -= lost; if (lost > 0) G.notify(`Lost ${lost} coins.`, '#d43a3a');
    this.dismount();
  }
  doRespawn() { this.dead = false; const rp = this.respawn || G.world.spawn; this.teleport(rp.x, rp.y); this.hp = this.maxHp; this.mana = this.maxMana; this.invuln = 3; this.buffs = {}; this.burn = 0; this.poison = 0; this.recalc(); G.enemies = G.enemies.filter(e => !e.aggro || e.def.boss); for (const pt of G.pets) { pt.ko = false; pt.hp = pt.maxHp; pt.x = this.x; pt.y = this.y; } }
  teleport(x, y) { this.x = x; this.y = y; for (const pt of G.pets) { pt.x = x; pt.y = y; } }
  dash(dx, dy, dist) { const l = Math.hypot(dx, dy) || 1; this.dashVx = dx / l * dist / 0.18; this.dashVy = dy / l * dist / 0.18; this.dashT = 0.18; this.invuln = Math.max(this.invuln, 0.25); }
  castAbility(key) {
    const w = this.wandDef(); const aid = w.abilities[key]; if (!aid) { if (key === 'V') G.notify('This wand has no secret ability. Only the rarest do...', '#6b6b7b'); return; }
    const ab = ABILITIES[aid]; if (!ab) return;
    if (this.cds[key] > 0) { G.float(this.x, this.y - 24, 'COOLDOWN', '#6b6b7b', 6); return; }
    if (this.mana < ab.mana) { G.float(this.x, this.y - 24, 'NO MANA', '#5a8af0', 6); Audio.play('fail'); return; }
    this.mana -= ab.mana; this.cds[key] = ab.cd * (1 - Math.min(0.6, this.stats.cdr || 0));
    const dir = G.aimDir(); const ctx = { p: this, wand: w, aim: { x: G.aim.x, y: G.aim.y }, dir, dmg: this.wandDmg(), lvl: this.wandLvl() };
    Audio.play(ab.ultimate ? 'ultimate' : 'ability'); if (ab.ultimate) { G.notify(ab.name + '!', '#ff3a7a', 2); G.shake(6); }
    ab.cast(ctx);
  }
  shoot() {
    const w = this.wandDef(); const rate = w.rate * (1 + (this.stats.rate || 0));
    if (this.lastShot < 1 / rate) return; const cost = w.mana || 0; if (this.mana < cost) return;
    this.lastShot = 0; this.mana -= cost;
    const dir = G.aimDir(); this.shootDir = dir; this.face = dir.x >= 0 ? 1 : -1;
    const count = (w.proj.count || 1) + (this.buffs.multishot ? this.buffs.multishot.val : 0) + (this.buffs.dragon ? 2 : 0);
    const spread = w.proj.spread || 0.25; const base = Math.atan2(dir.y, dir.x);
    for (let i = 0; i < count; i++) {
      const a = count === 1 ? base : base - spread * (count - 1) / 2 + spread * i;
      const el = w.rainbow ? ['fire', 'ice', 'lightning', 'nature', 'dark', 'holy', 'arcane'][Math.floor(Math.random() * 7)] : (this.buffs.dragon ? 'fire' : w.element);
      spawnProjectile({ x: this.x + dir.x * 6, y: this.y - 7 + dir.y * 6, vx: Math.cos(a) * w.speed, vy: Math.sin(a) * w.speed, dmg: this.wandDmg(), life: 1.3, r: w.proj.r || 3, color: w.rainbow ? '#fff' : ELEMENT_COLORS[el] || '#fff', element: el, owner: 'player', pierce: w.proj.pierce || 0, homing: w.proj.homing || 0, effects: { ...w.effects, ...(this.buffs.dragon ? { burn: 3 } : {}) }, size: w.proj.size || 1, bounce: w.proj.bounce || 0, explode: w.proj.explode || 0, rainbow: w.rainbow });
    }
    Audio.play(w.tier >= 5 ? 'shoot2' : 'shoot');
    spawnParticles(this.x + dir.x * 8, this.y - 7 + dir.y * 8, 2, ELEMENT_COLORS[w.element] || '#fff', { speed: 20, life: 0.2 });
  }
  // ---------- update ----------
  update(dt) {
    this.anim += dt; this.lastShot += dt; this.histT += dt; if (this.histT > 5) { this.histT = 0; this.hpHistory = this.hp; }
    if (this.hitFlash > 0) this.hitFlash -= dt; if (this.invuln > 0) this.invuln -= dt;
    for (const k in this.cds) if (this.cds[k] > 0) this.cds[k] -= dt;
    let dirty = false; for (const k in this.buffs) { this.buffs[k].t -= dt; if (this.buffs[k].t <= 0) { delete this.buffs[k]; dirty = true; } } if (dirty) this.recalc();
    if (this.shield.t > 0) { this.shield.t -= dt; if (this.shield.t <= 0) this.shield.val = 0; }
    if (this.dead) { this.deathT -= dt; if (this.deathT <= 0) this.doRespawn(); return; }
    // regen
    this.hp = Math.min(this.maxHp, this.hp + this.stats.regen * dt); this.mana = Math.min(this.maxMana, this.mana + this.stats.manaRegen * dt);
    if (this.burn > 0) { this.burn -= dt; if (Math.random() < dt * 3) { this.hp -= 2; spawnParticles(this.x, this.y - 8, 2, '#ff6a1a', { speed: 20, life: 0.3, vy: -30 }); if (this.hp <= 0) this.die(); } }
    if (this.poison > 0) { this.poison -= dt; if (Math.random() < dt * 2) { this.hp -= 2; spawnParticles(this.x, this.y - 8, 2, '#8fe04a', { speed: 15, life: 0.4, vy: -20 }); if (this.hp <= 0) this.die(); } }
    // lava
    const tt = G.world.get(Math.floor(this.x / 16), Math.floor(this.y / 16)); if (tt === T.LAVA && !this.moveFlags().fireproof && !this.moveFlags().fly) { if (Math.random() < dt * 4) this.damage(12, 'fire', null, { burn: 2 }); }
    if (this.fishing) { this.fishing.t -= dt; if (this.fishing.t <= 0) this.finishFishing(); if (Input.key('w') || Input.key('a') || Input.key('s') || Input.key('d')) this.fishing = null; return; }
    if (G.menu || G.dialog) return;
    // movement
    let mx = 0, my = 0; if (Input.key('w') || Input.key('ArrowUp')) my -= 1; if (Input.key('s') || Input.key('ArrowDown')) my += 1; if (Input.key('a') || Input.key('ArrowLeft')) mx -= 1; if (Input.key('d') || Input.key('ArrowRight')) mx += 1;
    const flags = this.moveFlags(); const rp = this.ridingPet();
    if (this.dashT > 0) { this.dashT -= dt; tryMove(this, this.dashVx * dt, this.dashVy * dt, flags); if (Math.random() < 0.8) spawnParticles(this.x, this.y - 4, 1, '#fff', { speed: 10, life: 0.2 }); }
    else if ((mx || my) && !this.buffs.frozen && !this.buffs.stunned) {
      const l = Math.hypot(mx, my); let sp = this.speed * (rp ? rp.def.ride * (this.hasItem('saddle') ? 1.2 : 1) : 1) * tileSlow(this.x, this.y) * (this.hazardSlow || 1);
      if (flags.fly) sp *= 1; const before = { x: this.x, y: this.y };
      tryMove(this, mx / l * sp * dt, my / l * sp * dt, flags); G.stats.distance += Math.hypot(this.x - before.x, this.y - before.y) / 16;
      this.moving = true; if (mx) this.face = mx > 0 ? 1 : -1;
    } else this.moving = false;
    this.hazardSlow = 1;
    // shooting / abilities
    if (Input.mouse.down && !G.uiHover) this.shoot();
    for (const k of ['e', 'q', 'c', 'v']) if (Input.hit(k)) this.castAbility(k.toUpperCase());
    if (Input.hit(' ')) { if (this.cds.dash > 0) {} else { const d = (mx || my) ? { x: mx, y: my } : G.aimDir(); this.dash(d.x, d.y, 60); this.cds.dash = 1.2; Audio.play('dash'); } }
    if (this.cds.dash > 0) this.cds.dash -= dt;
    if (Input.hit('r')) this.toggleRide();
    if (Input.hit('f')) this.interact();
    for (let i = 1; i <= 5; i++) if (Input.hit('' + i)) { const q = G.quickSlots[i - 1]; if (q && this.hasItem(q)) this.useItem(q); }
    // wild pets drift away if you shoot near them? no. Enemy contact dmg from cactus
    const o = G.world.obj(Math.floor(this.x / 16), Math.floor(this.y / 16)); if (o && OBJ[o].touchDmg && Math.random() < dt * 2) this.damage(OBJ[o].touchDmg);
  }
  // ---------- interaction ----------
  facingTile() { const d = G.aimDir(); return { x: Math.floor((this.x + d.x * 14) / 16), y: Math.floor((this.y - 2 + d.y * 14) / 16) }; }
  interact() {
    const near = (list, r) => { let best = null, bd = r; for (const e of list) { const d = Math.hypot(e.x - this.x, e.y - this.y); if (d < bd) { bd = d; best = e; } } return best; };
    const npc = near(G.npcs, 30); if (npc) { G.openDialog(npc); return; }
    const wp = near(G.wildPets, 26); if (wp) { this.tryTame(wp); return; }
    // objects around: check facing tile first then 8 neighbours
    const ft = this.facingTile(); const cands = [ft]; const px = Math.floor(this.x / 16), py = Math.floor((this.y - 2) / 16);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) cands.push({ x: px + dx, y: py + dy });
    for (const c of cands) { const o = G.world.obj(c.x, c.y); if (!o) continue; const def = OBJ[o]; if (def.interact || def.station || def.harvest) { this.useObject(c.x, c.y, o, def); return; } }
    // fishing
    for (const c of cands) { const t = G.world.get(c.x, c.y); if (isLiquidTile(t) || t === T.SHALLOW) { if (t === T.LAVA) continue; this.fishing = { t: 2 + Math.random() * 3, x: c.x * 16 + 8, y: c.y * 16 + 8 }; G.notify('Fishing... (don\'t move)', '#5ad8f0', 2); return; } }
    G.float(this.x, this.y - 24, 'Nothing here', '#6b6b7b', 6);
  }
  finishFishing() {
    const f = this.fishing; this.fishing = null; const r = Math.random() * (1 + this.stats.luck);
    let id = 'fish', n = 1; if (r > 1.15) id = 'egg_mystery'; else if (r > 1.05) id = 'pearl'; else if (r > 0.9) id = 'coral'; else if (r > 0.82) id = 'string'; else if (r > 0.75) { id = 'fish'; n = 2; } else if (r < 0.08) { id = 'bone'; }
    this.addItem(id, n); Audio.play('pickup'); G.float(f.x, f.y - 10, `Caught ${n > 1 ? n + ' ' : ''}${ITEMS[id].name}!`, '#5ad8f0'); spawnParticles(f.x, f.y, 10, '#5ad8f0', { speed: 40, life: 0.5 }); G.onItemGained && G.onItemGained(id);
  }
  useObject(tx, ty, o, def) {
    const wx = tx * 16 + 8, wy = ty * 16 + 8;
    if (def.interact === 'chest') { G.openChest(tx, ty); return; }
    if (def.station) { G.openMenu('craft'); return; }
    if (def.interact === 'bed') { this.respawn = { x: this.x, y: this.y }; if (G.time > 0.7 || G.time < 0.2) { G.sleep(); } else G.notify('Respawn point set. Sleep here at night to skip to morning.', '#fff8c0'); return; }
    if (def.interact === 'sign') { const s = G.world.signs.find(s => s.x === tx && s.y === ty); G.notify(s ? s.text : 'The sign is weathered.', '#fff8c0', 5); return; }
    if (def.interact === 'read') { const lore = ['"...and the beacon shone so bright that no shadow could endure it." - Chronicles of Everdawn', '"Elementals carry cores. Bosses carry fragments. The hermit carries secrets." - A Wizard\'s Notes', '"Pets remember their favorite foods. So should you." - Beastmaster Tilly', '"The V key. That\'s all I will say." - Odd the Hermit', '"Mithril from the mountains, star metal from the sky." - Dwarven Ledger', '"The Rainbow Wand was never crafted. Or was it?" - Fragment', '"Press T to grow stronger. Press M to see further." - Tutorial Scroll', '"Press K to craft. Press P for pets. Press J for quests." - Tutorial Scroll'][Math.floor(Math.random() * 8)]; G.notify(lore, '#c8a0f0', 6); if (Math.random() < 0.1) { this.gainXp(20); } return; }
    if (def.interact === 'grave') { if (Math.random() < 0.3) { G.notify('You disturbed the grave...', '#a04ad8'); G.spawnEnemyAt('skeleton', wx, wy + 16); } else G.notify('"Here lies someone. They were fine."', '#a8a8b8'); return; }
    if (def.interact === 'well') { this.heal(20); this.mana = Math.min(this.maxMana, this.mana + 20); G.notify('Refreshing! +20 HP, +20 mana.', '#5ad8f0'); Audio.play('heal'); return; }
    if (def.interact === 'fountain') { this.heal(this.maxHp * 0.3); this.mana = Math.min(this.maxMana, this.mana + this.maxMana * 0.3); G.notify('The fountain restores you.', '#5ad8f0'); Audio.play('heal'); return; }
    if (def.interact === 'portal') { const key = tx + ',' + ty; const dest = G.world.pois[Math.floor(Math.random() * G.world.pois.length)]; this.teleport(dest.x, dest.y + 40); G.notify('The portal hurls you to ' + dest.name + '!', '#c070ff'); Audio.play('portal'); return; }
    if (def.interact === 'bell') { Audio.play('levelup'); G.notify('DING! Every enemy nearby heard that.', '#f5d33a'); for (const e of enemiesInRadius(this.x, this.y, 400)) e.aggro = true; return; }
    if (def.interact === 'throne') { G.notify('You sit on the throne. You feel important. +10 luck for 60s.', '#f5d33a'); this.addBuff('luck', 0.1, 60); return; }
    if (def.interact === 'obelisk') { G.notify('The obelisk hums. Your mana surges.', '#c070ff'); this.mana = this.maxMana; return; }
    if (def.interact === 'snowman') { G.notify('"Hi, I\'m Gerald." ...The snowman did not actually speak.', '#c8f0ff'); return; }
    if (def.interact === 'mailbox') { G.notify('A letter: "Dear wizard, the roof leaks. - Everyone"', '#fff8c0'); return; }
    if (def.interact === 'cage') { G.notify('The cage is empty. Someone escaped.', '#a8a8b8'); return; }
    if (def.interact === 'pet_bed') { for (const pt of G.pets) { pt.hp = pt.maxHp; pt.ko = false; } G.notify('Your pets rest and recover fully.', '#8fe04a'); Audio.play('heal'); return; }
    if (def.interact === 'nest') { if (Math.random() < 0.3) { this.addItem('feather', 2); G.notify('Found 2 feathers.', '#fff8c0'); } else G.notify('The nest is empty.', '#a8a8b8'); return; }
    if (def.interact === 'beacon') { G.onBeacon(); return; }
    if (def.harvest) this.harvest(tx, ty, o, def);
  }
  harvest(tx, ty, o, def) {
    const wx = tx * 16 + 8, wy = ty * 16 + 8; const type = def.harvest.type;
    Audio.play(type === 'wood' ? 'chop' : 'mine'); spawnParticles(wx, wy - 4, 6, type === 'wood' ? ['#8a5a2a', '#3c8a2e'] : ['#a8a8b8', '#6b6b7b'], { speed: 40, life: 0.4 });
    G.shakeObj = { x: tx, y: ty, t: 0.15 };
    if (def.angry && Math.random() < 0.5) { G.spawnEnemyAt('bat', wx, wy); }
    const destroyed = G.world.harvest(tx, ty);
    if (destroyed) {
      const luck = 1 + this.stats.luck;
      for (const [id, mn, mx, ch] of def.harvest.drops) { if (Math.random() < (ch ?? 1) * luck) { const n = mn + Math.floor(Math.random() * (mx - mn + 1)); if (n > 0) G.dropItem(id, n, wx + (Math.random() - 0.5) * 12, wy + (Math.random() - 0.5) * 8); } }
      if (type === 'wood') G.stats.wood++; else G.stats.stone++;
      G.onHarvest && G.onHarvest(type);
      if (o.startsWith('ore_') && Math.random() < 0.08) this.gainXp(5);
    }
  }
  tryTame(wp) {
    const def = wp.def; const foods = this.inventory.filter(s => ITEMS[s.id] && ITEMS[s.id].food && (ITEMS[s.id].food === def.food || ITEMS[s.id].food === 'any')).map(s => s.id);
    if (!foods.length) { G.notify(`${def.name} wants ${foodName(def.food)}. You have none.`, '#d43a3a', 3); G.float(wp.x, wp.y - 16, '?', '#f5d33a'); return; }
    const specific = foods.find(f => ITEMS[f].food === def.food); const golden = foods.includes('golden_treat'); const magic = foods.includes('magic_treat');
    const food = golden ? 'golden_treat' : specific || (magic ? 'magic_treat' : foods[0]);
    this.removeItem(food, 1); Audio.play('eat');
    let chance = TAME_BASE[def.rarity] * (1 + this.stats.tame + this.stats.luck * 0.5) + (ITEMS[food].tameBonus || 0); if (golden) chance = 1;
    wp.heart = 1; spawnParticles(wp.x, wp.y - 8, 6, '#f07ad0', { speed: 20, life: 0.6, vy: -20 });
    if (Math.random() < chance) { Audio.play('tame'); spawnParticles(wp.x, wp.y - 8, 30, ['#f07ad0', '#fff8c0', '#f5d33a'], { speed: 60, life: 0.8 }); G.wildPets = G.wildPets.filter(w => w !== wp); if (wp.spawnRef) wp.spawnRef.respawn = 120 + Math.random() * 120; this.addPet(def.id); }
    else { G.float(wp.x, wp.y - 16, ['Not yet...', 'Almost!', 'Hmm...', '*nom*'][Math.floor(Math.random() * 4)], '#f07ad0'); wp.flee = 0.6; G.notify(`${def.name} ate the ${ITEMS[food].name} but isn't convinced. (${Math.round(chance * 100)}% chance)`, '#f0c8a0', 3); }
  }
  draw(ctx, cx, cy) {
    if (this.dead) { ctx.globalAlpha = 0.5; }
    let spr = this.sprite(); if (this.face < 0) spr = flipSprite(spr); if (this.hitFlash > 0) spr = silhouette(spr, '#fff');
    const rp = this.ridingPet(); const bob = this.moving ? Math.abs(Math.sin(this.anim * 10)) * 1.5 : 0; const fly = this.buffs.fly || (rp && rp.def.fly);
    const lift = rp ? (rp.def.fly ? 10 + Math.sin(this.anim * 5) * 2 : 5) : (fly ? 8 : 0);
    drawShadow(ctx, this.x - cx, this.y - cy, 10);
    if (rp) rp.draw(ctx, cx, cy - (rp.def.fly ? 4 + Math.sin(this.anim * 5) * 2 : 0));
    if (this.buffs.dragon) { ctx.fillStyle = '#d43a3a'; ctx.fillRect(this.x - cx - 14, this.y - cy - 14 - lift + Math.sin(this.anim * 8) * 2, 8, 4); ctx.fillRect(this.x - cx + 6, this.y - cy - 14 - lift + Math.sin(this.anim * 8) * 2, 8, 4); }
    if (this.buffs.phoenix) { ctx.fillStyle = '#ff9a3a'; ctx.fillRect(this.x - cx - 13, this.y - cy - 12 - lift + Math.sin(this.anim * 8) * 2, 7, 3); ctx.fillRect(this.x - cx + 6, this.y - cy - 12 - lift + Math.sin(this.anim * 8) * 2, 7, 3); }
    if (this.invuln > 0 && !this.dead && Math.floor(this.anim * 20) % 2 === 0) ctx.globalAlpha = 0.5;
    ctx.drawImage(spr, Math.round(this.x - cx - 6), Math.round(this.y - cy - 16 + 2 - bob - lift));
    ctx.globalAlpha = 1;
    // wand
    const w = this.wandDef(); const d = G.aimDir(); const hx = this.x - cx + this.face * 5, hy = this.y - cy - 7 - bob - lift; const tipx = hx + d.x * 9, tipy = hy + d.y * 9;
    const cols = w.cols.split(','); ctx.strokeStyle = PAL[cols[0]] || '#8a5a2a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tipx, tipy); ctx.stroke();
    const gc = w.rainbow ? `hsl(${(this.anim * 200) % 360},100%,60%)` : ELEMENT_COLORS[w.element] || PAL[cols[2]]; ctx.fillStyle = gc; ctx.fillRect(Math.round(tipx) - 1, Math.round(tipy) - 1, 3, 3); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(tipx), Math.round(tipy), 1, 1);
    if (this.shield.val > 0) { ctx.strokeStyle = '#5ad8f0'; ctx.globalAlpha = 0.5 + Math.sin(this.anim * 6) * 0.2; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(this.x - cx, this.y - cy - 7 - lift, 11, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; }
    if (this.fishing) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tipx, tipy); ctx.lineTo(this.fishing.x - cx, this.fishing.y - cy + Math.sin(this.anim * 3)); ctx.stroke(); ctx.fillStyle = '#d43a3a'; ctx.fillRect(this.fishing.x - cx - 1, this.fishing.y - cy - 1 + Math.sin(this.anim * 3), 3, 3); }
  }
}
function ARMOR_FIRST(set) { for (const k in ARMOR) if (ARMOR[k].set === set) return ARMOR[k]; return null; }
export function foodName(f) { return { fruit: 'fruit (apples, berries)', veg: 'vegetables (carrots, hay, mushrooms)', meat: 'meat', fish: 'fish', sweet: 'sweets (honey, bread, cheese)', bug: 'bugs', spirit: 'glow berries', soul: 'soul shards', fire: 'ember fruit', mineral: 'crystal candy', any: 'anything' }[f] || f; }
