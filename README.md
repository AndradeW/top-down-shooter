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
- **Audio**: efectos de sonido sintetizados con la Web Audio API y música de fondo generativa, con botón de silencio.
- **Récord local**: guardado en `localStorage` por navegador, con historial de los últimos 5 puntajes.

## Controles

### Escritorio (ratón + teclado)

| Acción | Tecla/Entrada |
|---|---|
| Moverse | `W` `A` `S` `D` o flechas |
| Apuntar | Ratón |
| Disparar | Clic izquierdo (mantener para disparo continuo) |
| Jugar / Reiniciar | Clic en el botón o `Enter` |
| Pausar | `P` o `Escape` |
| Silenciar sonido | Botón 🔊 (abajo a la derecha) |

### Móvil / táctil

| Acción | Gest |
|---|---|
| Moverse | Joystick virtual en la mitad izquierda de la pantalla |
| Apuntar y disparar | Joystick virtual en la mitad derecha (dispara mientras lo mantienes) |
| Pausar | Botón ⏸ (arriba a la derecha) o tecla `P`/`Escape` |
| Vibración | Botón 📳 (arriba a la derecha, solo móviles compatibles) |

### Mando (Gamepad API, cualquier control)

Compatible con cualquier mando que exponga la Gamepad API (Xbox, PlayStation, Switch, genéricos). Se detecta automáticamente al conectar el mando. Los ejes del analógico derecho y los botones se **autocalibran**: si el mando no declara el mapeo estándar, el juego detecta qué ejes son realmente el stick derecho para que la puntería sea de 360°.

| Acción | Entrada |
|---|---|
| Moverse | Analógico izquierdo |
| Apuntar | Analógico derecho (mantiene la última dirección si lo centras) |
| Disparar | `RT`, `RB` o `A` (mantener para disparo continuo) |
| Jugar / Reiniciar | `Start` o `A` |
| Elegir mejora | Flechas del D-pad para navegar y `A` para confirmar |
| Pausar | Botón `Start` o `Select`/compartir |

> Nota: la Gamepad API está disponible en Chrome, Edge y Firefox (escritorio); no está soportada en Safari para iOS.

## Requisitos

- Navegador moderno (Chrome, Firefox, Safari, Edge) con soporte de ES Modules y Canvas API.
- El soporte de mando requiere un navegador con la Gamepad API (Chrome, Edge, Firefox en escritorio; sin soporte en iOS).
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
  Input.js          Entrada de teclado, ratón, táctil y mando (Gamepad API)
  UI.js             Menús, HUD y overlays
```

## Estado del proyecto

- Iteraciones 0–9b completadas y probadas: MVP jugable, oleadas, enemigos, experiencia/niveles, mejoras, pulido visual, audio, UI y estadísticas, soporte móvil (controles táctiles de doble joystick) y pulido por feedback.
- Disponible: récord local en `localStorage`, historial de los últimos 5 puntajes y aviso de nuevo récord.
- Disponible: soporte de mando genérico (Gamepad API) con autocalibración para cualquier gamepad.

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
| 0.13.0 | Soporte de mando genérico (Gamepad API): movimiento con el analógico izquierdo, puntería de 360° con el derecho (autocalibración de ejes para mandos no estándar), disparo con `RT`/`RB`/`A`, `Start`/`Select` para pausar, y selección de mejoras con el D-pad + `A`. |