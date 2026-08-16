export class UI {
  constructor() {
    this.menu = document.getElementById('menu');
    this.gameover = document.getElementById('gameover');
    this.pauseEl = document.getElementById('pause');
    this.pauseButton = document.getElementById('pauseButton');
    this.upgradesEl = document.getElementById('upgrades');
    this.upgradeOptionsEl = document.getElementById('upgradeOptions');
    this.startButton = document.getElementById('startButton');
    this.settingsButton = document.getElementById('settingsButton');
    this.restartButton = document.getElementById('restartButton');
    this.resumeButton = document.getElementById('resumeButton');
    this.restartFromPauseButton = document.getElementById('restartFromPauseButton');
    this.settingsFromPauseButton = document.getElementById('settingsFromPauseButton');
    this.settingsBackButton = document.getElementById('settingsBackButton');
    this.scoreEl = document.getElementById('score');
    this.waveEl = document.getElementById('wave');
    this.healthFill = document.getElementById('healthFill');
    this.livesEl = document.getElementById('lives');
    this.levelEl = document.getElementById('level');
    this.xpFill = document.getElementById('xpFill');
    this.menuRecord = document.getElementById('menuRecord');
    this.finalScore = document.getElementById('finalScore');
    this.newRecord = document.getElementById('newRecord');
    this.statTime = document.getElementById('statTime');
    this.statKills = document.getElementById('statKills');
    this.statLevel = document.getElementById('statLevel');
    this.statBest = document.getElementById('statBest');
    this.historyBlock = document.getElementById('historyBlock');
    this.historyList = document.getElementById('historyList');
    this.settingsEl = document.getElementById('settings');
    this.aimCurveSlider = document.getElementById('aimCurveSlider');
    this.aimCurveValue = document.getElementById('aimCurveValue');
    this.deadZoneSlider = document.getElementById('deadZoneSlider');
    this.deadZoneValue = document.getElementById('deadZoneValue');
    this.invertAimYToggle = document.getElementById('invertAimYToggle');
    this.vibrateToggle = document.getElementById('vibrateToggle');
    this.soundToggle = document.getElementById('soundToggle');
    this.screenShakeToggle = document.getElementById('screenShakeToggle');
    this.settingsOpen = false;

    // Navegación por mando/teclado: cada overlay expone sus elementos
    // enfocables en orden. El juego la maneja con D-pad/analógico/flechas.
    this.focusGroups = {
      menu: [this.startButton, this.settingsButton],
      pause: [this.resumeButton, this.restartFromPauseButton, this.settingsFromPauseButton],
      gameover: [this.restartButton],
      settings: [
        this.aimCurveSlider,
        this.deadZoneSlider,
        this.invertAimYToggle,
        this.vibrateToggle,
        this.soundToggle,
        this.screenShakeToggle,
        this.settingsBackButton,
      ],
    };
    this.activeGroup = null;
    this.focusIndex = 0;
  }

  showSettings() {
    this.settingsOpen = true;
    this.settingsEl.classList.remove('hidden');
    this.setFocusGroup('settings');
  }

  hideSettings() {
    this.settingsOpen = false;
    this.settingsEl.classList.add('hidden');
    this.clearFocusGroup();
  }

  // ---- Navegación por foco (mando / flechas) ----

  setFocusGroup(name) {
    this.activeGroup = name;
    this.focusIndex = 0;
    this._renderFocus();
  }

  clearFocusGroup() {
    if (this.activeGroup) {
      const group = this.focusGroups[this.activeGroup];
      const prev = group && group[this.focusIndex];
      if (prev) prev.classList.remove('focused');
    }
    this.activeGroup = null;
    this.focusIndex = 0;
  }

  _renderFocus() {
    for (const name of Object.keys(this.focusGroups)) {
      for (const el of this.focusGroups[name]) el.classList.remove('focused');
    }
    const group = this.focusGroups[this.activeGroup];
    if (group && group.length > 0) {
      const el = group[this.focusIndex];
      el.classList.add('focused');
      if (typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest' });
    }
  }

  // Mueve la selección verticalmente (se envuelve al llegar a los extremos).
  navigateVertical(dir) {
    const group = this.focusGroups[this.activeGroup];
    if (!group || group.length === 0) return;
    this.focusIndex = (this.focusIndex + dir + group.length) % group.length;
    this._renderFocus();
  }

  // Horizontal: ajusta sliders/toggles en configuración; en el resto de
  // overlays se comporta como navegación vertical.
  navigateHorizontal(dir) {
    const group = this.focusGroups[this.activeGroup];
    if (!group || group.length === 0) return;
    if (this.activeGroup === 'settings') {
      const el = group[this.focusIndex];
      if (el.type === 'range') {
        const step = parseFloat(el.step) || 1;
        const min = parseFloat(el.min);
        const max = parseFloat(el.max);
        const v = Math.max(min, Math.min(max, parseFloat(el.value) + dir * step));
        el.value = String(v);
        el.dispatchEvent(new Event('input'));
      } else if (el.type === 'checkbox') {
        el.checked = !el.checked;
        el.dispatchEvent(new Event('change'));
      } else {
        this.navigateVertical(dir);
      }
      return;
    }
    this.navigateVertical(dir);
  }

  // Activa el elemento enfocado (botón o toggle). A / Enter.
  activateFocus() {
    const group = this.focusGroups[this.activeGroup];
    if (!group || group.length === 0) return;
    const el = group[this.focusIndex];
    if (!el) return;
    if (el.type === 'checkbox') {
      el.checked = !el.checked;
      el.dispatchEvent(new Event('change'));
    } else if (el.type !== 'range') {
      el.click();
    }
  }

  // Conecta los controles de configuración con quien los aplica.
  bindSettings(handlers) {
    const bindRange = (slider, label, formatter, onSet) => {
      slider.addEventListener('input', () => {
        const v = parseFloat(slider.value);
        label.textContent = formatter(v);
        onSet(v);
      });
    };
    bindRange(this.aimCurveSlider, this.aimCurveValue, (v) => v.toFixed(1), handlers.onAimCurve);
    bindRange(this.deadZoneSlider, this.deadZoneValue, (v) => v.toFixed(2), handlers.onDeadZone);

    const bindToggle = (input, onSet) => {
      input.addEventListener('change', () => onSet(input.checked));
    };
    bindToggle(this.invertAimYToggle, handlers.onInvertAimY);
    bindToggle(this.vibrateToggle, handlers.onVibrate);
    bindToggle(this.soundToggle, handlers.onSound);
    bindToggle(this.screenShakeToggle, handlers.onScreenShake);
  }

  // Inicializa los controles con los valores actuales de Settings.
  setSettings(state) {
    this.aimCurveSlider.value = String(state.aimCurve);
    this.aimCurveValue.textContent = Number(state.aimCurve).toFixed(1);
    this.deadZoneSlider.value = String(state.deadZone);
    this.deadZoneValue.textContent = Number(state.deadZone).toFixed(2);
    this.invertAimYToggle.checked = !!state.invertAimY;
    this.vibrateToggle.checked = !!state.vibrate;
    this.soundToggle.checked = !!state.sound;
    this.screenShakeToggle.checked = !!state.screenShake;
  }

  showMenu(bestScore) {
    if (bestScore > 0) {
      this.menuRecord.textContent = `Récord: ${bestScore}`;
      this.menuRecord.classList.remove('hidden');
    } else {
      this.menuRecord.classList.add('hidden');
    }
    this.menu.classList.remove('hidden');
    this.gameover.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.pauseButton.classList.add('hidden');
    this.upgradesEl.classList.add('hidden');
    this.settingsEl.classList.add('hidden');
    this.settingsOpen = false;
    this.setFocusGroup('menu');
  }

  hideOverlays() {
    this.menu.classList.add('hidden');
    this.gameover.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.upgradesEl.classList.add('hidden');
    this.settingsEl.classList.add('hidden');
    this.settingsOpen = false;
    this.clearFocusGroup();
  }

  showPause() {
    this.pauseEl.classList.remove('hidden');
    this.setFocusGroup('pause');
  }

  hidePause() {
    this.pauseEl.classList.add('hidden');
    this.clearFocusGroup();
  }

  updateHUD(score, health, maxHealth) {
    this.scoreEl.textContent = `Puntos: ${score}`;
    const pct = Math.max(0, Math.min(100, (health / maxHealth) * 100));
    this.healthFill.style.width = `${pct}%`;
    this.livesEl.textContent = `❤ ${Math.floor(health)}/${maxHealth}`;
    this.healthFill.classList.toggle('danger', pct < 25);
  }

  updateWave(wave, phase, countdown) {
    if (phase === 'between') {
      this.waveEl.textContent = `Nivel ${wave + 1} en ${Math.ceil(countdown)}s`;
    } else {
      this.waveEl.textContent = `Nivel ${wave}`;
    }
  }

  updateLevel(level, xp, xpToNext) {
    this.levelEl.textContent = `Rango ${level}`;
    const pct = Math.max(0, Math.min(100, (xp / xpToNext) * 100));
    this.xpFill.style.width = `${pct}%`;
  }

  showGameOver(score, timeSurvived, enemiesKilled, level, bestScore, isNewRecord, history = []) {
    this.finalScore.textContent = `Puntos: ${score}`;
    this.newRecord.classList.toggle('hidden', !isNewRecord);
    this.statTime.textContent = `Tiempo: ${Math.floor(timeSurvived / 60)}m ${Math.floor(timeSurvived % 60)}s`;
    this.statKills.textContent = `Enemigos eliminados: ${enemiesKilled}`;
    this.statLevel.textContent = `Rango alcanzado: ${level}`;
    this.statBest.textContent = `Récord: ${bestScore}`;
    this.renderHistory(history, score);
    this.pauseButton.classList.add('hidden');
    this.gameover.classList.remove('hidden');
    this.setFocusGroup('gameover');
  }

  renderHistory(history, currentScore) {
    if (!history || history.length === 0) {
      this.historyBlock.classList.add('hidden');
      return;
    }
    this.historyBlock.classList.remove('hidden');
    this.historyList.innerHTML = '';
    history.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = s;
      if (s === currentScore) {
        li.classList.add('current');
        li.textContent = `→ ${s}`;
      }
      this.historyList.appendChild(li);
    });
  }

  showUpgrades(upgrades) {
    this.upgradeOptionsEl.innerHTML = '';
    upgrades.forEach((upgrade) => {
      const btn = document.createElement('button');
      btn.className = 'upgrade-card';
      btn.innerHTML = `
        <span class="upgrade-icon">${upgrade.icon}</span>
        <span class="upgrade-name">${upgrade.name}</span>
        <span class="upgrade-desc">${upgrade.description}</span>
      `;
      btn.addEventListener('click', () => upgrade.onSelect());
      this.upgradeOptionsEl.appendChild(btn);
    });
    this.upgradesEl.classList.remove('hidden');
  }

  highlightUpgrade(index) {
    const cards = this.upgradeOptionsEl.querySelectorAll('.upgrade-card');
    cards.forEach((card, i) => {
      card.classList.toggle('selected', i === index);
    });
  }

  hideUpgrades() {
    this.upgradesEl.classList.add('hidden');
  }
}
