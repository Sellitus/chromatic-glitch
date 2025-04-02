import TweenManager from '../../../src/js/engine/tween/TweenManager.js';
import Tween from '../../../src/js/engine/tween/Tween.js';

// Mock the Tween class
jest.mock('../../../src/js/engine/tween/Tween.js');

describe('TweenManager', () => {
  let tweenManager;
  let mockTweenInstances;

  beforeEach(() => {
    // Reset the mock and instances before each test
    Tween.mockClear();
    mockTweenInstances = [];

    // Mock Tween constructor and methods
    Tween.mockImplementation((target, properties, duration, options) => {
      const mockInstance = {
        target: target,
        properties: properties,
        duration: duration,
        options: options,
        update: jest.fn(() => true), // Default to staying active
        stop: jest.fn(),
        play: jest.fn(), // Add play mock if needed by manager logic
        // Add other mocked methods/properties if manager uses them
        isFinished: false, // Mock property
      };
      // Simulate update returning false when finished
      mockInstance.update.mockImplementation(function(deltaTime) {
          // Simple simulation: become finished after duration (approx)
          // In real tests, you might control this more explicitly
          // For manager tests, often just need to control the return value
          return !this.isFinished;
      });
      mockTweenInstances.push(mockInstance);
      return mockInstance;
    });

    tweenManager = new TweenManager();
  });

  it('should initialize with an empty list of tweens', () => {
    expect(tweenManager.tweens).toEqual([]);
    expect(tweenManager.getCount()).toBe(0);
  });

  it('should add a valid tween', () => {
    const mockTween = new Tween({}, { x: 1 }, 1); // Create a mock instance
    tweenManager.add(mockTween);
    expect(tweenManager.tweens).toContain(mockTween);
    expect(tweenManager.getCount()).toBe(1);
  });

  it('should not add duplicate tweens', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mockTween = new Tween({}, { x: 1 }, 1);
    tweenManager.add(mockTween);
    tweenManager.add(mockTween); // Add again
    expect(tweenManager.getCount()).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate tween'));
    warnSpy.mockRestore();
  });

  it('should not add invalid objects', () => {
     const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
     tweenManager.add(null);
     tweenManager.add({});
     expect(tweenManager.getCount()).toBe(0);
     expect(warnSpy).toHaveBeenCalledTimes(2);
     warnSpy.mockRestore();
  });

  it('should remove a tween', () => {
    const mockTween1 = new Tween({ id: 1 }, { x: 1 }, 1);
    const mockTween2 = new Tween({ id: 2 }, { y: 1 }, 1);
    tweenManager.add(mockTween1);
    tweenManager.add(mockTween2);
    tweenManager.remove(mockTween1);
    expect(tweenManager.tweens).not.toContain(mockTween1);
    expect(tweenManager.tweens).toContain(mockTween2);
    expect(tweenManager.getCount()).toBe(1);
  });

   it('should not fail when removing a non-existent tween', () => {
       const mockTween1 = new Tween({ id: 1 }, { x: 1 }, 1);
       const mockTween2 = new Tween({ id: 2 }, { y: 1 }, 1);
       tweenManager.add(mockTween1);
       tweenManager.remove(mockTween2); // Not added
       expect(tweenManager.getCount()).toBe(1);
   });

  it('should remove all tweens of a specific target', () => {
    const target1 = { id: 'obj1' };
    const target2 = { id: 'obj2' };
    const tween1 = tweenManager.createTween(target1, { x: 1 }, 1);
    const tween2 = tweenManager.createTween(target2, { y: 1 }, 1);
    const tween3 = tweenManager.createTween(target1, { alpha: 0 }, 1); // Another for target1

    expect(tweenManager.getCount()).toBe(3);
    tweenManager.removeTweensOf(target1);
    expect(tweenManager.getCount()).toBe(1);
    expect(tweenManager.tweens).toContain(tween2);
    expect(tweenManager.tweens).not.toContain(tween1);
    expect(tweenManager.tweens).not.toContain(tween3);
  });

  it('should update all active tweens', () => {
    const tween1 = tweenManager.createTween({}, { x: 1 }, 1);
    const tween2 = tweenManager.createTween({}, { y: 1 }, 1);
    tweenManager.update(0.1);
    expect(tween1.update).toHaveBeenCalledWith(0.1);
    expect(tween2.update).toHaveBeenCalledWith(0.1);
  });

  it('should remove finished tweens after update', () => {
    const tween1 = tweenManager.createTween({}, { x: 1 }, 1);
    const tween2 = tweenManager.createTween({}, { y: 1 }, 1);

    // Simulate tween1 finishing on the next update
    tween1.update.mockImplementationOnce(() => false); // Return false = finished

    tweenManager.update(0.1);
    expect(tweenManager.getCount()).toBe(1);
    expect(tweenManager.tweens).not.toContain(tween1);
    expect(tweenManager.tweens).toContain(tween2);
    expect(tween2.update).toHaveBeenCalledWith(0.1); // Ensure others were still updated
  });

  it('should create and add a tween using createTween', () => {
    const target = { id: 'test' };
    const props = { value: 10 };
    const duration = 0.5;
    const options = { loop: true };

    const createdTween = tweenManager.createTween(target, props, duration, options);

    // Check if Tween constructor was called correctly
    expect(Tween).toHaveBeenCalledWith(target, props, duration, options);
    // Check if the created tween (mock instance) was added
    expect(tweenManager.tweens).toContain(createdTween);
    expect(tweenManager.getCount()).toBe(1);
    expect(createdTween).toBe(mockTweenInstances[0]); // Ensure it returned the mock
  });

  it('should remove all tweens', () => {
    tweenManager.createTween({}, { x: 1 }, 1);
    tweenManager.createTween({}, { y: 1 }, 1);
    expect(tweenManager.getCount()).toBe(2);
    tweenManager.removeAll();
    expect(tweenManager.getCount()).toBe(0);
    expect(tweenManager.tweens).toEqual([]);
  });

});
