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
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;

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
    ctx.fillStyle = this.color;
    ctx.strokeStyle = this.border;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Marcador visual según el tipo
    if (this.type === 'tank') {
      ctx.fillStyle = '#4a235a';
      ctx.fillRect(this.x - 6, this.y - 6, 12, 12);
    } else if (this.type === 'fast') {
      ctx.fillStyle = '#b9770e';
      ctx.beginPath();
      ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'zigzag') {
      ctx.strokeStyle = '#0e6251';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x - 5, this.y - 5);
      ctx.lineTo(this.x + 5, this.y + 5);
      ctx.moveTo(this.x - 5, this.y + 5);
      ctx.lineTo(this.x + 5, this.y - 5);
      ctx.stroke();
    }
  }
}
