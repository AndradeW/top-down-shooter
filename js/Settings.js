// Configuración persistente del juego. Se guarda en localStorage bajo la clave
// topDownShooter_settings y se edita desde el menú de configuración.
const DEFAULTS = {
  aimCurve: 1,          // Curva de respuesta del stick derecho (1.0 = lineal)
  deadZone: 0.2,        // Zona muerta de los sticks del mando
  invertAimY: false,    // Invertir eje Y del stick derecho
  vibrate: true,        // Vibración al recibir daño / morir
  sound: true,          // Sonido y música
  screenShake: true,    // Screen shake al recibir daño
};

export const Settings = {
  values: { ...DEFAULTS },

  load() {
    try {
      const raw = localStorage.getItem('topDownShooter_settings');
      const saved = raw ? JSON.parse(raw) : {};
      for (const key of Object.keys(DEFAULTS)) {
        if (typeof saved[key] === typeof DEFAULTS[key]) {
          this.values[key] = saved[key];
        }
      }
      // Migración: la vibración antes vivía en topDownShooter_vibrate ('off'/'on')
      if (saved.vibrate === undefined && localStorage.getItem('topDownShooter_vibrate') === 'off') {
        this.values.vibrate = false;
      }
    } catch {
      // localStorage no disponible (modo privado): se usan los valores por defecto.
    }
    return this.values;
  },

  get(key) {
    return this.values[key];
  },

  set(key, value) {
    this.values[key] = value;
    try {
      localStorage.setItem('topDownShooter_settings', JSON.stringify(this.values));
    } catch {
      // localStorage no disponible: el valor queda solo en memoria.
    }
  },
};

Settings.load();