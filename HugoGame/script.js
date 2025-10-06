// Hugo & Amigos - jogo simples para crianças
// Personagens: Hugo (porco), Capivara, Pug, Dragão (amigo)

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let running = false;
let score = 0;

// jogador (Hugo) - agora em visão top-down para andar por toda a tela
const player = { x:60, y:canvas.height/2, w:56, h:56, speed:220, vx:0, vy:0, followers: [] };

// histórico de posições usado para os seguidores (cada frame empilhamos a posição do jogador)
const followHistory = [];
const HISTORY_MAX = 400; // quantos registros manter
const SPACING_FRAMES = 12; // distância em frames entre cada seguidor

// criaturas: cada objeto tem um `id` que combina com o nome do arquivo SVG (ex: id -> id.svg)
const creatures = [
  {id:'capivara', name:'Capivara', color:'#8B5E3C'},
  {id:'pug', name:'Pug', color:'#d2c2a0'},
  {id:'dragon', name:'Dragão', color:'#6bd1a6'}
];

// obstáculos amigos/colecionáveis
let items = [];
let lastTime = 0;
let spawnTimer = 0;
let gameOverFlag = false;
// tempo de jogo e mecânicas de manutenção da fila
let elapsedGameTime = 0; // segundos
let timeSinceLastCollect = 0; // segundos desde a última coleta
// collect timeout dynamics: base and minimum; it will linearly decrease over scaleTime seconds
// agora: começa em 3s e pode chegar a 1s (mais desafiador). Escala em 120s.
const collectTimeoutBase = 3; // início (segundos)
const collectTimeoutMin = 1; // mínimo que o timeout pode alcançar
const collectTimeoutScaleTime = 120; // ao final deste tempo (s) o timeout chega ao mínimo
let hasCollectedAny = false; // marca se o jogador já teve pelo menos 1 seguidor
// ondas de spawn
let waveTimer = 0;
const wavePeriod = 20; // segundos por ciclo
const waveHighDuration = 12; // primeiros N segundos -> alta geração
const highSpawnChance = 0.92; // base
const lowSpawnChance = 0.28; // base
const spawnIntervalBase = 1.0; // tentativa de spawn a cada X segundos
const spawnIntervalMin = 0.45; // limite mínimo do intervalo com o tempo
// animações de seguidores removidos
const removedAnims = [];
// contadores por tipo
const collectedCounts = { capivara:0, pug:0, dragon:0 };

function updateCollectedUI(){
  document.getElementById('count-capivara').textContent = collectedCounts.capivara;
  document.getElementById('count-pug').textContent = collectedCounts.pug;
  document.getElementById('count-dragon').textContent = collectedCounts.dragon;
}

// util
function randInt(a,b){ return Math.floor(Math.random()*(b-a+1))+a }

// Imagens (SVG) para Hugo e criaturas
const images = {
  hugo: new Image(),
  capivara: new Image(),
  pug: new Image(),
  dragon: new Image()
};
images.hugo.src = 'hugo-pig.svg';
images.capivara.src = 'capivara.svg';
images.pug.src = 'pug.svg';
images.dragon.src = 'dragon.svg';
let assetsLoaded = false;
function preloadImages(cb){
  const list = Object.values(images);
  let remaining = list.length;
  list.forEach(img=>{
    if(img.complete && img.naturalWidth){ if(--remaining === 0){ assetsLoaded = true; cb && cb() } }
    else img.onload = ()=>{ if(--remaining === 0){ assetsLoaded = true; cb && cb() } };
    img.onerror = ()=>{ if(--remaining === 0){ assetsLoaded = true; cb && cb() } };
  });
}
preloadImages();

function drawPlayer(){
  const img = images.hugo;
  if(img.complete && img.naturalWidth){
    ctx.drawImage(img, player.x, player.y, player.w, player.h);
  } else {
    // fallback simples
    ctx.fillStyle = '#ff98b8'; ctx.fillRect(player.x, player.y, player.w, player.h);
  }
}

function drawCreatureImage(type, x, y, w, h){
  const key = (type.id || type.name || '').toLowerCase();
  const img = images[key] || null;
  if(img && img.complete && img.naturalWidth){
    ctx.drawImage(img, x, y, w, h);
  } else {
    // fallback: desenhar retângulo com cor amigável
    ctx.fillStyle = type.color; ctx.fillRect(x,y,w,h);
  }
}

function spawnItem(){
  // aparece uma criatura aleatória em posição aleatória da tela
  const type = creatures[randInt(0,creatures.length-1)];
  const w = 52, h = 40;
  const x = randInt(60, canvas.width - 120);
  const y = randInt(40, canvas.height - 80);
  // vida aleatória em segundos para dar sensação de oportunidade
  const life = randInt(6, 14);
  const bobPhase = Math.random() * Math.PI * 2;
  items.push({type, x, y, w, h, life, bobPhase});
}

function update(t){
  if(!running){ lastTime = t; requestAnimationFrame(update); return }
  const dt = Math.min(0.033, (t-lastTime)/1000); lastTime = t;

  // movimento top-down do jogador
  player.vx = 0; player.vy = 0;
  if(keys['arrowup'] || keys['w']) player.vy = -player.speed;
  if(keys['arrowdown'] || keys['s']) player.vy = player.speed;
  if(keys['arrowleft'] || keys['a']) player.vx = -player.speed;
  if(keys['arrowright'] || keys['d']) player.vx = player.speed;
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  // limitar dentro da tela
  player.x = Math.max(6, Math.min(canvas.width - player.w - 6, player.x));
  player.y = Math.max(6, Math.min(canvas.height - player.h - 6, player.y));

  // spawn baseado em ondas: alterna entre períodos de alta e baixa geração
  spawnTimer += dt;
  waveTimer += dt;
  if(waveTimer > wavePeriod) waveTimer -= wavePeriod;
  const inHigh = waveTimer <= waveHighDuration;
  // dinamicamente reduzir spawnInterval com o tempo para tornar o jogo mais intenso
  const spawnInterval = Math.max(spawnIntervalMin, spawnIntervalBase * (1 - Math.min(1, elapsedGameTime / 240)));
  // aumentar spawn chance levemente com o tempo
  const tFactor = Math.min(1, elapsedGameTime / 300);
  const currentSpawnChance = (inHigh ? highSpawnChance : lowSpawnChance) + tFactor * 0.08;
  if(spawnTimer >= spawnInterval){ spawnTimer -= spawnInterval; if(Math.random() < currentSpawnChance && assetsLoaded) spawnItem(); }

  // empilha posição atual do jogador (centro) no histórico (mantemos só para compatibilidade/visual)
  followHistory.push({ x: player.x + player.w/2, y: player.y + player.h/2 });
  if(followHistory.length > HISTORY_MAX) followHistory.shift();

  // parâmetros de espaçamento e movimento (seguidores bem próximos, "se segurando")
  const MIN_FOLLOW_DIST = 0; // manter encostados (metades das larguras já garantem toque)
  const BUFFER = 0; // sem espaçamento adicional

  // verificar colisões com itens (coleta) e decrementar vida dos itens
  for(let i=items.length-1;i>=0;i--){
    const it = items[i];
    it.life -= dt;
    if(it.life <= 0){ items.splice(i,1); continue }
  if(it.x < player.x + player.w && it.x + it.w > player.x && it.y < player.y + player.h && it.y + it.h > player.y){
      // coletou: transformar o item em seguidor
      score += 1;
      const id = it.type.id || (it.type.name||'').toLowerCase();
      const nowMs = performance.now();
      // posicionar novo seguidor atrás do último da fila (ou do jogador se for o primeiro)
      const last = player.followers.length ? player.followers[player.followers.length - 1] : null;
      const leaderX = last ? last.x : (player.x + player.w/2);
      const leaderY = last ? last.y : (player.y + player.h/2);
      // direção aproximada: do líder até o jogador para posicionar atrás
      let dirX = (player.x + player.w/2) - leaderX;
      let dirY = (player.y + player.h/2) - leaderY;
      const mag = Math.hypot(dirX, dirY) || 1;
      dirX /= mag; dirY /= mag;
      const followerW = Math.round(it.w*0.9), followerH = Math.round(it.h*0.9);
  // distância inicial: exatamente as metades das larguras (toque)
  const desiredDist = (last ? (last.w + followerW)/2 : (player.w + followerW)/2) + BUFFER + MIN_FOLLOW_DIST;
      const fx = leaderX - dirX * desiredDist;
      const fy = leaderY - dirY * desiredDist;
  const follower = { id, x: fx, y: fy, w: followerW, h: followerH, vx:0, vy:0, invulnerableUntil: nowMs + 700 };
      player.followers.push(follower);
  // reset timers de manutenção de fila
  timeSinceLastCollect = 0;
  hasCollectedAny = true;
      // incrementar contador e atualizar UI
      if(collectedCounts[id] !== undefined) collectedCounts[id]++;
      updateCollectedUI();
      items.splice(i,1);
      playBeep(1100,0.08,'sine',0.14);
      continue;
    }
  }

  // atualizar posição dos seguidores: cada seguidor segue apenas o líder imediatamente à sua frente
  // atualizar posição dos seguidores: cada seguidor segue apenas o líder imediatamente à sua frente
  // usando um modelo de spring + damping para curvas mais suaves
  // física do spring: aumentada rigidez e amortecimento para manter união sem trepidação
  const SPRING_K = 80.0; // rigidez da mola (mais forte para segurar juntos)
  const DAMPING = 14.0; // amortecimento maior para evitar oscilações
  const MAX_SPEED = 500; // limite de velocidade para estabilidade
    for(let i=0;i<player.followers.length;i++){
      const seg = player.followers[i];
      // garantir propriedades de velocidade (em caso de followers criados antes da atualização)
      if(typeof seg.vx !== 'number') seg.vx = 0;
      if(typeof seg.vy !== 'number') seg.vy = 0;
      // líder imediato: jogador para i==0, senão follower[i-1]
      let leaderX, leaderY, leaderW, leaderH;
      if(i === 0){ leaderX = player.x + player.w/2; leaderY = player.y + player.h/2; leaderW = player.w; leaderH = player.h; }
      else { const p = player.followers[i-1]; leaderX = p.x; leaderY = p.y; leaderW = p.w; leaderH = p.h; }
      // vetor do líder até o seguidor
      let dx = seg.x - leaderX; let dy = seg.y - leaderY;
      let dist = Math.hypot(dx,dy);
      if(dist < 0.0001){ dx = 1; dy = 0; dist = 1; }
      const desired = (leaderW + seg.w)/2 + BUFFER + MIN_FOLLOW_DIST;
      const nx = dx / dist, ny = dy / dist;
      const targetX = leaderX + nx * desired;
      const targetY = leaderY + ny * desired;
      // força da mola: direção alvo - posição atual
      const fx = (targetX - seg.x) * SPRING_K;
      const fy = (targetY - seg.y) * SPRING_K;
      // amortecimento proporcional à velocidade
      const ax = fx - seg.vx * DAMPING;
      const ay = fy - seg.vy * DAMPING;
      // integrar velocidade e posição
      seg.vx += ax * dt;
      seg.vy += ay * dt;
      // limitar velocidade
      const spd = Math.hypot(seg.vx, seg.vy);
      if(spd > MAX_SPEED){ seg.vx = (seg.vx / spd) * MAX_SPEED; seg.vy = (seg.vy / spd) * MAX_SPEED; }
      seg.x += seg.vx * dt;
      seg.y += seg.vy * dt;
      // pequenas correções finais para evitar penetração excessiva
      const postDx = seg.x - leaderX; const postDy = seg.y - leaderY; const postDist = Math.hypot(postDx, postDy);
      if(postDist < desired * 0.7){ // se estiver muito perto, empurre levemente para trás
        // pequenas correções finais: se muito penetrado, ajuste suave (mas evitamos empurrões fortes para manter toque)
        const push = (desired - postDist) * 0.04;
        const pnX = postDx / (postDist || 1); const pnY = postDy / (postDist || 1);
        seg.x += pnX * push; seg.y += pnY * push;
      }
      // manter dentro da tela
      seg.x = Math.max(2 + seg.w/2, Math.min(canvas.width - seg.w/2 - 2, seg.x));
      seg.y = Math.max(2 + seg.h/2, Math.min(canvas.height - seg.h/2 - 2, seg.y));
  }

  // mecânica: se o jogador não coletar dentro do tempo, perde o último seguidor (se houver)
  if(hasCollectedAny){
    timeSinceLastCollect += dt;
  // calcular collectTimeout dinâmico: começa em collectTimeoutBase e desce linearmente até collectTimeoutMin
  const baseDynamic = Math.max(collectTimeoutMin, collectTimeoutBase - ( (collectTimeoutBase - collectTimeoutMin) * Math.min(1, elapsedGameTime / collectTimeoutScaleTime) ));
  // oscilar levemente ao longo do tempo para variar a janela de coleta (mais dinâmico)
  const oscAmp = Math.max(0.12, (baseDynamic - collectTimeoutMin) * 0.5);
  const osc = Math.sin(elapsedGameTime * 1.6) * oscAmp; // oscila 1.6 rad/s
  const collectTimeout = Math.max(collectTimeoutMin, Math.min(baseDynamic, baseDynamic + osc));
    if(timeSinceLastCollect >= collectTimeout){
      // quantos 'ticks' de timeout passaram? remover esse número de seguidores (cumulativo)
      const ticks = Math.floor(timeSinceLastCollect / collectTimeout) || 1;
      timeSinceLastCollect = timeSinceLastCollect - ticks * collectTimeout;
      let removed = 0;
      for(let k=0;k<ticks;k++){
        if(player.followers.length > 0){
          const rem = player.followers.pop();
          // registrar animação de remoção na posição do follower (timestamp em segundos)
          removedAnims.push({ x: rem.x, y: rem.y, w: rem.w, h: rem.h, start: performance.now() / 1000, life: 0.9 });
          removed++;
        } else break;
      }
      if(removed > 0){ updateCollectedUI(); playBeep(220,0.10,'sine',0.08); }
      // se a fila chegou a zero -> game over (novo requisito)
      if(hasCollectedAny && player.followers.length === 0){
        gameOver();
      }
    }
  }

  // atualizar tempo total de jogo
  elapsedGameTime += dt;

  // checar colisão: apenas se o primeiro seguidor (índice 0) bater em qualquer outro seguidor mais antigo -> game over
  const nowMsCheck = performance.now();
  // Antes: aqui verificávamos colisão da "cabeça" com seguidores mais antigos para game over.
  // Removido por solicitação: colisões não encerram mais o jogo.

  requestAnimationFrame(update);
  draw();
}

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // cenário simples (grama)
  ctx.fillStyle = '#bfeec9'; ctx.fillRect(0,0,canvas.width,canvas.height);
  // desenhar itens (criaturas) com bobbing e indicador de tempo de vida
  const now = performance.now() / 1000;
  for(const it of items){
    const bob = Math.sin(now * 3 + it.bobPhase) * 6;
    drawCreatureImage(it.type, it.x, it.y + bob, it.w, it.h);
    // barra de vida
    const pct = Math.max(0, Math.min(1, it.life / 14));
    ctx.fillStyle = '#00000055'; ctx.fillRect(it.x, it.y - 8 + bob, it.w, 4);
    ctx.fillStyle = '#7ef'; ctx.fillRect(it.x, it.y - 8 + bob, it.w * pct, 4);
  }
  // desenhar seguidores (atrás do jogador)
  for(const seg of player.followers){
    // seg.x/y representam o centro; ajustar ao desenhar
    const drawX = seg.x - seg.w/2;
    const drawY = seg.y - seg.h/2;
    const type = creatures.find(c=> (c.id || c.name.toLowerCase()) === seg.id) || creatures[0];
    drawCreatureImage(type, drawX, drawY, seg.w, seg.h);
  }
  // desenhar jogador por cima
  drawPlayer();
  // pontuação
  ctx.fillStyle = '#022'; ctx.font = '20px sans-serif'; ctx.fillText('Pontos: '+score, 12, 28);
  // temporizador do jogo (mm:ss)
  const totalSec = Math.floor(elapsedGameTime || 0);
  const mins = Math.floor(totalSec / 60); const secs = totalSec % 60;
  const timeStr = String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  ctx.fillStyle = '#022'; ctx.font = '18px sans-serif'; ctx.fillText('Tempo: ' + timeStr, canvas.width - 120, 28);
  // barra de manutenção da fila (mostra tempo restante até perder último seguidor)
  if(hasCollectedAny){
  // recalc collectTimeout (mesma fórmula usada no update) com pequena oscilação para visual
  const baseDynamicVis = Math.max(collectTimeoutMin, collectTimeoutBase - ( (collectTimeoutBase - collectTimeoutMin) * Math.min(1, elapsedGameTime / collectTimeoutScaleTime) ));
  const oscAmpVis = Math.max(0.12, (baseDynamicVis - collectTimeoutMin) * 0.5);
  const oscVis = Math.sin(elapsedGameTime * 1.6) * oscAmpVis;
  const collectTimeoutVis = Math.max(collectTimeoutMin, Math.min(baseDynamicVis, baseDynamicVis + oscVis));
    const barW = 160; const barH = 10; const bx = canvas.width/2 - barW/2; const by = 12;
    const pct = Math.max(0, Math.min(1, 1 - (timeSinceLastCollect / collectTimeoutVis)));
    ctx.fillStyle = '#00000044'; ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#6cf'; ctx.fillRect(bx, by, barW * pct, barH);
    ctx.strokeStyle = '#034'; ctx.strokeRect(bx, by, barW, barH);
    // desenhar contador numérico de segundos restantes
    const secondsLeft = Math.ceil(Math.max(0, collectTimeoutVis - timeSinceLastCollect));
    ctx.fillStyle = '#022'; ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(secondsLeft + 's', bx + barW/2, by + barH + 12);
    ctx.textAlign = 'start';
  }

  // desenhar animações de remoção (fade + zoom)
  const nowS = performance.now() / 1000;
  for(let i = removedAnims.length - 1; i >= 0; i--){
    const a = removedAnims[i];
    const age = nowS - a.start;
    if(age >= a.life){ removedAnims.splice(i,1); continue; }
    const t = age / a.life;
    const alpha = 1 - t;
    const scale = 1 + 0.5 * t;
    ctx.save(); ctx.globalAlpha = alpha;
    const drawX = a.x - (a.w/2) - (a.w*(scale-1)/2);
    const drawY = a.y - (a.h/2) - (a.h*(scale-1)/2);
    const drawW = a.w * scale; const drawH = a.h * scale;
    // desenhar um círculo simples + fade para crianças (usar cor neutra)
    ctx.fillStyle = '#ffb6c1'; ctx.beginPath(); ctx.ellipse(a.x, a.y, drawW/2, drawH/2, 0, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  }

  // overlay de game over
  if(gameOverFlag){
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = '#fff'; ctx.font = '44px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('Game Over', canvas.width/2, canvas.height/2 - 10);
    ctx.font = '18px sans-serif'; ctx.fillText('Pressione Reiniciar para tentar novamente', canvas.width/2, canvas.height/2 + 24);
    ctx.textAlign = 'start';
  }
}

// controles
const keys = {};
window.addEventListener('keydown', (e)=>{
  keys[e.key.toLowerCase()] = true;
  // impedir scroll quando usando as teclas de jogo
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
  // efeito sonoro leve ao apertar movimento
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key.toLowerCase())) playBeep(420,0.04,'sine',0.06);
});
window.addEventListener('keyup', (e)=>{ keys[e.key.toLowerCase()] = false });

// botões
document.getElementById('startBtn').addEventListener('click', ()=>{ if(!running){ running = true; lastTime = performance.now(); startMusic(); } document.getElementById('storyText').textContent = shortStory() });
function resetGame(){
  score = 0; items = []; player.x = 60; player.y = canvas.height/2; player.vx = 0; player.vy = 0; player.followers = []; followHistory.length = 0; collectedCounts.capivara = collectedCounts.pug = collectedCounts.dragon = 0; updateCollectedUI(); gameOverFlag = false;
}
document.getElementById('restartBtn').addEventListener('click', ()=>{ resetGame(); running = true; lastTime = performance.now(); });

function gameOver(){ if(gameOverFlag) return; gameOverFlag = true; running = false; playBeep(160,0.6,'sawtooth',0.18); }

// historinha curta gerada a partir do pedido do usuário
function shortStory(){
  return 'Hugo é um porquinho que adora correr com seus amigos: uma capivara curiosa, um pug brincalhão e um dragão amigo. Eles correm, pulam e se divertem. Ajude Hugo a colecionar seus amigos!';
}

// Áudio simples com WebAudio
let audioCtx = null;
function ensureAudio(){ if(!audioCtx){ audioCtx = new (window.AudioContext || window.webkitAudioContext)() } }
function playBeep(freq,dur,type,gain){ try{ ensureAudio(); const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type = type||'sine'; o.frequency.value = freq||440; g.gain.value = gain||0.1; o.connect(g); g.connect(audioCtx.destination); o.start(); g.gain.setValueAtTime(g.gain.value, audioCtx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur); o.stop(audioCtx.currentTime + dur + 0.02) }catch(e){ /* ignore */ } }

// música de fundo leve (opcional)
let musicOn = false; let musicNode = null;
function startMusic(){ if(!musicOn) return; ensureAudio(); if(musicNode) return; const master = audioCtx.createGain(); master.gain.value = 0.08; master.connect(audioCtx.destination); musicNode = {master}; const notes = [440,660,550,660]; let step=0; function schedule(){ const now = audioCtx.currentTime; for(let i=0;i<3;i++){ const when = now + i*0.35; const o = audioCtx.createOscillator(); const g = audioCtx.createGain(); o.type='triangle'; o.frequency.value = notes[(step+i)%notes.length]; g.gain.setValueAtTime(0.0001, when); g.gain.exponentialRampToValueAtTime(0.12, when+0.02); g.gain.exponentialRampToValueAtTime(0.0001, when+0.32); o.connect(g); g.connect(master); o.start(when); o.stop(when+0.34); } step = (step+3)%notes.length; musicNode.timeout = setTimeout(schedule, 1200) } schedule(); }
function stopMusic(){ if(musicNode){ clearTimeout(musicNode.timeout); musicNode.master.disconnect(); musicNode=null } }

// Ativar/desativar mudo
document.getElementById('mute').addEventListener('change', (e)=>{ const muted = e.target.checked; if(muted) stopMusic(); else { if(musicOn) startMusic() } });

// iniciar loop para desenhar mesmo parado
requestAnimationFrame(update);

// toque de abertura
function init(){ draw(); }
init();
