export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.onEnterPress = [];
    this.onPausePress = [];

    // Estado táctil (doble joystick virtual)
    this.hasTouch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    this.touch = {
      moveActive: false,
      aimActive: false,
      moveId: null,
      aimId: null,
      moveOriginX: 0,
      moveOriginY: 0,
      moveX: 0,
      moveY: 0,
      aimOriginX: 0,
      aimOriginY: 0,
      aimX: 0,
      aimY: 0,
      firing: false,
    };
    this.STICK_RADIUS = 48;
    this.DEAD_ZONE = 8;

    this.attach();
    if (this.hasTouch) {
      this.attachTouch();
    }
  }

  attach() {
    window.addEventListener('keydown', (e) => {
      const key = e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
        e.preventDefault();
      }
      this.keys.add(key);
      if (key === 'Enter') {
        this.onEnterPress.forEach((fn) => fn());
      }
      if (key === 'p' || key === 'P' || key === 'Escape') {
        this.onPausePress.forEach((fn) => fn());
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    window.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.mouseDown = true;
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDown = false;
    });

    window.addEventListener('blur', () => {
      this.keys.clear();
      this.mouseDown = false;
    });
  }

  attachTouch() {
    window.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      const x = e.clientX;
      const y = e.clientY;
      // Mitad izquierda: joystick de movimiento; derecha: puntería que dispara
      if (!this.touch.moveActive && x < window.innerWidth / 2) {
        this.touch.moveActive = true;
        this.touch.moveId = e.pointerId;
        this.touch.moveOriginX = x;
        this.touch.moveOriginY = y;
        this.touch.moveX = x;
        this.touch.moveY = y;
      } else if (!this.touch.aimActive) {
        this.touch.aimActive = true;
        this.touch.aimId = e.pointerId;
        this.touch.aimOriginX = x;
        this.touch.aimOriginY = y;
        this.touch.aimX = x;
        this.touch.aimY = y;
        this.touch.firing = true;
      }
    }, { passive: false });

    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.pointerId === this.touch.moveId) {
        this.clampStick('move', e.clientX, e.clientY);
      } else if (e.pointerId === this.touch.aimId) {
        this.clampStick('aim', e.clientX, e.clientY);
      }
    }, { passive: false });

    const release = (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.pointerId === this.touch.moveId) {
        this.touch.moveActive = false;
        this.touch.moveId = null;
      } else if (e.pointerId === this.touch.aimId) {
        this.touch.aimActive = false;
        this.touch.aimId = null;
        this.touch.firing = false;
      }
    };
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    window.addEventListener('blur', () => {
      this.touch.moveActive = false;
      this.touch.aimActive = false;
      this.touch.moveId = null;
      this.touch.aimId = null;
      this.touch.firing = false;
    });
  }

  clampStick(stick, x, y) {
    let dx = x - this.touch[`${stick}OriginX`];
    let dy = y - this.touch[`${stick}OriginY`];
    const dist = Math.hypot(dx, dy);
    if (dist > this.STICK_RADIUS) {
      dx = (dx / dist) * this.STICK_RADIUS;
      dy = (dy / dist) * this.STICK_RADIUS;
    }
    this.touch[`${stick}X`] = this.touch[`${stick}OriginX`] + dx;
    this.touch[`${stick}Y`] = this.touch[`${stick}OriginY`] + dy;
  }

  isDown(key) {
    return this.keys.has(key);
  }

  // Devuelve un vector de movimiento normalizado (diagonal compensada)
  getMovement() {
    // Prioridad al joystick táctil si está activo
    if (this.touch.moveActive) {
      let x = this.touch.moveX - this.touch.moveOriginX;
      let y = this.touch.moveY - this.touch.moveOriginY;
      const dist = Math.hypot(x, y);
      if (dist < this.DEAD_ZONE) return { x: 0, y: 0 };
      return { x: x / this.STICK_RADIUS, y: y / this.STICK_RADIUS };
    }

    let x = 0;
    let y = 0;
    if (this.isDown('w') || this.isDown('ArrowUp')) y -= 1;
    if (this.isDown('s') || this.isDown('ArrowDown')) y += 1;
    if (this.isDown('a') || this.isDown('ArrowLeft')) x -= 1;
    if (this.isDown('d') || this.isDown('ArrowRight')) x += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.sqrt(2);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  }

  // Vector de puntería táctil normalizado (o null si no hay)
  getAimVector() {
    if (!this.touch.aimActive) return null;
    let x = this.touch.aimX - this.touch.aimOriginX;
    let y = this.touch.aimY - this.touch.aimOriginY;
    const dist = Math.hypot(x, y);
    if (dist < this.DEAD_ZONE) return null;
    return { x: x / dist, y: y / dist };
  }

  isFiring() {
    return this.touch.firing;
  }
}