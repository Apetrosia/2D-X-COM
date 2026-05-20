export class Unit {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.name = config.name;
        this.team = config.team;
        this.type = config.type || 'Default';
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.maxAp = config.ap;
        this.ap = config.ap;
        this.attack = config.attack;
        this.defense = config.defense;
        this.accuracy = config.accuracy;

        this.summoner = config.summoner;
        this.summonIntervalMs = config.summonIntervalMs;
        this.minionTypes = config.minionTypes;
        this.minionMaxHp = config.minionMaxHp;
        this.minionMaxAp = config.minionMaxAp;
        this.minionAttack = config.minionAttack;
        this.minionDefense = config.minionDefense;
        this.minionAccuracy = config.minionAccuracy;
        this.maxSummonedUnits = config.maxSummonedUnits;
        this.summonedUnits = 0;
        
        const texture = config.team === 'player' ? 'player_unit' : 'enemy_unit';
        
        this.sprite = scene.add.sprite(x, y, texture).setDepth(5);
        this.marker = scene.add.circle(x, y - 30, 8, 0xffd700).setDepth(6);
        this.marker.setVisible(false);
        
        this.nameLabel = scene.add.text(x, y - 45, config.name, {
            fontSize: '11px',
            fontFamily: 'Segoe UI',
            color: '#64748b'
        }).setOrigin(0.5).setDepth(6);
        
        this.setupInteractivity();
        this.setupLogic();
    }
    
    setupInteractivity() {
        this.sprite.setInteractive();
        
        this.sprite.on('pointerover', () => {
            if (this.scene.selectedUnit !== this) {
                this.sprite.setTint(0xdddddd);
            }
        });
        
        this.sprite.on('pointerout', () => {
            if (this.scene.selectedUnit !== this) {
                this.sprite.clearTint();
            }
        });
        
        this.sprite.on('pointerdown', () => {
            this.scene.selectUnit(this);
        });
    }

    setupLogic() {
        switch (this.type) {
            case 'Summoner':
                this.attack = 0;
                
                if (this.maxSummonedUnits && 0 < this.maxSummonedUnits)
                    setInterval(this.tryToSummon, this.summonIntervalMs, this);

                break;
            default:

        }
    }

    tryToSummon(summoner) {
        if (summoner.minionTypes
            && summoner.minionTypes.length
            && summoner.maxSummonedUnits
            && summoner.summonedUnits < summoner.maxSummonedUnits) {
            if (summoner.scene.tryToSummon({
                name: 'minion ' + (summoner.summonedUnits + 1),
                hp: summoner.minionMaxHp,
                ap: summoner.minionMaxAp,
                attack: summoner.minionAttack,
                defense: summoner.minionDefense,
                accuracy: summoner.minionAccuracy,
                summoner: summoner,
                team: summoner.team,
                type: summoner.minionTypes[Math.floor(Math.random() * summoner.minionTypes.length)]
            }, summoner)) summoner.summonedUnits += 1;
        }
    }

    onKilled() {
        if (this.summoner) this.summoner.summonedUnits -= 1;
    }
    
    select() {
        this.marker.setVisible(true);
        this.sprite.setTint(this.team === 'player' ? 0x44ff44 : 0xe3e300);
    }
    
    deselect() {
        this.marker.setVisible(false);
        this.sprite.clearTint();
    }
}