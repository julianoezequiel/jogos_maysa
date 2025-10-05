// Wrapper global para Calopsita (bird)
// Padrão: os arquivos ES modules em scripts/species/*.js são a fonte de verdade.
try{
  if(typeof window !== 'undefined'){
    window.Species = window.Species || {};
    if(window.Species.createBird && window.Species.birdAbilities){
      window.createBird = window.Species.createBird;
      window.birdAbilities = window.Species.birdAbilities;
    } else if(!window.createBird){
      window.birdAbilities = [
        {name:'Peck', type:'damage', min:6, max:12, prob:0.6},
        {name:'Feather Mend', type:'heal', min:4, max:8, prob:0.15},
        {name:'Wing Gust', type:'buffSpeed', amount:0.5, duration:2500, prob:0.15},
        {name:'Flock Cry', type:'buffDamage', amount:0.3, duration:3500, prob:0.1},
        {name:'Shadow Dash', type:'dash', damage:12, speedBoost:0.6, duration:600, prob:0.08}
      ];

      window.createBird = function(x,y,opts){
        opts = opts || {};
        const base = {
          x: x || 0, y: y || 0,
          hp: 60, maxHp: 60, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0,
          hidden:false, hideUntil:0, radius:20, moveSpeed:2.2, attackCooldown:400,
          speciesDamageMultiplier:0.9, hiddenRegenBonus:1.1, walkRegenPerSec: (Math.random() * (1.0 - 0.5) + 0.5), fleeSpeed:3,
          species: 'bird'
        };
        const inst = Object.assign(base, opts || {});
        window.Species.createBird = window.createBird; window.Species.birdAbilities = window.birdAbilities;
        return inst;
      };
    }
  }
}catch(e){ console.warn('bird.global.js load error', e); }
