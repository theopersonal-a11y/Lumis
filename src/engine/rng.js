// Seeded RNG + value noise utilities
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(seed, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) | 0;
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
export function makeNoise(seed) {
  const r = (x, y) => hash2(x, y, seed);
  const smooth = t => t * t * (3 - 2 * t);
  function noise(x, y) {
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const fx = smooth(x - x0), fy = smooth(y - y0);
    const a = r(x0, y0), b = r(x0 + 1, y0), c = r(x0, y0 + 1), d = r(x0 + 1, y0 + 1);
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  }
  function fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let s = 0, amp = 1, f = 1, norm = 0;
    for (let i = 0; i < oct; i++) { s += noise(x * f, y * f) * amp; norm += amp; amp *= gain; f *= lac; }
    return s / norm;
  }
  return { noise, fbm };
}
export const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
export const lerp = (a, b, t) => a + (b - a) * t;
export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
export const pick = (arr, rnd = Math.random) => arr[Math.floor(rnd() * arr.length)];
export const rand = (a, b, rnd = Math.random) => a + rnd() * (b - a);
export const randi = (a, b, rnd = Math.random) => Math.floor(a + rnd() * (b - a + 1));
