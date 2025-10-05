// Módulo de espécie: Peixe (fish)
// Declara habilidades do peixe e fábrica para criar entidades peixe

export const fishAbilities = [
  {name:'Bite', type:'damage', min:7, max:11, prob:0.6},
  {name:'Slime Heal', type:'heal', min:3, max:6, prob:0.15},
  {name:'Slippery', type:'buffSpeed', amount:0.35, duration:2000, prob:0.1},
  {name:'Water Surge', type:'buffMaxHp', amount:12, duration:7000, prob:0.15},
  { name: 'Berserker Rage', type: 'berserk', amount: 1.0, duration: 7000, selfHpCostPerSec: 1, prob: 0.12 }
];

export function createFish(x,y,opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
    hp: 80,
    maxHp: 80,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 22,
    moveSpeed: 1.2,
    attackCooldown: 600,
    speciesDamageMultiplier: 1.0,
    hiddenRegenBonus: 1.0,
    walkRegenPerSec: Math.random() * (1.5 - 0.5) + 0.5,
    fleeSpeed: 1.5,
    species: 'fish'
  }, opts || {});
}
