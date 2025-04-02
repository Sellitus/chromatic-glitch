import Tween from './Tween.js';

/**
 * Manages all active Tween instances in the game.
 * Should be updated once per frame in the main game loop.
 */
export default class TweenManager {
  constructor() {
    this.tweens = [];
  }

  /**
   * Adds a Tween instance to be managed.
   * @param {Tween} tween - The tween instance to add. Should have update() and target properties.
   */
  add(tween) {
    // Duck typing for mock compatibility
    const isValidTween = tween &&
                         typeof tween.update === 'function' &&
                         tween.target !== undefined; // Check if target exists

    if (isValidTween && !this.tweens.includes(tween)) {
      this.tweens.push(tween);
    } else {
      console.warn('Attempted to add invalid or duplicate tween to TweenManager.');
    }
  }

  /**
   * Removes a Tween instance from the manager.
   * @param {Tween} tween - The tween instance to remove.
   */
  remove(tween) {
    const index = this.tweens.indexOf(tween);
    if (index > -1) {
      this.tweens.splice(index, 1);
    }
  }

  /**
   * Removes all tweens targeting a specific object.
   * @param {object} target - The target object whose tweens should be removed.
   */
  removeTweensOf(target) {
    this.tweens = this.tweens.filter(tween => {
      if (tween.target === target) {
        // Optionally call stop() to trigger onStop callbacks if needed
        // tween.stop();
        return false; // Remove this tween
      }
      return true; // Keep this tween
    });
  }

  /**
   * Updates all active tweens.
   * Call this method once per frame from the main game loop.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    if (this.tweens.length === 0) {
      return;
    }

    // Iterate backwards to allow safe removal during iteration
    for (let i = this.tweens.length - 1; i >= 0; i--) {
      const tween = this.tweens[i];
      const stillActive = tween.update(deltaTime);

      if (!stillActive) {
        // Remove completed tweens
        this.tweens.splice(i, 1);
      }
    }
  }

  /**
   * Creates and adds a new tween. Convenience method.
   * @param {object} target - The object whose properties will be tweened.
   * @param {object} properties - An object containing the target properties and their end values.
   * @param {number} duration - The duration of the tween in seconds.
   * @param {object} [options={}] - Optional configuration for the tween (see Tween constructor).
   * @returns {Tween} The created Tween instance.
   */
  createTween(target, properties, duration, options = {}) {
    const tween = new Tween(target, properties, duration, options);
    this.add(tween);
    return tween; // Return the tween so it can be controlled (e.g., played)
  }

  /**
   * Removes all tweens from the manager.
   */
  removeAll() {
    // Optionally stop tweens before removing if callbacks are important
    // this.tweens.forEach(tween => tween.stop());
    this.tweens = [];
  }

  /**
   * Gets the number of active tweens.
   * @returns {number}
   */
  getCount() {
    return this.tweens.length;
  }
}
