import * as PIXI from 'pixi.js';
import { DieType } from '../../dice/Die.js'; // Adjust path as needed

const DIE_SIZE = 50; // Visual size of the die
const FONT_SIZE = DIE_SIZE / 2;
const LOCKED_ALPHA = 0.6; // Visual indicator for locked state
const DEFAULT_COLOR = 0xffffff; // White
const LOCKED_TINT = 0xaaaaaa; // Greyish tint when locked

// Define colors for different die types (customize as needed)
const TYPE_COLORS = {
  [DieType.STANDARD]: 0xffffff, // White
  [DieType.HARMONY]: 0xadd8e6,  // Light Blue
  [DieType.RHYTHM]: 0x90ee90,   // Light Green
  [DieType.ANCESTRAL]: 0xffd700, // Gold
};

/**
 * Renders a single die using PixiJS.
 * Updates position and rotation based on physics data.
 * Handles visual states like type and locking.
 */
export class PixiDieRenderer extends PIXI.Container {
  /**
   * Creates a new PixiDieRenderer instance.
   * @param {string} dieId - The ID of the die this renderer represents.
   * @param {number} sides - The number of sides (used for initial display, might influence graphics later).
   * @param {DieType} type - The type of the die for styling.
   */
  constructor(dieId, sides, type) {
    super();
    this.dieId = dieId;
    this.dieType = type;
    this.currentValue = 1; // Store the value to display
    this.isLocked = false;

    this.pivot.set(DIE_SIZE / 2, DIE_SIZE / 2); // Set pivot to center for rotation

    // Create the die face background
    this.face = new PIXI.Graphics();
    this.face.lineStyle(2, 0x000000, 1); // Black border
    this.face.beginFill(TYPE_COLORS[type] || DEFAULT_COLOR);
    this.face.drawRect(0, 0, DIE_SIZE, DIE_SIZE);
    this.face.endFill();
    this.addChild(this.face);

    // Create the text for the die value
    this.valueText = new PIXI.Text(this.currentValue.toString(), {
      fontFamily: 'Arial',
      fontSize: FONT_SIZE,
      fill: 0x000000, // Black text
      align: 'center',
    });
    this.valueText.anchor.set(0.5); // Center anchor
    this.valueText.position.set(DIE_SIZE / 2, DIE_SIZE / 2);
    this.addChild(this.valueText);

    // Make interactive for locking clicks
    this.eventMode = 'static'; // Use 'static' for modern PIXI event handling
    this.cursor = 'pointer';
    this.on('pointertap', this.handleClick, this);

    this.updateVisualState(); // Apply initial locked/alpha state
  }

  /**
   * Updates the die's visual position and rotation based on physics data.
   * @param {object} physicsData - Object containing position and angle.
   * @param {object} physicsData.position - { x: number, y: number }
   * @param {number} physicsData.angle - Rotation in radians.
   */
  updateTransform(physicsData) {
    this.position.set(physicsData.position.x, physicsData.position.y);
    this.rotation = physicsData.angle;
  }

  /**
   * Sets the displayed value on the die face.
   * @param {number} value - The value to display.
   */
  setValue(value) {
    if (this.currentValue !== value) {
      this.currentValue = value;
      this.valueText.text = value.toString();
    }
  }

  /**
   * Sets the locked state and updates visuals accordingly.
   * @param {boolean} locked - Whether the die is locked.
   */
  setLocked(locked) {
    if (this.isLocked !== locked) {
      this.isLocked = locked;
      this.updateVisualState();
    }
  }

  /**
   * Updates alpha and tint based on the locked state.
   */
  updateVisualState() {
     this.alpha = this.isLocked ? LOCKED_ALPHA : 1.0;
     this.face.tint = this.isLocked ? LOCKED_TINT : (TYPE_COLORS[this.dieType] || DEFAULT_COLOR);
     // Maybe disable interactivity visually or actually?
     // this.interactive = !this.isLocked;
  }

  /**
   * Handles click/tap events on the die.
   * Emits an event upwards (to be caught by DiceContainer/DiceSystem)
   * to toggle the lock state in the DiceManager.
   */
  handleClick() {
    // Emit an event that includes the die ID
    // The parent container (DiceContainer) should listen for this
    this.emit('die_clicked', this.dieId);
    console.log(`PixiDieRenderer clicked: ${this.dieId}`);
  }

  // Optional: Method to clean up resources if needed
  destroy(options) {
      this.off('pointertap', this.handleClick, this); // Remove listener
      super.destroy(options);
  }
}
