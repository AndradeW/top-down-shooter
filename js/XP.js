export class XP {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.radius = 6;
    this.value = value;
    this.alive = true;
    this.magnetRadius = 90;
    this.speed = 320;
  }

  update(dt, player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy) || 1;
    // Atracción hacia el jugador al acercarse
    if (dist < this.magnetRadius) {
      const pull = 1 - dist / this.magnetRadius;
      const s = this.speed * (0.3 + pull * 0.7);
      this.x += (dx / dist) * s * dt;
      this.y += (dy / dist) * s * dt;
    }
  }

  draw(ctx) {
    ctx.save();
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#00e5ff';
    ctx.strokeStyle = '#008fb3';
    ctx.lineWidth = 2;

    // Cristal de energía (rombo) con brillo central
    ctx.beginPath();
    ctx.moveTo(this.x, this.y - this.radius);
    ctx.lineTo(this.x + this.radius * 0.8, this.y);
    ctx.lineTo(this.x, this.y + this.radius);
    ctx.lineTo(this.x - this.radius * 0.8, this.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(244, 244, 245, 0.85)';
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
