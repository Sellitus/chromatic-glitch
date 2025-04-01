import EntityManager from "../ecs/EntityManager.js";
import RenderSystem from "../ecs/systems/RenderSystem.js";
import TimerSystem from "../ecs/systems/TimerSystem.js";
import AudioSystem from "../ecs/systems/AudioSystem.js";

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

    // Initialize ECS
    this.entityManager = new EntityManager();

    // Add core systems
    this.systems = {
      timer: new TimerSystem(),
      render: new RenderSystem(),
      audio: new AudioSystem()
    };

    // Add systems to entity manager
    this.entityManager.addSystem(this.systems.timer);
    this.entityManager.addSystem(this.systems.audio);
    this.entityManager.addSystem(this.systems.render, true); // true for render system
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

    this.setupSystems();
    this.isInitialized = true;
  }

  /**
   * Set up any additional systems needed by the scene
   * Override in derived classes
   */
  setupSystems() {
    // Override in derived classes to add scene-specific systems
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
    if (this.isPaused) return;
    
    // Update ECS
    this.entityManager.updateLogic(deltaTime);

    // Scene-specific update logic
    this.updateScene(deltaTime);
  }

  /**
   * Scene-specific update logic
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateScene(deltaTime) {
    // Override in derived classes
  }

  /**
   * Render the scene
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   */
  render(interpolationFactor) {
    // Update ECS rendering
    this.entityManager.updateRendering(interpolationFactor);

    // Scene-specific render logic
    this.renderScene(interpolationFactor);
  }

  /**
   * Scene-specific render logic
   * @param {number} interpolationFactor - Interpolation factor
   */
  renderScene(interpolationFactor) {
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
    // Clean up ECS
    this.entityManager.destroy();

    // Scene-specific cleanup
    this.destroyScene();
  }

  /**
   * Scene-specific cleanup
   */
  destroyScene() {
    // Override in derived classes
  }

  /**
   * Create a new entity in the scene
   * @returns {Entity} The created entity
   */
  createEntity() {
    return this.entityManager.createEntity();
  }

  /**
   * Get an entity by ID
   * @param {string} id - Entity ID
   * @returns {Entity|null} The entity or null if not found
   */
  getEntity(id) {
    return this.entityManager.getEntity(id);
  }

  /**
   * Get all entities with the specified components
   * @param {...(string|Function)} componentTypes - Component types to filter by
   * @returns {Entity[]} Array of matching entities
   */
  getEntitiesWithComponents(...componentTypes) {
    return this.entityManager.getEntitiesWithComponents(...componentTypes);
  }

  /**
   * Add a system to the scene
   * @param {System} system - System to add
   * @param {boolean} [isRenderSystem=false] - Whether this is a render system
   */
  addSystem(system, isRenderSystem = false) {
    this.entityManager.addSystem(system, isRenderSystem);
  }

  /**
   * Remove a system from the scene
   * @param {System} system - System to remove
   */
  removeSystem(system) {
    this.entityManager.removeSystem(system);
  }

  /**
   * Serialize scene entities
   * @returns {Object} Serialized entity data
   */
  serialize() {
    return this.entityManager.serialize();
  }

  /**
   * Deserialize scene entities
   * @param {Object} data - Serialized entity data
   * @param {Map<string, typeof Component>} componentTypes - Map of component type names to classes
   */
  deserialize(data, componentTypes) {
    this.entityManager.deserialize(data, componentTypes);
  }
}
