# Top-Down Shooter

Shooter arcade 2D de supervivencia (top-down) para navegador. Sobrevive a oleadas de enemigos mientras los eliminas a tiros, recoges experiencia, subes de nivel y eliges mejoras. Escrito íntegramente en HTML5, CSS3 y JavaScript vanilla con Canvas API, sin dependencias ni paso de build.

## Características

- **Menú y Game Over**: iniciar/reiniciar con clic o Enter, estadísticas de partida y récord.
- **Jugador**: movimiento con WASD o flechas, apuntado con el ratón y disparo continuo con el clic izquierdo.
- **Oleadas progresivas**: pausa entre oleadas, cantidad creciente de enemigos y dificultad creciente.
- **4 tipos de enemigos** (con desbloqueo progresivo por oleada):
  - Normal
  - Zigzag (movimiento oscilante)
  - Rápido
  - Tanque (más vida y daño)
- **Experiencia y niveles**: los enemigos sueltan gemas de XP con atracción magnética; al subir de nivel, el juego pausa y muestra **3 mejoras aleatorias** (daño, cadencia, velocidad, vida máx., velocidad de proyectil, XP extra).
- **Pulido visual**: sistema de partículas (disparo, impactos, recolección de XP, daño), screen shake, retroceso al disparar y temática visual espacial (nave con estela, enemigos con figuras propias, láseres, glow).
- **Audio**: efectos de sonido sintetizados con la Web Audio API y música de fondo generativa.
- **Récord local**: guardado en `localStorage` por navegador, con historial de los últimos 5 puntajes.
- **Configuración**: menú para ajustar la sensibilidad del stick derecho del mando (curva exponencial), la zona muerta de los sticks, el eje Y, y activar/desactivar vibración, sonido y screen shake.

## Controles

### Escritorio (ratón + teclado)

| Acción | Tecla/Entrada |
|---|---|
| Moverse | `W` `A` `S` `D` o flechas |
| Apuntar | Ratón |
| Disparar | Clic izquierdo (mantener para disparo continuo) |
| Jugar / Reiniciar | Clic en el botón o `Enter` |
| Pausar | `P`, `Escape` o barra espaciadora |

### Móvil / táctil

| Acción | Gest |
|---|---|
| Moverse | Joystick virtual en la mitad izquierda de la pantalla |
| Apuntar y disparar | Joystick virtual en la mitad derecha (dispara mientras lo mantienes) |
| Pausar | Botón ⏸ (arriba a la derecha) |

### Mando (Xbox y compatibles)

| Acción | Entrada |
|---|---|
| Moverse | Analógico izquierdo |
| Apuntar | Analógico derecho (si está centrado, mantiene la última dirección) |
| Disparar | `RT`, `RB` o `A` |
| Jugar / Continuar / Reiniciar / Elegir mejora | `A` |
| Pausar | `Start` |
| Navegar menús y configuración | D-pad o analógico izquierdo |
| Elegir mejora | D-pad o analógico izquierdo + `A` |
| Cerrar configuración | `Start`, `ESC` o `P` |

> En menús, pausa y configuración, la selección se mueve con el D-pad/analógico (o flechas del teclado) y se activa con `A`/`Enter`. En configuración, izquierda/derecha ajustan los sliders y alternan los toggles.

### Configuración

Disponible desde el menú principal o la pausa (botón **CONFIGURACIÓN**). Los ajustes se guardan en `localStorage` por navegador.

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge) con soporte de ES Modules y Canvas API.
- No requiere servidor especial ni dependencias.

## Jugar en local

El proyecto se sirve como sitio estático. Desde la raíz del proyecto:

```bash
python3 -m http.server 8080
```

Abre `http://localhost:8080` en el navegador.

## Despliegue en GitHub Pages

El juego es 100% estático (rutas relativas, sin build steps), por lo que es directamente compatible con GitHub Pages:

1. Sube el contenido a un repositorio público en GitHub (rama `main`).
2. En el repo: **Settings → Pages → Deploy from a branch**.
3. Selecciona la rama `main` y la carpeta `/ (root)`.
4. Guarda y espera a que el despliegue termine.
5. El juego quedará en `https://<usuario>.github.io/<repo>/`.

> El archivo `.nojekyll` está incluido para que Pages sirva los archivos sin procesarlos con Jekyll.

Nota: el récord es local (se guarda en el navegador del jugador, `localStorage`); no existe un ranking en línea.

## Tecnologías y restricciones

- **Stack**: HTML5, CSS3, JavaScript (vanilla / ES Modules), Canvas API.
- **Sin dependencias externas ni frameworks.** La única petición externa es un `<link>` a Google Fonts (Orbitron y Rubik) con fallback a fuentes del sistema.
- **Sin build steps**: el juego se abre/sirve directamente con un servidor estático.
- **Arquitectura por entidades** con bucle `requestAnimationFrame` y `deltaTime`.

## Estructura del proyecto

```
index.html          Página principal (canvas, HUD, overlays)
style.css           Estilos y sistema de diseño de la UI
js/
  main.js           Punto de entrada: arranca Game y UI
  Game.js           Bucle principal, estados, oleadas, XP, colisiones, stats
  Player.js         Jugador: movimiento, vida, disparo
  Enemy.js          Enemigos: tipos, IA de persecución, zigzag
  Projectile.js     Proyectiles del jugador
  XP.js             Gemas de experiencia con atracción magnética
  Particle.js       Partículas (impactos, explosiones)
  Upgrades.js       Catálogo y selección de mejoras
  Sound.js          Sonido y música con Web Audio API
  Settings.js       Configuración persistente (localStorage)
  Controller.js     Contrato común de los controladores de entrada
  KeyboardMouseController.js  Teclado + ratón
  TouchController.js          Táctil (doble joystick)
  GamepadController.js         Mando genérico (Gamepad API)
  Input.js          Fachada de entrada (mando, táctil, teclado/ratón)
  UI.js             Menús, HUD y overlays
```

## Estado del proyecto

- Iteraciones 0–9b completadas y probadas: MVP jugable, oleadas, enemigos, experiencia/niveles, mejoras, pulido visual, audio, UI y estadísticas, soporte móvil (controles táctiles de doble joystick) y pulido por feedback.
- Disponible: récord local en `localStorage`, historial de los últimos 5 puntajes y aviso de nuevo récord.

## Historial de versiones

| Versión | Cambios |
|---|---|
| 0.1.0 | MVP jugable: menú, jugador, disparos, enemigos, colisiones, vida, game over y reinicio. |
| 0.2.0 | Sistema de oleadas con dificultad progresiva e indicador de oleada. |
| 0.3.0 | Tipos de enemigos (normal, rápido, tanque, zigzag) con desbloqueo por oleada. |
| 0.4.0 | Experiencia (gemas), recolección magnética, barra de XP y subida de nivel. |
| 0.5.0 | Sistema de mejoras (3 opciones aleatorias al subir de nivel). |
| 0.6.0 | Pulido visual: partículas, screen shake y retroceso. |
| 0.7.0 | Audio: efectos y música generativa con Web Audio API, botón de silencio. |
| 0.8.0 | UI y estadísticas: récord local, estadísticas de partida y menú mejorado. |
| 0.9.0 | Plan de UI documentado y despliegue preparado para GitHub Pages. |
| 0.10.0 | Pulido de UI aplicado: tipografías Orbitron/Rubik, sistema de tokens, rediseño de menú/HUD/game over/mejoras, indicador de vida baja, accesibilidad y `prefers-reduced-motion`. |
| 0.11.0 | Soporte móvil: controles táctiles de doble joystick, adaptación de la UI a pantallas pequeñas y desbloqueo de audio con gesto táctil. |
| 0.12.0 | Pulido por feedback: menú con objetivo, temática espacial, pausa, historial de puntajes, vida numérica, joystick más preciso, vibración configurable y renombrado de Oleada→Nivel / Nivel→Rango. |
| 0.13.0 | Primer soporte de mando genérico (Gamepad API) con autocalibración de ejes. |
| 0.14.0 | Refactor de entrada a controladores desacoplados (teclado/ratón, táctil y mando) y pausa con la barra espaciadora. |
| 0.15.0 | Menú de configuración: sensibilidad y zona muerta del mando, inversión del eje Y, y toggles de vibración, sonido y screen shake. |
| 0.16.0 | Navegación de menús con mando/flechas (D-pad/analógico + `A`) y proyectiles que vuelan hasta el borde de la pantalla. |
| 0.17.0 | Puntería del mando independiente del ratón (mantiene la última dirección al soltar el stick) y sonido compatible con jugar solo con mando. |