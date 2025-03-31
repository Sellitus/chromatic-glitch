/**
 * Scene manager tests
 */
import SceneManager from '../../src/js/engine/sceneManager';
import Scene from '../../src/js/engine/scene';

// Mock Scene implementation for testing
class MockScene extends Scene {
  constructor(name) {
    super(name);
    this.loadAssetsCalled = false;
    this.updateCalled = false;
    this.renderCalled = false;
    this.handleInputCalled = false;
  }

  async loadAssets() {
    this.loadAssetsCalled = true;
    return Promise.resolve();
  }

  update(deltaTime) {
    this.updateCalled = true;
    this.lastDeltaTime = deltaTime;
  }

  render(interpolationFactor) {
    this.renderCalled = true;
    this.lastInterpolationFactor = interpolationFactor;
  }

  handleInput(inputType, event) {
    this.handleInputCalled = true;
    this.lastInputType = inputType;
    this.lastEvent = event;
  }

  destroy() {
    this.destroyCalled = true;
  }
}

describe('SceneManager', () => {
  let sceneManager;
  let mockAssetManager;
  let testScene;
  let anotherScene;

  beforeEach(() => {
    // Create mock asset manager
    mockAssetManager = {
      loadAssets: jest.fn().mockResolvedValue(true),
      unloadAsset: jest.fn(),
    };

    // Create scene manager instance
    sceneManager = new SceneManager(mockAssetManager);

    // Create test scenes
    testScene = new MockScene('test');
    anotherScene = new MockScene('another');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Scene Registration', () => {
    test('adds scenes successfully', () => {
      sceneManager.addScene(testScene);
      expect(sceneManager.hasScene('test')).toBe(true);
    });

    test('prevents duplicate scene names', () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      sceneManager.addScene(testScene);
      sceneManager.addScene(new MockScene('test'));
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scene test is already registered')
      );
      expect(sceneManager.hasScene('test')).toBe(true);
    });
  });

  describe('Scene Switching', () => {
    beforeEach(() => {
      sceneManager.addScene(testScene);
      sceneManager.addScene(anotherScene);
    });

    test('switches between scenes', async () => {
      await sceneManager.switchToScene('test');
      expect(sceneManager.getActiveScene()).toBe(testScene);
      expect(testScene.isInitialized).toBe(true);
      expect(testScene.loadAssetsCalled).toBe(true);

      await sceneManager.switchToScene('another');
      expect(sceneManager.getActiveScene()).toBe(anotherScene);
      expect(testScene.destroyCalled).toBe(true);
    });

    test('handles invalid scene names', async () => {
      const consoleSpy = jest.spyOn(console, 'error');
      await sceneManager.switchToScene('nonexistent');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scene nonexistent not found')
      );
      expect(sceneManager.getActiveScene()).toBeNull();
    });

    test('prevents concurrent transitions', async () => {
      const consoleSpy = jest.spyOn(console, 'warn');
      const firstSwitch = sceneManager.switchToScene('test');
      sceneManager.switchToScene('another');
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scene transition already in progress')
      );
      await firstSwitch;
    });

    test('manages scene lifecycle correctly', async () => {
      await sceneManager.switchToScene('test');
      expect(testScene.isInitialized).toBe(true);
      expect(testScene.isPaused).toBe(false);

      await sceneManager.switchToScene('another');
      expect(testScene.isPaused).toBe(true);
      expect(testScene.destroyCalled).toBe(true);
      expect(anotherScene.isInitialized).toBe(true);
      expect(anotherScene.isPaused).toBe(false);
    });
  });

  describe('Scene Updates and Rendering', () => {
    beforeEach(async () => {
      sceneManager.addScene(testScene);
      await sceneManager.switchToScene('test');
    });

    test('updates active scene', () => {
      const deltaTime = 16.67;
      sceneManager.update(deltaTime);
      expect(testScene.updateCalled).toBe(true);
      expect(testScene.lastDeltaTime).toBe(deltaTime);
    });

    test('renders active scene', () => {
      const interpolationFactor = 0.5;
      sceneManager.render(interpolationFactor);
      expect(testScene.renderCalled).toBe(true);
      expect(testScene.lastInterpolationFactor).toBe(interpolationFactor);
    });

    test('handles input for active scene', () => {
      const inputType = 'keydown';
      const event = { type: 'keydown', key: 'Space' };
      sceneManager.handleInput(inputType, event);
      expect(testScene.handleInputCalled).toBe(true);
      expect(testScene.lastInputType).toBe(inputType);
      expect(testScene.lastEvent).toBe(event);
    });

    test('skips updates during transition', async () => {
      sceneManager.transitioning = true;
      sceneManager.update(16.67);
      expect(testScene.updateCalled).toBe(false);
    });

    test('continues rendering during transition', () => {
      sceneManager.transitioning = true;
      sceneManager.render(0.5);
      expect(testScene.renderCalled).toBe(true);
    });
  });

  describe('Transitions', () => {
    test('implements fade transitions', async () => {
      // Since fadeIn/fadeOut are currently using setTimeout,
      // we can test that they take the expected duration
      jest.useFakeTimers();
      
      const transitionPromise = sceneManager.fadeIn();
      jest.advanceTimersByTime(sceneManager.transitionDuration);
      await transitionPromise;

      const fadeOutPromise = sceneManager.fadeOut();
      jest.advanceTimersByTime(sceneManager.transitionDuration);
      await fadeOutPromise;

      jest.useRealTimers();
    });
  });
});
