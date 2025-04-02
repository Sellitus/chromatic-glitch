import OscillatorAnimator from '../../../src/js/engine/animation/OscillatorAnimator.js';

describe('OscillatorAnimator', () => {
  let target;
  let animator;

  beforeEach(() => {
    target = { value: 10, nested: { prop: 5 } };
    // Default animator, autoStart=false for controlled testing
    animator = new OscillatorAnimator(target, 'value', { autoStart: false });
  });

  it('should initialize with default values', () => {
    expect(animator.target).toBe(target);
    expect(animator.property).toBe('value');
    expect(animator.propertyPath).toEqual(['value']);
    expect(animator.amplitude).toBe(1);
    expect(animator.period).toBe(1);
    expect(animator.phase).toBe(0);
    expect(animator.additive).toBe(true);
    expect(animator.explicitBaseValue).toBeUndefined();
    expect(animator.isPlaying).toBe(false); // autoStart=false
    expect(animator.isFinished).toBe(false);
    expect(animator._needsInitialization).toBe(true);
  });

  it('should initialize with specific options', () => {
    const options = {
      baseValue: 100,
      amplitude: 5,
      period: 2.0,
      phase: 0.5,
      additive: false,
      autoStart: false,
    };
    animator = new OscillatorAnimator(target, 'nested.prop', options);
    expect(animator.property).toBe('nested.prop');
    expect(animator.propertyPath).toEqual(['nested', 'prop']);
    expect(animator.amplitude).toBe(options.amplitude);
    expect(animator.period).toBe(options.period);
    expect(animator.phase).toBe(options.phase);
    expect(animator.additive).toBe(options.additive);
    expect(animator.explicitBaseValue).toBe(options.baseValue);
    expect(animator.isPlaying).toBe(false);
  });

   it('should autoStart by default', () => {
       animator = new OscillatorAnimator(target, 'value'); // autoStart defaults true
       expect(animator.isPlaying).toBe(true);
       expect(animator._needsInitialization).toBe(true); // Still needs init on first update
   });

  it('should initialize baseValue on first update if not explicit', () => {
    animator.play();
    expect(animator._needsInitialization).toBe(true);
    animator.update(0.01); // First update
    expect(animator._needsInitialization).toBe(false);
    expect(animator.baseValue).toBe(10); // Captured from target.value
  });

  it('should use explicitBaseValue if provided', () => {
    animator = new OscillatorAnimator(target, 'value', { baseValue: 50, autoStart: false });
    animator.play();
    animator.update(0.01);
    expect(animator.baseValue).toBe(50);
  });

  it('should start playing', () => {
    animator.play();
    expect(animator.isPlaying).toBe(true);
  });

  it('should pause playing', () => {
    animator.play();
    animator.pause();
    expect(animator.isPlaying).toBe(false);
  });

  it('should resume playing after pause', () => {
      animator.play();
      animator.update(0.1);
      const time = animator.elapsedTime;
      animator.pause();
      animator.play();
      expect(animator.isPlaying).toBe(true);
      animator.update(0.1);
      expect(animator.elapsedTime).toBeCloseTo(time + 0.1);
  });

  it('should stop playing and mark as finished', () => {
    animator.play();
    animator.update(0.1);
    animator.stop();
    expect(animator.isPlaying).toBe(false);
    expect(animator.isFinished).toBe(true);
  });

   it('should reset property to base value on stop if requested', () => {
       animator = new OscillatorAnimator(target, 'value', { baseValue: 10, autoStart: true });
       animator.update(0.25); // Oscillate away from base
       expect(target.value).not.toBe(10);
       animator.stop(true); // Stop and reset
       expect(target.value).toBe(10);
   });

  it('should reset correctly', () => {
      animator.play();
      animator.update(0.1);
      animator.reset();
      expect(animator.elapsedTime).toBe(0);
      expect(animator.isPlaying).toBe(false);
      expect(animator.isFinished).toBe(false);
      expect(animator._needsInitialization).toBe(true);
  });

  it('should update target property additively', () => {
    animator = new OscillatorAnimator(target, 'value', { amplitude: 5, period: 1, autoStart: true }); // base=10
    animator.update(0.0); // Initialize base value
    expect(target.value).toBeCloseTo(10); // sin(0) = 0 -> 10 + 0

    animator.update(0.25); // Quarter period, sin(PI/2) = 1
    expect(target.value).toBeCloseTo(10 + 5 * 1); // 15

    animator.update(0.25); // Half period, sin(PI) = 0
    expect(target.value).toBeCloseTo(10 + 5 * 0); // 10

    animator.update(0.25); // Three-quarter period, sin(3PI/2) = -1
    expect(target.value).toBeCloseTo(10 + 5 * -1); // 5

    animator.update(0.25); // Full period, sin(2PI) = 0
    expect(target.value).toBeCloseTo(10 + 5 * 0); // 10
  });

  it('should update target property non-additively', () => {
    animator = new OscillatorAnimator(target, 'value', { amplitude: 5, period: 1, additive: false, autoStart: true });
    animator.update(0.0); // Initialize
    expect(target.value).toBeCloseTo(0); // sin(0) = 0

    animator.update(0.25); // Quarter period, sin(PI/2) = 1
    expect(target.value).toBeCloseTo(5 * 1); // 5

    animator.update(0.25); // Half period, sin(PI) = 0
    expect(target.value).toBeCloseTo(5 * 0); // 0

    animator.update(0.25); // Three-quarter period, sin(3PI/2) = -1
    expect(target.value).toBeCloseTo(5 * -1); // -5

    animator.update(0.25); // Full period, sin(2PI) = 0
    expect(target.value).toBeCloseTo(5 * 0); // 0
  });

  it('should handle phase offset', () => {
     animator = new OscillatorAnimator(target, 'value', { amplitude: 5, period: 1, phase: 0.25, autoStart: true }); // Start at peak (phase PI/2)
     animator.update(0.0); // Initialize and first update
     // phase = 2*PI*(0/1 + 0.25) = PI/2, sin(PI/2) = 1
     expect(target.value).toBeCloseTo(10 + 5 * 1); // 15
  });

  it('should update nested properties', () => {
     animator = new OscillatorAnimator(target, 'nested.prop', { amplitude: 2, period: 1, autoStart: true }); // base=5
     animator.update(0.0); // Initialize
     expect(target.nested.prop).toBeCloseTo(5); // sin(0)=0 -> 5+0

     animator.update(0.25); // sin(PI/2)=1
     expect(target.nested.prop).toBeCloseTo(5 + 2 * 1); // 7
  });

  it('should handle invalid property path during get', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      animator = new OscillatorAnimator(target, 'invalid.path', { autoStart: false });
      animator.play();
      animator.update(0.01); // Triggers initialization -> _getProperty
      expect(animator.baseValue).toBe(0); // Defaulted because get failed
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not get property'), expect.any(Error));
      errorSpy.mockRestore();
  });

   it('should handle invalid property path during set and stop', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      animator = new OscillatorAnimator(target, 'nested.invalid.path', { autoStart: true });
      animator.update(0.0); // Initialize (base will be 0 due to get failure)
      animator.update(0.1); // Triggers _setProperty failure
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('Could not set property'), expect.any(Error));
      expect(animator.isPlaying).toBe(false); // Should stop
      expect(animator.isFinished).toBe(true);
      errorSpy.mockRestore();
   });

   it('should not update if paused', () => {
       animator.play();
       animator.update(0.1);
       const val = target.value;
       animator.pause();
       animator.update(0.5);
       expect(target.value).toBe(val);
       expect(animator.elapsedTime).toBeCloseTo(0.1);
   });

    it('should not update if finished', () => {
       animator.play();
       animator.update(0.1);
       const val = target.value;
       animator.stop();
       animator.update(0.5);
       expect(target.value).toBe(val); // Value after stop should persist
       expect(animator.elapsedTime).toBeCloseTo(0.1); // Time shouldn't advance
   });

});
