// CommonJS loader for species abilities.
// This duplicates the canonical pools but keeps them in one place for Node
// runners that can't import ESM loader.js. Update as needed to keep parity.
module.exports = {
  catAbilities: [
    {name:'Scratch', type:'damage', min:6, max:11, prob:0.48},
    {name:'Purr Heal', type:'heal', min:4, max:10, prob:0.16},
    {name:'Feline Fury', type:'buffDamage', amount:0.35, duration:4200, prob:0.10},
    {name:'Nine Lives', type:'buffMaxHp', amount:12, duration:6000, prob:0.03},
    {name:'Shadow Dash', type:'buffSpeed', amount:1.4, duration:2200, prob:0.16}
  ],
  dogAbilities: [
    {name:'Bite', type:'damage', min:9, max:14, prob:0.54},
    {name:'Growl Heal', type:'heal', min:6, max:11, prob:0.18},
    {name:'Alpha Roar', type:'buffDamage', amount:0.42, duration:5600, prob:0.14},
    {name:'Tough Hide', type:'buffMaxHp', amount:18, duration:8000, prob:0.06},
    {name:'Berserker Rage', type:'buffDamage', amount:0.7, duration:4000, prob:0.09}
  ],
  birdAbilities: [
    {name:'Peck', type:'damage', min:10, max:18, prob:0.72},
    {name:'Feather Mend', type:'heal', min:7, max:12, prob:0.18},
    {name:'Wing Gust', type:'buffSpeed', amount:0.85, duration:3000, prob:0.20},
    {name:'Flock Cry', type:'buffDamage', amount:0.55, duration:4200, prob:0.16, aoe: true, aoeRadius: 80, aoeMaxTargets: 4},
    {name:'Shadow Dash', type:'dash', damage:18, speedBoost:0.95, duration:600, prob:0.12}
  ],
  fishAbilities: [
    {name:'Bite', type:'damage', min:11, max:18, prob:0.70},
    {name:'Slime Heal', type:'heal', min:6, max:11, prob:0.16},
    {name:'Slippery', type:'buffSpeed', amount:0.8, duration:2600, prob:0.16},
    {name:'Water Surge', type:'buffMaxHp', amount:26, duration:7000, prob:0.18, aoe: true, aoeRadius: 90, aoeMaxTargets: 5},
    { name: 'Berserker Rage', type: 'berserk', amount: 1.0, duration: 7000, selfHpCostPerSec: 1, prob: 0.10 }
  ],
  capyAbilities: [
    { name: 'Chomp', type: 'damage', min: 12, max: 20, prob: 0.68 },
    { name: 'Capy Calm', type: 'heal', min: 10, max: 16, prob: 0.20 },
    { name: 'Mud Shield', type: 'buffMaxHp', amount: 26, duration: 9000, prob: 0.16 },
    { name: 'Slide', type: 'dash', damage: 14, speedBoost: 0.6, duration: 600, prob: 0.10 },
    { name: 'Serene Aura', type: 'buffDamage', amount: 0.45, duration: 5000, prob: 0.06 }
  ]
};
