import GameLoop from './engine/gameLoop.js';
import SceneManager from './engine/sceneManager.js';
import InputHandler from './engine/inputHandler.js';
import PerformanceMonitor from './engine/performanceMonitor.js';
import DebugRenderer from './engine/debugRenderer.js';
import { AssetManager } from './engine/assetManager.js';
import { AudioEngine } from './engine/AudioEngine.js'; // Import AudioEngine
import { AudioManager } from './engine/audioManager.js'; // Import AudioManager
import TestScene from './scenes/testScene.js';

class Game {
  constructor() {
    // Create canvas first, as DebugRenderer needs it
    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    document.body.appendChild(this.canvas);

    // Initialize basic components that don't depend on DOM elements being fully ready
    // or other managers
    this.performanceMonitor = new PerformanceMonitor();
    // Initialize DebugRenderer *before* initializeDOMElements uses it
    this.debugRenderer = new DebugRenderer(this.canvas, this.performanceMonitor);
    this.inputHandler = new InputHandler();
    this.gameLoop = new GameLoop();

    // Initialize core engine components (input, loop callbacks, key listeners)
    // This was previously named initializeDOMElements, renaming for clarity
    this.initializeEngineCore();

    // Initialize Audio System (will be async)
    this.audioEngine = null;
    this.audioManager = null;

    // Asset Manager needs AudioManager, will be initialized after audio
    this.assetManager = null;

    // Scene Manager needs Asset Manager
    this.sceneManager = null;

    // Add properties for debug toggles
    this.debugEnabled = true;
    this.showPerformance = false; // Default to false
    this.showColliders = false; // Default to false
  }

  // Renamed from initializeDOMElements
  initializeEngineCore() {
    // Canvas is already created and appended in constructor
    // Enable debug rendering by default
    this.debugRenderer.setEnabled(this.debugEnabled); // Use the property

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
          this.showPerformance = !this.showPerformance; // Toggle property
          this.debugRenderer.showPerformanceMetrics(this.showPerformance); // Use property
          break;
        case 'KeyC':
          // Toggle collider visualization
          this.showColliders = !this.showColliders; // Toggle property
          this.debugRenderer.showColliderBoxes(this.showColliders); // Use property
          break;
      }
    });
  }

  /**
   * Asynchronously initialize audio and the asset manager.
   */
  async initializeAudioAndAssetManager() {
    // Initialize Audio Engine (requires user interaction)
    this.audioEngine = new AudioEngine();
    console.log('Initializing AudioEngine... Click or press a key if needed.');
    await this.audioEngine.init(); // This now resolves immediately
    // Attempt to resume, but don't await it here to avoid blocking loading.
    // Interaction listeners in AudioEngine.init will handle resuming later if needed.
    this.audioEngine.resume();

    // Initialize Audio Manager with the engine
    this.audioManager = new AudioManager(this.audioEngine);

    // Initialize Asset Manager with the audio manager
    this.assetManager = new AssetManager(this.audioManager);
    // SceneManager and scenes will be initialized in start() after assets are loaded
  }

  /**
   * Start the game
   */
  async start() {
    // Add a log right at the beginning of start
    console.log('Game start() method called.');
    try {
      // Initialize audio and asset manager (must happen before loading)
      await this.initializeAudioAndAssetManager();
      console.log('Audio and AssetManager initialized.');

      // Load assets
      console.log('Starting asset preload...');
      const manifestPath = 'assets/manifest.json';
      console.log('Loading manifest from:', manifestPath);
      const loadResult = await this.assetManager.preloadAssets(manifestPath);
      console.log('Asset preload finished. Success:', loadResult.success);
      if (!loadResult.success) {
         console.error('Asset loading failed:', this.assetManager.getLoadingStatus().errors);
         // Optionally stop here if loading fails critically
         // return;
      }

      // Initialize Scene Manager *after* AssetManager is ready
      this.sceneManager = new SceneManager(this.assetManager);
      console.log('SceneManager initialized.');

      // Create and add scenes *after* SceneManager is ready
      const testScene = new TestScene(this.canvas, this.assetManager);
      this.sceneManager.addScene(testScene);
      console.log('TestScene added.');

      // Switch to the initial scene
      await this.sceneManager.switchToScene('TestScene');
      console.log('Switched to TestScene.');

      // Start the game loop only after everything is set up
      this.gameLoop.start();
      console.log('Game loop started.');
    } catch (error) {
      console.error('Error during game start sequence:', error);
    }
  }

  /**
   * Update game logic
   * @param {number} deltaTime - Time elapsed since last update
   */
  update(deltaTime) {
    // Start performance monitoring for update
    this.performanceMonitor.markUpdateStart();

    // Update current scene (check if sceneManager is initialized)
    if (this.sceneManager) {
      this.sceneManager.update(deltaTime);
    }

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

    // Render current scene (check if sceneManager is initialized)
    if (this.sceneManager) {
      this.sceneManager.render(interpolationFactor);
    }

    // Render debug information
    const activeScene = this.sceneManager?.getActiveScene(); // Use optional chaining
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
