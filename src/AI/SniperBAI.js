export class SniperBAI {
    constructor(scene) {
        this.scene = scene;
        this.attackRange = 10; // Твоя дальность атаки
    }


    canProcess(enemy) {
        return enemy.role === 'sniper2'; 
    }

    getActionsPlan(enemy, actionsLeft) {
        const closestData = this.scene.blackboard.getClosestPlayer(enemy);
        if (!closestData) return null;

        const closestPlayer = closestData.unit;
        
        const enemyTile = enemy.tile;
        const playerTile = closestPlayer.tile;

        const dx = Math.abs(playerTile.gridX - enemyTile.gridX);
        const dy = Math.abs(playerTile.gridY - enemyTile.gridY);
        const dist = dx + dy;

        const hasLineOfSight = this.scene.fogOfWar.hasLineOfSight(enemyTile, playerTile, this.attackRange);

        const plan = { actions: [] };

        if (dist < 4) {
            const reachableTiles = this.scene.pathfinder.getTilesInRange(enemyTile, enemy.moveRange);
            
            const escapeTile = this.scene.blackboard.getTheMostDistantTileFromPlayers(
                reachableTiles, 
                enemyTile, 
                enemy.moveRange
            );
            
            if (escapeTile) {
                plan.actions.push({ type: 'move', tile: escapeTile });
                return plan;
            }
        } 
        
        else if (dist <= this.attackRange && hasLineOfSight) {
            plan.actions.push({ type: 'sniperShot', target: closestPlayer });
            return plan;
        } 
        
        else {
            const reachableTiles = this.scene.pathfinder.getTilesInRange(enemyTile, enemy.moveRange);
            
            reachableTiles.sort((a, b) => {
                const distA = Math.abs(a.gridX - playerTile.gridX) + Math.abs(a.gridY - playerTile.gridY);
                const distB = Math.abs(b.gridX - playerTile.gridX) + Math.abs(b.gridY - playerTile.gridY);
                return distA - distB; 
            });

            if (reachableTiles.length > 0) {
                plan.actions.push({ type: 'move', tile: reachableTiles[0] });
                return plan;
            }
        }

        return null;
    }
}
