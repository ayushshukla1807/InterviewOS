// Procedural Sci-Fi Sound Effects using Web Audio API

class SFXEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  
  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.08; // Global volume - keep it subtle
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, sweep?: number) {
    if (!this.ctx || !this.masterGain) {
      this.init();
      if (!this.ctx || !this.masterGain) return;
    }

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (sweep) {
       osc.frequency.exponentialRampToValueAtTime(sweep, this.ctx.currentTime + duration);
    }

    gain.gain.setValueAtTime(1, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // Futuristic mic activation blip
  playMicOn() {
    this.playTone(800, 'sine', 0.1, 1200);
    setTimeout(() => this.playTone(1200, 'sine', 0.15, 2000), 50);
  }

  // Soft low thud when mic turns off
  playMicOff() {
    this.playTone(400, 'triangle', 0.1, 200);
  }

  // Soft futuristic typing click
  playType() {
    this.playTone(1500 + Math.random() * 500, 'square', 0.015);
  }

  // Notification chime
  playNotify() {
    this.playTone(1000, 'sine', 0.2);
    setTimeout(() => this.playTone(1500, 'sine', 0.4), 100);
  }
  
  // Warning beep
  playWarning() {
    this.playTone(300, 'sawtooth', 0.2);
    setTimeout(() => this.playTone(300, 'sawtooth', 0.3), 150);
  }
}

export const sfx = typeof window !== 'undefined' ? new SFXEngine() : null;
