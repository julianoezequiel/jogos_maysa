// Capivara Aventura - script.js
// Código comentado e didático para crianças de 10 anos.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

// ajustar para resolução do elemento
function fitCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);

// --- Estado do jogo ---
let running = false;
let lastTime = 0;
let score = 0;

// Cenas/Background parallax (camadas fixas relativas entre si)
const bg = {
  layers: [],
  speed: 40 // pixels por segundo
};

// Jogador (capivara)
const player = {
  x: 80,
  y: 200,
  w: 90,
  h: 60,
  speed: 220,
  vx: 0,
  vy: 0,
  img: new Image(),
  frame: 0,
  frameTimer: 0
};

// Carregar imagem SVG embutida (gerada para o jogo)
player.img.src = 'capivara-run.svg';

// Obstáculos
const obstacles = [];
let spawnTimer = 0;
const spawnInterval = 1.4; // valor base (em segundos)
let nextSpawn = spawnInterval; // tempo (s) até o próximo spawn — será aleatorizado

// teclas
const keys = {};
// interceptar teclado e prevenir scroll da página quando usamos as teclas do jogo
window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  // não prevenir se o foco estiver em um campo de texto ou elemento editável
  const tgt = e.target;
  const isInput = tgt && (tgt.tagName && (tgt.tagName.toLowerCase() === 'input' || tgt.tagName.toLowerCase() === 'textarea') || tgt.isContentEditable);
  if(!isInput && (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' || key === 'w' || key === 'a' || key === 's' || key === 'd')){
    e.preventDefault();
  }
  keys[key] = true;
});
window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  // prevenir comportamento padrão também no keyup para segurança (ex.: teclas long-press)
  const tgt = e.target;
  const isInput = tgt && (tgt.tagName && (tgt.tagName.toLowerCase() === 'input' || tgt.tagName.toLowerCase() === 'textarea') || tgt.isContentEditable);
  if(!isInput && (key === 'arrowup' || key === 'arrowdown' || key === 'arrowleft' || key === 'arrowright' || key === 'w' || key === 'a' || key === 's' || key === 'd')){
    e.preventDefault();
  }
  keys[key] = false;
});

// --- Áudio (WebAudio) ---
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let musicOn = true;
let sfxOn = true;
let muted = false;

function ensureAudio(){
  if(!audioCtx) audioCtx = new AudioCtx();
}

// pequeno sintetizador para SFX (tom curto)
function playBeep(freq=440, duration=0.12, type='sine', gain=0.12){
  if(!sfxOn) return;
  ensureAudio();
  const t0 = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g); g.connect(audioCtx.destination);
  osc.start(t0); osc.stop(t0 + duration + 0.02);
}

// hit sound (collision)
function playHit(){ if(!sfxOn) return; playBeep(120, 0.25, 'sawtooth', 0.25); }
// point sound
function playPoint(){ if(!sfxOn) return; playBeep(880, 0.09, 'square', 0.12); }
// move sound (soft)
function playMove(){ if(!sfxOn) return; playBeep(600, 0.05, 'sine', 0.04); }

// voz de perda: tenta usar SpeechSynthesis para dizer "Noooob"; respeita sfxOn/muted
function playLoseVoice(){
  if(!sfxOn || muted) return;
  if('speechSynthesis' in window){
    try{
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance('Nooooooooob');
      u.lang = 'pt-BR';
      u.pitch = 0.6;
      u.rate = 0.9;
      u.volume = 1.0;
      window.speechSynthesis.speak(u);
      return;
    }catch(e){ /* fallback below */ }
  }
  // fallback: pequeno efeito descendente
  playBeep(400, 0.16, 'sawtooth', 0.22);
  setTimeout(()=> playBeep(220, 0.22, 'sine', 0.2), 120);
}

// música de fundo simples: sequenciador com notas alegres
let musicNode = null;
function startMusic(){
  if(!musicOn) return;
  ensureAudio();
  if(musicNode) return; // já tocando
  const t = audioCtx.currentTime + 0.05;
  const master = audioCtx.createGain(); master.gain.value = 0.12; master.connect(audioCtx.destination);
  musicNode = {master};
  // sequência simples (loop)
  const notes = [660, 880, 990, 880, 660, 550, 660];
  let step = 0;
  function schedule(){
    const now = audioCtx.currentTime;
    for(let i=0;i<4;i++){
      const when = now + i * 0.25;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'triangle'; osc.frequency.value = notes[(step + i) % notes.length];
      g.gain.setValueAtTime(0.0001, when);
      g.gain.exponentialRampToValueAtTime(0.16, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.22);
      osc.connect(g); g.connect(master);
      osc.start(when); osc.stop(when + 0.24);
    }
    step = (step + 4) % notes.length;
    musicNode.timeout = setTimeout(schedule, 1000);
  }
  schedule();
}

function stopMusic(){ if(musicNode){ clearTimeout(musicNode.timeout); musicNode.master.disconnect(); musicNode = null; } }

// toggle UI hooks will be set up after DOM ready


// Helpers
function rand(min,max){return Math.random()*(max-min)+min}

// Inicializar fundo — 3 camadas: distante, médio, perto
function initBackground(){
  bg.layers = [
    {img: new Image(), x:0, y:0, w:0, h:0, factor:0.2, src:'bg-far.svg'},
    {img: new Image(), x:0, y:0, w:0, h:0, factor:0.5, src:'bg-mid.svg'},
    {img: new Image(), x:0, y:0, w:0, h:0, factor:0.9, src:'bg-near.svg'}
  ];
  bg.layers.forEach(l=>{l.img.src = l.src});
}
initBackground();

// Game loop
function update(t){
  if(!running) { lastTime = t; requestAnimationFrame(update); return; }
  const dt = Math.min(0.05, (t - lastTime) / 1000);
  lastTime = t;

  // mover jogador conforme teclas
  player.vx = 0; player.vy = 0;
  if(keys['arrowup'] || keys['w']) player.vy = -player.speed;
  if(keys['arrowdown'] || keys['s']) player.vy = player.speed;
  if(keys['arrowleft'] || keys['a']) player.vx = -player.speed;
  if(keys['arrowright'] || keys['d']) player.vx = player.speed;

  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // limitar dentro da tela
  player.x = Math.max(8, Math.min(canvas.width - player.w - 8, player.x));
  player.y = Math.max(8, Math.min(canvas.height - player.h - 8, player.y));

  // animar frames (simples)
  player.frameTimer += dt;
  if(player.frameTimer > 0.12){ player.frame = (player.frame + 1) % 4; player.frameTimer = 0 }

  // spawn obstáculos (tempo até próximo spawn é aleatório para variar distâncias)
  spawnTimer += dt;
  if(spawnTimer > nextSpawn){ spawnTimer = 0; spawnObstacle();
    // definir próximo intervalo aleatório (um pouco mais curto ou mais longo que base)
    nextSpawn = rand(0.8, 1.8);
  }

  // atualizar obstáculos
  for(let i = obstacles.length -1; i>=0; i--){
    const o = obstacles[i];
    o.x -= o.speed * dt;
    // se passou da tela -> ganha ponto e remove
    if(o.x + o.w < 0){ score += o.points; obstacles.splice(i,1); updateScore() }
    else if(collides(o, player)){
      // colisão -> pausa e mostra modal
      running = false;
      playHit();
      // voz divertida ao perder
      playLoseVoice();
      showModal('Você bateu!', 'Pontos: ' + score);
    }
  }

  // mover camadas de background
  bg.layers.forEach(l=>{ l.x -= bg.speed * l.factor * dt; if(l.x <= -canvas.width) l.x = 0 });

  draw();
  requestAnimationFrame(update);
}

function collides(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

// Retorna o maior corredor (gap) vertical disponível num X específico.
function getLargestVerticalGapAtX(testX, testW){
  const occupied = [];
  const left = testX;
  const right = testX + testW;
  obstacles.forEach(o=>{
    const ox1 = o.x;
    const ox2 = o.x + o.w;
    if(ox1 < right && ox2 > left){
      occupied.push([o.y, o.y + o.h]);
    }
  });
  if(occupied.length === 0) return {y:0, h: canvas.height};
  occupied.sort((a,b)=> a[0]-b[0]);
  const merged = [];
  let cur = occupied[0].slice();
  for(let i=1;i<occupied.length;i++){
    const it = occupied[i];
    if(it[0] <= cur[1]){ cur[1] = Math.max(cur[1], it[1]); }
    else{ merged.push(cur); cur = it.slice(); }
  }
  merged.push(cur);
  // encontrar maior gap entre 0..canvas.height
  let best = {y:0, h: merged[0][0]};
  // antes do primeiro
  if(best.h < 0) best.h = 0;
  for(let i=0;i<merged.length-1;i++){
    const gapStart = merged[i][1];
    const gapEnd = merged[i+1][0];
    const gap = gapEnd - gapStart;
    if(gap > best.h){ best.h = gap; best.y = gapStart; }
  }
  // depois do último
  const last = merged[merged.length-1];
  const endGap = canvas.height - last[1];
  if(endGap > best.h){ best.h = endGap; best.y = last[1]; }
  return best;
}

function spawnObstacle(){
  // Decidir aleatoriamente entre criar um par (topo+chão) ou um obstáculo único menor
  // reduzir probabilidade de pares e aumentar de obstáculos pequenos
  const createType = Math.random() < 0.30 ? 'pair' : 'single';

  // X de aparição (fora da tela). usar variação para distâncias diferentes
  let x = canvas.width + Math.round(rand(40, Math.max(140, canvas.width * 0.45)));

  // Evitar spawn muito colado ao obstáculo anterior
  if(obstacles.length){
    const last = obstacles.reduce((p,c)=> c.x>p.x?c:p, obstacles[0]);
    if(x < last.x + 140){ x = last.x + Math.round(rand(140, 300)); }
  }

  const speed = rand(150, 240);

  // função utilitária: verifica se existe um corredor vertical seguro (para o jogador)
  function hasSafeVerticalCorridorAtX(testX, testW, proposedIntervals = []){
    // coletar intervalos verticais ocupados por obstáculos que se sobrepõem horizontalmente
    const occupied = [];
    const left = testX;
    const right = testX + testW;
    obstacles.forEach(o=>{
      const ox1 = o.x;
      const ox2 = o.x + o.w;
      if(ox1 < right && ox2 > left){
        occupied.push([o.y, o.y + o.h]);
      }
    });
    // incluir intervalos propostos (por exemplo do obstáculo que queremos criar)
    proposedIntervals.forEach(iv => occupied.push(iv));

    if(occupied.length === 0) return true;

    // unir intervalos
    occupied.sort((a,b)=> a[0]-b[0]);
    const merged = [];
    let cur = occupied[0].slice();
    for(let i=1;i<occupied.length;i++){
      const it = occupied[i];
      if(it[0] <= cur[1]){ cur[1] = Math.max(cur[1], it[1]); }
      else{ merged.push(cur); cur = it.slice(); }
    }
    merged.push(cur);

    // verificar se existe espaço entre 0 e canvas.height que permita o jogador passar
    const needed = player.h * 1.2; // margem para manobra
    // espaço antes do primeiro
    if(merged[0][0] >= needed) return true;
    // espaços entre merged intervals
    for(let i=0;i<merged.length-1;i++){
      const gap = merged[i+1][0] - merged[i][1];
      if(gap >= needed) return true;
    }
    // espaço depois do último
    const last = merged[merged.length-1];
    if(canvas.height - last[1] >= needed) return true;
    return false;
  }

  if(createType === 'single'){
    // obstáculo menor: pode estar no meio, alto, ou baixo, deixando espaço para passar por cima/baixo
  // tornar os obstáculos únicos menores (facilitar desviar por cima/embaixo)
  const maxH = Math.max(16, Math.min(player.h * 0.7, canvas.height * 0.32));
    const h = Math.round(rand(18, maxH));
    // permitir Y próximo ao topo, centro ou perto do chão
    const y = Math.round(rand(8, canvas.height - h - 8));
    const w = Math.round(rand(28, 60));
    const single = { x, y, w, h, speed, points: 1, kind: 'single' };
    // verificar se, ao adicionar este obstáculo, sobra corredor vertical seguro
    if(hasSafeVerticalCorridorAtX(single.x, single.w, [[single.y, single.y + single.h]])){
      obstacles.push(single);
    }else{
      // reduzir a altura para tentar encaixar
      single.h = Math.round(Math.max(12, player.h * 0.8));
      single.y = Math.round(rand(8, canvas.height - single.h - 8));
      if(hasSafeVerticalCorridorAtX(single.x, single.w, [[single.y, single.y + single.h]])){
        obstacles.push(single);
      }else{
        // adiar spawn um pouco para evitar bloqueio
        nextSpawn += 0.6;
        return;
      }
    }
  }else{
    // Criar um par de obstáculos (um vindo do topo e outro do chão) deixando um gap aleatório
  // ajustar gap dos pares para serem mais fáceis: menor bloqueio
  const minGap = Math.max(player.h * 1.2, 70);
  const maxGap = Math.max(minGap + 30, Math.round(canvas.height * 0.5));
    const gap = Math.round(rand(minGap, Math.min(maxGap, canvas.height - 40)));

    const avail = canvas.height - gap;
    const hTop = Math.round(rand(16, Math.max(16, avail - 16)));
    const hBottom = avail - hTop;

    const w = Math.round(rand(36, 64));
    const topObs = { x, y: 0, w, h: hTop, speed, points: 0, kind: 'pair' };
    const bottomObs = { x, y: canvas.height - hBottom, w, h: hBottom, speed, points: 1, kind: 'pair' };
    // verificar se o par bloqueia totalmente alguma passagem — se bloquear, aumentar gap ou adiar
    if(hasSafeVerticalCorridorAtX(x, w, [[topObs.y, topObs.y+topObs.h],[bottomObs.y,bottomObs.y+bottomObs.h]])){
      obstacles.push(topObs, bottomObs);
    }else{
      // tentar aumentar o gap (diminuir hTop/hBottom) até um limite
      const attempts = 3;
      let ok = false;
      for(let a=0;a<attempts && !ok; a++){
        // reduzir os blocos para abrir mais espaço
        const reduceTop = Math.round(hTop * 0.2 * (a+1));
        const reduceBottom = Math.round(hBottom * 0.2 * (a+1));
        const tH = Math.max(12, hTop - reduceTop);
        const bH = Math.max(12, hBottom - reduceBottom);
        const newTop = [0, tH];
        const newBottom = [canvas.height - bH, canvas.height];
        if(hasSafeVerticalCorridorAtX(x, w, [newTop, newBottom])){
          topObs.h = tH; bottomObs.h = bH; bottomObs.y = canvas.height - bH;
          ok = true; break;
        }
      }
      if(ok){ obstacles.push(topObs, bottomObs); }
      else{ nextSpawn += 0.8; return; }
    }
  }
}

function updateScore(){ document.getElementById('score').textContent = score }

function draw(){
  // limpar
  ctx.clearRect(0,0,canvas.width,canvas.height);

  // desenhar camadas do fundo
  bg.layers.forEach(l=>{
    if(!l.img.complete) return; // espera carregar
    // desenha duas vezes para criar loop
    const scale = canvas.height / l.img.height || 1;
    const w = l.img.width * scale;
    const h = canvas.height;
    const x1 = (l.x % w + w) % w - w; // calculo de wrap
    ctx.drawImage(l.img, x1, 0, w, h);
    ctx.drawImage(l.img, x1 + w, 0, w, h);
  });

  // desenhar chão simples (sombra)
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fillRect(0, canvas.height - 44, canvas.width, 44);

  // desenhar obstáculos (cores diferentes por tipo)
  obstacles.forEach(o=>{
    if(o.kind === 'pair') ctx.fillStyle = '#7b4f3b';
    else if(o.kind === 'single') ctx.fillStyle = '#ffb74d';
    else ctx.fillStyle = '#7b4f3b';
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.strokeRect(o.x+0.5, o.y+0.5, o.w-1, o.h-1);
  });

  // desenhar indicador do corredor mais seguro para o próximo obstáculo
  // achar o obstáculo mais próximo à frente do jogador
  const ahead = obstacles.filter(o => o.x + o.w > player.x).sort((a,b)=> (a.x - b.x));
  if(ahead.length){
    const nextX = ahead[0].x; // posição do próximo obstáculo
    const previewW = Math.max(80, ahead[0].w);
    const gap = getLargestVerticalGapAtX(nextX, previewW);
    // desenhar retângulo translúcido sobre o corredor
    if(gap.h > player.h * 0.8){
      ctx.fillStyle = 'rgba(80,200,120,0.18)';
      ctx.fillRect(nextX, gap.y, previewW, gap.h);
      // desenhar seta apontando para o centro do corredor
      const cx = nextX + previewW/2;
      const cy = gap.y + gap.h/2;
      ctx.fillStyle = 'rgba(20,120,40,0.9)';
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy - 8);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx - 10, cy + 8);
      ctx.closePath();
      ctx.fill();
    }
  }

  // desenhar jogador (capivara) com frames da imagem SVG (que está desenhada horizontalmente)
  if(player.img.complete){
    // a imagem SVG tem 4 frames lado a lado
    const fw = player.img.width / 4 || player.w;
    const fh = player.img.height || player.h;
    try{
      ctx.drawImage(player.img, player.frame * fw, 0, fw, fh, player.x, player.y, player.w, player.h);
    }catch(e){
      // fallback: caixa simples
      ctx.fillStyle = '#ffd27f'; ctx.fillRect(player.x, player.y, player.w, player.h);
    }
  }else{
    ctx.fillStyle = '#ffd27f'; ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

// Modal controls (substitui alert)
function showModal(title, message){
  const modal = document.getElementById('gameModal');
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalMessage').textContent = message;
  modal.setAttribute('aria-hidden', 'false');
}
function hideModal(){ const modal = document.getElementById('gameModal'); modal.setAttribute('aria-hidden','true'); }

// Wire modal buttons
window.addEventListener('load', ()=>{
  document.getElementById('modalRestart').addEventListener('click', ()=>{ hideModal(); resetGame(); });
  document.getElementById('modalClose').addEventListener('click', ()=>{ hideModal(); });

  // audio toggles
  const musicBtn = document.getElementById('musicToggle');
  const sfxBtn = document.getElementById('sfxToggle');
  const muteBtn = document.getElementById('muteToggle');
  musicBtn.addEventListener('click', ()=>{ musicOn = !musicOn; musicBtn.textContent = 'Música: ' + (musicOn? 'On':'Off'); if(musicOn) startMusic(); else stopMusic(); });
  sfxBtn.addEventListener('click', ()=>{ sfxOn = !sfxOn; sfxBtn.textContent = 'Sons: ' + (sfxOn? 'On':'Off'); });
  muteBtn.addEventListener('click', ()=>{
    muted = !muted;
    muteBtn.textContent = 'Mudo: ' + (muted? 'On':'Off');
    if(muted){
      // salvar estados
      musicBtn.dataset._prev = musicOn ? '1' : '0';
      sfxBtn.dataset._prev = sfxOn ? '1' : '0';
      musicOn = false; sfxOn = false; stopMusic(); musicBtn.textContent = 'Música: Off'; sfxBtn.textContent = 'Sons: Off';
    }else{
      // restaurar
      musicOn = musicBtn.dataset._prev === '1';
      sfxOn = sfxBtn.dataset._prev === '1';
      musicBtn.textContent = 'Música: ' + (musicOn? 'On':'Off');
      sfxBtn.textContent = 'Sons: ' + (sfxOn? 'On':'Off');
      if(musicOn) startMusic();
    }
  });

  // iniciar música se habilitada
  if(musicOn) startMusic();
});

// disparar som de movimento quando teclas são pressionadas
let lastMoveSound = 0;
window.addEventListener('keydown', e=>{
  const t = performance.now();
  const k = e.key.toLowerCase();
  if((k==='arrowup'||k==='arrowdown'||k==='w'||k==='s'||k==='a'||k==='d'||k==='arrowleft'||k==='arrowright') && t - lastMoveSound > 80){ playMove(); lastMoveSound = t; }
});

// tocar som ao ganhar ponto: já existe updateScore -> podemos tocar quando score muda
let lastScore = score;
const scoreObserver = setInterval(()=>{ if(score !== lastScore){ lastScore = score; playPoint(); } }, 120);


// controles de UI
document.getElementById('startBtn').addEventListener('click', ()=>{ if(!running){ running=true; lastTime = performance.now(); requestAnimationFrame(update) }});
document.getElementById('pauseBtn').addEventListener('click', ()=>{ running = !running; });
document.getElementById('restartBtn').addEventListener('click', ()=>{ resetGame(); });

function resetGame(){
  score = 0; updateScore(); obstacles.length = 0; player.x = 80; player.y = canvas.height/2 - player.h/2; running = true; lastTime = performance.now(); requestAnimationFrame(update);
}

// posicional inicial
player.y = canvas.height/2 - player.h/2;

// start lightly after assets load
window.addEventListener('load', ()=>{
  updateScore();
  // draw once
  draw();
});
