// Procedural WebAudio sound effects + ambient music. No assets needed.
export const Audio = {
  ctx: null, master: null, musicGain: null, sfxGain: null, enabled: true, musicOn: true, volume: 0.5, musicVol: 0.35, _musicTimer: 0, _step: 0, _mood: 'day',
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination);
      this.sfxGain = this.ctx.createGain(); this.sfxGain.connect(this.master);
      this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = this.musicVol; this.musicGain.connect(this.master);
    } catch (e) { this.enabled = false; }
  },
  resume() { if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.value = v; },
  setMusicVol(v) { this.musicVol = v; if (this.musicGain) this.musicGain.gain.value = v; },
  tone(freq, dur, type = 'square', vol = 0.2, slide = 0, delay = 0) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxGain); o.start(t); o.stop(t + dur + 0.02);
  },
  noise(dur, vol = 0.2, delay = 0, freq = 1000) {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime + delay;
    const n = this.ctx.sampleRate * dur, buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource(); src.buffer = buf;
    const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxGain); src.start(t); src.stop(t + dur);
  },
  play(name) {
    if (!this.ctx || !this.enabled) return;
    switch (name) {
      case 'shoot': this.tone(620, 0.08, 'square', 0.08, -300); break;
      case 'shoot2': this.tone(380, 0.12, 'sawtooth', 0.08, -200); break;
      case 'hit': this.noise(0.08, 0.15, 0, 1800); this.tone(200, 0.08, 'square', 0.08, -100); break;
      case 'hurt': this.tone(180, 0.2, 'sawtooth', 0.18, -120); this.noise(0.12, 0.1); break;
      case 'kill': this.tone(300, 0.15, 'square', 0.12, -200); this.noise(0.15, 0.12, 0, 800); break;
      case 'pickup': this.tone(880, 0.06, 'square', 0.1); this.tone(1320, 0.1, 'square', 0.1, 0, 0.06); break;
      case 'coin': this.tone(1200, 0.05, 'square', 0.08); this.tone(1800, 0.12, 'square', 0.08, 0, 0.05); break;
      case 'levelup': [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.25, 'square', 0.12, 0, i * 0.1)); break;
      case 'chest': this.tone(440, 0.1, 'square', 0.1); this.tone(554, 0.1, 'square', 0.1, 0, 0.1); this.tone(659, 0.3, 'square', 0.1, 0, 0.2); break;
      case 'craft': this.noise(0.1, 0.2, 0, 3000); this.tone(700, 0.15, 'triangle', 0.15, 300, 0.05); break;
      case 'tame': [660, 880, 1100, 1320, 1760].forEach((f, i) => this.tone(f, 0.2, 'triangle', 0.12, 0, i * 0.08)); break;
      case 'fail': this.tone(300, 0.2, 'sawtooth', 0.12, -150); this.tone(200, 0.3, 'sawtooth', 0.12, -100, 0.15); break;
      case 'chop': this.noise(0.06, 0.25, 0, 900); this.tone(140, 0.06, 'square', 0.12); break;
      case 'mine': this.noise(0.05, 0.25, 0, 4000); this.tone(900, 0.05, 'square', 0.1, -400); break;
      case 'ability': this.tone(300, 0.3, 'sawtooth', 0.12, 600); this.noise(0.2, 0.1, 0, 2000); break;
      case 'ultimate': [200, 300, 450, 600, 900].forEach((f, i) => this.tone(f, 0.4, 'sawtooth', 0.12, 200, i * 0.05)); this.noise(0.6, 0.25, 0, 1500); break;
      case 'explode': this.noise(0.4, 0.35, 0, 600); this.tone(80, 0.4, 'sine', 0.3, -40); break;
      case 'freeze': this.tone(1400, 0.3, 'sine', 0.1, -800); this.tone(1800, 0.3, 'sine', 0.08, -900, 0.05); break;
      case 'heal': [600, 800, 1000].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.12, 0, i * 0.07)); break;
      case 'ui': this.tone(900, 0.04, 'square', 0.06); break;
      case 'open': this.tone(500, 0.06, 'square', 0.07); this.tone(750, 0.08, 'square', 0.07, 0, 0.05); break;
      case 'close': this.tone(750, 0.06, 'square', 0.07); this.tone(500, 0.08, 'square', 0.07, 0, 0.05); break;
      case 'quest': [784, 988, 1175, 1568].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.12, 0, i * 0.09)); break;
      case 'dash': this.noise(0.15, 0.15, 0, 2500); this.tone(500, 0.15, 'sine', 0.08, 400); break;
      case 'boss': [110, 110, 98, 82].forEach((f, i) => this.tone(f, 0.5, 'sawtooth', 0.2, 0, i * 0.3)); break;
      case 'ride': this.tone(400, 0.1, 'triangle', 0.1, 200); this.tone(600, 0.15, 'triangle', 0.1, 200, 0.1); break;
      case 'eat': this.noise(0.08, 0.12, 0, 700); this.tone(300, 0.1, 'triangle', 0.08, 100, 0.08); break;
      case 'thunder': this.noise(0.6, 0.3, 0, 400); this.tone(60, 0.6, 'sawtooth', 0.2, -20); break;
      case 'portal': [200, 400, 800, 1600].forEach((f, i) => this.tone(f, 0.5, 'sine', 0.1, 300, i * 0.1)); break;
    }
  },
  // Simple generative music: pentatonic arpeggios with mood
  music(dt, mood) {
    if (!this.ctx || !this.enabled || !this.musicOn) return;
    this._mood = mood;
    this._musicTimer -= dt;
    if (this._musicTimer > 0) return;
    const bpm = mood === 'boss' ? 150 : mood === 'night' ? 80 : 104;
    this._musicTimer = 60 / bpm / 2;
    const scales = {
      day: [261.6, 293.7, 329.6, 392.0, 440.0, 523.3, 587.3, 659.3],
      night: [220.0, 261.6, 293.7, 329.6, 392.0, 440.0, 523.3],
      boss: [146.8, 174.6, 196.0, 233.1, 261.6, 293.7, 349.2],
      cave: [164.8, 196.0, 220.0, 261.6, 329.6, 392.0],
    };
    const sc = scales[mood] || scales.day;
    const step = this._step++;
    const t = this.ctx.currentTime;
    const bar = Math.floor(step / 16) % 4;
    const bass = [0, 3, 4, 2][bar];
    if (step % 8 === 0) this._note(sc[bass] / 2, 0.9, 'triangle', 0.14, t);
    if (step % 2 === 0) {
      const idx = (bass + [0, 2, 4, 2, 5, 4, 2, 0][(step / 2) % 8]) % sc.length;
      this._note(sc[idx], 0.25, mood === 'boss' ? 'sawtooth' : 'square', 0.045, t);
    }
    if (step % 4 === 1 && Math.random() < 0.5) this._note(sc[(step * 7) % sc.length] * 2, 0.15, 'sine', 0.03, t);
    if (mood === 'boss' && step % 4 === 0) { const n = this.ctx.createOscillator(); const g = this.ctx.createGain(); n.type = 'sine'; n.frequency.setValueAtTime(90, t); n.frequency.exponentialRampToValueAtTime(40, t + 0.2); g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.25); n.connect(g); g.connect(this.musicGain); n.start(t); n.stop(t + 0.3); }
  },
  _note(f, dur, type, vol, t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.musicGain); o.start(t); o.stop(t + dur + 0.05);
  }
};
