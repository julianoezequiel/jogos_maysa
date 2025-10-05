// Grid search for damage multipliers (Cat vs Dog)
// Usage: node grid_search.js [nCats] [nDogs] [runsPerCombo]
// Grid search for damage multipliers (Cat vs Dog)
// Usage: node grid_search.js [nCats] [nDogs] [runsPerCombo]
const args = process.argv.slice(2);
const N_CATS = parseInt(args[0]) || 6;
const N_DOGS = parseInt(args[1]) || 10;
const RUNS_PER = parseInt(args[2]) || 50;

function rand(a,b){ return Math.random() * (b - a) + a; }
function irand(a,b){ return Math.floor(rand(a,b)); }
function dist(a,b,c,d){ const dx = a-c, dy = b-d; return Math.sqrt(dx*dx+dy*dy); }

// Abilities
const catAbilities = [
  {name:'Scratch', type:'damage', min:8, max:14, prob:0.6},
  {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
  {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
  {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:8000, prob:0.05}
];
const dogAbilities = [
  {name:'Bite', type:'damage', min:9, max:15, prob:0.6},
  {name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
  {name:'Tough Hide', type:'buffMaxHp', amount:20, duration:8000, prob:0.06}
];

const birdAbilities = [
  {name:'Peck', type:'damage', min:6, max:12, prob:0.6},
  {name:'Feather Mend', type:'heal', min:4, max:8, prob:0.15},
  {name:'Wing Gust', type:'buffSpeed', amount:0.5, duration:2500, prob:0.15},
  {name:'Flock Cry', type:'buffDamage', amount:0.3, duration:3500, prob:0.1}
];

const fishAbilities = [
  {name:'Bite', type:'damage', min:7, max:11, prob:0.6},
  {name:'Slime Heal', type:'heal', min:3, max:6, prob:0.15},
  {name:'Slippery', type:'buffSpeed', amount:0.35, duration:2000, prob:0.1},
  {name:'Water Surge', type:'buffMaxHp', amount:12, duration:7000, prob:0.15}
];

function pickByProb(pool){
  const r = Math.random();
  let acc = 0;
  for(const a of pool){ acc += a.prob; if(r <= acc) return a; }
  return pool[pool.length-1];
}

function performAbility(user, target, chosen, now){
  if(chosen.type === 'damage'){
    const base = Math.floor(rand(chosen.min, chosen.max+1));
    const dmg = Math.floor(base * ((user.speciesDamageMultiplier||1) * (user.dmgMult||1)));
    target.hp = Math.max(0, target.hp - dmg);
    if(target.hidden) target.hidden = false;
  } else if(chosen.type === 'heal'){
    const val = Math.floor(rand(chosen.min, chosen.max+1));
    user.hp = Math.min(user.maxHp, user.hp + val);
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + chosen.amount;
    user.buffUntil = now + chosen.duration;
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

function safestHide(x,y,enemies, hideSpots){
  if(!hideSpots || hideSpots.length === 0) return null;
  const validEnemies = enemies.filter(e=>e.hp>0);
  if(validEnemies.length === 0){
    let best = null; let bd = 1e9;
    for(const s of hideSpots){ const d = dist(x,y,s.x,s.y); if(d<bd){ bd=d; best=s; } }
    return best;
  }
  let best=null; let bestScore=-1e9;
  for(const s of hideSpots){
    let minDE = 1e9;
    for(const e of validEnemies){ const de = dist(s.x,s.y,e.x,e.y); if(de<minDE) minDE = de; }
    const distToSelf = dist(x,y,s.x,s.y);
    const score = minDE - 0.35 * distToSelf;
    if(score > bestScore){ bestScore = score; best = s; }
  }
  return best;
}

function initMatch(nCats,nDogs, catMult, dogMult){
  const cats=[]; const dogs=[]; const birds=[]; const fish=[]; const hideSpots=[];
  const spots = 4 + Math.floor(rand(0,3));
  for(let i=0;i<spots;i++) hideSpots.push({ x: rand(80,760-80), y: rand(60,420-60) });

  for(let i=0;i<nCats;i++){
    cats.push({
      x: rand(60,760/2-30), y: rand(60,420-60), hp:100, maxHp:100,
      dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0,
      radius:32, moveSpeed:1.5, attackCooldown:600,
      speciesDamageMultiplier:catMult, hiddenRegenBonus:1.25,
      walkRegenPerSec:0, state:null, targetHide:null, fleeSpeed:0,
      nextRegen:0, lastRegen:0, regenPerSec:0, walkLastRegen:0
    });
  }

  for(let j=0;j<nDogs;j++){
    dogs.push({
      x: rand(760/2+30,760-60), y: rand(60,420-60), hp:100, maxHp:100,
      dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0,
      radius:38, moveSpeed:1.45, attackCooldown:700,
      speciesDamageMultiplier:dogMult, hiddenRegenBonus:1.0,
      walkRegenPerSec: rand(2.5,4.0), state:null, targetHide:null, fleeSpeed:0,
      nextRegen:0, lastRegen:0, regenPerSec:0, walkLastRegen:0
    });
  }
  // spawn birds and fish scaled to team sizes
  const nBirds = Math.floor(nCats * 0.4);
  for(let b=0;b<nBirds;b++) cats.push({}); // keep arrays length in sim but birds handled externally
  const nFish = Math.floor(nDogs * 0.4);
  for(let f=0; f<nFish; f++) dogs.push({});
  return {cats,dogs,hideSpots};
}

function updateEntitiesTick(state){
  const now = state.now;
  const cats = state.cats; const dogs = state.dogs; const hideSpots = state.hideSpots;

  for(const c of cats){
    if(c.hp<=0) continue;
    if(c.buffUntil && now > c.buffUntil){ c.dmgMult = 1; c.buffUntil = 0; }
    if(c._maxHpBuffUntil && now > c._maxHpBuffUntil){ if(typeof c._maxHpBase === 'number') c.maxHp = c._maxHpBase; else if(c._maxHpBuff) c.maxHp = Math.max(1, c.maxHp - (c._maxHpBuff || 0)); c._maxHpBuff = 0; c._maxHpBuffUntil = 0; delete c._maxHpBase; if(c.hp > c.maxHp) c.hp = c.maxHp; }
    if(c.hidden && now > c.hideUntil){ c.hidden = false; }

    if(c.hidden){
      if(!c.nextRegen) c.nextRegen = now + 300;
      if(!c.lastRegen) c.lastRegen = now;
      if(!c.regenPerSec) c.regenPerSec = rand(6,10) * (c.hiddenRegenBonus || 1.0);
      if(now >= c.nextRegen){
        const dt = now - c.lastRegen;
        const gained = (c.regenPerSec) * (dt/1000);
        c.hp = Math.min(c.maxHp, c.hp + gained);
        c.lastRegen = now;
        c.nextRegen = now + 300;
      }
    }

    const fleeThreshold = 0.28 * c.maxHp;
    if(!c.hidden && c.hp > 0 && c.hp <= fleeThreshold){
      c.state='flee';
      c.targetHide = safestHide(c.x,c.y, dogs, hideSpots);
      c.fleeSpeed = rand(3,4);
    }

    if(c.state === 'flee' && c.targetHide){
      const ang = Math.atan2(c.targetHide.y - c.y, c.targetHide.x - c.x);
      const ms = (c.moveSpeed || 1.4) * (c.fleeSpeed || 3.5);
      c.x += Math.cos(ang)*ms; c.y += Math.sin(ang)*ms;
      if(dist(c.x,c.y,c.targetHide.x,c.targetHide.y) < 22){
        c.hidden = true; c.hideUntil = now + rand(2000,6000); c.state = 'hidden';
        c.hideStart = now; c.nextRegen = now + 300; c.lastRegen = now;
        c.regenPerSec = rand(6,10) * (c.hiddenRegenBonus || 1.0);
      }
    }

    if(!c.hidden && c.hp>0 && c.state !== 'flee'){
      const enemies = dogs.filter(d=>d.hp>0 && !d.hidden);
      if(enemies.length){
        let target = enemies[0];
        let bd = dist(c.x,c.y,target.x,target.y);
        for(const e of enemies){ const dd = dist(c.x,c.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
        const ang = Math.atan2(target.y - c.y, target.x - c.x);
        c.x += Math.cos(ang)*1.4; c.y += Math.sin(ang)*1.4;
        if(bd < 70 && now - c.lastAttack > (c.attackCooldown || 700)){
          c.lastAttack = now; const chosen = pickByProb(catAbilities); performAbility(c,target,chosen,now);
        }
      } else {
        const hiddenSpots = hideSpots.filter(s=> dogs.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y)<30));
        if(hiddenSpots.length){
          const s = hiddenSpots[0];
          const ang = Math.atan2(s.y - c.y, s.x - c.x);
          c.x += Math.cos(ang)*1.7; c.y += Math.sin(ang)*1.7;
          if(dist(c.x,c.y,s.x,s.y)<26){
            for(const d of dogs){ if(d.hidden && dist(d.x,d.y,s.x,s.y)<40){ d.hidden=false; d.hp = Math.max(0,d.hp- Math.floor(rand(4,10))); } }
          }
        }
      }
    }
  }

  for(const d of dogs){
    if(d.hp<=0) continue;
    if(d.buffUntil && now > d.buffUntil){ d.dmgMult = 1; d.buffUntil = 0; }
    if(d._maxHpBuffUntil && now > d._maxHpBuffUntil){ if(typeof d._maxHpBase === 'number') d.maxHp = d._maxHpBase; else if(d._maxHpBuff) d.maxHp = Math.max(1, d.maxHp - (d._maxHpBuff || 0)); d._maxHpBuff = 0; d._maxHpBuffUntil = 0; delete d._maxHpBase; if(d.hp > d.maxHp) d.hp = d.maxHp; }
    if(d.hidden && now > d.hideUntil){ d.hidden = false; }

    if(d.hidden){
      if(!d.nextRegen) d.nextRegen = now + 300;
      if(!d.lastRegen) d.lastRegen = now;
      if(!d.regenPerSec) d.regenPerSec = rand(5,9) * (d.hiddenRegenBonus || 1.0);
      if(now >= d.nextRegen){
        const dt = now - d.lastRegen;
        const gained = (d.regenPerSec) * (dt/1000);
        d.hp = Math.min(d.maxHp, d.hp + gained);
        d.lastRegen = now; d.nextRegen = now + 300;
      }
    }

    const fleeThreshold = 0.28 * d.maxHp;
    if(!d.hidden && d.hp > 0 && d.hp <= fleeThreshold){
      d.state='flee'; d.targetHide = safestHide(d.x,d.y, cats, hideSpots); d.fleeSpeed = rand(3,4);
    }

    if(!d.hidden && (d.walkRegenPerSec || 0) > 0){
      if(!d.walkLastRegen) d.walkLastRegen = now;
      const dtw = now - d.walkLastRegen;
      if(dtw > 250){ const gained = (d.walkRegenPerSec) * (dtw/1000); d.hp = Math.min(d.maxHp, d.hp + gained); d.walkLastRegen = now; }
    }

    if(!d.hidden && d.hp>0 && d.state !== 'flee'){
      const enemies = cats.filter(c=>c.hp>0 && !c.hidden);
      if(enemies.length){
        let target = enemies[0];
        let bd = dist(d.x,d.y,target.x,target.y);
        for(const e of enemies){ const dd = dist(d.x,d.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
        const ang = Math.atan2(target.y - d.y, target.x - d.x);
        d.x += Math.cos(ang)*1.5 * (d.moveSpeed || 1.5);
        d.y += Math.sin(ang)*1.5 * (d.moveSpeed || 1.5);
        if(bd < 70 && now - d.lastAttack > (d.attackCooldown || 800)){
          d.lastAttack = now; const chosen = pickByProb(dogAbilities); performAbility(d,target,chosen,now);
        }
      } else {
        const hiddenSpots = hideSpots.filter(s=> cats.some(c=> c.hidden && dist(c.x,c.y,s.x,s.y)<30));
        if(hiddenSpots.length){
          const s = hiddenSpots[0];
          const ang = Math.atan2(s.y - d.y, s.x - d.x);
          d.x += Math.cos(ang)*1.6; d.y += Math.sin(ang)*1.6;
          if(dist(d.x,d.y,s.x,s.y)<26){
            for(const c of cats){ if(c.hidden && dist(c.x,c.y,s.x,s.y)<40){ c.hidden=false; c.hp = Math.max(0,c.hp - Math.floor(rand(4,10))); } }
          }
        }
      }
    }
  }
}

function runOneSimple(nCats,nDogs,catMult,dogMult){
  const m = initMatch(nCats,nDogs,catMult,dogMult);
  const cats = m.cats; const dogs = m.dogs; const hideSpots = m.hideSpots;
  const state = {cats,dogs,hideSpots,now:0};
  const tickMs = 200; const MAX_TICKS = 12000; let ticks=0;
  while(true){
    if(ticks++ > MAX_TICKS) break;
    state.now += tickMs;
    updateEntitiesTick(state);
    const ac = cats.filter(x=>x.hp>0).length;
    const ad = dogs.filter(x=>x.hp>0).length;
    if(ac===0 || ad===0) break;
  }
  const ac = cats.filter(x=>x.hp>0).length;
  const ad = dogs.filter(x=>x.hp>0).length;
  return {ac,ad,ticks};
}

function runGrid(){
  function linspace(a,b,n){ const out=[]; if(n<=1){ out.push(a); return out; } const step = (b-a)/(n-1); for(let i=0;i<n;i++) out.push(+(a + step*i).toFixed(4)); return out; }
  // broader search: test dog multipliers 0.90..1.30 and cat multipliers 0.90..1.30 in 9 steps
  const dogVals = linspace(0.90, 1.30, 9);
  const catVals = linspace(0.90, 1.30, 9);
  const results = [];

  console.log(`Grid search: Cats=${N_CATS}, Dogs=${N_DOGS}, runsPerCombo=${RUNS_PER}`);

  for(const dv of dogVals){
    for(const cv of catVals){
      let catsW = 0, dogsW = 0, draws = 0, totalTicks = 0;
      for(let r = 0; r < RUNS_PER; r++){
        const res = runOneSimple(N_CATS, N_DOGS, cv, dv);
        totalTicks += res.ticks;
        if(res.ac > 0 && res.ad === 0) catsW++;
        else if(res.ad > 0 && res.ac === 0) dogsW++;
        else draws++;
      }
      const winRateDogs = dogsW / RUNS_PER;
      const winRateCats = catsW / RUNS_PER;
      results.push({ dogMult: dv, catMult: cv, dogsW, catsW, draws, avgTicks: Math.round(totalTicks / RUNS_PER), winRateDogs, winRateCats });
      process.stdout.write('.');
    }
  }

  console.log('\nDone grid.');

  results.sort((a,b) => Math.abs(a.winRateDogs - 0.5) - Math.abs(b.winRateDogs - 0.5));

  console.log('Top 8 candidates (closest to 50% dog win rate):');
  console.log('dogMult, catMult, dogWins, catWins, draws, winRateDogs, avgTicks');
  for(let i = 0; i < Math.min(8, results.length); i++){
    const r = results[i];
    console.log(`${r.dogMult}, ${r.catMult}, ${r.dogsW}, ${r.catsW}, ${r.draws}, ${r.winRateDogs.toFixed(2)}, ${r.avgTicks}`);
  }
}

runGrid();
