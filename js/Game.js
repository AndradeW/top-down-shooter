import { Input } from './Input.js';
import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Projectile } from './Projectile.js';
import { Particle } from './Particle.js';
import { XP } from './XP.js';
import { rollUpgrades } from './Upgrades.js';
import { SoundManager } from './Sound.js';
import { UI } from './UI.js';

export class Game {
  constructor(canvas, ui) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ui = ui;
    this.input = new Input();
    this.sound = new SoundManager();
    this.state = 'menu'; // menu | playing | gameover
    this.score = 0;
    this.projectiles = [];
    this.enemies = [];
    this.player = null;
    this.xpGems = [];
    this.particles = [];
    this.shake = 0;
    this.aimX = 0;
    this.aimY = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    this.pendingUpgrades = [];
    this.timeSurvived = 0;
    this.enemiesKilled = 0;
    this.bestScore = parseInt(localStorage.getItem('topDownShooter_bestScore') || '0', 10);

    this.fireRate = 0.15; // segundos entre disparos
    this.fireCooldown = 0;
    this.projectileSpeed = 420;
    this.xpGain = 1;
    this.spawnInterval = 1.5; // segundos entre enemigos dentro de la oleada
    this.spawnTimer = 0;
    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.wavePhase = 'between'; // between | active
    this.waveTimer = 2.5; // segundos antes de la siguiente oleada

    this.boundResize = this.resize.bind(this);
    window.addEventListener('resize', this.boundResize);
    this.resize();

    document.getElementById('startButton').addEventListener('click', () => this.start());
    document.getElementById('restartButton').addEventListener('click', () => this.start());
    document.getElementById('soundButton').addEventListener('click', (e) => {
      this.sound.toggle();
      e.currentTarget.classList.toggle('muted', !this.sound.enabled);
      if (this.state === 'playing') {
        if (this.sound.enabled) this.sound.startMusic();
        else this.sound.stopMusic();
      }
    });

    // Vibración (solo compatible en móviles)
    this.vibrateEnabled = localStorage.getItem('topDownShooter_vibrate') !== 'off';
    this.vibrateButton = document.getElementById('vibrateButton');
    document.getElementById('vibrateButton').addEventListener('click', () => {
      this.vibrateEnabled = !this.vibrateEnabled;
      localStorage.setItem('topDownShooter_vibrate', this.vibrateEnabled ? 'on' : 'off');
      this.vibrateButton.classList.toggle('muted', !this.vibrateEnabled);
    });
    if (!navigator.vibrate) {
      this.vibrateButton.classList.add('hidden');
    } else {
      this.vibrateButton.classList.toggle('muted', !this.vibrateEnabled);
    }

    this.pauseButton = document.getElementById('pauseButton');
    document.getElementById('pauseButton').addEventListener('click', () => this.togglePause());
    document.getElementById('resumeButton').addEventListener('click', () => this.togglePause());
    document.getElementById('restartFromPauseButton').addEventListener('click', () => this.start());
    this.input.onPausePress.push(() => this.togglePause());

    window.addEventListener('blur', () => {
      if (this.state === 'playing') this.pause();
    });
    this.input.onEnterPress.push(() => {
      if (this.state === 'menu' || this.state === 'gameover') this.start();
    });
    this.input.onActionAPress.push(() => {
      if (this.state === 'levelup' && this.pendingUpgrades.length > 0) {
        this.applyUpgrade(this.pendingUpgrades[0]);
      }
    });

    this.ui.showMenu(this.bestScore);
    this.draw();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    this.score = 0;
    this.player = new Player(this.width / 2, this.height / 2);
    this.enemies = [];
    this.projectiles = [];
    this.xpGems = [];
    this.particles = [];
    this.shake = 0;
    this.xp = 0;
    this.level = 1;
    this.xpToNext = 10;
    this.pendingUpgrades = [];
    this.timeSurvived = 0;
    this.enemiesKilled = 0;
    this.fireCooldown = 0;
    this.spawnTimer = 0;
    this.wave = 0;
    this.enemiesToSpawn = 0;
    this.wavePhase = 'between';
    this.waveTimer = 2.5;
    this.state = 'playing';
    this.ui.hideOverlays();
    this.ui.pauseButton.classList.remove('hidden');
    if (navigator.vibrate) {
      this.ui.vibrateButton.classList.remove('hidden');
      this.vibrateButton.classList.toggle('muted', !this.vibrateEnabled);
    }
    this.sound.startMusic();
  }

  pause() {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.ui.showPause();
    this.sound.stopMusic();
  }

  resume() {
    if (this.state !== 'paused') return;
    this.state = 'playing';
    this.lastTime = null;
    this.ui.hidePause();
    this.sound.startMusic();
  }

  togglePause() {
    if (this.state === 'playing') this.pause();
    else if (this.state === 'paused') this.resume();
  }

  startWave() {
    this.wave++;
    this.enemiesToSpawn = 4 + this.wave * 2;
    this.spawnInterval = Math.max(0.2, 1.5 - this.wave * 0.08);
    this.spawnTimer = 0;
    this.wavePhase = 'active';
    this.sound.playWave();
  }

  // Tipos de enemigo disponibles según la oleada
  getAvailableEnemyTypes() {
    const types = ['normal'];
    if (this.wave >= 2) types.push('zigzag');
    if (this.wave >= 3) types.push('fast');
    if (this.wave >= 4) types.push('tank');
    return types;
  }

  spawnEnemy() {
    let x;
    let y;
    const margin = 40;
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { x = Math.random() * this.width; y = -margin; }
    else if (side === 1) { x = Math.random() * this.width; y = this.height + margin; }
    else if (side === 2) { x = -margin; y = Math.random() * this.height; }
    else { x = this.width + margin; y = Math.random() * this.height; }

    const types = this.getAvailableEnemyTypes();
    const type = types[Math.floor(Math.random() * types.length)];
    const speedScale = Math.min(2, 1 + this.wave * 0.05);
    this.enemies.push(new Enemy(x, y, type, speedScale));
  }

  fire() {
    const angle = Math.atan2(this.aimY - this.player.y, this.aimX - this.player.x);
    this.projectiles.push(new Projectile(this.player.x, this.player.y, angle, this.projectileSpeed, this.player.damage));
    // Partículas de retroceso del disparo
    this.emitParticles(this.player.x, this.player.y, '#ffd93d', 2);
    this.sound.playShoot();
  }

  emitParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(x, y, color));
    }
  }

  addShake(amount) {
    this.shake = Math.min(18, this.shake + amount);
  }

  vibrate(pattern) {
    if (this.vibrateEnabled && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Vibración no disponible en algunos navegadores: se ignora.
      }
    }
  }

  dropXP(x, y) {
    this.xpGems.push(new XP(x, y, this.xpGain));
  }

  gainXP(amount) {
    this.xp += amount;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level++;
      this.xpToNext = Math.round(this.xpToNext * 1.5);
      this.levelUp();
    }
  }

  levelUp() {
    this.pendingUpgrades = rollUpgrades(3);
    this.pendingUpgrades.forEach((u) => { u.onSelect = () => this.applyUpgrade(u); });
    this.state = 'levelup';
    this.ui.showUpgrades(this.pendingUpgrades);
    this.sound.playLevelUp();
  }

  applyUpgrade(upgrade) {
    upgrade.apply(this);
    this.state = 'playing';
    this.ui.hideUpgrades();
  }

  update(dt) {
    this.timeSurvived += dt;
    this.player.update(dt, this.input, this.width, this.height);

    // Estela de propulsión de la nave (partículas tras el jugador)
    this.engineTrailTimer -= dt;
    if (this.engineTrailTimer <= 0) {
      this.engineTrailTimer = 0.05;
      const angle = Math.atan2(this.player.aimY - this.player.y, this.player.aimX - this.player.x);
      const tx = this.player.x - Math.cos(angle) * this.player.radius * 1.9;
      const ty = this.player.y - Math.sin(angle) * this.player.radius * 1.9;
      this.particles.push(new Particle(tx, ty, '#00e5ff'));
    }

    // Puntería: táctil (joystick), mando (stick derecho) o ratón
    const aimVec = this.input.getAimVector();
    const gpAim = this.input.getGamepadAimVector();
    if (aimVec) {
      const aimDist = 500;
      this.aimX = this.player.x + aimVec.x * aimDist;
      this.aimY = this.player.y + aimVec.y * aimDist;
    } else if (gpAim) {
      const aimDist = 500;
      this.aimX = this.player.x + gpAim.x * aimDist;
      this.aimY = this.player.y + gpAim.y * aimDist;
    } else if (!this.input.gamepad.connected) {
      // Solo se usa el ratón si no hay mando: con mando y stick centrado se mantiene la última puntería
      const rect = this.canvas.getBoundingClientRect();
      this.aimX = this.input.mouseX - rect.left;
      this.aimY = this.input.mouseY - rect.top;
    }
    this.player.setAim(this.aimX, this.aimY);

    // Disparo continuo con clic mantenido, joystick táctil derecho o mando (RT/A)
    this.fireCooldown -= dt;
    const firing = this.input.mouseDown || this.input.isFiring();
    if (firing && this.fireCooldown <= 0) {
      this.fire();
      this.fireCooldown = this.fireRate;
    }

    // Sistema de oleadas
    if (this.wavePhase === 'between') {
      this.waveTimer -= dt;
      if (this.waveTimer <= 0) this.startWave();
    } else {
      this.spawnTimer -= dt;
      if (this.enemiesToSpawn > 0 && this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.enemiesToSpawn--;
        this.spawnTimer = this.spawnInterval;
      }
      // La oleada termina cuando no quedan enemigos por generar ni vivos
      if (this.enemiesToSpawn === 0 && this.enemies.length === 0) {
        this.wavePhase = 'between';
        this.waveTimer = 3.5;
      }
    }

    // Actualizar proyectiles
    for (const p of this.projectiles) p.update(dt);
    this.projectiles = this.projectiles.filter((p) => p.alive);

    // Actualizar enemigos
    for (const e of this.enemies) e.update(dt, this.player);
    this.enemies = this.enemies.filter((e) => e.alive);

    // Actualizar gemas de XP y partículas
    this.shake = Math.max(0, this.shake - dt * 40);
    for (const g of this.xpGems) {
      g.update(dt, this.player);
      const d = Math.hypot(g.x - this.player.x, g.y - this.player.y);
        if (d < g.radius + this.player.radius) {
          g.alive = false;
          this.gainXP(g.value);
          this.emitParticles(g.x, g.y, '#00e5ff', 4);
          this.sound.playXP();
        }
    }
    this.xpGems = this.xpGems.filter((g) => g.alive);
    for (const pt of this.particles) pt.update(dt);
    this.particles = this.particles.filter((pt) => pt.alive);

    // Colisiones proyectil-enemigo
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const d = Math.hypot(p.x - e.x, p.y - e.y);
        if (d < p.radius + e.radius) {
          p.alive = false;
          e.takeDamage(p.damage);
          if (!e.alive) {
            this.score += e.scoreValue;
            this.enemiesKilled++;
            this.dropXP(e.x, e.y);
            this.emitParticles(e.x, e.y, e.color, 10);
            this.sound.playHit();
          }
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
    this.enemies = this.enemies.filter((e) => e.alive);

    // Colisiones enemigo-jugador
    for (const e of this.enemies) {
      if (!e.alive) continue;
        const d = Math.hypot(e.x - this.player.x, e.y - this.player.y);
        if (d < e.radius + this.player.radius) {
          this.player.takeDamage(e.damage);
          this.addShake(8);
          this.vibrate(30);
          this.emitParticles(this.player.x, this.player.y, '#e74c3c', 12);
          this.sound.playDamage();
          e.alive = false;
          if (!this.player.alive) break;
        }
    }
    this.enemies = this.enemies.filter((e) => e.alive);

    // Game Over
    if (!this.player.alive) {
      this.state = 'gameover';
      this.vibrate([60, 40, 120]);
      const isNewRecord = this.saveBestScore();
      const history = this.addToHistory();
      this.ui.showGameOver(this.score, this.timeSurvived, this.enemiesKilled, this.level, this.bestScore, isNewRecord, history);
      this.sound.playGameOver();
      this.sound.stopMusic();
    }
  }

  saveBestScore() {
    if (this.score > this.bestScore) {
      this.bestScore = this.score;
      localStorage.setItem('topDownShooter_bestScore', String(this.bestScore));
      return true;
    }
    return false;
  }

  loadHistory() {
    try {
      const raw = localStorage.getItem('topDownShooter_history');
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  addToHistory() {
    try {
      const history = this.loadHistory();
      history.push(this.score);
      const last = history.slice(-5);
      localStorage.setItem('topDownShooter_history', JSON.stringify(last));
      return last;
    } catch {
      return [];
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#111318';
    ctx.fillRect(0, 0, this.width, this.height);

    // Screen shake: desplaza el mundo aleatoriamente según la intensidad
    ctx.save();
    if (this.shake > 0) {
      ctx.translate(
        (Math.random() * 2 - 1) * this.shake,
        (Math.random() * 2 - 1) * this.shake
      );
    }

    for (const p of this.projectiles) p.draw(ctx);
    for (const e of this.enemies) e.draw(ctx);
    for (const g of this.xpGems) g.draw(ctx);
    for (const pt of this.particles) pt.draw(ctx);
    if (this.player) this.player.draw(ctx);

    ctx.restore();

    if (this.state === 'playing' && this.input.hasTouch) {
      this.drawJoysticks();
    }
  }

  drawJoysticks() {
    const ctx = this.ctx;
    const t = this.input.touch;

    const drawStick = (ox, oy, kx, ky, knobSize) => {
      ctx.strokeStyle = 'rgba(244, 244, 245, 0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox, oy, this.input.STICK_RADIUS, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = 'rgba(244, 244, 245, 0.12)';
      ctx.beginPath();
      ctx.arc(ox, oy, this.input.STICK_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 244, 245, 0.5)';
      ctx.beginPath();
      ctx.arc(kx, ky, knobSize, 0, Math.PI * 2);
      ctx.fill();
    };

    if (t.moveActive) {
      drawStick(t.moveOriginX, t.moveOriginY, t.moveX, t.moveY, 22);
    }
    if (t.aimActive) {
      drawStick(t.aimOriginX, t.aimOriginY, t.aimX, t.aimY, 22);
    }
  }

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - (this.lastTime || timestamp)) / 1000);
    this.lastTime = timestamp;

    this.input.pollGamepad();

    if (this.state === 'playing') {
      this.update(dt);
      this.draw();
      this.ui.updateHUD(this.score, this.player.health, this.player.maxHealth);
      this.ui.updateWave(this.wave, this.wavePhase, this.waveTimer);
      this.ui.updateLevel(this.level, this.xp, this.xpToNext);
    } else if (this.state === 'paused' || this.state === 'levelup') {
      this.draw();
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}
