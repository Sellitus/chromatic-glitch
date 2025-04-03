import { Application, Container, AlphaFilter } from 'pixi.js';

/**
 * Manages the PixiJS application instance and core rendering setup
 */
export class PixiAppManager {
    constructor(options = {}) {
        this.options = options;
        this.app = null;
        this.layers = null;
    }

    async init() {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        
        // Create PIXI application
        const app = new Application();

        // Initialize with options that work in both test and production environments
        await app.init({
            width: this.options.width || window.innerWidth,
            height: this.options.height || window.innerHeight,
            backgroundColor: this.options.backgroundColor || 0x1a1a1a,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            canvas: canvas,
            forceCanvas: process.env.NODE_ENV === 'test', // Use canvas renderer in test environment
            preferWebGL: process.env.NODE_ENV !== 'test'  // Prefer WebGL in production
        });
        
        this.app = app;

        window.__PIXI_APP__ = this.app; // Expose for testing/debugging

        // Setup container hierarchy
        this.layers = {
            background: new Container(),
            game: new Container(),
            cards: new Container(),
            ui: new Container(),
            preview: new Container(),
            effects: new Container()
        };

        // Add layers to stage in order
        Object.values(this.layers).forEach(layer => {
            this.app.stage.addChild(layer);
        });

        // Handle resize
        window.addEventListener('resize', this._handleResize.bind(this));

        // Setup filters for effects
        this.app.stage.filters = [
            new AlphaFilter()
        ];
    }

    /**
     * Initialize the PixiJS application
     * @param {HTMLElement} container DOM element to attach the canvas to
     */
    initialize(container) {
        if (!this.app) {
            throw new Error('PixiAppManager must be initialized with init() before calling initialize()');
        }
        // Add canvas to DOM
        container.appendChild(this.app.canvas);
        
        // Initial resize
        this._handleResize();
        
        // Enable ticker
        this.app.ticker.add(this._update.bind(this));
    }

    /**
     * Get a reference to a specific layer
     * @param {string} layerName Name of the layer to get
     * @returns {Container} The requested layer
     */
    getLayer(layerName) {
        return this.layers[layerName];
    }

    /**
     * Add a display object to a specific layer
     * @param {PIXI.DisplayObject} object Object to add
     * @param {string} layerName Target layer name
     */
    addToLayer(object, layerName) {
        const layer = this.layers[layerName];
        if (layer) {
            layer.addChild(object);
        } else {
            console.warn(`Layer '${layerName}' not found`);
        }
    }

    /**
     * Clear all contents of a layer
     * @param {string} layerName Layer to clear
     */
    clearLayer(layerName) {
        const layer = this.layers[layerName];
        if (layer) {
            layer.removeChildren();
        }
    }

    /**
     * Handle window resize
     * @private
     */
    _handleResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Resize renderer
        this.app.renderer.resize(width, height);

        // Update layers
        Object.values(this.layers).forEach(layer => {
            layer.width = width;
            layer.height = height;
        });

        // Dispatch resize event for scenes
        this.app.stage.emit('resize', { width, height });
    }

    /**
     * Update loop
     * @private
     */
    _update(deltaTime) {
        // Convert to milliseconds for consistency with game loop
        const dt = deltaTime * (1000 / 60);
        
        // Update each layer
        Object.values(this.layers).forEach(layer => {
            if (layer.update) {
                layer.update(dt);
            }
        });
    }

    /**
     * Clean up PixiJS application
     */
    destroy() {
        window.removeEventListener('resize', this._handleResize);
        this.app.destroy(true, {
            children: true,
            texture: true,
            baseTexture: true
        });
    }

    /**
     * Get the PixiJS Application instance
     * @returns {PIXI.Application}
     */
    getApp() {
        return this.app;
    }
}
