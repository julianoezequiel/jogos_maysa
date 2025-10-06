// Main game script (migrated from inline index.html)
(function () {
  const config = {
    type: Phaser.AUTO,
    width: 828,
    height: 612,
    pixelArt: true,
    roundPixels: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { y: 800 },
        debug: false
      }
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };

  const game = new Phaser.Game(config);

  let player;
  let batteryLevel = 1.0; // 100%
  let restartKey;
  let gameOverText;
  let cursors;
  let isJumping = false;
  let isDead = false;
  let score = 0;
  let waveCount = 1;
  let waveDamageTaken = false;
  let scoreText;
  let highScore = 0;
  let highScoreText;
  let waveText;
  let gameStarted = false;
  let introOverlay, introText, startKey;
  let introSpeaking = false;
  let introSpoken = false;
  let batteryFlickerTween;
  let isPaused = false;
  let pauseText, pauseOverlay;
  let batteryWarningOverlay;
  let backgroundMusic = null;
  let playerName = '';
  let _scoreSavedThisRun = false;

  // DOM buttons (will be bound in create)
  let startBtnEl = null;
  let restartBtnEl = null;

  function resetGameState() {
    // reset runtime flags so a scene restart starts clean
    batteryLevel = 1.0;
    isDead = false;
    score = 0;
    waveCount = 1;
    waveDamageTaken = false;
    gameStarted = false;
    introOverlay = null;
    introText = null;
    introSpeaking = false;
    introSpoken = false;
    _scoreSavedThisRun = false;
    isPaused = false;
    if (batteryFlickerTween) { try { batteryFlickerTween.stop(); } catch (e) {} }
    batteryFlickerTween = null;
    if (pauseText) { try { pauseText.destroy(); } catch (e) {} }
    pauseText = null; if (pauseOverlay) { try { pauseOverlay.destroy(); } catch (e) {} } pauseOverlay = null;
    if (gameOverText) { try { gameOverText.setVisible(false); } catch (e) {} }
  }

  function showStartButton() { try { if (!startBtnEl) startBtnEl = document.getElementById('start-btn'); if (startBtnEl) startBtnEl.style.display = 'block'; } catch (e) {} }
  function hideStartButton() { try { if (!startBtnEl) startBtnEl = document.getElementById('start-btn'); if (startBtnEl) startBtnEl.style.display = 'none'; } catch (e) {} }
  function showRestartButton() { try { if (!restartBtnEl) restartBtnEl = document.getElementById('restart-btn'); if (restartBtnEl) restartBtnEl.style.display = 'block'; } catch (e) {} }
  function hideRestartButton() { try { if (!restartBtnEl) restartBtnEl = document.getElementById('restart-btn'); if (restartBtnEl) restartBtnEl.style.display = 'none'; } catch (e) {} }

  function restartGame(scene) {
    try {
      if (score > highScore) { highScore = score; localStorage.setItem('battery_bot_highscore', highScore); }
    } catch (e) {}
    resetGameState();
    hideRestartButton();
    // restart the Phaser scene to re-run preload/create lifecycle
    try { scene.scene.restart(); } catch (e) { console.warn('Failed to restart scene', e); }
  }

  // --- Leaderboard helpers (stored in localStorage as JSON) ---
  function normalizeName(name) {
    if (!name) return 'Guerreira';
    // remove control characters, collapse whitespace, keep unicode letters
    name = name.replace(/\p{C}/gu, ''); // remove invisible/control chars
    name = name.replace(/\s+/g, ' ').trim();
    if (!name) return 'Guerreira';
    return name.slice(0, 32);
  }

  function loadLeaderboard() {
    try {
      const raw = localStorage.getItem('battery_bot_leaderboard');
      if (!raw) return {};
      return JSON.parse(raw);
    } catch (e) {
      return {};
    }
  }

  function saveLeaderboard(board) {
    try {
      localStorage.setItem('battery_bot_leaderboard', JSON.stringify(board));
    } catch (e) {
      console.warn('Failed to save leaderboard', e);
    }
  }

  function saveScoreToLeaderboard(name, score) {
    const norm = normalizeName(name || localStorage.getItem('battery_bot_player_name') || 'Guerreira');
    const board = loadLeaderboard();
    const prev = parseInt(board[norm]) || 0;
    if (score > prev) {
      board[norm] = score;
      saveLeaderboard(board);
    }
    // also save last used name
    try { localStorage.setItem('battery_bot_player_name', norm); } catch (e) {}
  }

  function showRankingModal() {
    const modal = document.getElementById('ranking-modal');
    const list = document.getElementById('ranking-list');
    if (!modal || !list) return;
    // populate
    const board = loadLeaderboard();
    const entries = Object.keys(board).map(n => ({ name: n, score: board[n] }));
    entries.sort((a, b) => b.score - a.score);
    list.innerHTML = '';
    entries.forEach(e => {
      const li = document.createElement('li');
      li.textContent = `${e.name} — ${e.score}`;
      list.appendChild(li);
    });
    modal.style.display = 'flex';
  }

  function hideRankingModal() {
    const modal = document.getElementById('ranking-modal');
    if (modal) modal.style.display = 'none';
  }

  function preload() {
    this.load.image('robot_stand', 'assets/robot/robot_stand.png');
    this.load.image('robot_walk', 'assets/robot/robot_walk.png');
    this.load.image('robot_jump', 'assets/robot/robot_jump.png');
    this.load.image('robot_damaged', 'assets/robot/robot_damaged.png');
    this.load.image('battery_bar', 'assets/bar_round_small.png');
    this.load.image('battery', 'assets/pug.png');
    this.load.image('flying_bot1', 'assets/flying_bot1.png');
    this.load.image('flying_bot2', 'assets/flying_bot2.png');
    this.load.image('flying_bot3', 'assets/flying_bot3.png');
    this.load.image('background', 'assets/background.png');

    this.load.audio('bg_music', ['assets/background.mp3']);
    this.load.audio('collision_sound', 'assets/collision.ogg');
    this.load.audio('collect_sound', 'assets/collect.ogg');
    this.load.audio('gameover_sound', 'assets/game-over.ogg');

    this.load.image('tiles', 'assets/tilemap_packed.png');
    this.load.tilemapTiledJSON('map', 'assets/tilemap.json');
  }

  function create() {
    // Hook modal submit (if DOM is ready)
    try {
      const nameInput = document.getElementById('player-name');
      const nameSubmit = document.getElementById('name-submit');
      const scene = this;
      if (nameInput && nameSubmit) {
        // Disable Phaser keyboard handling while the HTML input is active so
        // the engine doesn't intercept letters like 'a'. We'll re-enable on submit.
        try {
          if (scene.input && scene.input.keyboard) scene.input.keyboard.enabled = false;
          // focus the input so the browser cursor is active and it receives keys
          nameInput.focus();
        } catch (e) {}

        // Capture-phase handlers: stop other listeners (for example Phaser's)
        // from intercepting key events destined for the input. We stop other
        // handlers but do not call preventDefault so the input receives the
        // characters normally.
        const captureKeyDown = function (ev) {
          try {
            if (ev.target === nameInput || nameInput.contains(ev.target)) {
              ev.stopImmediatePropagation();
            }
          } catch (e) { /* ignore */ }
        };
        const captureKeyPress = function (ev) {
          try {
            if (ev.target === nameInput || nameInput.contains(ev.target)) {
              ev.stopImmediatePropagation();
            }
          } catch (e) { /* ignore */ }
        };

        window.addEventListener('keydown', captureKeyDown, true);
        window.addEventListener('keypress', captureKeyPress, true);

        nameSubmit.addEventListener('click', () => {
          const val = nameInput.value;
          playerName = normalizeName(val);
          try { localStorage.setItem('battery_bot_player_name', playerName); } catch (e) {}
          const modal = document.getElementById('name-modal');
          if (modal) modal.style.display = 'none';
          // Re-enable Phaser keyboard now that input is closed
          try { if (scene.input && scene.input.keyboard) scene.input.keyboard.enabled = true; } catch (e) {}
          // remove the capture handlers we added
          try { window.removeEventListener('keydown', captureKeyDown, true); } catch (e) {}
          try { window.removeEventListener('keypress', captureKeyPress, true); } catch (e) {}
          // Immediately show intro and start narration now that we have the name
          try { showIntroOverlay.call(scene); } catch (e) { /* ignore */ }
        });

        // Allow pressing Enter in the input to submit
        nameInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            nameSubmit.click();
          }
        });
        // Focus input for convenience
        nameInput.focus();
      }
    } catch (e) {
      // ignore if DOM not available for some reason
    }

    const bg = this.add.image(0, 0, 'background').setOrigin(0);
    bg.displayWidth = this.sys.game.config.width;
    bg.displayHeight = this.sys.game.config.height;
    bg.setScrollFactor(0);

    cursors = this.input.keyboard.createCursorKeys();
    // Create flying bot animation
    this.anims.create({
      key: 'fly',
      frames: [
        { key: 'flying_bot1' },
        { key: 'flying_bot2' },
        { key: 'flying_bot3' }
      ],
      frameRate: 10,
      repeat: -1
    });
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D
    });

    // load and render tilemap
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('tilemap_packed', 'tiles');
    const groundLayer = map.createLayer('Level', tileset, 0, 0);
    groundLayer.setScale(2);
    groundLayer.setCollisionByProperty({ collides: true });

    // player
    player = this.physics.add.sprite(400, 500, 'robot_stand');
    player.setCollideWorldBounds(true);
    player.setBounce(0.1);
    player.setDragX(600);
    player.setScale(0.25);

    this.batteryBar = this.add.image(40, 20, 'battery_bar').setOrigin(0, 0);
    this.batteryBarWidth = this.batteryBar.width;

    this.batteryText = this.add.text(40, 50, '', {
      font: '16px monospace',
      fill: '#000'
    }).setOrigin(0, 0);

    // Animation effect setup
    player.currentFrame = 'robot_walk';
    player.lastFrameTime = 0;
    player.frameInterval = 150; // milliseconds

    // Create a group of 8 falling batteries
    this.batteries = this.physics.add.group({
      key: 'battery',
      repeat: 7,
      setXY: { x: 54, y: 0, stepX: 96 }
    });

    // Set battery properties
    this.batteries.children.iterate(function (child) {
      child.setBounce(0);
      child.setScale(0.15);
    });

    scoreText = this.add.text(40, 80, 'Pugs Mortos: 0', {
      font: '16px monospace',
      fill: '#000'
    }).setOrigin(0, 0);

    highScore = parseInt(localStorage.getItem('battery_bot_highscore')) || 0;
    highScoreText = this.add.text(40, 100, 'Recorde: ' + highScore, {
      font: '16px monospace',
      fill: '#000'
    }).setOrigin(0, 0);

    // Colliders
    this.physics.add.collider(player, groundLayer);
    this.physics.add.collider(this.batteries, groundLayer);
    this.physics.add.overlap(player, this.batteries, collectBattery, null, this);

    // Setup keyboard for skipping intro
    startKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Wait until player lands on floor, then show intro
    this.time.addEvent({
      delay: 100,
      loop: true,
      callback: () => {
        // Only show intro automatically after the player has provided a name.
        // This avoids showing the intro with a default name before the modal is used.
        if (player.body.onFloor() && !gameStarted && playerName && !introOverlay) {
          showIntroOverlay.call(this);
        }
      }
    });

    // Create group for flying enemies
    this.flyingEnemies = this.physics.add.group();
    this.physics.add.overlap(player, this.flyingEnemies, handleEnemyHit, null, this);

    restartKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R);

    gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'FIM DE JOGO\nVocê foi derrotada pelos pugs!', {
      font: '24px monospace',
      fill: '#000',
      align: 'center'
    }).setOrigin(0.5).setVisible(false);
    gameOverText.setDepth(20);

    batteryWarningOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0xff0000, 0.3)
      .setOrigin(0.5)
      .setDepth(25)
      .setVisible(false);

    if (!backgroundMusic) {
      backgroundMusic = this.sound.add('bg_music', { volume: 0.5, loop: true });
      backgroundMusic.play();
    }

    // ranking button hooks
    try {
      const rankBtn = document.getElementById('ranking-btn');
      const rankClose = document.getElementById('ranking-close');
      if (rankBtn) rankBtn.addEventListener('click', showRankingModal);
      if (rankClose) rankClose.addEventListener('click', hideRankingModal);
      // Start / Restart buttons
      startBtnEl = document.getElementById('start-btn');
      restartBtnEl = document.getElementById('restart-btn');
      if (startBtnEl) {
        startBtnEl.style.display = 'none';
        startBtnEl.addEventListener('click', () => {
          // emulate pressing space: cancel speech and start
          try { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
          introSpeaking = false; introSpoken = true;
          if (introOverlay) { introOverlay.destroy(); introOverlay = null; }
          if (introText) { introText.destroy(); introText = null; }
          hideStartButton();
          gameStarted = true;
        });
      }
      if (restartBtnEl) {
        restartBtnEl.style.display = 'none';
        restartBtnEl.addEventListener('click', () => { restartGame(this); });
      }
      // Restart options buttons
      try {
        const restartOptions = document.getElementById('restart-options');
        const restartSame = document.getElementById('restart-same');
        const restartNew = document.getElementById('restart-new');
        if (restartOptions) restartOptions.style.display = 'none';
        if (restartSame) restartSame.addEventListener('click', () => { restartGame(this); });
        if (restartNew) restartNew.addEventListener('click', () => {
          // show name modal to enter a new player name
          try {
            const modal = document.getElementById('name-modal');
            const nameInput = document.getElementById('player-name');
            const nameSubmit = document.getElementById('name-submit');
            if (modal && nameInput && nameSubmit) {
              modal.style.display = 'flex';
              nameInput.value = '';
              nameInput.focus();
              // when they submit a new name, restart the game
              const onceHandler = function () {
                try { playerName = normalizeName(nameInput.value); localStorage.setItem('battery_bot_player_name', playerName); } catch (e) {}
                try { modal.style.display = 'none'; } catch (e) {}
                // ensure Phaser keyboard enabled
                try { if (scene.input && scene.input.keyboard) scene.input.keyboard.enabled = true; } catch (e) {}
                // remove this listener
                try { nameSubmit.removeEventListener('click', onceHandler); } catch (e) {}
                restartGame(scene);
              };
              nameSubmit.addEventListener('click', onceHandler);
            }
          } catch (e) { console.warn(e); }
        });
      } catch (e) {}
    } catch (e) {}
  }

  function update(time, delta) {
    if (!gameStarted) {
      if (introOverlay && Phaser.Input.Keyboard.JustDown(startKey)) {
        // If speech is playing, cancel it immediately so we don't overlap.
        try { if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (e) {}
        introSpeaking = false; introSpoken = true;
        if (introOverlay) { introOverlay.destroy(); introOverlay = null; }
        if (introText) { introText.destroy(); introText = null; }
        gameStarted = true;
      }
      return;
    }

    // Toggle pause/resume with SPACE
    if (Phaser.Input.Keyboard.JustDown(startKey)) {
      isPaused = !isPaused;

      if (isPaused) {
        this.physics.world.pause();
        this.flyingEnemies.children.iterate(enemy => { if (enemy.anims) enemy.anims.pause(); });

        pauseOverlay = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width, this.scale.height, 0x000000, 0.5)
          .setOrigin(0.5)
          .setDepth(19);

        pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'PAUSADO\nPressione ESPAÇO para continuar', {
          font: '24px monospace', fill: '#ffffff', align: 'center'
        }).setOrigin(0.5).setDepth(20);

      } else {
        this.physics.world.resume();
        this.flyingEnemies.children.iterate(enemy => { if (enemy.anims) enemy.anims.resume(); });
        if (pauseText) pauseText.destroy();
        if (pauseOverlay) pauseOverlay.destroy();
      }
    }

    if (isPaused) return;

    if (!isDead) {
      const speed = 160;
      const jumpPower = -540;
      const onGround = player.body.onFloor();

      const moveLeft = cursors.left.isDown || this.keys.left.isDown;
      const moveRight = cursors.right.isDown || this.keys.right.isDown;
      const jumpPressed = cursors.up.isDown || this.keys.up.isDown;

      if (moveLeft) { player.setVelocityX(-speed); player.setFlipX(true); if (onGround) animateWalkEffect(this, time); }
      else if (moveRight) { player.setVelocityX(speed); player.setFlipX(false); if (onGround) animateWalkEffect(this, time); }
      else { player.setVelocityX(0); if (onGround) player.setTexture('robot_stand'); }

      if (jumpPressed && onGround) { player.setVelocityY(jumpPower); player.setTexture('robot_jump'); }

      batteryLevel -= 0.0004;
      batteryLevel = Phaser.Math.Clamp(batteryLevel, 0, 1);

      const croppedWidth = this.batteryBarWidth * batteryLevel;
      this.batteryBar.setCrop(0, 0, croppedWidth, this.batteryBar.height);

      if (batteryLevel < 0.1) batteryWarningOverlay.setVisible(true); else batteryWarningOverlay.setVisible(false);

      if (batteryLevel < 0.2) {
        if (!batteryFlickerTween) batteryFlickerTween = this.tweens.add({ targets: this.batteryBar, alpha: { from: 1, to: 0 }, yoyo: true, repeat: -1, duration: 300 });
      } else {
        if (batteryFlickerTween) { batteryFlickerTween.stop(); batteryFlickerTween = null; this.batteryBar.setAlpha(1); }
      }

      if (batteryLevel <= 0) {
        isDead = true;
        player.setTexture('robot_damaged'); player.setOrigin(0.5, 1); player.setTint(0xff0000);
        player.body.setSize(player.width, player.height, false); player.body.setOffset(0, 0);
      }

    } else {
      player.setVelocityX(0);

      if (player.body.onFloor()) {
        if (!gameOverText.visible) {
          batteryLevel = 0;
          this.batteryText.setText('Vida: 0.0%');
          gameOverText.setVisible(true);
          this.sound.play('gameover_sound', { volume: 0.7 });
          this.tweens.add({ targets: gameOverText, x: { from: 395, to: 405 }, duration: 100, ease: 'Sine.easeInOut', yoyo: true, repeat: 10 });
          // Save score once per run
          if (!_scoreSavedThisRun) {
            try { saveScoreToLeaderboard(playerName || localStorage.getItem('battery_bot_player_name'), score); } catch (e) { }
            _scoreSavedThisRun = true;
          }
          // show restart options so the player can choose same player or new player
          try { hideStartButton(); } catch (e) {}
          try { const opts = document.getElementById('restart-options'); if (opts) opts.style.display = 'block'; } catch (e) {}
        }
      }

      if (Phaser.Input.Keyboard.JustDown(restartKey)) {
        // Use the centralized restart to avoid stale flags and stuck state
        restartGame(this);
      }

      return;
    }

    this.flyingEnemies.children.iterate(function (enemy) {
      if (enemy.active) {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);
        const speed = 40;
        enemy.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      }
    });

    this.batteryText.setText('Vida: ' + (batteryLevel * 100).toFixed(1) + '%');
  }

  function animateWalkEffect(scene, time) {
    if (time - player.lastFrameTime > player.frameInterval) {
      player.currentFrame = (player.currentFrame === 'robot_walk') ? 'robot_stand' : 'robot_walk';
      player.setTexture(player.currentFrame);
      player.lastFrameTime = time;
    }
  }

  function collectBattery(player, battery) {
    this.sound.play('collect_sound', { volume: 0.5 });
    battery.disableBody(true, true);
    score += 1;
    scoreText.setText('Pugs Mortos: ' + score);

    if (this.batteries.countActive(true) === 0 && !waveDamageTaken) {
      batteryLevel += 0.2; batteryLevel = Phaser.Math.Clamp(batteryLevel, 0, 1);
      const croppedWidth = this.batteryBarWidth * batteryLevel; this.batteryBar.setCrop(0, 0, croppedWidth, this.batteryBar.height);
      const perfectText = this.add.text(this.scale.width / 2, 120, 'ONDA PERFEITA +10 VIDA!', { font: '20px monospace', fill: '#00ff00' }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: perfectText, alpha: 0, y: 80, duration: 3000, ease: 'Power1', onComplete: () => { perfectText.destroy(); } });
    }

    batteryLevel += 0.05; batteryLevel = Phaser.Math.Clamp(batteryLevel, 0, 1);
    const croppedWidth = this.batteryBarWidth * batteryLevel; this.batteryBar.setCrop(0, 0, croppedWidth, this.batteryBar.height);

    if (this.batteries.countActive(true) === 0) {
      waveDamageTaken = false; waveCount += 1;
      if (waveText) waveText.destroy();
      waveText = this.add.text(this.scale.width / 2, 40, 'ONDA ' + waveCount, { font: '32px monospace', fill: '#000000' }).setOrigin(0.5).setDepth(30);
      this.tweens.add({ targets: waveText, alpha: 0, duration: 2000, ease: 'Power1', onComplete: () => { waveText.destroy(); } });

      this.batteries.children.iterate(function (child) { child.enableBody(true, child.x, 0, true, true); });

      if (waveCount >= 2) {
        for (let i = 0; i < 2; i++) {
          const enemy = this.flyingEnemies.create(Phaser.Math.Between(50, 778), -30, 'flying_bot1');
          enemy.setScale(1.5); enemy.play('fly'); enemy.setBounce(0); enemy.setImmovable(true); enemy.body.allowGravity = false;
        }
      }
    }
  }

  function handleEnemyHit(player, enemy) {
    this.sound.play('collision_sound', { volume: 0.6 });
    enemy.body.enable = false; enemy.setVelocity(0, 0);
    this.tweens.add({ targets: enemy, alpha: 0, scale: 0.1, duration: 300, ease: 'Power2', onComplete: () => { enemy.disableBody(true, true); enemy.setAlpha(1); enemy.setScale(1.5); } });
    waveDamageTaken = true;
    player.setTint(0xff0000);
    player.scene.time.delayedCall(200, () => { player.clearTint(); });
    batteryLevel -= 0.1; batteryLevel = Phaser.Math.Clamp(batteryLevel, 0, 1);
    const croppedWidth = this.batteryBarWidth * batteryLevel; this.batteryBar.setCrop(0, 0, croppedWidth, this.batteryBar.height);
    if (batteryLevel <= 0) { isDead = true; player.setTexture('robot_damaged'); player.setOrigin(0.5, 1); player.setTint(0xff0000); player.body.setSize(player.width, player.height, false); player.body.setOffset(0, 0); }
  }

  function showIntroOverlay() {
    if (introOverlay) return; // Don't show again
    introOverlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.8).setOrigin(0);
    introOverlay.setDepth(10);

    // personalize intro with playerName
    const displayName = playerName && playerName.length ? playerName : 'Guerreira';
    const introFullText = `• CAÇADORA DE PUGS •\n\nGUERREIRA ${displayName}\n\nVocê é uma menina corajosa em uma vila infestada de pugs malvados.\n\nOs pugs estão tomando conta de tudo, destruindo casas e assustando moradores.\nSua missão é encontrar e eliminar todos os pugs!\n\nCorra, pule e mate os pugs coletando-os antes que eles caiam.\n\nMas cuidado com os robôs voadores que protegem os pugs.\nEles vão te atacar se te verem.\n\nMate o máximo de pugs possível. Cada pug morto é uma vitória!\n\nPRESSIONE ESPAÇO PARA COMEÇAR`;

    introText = this.add.text(400, 300, introFullText, { font: '20px monospace', fill: '#ffffff', align: 'center' }).setOrigin(0.5).setDepth(11);
  // show start button so player can click instead of pressing SPACE
  try { showStartButton(); } catch (e) {}

    // Adicionar narração usando Web Speech API com o nome primeiro
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const speechText = `Guerreira ${displayName}. Sua missão é encontrar e eliminar todos os pugs. Corra, pule e cuidado com os robôs voadores.`;
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = 'pt-BR'; // português brasileiro
        // mark speaking state and clear previous speech
        try { window.speechSynthesis.cancel(); } catch (e) {}
        introSpeaking = true;
        introSpoken = false;
        utterance.onend = function () { introSpeaking = false; introSpoken = true; };
        utterance.onerror = function () { introSpeaking = false; introSpoken = true; };
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('SpeechSynthesis failed:', e);
        introSpeaking = false; introSpoken = true;
      }
    } else {
      introSpeaking = false; introSpoken = true;
    }
  }

})();
