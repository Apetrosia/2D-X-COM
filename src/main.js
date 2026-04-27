import Phaser from 'phaser';

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  create() {
    this.cameras.main.setBackgroundColor('#0f172a');

    this.add
      .text(this.scale.width / 2, this.scale.height / 2 - 24, 'Phaser Starter', {
        fontFamily: 'Segoe UI',
        fontSize: '48px',
        color: '#e2e8f0'
      })
      .setOrigin(0.5);

    const marker = this.add.circle(this.scale.width / 2, this.scale.height - 80, 20, 0x22d3ee);
    this.tweens.add({
      targets: marker,
      y: marker.y - 25,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }
}

const config = {
  type: Phaser.AUTO,
  parent: 'app',
  width: 1280,
  height: 720,
  backgroundColor: '#0f172a',
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      debug: false
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

new Phaser.Game(config);
