// Data integrity check: run with `npm run check`. Stubs the DOM so data modules load under Node.
globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, drawImage() {}, translate() {}, scale() {} }), width: 0, height: 0 }), getElementById: () => null, fonts: { load: async () => {} } };
globalThis.window = { addEventListener() {} }; globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
const { ITEMS } = await import('../src/data/items.js');
const { WANDS, WAND_LIST } = await import('../src/data/wands.js');
const { ARMOR, ARMOR_LIST } = await import('../src/data/armor.js');
const { PETS, PET_LIST } = await import('../src/data/pets.js');
const { ENEMIES, ENEMY_LIST } = await import('../src/data/enemies.js');
const { NPCS, NPC_LIST } = await import('../src/data/npcs.js');
const { QUESTS, QUEST_LIST } = await import('../src/data/quests.js');
const { POIS } = await import('../src/data/pois.js');
const { OBJ } = await import('../src/data/tiles.js');
const { RECIPES } = await import('../src/game/crafting.js');
const { ABILITIES } = await import('../src/data/abilities.js');
let errors = 0;
for (const id in WANDS) if (ITEMS[id] || ARMOR[id]) { errors++; console.log('ERROR: id collision wand/item', id); }
for (const id in ARMOR) if (ITEMS[id]) { errors++; console.log('ERROR: id collision armor/item', id); } const err = m => { errors++; console.log('ERROR:', m); };
const known = id => ITEMS[id] || ARMOR[id] || WANDS[id];
for (const w of WAND_LIST) { for (const [id] of w.recipe) if (!known(id)) err(`wand ${w.id} recipe item ${id}`); for (const k of ['E', 'Q', 'C', 'V']) { const a = w.abilities[k]; if (a && !ABILITIES[a]) err(`wand ${w.id} ability ${a}`); } if (!w.abilities.E || !w.abilities.Q || !w.abilities.C) err(`wand ${w.id} missing EQC`); if ((w.rarity === 'mythic' || w.rarity === 'secret') && !w.abilities.V) err(`wand ${w.id} rare but no V`); if (w.abilities.V && !ABILITIES[w.abilities.V].ultimate) err(`wand ${w.id} V not ultimate`); }
for (const a of ARMOR_LIST) for (const [id] of a.recipe) if (!known(id)) err(`armor ${a.id} recipe item ${id}`);
for (const r of RECIPES) { if (!known(r.id)) err(`recipe result ${r.id}`); for (const [id] of r.ingredients) if (!known(id)) err(`recipe ${r.id} ingredient ${id}`); }
for (const e of ENEMY_LIST) { for (const [id] of e.drops || []) if (!known(id)) err(`enemy ${e.id} drop ${id}`); for (const b of e.biomes) if (b.startsWith('poi:') && !POIS.find(p => p.id === b.slice(4))) err(`enemy ${e.id} poi ${b}`); if (e.poi && !POIS.find(p => p.id === e.poi)) err(`boss ${e.id} poi ${e.poi}`); }
for (const n of NPC_LIST) for (const id of n.shop || []) if (!known(id)) err(`npc ${n.id} shop ${id}`);
for (const q of QUEST_LIST) { if (!NPCS[q.giver]) err(`quest ${q.id} giver ${q.giver}`); for (const [id] of q.rewards.items || []) if (!known(id)) err(`quest ${q.id} reward ${id}`); if (q.requires && !QUESTS[q.requires]) err(`quest ${q.id} requires ${q.requires}`); for (const o of q.objectives) { if (o.type === 'kill' && !ENEMIES[o.target]) err(`quest ${q.id} kill ${o.target}`); if (o.type === 'gather' && !known(o.item)) err(`quest ${q.id} gather ${o.item}`); if (o.type === 'boss' && !ENEMIES[o.id]) err(`quest ${q.id} boss ${o.id}`); if (o.type === 'talk' && !NPCS[o.npc]) err(`quest ${q.id} talk ${o.npc}`); if (o.type === 'tame' && o.pet && !PETS[o.pet]) err(`quest ${q.id} pet ${o.pet}`); if (o.type === 'visit' && !POIS.find(p => p.id === o.poi)) err(`quest ${q.id} visit ${o.poi}`); if (o.type === 'craft') for (const id of [].concat(o.id)) if (!known(id)) err(`quest ${q.id} craft ${id}`); } if (!NPC_LIST.some(n => POIS.some(p => (p.npcs || []).includes(n.id)) && n.id === q.giver)) err(`quest ${q.id} giver ${q.giver} not placed in any POI`); }
for (const p of POIS) { for (const n of p.npcs || []) if (n && !NPCS[n]) err(`poi ${p.id} npc ${n}`); for (const id of p.pets || []) if (!PETS[id]) err(`poi ${p.id} pet ${id}`); for (const id of p.enemies || []) if (!ENEMIES[id]) err(`poi ${p.id} enemy ${id}`); if (p.boss && !ENEMIES[p.boss]) err(`poi ${p.id} boss ${p.boss}`); if (p.boss && !p.structure.some(r => r.includes('*'))) err(`poi ${p.id} has boss but no * marker`); const markers = p.structure.join('').match(/[1-9]/g) || []; for (const m of markers) if (!(p.npcs || [])[parseInt(m) - 1]) err(`poi ${p.id} marker ${m} has no npc`); }
for (const pt of PET_LIST) for (const w of pt.where) if (w.startsWith('poi:') && !POIS.find(p => p.id === w.slice(4))) err(`pet ${pt.id} poi ${w}`);
for (const k in OBJ) for (const [id] of (OBJ[k].harvest ? OBJ[k].harvest.drops : [])) if (!known(id)) err(`obj ${k} drop ${id}`);
// pet food types all obtainable
const foods = new Set(Object.values(ITEMS).filter(i => i.food).map(i => i.food)); for (const pt of PET_LIST) if (!foods.has(pt.food)) err(`pet ${pt.id} food ${pt.food} has no item`);
// reachability of pets: each pet appears in some biome or POI list or egg
for (const pt of PET_LIST) { const inPoi = POIS.some(p => (p.pets || []).includes(pt.id)); const biome = pt.where.some(w => !w.startsWith('poi:') && !w.startsWith('egg:')); const egg = pt.where.some(w => w.startsWith('egg:')); if (!inPoi && !biome && !egg) err(`pet ${pt.id} unreachable`); }
console.log(`Items ${Object.keys(ITEMS).length} | Wands ${WAND_LIST.length} (V: ${WAND_LIST.filter(w => w.abilities.V).length}) | Armor ${ARMOR_LIST.length} | Pets ${PET_LIST.length} | Enemies ${ENEMY_LIST.length} | NPCs ${NPC_LIST.length} | Quests ${QUEST_LIST.length} | POIs ${POIS.length} | Abilities ${Object.keys(ABILITIES).length} | Objects ${Object.keys(OBJ).length}`);
console.log(errors ? `${errors} errors` : 'All data references OK');
process.exit(errors ? 1 : 0);
