// Módulo de espécie: Peixe (fish)
// Declara habilidades do peixe e fábrica para criar entidades peixe

export const fishAbilities = [
  // fish: more consistent bite and slippery escape tools
  {name:'Bite', type:'damage', min:11, max:18, prob:0.70},
  {name:'Slime Heal', type:'heal', min:6, max:11, prob:0.16},
  {name:'Slippery', type:'buffSpeed', amount:0.8, duration:2600, prob:0.16},
  // Water Surge: AoE maxHP buff to nearby allied fish (helps small schools survive)
  {name:'Water Surge', type:'buffMaxHp', amount:26, duration:7000, prob:0.18, aoe: true, aoeRadius: 90, aoeMaxTargets: 5},
  { name: 'Berserker Rage', type: 'berserk', amount: 1.0, duration: 7000, selfHpCostPerSec: 1, prob: 0.10 }
];

export function createFish(x,y,opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
  hp: 92,
  maxHp: 96,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
  radius: 22,
  moveSpeed: 1.5,
  attackCooldown: 500,
    speciesDamageMultiplier: 1.05,
  hiddenRegenBonus: 1.0,
  walkRegenPerSec: Math.random() * (2.0 - 1.0) + 1.0,
  fleeSpeed: 2.0,
    species: 'fish'
  }, opts || {});
}
