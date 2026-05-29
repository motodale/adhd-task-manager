// Web Audio API Synthesizer Module

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.masterVolume = 0.7;
  }

  init() {
    if (!this.ctx) {
      // Lazy init AudioContext on user interaction
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  // Synthesize a realistic woodblock/clack tick sound
  playTick() {
    if (this.masterVolume <= 0) return;
    this.init();
    
    const now = this.ctx.currentTime;
    
    // Create nodes
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(900, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, now);
    filter.Q.setValueAtTime(5, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  // Synthesize a celebratory triad/major chime fanfare
  playChime() {
    if (this.masterVolume <= 0) return;
    this.init();

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
    
    notes.forEach((freq, idx) => {
      const noteDelay = idx * 0.08;
      const playTime = now + noteDelay;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const delay = this.ctx.createDelay();
      const feedback = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, playTime);
      
      gain.gain.setValueAtTime(0, playTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.18, playTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.7);

      delay.delayTime.setValueAtTime(0.12, playTime);
      feedback.gain.setValueAtTime(0.3, playTime);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      gain.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(this.ctx.destination);

      osc.start(playTime);
      osc.stop(playTime + 0.8);
    });
  }
}

// Attach globally
window.audioSynth = new AudioSynthesizer();
