/**
 * Represents a game entity that can hold components
 */
export default class Entity {
  constructor(id) {
    this.id = id;
    this.components = new Map();
    this.componentCounter = 0;
    this.isActive = true;
  }

  /**
   * Add a component to this entity
   * @param {Component} component - The component instance to add
   * @throws {Error} If required component dependencies are missing
   * @returns {Component} The added component
   */
  addComponent(component) {
    // Check component dependencies
    const dependencies = component.constructor.getDependencies();
    for (const dependencyClass of dependencies) {
      if (!this.hasComponent(dependencyClass)) {
        throw new Error(`Entity ${this.id} is missing required component ${dependencyClass.name} for ${component.type}`);
      }
    }

    // Add the component
    const uniqueId = `${component.type}_${this.componentCounter++}`;
    component._uniqueId = uniqueId;
    this.components.set(uniqueId, component);
    component.onAttach(this);
    return component;
  }

  /**
   * Remove a component from this entity
   * @param {string|Function} componentType - Component type name or class
   * @returns {boolean} True if component was removed
   */
  removeComponent(componentType) {
    const searchType = typeof componentType === 'string' ? componentType : componentType.name;
    // Find first component of the given type
    for (const [uniqueId, component] of this.components) {
      if (component.type === searchType) {
        component.onDetach();
        this.components.delete(uniqueId);
        return true;
      }
    }
    return false;
  }

  /**
   * Get a component by type
   * @param {string|Function} componentType - Component type name or class
   * @returns {Component|null} The component instance or null if not found
   */
  getComponent(componentType) {
    const searchType = typeof componentType === 'string' ? componentType : componentType.name;
    // Find first component of the given type
    for (const component of this.components.values()) {
      if (component.type === searchType) return component;
    }
    return null;
  }

  /**
   * Check if entity has a component
   * @param {string|Function} componentType - Component type name or class
   * @returns {boolean} True if entity has the component
   */
  hasComponent(componentType) {
    const searchType = typeof componentType === 'string' ? componentType : componentType.name;
    // Check if any component matches the type
    for (const component of this.components.values()) {
      if (component.type === searchType) return true;
    }
    return false;
  }

  /**
   * Check if entity has all specified components
   * @param {...(string|Function)} componentTypes - Component type names or classes
   * @returns {boolean} True if entity has all components
   */
  hasComponents(...componentTypes) {
    return componentTypes.every(type => this.hasComponent(type));
  }

  /**
   * Update all components
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    if (!this.isActive) return;
    
    for (const component of this.components.values()) {
      component.onUpdate(deltaTime);
    }
  }

  /**
   * Serialize the entity and its components
   * @returns {Object} JSON-serializable object representing the entity's state
   */
  serialize() {
    const components = {};
    for (const component of this.components.values()) {
      const serialized = component.serialize();
      components[component.type] = serialized;
    }

    return {
      id: this.id,
      isActive: this.isActive,
      components
    };
  }

  /**
   * Destroy the entity, cleaning up all components
   */
  destroy() {
    for (const component of this.components.values()) {
      component.onDetach();
    }
    this.components.clear();
  }
}
