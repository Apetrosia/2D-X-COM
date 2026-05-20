import Phaser from 'phaser';
import { InfoPanel } from '../ui/InfoPanel.js';
import { Unit } from '../entities/Unit.js';
import { TilemapService } from '../services/tilemapService.js';
import tileset from '../assets/tileset.png';
import { TILE_TYPES } from '../entities/Tile.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    create() {
        this.cameras.main.setBackgroundColor('#0f172a');

        this.createMap();
        this.createTextures();
        this.createUnits();
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

        g.destroy();
    }

    createUnits() {
        this.allUnits = [];
        this.selectedUnit = null;

        const toXY = (tile) => this.tilemap.gridToWorld(tile.gridX, tile.gridY);

        const playerTiles = this.tilemap.getSpawnTiles('left', 3);
        const enemyTiles  = this.tilemap.getSpawnTiles('right', 3);

        const playerDefs = [
            { name: 'Солдат 1', hp: 100, ap: 2, attack: 15, defense: 8, accuracy: 75 },
            { name: 'Солдат 2', hp: 80, ap: 2, attack: 20, defense: 5, accuracy: 85 },
            {
                name: 'Солдат 3',
                type: 'Summoner',
                hp: 120,
                ap: 1,
                attack: 0,
                defense: 10,
                accuracy: 70,
                summonIntervalMs: 3000,
                minionTypes: ['Default'],
                minionMaxHp: 25,
                minionMaxAp: 0,
                minionAttack: 5,
                minionDefense: 3,
                minionAccuracy: 75,
                maxSummonedUnits: 2
            },
        ];

        const enemyDefs = [
            { name: 'Враг 1', hp: 70,  ap: 2, attack: 12, defense: 4, accuracy: 65 },
            { name: 'Враг 2', hp: 100, ap: 2, attack: 18, defense: 6, accuracy: 70 },
            {
                name: 'Враг 3',
                type: 'Summoner',
                hp: 60,
                ap: 2,
                attack: 15,
                defense: 3,
                accuracy: 75,
                summonIntervalMs: 5000,
                minionTypes: ['Default'],
                minionMaxHp: 20,
                minionMaxAp: 0,
                minionAttack: 5,
                minionDefense: 2,
                minionAccuracy: 70,
                maxSummonedUnits: 3
            },
        ];

        playerDefs.forEach((def, i) => {
            const tile = playerTiles[i];
            if (!tile) 
                return;

            const { x, y } = toXY(tile);
            
            this.allUnits.push(new Unit(this, x, y, { ...def, team: 'player' }));

            tile.unit = this.allUnits[this.allUnits.length - 1];
        });

        enemyDefs.forEach((def, i) => {
            const tile = enemyTiles[i];
            if (!tile) 
                return;

            const { x, y } = toXY(tile);

            this.allUnits.push(new Unit(this, x, y, { ...def, team: 'enemy' }));

            tile.unit = this.allUnits[this.allUnits.length - 1];
        });
    }

    tryToSummon(def, summoner) {
        const summonerGridXY = this.tilemap.worldToGrid(summoner.x, summoner.y);
        const nearbyTiles = [
            this.tilemap.getTile(summonerGridXY.x, summonerGridXY.y + 1),
            this.tilemap.getTile(summonerGridXY.x, summonerGridXY.y - 1),
            this.tilemap.getTile(summonerGridXY.x - 1, summonerGridXY.y),
            this.tilemap.getTile(summonerGridXY.x + 1, summonerGridXY.y),
            this.tilemap.getTile(summonerGridXY.x - 1, summonerGridXY.y + 1),
            this.tilemap.getTile(summonerGridXY.x - 1, summonerGridXY.y - 1),
            this.tilemap.getTile(summonerGridXY.x + 1, summonerGridXY.y + 1),
            this.tilemap.getTile(summonerGridXY.x + 1, summonerGridXY.y - 1),
        ];

        let tile;
        for (let i = 0; i < nearbyTiles.length; ++i)
            if (nearbyTiles[i] && nearbyTiles[i].type === TILE_TYPES.FLOOR && !nearbyTiles[i].unit)
            {
                tile = nearbyTiles[i];
                break;
            }
        
        if (tile) {
            const { x, y } = this.tilemap.gridToWorld(tile.gridX, tile.gridY);

            this.allUnits.push(new Unit(this, x, y, def));

            tile.unit = this.allUnits[this.allUnits.length - 1];

            return true;
        }
        return false;
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
