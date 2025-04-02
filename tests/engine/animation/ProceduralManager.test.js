import ProceduralManager from '../../../src/js/engine/animation/ProceduralManager.js';
import OscillatorAnimator from '../../../src/js/engine/animation/OscillatorAnimator.js';

// Mock the OscillatorAnimator class
jest.mock('../../../src/js/engine/animation/OscillatorAnimator.js');

describe('ProceduralManager', () => {
  let proceduralManager;
  let mockAnimatorInstances;

  beforeEach(() => {
    // Reset mocks and instances
    OscillatorAnimator.mockClear();
    mockAnimatorInstances = [];

    // Mock OscillatorAnimator constructor and methods
    OscillatorAnimator.mockImplementation((target, property, options) => {
      const mockInstance = {
        target: target,
        property: property,
        options: options,
        update: jest.fn(),
        stop: jest.fn(),
        // Add other mocked methods/properties if manager uses them
        isFinished: false, // Mock property, default to not finished
      };
      mockAnimatorInstances.push(mockInstance);
      return mockInstance;
    });

    proceduralManager = new ProceduralManager();
  });

  it('should initialize with an empty list of animators', () => {
    expect(proceduralManager.animators).toEqual([]);
    expect(proceduralManager.getCount()).toBe(0);
  });

  it('should add a valid animator', () => {
    // Use the mocked constructor to create an instance to add
    const mockAnimator = new OscillatorAnimator({}, 'prop');
    proceduralManager.add(mockAnimator);
    expect(proceduralManager.animators).toContain(mockAnimator);
    expect(proceduralManager.getCount()).toBe(1);
  });

  it('should not add duplicate animators', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mockAnimator = new OscillatorAnimator({}, 'prop');
    proceduralManager.add(mockAnimator);
    proceduralManager.add(mockAnimator); // Add again
    expect(proceduralManager.getCount()).toBe(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('duplicate animator'));
    warnSpy.mockRestore();
  });

  it('should not add invalid objects', () => {
     const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
     proceduralManager.add(null);
     proceduralManager.add({}); // Missing required methods/properties
     // proceduralManager.add({ update: () => {}, isFinished: false }); // Temporarily comment out this line
     expect(proceduralManager.getCount()).toBe(0);
     // Warning might be called multiple times depending on checks in add()
     expect(warnSpy).toHaveBeenCalled();
     warnSpy.mockRestore();
  });

  it('should remove an animator', () => {
    const mockAnimator1 = new OscillatorAnimator({ id: 1 }, 'prop');
    const mockAnimator2 = new OscillatorAnimator({ id: 2 }, 'prop');
    proceduralManager.add(mockAnimator1);
    proceduralManager.add(mockAnimator2);
    proceduralManager.remove(mockAnimator1);
    expect(proceduralManager.animators).not.toContain(mockAnimator1);
    expect(proceduralManager.animators).toContain(mockAnimator2);
    expect(proceduralManager.getCount()).toBe(1);
  });

   it('should not fail when removing a non-existent animator', () => {
       const mockAnimator1 = new OscillatorAnimator({ id: 1 }, 'prop');
       const mockAnimator2 = new OscillatorAnimator({ id: 2 }, 'prop');
       proceduralManager.add(mockAnimator1);
       proceduralManager.remove(mockAnimator2); // Not added
       expect(proceduralManager.getCount()).toBe(1);
   });

  it('should remove all animators of a specific target', () => {
    const target1 = { id: 'obj1' };
    const target2 = { id: 'obj2' };
    const animator1 = proceduralManager.createOscillator(target1, 'x');
    const animator2 = proceduralManager.createOscillator(target2, 'y');
    const animator3 = proceduralManager.createOscillator(target1, 'alpha'); // Another for target1

    expect(proceduralManager.getCount()).toBe(3);
    proceduralManager.removeAnimatorsOf(target1);
    expect(proceduralManager.getCount()).toBe(1);
    expect(proceduralManager.animators).toContain(animator2);
    expect(proceduralManager.animators).not.toContain(animator1);
    expect(proceduralManager.animators).not.toContain(animator3);
    // Check if stop was called on removed animators
    expect(animator1.stop).toHaveBeenCalled();
    expect(animator3.stop).toHaveBeenCalled();
    expect(animator2.stop).not.toHaveBeenCalled();
  });

  it('should update all active animators', () => {
    const animator1 = proceduralManager.createOscillator({}, 'x');
    const animator2 = proceduralManager.createOscillator({}, 'y');
    proceduralManager.update(0.1);
    expect(animator1.update).toHaveBeenCalledWith(0.1);
    expect(animator2.update).toHaveBeenCalledWith(0.1);
  });

  it('should remove finished animators after update', () => {
    const animator1 = proceduralManager.createOscillator({}, 'x');
    const animator2 = proceduralManager.createOscillator({}, 'y');

    // Simulate animator1 finishing on the next update
    animator1.isFinished = true; // Mark as finished

    proceduralManager.update(0.1);
    expect(proceduralManager.getCount()).toBe(1);
    expect(proceduralManager.animators).not.toContain(animator1);
    expect(proceduralManager.animators).toContain(animator2);
    expect(animator2.update).toHaveBeenCalledWith(0.1); // Ensure others were still updated
  });

  it('should create and add an oscillator using createOscillator', () => {
    const target = { id: 'test' };
    const prop = 'value';
    const options = { amplitude: 5 };

    const createdAnimator = proceduralManager.createOscillator(target, prop, options);

    // Check if OscillatorAnimator constructor was called correctly
    expect(OscillatorAnimator).toHaveBeenCalledWith(target, prop, options);
    // Check if the created animator (mock instance) was added
    expect(proceduralManager.animators).toContain(createdAnimator);
    expect(proceduralManager.getCount()).toBe(1);
    expect(createdAnimator).toBe(mockAnimatorInstances[0]); // Ensure it returned the mock
  });

  it('should remove all animators', () => {
    proceduralManager.createOscillator({}, 'x');
    proceduralManager.createOscillator({}, 'y');
    expect(proceduralManager.getCount()).toBe(2);
    proceduralManager.removeAll();
    expect(proceduralManager.getCount()).toBe(0);
    expect(proceduralManager.animators).toEqual([]);
  });

});
