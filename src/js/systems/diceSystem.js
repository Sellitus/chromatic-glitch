export class DiceSystem {
  constructor(eventSystem) {
    this.eventSystem = eventSystem;
    this.dice = new Map();
    this.activeDice = [];
    this.rolling = false;
    this.rollDuration = 1000; // ms
    this.rollStartTime = 0;
  }

  init() {
    // Register event listeners
    this.eventSystem.on('dice:roll', this.handleDiceRoll.bind(this));
    this.eventSystem.on('dice:add', this.handleDiceAdd.bind(this));
    this.eventSystem.on('dice:remove', this.handleDiceRemove.bind(this));
  }

  update() {
    if (this.rolling) {
      const elapsed = Date.now() - this.rollStartTime;
      if (elapsed >= this.rollDuration) {
        this.finishRoll();
      } else {
        this.updateRollingDice(elapsed / this.rollDuration);
      }
    }
  }

  render(ctx) {
    // Render all active dice
    this.activeDice.forEach(die => {
      this.renderDie(ctx, die);
    });
  }

  renderDie(ctx, die) {
    // Implementation will render individual die with animation
    const { x, y, size, value, rotation } = die;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    
    // Draw die face
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.fillRect(-size/2, -size/2, size, size);
    ctx.strokeRect(-size/2, -size/2, size, size);
    
    // Draw value
    ctx.fillStyle = '#000';
    ctx.font = `${size/2}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(value.toString(), 0, 0);
    
    ctx.restore();
  }

  handleDiceRoll(data) {
    const { count = 1, sides = 6 } = data;
    this.startRoll(count, sides);
  }

  handleDiceAdd(data) {
    const { sides = 6 } = data;
    this.addDie(sides);
  }

  handleDiceRemove(data) {
    const { dieId } = data;
    this.removeDie(dieId);
  }

  startRoll(count, sides) {
    this.rolling = true;
    this.rollStartTime = Date.now();
    
    // Create temporary dice for the roll
    this.activeDice = Array(count).fill(null).map(() => ({
      id: Math.random().toString(36).substr(2, 9),
      sides,
      value: 1,
      x: 400, // These would be calculated based on layout
      y: 300,
      size: 50,
      rotation: 0,
      rotationSpeed: Math.random() * 10 - 5
    }));
  }

  updateRollingDice(progress) {
    this.activeDice.forEach(die => {
      // Update dice animation properties
      die.rotation += die.rotationSpeed;
      if (progress < 0.8) { // Keep randomly changing values until near end
        die.value = Math.floor(Math.random() * die.sides) + 1;
      }
    });
  }

  finishRoll() {
    this.rolling = false;
    const results = this.activeDice.map(die => ({
      ...die,
      value: Math.floor(Math.random() * die.sides) + 1
    }));
    
    // Emit results
    this.eventSystem.emit('dice:rolled', {
      results,
      total: results.reduce((sum, die) => sum + die.value, 0)
    });
  }

  addDie(sides) {
    const die = {
      id: Math.random().toString(36).substr(2, 9),
      sides,
      value: Math.floor(Math.random() * sides) + 1
    };
    this.dice.set(die.id, die);
    return die;
  }

  removeDie(dieId) {
    this.dice.delete(dieId);
  }

  getDie(dieId) {
    return this.dice.get(dieId);
  }
}
