// Módulo de espécie: Cachorro (dog)
// Declara habilidades e fornece fábrica para criar entidades cachorro

export const dogAbilities = [
  // slight nerf to bite to reduce dominance vs mixed teams
  {name:'Bite', type:'damage', min:9, max:14, prob:0.54},
  {name:'Growl Heal', type:'heal', min:6, max:12, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.42, duration:5600, prob:0.14},
  {name:'Tough Hide', type:'buffMaxHp', amount:18, duration:8000, prob:0.07},
  {name:'Berserker Rage', type:'buffDamage', amount:0.7, duration:4000, prob:0.09}
];

export function createDog(x,y,opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
  hp: 104,
  maxHp: 104,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 38,
  moveSpeed: 1.5,
  attackCooldown: 680,
    speciesDamageMultiplier: 1.2,
    hiddenRegenBonus: 1.0,
    walkRegenPerSec: Math.random() * (3.0 - 1.5) + 1.5,
    fleeSpeed: 1,
    species: 'dog'
  }, opts || {});
}
