// Wrapper global para Gato (cat)
// Padrão: a fonte de verdade são os ES modules em scripts/species/*.js.
// Este arquivo existe apenas para compatibilidade (fallback) e para
// apontar para window.Species quando o loader (module) já estiver presente.
try{
  if(typeof window !== 'undefined'){
    window.Species = window.Species || {};
    // Se o loader já preencheu as fábricas/abilities, apenas reencaminhe.
    if(window.Species.createCat && window.Species.catAbilities){
      window.createCat = window.Species.createCat;
      window.catAbilities = window.Species.catAbilities;
    } else if(!window.createCat){
      // Fallback mínimo (mantém funcionalidade caso o projeto seja usado sem loader)
      window.catAbilities = [
        {name:'Scratch', type:'damage', min:9, max:16, prob:0.6},
        {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
        {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
        {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:8000, prob:0.05},
        {name:'Shadow Dash', type:'buffSpeed', amount:2.0, duration:3000, prob:0.3}
      ];

      window.createCat = function(x,y,opts){
        opts = opts || {};
        const base = {
          x: x || 0, y: y || 0,
          hp: 160, maxHp: 160, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0,
          hidden:false, hideUntil:0, radius:30, moveSpeed:1.9, attackCooldown:550,
          speciesDamageMultiplier:1.25, hiddenRegenBonus:1.25, walkRegenPerSec: (Math.random() * (2.5 - 1.5) + 1.5), fleeSpeed:3,
          species: 'cat'
        };
        const inst = Object.assign(base, opts || {});
        // registrar também em Species para quem consultar
        window.Species.createCat = window.createCat; window.Species.catAbilities = window.catAbilities;
        return inst;
      };
    }
  }
}catch(e){ console.warn('cat.global.js load error', e); }
