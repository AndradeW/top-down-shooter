import { Controller } from './Controller.js';

// Controles táctiles (doble joystick virtual) para móvil.
// Solo se suscribe a eventos si la pantalla es táctil (pointer: coarse).
export class TouchController extends Controller {
  constructor() {
    super();
    this.enabled = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
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
    this.STICK_RADIUS = 64;
    this.DEAD_ZONE = 4;
    this.AIM_DISTANCE = 500;
    if (this.enabled) this.attach();
  }

  attach() {
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

  getMovement() {
    if (!this.touch.moveActive) return { x: 0, y: 0 };
    let x = this.touch.moveX - this.touch.moveOriginX;
    let y = this.touch.moveY - this.touch.moveOriginY;
    const dist = Math.hypot(x, y);
    if (dist < this.DEAD_ZONE) return { x: 0, y: 0 };
    // Curva de sensibilidad no lineal: más control en desplazamientos pequeños
    const mag = Math.min(1, dist / this.STICK_RADIUS);
    const eased = mag * (2 - mag);
    if (dist === 0) return { x: 0, y: 0 };
    return { x: (x / dist) * eased, y: (y / dist) * eased };
  }

  getAimPoint(playerX, playerY) {
    if (!this.touch.aimActive) return null;
    let x = this.touch.aimX - this.touch.aimOriginX;
    let y = this.touch.aimY - this.touch.aimOriginY;
    const dist = Math.hypot(x, y);
    if (dist < this.DEAD_ZONE) return null;
    return {
      x: playerX + (x / dist) * this.AIM_DISTANCE,
      y: playerY + (y / dist) * this.AIM_DISTANCE,
    };
  }

  isFiring() {
    return this.touch.firing;
  }
}
