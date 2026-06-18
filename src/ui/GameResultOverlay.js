import Phaser from 'phaser';

export class GameResultOverlay {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
    }

    show(result) {
        if (this.container) return;

        const {
            isVictory,
            title,
            reason,
            finalScore,
            rating,
            statsRows
        } = result;

        const depth = 2000;
        const accent = isVictory ? 0x22d3ee : 0xef4444;
        const accentText = isVictory ? '#22d3ee' : '#ef4444';
        const accentDark = isVictory ? 0x155e75 : 0x7f1d1d;
        const panelFill = 0x111827;

        const overlay = this.scene.add.rectangle(640, 360, 1280, 720, 0x020617, 0.86)
            .setInteractive()
            .setDepth(depth);

        const panel = this.scene.add.rectangle(640, 360, 640, 500, panelFill, 0.96)
            .setStrokeStyle(3, accent, 0.95)
            .setDepth(depth + 1);

        const headerBar = this.scene.add.rectangle(640, 115, 638, 6, accent, 1)
            .setDepth(depth + 2);

        const titleText = this.scene.add.text(640, 168, title, {
            fontSize: '46px',
            fontFamily: 'Arial Black',
            color: accentText,
            stroke: '#020617',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(depth + 3);

        const reasonText = this.scene.add.text(640, 214, reason, {
            fontSize: '22px',
            fontFamily: 'Segoe UI',
            color: '#dbeafe'
        }).setOrigin(0.5).setDepth(depth + 3);

        const scoreLabel = this.scene.add.text(500, 272, 'Итоговый счет', {
            fontSize: '17px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8'
        }).setOrigin(0.5).setDepth(depth + 3);

        const scoreText = this.scene.add.text(500, 318, `${finalScore}`, {
            fontSize: '42px',
            fontFamily: 'Arial Black',
            color: '#fbbf24',
            stroke: '#020617',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(depth + 3);

        const ratingLabel = this.scene.add.text(780, 272, 'Рейтинг', {
            fontSize: '17px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8'
        }).setOrigin(0.5).setDepth(depth + 3);

        const ratingBadge = this.scene.add.circle(780, 326, 38, 0x020617, 1)
            .setStrokeStyle(4, Phaser.Display.Color.HexStringToColor(rating.color).color)
            .setDepth(depth + 3);

        const ratingText = this.scene.add.text(780, 326, rating.letter, {
            fontSize: '38px',
            fontFamily: 'Arial Black',
            color: rating.color,
            stroke: '#020617',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(depth + 4);

        const statsTitle = this.scene.add.text(640, 386, 'Статистика боя', {
            fontSize: '21px',
            fontFamily: 'Segoe UI',
            fontStyle: 'bold',
            color: '#e5e7eb'
        }).setOrigin(0.5).setDepth(depth + 3);

        const statObjects = [];
        statsRows.forEach((row, index) => {
            const y = 416 + index * 23;
            const label = this.scene.add.text(405, y, row.label, {
                fontSize: '16px',
                fontFamily: 'Segoe UI',
                color: '#cbd5e1'
            }).setOrigin(0, 0.5).setDepth(depth + 3);

            const value = this.scene.add.text(875, y, row.value, {
                fontSize: '16px',
                fontFamily: 'Segoe UI',
                fontStyle: row.important ? 'bold' : 'normal',
                color: row.color || '#ffffff'
            }).setOrigin(1, 0.5).setDepth(depth + 3);

            statObjects.push(label, value);
        });

        const menuButtonBg = this.scene.add.rectangle(640, 588, 238, 46, accentDark, 1)
            .setStrokeStyle(2, accent, 0.9)
            .setInteractive({ useHandCursor: true })
            .setDepth(depth + 3);

        const menuButtonText = this.scene.add.text(640, 588, 'В главное меню', {
            fontSize: '20px',
            fontFamily: 'Segoe UI',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(depth + 4);

        menuButtonBg.on('pointerover', () => {
            menuButtonBg.setFillStyle(accent, 1);
            menuButtonText.setColor('#020617');
        });
        menuButtonBg.on('pointerout', () => {
            menuButtonBg.setFillStyle(accentDark, 1);
            menuButtonText.setColor('#ffffff');
        });
        menuButtonBg.on('pointerdown', () => {
            this.scene.scene.stop('MainScene');
            this.scene.scene.start('MainMenu');
        });

        this.container = this.scene.add.container(0, 0, [
            overlay,
            panel,
            headerBar,
            titleText,
            reasonText,
            scoreLabel,
            scoreText,
            ratingLabel,
            ratingBadge,
            ratingText,
            statsTitle,
            ...statObjects,
            menuButtonBg,
            menuButtonText
        ]).setDepth(depth);

        this.container.setAlpha(0);
        this.container.setScale(1);

        const animatedItems = [
            panel,
            headerBar,
            titleText,
            reasonText,
            scoreLabel,
            scoreText,
            ratingLabel,
            ratingBadge,
            ratingText,
            statsTitle,
            ...statObjects,
            menuButtonBg,
            menuButtonText
        ];

        animatedItems.forEach(item => {
            item.setScale(0.94);
        });

        this.scene.tweens.add({
            targets: this.container,
            alpha: 1,
            duration: 220,
            ease: 'Sine.easeOut'
        });

        this.scene.tweens.add({
            targets: animatedItems,
            scaleX: 1,
            scaleY: 1,
            duration: 300,
            ease: 'Back.easeOut'
        });
    }
}
