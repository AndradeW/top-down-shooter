import { Controller } from './Controller.js';

// Teclado + ratón. Traduce los eventos del teclado y del ratón a las acciones
// del contrato Controller. Comportamiento idéntico al antiguo Input.
export class KeyboardMouseController extends Controller {
  constructor(canvas) {
    super();
    this.canvas = canvas;
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    // Flechas como navegación (mismos eventos dpad*), con detección de flanco
    // para que mantener pulsada la tecla no repita la acción.
    this._prevNav = { up: false, down: false, left: false, right: false };
    this._boundKeyDown = (e) => this._onKeyDown(e);
    this._boundKeyUp = (e) => this._onKeyUp(e);
    this._boundMouseMove = (e) => this._onMouseMove(e);
    this._boundMouseDown = (e) => this._onMouseDown(e);
    this._boundMouseUp = (e) => this._onMouseUp(e);
    this._boundBlur = () => this._onBlur();
    this.attach();
  }

  attach() {
    window.addEventListener('keydown', this._boundKeyDown);
    window.addEventListener('keyup', this._boundKeyUp);
    window.addEventListener('mousemove', this._boundMouseMove);
    window.addEventListener('mousedown', this._boundMouseDown);
    window.addEventListener('mouseup', this._boundMouseUp);
    window.addEventListener('blur', this._boundBlur);
  }

  destroy() {
    window.removeEventListener('keydown', this._boundKeyDown);
    window.removeEventListener('keyup', this._boundKeyUp);
    window.removeEventListener('mousemove', this._boundMouseMove);
    window.removeEventListener('mousedown', this._boundMouseDown);
    window.removeEventListener('mouseup', this._boundMouseUp);
    window.removeEventListener('blur', this._boundBlur);
  }

  _onKeyDown(e) {
    const key = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
      e.preventDefault();
    }
    this.keys.add(key);
    if (key === 'Enter') this._emit('enter');
    // Flechas también emiten navegación (dpads); Game decide cuándo usarlas.
    if (key === 'ArrowUp') {
      if (!this._prevNav.up) this._emit('dpadUp');
      this._prevNav.up = true;
    } else if (key === 'ArrowDown') {
      if (!this._prevNav.down) this._emit('dpadDown');
      this._prevNav.down = true;
    } else if (key === 'ArrowLeft') {
      if (!this._prevNav.left) this._emit('dpadLeft');
      this._prevNav.left = true;
    } else if (key === 'ArrowRight') {
      if (!this._prevNav.right) this._emit('dpadRight');
      this._prevNav.right = true;
    }
    // Pausa con P, Espacio o Escape. preventDefault evita que la barra
    // espaciadora active un botón que tenga el foco (p. ej. JUGAR) o haga scroll.
    if (key === 'p' || key === 'P' || key === 'Escape' || key === ' ') {
      e.preventDefault();
      this._emit('pause');
    }
  }

  _onKeyUp(e) {
    const key = e.key;
    this.keys.delete(key);
    if (key === 'ArrowUp') this._prevNav.up = false;
    else if (key === 'ArrowDown') this._prevNav.down = false;
    else if (key === 'ArrowLeft') this._prevNav.left = false;
    else if (key === 'ArrowRight') this._prevNav.right = false;
  }

  _onMouseMove(e) {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
  }

  _onMouseDown(e) {
    if (e.button === 0) this.mouseDown = true;
  }

  _onMouseUp(e) {
    if (e.button === 0) this.mouseDown = false;
  }

  _onBlur() {
    this.keys.clear();
    this.mouseDown = false;
  }

  isDown(key) {
    return this.keys.has(key);
  }

  // Vector de movimiento normalizado (diagonal compensada).
  getMovement() {
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

  // Puntería absoluta: la posición del ratón en coordenadas del lienzo.
  getAimPoint() {
    const rect = this.canvas.getBoundingClientRect();
    return { x: this.mouseX - rect.left, y: this.mouseY - rect.top };
  }

  isFiring() {
    return this.mouseDown;
  }
}
