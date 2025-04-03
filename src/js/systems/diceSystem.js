import { DiceManager } from '../dice/DiceManager.js';
import { DicePhysics } from '../dice/DicePhysics.js';
import { DiceContainer } from '../ui/dice/DiceContainer.js';
import { DieType } from '../dice/Die.js'; // Import DieType if needed for adding dice

export class DiceSystem {
  /**
   * @param {object} eventSystem - The game's event bus.
   * @param {PIXI.Application | PIXI.Container} stage - The PIXI stage or container to add the DiceContainer to.
   * @param {HTMLElement} [physicsDebugElement] - Optional element for Matter.js debug rendering.
   */
  constructor(eventSystem, stage, physicsDebugElement = null) {
    this.eventSystem = eventSystem;
    this.stage = stage; // PIXI stage/container reference

    // Instantiate components
    // Physics needs a callback for when dice settle
    this.dicePhysics = new DicePhysics(
        physicsDebugElement,
        this.handlePhysicsSettle.bind(this)
    );

    // Manager needs the physics interface and a callback for when roll calculation is complete
    this.diceManager = new DiceManager(
        this.dicePhysics, // Provide physics interface
        this.handleRollComplete.bind(this)
    );

    // UI Container
    this.diceContainer = new DiceContainer();

    console.log("DiceSystem initialized with components.");
  }

  /**
   * Initializes the system, adds UI to stage, and registers event listeners.
   */
  init() {
    // Add the UI container to the PIXI stage
    if (this.stage) {
        this.stage.addChild(this.diceContainer);
        console.log("DiceContainer added to the stage.");
    } else {
        console.error("DiceSystem: Stage reference not provided, cannot add DiceContainer.");
    }

    // Listen for UI events (e.g., lock clicks) from the container
    this.diceContainer.on('dice_container_event', this.handleContainerEvent.bind(this));

    // Register event listeners for game events
    this.eventSystem.on('dice:roll', this.handleDiceRoll.bind(this));
    this.eventSystem.on('dice:add', this.handleDiceAdd.bind(this));
    this.eventSystem.on('dice:remove', this.handleDiceRemove.bind(this));
    // Add listener for lock/unlock requests if needed separate from clicks
    this.eventSystem.on('dice:lock', this.handleDiceLock.bind(this));
    this.eventSystem.on('dice:unlock', this.handleDiceUnlock.bind(this));
    // Listener for loading state
    this.eventSystem.on('game:load_state', this.handleLoadState.bind(this));


    console.log("DiceSystem init complete, event listeners registered.");

    // Example: Add a test die on init
    // this.addTestDice();
  }

  addTestDice() {
      console.log("Adding test dice...");
      const die1 = this.diceManager.addDie(6, DieType.STANDARD);
      const die2 = this.diceManager.addDie(6, DieType.HARMONY);
      this.diceContainer.addDieRenderer(die1);
      this.diceContainer.addDieRenderer(die2);
      console.log("Test dice added.");
  }

  /**
   * System update loop. Called every frame.
   * Updates the UI container based on physics data and manager state.
   * Note: Matter.js physics runs independently via its Runner.
   */
  update() {
    // Get current physics data (positions, rotations)
    const physicsData = this.dicePhysics.getPhysicsDataForRendering();

    // Get current logical dice state (values, locked status)
    const diceState = this.diceManager.dice; // Get the internal map

    // Update the Pixi renderers
    this.diceContainer.updateDiceVisuals(physicsData, diceState);
  }

  // --- Event Handlers ---

  /** Handles request to roll dice. */
  handleDiceRoll(data) {
    console.log("DiceSystem received dice:roll event:", data);
    // data might contain specific dice IDs { ids: ['die_1', 'die_2'] } or be empty to roll all
    this.diceManager.rollDice(data?.ids);
  }

  /** Handles request to add a new die. */
  handleDiceAdd(data) {
    console.log("DiceSystem received dice:add event:", data);
    const { sides = 6, type = DieType.STANDARD } = data;
    const newDie = this.diceManager.addDie(sides, type);
    // Create the corresponding renderer
    this.diceContainer.addDieRenderer(newDie);
  }

  /** Handles request to remove a die. */
  handleDiceRemove(data) {
    console.log("DiceSystem received dice:remove event:", data);
    const { dieId } = data;
    if (dieId) {
      this.diceManager.removeDie(dieId);
      this.diceContainer.removeDieRenderer(dieId);
    } else {
        console.warn("DiceSystem: dice:remove event missing dieId.");
    }
  }

   /** Handles request to lock a die. */
   handleDiceLock(data) {
       console.log("DiceSystem received dice:lock event:", data);
       const { dieId } = data;
       if (dieId) {
           this.diceManager.lockDie(dieId);
           // UI update happens in the main update loop
       }
   }

   /** Handles request to unlock a die. */
   handleDiceUnlock(data) {
       console.log("DiceSystem received dice:unlock event:", data);
       const { dieId } = data;
       if (dieId) {
           this.diceManager.unlockDie(dieId);
           // UI update happens in the main update loop
       }
   }

  /** Handles events bubbled up from the DiceContainer (e.g., clicks). */
  handleContainerEvent(eventData) {
      console.log("DiceSystem received dice_container_event:", eventData);
      if (eventData.type === 'lock_toggle_request') {
          const dieId = eventData.dieId;
          const die = this.diceManager.getDie(dieId);
          if (die) {
              if (die.isLocked) {
                  this.eventSystem.emit('dice:unlock', { dieId }); // Use events for consistency
                  // this.diceManager.unlockDie(dieId); // Or call directly
              } else {
                  this.eventSystem.emit('dice:lock', { dieId }); // Use events for consistency
                  // this.diceManager.lockDie(dieId); // Or call directly
              }
          }
      }
  }

  /** Callback from DicePhysics when dice have physically settled. */
  handlePhysicsSettle(settledDiceData) {
      // Pass the settled data to the manager to update logical values
      this.diceManager.handleDiceSettled(settledDiceData);
  }

  /** Callback from DiceManager when roll calculation (value setting) is complete. */
  handleRollComplete(results) {
      console.log("DiceSystem: Roll complete. Final results:", results);
      // Emit the final results to the rest of the game
      this.eventSystem.emit('dice:rolled', {
          results: results,
          total: results.reduce((sum, die) => sum + die.value, 0) // Calculate total if needed
      });
  }

   /** Handles loading game state. */
   handleLoadState(gameState) {
       console.log("DiceSystem handling game:load_state");
       if (gameState && gameState.dice) {
           // Clear existing dice visuals and state
           this.diceContainer.clearAllRenderers();
           // Manager's setState should handle clearing physics bodies via its interface
           this.diceManager.setState(gameState.dice);

           // Re-create renderers for the loaded dice
           const loadedDice = this.diceManager.getAllDice();
           loadedDice.forEach(die => {
               this.diceContainer.addDieRenderer(die);
           });
           console.log(`DiceSystem restored state for ${loadedDice.length} dice.`);
       } else {
           console.log("DiceSystem: No dice state found in loaded game state.");
           // Ensure current dice are cleared if loading an empty state
           this.diceContainer.clearAllRenderers();
           this.diceManager.setState([]); // Clear manager state
       }
   }

   /** Gets the current state for saving. */
   getState() {
       return this.diceManager.getState();
   }

  /** Cleans up the system, removes UI, stops physics. */
  destroy() {
    console.log("Destroying DiceSystem...");
    // Stop physics
    this.dicePhysics.stop();

    // Remove listeners
    this.eventSystem.off('dice:roll', this.handleDiceRoll.bind(this));
    this.eventSystem.off('dice:add', this.handleDiceAdd.bind(this));
    this.eventSystem.off('dice:remove', this.handleDiceRemove.bind(this));
    this.eventSystem.off('dice:lock', this.handleDiceLock.bind(this));
    this.eventSystem.off('dice:unlock', this.handleDiceUnlock.bind(this));
    this.eventSystem.off('game:load_state', this.handleLoadState.bind(this));


    this.diceContainer.off('dice_container_event', this.handleContainerEvent.bind(this));

    // Remove container from stage and destroy it
    if (this.stage) {
        this.stage.removeChild(this.diceContainer);
    }
    this.diceContainer.destroy({ children: true }); // Destroy container and its children

    // Nullify references
    this.diceManager = null;
    this.dicePhysics = null;
    this.diceContainer = null;
    this.stage = null;
    this.eventSystem = null;

    console.log("DiceSystem destroyed.");
  }
}
