/**
 * Represents the different types of dice available.
 * @enum {string}
 */
export const DieType = {
  STANDARD: 'standard', // Basic die
  HARMONY: 'harmony',   // Special type 1
  RHYTHM: 'rhythm',     // Special type 2
  ANCESTRAL: 'ancestral', // Special type 3
};

/**
 * Represents a single die in the game.
 */
export class Die {
  /**
   * Creates a new Die instance.
   * @param {string} id - A unique identifier for this die.
   * @param {number} sides - The number of sides the die has.
   * @param {DieType} [type=DieType.STANDARD] - The type of the die.
   */
  constructor(id, sides, type = DieType.STANDARD) {
    if (!id) {
      throw new Error('Die ID is required.');
    }
    if (typeof sides !== 'number' || sides <= 0) {
      throw new Error('Die sides must be a positive number.');
    }

    this.id = id;
    this.sides = sides;
    this.type = type;
    this.value = 1; // Default initial value
    this.isLocked = false;
    this.modifiers = []; // Array of active modifiers on this die
    this.physicsBody = null; // Reference to the matter-js body
  }

  /**
   * Locks the die, preventing it from being rerolled.
   */
  lock() {
    this.isLocked = true;
    // Potentially add logic to disable physics interactions if needed
    if (this.physicsBody) {
        // Example: Make the body static or increase friction significantly
        // Matter.Body.setStatic(this.physicsBody, true);
    }
    console.log(`Die ${this.id} locked.`);
  }

  /**
   * Unlocks the die, allowing it to be rerolled.
   */
  unlock() {
    this.isLocked = false;
    // Potentially add logic to re-enable physics interactions
     if (this.physicsBody) {
        // Example: Make the body dynamic again
        // Matter.Body.setStatic(this.physicsBody, false);
    }
    console.log(`Die ${this.id} unlocked.`);
  }

  /**
   * Sets the current face value of the die.
   * @param {number} newValue - The new value.
   */
  setValue(newValue) {
    if (typeof newValue === 'number' && newValue >= 1 && newValue <= this.sides) {
      this.value = newValue;
    } else {
      console.warn(`Attempted to set invalid value (${newValue}) for ${this.sides}-sided die ${this.id}.`);
    }
  }

  /**
   * Adds a modifier effect to the die.
   * Modifiers could be objects with properties like { type: 'add', value: 1 } or { type: 'reroll_lowest' }
   * @param {object} modifier - The modifier object.
   */
  addModifier(modifier) {
    this.modifiers.push(modifier);
    console.log(`Modifier added to die ${this.id}:`, modifier);
    // Potentially apply immediate effects or flag for later processing
  }

  /**
   * Removes a specific modifier from the die.
   * @param {object} modifier - The modifier object to remove.
   */
  removeModifier(modifier) {
    const index = this.modifiers.indexOf(modifier);
    if (index > -1) {
      this.modifiers.splice(index, 1);
      console.log(`Modifier removed from die ${this.id}:`, modifier);
    }
  }

  /**
   * Clears all modifiers from the die.
   */
  clearModifiers() {
    this.modifiers = [];
    console.log(`All modifiers cleared from die ${this.id}.`);
  }

  /**
   * Gets the current state of the die for persistence.
   * @returns {object} A serializable state object.
   */
  getState() {
    return {
      id: this.id,
      sides: this.sides,
      type: this.type,
      value: this.value,
      isLocked: this.isLocked,
      modifiers: JSON.parse(JSON.stringify(this.modifiers)), // Deep copy modifiers
    };
  }

  /**
   * Restores the die's state from a saved object.
   * @param {object} state - The saved state object.
   */
  setState(state) {
    if (state.id !== this.id) {
        console.error(`State ID mismatch: trying to load state for ${state.id} into die ${this.id}`);
        return;
    }
    this.sides = state.sides;
    this.type = state.type;
    this.value = state.value;
    this.isLocked = state.isLocked;
    this.modifiers = JSON.parse(JSON.stringify(state.modifiers)); // Deep copy
  }
}
