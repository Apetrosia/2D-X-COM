export class TurnManager {
    constructor(scene, blackboard) {
        this.scene = scene;
        this.blackboard = blackboard;
    }

    endUnitTurn(unit) {
        if (this.scene.gameOver) return;
        unit.deselect();
        this.scene.movementManager.clearHighlights();
        this.scene.targetManager.clearTargetHighlights();
        this.scene.targetManager.clearActionRange();
        this.scene.infoPanel.hide();
        this.scene.selectedUnit = null;
        this.scene.actionMode = null;
        this.scene.uiManager.updateHelpText();
        this.checkEndPlayerPhase();
    }

    skipUnitTurn() {
        if (this.scene.gameOver) return;
        if (this.scene.selectedUnit) {
            this.scene.targetManager.setUnitsInteractive(true);
            this.scene.selectedUnit.endTurn();
            this.endUnitTurn(this.scene.selectedUnit);
        }
    }

    clearSelection() {
        if (this.scene.gameOver) return;
        if (this.scene.selectedUnit) {
            this.scene.selectedUnit.deselect();
            this.scene.movementManager.clearHighlights();
            this.scene.targetManager.clearTargetHighlights();
            this.scene.targetManager.clearActionRange();
            this.scene.targetManager.setUnitsInteractive(true);
            this.scene.infoPanel.hide();
            this.scene.selectedUnit = null;
            this.scene.actionMode = null;
            this.scene.uiManager.updateHelpText();
        }
    }

    checkEndPlayerPhase() {
        if (this.scene.gameOver) return;
        const playerUnits = this.scene.unitManager.getPlayerUnits();
        if (!playerUnits.some(u => u.hasActions())) {
            this.startEnemyPhase();
        }
    }

    startPlayerPhase() {
        if (this.scene.gameOver) return;
        this.scene.registerNewRound?.();
        this.scene.phase = 'player';
        this.scene.unitManager.getPlayerUnits().forEach(u => u.resetActions());
        this.scene.uiManager.updateHelpText();
    }

    startEnemyPhase() {
        if (this.scene.gameOver) return;
        this.scene.phase = 'enemy';
        this.scene.uiManager.updateHelpText();
        this.scene.unitManager.getEnemyUnits().forEach(e => e.resetActions());
        this.scene.time.delayedCall(500, () => {
            if (!this.scene.gameOver) this.processEnemyTurn();
        });
    }

    processEnemyTurn() {
        if (this.scene.gameOver) return;
        const enemies = this.scene.unitManager.getEnemyUnits();
        const active = enemies.filter(e => e.hasActions());
        if (active.length === 0) {
            this.tickEnemyBuffs();
            this.startPlayerPhase();
            return;
        }
        const supportEnemies = active.filter(e => e.role === 'support');
        // Первым вызываем мага для раздачи баффов
        if (supportEnemies.length > 0) {
            this.enemyAct(supportEnemies[0]);
        }
        else {
            this.enemyAct(active[0]);
        }
    }

    enemyAct(enemy) {
        if (this.scene.gameOver) return;

        this.scene.aiOrchestrator.processAIActions(enemy, () => {
            if (this.scene.gameOver) return;
            // Повторный ход
            if (enemy.consumeExtraTurn()) {
                this.scene.time.delayedCall(300, () => {
                    if (!this.scene.gameOver) this.enemyAct(enemy);
                });
                return;
            }
            enemy.endTurn();
            this.scene.time.delayedCall(300, () => {
                if (!this.scene.gameOver) this.processEnemyTurn();
            });
        });
    }

    tickEnemyBuffs() {
        this.scene.unitManager.getEnemyUnits().forEach(e => e.tickBuffs());
    }

}
