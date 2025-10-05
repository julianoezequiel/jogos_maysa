// Wrapper global para Peixe (fish)
// Padrão: ES modules em scripts/species/*.js são a fonte de verdade.
try{
  if(typeof window !== 'undefined'){
    window.Species = window.Species || {};
    if(window.Species.createFish && window.Species.fishAbilities){
      window.createFish = window.Species.createFish;
      window.fishAbilities = window.Species.fishAbilities;
    } else if(!window.createFish){
      window.fishAbilities = [
        {name:'Bite', type:'damage', min:7, max:11, prob:0.6},
        {name:'Slime Heal', type:'heal', min:3, max:6, prob:0.15},
        {name:'Slippery', type:'buffSpeed', amount:0.35, duration:2000, prob:0.1},
        {name:'Water Surge', type:'buffMaxHp', amount:12, duration:7000, prob:0.15},
        {name:'Berserker Rage', type:'berserk', amount:1.0, duration:7000, selfHpCostPerSec:1, prob:0.12}
      ];

      window.createFish = function(x,y,opts){
        opts = opts || {};
        const base = {
          x: x || 0, y: y || 0,
          hp: 80, maxHp: 80, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0,
          hidden:false, hideUntil:0, radius:22, moveSpeed:1.2, attackCooldown:600,
          speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: (Math.random() * (1.5 - 0.5) + 0.5), fleeSpeed:1.5,
          species: 'fish'
        };
        const inst = Object.assign(base, opts || {});
        window.Species.createFish = window.createFish; window.Species.fishAbilities = window.fishAbilities;
        return inst;
      };
    }
  }
}catch(e){ console.warn('fish.global.js load error', e); }
