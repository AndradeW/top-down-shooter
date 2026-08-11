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
    // Línea de puntería
    ctx.strokeStyle = 'rgba(46, 204, 113, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.aimX, this.aimY);
    ctx.stroke();

    // Cuerpo
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#1d8448';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Indicador de dirección (hacia el ratón)
    const angle = Math.atan2(this.aimY - this.y, this.aimX - this.x);
    ctx.fillStyle = '#1d8448';
    ctx.beginPath();
    ctx.arc(this.x + Math.cos(angle) * this.radius * 0.6,
      this.y + Math.sin(angle) * this.radius * 0.6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}
