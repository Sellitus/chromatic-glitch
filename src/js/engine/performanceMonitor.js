/**
 * Monitors and tracks game performance metrics
 */
export default class PerformanceMonitor {
  constructor() {
    // Frame timing
    this.frameCount = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    this.fpsUpdateInterval = 1000; // Update FPS every second

    // Time measurements
    this.updateTimes = new Array(60).fill(0);
    this.renderTimes = new Array(60).fill(0);
    this.timeIndex = 0;

    // Performance marks
    this.markNames = {
      updateStart: 'gameUpdate-start',
      updateEnd: 'gameUpdate-end',
      renderStart: 'gameRender-start',
      renderEnd: 'gameRender-end'
    };
  }

  /**
   * Mark the start of an update cycle
   */
  markUpdateStart() {
    performance.mark(this.markNames.updateStart);
  }

  /**
   * Mark the end of an update cycle and measure duration
   */
  markUpdateEnd() {
    performance.mark(this.markNames.updateEnd);
    performance.measure('updateTime', 
      this.markNames.updateStart,
      this.markNames.updateEnd
    );

    const measurements = performance.getEntriesByName('updateTime');
    const lastMeasurement = measurements[measurements.length - 1];
    this.updateTimes[this.timeIndex] = lastMeasurement.duration;

    // Clean up measurements to prevent memory leaks
    performance.clearMarks(this.markNames.updateStart);
    performance.clearMarks(this.markNames.updateEnd);
    performance.clearMeasures('updateTime');
  }

  /**
   * Mark the start of a render cycle
   */
  markRenderStart() {
    performance.mark(this.markNames.renderStart);
  }

  /**
   * Mark the end of a render cycle and measure duration
   */
  markRenderEnd() {
    performance.mark(this.markNames.renderEnd);
    performance.measure('renderTime',
      this.markNames.renderStart,
      this.markNames.renderEnd
    );

    const measurements = performance.getEntriesByName('renderTime');
    const lastMeasurement = measurements[measurements.length - 1];
    this.renderTimes[this.timeIndex] = lastMeasurement.duration;

    // Clean up measurements to prevent memory leaks
    performance.clearMarks(this.markNames.renderStart);
    performance.clearMarks(this.markNames.renderEnd);
    performance.clearMeasures('renderTime');

    // Update time index
    this.timeIndex = (this.timeIndex + 1) % this.updateTimes.length;
  }

  /**
   * Update FPS counter
   */
  updateMetrics() {
    const now = performance.now();
    this.frameCount++;

    // Update FPS counter every second
    if (now - this.lastFpsUpdate >= this.fpsUpdateInterval) {
      this.currentFps = Math.round(
        (this.frameCount * 1000) / (now - this.lastFpsUpdate)
      );
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  /**
   * Get the current FPS
   * @returns {number} Current frames per second
   */
  getFPS() {
    return this.currentFps;
  }

  /**
   * Get average update time over the last 60 frames
   * @returns {number} Average update time in milliseconds
   */
  getAverageUpdateTime() {
    const sum = this.updateTimes.reduce((a, b) => a + b, 0);
    return sum / this.updateTimes.length;
  }

  /**
   * Get average render time over the last 60 frames
   * @returns {number} Average render time in milliseconds
   */
  getAverageRenderTime() {
    const sum = this.renderTimes.reduce((a, b) => a + b, 0);
    return sum / this.renderTimes.length;
  }

  /**
   * Get all current performance metrics
   * @returns {Object} Object containing all performance metrics
   */
  getMetrics() {
    return {
      fps: this.getFPS(),
      updateTime: this.getAverageUpdateTime(),
      renderTime: this.getAverageRenderTime()
    };
  }

  /**
   * Reset all performance metrics
   */
  reset() {
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();
    this.currentFps = 0;
    this.updateTimes.fill(0);
    this.renderTimes.fill(0);
    this.timeIndex = 0;
  }
}
