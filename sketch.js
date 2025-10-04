// simple p5 game: Cat vs Dog
let catImg, dogImg;
let running = false;
let gameOver = false;
let lastAttack = 0;
let cat = { x:120,y:200,hp:100,maxHp:100,dir:0, dmgMult:1, buffUntil:0 };
let dog = { x:600,y:200,hp:100,maxHp:100,dir:0, dmgMult:1, buffUntil:0 };
let particles = [];

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
}

function startGame(){ running = true; gameOver = false; cat.hp = 100; dog.hp = 100; document.getElementById('message').textContent='Boa sorte!'; }

function draw(){ background(255);
  // arena
  fill(240); rect(0,0,width,height);
  // update
  if(running && !gameOver){
    handleInput();
    updateAI();
    // expire buffs
    if(cat.buffUntil && millis() > cat.buffUntil){ cat.dmgMult = 1; cat.buffUntil = 0; }
    if(dog.buffUntil && millis() > dog.buffUntil){ dog.dmgMult = 1; dog.buffUntil = 0; }
    checkCollisions();
  }
  // draw characters
  push(); translate(cat.x,cat.y); image(catImg,0,0,80,80); pop();
  push(); translate(dog.x,dog.y); image(dogImg,0,0,92,92); pop();
  // HUD
  // HUD bars
  drawHud();
  // particles/effects
  drawParticles();
  if(gameOver){ drawGameOver(); }
}

function drawHud(){
  const ch = document.getElementById('catHealth'); const dh = document.getElementById('dogHealth');
  if(ch){ ch.textContent = 'Gato: ' + cat.hp + ' / ' + cat.maxHp + (cat.dmgMult>1? ' (Dmg x' + cat.dmgMult.toFixed(2) + ')':''); }
  if(dh){ dh.textContent = 'Cachorro: ' + dog.hp + ' / ' + dog.maxHp + (dog.dmgMult>1? ' (Dmg x' + dog.dmgMult.toFixed(2) + ')':''); }
}

function handleInput(){ if(keyIsDown(LEFT_ARROW)) cat.x -= 3; if(keyIsDown(RIGHT_ARROW)) cat.x += 3; if(keyIsDown(UP_ARROW)) cat.y -= 3; if(keyIsDown(DOWN_ARROW)) cat.y += 3; if(keyIsDown(32)){ // space attack
    if(millis() - lastAttack > 500){ lastAttack = millis();
      // if close to dog, perform an ability
      if(dist(cat.x,cat.y,dog.x,dog.y) < 100){ performAbility(cat, dog, catAbilities); }
    }
  }}

function updateAI(){ // dog tries to approach cat and attack
  const ang = atan2(cat.y - dog.y, cat.x - dog.x);
  dog.x += cos(ang) * 1.6; dog.y += sin(ang) * 1.6;
  if(dist(cat.x,cat.y,dog.x,dog.y) < 100 && millis() - lastAttack > 700){ lastAttack = millis(); performAbility(dog, cat, dogAbilities); }
}

function performAbility(user, target, pool){
  // pick ability by probability
  const r = random(); let acc = 0; let chosen = pool[0];
  for(const a of pool){ acc += a.prob; if(r <= acc){ chosen = a; break; } }
  if(chosen.type === 'damage'){
    const base = floor(random(chosen.min, chosen.max));
    const dmg = floor(base * (user.dmgMult || 1));
    target.hp = Math.max(0, target.hp - dmg);
    spawnFloatingText(target.x, target.y - 30, '-' + dmg, '#ff6666');
    spawnConfetti(target.x, target.y, 8);
    // knockback
    const ang = atan2(target.y - user.y, target.x - user.x);
    target.x += cos(ang) * 12; target.y += sin(ang) * 12;
  } else if(chosen.type === 'heal'){
    const val = floor(random(chosen.min, chosen.max));
    user.hp = Math.min(user.maxHp, user.hp + val);
    spawnFloatingText(user.x, user.y - 30, '+' + val, '#66ff88');
  } else if(chosen.type === 'buffDamage'){
    user.dmgMult = 1 + chosen.amount;
    user.buffUntil = millis() + chosen.duration;
    spawnFloatingText(user.x, user.y - 30, 'Dmg up', '#ffd24a');
  } else if(chosen.type === 'buffMaxHp'){
    user.maxHp += chosen.amount;
    user.hp += chosen.amount; // immediate benefit
    spawnFloatingText(user.x, user.y - 30, 'Max HP +' + chosen.amount, '#ffd24a');
  }
}

function spawnFloatingText(x,y,text,color){ particles.push({x,y,tx:text,color,life:80,vy:-1}); }

function spawnConfetti(x,y,count=12){ for(let i=0;i<count;i++){ particles.push({x:x+random(-8,8),y:y+random(-8,8),vx:random(-2,2),vy:random(-3,-0.5),life:random(30,70),type:'confetti',col:random(['#FFD24A','#FF6B6B','#9FD3C7'])}); } }

function drawParticles(){ for(let i=particles.length-1;i>=0;i--){ const p = particles[i]; p.x += p.vx||0; p.y += p.vy|| -0.5; p.life -= 1; if(p.life <= 0) particles.splice(i,1); }
  for(const p of particles){ push(); textAlign(CENTER,CENTER); if(p.tx){ fill(p.color||'#fff'); textSize(16); text(p.tx,p.x,p.y); } else if(p.type === 'confetti'){ noStroke(); fill(p.col); rect(p.x,p.y,4,6); } pop(); } }

function checkCollisions(){ if(cat.hp <= 0 || dog.hp <= 0){ running = false; gameOver = true; const loser = cat.hp <= 0 ? 'Gato' : 'Cachorro'; const winner = cat.hp <= 0 ? 'Cachorro' : 'Gato'; document.getElementById('message').textContent = winner + ' venceu!'; setTimeout(()=>{ showGameOverOverlay(loser); },200); } }

function showGameOverOverlay(loser){ const container = document.getElementById('canvas-container'); let ov = document.getElementById('gameOver'); if(!ov){ ov = document.createElement('div'); ov.id='gameOver'; container.appendChild(ov); }
  ov.innerHTML = '<div>' + loser + ' perdeu</div><div id="insult">Noob</div><button id="reloadBtn">Voltar</button>';
  document.getElementById('reloadBtn').addEventListener('click', ()=>{ location.reload(); });
}

function drawGameOver(){ }

function spawnSpark(x,y){ for(let i=0;i<12;i++){ const s = document.createElement('div'); s.style.position='absolute'; s.style.left=(x + random(-8,8))+'px'; s.style.top=(y + random(-8,8))+'px'; s.style.width='6px'; s.style.height='6px'; s.style.background='#ffd24a'; s.style.borderRadius='50%'; s.style.opacity='0.9'; document.getElementById('canvas-container').appendChild(s); setTimeout(()=>{ s.remove(); },260); } }
