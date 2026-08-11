export class Input {
  constructor() {
    this.keys = new Set();
    this.mouseX = 0;
    this.mouseY = 0;
    this.mouseDown = false;
    this.onEnterPress = [];
    this.attach();
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

  isDown(key) {
    return this.keys.has(key);
  }

  // Devuelve un vector de movimiento normalizado (diagonal compensada)
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
}
