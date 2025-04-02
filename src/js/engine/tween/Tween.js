import { Easing } from './Easing.js';

/**
 * Represents a single tween operation, animating properties of a target object over time.
 */
export default class Tween {
  /**
   * Creates a Tween instance.
   * @param {object} target - The object whose properties will be tweened.
   * @param {object} properties - An object containing the target properties and their end values.
   *                              Example: { x: 100, alpha: 0 }
   * @param {number} duration - The duration of the tween in seconds.
   * @param {object} [options={}] - Optional configuration for the tween.
   * @param {function} [options.easing=Easing.linear] - The easing function to use.
   * @param {number} [options.delay=0] - Delay before the tween starts (in seconds).
   * @param {boolean} [options.loop=false] - Whether the tween should loop.
   * @param {boolean} [options.yoyo=false] - If looping, whether to reverse direction each time.
   * @param {function} [options.onStart=null] - Callback function when the tween starts (after delay).
   * @param {function} [options.onUpdate=null] - Callback function on each tween update.
   * @param {function} [options.onComplete=null] - Callback function when the tween finishes (or completes a loop cycle if looping).
   * @param {function} [options.onStop=null] - Callback function when the tween is explicitly stopped.
   * @param {object} [options.startProperties=null] - Optional explicit start values. If null, values are captured from the target when the tween starts.
   */
  constructor(target, properties, duration, options = {}) {
    if (!target || !properties || duration <= 0) {
      throw new Error('Tween requires target, properties, and a positive duration.');
    }

    this.target = target;
    // Store the originally passed end properties separately
    this._targetEndProperties = { ...properties };
    this.duration = duration;

    this.easing = options.easing ?? Easing.linear;
    this.delay = options.delay ?? 0;
    this.loop = options.loop ?? false;
    this.yoyo = options.yoyo ?? false;
    this.onStart = options.onStart ?? null;
    this.onUpdate = options.onUpdate ?? null;
    this.onComplete = options.onComplete ?? null;
    this.onStop = options.onStop ?? null;
    this.explicitStartProperties = options.startProperties ?? null;

    // Properties used during tweening
    this.startProperties = {};
    this.endProperties = {}; // Will be set based on filtering/yoyo
    this.propertyKeys = []; // Will be set during initialization

    // Internal state
    this._originalStartProperties = {}; // Stores the state at the very beginning
    this._originalEndProperties = {}; // Stores the initial target end state (potentially filtered)
    this.elapsedTime = 0;
    this.delayTime = 0;
    this.isPlaying = false;
    this.isPaused = false;
    this.isFinished = false;
    this.isStarted = false;
    this.direction = 1; // 1 for forward, -1 for backward (yoyo)
    this._needsInitialization = true; // Flag to capture/set start/end values for the current run
    this._hasBeenInitialized = false; // Flag to track if originals have ever been captured/set
  }

  /** Starts or resumes the tween. */
  play() {
    if (this.isFinished && !this.loop) return this; // Don't restart completed non-looping tweens

    if (this.isFinished && this.loop) {
        this.reset(); // Reset time, direction, flags etc.
        this.isFinished = false; // Explicitly clear finished state for loop restart
    }

    this.isPlaying = true;
    this.isPaused = false;
    return this;
  }

  /** Pauses the tween. */
  pause() {
    if (!this.isFinished) {
      this.isPlaying = false;
      this.isPaused = true;
    }
    return this;
  }

  /** Stops the tween and resets its state. */
  stop() {
    if (!this.isFinished) {
       this.isFinished = true; // Mark as finished to prevent further updates
       if (this.onStop) {
         this.onStop(this.target);
       }
    }
    this.isPlaying = false;
    this.isPaused = false;
    this.isStarted = false;
    this.reset(); // Reset time and direction
    return this;
  }

   /** Resets the tween to its initial state (before delay). */
   reset() {
    this.elapsedTime = 0;
    this.delayTime = 0;
    this.direction = 1;
    // this.isFinished = false; // Don't reset finished flag here, stop() or play() manage it
    this.isStarted = false;
    this._needsInitialization = true; // Need to recapture/reset start/end values if restarted
    return this;
   }

  /**
   * Updates the tween's state based on elapsed time.
   * Called by the TweenManager.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   * @returns {boolean} True if the tween is still active, false if completed or stopped.
   */
  update(deltaTime) {
    if (!this.isPlaying || this.isFinished) {
      return !this.isFinished;
    }

    // Handle delay
    if (this.delayTime < this.delay) {
      this.delayTime += deltaTime;
      if (this.delayTime < this.delay) {
        return true; // Still delaying
      }
      // Delay finished, adjust deltaTime for this frame and clamp delayTime
      deltaTime = this.delayTime - this.delay;
      this.delayTime = this.delay; // Clamp delayTime
    }

    // Initialize on first update after delay
    if (this._needsInitialization) {
      this._initialize();
    }

    // Fire onStart callback
    if (!this.isStarted) {
        this.isStarted = true;
        if (this.onStart) {
            this.onStart(this.target);
        }
    }

    this.elapsedTime += deltaTime * this.direction;

    // Clamp elapsed time and determine progress
    let progress = 0;
    let completedCycle = false;

    if (this.direction === 1) { // Forward
      if (this.elapsedTime >= this.duration) {
        this.elapsedTime = this.duration;
        completedCycle = true;
      }
    } else { // Backward (yoyo)
      if (this.elapsedTime <= 0) {
        this.elapsedTime = 0;
        completedCycle = true;
      }
    }

    // Adjust progress calculation for yoyo direction
    // Avoid division by zero if duration is somehow 0
    const currentDuration = this.duration || 1;
    progress = (this.direction === 1)
        ? (this.elapsedTime / currentDuration)
        : 1.0 - (this.elapsedTime / currentDuration);
    // Clamp progress just in case of float issues
    progress = Math.max(0, Math.min(1, progress));

    const easedProgress = this.easing(progress);

    // Apply tweened values
    for (const key of this.propertyKeys) {
      const startVal = this.startProperties[key];
      const endVal = this.endProperties[key];
      if (typeof startVal === 'number' && typeof endVal === 'number') {
        this.target[key] = startVal + (endVal - startVal) * easedProgress;
      }
      // TODO: Add support for tweening other types (e.g., colors, vectors) if needed
    }

    // Fire onUpdate callback
    if (this.onUpdate) {
      this.onUpdate(this.target, progress, easedProgress);
    }

    // Handle completion of a cycle
    if (completedCycle) {
      if (this.onComplete) {
        this.onComplete(this.target);
      }

      if (this.loop) {
        if (this.yoyo) {
          this.direction *= -1; // Reverse direction
          // Swap start/end using stored originals
          if (this.direction === -1) {
              // Going backward: start from original end, go to original start
              this.startProperties = { ...this._originalEndProperties };
              this.endProperties = { ...this._originalStartProperties };
          } else {
              // Going forward again: restore original start/end
              this.startProperties = { ...this._originalStartProperties };
              this.endProperties = { ...this._originalEndProperties };
          }
           // Update propertyKeys based on the current endProperties (important if filtered)
           this.propertyKeys = Object.keys(this.endProperties);
           // Reset elapsed time based on direction for yoyo restart
           this.elapsedTime = (this.direction === 1) ? 0 : this.duration;

        } else {
          // Reset time for simple loop
          this.elapsedTime = 0;
           // Re-initialize to reset startProperties to original values for next loop
           this._initialize(true); // Use force=true to reset startProperties
        }
      } else {
        // Not looping, finish the tween
        this.isFinished = true;
        this.isPlaying = false;
      }
    }

    return !this.isFinished;
  }

  /**
   * Initializes the tween by capturing/setting start and end properties.
   * @param {boolean} [forceReset=false] - If true, resets start/end to original values (used for loops).
   * @private
   */
  _initialize(forceReset = false) { // forceReset is essentially unused now, logic relies on _hasBeenInitialized
     // Initialize only if needed for the current run cycle
     if (this._needsInitialization) {

        // --- Determine and store Original Start/End Values (only on first ever init) ---
        if (!this._hasBeenInitialized) {
            if (this.explicitStartProperties) {
                this._originalStartProperties = { ...this.explicitStartProperties };
                // Filter original end properties based on explicit start
                const filteredEnd = {};
                for (const key of Object.keys(this._originalStartProperties)) {
                    if (this._targetEndProperties.hasOwnProperty(key)) { // Check against originally passed end props
                        filteredEnd[key] = this._targetEndProperties[key];
                    } else {
                        console.warn(`Tween target property "${key}" defined in startProperties but not in endProperties.`);
                    }
                }
                 this._originalEndProperties = filteredEnd; // Update stored original end
            } else {
                // Capture from target only on the very first run
                this._originalStartProperties = this._captureCurrentProperties(Object.keys(this._targetEndProperties));
                // Use the originally passed end properties as the original end
                this._originalEndProperties = { ...this._targetEndProperties };
            }
            this._hasBeenInitialized = true; // Mark that originals are now set
        }

        // --- Set Current Start/End for this run/cycle ---
        // Reset start/end properties to the stored originals
        this.startProperties = { ...this._originalStartProperties };
        this.endProperties = { ...this._originalEndProperties };
        this.propertyKeys = Object.keys(this.endProperties); // Update keys based on potentially filtered endProps

        this._needsInitialization = false; // Mark as initialized for this run
     }
  }

  /**
   * Captures the current values of the target properties based on a list of keys.
   * Used only during the initial capture when no explicit start is given.
   * @param {string[]} keys - The property keys to capture.
   * @returns {object} The captured properties.
   * @private
   */
  _captureCurrentProperties(keys) {
      const startProps = {};
      for (const key of keys) {
          if (this.target.hasOwnProperty(key)) {
              startProps[key] = this.target[key];
          } else {
              console.warn(`Tween target object does not have property "${key}". Defaulting start value.`);
              // Provide a default or handle error appropriately
              // Defaulting to the end value might cause no tweening for that property. Defaulting to 0 might be better?
              startProps[key] = this._targetEndProperties[key] ?? 0;
          }
      }
      return startProps;
  }
}
