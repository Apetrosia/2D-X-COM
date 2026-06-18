export class CombatManager {
    constructor(scene, unitManager) {
        this.scene = scene;
        this.unitManager = unitManager;
    }

    _getEffectiveDefense(attacker, defender) {
        const lowBonus = defender?.tile?.coverDefenseBonus ?? 0;
        const highBonus = this.scene.blackboard.getHighCoverBonus(defender, attacker?.tile);
        return {
            total: defender.defense + lowBonus + highBonus,
            lowBonus,
            highBonus
        };
    }

    _getAttackMessage(attacker, defender, kind = 'ranged') {
        if (kind === 'sniper') {
            return `${attacker.name} выстрелил в ${defender.name}`;
        }

        if (kind === 'melee') {
            return attacker.type === 'enemy'
                ? `Враг атаковал ${defender.name}`
                : `${attacker.name} атаковал вблизи ${defender.name}`;
        }

        return attacker.type === 'enemy'
            ? `Враг атаковал ${defender.name}`
            : `${attacker.name} выстрелил в ${defender.name}`;
    }

    _applyDamage(defender, amount, attacker, color = '#ef4444', logText = null, logType = 'damage') {
        defender.hp -= amount;
        defender.lastAttacker = attacker;
        this.showFloatingText(defender, `-${amount}`, color);
        this.scene.actionLog?.addMessage(logText ?? `${defender.name} получил ${amount} урона`, logType, [attacker, defender]);

        if (defender.hp <= 0) {
            this.unitManager.killUnit(defender);
        }
    }

    performRangedAttack(attacker, defender) {

        this.scene.combatVFX.playBulletShot(
            attacker,
            defender
        );
        this.scene.actionLog?.addMessage(this._getAttackMessage(attacker, defender), 'attack', [attacker, defender]);
        const { total: effectiveDefense, lowBonus, highBonus } = this._getEffectiveDefense(attacker, defender);
        const totalCover = lowBonus + highBonus;

        const baseAcc = attacker.accuracy - (effectiveDefense * 0.5);
        const hitChance = Phaser.Math.Clamp(baseAcc, 10, 95);
        if (Math.random() * 100 < hitChance) {
            const dmg = Math.max(1, attacker.attack - Math.floor(effectiveDefense * 0.3));
            this._applyDamage(defender, dmg, attacker);
            if (totalCover > 0) {
                const coverType = highBonus > 0 ? '🏛️ Укрытие!' : '🛡️ Укрытие!';
                this.showFloatingText(defender, coverType, '#22d3ee', -15);
            }
        } else {
            this.showFloatingText(defender, 'Промах', '#94a3b8');
            this.scene.actionLog?.addMessage(`${attacker.name} промахнулся`, 'miss', [attacker, defender]);
        }
    }

    performSniperShot(attacker, defender) {
        this.scene.combatVFX.playSniperShot(
            attacker,
            defender
        );
        this.scene.actionLog?.addMessage(this._getAttackMessage(attacker, defender, 'sniper'), 'attack', [attacker, defender]);
        // Снайпер частично игнорирует укрытия
        // У низкого укрытия будет +1 к защите вместо +3
        // У высокого укрытия +7 к защите вместо +10
        const { lowBonus, highBonus } = this._getEffectiveDefense(attacker, defender);
        const totalCover = lowBonus + highBonus;
        const SNIPER_COVER_HIGH_IGNORE = 3;
        const ignoredLow = Math.floor(lowBonus * 0.5);
        const ignoredHigh = Math.min(SNIPER_COVER_HIGH_IGNORE, highBonus);
        const effectiveDefense = defender.defense + (lowBonus - ignoredLow) + (highBonus - ignoredHigh);

        const baseAcc = attacker.accuracy + 15 - (effectiveDefense * 0.5);
        if (Math.random() * 100 < Phaser.Math.Clamp(baseAcc, 20, 99)) {
            const dmg = Math.max(2, attacker.attack - Math.floor(effectiveDefense * 0.2));
            this._applyDamage(defender, dmg, attacker);
            if (totalCover > 0) {
                const coverType = highBonus > 0 ? '🏛️ Укрытие!' : '🛡️ Укрытие!';
                this.showFloatingText(defender, coverType, '#22d3ee', -15);
            }
        } else {
            this.showFloatingText(defender, 'Промах', '#94a3b8');
            this.scene.actionLog?.addMessage(`${attacker.name} промахнулся`, 'miss', [attacker, defender]);
        }
    }

    performMeleeAttack(attacker, defender) {
        this.scene.combatVFX.playMeleeHit(
            attacker,
            defender
        );
        this.scene.actionLog?.addMessage(this._getAttackMessage(attacker, defender, 'melee'), 'attack', [attacker, defender]);
        const dmg = Math.floor(attacker.attack * 1.5) - Math.floor(defender.defense * 0.3);
        const finalDmg = Math.max(2, dmg);
        this._applyDamage(defender, finalDmg, attacker);
    }

    performHeal(medic, patient) {
        const heal = 25;
        const previousHp = patient.hp;
        patient.hp = Math.min(patient.maxHp, patient.hp + heal);
        const healed = patient.hp - previousHp;
        this.showFloatingText(patient, `+${healed}`, '#22c55e');
        this.scene.actionLog?.addMessage(`${medic.name} вылечил ${patient.name} на ${healed} HP`, 'heal', [medic, patient]);
    }

    showFloatingText(unit, text, color, offsetY = 0) {
        const tilemap = this.scene.tilemap;
        const { x, y } = tilemap.gridToWorld(unit.tile.gridX, unit.tile.gridY);
        const startY = y - 40 + offsetY;
        const endY = startY - 20;
        const txt = this.scene.add.text(x, startY, text, {
            fontSize: '16px', fontFamily: 'Segoe UI', color, fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(20);
        this.scene.tweens.add({
            targets: txt, y: endY, alpha: 0, duration: 800,
            onComplete: () => txt.destroy()
        });
    }

    performGrenadeAttack(attacker, centerTile) {
        if (!attacker.pickedUpGrenade) return;

        attacker.pickedUpGrenade = false;
        this.scene.actionLog?.addMessage(`${attacker.name} бросил гранату`, 'attack', [attacker]);

        const { x, y } = this.scene.tilemap.gridToWorld(centerTile.gridX, centerTile.gridY);
        this.scene.combatVFX.playExplosion(x, y);
        this.scene.cameras.main.shake(250, 0.015);

        const affectedTiles = [];
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const tile = this.scene.tilemap.getTile(
                    centerTile.gridX + dx,
                    centerTile.gridY + dy
                );
                if (tile) affectedTiles.push(tile);
            }
        }

        const GRENADE_DAMAGE = 20;
        affectedTiles.forEach(tile => {
            if (tile.unit && tile.unit.isAlive && tile.unit !== attacker) {
                this._applyDamage(
                    tile.unit,
                    GRENADE_DAMAGE,
                    attacker,
                    '#ff8800',
                    `Граната нанесла ${GRENADE_DAMAGE} урона ${tile.unit.name}`
                );
            }
        });

        affectedTiles.forEach(tile => {
            if (tile.type === 'cover_low') {
                tile.setType('floor');
                if (tile.sprite) tile.sprite.setFrame(0);
            } else if (tile.type === 'cover_high') {
                tile.setType('rubble');
                if (tile.sprite) tile.sprite.setFrame(4);
            }
        });
    }
}
