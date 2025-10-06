import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private shards!: Phaser.Physics.Arcade.Group;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private speedMultiplier: number = 1.0;
  private obstacleSpawnTimer!: Phaser.Time.TimerEvent;
  private gameOver: boolean = false;

  constructor() {
    super('GameScene');
  }

  preload() {
    // this.load.spritesheet('player', 'assets/images/player_spritesheet.png', { frameWidth: 24, frameHeight: 24 });
    this.load.image('player', 'assets/images/rocha_solida.png');
    this.load.image('rocha_solida', 'assets/images/rocha_solida.png');
    this.load.image('rocha_estilhacada', 'assets/images/rocha_estilhacada_spritesheet.png');
    this.load.image('cosmic_shard', 'assets/images/cosmic_shard_spritesheet.png');
    this.load.image('game_background', 'assets/images/game_background.png');
    // this.load.audio('gameplay_theme', 'assets/audio/gameplay_theme.wav');
    // this.load.audio('jump', 'assets/audio/jump.wav');
    // this.load.audio('collect_shard', 'assets/audio/collect_shard.wav');
    // this.load.audio('collision', 'assets/audio/collision.wav');
    // this.load.audio('game_over', 'assets/audio/game_over.wav');
    // this.load.audio('power_up', 'assets/audio/power_up.wav');
    // this.load.image('particle_texture', 'assets/images/particle_texture.png');
    // this.load.json('effects', 'assets/particles/effects.json');
  }

  create() {
    // Background
    this.add.image(400, 300, 'game_background');

    // Play gameplay theme
    // this.sound.add('gameplay_theme').play({ loop: true });

    // Player
    this.player = this.physics.add.sprite(100, 300, 'player');
    this.player.setCollideWorldBounds(true);

    // Groups
    this.obstacles = this.physics.add.group();
    this.shards = this.physics.add.group();

    // Score
    this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '18px', color: '#FFFFFF' });

    // Input
    this.input!.keyboard!.on('keydown-SPACE', this.jump, this);

    // Collisions
    this.physics.add.collider(this.player, this.obstacles, this.hitObstacle, undefined, this);
    this.physics.add.overlap(this.player, this.shards, this.collectShard, undefined, this);

    // Spawn timer
    this.obstacleSpawnTimer = this.time.addEvent({ delay: 2000, callback: this.spawnObstacle, callbackScope: this, loop: true });
  }

  update() {
    if (this.gameOver) return;

    // Move background or obstacles left
    this.obstacles.children.entries.forEach((obstacle: any) => {
      obstacle.x -= 2 * this.speedMultiplier;
      if (obstacle.x < -50) obstacle.destroy();
    });

    this.shards.children.entries.forEach((shard: any) => {
      shard.x -= 2 * this.speedMultiplier;
      if (shard.x < -50) shard.destroy();
    });

    // Increase difficulty
    if (this.score > 100) this.speedMultiplier = 1.5;
    if (this.score > 500) this.speedMultiplier = 2.0;
  }

  jump() {
    if (this.player.body!.touching.down) {
      this.player.setVelocityY(-400);
    }
  }

  spawnObstacle() {
    const obstacle = this.obstacles.create(800, 500, 'obstacle');
    obstacle.setVelocityX(-200 * this.speedMultiplier);
  }

  collectShard(player: any, shard: any) {
    shard.destroy();
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }

  hitObstacle() {
    this.gameOver = true;
    this.physics.pause();
    this.saveScore();
    this.scene.start('MenuScene');
  }

  saveScore() {
    const name = prompt('Enter your name:') || 'Anonymous';
    const rankings = JSON.parse(localStorage.getItem('cosmicDriftRankings') || '[]');
    rankings.push({ name, score: this.score });
    rankings.sort((a: any, b: any) => b.score - a.score);
    localStorage.setItem('cosmicDriftRankings', JSON.stringify(rankings.slice(0, 10)));
  }
}