// Contrato común de dispositivos de entrada.
// Cada controlador traduce sus eventos físicos a las acciones que el juego
// necesita, sin que el juego sepa de qué dispositivo provienen.
export class Controller {
  constructor() {
    this._listeners = {
      enter: [],
      pause: [],
      actionA: [],
      dpadLeft: [],
      dpadRight: [],
      dpadUp: [],
      dpadDown: [],
    };
  }

  // Suscripción a pulsaciones únicas ('enter' | 'pause' | 'actionA' | 'dpad*').
  on(event, fn) {
    const list = this._listeners[event];
    if (list) list.push(fn);
  }

  _emit(event) {
    for (const fn of this._listeners[event] || []) fn();
  }

  // Vector de movimiento normalizado { x, y } (0..1). Quieto por defecto.
  getMovement() {
    return { x: 0, y: 0 };
  }

  // Punto absoluto de puntería { x, y }, o null si este controlador no está
  // produciendo entrada de puntería en este frame.
  getAimPoint(playerX, playerY) {
    return null;
  }

  // Disparo continuo (true mientras el jugador mantiene la acción).
  isFiring() {
    return false;
  }

  // Tick por frame. Solo lo necesita el gamepad; el resto no hace nada.
  poll() {}

  // Limpieza de listeners (por completitud; sin uso actual).
  destroy() {}
}
