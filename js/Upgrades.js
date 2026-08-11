const UPGRADE_POOL = [
  {
    id: 'damage',
    name: 'Daño +',
    description: 'Cada proyectil hace más daño',
    icon: '⚔',
    apply: (game) => { game.player.damage += 1; },
  },
  {
    id: 'fireRate',
    name: 'Cadencia +',
    description: 'Dispara más rápido',
    icon: '⚡',
    apply: (game) => { game.fireRate = Math.max(0.05, game.fireRate - 0.025); },
  },
  {
    id: 'speed',
    name: 'Velocidad +',
    description: 'Te mueves más rápido',
    icon: '👟',
    apply: (game) => { game.player.speed += 25; },
  },
  {
    id: 'maxHealth',
    name: 'Vida máx. +',
    description: 'Aumenta tu vida máxima y te cura',
    icon: '❤',
    apply: (game) => {
      game.player.maxHealth += 25;
      game.player.health = Math.min(game.player.maxHealth, game.player.health + 25);
    },
  },
  {
    id: 'projectileSpeed',
    name: 'Proyectiles +',
    description: 'Tus balas viajan más rápido',
    icon: '🚀',
    apply: (game) => { game.projectileSpeed += 60; },
  },
  {
    id: 'xpGain',
    name: 'XP extra',
    description: 'Ganas más XP por enemigo',
    icon: '✦',
    apply: (game) => { game.xpGain += 1; },
  },
];

export function rollUpgrades(count) {
  const shuffled = [...UPGRADE_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
