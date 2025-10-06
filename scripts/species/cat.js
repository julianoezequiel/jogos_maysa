// Módulo de espécie: Gato (cat)
// Contém declaração das habilidades e função fábrica para criar uma entidade gato
// Comentários em Português (pt-BR) para facilitar entendimento do desenvolvedor

export const catAbilities = [
  // slight nerf to raw damage and buff magnitude to keep cats competitive but not overpowering
  // further nerf to cat raw damage and buffs to reduce dominance
  // slightly reduced raw damage probability to balance teams
  {name:'Scratch', type:'damage', min:6, max:11, prob:0.48},
  {name:'Purr Heal', type:'heal', min:4, max:10, prob:0.16},
  {name:'Feline Fury', type:'buffDamage', amount:0.35, duration:4200, prob:0.10},
  {name:'Nine Lives', type:'buffMaxHp', amount:12, duration:6000, prob:0.03},
  {name:'Shadow Dash', type:'buffSpeed', amount:1.4, duration:2200, prob:0.16}
];

// createCat(x,y,opts) -> retorna um objeto entidade com valores padrão do gato
export function createCat(x, y, opts = {}){
  return Object.assign({
    x: x || 0,
    y: y || 0,
  hp: 140,
  maxHp: 140,
    dmgMult: 1,
    speedMult: 1,
    buffUntil: 0,
    lastAttack: 0,
    hidden: false,
    hideUntil: 0,
    radius: 30,
  moveSpeed: 1.7,
  attackCooldown: 600,
    speciesDamageMultiplier: 1.25,
  hiddenRegenBonus: 1.15,
  walkRegenPerSec: Math.random() * (2.0 - 1.0) + 1.0,
    fleeSpeed: 3,
    species: 'cat'
  }, opts || {});
}
