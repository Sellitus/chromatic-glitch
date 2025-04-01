import System from "../System.js";
import TimerComponent from "../components/TimerComponent.js";

/**
 * System for updating all active timers
 */
export default class TimerSystem extends System {
  /**
   * Get array of required component types for this system
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getRequiredComponents() {
    return [TimerComponent];
  }

  /**
   * Process a single entity
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Entity} entity - Entity to process
   */
  processEntity(deltaTime, entity) {
    const timerComponent = entity.getComponent(TimerComponent);
    
    // Timer component handles its own update logic
    timerComponent.onUpdate(deltaTime);
  }

  /**
   * Called when system is attached to entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onAttach(entityManager) {
    // Optional: Could pre-cache entities with timers here
  }

  /**
   * Called when system is detached from entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onDetach(entityManager) {
    // Optional: Clean up any cached data
  }
}
