
/**
 * Сервис, который предоставляет интерфейс для доступа к информации о состоянии игрового мира.
 */
export class WorldBlackboard {
    constructor(scene) {
        this.scene = scene;
    }

    getUnits() {
        return this.scene.allUnits ?? [];
    }

    getEnemyUnits() {
        return this.getUnits().filter((unit) => unit.type === 'enemy' && this.isAlive(unit));
    }

    getPlayerUnits() {
        return this.getUnits().filter((unit) => unit.type === 'player' && this.isAlive(unit));
    }

    isAlive(unit) {
        return unit && unit.hp > 0;
    }

    getUnitTile(unit) {
        if (!unit) 
            return null;

        if (unit.tile) 
            return unit.tile;

        const grid = this.scene.tilemap?.grid;
        if (!grid) 
            return null;

        for (const row of grid) {
            for (const tile of row) {
                if (tile.unit === unit) 
                    return tile;
            }
        }

        return null;
    }

    getUnitGridPosition(unit) {
        const tile = this.getUnitTile(unit);
        if (tile) {
            return { x: tile.gridX, y: tile.gridY };
        }

        if (this.scene.tilemap && unit?.sprite) {
            return this.scene.tilemap.worldToGrid(unit.sprite.x, unit.sprite.y);
        }

        return null;
    }

    getMaxGridDistance() {
        const tilemap = this.scene.tilemap;
        if (!tilemap) 
            return 20;

        return (tilemap.COLS ?? 0) + (tilemap.ROWS ?? 0);
    }

    distanceBetween(a, b) {
        const posA = this.getUnitGridPosition(a);
        const posB = this.getUnitGridPosition(b);

        if (!posA || !posB) 
            return Infinity;

        return Math.abs(posA.x - posB.x) + Math.abs(posA.y - posB.y);
    }

    getClosestPlayer(unit) {
        return this._getClosestUnit(this.getPlayerUnits(), unit);
    }

    getClosestEnemy(unit) {
        return this._getClosestUnit(this.getEnemyUnits(), unit);
    }

    _getClosestUnit(units, unit) {
        let best = null;

        for (const u of units) {
            const distance = this.distanceBetween(unit, u);
            if (!best || distance < best.distance) {
                best = { unit: u, distance };
            }
        }

        return best;
    }

    getAlliesInRange(unit, range) {
        let allies = unit.type === 'player' ? this.getPlayerUnits() : this.getEnemyUnits();
        allies = allies.filter((ally) => ally !== unit);
        return allies.filter((ally) => this.distanceBetween(unit, ally) <= range);
    }

    getUnitAtGrid(gx, gy) {
        const tile = this.scene.tilemap?.getTile(gx, gy);
        if (tile?.unit) 
            return tile.unit;

        return this.getUnits().find((unit) => {
            const pos = this.getUnitGridPosition(unit);
            return pos && pos.x === gx && pos.y === gy;
        }) ?? null;
    }

    getEnemyAtGrid(gx, gy) {
        const unit = this.getUnitAtGrid(gx, gy);
        return unit && unit.type === 'enemy' ? unit : null;
    }

    getPlayerAtGrid(gx, gy) {
        const unit = this.getUnitAtGrid(gx, gy);
        return unit && unit.type === 'player' ? unit : null;
    }
}
