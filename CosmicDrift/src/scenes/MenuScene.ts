import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  private startButton!: Phaser.GameObjects.Text;
  private rankingButton!: Phaser.GameObjects.Text;
  private muteButton!: Phaser.GameObjects.Text;
  private volumeSlider!: Phaser.GameObjects.Graphics;

  constructor() {
    super('MenuScene');
  }

  preload() {
    this.load.image('menu_background', 'assets/images/menu_background.png');
    // this.load.audio('menu_theme', 'assets/audio/menu_theme.wav');
    // this.load.audio('button_click', 'assets/audio/button_click.wav');
  }

  create() {
    // Background
    this.add.image(400, 300, 'menu_background');

    // Title
    this.add.text(400, 200, 'Cosmic Drift', { fontSize: '48px', color: '#FFC107' }).setOrigin(0.5);

    // Play menu theme
    // this.sound.add('menu_theme').play({ loop: true });

    // Start Game Button
    this.startButton = this.add.text(400, 300, 'Start Game', { fontSize: '24px', color: '#FFFFFF' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        // this.sound.add('button_click').play();
        this.scene.start('GameScene');
      });

    // Ranking Button
    this.rankingButton = this.add.text(400, 350, 'Ranking', { fontSize: '24px', color: '#FFFFFF' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        // this.sound.add('button_click').play();
        this.showRanking();
      });

    // Mute Button
    this.muteButton = this.add.text(400, 400, 'Mute', { fontSize: '24px', color: '#FFFFFF' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        // this.sound.add('button_click').play();
        this.toggleMute();
      });

    // Volume Slider (simple representation)
    this.volumeSlider = this.add.graphics();
    this.volumeSlider.fillStyle(0xFFFFFF);
    this.volumeSlider.fillRect(350, 450, 100, 10);
  }

  showRanking() {
    // Display local ranking from localStorage
    const rankings = JSON.parse(localStorage.getItem('cosmicDriftRankings') || '[]');
    let text = 'Ranking:\n';
    rankings.forEach((entry: any, index: number) => {
      text += `${index + 1}. ${entry.name}: ${entry.score}\n`;
    });
    this.add.text(400, 500, text, { fontSize: '16px', color: '#E0E0E0' }).setOrigin(0.5);
  }

  toggleMute() {
    // Toggle audio mute
    this.sound.mute = !this.sound.mute;
    this.muteButton.setText(this.sound.mute ? 'Unmute' : 'Mute');
  }
}