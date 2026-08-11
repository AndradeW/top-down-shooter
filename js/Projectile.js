export class Projectile {
  constructor(x, y, angle, speed, damage) {
    this.x = x;
    this.y = y;
    this.radius = 4;
    this.damage = damage;
    this.alive = true;
    this.life = 1.5; // segundos de vida máximo
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
  }

  update(dt) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    if (this.life <= 0) this.alive = false;
  }

  draw(ctx) {
    ctx.fillStyle = '#ffd93d';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}
