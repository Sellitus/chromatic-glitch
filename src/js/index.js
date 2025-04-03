import { PixiAppManager } from './engine/pixiApp.js';
import PerformanceMonitor from './engine/performanceMonitor.js';
import DebugRenderer from './engine/debugRenderer.js';
import InputHandler from './engine/inputHandler.js';
import GameLoop from './engine/gameLoop.js';
import { AudioEngine } from './engine/AudioEngine.js';
import { AudioManager } from './engine/audioManager.js';
import { AssetManager } from './engine/assetManager.js';
import SceneManager from './engine/sceneManager.js';
import { CardGameScene } from './scenes/CardGameScene.js'; // Import the scene

/**
 * Main game class that coordinates all systems
 */
export class Game {
    constructor() {
        this.pixiApp = null;
        this.performanceMonitor = null;
        this.debugRenderer = null;
        this.inputHandler = null;
        this.gameLoop = null;
        this.audioEngine = null;
        this.audioManager = null;
        this.assetManager = null;
        this.sceneManager = null;
    }

    /**
     * Initialize and start the game
     */
    async start() {
        this.log('Game start() method called.');

        try {
            await this.initializeEngineCore();
            await this.initializeGameSystems();
            await this.startGameLoop();
        } catch (error) {
            this.error('Error during game start sequence:', error);
            throw error;
        }
    }

    /**
     * Initialize core engine components
     */
    async initializeEngineCore() {
        // Initialize audio first since it needs user interaction
        this.log('Initializing AudioEngine... Click or press a key if needed.');
        this.audioEngine = new AudioEngine();
        await this.audioEngine.init();

        // Initialize PIXI application
        this.pixiApp = new PixiAppManager();
        await this.pixiApp.init();
        this.pixiApp.initialize(document.body);

        // Initialize core components
        this.performanceMonitor = new PerformanceMonitor();
        this.debugRenderer = new DebugRenderer(this.pixiApp.getApp().canvas, this.performanceMonitor);
        this.inputHandler = new InputHandler();
        this.gameLoop = new GameLoop();

        // Initialize managers in correct order with dependencies
        this.audioManager = new AudioManager(this.audioEngine);
        this.assetManager = new AssetManager(this.audioManager);
        this.sceneManager = new SceneManager(this.assetManager); // Pass assetManager instead of pixiApp

        window.__SCENE_MANAGER__ = this.sceneManager; // Expose for testing/debugging

        this.log('Managers initialized.');
    }

    /**
     * Initialize game-specific systems
     */
    async initializeGameSystems() {
        // Preload assets
        this.log('Starting asset preload...');
        this.log('Loading manifest from: assets/manifest.json');
        const result = await this.assetManager.preloadAssets('assets/manifest.json');
        this.log('Asset preload finished. Success:', result.success);

        // Check for any asset loading errors
        const status = this.assetManager.getLoadingStatus();
        if (status.errors.length > 0) {
            this.error('Asset loading errors:', status.errors);
            throw new Error('Failed to load required assets');
        }

        // Register and load the initial scene
        const cardGameScene = new CardGameScene(this.pixiApp); // Pass pixiApp here
        this.sceneManager.addScene(cardGameScene);
        await this.sceneManager.switchToScene('cardGame'); // Use the correct scene name 'cardGame'
    }

    /**
     * Start the game loop
     */
    async startGameLoop() {
        // Initialize input handler with canvas
        this.inputHandler.init(this.pixiApp.getApp().canvas);

        // Start game loop
        // Pass interpolationFactor to render
        this.gameLoop.setUpdateFunction(deltaTime => this.update(deltaTime));
        this.gameLoop.setRenderFunction(interpolationFactor => this.render(interpolationFactor));
        // Start the loop
        this.gameLoop.start();
    }

    /**
     * Update game state
     * @param {number} deltaTime Time since last update in milliseconds
     */
    update(deltaTime) {
        this.performanceMonitor.markUpdateStart();
        
        // Input state is updated via event listeners, no explicit update call needed here.
        // Update the active scene
        this.sceneManager.update(deltaTime);

        this.performanceMonitor.markUpdateEnd();
    }

    /**
     * Render the game
     */
    render(interpolationFactor) {
        this.performanceMonitor.markRenderStart();
        
        // Render the active scene
        // PIXI.Application ticker handles rendering the stage automatically. No need to call sceneManager.render here.

        // Render debug info on top
        this.debugRenderer.render(this.sceneManager.getActiveScene()?.name || 'No Scene');
        this.performanceMonitor.markRenderEnd();
    }

    /**
     * Clean up and shut down the game
     */
    destroy() {
        if (this.gameLoop) {
            this.gameLoop.stop();
            this.gameLoop.destroy();
        }
        if (this.inputHandler) {
            this.inputHandler.destroy();
        }
        if (this.performanceMonitor) {
            this.performanceMonitor.destroy();
        }
        if (this.debugRenderer) {
            this.debugRenderer.destroy();
        }
        if (this.audioManager) {
            this.audioManager.destroy();
        }
        if (this.audioEngine) {
            this.audioEngine.destroy();
        }
        if (this.assetManager) {
            this.assetManager.destroy();
        }
        if (this.sceneManager) {
            this.sceneManager.destroy();
        }
        if (this.pixiApp) {
            this.pixiApp.destroy();
        }
    }

    /**
     * Log a message to console
     * @param  {...any} args Arguments to log
     */
    log(...args) {
        console.log(...args);
    }

    /**
     * Log an error to console
     * @param  {...any} args Arguments to log
     */
    error(...args) {
        console.error(...args);
    }
}


// Instantiate and start the game
const game = new Game();
game.start().catch(error => {
    console.error("Failed to start the game:", error);
    // Optionally display an error message to the user on the page
});
