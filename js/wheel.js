// Canvas Wheel Controller & Physics Engine

class WheelController {
  constructor(canvasId, state, onWinCallback) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.state = state;
    this.onWin = onWinCallback;

    this.rotation = 0; // Current angle in radians
    this.velocity = 0; // Current angular velocity
    this.friction = 0.985; // Natural speed damping
    this.spinDurationRemaining = 0;
    this.lastTickIndex = -1;
    
    this.initCanvas();
    this.draw();

    window.addEventListener('resize', () => {
      this.initCanvas();
      this.draw();
    });
  }

  initCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height, 480);
    
    // High DPI Retina Support
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.width = `${size}px`;
    this.canvas.style.height = `${size}px`;
    
    this.ctx.scale(dpr, dpr);
    this.radius = size / 2;
  }

  // Helper to determine text contrast based on Hex color luminance
  getContrastColor(hexColor) {
    if (!hexColor) return '#ffffff';
    let hex = hexColor.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Relative Luminance formula
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Light segments get dark text; dark segments get white text
    return luminance > 0.6 ? '#1e293b' : '#ffffff';
  }

  // Draw the current state of the wheel on the canvas
  draw() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const center = this.radius;
    const radius = this.radius - 12; // Inset slightly for glowing borders
    
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const segments = this.state.segments;
    if (segments.length === 0) return;

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    let startAngle = this.rotation;

    // 1. Draw segment slices
    segments.forEach((seg) => {
      const sliceAngle = (seg.weight / totalWeight) * Math.PI * 2;
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, startAngle, endAngle);
      ctx.closePath();

      ctx.fillStyle = seg.color;
      ctx.fill();

      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.stroke();

      startAngle = endAngle;
    });

    // 2. Draw text labels inside segments
    startAngle = this.rotation;
    segments.forEach((seg) => {
      const sliceAngle = (seg.weight / totalWeight) * Math.PI * 2;
      const midAngle = startAngle + sliceAngle / 2;

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(midAngle);

      // Auto-contrast checks to make sure pastel and other light colors are perfectly readable!
      ctx.fillStyle = this.getContrastColor(seg.color);
      ctx.font = 'bold 15px Outfit, sans-serif';
      
      // Adjust shadow color based on light or dark text to maintain clean text edges
      ctx.shadowColor = ctx.fillStyle === '#ffffff' ? 'rgba(0, 0, 0, 0.5)' : 'rgba(255, 255, 255, 0.15)';
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';

      const maxTextWidth = radius * 0.65;
      let labelText = seg.label;
      if (ctx.measureText(labelText).width > maxTextWidth) {
        labelText = labelText.substring(0, 12) + '...';
      }

      ctx.fillText(labelText, radius - 25, 0);
      ctx.restore();

      startAngle += sliceAngle;
    });

    // 3. Draw outer glowing metal frame
    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.lineWidth = 8;
    
    // Read the active accent color directly from the DOM CSS variable!
    const activeAccent = getComputedStyle(document.body).getPropertyValue('--accent-primary').trim() || '#8b5cf6';
    ctx.strokeStyle = activeAccent;
    ctx.shadowColor = activeAccent;
    ctx.shadowBlur = 15;
    ctx.stroke();
    
    ctx.shadowBlur = 0;

    // 4. Draw segment divider pins
    startAngle = this.rotation;
    segments.forEach((seg) => {
      const sliceAngle = (seg.weight / totalWeight) * Math.PI * 2;
      const x = center + (radius - 4) * Math.cos(startAngle);
      const y = center + (radius - 4) * Math.sin(startAngle);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.fill();
      
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#9ca3af';
      ctx.stroke();

      ctx.shadowBlur = 0;
      startAngle += sliceAngle;
    });
  }

  // Trigger high velocity spin
  spin() {
    if (this.state.isSpinning) return;
    
    window.audioSynth.init(); // Warm up Audio Context
    this.state.setSpinning(true);

    const baseSpins = 4 + Math.random() * 4;
    const totalRotationNeeded = baseSpins * Math.PI * 2;
    const duration = this.state.spinDuration;
    
    const frames = duration * 60;
    this.velocity = (totalRotationNeeded * (1 - this.friction)) / (1 - Math.pow(this.friction, frames));
    
    this.lastTickIndex = -1;
    this.animate();
  }

  animate() {
    if (this.velocity > 0.001) {
      this.rotation += this.velocity;
      this.checkTicking();
      this.velocity *= this.friction;
      this.draw();
      requestAnimationFrame(() => this.animate());
    } else {
      this.velocity = 0;
      this.state.setSpinning(false);
      this.draw();
      
      const winner = this.getWinningSegment();
      if (winner && this.onWin) {
        this.onWin(winner);
      }
    }
  }

  checkTicking() {
    const segments = this.state.segments;
    if (segments.length <= 1) return;

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    const pointerAngle = 3 * Math.PI / 2;
    
    const normalizedRotation = (pointerAngle - this.rotation) % (Math.PI * 2);
    const targetAngle = normalizedRotation < 0 ? normalizedRotation + Math.PI * 2 : normalizedRotation;

    let accumulatedAngle = 0;
    let activeSegmentIndex = 0;

    for (let i = 0; i < segments.length; i++) {
      const sliceAngle = (segments[i].weight / totalWeight) * Math.PI * 2;
      accumulatedAngle += sliceAngle;
      if (targetAngle < accumulatedAngle) {
        activeSegmentIndex = i;
        break;
      }
    }

    if (activeSegmentIndex !== this.lastTickIndex) {
      window.audioSynth.playTick();
      this.lastTickIndex = activeSegmentIndex;
    }
  }

  getWinningSegment() {
    const segments = this.state.segments;
    if (segments.length === 0) return null;

    const totalWeight = segments.reduce((sum, s) => sum + s.weight, 0);
    const pointerAngle = 3 * Math.PI / 2;
    
    const normalizedRotation = (pointerAngle - this.rotation) % (Math.PI * 2);
    const targetAngle = normalizedRotation < 0 ? normalizedRotation + Math.PI * 2 : normalizedRotation;

    let accumulatedAngle = 0;
    for (let i = 0; i < segments.length; i++) {
      const sliceAngle = (segments[i].weight / totalWeight) * Math.PI * 2;
      accumulatedAngle += sliceAngle;
      if (targetAngle < accumulatedAngle) {
        return segments[i];
      }
    }
    return segments[0];
  }
}

// Attach globally
window.WheelController = WheelController;
