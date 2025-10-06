// Headless simulation runner for balance testing
// Run with: node sim_runner_node.js

function rand() { return Math.random(); }
function randInt(min, max) { return Math.floor(min + rand() * (max - min + 1)); }

// Default local ability pools (kept as fallbacks if dynamic import is unavailable)
let catAbilities = [
  {name:'Scratch', type:'damage', min:7, max:12, prob:0.52},
  {name:'Purr Heal', type:'heal', min:4, max:10, prob:0.16},
  {name:'Feline Fury', type:'buffDamage', amount:0.35, duration:4200, prob:0.10},
  {name:'Nine Lives', type:'buffMaxHp', amount:12, duration:6000, prob:0.03},
  {name:'Shadow Dash', type:'buffSpeed', amount:1.4, duration:2200, prob:0.16}
];
let dogAbilities = [
  {name:'Bite', type:'damage', min:10, max:15, prob:0.58},
  {name:'Growl Heal', type:'heal', min:6, max:11, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.42, duration:5600, prob:0.14},
  {name:'Tough Hide', type:'buffMaxHp', amount:18, duration:8000, prob:0.06},
  {name:'Berserker Rage', type:'buffDamage', amount:0.7, duration:4000, prob:0.09}
];
let birdAbilities = [
  {name:'Peck', type:'damage', min:8, max:16, prob:0.68},
  {name:'Feather Mend', type:'heal', min:6, max:10, prob:0.18},
  {name:'Wing Gust', type:'buffSpeed', amount:0.7, duration:2800, prob:0.20},
  {name:'Flock Cry', type:'buffDamage', amount:0.4, duration:3800, prob:0.12},
  {name:'Shadow Dash', type:'dash', damage:16, speedBoost:0.9, duration:600, prob:0.11}
];
let fishAbilities = [
  {name:'Bite', type:'damage', min:9, max:16, prob:0.66},
  {name:'Slime Heal', type:'heal', min:5, max:9, prob:0.17},
  {name:'Slippery', type:'buffSpeed', amount:0.65, duration:2400, prob:0.16},
  {name:'Water Surge', type:'buffMaxHp', amount:18, duration:7000, prob:0.17},
  { name: 'Berserker Rage', type: 'berserk', amount: 0.85, duration: 7000, selfHpCostPerSec: 1, prob: 0.09 }
];
let capyAbilities = [
  { name: 'Chomp', type: 'damage', min: 12, max: 20, prob: 0.68 },
  { name: 'Capy Calm', type: 'heal', min: 10, max: 16, prob: 0.20 },
  { name: 'Mud Shield', type: 'buffMaxHp', amount: 26, duration: 9000, prob: 0.16 },
  { name: 'Slide', type: 'dash', damage: 14, speedBoost: 0.6, duration: 600, prob: 0.10 },
  { name: 'Serene Aura', type: 'buffDamage', amount: 0.45, duration: 5000, prob: 0.06 }
];

// Current state pointer (set while a match runs) so performAbility can access team lists
let CURRENT_STATE = null;

// chooseAbility now accepts optional user/target to allow small finisher bias
// (birds/fish try to finish low-HP targets by preferring damage abilities).
function chooseAbility(pool, user, target){
  if(!Array.isArray(pool) || pool.length === 0) return null;
  // finisher bias: if attacker is bird/fish and target is low hp, prefer damage
  if(user && target && (user.species === 'bird' || user.species === 'fish')){
    // stronger finisher bias: if target is at or below 50% max HP, prefer damage abilities
    const threshold = (target.maxHp || 100) * 0.50;
    if(target.hp <= threshold){
      // prefer damage abilities but keep probabilistic mix: increase weight for damage
      const damageOnly = pool.filter(a => a && a.type === 'damage');
      if(damageOnly.length > 0){
        // boost damage ability probabilities by multiplier so they are more likely
        const boosted = pool.map(a => Object.assign({}, a));
        const boostMul = 1.6;
        for(const b of boosted){ if(b.type === 'damage') b.prob = (b.prob || 0) * boostMul; }
        pool = boosted;
      }
    }
  }
  const r = rand(); let acc = 0; let chosen = pool[pool.length-1];
  const totalProb = pool.reduce((s,a)=>s + (a.prob || 0), 0) || 1;
  for(const a of pool){ acc += (a.prob || 0) / totalProb; if(r <= acc){ chosen = a; break; } }
  return chosen;
}

function performAbility(user, target, pool, now){
  const chosen = chooseAbility(pool, user, target);
  if(!chosen) return;
  // helper: apply buffMaxHp to an entity (keeps per-entity base)
  function applyBuffMaxHpTo(ent, amount, duration, now){
    if(ent._maxHpBase === undefined) ent._maxHpBase = ent.maxHp;
    const prev = ent._maxHpBuff || 0; const nb = Math.max(prev, amount || 0);
    ent.maxHp = (ent._maxHpBase || ent.maxHp) + nb;
    if(nb - prev > 0) ent.hp = Math.min(ent.maxHp, ent.hp + (nb - prev));
    ent._maxHpBuff = nb; ent._maxHpBuffUntil = now + (duration || 6000);
  }

  // AoE helper: pick up to aoeMaxTargets alive allies (same species) and return array
  function pickAoETargets(origin){
    if(!CURRENT_STATE || !chosen.aoe) return [];
    const map = { cat: 'cats', dog: 'dogs', bird: 'birds', fish: 'fish', capy: 'capy' };
    const key = map[origin.species]; if(!key || !CURRENT_STATE[key]) return [];
    const poolArr = CURRENT_STATE[key].filter(a=>a && a.hp>0);
    const maxT = Math.max(1, chosen.aoeMaxTargets || 3);
    const picked = [];
    const copy = poolArr.slice();
    while(picked.length < maxT && copy.length > 0){
      const idx = Math.floor(rand() * copy.length);
      picked.push(copy.splice(idx,1)[0]);
    }
    return picked;
  }

  // If this ability is AoE, apply effect to multiple allies and return early
  if(chosen.aoe){
    const targets = pickAoETargets(user);
    if(targets.length > 0){
      for(const t of targets){
        if(chosen.type === 'damage'){
          const base = randInt(chosen.min, chosen.max);
          const dmg = Math.floor(base * (user.dmgMult || 1));
          t.hp = Math.max(0, t.hp - dmg);
        } else if(chosen.type === 'heal'){
          const val = randInt(chosen.min, chosen.max);
          t.hp = Math.min(t.maxHp, t.hp + val);
        } else if(chosen.type === 'buffDamage'){
          t.dmgMult = 1 + (chosen.amount || 0.5);
          t.buffUntil = now + (chosen.duration || 4000);
        } else if(chosen.type === 'buffMaxHp'){
          applyBuffMaxHpTo(t, chosen.amount || 0, chosen.duration || 6000, now);
        } else if(chosen.type === 'buffSpeed'){
          t.speedMult = 1 + (chosen.amount || 0.5);
          t.buffUntil = now + (chosen.duration || 3000);
        }
      }
      return;
    }
  }
  if(chosen.type === 'damage'){
    const base = randInt(chosen.min, chosen.max);
    const dmg = Math.floor(base * (user.dmgMult || 1));
    target.hp = Math.max(0, target.hp - dmg);
  } else if(chosen.type === 'heal'){
    const val = randInt(chosen.min, chosen.max);
    user.hp = Math.min(user.maxHp, user.hp + val);
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + (chosen.amount || 0.5);
    user.buffUntil = now + (chosen.duration || 4000);
  } else if(chosen.type === 'buffMaxHp'){
    if(user._maxHpBase === undefined) user._maxHpBase = user.maxHp;
    const prev = user._maxHpBuff || 0; const nb = Math.max(prev, chosen.amount || 0);
    user.maxHp = (user._maxHpBase || user.maxHp) + nb;
    if(nb - prev > 0) user.hp = Math.min(user.maxHp, user.hp + (nb - prev));
    user._maxHpBuff = nb; user._maxHpBuffUntil = now + (chosen.duration || 6000);
  } else if(chosen.type === 'buffSpeed'){
    user.speedMult = 1 + (chosen.amount || 0.5);
    user.buffUntil = now + (chosen.duration || 3000);
  } else if(chosen.type === 'dash'){
    const dmg = chosen.damage || 8; target.hp = Math.max(0, target.hp - dmg);
  } else if(chosen.type === 'berserk'){
    user.dmgMult = 1 + (chosen.amount || 1.0);
    user._berserkUntil = now + (chosen.duration || 7000);
    user._berserkHpCostPerSec = chosen.selfHpCostPerSec || 1;
    user._lastBerserkTick = now;
  }
}

function stepBuffs(entity, now, dt){
  if(entity.buffUntil && now > entity.buffUntil){ entity.dmgMult = 1; entity.speedMult = 1; entity.buffUntil = 0; }
  if(entity._maxHpBuffUntil && now > entity._maxHpBuffUntil){ if(typeof entity._maxHpBase === 'number') entity.maxHp = entity._maxHpBase; entity._maxHpBuff = 0; entity._maxHpBuffUntil = 0; delete entity._maxHpBase; if(entity.hp > entity.maxHp) entity.hp = entity.maxHp; }
  if(entity._berserkUntil){ if(now > entity._berserkUntil){ entity.dmgMult = 1; entity._berserkUntil = 0; delete entity._berserkHpCostPerSec; delete entity._lastBerserkTick; } else { const last = entity._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed / 1000); entity.hp = Math.max(0, entity.hp - secs * (entity._berserkHpCostPerSec || 1)); entity._lastBerserkTick = last + secs*1000; } } }
}

function makeEntities(nCats, nDogs, nBirds, nFish, nCapy){
  const cats = [], dogs = [], birds = [], fish = [], capy = [];
  for(let i=0;i<nCats;i++) cats.push({ species: 'cat', hp:140, maxHp:140, dmgMult:1, speedMult:1, attackCooldown:600, lastAttack:-1e9 });
  for(let i=0;i<nDogs;i++) dogs.push({ species: 'dog', hp:104, maxHp:104, dmgMult:1, speedMult:1, attackCooldown:680, lastAttack:-1e9 });
  // Use canonical counts passed into the function (nBirds, nFish)
  for(let i=0;i< nBirds; i++) birds.push({ species: 'bird', hp:72, maxHp:72, dmgMult:1, speedMult:1, attackCooldown:340, lastAttack:-1e9 });
  for(let i=0;i< nFish; i++) fish.push({ species: 'fish', hp:92, maxHp:92, dmgMult:1, speedMult:1, attackCooldown:520, lastAttack:-1e9 });
  for(let i=0;i<nCapy;i++) capy.push({ species: 'capy', hp:100, maxHp:100, dmgMult:1, speedMult:1, attackCooldown:650, lastAttack:-1e9 });
  return { cats, dogs, birds, fish, capy };
}

function aliveCounts(state){
  return {
    cat: state.cats.filter(e=>e.hp>0).length,
    dog: state.dogs.filter(e=>e.hp>0).length,
    bird: state.birds.filter(e=>e.hp>0).length,
    fish: state.fish.filter(e=>e.hp>0).length,
    capy: state.capy.filter(e=>e.hp>0).length
  };
}

function pickRandomEnemy(entity, state){
  const pools = [];
  if(entity.species !== 'cat') pools.push(...state.cats);
  if(entity.species !== 'dog') pools.push(...state.dogs);
  if(entity.species !== 'bird') pools.push(...state.birds);
  if(entity.species !== 'fish') pools.push(...state.fish);
  if(entity.species !== 'capy') pools.push(...state.capy);
  const alive = pools.filter(p=>p.hp>0);
  if(alive.length === 0) return null;
  return alive[Math.floor(rand() * alive.length)];
}

function runOneMatch(config){
  const state = makeEntities(config.nCats, config.nDogs, config.nBirds, config.nFish, config.nCapy);
  // expose current state for AoE helpers in performAbility
  CURRENT_STATE = state;
  let now = 0; const tick = 100; let turns = 0;
  // 3 minutes timeout (in ms) translated to ticks of `tick` ms
  const matchTimeMs = 3 * 60 * 1000; // 180000 ms
  const maxTurns = Math.ceil(matchTimeMs / tick); // 1800 ticks for 100ms tick
  while(turns++ < maxTurns){
    // collect flat list
    const all = [...state.cats, ...state.dogs, ...state.birds, ...state.fish, ...state.capy];
    // step buffs and berserk drains
    for(const e of all){ if(e.hp<=0) continue; stepBuffs(e, now, tick); }
    // actions
    for(const e of all){ if(e.hp<=0) continue; if(now - (e.lastAttack||-1e9) < (e.attackCooldown||600)) continue; const target = pickRandomEnemy(e,state); if(!target) continue; // no enemies
      e.lastAttack = now; if(e.species === 'cat') performAbility(e,target,catAbilities,now); else if(e.species === 'dog') performAbility(e,target,dogAbilities,now); else if(e.species === 'bird') performAbility(e,target,birdAbilities,now); else if(e.species === 'fish') performAbility(e,target,fishAbilities,now); else if(e.species === 'capy') performAbility(e,target,capyAbilities,now);
    }
    // check end
    const counts = aliveCounts(state); const aliveSpecies = Object.keys(counts).filter(k=>counts[k] > 0);
    if(aliveSpecies.length <= 1) return { winner: aliveSpecies[0] || null, turns };
    now += tick;
  }
  // Time expired: pick species with most alive members as winner (tie -> break by total HP, else draw)
  const finalCounts = aliveCounts(state);
  const entries = Object.entries(finalCounts); // [ [species, count], ... ]
  let maxCount = 0;
  for(const [,c] of entries) if(c > maxCount) maxCount = c;
  if(maxCount === 0){ CURRENT_STATE = null; return { winner: null, turns: maxTurns }; }
  const winners = entries.filter(([k,c]) => c === maxCount).map(([k])=>k);
  if(winners.length === 1){ CURRENT_STATE = null; return { winner: winners[0], turns: maxTurns }; }
  // Tie on counts: break tie by total HP among tied species
  const totalHp = {};
  for(const s of Object.keys(finalCounts)){
    const arr = state[s] || [];
    totalHp[s] = arr.reduce((acc,e)=> acc + (e.hp>0 ? e.hp : 0), 0);
  }
  // find best by HP among tied winners
  let best = null; let bestHp = -1; let tied = [];
  for(const name of winners){ const hp = totalHp[name] || 0; if(hp > bestHp){ bestHp = hp; best = name; tied = [name]; } else if(hp === bestHp){ tied.push(name); } }
  CURRENT_STATE = null;
  if(tied.length === 1) return { winner: best, turns: maxTurns };
  return { winner: null, turns: maxTurns };
}

function runBatch(runs){
  const summary = { cat:0, dog:0, bird:0, fish:0, capy:0, draw:0, totalTurns:0 };
  for(let i=0;i<runs;i++){
  const nCats = 10; const nDogs = 10; const nBirds = Math.max(1, Math.floor(nCats * 0.7)); const nFish = Math.max(1, Math.floor(nDogs * 0.7)); const nCapy = Math.max(1, Math.floor(nCats * 0.3));
    const res = runOneMatch({ nCats, nDogs, nBirds, nFish, nCapy });
    if(!res.winner) summary.draw++; else summary[res.winner] = (summary[res.winner]||0) + 1;
    summary.totalTurns += res.turns;
  }
  console.log(`Runs: ${runs}`);
  console.log(`Cats wins: ${summary.cat} | Dogs wins: ${summary.dog} | Birds: ${summary.bird} | Fish: ${summary.fish} | Capy: ${summary.capy} | Draws: ${summary.draw}`);
  console.log(`Avg turns: ${Math.round(summary.totalTurns / runs)}`);
}

// Try to import the ESM loader, but fall back to the CommonJS node_loader.cjs
// to ensure the runner has a consistent source of ability pools.
(async function main(){
  try{
    // dynamic ESM import - works if Node is running in ESM mode
    const mod = await import('./scripts/species/loader.js');
    catAbilities = mod.catAbilities || mod.default && mod.default.catAbilities || catAbilities;
    dogAbilities = mod.dogAbilities || dogAbilities;
    birdAbilities = mod.birdAbilities || birdAbilities;
    fishAbilities = mod.fishAbilities || fishAbilities;
    capyAbilities = mod.capyAbilities || capyAbilities;
    console.log('Imported species loader (ESM).');
  }catch(e){
    try{
      // CommonJS fallback
      const nodeLoader = require('./scripts/species/node_loader.cjs');
      catAbilities = nodeLoader.catAbilities || catAbilities;
      dogAbilities = nodeLoader.dogAbilities || dogAbilities;
      birdAbilities = nodeLoader.birdAbilities || birdAbilities;
      fishAbilities = nodeLoader.fishAbilities || fishAbilities;
      capyAbilities = nodeLoader.capyAbilities || capyAbilities;
      console.log('Loaded abilities from scripts/species/node_loader.cjs');
    }catch(e2){
      console.warn('Could not load any species loader; using inline defaults.', e2 && e2.message);
    }
  }

  // Lightweight validation helper for ability pools
  function validatePool(pool, name){
    if(!Array.isArray(pool) || pool.length === 0){ console.warn(`Ability pool ${name} is empty or missing`); return false; }
    for(const a of pool){ if(!a || typeof a.type !== 'string'){ console.warn(`Invalid ability in ${name}`, a); return false; } }
    return true;
  }

  validatePool(catAbilities, 'cat'); validatePool(dogAbilities, 'dog'); validatePool(birdAbilities, 'bird'); validatePool(fishAbilities, 'fish'); validatePool(capyAbilities, 'capy');

  // Allow overriding number of runs via CLI arg or environment variable (e.g. node sim_runner_node.js 1000 or RUNS=1000)
  const runsArg = parseInt(process.argv[2], 10);
  const envRuns = parseInt(process.env.RUNS, 10);
  const runsToExecute = Number.isInteger(runsArg) && runsArg > 0 ? runsArg : (Number.isInteger(envRuns) && envRuns > 0 ? envRuns : 500);
  console.log(`Running batch with ${runsToExecute} matches...`);
  runBatch(runsToExecute);
})();
