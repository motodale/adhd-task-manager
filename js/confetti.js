// Canvas Confetti Particle System Module

class ConfettiParticle {
  constructor(x, y, colors) {
    this.x = x;
    this.y = y;
    this.size = Math.random() * 8 + 6;
    this.color = colors[Math.floor(Math.random() * colors.length)];
    
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 6;
    this.vx = Math.cos(angle) * speed;
    this.vy = -Math.sin(Math.abs(angle)) * speed - 4;
    
    this.rotation = Math.random() * 360;
    this.rotationSpeed = (Math.random() - 0.5) * 10;
    
    this.gravity = 0.25;
    this.friction = 0.98;
    this.opacity = 1;
    this.fade = Math.random() * 0.01 + 0.01;
  }

  update() {
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;
    this.opacity -= this.fade;
    return this.opacity > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate((this.rotation * Math.PI) / 180);
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = this.color;
    
    ctx.fillRect(-this.size / 2, -this.size / 4, this.size, this.size / 2);
    ctx.restore();
  }
}

class ConfettiSystem {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.animationId = null;
    this.colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#fbbf24', '#f97316'];
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resizeCanvas() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }

  burst(x, y, particleCount = 120) {
    this.init('confettiCanvas');
    if (!this.ctx) return;

    for (let i = 0; i < particleCount; i++) {
      this.particles.push(new ConfettiParticle(x, y, this.colors));
    }

    if (!this.animationId) {
      this.tick();
    }
  }

  tick() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles = this.particles.filter(p => {
      const active = p.update();
      if (active) {
        p.draw(this.ctx);
      }
      return active;
    });

    if (this.particles.length > 0) {
      this.animationId = requestAnimationFrame(() => this.tick());
    } else {
      this.animationId = null;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }
}

// Attach globally
window.confetti = new ConfettiSystem();
