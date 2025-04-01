import Component from "../Component.js";
import TransformComponent from "./TransformComponent.js";

/**
 * Component for visual representation of an entity
 */
export default class RendererComponent extends Component {
  constructor(options = {}) {
    super();

    // Visual properties
    this.visible = options.visible ?? true;
    this.alpha = options.alpha ?? 1;
    this.tint = options.tint ?? 0xFFFFFF;
    this.blendMode = options.blendMode ?? 'normal';
    
    // Asset reference (e.g., sprite name, image path)
    this.assetId = options.assetId ?? null;
    
    // Custom draw function if needed
    this.customRender = options.customRender ?? null;

    // Sprite dimensions
    this.width = options.width ?? 0;
    this.height = options.height ?? 0;

    // Optional sprite anchor point (defaults to center)
    this.anchorX = options.anchorX ?? 0.5;
    this.anchorY = options.anchorY ?? 0.5;

    // Layer for render ordering (higher numbers render on top)
    this.layer = options.layer ?? 0;
  }

  /**
   * Get component dependencies
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getDependencies() {
    return [TransformComponent];
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object
   */
  serialize() {
    return {
      ...super.serialize(),
      visible: this.visible,
      alpha: this.alpha,
      tint: this.tint,
      blendMode: this.blendMode,
      assetId: this.assetId,
      width: this.width,
      height: this.height,
      anchorX: this.anchorX,
      anchorY: this.anchorY,
      layer: this.layer
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data to deserialize from
   */
  deserialize(data) {
    this.visible = data.visible ?? true;
    this.alpha = data.alpha ?? 1;
    this.tint = data.tint ?? 0xFFFFFF;
    this.blendMode = data.blendMode ?? 'normal';
    this.assetId = data.assetId ?? null;
    this.width = data.width ?? 0;
    this.height = data.height ?? 0;
    this.anchorX = data.anchorX ?? 0.5;
    this.anchorY = data.anchorY ?? 0.5;
    this.layer = data.layer ?? 0;
  }

  /**
   * Set the visibility of the entity
   * @param {boolean} visible - Whether the entity should be visible
   */
  setVisible(visible) {
    this.visible = visible;
  }

  /**
   * Set the opacity of the entity
   * @param {number} alpha - Alpha value between 0 and 1
   */
  setAlpha(alpha) {
    this.alpha = Math.max(0, Math.min(1, alpha));
  }

  /**
   * Set the tint color
   * @param {number} color - Color value in hex format (e.g., 0xFF0000 for red)
   */
  setTint(color) {
    this.tint = color;
  }

  /**
   * Set the dimensions of the sprite
   * @param {number} width - Width in pixels
   * @param {number} height - Height in pixels
   */
  setDimensions(width, height) {
    this.width = width;
    this.height = height;
  }

  /**
   * Set the anchor point (pivot) of the sprite
   * @param {number} x - X anchor (0-1)
   * @param {number} y - Y anchor (0-1)
   */
  setAnchor(x, y) {
    this.anchorX = x;
    this.anchorY = y;
  }

  /**
   * Set the render layer
   * @param {number} layer - Layer number (higher numbers render on top)
   */
  setLayer(layer) {
    this.layer = layer;
  }
}
