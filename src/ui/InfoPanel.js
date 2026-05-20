export class InfoPanel {
    constructor(scene) {
        this.scene = scene;
        
        // Фон панели
        this.bg = scene.add.rectangle(640, 610, 450, 160, 0x1e293b).setDepth(10);
        this.bg.setStrokeStyle(2, 0x334155);
        
        // Заголовок панели
        this.title = scene.add.text(640, 540, 'ИНФОРМАЦИЯ О ВЫБРАННОМ ЮНИТЕ', {
            fontSize: '14px',
            fontFamily: 'Segoe UI',
            color: '#64748b'
        }).setOrigin(0.5).setDepth(10);
        
        // Имя юнита
        this.nameText = scene.add.text(430, 555, '', {
            fontSize: '18px',
            fontFamily: 'Segoe UI',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setDepth(10);
        
        // Команда и тип юнита
        this.teamText = scene.add.text(750, 555, '', {
            fontSize: '18px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8',
            fontStyle: 'bold'
        }).setDepth(10);
        
        // Характеристики
        this.statsText = scene.add.text(430, 585, '', {
            fontSize: '14px',
            fontFamily: 'Segoe UI',
            color: '#e2e8f0',
            lineSpacing: 8
        }).setDepth(10);
        
        // HP
        this.hpLabel = scene.add.text(430, 653, 'HP:', {
            fontSize: '12px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8'
        }).setDepth(10);
        
        this.hpBarBg = scene.add.rectangle(500, 660, 100, 12, 0x334155).setDepth(10);
        this.hpBar = scene.add.rectangle(500, 660, 100, 12, 0x22c55e).setDepth(10);
        this.hpText = scene.add.text(500, 660, '', {
            fontSize: '11px',
            fontFamily: 'Segoe UI',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(11);
        
        // AP
        this.apLabel = scene.add.text(430, 668, 'AP:', {
            fontSize: '12px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8'
        }).setDepth(10);
        
        this.apBarBg = scene.add.rectangle(500, 675, 100, 8, 0x334155).setDepth(10);
        this.apBar = scene.add.rectangle(500, 675, 100, 8, 0x3b82f6).setDepth(10);
        this.apText = scene.add.text(500, 675, '', {
            fontSize: '10px',
            fontFamily: 'Segoe UI',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(11);
        
        // Кнопка закрыть
        this.closeBtn = scene.add.text(800, 665, '[ Закрыть ]', {
            fontSize: '14px',
            fontFamily: 'Segoe UI',
            color: '#94a3b8',
            backgroundColor: '#334155',
            padding: { x: 15, y: 8 }
        }).setOrigin(0.5).setInteractive().setDepth(10);
        
        this.closeBtn.on('pointerover', () => this.closeBtn.setColor('#e2e8f0'));
        this.closeBtn.on('pointerout', () => this.closeBtn.setColor('#94a3b8'));
        this.closeBtn.on('pointerdown', () => this.hide());
        
        this.hide();
    }
    
    update(unit) {
        this.show();
        
        // Имя и тип
        this.nameText.setText(unit.name + ' | ' + unit.type + ' | ');
        this.nameText.setColor('#e2e8f0');
        
        const teamText = unit.team === 'player' ? 'Добрые :)' : 'Злые >:(';
        const teamColor = unit.team === 'player' ? '#22d3ee' : '#ef4444';
        
        this.teamText.setText(teamText);
        this.teamText.setColor(teamColor);
        this.teamText.setX(this.nameText.x + this.nameText.width + 5);
        this.teamText.setY(this.nameText.y);
        
        // Статы
        this.statsText.setText(
            `Атака: ${unit.attack}  |  Защита: ${unit.defense}  |  Точность: ${unit.accuracy}%`
        );
        
        // HP бар
        const hpPercent = unit.hp / unit.maxHp;
        this.hpBar.setScale(hpPercent, 1);
        this.hpText.setText(`${unit.hp}/${unit.maxHp}`);
        
        if (hpPercent > 0.6) this.hpBar.setFillStyle(0x22c55e);
        else if (hpPercent > 0.3) this.hpBar.setFillStyle(0xeab308);
        else this.hpBar.setFillStyle(0xef4444);
        
        // AP бар
        const apPercent = unit.ap / unit.maxAp;
        this.apBar.setScale(apPercent, 1);
        this.apText.setText(`${unit.ap}/${unit.maxAp}`);
    }
    
    show() {
        this.bg.setVisible(true);
        this.title.setVisible(true);
        this.nameText.setVisible(true);
        this.teamText.setVisible(true);
        this.statsText.setVisible(true);
        this.hpLabel.setVisible(true);
        this.hpBarBg.setVisible(true);
        this.hpBar.setVisible(true);
        this.hpText.setVisible(true);
        this.apLabel.setVisible(true);
        this.apBarBg.setVisible(true);
        this.apBar.setVisible(true);
        this.apText.setVisible(true);
        this.closeBtn.setVisible(true);
    }
    
    hide() {
        this.bg.setVisible(false);
        this.title.setVisible(false);
        this.nameText.setVisible(false);
        this.teamText.setVisible(false);
        this.statsText.setVisible(false);
        this.hpLabel.setVisible(false);
        this.hpBarBg.setVisible(false);
        this.hpBar.setVisible(false);
        this.hpText.setVisible(false);
        this.apLabel.setVisible(false);
        this.apBarBg.setVisible(false);
        this.apBar.setVisible(false);
        this.apText.setVisible(false);
        this.closeBtn.setVisible(false);
    }
}