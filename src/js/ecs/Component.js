/**
 * Base class for all ECS components
 */
export default class Component {
  constructor() {
    this.entity = null; // Reference to owning entity
    this.type = this.constructor.name; // String identifier for the component type
  }

  /**
   * Called when the component is added to an entity
   * @param {Entity} entity - The entity this component was added to
   */
  onAttach(entity) {
    this.entity = entity;
  }

  /**
   * Called when the component is removed from an entity
   */
  onDetach() {
    this.entity = null;
  }

  /**
   * Called each update frame if implemented by derived class
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    // Optional override in derived classes
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object representing the component's state
   */
  serialize() {
    return {
      type: this.type
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data object to deserialize from
   */
  deserialize(data) {
    // Override in derived classes
  }

  /**
   * Get any component types this component depends on
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getDependencies() {
    return [];
  }
}
