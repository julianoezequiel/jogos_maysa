// Headless simulator for Cat vs Dog (Node)
// Usage: node simulate.js [nCats] [nDogs] [runs]

const args = process.argv.slice(2);
const N_CATS = parseInt(args[0]) || 6;
const N_DOGS = parseInt(args[1]) || 10;
let N_BIRDS = Math.floor(N_CATS * 0.4);
let N_FISH = Math.floor(N_DOGS * 0.4);
let RUNS = 100;
if(args.length === 3){ RUNS = parseInt(args[2]) || 100; }
else if(args.length >= 5){ N_BIRDS = parseInt(args[2]) || N_BIRDS; N_FISH = parseInt(args[3]) || N_FISH; RUNS = parseInt(args[4]) || 100; }

function rand(a,b){ return Math.random() * (b - a) + a; }
function irand(a,b){ return Math.floor(rand(a,b)); }
function dist(a,b,c,d){ const dx = a-c, dy = b-d; return Math.sqrt(dx*dx+dy*dy); }
function nowMs(ticks, tickMs){ return ticks * tickMs; }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

const catAbilities = [
  // increased scratch damage slightly for balance (was 8-14)
  {name:'Scratch', type:'damage', min:9, max:16, prob:0.6},
  {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
  {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
  {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:8000, prob:0.05}
];
const dogAbilities = [
  // slightly increased bite damage to improve parity vs cats
  {name:'Bite', type:'damage', min:10, max:16, prob:0.6},
  {name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
  {name:'Tough Hide', type:'buffMaxHp', amount:20, duration:8000, prob:0.06}
];

const birdAbilities = [
  {name:'Peck', type:'damage', min:6, max:12, prob:0.6},
  {name:'Feather Mend', type:'heal', min:4, max:8, prob:0.15},
  {name:'Wing Gust', type:'buffSpeed', amount:0.5, duration:2500, prob:0.15},
  {name:'Flock Cry', type:'buffDamage', amount:0.3, duration:3500, prob:0.1},
  {name:'Shadow Dash', type:'dash', damage:14, speedBoost:0.6, duration:600, prob:0.08}
];

const fishAbilities = [
  {name:'Bite', type:'damage', min:7, max:11, prob:0.6},
  {name:'Slime Heal', type:'heal', min:3, max:6, prob:0.15},
  {name:'Slippery', type:'buffSpeed', amount:0.35, duration:2000, prob:0.1},
  {name:'Water Surge', type:'buffMaxHp', amount:12, duration:7000, prob:0.15},
  {name:'Berserker Rage', type:'berserk', amount:1.0, duration:7000, selfHpCostPerSec:1, prob:0.12}
];

function pickByProb(pool){ const r = Math.random(); let acc = 0; for(const a of pool){ acc += a.prob; if(r <= acc) return a; } return pool[pool.length-1]; }

function performAbility(user, target, chosen, now){
  if(chosen.type === 'damage'){
    const base = Math.floor(rand(chosen.min, chosen.max+1));
    const dmg = Math.floor(base * ((user.speciesDamageMultiplier || 1) * (user.dmgMult || 1)));
    target.hp = Math.max(0, target.hp - dmg);
    // reveal and restore saved radius / stop regenerating so it flees properly
    if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } }
  } else if(chosen.type === 'heal'){
    const val = Math.floor(rand(chosen.min, chosen.max+1));
    user.hp = Math.min(user.maxHp, user.hp + val);
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + chosen.amount;
    user.buffUntil = now + chosen.duration;
  } else if(chosen.type === 'buffSpeed'){
    if(!user._baseMoveSpeed) user._baseMoveSpeed = user.moveSpeed || 1.4;
    user.moveSpeed = (user._baseMoveSpeed || user.moveSpeed) * (1 + chosen.amount);
    user._speedBuffUntil = now + chosen.duration;
  } else if(chosen.type === 'dash'){
    // immediate dash damage + short speed burst
    const base = Math.floor(chosen.damage || 8);
    const dmg = Math.floor(base * ((user.speciesDamageMultiplier || 1) * (user.dmgMult || 1)));
    if(target){ target.hp = Math.max(0, target.hp - dmg); }
    if(!user._baseMoveSpeed) user._baseMoveSpeed = user.moveSpeed || 1.6;
    user.moveSpeed = (user._baseMoveSpeed || user.moveSpeed) * (1 + (chosen.speedBoost || 0.5));
    user._speedBuffUntil = now + (chosen.duration || 600);
    // make the target flee if damaged
    if(target && target.hp>0){ target.state = 'flee'; target.targetHide = null; }
  } else if(chosen.type === 'berserk'){
    // increase damage but cause slight HP drain over time
    user.dmgMult = 1 + (chosen.amount || 1.0);
    user.buffUntil = now + chosen.duration;
    user._berserkUntil = now + chosen.duration;
    user._berserkHpCostPerSec = chosen.selfHpCostPerSec || 1;
    user._lastBerserkTick = now;
  } else if(chosen.type === 'buffMaxHp'){
    if(!user._maxHpBase) user._maxHpBase = user.maxHp;
    const prev = user._maxHpBuff || 0;
    const next = Math.max(prev, chosen.amount);
    user.maxHp = (user._maxHpBase || user.maxHp) + next;
    const delta = next - prev;
    if(delta > 0) user.hp = Math.min(user.maxHp, user.hp + delta);
    user._maxHpBuff = next;
    user._maxHpBuffUntil = now + (chosen.duration || 8000);
  }
}

function safestHide(x,y,enemies, hideSpots, avoidEntity = null, now = 0){
  if(hideSpots.length === 0) return null;
  const validEnemies = enemies.filter(e=>e.hp>0);
  if(validEnemies.length === 0){ // nearest
    let best = null; let bd = 1e9; for(const s of hideSpots){ if(avoidEntity && avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s && avoidEntity.recentlyAvoidUntil > now) continue; const d = dist(x,y,s.x,s.y); if(d<bd){ bd=d; best=s; } } return best;
  }
  let best=null; let bestScore=-1e9;
  for(const s of hideSpots){
    if(avoidEntity && avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s && avoidEntity.recentlyAvoidUntil > now) continue;
    let minDE = 1e9;
    for(const e of validEnemies){ const de = dist(s.x,s.y,e.x,e.y); if(de<minDE) minDE = de; }
    const distToSelf = dist(x,y,s.x,s.y);
    // prefer tree for cats and rock for dogs/fish
    let typeBonus = 0;
    try{
      const sp = avoidEntity && avoidEntity.species ? avoidEntity.species : null;
      if(sp === 'cat' && s.type === 'tree') typeBonus = 40;
      else if((sp === 'dog' || sp === 'fish') && s.type === 'rock') typeBonus = 40;
    }catch(e){}
    const score = minDE - 0.35 * distToSelf + typeBonus;
    if(score > bestScore){ bestScore = score; best = s; }
  }
  return best;
}

function pickFarHide(attackers, hideSpots, threshold = 80, avoidEntity = null, now = 0){
  if(!hideSpots || hideSpots.length === 0) return null;
  let best = null; let bestMin = -1;
  for(const s of hideSpots){
    if(avoidEntity && avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s && avoidEntity.recentlyAvoidUntil > now) continue;
    let minD = 1e9;
    for(const a of attackers){ if(!a) continue; const d = dist(s.x,s.y,a.x,a.y); if(d < minD) minD = d; }
    if(minD > bestMin){ bestMin = minD; best = s; }
  }
  if(best && bestMin >= threshold) return best;
  return best;
}

function initMatch(nCats,nDogs){
  const cats = [];
  const dogs = [];
  const birds = [];
  const fish = [];
  const hideSpots = [];
  const spots = 6 + Math.floor(rand(0,5));
  // rebalance hide spots according to allied counts (cats+birds vs dogs+fish)
  const alliedCats = nCats + Math.floor(nCats * 0.4);
  const alliedDogs = nDogs + Math.floor(nDogs * 0.4);
  const totalAllies = Math.max(1, alliedCats + alliedDogs);
  const treesDesired = Math.round(spots * (alliedCats / totalAllies));
  for(let i=0;i<spots;i++){
    const type = (i < treesDesired) ? 'tree' : 'rock';
    const r = (type === 'tree') ? 44 : 36;
    hideSpots.push({ x: rand(80,760-80), y: rand(60,420-60), type: type, radius: r });
  }
  for(let i=0;i<nCats;i++) cats.push({ x: rand(60,760-60), y: rand(60,420-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:26, moveSpeed:1.5, attackCooldown:600, speciesDamageMultiplier:1.25, hiddenRegenBonus:1.25, walkRegenPerSec:0, state:null, targetHide:null, fleeSpeed:0, nextRegen:0, lastRegen:0, regenPerSec:0, walkLastRegen:0 });
  for(let j=0;j<nDogs;j++) dogs.push({ x: rand(60,760-60), y: rand(60,420-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:34, moveSpeed:1.45, attackCooldown:700, speciesDamageMultiplier:0.95, hiddenRegenBonus:1.0, walkRegenPerSec: rand(2.5,4.0), state:null, targetHide:null, fleeSpeed:0, nextRegen:0, lastRegen:0, regenPerSec:0, walkLastRegen:0 });
  // add birds and fish scaled to team sizes
  const nBirds = Math.floor(nCats * 0.4);
  for(let b=0;b<nBirds;b++) birds.push({ x: rand(60,760-60), y: rand(60,420-60), hp:60, maxHp:60, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.2, attackCooldown:400, speciesDamageMultiplier:0.9, hiddenRegenBonus:1.1, walkRegenPerSec:0, state:null, targetHide:null, fleeSpeed:0, nextRegen:0, lastRegen:0, regenPerSec:0 });
  const nFish = Math.floor(nDogs * 0.4);
  for(let f=0; f<nFish; f++) fish.push({ x: rand(60,760-60), y: rand(60,420-60), hp:80, maxHp:80, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.2, attackCooldown:600, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec:0, state:null, targetHide:null, fleeSpeed:0, nextRegen:0, lastRegen:0, regenPerSec:0 });
  return {cats,dogs,birds,fish,hideSpots};
}

function updateEntitiesTick(state, tickMs){
  const now = state.now;
  const cats = state.cats; const dogs = state.dogs; const birds = state.birds || []; const fish = state.fish || []; const hideSpots = state.hideSpots;
  // cats
  for(const c of cats){ if(c.hp<=0) continue;
    if(c.buffUntil && now > c.buffUntil){ c.dmgMult = 1; c.buffUntil = 0; }
    if(c._maxHpBuffUntil && now > c._maxHpBuffUntil){
      if(typeof c._maxHpBase === 'number') c.maxHp = c._maxHpBase;
      else if(c._maxHpBuff) c.maxHp = Math.max(1, c.maxHp - (c._maxHpBuff || 0));
      c._maxHpBuff = 0; c._maxHpBuffUntil = 0; delete c._maxHpBase; if(c.hp > c.maxHp) c.hp = c.maxHp;
    }
    // revert temporary speed buff
    if(c._speedBuffUntil && now > c._speedBuffUntil){ if(typeof c._baseMoveSpeed === 'number') c.moveSpeed = c._baseMoveSpeed; c._speedBuffUntil = 0; }
    // berserk periodic HP drain and revert
    if(c._berserkUntil){
      if(now > c._berserkUntil){ c.dmgMult = 1; c._berserkUntil = 0; delete c._berserkHpCostPerSec; delete c._lastBerserkTick; }
      else {
        const last = c._lastBerserkTick || now;
        const elapsed = now - last;
        if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); c.hp = Math.max(0, c.hp - secs * (c._berserkHpCostPerSec || 1)); c._lastBerserkTick = last + secs*1000; }
      }
    }
  if(c.hidden && now > c.hideUntil){ c.hidden = false; c.isRegenerating = false; if(c._savedRadius) { c.radius = c._savedRadius; delete c._savedRadius; } }
    if(c.hidden){
      if(!c.nextRegen) c.nextRegen = now + 300;
      if(!c.lastRegen) c.lastRegen = now;
      if(!c.regenPerSec) c.regenPerSec = rand(6,10) * (c.hiddenRegenBonus || 1.0);
      // tree boosts cat regen: if hiding spot type is tree, double the cat's hidden regen
      if(c.targetHide && c.targetHide.type === 'tree') c.regenPerSec = c.regenPerSec * 2;
      // mark that this hidden entity is actively regenerating
      c.isRegenerating = true;
      if(now >= c.nextRegen){ const dt = now - c.lastRegen; const gained = (c.regenPerSec) * (dt/1000); c.hp = Math.min(c.maxHp, c.hp + gained); c.lastRegen = now; c.nextRegen = now + 300; // if fully healed, stop active regenerating flag
        if(c.hp >= c.maxHp) c.isRegenerating = false; }
    }
    const fleeThreshold = 0.28 * c.maxHp;
    if(!c.hidden && c.hp > 0 && c.hp <= fleeThreshold){ c.state='flee'; c.targetHide = safestHide(c.x,c.y, dogs, hideSpots); c.fleeSpeed = rand(3,4); }
  if(c.state === 'flee' && c.targetHide){ const ang = Math.atan2(c.targetHide.y - c.y, c.targetHide.x - c.x); const ms = (c.moveSpeed || 1.4) * (c.fleeSpeed || 3.5); c.x += Math.cos(ang)*ms; c.y += Math.sin(ang)*ms; if(dist(c.x,c.y,c.targetHide.x,c.targetHide.y) < (c.targetHide.radius || 22)){
      c.hidden = true; c.hideUntil = now + rand(2000,6000); c.state = 'hidden'; c.hideStart = now;
      c.nextRegen = now + 300; c.lastRegen = now; c.regenPerSec = rand(6,10) * (c.hiddenRegenBonus || 1.0);
      // apply tree bonus if hiding in a tree
      if(c.targetHide && c.targetHide.type === 'tree') c.regenPerSec = c.regenPerSec * 2;
      c.isRegenerating = true;
      // enlarge entity radius while hidden so it's more noticeable in sim
      c._savedRadius = c.radius; c.radius = (c.radius || 26) * 1.3;
    } }
    if(!c.hidden && c.hp>0 && c.state !== 'flee'){
        const pools = [...cats, ...dogs, ...birds, ...fish];
        const enemies = pools.filter(e=>e && e.hp>0 && !e.hidden && e !== c);
      if(enemies.length){ let target = enemies[0]; let bd = dist(c.x,c.y,target.x,target.y); for(const e of enemies){ const dd = dist(c.x,c.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
      const ang = Math.atan2(target.y - c.y, target.x - c.x); c.x += Math.cos(ang)*1.4; c.y += Math.sin(ang)*1.4;
      const attackRange = (c.radius || 26) + (target.radius || 32) + 6;
      if(bd < attackRange && now - c.lastAttack > (c.attackCooldown || 700)){
        c.lastAttack = now; const chosen = pickByProb(catAbilities); const beforeHp = target.hp; performAbility(c,target,chosen,now);
        // if target took damage, make it flee and choose a new hide spot away from attackers
        if(target.hp < beforeHp && target.hp > 0){
          const prevHide = target.targetHide;
          if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } }
          if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; }
          const awayFrom = dogs; // cats attacked dogs, so pick far hide from dogs
          const far = pickFarHide(awayFrom, hideSpots, 80, target, now);
          target.targetHide = far || safestHide(target.x,target.y, awayFrom, hideSpots, target, now);
          target.state = 'flee'; target.fleeSpeed = rand(3,4);
          // DEBUG
          // debug log suppressed for batch runs
          // try{ console.log('DEBUG: set to flee:', (target.radius||0) > 30 ? 'dog' : 'cat', 'hp=',target.hp.toFixed?target.hp.toFixed(1):target.hp, 'pos=',Math.round(target.x),Math.round(target.y)); }catch(e){}
        }
      }
      } else {
  // only search for hidden enemies when there are NO hidden enemies currently regenerating
  const anyHiddenDogsAreRegenerating = dogs.some(d=> d.hidden && d.hp>0 && d.isRegenerating);
  if(!anyHiddenDogsAreRegenerating){
          const hiddenSpots = hideSpots.filter(s=> dogs.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y)<30));
          if(hiddenSpots.length){ const s = hiddenSpots[0]; const ang = Math.atan2(s.y - c.y, s.x - c.x); c.x += Math.cos(ang)*1.7; c.y += Math.sin(ang)*1.7; if(dist(c.x,c.y,s.x,s.y) < ((s.radius||22) + (c.radius||26) - 6)){ for(const d of dogs){ if(d.hidden && dist(d.x,d.y,s.x,s.y)<40){ d.hidden=false; d.isRegenerating = false; if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; } d.hp = Math.max(0,d.hp- Math.floor(rand(4,10))); } } } }
        }
      }
    }
  }
  // dogs
  for(const d of dogs){ if(d.hp<=0) continue;
    if(d.buffUntil && now > d.buffUntil){ d.dmgMult = 1; d.buffUntil = 0; }
    if(d._maxHpBuffUntil && now > d._maxHpBuffUntil){
      if(typeof d._maxHpBase === 'number') d.maxHp = d._maxHpBase;
      else if(d._maxHpBuff) d.maxHp = Math.max(1, d.maxHp - (d._maxHpBuff || 0));
      d._maxHpBuff = 0; d._maxHpBuffUntil = 0; delete d._maxHpBase; if(d.hp > d.maxHp) d.hp = d.maxHp;
    }
    // revert temporary speed buff
    if(d._speedBuffUntil && now > d._speedBuffUntil){ if(typeof d._baseMoveSpeed === 'number') d.moveSpeed = d._baseMoveSpeed; d._speedBuffUntil = 0; }
    // berserk periodic HP drain and revert
    if(d._berserkUntil){
      if(now > d._berserkUntil){ d.dmgMult = 1; d._berserkUntil = 0; delete d._berserkHpCostPerSec; delete d._lastBerserkTick; }
      else {
        const last = d._lastBerserkTick || now;
        const elapsed = now - last;
        if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); d.hp = Math.max(0, d.hp - secs * (d._berserkHpCostPerSec || 1)); d._lastBerserkTick = last + secs*1000; }
      }
    }
  if(d.hidden && now > d.hideUntil){ d.hidden = false; d.isRegenerating = false; if(d._savedRadius) { d.radius = d._savedRadius; delete d._savedRadius; } }
    if(d.hidden){
      if(!d.nextRegen) d.nextRegen = now + 300;
      if(!d.lastRegen) d.lastRegen = now;
      if(!d.regenPerSec) d.regenPerSec = rand(5,9) * (d.hiddenRegenBonus || 1.0);
      // rock boosts dog regen: double when hiding in a rock
      if(d.targetHide && d.targetHide.type === 'rock') d.regenPerSec = d.regenPerSec * 2;
      d.isRegenerating = true;
      if(now >= d.nextRegen){ const dt = now - d.lastRegen; const gained = (d.regenPerSec) * (dt/1000); d.hp = Math.min(d.maxHp, d.hp + gained); d.lastRegen = now; d.nextRegen = now + 300; if(d.hp >= d.maxHp) d.isRegenerating = false; }
    }
    const fleeThreshold = 0.28 * d.maxHp;
  if(!d.hidden && d.hp > 0 && d.hp <= fleeThreshold){ d.state='flee'; d.targetHide = safestHide(d.x,d.y, cats, hideSpots); d.fleeSpeed = rand(3,4); }
  // if fleeing, move toward hide (dogs)
  if(d.state === 'flee' && d.targetHide){ const angF = Math.atan2(d.targetHide.y - d.y, d.targetHide.x - d.x); const msBase = (d.moveSpeed || 1.4) * (d.fleeSpeed || 3.5); const ms = msBase * (d.onBreak ? 2 : 1); d.x += Math.cos(angF)*ms; d.y += Math.sin(angF)*ms; if(dist(d.x,d.y,d.targetHide.x,d.targetHide.y) < (d.targetHide.radius || 22)){
      d.hidden = true; d.hideUntil = now + rand(2000,6000); d.state = 'hidden'; d.hideStart = now;
      d.nextRegen = now + 300; d.lastRegen = now; d.regenPerSec = rand(5,9) * (d.hiddenRegenBonus || 1.0);
      if(d.targetHide && d.targetHide.type === 'rock') d.regenPerSec = d.regenPerSec * 2;
      d.isRegenerating = true;
      d._savedRadius = d.radius; d.radius = (d.radius || 34) * 1.3;
    } }
    if(!d.hidden && (d.walkRegenPerSec || 0) > 0){ if(!d.walkLastRegen) d.walkLastRegen = now; const dtw = now - d.walkLastRegen; if(dtw > 250){ const gained = (d.walkRegenPerSec) * (dtw/1000); d.hp = Math.min(d.maxHp, d.hp + gained); d.walkLastRegen = now; } }
    if(!d.hidden && d.hp>0 && d.state !== 'flee'){
      const enemies = cats.filter(c=>c.hp>0 && !c.hidden);
      d.onBreak = (enemies.length === 0);
      if(enemies.length){ let target = enemies[0]; let bd = dist(d.x,d.y,target.x,target.y); for(const e of enemies){ const dd = dist(d.x,d.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
        const ang = Math.atan2(target.y - d.y, target.x - d.x);
        const moveMul = d.onBreak ? 2 : 1;
        d.x += Math.cos(ang)*1.5 * (d.moveSpeed || 1.5) * moveMul; d.y += Math.sin(ang)*1.5 * (d.moveSpeed || 1.5) * moveMul;
        const dogAttackRange = (d.radius || 34) + (target.radius || 26) + 6;
  if(bd < dogAttackRange && now - d.lastAttack > (d.attackCooldown || 800)){
    d.lastAttack = now; const chosen = pickByProb(dogAbilities); const beforeHp = target.hp; performAbility(d,target,chosen,now);
    if(target.hp < beforeHp && target.hp > 0){
      const prevHide = target.targetHide;
      if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } }
      if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; }
      const awayFrom = cats; // dogs attacked cat target, pick hide away from cats
      const far = pickFarHide(awayFrom, hideSpots, 80, target, now);
      target.targetHide = far || safestHide(target.x, target.y, awayFrom, hideSpots, target, now);
      target.state = 'flee'; target.fleeSpeed = rand(3,4);
      // DEBUG
      try{ console.log('DEBUG: set to flee:', (target.radius||0) > 30 ? 'dog' : 'cat', 'hp=',target.hp.toFixed?target.hp.toFixed(1):target.hp, 'pos=',Math.round(target.x),Math.round(target.y)); }catch(e){}
    }
  }
      } else {
  const anyHiddenCatsAreRegenerating = cats.some(c=> c.hidden && c.hp>0 && c.isRegenerating);
  if(!anyHiddenCatsAreRegenerating){
          const hiddenSpots = hideSpots.filter(s=> cats.some(c=> c.hidden && dist(c.x,c.y,s.x,s.y)<30));
          if(hiddenSpots.length){ const s = hiddenSpots[0]; const ang = Math.atan2(s.y - d.y, s.x - d.x); d.x += Math.cos(ang)*1.6; d.y += Math.sin(ang)*1.6; if(dist(d.x,d.y,s.x,s.y) < ((s.radius||22) + (d.radius||34) - 6)){ for(const c of cats){ if(c.hidden && dist(c.x,c.y,s.x,s.y)<40){ c.hidden=false; c.isRegenerating = false; if(c._savedRadius){ c.radius = c._savedRadius; delete c._savedRadius; } c.hp = Math.max(0,c.hp - Math.floor(rand(4,10))); } } } }
        }
      }
    }
  }
  // remove dead cleaned not necessary here

    // birds (active simple AI)
    for(const b of birds){ if(b.hp<=0) continue;
      if(b.buffUntil && now > b.buffUntil){ b.dmgMult = 1; b.buffUntil = 0; }
      if(b._maxHpBuffUntil && now > b._maxHpBuffUntil){ if(typeof b._maxHpBase === 'number') b.maxHp = b._maxHpBase; else if(b._maxHpBuff) b.maxHp = Math.max(1, b.maxHp - (b._maxHpBuff || 0)); b._maxHpBuff = 0; b._maxHpBuffUntil = 0; delete b._maxHpBase; if(b.hp > b.maxHp) b.hp = b.maxHp; }
      if(b._speedBuffUntil && now > b._speedBuffUntil){ if(typeof b._baseMoveSpeed === 'number') b.moveSpeed = b._baseMoveSpeed; b._speedBuffUntil = 0; }
      if(b._berserkUntil){ if(now > b._berserkUntil){ b.dmgMult = 1; b._berserkUntil = 0; delete b._berserkHpCostPerSec; delete b._lastBerserkTick; } else { const last = b._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); b.hp = Math.max(0, b.hp - secs * (b._berserkHpCostPerSec || 1)); b._lastBerserkTick = last + secs*1000; } } }
      // hiding/regeneration for birds (similar to cats but scaled)
      if(b.hidden && now > b.hideUntil){ b.hidden = false; b.isRegenerating = false; if(b._savedRadius){ b.radius = b._savedRadius; delete b._savedRadius; } }
      if(b.hidden){ if(!b.nextRegen) b.nextRegen = now + 300; if(!b.lastRegen) b.lastRegen = now; if(!b.regenPerSec) b.regenPerSec = rand(4,8) * (b.hiddenRegenBonus || 1.0); if(b.targetHide && b.targetHide.type === 'tree') b.regenPerSec = b.regenPerSec * 1.5; b.isRegenerating = true; if(now >= b.nextRegen){ const dt = now - b.lastRegen; const gained = (b.regenPerSec) * (dt/1000); b.hp = Math.min(b.maxHp, b.hp + gained); b.lastRegen = now; b.nextRegen = now + 300; if(b.hp >= b.maxHp) b.isRegenerating = false; } }
      const fleeThresholdB = 0.28 * b.maxHp;
      if(!b.hidden && b.hp > 0 && b.hp <= fleeThresholdB){ b.state='flee'; b.targetHide = safestHide(b.x,b.y, [...cats,...dogs,...fish], hideSpots); b.fleeSpeed = rand(3,5); }
      if(b.state === 'flee' && b.targetHide){ const ang = Math.atan2(b.targetHide.y - b.y, b.targetHide.x - b.x); const ms = (b.moveSpeed || 2.2) * (b.fleeSpeed || 3.5); b.x += Math.cos(ang)*ms; b.y += Math.sin(ang)*ms; if(dist(b.x,b.y,b.targetHide.x,b.targetHide.y) < (b.targetHide.radius || 20)){ b.hidden = true; b.hideUntil = now + rand(1500,4000); b.state = 'hidden'; b.hideStart = now; b.nextRegen = now + 300; b.lastRegen = now; b.regenPerSec = rand(4,8) * (b.hiddenRegenBonus || 1.0); if(b.targetHide && b.targetHide.type === 'tree') b.regenPerSec = b.regenPerSec * 1.5; b.isRegenerating = true; b._savedRadius = b.radius; b.radius = (b.radius || 20) * 1.2; } }
      if(!b.hidden && b.hp>0 && b.state !== 'flee'){
        const enemies = [...cats, ...dogs, ...fish].filter(e=>e.hp>0 && !e.hidden);
        if(enemies.length){ let target = enemies[0]; let bd = dist(b.x,b.y,target.x,target.y); for(const e of enemies){ const dd = dist(b.x,b.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
          const ang = Math.atan2(target.y - b.y, target.x - b.x); b.x += Math.cos(ang)*(b.moveSpeed || 2.2); b.y += Math.sin(ang)*(b.moveSpeed || 2.2);
          const attackRange = (b.radius || 20) + (target.radius || 28) + 6;
          if(bd < attackRange && now - b.lastAttack > (b.attackCooldown || 500)){
            b.lastAttack = now; const chosen = pickByProb(birdAbilities); const beforeHp = target.hp; performAbility(b,target,chosen,now);
            if(target.hp < beforeHp && target.hp > 0){ const prevHide = target.targetHide; if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } } if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; } const away = [...cats,...dogs]; const far = pickFarHide(away, hideSpots, 80, target, now); target.targetHide = far || safestHide(target.x,target.y, away, hideSpots, target, now); target.state = 'flee'; target.fleeSpeed = rand(3,4); }
          }
        }
      }
    }

    // fish (active simple AI)
    for(const f of fish){ if(f.hp<=0) continue;
      if(f.buffUntil && now > f.buffUntil){ f.dmgMult = 1; f.buffUntil = 0; }
      if(f._maxHpBuffUntil && now > f._maxHpBuffUntil){ if(typeof f._maxHpBase === 'number') f.maxHp = f._maxHpBase; else if(f._maxHpBuff) f.maxHp = Math.max(1, f.maxHp - (f._maxHpBuff || 0)); f._maxHpBuff = 0; f._maxHpBuffUntil = 0; delete f._maxHpBase; if(f.hp > f.maxHp) f.hp = f.maxHp; }
      if(f._speedBuffUntil && now > f._speedBuffUntil){ if(typeof f._baseMoveSpeed === 'number') f.moveSpeed = f._baseMoveSpeed; f._speedBuffUntil = 0; }
      if(f._berserkUntil){ if(now > f._berserkUntil){ f.dmgMult = 1; f._berserkUntil = 0; delete f._berserkHpCostPerSec; delete f._lastBerserkTick; } else { const last = f._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); f.hp = Math.max(0, f.hp - secs * (f._berserkHpCostPerSec || 1)); f._lastBerserkTick = last + secs*1000; } } }
      if(f.hidden && now > f.hideUntil){ f.hidden = false; f.isRegenerating = false; if(f._savedRadius){ f.radius = f._savedRadius; delete f._savedRadius; } }
      if(f.hidden){ if(!f.nextRegen) f.nextRegen = now + 300; if(!f.lastRegen) f.lastRegen = now; if(!f.regenPerSec) f.regenPerSec = rand(3,7) * (f.hiddenRegenBonus || 1.0); if(f.targetHide && f.targetHide.type === 'rock') f.regenPerSec = f.regenPerSec * 2; f.isRegenerating = true; if(now >= f.nextRegen){ const dt = now - f.lastRegen; const gained = (f.regenPerSec) * (dt/1000); f.hp = Math.min(f.maxHp, f.hp + gained); f.lastRegen = now; f.nextRegen = now + 300; if(f.hp >= f.maxHp) f.isRegenerating = false; } }
      const fleeThresholdF = 0.28 * f.maxHp;
      if(!f.hidden && f.hp > 0 && f.hp <= fleeThresholdF){ f.state='flee'; f.targetHide = safestHide(f.x,f.y, [...cats,...dogs,...birds], hideSpots); f.fleeSpeed = rand(3,4); }
      if(f.state === 'flee' && f.targetHide){ const ang = Math.atan2(f.targetHide.y - f.y, f.targetHide.x - f.x); const ms = (f.moveSpeed || 1.2) * (f.fleeSpeed || 3.5); f.x += Math.cos(ang)*ms; f.y += Math.sin(ang)*ms; if(dist(f.x,f.y,f.targetHide.x,f.targetHide.y) < (f.targetHide.radius || 22)){ f.hidden = true; f.hideUntil = now + rand(2000,6000); f.state = 'hidden'; f.hideStart = now; f.nextRegen = now + 300; f.lastRegen = now; f.regenPerSec = rand(3,7) * (f.hiddenRegenBonus || 1.0); if(f.targetHide && f.targetHide.type === 'rock') f.regenPerSec = f.regenPerSec * 2; f.isRegenerating = true; f._savedRadius = f.radius; f.radius = (f.radius || 22) * 1.2; } }
      if(!f.hidden && f.hp>0 && f.state !== 'flee'){
        const enemies = [...cats, ...dogs, ...birds].filter(e=>e.hp>0 && !e.hidden);
        if(enemies.length){ let target = enemies[0]; let bd = dist(f.x,f.y,target.x,target.y); for(const e of enemies){ const dd = dist(f.x,f.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
          const ang = Math.atan2(target.y - f.y, target.x - f.x); f.x += Math.cos(ang)*(f.moveSpeed || 1.2); f.y += Math.sin(ang)*(f.moveSpeed || 1.2);
          const attackRange = (f.radius || 22) + (target.radius || 28) + 6;
          if(bd < attackRange && now - f.lastAttack > (f.attackCooldown || 600)){
            f.lastAttack = now; const chosen = pickByProb(fishAbilities); const beforeHp = target.hp; performAbility(f,target,chosen,now);
            if(target.hp < beforeHp && target.hp > 0){ const prevHide = target.targetHide; if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } } if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; } const away = [...cats,...dogs]; const far = pickFarHide(away, hideSpots, 80, target, now); target.targetHide = far || safestHide(target.x,target.y, away, hideSpots, target, now); target.state = 'flee'; target.fleeSpeed = rand(3,4); }
          }
        }
      }
    }

  }
  function runOne(nCats,nDogs){ const {cats,dogs,birds,fish,hideSpots} = initMatch(nCats,nDogs); const state = { cats, dogs, birds, fish, hideSpots, now:0 };
  const tickMs = 200; const MAX_TICKS = 12000; let ticks = 0;
  while(true){ if(ticks++ > MAX_TICKS) break; state.now += tickMs; updateEntitiesTick(state, tickMs);
     const ac = cats.filter(x=>x.hp>0).length; const ad = dogs.filter(x=>x.hp>0).length; const ab = birds.filter(x=>x.hp>0).length; const af = fish.filter(x=>x.hp>0).length;
     const living = [ac>0, ad>0, ab>0, af>0].filter(Boolean).length;
     if(living <= 1) break;
  }
  const ac = cats.filter(x=>x.hp>0).length; const ad = dogs.filter(x=>x.hp>0).length; return {ac,ad,ticks}; }

async function runBatch(){ console.log(`Running ${RUNS} sims: ${N_CATS} cats vs ${N_DOGS} dogs...`);
  let catsWins=0, dogsWins=0, draws=0, totalTicks=0;
  for(let i=0;i<RUNS;i++){ const r = runOne(N_CATS,N_DOGS); totalTicks += r.ticks; if(r.ac>0 && r.ad===0) catsWins++; else if(r.ad>0 && r.ac===0) dogsWins++; else draws++; if((i+1) % 10 === 0) process.stdout.write(`.${i+1}`); }
  console.log('\nDone.');
  console.log(`Results: Runs=${RUNS} | Cats=${catsWins} | Dogs=${dogsWins} | Draws=${draws} | Avg ticks=${Math.round(totalTicks / RUNS)}`);
}

runBatch();
