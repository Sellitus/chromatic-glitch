/**
 * Manages the main game loop with fixed timestep for logic and variable timestep for rendering
 */
export default class GameLoop {
  constructor() {
    this.accumulator = 0;
    this.lastTime = 0;
    this.frameId = null;
    this.isRunning = false;
    this.isPaused = false;

    // Fixed timestep for logic updates (60 FPS)
    this.fixedDeltaTime = 1000 / 60;
    
    // Bind methods to preserve this context
    this.tick = this.tick.bind(this);
    
    // Callback functions
    this.updateFn = () => {};
    this.renderFn = () => {};
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) {
      console.warn('GameLoop is already running');
      return;
    }

    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.frameId = requestAnimationFrame(this.tick);
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
  }

  /**
   * Pause the game loop
   */
  pause() {
    this.isPaused = true;
  }

  /**
   * Resume the game loop
   */
  resume() {
    this.isPaused = false;
    this.lastTime = performance.now();
    this.accumulator = 0;
  }

  /**
   * Set the update function
   * @param {Function} fn - Function to call for logic updates
   */
  setUpdateFunction(fn) {
    this.updateFn = fn;
  }

  /**
   * Set the render function
   * @param {Function} fn - Function to call for rendering
   */
  setRenderFunction(fn) {
    this.renderFn = fn;
  }

  /**
   * Main loop tick
   * @param {number} currentTime - Current timestamp
   */
  tick(currentTime) {
    if (!this.isRunning) {
      return;
    }

    this.frameId = requestAnimationFrame(this.tick);

    if (this.isPaused) {
      this.lastTime = currentTime;
      return;
    }

    // Calculate time elapsed since last frame
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Add to the accumulator
    this.accumulator += deltaTime;

    // Update game logic in fixed time steps
    while (this.accumulator >= this.fixedDeltaTime) {
      this.updateFn(this.fixedDeltaTime);
      this.accumulator -= this.fixedDeltaTime;
    }

    // Calculate interpolation factor for smooth rendering
    const interpolationFactor = this.accumulator / this.fixedDeltaTime;

    // Render with interpolation
    this.renderFn(interpolationFactor);
  }

  /**
   * Get the fixed update rate in milliseconds
   * @returns {number} Fixed delta time in milliseconds
   */
  getFixedDeltaTime() {
    return this.fixedDeltaTime;
  }

  /**
   * Check if the game loop is currently running
   * @returns {boolean} True if the game loop is running
   */
  isActive() {
    return this.isRunning && !this.isPaused;
  }
}
