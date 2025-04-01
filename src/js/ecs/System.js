/**
 * Base class for all ECS systems
 */
export default class System {
  constructor() {
    this.isActive = true;
    this.requiredComponents = this.constructor.getRequiredComponents();
  }

  /**
   * Update method called each frame for logic systems
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  update(deltaTime, entityManager) {
    if (!this.isActive) return;

    // Get entities that match our required components
    const entities = entityManager.getEntitiesWithComponents(...this.requiredComponents);
    
    // Process each matching entity
    for (const entity of entities) {
      if (entity.isActive) {
        this.processEntity(deltaTime, entity);
      }
    }
  }

  /**
   * Process a single entity
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Entity} entity - Entity to process
   */
  processEntity(deltaTime, entity) {
    // Override in derived classes
  }

  /**
   * Get array of required component types for this system
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getRequiredComponents() {
    return [];
  }

  /**
   * Called when system is added to entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onAttach(entityManager) {
    // Optional override in derived classes
  }

  /**
   * Called when system is removed from entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onDetach(entityManager) {
    // Optional override in derived classes
  }

  /**
   * Check if this system should process a given entity
   * @param {Entity} entity - Entity to check
   * @returns {boolean} True if system should process this entity
   */
  shouldProcessEntity(entity) {
    return entity.isActive && this.requiredComponents.every(type => entity.hasComponent(type));
  }

  /**
   * Create a specialized render update method for render systems
   * This is called during the render phase with interpolation
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  render(interpolationFactor, entityManager) {
    if (!this.isActive) return;

    const entities = entityManager.getEntitiesWithComponents(...this.requiredComponents);
    
    for (const entity of entities) {
      if (entity.isActive) {
        this.processEntityRender(interpolationFactor, entity);
      }
    }
  }

  /**
   * Process a single entity during render
   * @param {number} interpolationFactor - Interpolation factor for smooth rendering
   * @param {Entity} entity - Entity to process
   */
  processEntityRender(interpolationFactor, entity) {
    // Override in derived classes that need to render
  }
}
