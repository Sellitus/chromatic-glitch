import Component from "../Component.js";

/**
 * Component for managing time-based effects and callbacks
 */
export default class TimerComponent extends Component {
  constructor() {
    super();
    this.timers = new Map(); // Map<string, Timer>
  }

  /**
   * Timer object structure
   * @typedef {Object} Timer
   * @property {number} duration - Total duration in milliseconds
   * @property {number} elapsed - Time elapsed since start
   * @property {number} startTime - When the timer started
   * @property {boolean} isRunning - Whether the timer is currently running
   * @property {boolean} isLooping - Whether the timer should restart when complete
   * @property {Function} onComplete - Callback to run when timer completes
   * @property {Function} onTick - Optional callback to run each update
   */

  /**
   * Add a new timer
   * @param {string} id - Unique identifier for this timer
   * @param {Object} config - Timer configuration
   * @param {number} config.duration - Duration in milliseconds
   * @param {boolean} [config.loop=false] - Whether the timer should loop
   * @param {Function} [config.onComplete] - Callback when timer completes
   * @param {Function} [config.onTick] - Callback called each update
   * @returns {Timer} The created timer
   */
  addTimer(id, { duration, loop = false, onComplete = null, onTick = null }) {
    if (this.timers.has(id)) {
      throw new Error(`Timer with id ${id} already exists`);
    }

    const timer = {
      duration,
      elapsed: 0,
      startTime: performance.now(),
      isRunning: true,
      isLooping: loop,
      onComplete,
      onTick
    };

    this.timers.set(id, timer);
    return timer;
  }

  /**
   * Remove a timer
   * @param {string} id - Timer identifier
   */
  removeTimer(id) {
    this.timers.delete(id);
  }

  /**
   * Get a timer by ID
   * @param {string} id - Timer identifier
   * @returns {Timer|null} The timer or null if not found
   */
  getTimer(id) {
    return this.timers.get(id) || null;
  }

  /**
   * Start or resume a timer
   * @param {string} id - Timer identifier
   */
  startTimer(id) {
    const timer = this.timers.get(id);
    if (timer && !timer.isRunning) {
      timer.isRunning = true;
      timer.startTime = performance.now() - timer.elapsed;
    }
  }

  /**
   * Pause a timer
   * @param {string} id - Timer identifier
   */
  pauseTimer(id) {
    const timer = this.timers.get(id);
    if (timer && timer.isRunning) {
      timer.isRunning = false;
      timer.elapsed = performance.now() - timer.startTime;
    }
  }

  /**
   * Reset a timer
   * @param {string} id - Timer identifier
   * @param {boolean} [start=true] - Whether to start the timer after reset
   */
  resetTimer(id, start = true) {
    const timer = this.timers.get(id);
    if (timer) {
      timer.elapsed = 0;
      timer.startTime = performance.now();
      timer.isRunning = start;
    }
  }

  /**
   * Update method called each frame
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    const currentTime = performance.now();

    for (const [id, timer] of this.timers) {
      if (!timer.isRunning) continue;

      const elapsed = currentTime - timer.startTime;
      const progress = elapsed / timer.duration;

      // Call tick callback if exists
      if (timer.onTick) {
        timer.onTick(progress, elapsed);
      }

      // Check if timer is complete
      if (elapsed >= timer.duration) {
        if (timer.onComplete) {
          timer.onComplete();
        }

        if (timer.isLooping) {
          // Reset for next loop
          timer.startTime = currentTime;
        } else {
          // Remove completed non-looping timer
          this.timers.delete(id);
        }
      }
    }
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object
   */
  serialize() {
    const timerData = {};
    for (const [id, timer] of this.timers) {
      timerData[id] = {
        duration: timer.duration,
        elapsed: timer.elapsed,
        isRunning: timer.isRunning,
        isLooping: timer.isLooping
      };
    }

    return {
      ...super.serialize(),
      timers: timerData
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data to deserialize from
   */
  deserialize(data) {
    this.timers.clear();
    
    if (data.timers) {
      for (const [id, timerData] of Object.entries(data.timers)) {
        this.addTimer(id, {
          duration: timerData.duration,
          loop: timerData.isLooping
        });

        const timer = this.timers.get(id);
        timer.elapsed = timerData.elapsed;
        timer.isRunning = timerData.isRunning;
        if (timer.isRunning) {
          timer.startTime = performance.now() - timer.elapsed;
        }
      }
    }
  }
}
