import Phaser from 'phaser';
import { InfoPanel } from '../ui/InfoPanel.js';
import { WorldBlackboard } from '../services/worldBlackboard.js';
import { SupportEnemyAI } from '../services/supportEnemyAI.js';
import { TilemapService } from '../services/tilemapService.js';
import { PathfindingService } from '../services/pathfindingService.js';
import { UnitManager } from '../managers/UnitManager.js';
import { CombatManager } from '../managers/CombatManager.js';
import { MovementManager } from '../managers/MovementManager.js';
import { TargetSelectionManager } from '../managers/TargetSelectionManager.js';
import { TurnManager } from '../managers/TurnManager.js';
import { UIManager } from '../managers/UIManager.js';
import tileset from '../assets/tileset.png';
import aling from '../assets/aling.png';
import { FogOfWar } from '../vfx/FogOfWar.js';
import { CombatVFX } from '../vfx/CombatVFX.js';
import { AIOrchestrator } from '../AI/AIOrchestrator.js';
import { AudioManager } from '../managers/AudioManager.js';
import { TILE_TYPES } from '../entities/Tile.js';
import { PickupService } from '../services/PickupService.js';
import { GameResultOverlay } from '../ui/GameResultOverlay.js';

export class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.isPaused = false;
        this.pauseOverlay = null;
        this.pauseMenuContainer = null;
        this.escKey = null;
        this.pauseButton = null;
        this.pauseIcon = null;
    }

    init() {
        this.isPaused = false;
        this.gameOver = false;
        this.score = 0;
        this.battleStats = {
            enemiesKilled: 0,
            killScore: 0,
            rounds: 1,
            survivorBonus: 0,
            victoryBonus: 0,
            defeatPenalty: 0
        };
        this.resultOverlay = null;
        this.pauseOverlay = null;
        this.pauseMenuContainer = null;
    }

    create() {

        this.anims.create({
            key: 'aling_idle',

            frames: this.anims.generateFrameNumbers('aling', {
                start: 0,
                end: 5
            }),

            frameRate: 8,
            repeat: -1
        });

        this.cameras.main.setBackgroundColor('#0f172a');
        this.phase = 'player';
        this.selectedUnit = null;
        this.actionMode = null;
        this.highlightedTiles = [];
        this.highlightedTargets = [];
        this.rangeHighlights = [];

        this.createMap();
        this.createTextures();

        this.blackboard = new WorldBlackboard(this);
        this.unitManager = new UnitManager(this);
        this.combatManager = new CombatManager(this, this.unitManager);
        this.combatVFX = new CombatVFX(this);
        this.movementManager = new MovementManager(this);
        this.targetManager = new TargetSelectionManager(this);
        this.turnManager = new TurnManager(this, this.blackboard);
        this.uiManager = new UIManager(this);

        this.aiOrchestrator = new AIOrchestrator(this);

        this.unitManager.createUnits(this.tilemap);

        this.pickupService = new PickupService(this);
        this.pickupService.spawnPickups();

        this.supportAI = new SupportEnemyAI(this.unitManager, this.blackboard, this.aiOrchestrator);

        this.createUI();

        this.scoreText = this.add.text(1100, 30, 'Очки: 0', {
            fontSize: '18px', fontFamily: 'Segoe UI', color: '#fbbf24', fontStyle: 'bold'
        }).setOrigin(0, 1).setDepth(10);
        this.updateScoreText();
        this.createResultDemoButtons();

        this.fogOfWar = new FogOfWar(this, this.tilemap, { visionRange: 7 });
        this.fogOfWar.render();

        this.fogOfWar.update(this.unitManager.playerUnits, this.unitManager.allUnits, this.selectedUnit);

        this.unitManager.playerUnits.forEach(u => u.resetActions());
        this.uiManager.updateHelpText();


        AudioManager.playMusic();


        this.createPauseButton();


        if (this.escKey) {
            this.escKey.destroy();
        }


        this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);


        this.escKey.on('down', () => {
            console.log('ESC нажата');
            this.togglePause();
        });
    }

    createPauseButton() {

        if (this.pauseButton) {
            this.pauseButton.destroy();
        }
        if (this.pauseIcon) {
            this.pauseIcon.destroy();
        }


        this.pauseButton = this.add.rectangle(1250, 30, 40, 40, 0xffffff, 0.8)
            .setInteractive({ useHandCursor: true })
            .setDepth(1000);

        this.pauseIcon = this.add.text(1250, 30, '⏸', {
            fontSize: '28px',
            color: '#000000'
        }).setOrigin(0.5).setDepth(1000);

        this.pauseButton.on('pointerdown', () => {
            console.log('Кнопка паузы нажата');
            this.togglePause();
        });

        this.pauseButton.on('pointerover', () => this.pauseButton.setFillStyle(0xcccccc));
        this.pauseButton.on('pointerout', () => this.pauseButton.setFillStyle(0xffffff));
    }

    togglePause() {
        console.log('togglePause вызван, isPaused:', this.isPaused);
        if (this.gameOver) return;

        if (!this.isPaused) {
            this.isPaused = true;
            this.scene.pause('MainScene');

            this.scene.launch('PauseMenu', {
                mainScene: this
            });
        }
    }

    resumeGame() {
        console.log('resumeGame вызван');
        this.isPaused = false;
        this.scene.resume('MainScene');
    }

    shutdown() {
        console.log('MainScene выгружается');

        if (this.escKey) {
            this.escKey.destroy();
            this.escKey = null;
        }

        if (this.pauseButton) {
            this.pauseButton.destroy();
            this.pauseButton = null;
        }
        if (this.pauseIcon) {
            this.pauseIcon.destroy();
            this.pauseIcon = null;
        }

        this.time.removeAllEvents();

        this.tweens.killAll();
    }

    preload() {
        this.load.spritesheet('tiles', tileset, { frameWidth: 40, frameHeight: 40 });
        this.load.spritesheet('aling', aling, {
            frameWidth: 184,
            frameHeight: 168
        });
    }

    createMap() {
        this.tilemap = new TilemapService(this, {
            tileSize: 40, cols: 32, rows: 18, offsetX: 0, offsetY: 0,
        });
        this.tilemap.generate().render();
        this.pathfinder = new PathfindingService(this.tilemap.getTileMap(), this.tilemap.COLS, this.tilemap.ROWS);
    }

    createTextures() {
        const g = this.add.graphics();
        g.fillStyle(0x22d3ee); g.fillCircle(20, 20, 20);
        g.generateTexture('player_unit', 40, 40);
        g.clear(); g.fillStyle(0xef4444); g.fillCircle(20, 20, 20);
        g.generateTexture('enemy_unit', 40, 40);
        g.clear();
        g.fillStyle(0xf593af);
        g.fillCircle(20, 20, 20);
        g.generateTexture('enemy_support_unit', 40, 40);
        g.destroy();
    }

    createUI() {
        this.infoPanel = new InfoPanel(this);
        this.uiManager.createHelpText();
    }

    createResultDemoButtons() {
        this.createResultDemoButton(1136, 62, 'Экран победы', true, 0x155e75, 0x22d3ee);
        this.createResultDemoButton(1136, 96, 'Экран поражения', false, 0x7f1d1d, 0xef4444);
    }

    createResultDemoButton(x, y, text, isVictory, fillColor, strokeColor) {
        const buttonBg = this.add.rectangle(x, y, 178, 28, fillColor, 0.92)
            .setStrokeStyle(1, strokeColor, 0.9)
            .setInteractive({ useHandCursor: true })
            .setDepth(1000);

        const buttonText = this.add.text(x, y, text, {
            fontSize: '13px',
            fontFamily: 'Segoe UI',
            fontStyle: 'bold',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(1001);

        buttonBg.on('pointerover', () => {
            buttonBg.setFillStyle(strokeColor, 1);
            buttonText.setColor('#020617');
        });
        buttonBg.on('pointerout', () => {
            buttonBg.setFillStyle(fillColor, 0.92);
            buttonText.setColor('#ffffff');
        });
        buttonBg.on('pointerdown', () => this.showDemoResult(isVictory));
    }

    showDemoResult(isVictory) {
        if (this.gameOver) return;

        const unitsToKill = isVictory
            ? [...this.unitManager.getEnemyUnits(true)]
            : [...this.unitManager.getPlayerUnits(true)];

        if (unitsToKill.length === 0) {
            this.finishGame(isVictory);
            return;
        }

        unitsToKill.forEach(unit => {
            if (!this.gameOver) {
                this.unitManager.killUnit(unit);
            }
        });
    }

    selectUnit(unit) {
        if (this.gameOver) return;
        if (this.phase !== 'player') return;
        if (this.actionMode) return;
        if (!unit?.isAlive || unit.type !== 'player') return;

        if (this.selectedUnit) {
            this.selectedUnit.deselect();
            this.movementManager.clearHighlights();
        }
        this.selectedUnit = unit;
        unit.select();
        this.infoPanel.update(unit);
        this.updateMovementDisplay(unit);
    }

    updateMovementDisplay(unit) {
        if (unit.type === 'player' && unit.hasActions()) {
            this.movementManager.showMoveRange(unit);
        } else {
            this.movementManager.clearHighlights();
        }
        this.uiManager.updateHelpText();
    }

    startAction(action) {
        if (this.gameOver) return;
        this.targetManager.startAction(action);
    }

    skipUnitTurn() {
        if (this.gameOver) return;
        this.turnManager.skipUnitTurn();
    }

    clearSelection() {
        if (this.gameOver) return;
        this.turnManager.clearSelection();
    }

    checkWinLose() {
        if (this.gameOver) return;
        const aliveEnemies = this.unitManager.getEnemyUnits(true).length;
        const alivePlayers = this.unitManager.getPlayerUnits(true).length;
        if (aliveEnemies === 0) {
            this.finishGame(true);
        } else if (alivePlayers === 0) {
            this.finishGame(false);
        }
    }

    finishGame(isVictory) {
        if (this.gameOver) return;

        this.gameOver = true;
        this.phase = 'result';
        const result = this.calculateBattleResult(isVictory);
        this.score = result.finalScore;
        this.updateScoreText();
        this.freezeGameAfterResult();
        this.showGameResult(result);
    }

    freezeGameAfterResult() {
        this.time.removeAllEvents();
        this.actionMode = null;

        if (this.selectedUnit) {
            this.selectedUnit.deselect();
            this.selectedUnit = null;
        }

        this.movementManager?.clearHighlights();
        this.targetManager?.clearTargetHighlights();
        this.targetManager?.clearActionRange();
        this.targetManager?.setUnitsInteractive(false);
        this.infoPanel?.hide();
        this.uiManager?.updateHelpText();

        this.unitManager?.getUnits(false).forEach(unit => {
            unit.actionsLeft = 0;
        });
    }

    calculateBattleResult(isVictory) {
        const alivePlayers = this.unitManager.getPlayerUnits(true).length;
        const killScore = this.battleStats.killScore;
        const survivorBonus = isVictory ? alivePlayers * 25 : 0;
        const victoryBonus = isVictory ? 100 : 0;
        const scoreBeforePenalty = killScore + survivorBonus + victoryBonus;
        const finalScore = isVictory ? scoreBeforePenalty : Math.floor(killScore * 0.5);
        const defeatPenalty = isVictory ? 0 : killScore - finalScore;

        this.battleStats.survivorBonus = survivorBonus;
        this.battleStats.victoryBonus = victoryBonus;
        this.battleStats.defeatPenalty = defeatPenalty;

        const statsRows = [
            { label: 'Уничтожено врагов', value: `${this.battleStats.enemiesKilled}` },
            { label: 'Осталось союзников', value: `${alivePlayers}` },
            { label: 'Раундов сыграно', value: `${this.battleStats.rounds}` },
            { label: 'Очки за уничтожение', value: `+${killScore}`, color: '#fbbf24' }
        ];

        if (isVictory) {
            statsRows.push(
                { label: 'Бонус за победу', value: `+${victoryBonus}`, color: '#22d3ee', important: true },
                { label: 'Бонус за выживших', value: `+${survivorBonus}`, color: '#22c55e', important: true }
            );
        } else {
            statsRows.push({
                label: 'Штраф за поражение',
                value: `-${defeatPenalty} (-50%)`,
                color: '#ef4444',
                important: true
            });
        }

        return {
            isVictory,
            title: isVictory ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ',
            reason: isVictory ? 'Все враги уничтожены' : 'Все бойцы потеряны',
            finalScore,
            rating: this.getRating(finalScore),
            statsRows
        };
    }

    addScore(points) {
        this.score += points;
        this.updateScoreText();
        this.tweens.add({
            targets: this.scoreText,
            scale: { from: 1.4, to: 1 },
            duration: 250,
            ease: 'Back.easeOut'
        });
    }

    recordEnemyKill(unit, points) {
        this.battleStats.enemiesKilled += 1;
        this.battleStats.killScore += points;
        this.addScore(points);
    }

    registerNewRound() {
        if (this.gameOver) return;
        this.battleStats.rounds += 1;
    }

    updateScoreText() {
        this.scoreText?.setText(`Очки: ${this.score}`);
    }

    getRating(score) {
        if (score >= 300) return { letter: 'S', color: '#facc15' };
        if (score >= 220) return { letter: 'A', color: '#22d3ee' };
        if (score >= 150) return { letter: 'B', color: '#22c55e' };
        if (score >= 80)  return { letter: 'C', color: '#eab308' };
        return            { letter: 'D', color: '#ef4444' };
    }

    showGameResult(result) {
        this.resultOverlay = new GameResultOverlay(this);
        this.resultOverlay.show(result);
    }
}
