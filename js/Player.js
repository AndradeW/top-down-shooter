export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 14;
    this.speed = 240;
    this.maxHealth = 100;
    this.health = this.maxHealth;
    this.damage = 1;
    this.alive = true;
    this.aimX = x;
    this.aimY = y;
  }

  update(dt, input, width, height) {
    const move = input.getMovement();
    this.x += move.x * this.speed * dt;
    this.y += move.y * this.speed * dt;
    // Mantener al jugador dentro del lienzo
    this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));
  }

  setAim(x, y) {
    this.aimX = x;
    this.aimY = y;
  }

  takeDamage(d) {
    this.health -= d;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  draw(ctx) {
    const angle = Math.atan2(this.aimY - this.y, this.aimX - this.x);

    // Línea de puntería (sutil)
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.aimX, this.aimY);
    ctx.stroke();

    // Nave triangular orientada hacia donde apunta
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);

    // Glow exterior
    ctx.shadowColor = 'rgba(46, 204, 113, 0.9)';
    ctx.shadowBlur = 18;

    // Estela / propulsor (detrás de la nave)
    ctx.fillStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.beginPath();
    ctx.moveTo(-this.radius * 0.4, 0);
    ctx.lineTo(-this.radius * 1.8, -this.radius * 0.45);
    ctx.lineTo(-this.radius * 1.8, this.radius * 0.45);
    ctx.closePath();
    ctx.fill();

    // Casco
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#1d8448';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(this.radius * 1.1, 0);
    ctx.lineTo(-this.radius * 0.85, -this.radius * 0.75);
    ctx.lineTo(-this.radius * 0.35, 0);
    ctx.lineTo(-this.radius * 0.85, this.radius * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Cabina central
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.9)';
    ctx.beginPath();
    ctx.arc(this.radius * 0.15, 0, this.radius * 0.28, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
