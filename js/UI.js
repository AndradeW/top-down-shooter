export class UI {
  constructor() {
    this.menu = document.getElementById('menu');
    this.gameover = document.getElementById('gameover');
    this.pauseEl = document.getElementById('pause');
    this.pauseButton = document.getElementById('pauseButton');
    this.vibrateButton = document.getElementById('vibrateButton');
    this.upgradesEl = document.getElementById('upgrades');
    this.upgradeOptionsEl = document.getElementById('upgradeOptions');
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
    this.vibrateButton.classList.add('hidden');
    this.upgradesEl.classList.add('hidden');
  }

  hideOverlays() {
    this.menu.classList.add('hidden');
    this.gameover.classList.add('hidden');
    this.pauseEl.classList.add('hidden');
    this.upgradesEl.classList.add('hidden');
  }

  showPause() {
    this.pauseEl.classList.remove('hidden');
  }

  hidePause() {
    this.pauseEl.classList.add('hidden');
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

  hideUpgrades() {
    this.upgradesEl.classList.add('hidden');
  }
}
