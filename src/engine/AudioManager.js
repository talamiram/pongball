export class AudioManager {
  constructor() {
    this._ctx = null;
    this.muted = false;
  }

  /** Must be called on first user gesture */
  init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
  }

  resume() {
    if (this._ctx && this._ctx.state === 'suspended') {
      this._ctx.resume();
    }
  }

  _beep(frequency, duration, type = 'square', gain = 0.28) {
    if (this.muted || !this._ctx) return;
    const osc = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    osc.connect(g);
    g.connect(this._ctx.destination);
    osc.type = type;
    osc.frequency.value = frequency;
    g.gain.setValueAtTime(gain, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);
    osc.start();
    osc.stop(this._ctx.currentTime + duration);
  }

  _noise(duration, gain = 0.15) {
    if (this.muted || !this._ctx) return;
    const bufferSize = this._ctx.sampleRate * duration;
    const buffer = this._ctx.createBuffer(1, bufferSize, this._ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const source = this._ctx.createBufferSource();
    source.buffer = buffer;

    // Band-pass filter for crowd-like sound
    const filter = this._ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 0.5;

    const g = this._ctx.createGain();
    g.gain.setValueAtTime(gain, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + duration);

    source.connect(filter);
    filter.connect(g);
    g.connect(this._ctx.destination);
    source.start();
    source.stop(this._ctx.currentTime + duration);
  }

  play(sound) {
    if (!this._ctx) return;
    this.resume();

    switch (sound) {
      case 'paddleHit':
        this._beep(220, 0.055, 'square', 0.3);
        break;
      case 'wallHit':
        this._beep(180, 0.04, 'square', 0.15);
        break;
      case 'goal':
        this._goalFanfare();
        this._noise(0.6, 0.25); // crowd roar
        break;
      case 'whistle':
        this._whistle();
        break;
      case 'uiClick':
        this._beep(440, 0.08, 'sine', 0.22);
        break;
      case 'uiConfirm':
        this._beep(523, 0.12, 'sine', 0.25);
        setTimeout(() => this._beep(659, 0.12, 'sine', 0.25), 100);
        break;
      case 'penaltyKick':
        this._beep(80, 0.18, 'sine', 0.45);
        this._beep(140, 0.1, 'sawtooth', 0.2);
        break;
      case 'penaltySave':
        this._beep(160, 0.2, 'square', 0.3);
        this._noise(0.4, 0.18);
        break;
      case 'countdown':
        this._beep(660, 0.1, 'sine', 0.3);
        break;
      case 'go':
        this._beep(880, 0.15, 'sine', 0.35);
        break;
    }
  }

  _goalFanfare() {
    if (this.muted || !this._ctx) return;
    const notes = [261.6, 329.6, 392.0, 523.3];
    notes.forEach((freq, i) => {
      setTimeout(() => this._beep(freq, 0.28, 'sawtooth', 0.4), i * 110);
    });
  }

  _whistle() {
    if (this.muted || !this._ctx) return;
    const osc = this._ctx.createOscillator();
    const g = this._ctx.createGain();
    osc.connect(g);
    g.connect(this._ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(900, this._ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(1300, this._ctx.currentTime + 0.25);
    osc.frequency.linearRampToValueAtTime(1100, this._ctx.currentTime + 0.4);
    g.gain.setValueAtTime(0.4, this._ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, this._ctx.currentTime + 0.45);
    osc.start();
    osc.stop(this._ctx.currentTime + 0.45);
  }
}

export const audio = new AudioManager();
