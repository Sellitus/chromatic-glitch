import Entity from "./Entity.js";

/**
 * Manages all entities, components, and systems in the game
 */
export default class EntityManager {
  constructor() {
    this.entities = new Map(); // Map<string, Entity>
    this.systems = new Set(); // Set<System>
    this.renderSystems = new Set(); // Set<System>
    this.nextEntityId = 0;
  }

  /**
   * Create a new entity
   * @returns {Entity} The created entity
   */
  createEntity() {
    const id = `entity_${this.nextEntityId++}`;
    const entity = new Entity(id);
    this.entities.set(id, entity);
    return entity;
  }

  /**
   * Get an entity by ID
   * @param {string} id - Entity ID
   * @returns {Entity|null} The entity or null if not found
   */
  getEntity(id) {
    return this.entities.get(id) || null;
  }

  /**
   * Destroy an entity and remove it from the manager
   * @param {string|Entity} entityOrId - Entity or entity ID to destroy
   * @returns {boolean} True if entity was destroyed
   */
  destroyEntity(entityOrId) {
    const id = entityOrId instanceof Entity ? entityOrId.id : entityOrId;
    const entity = this.entities.get(id);
    if (entity) {
      entity.destroy();
      this.entities.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Add a system to process entities
   * @param {System} system - System instance to add
   * @param {boolean} isRenderSystem - Whether this is a render system
   */
  addSystem(system, isRenderSystem = false) {
    if (isRenderSystem) {
      this.renderSystems.add(system);
    } else {
      this.systems.add(system);
    }
    system.onAttach(this);
  }

  /**
   * Remove a system
   * @param {System} system - System to remove
   */
  removeSystem(system) {
    this.systems.delete(system);
    this.renderSystems.delete(system);
    system.onDetach(this);
  }

  /**
   * Get all entities that have the specified components
   * @param {...(string|Function)} componentTypes - Component types to filter by
   * @returns {Entity[]} Array of matching entities
   */
  getEntitiesWithComponents(...componentTypes) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (componentTypes.every(type => entity.hasComponent(type))) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Update all logic systems
   * @param {number} deltaTime - Time elapsed since last update
   */
  updateLogic(deltaTime) {
    for (const system of this.systems) {
      system.update(deltaTime, this);
    }
  }

  /**
   * Update all render systems
   * @param {number} interpolationFactor - Interpolation factor for smooth rendering
   */
  updateRendering(interpolationFactor) {
    for (const system of this.renderSystems) {
      system.render(interpolationFactor, this);
    }
  }

  /**
   * Serialize all entities and their components
   * @returns {Object} JSON-serializable object of all entity data
   */
  serialize() {
    const entityData = {};
    for (const [id, entity] of this.entities) {
      entityData[id] = entity.serialize();
    }
    return entityData;
  }

  /**
   * Create entities from serialized data
   * @param {Object} data - Serialized entity data
   * @param {Map<string, typeof Component>} componentTypes - Map of component type names to classes
   */
  deserialize(data, componentTypes) {
    // Clear existing entities
    this.entities.clear();
    this.nextEntityId = 0;

    // Recreate entities from data
    for (const [id, entityData] of Object.entries(data)) {
      const entity = new Entity(id);
      entity.isActive = entityData.isActive;

      // Recreate components
      for (const [typeName, componentData] of Object.entries(entityData.components)) {
        const ComponentClass = componentTypes.get(typeName);
        if (ComponentClass) {
          const component = new ComponentClass();
          component.deserialize(componentData);
          entity.addComponent(component);
        } else {
          console.warn(`Unknown component type: ${typeName}`);
        }
      }

      this.entities.set(id, entity);
      
      // Update nextEntityId to be larger than any existing ID
      const idNum = parseInt(id.split('_')[1]);
      if (idNum >= this.nextEntityId) {
        this.nextEntityId = idNum + 1;
      }
    }
  }

  /**
   * Clean up all entities and systems
   */
  destroy() {
    // Clean up all entities
    for (const entity of this.entities.values()) {
      entity.destroy();
    }
    this.entities.clear();

    // Clean up all systems
    for (const system of this.systems) {
      system.onDetach(this);
    }
    this.systems.clear();

    for (const system of this.renderSystems) {
      system.onDetach(this);
    }
    this.renderSystems.clear();
  }
}
