import Phaser from 'phaser';
import { InfoPanel } from '../ui/InfoPanel.js';
import { Unit } from '../entities/Unit.js';
import { WorldBlackboard } from '../services/worldBlackboard.js';
import { SupportEnemyAI } from '../services/supportEnemyAI.js';
import { TilemapService } from '../services/tilemapService.js';
import tileset from '../assets/tileset.png';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f172a');

        this.createMap();
        this.createTextures();
        this.createUnits();
        this.createBlackboard();
        this.createAI(this.blackboard);
        this.createUI();
    }

    preload() {
    this.load.spritesheet(
        'tiles',
        tileset,
        {
            frameWidth: 40,
            frameHeight: 40
        }
    );
}

    createMap() {
        this.tilemap = new TilemapService(this, {
            tileSize: 40,
            cols: 32,
            rows: 18,
            offsetX: 0,
            offsetY: 0,
        });

        this.tilemap.generate().render();
    }

    createTextures() {
        const g = this.add.graphics();

        g.fillStyle(0x22d3ee);
        g.fillCircle(20, 20, 20);
        g.generateTexture('player_unit', 40, 40);

        g.clear();
        g.fillStyle(0xef4444);
        g.fillCircle(20, 20, 20);
        g.generateTexture('enemy_unit', 40, 40);

        g.clear();
        g.fillStyle(0x22c55e);
        g.fillCircle(20, 20, 20);
        g.generateTexture('enemy_support_unit', 40, 40);

        g.destroy();
    }

    createUnits() {
        this.allUnits = [];
        this.selectedUnit = null;

        const toXY = (tile) => this.tilemap.gridToWorld(tile.gridX, tile.gridY);

        const playerTiles = this.tilemap.getSpawnTiles('left', 3);
        const enemyTiles  = this.tilemap.getSpawnTiles('right', 4);

        const playerDefs = [
            { name: 'Медик', hp: 90, ap: 2, attack: 12, defense: 6, accuracy: 75, role: 'medic' },
            { name: 'Штурмовик', hp: 110, ap: 2, attack: 18, defense: 5, accuracy: 70, role: 'assault' },
            { name: 'Снайпер', hp: 80, ap: 2, attack: 22, defense: 4, accuracy: 85, role: 'sniper' },
        ];

        const enemyDefs = [
            { name: 'Мелкий', hp: 55, ap: 2, attack: 10, defense: 3, accuracy: 60, role: 'swarm' },
            { name: 'Вражеский снайпер', hp: 70, ap: 2, attack: 16, defense: 4, accuracy: 85, role: 'sniper' },
            { name: 'Толстяк', hp: 130, ap: 1, attack: 22, defense: 8, accuracy: 60, role: 'brute' },
            { name: 'Маг', hp: 80, ap: 2, attack: 8, defense: 4, accuracy: 70, role: 'support', textureKey: 'enemy_support_unit',},
        ];

        playerDefs.forEach((def, i) => {
            const tile = playerTiles[i];
            if (!tile) 
                return;

            const { x, y } = toXY(tile);
            
            const unit = new Unit(this, x, y, { ...def, type: 'player' });
            this.allUnits.push(unit);
            unit.setTile(tile);
        });

        enemyDefs.forEach((def, i) => {
            const tile = enemyTiles[i];
            if (!tile) 
                return;

            const { x, y } = toXY(tile);

            const unit = new Unit(this, x, y, { ...def, type: 'enemy' });
            this.allUnits.push(unit);
            unit.setTile(tile);
        });
    }

    createBlackboard() {
        this.blackboard = new WorldBlackboard(this);
    }

    createAI(blackboard) {
        this.supportAI = new SupportEnemyAI(blackboard);
    }

    // Применение способности мага
    runEnemySupportTurn(enemyUnit) {
        if (!this.supportAI)
            return;

        this.supportAI.applyBestBuff(enemyUnit);
    }

    createUI() {
        this.infoPanel = new InfoPanel(this);

        this.helpText = this.add.text(640, 30, 'Нажми на юнита', {
            fontSize: '16px',
            fontFamily: 'Segoe UI',
            color: '#64748b'
        }).setOrigin(0.5).setDepth(10);
    }

    selectUnit(unit) {
        if (this.selectedUnit) 
            this.selectedUnit.deselect();

        this.selectedUnit = unit;
        unit.select();
        this.infoPanel.update(unit);
    }
}
