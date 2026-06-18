import { StupidAI } from "./StupidAI";
import { AlingAI } from "./AlingAI";
import { SupportAI } from "./SupportAI";
import { SniperAI } from "./SniperAI";
import { BruteAI } from "./BruteAI";
import { SummonerAI } from "./SummonerAI";

export class AIOrchestrator {
    constructor(scene) {
        this.scene = scene;
        //Добавляйте сюда свои ИИ порядок не особо важен главное, 
        // чтобы StupidAI был в самом конце так как это поведение в случае
        //  отказа всех остальных в идеале оно вообще не должно вызываться
        this.aiControllers = [new SupportAI(scene), new BruteAI(scene), new SniperAI(scene), new AlingAI(scene), new SummonerAI(scene), new StupidAI(scene)];
    }

    processAIActions(enemy, onComplete) {
        if (this.scene.gameOver || !enemy?.isAlive) {
            onComplete?.();
            return false;
        }

        const chosenController = this.getAIForEnemy(enemy);

        if (!chosenController) {
            onComplete();
            return false;
        }

        const enemyPlan = chosenController.getActionsPlan(enemy, enemy.actionsLeft);

        if (!enemyPlan || enemyPlan.actions.length === 0) {
            onComplete();
            return true;
        }

        this._executeEnemyPlan(enemy, enemyPlan, this.scene, this.scene.combatManager, onComplete);

        return true;
    }

    getAIForEnemy(enemy) {
        for (const controller of this.aiControllers) {
            
            // В canProcess каждый должен проверять именно свой тип противников
            if (!controller.canProcess(enemy)) {
                continue;
            }

            return controller;
        }

        return null;
    }

    _executeEnemyPlan(enemy, plan, scene, combat, onComplete) {

        let currentActionIndex = 0;

        executeNext();

        function executeNext() {
            if (scene.gameOver || !enemy?.isAlive) return;

            const action =
                plan.actions[currentActionIndex];

            currentActionIndex++;
            if (!action) {
                onComplete();
                return;
            }

            switch (action.type) {

                case 'move':

                    scene.movementManager.moveUnitTo(
                        enemy,
                        action.tile
                    );

                    break;

                case 'attack':

                    combat.performMeleeAttack(
                        enemy,
                        action.target
                    );

                    break;

                case 'rangedAttack':

                    combat.performRangedAttack(
                        enemy,
                        action.target
                    );

                    break;

                case 'buff':

                    scene.supportAI.applyBestBuff(enemy);

                    break;

                case 'sniperShot':

                    combat.performSniperShot(
                        enemy, 
                        action.target
                    );

                    break;

                case 'summon':

                    SummonerAI.summon(enemy, action.tile, action.config);

                    break;
            }

            if (currentActionIndex >= plan.actions.length) {
                if (scene.gameOver) return;
                onComplete();
                return;
            }
            else if (!scene.gameOver) {
                scene.time.delayedCall(300, () => {
                    if (!scene.gameOver) executeNext();
                });
            }
        }
    }
}
