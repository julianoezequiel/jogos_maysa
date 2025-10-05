try{
	if(typeof window !== 'undefined'){
		window.Species = window.Species || {};
		if(window.Species.createDog && window.Species.dogAbilities){
			window.createDog = window.Species.createDog;
			window.dogAbilities = window.Species.dogAbilities;
		} else if(!window.createDog){
			window.dogAbilities = [
				{name:'Bite', type:'damage', min:10, max:16, prob:0.6},
				{name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
				{name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
				{name:'Tough Hide', type:'buffMaxHp', amount:20, duration:8000, prob:0.06},
				{name:'Berserker Rage', type:'buffDamage', amount:0.8, duration:4000, prob:0.1}
			];

			window.createDog = function(x,y,opts){
				opts = opts || {};
				const base = {
					x: x || 0, y: y || 0,
					hp: 90, maxHp:90, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0,
					hidden:false, hideUntil:0, radius:38, moveSpeed:1.45, attackCooldown:700,
					speciesDamageMultiplier:1.2, hiddenRegenBonus:1.0, walkRegenPerSec: (Math.random() * (3.0 - 1.5) + 1.5), fleeSpeed:1,
					species: 'dog'
				};
				const inst = Object.assign(base, opts || {});
				window.Species.createDog = window.createDog; window.Species.dogAbilities = window.dogAbilities;
				return inst;
			};
		}
	}
}catch(e){ console.warn('dog.global.js load error', e); }
