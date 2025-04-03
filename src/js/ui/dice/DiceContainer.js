import * as PIXI from 'pixi.js';
import { PixiDieRenderer } from './PixiDieRenderer.js';

/**
 * A PIXI.Container to manage and display multiple PixiDieRenderer instances.
 * It acts as an intermediary between the DiceSystem/DicePhysics and individual die visuals.
 */
export class DiceContainer extends PIXI.Container {
  constructor() {
    super();
    this.dieRenderers = new Map(); // Map<string, PixiDieRenderer>
  }

  /**
   * Creates and adds a new PixiDieRenderer for a given die.
   * @param {Die} die - The Die instance from DiceManager.
   */
  addDieRenderer(die) {
    if (this.dieRenderers.has(die.id)) {
      console.warn(`Renderer for die ${die.id} already exists.`);
      return;
    }

    const renderer = new PixiDieRenderer(die.id, die.sides, die.type);
    this.dieRenderers.set(die.id, renderer);
    this.addChild(renderer);

    // Listen for clicks on this specific die renderer
    renderer.on('die_clicked', this.handleDieClick, this);

    console.log(`Added PixiDieRenderer for die ${die.id}`);
  }

  /**
   * Removes the PixiDieRenderer for a given die ID.
   * @param {string} dieId - The ID of the die whose renderer should be removed.
   */
  removeDieRenderer(dieId) {
    const renderer = this.dieRenderers.get(dieId);
    if (renderer) {
      renderer.off('die_clicked', this.handleDieClick, this); // Stop listening
      this.removeChild(renderer);
      renderer.destroy(); // Clean up Pixi resources
      this.dieRenderers.delete(dieId);
      console.log(`Removed PixiDieRenderer for die ${dieId}`);
    } else {
        console.warn(`Could not find renderer to remove for die ${dieId}`);
    }
  }

  /**
   * Updates the transforms and values of child renderers based on physics and game state.
   * @param {Array<{id: string, position: {x: number, y: number}, angle: number}>} physicsData - Array of physics state objects from DicePhysics.
   * @param {Map<string, Die>} diceState - The current state map from DiceManager.
   */
  updateDiceVisuals(physicsData, diceState) {
    // Update positions and rotations from physics
    physicsData.forEach(data => {
      const renderer = this.dieRenderers.get(data.id);
      if (renderer) {
        renderer.updateTransform(data);
      }
    });

    // Update values and locked states from DiceManager state
    diceState.forEach(die => {
        const renderer = this.dieRenderers.get(die.id);
        if (renderer) {
            renderer.setValue(die.value);
            renderer.setLocked(die.isLocked);
        } else {
            // This might happen if a die exists in manager but renderer wasn't added yet, or vice-versa
            // console.warn(`DiceContainer: No renderer found for die ${die.id} during state update.`);
        }
    });

    // Handle cases where a renderer exists but the die state doesn't (e.g., die removed)
    // This might be better handled by explicitly calling removeDieRenderer when a die is removed.
    // for (const id of this.dieRenderers.keys()) {
    //     if (!diceState.has(id)) {
    //         console.warn(`DiceContainer: Renderer exists for ${id} but no state found. Consider removing renderer.`);
    //         // this.removeDieRenderer(id); // Be careful with modifying map while iterating
    //     }
    // }
  }

  /**
   * Handles the 'die_clicked' event bubbled up from a child PixiDieRenderer.
   * Re-emits the event for the DiceSystem to catch.
   * @param {string} dieId - The ID of the die that was clicked.
   */
  handleDieClick(dieId) {
    // Emit an event upwards, typically caught by the system managing this container (e.g., DiceSystem)
    this.emit('dice_container_event', { type: 'lock_toggle_request', dieId: dieId });
    console.log(`DiceContainer caught click for ${dieId}, emitting lock_toggle_request.`);
  }

  /**
   * Removes all die renderers.
   */
  clearAllRenderers() {
      // Iterate safely while removing
      const idsToRemove = Array.from(this.dieRenderers.keys());
      idsToRemove.forEach(id => this.removeDieRenderer(id));
      console.log("Cleared all die renderers from DiceContainer.");
  }

  // Override destroy to clean up listeners and children
  destroy(options) {
      this.clearAllRenderers(); // Ensure all children are destroyed and listeners removed
      super.destroy(options);
  }
}
