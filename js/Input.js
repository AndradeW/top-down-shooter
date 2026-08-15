export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.onEnterPress = [];
    this.onPausePress = [];
    this.onActionAPress = [];
    this.onDPadLeft = [];
    this.onDPadRight = [];
    this.onDPadUp = [];
    this.onDPadDown = [];

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

    // Estado del mando (Gamepad API). Genérico: detecta los ejes reales del
    // stick derecho porque muchos mandos no siguen el mapeo estándar.
    this.gamepad = {
      connected: false,
      id: null,
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      firing: false,
    // Ejes asignados al stick derecho (se auto-detectan con calibración)
    aimAxis: [2, 3],
    // Solo se usa la puntería del mando cuando sabemos qué ejes son el stick
    // derecho. Hasta entonces el ratón sigue controlando la puntería.
    aimCalibrated: false,
    calibration: {},
      // Flancos para detectar pulsaciones únicas
      aWasDown: false,
      pauseWasDown: false,
      enterWasDown: false,
    };
    this.GAMEPAD_DEAD_ZONE = 0.25;
    this.DPAD_THRESHOLD = 0.5;

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
      // Nuevo mando: reinicia la calibración de ejes y los flancos
      this.gamepad.calibration = {};
      this.gamepad.aimAxis = [2, 3];
      this.gamepad.aimCalibrated = false;
      this.gamepad.aWasDown = false;
      this.gamepad.pauseWasDown = false;
      this.gamepad.enterWasDown = false;
    });

    window.addEventListener('gamepaddisconnected', () => {
      this.gamepad.connected = false;
      this.gamepad.id = null;
      this.gamepad.firing = false;
    });
  }

  // Muestra el rango real de cada eje para detectar el stick derecho.
  // Los sticks llegan a -1..1; los gatillos analógicos solo van de 0..1.
  // Eje con calibración A -> B (B = -A, invertido): el mando invierte el eje Y.
  calibrateAxis(idx, value) {
    const cal = this.gamepad.calibration;
    if (!cal[idx]) cal[idx] = { min: value, max: value };
    const c = cal[idx];
    c.min = Math.min(c.min, value);
    c.max = Math.max(c.max, value);
  }

  // Determina los ejes del stick derecho. Un eje que alcanza un valor negativo
  // real es un stick: los gatillos analógicos solo van de 0..1, nunca negativo.
  // No confía en `mapping === 'standard'`: muchos mandos genéricos lo declaran
  // aunque sus ejes reales estén desplazados.
  updateAimAxis() {
    const cal = this.gamepad.calibration;
    const anyNegative = (i) => cal[i] && cal[i].min < -0.3;
    // Prefiere el par estándar (2,3) si muestra actividad de stick
    if (anyNegative(2) && anyNegative(3)) {
      this.gamepad.aimAxis = [2, 3];
      return true;
    }
    // Si no, busca cualquier par consecutivo con al menos un eje en negativo
    for (let i = 2; i < 8; i++) {
      if (!cal[i] || !cal[i + 1]) continue;
      if (anyNegative(i) || anyNegative(i + 1)) {
        this.gamepad.aimAxis = [i, i + 1];
        return true;
      }
    }
    return false;
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

    // Log automático en consola: solo cuando cambia el estado (evita spam).
    // Útil para diagnosticar mandos genéricos sin tocar teclas.
    this.logGamepadState(pad);

    const axes = pad.axes || [];
    // Calibra los ejes y detecta cuáles son el stick derecho
    for (let i = 0; i < axes.length; i++) {
      if (axes[i] !== undefined) this.calibrateAxis(i, axes[i]);
    }
    // Calibra los ejes y detecta cuáles son el stick derecho. No se confía
    // ciegamente en `mapping === 'standard'`: muchos mandos genéricos lo
    // declaran pero reportan los ejes desplazados. La calibración prevalece.
    if (this.updateAimAxis()) this.gamepad.aimCalibrated = true;
    const [ax, ay] = this.gamepad.aimAxis;

    this.gamepad.moveX = axes[0] !== undefined ? axes[0] : 0;
    this.gamepad.moveY = axes[1] !== undefined ? axes[1] : 0;
    this.gamepad.aimX = axes[ax] !== undefined ? axes[ax] : 0;
    this.gamepad.aimY = axes[ay] !== undefined ? axes[ay] : 0;

    // Botones genéricos: busca por varias posiciones porque el mapeo varía.
    // Disparo con A (0), RB (5) o RT (7) usando pressed o valor analógico.
    const btnPressed = (idx) => {
      const b = pad.buttons && pad.buttons[idx];
      return !!(b && (b.pressed || b.value > 0.5));
    };
    this.gamepad.firing = btnPressed(0) || btnPressed(5) || btnPressed(7);

    // A (0): confirmar recompensa
    const aPressed = btnPressed(0);
    if (aPressed && !this.gamepad.aWasDown) {
      this.onActionAPress.forEach((fn) => fn());
    }
    this.gamepad.aWasDown = aPressed;

    // Pausa con Start (9) o Select (8)
    const pausePressed = btnPressed(9) || btnPressed(8);
    if (pausePressed && !this.gamepad.pauseWasDown) {
      this.onPausePress.forEach((fn) => fn());
    }
    this.gamepad.pauseWasDown = pausePressed;

    // Confirmar/menú con Start (9) o A (0)
    const enterPressed = btnPressed(9) || btnPressed(0);
    if (enterPressed && !this.gamepad.enterWasDown) {
      this.onEnterPress.forEach((fn) => fn());
    }
    this.gamepad.enterWasDown = enterPressed;

    // D-pad (botones 12-15) para navegar recompensas
    const dpad = {
      left: btnPressed(14),
      right: btnPressed(15),
      up: btnPressed(12),
      down: btnPressed(13),
    };
    if (dpad.left && !this.gamepad.dpadLWasDown) this.onDPadLeft.forEach((fn) => fn());
    if (dpad.right && !this.gamepad.dpadRWasDown) this.onDPadRight.forEach((fn) => fn());
    if (dpad.up && !this.gamepad.dpadUWasDown) this.onDPadUp.forEach((fn) => fn());
    if (dpad.down && !this.gamepad.dpadDWasDown) this.onDPadDown.forEach((fn) => fn());
    this.gamepad.dpadLWasDown = dpad.left;
    this.gamepad.dpadRWasDown = dpad.right;
    this.gamepad.dpadUWasDown = dpad.up;
    this.gamepad.dpadDWasDown = dpad.down;
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
    if (!this.gamepad.connected || !this.gamepad.aimCalibrated) return null;
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

  // Estado en vivo del mando para diagnóstico (se dibuja en pantalla).
  getDebugInfo() {    let axes = [];
    let buttons = [];
    let mapping = '';
    let id = this.gamepad.id || '';
    if (navigator.getGamepads) {
      const pads = navigator.getGamepads();
      const pad = Array.from(pads || []).find((p) => p && p.connected);
      if (pad) {
        axes = Array.from(pad.axes || []).map((v) => Number(v.toFixed(2)));
        buttons = (pad.buttons || [])
          .map((b, i) => (b && (b.pressed || b.value > 0.5) ? i : null))
          .filter((i) => i !== null);
        mapping = pad.mapping || '';
        id = pad.id || id;
      }
    }
    return {
      id,
      mapping,
      axes,
      buttons,
      aimAxis: this.gamepad.aimAxis,
      aimCalibrated: this.gamepad.aimCalibrated,
      firing: this.gamepad.firing,
    };
  }

  // Imprime en la consola el estado del mando solo cuando cambia.
  logGamepadState(pad) {
    const axes = Array.from(pad.axes || []).map((v) => Number(v.toFixed(2)));
    const buttons = (pad.buttons || [])
      .map((b, i) => (b && (b.pressed || b.value > 0.5) ? i : null))
      .filter((i) => i !== null);
    const sig = `${axes.join(',')}|${buttons.join(',')}`;
    if (sig === this._lastGpSig) return;
    this._lastGpSig = sig;
    console.log(
      `[MANDO] mapping=${pad.mapping || 'ninguno'} | ejes=[${axes.join(', ')}] | botones=[${buttons.join(', ') || '-'}]`
    );
  }
}