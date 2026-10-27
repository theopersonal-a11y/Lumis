import { makeTile, makeSprite } from '../engine/sprites.js';
export const T = { GRASS: 0, DIRT: 1, SAND: 2, WATER: 3, DEEP: 4, STONE: 5, SNOW: 6, SWAMP: 7, LAVA: 8, PATH: 9, WOOD: 10, WALL: 11, DGRASS: 12, ASH: 13, ICE: 14, CRYSTAL: 15, MGRASS: 16, BRICK: 17, WWALL: 18, RWALL: 19, CARPET: 20, OBSIDIAN: 21, SWALL: 22, GRAVEL: 23, BRIDGE: 24, CLIFF: 25, SANDSTONE: 26, MARBLE: 27, CWALL: 28, DARKFLOOR: 29, VOID: 30, GOLDFLOOR: 31, MUD: 32, FLOWERS: 33, BONEFLOOR: 34, HEDGE: 35, IRONBARS: 36, SHALLOW: 37, GLASSFLOOR: 38, RUNE: 39 };
export const TILE_DEFS = [
  { name: 'Grass', base: '#4f9a3a', sp: ['#5cae44', '#3f8530', '#6cc050'], count: 18 },
  { name: 'Dirt', base: '#7a5a3a', sp: ['#8a6a46', '#6a4a2e', '#9a7a56'] },
  { name: 'Sand', base: '#e2cf90', sp: ['#eedaa0', '#d4bf80', '#f2e2b0'] },
  { name: 'Water', base: '#2f6bd0', sp: ['#3a7ae0', '#2a5cb8', '#5a9af0'], liquid: true, solid: true, wide: true, count: 8 },
  { name: 'Deep Water', base: '#1f3f98', sp: ['#2a4fb0', '#182f80'], liquid: true, solid: true, wide: true, count: 6 },
  { name: 'Stone', base: '#7a7a86', sp: ['#8a8a96', '#6a6a76', '#9a9aa6'] },
  { name: 'Snow', base: '#e8f0f8', sp: ['#f4f8ff', '#d8e4f0', '#ffffff'] },
  { name: 'Swamp', base: '#3f5a2a', sp: ['#4a6a30', '#304a20', '#5a7a3a', '#2a4a4a'] },
  { name: 'Lava', base: '#e04a10', sp: ['#ff8a2a', '#ffd040', '#b02a08'], liquid: true, dmg: 12, wide: true, count: 10, light: '#ff6a1a' },
  { name: 'Path', base: '#a08a60', sp: ['#b09a70', '#908050', '#c0aa80'], count: 10 },
  { name: 'Wood Floor', base: '#8a6a3a', sp: ['#9a7a46', '#7a5a2e'], wide: true, count: 12 },
  { name: 'Stone Wall', base: '#56566a', sp: ['#68687c', '#44445a', '#7a7a8e'], solid: true, wall: true, wide: true, count: 12 },
  { name: 'Dark Grass', base: '#2e6a2a', sp: ['#3a7a34', '#245a22', '#1a4a1a'], count: 18 },
  { name: 'Ash', base: '#4a4446', sp: ['#5a5456', '#3a3436', '#6a5a50'] },
  { name: 'Ice', base: '#a8dcf0', sp: ['#c8ecff', '#8ac8e8', '#e8f8ff'], slip: true, wide: true, count: 8 },
  { name: 'Crystal Floor', base: '#5a4a8a', sp: ['#7a6ab0', '#9a8ad0', '#c8a0f0'], count: 12 },
  { name: 'Mushroom Grass', base: '#5a8a5a', sp: ['#6a9a6a', '#a05aa0', '#4a7a4a', '#f07ad0'], count: 14 },
  { name: 'Brick', base: '#8a4a3a', sp: ['#9a5a4a', '#7a3a2a', '#5a2a1a'], wide: true, count: 14 },
  { name: 'Wood Wall', base: '#5a3a1a', sp: ['#6a4a2a', '#4a2a0a', '#7a5a3a'], solid: true, wall: true, wide: true, count: 10 },
  { name: 'Ruined Wall', base: '#5a5a66', sp: ['#3c6a3a', '#44445a', '#7a7a8e', '#4a7a40'], solid: true, wall: true, wide: true, count: 14 },
  { name: 'Carpet', base: '#8a1c2c', sp: ['#a02c3c', '#7a1020', '#c9a227'], count: 8 },
  { name: 'Obsidian', base: '#1a1428', sp: ['#2a2040', '#3a2a58', '#5a2a8a'], count: 8 },
  { name: 'Sandstone Wall', base: '#c0a060', sp: ['#d0b070', '#a08040', '#e0c080'], solid: true, wall: true, wide: true, count: 12 },
  { name: 'Gravel', base: '#8a8a7a', sp: ['#9a9a8a', '#7a7a6a', '#6a6a5a'], count: 20 },
  { name: 'Bridge', base: '#9a7a46', sp: ['#aa8a56', '#8a6a36', '#5a3a1a'], wide: true, count: 10 },
  { name: 'Cliff', base: '#4a4a58', sp: ['#5a5a68', '#3a3a48', '#2a2a38'], solid: true, wall: true, wide: true, count: 14 },
  { name: 'Sandstone', base: '#d8c080', sp: ['#e8d090', '#c8b070', '#b8a060'], wide: true, count: 10 },
  { name: 'Marble', base: '#d8d8e8', sp: ['#e8e8f8', '#c8c8d8', '#f8f8ff'], wide: true, count: 8 },
  { name: 'Crystal Wall', base: '#6a4aa8', sp: ['#8a6ac8', '#c8a0f0', '#4a2a88'], solid: true, wall: true, light: '#c070ff', count: 12 },
  { name: 'Dark Floor', base: '#2a2a36', sp: ['#34343f', '#20202a'], count: 8 },
  { name: 'Void', base: '#0a0414', sp: ['#1a0a30', '#5a2a8a', '#2a1050'], solid: true, count: 8 },
  { name: 'Gold Floor', base: '#c9a227', sp: ['#f5d33a', '#a08020', '#fff8c0'], count: 12 },
  { name: 'Mud', base: '#5a4a30', sp: ['#6a5a40', '#4a3a20'], slow: 0.6 },
  { name: 'Flower Field', base: '#4f9a3a', sp: ['#f07ad0', '#f5d33a', '#f4f4f8', '#d43a3a', '#5cae44'], count: 16 },
  { name: 'Bone Floor', base: '#8a8a7a', sp: ['#d8d8c8', '#6a6a5a', '#e8e8d8'], count: 12 },
  { name: 'Hedge', base: '#2a6a2a', sp: ['#3a8a3a', '#1a4a1a', '#4a9a4a'], solid: true, wall: true, count: 16 },
  { name: 'Iron Bars', base: '#3a3a48', sp: ['#6b6b7b', '#2b2b3a'], solid: true, wall: true, count: 20 },
  { name: 'Shallows', base: '#4a8ad8', sp: ['#6aa0e8', '#3a7ac8', '#8ac0f0'], liquid: true, slow: 0.55, wide: true, count: 8 },
  { name: 'Glass Floor', base: '#8ac8e8', sp: ['#a8dcf0', '#6ab0d8', '#e8f8ff'], wide: true, count: 6 },
  { name: 'Rune Floor', base: '#3a3a5a', sp: ['#5ad8f0', '#44446a', '#2a2a4a'], count: 10, light: '#5ad8f0' },
];
const tileCache = {};
export function tileSprite(id, variant = 0) {
  const k = id * 8 + variant;
  if (tileCache[k]) return tileCache[k];
  const d = TILE_DEFS[id] || TILE_DEFS[0];
  if (d.wall) return tileCache[k] = makeWallTile(id, d, variant);
  return tileCache[k] = makeTile(d.base, d.sp, id * 31 + variant * 7, { count: d.count, wide: d.wide });
}
function shade(hex, f) { const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16); const c = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${c(r)},${c(g)},${c(b)})`; }
function makeWallTile(id, d, variant) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 16; const ctx = c.getContext('2d');
  let s = id * 97 + variant * 13 + 1; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  ctx.fillStyle = d.base; ctx.fillRect(0, 0, 16, 16);
  if (id === T.WWALL) { // vertical planks
    for (let x = 0; x < 16; x += 4) { ctx.fillStyle = rnd() < 0.5 ? shade(d.base, 1.1) : d.base; ctx.fillRect(x, 0, 4, 16); ctx.fillStyle = shade(d.base, 0.55); ctx.fillRect(x, 0, 1, 16); if (rnd() < 0.4) { ctx.fillStyle = shade(d.base, 0.7); ctx.fillRect(x + 2, Math.floor(rnd() * 14), 1, 2); } }
    ctx.fillStyle = shade(d.base, 1.35); ctx.fillRect(0, 0, 16, 2); ctx.fillStyle = shade(d.base, 0.5); ctx.fillRect(0, 14, 16, 2);
  } else if (id === T.HEDGE) { for (let i = 0; i < 40; i++) { ctx.fillStyle = d.sp[Math.floor(rnd() * d.sp.length)]; ctx.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1 + Math.floor(rnd() * 2), 1); } ctx.fillStyle = shade(d.base, 0.5); ctx.fillRect(0, 14, 16, 2); ctx.fillStyle = shade(d.base, 1.3); ctx.fillRect(0, 0, 16, 1); }
  else if (id === T.IRONBARS) { ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.clearRect(0, 0, 16, 16); ctx.fillStyle = '#2b2b3a'; ctx.fillRect(0, 0, 16, 2); ctx.fillRect(0, 14, 16, 2); for (let x = 2; x < 16; x += 5) { ctx.fillStyle = '#6b6b7b'; ctx.fillRect(x, 0, 2, 16); ctx.fillStyle = '#a8a8b8'; ctx.fillRect(x, 0, 1, 16); } }
  else if (id === T.VOID) { for (let i = 0; i < 12; i++) { ctx.fillStyle = d.sp[Math.floor(rnd() * d.sp.length)]; ctx.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1); } ctx.fillStyle = '#5a2a8a'; ctx.fillRect(0, 0, 16, 1); }
  else { // bricks
    const bh = id === T.CLIFF ? 5 : 4; const mortar = shade(d.base, 0.55); const light = shade(d.base, 1.25);
    for (let y = 0; y < 16; y += bh) { const off = ((y / bh) % 2) * 4; for (let x = -4; x < 16; x += 8) { const bx = x + off; ctx.fillStyle = rnd() < 0.3 ? shade(d.base, 0.9) : rnd() < 0.3 ? shade(d.base, 1.08) : d.base; ctx.fillRect(bx, y, 8, bh); ctx.fillStyle = light; ctx.fillRect(bx, y, 7, 1); ctx.fillStyle = mortar; ctx.fillRect(bx, y + bh - 1, 8, 1); ctx.fillRect(bx + 7, y, 1, bh); } }
    if (id === T.RWALL) for (let i = 0; i < 8; i++) { ctx.fillStyle = ['#3c6a3a', '#4a7a40'][i % 2]; ctx.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1 + Math.floor(rnd() * 2), 1); }
    if (id === T.CWALL) for (let i = 0; i < 5; i++) { ctx.fillStyle = '#c8a0f0'; ctx.fillRect(Math.floor(rnd() * 16), Math.floor(rnd() * 16), 1, 1); }
    ctx.fillStyle = shade(d.base, 1.4); ctx.fillRect(0, 0, 16, 1); ctx.fillStyle = shade(d.base, 0.45); ctx.fillRect(0, 15, 16, 1);
  }
  return c;
}
export const isSolidTile = id => !!(TILE_DEFS[id] && TILE_DEFS[id].solid);
export const isLiquidTile = id => !!(TILE_DEFS[id] && TILE_DEFS[id].liquid);
export const isWallTile = id => !!(TILE_DEFS[id] && TILE_DEFS[id].wall);

// ---------------- WORLD OBJECTS ----------------
const OAK = [
'......dLLd......','....dLLLLLLd....','...dLLlLLLLLd...','..dLLLlLLLLLLd..','..dLLLLLLlLLLd..','.dLLLLLLLLLLLLd.','.dLLlLLLLLLlLLd.','.dLLLLLLLLLLLLd.','..dLLLLLlLLLLd..','..ddLLLLLLLLdd..','...ddLLLLLLdd...','.....ddLLdd.....','......dNNd......','......NnnN......','......NnnN......','......NnnN......','.....NNnnNN.....'];
const PINE = [
'.......dd.......','......dLLd......','......dLLd......','.....dLLLLd.....','.....dLlLLd.....','....dLLLLLLd....','....dLLLLLLd....','...dLLlLLLLLd...','...dLLLLLLLLd...','..dLLLLLLlLLLd..','..dLLLLLLLLLLd..','.dLLlLLLLLLLLLd.','.dLLLLLLLLLlLLd.','ddddddLLLLdddddd','......dNNd......','......NnnN......','......NnnN......','.....NNnnNN.....'];
const DEAD = [
'....N......N....','.....N....N.....','.N....N..N......','..N...N..N..N...','...N..NNN..N....','....NNNNNNN.....','......NNN.......','......NNN.......','.......N........','......NNN.......','......NNN.......','......NNN.......','.....NNNNN......'];
const PALM = [
'..L.........L...','.LLL..lLl..LLL..','..LLL.LLL.LLL...','...LLLLLLLLL....','..LLLLLLLLLLL...','.LLLL.NnN.LLLL..','LLL..NnnnN..LLL.','......NnN.......','......NnN.......','......NnN.......','.....NnN........','.....NnN........','....NnN.........','....NnN.........','...NNNNN........'];
const CRYSTALTREE = [
'.......v........','......vUv.......','.....vUUUv......','.....vUpUv......','....vUUUUUv.....','....vUpUUUv.....','...vUUUUpUUv....','...vUUUUUUUv....','....vvUUUvv.....','......vUv.......','......PpP.......','......PpP.......','......PpP.......','.....PPpPP......'];
const BIGSHROOM = [
'.....mmmmmm.....','...mmwmmmmwmm...','..mmmmmmmwmmmm..','.mmwmmmmmmmmmmm.','.mMMMMMMMMMMMMm.','..MMMMMMMMMMMM..','......TTTT......','......TtTT......','......TTtT......','......TTTT......','......TtTT......','.....TTTTTT.....'];
const CHERRY = [
'......mmmm......','....mmHmmmmm....','...mmmmmmHmmm...','..mmHmmmmmmmmm..','..mmmmmmmmHmmm..','.mmmmmHmmmmmmmm.','.mmmmmmmmmmmHmm.','..mmmHmmmmmmmm..','...mmmmmmHmmm...','....mmmmmmmm....','......dNNd......','......NnnN......','......NnnN......','.....NNnnNN.....'];
const SNOWPINE = [
'.......ww.......','......wLwd......','......dLLd......','.....wwLLLw.....','.....dLlLLd.....','....wwLLLLww....','....dLLLLLLd....','...wwLLlLLLww...','...dLLLLLLLLd...','..wwLLLLLLlLww..','..dLLLLLLLLLLd..','.wwwLLLLLLLLwww.','ddddddLLLLdddddd','......dNNd......','......NnnN......','.....NNnnNN.....'];
const SWAMPTREE = [
'..dJJd....dJJd..','.dJJJJdddJJJJd..','.dJJJJJJJJJJJJd.','..dJJJJzJJJJJd..','...dJJJJJJJJd...','....ddJJJJdd....','......NnnN......','......NnnN.z....','.....NnnnNz.....','....NNnnnNN.....','...NNNnnnNNN....','...NN..NN..NN...'];
const ROCK = ['....GGG.....','..GGGgGGG...','.GGgGGGGGg..','.GgGGGGGGGG.','.gGGGGGgGGg.','.gggGGGggg..','..ggggggg...'];
const ORE = (c, c2) => ['....GGG.....','..GGG' + c + 'GGG...','.GG' + c + 'G' + c2 + 'GGGg..','.GgGGGG' + c + 'GGG.','.gGG' + c2 + 'GGgGGg.','.ggg' + c + 'GGggg..','..ggggggg...'];
const BUSH = ['...LLLL.....','..LlLLLLL...','.LLLLLlLLL..','.LLlLLLLLLL.','..dLLLLlLd..','...ddLLdd...'];
const BERRY = ['...LLLL.....','..LrLLLLL...','.LLLLLrLLL..','.LrLLLLLLrL.','..dLLrLLLd..','...ddLLdd...'];
const CACTUS = ['....LL......','....LL......','.LL.LL.LL...','.LL.LL.LL...','.LLLLLLLL...','....LL......','....LL......','....LL......','....LL......','...dLLd.....'];
const CHEST = ['.NNNNNNNNNN.','NnnnnnnnnnnN','NnYYYYYYYYnN','NNNNNNNNNNNN','NnnnnYYnnnnN','NnnnnYYnnnnN','NNNNNNNNNNNN'];
const CHEST_OPEN = ['.NNNNNNNNNN.','NnnnnnnnnnnN','NkkkkkkkkkkN','NkkkyyyykkkN','NnnnnYYnnnnN','NnnnnYYnnnnN','NNNNNNNNNNNN'];
const GOLDCHEST = ['.YYYYYYYYYY.','YyyyyyyyyyyY','YyXXXXXXXXyY','YYYYYYYYYYYY','YyyyyXXyyyyY','YyyyyXXyyyyY','YYYYYYYYYYYY'];
const BED = ['NNNNNNNNNNNN','NwwwwbbbbbbN','NwwwwbbbbbbN','NrrrrbbbbbbN','NrrrrbbbbbbN','NNNNNNNNNNNN','.N........N.'];
const TABLE = ['.NNNNNNNNNN.','NnnnnnnnnnnN','NNNNNNNNNNNN','.N........N.','.N........N.'];
const SHELF = ['NNNNNNNNNNNN','NrbgybrpgbrN','NNNNNNNNNNNN','NybrgpbyrgbN','NNNNNNNNNNNN','NgrybbgrpbyN','NNNNNNNNNNNN'];
const ANVIL = ['..KKKKKKKK..','.KGGGGGGGGK.','..KKKKKKKK..','....KKKK....','....KKKK....','...KKKKKK...','..KKKKKKKK..'];
const CAULDRON = ['....lqlq....','..KKKKKKKK..','.KqqqqqqqqK.','.KKKKKKKKKK.','.KKKKKKKKKK.','..KKKKKKKK..','..KK....KK..'];
const ALTAR = ['....cUc.....','...GGGGG....','..GGcccGG...','.GGGGGGGGG..','.GGGGGGGGG..','.GgGGGGGgG..','GGGGGGGGGGG.'];
const STATUE = ['....GGG.....','....GgG.....','...GGGGG....','..GGGGGGG...','....GGG.....','....GGG.....','...GGGGG....','..gggggggg..','..gggggggg..'];
const GRAVE = ['...GGGGG....','..GGGGGGG...','..GGkkkGG...','..GGGGGGG...','..GGkkkGG...','..GGGGGGG...','.gggggggggg.'];
const CROSS = ['....gg......','...gggg.....','.gggggggg...','...gggg.....','....gg......','....gg......','....gg......','..gggggg....'];
const FENCE = ['NN....NN....','NNNNNNNNNNNN','NN....NN....','NNNNNNNNNNNN','NN....NN....','NN....NN....'];
const LAMP = ['....yy......','...yhhy.....','...yhhy.....','....yy......','....NN......','....NN......','....NN......','....NN......','....NN......','...NNNN.....'];
const TORCH = ['....xy......','...xyyx.....','....xx......','....NN......','....NN......','....NN......'];
const BARREL = ['.NNNNNNNN...','NnnnnnnnnN..','NNNNNNNNNN..','NnnnnnnnnN..','NnnnnnnnnN..','NNNNNNNNNN..','.NNNNNNNN...'];
const CRATE = ['NNNNNNNNNN..','NnnNnnNnnN..','NnNnnnnNnN..','NNNNNNNNNN..','NnNnnnnNnN..','NnnNnnNnnN..','NNNNNNNNNN..'];
const WELL = ['....NNNN....','...N....N...','..N......N..','.GGGGGGGGGG.','.GbbbbbbbbG.','.GbbbbbbbbG.','.GGGGGGGGGG.','.gggggggggg.'];
const SIGN = ['NNNNNNNNNNN.','NttttttttttN','NtNNtNNNtttN','NttttttttttN','NNNNNNNNNNN.','....NN......','....NN......'];
const PORTAL = ['...PPPPPP...','..PUUUUUUP..','.PUcccccUUP.','.PUcUUUUcUP.','.PUcUkkUcUP.','.PUcUkkUcUP.','.PUcUUUUcUP.','.PUcccccUUP.','..PUUUUUUP..','...PPPPPP...'];
const CAMPFIRE = ['....yy......','...xyyx.....','..xxyyxx....','.xxxxxxxx...','NNNnnnnNNN..','.NNNNNNNN...'];
const PILLAR = ['.GGGGGGGG...','.GgggggggG..','..GGGGGG....','..GGgGGG....','..GGGGGG....','..GGgGGG....','..GGGGGG....','..GGGGGG....','.GGGGGGGG...','.gggggggg...'];
const RUBBLE = ['............','...GG..G....','..GGGG.GG...','.GgGGGGGGg..','.gggggggggg.'];
const SHARD = ['....UU......','...UcUU.....','...UUcU.....','..UUcUUU....','..UUUUUU....','.PUUUUUUP...','..PPPPPP....'];
const REED = ['..L...L.....','..L.L.L.....','.LL.L.LL....','.L..L..L....','.L..L..L....','..LLLLL.....'];
const LILY = ['..LLLL......','.LLlLLL.....','.LLLmLL.....','..LLLL......'];
const BONES = ['.ww.........','w..w....ww..','.ww....w..w.','....wwwwww..','...w......w.'];
const WEB = ['w...w..w....','.w.w..w.....','..www.w.....','.w.w.ww.....','w...w..w....'];
const SHROOMS = ['..mm..rr....','.mwmm.rwr...','..TT..TT....','..TT..TT....'];
const ICESPIKE = ['....ii......','...iIi......','...iIii.....','..iiIii.....','..iiIiii....','.iiiIiii....','.cccccccc...'];
const FOUNTAIN = ['....cc......','...cccc.....','..GGGGGG....','..GbbbbG....','.GGbbbbGG...','.GbbbbbbG...','.GGGGGGGG...','.gggggggg...'];
const STUMP = ['..NNNNNN....','.NnnttnnN...','.NnttttnN...','.NnnttnnN...','.NNNNNNNN...','..NNNNNN....'];
const LOG = ['NNNNNNNNNNN.','NnnnnnnnnnnN','NtnnnnnnnnnN','NnnnnnnnnnnN','.NNNNNNNNNN.'];
const PUMPKIN = ['.....L......','..ooooooo...','.oOooooOoo..','.oOokoookoo.','.oOooooOoo..','..ooooooo...'];
const HAY = ['.yyyyyyyyy..','ySyyyyyyySy.','yyyySyyyyyy.','ySyyyyyyySy.','.yyyyyyyyy..'];
const SCARECROW = ['....yy......','...yTTy.....','..NNNNNNNN..','....nn......','....nn......','....nn......','...NNNN.....'];
const TOTEM = ['..rrrrrr....','..ryyyyr....','..rrrrrr....','..bbbbbb....','..bwwwwb....','..bbbbbb....','..LLLLLL....','..LyyyyL....','..LLLLLL....','..NNNNNN....'];
const BELL = ['....NN......','..NNNNNN....','..NYYYYN....','..NYyyYN....','..NYYYYN....','..NYYYYN....','..NNYYNN....','....YY......'];
const NEST = ['..nnnnnn....','.nNnwwnNn...','.nNwTTwNn...','.nnNNNNnn...','..nnnnnn....'];
const CORAL = ['.m..c..m....','mmm.cc.mmm..','.m.ccc..m...','..ccc.......','..cc........'];
const TENT = ['.....rr.....','....rrrr....','...rrrrrr...','..rrrkkrrr..','.rrrrkkrrrr.','rrrrrkkrrrrr'];
const CAGE = ['.KKKKKKKKK..','KK.K.K.K.KK.','K.K.K.K.K.K.','K.K.K.K.K.K.','K.K.K.K.K.K.','KKKKKKKKKKK.'];
const LANTERN = ['....NN......','...NhhN.....','...NhyN.....','...NhhN.....','....NN......'];
const CART = ['.NNNNNNNNN..','NtttttttttN.','NNNNNNNNNNN.','.gg.....gg..','.gg.....gg..'];
const BOOKS = ['....rrrr....','..bbbbbbbb..','.yyyyyyyyyy.','.pppppppppp.'];
const THRONE = ['YYYYYYYYYY..','YrrrrrrrrY..','YrrrrrrrrY..','YrrrrrrrrY..','YYrrrrrrYY..','YYYYYYYYYY..','Y........Y..'];
const BRAZIER = ['...xyyx.....','..xxyyxx....','...KKKK.....','..KKKKKK....','....KK......','...KKKK.....'];
const GARGOYLE = ['.K..KKK..K..','..KKKrKKK...','..KKKKKKK...','.KKKKKKKKK..','..KK...KK...','.ggggggggg..'];
const SKULLS = ['..www.......','.wkwkw.ww...','.wwwww.wkwkw','..w.w..wwwww','........w.w.'];
const LAVAROCK = ['....KKK.....','..KKxKKKK...','.KKKKxKKKK..','.KxKKKKKxK..','.KKKKKKKKK..','..KKKKKKK...'];
const OBELISK = ['....KK......','...KUUK.....','...KUKK.....','...KKUK.....','...KUUK.....','...KKKK.....','..KKKKKK....','.gggggggg...'];
const EGG = (a, b) => ['....' + a + a + '....', '...' + a + b + a + a + '...', '..' + a + a + a + b + a + a + '..', '..' + a + b + a + a + a + a + '..', '..' + a + a + a + a + b + a + '..', '...' + a + a + a + a + '...'];
const CRYSTALCLUSTER = ['...U....v...','..UUU..vUv..','..UcU.vUcUv.','.UUUU.vUUUv.','.UUUUUUUUUU.','..PPPPPPPP..'];
const FLOWERS1 = ['....r.......','...rwr.m....','....r.mwm...','..L..L.m....','..LL.LL.....'];
const FLOWERS2 = ['..y...b.....','.ywy.bwb....','..y...b.....','..L.L.L.....','..LLLL......'];
const TALLGRASS = ['.l..l.l.....','.l.l..l..l..','..ll.ll..l..','..l..l..l...','..L..L.LL...'];
const SNOWMAN = ['....ww......','...wkwkw....','...wwoww....','....ww......','...wwwww....','..wwkwwww...','..wwwwwww...','...wwwww....'];
const ANCHOR = ['....GG......','...GGGG.....','....GG......','.G..GG..G...','.GG.GG.GG...','..GGGGGG....','...GGGG.....'];
const BOAT = ['NNNNNNNNNNN.','.NnnnnnnnnN.','..NNNNNNNN..','...NNNNNN...'];
const DRUM = ['.rrrrrrrr...','rwwwwwwwwr..','rNNNNNNNNr..','rwwwwwwwwr..','.rrrrrrrr...'];
const MAILBOX = ['..bbbbbb....','.bbbbbbbb...','.bbrbbbbb...','..bbbbbb....','....NN......','....NN......'];
const HIVE = ['...yyyy.....','..yYyyYy....','..yyyyyy....','..yYkkYy....','..yyyyyy....','...yyyy.....'];
const SPIDEREGG = ['...wwww.....','..wGwwGw....','..wwGwww....','..wwwwGw....','...wwww.....'];
const MINECART = ['.KKKKKKKKK..','KgggggggggK.','KGGGGGGGGGK.','KKKKKKKKKKK.','.KK.....KK..'];
const PET_BED = ['.rrrrrrrrrr.','rNNNNNNNNNNr','rNtttttttttNr'.slice(0, 12),'rNtttttttttNr'.slice(0, 12),'.rrrrrrrrrr.'];
const BEACON = ['....hh......','...hyyh.....','..hyXXyh....','..hyXXyh....','...hyyh.....','....YY......','...GGGG.....','..GGGGGG....','.gggggggg...'];

const H = (type, hits, drops, extra = {}) => ({ type, hits, drops, ...extra });
export const OBJ = {
  tree_oak: { rows: OAK, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 4], ['apple', 0, 1, 0.35], ['stick', 1, 2]]), regrow: 180, hitbox: [5, 12, 6, 5] },
  tree_pine: { rows: PINE, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 4], ['pinecone', 0, 1, 0.3], ['stick', 1, 2]]), regrow: 180, hitbox: [5, 13, 6, 5] },
  tree_snowpine: { rows: SNOWPINE, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 4], ['frost_sap', 0, 1, 0.2]]), regrow: 200, hitbox: [5, 12, 6, 4] },
  tree_dead: { rows: DEAD, solid: true, tall: true, harvest: H('wood', 2, [['wood', 1, 3], ['bone', 0, 1, 0.25], ['shadow_essence', 0, 1, 0.08]]), regrow: 240, hitbox: [4, 8, 6, 5] },
  tree_palm: { rows: PALM, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 3], ['coconut', 0, 2, 0.5]]), regrow: 180, hitbox: [3, 10, 6, 5] },
  tree_crystal: { rows: CRYSTALTREE, solid: true, tall: true, harvest: H('stone', 4, [['crystal', 1, 3], ['arcane_dust', 0, 2, 0.4]]), regrow: 300, hitbox: [5, 9, 5, 5], light: '#c070ff' },
  tree_shroom: { rows: BIGSHROOM, solid: true, tall: true, harvest: H('wood', 3, [['mushroom', 2, 4], ['glow_cap', 0, 1, 0.3], ['spore', 1, 2]]), regrow: 160, hitbox: [5, 6, 6, 6] },
  tree_cherry: { rows: CHERRY, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 3], ['cherry', 1, 3], ['petal', 1, 2]]), regrow: 180, hitbox: [5, 9, 6, 5] },
  tree_swamp: { rows: SWAMPTREE, solid: true, tall: true, harvest: H('wood', 3, [['wood', 2, 4], ['swamp_moss', 1, 2, 0.6], ['venom_sac', 0, 1, 0.1]]), regrow: 200, hitbox: [4, 6, 8, 6] },
  rock: { rows: ROCK, solid: true, harvest: H('stone', 3, [['stone', 2, 4], ['flint', 0, 1, 0.3]]), regrow: 240 },
  ore_copper: { rows: ORE('o', 'O'), solid: true, harvest: H('stone', 4, [['stone', 1, 2], ['copper_ore', 1, 3]]), regrow: 300, name: 'Copper Ore' },
  ore_iron: { rows: ORE('G', 'A'), solid: true, harvest: H('stone', 5, [['stone', 1, 2], ['iron_ore', 1, 3]]), regrow: 300, name: 'Iron Ore' },
  ore_coal: { rows: ORE('k', 'K'), solid: true, harvest: H('stone', 4, [['stone', 1, 2], ['coal', 1, 3]]), regrow: 300, name: 'Coal' },
  ore_gold: { rows: ORE('y', 'Y'), solid: true, harvest: H('stone', 6, [['stone', 1, 2], ['gold_ore', 1, 2]]), regrow: 400, name: 'Gold Ore' },
  ore_crystal: { rows: ORE('c', 'U'), solid: true, harvest: H('stone', 6, [['crystal', 1, 3], ['arcane_dust', 0, 1, 0.5]]), regrow: 400, name: 'Crystal Ore', light: '#5ad8f0' },
  ore_mithril: { rows: ORE('i', 'c'), solid: true, harvest: H('stone', 8, [['mithril_ore', 1, 2], ['stone', 1, 2]]), regrow: 500, name: 'Mithril Ore', light: '#c8f0ff' },
  ore_obsidian: { rows: ORE('P', 'p'), solid: true, harvest: H('stone', 8, [['obsidian', 1, 2], ['ember_core', 0, 1, 0.15]]), regrow: 500, name: 'Obsidian Vein' },
  ore_star: { rows: ORE('h', 'X'), solid: true, harvest: H('stone', 10, [['star_fragment', 1, 1], ['arcane_dust', 1, 2]]), regrow: 900, name: 'Starmetal', light: '#fff8c0' },
  bush: { rows: BUSH, solid: false, harvest: H('wood', 1, [['stick', 1, 2], ['herb', 0, 1, 0.3]]), regrow: 120 },
  berry_bush: { rows: BERRY, solid: false, harvest: H('wood', 1, [['berry', 2, 4]]), regrow: 120, name: 'Berry Bush' },
  cactus: { rows: CACTUS, solid: true, harvest: H('wood', 2, [['cactus_fruit', 1, 2], ['wood', 0, 1, 0.3]]), regrow: 180, touchDmg: 3 },
  chest: { rows: CHEST, solid: true, interact: 'chest', name: 'Chest' },
  chest_open: { rows: CHEST_OPEN, solid: true, name: 'Empty Chest' },
  gold_chest: { rows: GOLDCHEST, solid: true, interact: 'chest', name: 'Golden Chest', light: '#f5d33a' },
  bed: { rows: BED, solid: true, interact: 'bed', name: 'Bed' },
  table: { rows: TABLE, solid: true },
  shelf: { rows: SHELF, solid: true, interact: 'read', name: 'Bookshelf' },
  anvil: { rows: ANVIL, solid: true, station: 'anvil', name: 'Anvil' },
  cauldron: { rows: CAULDRON, solid: true, station: 'cauldron', name: 'Cauldron', light: '#8fe04a' },
  altar: { rows: ALTAR, solid: true, station: 'altar', name: 'Arcane Altar', light: '#5ad8f0' },
  statue: { rows: STATUE, solid: true, name: 'Statue' },
  grave: { rows: GRAVE, solid: true, interact: 'grave', name: 'Grave' },
  cross: { rows: CROSS, solid: true, name: 'Old Cross' },
  fence: { rows: FENCE, solid: true },
  lamp: { rows: LAMP, solid: true, light: '#f5d33a', tall: true },
  torch: { rows: TORCH, solid: false, light: '#ff9a3a' },
  barrel: { rows: BARREL, solid: true, harvest: H('wood', 2, [['wood', 1, 2], ['coins', 1, 5, 0.5], ['apple', 0, 1, 0.3]]), name: 'Barrel' },
  crate: { rows: CRATE, solid: true, harvest: H('wood', 2, [['wood', 1, 3], ['coins', 1, 6, 0.5], ['potion_hp', 0, 1, 0.15]]), name: 'Crate' },
  well: { rows: WELL, solid: true, interact: 'well', name: 'Well' },
  sign: { rows: SIGN, solid: false, interact: 'sign', name: 'Sign' },
  portal: { rows: PORTAL, solid: false, interact: 'portal', name: 'Portal', light: '#c070ff' },
  campfire: { rows: CAMPFIRE, solid: true, station: 'campfire', light: '#ff9a3a', name: 'Campfire' },
  pillar: { rows: PILLAR, solid: true, tall: true },
  rubble: { rows: RUBBLE, solid: false, harvest: H('stone', 2, [['stone', 1, 3], ['ancient_coin', 0, 1, 0.2]]), regrow: 600, name: 'Rubble' },
  shard: { rows: SHARD, solid: true, harvest: H('stone', 3, [['crystal', 1, 2]]), regrow: 400, light: '#5ad8f0', name: 'Crystal Shard' },
  reed: { rows: REED, solid: false, harvest: H('wood', 1, [['reed', 1, 2]]), regrow: 90 },
  lily: { rows: LILY, solid: false },
  bones: { rows: BONES, solid: false, harvest: H('wood', 1, [['bone', 1, 2]]), regrow: 300 },
  web: { rows: WEB, solid: false, harvest: H('wood', 1, [['string', 1, 2]]), regrow: 200, slow: 0.4 },
  shrooms: { rows: SHROOMS, solid: false, harvest: H('wood', 1, [['mushroom', 1, 3]]), regrow: 120 },
  icespike: { rows: ICESPIKE, solid: true, harvest: H('stone', 3, [['frost_core', 0, 1, 0.2], ['ice_shard', 1, 2]]), regrow: 300, light: '#c8f0ff' },
  fountain: { rows: FOUNTAIN, solid: true, interact: 'fountain', name: 'Fountain', light: '#5ad8f0' },
  stump: { rows: STUMP, solid: true, harvest: H('wood', 2, [['wood', 1, 2]]), regrow: 400 },
  log: { rows: LOG, solid: true, harvest: H('wood', 2, [['wood', 2, 3]]), regrow: 300 },
  pumpkin: { rows: PUMPKIN, solid: false, harvest: H('wood', 1, [['pumpkin', 1, 1]]), regrow: 200 },
  hay: { rows: HAY, solid: true, harvest: H('wood', 1, [['hay', 1, 3]]), regrow: 200 },
  scarecrow: { rows: SCARECROW, solid: true, tall: true },
  totem: { rows: TOTEM, solid: true, tall: true, light: '#f5d33a' },
  bell: { rows: BELL, solid: true, interact: 'bell', name: 'Bell' },
  nest: { rows: NEST, solid: false, interact: 'nest', name: 'Nest' },
  coral: { rows: CORAL, solid: false, harvest: H('stone', 2, [['coral', 1, 2], ['pearl', 0, 1, 0.1]]), regrow: 300 },
  tent: { rows: TENT, solid: true },
  cage: { rows: CAGE, solid: true, interact: 'cage', name: 'Cage' },
  lantern: { rows: LANTERN, solid: false, light: '#f5d33a' },
  cart: { rows: CART, solid: true, harvest: H('wood', 2, [['wood', 2, 3], ['coins', 2, 8, 0.6]]), name: 'Cart' },
  books: { rows: BOOKS, solid: false, interact: 'read', name: 'Book Pile' },
  throne: { rows: THRONE, solid: true, interact: 'throne', name: 'Throne' },
  brazier: { rows: BRAZIER, solid: true, light: '#ff9a3a' },
  gargoyle: { rows: GARGOYLE, solid: true },
  skulls: { rows: SKULLS, solid: false, harvest: H('wood', 1, [['bone', 1, 3], ['skull', 0, 1, 0.3]]), regrow: 400 },
  lavarock: { rows: LAVAROCK, solid: true, harvest: H('stone', 4, [['obsidian', 0, 1, 0.3], ['ember_core', 0, 1, 0.12], ['stone', 1, 2]]), regrow: 300 },
  obelisk: { rows: OBELISK, solid: true, interact: 'obelisk', name: 'Obelisk', light: '#c070ff', tall: true },
  egg_nest: { rows: NEST, solid: false },
  egg_fire: { rows: EGG('o', 'x'), solid: false, pickup: 'egg_fire' },
  egg_ice: { rows: EGG('i', 'c'), solid: false, pickup: 'egg_ice' },
  egg_storm: { rows: EGG('y', 'h'), solid: false, pickup: 'egg_storm' },
  egg_shadow: { rows: EGG('P', 'p'), solid: false, pickup: 'egg_shadow' },
  egg_cosmic: { rows: EGG('U', 'h'), solid: false, pickup: 'egg_cosmic' },
  crystal_cluster: { rows: CRYSTALCLUSTER, solid: true, harvest: H('stone', 5, [['crystal', 2, 4], ['arcane_dust', 1, 2]]), regrow: 400, light: '#c070ff' },
  flowers1: { rows: FLOWERS1, solid: false, harvest: H('wood', 1, [['flower', 1, 2]]), regrow: 100, ground: true },
  flowers2: { rows: FLOWERS2, solid: false, harvest: H('wood', 1, [['flower', 1, 2], ['honey', 0, 1, 0.1]]), regrow: 100, ground: true },
  tallgrass: { rows: TALLGRASS, solid: false, harvest: H('wood', 1, [['fiber', 1, 2], ['seed', 0, 1, 0.2], ['bug', 0, 1, 0.3]]), regrow: 60, ground: true },
  snowman: { rows: SNOWMAN, solid: true, interact: 'snowman', name: 'Snowman' },
  anchor: { rows: ANCHOR, solid: true },
  boat: { rows: BOAT, solid: true },
  drum: { rows: DRUM, solid: true },
  mailbox: { rows: MAILBOX, solid: true, interact: 'mailbox', name: 'Mailbox' },
  hive: { rows: HIVE, solid: true, harvest: H('wood', 2, [['honey', 1, 2], ['wax', 0, 1, 0.5]]), regrow: 240, name: 'Beehive', angry: true },
  spider_egg: { rows: SPIDEREGG, solid: false, harvest: H('wood', 1, [['string', 1, 3], ['venom_sac', 0, 1, 0.2]]), regrow: 300, name: 'Spider Egg' },
  minecart: { rows: MINECART, solid: true, harvest: H('stone', 2, [['iron_ore', 1, 2], ['coal', 1, 2], ['gold_ore', 0, 1, 0.2]]), regrow: 500, name: 'Mine Cart' },
  pet_bed: { rows: PET_BED, solid: false, interact: 'pet_bed', name: 'Pet Bed' },
  beacon: { rows: BEACON, solid: true, interact: 'beacon', name: 'Lumis Beacon', light: '#fff8c0', tall: true },
};
for (const k in OBJ) { const o = OBJ[k]; o.id = k; o.w = Math.max(...o.rows.map(r => r.length)); o.h = o.rows.length; if (!o.name) o.name = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()); }
export function objSprite(id) { const o = OBJ[id]; if (!o) return null; return makeSprite(o.rows, null, 'obj:' + id); }
