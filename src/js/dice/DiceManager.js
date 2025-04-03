import { Die, DieType } from './Die.js';

/**
 * Manages a collection of dice, their states, and interactions.
 */
export class DiceManager {
  /**
   * Creates a new DiceManager instance.
   * @param {object} physicsInterface - An object providing methods to interact with the physics engine (e.g., addBody, removeBody, applyForce). Will be implemented by DicePhysics.
   * @param {function} onRollCompleteCallback - Callback function triggered when dice settle after a roll. Signature: (results: Array<{id: string, value: number}>) => void
   */
  constructor(physicsInterface, onRollCompleteCallback) {
    this.dice = new Map(); // Map<string, Die>
    this.physicsInterface = physicsInterface; // Interface to DicePhysics
    this.onRollComplete = onRollCompleteCallback; // Callback for when physics simulation settles

    // We might need to bind the callback from physics here if it's event-based
    // Example: this.physicsInterface.on('settled', this.handleDiceSettled.bind(this));
  }

  /**
   * Creates and adds a new die to the manager.
   * @param {number} sides - Number of sides for the new die.
   * @param {DieType} [type=DieType.STANDARD] - The type of the die.
   * @returns {Die} The newly created Die instance.
   */
  addDie(sides, type = DieType.STANDARD) {
    const id = this._generateUniqueId();
    const newDie = new Die(id, sides, type);
    this.dice.set(id, newDie);

    // Notify physics engine to create a corresponding body
    if (this.physicsInterface && this.physicsInterface.addBody) {
      const physicsBody = this.physicsInterface.addBody(newDie); // Physics needs to return the body reference
      newDie.physicsBody = physicsBody; // Store reference on the Die object
    } else {
        console.warn("DiceManager: Physics interface not fully available for addBody.");
    }


    console.log(`Die added: ${id} (Type: ${type}, Sides: ${sides})`);
    return newDie;
  }

  /**
   * Removes a die from the manager.
   * @param {string} id - The ID of the die to remove.
   */
  removeDie(id) {
    const die = this.dice.get(id);
    if (die) {
      // Notify physics engine to remove the corresponding body
      if (this.physicsInterface && this.physicsInterface.removeBody && die.physicsBody) {
        this.physicsInterface.removeBody(die.physicsBody);
      } else {
         console.warn(`DiceManager: Physics interface not fully available for removeBody for die ${id}.`);
      }

      this.dice.delete(id);
      console.log(`Die removed: ${id}`);
    } else {
      console.warn(`Attempted to remove non-existent die: ${id}`);
    }
  }

  /**
   * Gets a die instance by its ID.
   * @param {string} id - The ID of the die.
   * @returns {Die | undefined} The Die instance or undefined if not found.
   */
  getDie(id) {
    return this.dice.get(id);
  }

  /**
   * Gets all dice currently managed.
   * @returns {Die[]} An array of all Die instances.
   */
  getAllDice() {
    return Array.from(this.dice.values());
  }

  /**
   * Initiates a roll for specified dice (or all non-locked dice if none specified).
   * @param {string[]} [diceIds] - Optional array of IDs of dice to roll. If omitted, rolls all non-locked dice.
   */
  rollDice(diceIds) {
    const diceToRoll = diceIds
      ? diceIds.map(id => this.dice.get(id)).filter(die => die && !die.isLocked)
      : Array.from(this.dice.values()).filter(die => !die.isLocked);

    if (diceToRoll.length === 0) {
      console.log("No dice available or specified to roll.");
      // Optionally trigger the completion callback immediately with empty results
      if (this.onRollComplete) {
          this.onRollComplete([]);
      }
      return;
    }

    console.log(`Rolling ${diceToRoll.length} dice:`, diceToRoll.map(d => d.id));

    // Delegate the actual physics impulse/force application to the physics interface
    if (this.physicsInterface && this.physicsInterface.roll) {
      const bodiesToRoll = diceToRoll.map(die => die.physicsBody).filter(body => body);
       if (bodiesToRoll.length > 0) {
           this.physicsInterface.roll(bodiesToRoll);
       } else {
           console.warn("DiceManager: No valid physics bodies found for the dice selected to roll.");
           // If no bodies, maybe complete immediately? Or handle error?
           if (this.onRollComplete) {
               this.onRollComplete([]); // Or perhaps signal an error state
           }
       }
    } else {
        console.error("DiceManager: Physics interface not available for roll.");
         // If no physics, we can't roll. Trigger completion callback with empty/error state.
        if (this.onRollComplete) {
            this.onRollComplete([]); // Or signal error
        }
    }
    // The physics engine will later determine the results and trigger handleDiceSettled -> onRollComplete
  }

   /**
   * Handles the notification from the physics engine when dice have settled.
   * Updates the values of the corresponding Die instances.
   * @param {Array<{id: string, value: number}>} settledDiceData - Array of objects containing the ID and final value of each settled die.
   */
  handleDiceSettled(settledDiceData) {
      console.log("Dice settled:", settledDiceData);
      const results = [];
      settledDiceData.forEach(data => {
          const die = this.dice.get(data.id);
          if (die) {
              die.setValue(data.value);
              results.push({ id: die.id, value: die.value, type: die.type }); // Include type in results
          } else {
              console.warn(`Received settled data for unknown die ID: ${data.id}`);
          }
      });

      // Apply modifiers after settling? Or before roll? TBD based on game rules.

      // Trigger the final callback provided during construction
      if (this.onRollComplete) {
          this.onRollComplete(results);
      }
  }


  /**
   * Locks a specific die.
   * @param {string} id - The ID of the die to lock.
   */
  lockDie(id) {
    const die = this.dice.get(id);
    if (die) {
      die.lock();
      // Potentially notify physics to make the body static or less interactive
       if (this.physicsInterface && this.physicsInterface.setLockedState && die.physicsBody) {
           this.physicsInterface.setLockedState(die.physicsBody, true);
       }
    }
  }

  /**
   * Unlocks a specific die.
   * @param {string} id - The ID of the die to unlock.
   */
  unlockDie(id) {
    const die = this.dice.get(id);
    if (die) {
      die.unlock();
      // Potentially notify physics to make the body dynamic again
       if (this.physicsInterface && this.physicsInterface.setLockedState && die.physicsBody) {
           this.physicsInterface.setLockedState(die.physicsBody, false);
       }
    }
  }

  /**
   * Gets the current state of all managed dice for persistence.
   * @returns {object[]} An array of serializable state objects for each die.
   */
  getState() {
    return Array.from(this.dice.values()).map(die => die.getState());
  }

  /**
   * Restores the state of the dice manager and its dice from saved data.
   * Assumes the physics bodies will be recreated based on the restored state.
   * @param {object[]} savedStates - An array of saved state objects for dice.
   */
  setState(savedStates) {
    this.dice.clear();
    // Clear existing physics bodies? Depends on DicePhysics implementation.
    if (this.physicsInterface && this.physicsInterface.clearAllBodies) {
        this.physicsInterface.clearAllBodies();
    }

    savedStates.forEach(state => {
      const newDie = new Die(state.id, state.sides, state.type);
      newDie.setState(state);
      this.dice.set(newDie.id, newDie);

      // Recreate physics body for the restored die
      if (this.physicsInterface && this.physicsInterface.addBody) {
         const physicsBody = this.physicsInterface.addBody(newDie);
         newDie.physicsBody = physicsBody;
         // Apply locked state to physics body if needed
         if (newDie.isLocked && this.physicsInterface.setLockedState) {
             this.physicsInterface.setLockedState(physicsBody, true);
         }
      } else {
          console.warn(`DiceManager: Physics interface not available during setState for die ${newDie.id}`);
      }
    });
    console.log(`DiceManager state restored with ${this.dice.size} dice.`);
  }

  /**
   * Generates a simple unique ID.
   * Replace with a more robust method if needed (e.g., uuid library).
   * @returns {string} A unique ID.
   */
  _generateUniqueId() {
    return `die_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
