/**
 * A simple procedural animator that oscillates a target property using a sine wave.
 */
export default class OscillatorAnimator {
  /**
   * Creates an OscillatorAnimator instance.
   * @param {object} target - The object whose property will be oscillated.
   * @param {string} property - The name of the property to oscillate (e.g., 'y', 'scale.x'). Supports dot notation for nested properties.
   * @param {object} [options={}] - Configuration options.
   * @param {number} [options.baseValue=null] - The base value around which to oscillate. If null, uses the target's current value at start.
   * @param {number} [options.amplitude=1] - The maximum displacement from the base value.
   * @param {number} [options.period=1] - The time in seconds for one full oscillation cycle.
   * @param {number} [options.phase=0] - The starting phase offset of the sine wave (0 to 1).
   * @param {boolean} [options.additive=true] - If true, adds the oscillation to the base value. If false, sets the property directly.
   * @param {boolean} [options.autoStart=true] - Whether the oscillator should start automatically.
   */
  constructor(target, property, options = {}) {
    if (!target || !property) {
      throw new Error('OscillatorAnimator requires a target object and property name.');
    }

    this.target = target;
    this.property = property;
    this.propertyPath = property.split('.'); // Handle nested properties

    this.amplitude = options.amplitude ?? 1;
    this.period = Math.max(0.001, options.period ?? 1); // Avoid division by zero
    this.phase = options.phase ?? 0; // Normalized phase (0 to 1)
    this.additive = options.additive ?? true;
    this.explicitBaseValue = options.baseValue; // Can be null

    this.baseValue = 0; // Will be set on start if explicitBaseValue is null
    this.elapsedTime = 0;
    this.isPlaying = false;
    this.isFinished = false; // Procedural animators often don't "finish" unless stopped

    this._needsInitialization = true;

    if (options.autoStart !== false) {
      this.play();
    }
  }

  /** Starts or resumes the oscillator. */
  play() {
    // Initialization now happens at the start of update()
    this.isPlaying = true;
  }

  /** Pauses the oscillator. */
  pause() {
    this.isPlaying = false;
  }

  /** Stops the oscillator and potentially resets the property. */
  stop(resetToBase = false) {
    this.isPlaying = false;
    this.isFinished = true; // Mark as finished when stopped
    if (resetToBase) {
        this._setProperty(this.baseValue);
    }
    // Reset time? Optional, depends if restart should resume phase or start over.
    // this.elapsedTime = 0;
  }

   /** Resets the oscillator state. */
   reset() {
       this.elapsedTime = 0;
       this.isPlaying = false;
       this.isFinished = false;
       this._needsInitialization = true;
   }

  /** Initializes the base value if needed. @private */
  _initialize() {
      if (this.explicitBaseValue !== null && this.explicitBaseValue !== undefined) {
          this.baseValue = this.explicitBaseValue;
      } else {
          this.baseValue = this._getProperty() ?? 0; // Get current value or default to 0
      }
      this._needsInitialization = false;
  }

  /**
   * Updates the oscillator and applies the value to the target property.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    if (!this.isPlaying || this.isFinished) {
      return;
    }
     if (this._needsInitialization) { // Ensure initialized if autoStart was false
        this._initialize();
     }


    this.elapsedTime += deltaTime;

    // Calculate current phase in radians: 2 * PI * (time / period + initial phase)
    const currentPhaseRadians = (Math.PI * 2) * ((this.elapsedTime / this.period) + this.phase);
    const oscillation = Math.sin(currentPhaseRadians) * this.amplitude;

    const finalValue = this.additive ? this.baseValue + oscillation : oscillation;

    this._setProperty(finalValue);
  }

  /** Gets the current value of the target property. Handles nesting. @private */
  _getProperty() {
      let current = this.target;
      try {
          for (let i = 0; i < this.propertyPath.length - 1; i++) {
              current = current[this.propertyPath[i]];
          }
          return current[this.propertyPath[this.propertyPath.length - 1]];
      } catch (e) {
          console.error(`OscillatorAnimator: Could not get property "${this.property}" on target.`, e);
          return undefined; // Or throw error
      }
  }

  /** Sets the value of the target property. Handles nesting. @private */
  _setProperty(value) {
      let current = this.target;
       try {
           for (let i = 0; i < this.propertyPath.length - 1; i++) {
               current = current[this.propertyPath[i]];
           }
           current[this.propertyPath[this.propertyPath.length - 1]] = value;
       } catch (e) {
           console.error(`OscillatorAnimator: Could not set property "${this.property}" on target.`, e);
           // Stop the animator maybe?
           this.stop();
       }
  }
}
