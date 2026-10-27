// Ability library used by wands (E / Q / C / V keybinds). Each cast receives ctx = {p, wand, aim:{x,y}, dir:{x,y}, dmg, lvl}
import { G } from '../state.js';
import { spawnProjectile, spawnParticles, spawnEffect, spawnHazard, spawnAlly, enemiesInRadius, hitEnemy, nearestEnemy } from '../game/entities.js';
import { Audio } from '../engine/audio.js';
import { ELEMENT_COLORS } from '../engine/draw.js';

const col = e => ELEMENT_COLORS[e] || '#ffffff';
function spread(ctx, n, arc, opts = {}) {
  const base = Math.atan2(ctx.dir.y, ctx.dir.x);
  for (let i = 0; i < n; i++) {
    const a = n === 1 ? base : base - arc / 2 + arc * i / (n - 1);
    const sp = opts.speed || 230;
    spawnProjectile({ x: ctx.p.x, y: ctx.p.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: ctx.dmg * (opts.mul || 1), life: opts.life || 1.4, r: opts.r || 3, color: opts.color || col(ctx.wand.element), element: opts.element || ctx.wand.element, owner: 'player', pierce: opts.pierce || 0, homing: opts.homing || 0, effects: opts.effects || ctx.wand.effects || {}, trail: opts.trail ?? true, size: opts.size || 1, bounce: opts.bounce || 0, explode: opts.explode || 0, gravity: opts.gravity || 0 });
  }
}
function ring(ctx, n, opts = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 2 * i / n + (opts.offset || 0); const sp = opts.speed || 180;
    spawnProjectile({ x: ctx.p.x, y: ctx.p.y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, dmg: ctx.dmg * (opts.mul || 0.8), life: opts.life || 1.2, r: opts.r || 3, color: opts.color || col(ctx.wand.element), element: opts.element || ctx.wand.element, owner: 'player', pierce: opts.pierce || 0, effects: opts.effects || ctx.wand.effects || {}, trail: true, size: opts.size || 1, homing: opts.homing || 0 });
  }
}
function nova(ctx, r, mul, element, fx = {}, color) {
  const c = color || col(element);
  spawnEffect('ring', ctx.p.x, ctx.p.y, { r, color: c, dur: 0.4 });
  spawnParticles(ctx.p.x, ctx.p.y, 30, c, { speed: r * 2, life: 0.5 });
  for (const e of enemiesInRadius(ctx.p.x, ctx.p.y, r)) hitEnemy(e, ctx.dmg * mul, element, { ...fx, kx: (e.x - ctx.p.x), ky: (e.y - ctx.p.y), knock: fx.knock ?? 120 });
  G.shake(4);
}
function meteor(ctx, x, y, r, mul, element, delay = 0.7, color) {
  const c = color || col(element);
  spawnEffect('target', x, y, { r, color: c, dur: delay });
  spawnEffect('delayed', x, y, { delay, fn: () => {
    spawnEffect('explosion', x, y, { r, color: c, dur: 0.5 });
    spawnParticles(x, y, 40, c, { speed: r * 3, life: 0.6 });
    for (const e of enemiesInRadius(x, y, r)) hitEnemy(e, ctx.dmg * mul, element, { burn: element === 'fire' ? 3 : 0, kx: e.x - x, ky: e.y - y, knock: 160 });
    G.shake(8); Audio.play('explode');
  } });
}
function buff(ctx, id, val, dur, label, color) { ctx.p.addBuff(id, val, dur); G.float(ctx.p.x, ctx.p.y - 20, label, color || '#fff8c0'); }
function blink(ctx, maxDist) {
  const dx = ctx.aim.x - ctx.p.x, dy = ctx.aim.y - ctx.p.y; const d = Math.hypot(dx, dy) || 1; const dist = Math.min(d, maxDist);
  spawnParticles(ctx.p.x, ctx.p.y, 20, '#c070ff', { speed: 60, life: 0.4 });
  ctx.p.teleport(ctx.p.x + dx / d * dist, ctx.p.y + dy / d * dist);
  spawnParticles(ctx.p.x, ctx.p.y, 20, '#c070ff', { speed: 60, life: 0.4 });
}
function beam(ctx, len, mul, element, width = 10, color) {
  const c = color || col(element);
  const ex = ctx.p.x + ctx.dir.x * len, ey = ctx.p.y - 4 + ctx.dir.y * len;
  spawnEffect('beam', ctx.p.x, ctx.p.y - 4, { x2: ex, y2: ey, color: c, dur: 0.35, w: width });
  for (const e of G.enemies) {
    // distance from point to segment
    const px = e.x - ctx.p.x, py = e.y - (ctx.p.y - 4); const t = Math.max(0, Math.min(1, (px * ctx.dir.x + py * ctx.dir.y) / len));
    const cx = ctx.dir.x * len * t, cy = ctx.dir.y * len * t;
    if (Math.hypot(px - cx, py - cy) < width + e.r) hitEnemy(e, ctx.dmg * mul, element, { kx: ctx.dir.x, ky: ctx.dir.y, knock: 60 });
  }
  G.shake(3);
}
function chain(ctx, n, mul, element, range = 110) {
  let from = { x: ctx.p.x, y: ctx.p.y - 4 }; const hitSet = new Set(); let cur = nearestEnemy(ctx.aim.x, ctx.aim.y, 120);
  for (let i = 0; i < n && cur; i++) {
    spawnEffect('bolt', from.x, from.y, { x2: cur.x, y2: cur.y, color: col(element), dur: 0.25 });
    hitEnemy(cur, ctx.dmg * mul * Math.pow(0.85, i), element, { shock: element === 'lightning' ? 1.5 : 0 });
    hitSet.add(cur); from = cur;
    cur = G.enemies.filter(e => !hitSet.has(e) && Math.hypot(e.x - from.x, e.y - from.y) < range).sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y))[0];
  }
}
export const ABILITIES = {
  // ---- generic / neutral ----
  bolt_burst: { name: 'Bolt Burst', desc: 'Fire 5 bolts in a spread.', cd: 4, mana: 10, cast: c => spread(c, 5, 0.7, { mul: 0.8 }) },
  triple_shot: { name: 'Triple Shot', desc: 'Fire 3 strong bolts.', cd: 3, mana: 8, cast: c => spread(c, 3, 0.35, { mul: 1.2 }) },
  ring_shot: { name: 'Ring Shot', desc: '12 bolts in every direction.', cd: 7, mana: 20, cast: c => ring(c, 12) },
  dash: { name: 'Dash', desc: 'Dash forward, dodging attacks.', cd: 3, mana: 0, cast: c => { c.p.dash(c.dir.x, c.dir.y, 90); Audio.play('dash'); } },
  blink: { name: 'Blink', desc: 'Teleport toward the cursor.', cd: 5, mana: 15, cast: c => blink(c, 120) },
  far_blink: { name: 'Far Blink', desc: 'Teleport far toward the cursor.', cd: 6, mana: 25, cast: c => blink(c, 220) },
  shield: { name: 'Barrier', desc: 'Absorb 40 damage for 8s.', cd: 12, mana: 20, cast: c => { c.p.addShield(40 + c.lvl * 4, 8); Audio.play('heal'); } },
  great_shield: { name: 'Great Barrier', desc: 'Absorb 120 damage for 10s.', cd: 18, mana: 40, cast: c => { c.p.addShield(120 + c.lvl * 8, 10); Audio.play('heal'); } },
  heal: { name: 'Mend', desc: 'Heal 25% HP.', cd: 15, mana: 30, cast: c => { c.p.heal(c.p.maxHp * 0.25); Audio.play('heal'); spawnParticles(c.p.x, c.p.y, 15, '#8fe04a', { speed: 30, life: 0.8, gravity: -40 }); } },
  great_heal: { name: 'Restoration', desc: 'Heal 60% HP.', cd: 25, mana: 60, cast: c => { c.p.heal(c.p.maxHp * 0.6); Audio.play('heal'); spawnParticles(c.p.x, c.p.y, 30, '#8fe04a', { speed: 40, life: 1, gravity: -40 }); } },
  haste: { name: 'Haste', desc: '+50% speed for 6s.', cd: 12, mana: 15, cast: c => buff(c, 'speed', 0.5, 6, 'HASTE!', '#f5d33a') },
  berserk: { name: 'Berserk', desc: '+60% dmg, +40% rate for 8s.', cd: 20, mana: 30, cast: c => { buff(c, 'dmg', 0.6, 8, 'BERSERK!', '#d43a3a'); c.p.addBuff('rate', 0.4, 8); } },
  focus: { name: 'Focus', desc: '+50% crit chance for 8s.', cd: 18, mana: 20, cast: c => buff(c, 'crit', 0.5, 8, 'FOCUS', '#c070ff') },
  invis: { name: 'Vanish', desc: 'Enemies lose you for 5s.', cd: 20, mana: 25, cast: c => buff(c, 'invis', 1, 5, 'VANISH', '#a8a8b8') },
  mana_surge: { name: 'Mana Surge', desc: 'Restore 50% mana.', cd: 30, mana: 0, cast: c => { c.p.mana = Math.min(c.p.maxMana, c.p.mana + c.p.maxMana * 0.5); G.float(c.p.x, c.p.y - 20, '+MANA', '#5ad8f0'); } },
  stomp: { name: 'Stomp', desc: 'Knock back nearby foes.', cd: 6, mana: 10, cast: c => nova(c, 50, 0.8, 'earth', { knock: 220 }) },
  // ---- fire ----
  fireball: { name: 'Fireball', desc: 'Explosive fireball that burns.', cd: 5, mana: 15, cast: c => spread(c, 1, 0, { mul: 2.2, r: 5, size: 2, explode: 34, effects: { burn: 3 }, speed: 200, element: 'fire' }) },
  fire_nova: { name: 'Fire Nova', desc: 'Burn everything around you.', cd: 9, mana: 25, cast: c => nova(c, 64, 1.6, 'fire', { burn: 3 }) },
  flame_wave: { name: 'Flame Wave', desc: 'Wide wave of flames.', cd: 7, mana: 20, cast: c => spread(c, 7, 1.1, { mul: 0.9, effects: { burn: 2 }, element: 'fire', pierce: 2, life: 0.7, speed: 260 }) },
  meteor: { name: 'Meteor', desc: 'Call a meteor on the cursor.', cd: 12, mana: 35, cast: c => meteor(c, c.aim.x, c.aim.y, 44, 4, 'fire') },
  flame_dash: { name: 'Flame Dash', desc: 'Dash, leaving fire behind.', cd: 6, mana: 15, cast: c => { const sx = c.p.x, sy = c.p.y; c.p.dash(c.dir.x, c.dir.y, 100); for (let i = 0; i < 5; i++) spawnHazard({ x: sx + c.dir.x * i * 20, y: sy + c.dir.y * i * 20, r: 14, dmg: c.dmg * 0.4, dur: 3, tick: 0.4, color: '#ff6a1a', element: 'fire', effects: { burn: 2 } }); } },
  inferno: { name: 'Inferno', desc: 'Lingering firestorm at cursor.', cd: 15, mana: 40, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 52, dmg: c.dmg * 0.6, dur: 5, tick: 0.35, color: '#ff6a1a', element: 'fire', effects: { burn: 2 } }) },
  phoenix_dive: { name: 'Phoenix Dive', desc: 'Dash through enemies in flames, healing per hit.', cd: 8, mana: 25, cast: c => { c.p.dash(c.dir.x, c.dir.y, 130); for (const e of enemiesInRadius(c.p.x + c.dir.x * 60, c.p.y + c.dir.y * 60, 70)) { hitEnemy(e, c.dmg * 1.5, 'fire', { burn: 3 }); c.p.heal(5); } spawnParticles(c.p.x, c.p.y, 40, '#ff9a3a', { speed: 120, life: 0.6 }); } },
  // ---- ice ----
  ice_shard: { name: 'Ice Shards', desc: 'Piercing shards that slow.', cd: 4, mana: 12, cast: c => spread(c, 3, 0.3, { mul: 1.1, pierce: 3, effects: { freeze: 1.5 }, element: 'ice', speed: 300 }) },
  frost_nova: { name: 'Frost Nova', desc: 'Freeze all nearby enemies.', cd: 10, mana: 25, cast: c => { nova(c, 70, 1.0, 'ice', { freeze: 3, knock: 20 }); Audio.play('freeze'); } },
  blizzard: { name: 'Blizzard', desc: 'Freezing storm at the cursor.', cd: 14, mana: 40, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 60, dmg: c.dmg * 0.5, dur: 6, tick: 0.5, color: '#c8f0ff', element: 'ice', effects: { freeze: 1 }, slow: 0.5 }) },
  ice_wall: { name: 'Ice Wall', desc: 'Raise a wall of ice.', cd: 12, mana: 20, cast: c => { const px = -c.dir.y, py = c.dir.x; for (let i = -2; i <= 2; i++) spawnAlly('ice_block', c.p.x + c.dir.x * 40 + px * i * 14, c.p.y + c.dir.y * 40 + py * i * 14, 6); } },
  glacial_spike: { name: 'Glacial Spike', desc: 'Massive spike that shatters.', cd: 8, mana: 25, cast: c => spread(c, 1, 0, { mul: 3.5, r: 6, size: 2, explode: 30, effects: { freeze: 2.5 }, element: 'ice', speed: 170 }) },
  frozen_orb: { name: 'Frozen Orb', desc: 'Slow orb that sprays shards.', cd: 10, mana: 30, cast: c => spawnProjectile({ x: c.p.x, y: c.p.y - 4, vx: c.dir.x * 60, vy: c.dir.y * 60, dmg: c.dmg * 0.6, life: 2.5, r: 7, color: '#c8f0ff', element: 'ice', owner: 'player', pierce: 99, size: 2, effects: { freeze: 1 }, spray: { every: 0.15, n: 2, speed: 180, dmg: c.dmg * 0.5, color: '#c8f0ff', element: 'ice' } }) },
  // ---- lightning ----
  chain_lightning: { name: 'Chain Lightning', desc: 'Zap up to 5 enemies.', cd: 5, mana: 15, cast: c => { chain(c, 5, 1.6, 'lightning'); Audio.play('thunder'); } },
  storm_chain: { name: 'Storm Chain', desc: 'Zap up to 10 enemies.', cd: 7, mana: 25, cast: c => { chain(c, 10, 2.2, 'lightning', 140); Audio.play('thunder'); } },
  thunder_strike: { name: 'Thunder Strike', desc: 'Lightning from the sky at cursor.', cd: 6, mana: 18, cast: c => { meteor(c, c.aim.x, c.aim.y, 36, 3, 'lightning', 0.3); } },
  static_field: { name: 'Static Field', desc: 'Shocking aura for 6s.', cd: 14, mana: 30, cast: c => spawnHazard({ x: c.p.x, y: c.p.y, r: 56, dmg: c.dmg * 0.5, dur: 6, tick: 0.4, color: '#f5d33a', element: 'lightning', follow: c.p, effects: { shock: 0.5 } }) },
  lightning_dash: { name: 'Lightning Dash', desc: 'Dash at lightning speed, shocking foes.', cd: 4, mana: 12, cast: c => { c.p.dash(c.dir.x, c.dir.y, 150); for (const e of enemiesInRadius(c.p.x + c.dir.x * 70, c.p.y + c.dir.y * 70, 80)) hitEnemy(e, c.dmg * 1.2, 'lightning', { shock: 1 }); Audio.play('thunder'); } },
  ball_lightning: { name: 'Ball Lightning', desc: 'Slow orb that zaps nearby foes.', cd: 10, mana: 30, cast: c => spawnProjectile({ x: c.p.x, y: c.p.y - 4, vx: c.dir.x * 50, vy: c.dir.y * 50, dmg: 0, life: 4, r: 8, color: '#f5d33a', element: 'lightning', owner: 'player', pierce: 99, size: 2, zap: { every: 0.3, range: 70, dmg: c.dmg * 0.7 } }) },
  // ---- nature / poison ----
  vine_grab: { name: 'Vine Grab', desc: 'Root enemies near cursor.', cd: 8, mana: 18, cast: c => { spawnEffect('ring', c.aim.x, c.aim.y, { r: 50, color: '#8fe04a', dur: 0.5 }); for (const e of enemiesInRadius(c.aim.x, c.aim.y, 50)) hitEnemy(e, c.dmg * 0.8, 'nature', { root: 3 }); } },
  thorn_burst: { name: 'Thorn Burst', desc: 'Thorns in every direction.', cd: 6, mana: 15, cast: c => ring(c, 10, { mul: 0.9, pierce: 1, color: '#8fe04a', element: 'nature' }) },
  poison_cloud: { name: 'Poison Cloud', desc: 'Toxic cloud at cursor.', cd: 10, mana: 25, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 50, dmg: c.dmg * 0.4, dur: 6, tick: 0.5, color: '#8fe04a', element: 'poison', effects: { poison: 4 } }) },
  regrowth: { name: 'Regrowth', desc: 'Heal over time 10s.', cd: 18, mana: 25, cast: c => buff(c, 'regen', 4 + c.lvl * 0.5, 10, 'REGROWTH', '#8fe04a') },
  summon_sprout: { name: 'Sprout Guardians', desc: 'Summon 2 sprouts that fight for you.', cd: 20, mana: 30, cast: c => { spawnAlly('sprout', c.p.x - 20, c.p.y, 15); spawnAlly('sprout', c.p.x + 20, c.p.y, 15); } },
  seed_bomb: { name: 'Seed Bomb', desc: 'Lobbed seed that bursts into thorns.', cd: 6, mana: 15, cast: c => spawnProjectile({ x: c.p.x, y: c.p.y - 4, vx: c.dir.x * 160, vy: c.dir.y * 160, dmg: c.dmg * 1.5, life: 0.8, r: 5, color: '#8fe04a', element: 'nature', owner: 'player', size: 2, gravity: 0, onExpire: (p) => { for (let i = 0; i < 8; i++) { const a = Math.PI * 2 * i / 8; spawnProjectile({ x: p.x, y: p.y, vx: Math.cos(a) * 170, vy: Math.sin(a) * 170, dmg: c.dmg * 0.6, life: 0.7, r: 3, color: '#8fe04a', element: 'nature', owner: 'player', effects: { poison: 2 } }); } } }) },
  venom_spit: { name: 'Venom Spit', desc: 'Spray of poison bolts.', cd: 4, mana: 12, cast: c => spread(c, 6, 0.6, { mul: 0.7, effects: { poison: 4 }, color: '#8fe04a', element: 'poison', speed: 240 }) },
  plague: { name: 'Plague', desc: 'Poison every enemy on screen.', cd: 20, mana: 45, cast: c => { for (const e of enemiesInRadius(c.p.x, c.p.y, 320)) hitEnemy(e, c.dmg * 0.5, 'poison', { poison: 8 }); spawnEffect('ring', c.p.x, c.p.y, { r: 320, color: '#8fe04a', dur: 0.6 }); } },
  // ---- water ----
  tidal_wave: { name: 'Tidal Wave', desc: 'Wide wave that pushes enemies.', cd: 7, mana: 20, cast: c => spread(c, 9, 1.4, { mul: 0.8, pierce: 99, life: 0.6, speed: 220, effects: { knock: 200 }, color: '#5a9af0', element: 'water', size: 2 }) },
  bubble_shield: { name: 'Bubble Shield', desc: 'Absorb 60 dmg + heal 15%.', cd: 14, mana: 25, cast: c => { c.p.addShield(60 + c.lvl * 5, 8); c.p.heal(c.p.maxHp * 0.15); Audio.play('heal'); } },
  whirlpool: { name: 'Whirlpool', desc: 'Pull enemies to the cursor.', cd: 12, mana: 30, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 70, dmg: c.dmg * 0.4, dur: 4, tick: 0.3, color: '#3a6ad4', element: 'water', pull: 90 }) },
  water_jet: { name: 'Water Jet', desc: 'Piercing high-pressure jet.', cd: 4, mana: 12, cast: c => beam(c, 150, 1.8, 'water', 8) },
  bubble_barrage: { name: 'Bubble Barrage', desc: 'Lots of bouncing bubbles.', cd: 6, mana: 15, cast: c => spread(c, 8, 1.0, { mul: 0.5, bounce: 3, life: 2, speed: 150, color: '#90c0f0', element: 'water' }) },
  // ---- wind ----
  gust: { name: 'Gust', desc: 'Blow enemies away.', cd: 5, mana: 10, cast: c => { for (const e of enemiesInRadius(c.p.x, c.p.y, 90)) hitEnemy(e, c.dmg * 0.5, 'wind', { kx: e.x - c.p.x, ky: e.y - c.p.y, knock: 300 }); spawnEffect('ring', c.p.x, c.p.y, { r: 90, color: '#c8f0ff', dur: 0.4 }); } },
  tornado: { name: 'Tornado', desc: 'Send a tornado forward.', cd: 10, mana: 25, cast: c => spawnHazard({ x: c.p.x, y: c.p.y, r: 34, dmg: c.dmg * 0.5, dur: 4, tick: 0.3, color: '#c8f0ff', element: 'wind', vx: c.dir.x * 70, vy: c.dir.y * 70, pull: 60, effects: { knock: 50 } }) },
  wind_walk: { name: 'Wind Walk', desc: '+80% speed, pass through enemies 5s.', cd: 15, mana: 20, cast: c => { buff(c, 'speed', 0.8, 5, 'WIND WALK', '#c8f0ff'); c.p.addBuff('ghost', 1, 5); } },
  air_blades: { name: 'Air Blades', desc: 'Fast piercing blades.', cd: 3, mana: 8, cast: c => spread(c, 2, 0.15, { mul: 1.0, pierce: 4, speed: 380, color: '#e8f8ff', element: 'wind', life: 0.9 }) },
  cyclone: { name: 'Cyclone', desc: 'Spin and hit all around.', cd: 8, mana: 20, cast: c => { for (let i = 0; i < 4; i++) spawnEffect('delayed', c.p.x, c.p.y, { delay: i * 0.2, fn: () => nova(c, 55, 0.6, 'wind', { knock: 80 }) }); } },
  // ---- dark / shadow ----
  shadow_bolt: { name: 'Shadow Bolt', desc: 'Homing bolt of darkness.', cd: 4, mana: 12, cast: c => spread(c, 1, 0, { mul: 2.0, homing: 4, color: '#a04ad8', element: 'dark', life: 2 }) },
  life_drain: { name: 'Life Drain', desc: 'Damage nearby, heal yourself.', cd: 8, mana: 20, cast: c => { let total = 0; for (const e of enemiesInRadius(c.p.x, c.p.y, 70)) { hitEnemy(e, c.dmg * 1.2, 'dark', {}); total += c.dmg * 0.4; spawnEffect('bolt', e.x, e.y, { x2: c.p.x, y2: c.p.y, color: '#d43a3a', dur: 0.3 }); } c.p.heal(Math.min(total, c.p.maxHp * 0.3)); } },
  shadow_clone: { name: 'Shadow Clones', desc: 'Decoys that distract foes.', cd: 18, mana: 30, cast: c => { spawnAlly('clone', c.p.x - 24, c.p.y, 8); spawnAlly('clone', c.p.x + 24, c.p.y, 8); } },
  summon_skeleton: { name: 'Raise Dead', desc: 'Summon 2 skeleton warriors.', cd: 20, mana: 35, cast: c => { spawnAlly('skeleton', c.p.x - 20, c.p.y + 10, 20); spawnAlly('skeleton', c.p.x + 20, c.p.y + 10, 20); } },
  fear: { name: 'Terror', desc: 'Nearby enemies flee for 4s.', cd: 14, mana: 25, cast: c => { for (const e of enemiesInRadius(c.p.x, c.p.y, 100)) { e.fear = 4; } spawnEffect('ring', c.p.x, c.p.y, { r: 100, color: '#5a2a8a', dur: 0.5 }); } },
  void_rift: { name: 'Void Rift', desc: 'Rift that pulls and crushes.', cd: 14, mana: 40, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 60, dmg: c.dmg * 0.7, dur: 4, tick: 0.3, color: '#5a2a8a', element: 'dark', pull: 110 }) },
  shadow_step: { name: 'Shadow Step', desc: 'Teleport behind the nearest enemy and strike.', cd: 6, mana: 15, cast: c => { const e = nearestEnemy(c.aim.x, c.aim.y, 200); if (e) { spawnParticles(c.p.x, c.p.y, 15, '#5a2a8a', { speed: 50, life: 0.4 }); c.p.teleport(e.x + 14, e.y + 4); hitEnemy(e, c.dmg * 3, 'dark', {}); } else blink(c, 100); } },
  // ---- holy / light ----
  holy_beam: { name: 'Holy Beam', desc: 'Piercing beam of light.', cd: 5, mana: 15, cast: c => beam(c, 180, 2.0, 'holy', 10) },
  smite: { name: 'Smite', desc: 'Divine strike at cursor.', cd: 7, mana: 20, cast: c => meteor(c, c.aim.x, c.aim.y, 40, 3.5, 'holy', 0.4) },
  consecrate: { name: 'Consecrate', desc: 'Holy ground that heals you and burns foes.', cd: 16, mana: 35, cast: c => spawnHazard({ x: c.p.x, y: c.p.y, r: 60, dmg: c.dmg * 0.5, dur: 6, tick: 0.5, color: '#fff8c0', element: 'holy', healPlayer: 4 }) },
  divine_shield: { name: 'Divine Shield', desc: 'Invulnerable for 3s.', cd: 25, mana: 40, cast: c => { c.p.invuln = Math.max(c.p.invuln, 3); buff(c, 'divine', 1, 3, 'DIVINE', '#fff8c0'); } },
  radiant_burst: { name: 'Radiant Burst', desc: 'Light in every direction, blinding foes.', cd: 8, mana: 20, cast: c => ring(c, 16, { mul: 0.7, color: '#fff8c0', element: 'holy', effects: { stun: 1 } }) },
  // ---- arcane ----
  arcane_missiles: { name: 'Arcane Missiles', desc: '6 homing missiles.', cd: 5, mana: 18, cast: c => spread(c, 6, 1.2, { mul: 0.8, homing: 6, color: '#c070ff', element: 'arcane', life: 2.5, speed: 160 }) },
  arcane_orb: { name: 'Arcane Orb', desc: 'Big slow orb that pierces all.', cd: 8, mana: 25, cast: c => spread(c, 1, 0, { mul: 3, pierce: 99, r: 8, size: 3, speed: 90, life: 2.5, color: '#c070ff', element: 'arcane' }) },
  time_slow: { name: 'Time Dilation', desc: 'Enemies move at 30% for 5s.', cd: 20, mana: 40, cast: c => { G.timeSlow = 5; spawnEffect('ring', c.p.x, c.p.y, { r: 300, color: '#60a890', dur: 1 }); } },
  mirror_image: { name: 'Mirror Images', desc: '3 clones that shoot with you.', cd: 22, mana: 40, cast: c => { for (let i = 0; i < 3; i++) spawnAlly('mirror', c.p.x + Math.cos(i * 2.1) * 26, c.p.y + Math.sin(i * 2.1) * 26, 10); } },
  prism: { name: 'Prism', desc: 'Split your next shots into 3 for 8s.', cd: 15, mana: 25, cast: c => buff(c, 'multishot', 2, 8, 'PRISM', '#c070ff') },
  gravity_well: { name: 'Gravity Well', desc: 'Pull enemies to cursor and crush.', cd: 12, mana: 35, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 80, dmg: c.dmg * 0.5, dur: 3, tick: 0.3, color: '#c070ff', element: 'arcane', pull: 140 }) },
  // ---- earth ----
  earthquake: { name: 'Earthquake', desc: 'Stun all nearby enemies.', cd: 12, mana: 30, cast: c => { nova(c, 90, 1.2, 'earth', { stun: 2, knock: 40 }); G.shake(12); } },
  boulder: { name: 'Boulder', desc: 'Heavy rolling boulder.', cd: 7, mana: 18, cast: c => spread(c, 1, 0, { mul: 3.2, pierce: 5, r: 7, size: 3, speed: 140, life: 2, color: '#a8a8b8', element: 'earth', effects: { knock: 150 } }) },
  stone_skin: { name: 'Stone Skin', desc: '+15 defense for 10s.', cd: 18, mana: 20, cast: c => buff(c, 'def', 15 + c.lvl, 10, 'STONE SKIN', '#a8a8b8') },
  spike_trap: { name: 'Spike Field', desc: 'Spikes erupt at cursor.', cd: 8, mana: 20, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 45, dmg: c.dmg * 0.8, dur: 4, tick: 0.5, color: '#b8541a', element: 'earth', slow: 0.5 }) },
  // ---- chaos ----
  chaos_bolt: { name: 'Chaos Bolt', desc: 'Random element bolt with random effects.', cd: 3, mana: 10, cast: c => { const els = ['fire', 'ice', 'lightning', 'poison', 'dark', 'holy']; const el = els[Math.floor(Math.random() * 6)]; spread(c, 1 + Math.floor(Math.random() * 4), 0.6, { mul: 1 + Math.random() * 2, element: el, color: col(el), effects: { burn: el === 'fire' ? 3 : 0, freeze: el === 'ice' ? 2 : 0, shock: el === 'lightning' ? 1 : 0, poison: el === 'poison' ? 3 : 0 }, homing: Math.random() < 0.3 ? 4 : 0, bounce: Math.random() < 0.3 ? 2 : 0 }); } },
  wild_magic: { name: 'Wild Magic', desc: 'Cast a random ability!', cd: 6, mana: 20, cast: c => { const keys = Object.keys(ABILITIES).filter(k => !ABILITIES[k].ultimate && k !== 'wild_magic'); const a = ABILITIES[keys[Math.floor(Math.random() * keys.length)]]; G.float(c.p.x, c.p.y - 24, a.name + '!', '#ff3a7a'); a.cast(c); } },
  jester_trick: { name: "Jester's Trick", desc: 'Swap places with an enemy, confusing all nearby.', cd: 8, mana: 15, cast: c => { const e = nearestEnemy(c.aim.x, c.aim.y, 200); if (e) { const ex = e.x, ey = e.y; e.x = c.p.x; e.y = c.p.y; c.p.teleport(ex, ey); for (const o of enemiesInRadius(c.p.x, c.p.y, 80)) o.confused = 4; } } },
  coin_toss: { name: 'Coin Toss', desc: 'Throw coins! Heads: big damage. Tails: coins drop.', cd: 5, mana: 10, cast: c => { if (Math.random() < 0.5) spread(c, 5, 0.5, { mul: 2, color: '#f5d33a', element: 'neutral' }); else { for (let i = 0; i < 3; i++) G.dropItem('coins', 1 + Math.floor(Math.random() * 3), c.p.x + (Math.random() - 0.5) * 40, c.p.y + (Math.random() - 0.5) * 40); } } },
  // ---- special themed ----
  honey_trap: { name: 'Honey Trap', desc: 'Sticky honey slows enemies 70%.', cd: 8, mana: 15, cast: c => spawnHazard({ x: c.aim.x, y: c.aim.y, r: 50, dmg: c.dmg * 0.2, dur: 6, tick: 0.5, color: '#f5d33a', element: 'nature', slow: 0.3 }) },
  bee_swarm: { name: 'Bee Swarm', desc: 'Summon angry bees.', cd: 12, mana: 25, cast: c => { for (let i = 0; i < 4; i++) spawnAlly('bee', c.p.x + (Math.random() - 0.5) * 30, c.p.y + (Math.random() - 0.5) * 30, 10); } },
  spore_cloud: { name: 'Spore Cloud', desc: 'Confusing spores at cursor.', cd: 8, mana: 18, cast: c => { spawnHazard({ x: c.aim.x, y: c.aim.y, r: 50, dmg: c.dmg * 0.3, dur: 5, tick: 0.5, color: '#f07ad0', element: 'poison', effects: { poison: 2 } }); for (const e of enemiesInRadius(c.aim.x, c.aim.y, 50)) e.confused = 4; } },
  sugar_rush: { name: 'Sugar Rush', desc: '+70% speed & rate for 5s.', cd: 14, mana: 15, cast: c => { buff(c, 'speed', 0.7, 5, 'SUGAR RUSH!', '#f07ad0'); c.p.addBuff('rate', 0.7, 5); } },
  pumpkin_bomb: { name: 'Pumpkin Bomb', desc: 'Lob an exploding pumpkin.', cd: 6, mana: 15, cast: c => spread(c, 1, 0, { mul: 2.5, explode: 40, r: 6, size: 2, speed: 180, color: '#f08a2a', element: 'fire', effects: { burn: 2 }, life: 0.9 }) },
  soul_harvest: { name: 'Soul Harvest', desc: 'Kill blows heal you for 8s.', cd: 18, mana: 20, cast: c => buff(c, 'lifesteal', 0.3, 8, 'SOUL HARVEST', '#a04ad8') },
  spirit_wolves: { name: 'Spirit Wolves', desc: 'Summon 3 ghost wolves.', cd: 20, mana: 35, cast: c => { for (let i = 0; i < 3; i++) spawnAlly('wolf', c.p.x + (i - 1) * 22, c.p.y + 14, 15); } },
  crystal_shards: { name: 'Crystal Shards', desc: 'Shards that bounce off enemies.', cd: 4, mana: 12, cast: c => spread(c, 4, 0.5, { mul: 1.0, bounce: 3, color: '#c8a0f0', element: 'crystal', speed: 260, life: 1.5 }) },
  mithril_storm: { name: 'Mithril Storm', desc: 'Rain of silver blades.', cd: 9, mana: 25, cast: c => { for (let i = 0; i < 10; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.08, fn: () => meteor(c, c.aim.x + (Math.random() - 0.5) * 70, c.aim.y + (Math.random() - 0.5) * 70, 18, 0.9, 'neutral', 0.2, '#e8f8ff') }); } },
  blood_pact: { name: 'Blood Pact', desc: 'Spend 20% HP for +100% dmg 6s.', cd: 15, mana: 0, cast: c => { c.p.hp = Math.max(1, c.p.hp - c.p.maxHp * 0.2); buff(c, 'dmg', 1.0, 6, 'BLOOD PACT', '#d43a3a'); } },
  lunar_blessing: { name: 'Lunar Blessing', desc: 'At night: heal fully. Day: +30% dmg.', cd: 30, mana: 30, cast: c => { if (G.time > 0.75 || G.time < 0.2) { c.p.heal(c.p.maxHp); G.float(c.p.x, c.p.y - 20, 'MOONLIGHT', '#c8f0ff'); } else buff(c, 'dmg', 0.3, 10, 'SUNLIGHT', '#f5d33a'); } },
  // ================= ULTIMATES (V) =================
  meteor_storm: { ultimate: true, name: 'METEOR STORM', desc: 'Rain 12 meteors around you.', cd: 60, mana: 80, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 12; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.18, fn: () => meteor(c, c.p.x + (Math.random() - 0.5) * 260, c.p.y + (Math.random() - 0.5) * 180, 40, 3, 'fire', 0.5) }); } },
  black_hole: { ultimate: true, name: 'BLACK HOLE', desc: 'Pull everything in and crush it.', cd: 60, mana: 80, cast: c => { Audio.play('ultimate'); spawnHazard({ x: c.aim.x, y: c.aim.y, r: 150, dmg: c.dmg * 1.2, dur: 5, tick: 0.25, color: '#5a2a8a', element: 'dark', pull: 220, core: true }); spawnEffect('delayed', c.aim.x, c.aim.y, { delay: 5, fn: () => { spawnEffect('explosion', c.aim.x, c.aim.y, { r: 120, color: '#c070ff', dur: 0.7 }); for (const e of enemiesInRadius(c.aim.x, c.aim.y, 120)) hitEnemy(e, c.dmg * 10, 'dark', {}); G.shake(20); Audio.play('explode'); } }); } },
  time_stop: { ultimate: true, name: 'TIME STOP', desc: 'Freeze time for 6s.', cd: 70, mana: 80, cast: c => { Audio.play('ultimate'); G.timeStop = 6; spawnEffect('ring', c.p.x, c.p.y, { r: 400, color: '#60a890', dur: 1.5 }); G.notify('ZA WARUDO! Time has stopped.', '#60a890'); } },
  phoenix_rebirth: { ultimate: true, name: 'PHOENIX REBIRTH', desc: 'Full heal, fire wings, burn all for 8s.', cd: 90, mana: 60, cast: c => { Audio.play('ultimate'); c.p.heal(c.p.maxHp); c.p.addBuff('phoenix', 1, 8); c.p.addBuff('speed', 0.4, 8); c.p.addBuff('dmg', 0.5, 8); spawnHazard({ x: c.p.x, y: c.p.y, r: 70, dmg: c.dmg * 0.8, dur: 8, tick: 0.3, color: '#ff9a3a', element: 'fire', follow: c.p, effects: { burn: 3 } }); } },
  supernova: { ultimate: true, name: 'SUPERNOVA', desc: 'Obliterate every enemy on screen.', cd: 80, mana: 100, cast: c => { Audio.play('ultimate'); spawnEffect('flash', 0, 0, { color: '#fff8c0', dur: 0.6 }); spawnEffect('explosion', c.p.x, c.p.y, { r: 330, color: '#fff8c0', dur: 0.8 }); for (const e of enemiesInRadius(c.p.x, c.p.y, 330)) hitEnemy(e, c.dmg * 12, 'holy', { stun: 2 }); G.shake(25); Audio.play('explode'); } },
  army_of_dead: { ultimate: true, name: 'ARMY OF THE DEAD', desc: 'Summon 8 skeletons for 25s.', cd: 75, mana: 80, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 8; i++) { const a = Math.PI * 2 * i / 8; spawnAlly('skeleton', c.p.x + Math.cos(a) * 30, c.p.y + Math.sin(a) * 30, 25); } } },
  world_tree: { ultimate: true, name: 'WORLD TREE', desc: 'Massive healing grove that roots and crushes foes.', cd: 80, mana: 90, cast: c => { Audio.play('ultimate'); spawnHazard({ x: c.p.x, y: c.p.y, r: 140, dmg: c.dmg * 0.9, dur: 10, tick: 0.4, color: '#8fe04a', element: 'nature', healPlayer: 8, effects: { root: 1 } }); spawnAlly('sprout', c.p.x - 30, c.p.y, 20); spawnAlly('sprout', c.p.x + 30, c.p.y, 20); spawnAlly('sprout', c.p.x, c.p.y + 30, 20); } },
  stormlord: { ultimate: true, name: 'STORMLORD', desc: 'Lightning rains on all enemies for 8s.', cd: 70, mana: 90, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 24; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.33, fn: () => { const es = enemiesInRadius(c.p.x, c.p.y, 320); if (es.length) { const e = es[Math.floor(Math.random() * es.length)]; meteor(c, e.x, e.y, 30, 2.5, 'lightning', 0.15); } Audio.play('thunder'); } }); } },
  absolute_zero: { ultimate: true, name: 'ABSOLUTE ZERO', desc: 'Freeze every enemy solid for 8s, then shatter.', cd: 75, mana: 90, cast: c => { Audio.play('ultimate'); spawnEffect('flash', 0, 0, { color: '#c8f0ff', dur: 0.5 }); for (const e of enemiesInRadius(c.p.x, c.p.y, 330)) hitEnemy(e, c.dmg * 2, 'ice', { freeze: 8 }); spawnEffect('delayed', 0, 0, { delay: 7.5, fn: () => { for (const e of enemiesInRadius(c.p.x, c.p.y, 330)) hitEnemy(e, c.dmg * 8, 'ice', {}); G.shake(15); Audio.play('explode'); } }); } },
  dragon_form: { ultimate: true, name: 'DRAGON FORM', desc: 'Become a dragon: fly, breathe fire for 10s.', cd: 90, mana: 80, cast: c => { Audio.play('ultimate'); c.p.addBuff('dragon', 1, 10); c.p.addBuff('speed', 0.6, 10); c.p.addBuff('dmg', 1.0, 10); c.p.addBuff('rate', 1.0, 10); c.p.addBuff('fly', 1, 10); } },
  judgment: { ultimate: true, name: 'JUDGMENT OF LUMIS', desc: 'Beams of pure light sweep the screen.', cd: 90, mana: 100, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 12; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.25, fn: () => { const a = i * 0.52; const ctx2 = { ...c, dir: { x: Math.cos(a), y: Math.sin(a) } }; beam(ctx2, 320, 4, 'light', 16, '#ffffff'); } }); } },
  rainbow_cataclysm: { ultimate: true, name: 'RAINBOW CATACLYSM', desc: 'Casts THREE random ultimates.', cd: 100, mana: 120, cast: c => { const ults = Object.keys(ABILITIES).filter(k => ABILITIES[k].ultimate && k !== 'rainbow_cataclysm'); for (let i = 0; i < 3; i++) { const a = ABILITIES[ults[Math.floor(Math.random() * ults.length)]]; spawnEffect('delayed', 0, 0, { delay: i * 1.2, fn: () => { G.notify(a.name + '!', '#ff3a7a'); a.cast(c); } }); } } },
  chronos_rewind: { ultimate: true, name: 'CHRONOS REWIND', desc: 'Restore HP/mana to 5s ago, enemies rewound and stunned.', cd: 60, mana: 60, cast: c => { Audio.play('ultimate'); c.p.hp = Math.max(c.p.hp, c.p.hpHistory || c.p.hp); c.p.mana = c.p.maxMana; for (const e of enemiesInRadius(c.p.x, c.p.y, 330)) { if (e.posHistory) { e.x = e.posHistory.x; e.y = e.posHistory.y; } e.stun = 4; } G.timeSlow = 5; spawnEffect('ring', c.p.x, c.p.y, { r: 330, color: '#60a890', dur: 1 }); } },
  kraken_rise: { ultimate: true, name: 'KRAKEN RISE', desc: 'Tentacles erupt all around for 8s.', cd: 70, mana: 85, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 6; i++) { const a = Math.PI * 2 * i / 6; spawnAlly('tentacle', c.p.x + Math.cos(a) * 60, c.p.y + Math.sin(a) * 60, 8); } spawnHazard({ x: c.p.x, y: c.p.y, r: 120, dmg: c.dmg * 0.5, dur: 8, tick: 0.4, color: '#3a6ad4', element: 'water', pull: 60 }); } },
  starfall: { ultimate: true, name: 'STARFALL', desc: 'Stars crash down across the whole screen.', cd: 80, mana: 90, cast: c => { Audio.play('ultimate'); for (let i = 0; i < 20; i++) spawnEffect('delayed', 0, 0, { delay: i * 0.12, fn: () => meteor(c, c.p.x + (Math.random() - 0.5) * 320, c.p.y + (Math.random() - 0.5) * 220, 34, 2.5, 'arcane', 0.35, '#fff8c0') }); } },
  void_collapse: { ultimate: true, name: 'VOID COLLAPSE', desc: 'The void devours all nearby enemies.', cd: 90, mana: 100, cast: c => { Audio.play('ultimate'); spawnEffect('flash', 0, 0, { color: '#0a0414', dur: 0.8 }); for (const e of enemiesInRadius(c.p.x, c.p.y, 200)) { hitEnemy(e, c.dmg * 15, 'dark', {}); spawnParticles(e.x, e.y, 20, '#5a2a8a', { speed: 80, life: 0.6 }); } G.shake(20); } },
};
for (const k in ABILITIES) ABILITIES[k].id = k;
