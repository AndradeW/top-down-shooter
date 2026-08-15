import { KeyboardMouseController } from './KeyboardMouseController.js';
import { TouchController } from './TouchController.js';
import { GamepadController } from './GamepadController.js';

// Fachada de entrada: agrega las acciones de todos los dispositivos y expone
// al juego la misma API que siempre ha usado. El juego nunca sabe de qué
// dispositivo provienen las acciones.
export class Input {
  constructor(canvas) {
    this.onEnterPress = [];
    this.onPausePress = [];
    this.onActionAPress = [];
    this.onDPadLeft = [];
    this.onDPadRight = [];
    this.onDPadUp = [];
    this.onDPadDown = [];

    this.keyboard = new KeyboardMouseController(canvas);
    this.touchController = new TouchController();
    this.gamepadController = new GamepadController();

    // Prioridad de agregación: mando → táctil → teclado/ratón.
    this._controllers = [
      this.gamepadController,
      this.touchController,
      this.keyboard,
    ];

    // Cada controlador traduce sus pulsaciones a acciones comunes; el juego se
    // suscribe a los arrays públicos sin saber el dispositivo.
    const wire = (event, target) => {
      for (const c of this._controllers) {
        c.on(event, () => target.forEach((fn) => fn()));
      }
    };
    wire('enter', this.onEnterPress);
    wire('pause', this.onPausePress);
    wire('actionA', this.onActionAPress);
    wire('dpadLeft', this.onDPadLeft);
    wire('dpadRight', this.onDPadRight);
    wire('dpadUp', this.onDPadUp);
    wire('dpadDown', this.onDPadDown);
  }

  // Tick por frame (lo necesita el mando para leer su estado).
  poll() {
    for (const c of this._controllers) c.poll();
  }

  // Vector de movimiento combinado: mando → táctil → teclado.
  getMovement() {
    for (const c of this._controllers) {
      const v = c.getMovement();
      if (v && (v.x !== 0 || v.y !== 0)) return v;
    }
    return { x: 0, y: 0 };
  }

  // Punto de puntería combinado: táctil → mando → ratón (respaldo).
  getAimPoint(playerX, playerY) {
    for (const c of this._controllers) {
      const p = c.getAimPoint(playerX, playerY);
      if (p) return p;
    }
    return { x: 0, y: 0 };
  }

  // Disparo continuo: ratón, joystick táctil derecho o mando.
  isFiring() {
    for (const c of this._controllers) {
      if (c.isFiring()) return true;
    }
    return false;
  }

  // Estado táctil expuesto para que Game dibuje los joysticks virtuales.
  get hasTouch() {
    return this.touchController.enabled;
  }

  get touch() {
    return this.touchController.touch;
  }

  get STICK_RADIUS() {
    return this.touchController.STICK_RADIUS;
  }

  // Estado del mando expuesto para el HUD/diagnóstico.
  get gamepad() {
    return this.gamepadController.gamepad;
  }
}
