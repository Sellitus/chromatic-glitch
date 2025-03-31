import Scene from '../engine/scene.js';

/**
 * Test scene to verify game loop and scene management functionality
 */
export default class TestScene extends Scene {
  constructor(canvas, assetManager) {
    super('TestScene', assetManager);
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    
    // Test object for animation
    this.testObject = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      size: 50,
      color: '#00ff00',
      speedX: 100, // pixels per second
      speedY: 80   // pixels per second
    };

    // Initial positions for interpolation
    this.previousX = this.testObject.x;
    this.previousY = this.testObject.y;

    // Asset data
    this.testData = null;
  }

  /**
   * Initialize the scene
   */
  init(assetManager) {
    super.init(assetManager);
    console.log('TestScene initialized');

    // Get the test data if it's already loaded
    if (this.assetManager) {
      this.testData = this.assetManager.getJSON('testData');
      if (this.testData) {
        console.log('Test data loaded:', this.testData);
      }
    }
  }

  /**
   * Update game logic with fixed timestep
   * @param {number} deltaTime - Time elapsed since last update in milliseconds
   */
  update(deltaTime) {
    if (this.isPaused) return;

    // Save previous position for interpolation
    this.previousX = this.testObject.x;
    this.previousY = this.testObject.y;

    // Update position
    const deltaSeconds = deltaTime / 1000;
    this.testObject.x += this.testObject.speedX * deltaSeconds;
    this.testObject.y += this.testObject.speedY * deltaSeconds;

    // Bounce off walls
    if (this.testObject.x < 0 || this.testObject.x > this.canvas.width - this.testObject.size) {
      this.testObject.speedX *= -1;
      this.testObject.x = Math.max(0, Math.min(this.canvas.width - this.testObject.size, this.testObject.x));
    }
    if (this.testObject.y < 0 || this.testObject.y > this.canvas.height - this.testObject.size) {
      this.testObject.speedY *= -1;
      this.testObject.y = Math.max(0, Math.min(this.canvas.height - this.testObject.size, this.testObject.y));
    }
  }

  /**
   * Render the scene with interpolation
   * @param {number} interpolationFactor - Factor for smoothing rendering between updates
   */
  render(interpolationFactor) {
    // Clear canvas
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Interpolate position
    const renderX = this.previousX + (this.testObject.x - this.previousX) * interpolationFactor;
    const renderY = this.previousY + (this.testObject.y - this.previousY) * interpolationFactor;

    // Draw test object
    this.context.fillStyle = this.testObject.color;
    this.context.fillRect(
      Math.round(renderX),
      Math.round(renderY),
      this.testObject.size,
      this.testObject.size
    );

    // Draw instructions
    this.context.fillStyle = 'white';
    this.context.font = '16px Arial';
    this.context.fillText('Press Space to toggle pause', 10, 30);

    // Draw loaded asset data if available
    if (this.testData) {
      this.context.fillStyle = 'yellow';
      this.context.font = '14px Arial';
      this.context.fillText(`Loaded Asset ID: ${this.testData.testData.id}`, 10, 60);
      this.context.fillText(`Name: ${this.testData.testData.name}`, 10, 80);
      this.context.fillText(`Description: ${this.testData.testData.description}`, 10, 100);
    } else {
      this.context.fillStyle = 'red';
      this.context.font = '14px Arial';
      this.context.fillText('No test data loaded', 10, 60);
    }
  }

  /**
   * Handle input events
   * @param {string} inputType - Type of input event
   * @param {Event} event - The input event
   */
  handleInput(inputType, event) {
    if (inputType === 'keydown' && event.code === 'Space') {
      if (this.isPaused) {
        this.resume();
      } else {
        this.pause();
      }
    }
  }

  /**
   * Clean up scene resources
   */
  destroy() {
    console.log('TestScene destroyed');
  }
}
