const ENEMY_TYPES = {
  normal: {
    radius: 16,
    speed: (60 + Math.random() * 40),
    health: 1,
    damage: 15,
    scoreValue: 10,
    color: '#e74c3c',
    border: '#922b21',
  },
  fast: {
    radius: 12,
    speed: (130 + Math.random() * 40),
    health: 1,
    damage: 10,
    scoreValue: 15,
    color: '#f39c12',
    border: '#b9770e',
  },
  tank: {
    radius: 22,
    speed: (35 + Math.random() * 15),
    health: 4,
    damage: 25,
    scoreValue: 30,
    color: '#8e44ad',
    border: '#5b2c6f',
  },
  zigzag: {
    radius: 13,
    speed: (90 + Math.random() * 30),
    health: 1,
    damage: 12,
    scoreValue: 20,
    color: '#1abc9c',
    border: '#148f77',
  },
};

export class Enemy {
  constructor(x, y, type = 'normal', speedScale = 1) {
    const t = ENEMY_TYPES[type] || ENEMY_TYPES.normal;
    this.type = type;
    this.x = x;
    this.y = y;
    this.radius = t.radius;
    this.speed = t.speed * speedScale;
    this.health = t.health;
    this.damage = t.damage;
    this.scoreValue = t.scoreValue;
    this.color = t.color;
    this.border = t.border;
    this.alive = true;
    this.zigzagPhase = Math.random() * Math.PI * 2;
    this.zigzagFreq = 4 + Math.random() * 2;
    this.zigzagAmp = 0.4 + Math.random() * 0.4;
    this.px = x;
    this.py = y;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    this.px = player.x;
    this.py = player.y;

    // Movimiento base: perseguir al jugador
    let moveX = dx / dist;
    let moveY = dy / dist;

    // Comportamiento zigzag: oscila perpendicular a la dirección de persecución
    if (this.type === 'zigzag') {
      this.zigzagPhase += dt * this.zigzagFreq;
      const wave = Math.sin(this.zigzagPhase) * this.zigzagAmp;
      // Vector perpendicular normalizado a la dirección base
      const perpX = -moveY;
      const perpY = moveX;
      moveX += perpX * wave;
      moveY += perpY * wave;
      const m = Math.hypot(moveX, moveY) || 1;
      moveX /= m;
      moveY /= m;
    }

    this.x += moveX * this.speed * dt;
    this.y += moveY * this.speed * dt;
  }

  takeDamage(d) {
    this.health -= d;
    if (this.health <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.save();

    // Glow exterior común
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 14;

    if (this.type === 'fast') {
      // Interceptor: nave triangular puntiaguda, apunta al jugador
      const angle = Math.atan2(this.py - this.y, this.px - this.x);
      ctx.translate(this.x, this.y);
      ctx.rotate(angle);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.radius * 1.2, 0);
      ctx.lineTo(-this.radius * 0.9, -this.radius * 0.6);
      ctx.lineTo(-this.radius * 0.5, 0);
      ctx.lineTo(-this.radius * 0.9, this.radius * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (this.type === 'tank') {
      // Acorazado: hexágono con doble capa y torreta central
      ctx.translate(this.x, this.y);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.border;
      ctx.lineWidth = 3;
      this.polygon(ctx, 0, 0, this.radius, 6, 0);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#4a235a';
      this.polygon(ctx, 0, 0, this.radius * 0.6, 6, 0.5);
      ctx.fill();
    } else if (this.type === 'zigzag') {
      // OVNI: platillo elíptico con antena
      ctx.translate(this.x, this.y);
      ctx.rotate(0.4);
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, this.radius, this.radius * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(244, 244, 245, 0.35)';
      ctx.beginPath();
      ctx.ellipse(0, -this.radius * 0.1, this.radius * 0.45, this.radius * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Caza alienígena: tres círculos (platillo con esfera central)
      ctx.fillStyle = this.color;
      ctx.strokeStyle = this.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x - this.radius * 0.7, this.y, this.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x + this.radius * 0.7, this.y, this.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.75, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = this.border;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  polygon(ctx, cx, cy, r, sides, rot) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = (i / sides) * Math.PI * 2 + rot;
      if (i === 0) ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      else ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.closePath();
  }
}
