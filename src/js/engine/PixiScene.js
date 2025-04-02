import { Container } from 'pixi.js';

/**
 * Base class for PixiJS-based scenes
 */
export class PixiScene {
    /**
     * @param {string} name Unique scene identifier
     * @param {PixiAppManager} pixiApp Reference to the PixiJS app manager
     */
    constructor(name, pixiApp) {
        this.name = name;
        this.pixiApp = pixiApp;
        
        // Scene containers mapped to layers
        this.containers = {
            background: new Container(),
            game: new Container(),
            cards: new Container(),
            ui: new Container(),
            preview: new Container(),
            effects: new Container()
        };
        
        // Scene state
        this.isInitialized = false;
        this.isPaused = false;
        
        // Bind methods
        this._handleResize = this._handleResize.bind(this);
    }

    /**
     * Initialize the scene
     */
    init() {
        if (this.isInitialized) return;

        // Add containers to their respective layers
        Object.entries(this.containers).forEach(([layerName, container]) => {
            const layer = this.pixiApp.getLayer(layerName);
            if (layer) {
                layer.addChild(container);
            }
        });

        // Listen for resize events
        this.pixiApp.getApp().stage.on('resize', this._handleResize);

        this.isInitialized = true;
    }

    /**
     * Load scene assets
     * @returns {Promise} Resolves when assets are loaded
     */
    async loadAssets() {
        // Override in derived classes to load scene-specific assets
    }

    /**
     * Start/resume the scene
     */
    resume() {
        this.isPaused = false;
        // Make scene containers visible
        Object.values(this.containers).forEach(container => {
            container.visible = true;
        });
    }

    /**
     * Pause the scene
     */
    pause() {
        this.isPaused = true;
        // Hide scene containers
        Object.values(this.containers).forEach(container => {
            container.visible = false;
        });
    }

    /**
     * Update scene logic
     * @param {number} deltaTime Time elapsed since last update in milliseconds
     */
    update(deltaTime) {
        if (this.isPaused) return;

        // Update scene-specific logic in derived classes
    }

    /**
     * Handle window resize
     * @param {Object} dimensions New dimensions
     * @private
     */
    _handleResize({ width, height }) {
        // Override in derived classes to handle resize
    }

    /**
     * Clean up scene resources
     */
    destroy() {
        // Remove resize listener
        this.pixiApp.getApp().stage.off('resize', this._handleResize);

        // Remove containers from layers
        Object.entries(this.containers).forEach(([layerName, container]) => {
            const layer = this.pixiApp.getLayer(layerName);
            if (layer && container.parent === layer) {
                layer.removeChild(container);
            }
        });

        // Destroy containers and their children
        Object.values(this.containers).forEach(container => {
            container.destroy({ children: true });
        });

        this.isInitialized = false;
    }

    /**
     * Get a scene container by layer name
     * @param {string} layerName Name of the layer/container to get
     * @returns {Container} The requested container
     */
    getContainer(layerName) {
        return this.containers[layerName];
    }
}
