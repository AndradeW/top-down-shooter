export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.musicEnabled = true;
    this.musicTimer = null;
    this.nextBeat = 0;
    this.attachResumeOnGesture();
  }

  attachResumeOnGesture() {
    const resume = () => {
      if (!this.ctx) {
        this.init();
      } else if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    };
    window.addEventListener('click', resume, { once: false });
    window.addEventListener('keydown', resume, { once: false });
  }

  init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (!this.musicEnabled) this.stopMusic();
    return this.musicEnabled;
  }

  // --- Efectos de sonido (osciladores sintetizados) ---

  playShoot() {
    if (!this.ready()) return;
    this.tone(0.08, 440, 220, 'square', 0.06);
  }

  playHit() {
    if (!this.ready()) return;
    this.tone(0.06, 700, 200, 'triangle', 0.08);
  }

  playXP() {
    if (!this.ready()) return;
    this.tone(0.1, 660, 990, 'sine', 0.07);
  }

  playDamage() {
    if (!this.ready()) return;
    this.tone(0.2, 200, 60, 'sawtooth', 0.15);
  }

  playLevelUp() {
    if (!this.ready()) return;
    this.tone(0.12, 523, 523, 'sine', 0.1);
    setTimeout(() => this.tone(0.12, 659, 659, 'sine', 0.1), 120);
    setTimeout(() => this.tone(0.2, 784, 784, 'sine', 0.12), 240);
  }

  playGameOver() {
    if (!this.ready()) return;
    this.tone(0.3, 330, 165, 'sawtooth', 0.15);
  }

  playWave() {
    if (!this.ready()) return;
    this.tone(0.12, 392, 392, 'triangle', 0.1);
    setTimeout(() => this.tone(0.12, 523, 523, 'triangle', 0.1), 130);
  }

  tone(duration, startFreq, endFreq, type, volume) {
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + duration);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
  }

  ready() {
    return this.enabled && this.ctx && this.ctx.state === 'running';
  }

  // --- Música de fondo generativa ---

  startMusic() {
    if (!this.enabled || !this.musicEnabled || !this.ctx) return;
    if (this.musicTimer) return;
    this.nextBeat = this.ctx.currentTime + 0.1;
    const loop = () => {
      if (!this.musicEnabled || !this.enabled || !this.ctx || this.ctx.state !== 'running') return;
      const now = this.ctx.currentTime;
      while (this.nextBeat < now + 0.3) {
        this.playBassNote();
        this.nextBeat += 0.5;
      }
      this.musicTimer = setTimeout(loop, 100);
    };
    this.musicTimer = setTimeout(loop, 100);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  playBassNote() {
    const scale = [110, 123.47, 130.81, 146.83, 164.81, 174.61, 196];
    const freq = scale[Math.floor(Math.random() * scale.length)];
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.45);
  }
}
