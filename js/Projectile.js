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
    ctx.save();
    ctx.strokeStyle = '#ffd93d';
    ctx.shadowColor = '#ffd93d';
    ctx.shadowBlur = 10;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';

    // Láser orientado según su velocidad
    const angle = Math.atan2(this.vy, this.vx);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(this.radius * 2.5, 0);
    ctx.lineTo(-this.radius * 2.5, 0);
    ctx.stroke();

    // Núcleo brillante
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(0, 0, this.radius * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
}
