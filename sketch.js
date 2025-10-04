// simple p5 game: Cat vs Dog
let catImg, dogImg;
let running = false;
let gameOver = false;
let particles = [];
let cats = [];
let dogs = [];
let hideSpots = [];

const catAbilities = [
  {name:'Scratch', type:'damage', min:8, max:14, prob:0.6},
  {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
  {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
  {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:0, prob:0.05}
];
const dogAbilities = [
  {name:'Bite', type:'damage', min:9, max:15, prob:0.6},
  {name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
  {name:'Tough Hide', type:'buffMaxHp', amount:20, duration:0, prob:0.06}
];

function preload(){ catImg = loadImage('assets/cat.svg'); dogImg = loadImage('assets/dog.svg'); }
function setup(){ const c = createCanvas(760,420); c.parent('canvas-container'); imageMode(CENTER); textFont('Arial');
  document.getElementById('startBtn').addEventListener('click', ()=>{ if(!running){ startGame(); } });
  document.getElementById('restartBtn').addEventListener('click', ()=>{ location.reload(); });
  // simulation UI wiring
  const simBtn = document.getElementById('simulateBtn');
  if(simBtn){ simBtn.addEventListener('click', ()=>{
    const runs = Math.max(1, parseInt(document.getElementById('simRuns').value||50));
    document.getElementById('simResults').textContent = 'Rodando simulações...';
    // run sims asynchronously to avoid blocking UI for large runs
    setTimeout(()=>{ runSimulations(runs); }, 50);
  }); }
}

// Headless simulation runner: runs N matches (no rendering) and reports stats
function runSimulations(runs){ const results = { cats:0, dogs:0, draws:0, totalTurns:0 };
  const origWidth = width, origHeight = height;
  for(let i=0;i<runs;i++){
    // quick randomized small variation: use current # inputs for starting counts
    const nCats = Math.max(1, parseInt(document.getElementById('numCats').value||1));
    const nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||1));
    // seed a match
    initMatchStateForSim(nCats, nDogs);
    let turns = 0; const MAX_TURNS = 12000; // ~12000 frames ~= long match cap
    while(!isMatchOver() && turns++ < MAX_TURNS){ updateEntitiesSim(); }
    const ac = cats.filter(x=>x.hp>0).length; const ad = dogs.filter(x=>x.hp>0).length;
    if(ac > 0 && ad === 0) results.cats++; else if(ad > 0 && ac === 0) results.dogs++; else results.draws++;
    results.totalTurns += turns;
  }
  const out = `Simulações: ${runs} | Gatos: ${results.cats} | Cachorros: ${results.dogs} | Empates: ${results.draws} | Turnos médios: ${Math.round(results.totalTurns / runs)}`;
  document.getElementById('simResults').textContent = out;
  // restore any visual state
  startGame();
}

// initialize arrays for simulation (no DOM, no rendering). Reuse same entity structures.
function initMatchStateForSim(nCats,nDogs){ cats = []; dogs = []; hideSpots = []; const spots = 4 + floor(random(0,3)); for(let i=0;i<spots;i++){ hideSpots.push({ x: random(80, width-80), y: random(60, height-60) }); }
  for(let i=0;i<nCats;i++){ cats.push({ x: random(60, width/2-30), y: random(60, height-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:32, moveSpeed: 1.5, attackCooldown: 600, speciesDamageMultiplier: 0.78, hiddenRegenBonus: 1.25, walkRegenPerSec: 0 }); }
  for(let j=0;j<nDogs;j++){ dogs.push({ x: random(width/2+30, width-60), y: random(60, height-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:38, moveSpeed: 1.45, attackCooldown: 700, speciesDamageMultiplier: 1.45, hiddenRegenBonus: 1.0, walkRegenPerSec: random(2.5,4.0) }); }
}

function isMatchOver(){ const aliveCats = cats.filter(x=>x.hp>0).length; const aliveDogs = dogs.filter(x=>x.hp>0).length; return (aliveCats === 0 || aliveDogs === 0); }

// fast, simplified update loop for simulation: reuse update logic but avoid heavy drawing/particle ops
function updateEntitiesSim(){ // reuse updateEntities() internals but avoid creating particles or DOM reads
  // for simplicity call updateEntities which is already mostly logic; it will run quickly without drawing
  updateEntities();
}

function startGame(){
  // read config
  let nCats = Math.max(1, parseInt(document.getElementById('numCats').value||1));
  let nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||1));
  // enforce global cap
  const MAX_ENTITIES = 1000;
  nCats = Math.min(nCats, MAX_ENTITIES);
  nDogs = Math.min(nDogs, MAX_ENTITIES);
  cats = []; dogs = []; hideSpots = [];
  // create hide spots (4-6)
  const spots = 4 + floor(random(0,3));
  for(let i=0;i<spots;i++){ hideSpots.push({ x: random(80, width-80), y: random(60, height-60) }); }
  // spawn cats and dogs spread across the arena
  for(let i=0;i<nCats;i++){
    cats.push({ x: random(60, width/2-30), y: random(60, height-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:32,
      // cat traits (tweaked): still quick but slightly nerfed in damage and hidden regen
      moveSpeed: 1.5, attackCooldown: 600, speciesDamageMultiplier: 0.78, hiddenRegenBonus: 1.25, walkRegenPerSec: 0
    });
  }
  for(let j=0;j<nDogs;j++){
    dogs.push({ x: random(width/2+30, width-60), y: random(60, height-60), hp:100, maxHp:100, dmgMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:38,
      // dog traits (tweaked): stronger and a bit faster, better walk regen and slightly quicker attacks
      moveSpeed: 1.45, attackCooldown: 700, speciesDamageMultiplier: 1.45, hiddenRegenBonus: 1.0, walkRegenPerSec: random(2.5,4.0)
    });
  }
  running = true; gameOver = false; document.getElementById('message').textContent='Boa sorte!';
}

function draw(){ background(255);
  // arena
  fill(240); rect(0,0,width,height);
  // update
  if(running && !gameOver){
    updateEntities();
    checkMatchEnd();
  }
  // draw hide spots
  for(const s of hideSpots){ push(); noStroke(); fill(200,180,140,180); ellipse(s.x,s.y,38,28); pop(); }
  // draw cats
  for(const c of cats){ push(); translate(c.x,c.y); drawCatSprite(0,0,64,c); if(c.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,72,72); } pop(); drawHpBar(c.x, c.y - 44, 48, c.hp, c.maxHp); }
  // draw dogs
  for(const d of dogs){ push(); translate(d.x,d.y); drawDogSprite(0,0,76,d); if(d.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,80,80); } pop(); drawHpBar(d.x, d.y - 52, 56, d.hp, d.maxHp); }
  // HUD
  // HUD bars
  drawHud();
  // remove dead entities from arrays (so they disappear)
  const beforeCats = cats.length; cats = cats.filter(c=> c.hp > 0);
  const beforeDogs = dogs.length; dogs = dogs.filter(d=> d.hp > 0);
  // on-canvas counters
  push(); noStroke(); fill(0,0,0,200); rect(8,8,160,44,6); fill(255); textAlign(LEFT,TOP); textSize(14); text('Gatos: ' + cats.length, 14, 12); text('Cachorros: ' + dogs.length, 14, 28); pop();
  // particles/effects
  drawParticles();
  if(gameOver){ drawGameOver(); }
}

function drawHud(){
  const ch = document.getElementById('catHealth'); const dh = document.getElementById('dogHealth');
  const aliveCats = cats.filter(x=>x.hp>0).length; const aliveDogs = dogs.filter(x=>x.hp>0).length;
  const totalCatHp = cats.reduce((s,e)=>s + Math.max(0,e.hp),0);
  const totalDogHp = dogs.reduce((s,e)=>s + Math.max(0,e.hp),0);
  if(ch){ ch.textContent = 'Gatos: ' + aliveCats + ' | HP: ' + totalCatHp; }
  if(dh){ dh.textContent = 'Cachorros: ' + aliveDogs + ' | HP: ' + totalDogHp; }
}

// new autonomous multi-entity AI
function updateEntities(){
  const now = millis();
  // helpers
  // choose a hide spot that is "safest" relative to the provided enemies
  function safestHide(x,y,enemies){
    if(hideSpots.length === 0) return null;
    // if no enemies, pick nearest
    const validEnemies = enemies ? enemies.filter(e=>e.hp>0) : [];
    if(validEnemies.length === 0){ // fallback to nearest
      let best=null; let bd=1e9; for(const s of hideSpots){ const d = dist(x,y,s.x,s.y); if(d<bd){ bd=d; best=s; } } return best;
    }
    let best = null; let bestScore = -1e9;
    for(const s of hideSpots){
      // distance to closest enemy (want this large)
      let minDE = 1e9;
      for(const e of validEnemies){ const de = dist(s.x,s.y,e.x,e.y); if(de < minDE) minDE = de; }
      const distToSelf = dist(x,y,s.x,s.y);
      // score: prefer spots that are far from enemies, but penalize extremely far spots so entity can reach it
      const score = minDE - 0.35 * distToSelf;
      if(score > bestScore){ bestScore = score; best = s; }
    }
    return best;
  }
  // process cats
  for(const c of cats){ if(c.hp<=0) continue;
    // expire buffs
    if(c.buffUntil && now > c.buffUntil){ c.dmgMult = 1; c.buffUntil = 0; }
    // if hidden and hide time over, unhide
    if(c.hidden && now > c.hideUntil){ c.hidden = false; }
    // if hidden, progressively regenerate HP while not found (cats get bonus)
    if(c.hidden){
      if(!c.nextRegen) c.nextRegen = now + 300;
      if(!c.lastRegen) c.lastRegen = now;
      if(!c.regenPerSec) c.regenPerSec = random(6,10) * (c.hiddenRegenBonus || 1.0);
      if(now >= c.nextRegen){
        const dt = now - c.lastRegen;
        const gained = (c.regenPerSec) * (dt/1000);
        c.hp = Math.min(c.maxHp, c.hp + gained);
        c.lastRegen = now;
        c.nextRegen = now + 300;
      }
    }
    // if low hp, flee to hide
    const fleeThreshold = 0.28 * c.maxHp;
  if(!c.hidden && c.hp > 0 && c.hp <= fleeThreshold){ c.state='flee'; c.targetHide = safestHide(c.x,c.y, dogs); c.fleeSpeed = random(3,4); }
    // if fleeing, move toward hide
    if(c.state === 'flee' && c.targetHide){ const ang = atan2(c.targetHide.y - c.y, c.targetHide.x - c.x); const ms = (c.moveSpeed || 1.4) * (c.fleeSpeed || 3.5); c.x += cos(ang)*ms; c.y += sin(ang)*ms; if(dist(c.x,c.y,c.targetHide.x,c.targetHide.y) < 22){
        c.hidden = true; c.hideUntil = now + random(2000,6000); c.state = 'hidden';
        // setup progressive regen (cats get bonus via hiddenRegenBonus)
        c.hideStart = now; c.nextRegen = now + 300; c.lastRegen = now; c.regenPerSec = random(6,10) * (c.hiddenRegenBonus || 1.0);
      }
    }
    // if not fleeing/hidden, find nearest enemy to engage
    if(!c.hidden && c.hp>0 && c.state !== 'flee'){
      const enemies = dogs.filter(d=>d.hp>0 && !d.hidden);
      if(enemies.length){ // pick nearest
        let target = enemies[0]; let bd = dist(c.x,c.y,target.x,target.y);
        for(const e of enemies){ const dd = dist(c.x,c.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
        const ang = atan2(target.y - c.y, target.x - c.x); c.x += cos(ang)*1.4; c.y += sin(ang)*1.4;
  if(bd < 70 && now - c.lastAttack > (c.attackCooldown || 700)){ c.lastAttack = now; performAbility(c,target,catAbilities); }
      } else {
        // if opponents are hidden, move toward a hide spot where opponents might be
        const hiddenSpots = hideSpots.filter(s=> dogs.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y)<30));
        if(hiddenSpots.length){ const s = hiddenSpots[0]; const ang = atan2(s.y - c.y, s.x - c.x); c.x += cos(ang)*1.7; c.y += sin(ang)*1.7; if(dist(c.x,c.y,s.x,s.y)<26){ // flush
            // reveal hidden dogs at spot and attack
            for(const d of dogs){ if(d.hidden && dist(d.x,d.y,s.x,s.y)<40){ d.hidden=false; d.hp = Math.max(0,d.hp- floor(random(4,10))); spawnFloatingText(d.x,d.y-20,'!','rgba(255,0,0,0.9)'); }
            }
        } }
      }
    }
  }
  // process dogs (mirror logic)
  for(const d of dogs){ if(d.hp<=0) continue;
    if(d.buffUntil && now > d.buffUntil){ d.dmgMult = 1; d.buffUntil = 0; }
    if(d.hidden && now > d.hideUntil){ d.hidden = false; }
    if(d.hidden){
      if(!d.nextRegen) d.nextRegen = now + 300;
      if(!d.lastRegen) d.lastRegen = now;
      if(!d.regenPerSec) d.regenPerSec = random(5,9) * (d.hiddenRegenBonus || 1.0);
      if(now >= d.nextRegen){
        const dt = now - d.lastRegen;
        const gained = (d.regenPerSec) * (dt/1000);
        d.hp = Math.min(d.maxHp, d.hp + gained);
        d.lastRegen = now;
        d.nextRegen = now + 300;
      }
    }
      const fleeThreshold = 0.28 * d.maxHp;
      if(!d.hidden && d.hp > 0 && d.hp <= fleeThreshold){ d.state='flee'; d.targetHide = safestHide(d.x,d.y, cats); d.fleeSpeed = random(3,4); }
    // dog regenerates a small amount while walking (if walkRegenPerSec set)
    if(!d.hidden && (d.walkRegenPerSec || 0) > 0){
      if(!d.walkLastRegen) d.walkLastRegen = now;
      const dtw = now - d.walkLastRegen;
      if(dtw > 250){ const gained = (d.walkRegenPerSec) * (dtw/1000); d.hp = Math.min(d.maxHp, d.hp + gained); d.walkLastRegen = now; }
    }
    if(!d.hidden && d.hp>0 && d.state !== 'flee'){
      const enemies = cats.filter(c=>c.hp>0 && !c.hidden);
      if(enemies.length){ let target = enemies[0]; let bd = dist(d.x,d.y,target.x,target.y); for(const e of enemies){ const dd = dist(d.x,d.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
  const ang = atan2(target.y - d.y, target.x - d.x); d.x += cos(ang)*1.5 * (d.moveSpeed || 1.5); d.y += sin(ang)*1.5 * (d.moveSpeed || 1.5); if(bd < 70 && now - d.lastAttack > (d.attackCooldown || 800)){ d.lastAttack = now; performAbility(d,target,dogAbilities); }
      } else {
        const hiddenSpots = hideSpots.filter(s=> cats.some(c=> c.hidden && dist(c.x,c.y,s.x,s.y)<30));
        if(hiddenSpots.length){ const s = hiddenSpots[0]; const ang = atan2(s.y - d.y, s.x - d.x); d.x += cos(ang)*1.6; d.y += sin(ang)*1.6; if(dist(d.x,d.y,s.x,s.y)<26){ for(const c of cats){ if(c.hidden && dist(c.x,c.y,s.x,s.y)<40){ c.hidden=false; c.hp = Math.max(0,c.hp - floor(random(4,10))); spawnFloatingText(c.x,c.y-20,'!','rgba(255,0,0,0.9)'); } } } }
      }
    }
  }
  // separation: avoid overlapping sprites (only for visible, alive entities)
  const all = [...cats, ...dogs];
  for(let i=0;i<all.length;i++){
    for(let j=i+1;j<all.length;j++){
      const a = all[i], b = all[j];
      if(!a || !b) continue;
      if(a.hp <= 0 || b.hp <= 0) continue;
      if(a.hidden || b.hidden) continue; // allow hidden to stay in place
      const dx = b.x - a.x, dy = b.y - a.y;
      let d = sqrt(dx*dx + dy*dy);
      const minDist = (a.radius || 32) + (b.radius || 32) - 6; // small overlap allowance
      if(d === 0){ // jitter to avoid perfect overlap
        const jitter = 0.5 + random(0.1,1);
        a.x -= jitter; a.y -= jitter; b.x += jitter; b.y += jitter; d = jitter*2;
      }
      if(d < minDist){
        const overlap = (minDist - d);
        const nx = dx / d, ny = dy / d;
        const shiftX = nx * (overlap * 0.5);
        const shiftY = ny * (overlap * 0.5);
        a.x -= shiftX; a.y -= shiftY;
        b.x += shiftX; b.y += shiftY;
      }
    }
  }
  // clamp positions
  for(const e of all){ e.x = constrain(e.x, 20, width-20); e.y = constrain(e.y, 20, height-20); }
}

function performAbility(user, target, pool){
  // pick ability by probability
  const r = random(); let acc = 0; let chosen = pool[0];
  for(const a of pool){ acc += a.prob; if(r <= acc){ chosen = a; break; } }
  // play impact sound for damage, heal or buff sounds
  if(chosen.type === 'damage'){
    const base = floor(random(chosen.min, chosen.max));
    const dmg = floor(base * (user.dmgMult || 1));
    target.hp = Math.max(0, target.hp - dmg);
    spawnFloatingText(target.x, target.y - 30, '-' + dmg, '#ff6666');
    spawnConfetti(target.x, target.y, 8);
    if(window.catDogAudio) window.catDogAudio.playImpact();
    // knockback
    const ang = atan2(target.y - user.y, target.x - user.x);
    target.x += cos(ang) * 12; target.y += sin(ang) * 12;
    // if target was hidden (rare), reveal
    if(target.hidden){ target.hidden = false; }
  } else if(chosen.type === 'heal'){
    const val = floor(random(chosen.min, chosen.max));
    user.hp = Math.min(user.maxHp, user.hp + val);
    spawnFloatingText(user.x, user.y - 30, '+' + val, '#66ff88');
    if(window.catDogAudio) window.catDogAudio.playHeal();
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + chosen.amount;
    user.buffUntil = millis() + chosen.duration;
    spawnFloatingText(user.x, user.y - 30, 'Dmg up', '#ffd24a');
    if(window.catDogAudio) window.catDogAudio.playBuff();
  } else if(chosen.type === 'buffMaxHp'){
    user.maxHp += chosen.amount;
    user.hp += chosen.amount; // immediate benefit
    spawnFloatingText(user.x, user.y - 30, 'Max HP +' + chosen.amount, '#ffd24a');
    if(window.catDogAudio) window.catDogAudio.playBuff();
  }
}

// execute a named ability directly (bypass probability selection)
function executeNamedAbility(user, target, ability){
  const chosen = ability;
  if(chosen.type === 'damage'){
    const base = floor(random(chosen.min, chosen.max));
    const dmg = floor(base * (user.dmgMult || 1));
    target.hp = Math.max(0, target.hp - dmg);
    spawnFloatingText(target.x, target.y - 30, '-' + dmg, '#ff6666');
    spawnConfetti(target.x, target.y, 8);
    if(window.catDogAudio) window.catDogAudio.playImpact();
    const ang = atan2(target.y - user.y, target.x - user.x);
    target.x += cos(ang) * 12; target.y += sin(ang) * 12;
  } else if(chosen.type === 'heal'){
    const val = floor(random(chosen.min, chosen.max));
    user.hp = Math.min(user.maxHp, user.hp + val);
    spawnFloatingText(user.x, user.y - 30, '+' + val, '#66ff88');
    if(window.catDogAudio) window.catDogAudio.playHeal();
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + chosen.amount;
    user.buffUntil = millis() + chosen.duration;
    spawnFloatingText(user.x, user.y - 30, 'Dmg up', '#ffd24a');
    if(window.catDogAudio) window.catDogAudio.playBuff();
  } else if(chosen.type === 'buffMaxHp'){
    user.maxHp += chosen.amount;
    user.hp += chosen.amount;
    spawnFloatingText(user.x, user.y - 30, 'Max HP +' + chosen.amount, '#ffd24a');
    if(window.catDogAudio) window.catDogAudio.playBuff();
  }
}

function spawnFloatingText(x,y,text,color){ particles.push({x,y,tx:text,color,life:80,vy:-1}); }

function spawnConfetti(x,y,count=12){ for(let i=0;i<count;i++){ particles.push({x:x+random(-8,8),y:y+random(-8,8),vx:random(-2,2),vy:random(-3,-0.5),life:random(30,70),type:'confetti',col:random(['#FFD24A','#FF6B6B','#9FD3C7'])}); } }

function drawParticles(){ for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x += p.vx||0; p.y += p.vy|| -0.5; p.life -= 1; if(p.life <= 0) particles.splice(i,1); }
  for(const p of particles){ push(); textAlign(CENTER,CENTER); if(p.tx){ fill(p.color||'#fff'); textSize(16); text(p.tx,p.x,p.y); } else if(p.type === 'confetti'){ noStroke(); fill(p.col); rect(p.x,p.y,4,6); } pop(); } }

function checkMatchEnd(){
  const aliveCats = cats.filter(x=>x.hp>0).length;
  const aliveDogs = dogs.filter(x=>x.hp>0).length;
  if(aliveCats === 0 || aliveDogs === 0){
    running = false; gameOver = true;
    const loser = aliveCats === 0 ? 'Gatos' : 'Cachorros';
    const winner = aliveCats === 0 ? 'Cachorros' : 'Gatos';
    document.getElementById('message').textContent = winner + ' venceu!';
    setTimeout(()=>{ showGameOverOverlay(loser); },200);
  }
}

function showGameOverOverlay(loser){ const container = document.getElementById('canvas-container'); let ov = document.getElementById('gameOver'); if(!ov){ ov = document.createElement('div'); ov.id='gameOver'; container.appendChild(ov); }
  ov.innerHTML = '<div>' + loser + ' perdeu</div><div id="insult">Noob</div><button id="reloadBtn">Voltar</button>';
  document.getElementById('reloadBtn').addEventListener('click', ()=>{ location.reload(); });
}

function drawGameOver(){ }

function spawnSpark(x,y){ for(let i=0;i<12;i++){ const s = document.createElement('div'); s.style.position='absolute'; s.style.left=(x + random(-8,8))+'px'; s.style.top=(y + random(-8,8))+'px'; s.style.width='6px'; s.style.height='6px'; s.style.background='#ffd24a'; s.style.borderRadius='50%'; s.style.opacity='0.9'; document.getElementById('canvas-container').appendChild(s); setTimeout(()=>{ s.remove(); },260); } }

// draw an HP bar centered at (x,y)
function drawHpBar(x,y,widthPx, hp, maxHp){ push(); translate(x - widthPx/2, y); stroke(0,0,0,140); strokeWeight(1); noFill(); rect(0,0,widthPx,8,3); const pct = constrain(hp / maxHp, 0, 1); noStroke(); fill(200,50,50); rect(1,1, (widthPx-2) * pct, 6,2); fill(255); textSize(10); textAlign(CENTER,CENTER); fill(255); text( floor(hp) + '/' + floor(maxHp), widthPx/2, 4); pop(); }

function drawCatSprite(x,y,size,ent){ // simple stylized cat face & body
  push(); translate(x,y);
  // body
  noStroke(); fill('#f2c9b6'); ellipse(0,6, size*0.9, size*0.7);
  // head
  fill('#f7d8c4'); ellipse(0,-6, size*0.6, size*0.6);
  // ears
  fill('#f7d8c4'); triangle(-size*0.22,-size*0.3, -size*0.08,-size*0.9, 0,-size*0.28);
  triangle(size*0.22,-size*0.3, size*0.08,-size*0.9, 0,-size*0.28);
  // eyes
  fill('#222'); ellipse(-size*0.12,-6, size*0.08, size*0.12); ellipse(size*0.12,-6, size*0.08, size*0.12);
  // nose
  fill('#d88'); triangle(0,-2, -4,0, 4,0);
  // tail
  stroke('#f2c9b6'); strokeWeight(6); noFill(); arc(-size*0.45, 8, size*0.5, size*0.2, -PI/2, PI/4);
  // minor indicator when buffed
  if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse( size*0.28, -size*0.4, 8,8); }
  pop(); }

function drawDogSprite(x,y,size,ent){ // simple stylized dog face & body
  push(); translate(x,y);
  // body
  noStroke(); fill('#d8c8b2'); ellipse(0,8, size*0.95, size*0.75);
  // head
  fill('#e6d6c0'); ellipse(0,-6, size*0.7, size*0.66);
  // ears floppy
  fill('#caa788'); ellipse(-size*0.28,-4, size*0.2, size*0.35); ellipse(size*0.28,-4, size*0.2, size*0.35);
  // eyes
  fill('#222'); ellipse(-size*0.12,-6, size*0.08, size*0.12); ellipse(size*0.12,-6, size*0.08, size*0.12);
  // snout
  fill('#cfa'); rect(-6,-1,12,6,4);
  // tail
  stroke('#d8c8b2'); strokeWeight(6); noFill(); line(size*0.45, 2, size*0.7, -8);
  if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse( size*0.34, -size*0.5, 8,8); }
  pop(); }
