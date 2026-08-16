import { Controller } from './Controller.js';
import { Settings } from './Settings.js';

// Mando (Xbox y compatibles) con la Gamepad API nativa.
// Toda la lógica específica del mando vive aquí, aislada del resto de
// dispositivos. Usa el mapeo estándar (correcto para mandos Xbox en
// Chrome/Edge/Firefox): analógico izquierdo ejes 0/1, derecho ejes 2/3.
export class GamepadController extends Controller {
  constructor() {
    super();
    this.gamepad = {
      connected: false,
      id: null,
      moveX: 0,
      moveY: 0,
      aimX: 0,
      aimY: 0,
      firing: false,
    };
    this.AIM_DISTANCE = 500;
    // Umbral del analógico izquierdo para navegar mejoras
    this.NAV_THRESHOLD = 0.6;
    // Última dirección de puntería del stick derecho: al soltar el stick se
    // mantiene (independiente del ratón) hasta que se vuelva a mover.
    this._lastAim = null;
    // Flancos para detectar pulsaciones únicas por frame de polling
    this._edges = {
      enter: false,
      pause: false,
      actionA: false,
      dpadLeft: false,
      dpadRight: false,
      dpadUp: false,
      dpadDown: false,
    };
    this._boundConnected = (e) => this._onConnected(e);
    this._boundDisconnected = () => this._onDisconnected();
    this.attach();
  }

  attach() {
    window.addEventListener('gamepadconnected', this._boundConnected);
    window.addEventListener('gamepaddisconnected', this._boundDisconnected);
  }

  destroy() {
    window.removeEventListener('gamepadconnected', this._boundConnected);
    window.removeEventListener('gamepaddisconnected', this._boundDisconnected);
  }

  _onConnected(e) {
    this.gamepad.connected = true;
    this.gamepad.id = e.gamepad.id;
  }

  _onDisconnected() {
    this.gamepad.connected = false;
    this.gamepad.id = null;
    this.gamepad.firing = false;
    this._lastAim = null;
    this._resetEdges();
  }

  _readPad() {
    if (!navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    return Array.from(pads || []).find((p) => p && p.connected) || null;
  }

  // Se llama cada frame desde Game.loop a través de Input.poll().
  poll() {
    const pad = this._readPad();
    if (!pad) {
      this.gamepad.connected = false;
      this.gamepad.firing = false;
      this._resetEdges();
      return;
    }
    this.gamepad.connected = true;
    this.gamepad.id = pad.id;

    const axes = pad.axes || [];
    this.gamepad.moveX = axes[0] !== undefined ? axes[0] : 0;
    this.gamepad.moveY = axes[1] !== undefined ? axes[1] : 0;
    // Stick derecho en el mapeo estándar (ejes 2/3)
    this.gamepad.aimX = axes[2] !== undefined ? axes[2] : 0;
    this.gamepad.aimY = axes[3] !== undefined ? axes[3] : 0;

    const btnPressed = (idx) => {
      const b = pad.buttons && pad.buttons[idx];
      return !!(b && (b.pressed || b.value > 0.5));
    };

    // Disparo con RT (7), RB (5) o A (0)
    this.gamepad.firing = btnPressed(7) || btnPressed(5) || btnPressed(0);

    // Pulsaciones únicas en flanco. 'enter' usa A y 'pause' usa Start para que
    // una sola pulsación de Start no dispare ambos eventos en el mismo frame.
    this._edge('enter', btnPressed(0));
    this._edge('pause', btnPressed(9));
    this._edge('actionA', btnPressed(0));
    // D-pad o analógico izquierdo para navegar las mejoras (Game solo lo
    // procesa en estado 'levelup', así que no molesta durante la partida).
    this._edge('dpadLeft', btnPressed(14) || this.gamepad.moveX < -this.NAV_THRESHOLD);
    this._edge('dpadRight', btnPressed(15) || this.gamepad.moveX > this.NAV_THRESHOLD);
    this._edge('dpadUp', btnPressed(12) || this.gamepad.moveY < -this.NAV_THRESHOLD);
    this._edge('dpadDown', btnPressed(13) || this.gamepad.moveY > this.NAV_THRESHOLD);
  }

  _edge(event, pressed) {
    if (pressed && !this._edges[event]) this._emit(event);
    this._edges[event] = pressed;
  }

  _resetEdges() {
    for (const k of Object.keys(this._edges)) this._edges[k] = false;
  }

  getMovement() {
    const v = this._vector(this.gamepad.moveX, this.gamepad.moveY);
    return v || { x: 0, y: 0 };
  }

  getAimPoint(playerX, playerY) {
    if (!this.gamepad.connected) return null;
    const aimY = Settings.get('invertAimY') ? -this.gamepad.aimY : this.gamepad.aimY;
    const active = this._vectorAim(this.gamepad.aimX, aimY);
    // Stick centrado: mantener la última dirección (independiente del ratón).
    const v = active || this._lastAim;
    if (!v) return null;
    if (active) this._lastAim = active;
    return {
      x: playerX + v.x * this.AIM_DISTANCE,
      y: playerY + v.y * this.AIM_DISTANCE,
    };
  }

  isFiring() {
    return this.gamepad.firing;
  }

  // Aplica zona muerta y normaliza un par de ejes; null si está centrado.
  _vector(x, y) {
    const mag = Math.hypot(x, y);
    if (mag < Settings.get('deadZone')) return null;
    const scaled = (mag - Settings.get('deadZone')) / (1 - Settings.get('deadZone'));
    return { x: (x / mag) * scaled, y: (y / mag) * scaled };
  }

  // Como _vector pero aplica la curva de respuesta configurable: con la curva
  // por encima de 1.0, los movimientos pequeños del stick producen una puntería
  // proporcionalmente menor (más precisión cerca del centro). Con curva 1.0 el
  // comportamiento es idéntico al original.
  _vectorAim(x, y) {
    const mag = Math.hypot(x, y);
    if (mag < Settings.get('deadZone')) return null;
    const scaled = (mag - Settings.get('deadZone')) / (1 - Settings.get('deadZone'));
    const curved = Math.pow(scaled, Settings.get('aimCurve'));
    return { x: (x / mag) * curved, y: (y / mag) * curved };
  }
}
