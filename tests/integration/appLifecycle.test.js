import { Game } from '../../src/js/index.js';

// Create mock instances that will be used in the mocks
let mockCanvas;
let mockCtx;
let mockApp;

// Create mock constructor functions
function MockPerformanceMonitor() {
    return {
        init: jest.fn(),
        destroy: jest.fn(),
        begin: jest.fn(),
        end: jest.fn()
    };
}

function MockDebugRenderer(canvas, monitor) {
    return {
        init: jest.fn(),
        destroy: jest.fn(),
        update: jest.fn(),
        draw: jest.fn(),
        canvas: canvas,
        enabled: false
    };
}

// Mock fetch for asset loading
global.fetch = jest.fn((url) => {
    if (url === 'assets/manifest.json') {
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                success: true,
                images: [],
                audio: [],
                data: [],
                manifest: {
                    images: [],
                    audio: [],
                    data: []
                }
            })
        });
    }
    return Promise.reject(new Error(`Unmocked fetch: ${url}`));
});

// Mock PIXI.js modules
jest.mock('pixi.js', () => ({
    Application: jest.fn().mockImplementation(() => mockApp),
    Container: jest.fn().mockImplementation(() => ({
        addChild: jest.fn(),
        removeChildren: jest.fn(),
        filters: [],
        width: 800,
        height: 600
    })),
    AlphaFilter: jest.fn().mockImplementation(() => ({
        enabled: true,
        alpha: 1
    }))
}));

// Mock modules
jest.mock('../../src/js/engine/debugRenderer.js', () => ({
    __esModule: true,
    default: MockDebugRenderer
}));

jest.mock('../../src/js/engine/performanceMonitor.js', () => ({
    __esModule: true,
    default: MockPerformanceMonitor
}));

jest.mock('../../src/js/engine/AudioEngine.js', () => ({
    AudioEngine: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        resume: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn()
    }))
}));

jest.mock('../../src/js/engine/audioManager.js', () => ({
    AudioManager: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
        resume: jest.fn()
    }))
}));

jest.mock('../../src/js/engine/assetManager.js', () => ({
    AssetManager: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
        preloadAssets: jest.fn().mockResolvedValue({ success: true }),
        getLoadingStatus: jest.fn().mockReturnValue({ errors: [] })
    }))
}));

jest.mock('../../src/js/engine/sceneManager.js', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        init: jest.fn().mockResolvedValue(undefined),
        destroy: jest.fn(),
        addScene: jest.fn(),
        switchToScene: jest.fn().mockResolvedValue(undefined)
    }))
}));

jest.mock('../../src/js/engine/inputHandler.js', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        init: jest.fn(),
        destroy: jest.fn(),
        update: jest.fn()
    }))
}));

jest.mock('../../src/js/engine/gameLoop.js', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
        init: jest.fn(), // Mock init method
        destroy: jest.fn(), // Mock destroy method
        start: jest.fn(), // Mock start method
        stop: jest.fn(), // Mock stop method
        setUpdateFunction: jest.fn(), // Add mock for setUpdateFunction
        setRenderFunction: jest.fn() // Add mock for setRenderFunction
    }))
}));

jest.setTimeout(20000); // Allow 20s for the test to complete

describe('Application Lifecycle', () => {
    let errors = [];
    let originalConsoleError;

    beforeAll(() => {
        // Mock window properties
        global.innerWidth = 800;
        global.innerHeight = 600;
        
        // Mock performance.now
        global.performance = {
            now: jest.fn().mockReturnValue(0)
        };

        // Create mock canvas and context
        mockCtx = {
            fillStyle: '',
            fillRect: jest.fn(),
            clearRect: jest.fn(),
            fillText: jest.fn(),
            measureText: jest.fn().mockReturnValue({ width: 50 })
        };

        // Create mock canvas with proper DOM methods
        mockCanvas = document.createElement('canvas');
        mockCanvas.width = 800;
        mockCanvas.height = 600;
        mockCanvas.getContext = () => mockCtx;

        // Create mock PIXI application
        mockApp = {
            stage: {
                filters: [],
                addChild: jest.fn(),
                emit: jest.fn()
            },
            renderer: {
                resize: jest.fn(),
                view: mockCanvas
            },
            ticker: {
                add: jest.fn(),
                destroy: jest.fn()
            },
            canvas: mockCanvas,
            init: jest.fn().mockResolvedValue(undefined),
            destroy: jest.fn(),
            getApp: () => mockApp
        };

        // Setup error tracking
        originalConsoleError = console.error;
        console.error = (...args) => {
            errors.push(args.join(' '));
            originalConsoleError.apply(console, [...args]);
        };
    });

    afterAll(() => {
        console.error = originalConsoleError;
        jest.resetModules();
    });

    beforeEach(() => {
        errors = [];
        // Reset document body
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    it('should start and stop without errors', async () => {
        // Create and start game
        const game = new Game();
        const startPromise = game.start();

        // Wait for startup and runtime
        await Promise.all([
            startPromise,
            new Promise(resolve => setTimeout(resolve, 1000))
        ]);

        // Clean up
        game.destroy();

        // Check for errors
        if (errors.length > 0) {
            console.log('Errors during app lifecycle:');
            errors.forEach(error => console.log(` - ${error}`));
            throw new Error('Application encountered errors during lifecycle');
        }

        // Verify PIXI app was properly initialized and destroyed
        const { Application } = require('pixi.js');
        expect(Application).toHaveBeenCalled();
        expect(mockApp.init).toHaveBeenCalled();
        expect(mockApp.destroy).toHaveBeenCalled();
    });
});
