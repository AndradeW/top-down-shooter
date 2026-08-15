export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.onEnterPress = [];
    this.onPausePress = [];
    this.onActionAPress = [];

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
    this.STICK_RADIUS = 64;
    this.DEAD_ZONE = 4;

    // Estado del mando (Gamepad API). Genérico: usa el mapeo estándar.
    this.gamepad = {
      connected: false,
      id: null,
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      firing: false,
    };
    this.GAMEPAD_DEAD_ZONE = 0.25;

    this.attach();
    if (this.hasTouch) {
      this.attachTouch();
    }
    this.attachGamepad();
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

  attachGamepad() {
    window.addEventListener('gamepadconnected', (e) => {
      const pad = e.gamepad;
      this.gamepad.connected = true;
      this.gamepad.id = pad.id;
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad.connected = false;
      this.gamepad.id = null;
      this.gamepad.firing = false;
    });
  }

  // Lee el mando cada frame (se llama desde Game.loop).
  pollGamepad() {
    if (!navigator.getGamepads) return;
    const pads = navigator.getGamepads();
    const pad = Array.from(pads || []).find((p) => p && p.connected);
    if (!pad) {
      this.gamepad.connected = false;
      this.gamepad.firing = false;
      return;
    }
    this.gamepad.connected = true;
    this.gamepad.id = pad.id;

    const axis = (idx) => (pad.axes && pad.axes[idx] !== undefined ? pad.axes[idx] : 0);
    this.gamepad.moveX = axis(0);
    this.gamepad.moveY = axis(1);
    this.gamepad.aimX = axis(2);
    this.gamepad.aimY = axis(3);

    // Botones genéricos (mapeo estándar): A = 0, Start = 9, RT = 7.
    const btn = (idx) => (pad.buttons && pad.buttons[idx] ? pad.buttons[idx].pressed : false);
    const enterPressed = btn(9) || btn(0);
    if (enterPressed && !this.gamepad.enterWasDown) {
      this.onEnterPress.forEach((fn) => fn());
    }
    this.gamepad.enterWasDown = enterPressed;

    const pausePressed = btn(8); // Botón compartir/select (genérico)
    if (pausePressed && !this.gamepad.pauseWasDown) {
      this.onPausePress.forEach((fn) => fn());
    }
    this.gamepad.pauseWasDown = pausePressed;

    const actionAPressed = btn(0);
    if (actionAPressed && !this.gamepad.aWasDown) {
      this.onActionAPress.forEach((fn) => fn());
    }
    this.gamepad.aWasDown = actionAPressed;

    // Disparo con RT o A
    this.gamepad.firing = btn(7) || btn(0);
  }

  // Aplica deadzone y normaliza un par de ejes del mando.
  gamepadVector(x, y) {
    let mag = Math.hypot(x, y);
    if (mag < this.GAMEPAD_DEAD_ZONE) return { x: 0, y: 0 };
    const scaled = (mag - this.GAMEPAD_DEAD_ZONE) / (1 - this.GAMEPAD_DEAD_ZONE);
    if (mag === 0) return { x: 0, y: 0 };
    return { x: (x / mag) * scaled, y: (y / mag) * scaled };
  }

  // Devuelve vector de movimiento del mando si está conectado y con stick activo.
  getGamepadMovement() {
    if (!this.gamepad.connected) return null;
    const v = this.gamepadVector(this.gamepad.moveX, this.gamepad.moveY);
    if (v.x === 0 && v.y === 0) return null;
    return v;
  }

  // Devuelve vector de puntería del mando (o null si no hay entrada).
  getGamepadAimVector() {
    if (!this.gamepad.connected) return null;
    const v = this.gamepadVector(this.gamepad.aimX, this.gamepad.aimY);
    if (v.x === 0 && v.y === 0) return null;
    return v;
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
    // El mando tiene prioridad si está conectado y con stick activo
    const gpMove = this.getGamepadMovement();
    if (gpMove) return gpMove;

    // Prioridad al joystick táctil si está activo
    if (this.touch.moveActive) {
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
    return this.touch.firing || this.gamepad.firing;
  }
}