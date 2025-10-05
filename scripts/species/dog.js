// Módulo de espécie: Cachorro (dog)
// Declara habilidades e fornece fábrica para criar entidades cachorro

export const dogAbilities = [
  {name:'Bite', type:'damage', min:10, max:16, prob:0.6},
  {name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
  {name:'Tough Hide', type:'buffMaxHp', amount:20, duration:8000, prob:0.06},
  {name:'Berserker Rage', type:'buffDamage', amount:0.8, duration:4000, prob:0.1}
];

export function createDog(x,y,opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
    hp: 90,
    maxHp: 90,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 38,
    moveSpeed: 1.45,
    attackCooldown: 700,
    speciesDamageMultiplier: 1.2,
    hiddenRegenBonus: 1.0,
    walkRegenPerSec: Math.random() * (3.0 - 1.5) + 1.5,
    fleeSpeed: 1,
    species: 'dog'
  }, opts || {});
}
