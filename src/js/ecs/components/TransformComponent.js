import Component from "../Component.js";

/**
 * Component for entity position, rotation, and scale
 */
export default class TransformComponent extends Component {
  constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
    super();
    
    this.x = x;
    this.y = y;
    this.rotation = rotation; // In radians
    this.scaleX = scaleX;
    this.scaleY = scaleY;

    // For interpolation
    this.previousX = x;
    this.previousY = y;
    this.previousRotation = rotation;
  }

  /**
   * Called before position updates to store previous values
   */
  storePreviousState() {
    this.previousX = this.x;
    this.previousY = this.y;
    this.previousRotation = this.rotation;
  }

  /**
   * Get interpolated position and rotation
   * @param {number} factor - Interpolation factor between 0 and 1
   * @returns {Object} Interpolated transform state
   */
  getInterpolatedState(factor) {
    return {
      x: this.previousX + (this.x - this.previousX) * factor,
      y: this.previousY + (this.y - this.previousY) * factor,
      rotation: this.previousRotation + (this.rotation - this.previousRotation) * factor,
      scaleX: this.scaleX,
      scaleY: this.scaleY
    };
  }

  /**
   * Set the position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setPosition(x, y) {
    this.storePreviousState();
    this.x = x;
    this.y = y;
  }

  /**
   * Set the rotation
   * @param {number} rotation - Rotation in radians
   */
  setRotation(rotation) {
    this.storePreviousState();
    this.rotation = rotation;
  }

  /**
   * Set the scale
   * @param {number} x - X scale factor
   * @param {number} y - Y scale factor
   */
  setScale(x, y) {
    this.scaleX = x;
    this.scaleY = y;
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object
   */
  serialize() {
    return {
      ...super.serialize(),
      x: this.x,
      y: this.y,
      rotation: this.rotation,
      scaleX: this.scaleX,
      scaleY: this.scaleY
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data to deserialize from
   */
  deserialize(data) {
    this.x = data.x ?? 0;
    this.y = data.y ?? 0;
    this.rotation = data.rotation ?? 0;
    this.scaleX = data.scaleX ?? 1;
    this.scaleY = data.scaleY ?? 1;
    this.previousX = this.x;
    this.previousY = this.y;
    this.previousRotation = this.rotation;
  }
}
