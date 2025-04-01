import System from "../System.js";
import AudioComponent from "../components/AudioComponent.js";
import TransformComponent from "../components/TransformComponent.js";

/**
 * System for managing audio playback and spatial audio calculations
 */
export default class AudioSystem extends System {
  constructor() {
    super();
    this.listenerPosition = { x: 0, y: 0 }; // Camera/listener position for spatial audio
  }

  /**
   * Get array of required component types for this system
   * @returns {Array<typeof Component>} Array of required component classes
   */
  static getRequiredComponents() {
    return [AudioComponent];
  }

  /**
   * Set the audio listener (camera) position for spatial audio calculations
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  setListenerPosition(x, y) {
    this.listenerPosition.x = x;
    this.listenerPosition.y = y;
  }

  /**
   * Calculate volume based on distance for spatial audio
   * @param {Object} sourcePos - Source position {x, y}
   * @param {number} minDistance - Distance at which volume starts to decrease
   * @param {number} maxDistance - Distance at which volume reaches zero
   * @returns {number} Volume multiplier between 0 and 1
   */
  calculateSpatialVolume(sourcePos, minDistance, maxDistance) {
    const dx = sourcePos.x - this.listenerPosition.x;
    const dy = sourcePos.y - this.listenerPosition.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= minDistance) return 1;
    if (distance >= maxDistance) return 0;

    // Linear falloff between min and max distance
    return 1 - (distance - minDistance) / (maxDistance - minDistance);
  }

  /**
   * Process a single entity
   * @param {number} deltaTime - Time elapsed since last update
   * @param {Entity} entity - Entity to process
   */
  processEntity(deltaTime, entity) {
    const audio = entity.getComponent(AudioComponent);
    const transform = entity.getComponent(TransformComponent);

    // Update spatial audio parameters if entity has a transform
    if (transform) {
      // Iterate through all registered sounds
      for (const [id, config] of audio.sounds) {
        if (!config.spatialize || !audio.isPlaying(id)) continue;

        // Calculate spatial volume based on distance
        const volume = this.calculateSpatialVolume(
          { x: transform.x, y: transform.y },
          config.minDistance ?? 100,
          config.maxDistance ?? 1000
        );

        // In a real implementation, this would update the actual audio node's volume
        // For now, we just store the calculated volume
        config.currentVolume = volume * audio.volume;
      }
    }

    // Let the audio component handle its own updates
    audio.onUpdate(deltaTime);
  }

  /**
   * Called when system is attached to entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onAttach(entityManager) {
    // Optional: Set up audio context, master volume, etc.
  }

  /**
   * Called when system is detached from entity manager
   * @param {EntityManager} entityManager - Reference to the entity manager
   */
  onDetach(entityManager) {
    // Clean up any audio resources
    const entities = entityManager.getEntitiesWithComponents(AudioComponent);
    for (const entity of entities) {
      const audio = entity.getComponent(AudioComponent);
      audio.stopAllSounds();
    }
  }

  /**
   * Pause all audio
   */
  pause() {
    this.isActive = false;
    // In a real implementation: pause all active audio nodes
  }

  /**
   * Resume all audio
   */
  resume() {
    this.isActive = true;
    // In a real implementation: resume all paused audio nodes
  }

  /**
   * Set master volume for all audio
   * @param {number} volume - Volume level between 0 and 1
   */
  setMasterVolume(volume) {
    // In a real implementation: set master volume on audio context
  }

  /**
   * Mute/unmute all audio
   * @param {boolean} muted - Whether to mute
   */
  setMasterMute(muted) {
    // In a real implementation: mute/unmute audio context
  }
}
