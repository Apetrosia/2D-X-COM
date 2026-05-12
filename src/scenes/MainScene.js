import Phaser from 'phaser';
import { InfoPanel } from '../ui/InfoPanel.js';
import { Unit } from '../entities/Unit.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f172a');
        
        this.createTextures();
        this.createUnits();
        this.createUI();
    }
    
    createTextures() {
        const g = this.add.graphics();
        
        g.fillStyle(0x22d3ee);
        g.fillCircle(25, 25, 25);
        g.generateTexture('player_unit', 50, 50);
        
        g.clear();
        g.fillStyle(0xef4444);
        g.fillCircle(25, 25, 25);
        g.generateTexture('enemy_unit', 50, 50);
        
        g.destroy();
    }
    
    createUnits() {
        this.allUnits = [];
        this.selectedUnit = null;
        
        // Игроки
        this.allUnits.push(
            new Unit(this, 300, 400, { name: 'Солдат 1', hp: 100, ap: 2, attack: 15, defense: 8, accuracy: 75, type: 'player' }),
            new Unit(this, 200, 300, { name: 'Солдат 2', hp: 80, ap: 2, attack: 20, defense: 5, accuracy: 85, type: 'player' }),
            new Unit(this, 400, 300, { name: 'Солдат 3', hp: 120, ap: 1, attack: 10, defense: 10, accuracy: 70, type: 'player' })
        );
        
        // Противники
        this.allUnits.push(
            new Unit(this, 1000, 400, { name: 'Враг 1', hp: 70, ap: 2, attack: 12, defense: 4, accuracy: 65, type: 'enemy' }),
            new Unit(this, 900, 300, { name: 'Враг 2', hp: 100, ap: 2, attack: 18, defense: 6, accuracy: 70, type: 'enemy' }),
            new Unit(this, 1100, 300, { name: 'Враг 3', hp: 60, ap: 2, attack: 15, defense: 3, accuracy: 75, type: 'enemy' })
        );
    }
    
    createUI() {
        this.infoPanel = new InfoPanel(this);
        
        this.helpText = this.add.text(640, 30, 'Тыкай круг', {
            fontSize: '16px',
            fontFamily: 'Segoe UI',
            color: '#64748b'
        }).setOrigin(0.5);
    }
    
    selectUnit(unit) {
        if (this.selectedUnit) {
            this.selectedUnit.deselect();
        }
        
        this.selectedUnit = unit;
        unit.select();
        this.infoPanel.update(unit);
    }
}