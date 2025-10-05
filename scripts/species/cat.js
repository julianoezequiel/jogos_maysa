// Módulo de espécie: Gato (cat)
// Contém declaração das habilidades e função fábrica para criar uma entidade gato
// Comentários em Português (pt-BR) para facilitar entendimento do desenvolvedor

export const catAbilities = [
  {name:'Scratch', type:'damage', min:9, max:16, prob:0.6},
  {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
  {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
  {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:8000, prob:0.05},
  {name:'Shadow Dash', type:'buffSpeed', amount:2.0, duration:3000, prob:0.3}
];

// createCat(x,y,opts) -> retorna um objeto entidade com valores padrão do gato
export function createCat(x, y, opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
    hp: 160,
    maxHp: 160,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 30,
    moveSpeed: 1.9,
    attackCooldown: 550,
    speciesDamageMultiplier: 1.25,
    hiddenRegenBonus: 1.25,
    walkRegenPerSec: Math.random() * (2.5 - 1.5) + 1.5,
    fleeSpeed: 3,
    species: 'cat'
  }, opts || {});
}
