// Shared mutable game state. Modules import G and mutate it.
export const G = {
  W: 640, H: 360, TILE: 16,
  canvas: null, ctx: null,
  world: null, player: null,
  enemies: [], pets: [], wildPets: [], projectiles: [], particles: [], drops: [], npcs: [], effects: [], floats: [], hazards: [], allies: [],
  camera: { x: 0, y: 0, shake: 0 },
  time: 0.3, day: 1, dayLength: 480, // seconds per full day
  paused: false, menu: null, dialog: null, dialogState: null, notices: [], scene: 'title',
  stats: { kills: 0, bossKills: 0, chests: 0, tamed: 0, crafted: 0, wood: 0, stone: 0, deaths: 0, distance: 0, playTime: 0 },
  flags: {}, discovered: {}, questState: {}, achievements: {},
  seed: 1337, rnd: Math.random, frame: 0, dt: 0,
  weather: { type: 'clear', t: 0, intensity: 0 },
  bossActive: null, saveTimer: 0, lastSave: 0, toast: null, cheats: false,
  notify(msg, color = '#f4f4f8', dur = 3) { this.notices.push({ msg, color, t: dur, max: dur }); if (this.notices.length > 5) this.notices.shift(); },
  float(x, y, txt, color = '#f4f4f8', size = 8, vy = -22) { this.floats.push({ x, y, txt, color, t: 1.1, size, vy }); if (this.floats.length > 80) this.floats.shift(); },
  shake(n) { this.camera.shake = Math.max(this.camera.shake, n); },
};
export const RARITY_ORDER = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'secret'];
