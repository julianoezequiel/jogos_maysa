// simple p5 game: Cat vs Dog
let catImg, dogImg, treeImg, rockImg, elizabethImg, maysaImg, birdImg, fishImg, mayaraImg, julianoImg, yasminImg;
let capyImg;
// themes: 'catdog' (default) or 'family' (modo família que mostra integrantes reais)
let currentTheme = 'catdog'; // 'catdog' or 'family'
function getCatName() { return currentTheme === 'family' ? 'Elizabeth' : 'Gato'; }
function getDogName() { return currentTheme === 'family' ? 'Maysa' : 'Cachorro'; }
function getCatsName() { return currentTheme === 'family' ? 'Elizabeth' : 'Gatos'; }
function getDogsName() { return currentTheme === 'family' ? 'Maysa' : 'Cachorros'; }
function getBirdName() { return currentTheme === 'family' ? 'Mayara' : 'Calopsita'; }
function getBirdsName() { return currentTheme === 'family' ? 'Mayara' : 'Calopsitas'; }
function getFishName() { return currentTheme === 'family' ? 'Juliano' : 'Peixe'; }
function getFishsName() { return currentTheme === 'family' ? 'Juliano' : 'Peixes'; }
function getCapyName() { return currentTheme === 'family' ? 'Yasmin' : 'Capivara'; }
function getCapysName() { return currentTheme === 'family' ? 'Yasmin' : 'Capivaras'; }
let running = false;
let gameOver = false;
let paused = false;
let pauseStart = 0;
let pausedAccum = 0; // milliseconds accumulated while paused
let particles = [];
let cats = [];
let dogs = [];
let birds = [];
let fish = [];
let capybaras = [];
let hideSpots = [];
let catWins = 0;
let dogWins = 0;
let birdWins = 0;
let fishWins = 0;
let capyWins = 0;
let rankingStartTime = 0;
let timerInterval;
let startTime;
let gameHistories = [];
let initialCats = 0;
let initialDogs = 0;
let initialBirds = 0;
let initialFish = 0;
let initialCapy = 0;

// Abilities should come from the species modules (single source-of-truth).
// `scripts/species/loader.js` exposes these as `window.Species` and also
// attaches `window.catAbilities`, `window.dogAbilities`, etc. We prefer
// to use those at runtime; fall back to empty arrays if the loader isn't
// present (e.g., in very old setups).
let catAbilities = (typeof window !== 'undefined' && window.Species && window.Species.catAbilities) ? window.Species.catAbilities : (typeof window !== 'undefined' && window.catAbilities) ? window.catAbilities : [];
let dogAbilities = (typeof window !== 'undefined' && window.Species && window.Species.dogAbilities) ? window.Species.dogAbilities : (typeof window !== 'undefined' && window.dogAbilities) ? window.dogAbilities : [];
let birdAbilities = (typeof window !== 'undefined' && window.Species && window.Species.birdAbilities) ? window.Species.birdAbilities : (typeof window !== 'undefined' && window.birdAbilities) ? window.birdAbilities : [];
let fishAbilities = (typeof window !== 'undefined' && window.Species && window.Species.fishAbilities) ? window.Species.fishAbilities : (typeof window !== 'undefined' && window.fishAbilities) ? window.fishAbilities : [];

// Fallback inline pools (used only when loader.js didn't populate the arrays)
if(!Array.isArray(catAbilities) || catAbilities.length === 0){
  catAbilities = [
    {name:'Scratch', type:'damage', min:6, max:11, prob:0.48},
    {name:'Purr Heal', type:'heal', min:4, max:10, prob:0.16},
    {name:'Feline Fury', type:'buffDamage', amount:0.35, duration:4200, prob:0.10},
    {name:'Nine Lives', type:'buffMaxHp', amount:12, duration:6000, prob:0.03},
    {name:'Shadow Dash', type:'buffSpeed', amount:1.4, duration:2200, prob:0.16}
  ];
}
if(!Array.isArray(dogAbilities) || dogAbilities.length === 0){
  dogAbilities = [
    {name:'Bite', type:'damage', min:9, max:14, prob:0.54},
    {name:'Growl Heal', type:'heal', min:6, max:12, prob:0.18},
    {name:'Alpha Roar', type:'buffDamage', amount:0.42, duration:5600, prob:0.14},
    {name:'Tough Hide', type:'buffMaxHp', amount:18, duration:8000, prob:0.07},
    {name:'Berserker Rage', type:'buffDamage', amount:0.7, duration:4000, prob:0.09}
  ];
}
if(!Array.isArray(birdAbilities) || birdAbilities.length === 0){
  birdAbilities = [
    {name:'Peck', type:'damage', min:10, max:18, prob:0.72},
    {name:'Feather Mend', type:'heal', min:7, max:12, prob:0.18},
    {name:'Wing Gust', type:'buffSpeed', amount:0.85, duration:3000, prob:0.20},
    {name:'Flock Cry', type:'buffDamage', amount:0.55, duration:4200, prob:0.16, aoe: true, aoeRadius: 80, aoeMaxTargets: 4},
    {name:'Shadow Dash', type:'dash', damage:18, speedBoost:0.95, duration:600, prob:0.12}
  ];
}
if(!Array.isArray(fishAbilities) || fishAbilities.length === 0){
  fishAbilities = [
    {name:'Bite', type:'damage', min:11, max:18, prob:0.70},
    {name:'Slime Heal', type:'heal', min:6, max:11, prob:0.16},
    {name:'Slippery', type:'buffSpeed', amount:0.8, duration:2600, prob:0.16},
    {name:'Water Surge', type:'buffMaxHp', amount:26, duration:7000, prob:0.18, aoe: true, aoeRadius: 90, aoeMaxTargets: 5},
    { name: 'Berserker Rage', type: 'berserk', amount: 1.0, duration: 7000, selfHpCostPerSec: 1, prob: 0.10 }
  ];
}

// capybara abilities are defined here (no dedicated species module exists for capy)
const capyAbilities = [
  { name: 'Chomp', type: 'damage', min: 12, max: 20, prob: 0.68 },
  { name: 'Capy Calm', type: 'heal', min: 10, max: 16, prob: 0.20 },
  { name: 'Mud Shield', type: 'buffMaxHp', amount: 26, duration: 9000, prob: 0.16 },
  { name: 'Slide', type: 'dash', damage: 14, speedBoost: 0.6, duration: 600, prob: 0.10 },
  { name: 'Serene Aura', type: 'buffDamage', amount: 0.45, duration: 5000, prob: 0.06 }
];
function preload(){
  // prefer files that have "new" in the filename (user-provided updated art)
  catImg = null; dogImg = null; birdImg = null; fishImg = null; capyImg = null;
  // Try PNG first (generated), fall back to SVG. This avoids CORS/renderer issues with some browsers
  loadImage('assets/cat-new.png', function(img){ catImg = img; try{ console.log('cat-new.png loaded'); }catch(e){} }, function(){ loadImage('assets/cat-new.svg', function(img){ catImg = img; try{ console.log('cat-new.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/dog-new.png', function(img){ dogImg = img; try{ console.log('dog-new.png loaded'); }catch(e){} }, function(){ loadImage('assets/dog-new.svg', function(img){ dogImg = img; try{ console.log('dog-new.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/bird-new.png', function(img){ birdImg = img; try{ console.log('bird-new.png loaded'); }catch(e){} }, function(){ loadImage('assets/bird-new.svg', function(img){ birdImg = img; try{ console.log('bird-new.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/fish-new.png', function(img){ fishImg = img; try{ console.log('fish-new.png loaded'); }catch(e){} }, function(){ loadImage('assets/fish-new.svg', function(img){ fishImg = img; try{ console.log('fish-new.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/capybara-new.png', function(img){ capyImg = img; try{ console.log('capybara-new.png loaded'); }catch(e){} }, function(){ loadImage('assets/capybara-new.svg', function(img){ capyImg = img; try{ console.log('capybara-new.svg loaded'); }catch(e){} }, function(){}); });

  // fallbacks: svgrepo placeholders (if you downloaded via helper) - prefer PNG when present
  loadImage('assets/svgrepo_cat.png', function(img){ if(!catImg) catImg = img; try{ console.log('svgrepo_cat.png loaded'); }catch(e){} }, function(){ loadImage('assets/svgrepo_cat.svg', function(img){ if(!catImg) catImg = img; try{ console.log('svgrepo_cat.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/svgrepo_dog.png', function(img){ if(!dogImg) dogImg = img; try{ console.log('svgrepo_dog.png loaded'); }catch(e){} }, function(){ loadImage('assets/svgrepo_dog.svg', function(img){ if(!dogImg) dogImg = img; try{ console.log('svgrepo_dog.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/svgrepo_bird.png', function(img){ if(!birdImg) birdImg = img; try{ console.log('svgrepo_bird.png loaded'); }catch(e){} }, function(){ loadImage('assets/svgrepo_bird.svg', function(img){ if(!birdImg) birdImg = img; try{ console.log('svgrepo_bird.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/svgrepo_fish.png', function(img){ if(!fishImg) fishImg = img; try{ console.log('svgrepo_fish.png loaded'); }catch(e){} }, function(){ loadImage('assets/svgrepo_fish.svg', function(img){ if(!fishImg) fishImg = img; try{ console.log('svgrepo_fish.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/svgrepo_capy.png', function(img){ if(!capyImg) capyImg = img; try{ console.log('svgrepo_capy.png loaded'); }catch(e){} }, function(){ loadImage('assets/svgrepo_capy.svg', function(img){ if(!capyImg) capyImg = img; try{ console.log('svgrepo_capy.svg loaded'); }catch(e){} }, function(){}); });

  // detailed art that was added previously - prefer PNG if present
  loadImage('assets/cat_detailed.png', function(img){ if(!catImg) catImg = img; try{ console.log('cat_detailed.png loaded'); }catch(e){} }, function(){ loadImage('assets/cat_detailed.svg', function(img){ if(!catImg) catImg = img; try{ console.log('cat_detailed.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/dog_detailed.png', function(img){ if(!dogImg) dogImg = img; try{ console.log('dog_detailed.png loaded'); }catch(e){} }, function(){ loadImage('assets/dog_detailed.svg', function(img){ if(!dogImg) dogImg = img; try{ console.log('dog_detailed.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/bird_detailed.png', function(img){ if(!birdImg) birdImg = img; try{ console.log('bird_detailed.png loaded'); }catch(e){} }, function(){ loadImage('assets/bird_detailed.svg', function(img){ if(!birdImg) birdImg = img; try{ console.log('bird_detailed.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/fish_detailed.png', function(img){ if(!fishImg) fishImg = img; try{ console.log('fish_detailed.png loaded'); }catch(e){} }, function(){ loadImage('assets/fish_detailed.svg', function(img){ if(!fishImg) fishImg = img; try{ console.log('fish_detailed.svg loaded'); }catch(e){} }, function(){}); });
  loadImage('assets/capy_detailed.png', function(img){ if(!capyImg) capyImg = img; try{ console.log('capy_detailed.png loaded'); }catch(e){} }, function(){ loadImage('assets/capy_detailed.svg', function(img){ if(!capyImg) capyImg = img; try{ console.log('capy_detailed.svg loaded'); }catch(e){} }, function(){}); });

  // family-mode faces and hide spot images
  elizabethImg = loadImage('assets/elizabeth_rosto.png');
  maysaImg = loadImage('assets/maysa_rosto.png');
  mayaraImg = loadImage('assets/mayara_rosto.png');
  julianoImg = loadImage('assets/juliano_rosto.png');
  yasminImg = loadImage('assets/yasmin_rosto.png', function() { try{ console.log('yasmin_rosto.png loaded'); }catch(e){} }, function(err){ try{ console.warn('yasmin_rosto.png failed to load', err); }catch(e){} });
  treeImg = loadImage('assets/tree.svg');
  rockImg = loadImage('assets/rock.svg');

  // final synchronous fallbacks (ensure something is available in preload) - prefer PNG base files if present
  if(!catImg) catImg = (typeof loadImage === 'function') ? (loadImage('assets/cat.png', function(img){ if(!catImg) catImg = img; }, function(){ if(!catImg) catImg = loadImage('assets/cat.svg'); })) : null;
  if(!dogImg) dogImg = (typeof loadImage === 'function') ? (loadImage('assets/dog.png', function(img){ if(!dogImg) dogImg = img; }, function(){ if(!dogImg) dogImg = loadImage('assets/dog.svg'); })) : null;
  if(!birdImg) birdImg = (typeof loadImage === 'function') ? (loadImage('assets/cockatiel.png', function(img){ if(!birdImg) birdImg = img; }, function(){ if(!birdImg) birdImg = loadImage('assets/cockatiel.svg'); })) : null;
  if(!fishImg) fishImg = (typeof loadImage === 'function') ? (loadImage('assets/fish.png', function(img){ if(!fishImg) fishImg = img; }, function(){ if(!fishImg) fishImg = loadImage('assets/fish.svg'); })) : null;
  if(!capyImg) capyImg = (typeof loadImage === 'function') ? (loadImage('assets/capy.png', function(img){ if(!capyImg) capyImg = img; }, function(){ if(!capyImg) capyImg = loadImage('assets/capy.svg'); })) : null;
}
function setup(){
  // create canvas sized to the CSS container to avoid clipping
  const container = (typeof document !== 'undefined') ? document.getElementById('canvas-container') : null;
  const defaultW = 960, defaultH = 420;
  const w = container ? Math.max(320, container.clientWidth) : defaultW;
  const h = container ? Math.max(240, container.clientHeight) : defaultH;
  const c = createCanvas(w, h);
  c.parent('canvas-container');
  imageMode(CENTER); textFont('Arial');
  // robust canvas sizing: compute available width/height from layout and resize canvas
  try{
    if(typeof window !== 'undefined'){
      const computeAndResizeCanvas = function(){
        try{
          // Measure top UI height (controls/header)
          const uiEl = document.getElementById('ui');
          const liveEl = document.getElementById('live-counts');
          const arenaWrap = document.getElementById('arena-wrap');
          const viewportW = Math.max(window.innerWidth || 0, document.documentElement.clientWidth || 0);
          const viewportH = Math.max(window.innerHeight || 0, document.documentElement.clientHeight || 0);
          const topGap = uiEl ? (uiEl.getBoundingClientRect().bottom || 72) : 72;
          const liveH = (liveEl && window.getComputedStyle(liveEl).display !== 'none') ? (liveEl.getBoundingClientRect().height + 12) : 0;
          // available height for arena area
          // Use a larger minimum height so the battlefield is comfortably tall on desktop
          // Reduce the bottom buffer and bump the minimum to make the field visibly taller
          const availH = Math.max(520, Math.floor(viewportH - topGap - liveH - 4)); // 4px bottom buffer, 520px min
          // ensure the CSS container matches the computed height so the flex layout reserves space
          try{ if(container && container.style){ container.style.minHeight = availH + 'px'; container.style.height = availH + 'px'; } }catch(e){}
          // width: let arenaWrap control; canvas container is 70% via CSS
          const canvasRect = container.getBoundingClientRect();
          const availW = Math.max(320, Math.floor(canvasRect.width));
          if(width !== availW || height !== availH) resizeCanvas(availW, availH);
          // ensure parent still set (p5 may be recreated in some environments)
          const c = document.querySelector('#canvas-container canvas');
          if(c) c.style.display = 'block';
        }catch(e){ /* ignore measurement errors */ }
      };
      // debounce
      let resizeTimer = null;
      window.addEventListener('resize', function(){ if(resizeTimer) clearTimeout(resizeTimer); resizeTimer = setTimeout(computeAndResizeCanvas, 120); });
      // observe live-counts changes (they affect available height)
      const liveEl = document.getElementById('live-counts');
      if(liveEl && window.MutationObserver){
        const mo = new MutationObserver(function(){ if(resizeTimer) clearTimeout(resizeTimer); resizeTimer = setTimeout(computeAndResizeCanvas, 80); });
        mo.observe(liveEl, { attributes:true, childList:true, subtree:true });
      }
      // initial deferred resize after layout settles
      setTimeout(computeAndResizeCanvas, 60);
    }
  }catch(e){}
  // startup info: helpful when debugging why console logs don't appear
  try{
    if(typeof window !== 'undefined'){
      // Enable dog debug logs by default so AI decisions print to the browser console.
      // Users can override by setting `window.DEBUG_DOGS = false` in the DevTools console.
  // keep verbose debug off by default; enable in console with: window.DEBUG_DOGS = true
  if(typeof window.DEBUG_DOGS !== 'boolean') window.DEBUG_DOGS = false;
  console.log('sketch.js loaded — DEBUG_DOGS =', window.DEBUG_DOGS, '; enable with: window.DEBUG_DOGS = true');
    }
  }catch(e){}
  const _startBtn = document.getElementById('startBtn');
  if(_startBtn){ _startBtn.addEventListener('click', ()=>{ if(!running){ if(gameOver){ resetGame(); } else { startGame(); } } }); }
  const _restartBtn = document.getElementById('restartBtn');
  if(_restartBtn){ _restartBtn.addEventListener('click', ()=>{ resetGame(); }); }
  const _themeBtn = document.getElementById('themeBtn');
  if(_themeBtn){ _themeBtn.addEventListener('click', switchTheme); }
  const _pauseBtn = document.getElementById('pauseBtn');
  if(_pauseBtn){ _pauseBtn.addEventListener('click', togglePause); }
  const _clearRankingBtn = document.getElementById('clearRankingBtn');
  if(_clearRankingBtn){
    _clearRankingBtn.addEventListener('click', () => {
      // reset win counters
      catWins = 0; dogWins = 0; birdWins = 0; fishWins = 0; capyWins = 0;
      // clear saved match histories as well
      gameHistories = [];
      // reset ranking start time and persist changes
      rankingStartTime = millis();
      saveRanking();
      // update UI counts and hide history menu if open
      try{
        if(typeof updateLiveCounts === 'function') updateLiveCounts();
        const menu = document.getElementById('historyMenu');
        if(menu){ menu.innerHTML = ''; menu.style.display = 'none'; }
      }catch(e){ /* ignore UI refresh errors */ }
    });
  }
  const _historyBtn = document.getElementById('historyBtn');
  if(_historyBtn){ _historyBtn.addEventListener('click', toggleHistoryMenu); }
  // Master volume / mute UI wiring (if audio module present)
  try{
    const volEl = document.getElementById('masterVolume');
    // initialize live counts & rankings immediately so UI shows zeros before game starts
    const updateLiveCounts = function(){
      try{
        // Keep updating side ranking counts (these live in the side panel)
        const rCats = document.getElementById('rank-cats'); if(rCats) rCats.textContent = getCatName() + ': ' + catWins;
        const rDogs = document.getElementById('rank-dogs'); if(rDogs) rDogs.textContent = getDogName() + ': ' + dogWins;
        const rBirds = document.getElementById('rank-birds'); if(rBirds) rBirds.textContent = getBirdName() + ': ' + birdWins;
        const rFish = document.getElementById('rank-fish'); if(rFish) rFish.textContent = getFishName() + ': ' + fishWins;
        const rCapy = document.getElementById('rank-capy'); if(rCapy) rCapy.textContent = getCapyName() + ': ' + capyWins;
      }catch(e){}
    };
    // call once after setup layout
    setTimeout(updateLiveCounts, 80);
    const volLabel = document.getElementById('masterVolumeLabel');
    const muteBtn = document.getElementById('muteBtn');
    if(window.catDogAudio){
      // initialize slider from saved value
      const cur = Math.round((window.catDogAudio.getMasterVolume ? window.catDogAudio.getMasterVolume() : 1.0) * 100);
      if(volEl) { volEl.value = cur; }
      if(volLabel) { volLabel.textContent = cur + '%'; }
      // initialize mute icon
      const isMuted = window.catDogAudio.isMuted ? window.catDogAudio.isMuted() : false;
      if(muteBtn) muteBtn.textContent = isMuted ? '🔇' : '🔊';
      // events
      if(volEl){ volEl.addEventListener('input', function(){ const v = Math.round(Number(this.value) || 0) / 100; if(window.catDogAudio.setMasterVolume) window.catDogAudio.setMasterVolume(v); if(volLabel) volLabel.textContent = Math.round(v*100) + '%'; if(window.catDogAudio.isMuted && window.catDogAudio.isMuted()) { if(window.catDogAudio.setMute) window.catDogAudio.setMute(false); if(muteBtn) muteBtn.textContent = '🔊'; } }); }
      if(muteBtn){ muteBtn.addEventListener('click', function(){ if(window.catDogAudio.toggleMute){ const m = window.catDogAudio.toggleMute(); this.textContent = m ? '🔇' : '🔊'; } }); }
    }
  }catch(e){ console.warn('Audio UI wiring failed', e); }
  // clamp inputs to max 100
  const numCatsEl = document.getElementById('numCats');
  if(numCatsEl){ numCatsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(1, parseInt(this.value) || 1)); }); }
  const numDogsEl = document.getElementById('numDogs');
  if(numDogsEl){ numDogsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(1, parseInt(this.value) || 1)); }); }
  const numBirdsEl = document.getElementById('numBirds');
  if(numBirdsEl){ numBirdsEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(0, parseInt(this.value) || 0)); }); }
  const numCapyEl = document.getElementById('numCapy');
  if(numCapyEl){ numCapyEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(0, parseInt(this.value) || 0)); }); }
  const numFishEl = document.getElementById('numFish');
  if(numFishEl){ numFishEl.addEventListener('input', function() { this.value = Math.min(100, Math.max(0, parseInt(this.value) || 0)); }); }
  // Load ranking from localStorage
  catWins = parseInt(localStorage.getItem('catWins')) || 0;
  dogWins = parseInt(localStorage.getItem('dogWins')) || 0;
  birdWins = parseInt(localStorage.getItem('birdWins')) || 0;
  fishWins = parseInt(localStorage.getItem('fishWins')) || 0;
  capyWins = parseInt(localStorage.getItem('capyWins')) || 0;
  gameHistories = JSON.parse(localStorage.getItem('gameHistories')) || [];
}

// centralized capybara spawner - clears existing array and spawns n capybaras
function spawnCapybaras(n){
  if(!n || n <= 0){ capybaras = []; initialCapy = 0; return 0; }
  capybaras = [];
  for(let i=0;i<n;i++){
    capybaras.push({ x: random(60, width-60), y: random(60, height-60), hp:110, maxHp:110, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:30, moveSpeed:1.35, attackCooldown:640, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.05, walkRegenPerSec: random(0.6,1.3), fleeSpeed:1.6, species: 'capy' });
  }
  initialCapy = n;
  return n;
}

function saveRanking() {
  localStorage.setItem('catWins', catWins);
  localStorage.setItem('dogWins', dogWins);
  localStorage.setItem('birdWins', birdWins);
  localStorage.setItem('fishWins', fishWins);
  localStorage.setItem('capyWins', capyWins);
  localStorage.setItem('gameHistories', JSON.stringify(gameHistories));
}

function updateTimer() {
  if (startTime) {
    const elapsed = Math.floor(((Date.now() - startTime) - pausedAccum) / 1000);
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

function togglePause(){
  if(!running || gameOver) return;
  paused = !paused;
  const btn = document.getElementById('pauseBtn');
  if(paused){
    pauseStart = Date.now();
    if(btn) btn.textContent = 'Resume';
  } else {
    // accumulate paused time
    pausedAccum += (Date.now() - pauseStart) || 0;
    if(btn) btn.textContent = 'Pause';
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
          details += `.<br>Iniciais: ${h.initialCats} ${getCatsName().toLowerCase()}, ${h.initialDogs} ${getDogsName().toLowerCase()}`;
          if(h.initialBirds !== undefined) details += `, ${h.initialBirds} ${getBirdsName().toLowerCase()}`;
          if(h.initialFish !== undefined) details += `, ${h.initialFish} ${getFishsName().toLowerCase()}`;
          if(h.initialCapy !== undefined) details += `, ${h.initialCapy} ${getCapysName().toLowerCase()}`;
          details += `.`;
          details += `<br>Mortos: ${h.killedCats} ${getCatsName().toLowerCase()}, ${h.killedDogs} ${getDogsName().toLowerCase()}`;
          if(h.killedBirds !== undefined) details += `, ${h.killedBirds} ${getBirdsName().toLowerCase()}`;
          if(h.killedFish !== undefined) details += `, ${h.killedFish} ${getFishsName().toLowerCase()}`;
          if(h.killedCapy !== undefined) details += `, ${h.killedCapy} ${getCapysName().toLowerCase()}`;
          details += `.`;
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
  currentTheme = currentTheme === 'catdog' ? 'family' : 'catdog';
  const themeBtn = document.getElementById('themeBtn');
  if(themeBtn){
    themeBtn.textContent = currentTheme === 'catdog' ? 'Switch to Family Mode' : 'Switch to Cat vs Dog';
  }
  // Update labels
  document.title = currentTheme === 'catdog' ? 'Gato vs Cachorro' : 'Modo Família';
  const numCatsLabel = document.querySelector('label:has(#numCats)');
  if(numCatsLabel){ numCatsLabel.innerHTML = getCatsName() + ': <input id="numCats" type="text" value="' + numCatsLabel.querySelector('#numCats').value + '" />'; }
  const numDogsLabel = document.querySelector('label:has(#numDogs)');
  if(numDogsLabel){ numDogsLabel.innerHTML = getDogsName() + ': <input id="numDogs" type="text" value="' + numDogsLabel.querySelector('#numDogs').value + '" />'; }
  // Optionally reset the game to apply the new theme
  if(running || gameOver){ resetGame(); }
}

// Headless simulation runner: runs N matches (no rendering) and reports stats
function runSimulations(runs){
  const results = { cats:0, dogs:0, draws:0, totalTurns:0 };
  const aliveBirdTotals = { sum: 0 };
  const aliveFishTotals = { sum: 0 };
  for(let i=0;i<runs;i++){
    const nCats = Math.max(1, parseInt(document.getElementById('numCats').value||10));
    const nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||10));
    const nBirds = Math.max(0, parseInt(document.getElementById('numBirds').value||10));
    const nFish = Math.max(0, parseInt(document.getElementById('numFish').value||10));
    // seed a match
    initMatchStateForSim(nCats, nDogs);
    // 3 minutes timeout: 180000 ms. We simulate in discrete turns; align with runner tick (100ms)
    let turns = 0; const TICK_MS = 100; const MAX_TURNS = Math.ceil((3 * 60 * 1000) / TICK_MS); // 1800
    while(!isMatchOver() && turns++ < MAX_TURNS){ updateEntitiesSim(); }
    const ac = cats.filter(x=>x.hp>0).length; const ad = dogs.filter(x=>x.hp>0).length;
    const ab = birds.filter(x=>x.hp>0).length; const af = fish.filter(x=>x.hp>0).length; const acapy = capybaras.filter(x=>x.hp>0).length;
    aliveBirdTotals.sum += ab;
    aliveFishTotals.sum += af;
    // Determine winner: choose species with most living members; if tied, break tie by sum of HP; otherwise draw
    const counts = { cat: ac, dog: ad, bird: ab, fish: af, capy: acapy };
    const entries = Object.entries(counts);
    let maxCount = 0; for(const [,c] of entries) if(c > maxCount) maxCount = c;
    if(maxCount === 0){ results.draws++; }
    else {
      const winners = entries.filter(([k,c]) => c === maxCount).map(([k])=>k);
      if(winners.length === 1){ if(winners[0] === 'cat') results.cats++; else if(winners[0] === 'dog') results.dogs++; else results.draws++; }
      else {
        // tie on counts: compute total HP per tied species and pick the highest; if still tied -> draw
        const totalHp = {
          cat: cats.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
          dog: dogs.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
          bird: birds.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
          fish: fish.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
          capy: capybaras.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0)
        };
        let best = null; let bestHp = -1; let tiedHp = [];
        for(const w of winners){ const hp = totalHp[w] || 0; if(hp > bestHp){ bestHp = hp; best = w; tiedHp = [w]; } else if(hp === bestHp){ tiedHp.push(w); } }
        if(tiedHp.length === 1){ if(best === 'cat') results.cats++; else if(best === 'dog') results.dogs++; else results.draws++; }
        else results.draws++;
      }
    }
    results.totalTurns += turns;
  }
  const avgBirds = Math.round((aliveBirdTotals.sum || 0) / runs);
  const avgFish = Math.round((aliveFishTotals.sum || 0) / runs);
  const out = `Simulações: ${runs} | ${getCatsName()}: ${results.cats} | ${getDogsName()}: ${results.dogs} | Empates: ${results.draws} | Turnos médios: ${Math.round(results.totalTurns / runs)} | ${getBirdsName()} médias vivas: ${avgBirds} | ${getFishName()} médios vivos: ${avgFish}`;
  document.getElementById('simResults').textContent = out;
  // restore any visual state
  startGame();
}

// initialize arrays for simulation (no DOM, no rendering). Reuse same entity structures.
function initMatchStateForSim(nCats,nDogs){
  cats = []; dogs = []; birds = []; fish = []; capybaras = []; hideSpots = [];
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
    const factoryCat = (window && window.createCat) ? window.createCat : null;
    if(factoryCat){ cats.push(factoryCat(random(60, width-60), random(60, height-60), { hp:110, maxHp:110, walkRegenPerSec: 1.0 })); }
    else { cats.push({ x: random(60, width-60), y: random(60, height-60), hp:110, maxHp:110, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:26, moveSpeed: 1.7, attackCooldown: 600, speciesDamageMultiplier: 1.0, hiddenRegenBonus: 1.25, walkRegenPerSec: 1.0, fleeSpeed: 3, species: 'cat' }); }
  }
  for(let j=0;j<nDogs;j++){
  const factoryDog = (window && window.createDog) ? window.createDog : null;
  if(factoryDog){ dogs.push(factoryDog(random(60, width-60), random(60, height-60), { hp:105, maxHp:105, walkRegenPerSec: random(1.8,3.0) })); }
  else { dogs.push({ x: random(60, width-60), y: random(60, height-60), hp:105, maxHp:105, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:32, moveSpeed: 1.55, attackCooldown: 680, speciesDamageMultiplier: 1.05, hiddenRegenBonus: 1.0, walkRegenPerSec: random(1.5,2.8), fleeSpeed: 1, species: 'dog' }); }
  }
  // spawn small flocks of birds allied to cats for simulation
  const nBirds = Math.max(0, Math.floor(nCats * 0.7));
  for(let b=0;b<nBirds;b++) birds.push({ x: random(60, width-60), y: random(60, height-60), hp:70, maxHp:70, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.4, attackCooldown:420, speciesDamageMultiplier:0.95, hiddenRegenBonus:1.05, walkRegenPerSec: random(0.6,1.2), fleeSpeed:3, species: 'bird' });
  // spawn fish allied to dogs for simulation
  const nFish = Math.max(0, Math.floor(nDogs * 0.7));
  for(let f=0; f<nFish; f++) fish.push({ x: random(60, width-60), y: random(60, height-60), hp:75, maxHp:75, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.25, attackCooldown:620, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: random(0.6,1.4), fleeSpeed:1.5, species: 'fish' });
  // spawn small capy herds allied to cats
  const nCapy = Math.floor(nCats * 0.15);
  // use centralized spawner to avoid accidental double-spawn when multiple init paths exist
  spawnCapybaras(nCapy);
  // substituir pássaros/fish usando factories quando disponíveis
  // (Esta parte será refeita no startGame abaixo também para inicialização de UI)
  const factoryBird = (window && window.createBird) ? window.createBird : null;
  const nBirdsLocal = Math.floor(nCats * 0.4);
  birds = [];
  for(let b=0;b<nBirdsLocal;b++){
    if(factoryBird) birds.push(factoryBird(random(60, width-60), random(60, height-60), { walkRegenPerSec: random(0.5,1.0) }));
    else birds.push({ x: random(60, width-60), y: random(60, height-60), hp:60, maxHp:60, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.2, attackCooldown:400, speciesDamageMultiplier:0.9, hiddenRegenBonus:1.1, walkRegenPerSec: random(0.5,1.0), fleeSpeed:3, species: 'bird' });
  }
  const factoryFish = (window && window.createFish) ? window.createFish : null;
  const nFishLocal = Math.floor(nDogs * 0.4);
  fish = [];
  for(let f=0; f<nFishLocal; f++){
    if(factoryFish) fish.push(factoryFish(random(60, width-60), random(60, height-60), { walkRegenPerSec: random(0.5,1.5) }));
    else fish.push({ x: random(60, width-60), y: random(60, height-60), hp:80, maxHp:80, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.2, attackCooldown:600, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: random(0.5,1.5), fleeSpeed:1.5, species: 'fish' });
  }
}

// return true only when exactly one species still has living members
function isMatchOver(){
  // Count living members (hp>0) per species
  const counts = {
    cat: cats.filter(x=>x.hp>0).length,
    dog: dogs.filter(x=>x.hp>0).length,
    bird: birds.filter(x=>x.hp>0).length,
    fish: fish.filter(x=>x.hp>0).length,
    capy: capybaras.filter(x=>x.hp>0).length
  };
  const livingSpecies = Object.keys(counts).filter(k=>counts[k] > 0);
  // If zero or multiple species still have living members, match is not over
  if(livingSpecies.length > 1) return false;
  if(livingSpecies.length === 0) return true;
  // Exactly one species remains with hp>0. Avoid declaring match over if all its members are hidden
  const remaining = livingSpecies[0];
  const pools = { cat: cats, dog: dogs, bird: birds, fish: fish, capy: capybaras };
  const visibleAlive = (pools[remaining] || []).filter(e => e && e.hp > 0 && !e.hidden).length;
  // If there is at least one visible (non-hidden) alive member, match is over. Otherwise continue so hidden entities can unhide/regenerate.
  return visibleAlive > 0;
}

// helper: return array of living enemy entities for a given entity (any species != own)
function livingEnemiesOf(entity){
  const pools = [...cats, ...dogs, ...birds, ...fish, ...capybaras];
  return pools.filter(e=>e && e.hp>0 && !e.hidden && e.species && e.species !== entity.species);
}

// fast, simplified update loop for simulation: reuse update logic but avoid heavy drawing/particle ops
function updateEntitiesSim(){ // reuse updateEntities() internals but avoid creating particles or DOM reads
  // for simplicity call updateEntities which is already mostly logic; it will run quickly without drawing
  updateEntities();
}

function startGame(){
  // read config
  // runtime sanity: ensure species abilities have been loaded by loader.js; if not, try to load it dynamically and retry
  try{
    const missing = (!Array.isArray(catAbilities) || catAbilities.length === 0) || (!Array.isArray(dogAbilities) || dogAbilities.length === 0) || (!Array.isArray(birdAbilities) || birdAbilities.length === 0) || (!Array.isArray(fishAbilities) || fishAbilities.length === 0);
    if(typeof window !== 'undefined' && missing){
      console.warn('Species ability pools appear empty in the browser; attempting to load scripts/species/loader.js dynamically.');
      const mod = document.createElement('script'); mod.type = 'module'; mod.src = 'scripts/species/loader.js';
      mod.onload = function(){ console.log('Dynamic species loader loaded; retrying startGame shortly.'); setTimeout(startGame, 80); };
      mod.onerror = function(){ console.warn('Failed to dynamically load species loader. Abilities may be empty.'); };
      document.head.appendChild(mod);
      return; // wait for loader to populate abilities and retry
    }
  }catch(e){ console.warn('Error checking species loader', e); }

  let nCats = Math.max(1, parseInt(document.getElementById('numCats').value||10));
  let nDogs = Math.max(1, parseInt(document.getElementById('numDogs').value||10));
  let nBirds = Math.max(0, parseInt(document.getElementById('numBirds').value||10));
  let nFish = Math.max(0, parseInt(document.getElementById('numFish').value||10));
  let nCapy = Math.max(0, parseInt(document.getElementById('numCapy') ? document.getElementById('numCapy').value || 0 : 0));
  // enforce global cap
  const MAX_ENTITIES = 100;
  nCats = Math.min(nCats, MAX_ENTITIES);
  nDogs = Math.min(nDogs, MAX_ENTITIES);
  initialCats = nCats;
  initialDogs = nDogs;
  initialBirds = nBirds;
  initialFish = nFish;
  cats = []; dogs = []; birds = []; fish = []; capybaras = []; hideSpots = [];
  // Debug: print loaded ability pool sizes and a sample ability for each species to the console
  try{
    console.log('Ability pools sizes — cat:', (catAbilities||[]).length, 'dog:', (dogAbilities||[]).length, 'bird:', (birdAbilities||[]).length, 'fish:', (fishAbilities||[]).length, 'capy:', (capyAbilities||[]).length);
    if(window.DEBUG_DOGS){ console.log('catAbilities sample:', (catAbilities||[])[0]); console.log('dogAbilities sample:', (dogAbilities||[])[0]); console.log('birdAbilities sample:', (birdAbilities||[])[0]); console.log('fishAbilities sample:', (fishAbilities||[])[0]); }
  }catch(e){ }
  // create hide spots (fixed at 10)
  const spots = 10;
  // rebalance hide spot types according to allied counts: cats+birds vs dogs+fish
  const alliedCats = nCats + nBirds + nCapy;
  const alliedDogs = nDogs + nFish;
  const totalAllies = Math.max(1, alliedCats + alliedDogs);
  const treesDesired = Math.round(spots * (alliedCats / totalAllies));
  for(let i=0;i<spots;i++){
    const type = (i < treesDesired) ? 'tree' : 'rock';
    const r = 60; // increased radius for larger hide spots
    hideSpots.push({ x: random(80, width-80), y: random(60, height-60), type: type, radius: r });
  }
  // spawn cats and dogs spread across the arena
  for(let i=0;i<nCats;i++){
    cats.push({ x: random(60, width-60), y: random(60, height-60), hp:140, maxHp:140, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:28,
      // cat traits (balanced): moderate HP, decent speed and regen
      moveSpeed: 1.8, attackCooldown: 600, speciesDamageMultiplier: 1.15, hiddenRegenBonus: 1.15, walkRegenPerSec: random(1.2,2.0), fleeSpeed: 3, species: 'cat'
    });
  }
  for(let j=0;j<nDogs;j++){
    dogs.push({ x: random(60, width-60), y: random(60, height-60), hp:110, maxHp:110, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:32,
      // dog traits (balanced): slightly higher HP and damage, balanced speed
      moveSpeed: 1.55, attackCooldown: 680, speciesDamageMultiplier: 1.05, hiddenRegenBonus: 1.0, walkRegenPerSec: random(1.2,2.6), fleeSpeed: 1, species: 'dog'
    });
  }
  // spawn birds (allied to cats)
  for(let b=0;b<nBirds;b++){
    birds.push({ x: random(60, width-60), y: random(60, height-60), hp:70, maxHp:70, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:20, moveSpeed:2.4, attackCooldown:420, speciesDamageMultiplier:0.95, hiddenRegenBonus:1.05, walkRegenPerSec: random(0.6,1.2), fleeSpeed:3, species: 'bird' });
  }
  // spawn fish (allied to dogs)
  for(let f=0;f<nFish;f++){
    fish.push({ x: random(60, width-60), y: random(60, height-60), hp:75, maxHp:75, dmgMult:1, speedMult:1, buffUntil:0, lastAttack:0, hidden:false, hideUntil:0, radius:22, moveSpeed:1.25, attackCooldown:620, speciesDamageMultiplier:1.0, hiddenRegenBonus:1.0, walkRegenPerSec: random(0.6,1.4), fleeSpeed:1.5, species: 'fish' });
  }
  // spawn capybaras allied to cats via centralized spawner
  initialCapy = spawnCapybaras(nCapy);
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
  const counts = {
    cat: cats.filter(x=>x.hp>0).length,
    dog: dogs.filter(x=>x.hp>0).length,
    bird: birds.filter(x=>x.hp>0).length,
    fish: fish.filter(x=>x.hp>0).length
  };
  // include capybara counts
  counts.capy = capybaras.filter(x=>x.hp>0).length;
  const livingSpecies = Object.keys(counts).filter(k=>counts[k] > 0);
  // End match if only one species remains OR if 3 minutes have elapsed.
  const elapsedMs = startTime ? (Date.now() - startTime - (pausedAccum || 0)) : 0;
  const TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
  if(livingSpecies.length <= 1 || elapsedMs >= TIMEOUT_MS){
    running = false; gameOver = true;
    let winnerKey = livingSpecies.length === 1 ? livingSpecies[0] : null;
    // If time expired and multiple species remain, pick the species with the most alive members
    if(!winnerKey && elapsedMs >= TIMEOUT_MS){
      const entries = Object.entries(counts); // [ [species, count], ... ]
      let maxCount = 0; for(const [,c] of entries) if(c > maxCount) maxCount = c;
      if(maxCount > 0){
        const winners = entries.filter(([k,c]) => c === maxCount).map(([k])=>k);
        if(winners.length === 1) {
          winnerKey = winners[0];
        } else {
          // tie on counts -> break tie by total HP across tied species
          const totalHp = {
            cat: cats.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
            dog: dogs.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
            bird: birds.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
            fish: fish.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0),
            capy: capybaras.reduce((s,e)=> s + Math.max(0, e.hp || 0), 0)
          };
          let best = null; let bestHp = -1; let tiedHp = [];
          for(const w of winners){ const hp = totalHp[w] || 0; if(hp > bestHp){ bestHp = hp; best = w; tiedHp = [w]; } else if(hp === bestHp){ tiedHp.push(w); } }
          if(tiedHp.length === 1) winnerKey = best; // otherwise remains null (draw)
        }
      }
    }
  const winnerName = winnerKey === 'cat' ? getCatsName() : winnerKey === 'dog' ? getDogsName() : winnerKey === 'bird' ? getBirdsName() : winnerKey === 'fish' ? getFishName() : winnerKey === 'capy' ? getCapyName() : 'Ninguém';
    const winnerAlive = winnerKey ? counts[winnerKey] : 0;
    const elapsed = startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const timeStr = minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    // compute killed per species
    const killedCats = initialCats - counts.cat;
    const killedDogs = initialDogs - counts.dog;
    const killedBirds = initialBirds - counts.bird;
    const killedFish = initialFish - counts.fish;
    const killedCapy = initialCapy - counts.capy;
    gameHistories.push({
      winner: winnerName,
      winnerKey: winnerKey,
      alive: winnerAlive,
      time: timeStr,
      date: new Date().toLocaleString(),
      initialCats: initialCats,
      initialDogs: initialDogs,
      initialBirds: initialBirds,
      initialFish: initialFish,
      initialCapy: initialCapy,
      killedCats: killedCats,
      killedDogs: killedDogs,
      killedBirds: killedBirds,
      killedFish: killedFish
      , killedCapy: killedCapy
    });
    if (gameHistories.length > 10) gameHistories.shift();
    // Increment wins for the winner species
    if(winnerKey === 'cat') catWins++;
    else if(winnerKey === 'dog') dogWins++;
  else if(winnerKey === 'bird') birdWins++;
  else if(winnerKey === 'fish') fishWins++;
  else if(winnerKey === 'capy') capyWins++;
    saveRanking();
    stopTimer();
    const _msgEnd = document.getElementById('message'); if(_msgEnd) _msgEnd.textContent = winnerName + ' venceu!';
    setTimeout(()=>{ showGameOverOverlay(winnerKey); },200);
    // Auto restart after 10 seconds if enabled
    if (document.getElementById('autoRestartCb').checked) {
      setTimeout(() => { resetGame(); }, 10000);
    }
  }
}
// drawGameOver & showGameOverOverlay moved earlier so draw() can call them
function showGameOverOverlay(winnerKey){
  const container = document.getElementById('canvas-container') || document.body;
  let ov = document.getElementById('gameOver');
  if(!ov){ ov = document.createElement('div'); ov.id='gameOver'; container.appendChild(ov); }
  const winnerLabel = winnerKey === 'cat' ? getCatsName() : winnerKey === 'dog' ? getDogsName() : winnerKey === 'bird' ? getBirdsName() : winnerKey === 'fish' ? getFishName() : 'Empate';
  ov.innerHTML = '<div style="font-size:24px;font-weight:700;margin-bottom:8px;">Parabéns!</div>' +
                '<div style="font-size:18px;margin-bottom:12px;">' + winnerLabel + ' venceu o duelo!</div>' +
                '<button id="reloadBtn">Jogar novamente</button>';
  const btn = ov.querySelector('#reloadBtn'); if(btn){ btn.addEventListener('click', ()=>{ resetGame(); }); }
}

function drawGameOver(){ /* placeholder: left intentionally minimal */ }

// ensure overlay functions are global
try{ if(typeof window !== 'undefined'){ window.showGameOverOverlay = showGameOverOverlay; window.drawGameOver = drawGameOver; } }catch(e){}

// drawCatSprite & drawDogSprite moved above draw() to ensure they are defined
function drawCatSprite(x,y,size,ent){ // simple stylized cat face & body
  if(currentTheme === 'family'){
    // show Elizabeth for cats in family mode
    if(typeof elizabethImg !== 'undefined' && elizabethImg) image(elizabethImg, x, y, size * 2.0, size * 2.0);
    if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.28, y - size*0.4, 8,8); }
    return;
  }
  // prefer loaded cat image when available
  if(typeof catImg !== 'undefined' && catImg){ image(catImg, x, y, size * 1.8, size * 1.8); if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.28, y - size*0.4, 8,8); } return; }
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
  // If family theme, use Maysa portrait
  if(currentTheme === 'family'){
    // show Maysa for dogs in family mode (slightly smaller)
    if(typeof maysaImg !== 'undefined' && maysaImg){ image(maysaImg, x, y, size * 1.6, size * 1.6); }
    if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.34, y - size*0.5, 8,8); }
    return;
  }

  // Prefer to use the loaded dog image (SVG/PNG) when available for richer visuals
  if(typeof dogImg !== 'undefined' && dogImg){
    image(dogImg, x, y, size * 1.6, size * 1.6);
    if(ent && ent.dmgMult > 1){ noStroke(); fill('#ffd24a'); ellipse(x + size*0.34, y - size*0.5, 8,8); }
    return;
  }

  // Fallback: draw the stylized vector dog if no image is available
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
  pop();
}

// ensure sprite draw functions are available on the global/window object
try{ if(typeof window !== 'undefined'){ window.drawCatSprite = drawCatSprite; window.drawDogSprite = drawDogSprite; } }catch(e){}

function draw(){ background(255);
  // arena
  fill(240); rect(0,0,width,height);
  // update
  if(running && !gameOver){
    if(!paused){
      updateEntities();
      checkMatchEnd();
    }
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
  // draw birds (bigger)
  for(const b of birds){ push(); translate(b.x,b.y);
    if(currentTheme === 'family'){
      // larger size for Mayara to match family-mode proportions
      if(mayaraImg) image(mayaraImg,0,0,64,64);
      else if(birdImg) image(birdImg,0,0,64,64);
      else drawCatSprite(0,0,28,b);
    } else {
      if(birdImg) image(birdImg,0,0,40,40); else drawCatSprite(0,0,28,b);
    }
    if(b.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,36,36); }
    pop(); }
  // draw fish (bigger)
  for(const f of fish){ push(); translate(f.x,f.y);
    if(currentTheme === 'family'){
      // larger size for Juliano to match family-mode proportions
      if(julianoImg) image(julianoImg,0,0,76,76);
      else if(fishImg) image(fishImg,0,0,76,76);
      else drawDogSprite(0,0,32,f);
    } else {
      if(fishImg) image(fishImg,0,0,44,44); else drawDogSprite(0,0,32,f);
    }
    if(f.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,42,42); }
    pop(); }
  // draw capybaras
  for(const cp of capybaras){ push(); translate(cp.x,cp.y);
    if(currentTheme === 'family'){
      // prefer Yasmin's face; if missing, show the generic capy image if available
      if(yasminImg) image(yasminImg,0,0,64,64);
      else if(capyImg) image(capyImg,0,0,64,64);
      else drawCatSprite(0,0,30,cp);
    } else {
      // non-family: prefer the capy SVG if present, otherwise fall back to dog/cat sprites
      if(capyImg) image(capyImg,0,0,48,48);
      else if(typeof dogImg !== 'undefined') drawDogSprite(0,0,34,cp);
      else drawCatSprite(0,0,30,cp);
    }
    if(cp.hidden) { noStroke(); fill(255,255,255,120); ellipse(0,0,40,40); }
    pop(); }
  // HUD
  // HUD bars
  drawHud();
  // debug overlay: show theme and whether family images are loaded (only when DEBUG_DOGS true)
  try{
    if(typeof window !== 'undefined' && window.DEBUG_DOGS){ push(); noStroke(); fill(0,0,0,180); rect(200,8,360,60,6); fill(255); textAlign(LEFT,TOP); textSize(12);
      text('Theme: ' + currentTheme, 206, 12);
      text('yasminImg: ' + (yasminImg ? 'ok' : 'null') + ' | capyImg: ' + (capyImg ? 'ok' : 'null'), 206, 30);
      pop(); }
  }catch(e){}
  // remove dead entities from arrays (so they disappear)
  const beforeCats = cats.length; cats = cats.filter(c=> c.hp > 0);
  const beforeDogs = dogs.length; dogs = dogs.filter(d=> d.hp > 0);
  const beforeBirds = birds.length; birds = birds.filter(b => b.hp > 0);
  const beforeFish = fish.length; fish = fish.filter(f => f.hp > 0);
  const beforeCapy = capybaras.length; capybaras = capybaras.filter(c => c.hp > 0);
  // ...existing code...
  // ...existing code...
  // update lateral ranking DOM elements (keep the canvas free of duplicate UI)
  try{
    if(typeof document !== 'undefined'){
      const rCats = document.getElementById('rank-cats'); if(rCats) rCats.textContent = getCatName() + ': ' + catWins;
      const rDogs = document.getElementById('rank-dogs'); if(rDogs) rDogs.textContent = getDogName() + ': ' + dogWins;
      const rBirds = document.getElementById('rank-birds'); if(rBirds) rBirds.textContent = getBirdName() + ': ' + birdWins;
      const rFish = document.getElementById('rank-fish'); if(rFish) rFish.textContent = getFishName() + ': ' + fishWins;
      const rCapy = document.getElementById('rank-capy'); if(rCapy) rCapy.textContent = getCapyName() + ': ' + capyWins;
  // live counts: rendered inside canvas HUD now (see drawHud)
    }
  }catch(e){}
  // particles/effects
  drawParticles();
  // draw HP bars on top of everything
  for(const c of cats){ if(c.hp > 0) drawHpBar(c.x, c.y - 22, 24, c.hp, c.maxHp); }
  for(const d of dogs){ if(d.hp > 0) drawHpBar(d.x, d.y - 26, 28, d.hp, d.maxHp); }
  for(const b of birds){ if(b.hp > 0) drawHpBar(b.x, b.y - 22, 28, b.hp, b.maxHp); }
  for(const f of fish){ if(f.hp > 0) drawHpBar(f.x, f.y - 24, 32, f.hp, f.maxHp); }
  for(const cp of capybaras){ if(cp.hp > 0) drawHpBar(cp.x, cp.y - 24, 32, cp.hp, cp.maxHp); }
  if(gameOver){ drawGameOver(); }
  // paused overlay
  if(paused){ push(); fill(0,0,0,160); rect(0,0,width,height); fill(255); textAlign(CENTER,CENTER); textSize(36); text('PAUSED', width/2, height/2); pop(); }
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
  const totalBirdHp = birds.reduce((s,e)=>s + Math.max(0,e.hp),0);
  const totalFishHp = fish.reduce((s,e)=>s + Math.max(0,e.hp),0);
  const totalCapyHp = capybaras.reduce((s,e)=>s + Math.max(0,e.hp),0);
  // draw total team HP bars on canvas
  push();
  // compact 5-bars layout: cats, dogs, birds, fish, capy side-by-side
  const barW = 90; const barH = 10; const spacing = 8;
  const maxCatHpTotal = Math.max(1, cats.reduce((s,e)=>s + (e.maxHp||100),0));
  const maxDogHpTotal = Math.max(1, dogs.reduce((s,e)=>s + (e.maxHp||100),0));
  const maxBirdHpTotal = Math.max(1, birds.reduce((s,e)=>s + (e.maxHp||60),0));
  const maxFishHpTotal = Math.max(1, fish.reduce((s,e)=>s + (e.maxHp||80),0));
  const maxCapyHpTotal = Math.max(1, capybaras.reduce((s,e)=>s + (e.maxHp||100),0));
  const pctCat = constrain(totalCatHp / maxCatHpTotal, 0, 1);
  const pctDog = constrain(totalDogHp / maxDogHpTotal, 0, 1);
  const pctBird = constrain(totalBirdHp / maxBirdHpTotal, 0, 1);
  const pctFish = constrain(totalFishHp / maxFishHpTotal, 0, 1);
  const pctCapy = constrain(totalCapyHp / maxCapyHpTotal, 0, 1);
  const totalW = (barW * 5) + (spacing * 4);
  const cx = width/2; const y = 10;
  // background strip
  noStroke(); fill(0,0,0,120); rect(cx - totalW/2 - 8, y - 6, totalW + 16, barH + 34, 6);
  // draw each bar with label under it
  const baseX = cx - totalW/2;
  // cats
  stroke(0,0,0,150); strokeWeight(1); fill(80,160,255); rect(baseX, y, barW, barH, 4);
  noStroke(); fill(30,120,220); rect(baseX + 1, y + 1, (barW-2) * pctCat, barH-2, 3);
  fill(255); textSize(10); textAlign(CENTER,TOP); text(getCatsName(), baseX + barW/2, y + barH + 4);
  // draw live count badge
  const catsCount = cats.filter(x=>x.hp>0).length;
  if(typeof catsCount !== 'undefined'){
    push(); textSize(10); textAlign(LEFT,CENTER);
    const labelX = baseX + barW/2; const labelY = y + barH + 4;
    const badge = '' + catsCount; const bw = max(18, textWidth(badge) + 10);
    const bx = baseX + barW - bw/2; const by = y + barH + 4 - 6;
    fill(0,0,0,160); rect(bx - bw/2, by - 8, bw, 16, 8);
    fill(255); textAlign(CENTER,CENTER); text(badge, bx, by);
    pop();
  }
  // dogs
  const xDog = baseX + barW + spacing;
  stroke(0,0,0,150); strokeWeight(1); fill(255,140,100); rect(xDog, y, barW, barH, 4);
  noStroke(); fill(220,90,40); rect(xDog + 1, y + 1, (barW-2) * pctDog, barH-2, 3);
  fill(255); textSize(10); textAlign(CENTER,TOP); text(getDogsName(), xDog + barW/2, y + barH + 4);
  // dogs count badge
  const dogsCount = dogs.filter(x=>x.hp>0).length;
  if(typeof dogsCount !== 'undefined'){
    push(); textSize(10); textAlign(CENTER,CENTER);
    const badge = '' + dogsCount; const bw = max(18, textWidth(badge) + 10);
    const bx = xDog + barW - bw/2; const by = y + barH + 4 - 6;
    fill(0,0,0,160); rect(bx - bw/2, by - 8, bw, 16, 8);
    fill(255); text(badge, bx, by);
    pop();
  }
  // birds
  const xBird = xDog + barW + spacing;
  stroke(0,0,0,150); strokeWeight(1); fill(150,210,120); rect(xBird, y, barW, barH, 4);
  noStroke(); fill(60,180,80); rect(xBird + 1, y + 1, (barW-2) * pctBird, barH-2, 3);
  fill(255); textSize(10); textAlign(CENTER,TOP); text(getBirdsName(), xBird + barW/2, y + barH + 4);
  // birds count badge
  const birdsCount = birds.filter(x=>x.hp>0).length;
  if(typeof birdsCount !== 'undefined'){
    push(); textSize(10); textAlign(CENTER,CENTER);
    const badge = '' + birdsCount; const bw = max(18, textWidth(badge) + 10);
    const bx = xBird + barW - bw/2; const by = y + barH + 4 - 6;
    fill(0,0,0,160); rect(bx - bw/2, by - 8, bw, 16, 8);
    fill(255); text(badge, bx, by);
    pop();
  }
  // fish
  const xFish = xBird + barW + spacing;
  stroke(0,0,0,150); strokeWeight(1); fill(120,180,220); rect(xFish, y, barW, barH, 4);
  noStroke(); fill(40,140,200); rect(xFish + 1, y + 1, (barW-2) * pctFish, barH-2, 3);
  fill(255); textSize(10); textAlign(CENTER,TOP); text(getFishsName(), xFish + barW/2, y + barH + 4);
  // fish count badge
  const fishCount = fish.filter(x=>x.hp>0).length;
  if(typeof fishCount !== 'undefined'){
    push(); textSize(10); textAlign(CENTER,CENTER);
    const badge = '' + fishCount; const bw = max(18, textWidth(badge) + 10);
    const bx = xFish + barW - bw/2; const by = y + barH + 4 - 6;
    fill(0,0,0,160); rect(bx - bw/2, by - 8, bw, 16, 8);
    fill(255); text(badge, bx, by);
    pop();
  }
  // capybaras
  const xCapy = xFish + barW + spacing;
  stroke(0,0,0,150); strokeWeight(1); fill(140,200,150); rect(xCapy, y, barW, barH, 4);
  noStroke(); fill(70,170,100); rect(xCapy + 1, y + 1, (barW-2) * pctCapy, barH-2, 3);
  fill(255); textSize(10); textAlign(CENTER,TOP); text(getCapysName(), xCapy + barW/2, y + barH + 4);
  // capy count badge
  const capyCount = capybaras.filter(x=>x.hp>0).length;
  if(typeof capyCount !== 'undefined'){
    push(); textSize(10); textAlign(CENTER,CENTER);
    const badge = '' + capyCount; const bw = max(18, textWidth(badge) + 10);
    const bx = xCapy + barW - bw/2; const by = y + barH + 4 - 6;
    fill(0,0,0,160); rect(bx - bw/2, by - 8, bw, 16, 8);
    fill(255); text(badge, bx, by);
    pop();
  }
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
      // expire speed boost marker (from dash) if present
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
      const enemies = livingEnemiesOf(c);
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
    else {
      // If there are no visible enemies, cats should search for hidden enemies' spots
      // Consider any enemy species (dogs, birds, fish, capybaras) so cats help reveal hidden foes
      const enemyListForCats = [...dogs, ...birds, ...fish, ...capybaras];
      // use the hide spot radius (with small slack) instead of a hardcoded 30px
      const hiddenSpots = hideSpots.filter(s=> enemyListForCats.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y) < ((s.radius || 30) + 6)));
      if(hiddenSpots.length){
        const s = hiddenSpots[0];
        const ang = atan2(s.y - c.y, s.x - c.x);
        c.x += cos(ang)*1.7; c.y += sin(ang)*1.7;
        if(dist(c.x,c.y,s.x,s.y) < ((s.radius||22) + (c.radius||26) - 6)){
          for(const d of enemyListForCats){
            if(d.hidden && dist(d.x,d.y,s.x,s.y)<40){
              d.hidden=false; d.isRegenerating=false;
              if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; }
              d.hp = Math.max(0,d.hp - floor(random(4,10)));
              // small visual cue
              try{ spawnFloatingText(d.x,d.y-20,'!','rgba(255,0,0,0.9)'); }catch(e){}
            }
          }
        }
      }
    }
  }
  // process birds (simple AI: allied to cats, attack dogs)
  for(const b of birds){ if(b.hp<=0) continue;
    if(b.buffUntil && now > b.buffUntil){ b.dmgMult = 1; b.speedMult = 1; b.buffUntil = 0; }
  if(b._speedBuffUntil && now > b._speedBuffUntil){ if(typeof b._baseMoveSpeed === 'number') b.moveSpeed = b._baseMoveSpeed; b._speedBuffUntil = 0; }
  if(b._berserkUntil){ if(now > b._berserkUntil){ b.dmgMult = 1; b._berserkUntil = 0; delete b._berserkHpCostPerSec; delete b._lastBerserkTick; } else { const last = b._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); b.hp = Math.max(0, b.hp - secs * (b._berserkHpCostPerSec || 1)); b._lastBerserkTick = last + secs*1000; } } }
    if(b._maxHpBuffUntil && now > b._maxHpBuffUntil){ if(typeof b._maxHpBase === 'number'){ b.maxHp = b._maxHpBase; } else if(b._maxHpBuff){ b.maxHp = Math.max(1, b.maxHp - (b._maxHpBuff || 0)); } b._maxHpBuff = 0; b._maxHpBuffUntil = 0; delete b._maxHpBase; if(b.hp > b.maxHp) b.hp = b.maxHp; }
    if(b.hidden && now > b.hideUntil){ b.hidden = false; b.isRegenerating = false; if(b._savedRadius){ b.radius = b._savedRadius; delete b._savedRadius; } }
    if(b.hidden){ if(!b.nextRegen) b.nextRegen = now + 300; if(!b.lastRegen) b.lastRegen = now; if(!b.regenPerSec) b.regenPerSec = random(3,6) * (b.hiddenRegenBonus || 1.0); b.isRegenerating = true; if(now >= b.nextRegen){ const dt = now - b.lastRegen; const gained = (b.regenPerSec) * (dt/1000); b.hp = Math.min(b.maxHp, b.hp + gained); b.lastRegen = now; b.nextRegen = now + 300; if(b.hp >= b.maxHp) b.isRegenerating = false; } }
    const fleeThresholdB = 0.25 * b.maxHp; if(!b.hidden && b.hp > 0 && b.hp <= fleeThresholdB){ b.state='flee'; b.targetHide = safestHide(b.x,b.y, dogs); b.fleeSpeed = random(2,3); }
    if(b.state === 'flee' && b.targetHide){ const ang = atan2(b.targetHide.y - b.y, b.targetHide.x - b.x); const ms = (b.moveSpeed || 1.4) * b.speedMult * (b.fleeSpeed || 2); b.x += cos(ang)*ms; b.y += sin(ang)*ms; if(dist(b.x,b.y,b.targetHide.x,b.targetHide.y) < (b.targetHide.radius || 22)){ b.hidden = true; b.hideUntil = now + random(1200,3600); b.state = 'hidden'; b.hideStart = now; b.nextRegen = now + 300; b.lastRegen = now; b.regenPerSec = random(4,8) * (b.hiddenRegenBonus || 1.0); b.isRegenerating = true; b._savedRadius = b.radius; b.radius = (b.radius || 20) * 1.3; } }
    // engage dogs
    if(!b.hidden && b.hp>0 && b.state !== 'flee'){
      const enemies = livingEnemiesOf(b);
      if(enemies.length){ let target = enemies[0]; let bd = dist(b.x,b.y,target.x,target.y); for(const e of enemies){ const dd = dist(b.x,b.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } } const ang = atan2(target.y - b.y, target.x - b.x); b.x += cos(ang)*0.9 * (b.moveSpeed || 2.0) * b.speedMult; b.y += sin(ang)*0.9 * (b.moveSpeed || 2.0) * b.speedMult; const attackRange = (b.radius || 20) + (target.radius || 32) + 6; if(bd < attackRange && now - b.lastAttack > (b.attackCooldown || 500)){ b.lastAttack = now; performAbility(b,target,birdAbilities); }
      }
      else {
        // If idle and no visible enemies, birds should search for hidden enemies' hide spots
        const enemyListForBirds = [...cats, ...dogs, ...fish, ...capybaras].filter(x=> x && x.species !== b.species);
        const hiddenSpotsBird = hideSpots.filter(s=> enemyListForBirds.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y) < ((s.radius || 30) + 6)));
        if(hiddenSpotsBird.length){ const s = hiddenSpotsBird[0]; const ang = atan2(s.y - b.y, s.x - b.x); b.x += cos(ang)*1.0 * (b.moveSpeed || 2.0) * b.speedMult; b.y += sin(ang)*1.0 * (b.moveSpeed || 2.0) * b.speedMult; if(dist(b.x,b.y,s.x,s.y) < ((s.radius||22) + (b.radius||20) - 6)){ for(const d of enemyListForBirds){ if(d.hidden && dist(d.x,d.y,s.x,s.y) < 40){ d.hidden = false; d.isRegenerating = false; if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; } d.hp = Math.max(0, d.hp - floor(random(4,10))); try{ spawnFloatingText(d.x,d.y-20,'!','rgba(255,0,0,0.9)'); }catch(e){} } } }
        }
      }
    }
  }
  }
  // process dogs (mirror logic)
  for(const d of dogs){
      if(d.hp<=0) continue;
        // expire temporary dmg/speed buffs
        if(d.buffUntil && now > d.buffUntil){ d.dmgMult = 1; d.speedMult = 1; d.buffUntil = 0; }
    if(d._speedBuffUntil && now > d._speedBuffUntil){ if(typeof d._baseMoveSpeed === 'number') d.moveSpeed = d._baseMoveSpeed; d._speedBuffUntil = 0; }
    if(d._berserkUntil){ if(now > d._berserkUntil){ d.dmgMult = 1; d._berserkUntil = 0; delete d._berserkHpCostPerSec; delete d._lastBerserkTick; } else { const last = d._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); d.hp = Math.max(0, d.hp - secs * (d._berserkHpCostPerSec || 1)); d._lastBerserkTick = last + secs*1000; } } }
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
        // compute enemies
        const enemies = livingEnemiesOf(d);
        d.onBreak = (enemies.length === 0);
        try{
          if(window.DEBUG_DOGS && (!d._lastState || now - d._lastState > 1000)){
            // verbose pool info for debugging
            const pools = [...cats, ...dogs, ...birds, ...fish];
            const poolSummary = pools.map(p=> p ? `${p.species||'?'}:${Math.round(p.hp||0)}${p.hidden?'/H':''}` : 'null');
            const counts = { cats: cats.filter(x=>x.hp>0).length, dogs: dogs.filter(x=>x.hp>0).length, birds: birds.filter(x=>x.hp>0).length, fish: fish.filter(x=>x.hp>0).length };
            console.log('DOG STATE', 'pos', Math.round(d.x),Math.round(d.y), 'hp', Math.round(d.hp), 'state', d.state, 'hidden', d.hidden, 'enemies', enemies.length, 'onBreak', d.onBreak, 'counts', counts, 'pool', poolSummary.join(', '));
            d._lastState = now;
          }
        }catch(e){}
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
          // When idle, dogs should search and reveal any hidden enemies regardless of a short
          // regenerating window — otherwise matches can deadlock when two species end up hidden.
    // use a small slack when searching for hidden entities around spots
    const allHiddenSpots = hideSpots.filter(s=> [...cats, ...dogs, ...birds, ...fish, ...capybaras].some(c=> c && c.hidden && dist(c.x,c.y,s.x,s.y) < ((s.radius || 30) + 6)));
          if(allHiddenSpots.length){ const s = allHiddenSpots[0]; const ang = atan2(s.y - d.y, s.x - d.x); d.x += cos(ang)*0.8; d.y += sin(ang)*0.8; if(dist(d.x,d.y,s.x,s.y) < 26){ for(const ent of [...cats, ...dogs, ...birds, ...fish, ...capybaras]){ if(ent && ent.hidden && dist(ent.x,ent.y,s.x,s.y) < s.radius){ ent.hidden = false; ent.isRegenerating = false; if(ent._savedRadius){ ent.radius = ent._savedRadius; delete ent._savedRadius; } ent.hp = Math.max(0, ent.hp - floor(random(4,10))); spawnFloatingText(ent.x, ent.y-20, '!', 'rgba(255,0,0,0.9)'); } } try{ if(window.DEBUG_DOGS) console.log('DOG revealing hidden at spot', Math.round(s.x), Math.round(s.y)); }catch(e){} } }
          else { try{ if(window.DEBUG_DOGS) console.log('DOG idle: no hidden spots'); }catch(e){} }
        }
      }
    }
  }
  // process fish (allied to dogs, attack cats)
  for(const f of fish){ if(f.hp<=0) continue;
    if(f.buffUntil && now > f.buffUntil){ f.dmgMult = 1; f.speedMult = 1; f.buffUntil = 0; }
  if(f._speedBuffUntil && now > f._speedBuffUntil){ if(typeof f._baseMoveSpeed === 'number') f.moveSpeed = f._baseMoveSpeed; f._speedBuffUntil = 0; }
  if(f._berserkUntil){ if(now > f._berserkUntil){ f.dmgMult = 1; f._berserkUntil = 0; delete f._berserkHpCostPerSec; delete f._lastBerserkTick; } else { const last = f._lastBerserkTick || now; const elapsed = now - last; if(elapsed >= 1000){ const secs = Math.floor(elapsed/1000); f.hp = Math.max(0, f.hp - secs * (f._berserkHpCostPerSec || 1)); f._lastBerserkTick = last + secs*1000; } } }
    if(f._maxHpBuffUntil && now > f._maxHpBuffUntil){ if(typeof f._maxHpBase === 'number'){ f.maxHp = f._maxHpBase; } else if(f._maxHpBuff){ f.maxHp = Math.max(1, f.maxHp - (f._maxHpBuff || 0)); } f._maxHpBuff = 0; f._maxHpBuffUntil = 0; delete f._maxHpBase; if(f.hp > f.maxHp) f.hp = f.maxHp; }
    if(f.hidden && now > f.hideUntil){ f.hidden = false; f.isRegenerating = false; if(f._savedRadius){ f.radius = f._savedRadius; delete f._savedRadius; } }
    if(f.hidden){ if(!f.nextRegen) f.nextRegen = now + 300; if(!f.lastRegen) f.lastRegen = now; if(!f.regenPerSec) f.regenPerSec = random(2,5) * (f.hiddenRegenBonus || 1.0); f.isRegenerating = true; if(now >= f.nextRegen){ const dt = now - f.lastRegen; const gained = (f.regenPerSec) * (dt/1000); f.hp = Math.min(f.maxHp, f.hp + gained); f.lastRegen = now; f.nextRegen = now + 300; if(f.hp >= f.maxHp) f.isRegenerating = false; } }
    const fleeThresholdF = 0.18 * f.maxHp; if(!f.hidden && f.hp > 0 && f.hp <= fleeThresholdF){ f.state='flee'; f.targetHide = safestHide(f.x,f.y, cats); f.fleeSpeed = random(1.2,2.0); }
    if(f.state === 'flee' && f.targetHide){ const ang = atan2(f.targetHide.y - f.y, f.targetHide.x - f.x); const ms = (f.moveSpeed || 1.2) * f.speedMult * (f.fleeSpeed || 2); f.x += cos(ang)*ms; f.y += sin(ang)*ms; if(dist(f.x,f.y,f.targetHide.x,f.targetHide.y) < (f.targetHide.radius || 22)){ f.hidden = true; f.hideUntil = now + random(1000,3000); f.state = 'hidden'; f.hideStart = now; f.nextRegen = now + 300; f.lastRegen = now; f.regenPerSec = random(3,7) * (f.hiddenRegenBonus || 1.0); f.isRegenerating = true; f._savedRadius = f.radius; f.radius = (f.radius || 22) * 1.2; } }
    // engage enemies (any species != fish)
    if(!f.hidden && f.hp>0 && f.state !== 'flee'){
      const enemies = livingEnemiesOf(f);
      if(enemies.length){ let target = enemies[0]; let bd = dist(f.x,f.y,target.x,target.y); for(const e of enemies){ const dd = dist(f.x,f.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } } const ang = atan2(target.y - f.y, target.x - f.x); f.x += cos(ang)*0.6 * (f.moveSpeed || 1.2) * f.speedMult; f.y += sin(ang)*0.6 * (f.moveSpeed || 1.2) * f.speedMult; const attackRange = (f.radius || 22) + (target.radius || 26) + 6; if(bd < attackRange && now - f.lastAttack > (f.attackCooldown || 600)){ f.lastAttack = now; performAbility(f,target,fishAbilities); }
      }
      else {
        // Idle fish should also search for hidden enemies so allied dog/fish matches don't stalemate
        const enemyListForFish = [...cats, ...dogs, ...birds, ...capybaras].filter(x=> x && x.species !== f.species);
        const hiddenSpotsFish = hideSpots.filter(s=> enemyListForFish.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y) < ((s.radius || 30) + 6)));
        if(hiddenSpotsFish.length){ const s = hiddenSpotsFish[0]; const ang = atan2(s.y - f.y, s.x - f.x); f.x += cos(ang)*1.0 * (f.moveSpeed || 1.2) * f.speedMult; f.y += sin(ang)*1.0 * (f.moveSpeed || 1.2) * f.speedMult; if(dist(f.x,f.y,s.x,s.y) < ((s.radius||22) + (f.radius||22) - 6)){ for(const d of enemyListForFish){ if(d.hidden && dist(d.x,d.y,s.x,s.y) < 40){ d.hidden = false; d.isRegenerating = false; if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; } d.hp = Math.max(0, d.hp - floor(random(4,10))); try{ spawnFloatingText(d.x,d.y-20,'!','rgba(255,0,0,0.9)'); }catch(e){} } } }
        }
      }
    }
  }
  // process capybaras (allied to cats by default): moderate speed, group cohesion, prefer mud/trees
  for(const cp of capybaras){ if(cp.hp<=0) continue;
    // expire buffs
    if(cp.buffUntil && now > cp.buffUntil){ cp.dmgMult = 1; cp.speedMult = 1; cp.buffUntil = 0; }
    if(cp._speedBuffUntil && now > cp._speedBuffUntil){ if(typeof cp._baseMoveSpeed === 'number') cp.moveSpeed = cp._baseMoveSpeed; cp._speedBuffUntil = 0; }
    if(cp._maxHpBuffUntil && now > cp._maxHpBuffUntil){ if(typeof cp._maxHpBase === 'number') cp.maxHp = cp._maxHpBase; cp._maxHpBuff = 0; cp._maxHpBuffUntil = 0; delete cp._maxHpBase; if(cp.hp > cp.maxHp) cp.hp = cp.maxHp; }
    if(cp.hidden && now > cp.hideUntil){ cp.hidden = false; cp.isRegenerating = false; if(cp._savedRadius){ cp.radius = cp._savedRadius; delete cp._savedRadius; } }
    // hidden regen (capy enjoy trees slightly)
    if(cp.hidden){ if(!cp.nextRegen) cp.nextRegen = now + 300; if(!cp.lastRegen) cp.lastRegen = now; if(!cp.regenPerSec) cp.regenPerSec = random(4,8) * (cp.hiddenRegenBonus || 1.0); cp.isRegenerating = true; if(cp.targetHide && cp.targetHide.type === 'tree') cp.regenPerSec = cp.regenPerSec * 1.2; if(now >= cp.nextRegen){ const dt = now - cp.lastRegen; const gained = (cp.regenPerSec) * (dt/1000); cp.hp = Math.min(cp.maxHp, cp.hp + gained); cp.lastRegen = now; cp.nextRegen = now + 300; if(cp.hp >= cp.maxHp) cp.isRegenerating = false; } }
    // flee threshold
    const fleeThresholdC = 0.2 * cp.maxHp;
    if(!cp.hidden && cp.hp > 0 && cp.hp <= fleeThresholdC){ cp.state='flee'; cp.targetHide = safestHide(cp.x,cp.y, dogs); cp.fleeSpeed = random(1.2,2.0); }
    if(cp.state === 'flee' && cp.targetHide){ const ang = atan2(cp.targetHide.y - cp.y, cp.targetHide.x - cp.x); const ms = (cp.moveSpeed || 1.2) * cp.speedMult * (cp.fleeSpeed || 2); cp.x += cos(ang)*ms; cp.y += sin(ang)*ms; if(dist(cp.x,cp.y,cp.targetHide.x,cp.targetHide.y) < (cp.targetHide.radius || 22)){ cp.hidden = true; cp.hideUntil = now + random(1200,3000); cp.state = 'hidden'; cp.hideStart = now; cp.nextRegen = now + 300; cp.lastRegen = now; cp.regenPerSec = random(4,9) * (cp.hiddenRegenBonus || 1.0); cp.isRegenerating = true; cp._savedRadius = cp.radius; cp.radius = (cp.radius || 28) * 1.2; } }
    // engage enemies (prefer dogs, but will attack nearest enemy)
    if(!cp.hidden && cp.hp>0 && cp.state !== 'flee'){
      const enemies = livingEnemiesOf(cp);
      if(enemies.length){ let target = enemies[0]; let bd = dist(cp.x,cp.y,target.x,target.y); for(const e of enemies){ const dd = dist(cp.x,cp.y,e.x,e.y); if(dd<bd){ bd=dd; target=e; } } const ang = atan2(target.y - cp.y, target.x - cp.x); cp.x += cos(ang)*0.6 * (cp.moveSpeed || 1.3) * cp.speedMult; cp.y += sin(ang)*0.6 * (cp.moveSpeed || 1.3) * cp.speedMult; const attackRange = (cp.radius || 28) + (target.radius || 26) + 6; if(bd < attackRange && now - cp.lastAttack > (cp.attackCooldown || 650)){ cp.lastAttack = now; performAbility(cp,target,capyAbilities); } }
    else {
      // Capybaras (idle) should also actively search for hidden enemies to help reveal them
      const enemyListForCapy = [...cats, ...dogs, ...birds, ...fish].filter(x=> x && x.species !== cp.species);
      const hiddenSpotsCapy = hideSpots.filter(s=> enemyListForCapy.some(d=> d.hidden && dist(d.x,d.y,s.x,s.y) < ((s.radius || 30) + 6)));
      if(hiddenSpotsCapy.length){ const s = hiddenSpotsCapy[0]; const ang = atan2(s.y - cp.y, s.x - cp.x); cp.x += cos(ang)*0.6 * (cp.moveSpeed || 1.3) * cp.speedMult; cp.y += sin(ang)*0.6 * (cp.moveSpeed || 1.3) * cp.speedMult; if(dist(cp.x,cp.y,s.x,s.y) < ((s.radius||22) + (cp.radius||28) - 6)){ for(const d of enemyListForCapy){ if(d.hidden && dist(d.x,d.y,s.x,s.y) < 40){ d.hidden = false; d.isRegenerating = false; if(d._savedRadius){ d.radius = d._savedRadius; delete d._savedRadius; } d.hp = Math.max(0, d.hp - floor(random(4,10))); try{ spawnFloatingText(d.x,d.y-20,'!','rgba(255,0,0,0.9)'); }catch(e){} } } }
      }
    }
    }
  }
  // separation: avoid overlapping sprites (only for visible, alive entities)
  const all = [...cats, ...dogs, ...birds, ...fish, ...capybaras];
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
      // prefer certain hide types depending on species: cats -> tree, dogs/fish -> rock
      let typeBonus = 0;
      try{
        const sp = avoidEntity && avoidEntity.species ? avoidEntity.species : null;
        if(sp === 'cat' && s.type === 'tree') typeBonus = 60;
        else if((sp === 'dog' || sp === 'fish') && s.type === 'rock') typeBonus = 60;
      }catch(e){}
      const score = minDE - 0.35 * distToSelf + typeBonus;
      if(score > bestScore){ bestScore = score; best = s; }
    }
    return best;
  }
/**
 * Perform an ability from `pool` by `user` against `target`.
 * Validates the pool shape, normalizes probabilities and applies a small
 * finisher bias for birds/fish (prefer damage when target is low HP).
 * @param {Object} user
 * @param {Object} target
 * @param {Array<Object>} pool
 */
function performAbility(user, target, pool){
  // Defensive: ensure pool exists and has entries
  if(!pool || !Array.isArray(pool) || pool.length === 0) return;

  // validate abilities quickly
  const valid = pool.every(a => a && typeof a.type === 'string');
  if(!valid) return; // malformed pool

  // chooser with normalised probabilities and finisher bias
  const chooseWithBias = function(u, p, t){
    if(!Array.isArray(p) || p.length === 0) return null;
    // Finisher bias: if attacker is bird/fish and target is low HP, prefer damage
    if(u && t && (u.species === 'bird' || u.species === 'fish')){
      // stronger finisher bias: at or below 50% max HP prefer damage
      const threshold = (t.maxHp || 100) * 0.50;
      if(t.hp <= threshold){
        // rather than hard-filtering, boost damage ability probabilities by a multiplier
        const boostMul = 1.6;
        p = p.map(a => ({...a, prob: (a.prob || 0) * ((a.type === 'damage') ? boostMul : 1) }));
      }
    }
    // Normalize probabilities to a non-zero total
    const total = p.reduce((s,a) => s + (a.prob || 0), 0) || 1;
    let r = random() * total; let acc = 0;
    for(const a of p){ acc += (a.prob || 0); if(r <= acc) return a; }
    return p[0];
  };

  let chosen = chooseWithBias(user, pool, target);
  if(!chosen) chosen = pool[0];

  // AoE support: if chosen ability has aoe:true, apply to up to aoeMaxTargets allies of the same species
  if(chosen.aoe){
    // map species -> array
    const map = { cat: cats, dog: dogs, bird: birds, fish: fish, capy: capybaras };
    const arr = map[user.species] || [];
    const aliveAllies = arr.filter(a => a && a.hp > 0);
    const maxT = Math.max(1, chosen.aoeMaxTargets || 3);
    // pick random allies up to maxT
    const picked = [];
    const copy = aliveAllies.slice();
    while(picked.length < maxT && copy.length > 0){ const idx = Math.floor(random() * copy.length); picked.push(copy.splice(idx,1)[0]); }
    if(picked.length > 0){
      for(const t of picked){
        if(chosen.type === 'damage'){
          const base = floor(random(chosen.min, chosen.max));
          const dmg = floor(base * ((user.speciesDamageMultiplier || 1) * (user.dmgMult || 1)));
          t.hp = Math.max(0, t.hp - dmg);
          spawnFloatingText(t.x, t.y - 30, '-' + dmg, '#ff6666');
        } else if(chosen.type === 'heal'){
          const val = floor(random(chosen.min, chosen.max));
          t.hp = Math.min(t.maxHp, t.hp + val);
          spawnFloatingText(t.x, t.y - 30, '+' + val, '#66ff88');
        } else if(chosen.type === 'buffDamage'){
          t.dmgMult = 1 + chosen.amount;
          t.buffUntil = millis() + chosen.duration;
          spawnFloatingText(t.x, t.y - 30, 'Dmg up', '#ffd24a');
        } else if(chosen.type === 'buffMaxHp'){
          if(!t._maxHpBase) t._maxHpBase = t.maxHp;
          const prevBuff = t._maxHpBuff || 0;
          const newBuff = Math.max(prevBuff, chosen.amount);
          t.maxHp = (t._maxHpBase || t.maxHp) + newBuff;
          const delta = newBuff - prevBuff;
          if(delta > 0) t.hp = Math.min(t.maxHp, t.hp + delta);
          t._maxHpBuff = newBuff;
          t._maxHpBuffUntil = millis() + (chosen.duration || 8000);
          spawnFloatingText(t.x, t.y - 30, 'Max HP +' + newBuff, '#ffd24a');
        } else if(chosen.type === 'buffSpeed'){
          t.speedMult = 1 + chosen.amount;
          t.buffUntil = millis() + chosen.duration;
          spawnFloatingText(t.x, t.y - 30, 'Speed up', '#66ff88');
        }
      }
      return; // AoE applied, done
    }
  }

  // now apply the chosen ability effects (visuals/sounds kept)
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
  } else if(chosen.type === 'dash'){
    // immediate damage + short speed burst
    const dmg = chosen.damage || 10;
    target.hp = Math.max(0, target.hp - dmg);
    spawnFloatingText(target.x, target.y - 30, '-' + dmg, '#ff6666');
    spawnConfetti(target.x, target.y, 6);
    if(window.catDogAudio) window.catDogAudio.playImpact();
    // apply speed buff marker
    if(typeof user._baseMoveSpeed !== 'number') user._baseMoveSpeed = user.moveSpeed;
    user.moveSpeed = (user._baseMoveSpeed || user.moveSpeed) * (1 + (chosen.speedBoost || 0.5));
    user._speedBuffUntil = millis() + (chosen.duration || 600);
    // knockback on target
    const ang2 = atan2(target.y - user.y, target.x - user.x);
    target.x += cos(ang2) * 8; target.y += sin(ang2) * 8;
  } else if(chosen.type === 'berserk'){
    // increase damage multiplier temporarily, but drain HP per second
    user.dmgMult = 1 + (chosen.amount || 1.0);
    user._berserkUntil = millis() + (chosen.duration || 7000);
    user._berserkHpCostPerSec = chosen.selfHpCostPerSec || 1;
    user._lastBerserkTick = millis();
    spawnFloatingText(user.x, user.y - 30, 'Berserk!', '#ff9966');
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

// Diagnostic helpers: expose lightweight runtime checks for parity with the
// Node runner. Call from the browser console. Safe no-ops if ability pools
// are not present.
function logStartupDiagnostics(){
  try{
    const pools = { cat: catAbilities || [], dog: dogAbilities || [], bird: birdAbilities || [], fish: fishAbilities || [], capy: capyAbilities || [] };
    console.log('Startup diagnostics — ability pool sizes:', Object.fromEntries(Object.entries(pools).map(([k,v])=>[k, (v||[]).length])));
    // print one sample ability from each pool for quick inspection
    for(const k of Object.keys(pools)){
      const arr = pools[k] || [];
      if(arr.length === 0) console.warn(`Pool ${k} is empty`);
      else console.log(`${k} sample:`, JSON.parse(JSON.stringify(arr[Math.floor(Math.random()*arr.length)])));
    }
    // show whether loader script attached window.Species
    try{ console.log('window.Species present?', !!(window && window.Species)); }catch(e){ console.log('window.Species check failed'); }
  }catch(e){ console.warn('logStartupDiagnostics failed', e); }
}

// verifyParityRuns: sample ability selection from each pool N times and
// return counts — helpful to compare distribution against Node runner.
function verifyParityRuns(samples = 1000){
  const results = { cat: {}, dog: {}, bird: {}, fish: {}, capy: {} };
  function pick(pool, user, target){
    if(!Array.isArray(pool) || pool.length === 0) return null;
    // replicate chooseWithBias logic from performAbility (simplified)
    let p = pool.slice();
    if(user && target && (user.species === 'bird' || user.species === 'fish')){
      const threshold = (target.maxHp || 100) * 0.50;
      if(target.hp <= threshold){ const boost = 1.6; p = p.map(a=>({...a, prob: (a.prob||0) * ((a.type === 'damage') ? boost : 1)})); }
    }
    const total = p.reduce((s,a)=> s + (a.prob||0), 0) || 1;
    const r = Math.random() * total; let acc = 0; for(const a of p){ acc += (a.prob||0); if(r <= acc) return a; }
    return p[0];
  }
  // create lightweight fake user/target for bias logic
  const fakeUserBird = { species: 'bird', dmgMult:1, speciesDamageMultiplier:1 };
  const fakeUserFish = { species: 'fish', dmgMult:1, speciesDamageMultiplier:1 };
  const fakeTarget = { maxHp: 100, hp: 40 };
  for(let i=0;i<samples;i++){
    const a = pick(catAbilities, {species:'cat'}, fakeTarget); if(a) results.cat[a.name] = (results.cat[a.name]||0) + 1;
    const b = pick(dogAbilities, {species:'dog'}, fakeTarget); if(b) results.dog[b.name] = (results.dog[b.name]||0) + 1;
    const c = pick(birdAbilities, fakeUserBird, fakeTarget); if(c) results.bird[c.name] = (results.bird[c.name]||0) + 1;
    const f = pick(fishAbilities, fakeUserFish, fakeTarget); if(f) results.fish[f.name] = (results.fish[f.name]||0) + 1;
    const p = pick(capyAbilities, {species:'capy'}, fakeTarget); if(p) results.capy[p.name] = (results.capy[p.name]||0) + 1;
  }
  console.log('verifyParityRuns samples=', samples, 'results=', results);
  return results;
}

try{ if(typeof window !== 'undefined'){ window.logStartupDiagnostics = logStartupDiagnostics; window.verifyParityRuns = verifyParityRuns; } }catch(e){}






