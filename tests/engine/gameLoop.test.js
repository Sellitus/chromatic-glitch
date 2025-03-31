/**
 * Game loop tests
 */
import GameLoop from '../../src/js/engine/gameLoop';

describe('GameLoop', () => {
  let gameLoop;
  let mockRequestAnimationFrame;
  let mockCancelAnimationFrame;
  let mockPerformanceNow;
  let mockUpdateFn;
  let mockRenderFn;

  beforeEach(() => {
    // Mock requestAnimationFrame and cancelAnimationFrame
    mockRequestAnimationFrame = jest.fn(cb => 1);  // Return frameId 1
    mockCancelAnimationFrame = jest.fn();
    window.requestAnimationFrame = mockRequestAnimationFrame;
    window.cancelAnimationFrame = mockCancelAnimationFrame;

    // Mock performance.now()
    mockPerformanceNow = jest.fn();
    mockPerformanceNow.mockReturnValue(0);  // Start at 0ms
    performance.now = mockPerformanceNow;

    // Create mock update and render functions
    mockUpdateFn = jest.fn();
    mockRenderFn = jest.fn();

    // Create new GameLoop instance
    gameLoop = new GameLoop();
    gameLoop.setUpdateFunction(mockUpdateFn);
    gameLoop.setRenderFunction(mockRenderFn);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    test('initializes with correct default values', () => {
      expect(gameLoop.isRunning).toBe(false);
      expect(gameLoop.isPaused).toBe(false);
      expect(gameLoop.accumulator).toBe(0);
      expect(gameLoop.lastTime).toBe(0);
      expect(gameLoop.frameId).toBeNull();
      expect(gameLoop.getFixedDeltaTime()).toBe(1000 / 60); // 60 FPS
    });
  });

  describe('Start/Stop', () => {
    test('start initiates game loop', () => {
      gameLoop.start();
      expect(gameLoop.isRunning).toBe(true);
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(gameLoop.frameId).toBe(1);
    });

    test('start does nothing if already running', () => {
      gameLoop.start();
      const firstFrameId = gameLoop.frameId;
      gameLoop.start();
      expect(mockRequestAnimationFrame).toHaveBeenCalledTimes(1);
      expect(gameLoop.frameId).toBe(firstFrameId);
    });

    test('stop ends game loop', () => {
      gameLoop.start();
      gameLoop.stop();
      expect(gameLoop.isRunning).toBe(false);
      expect(mockCancelAnimationFrame).toHaveBeenCalledWith(1);
      expect(gameLoop.frameId).toBeNull();
    });

    test('stop does nothing if not running', () => {
      gameLoop.stop();
      expect(mockCancelAnimationFrame).not.toHaveBeenCalled();
    });
  });

  describe('Pause/Resume', () => {
    test('pause freezes game loop updates', () => {
      gameLoop.start();
      gameLoop.pause();
      expect(gameLoop.isPaused).toBe(true);
      expect(gameLoop.isActive()).toBe(false);
      expect(gameLoop.isRunning).toBe(true); // Still running, just paused
    });

    test('resume continues game loop updates', () => {
      gameLoop.start();
      gameLoop.pause();
      mockPerformanceNow.mockReturnValue(100); // Advance time
      gameLoop.resume();
      expect(gameLoop.isPaused).toBe(false);
      expect(gameLoop.isActive()).toBe(true);
      expect(gameLoop.lastTime).toBe(100); // Should reset lastTime
      expect(gameLoop.accumulator).toBe(0); // Should reset accumulator
    });
  });

  describe('Game Loop Updates', () => {
    test('maintains fixed timestep updates', () => {
      gameLoop.start();
      mockPerformanceNow.mockReturnValue(32); // ~2 frames at 60 FPS (16.67ms per frame)

      // Simulate a tick
      gameLoop.tick(32);

      // Should have called update twice (32ms / 16.67ms per frame ≈ 2)
      expect(mockUpdateFn).toHaveBeenCalledTimes(1);
      expect(mockUpdateFn).toHaveBeenCalledWith(1000/60);
    });

    test('updates with correct interpolation', () => {
      gameLoop.start();
      mockPerformanceNow.mockReturnValue(10); // Less than one frame

      // Simulate a tick
      gameLoop.tick(10);

      // Should have called render with correct interpolation factor
      expect(mockRenderFn).toHaveBeenCalledTimes(1);
      const interpolationFactor = (10 % (1000/60)) / (1000/60);
      expect(mockRenderFn).toHaveBeenCalledWith(interpolationFactor);
    });

    test('skips updates when paused', () => {
      gameLoop.start();
      gameLoop.pause();
      mockPerformanceNow.mockReturnValue(100);

      // Simulate a tick
      gameLoop.tick(100);

      expect(mockUpdateFn).not.toHaveBeenCalled();
      expect(mockRenderFn).not.toHaveBeenCalled();
    });

    test('handles large time delta without spiraling', () => {
      gameLoop.start();
      mockPerformanceNow.mockReturnValue(1000); // Large jump in time

      // Simulate a tick
      gameLoop.tick(1000);

      // Should have called update a reasonable number of times
      // (not trying to catch up entirely)
      expect(mockUpdateFn.mock.calls.length).toBeLessThan(61); // No more than 1 second worth of updates
    });
  });
});
