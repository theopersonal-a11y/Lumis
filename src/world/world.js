import { T, TILE_DEFS, OBJ, isSolidTile, isLiquidTile } from '../data/tiles.js';
import { POIS, OBJ_LEGEND, TILE_LEGEND } from '../data/pois.js';
import { makeNoise, hash2, mulberry32 } from '../engine/rng.js';
export const BIOMES = ['meadow', 'forest', 'dark_forest', 'desert', 'tundra', 'swamp', 'volcanic', 'mountain', 'mushroom', 'beach', 'ocean', 'village', 'graveyard'];
export const BIOME_ID = {}; BIOMES.forEach((b, i) => BIOME_ID[b] = i);
export const BIOME_NAMES = { meadow: 'Sunny Meadows', forest: 'Whispering Forest', dark_forest: 'Gloomwood', desert: 'Scorched Sands', tundra: 'Frostreach', swamp: 'Murkmire', volcanic: 'Cinderlands', mountain: 'Stormpeaks', mushroom: 'Sporewood', beach: 'Saltshore', ocean: 'The Endless Sea', village: 'Everdawn', graveyard: 'Hollow Graves' };
const W = 256, H = 256, CX = 128, CY = 128;
export class World {
  constructor(seed) {
    this.seed = seed; this.W = W; this.H = H;
    this.tiles = new Uint8Array(W * H); this.biome = new Uint8Array(W * H); this.objs = new Array(W * H).fill(null);
    this.objState = new Map(); this.changes = {}; this.chestsOpened = {}; this.regrow = [];
    this.pois = []; this.npcSpawns = []; this.petSpawns = []; this.enemySpawns = []; this.bossSpawns = []; this.spawn = { x: CX * 16 + 8, y: CY * 16 + 8 };
    this.stations = []; this.beacon = null; this.signs = [];
    this.generate();
  }
  idx(x, y) { return y * W + x; }
  inb(x, y) { return x >= 0 && y >= 0 && x < W && y < H; }
  get(x, y) { return this.inb(x, y) ? this.tiles[y * W + x] : T.DEEP; }
  set(x, y, t) { if (this.inb(x, y)) this.tiles[y * W + x] = t; }
  obj(x, y) { return this.inb(x, y) ? this.objs[y * W + x] : null; }
  setObj(x, y, o, record = false) { if (!this.inb(x, y)) return; this.objs[y * W + x] = o; if (record) this.changes[x + ',' + y] = o; }
  biomeAt(x, y) { return this.inb(x, y) ? BIOMES[this.biome[y * W + x]] : 'ocean'; }
  solid(x, y, flags = {}) {
    if (!this.inb(x, y)) return true;
    const t = this.tiles[y * W + x];
    const d = TILE_DEFS[t];
    if (d.solid) { if (d.liquid && (flags.fly || flags.swim)) return false; if (flags.ghost && d.wall) return false; return true; }
    if (t === T.LAVA && !(flags.fly || flags.fireproof)) return !!flags.avoidLava;
    const o = this.objs[y * W + x];
    if (o && OBJ[o] && OBJ[o].solid) return !flags.fly || OBJ[o].tall || !OBJ[o].tall; // objects block everyone (flying pets hop over small? keep simple: block)
    return false;
  }
  liquid(x, y) { return isLiquidTile(this.get(x, y)); }
  generate() {
    const n1 = makeNoise(this.seed), n2 = makeNoise(this.seed + 77), n3 = makeNoise(this.seed + 991), n4 = makeNoise(this.seed + 4242);
    // POI positions
    for (const p of POIS) {
      const a = p.pos[0] * Math.PI / 180, d = p.pos[1];
      const px = Math.round(CX + Math.cos(a) * d), py = Math.round(CY + Math.sin(a) * d);
      this.pois.push({ def: p, id: p.id, name: p.name, tx: px, ty: py, x: px * 16 + 8, y: py * 16 + 8, radius: p.radius || 10 });
    }
    // 1. Biomes
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = x - CX, dy = y - CY; let d = Math.hypot(dx, dy); let ang = Math.atan2(dy, dx) * 180 / Math.PI; if (ang < 0) ang += 360;
      const wob = (n1.fbm(x / 28, y / 28, 3) - 0.5) * 36; const wobA = (n2.fbm(x / 40, y / 40, 3) - 0.5) * 40;
      const dd = d + wob; let aa = (ang + wobA + 360) % 360;
      let b = 'meadow';
      if (d < 24) b = 'village';
      else if (dd > 113) b = 'ocean';
      else if (dd > 106) b = 'beach';
      else if (aa >= 247 && aa < 292) b = dd > 58 ? 'tundra' : dd > 38 ? 'forest' : 'meadow';
      else if (aa >= 292 && aa < 337) b = dd > 56 ? 'mountain' : 'forest';
      else if (aa >= 337 || aa < 22) b = dd > 52 ? 'desert' : 'meadow';
      else if (aa >= 22 && aa < 67) b = dd > 70 ? 'volcanic' : dd > 45 ? 'desert' : 'meadow';
      else if (aa >= 67 && aa < 112) b = dd > 95 ? 'beach' : dd > 52 ? 'swamp' : 'meadow';
      else if (aa >= 112 && aa < 157) b = dd > 48 ? 'mushroom' : 'meadow';
      else if (aa >= 157 && aa < 202) b = dd > 30 ? 'forest' : 'meadow';
      else b = dd > 46 ? 'dark_forest' : 'forest';
      this.biome[y * W + x] = BIOME_ID[b];
    }
    // POI biome forcing
    for (const p of this.pois) {
      const fb = p.def.biome; if (!fb) continue; const r = p.radius + 4;
      for (let y = p.ty - r; y <= p.ty + r; y++) for (let x = p.tx - r; x <= p.tx + r; x++) {
        if (!this.inb(x, y)) continue; const d = Math.hypot(x - p.tx, y - p.ty) + (n3.noise(x / 6, y / 6) - 0.5) * 5;
        if (d <= r && this.biome[y * W + x] !== BIOME_ID.ocean) this.biome[y * W + x] = BIOME_ID[fb];
      }
    }
    // 2. Tiles
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const b = BIOMES[this.biome[y * W + x]]; const e = n2.fbm(x / 22, y / 22, 4); const h = hash2(x, y, this.seed); const dC = Math.hypot(x - CX, y - CY);
      let t = T.GRASS;
      switch (b) {
        case 'meadow': t = h < 0.06 ? T.FLOWERS : h < 0.1 ? T.DIRT : T.GRASS; break;
        case 'village': t = h < 0.05 ? T.FLOWERS : T.GRASS; break;
        case 'forest': t = e > 0.55 ? T.DGRASS : h < 0.08 ? T.DIRT : T.GRASS; break;
        case 'dark_forest': t = h < 0.1 ? T.MUD : T.DGRASS; break;
        case 'graveyard': t = h < 0.15 ? T.DIRT : T.DGRASS; break;
        case 'desert': t = h < 0.08 ? T.SANDSTONE : T.SAND; break;
        case 'tundra': t = e > 0.62 ? T.ICE : h < 0.06 ? T.STONE : T.SNOW; break;
        case 'swamp': t = e < 0.42 ? T.WATER : e < 0.47 ? T.MUD : T.SWAMP; break;
        case 'volcanic': t = e < 0.36 ? T.LAVA : h < 0.1 ? T.OBSIDIAN : T.ASH; break;
        case 'mountain': t = e > 0.7 ? T.CLIFF : h < 0.3 ? T.GRAVEL : T.STONE; break;
        case 'mushroom': t = h < 0.1 ? T.DIRT : T.MGRASS; break;
        case 'beach': t = T.SAND; break;
        case 'ocean': t = dC > 120 ? T.DEEP : T.WATER; break;
      }
      // lakes
      if (b !== 'village' && b !== 'ocean' && b !== 'volcanic' && b !== 'mountain' && dC > 30 && e < 0.3) t = T.WATER;
      this.tiles[y * W + x] = t;
    }
    // shallow rims
    const copy = this.tiles.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      if (copy[y * W + x] === T.WATER) {
        const land = [copy[y * W + x - 1], copy[y * W + x + 1], copy[(y - 1) * W + x], copy[(y + 1) * W + x]].some(tt => !isLiquidTile(tt) && tt !== T.SHALLOW);
        if (land && this.biomeAt(x, y) !== 'ocean') this.tiles[y * W + x] = T.SHALLOW;
      }
      if (copy[y * W + x] === T.CLIFF) { // cliffs only where neighbours are also high: thin out
        const cliffs = [copy[y * W + x - 1], copy[y * W + x + 1], copy[(y - 1) * W + x], copy[(y + 1) * W + x]].filter(tt => tt === T.CLIFF).length;
        if (cliffs < 2) this.tiles[y * W + x] = T.STONE;
      }
    }
    // 3. Objects
    const rnd = mulberry32(this.seed + 5);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const t = this.tiles[y * W + x]; if (isLiquidTile(t) || isSolidTile(t) || t === T.SHALLOW) { if (t === T.SHALLOW && hash2(x, y, 9) < 0.15) this.objs[y * W + x] = this.biomeAt(x, y) === 'swamp' ? 'lily' : 'reed'; continue; }
      const b = BIOMES[this.biome[y * W + x]]; const h = hash2(x, y, this.seed + 3), h2 = hash2(x, y, this.seed + 9); const dC = Math.hypot(x - CX, y - CY);
      let o = null;
      const dens = n4.fbm(x / 12, y / 12, 2); // clumping
      switch (b) {
        case 'meadow': if (h < 0.03) o = 'tree_oak'; else if (h < 0.045) o = 'rock'; else if (h < 0.06) o = 'bush'; else if (h < 0.075) o = 'berry_bush'; else if (h < 0.13) o = h2 < 0.5 ? 'flowers1' : 'flowers2'; else if (h < 0.2) o = 'tallgrass'; else if (h < 0.206) o = 'ore_copper'; else if (h < 0.209) o = 'hive'; break;
        case 'village': if (h < 0.02 && dC > 14) o = 'tree_oak'; else if (h < 0.08) o = h2 < 0.5 ? 'flowers1' : 'flowers2'; else if (h < 0.1) o = 'tallgrass'; else if (h < 0.105 && dC > 16) o = 'berry_bush'; break;
        case 'forest': if (h < 0.12 + dens * 0.1) o = h2 < 0.6 ? 'tree_oak' : 'tree_pine'; else if (h < 0.24) o = 'bush'; else if (h < 0.26) o = 'rock'; else if (h < 0.275) o = 'berry_bush'; else if (h < 0.29) o = 'shrooms'; else if (h < 0.3) o = 'stump'; else if (h < 0.305) o = 'ore_copper'; else if (h < 0.31) o = 'ore_iron'; else if (h < 0.33) o = 'tallgrass'; else if (h < 0.333) o = 'log'; break;
        case 'dark_forest': if (h < 0.14 + dens * 0.1) o = h2 < 0.5 ? 'tree_dead' : 'tree_pine'; else if (h < 0.17) o = 'web'; else if (h < 0.19) o = 'shrooms'; else if (h < 0.2) o = 'bones'; else if (h < 0.21) o = 'rock'; else if (h < 0.215) o = 'ore_iron'; else if (h < 0.218) o = 'ore_coal'; else if (h < 0.22) o = 'spider_egg'; break;
        case 'graveyard': if (h < 0.06) o = 'tree_dead'; else if (h < 0.1) o = 'grave'; else if (h < 0.12) o = 'bones'; else if (h < 0.13) o = 'skulls'; else if (h < 0.14) o = 'cross'; break;
        case 'desert': if (h < 0.05) o = 'cactus'; else if (h < 0.07) o = 'rock'; else if (h < 0.08) o = 'bones'; else if (h < 0.086) o = 'ore_gold'; else if (h < 0.09) o = 'ore_copper'; else if (h < 0.092) o = 'skulls'; else if (h < 0.096) o = 'tree_palm'; break;
        case 'tundra': if (h < 0.07 + dens * 0.05) o = 'tree_snowpine'; else if (h < 0.1) o = 'rock'; else if (h < 0.12) o = 'icespike'; else if (h < 0.126) o = 'ore_iron'; else if (h < 0.13) o = 'ore_mithril'; else if (h < 0.132) o = 'snowman'; else if (h < 0.134) o = 'ore_crystal'; break;
        case 'swamp': if (h < 0.08) o = 'tree_swamp'; else if (h < 0.12) o = 'reed'; else if (h < 0.15) o = 'shrooms'; else if (h < 0.16) o = 'log'; else if (h < 0.17) o = 'bones'; else if (h < 0.175) o = 'ore_coal'; else if (h < 0.19) o = 'tallgrass'; break;
        case 'volcanic': if (h < 0.08) o = 'lavarock'; else if (h < 0.1) o = 'rock'; else if (h < 0.115) o = 'ore_obsidian'; else if (h < 0.125) o = 'ore_coal'; else if (h < 0.13) o = 'tree_dead'; else if (h < 0.134) o = 'ore_gold'; else if (h < 0.136) o = 'bones'; break;
        case 'mountain': if (h < 0.1) o = 'rock'; else if (h < 0.13) o = 'ore_iron'; else if (h < 0.15) o = 'ore_copper'; else if (h < 0.16) o = 'ore_gold'; else if (h < 0.172) o = 'ore_crystal'; else if (h < 0.18) o = 'ore_mithril'; else if (h < 0.19) o = 'ore_coal'; else if (h < 0.21) o = 'tree_pine'; else if (h < 0.213) o = 'ore_star'; else if (h < 0.22) o = 'shard'; break;
        case 'mushroom': if (h < 0.07 + dens * 0.05) o = 'tree_shroom'; else if (h < 0.15) o = 'shrooms'; else if (h < 0.17) o = 'tree_oak'; else if (h < 0.19) o = 'bush'; else if (h < 0.2) o = 'rock'; else if (h < 0.205) o = 'ore_crystal'; else if (h < 0.22) o = 'tallgrass'; break;
        case 'beach': if (h < 0.03) o = 'tree_palm'; else if (h < 0.05) o = 'rock'; else if (h < 0.065) o = 'coral'; else if (h < 0.07) o = 'bones'; else if (h < 0.072) o = 'ore_copper'; else if (h < 0.075) o = 'reed'; break;
      }
      if (o) this.objs[y * W + x] = o;
    }
    // 4. Stamp POIs
    for (const p of this.pois) this.stamp(p);
    // 5. Paths from village to nearby POIs
    for (const p of this.pois) { if (p.id === 'village') continue; if (p.def.pos[1] <= 48) { const a = p.def.pos[0] * Math.PI / 180; this.carvePath(Math.round(CX + Math.cos(a) * 21), Math.round(CY + Math.sin(a) * 19), p.tx, p.ty + Math.floor(p.def.structure.length / 2) + 1); } }
    // 6. Clear spawn area
    for (let y = CY - 3; y <= CY + 3; y++) for (let x = CX - 3; x <= CX + 3; x++) if (this.objs[y * W + x] && !['lamp', 'beacon', 'fountain', 'well', 'sign'].includes(this.objs[y * W + x])) this.objs[y * W + x] = null;
  }
  stamp(p) {
    const rows = p.def.structure; const h = rows.length; const w = Math.max(...rows.map(r => r.length));
    const ox = p.tx - Math.floor(w / 2), oy = p.ty - Math.floor(h / 2); const ov = p.def.objOverride || {};
    p.bounds = { x: ox, y: oy, w, h };
    // clear objects in the bounding box (except for ',' tiles which keep terrain but lose trees that would block paths only near markers)
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || ','; const tx = ox + x, ty = oy + y; if (!this.inb(tx, ty)) continue;
      if (ch !== ',') { this.objs[ty * W + tx] = null; }
      else if (hash2(tx, ty, 77) < 0.6) { const o = this.objs[ty * W + tx]; if (o && OBJ[o].solid) this.objs[ty * W + tx] = null; }
    }
    const npcIdx = [];
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x] || ','; const tx = ox + x, ty = oy + y; if (!this.inb(tx, ty) || ch === ',') continue;
      // tile
      let tile = null;
      if (ch === '#') tile = p.def.wall; else if (ch in TILE_LEGEND) { const v = TILE_LEGEND[ch]; tile = v === 'wall' ? p.def.wall : v === 'floor' ? p.def.floor : v; }
      else tile = p.def.floor;
      if (ch === '"' && p.def.floor !== T.FLOWERS) tile = T.FLOWERS;
      this.tiles[ty * W + tx] = tile;
      if (ch === 'D') { p.door = p.door || { x: tx, y: ty }; }
      // object
      let oid = ov[ch] || OBJ_LEGEND[ch];
      if (ch === 'Y' && p.def.objOverride && p.def.objOverride.Y) oid = p.def.objOverride.Y;
      if (oid) {
        if (oid === 'chest' || oid === 'gold_chest') this.objState.set(tx + ',' + ty, { tier: p.def.chestTier || 1, poi: p.id, gold: oid === 'gold_chest' });
        if (OBJ[oid].station) this.stations.push({ x: tx, y: ty, type: OBJ[oid].station });
        if (oid === 'beacon') this.beacon = { x: tx, y: ty };
        if (oid === 'sign') this.signs.push({ x: tx, y: ty, text: p.def.desc });
        this.objs[ty * W + tx] = oid;
      }
      if (ch >= '1' && ch <= '9') { const i = parseInt(ch) - 1; const nid = (p.def.npcs || [])[i]; if (nid) this.npcSpawns.push({ id: nid, x: tx * 16 + 8, y: ty * 16 + 8, poi: p.id }); }
      if (ch === '0') this.spawn = { x: tx * 16 + 8, y: ty * 16 + 8 };
      if (ch === '*') this.bossSpawns.push({ poi: p.id, boss: p.def.boss, x: tx * 16 + 8, y: ty * 16 + 8 });
      if (ch === '!') this.enemySpawns.push({ poi: p.id, enemies: p.def.enemies || [], x: tx * 16 + 8, y: ty * 16 + 8 });
      if (ch === '?') this.petSpawns.push({ poi: p.id, pets: p.def.pets || null, x: tx * 16 + 8, y: ty * 16 + 8, biome: this.biomeAt(tx, ty) });
    }
    // extras
    if (p.def.palms) for (let i = 0; i < 8; i++) { const ax = p.tx + Math.round((hash2(i, 1, p.tx) - 0.5) * 18), ay = p.ty + Math.round((hash2(i, 2, p.ty) - 0.5) * 14); if (this.inb(ax, ay) && this.get(ax, ay) === T.SAND && !this.obj(ax, ay)) this.setObj(ax, ay, 'tree_palm'); }
    if (p.def.ores) { const list = ['ore_iron', 'ore_gold', 'ore_crystal', 'ore_mithril', 'ore_coal', 'ore_copper']; let placed = 0; for (let i = 0; i < 400 && placed < 18; i++) { const ax = p.bounds.x + 1 + Math.floor(hash2(i, 3, p.tx) * (w - 2)), ay = p.bounds.y + 1 + Math.floor(hash2(i, 4, p.ty) * (h - 2)); const ch = (rows[ay - oy] || '')[ax - ox]; if (ch === '.' && !this.obj(ax, ay) && Math.hypot(ax - p.tx, ay - p.ty) > 2) { this.setObj(ax, ay, list[Math.floor(hash2(i, 5, p.tx) * list.length)]); placed++; } } }
    if (p.def.starOre) { let placed = 0; for (let i = 0; i < 300 && placed < 4; i++) { const ax = p.bounds.x + 1 + Math.floor(hash2(i, 6, p.tx) * (w - 2)), ay = p.bounds.y + 1 + Math.floor(hash2(i, 7, p.ty) * (h - 2)); const ch = (rows[ay - oy] || '')[ax - ox]; if ((ch === ']' || ch === '/' || ch === '.') && !this.obj(ax, ay) && Math.hypot(ax - p.tx, ay - p.ty) > 2) { this.setObj(ax, ay, 'ore_star'); placed++; } } }
  }
  carvePath(x0, y0, x1, y1) {
    const n = makeNoise(this.seed + x1 * 7 + y1);
    const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 1.5);
    for (let i = 0; i <= steps; i++) {
      const t = i / steps; const wob = (n.noise(i / 8, 0) - 0.5) * 4 * Math.sin(t * Math.PI);
      const dx = x1 - x0, dy = y1 - y0; const len = Math.hypot(dx, dy) || 1; const px = -dy / len, py = dx / len;
      const x = Math.round(x0 + dx * t + px * wob), y = Math.round(y0 + dy * t + py * wob);
      if (!this.inb(x, y)) continue;
      const tt = this.get(x, y); const d = TILE_DEFS[tt];
      if (d.wall) continue; // don't carve through walls
      if (d.liquid || tt === T.SHALLOW) this.set(x, y, T.BRIDGE); else if (tt !== T.WOOD && tt !== T.CARPET && tt !== T.MARBLE && tt !== T.BRICK && tt !== T.STONE && tt !== T.GRAVEL && tt !== T.SANDSTONE) this.set(x, y, T.PATH);
      const o = this.obj(x, y); if (o && !['lamp', 'sign', 'chest', 'gold_chest', 'fountain', 'well', 'beacon', 'altar', 'anvil', 'cauldron', 'portal', 'campfire'].includes(o)) this.setObj(x, y, null);
    }
  }
  nearestStation(px, py, type, r = 64) { return this.stations.find(s => s.type === type && Math.hypot(s.x * 16 + 8 - px, s.y * 16 + 8 - py) < r); }
  poiAt(px, py) { const tx = px / 16, ty = py / 16; return this.pois.find(p => p.bounds && tx >= p.bounds.x - 2 && tx < p.bounds.x + p.bounds.w + 2 && ty >= p.bounds.y - 2 && ty < p.bounds.y + p.bounds.h + 2); }
  applyChanges(changes, chests, day = 1) {
    this.changes = changes || {}; this.chestsOpened = chests || {};
    for (const k in this.changes) { const [x, y] = k.split(',').map(Number); const orig = this.objs[y * W + x]; if (this.changes[k] === null && orig && OBJ[orig] && OBJ[orig].regrow) { this.regrow.push({ x, y, o: orig, t: OBJ[orig].regrow * (0.3 + Math.random() * 0.7) }); } this.objs[y * W + x] = this.changes[k]; }
    for (const k in this.chestsOpened) { const [x, y] = k.split(',').map(Number); const openedDay = this.chestsOpened[k]; if (typeof openedDay === 'number' && day - openedDay >= 3) { delete this.chestsOpened[k]; delete this.changes[k]; const st = this.objState.get(k); this.objs[y * W + x] = st && st.gold ? 'gold_chest' : 'chest'; continue; } if (this.objs[y * W + x] === 'chest' || this.objs[y * W + x] === 'gold_chest') this.objs[y * W + x] = 'chest_open'; }
  }
  refillChests(day) { for (const k in this.chestsOpened) { const openedDay = this.chestsOpened[k]; if (typeof openedDay === 'number' && day - openedDay >= 3) { const [x, y] = k.split(',').map(Number); delete this.chestsOpened[k]; delete this.changes[k]; const st = this.objState.get(k); if (this.objs[y * W + x] === 'chest_open') this.objs[y * W + x] = st && st.gold ? 'gold_chest' : 'chest'; } } }
  harvest(x, y) { // returns true when object destroyed
    const o = this.obj(x, y); if (!o) return false; const def = OBJ[o]; if (!def.harvest) return false;
    const k = x + ',' + y; const st = this.objState.get(k) || {}; st.hits = (st.hits || 0) + 1; this.objState.set(k, st);
    if (st.hits >= def.harvest.hits) { this.setObj(x, y, null, true); this.objState.delete(k); if (def.regrow) this.regrow.push({ x, y, o, t: def.regrow }); return true; }
    return false;
  }
  tick(dt) { for (let i = this.regrow.length - 1; i >= 0; i--) { const r = this.regrow[i]; r.t -= dt; if (r.t <= 0) { if (!this.obj(r.x, r.y)) { this.setObj(r.x, r.y, r.o, true); delete this.changes[r.x + ',' + r.y]; } this.regrow.splice(i, 1); } } }
}
