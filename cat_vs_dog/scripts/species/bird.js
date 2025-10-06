// Módulo de espécie: Calopsita (bird)
// Contém habilidades específicas e fábrica para criar entidade de pássaro

export const birdAbilities = [
  // slightly stronger peck and faster dash to make birds more mobile and threatening
  {name:'Peck', type:'damage', min:10, max:18, prob:0.72},
  {name:'Feather Mend', type:'heal', min:7, max:12, prob:0.18},
  {name:'Wing Gust', type:'buffSpeed', amount:0.85, duration:3000, prob:0.20},
  // Flock Cry: small AoE buff that affects nearby allied birds (helps small flocks scale)
  {name:'Flock Cry', type:'buffDamage', amount:0.55, duration:4200, prob:0.16, aoe: true, aoeRadius: 80, aoeMaxTargets: 4},
  {name:'Shadow Dash', type:'dash', damage:18, speedBoost:0.95, duration:600, prob:0.12}
];

export function createBird(x,y,opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
  hp: 72,
  maxHp: 72,
    // tune: slightly higher survivability and mobility
    hp: 78,
    maxHp: 78,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 20,
  moveSpeed: 2.8,
  attackCooldown: 320,
    speciesDamageMultiplier: 1.0,
  hiddenRegenBonus: 1.1,
  walkRegenPerSec: Math.random() * (1.4 - 0.8) + 0.8,
  fleeSpeed: 3.6,
    species: 'bird'
  }, opts || {});
}
