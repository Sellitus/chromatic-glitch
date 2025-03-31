/**
 * Manages game scenes and transitions between them
 */
export default class SceneManager {
  constructor(assetManager = null) {
    this.scenes = new Map();
    this.activeScene = null;
    this.transitioning = false;
    this.transitionDuration = 500; // Default transition duration in ms
    this.assetManager = assetManager;
  }

  /**
   * Set the asset manager instance
   * @param {AssetManager} assetManager - Asset manager instance
   */
  setAssetManager(assetManager) {
    this.assetManager = assetManager;
  }

  /**
   * Register a scene with the manager
   * @param {Scene} scene - Scene instance to register
   */
  addScene(scene) {
    if (this.scenes.has(scene.name)) {
      console.warn(`Scene ${scene.name} is already registered`);
      return;
    }
    this.scenes.set(scene.name, scene);
  }

  /**
   * Switch to a different scene
   * @param {string} sceneName - Name of the scene to switch to
   * @returns {Promise} Resolves when the transition is complete
   */
  async switchToScene(sceneName) {
    if (this.transitioning) {
      console.warn('Scene transition already in progress');
      return;
    }

    const nextScene = this.scenes.get(sceneName);
    if (!nextScene) {
      console.error(`Scene ${sceneName} not found`);
      return;
    }

    this.transitioning = true;

    // Handle current scene cleanup
    if (this.activeScene) {
      this.activeScene.pause();
      await this.fadeOut();
      this.activeScene.destroy();
    }

    // Initialize and load next scene
    if (!nextScene.isInitialized) {
      nextScene.init(this.assetManager);
      await nextScene.loadAssets();
    }

    this.activeScene = nextScene;
    this.activeScene.resume();
    await this.fadeIn();

    this.transitioning = false;
  }

  /**
   * Update the active scene
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    if (this.activeScene && !this.transitioning) {
      this.activeScene.update(deltaTime);
    }
  }

  /**
   * Render the active scene
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   */
  render(interpolationFactor) {
    if (this.activeScene) {
      this.activeScene.render(interpolationFactor);
    }
  }

  /**
   * Handle input events for the active scene
   * @param {string} inputType - Type of input event
   * @param {Event} event - The input event
   */
  handleInput(inputType, event) {
    if (this.activeScene && !this.transitioning) {
      this.activeScene.handleInput(inputType, event);
    }
  }

  /**
   * Simple fade out transition
   * @returns {Promise} Resolves when fade out is complete
   */
  async fadeOut() {
    return new Promise(resolve => {
      // TODO: Implement fade out transition effect
      setTimeout(resolve, this.transitionDuration);
    });
  }

  /**
   * Simple fade in transition
   * @returns {Promise} Resolves when fade in is complete
   */
  async fadeIn() {
    return new Promise(resolve => {
      // TODO: Implement fade in transition effect
      setTimeout(resolve, this.transitionDuration);
    });
  }

  /**
   * Get the currently active scene
   * @returns {Scene|null} The active scene or null if none
   */
  getActiveScene() {
    return this.activeScene;
  }

  /**
   * Check if a scene exists
   * @param {string} sceneName - Name of the scene to check
   * @returns {boolean} True if the scene exists
   */
  hasScene(sceneName) {
    return this.scenes.has(sceneName);
  }
}
