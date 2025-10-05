// simple p5 game: Cat vs Dog
let catImg, dogImg, treeImg, rockImg, lizImg, maysaImg, birdImg, fishImg;
let currentTheme = 'catdog'; // 'catdog' or 'lizmaysa'
function getCatName() { return currentTheme === 'lizmaysa' ? 'Liz' : 'Gato'; }
function getDogName() { return currentTheme === 'lizmaysa' ? 'Maysa' : 'Cachorro'; }
function getCatsName() { return currentTheme === 'lizmaysa' ? 'Liz' : 'Gatos'; }
function getDogsName() { return currentTheme === 'lizmaysa' ? 'Maysa' : 'Cachorros'; }
let running = false;
let gameOver = false;
let particles = [];
let cats = [];
let dogs = [];
let birds = [];
let fish = [];
let hideSpots = [];
let catWins = 0;
let dogWins = 0;
let rankingStartTime = 0;
let timerInterval;
let startTime;
let gameHistories = [];
let initialCats = 0;
let initialDogs = 0;

const catAbilities = [
  {name:'Scratch', type:'damage', min:9, max:16, prob:0.6},
  {name:'Purr Heal', type:'heal', min:6, max:12, prob:0.2},
  // temporary damage buff (works via dmgMult + buffUntil)
  {name:'Feline Fury', type:'buffDamage', amount:0.6, duration:5000, prob:0.15},
  // make Nine Lives temporary instead of permanent; duration in ms
  {name:'Nine Lives', type:'buffMaxHp', amount:24, duration:8000, prob:0.05},
  {name:'Shadow Dash', type:'buffSpeed', amount:2.0, duration:3000, prob:0.3}
];
const dogAbilities = [
  {name:'Bite', type:'damage', min:10, max:16, prob:0.6},
  {name:'Growl Heal', type:'heal', min:5, max:10, prob:0.18},
  {name:'Alpha Roar', type:'buffDamage', amount:0.5, duration:6000, prob:0.16},
  // make Tough Hide temporary instead of permanent; duration in ms
  {name:'Tough Hide', type:'buffMaxHp', amount:20, duration:8000, prob:0.06},
  {name:'Berserker Rage', type:'buffDamage', amount:0.8, duration:4000, prob:0.1}
];

// new species: birds (allied to cats) and fish (allied to dogs)
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

function preload(){
  catImg = loadImage('assets/cat.svg');
  dogImg = loadImage('assets/dog.svg');
  lizImg = loadImage('assets/rosto_maysa.png');
  maysaImg = loadImage('assets/rosto_liz.png');
  // new hide spot images
  treeImg = loadImage('assets/tree.svg');
  rockImg = loadImage('assets/rock.svg');
  // new species images
  birdImg = loadImage('assets/cockatiel.svg');
  fishImg = loadImage('assets/fish.svg');
}
function setup(){ const c = createCanvas(1200,500); c.parent('canvas-container'); imageMode(CENTER); textFont('Arial');
  // startup info: helpful when debugging why console logs don't appear
  try{
    if(typeof window !== 'undefined'){
      // Enable dog debug logs by default so AI decisions print to the browser console.
      // Users can override by setting `window.DEBUG_DOGS = false` in the DevTools console.
      if(typeof window.DEBUG_DOGS !== 'boolean') window.DEBUG_DOGS = true;
      console.log('sketch.js loaded — DEBUG_DOGS =', window.DEBUG_DOGS, '; toggle with: window.DEBUG_DOGS = false');
    }
  }catch(e){}
  const _startBtn = document.getElementById('startBtn');
  if(_startBtn){ _startBtn.addEventListener('click', ()=>{ if(!running){ if(gameOver){ resetGame(); } else { startGame(); } } }); }
  const _restartBtn = document.getElementById('restartBtn');
  if(_restartBtn){ _restartBtn.addEventListener('click', ()=>{ resetGame(); }); }
  const _themeBtn = document.getElementById('themeBtn');
  if(_themeBtn){ _themeBtn.addEventListener('click', switchTheme); }
  const _clearRankingBtn = document.getElementById('clearRankingBtn');
  if(_clearRankingBtn){ _clearRankingBtn.addEventListener('click', () => { catWins = 0; dogWins = 0; rankingStartTime = millis(); saveRanking(); }); }
  const _historyBtn = document.getElementById('historyBtn');
  if(_historyBtn){ _historyBtn.addEventListener('click', toggleHistoryMenu); }
  // clamp inputs to max 100
  const numCatsEl = document.getElementById('numCats');
  if(numCatsEl){ numCatsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(1, parseInt(this.value) || 1)); }); }
  const numDogsEl = document.getElementById('numDogs');
  if(numDogsEl){ numDogsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(1, parseInt(this.value) || 1)); }); }
  const numBirdsEl = document.getElementById('numBirds');
  if(numBirdsEl){ numBirdsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(0, parseInt(this.value) || 0)); }); }
  const numFishEl = document.getElementById('numFish');
  if(numFishEl){ numFishEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(0, parseInt(this.value) || 0)); }); }
  // Load ranking from localStorage
  catWins = parseInt(localStorage.getItem('catWins')) || 0;
  dogWins = parseInt(localStorage.getItem('dogWins')) || 0;
  gameHistories = JSON.parse(localStorage.getItem('gameHistories')) || [];
}

function saveRanking() {
  localStorage.setItem('catWins', catWins);
  localStorage.setItem('dogWins', dogWins);
  localStorage.setItem('gameHistories', JSON.stringify(gameHistories));
}

function updateTimer() {
  if (startTime) {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = 'Tempo: ' + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }
  }
}

function startTimer() {
  startTime = Date.now();
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function toggleHistoryMenu() {
  const menu = document.getElementById('historyMenu');
  if (menu.style.display === 'none' || menu.style.display === '') {
    menu.innerHTML = '<h4>Histórico de Partidas</h4>';
    if (gameHistories.length === 0) {
      menu.innerHTML += '<p>Nenhuma partida jogada ainda.</p>';
    } else {
      gameHistories.forEach((h, i) => {
        let details = `${i+1}. ${h.date || 'Data não disponível'} - ${h.winner} venceu (${h.alive} vivos) em ${h.time}`;
        if (h.initialCats !== undefined) {
          details += `.<br>Iniciais: ${h.initialCats} ${getCatsName().toLowerCase()}, ${h.initialDogs} ${getDogsName().toLowerCase()}.<br>Mortos: ${h.killedCats} ${getCatsName().toLowerCase()}, ${h.killedDogs} ${getDogsName().toLowerCase()}.`;
        }
        menu.innerHTML += `<p>${details}</p>`;
      });
    }
    menu.style.display = 'block';
  } else {
    menu.style.display = 'none';
  }
}

function switchTheme(){
  currentTheme = currentTheme === 'catdog' ? 'lizmaysa' : 'catdog';
  const themeBtn = document.getElementById('themeBtn');
  if(themeBtn){
    themeBtn.textContent = currentTheme === 'catdog' ? 'Switch to Liz vs Maysa' : 'Switch to Cat vs Dog';
  }
  // Update labels
  document.title = currentTheme === 'catdog' ? 'Gato vs Cachorro' : 'Liz vs Maysa';
  const numCatsLabel = document.querySelector('label:has(#numCats)');
  if(numCatsLabel){ numCatsLabel.innerHTML = getCatsName() + ': <input id="numCats" type="text" value="' + numCatsLabel.querySelector('#numCats').value + '" />'; }
  const numDogsLabel = document.querySelector('label:has(#numDogs)');
  if(numDogsLabel){ numDogsLabel.innerHTML = getDogsName() + ': <input id="numDogs" type="text" value="' + numDogsLabel.querySelector('#numDogs').value + '" />'; }
  // Optionally reset the game to apply the new theme
  if(running || gameOver){
    resetGame();
  }
}

// Headless simulation runner: runs N matches (no rendering) and reports stats
function runSimulations(runs){
  const results = { cats:0, dogs:0, draws:0, totalTurns:0 };
  for(let i=0;i<runs;i++){
    const nCats = Math.max(1, parseInt(document.getElementById('numCats').value||10));
    const nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||10));
    // seed a match
    initMatchStateForSim(nCats, nDogs);
    let turns = 0; const MAX_TURNS = 12000; // cap
    while(!isMatchOver() && turns++ < MAX_TURNS){ updateEntitiesSim(); }
    const ac = cats.filter(x=>x.hp>0).length; const ad = dogs.filter(x=>x.hp>0).length;
    if(ac > 0 && ad === 0) results.cats++; else if(ad > 0 && ac === 0) results.dogs++; else results.draws++;
    results.totalTurns += turns;
  }
  const out = `Simulações: ${runs} | ${getCatsName()}: ${results.cats} | ${getDogsName()}: ${results.dogs} | Empates: ${results.draws} | Turnos médios: ${Math.round(results.totalTurns / runs)}`;
  document.getElementById('simResults').textContent = out;
  // restore any visual state
  startGame();
}

// initialize arrays for simulation (no DOM, no rendering). Reuse same entity structures.
function initMatchStateForSim(nCats,nDogs){
  cats = []; dogs = []; birds = []; fish = []; hideSpots = [];
  // increase hide spots and randomize types (include visual radius per type)
  const spots = 6 + floor(random(0,5));
  for(let i=0;i<spots;i++){
    const type = random(['tree','rock']);
    // make hide spots visibly larger than animals
    const r = 40; // equal radius for both types to avoid preference
    hideSpots.push({ x: random(80, width-80), y: random(60, height-60), type: type, radius: r });
  }
  // spawn animals at fully random positions across arena (not left/right halves)
  for(let i=0;i<nCats;i++){
    cats.push({ x: random(60, width-60), y: random(60, height-60), hp:110, maxHp:110, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:26, moveSpeed: 1.7, attackCooldown: 600, speciesDamageMultiplier: 1.0, hiddenRegenBonus: 1.25, walkRegenPerSec: 1.0, fleeSpeed: 3 });
  }
  for(let j=0;j<nDogs;j++){
  dogs.push({ x: random(60, width-60), y: random(60, height-60), hp:100, maxHp:100, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:34, moveSpeed: 1.45, attackCooldown: 700, speciesDamageMultiplier: 1.0, hiddenRegenBonus: 1.0, walkRegenPerSec: random(2.5,4.0), fleeSpeed: 1 });
  }
  // spawn small flocks of birds allied to cats for simulation
  const nBirds = Math.floor(nCats * 0.4);
  for(let b=0;b<nBirds;b++) birds.push({ x: random(60, width-60), y: random(60, height-60), hp:60, maxHp:60, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.2, attackCooldown:400, speciesDamageMultiplier:0.9, hiddenRegenBonus:1.1, walkRegenPerSec: random(0.5,1.0), fleeSpeed:3 });
  // spawn fish allied to dogs for simulation
  const nFish = Math.floor(nDogs * 0.4);
  for(let f=0; f<nFish; f++) fish.push({ x: random(60, width-60), y: random(60, height-60), hp:80, maxHp:80, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.2, attackCooldown:600, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: random(0.5,1.5), fleeSpeed:1.5 });
}

function isMatchOver(){ const aliveCats = cats.filter(x=>x.hp>0).length; const aliveDogs = dogs.filter(x=>x.hp>0).length; return (aliveCats === 0 || aliveDogs === 0); }

// fast, simplified update loop for simulation: reuse update logic but avoid heavy drawing/particle ops
function updateEntitiesSim(){ // reuse updateEntities() internals but avoid creating particles or DOM reads
  // for simplicity call updateEntities which is already mostly logic; it will run quickly without drawing
  updateEntities();
}

function startGame(){
  // read config
  let nCats = Math.max(1, parseInt(document.getElementById('numCats').value||10));
  let nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||10));
  // enforce global cap
  const MAX_ENTITIES = 100;
  nCats = Math.min(nCats, MAX_ENTITIES);
  nDogs = Math.min(nDogs, MAX_ENTITIES);
  initialCats = nCats;
  initialDogs = nDogs;
  cats = []; dogs = []; hideSpots = [];
  // create hide spots (fixed at 10)
  const spots = 10;
  for(let i=0;i<spots;i++){
    const type = random(['tree','rock']);
    const r = 60; // increased radius for larger hide spots
    hideSpots.push({ x: random(80, width-80), y: random(60, height-60), type: type, radius: r });
  }
  // spawn cats and dogs spread across the arena
  for(let i=0;i<nCats;i++){
    cats.push({ x: random(60, width-60), y: random(60, height-60), hp:160, maxHp:160, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:30,
      // cat traits (tweaked): still quick but slightly nerfed in damage and hidden regen, faster flee
      moveSpeed: 1.9, attackCooldown: 550, speciesDamageMultiplier: 1.25, hiddenRegenBonus: 1.25, walkRegenPerSec: random(1.5,2.5), fleeSpeed: 3
    });
  }
  for(let j=0;j<nDogs;j++){
    dogs.push({ x: random(60, width-60), y: random(60, height-60), hp:90, maxHp:90, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:38,
      // dog traits (tweaked): stronger and a bit faster, better walk regen and slightly quicker attacks
      moveSpeed: 1.45, attackCooldown: 700, speciesDamageMultiplier: 1.2, hiddenRegenBonus: 1.0, walkRegenPerSec: random(1.5,3.0), fleeSpeed: 1
    });
  }
  // spawn birds (allied to cats)
  let nBirds = Math.max(0, parseInt(document.getElementById('numBirds') ? document.getElementById('numBirds').value : 0) || 0);
  for(let b=0;b<nBirds;b++){
    birds.push({ x: random(60, width-60), y: random(60, height-60), hp:60, maxHp:60, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.2, attackCooldown:400, speciesDamageMultiplier:0.9, hiddenRegenBonus:1.1, walkRegenPerSec: random(0.5,1.0), fleeSpeed:3 });
  }
  // spawn fish (allied to dogs)
  let nFish = Math.max(0, parseInt(document.getElementById('numFish') ? document.getElementById('numFish').value : 0) || 0);
  for(let f=0;f<nFish;f++){
    fish.push({ x: random(60, width-60), y: random(60, height-60), hp:80, maxHp:80, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.2, attackCooldown:600, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: random(0.5,1.5), fleeSpeed:1.5 });
  }
  rankingStartTime = millis();
  startTimer();
  running = true; gameOver = false;
}

function resetGame(){
  // clear game over overlay
  const ov = document.getElementById('gameOver');
  if(ov){ ov.remove(); }
  // reset game state
  startGame();
}

// drawParticles: render and advance particles array (moved earlier so draw() can call it)
function drawParticles(){
  for(let i=particles.length-1;i>=0;i--){
    const p = particles[i];
    p.x += p.vx||0;
    p.y += p.vy|| -0.5;
    p.life -= 1;
    if(p.life <= 0) particles.splice(i,1);
  }
  for(const p of particles){
    push(); textAlign(CENTER,CENTER);
    if(p.tx){ fill(p.color||'#fff'); textSize(16); text(p.tx,p.x,p.y); }
    else if(p.type === 'confetti'){ noStroke(); fill(p.col); rect(p.x,p.y,4,6); }
    pop();
  }
}
// expose to global in case p5 is running in a scope that doesn't hoist the function to window
try{ if(typeof window !== 'undefined') window.drawParticles = drawParticles; }catch(e){}

// full checkMatchEnd implementation (moved earlier so draw() can call it)
function checkMatchEnd(){
  const aliveCats = cats.filter(x=>x.hp>0).length;
  const aliveDogs = dogs.filter(x=>x.hp>0).length;
  if(aliveCats === 0 || aliveDogs === 0){
    running = false; gameOver = true;
    const loser = aliveCats === 0 ? getCatsName() : getDogsName();
    const winner = aliveCats === 0 ? getDogsName() : getCatsName();
    const winnerAlive = aliveCats === 0 ? aliveDogs : aliveCats;
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    const killedCats = initialCats - aliveCats;
    const killedDogs = initialDogs - aliveDogs;
    gameHistories.push({
      winner: winner,
      alive: winnerAlive,
      time: timeStr,
      date: new Date().toLocaleString(),
      initialCats: initialCats,
      initialDogs: initialDogs,
      killedCats: killedCats,
      killedDogs: killedDogs
    });
    // Keep only last 10
    if (gameHistories.length > 10) gameHistories.shift();
    // Increment wins
    if (aliveCats === 0) {
      dogWins++;
    } else {
      catWins++;
    }
    saveRanking();
    stopTimer();
  const _msgEnd = document.getElementById('message'); if(_msgEnd) _msgEnd.textContent = winner + ' venceu!';
    setTimeout(()=>{ showGameOverOverlay(loser); },200);
    // Auto restart after 10 seconds if enabled
    if (document.getElementById('autoRestartCb').checked) {
      setTimeout(() => { resetGame(); }, 10000);
    }
  }
}
// drawGameOver & showGameOverOverlay moved earlier so draw() can call them
function showGameOverOverlay(loser){ const container = document.getElementById('canvas-container') || document.body; let ov = document.getElementById('gameOver'); if(!ov){ ov = document.createElement('div'); ov.id='gameOver'; container.appendChild(ov); }
  ov.innerHTML = '<div>' + loser + ' perdeu</div><div id="insult">Noob</div><button id="reloadBtn">Voltar</button>';
  const btn = ov.querySelector('#reloadBtn'); if(btn){ btn.addEventListener('click', ()=>{ resetGame(); }); }
}

function drawGameOver(){ /* placeholder: left intentionally minimal */ }

// ensure overlay functions are global
try{ if(typeof window !== 'undefined'){ window.showGameOverOverlay = showGameOverOverlay; window.drawGameOver = drawGameOver; } }catch(e){}

// drawCatSprite & drawDogSprite moved above draw() to ensure they are defined
function drawCatSprite(x,y,size,ent){ // simple stylized cat face & body
  if(currentTheme === 'lizmaysa'){
    image(maysaImg, x, y, size * 2.0, size * 2.0);
    if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.28, y - size*0.4, 8,8); }
    return;
  }
  push(); translate(x,y);
  // body
  noStroke(); fill('#888'); ellipse(0,6, size*0.9, size*0.7);
  // head
  fill('#aaa'); ellipse(0,-6, size*0.6, size*0.6);
  // ears
  fill('#222'); triangle(-size*0.22,-size*0.3, -size*0.08,-size*0.9, 0,-size*0.28);
  triangle(size*0.22,-size*0.3, size*0.08,-size*0.9, 0,-size*0.28);
  // eyes
  fill('#222'); ellipse(-size*0.12,-6, size*0.08, size*0.12); ellipse(size*0.12,-6, size*0.08, size*0.12);
  // nose
  fill('#555'); triangle(0,-2, -4,0, 4,0);
  // tail
  stroke('#888'); strokeWeight(6); noFill(); arc(-size*0.45, 8, size*0.5, size*0.2, -PI/2, PI/4);
  // minor indicator when buffed
  if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse( size*0.28, -size*0.4, 8,8); }
  pop(); }

function drawDogSprite(x,y,size,ent){ // simple stylized dog face & body
  if(currentTheme === 'lizmaysa'){
    image(lizImg, x, y, size * 2.0, size * 2.0);
    if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.34, y - size*0.5, 8,8); }
    return;
  }
  push(); translate(x,y);
  // body
  noStroke(); fill('#d2691e'); ellipse(0,8, size*0.95, size*0.75);
  // head
  fill('#daa520'); ellipse(0,-6, size*0.7, size*0.66);
  // ears floppy
  fill('#8b4513'); ellipse(-size*0.28,-4, size*0.2, size*0.35); ellipse(size*0.28,-4, size*0.2, size*0.35);
  // eyes
  fill('#222'); ellipse(-size*0.12,-6, size*0.08, size*0.12); ellipse(size*0.12,-6, size*0.08, size*0.12);
  // snout
  fill('#f4a460'); rect(-6,-1,12,6,4);
  // tail
  stroke('#d2691e'); strokeWeight(6); noFill(); line(size*0.45, 2, size*0.7, -8);
  if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse( size*0.34, -size*0.5, 8,8); }
  pop(); }

// ensure sprite draw functions are available on the global/window object
try{ if(typeof window !== 'undefined'){ window.drawCatSprite = drawCatSprite; window.drawDogSprite = drawDogSprite; } }catch(e){}

function draw(){ background(255);
  // arena
  fill(240); rect(0,0,width,height);
  // update
  if(running && !gameOver){
    updateEntities();
    checkMatchEnd();
  }
  // draw hide spots (use icons when available) — size based on spot.radius
  for(const s of hideSpots){ push(); noStroke();
    const w = (s.radius || 30) * 1.6; const h = (s.radius || 30) * (s.type === 'tree' ? 1.6 : 1.0);
    if(s.type === 'tree' && typeof treeImg !== 'undefined' && treeImg){ image(treeImg, s.x, s.y - (s.radius||30)*0.1, w, h); }
    else if(s.type === 'rock' && typeof rockImg !== 'undefined' && rockImg){ image(rockImg, s.x, s.y + (s.radius||30)*0.08, w, h*0.75); }
    else { fill(200,180,140,180); ellipse(s.x,s.y, (s.radius||30)*1.2, (s.radius||30)*0.8 ); }
    pop(); }
  // draw cats
  for(const c of cats){ push(); translate(c.x,c.y); drawCatSprite(0,0,32,c); if(c.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,36,36); } pop(); }
  // draw dogs
  for(const d of dogs){ push(); translate(d.x,d.y); drawDogSprite(0,0,38,d); if(d.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,40,40); } pop(); }
  // draw birds
  for(const b of birds){ push(); translate(b.x,b.y); if(birdImg){ image(birdImg,0,0,28,28); } else { drawCatSprite(0,0,20,b); } if(b.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,26,26); } pop(); }
  // draw fish
  for(const f of fish){ push(); translate(f.x,f.y); if(fishImg){ image(fishImg,0,0,30,30); } else { drawDogSprite(0,0,24,f); } if(f.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,28,28); } pop(); }
  // HUD
  // HUD bars
  drawHud();
  // remove dead entities from arrays (so they disappear)
  const beforeCats = cats.length; cats = cats.filter(c=> c.hp > 0);
  const beforeDogs = dogs.length; dogs = dogs.filter(d=> d.hp > 0);
  const beforeBirds = birds.length; birds = birds.filter(b => b.hp > 0);
  const beforeFish = fish.length; fish = fish.filter(f => f.hp > 0);
  // on-canvas counters
  push(); noStroke(); fill(0,0,0,200); rect(8,8,160,44,6); fill(255); textAlign(LEFT,TOP); textSize(14); text(getCatsName() + ': ' + cats.length, 14, 12); text(getDogsName() + ': ' + dogs.length, 14, 28); pop();
  // ranking on the side
  push(); noStroke(); fill(0,0,0,200); rect(width - 200, 8, 190, 60, 6); fill(255); textAlign(LEFT,TOP); textSize(14);
  text(getCatName() + ' Vitórias: ' + catWins, width - 190, 12);
  text(getDogName() + ' Vitórias: ' + dogWins, width - 190, 28);
  pop();
  // particles/effects
  drawParticles();
  // draw HP bars on top of everything
  for(const c of cats){ if(c.hp > 0) drawHpBar(c.x, c.y - 22, 24, c.hp, c.maxHp); }
  for(const d of dogs){ if(d.hp > 0) drawHpBar(d.x, d.y - 26, 28, d.hp, d.maxHp); }
  for(const b of birds){ if(b.hp > 0) drawHpBar(b.x, b.y - 18, 18, b.hp, b.maxHp); }
  for(const f of fish){ if(f.hp > 0) drawHpBar(f.x, f.y - 20, 20, f.hp, f.maxHp); }
  if(gameOver){ drawGameOver(); }
}

// drawHpBar: draw an HP bar centered at (x,y) — moved earlier so draw() can call it
function drawHpBar(x,y,widthPx, hp, maxHp){
  push(); translate(x - widthPx/2, y);
  stroke(0,0,0,140); strokeWeight(1); noFill(); rect(0,0,widthPx,8,3);
  const pct = constrain(hp / maxHp, 0, 1);
  noStroke(); fill(200,50,50); rect(1,1, (widthPx-2) * pct, 6,2);
  fill(255); textSize(10); textAlign(CENTER,CENTER);
  fill(255); text( floor(hp) + '/' + floor(maxHp), widthPx/2, 4);
  pop();
}

// ensure hp bar function is available globally
try{ if(typeof window !== 'undefined'){ window.drawHpBar = drawHpBar; } }catch(e){}

function drawHud(){
  const aliveCats = cats.filter(x=>x.hp>0).length; const aliveDogs = dogs.filter(x=>x.hp>0).length;
  const totalCatHp = cats.reduce((s,e)=>s + Math.max(0,e.hp),0);
  const totalDogHp = dogs.reduce((s,e)=>s + Math.max(0,e.hp),0);
  // draw total team HP bars on canvas
  push();
  const barW = 220; const barH = 14; const gap = 8;
  // compute max possible HP totals using current maxHp values
  const maxCatHpTotal = Math.max(1, cats.reduce((s,e)=>s + (e.maxHp||100),0));
  const maxDogHpTotal = Math.max(1, dogs.reduce((s,e)=>s + (e.maxHp||100),0));
  const pctCat = constrain(totalCatHp / maxCatHpTotal, 0, 1);
  const pctDog = constrain(totalDogHp / maxDogHpTotal, 0, 1);
  // position bars top-center
  const cx = width/2; const y = 12;
  // background
  noStroke(); fill(0,0,0,120); rect(cx - (barW+gap)/2 - 6, y - 6, (barW+gap) + 12, barH*2 + 18, 6);
  // cat bar (top)
  stroke(0,0,0,150); strokeWeight(1); fill(80,160,255); rect(cx - barW/2, y, barW, barH, 4);
  noStroke(); fill(30,120,220); rect(cx - barW/2 + 1, y + 1, (barW-2) * pctCat, barH-2, 3);
  fill(255); textSize(11); textAlign(CENTER,CENTER); fill(255); text(getCatsName() + ' ' + Math.round(pctCat*100) + '%', cx, y + barH/2);
  // dog bar (below)
  stroke(0,0,0,150); strokeWeight(1); fill(255,140,100); rect(cx - barW/2, y + barH + 8, barW, barH, 4);
  noStroke(); fill(220,90,40); rect(cx - barW/2 + 1, y + barH + 9, (barW-2) * pctDog, barH-2, 3);
  fill(255); textSize(11); textAlign(CENTER,CENTER); fill(255); text(getDogsName() + ' ' + Math.round(pctDog*100) + '%', cx, y + barH + 8 + barH/2);
  pop();
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
    // expire temporary dmg/speed buffs
    if(c.buffUntil && now > c.buffUntil){ c.dmgMult = 1; c.speedMult = 1; c.buffUntil = 0; }
    // expire temporary maxHp buffs (revert to base maxHp)
    if(c._maxHpBuffUntil && now > c._maxHpBuffUntil){
      // revert to base maxHp (if stored) and clamp current hp
      if(typeof c._maxHpBase === 'number'){
        c.maxHp = c._maxHpBase;
      } else if(c._maxHpBuff){
        c.maxHp = Math.max(1, c.maxHp - (c._maxHpBuff || 0));
      }
      c._maxHpBuff = 0; c._maxHpBuffUntil = 0; delete c._maxHpBase;
      if(c.hp > c.maxHp) c.hp = c.maxHp;
    }
    // if hidden and hide time over, unhide
  if(c.hidden && now > c.hideUntil){ c.hidden = false; c.isRegenerating = false; if(c._savedRadius){ c.radius = c._savedRadius; delete c._savedRadius; } }
    // if hidden, progressively regenerate HP while not found (cats get bonus)
    if(c.hidden){
      if(!c.nextRegen) c.nextRegen = now + 300;
      if(!c.lastRegen) c.lastRegen = now;
      if(!c.regenPerSec) c.regenPerSec = random(6,10) * (c.hiddenRegenBonus || 1.0);
      // tree hide doubles cat regen
      if(c.targetHide && c.targetHide.type === 'tree') c.regenPerSec = c.regenPerSec * 2;
      c.isRegenerating = true;
      if(now >= c.nextRegen){
        const dt = now - c.lastRegen;
        const gained = (c.regenPerSec) * (dt/1000);
        c.hp = Math.min(c.maxHp, c.hp + gained);
        c.lastRegen = now;
        c.nextRegen = now + 300;
        if(c.hp >= c.maxHp) c.isRegenerating = false;
      }
    }
    // if low hp, flee to hide
    const fleeThreshold = 0.25 * c.maxHp;
  if(!c.hidden && c.hp > 0 && c.hp <= fleeThreshold){ c.state='flee'; c.targetHide = safestHide(c.x,c.y, dogs); c.fleeSpeed = random(1.5,2.5); }
    // if fleeing, move toward hide
  if(c.state === 'flee' && c.targetHide){ const ang = atan2(c.targetHide.y - c.y, c.targetHide.x - c.x); const ms = (c.moveSpeed || 1.4) * c.speedMult * (c.fleeSpeed || 2); c.x += cos(ang)*ms; c.y += sin(ang)*ms; if(dist(c.x,c.y,c.targetHide.x,c.targetHide.y) < (c.targetHide.radius || 22)){
        c.hidden = true; c.hideUntil = now + random(2000,6000); c.state = 'hidden';
        // setup progressive regen (cats get bonus via hiddenRegenBonus)
        c.hideStart = now; c.nextRegen = now + 300; c.lastRegen = now; c.regenPerSec = random(6,10) * (c.hiddenRegenBonus || 1.0);
        if(c.targetHide && c.targetHide.type === 'tree') c.regenPerSec = c.regenPerSec * 2;
        c.isRegenerating = true;
        // enlarge radius while hidden to be more noticeable
        c._savedRadius = c.radius; c.radius = (c.radius || 26) * 1.3;
      }
    }
    // if not fleeing/hidden, find nearest enemy to engage
    if(!c.hidden && c.hp>0 && c.state !== 'flee'){
      const enemies = dogs.filter(d=>d.hp>0 && !d.hidden);
      if(enemies.length){ // pick nearest
        let target = enemies[0]; let bd = dist(c.x,c.y,target.x,target.y);
        for(const e of enemies){ const dd = dist(c.x,c.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
    const ang = atan2(target.y - c.y, target.x - c.x); c.x += cos(ang)*0.7; c.y += sin(ang)*0.7;
  const attackRange = (c.radius || 26) + (target.radius || 32) + 6;
  if(bd < attackRange && now - c.lastAttack > (c.attackCooldown || 700)){
    c.lastAttack = now;
    const beforeHp = target.hp;
    performAbility(c,target,catAbilities);
    // if target took damage, make it flee and choose a new hide away from attackers
    // if(target.hp < beforeHp && target.hp > 0){
    //   const prevHide = target.targetHide;
    //   if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } }
    //   if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; }
    //   const awayFrom = dogs;
    //   const candidateFar = pickFarHide(awayFrom, 80, target);
    //   target.targetHide = candidateFar || safestHide(target.x, target.y, awayFrom, target);
    //   target.state = 'flee'; target.fleeSpeed = random(3,4);
    // }
    }
  }
  // process birds (simple AI: allied to cats, attack dogs)
  for(const b of birds){ if(b.hp<=0) continue;
    if(b.buffUntil && now > b.buffUntil){ b.dmgMult = 1; b.speedMult = 1; b.buffUntil = 0; }
    if(b._maxHpBuffUntil && now > b._maxHpBuffUntil){ if(typeof b._maxHpBase === 'number'){ b.maxHp = b._maxHpBase; } else if(b._maxHpBuff){ b.maxHp = Math.max(1, b.maxHp - (b._maxHpBuff || 0)); } b._maxHpBuff = 0; b._maxHpBuffUntil = 0; delete b._maxHpBase; if(b.hp > b.maxHp) b.hp = b.maxHp; }
    if(b.hidden && now > b.hideUntil){ b.hidden = false; b.isRegenerating = false; if(b._savedRadius){ b.radius = b._savedRadius; delete b._savedRadius; } }
    if(b.hidden){ if(!b.nextRegen) b.nextRegen = now + 300; if(!b.lastRegen) b.lastRegen = now; if(!b.regenPerSec) b.regenPerSec = random(3,6) * (b.hiddenRegenBonus || 1.0); b.isRegenerating = true; if(now >= b.nextRegen){ const dt = now - b.lastRegen; const gained = (b.regenPerSec) * (dt/1000); b.hp = Math.min(b.maxHp, b.hp + gained); b.lastRegen = now; b.nextRegen = now + 300; if(b.hp >= b.maxHp) b.isRegenerating = false; } }
    const fleeThresholdB = 0.25 * b.maxHp; if(!b.hidden && b.hp > 0 && b.hp <= fleeThresholdB){ b.state='flee'; b.targetHide = safestHide(b.x,b.y, dogs); b.fleeSpeed = random(2,3); }
    if(b.state === 'flee' && b.targetHide){ const ang = atan2(b.targetHide.y - b.y, b.targetHide.x - b.x); const ms = (b.moveSpeed || 1.4) * b.speedMult * (b.fleeSpeed || 2); b.x += cos(ang)*ms; b.y += sin(ang)*ms; if(dist(b.x,b.y,b.targetHide.x,b.targetHide.y) < (b.targetHide.radius || 22)){ b.hidden = true; b.hideUntil = now + random(1200,3600); b.state = 'hidden'; b.hideStart = now; b.nextRegen = now + 300; b.lastRegen = now; b.regenPerSec = random(4,8) * (b.hiddenRegenBonus || 1.0); b.isRegenerating = true; b._savedRadius = b.radius; b.radius = (b.radius || 20) * 1.3; } }
    // engage dogs
    if(!b.hidden && b.hp>0 && b.state !== 'flee'){
      const enemies = dogs.filter(d=>d.hp>0 && !d.hidden);
      if(enemies.length){ let target = enemies[0]; let bd = dist(b.x,b.y,target.x,target.y); for(const e of enemies){ const dd = dist(b.x,b.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } } const ang = atan2(target.y - b.y, target.x - b.x); b.x += cos(ang)*0.9 * (b.moveSpeed || 2.0) * b.speedMult; b.y += sin(ang)*0.9 * (b.moveSpeed || 2.0) * b.speedMult; const attackRange = (b.radius || 20) + (target.radius || 32) + 6; if(bd < attackRange && now - b.lastAttack > (b.attackCooldown || 500)){ b.lastAttack = now; performAbility(b,target,birdAbilities); }
      }
    }
  }
  }
  // process dogs (mirror logic)
  for(const d of dogs){
      if(d.hp<=0) continue;
        // expire temporary dmg/speed buffs
        if(d.buffUntil && now > d.buffUntil){ d.dmgMult = 1; d.speedMult = 1; d.buffUntil = 0; }
        // expire temporary maxHp buffs (revert to base maxHp)
        if(d._maxHpBuffUntil && now > d._maxHpBuffUntil){
          if(typeof d._maxHpBase === 'number'){
            d.maxHp = d._maxHpBase;
          } else if(d._maxHpBuff){
            d.maxHp = Math.max(1, d.maxHp - (d._maxHpBuff || 0));
          }
          d._maxHpBuff = 0; d._maxHpBuffUntil = 0; delete d._maxHpBase;
        if(d.hp > d.maxHp) d.hp = d.maxHp;
      }
      // unhide when hide time expires
      if(d.hidden && now > d.hideUntil){ d.hidden = false; d.isRegenerating = false; if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; } }

      // hidden regen
      if(d.hidden){
        if(!d.nextRegen) d.nextRegen = now + 300;
        if(!d.lastRegen) d.lastRegen = now;
        if(!d.regenPerSec) d.regenPerSec = random(3,5) * (d.hiddenRegenBonus || 1.0);
        if(d.targetHide && d.targetHide.type === 'rock') d.regenPerSec = d.regenPerSec * 1.5;
        d.isRegenerating = true;
        if(now >= d.nextRegen){
          const dt = now - d.lastRegen;
          const gained = (d.regenPerSec) * (dt/1000);
          d.hp = Math.min(d.maxHp, d.hp + gained);
          d.lastRegen = now;
          d.nextRegen = now + 300;
          if(d.hp >= d.maxHp) d.isRegenerating = false;
        }
      }

      // flee when low
      const fleeThreshold = 0.15 * d.maxHp;
      if(!d.hidden && d.hp > 0 && d.hp <= fleeThreshold){
        d.state='flee';
        d.targetHide = safestHide(d.x,d.y, cats);
        d.fleeSpeed = random(1.5,2.5);
        try{ if(window.DEBUG_DOGS) console.log('DOG EVENT enter_flee', { x: Math.round(d.x), y: Math.round(d.y), hp: Math.round(d.hp), targetHide: d.targetHide ? { x: Math.round(d.targetHide.x), y: Math.round(d.targetHide.y), type: d.targetHide.type } : null }); }catch(e){}
      }

      // fleeing movement
      if(d.state === 'flee' && d.targetHide){
        const angF = atan2(d.targetHide.y - d.y, d.targetHide.x - d.x);
        const msBase = (d.moveSpeed || 1.4) * d.speedMult * (d.fleeSpeed || 2);
        const ms = msBase * (d.onBreak ? 2 : 1);
        d.x += cos(angF)*ms; d.y += sin(angF)*ms;
        if(dist(d.x,d.y,d.targetHide.x,d.targetHide.y) < (d.targetHide.radius || 22)){
          d.hidden = true; d.hideUntil = millis() + random(1000,3000); d.state = 'hidden'; d.hideStart = millis();
          d.nextRegen = millis() + 300; d.lastRegen = millis(); d.regenPerSec = random(5,9) * (d.hiddenRegenBonus || 1.0);
          if(d.targetHide && d.targetHide.type === 'rock') d.regenPerSec = d.regenPerSec * 2;
          d.isRegenerating = true;
          d._savedRadius = d.radius; d.radius = (d.radius || 34) * 1.3;
        }
      } else if(d.state === 'flee' && !d.targetHide){
        try{ if(window.DEBUG_DOGS && (!d._lastFleeWarn || millis() - d._lastFleeWarn > 1000)){ console.warn('DOG WARN in_flee_no_targetHide', { pos: [Math.round(d.x), Math.round(d.y)], hp: Math.round(d.hp), recentlyAvoidHide: !!d.recentlyAvoidHide, recentlyAvoidUntil: d.recentlyAvoidUntil }); d._lastFleeWarn = millis(); } }catch(e){}
      }

      // dog regenerates a small amount while walking (if walkRegenPerSec set)
      if(!d.hidden && (d.walkRegenPerSec || 0) > 0){
        if(!d.walkLastRegen) d.walkLastRegen = now;
        const dtw = now - d.walkLastRegen;
        if(dtw > 250){ const gained = (d.walkRegenPerSec) * (dtw/1000); d.hp = Math.min(d.maxHp, d.hp + gained); d.walkLastRegen = now; }
      }

      // active behavior: seek and attack cats
      if(!d.hidden && d.hp>0 && d.state !== 'flee'){
        const enemies = cats.filter(c=>c.hp>0 && !c.hidden);
        d.onBreak = (enemies.length === 0);
        try{ if(window.DEBUG_DOGS && (!d._lastState || now - d._lastState > 1000)){ console.log('DOG STATE', 'pos', Math.round(d.x),Math.round(d.y), 'hp', Math.round(d.hp), 'state', d.state, 'hidden', d.hidden, 'enemies', enemies.length, 'onBreak', d.onBreak); d._lastState = now; } }catch(e){}
        if(enemies.length){
          let target = enemies[0]; let bd = dist(d.x,d.y,target.x,target.y);
          for(const e of enemies){ const dd = dist(d.x,d.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } }
          const ang = atan2(target.y - d.y, target.x - d.x);
          const moveMul = d.onBreak ? 2 : 1;
          d.x += cos(ang)*0.75 * (d.moveSpeed || 1.5) * d.speedMult * moveMul; d.y += sin(ang)*0.75 * (d.moveSpeed || 1.5) * d.speedMult * moveMul;
          const dogAttackRange = (d.radius || 34) + (target.radius || 26) + 6;
          try{
            if(window.DEBUG_DOGS && (!d._lastDebug || now - d._lastDebug > 800)){
              console.log('DOG DEBUG', 'pos', Math.round(d.x),Math.round(d.y), 'hp', Math.round(d.hp), 'enemies', enemies.length, 'nearestDist', Math.round(bd), 'attackRange', Math.round(dogAttackRange), 'onBreak', d.onBreak);
              d._lastDebug = now;
            }
            if(window.DEBUG_DOGS && (!d._lastAttackCheck || now - d._lastAttackCheck > 600)){
              const hasEnemy = enemies.length > 0;
              const inRange = bd <= dogAttackRange + 2; // small tolerance for floating point/position rounding
              const cdOk = (now - d.lastAttack > (d.attackCooldown || 800));
              console.log('DOG CHECK', 'pos', Math.round(d.x),Math.round(d.y), 'hp', Math.round(d.hp), 'hasEnemy', hasEnemy, 'inRange', inRange, 'cdOk', cdOk, 'nearestDist', Math.round(bd), 'attackRange', Math.round(dogAttackRange));
              d._lastAttackCheck = now;
            }
          }catch(e){}

            if(bd <= dogAttackRange + 2 && now - d.lastAttack > (d.attackCooldown || 800)){
            d.lastAttack = now;
            const beforeHp = target.hp;
            performAbility(d,target,dogAbilities);
            try{ console.log('DEBUG: dog attack at', Math.round(d.x),Math.round(d.y), '-> target at', Math.round(target.x),Math.round(target.y)); }catch(e){}
            // if(target.hp < beforeHp && target.hp > 0){
            //   const prevHide = target.targetHide;
            //   if(target.hidden){ target.hidden = false; target.isRegenerating = false; if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; } }
            //   if(prevHide){ target.recentlyAvoidHide = prevHide; target.recentlyAvoidUntil = now + 1200; }
            //   const awayFrom = cats;
            //   const candidateFar = pickFarHide(awayFrom, 80, target);
            //   target.targetHide = candidateFar || safestHide(target.x, target.y, awayFrom, target);
            //   target.state = 'flee'; target.fleeSpeed = random(3,4);
            // }
          }
        } else {
          // only search for hidden enemies when there are NO hidden cats currently regenerating
          const anyHiddenCatsAreRegenerating = cats.some(c=> c.hidden && c.hp>0 && c.isRegenerating);
          if(!anyHiddenCatsAreRegenerating){
            const hiddenSpots = hideSpots.filter(s=> cats.some(c=> c.hidden && dist(c.x,c.y,s.x,s.y)<s.radius));
            if(hiddenSpots.length){ const s = hiddenSpots[0]; const ang = atan2(s.y - d.y, s.x - d.x); d.x += cos(ang)*0.8; d.y += sin(ang)*0.8; if(dist(d.x,d.y,s.x,s.y)<26){ for(const c of cats){ if(c.hidden && dist(c.x,c.y,s.x,s.y)<s.radius){ c.hidden=false; c.hp = Math.max(0,c.hp - floor(random(4,10))); spawnFloatingText(c.x,c.y-20,'!','rgba(255,0,0,0.9)'); } } } 
              try{ if(window.DEBUG_DOGS) console.log('DOG searching hidden at spot', Math.round(s.x), Math.round(s.y)); }catch(e){}
            } else {
              try{ if(window.DEBUG_DOGS) console.log('DOG idle: no hidden spots with cats'); }catch(e){}
            }
          } else {
            try{ if(window.DEBUG_DOGS) console.log('DOG idle: hidden cats regenerating'); }catch(e){}
          }
        }
      }
    }
  }
  // process fish (allied to dogs, attack cats)
  for(const f of fish){ if(f.hp<=0) continue;
    if(f.buffUntil && now > f.buffUntil){ f.dmgMult = 1; f.speedMult = 1; f.buffUntil = 0; }
    if(f._maxHpBuffUntil && now > f._maxHpBuffUntil){ if(typeof f._maxHpBase === 'number'){ f.maxHp = f._maxHpBase; } else if(f._maxHpBuff){ f.maxHp = Math.max(1, f.maxHp - (f._maxHpBuff || 0)); } f._maxHpBuff = 0; f._maxHpBuffUntil = 0; delete f._maxHpBase; if(f.hp > f.maxHp) f.hp = f.maxHp; }
    if(f.hidden && now > f.hideUntil){ f.hidden = false; f.isRegenerating = false; if(f._savedRadius){ f.radius = f._savedRadius; delete f._savedRadius; } }
    if(f.hidden){ if(!f.nextRegen) f.nextRegen = now + 300; if(!f.lastRegen) f.lastRegen = now; if(!f.regenPerSec) f.regenPerSec = random(2,5) * (f.hiddenRegenBonus || 1.0); f.isRegenerating = true; if(now >= f.nextRegen){ const dt = now - f.lastRegen; const gained = (f.regenPerSec) * (dt/1000); f.hp = Math.min(f.maxHp, f.hp + gained); f.lastRegen = now; f.nextRegen = now + 300; if(f.hp >= f.maxHp) f.isRegenerating = false; } }
    const fleeThresholdF = 0.18 * f.maxHp; if(!f.hidden && f.hp > 0 && f.hp <= fleeThresholdF){ f.state='flee'; f.targetHide = safestHide(f.x,f.y, cats); f.fleeSpeed = random(1.2,2.0); }
    if(f.state === 'flee' && f.targetHide){ const ang = atan2(f.targetHide.y - f.y, f.targetHide.x - f.x); const ms = (f.moveSpeed || 1.2) * f.speedMult * (f.fleeSpeed || 2); f.x += cos(ang)*ms; f.y += sin(ang)*ms; if(dist(f.x,f.y,f.targetHide.x,f.targetHide.y) < (f.targetHide.radius || 22)){ f.hidden = true; f.hideUntil = now + random(1000,3000); f.state = 'hidden'; f.hideStart = now; f.nextRegen = now + 300; f.lastRegen = now; f.regenPerSec = random(3,7) * (f.hiddenRegenBonus || 1.0); f.isRegenerating = true; f._savedRadius = f.radius; f.radius = (f.radius || 22) * 1.2; } }
    // engage cats
    if(!f.hidden && f.hp>0 && f.state !== 'flee'){
      const enemies = cats.filter(c=>c.hp>0 && !c.hidden);
      if(enemies.length){ let target = enemies[0]; let bd = dist(f.x,f.y,target.x,target.y); for(const e of enemies){ const dd = dist(f.x,f.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } } const ang = atan2(target.y - f.y, target.x - f.x); f.x += cos(ang)*0.6 * (f.moveSpeed || 1.2) * f.speedMult; f.y += sin(ang)*0.6 * (f.moveSpeed || 1.2) * f.speedMult; const attackRange = (f.radius || 22) + (target.radius || 26) + 6; if(bd < attackRange && now - f.lastAttack > (f.attackCooldown || 600)){ f.lastAttack = now; performAbility(f,target,fishAbilities); }
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
  // helper: pick a hide spot that is not near any of the attackers (min distance threshold)
  function pickFarHide(attackers, threshold = 80, avoidEntity = null){
    if(!hideSpots || hideSpots.length === 0) return null;
    // compute min distance from each spot to attackers
    let best = null; let bestMin = -1;
    const nowLocal = millis();
    for(const s of hideSpots){
      // if this entity was just revealed from this hide, skip it for a short while
      if(avoidEntity && avoidEntity.recentlyAvoidUntil && nowLocal < avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s) continue;
      let minD = 1e9; for(const a of attackers){ if(!a) continue; const d = dist(s.x,s.y,a.x,a.y); if(d < minD) minD = d; }
      if(minD > bestMin){ bestMin = minD; best = s; }
    }
    // prefer one whose min distance to attackers is at least threshold if possible
    if(best && bestMin >= threshold) return best;
    // otherwise return the farthest one found
    return best;
  }
  
  // safestHide: avoid a recently avoided hide for an entity when provided
  function safestHide(x,y,enemies, avoidEntity = null){
    if(hideSpots.length === 0) return null;
    const validEnemies = enemies ? enemies.filter(e=>e.hp>0) : [];
    if(validEnemies.length === 0){ // fallback to nearest
      let best=null; let bd=1e9; for(const s of hideSpots){ if(avoidEntity && avoidEntity.recentlyAvoidUntil && millis() < avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s) continue; const d = dist(x,y,s.x,s.y); if(d<bd){ bd=d; best=s; } } return best;
    }
    let best = null; let bestScore = -1e9;
    for(const s of hideSpots){
      if(avoidEntity && avoidEntity.recentlyAvoidUntil && millis() < avoidEntity.recentlyAvoidUntil && avoidEntity.recentlyAvoidHide === s) continue;
      let minDE = 1e9;
      for(const e of validEnemies){ const de = dist(s.x,s.y,e.x,e.y); if(de < minDE) minDE = de; }
      const distToSelf = dist(x,y,s.x,s.y);
      const score = minDE - 0.35 * distToSelf;
      if(score > bestScore){ bestScore = score; best = s; }
    }
    return best;
  }
function performAbility(user, target, pool){
  // pick ability by probability
  const r = random(); let acc = 0; let chosen = pool[0];
  for(const a of pool){ acc += a.prob; if(r <= acc){ chosen = a; break; } }
  // play impact sound for damage, heal or buff sounds
  if(chosen.type === 'damage'){
    const base = floor(random(chosen.min, chosen.max));
    const dmg = floor(base * ((user.speciesDamageMultiplier || 1) * (user.dmgMult || 1)));
    target.hp = Math.max(0, target.hp - dmg);
    spawnFloatingText(target.x, target.y - 30, '-' + dmg, '#ff6666');
    spawnConfetti(target.x, target.y, 8);
    if(window.catDogAudio) window.catDogAudio.playImpact();
    // knockback
    const ang = atan2(target.y - user.y, target.x - user.x);
    target.x += cos(ang) * 12; target.y += sin(ang) * 12;
    // if target was hidden (rare), reveal and restore visual radius / stop regenerating so it can flee properly
    if(target.hidden){ 
      target.hidden = false; 
      target.isRegenerating = false; 
      if(target._savedRadius){ target.radius = target._savedRadius; delete target._savedRadius; }
    }
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
    // Apply temporary max HP buff: store base and apply delta, set expiry
    // Avoid stacking: if a previous temporary buff exists, refresh duration and keep the larger buff amount
  if(!user._maxHpBase) user._maxHpBase = user.maxHp;
  const prevBuff = user._maxHpBuff || 0;
  const newBuff = Math.max(prevBuff, chosen.amount);
  // adjust maxHp to base + newBuff (don't cumulative-add on top of current max)
  user.maxHp = (user._maxHpBase || user.maxHp) + newBuff;
  // adjust current hp proportionally by adding only the delta between previous buff and new buff
  const delta = newBuff - prevBuff;
  if(delta > 0) user.hp = Math.min(user.maxHp, user.hp + delta);
  user._maxHpBuff = newBuff;
  user._maxHpBuffUntil = millis() + (chosen.duration || 8000);
  spawnFloatingText(user.x, user.y - 30, 'Max HP +' + newBuff, '#ffd24a');
  if(window.catDogAudio) window.catDogAudio.playBuff();
  } else if(chosen.type === 'buffSpeed'){
    user.speedMult = 1 + chosen.amount;
    user.buffUntil = millis() + chosen.duration;
    spawnFloatingText(user.x, user.y - 30, 'Speed up', '#66ff88');
    if(window.catDogAudio) window.catDogAudio.playBuff();
  }
}

// execute a named ability directly (bypass probability selection)
function executeNamedAbility(user, target, ability){
  const chosen = ability;
  if(chosen.type === 'damage'){
    const base = floor(random(chosen.min, chosen.max));
    const dmg = floor(base * ((user.speciesDamageMultiplier || 1) * (user.dmgMult || 1)));
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
    // temporary maxHp buff (non-stacking). Mirror logic from performAbility
  if(!user._maxHpBase) user._maxHpBase = user.maxHp;
  const prevBuff = user._maxHpBuff || 0;
  const newBuff = Math.max(prevBuff, chosen.amount);
  user.maxHp = (user._maxHpBase || user.maxHp) + newBuff;
  const delta = newBuff - prevBuff;
  if(delta > 0) user.hp = Math.min(user.maxHp, user.hp + delta);
  user._maxHpBuff = newBuff;
  user._maxHpBuffUntil = millis() + (chosen.duration || 8000);
  spawnFloatingText(user.x, user.y - 30, 'Max HP +' + newBuff, '#ffd24a');
  if(window.catDogAudio) window.catDogAudio.playBuff();
  }
}

function spawnFloatingText(x,y,text,color){ particles.push({x,y,tx:text,color,life:80,vy:-1}); }

function spawnConfetti(x,y,count=12){ for(let i=0;i<count;i++){ particles.push({x:x+random(-8,8),y:y+random(-8,8),vx:random(-2,2),vy:random(-3,-0.5),life:random(30,70),type:'confetti',col:random(['#FFD24A','#FF6B6B','#9FD3C7'])}); } }

// showGameOverOverlay/drawGameOver moved earlier above draw().

function spawnSpark(x,y){ for(let i=0;i<12;i++){ const s = document.createElement('div'); s.style.position='absolute'; s.style.left=(x + random(-8,8))+'px'; s.style.top=(y + random(-8,8))+'px'; s.style.width='6px'; s.style.height='6px'; s.style.background='#ffd24a'; s.style.borderRadius='50%'; s.style.opacity='0.9'; const _c = document.getElementById('canvas-container') || document.body; _c.appendChild(s); setTimeout(()=>{ s.remove(); },260); } }

// drawHpBar moved earlier above draw() to avoid startup ordering issues.



}





