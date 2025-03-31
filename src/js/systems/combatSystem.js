export class CombatSystem {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.currentTurn = 0;
    this.enemies = [];
    this.effects = new Map();
    this.animations = [];
  }

  init() {
    // Register event listeners
    this.eventSystem.on('combat:start', this.handleCombatStart.bind(this));
    this.eventSystem.on('combat:end', this.handleCombatEnd.bind(this));
    this.eventSystem.on('combat:damage', this.handleDamage.bind(this));
    this.eventSystem.on('combat:heal', this.handleHeal.bind(this));
    this.eventSystem.on('combat:effect', this.handleEffect.bind(this));
    this.eventSystem.on('turn:end', this.handleTurnEnd.bind(this));
  }

  update() {
    // Update combat animations and effects
    this.updateAnimations();
    this.updateEffects();
  }

  render(ctx) {
    // Render enemies and combat effects
    this.renderEnemies(ctx);
    this.renderEffects(ctx);
    this.renderAnimations(ctx);
  }

  renderEnemies(ctx) {
    this.enemies.forEach(enemy => {
      this.renderEnemy(ctx, enemy);
    });
  }

  renderEnemy(ctx, enemy) {
    const { x, y, width, height, health, maxHealth } = enemy;

    // Draw enemy
    ctx.fillStyle = '#444';
    ctx.fillRect(x, y, width, height);

    // Draw health bar
    const barWidth = width;
    const barHeight = 10;
    const healthPercent = Math.max(0, health / maxHealth);

    ctx.fillStyle = '#800';
    ctx.fillRect(x, y - 20, barWidth, barHeight);
    ctx.fillStyle = '#0a0';
    ctx.fillRect(x, y - 20, barWidth * healthPercent, barHeight);
  }

  renderEffects(ctx) {
    this.effects.forEach(effect => {
      // Render active effects (status icons, particles, etc)
    });
  }

  renderAnimations(ctx) {
    this.animations = this.animations.filter(anim => {
      // Render and update animation
      anim.render(ctx);
      anim.update();
      return !anim.finished;
    });
  }

  updateAnimations() {
    // Update animation states
  }

  updateEffects() {
    // Update effect durations and remove expired effects
    this.effects.forEach((effect, id) => {
      effect.duration--;
      if (effect.duration <= 0) {
        this.effects.delete(id);
      }
    });
  }

  handleCombatStart(data) {
    const { enemies } = data;
    this.enemies = enemies.map(enemy => ({
      ...enemy,
      effects: []
    }));
    this.currentTurn = 0;
    this.effects.clear();
    this.animations = [];
    
    this.eventSystem.emit('combat:started', { enemies: this.enemies });
  }

  handleCombatEnd() {
    this.enemies = [];
    this.effects.clear();
    this.animations = [];
    this.currentTurn = 0;
    
    this.eventSystem.emit('combat:ended');
  }

  handleDamage(data) {
    const { targetId, amount, type = 'normal' } = data;
    const target = this.enemies.find(e => e.id === targetId);
    
    if (target) {
      target.health = Math.max(0, target.health - amount);
      this.addDamageAnimation(target, amount, type);
      
      if (target.health <= 0) {
        this.handleEnemyDefeat(target);
      }
    }
  }

  handleHeal(data) {
    const { targetId, amount } = data;
    const target = this.enemies.find(e => e.id === targetId);
    
    if (target) {
      target.health = Math.min(target.maxHealth, target.health + amount);
      this.addHealAnimation(target, amount);
    }
  }

  handleEffect(data) {
    const { targetId, effect } = data;
    const effectId = Math.random().toString(36).substr(2, 9);
    
    this.effects.set(effectId, {
      ...effect,
      targetId,
      id: effectId
    });
  }

  handleTurnEnd() {
    this.currentTurn++;
    // Process turn-based effects
    this.effects.forEach(effect => {
      if (effect.onTurn) {
        effect.onTurn(effect);
      }
    });
  }

  handleEnemyDefeat(enemy) {
    this.enemies = this.enemies.filter(e => e.id !== enemy.id);
    this.eventSystem.emit('enemy:defeated', { enemy });
    
    if (this.enemies.length === 0) {
      this.handleCombatEnd();
    }
  }

  addDamageAnimation(target, amount, type) {
    // Add damage number animation
    this.animations.push({
      x: target.x + target.width / 2,
      y: target.y,
      value: amount,
      type,
      age: 0,
      maxAge: 60,
      get finished() {
        return this.age >= this.maxAge;
      },
      update() {
        this.age++;
        this.y--;
      },
      render(ctx) {
        const alpha = 1 - this.age / this.maxAge;
        ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.value, this.x, this.y);
      }
    });
  }

  addHealAnimation(target, amount) {
    // Add heal number animation (similar to damage but green)
    this.animations.push({
      x: target.x + target.width / 2,
      y: target.y,
      value: amount,
      age: 0,
      maxAge: 60,
      get finished() {
        return this.age >= this.maxAge;
      },
      update() {
        this.age++;
        this.y--;
      },
      render(ctx) {
        const alpha = 1 - this.age / this.maxAge;
        ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('+' + this.value, this.x, this.y);
      }
    });
  }
}
