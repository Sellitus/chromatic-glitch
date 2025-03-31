/**
 * Handles rendering of debug information on screen
 */
export default class DebugRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - Canvas to render debug info on
   * @param {PerformanceMonitor} performanceMonitor - Performance monitoring instance
   */
  constructor(canvas, performanceMonitor) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    this.performanceMonitor = performanceMonitor;
    this.enabled = false;
    this.showPerformance = true;
    this.showColliders = false;
    
    // Debug info styling
    this.textColor = 'lime';
    this.font = '14px monospace';
    this.lineHeight = 16;
    this.padding = 10;
  }

  /**
   * Enable/disable debug rendering
   * @param {boolean} enabled - Whether debug rendering should be enabled
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Toggle performance metrics display
   * @param {boolean} show - Whether to show performance metrics
   */
  showPerformanceMetrics(show) {
    this.showPerformance = show;
  }

  /**
   * Toggle collider visualization
   * @param {boolean} show - Whether to show colliders
   */
  showColliderBoxes(show) {
    this.showColliders = show;
  }

  /**
   * Render debug information
   * @param {string} sceneName - Name of current scene
   * @param {Object[]} [debugObjects] - Array of objects with debug info to display
   */
  render(sceneName, debugObjects = []) {
    if (!this.enabled) {
      return;
    }

    this.context.save();

    // Set up text rendering
    this.context.fillStyle = this.textColor;
    this.context.font = this.font;

    let y = this.padding + this.lineHeight;

    // Scene name
    this.renderText(`Scene: ${sceneName}`, this.padding, y);
    y += this.lineHeight;

    // Performance metrics
    if (this.showPerformance) {
      const metrics = this.performanceMonitor.getMetrics();
      this.renderText(`FPS: ${metrics.fps}`, this.padding, y);
      y += this.lineHeight;
      
      this.renderText(
        `Update: ${metrics.updateTime.toFixed(2)}ms`,
        this.padding,
        y
      );
      y += this.lineHeight;
      
      this.renderText(
        `Render: ${metrics.renderTime.toFixed(2)}ms`,
        this.padding,
        y
      );
      y += this.lineHeight;
    }

    // Custom debug objects
    debugObjects.forEach(obj => {
      if (obj.text) {
        this.renderText(obj.text, this.padding, y);
        y += this.lineHeight;
      }

      if (this.showColliders && obj.collider) {
        this.renderCollider(obj.collider);
      }
    });

    this.context.restore();
  }

  /**
   * Render text with outline for better visibility
   * @private
   * @param {string} text - Text to render
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  renderText(text, x, y) {
    // Black outline for better visibility
    this.context.strokeStyle = 'black';
    this.context.lineWidth = 3;
    this.context.strokeText(text, x, y);
    
    // Text
    this.context.fillStyle = this.textColor;
    this.context.fillText(text, x, y);
  }

  /**
   * Render a collider box
   * @private
   * @param {Object} collider - Collider object with x, y, width, height
   */
  renderCollider({ x, y, width, height }) {
    this.context.strokeStyle = 'red';
    this.context.lineWidth = 2;
    this.context.strokeRect(x, y, width, height);
  }

  /**
   * Add custom debug text at a specific position
   * @param {string} text - Text to display
   * @param {number} x - X position
   * @param {number} y - Y position
   */
  addCustomText(text, x, y) {
    if (!this.enabled) {
      return;
    }
    this.renderText(text, x, y);
  }

  /**
   * Clear all debug rendering
   */
  clear() {
    if (!this.enabled) {
      return;
    }
    // No need to clear as the main game renderer should clear the canvas
  }
}
