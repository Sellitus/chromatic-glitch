import GameLoop from './engine/gameLoop.js';
import SceneManager from './engine/sceneManager.js';
import InputHandler from './engine/inputHandler.js';
import PerformanceMonitor from './engine/performanceMonitor.js';
import DebugRenderer from './engine/debugRenderer.js';
import { AssetManager } from './engine/assetManager.js';
import TestScene from './scenes/testScene.js';

class Game {
  constructor() {
    // Initialize DOM elements
    this.initializeDOMElements();

    // Initialize asset manager
    this.assetManager = new AssetManager();
    this.assetManager.init();

    // Initialize engine components
    this.initializeEngineComponents();
  }

  initializeDOMElements() {
    // Create and configure canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    document.body.appendChild(this.canvas);
  }

  initializeEngineComponents() {
    this.performanceMonitor = new PerformanceMonitor();
    this.debugRenderer = new DebugRenderer(this.canvas, this.performanceMonitor);
    this.inputHandler = new InputHandler();
    this.sceneManager = new SceneManager(this.assetManager);
    this.gameLoop = new GameLoop();

    // Enable debug rendering by default
    this.debugRenderer.setEnabled(true);

    // Initialize input handling
    this.inputHandler.init(this.canvas);

    // Set up game loop callbacks
    this.gameLoop.setUpdateFunction(this.update.bind(this));
    this.gameLoop.setRenderFunction(this.render.bind(this));

    // Set up keyboard shortcuts for debug features
    window.addEventListener('keydown', (event) => {
      switch (event.code) {
        case 'KeyD':
          // Toggle debug rendering
          this.debugRenderer.setEnabled(!this.debugEnabled);
          break;
        case 'KeyP':
          // Toggle performance metrics
          this.debugRenderer.showPerformanceMetrics(!this.showPerformance);
          break;
        case 'KeyC':
          // Toggle collider visualization
          this.debugRenderer.showColliderBoxes(!this.showColliders);
          break;
      }
    });

    // Create and add test scene
    const testScene = new TestScene(this.canvas, this.assetManager);
    this.sceneManager.addScene(testScene);
  }

  /**
   * Start the game
   */
  async start() {
    try {
      console.log('Starting game, attempting to load assets...');
      const manifestPath = 'assets/manifest.json';
      console.log('Loading manifest from:', manifestPath);
      await this.assetManager.preloadAssets(manifestPath);

      // Switch to test scene
      await this.sceneManager.switchToScene('TestScene');
      
      // Start the game loop
      this.gameLoop.start();
    } catch (error) {
      console.error('Failed to start game:', error);
    }
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Start performance monitoring for update
    this.performanceMonitor.markUpdateStart();

    // Update current scene
    this.sceneManager.update(deltaTime);

    // End performance monitoring for update
    this.performanceMonitor.markUpdateEnd();
    this.performanceMonitor.updateMetrics();
  }

  /**
   * Render the game
   * @param {number} interpolationFactor - Smoothing factor for rendering
   */
  render(interpolationFactor) {
    // Start performance monitoring for render
    this.performanceMonitor.markRenderStart();

    // Render current scene
    this.sceneManager.render(interpolationFactor);

    // Render debug information
    const activeScene = this.sceneManager.getActiveScene();
    if (activeScene) {
      this.debugRenderer.render(activeScene.name, [
        {
          text: this.gameLoop.isActive() ? 'Running' : 'Paused',
        }
      ]);
    }

    // End performance monitoring for render
    this.performanceMonitor.markRenderEnd();
  }
}

// Start the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start().catch(console.error);
});
