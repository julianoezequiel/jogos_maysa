// simple p5 game: Cat vs Dog
let catImg, dogImg;
let running = false;
let gameOver = false;
let lastAttack = 0;
let cat = { x:120,y:200,hp:100,dir:0 };
let dog = { x:600,y:200,hp:100,dir:0 };

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
    checkCollisions();
  }
  // draw characters
  push(); translate(cat.x,cat.y); image(catImg,0,0,80,80); pop();
  push(); translate(dog.x,dog.y); image(dogImg,0,0,92,92); pop();
  // HUD
  document.getElementById('catHealth').textContent = 'Gato: ' + cat.hp;
  document.getElementById('dogHealth').textContent = 'Cachorro: ' + dog.hp;
  if(gameOver){ drawGameOver(); }
}

function handleInput(){ if(keyIsDown(LEFT_ARROW)) cat.x -= 3; if(keyIsDown(RIGHT_ARROW)) cat.x += 3; if(keyIsDown(UP_ARROW)) cat.y -= 3; if(keyIsDown(DOWN_ARROW)) cat.y += 3; if(keyIsDown(32)){ // space attack
    if(millis() - lastAttack > 500){ lastAttack = millis();
      // if close to dog, damage
      if(dist(cat.x,cat.y,dog.x,dog.y) < 80){ dog.hp -= 12; spawnSpark(dog.x,dog.y); }
    }
  }}

function updateAI(){ // dog tries to approach cat and attack
  const ang = atan2(cat.y - dog.y, cat.x - dog.x);
  dog.x += cos(ang) * 1.6; dog.y += sin(ang) * 1.6;
  if(dist(cat.x,cat.y,dog.x,dog.y) < 80 && millis() - lastAttack > 600){ lastAttack = millis(); cat.hp -= 10; spawnSpark(cat.x,cat.y); }
}

function checkCollisions(){ if(cat.hp <= 0 || dog.hp <= 0){ running = false; gameOver = true; const loser = cat.hp <= 0 ? 'Gato' : 'Cachorro'; const winner = cat.hp <= 0 ? 'Cachorro' : 'Gato'; document.getElementById('message').textContent = winner + ' venceu!'; setTimeout(()=>{ showGameOverOverlay(loser); },200); } }

function showGameOverOverlay(loser){ const container = document.getElementById('canvas-container'); let ov = document.getElementById('gameOver'); if(!ov){ ov = document.createElement('div'); ov.id='gameOver'; container.appendChild(ov); }
  ov.innerHTML = '<div>' + loser + ' perdeu</div><div id="insult">Noob</div><button id="reloadBtn">Voltar</button>';
  document.getElementById('reloadBtn').addEventListener('click', ()=>{ location.reload(); });
}

function drawGameOver(){ }

function spawnSpark(x,y){ for(let i=0;i<12;i++){ const s = document.createElement('div'); s.style.position='absolute'; s.style.left=(x + random(-8,8))+'px'; s.style.top=(y + random(-8,8))+'px'; s.style.width='6px'; s.style.height='6px'; s.style.background='#ffd24a'; s.style.borderRadius='50%'; s.style.opacity='0.9'; document.getElementById('canvas-container').appendChild(s); setTimeout(()=>{ s.remove(); },260); } }
