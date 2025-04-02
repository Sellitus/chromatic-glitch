// Could potentially import different types of procedural animators later
import OscillatorAnimator from './OscillatorAnimator.js';

/**
 * Manages and updates various procedural animators (like oscillators).
 * Should be updated once per frame in the main game loop.
 */
export default class ProceduralManager {
  constructor() {
    this.animators = [];
  }

  /**
   * Adds a procedural animator instance to be managed.
   * @param {object} animator - The animator instance (e.g., OscillatorAnimator). Must have an `update(deltaTime)` method and `isFinished` property.
   */
  add(animator) {
    // Basic check for required properties/methods
    if (animator && typeof animator.update === 'function' && typeof animator.isFinished === 'boolean' && !this.animators.includes(animator)) {
      this.animators.push(animator);
    } else {
      console.warn('Attempted to add invalid or duplicate animator to ProceduralManager.');
    }
  }

  /**
   * Removes a procedural animator instance from the manager.
   * @param {object} animator - The animator instance to remove.
   */
  remove(animator) {
    const index = this.animators.indexOf(animator);
    if (index > -1) {
      this.animators.splice(index, 1);
    }
  }

  /**
   * Removes all animators targeting a specific object.
   * @param {object} target - The target object whose animators should be removed.
   */
  removeAnimatorsOf(target) {
    this.animators = this.animators.filter(animator => {
      if (animator.target === target) {
        // Optionally call stop() if the animator supports it
        animator.stop?.();
        return false; // Remove this animator
      }
      return true; // Keep this animator
    });
  }

  /**
   * Updates all active procedural animators.
   * Call this method once per frame from the main game loop.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    if (this.animators.length === 0) {
      return;
    }

    // Iterate backwards to allow safe removal during iteration
    for (let i = this.animators.length - 1; i >= 0; i--) {
      const animator = this.animators[i];
      animator.update(deltaTime);

      // Remove finished animators (if they can finish, e.g., after being stopped)
      if (animator.isFinished) {
        this.animators.splice(i, 1);
      }
    }
  }

  /**
   * Creates and adds a new OscillatorAnimator. Convenience method.
   * @param {object} target - The object whose property will be oscillated.
   * @param {string} property - The name of the property to oscillate.
   * @param {object} [options={}] - Configuration options for the oscillator.
   * @returns {OscillatorAnimator} The created OscillatorAnimator instance.
   */
  createOscillator(target, property, options = {}) {
    const oscillator = new OscillatorAnimator(target, property, options);
    this.add(oscillator);
    return oscillator;
  }

  /**
   * Removes all animators from the manager.
   */
  removeAll() {
    // Optionally stop animators before removing
    // this.animators.forEach(animator => animator.stop?.());
    this.animators = [];
  }

  /**
   * Gets the number of active animators.
   * @returns {number}
   */
  getCount() {
    return this.animators.length;
  }
}
