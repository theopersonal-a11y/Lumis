export const Input = {
  keys: {}, pressed: {}, released: {}, mouse: { x: 0, y: 0, down: false, pressed: false, rdown: false, rpressed: false, wheel: 0 },
  canvas: null, scaleX: 1, scaleY: 1, offX: 0, offY: 0,
  init(canvas) {
    this.canvas = canvas;
    window.addEventListener('keydown', e => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (!this.keys[k]) this.pressed[k] = true;
      this.keys[k] = true;
      if (['Tab', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) || (e.ctrlKey && e.key.toLowerCase() === 's')) e.preventDefault();
    });
    window.addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; this.keys[k] = false; this.released[k] = true; });
    window.addEventListener('blur', () => { this.keys = {}; this.mouse.down = false; });
    const upd = e => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX - r.left) / r.width * canvas.width;
      this.mouse.y = (e.clientY - r.top) / r.height * canvas.height;
    };
    canvas.addEventListener('mousemove', upd);
    canvas.addEventListener('mousedown', e => { upd(e); if (e.button === 0) { this.mouse.down = true; this.mouse.pressed = true; } if (e.button === 2) { this.mouse.rdown = true; this.mouse.rpressed = true; } });
    window.addEventListener('mouseup', e => { if (e.button === 0) this.mouse.down = false; if (e.button === 2) this.mouse.rdown = false; });
    canvas.addEventListener('contextmenu', e => e.preventDefault());
    canvas.addEventListener('wheel', e => { this.mouse.wheel += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    // touch: treat as mouse
    canvas.addEventListener('touchstart', e => { const t = e.touches[0]; upd(t); this.mouse.down = true; this.mouse.pressed = true; e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchmove', e => { upd(e.touches[0]); e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', () => { this.mouse.down = false; });
  },
  key(k) { return !!this.keys[k]; },
  hit(k) { return !!this.pressed[k]; },
  endFrame() { this.pressed = {}; this.released = {}; this.mouse.pressed = false; this.mouse.rpressed = false; this.mouse.wheel = 0; }
};
