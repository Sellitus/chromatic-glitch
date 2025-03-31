/**
 * Base Scene class that all game scenes will extend
 */
export default class Scene {
  /**
   * @param {string} name - Unique identifier for the scene
   * @param {AssetManager} [assetManager] - Asset manager instance
   */
  constructor(name, assetManager = null) {
    this.name = name;
    this.isInitialized = false;
    this.isPaused = false;
    this.assetManager = assetManager;
  }

  /**
   * Initialize the scene. Called once when the scene is first created.
   * @param {AssetManager} [assetManager] - Asset manager instance
   */
  init(assetManager = null) {
    if (assetManager) {
      this.assetManager = assetManager;
    }
    if (this.isInitialized) {
      console.warn(`Scene ${this.name} is already initialized`);
      return;
    }
    this.isInitialized = true;
  }

  /**
   * Load any assets needed by the scene
   * @returns {Promise} Resolves when all assets are loaded
   */
  async loadAssets() {
    // Override in derived classes
    return Promise.resolve();
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    // Override in derived classes
  }

  /**
   * Render the scene
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   */
  render(interpolationFactor) {
    // Override in derived classes
  }

  /**
   * Handle input events
   * @param {string} inputType - Type of input (e.g., 'keydown', 'mousedown')
   * @param {Event} event - The input event
   */
  handleInput(inputType, event) {
    // Override in derived classes
  }

  /**
   * Pause the scene
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the scene
   */
  resume() {
    this.isPaused = false;
  }

  /**
   * Clean up scene resources
   */
  destroy() {
    // Override in derived classes
  }
}
