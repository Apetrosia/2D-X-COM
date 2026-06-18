const LOG_COLORS = {
    attack: '#f97316',
    damage: '#fb7185',
    heal: '#4ade80',
    playerTurn: '#7dd3fc',
    enemyTurn: '#c084fc',
    death: '#fca5a5',
    miss: '#cbd5e1',
    info: '#e2e8f0',
};

export class ActionLogPanel {
    constructor(scene) {
        this.scene = scene;
        this.maxMessages = 7;
        this.messages = [];
        this.rows = [];
        this.width = 326;
        this.height = 176;
        this.collapsedWidth = 172;
        this.collapsedHeight = 36;
        this.margin = 14;
        this.rowHeight = 17;
        this.isCollapsed = false;
        this.x = 1280 - this.width - this.margin;
        this.y = 720 - this.height - this.margin;

        this.container = scene.add.container(this.x, this.y).setDepth(9);

        this.bg = scene.add.rectangle(0, 0, this.width, this.height, 0x020617, 0.72)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x475569, 0.9);

        this.title = scene.add.text(12, 9, 'Лог действий', {
            fontSize: '13px',
            fontFamily: 'Segoe UI',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0, 0);

        this.divider = scene.add.rectangle(12, 30, this.width - 24, 1, 0x334155, 0.9)
            .setOrigin(0, 0);

        this.toggleButtonBg = scene.add.rectangle(this.width - 24, 18, 20, 20, 0x1e293b, 0.88)
            .setOrigin(0.5)
            .setStrokeStyle(1, 0x64748b, 0.9)
            .setInteractive({ useHandCursor: true });

        this.toggleButtonText = scene.add.text(this.width - 24, 17, '-', {
            fontSize: '15px',
            fontFamily: 'Segoe UI',
            color: '#e2e8f0',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.toggleButtonBg.on('pointerover', () => this.toggleButtonBg.setFillStyle(0x334155, 0.95));
        this.toggleButtonBg.on('pointerout', () => this.toggleButtonBg.setFillStyle(0x1e293b, 0.88));
        this.toggleButtonBg.on('pointerdown', () => this.setCollapsed(!this.isCollapsed));
        this.toggleButtonText.setInteractive({ useHandCursor: true });
        this.toggleButtonText.on('pointerdown', () => this.setCollapsed(!this.isCollapsed));

        this.container.add([this.bg, this.title, this.divider, this.toggleButtonBg, this.toggleButtonText]);
    }

    addMessage(text, type = 'info', units = []) {
        this.messages.push({ text, type, units });
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        this._render();
    }

    getReservedRect() {
        const width = this.isCollapsed ? this.collapsedWidth : this.width;
        const height = this.isCollapsed ? this.collapsedHeight : this.height;

        return {
            x: this.x,
            y: this.y,
            width,
            height,
            top: this.y,
        };
    }

    setCollapsed(isCollapsed) {
        this.isCollapsed = isCollapsed;
        const width = isCollapsed ? this.collapsedWidth : this.width;
        const height = isCollapsed ? this.collapsedHeight : this.height;

        this.x = 1280 - width - this.margin;
        this.y = 720 - height - this.margin;
        this.container.setPosition(this.x, this.y);
        this.bg.setSize(width, height);
        this.divider.setVisible(!isCollapsed);
        this.divider.setSize(width - 24, 1);
        this.toggleButtonBg.setPosition(width - 24, 18);
        this.toggleButtonText.setPosition(width - 24, 17).setText(isCollapsed ? '+' : '-');
        this.title.setText(isCollapsed ? `Лог (${this.messages.length})` : 'Лог действий');
        this._render();
    }

    _render() {
        this.rows.forEach(row => row.destroy());
        this.rows = [];

        if (this.isCollapsed) {
            this.title.setText(`Лог (${this.messages.length})`);
            return;
        }

        this.messages.forEach((message, index) => {
            const row = this.scene.add.container(12, 39 + index * this.rowHeight);
            const color = LOG_COLORS[message.type] ?? LOG_COLORS.info;
            const parts = this._splitByUnits(message.text, message.units);
            let offsetX = 0;

            parts.forEach(part => {
                const textObject = this.scene.add.text(offsetX, 0, part.text, {
                    fontSize: '12px',
                    fontFamily: 'Segoe UI',
                    color: part.unit ? '#bae6fd' : color,
                    fontStyle: part.unit ? 'bold' : 'normal'
                }).setOrigin(0, 0);

                if (part.unit) {
                    textObject.setInteractive({ useHandCursor: true });
                    textObject.on('pointerover', () => {
                        textObject.setColor('#ffffff');
                        this._pulseUnit(part.unit);
                    });
                    textObject.on('pointerout', () => textObject.setColor('#bae6fd'));
                    textObject.on('pointerdown', () => this._focusUnit(part.unit));
                }

                row.add(textObject);
                offsetX += textObject.width;
            });

            row.setAlpha(index === this.messages.length - 1 ? 0 : 1);
            if (index === this.messages.length - 1) {
                row.y += 7;
                this.scene.tweens.add({
                    targets: row,
                    alpha: 1,
                    y: row.y - 7,
                    duration: 180,
                    ease: 'Sine.easeOut'
                });
            }

            this.container.add(row);
            this.rows.push(row);
        });
    }

    _splitByUnits(text, units) {
        const uniqueUnits = [...new Set(units.filter(Boolean))];
        const parts = [{ text, unit: null }];

        uniqueUnits.forEach(unit => {
            if (!unit.name) return;
            for (let i = 0; i < parts.length; i++) {
                const part = parts[i];
                if (part.unit) continue;

                const index = part.text.indexOf(unit.name);
                if (index === -1) continue;

                const nextParts = [];
                if (index > 0) nextParts.push({ text: part.text.slice(0, index), unit: null });
                nextParts.push({ text: unit.name, unit });
                const tail = part.text.slice(index + unit.name.length);
                if (tail) nextParts.push({ text: tail, unit: null });
                parts.splice(i, 1, ...nextParts);
                break;
            }
        });

        return parts;
    }

    _focusUnit(unit) {
        if (!unit?.isAlive || !unit.sprite) return;

        this._pulseUnit(unit);

        if (unit.type === 'player' && this.scene.phase === 'player') {
            this.scene.selectUnit(unit);
        }
    }

    _pulseUnit(unit) {
        if (!unit?.isAlive || !unit.sprite) return;

        unit.sprite.setTint(unit.type === 'player' ? 0x7dd3fc : 0xfda4af);
        const ring = this.scene.add.circle(unit.sprite.x, unit.sprite.y, 24, 0xffffff, 0)
            .setStrokeStyle(2, unit.type === 'player' ? 0x7dd3fc : 0xfda4af, 0.9)
            .setDepth(7);

        this.scene.tweens.add({
            targets: ring,
            scale: { from: 0.8, to: 1.45 },
            alpha: { from: 1, to: 0 },
            duration: 360,
            ease: 'Sine.easeOut',
            onComplete: () => {
                ring.destroy();
                if (this.scene.selectedUnit !== unit) {
                    unit.sprite.clearTint();
                }
            }
        });
    }
}
