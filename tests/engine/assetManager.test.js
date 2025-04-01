/**
 * Asset manager tests
 */
import { AssetManager } from '../../src/js/engine/assetManager';
import { AudioManager } from '../../src/js/engine/audioManager';

// Increase timeout for async tests
jest.setTimeout(30000);

// Helper to wait for all promises to resolve
const flushPromises = async () => {
  await Promise.resolve();
  return new Promise(resolve => process.nextTick(resolve));
};

// Mock AudioManager synchronously
jest.mock('../../src/js/engine/audioManager', () => {
  return {
    AudioManager: jest.fn().mockImplementation(() => ({
      init: jest.fn(),
      loadSound: jest.fn().mockReturnValue(Promise.resolve(true)),
      loadMusic: jest.fn().mockReturnValue(Promise.resolve(true))
    }))
  };
});

describe('AssetManager', () => {
  let assetManager;
  let mockLoadingScreen;
  let mockProgressFill;
  let mockProgressText;
  let mockFetch;
  let mockImage;
  let originalImage;
  let imageLoadHandlers;

  // Simplified manifest with minimal assets
  const mockManifest = {
    version: '1.1.0',
    assets: [
      { id: 'test-image', type: 'image', src: 'images/test.png' },
      { id: 'test-json', type: 'json', src: 'json/test.json' },
      { id: 'optional-image', type: 'image', src: 'images/optional.png', optional: true }
    ]
  };

  beforeEach(() => {    
    // Mock DOM elements
    mockLoadingScreen = document.createElement('div');
    mockProgressFill = document.createElement('div');
    mockProgressText = document.createElement('div');

    mockLoadingScreen.id = 'loading-screen';
    mockProgressFill.className = 'progress-fill';
    mockProgressText.className = 'progress-text';

    document.body.appendChild(mockLoadingScreen);
    document.body.appendChild(mockProgressFill);
    document.body.appendChild(mockProgressText);

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    // Track image load handlers
    imageLoadHandlers = [];

    // Save original Image constructor
    originalImage = global.Image;

    // Create a mock image instance to avoid recursion
    mockImage = {
      onload: null,
      onerror: null,
      src: ''
    };
    
    // Mock Image constructor to resolve immediately
    global.Image = jest.fn().mockImplementation(() => {
      const img = { ...mockImage };
      imageLoadHandlers.push(img);
      // Schedule onload to be called immediately
      Promise.resolve().then(() => img.onload && img.onload());
      return img;
    });

    // Mock fetch to resolve synchronously
    mockFetch = jest.fn().mockImplementation((url) => {
      const responseData = url.includes('manifest.json') ? mockManifest : { testData: 'test' };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(responseData),
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });
    });
    global.fetch = mockFetch;

    // Create mock AudioManager instance using the mocked constructor
    const mockAudioManagerInstance = new AudioManager();

    // Create AssetManager instance, passing the mock AudioManager
    assetManager = new AssetManager(mockAudioManagerInstance);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.clearAllMocks();
    global.Image = originalImage;
    imageLoadHandlers = [];
  });

  test('loads manifest file', async () => {
    const manifest = await assetManager.loadManifest('assets/manifest.json');
    expect(manifest).toEqual(mockManifest);
    expect(assetManager.version).toBe(mockManifest.version);
  });

  test('loads images successfully', async () => {
    const result = await assetManager.loadImage('test-image', 'images/test.png');
    expect(result).toBe(imageLoadHandlers[0]);
    expect(assetManager.images.has('test-image')).toBe(true);
  });

  test('handles image loading errors', async () => {
    // Override default success behavior for this test
    global.Image = jest.fn().mockImplementation(() => {
      const img = { ...mockImage };
      imageLoadHandlers.push(img);
      Promise.resolve().then(() => img.onerror(new Error('Failed to load')));
      return img;
    });

    try {
      await assetManager.loadImage('test-image', 'images/test.png');
      fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).toBe('Failed to load image: images/test.png');
      expect(assetManager.loadingErrors.has('test-image')).toBe(true);
      expect(assetManager.images.has('test-image')).toBe(false);
    }
  });

  test('loads JSON successfully', async () => {
    const data = await assetManager.loadJSON('test-json', 'json/test.json');
    expect(data).toEqual({ testData: 'test' });
    expect(assetManager.json.get('test-json')).toEqual({ testData: 'test' });
  });

  test('handles JSON loading errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    try {
      await assetManager.loadJSON('test-json', 'json/test.json');
      fail('Should have thrown an error');
    } catch (error) {
      expect(assetManager.loadingErrors.has('test-json')).toBe(true);
      expect(assetManager.json.has('test-json')).toBe(false);
    }
  });

  test('preloads assets from manifest', async () => {
    const result = await assetManager.preloadAssets('assets/manifest.json');
    expect(result.success).toBe(true);
    expect(result.totalAssets).toBe(2); // Excluding optional asset
    expect(result.assetsLoaded).toBe(2);
  });

  test('tracks optional assets correctly', async () => {
    // Load required assets first
    await assetManager.preloadAssets('assets/manifest.json');

    // Load optional asset
    const optionalImage = await assetManager.loadImage('optional-image', 'images/optional.png', true);
    expect(optionalImage).toBeTruthy();
    expect(assetManager.loadedAssets).toBe(2); // Optional assets don't count
  });

  describe('Asset Management', () => {
    test('handles asset unloading', () => {
      const mockImg = {};
      const mockJson = { testData: 'test' };

      assetManager.images.set('test-image', mockImg);
      assetManager.json.set('test-json', mockJson);

      expect(assetManager.unloadAsset('test-image')).toBe(true);
      expect(assetManager.images.has('test-image')).toBe(false);

      expect(assetManager.unloadAsset('test-json')).toBe(true);
      expect(assetManager.json.has('test-json')).toBe(false);

      expect(assetManager.unloadAsset('nonexistent')).toBe(false);
    });
  });

  describe('Asset Retrieval', () => {
    test('retrieves loaded assets', () => {
      const mockImg = {};
      const mockJson = { testData: 'test' };

      assetManager.images.set('test-image', mockImg);
      assetManager.json.set('test-json', mockJson);

      expect(assetManager.getImage('test-image')).toBe(mockImg);
      expect(assetManager.getJSON('test-json')).toEqual(mockJson);
    });

    test('handles requests for non-existent assets', () => {
      expect(assetManager.getImage('nonexistent')).toBeUndefined();
      expect(assetManager.getJSON('nonexistent')).toBeUndefined();
    });
  });

  describe('Loading Status', () => {
    test('provides accurate loading status', () => {
      assetManager.totalAssets = 4;
      assetManager.loadedAssets = 2;
      assetManager.loadingErrors.set('test-image', new Error('Failed to load'));

      const status = assetManager.getLoadingStatus();
      expect(status).toEqual({
        total: 4,
        loaded: 2,
        progress: 50,
        errors: [{
          id: 'test-image',
          error: 'Failed to load'
        }]
      });
    });
  });
});
