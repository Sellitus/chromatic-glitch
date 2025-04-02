import Tween from '../../../src/js/engine/tween/Tween.js';
import { Easing } from '../../../src/js/engine/tween/Easing.js';

// Mock requestAnimationFrame for timing control if needed, but Jest timers are usually sufficient
// jest.useFakeTimers();

describe('Tween', () => {
  let target;
  let tween;
  const duration = 1.0; // 1 second

  beforeEach(() => {
    target = { x: 0, y: 10, alpha: 1 };
    // Default tween for basic tests
    tween = new Tween(target, { x: 100, alpha: 0 }, duration);
  });

  it('should initialize with correct properties', () => {
    expect(tween.target).toBe(target);
    // Check _targetEndProperties for initial state, check endProperties after init
    expect(tween._targetEndProperties).toEqual({ x: 100, alpha: 0 });
    expect(tween.duration).toBe(duration);
    expect(tween.easing).toBe(Easing.linear); // Default
    expect(tween.delay).toBe(0);
    expect(tween.loop).toBe(false);
    expect(tween.yoyo).toBe(false);
    // Check properties after initialization runs
    tween.play();
    tween.update(0); // Trigger initialization
    expect(tween.endProperties).toEqual({ x: 100, alpha: 0 }); // Now check the working property
    // isPlaying is true because we called play()
    expect(tween.isPaused).toBe(false);
    expect(tween.isFinished).toBe(false);
    expect(tween.isStarted).toBe(true); // isStarted becomes true after first update
    expect(tween.elapsedTime).toBe(0);
    expect(tween.delayTime).toBe(0);
    expect(tween._needsInitialization).toBe(false); // _initialize sets this to false
  });

   it('should throw error for invalid constructor arguments', () => {
       expect(() => new Tween(null, { x: 1 }, 1)).toThrow();
       expect(() => new Tween({}, null, 1)).toThrow();
       expect(() => new Tween({}, { x: 1 }, 0)).toThrow();
       expect(() => new Tween({}, { x: 1 }, -1)).toThrow();
   });

  it('should capture start properties on first update after delay', () => {
    tween.play();
    expect(tween._needsInitialization).toBe(true);
    tween.update(0.01); // First update triggers initialization
    expect(tween._needsInitialization).toBe(false);
    expect(tween.startProperties).toEqual({ x: 0, alpha: 1 }); // Captured from target
    expect(target.x).toBeCloseTo(1); // 100 * (0.01 / 1.0)
  });

   it('should use explicit start properties if provided', () => {
       const startProps = { x: -50, alpha: 0.5 };
       tween = new Tween(target, { x: 100, alpha: 0 }, duration, { startProperties: startProps });
       tween.play();
       tween.update(0.01);
       expect(tween.startProperties).toEqual(startProps);
       // Value should be based on startProps: -50 + (100 - (-50)) * 0.01 = -50 + 1.5 = -48.5
       expect(target.x).toBeCloseTo(-48.5);
   });

    it('should filter end properties based on explicit start properties', () => {
       const startProps = { x: -50 }; // Only define x
       // End properties include x and alpha
       tween = new Tween(target, { x: 100, alpha: 0 }, duration, { startProperties: startProps });
       tween.play();
       tween.update(0.01);
       expect(tween.startProperties).toEqual(startProps);
       expect(tween.endProperties).toEqual({ x: 100 }); // alpha should be filtered out
       expect(tween.propertyKeys).toEqual(['x']);
       expect(target.x).toBeCloseTo(-48.5);
       expect(target.alpha).toBe(1); // Alpha should remain unchanged
   });

  it('should start playing', () => {
    tween.play();
    expect(tween.isPlaying).toBe(true);
    expect(tween.isPaused).toBe(false);
  });

  it('should pause playing', () => {
    tween.play();
    tween.pause();
    expect(tween.isPlaying).toBe(false);
    expect(tween.isPaused).toBe(true);
  });

  it('should resume playing after pause', () => {
    tween.play();
    tween.update(0.2);
    tween.pause();
    const pausedTime = tween.elapsedTime;
    tween.play(); // Resume
    expect(tween.isPlaying).toBe(true);
    expect(tween.isPaused).toBe(false);
    tween.update(0.1);
    expect(tween.elapsedTime).toBeCloseTo(pausedTime + 0.1);
  });

  it('should stop playing and reset', () => {
    const onStopMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { onStop: onStopMock });
    tween.play();
    tween.update(0.3);
    tween.stop();
    expect(tween.isPlaying).toBe(false);
    expect(tween.isPaused).toBe(false);
    expect(tween.isFinished).toBe(true); // Marked finished
    expect(tween.elapsedTime).toBe(0); // Reset time
    expect(tween._needsInitialization).toBe(true); // Needs re-init
    expect(onStopMock).toHaveBeenCalledWith(target);
  });

   it('should reset correctly', () => {
       tween.play();
       tween.update(0.3);
       tween.reset();
       expect(tween.elapsedTime).toBe(0);
       expect(tween.delayTime).toBe(0);
       expect(tween.direction).toBe(1);
       expect(tween.isFinished).toBe(false);
       expect(tween.isStarted).toBe(false);
       expect(tween._needsInitialization).toBe(true);
       // isPlaying/isPaused state is not directly affected by reset
       expect(tween.isPlaying).toBe(true);
   });

  it('should update target properties over time (linear)', () => {
    tween.play();
    tween.update(0.0); // Initialize
    expect(target.x).toBeCloseTo(0);
    expect(target.alpha).toBeCloseTo(1);

    tween.update(0.5); // Halfway
    expect(target.x).toBeCloseTo(50); // 0 + (100 - 0) * 0.5
    expect(target.alpha).toBeCloseTo(0.5); // 1 + (0 - 1) * 0.5

    tween.update(0.5); // End
    expect(target.x).toBeCloseTo(100);
    expect(target.alpha).toBeCloseTo(0);
    expect(tween.isFinished).toBe(true);
    expect(tween.isPlaying).toBe(false);
  });

  it('should use the specified easing function', () => {
    tween = new Tween(target, { x: 100 }, duration, { easing: Easing.easeInQuad }); // t*t
    tween.play();
    tween.update(0.0); // Initialize
    tween.update(0.5); // Halfway (time = 0.5)
    const easedProgress = Easing.easeInQuad(0.5); // 0.25
    expect(target.x).toBeCloseTo(0 + (100 - 0) * easedProgress); // 25
  });

  it('should handle delay before starting', () => {
    const delay = 0.5;
    tween = new Tween(target, { x: 100 }, duration, { delay: delay });
    tween.play();

    tween.update(0.2); // During delay
    expect(tween.delayTime).toBeCloseTo(0.2);
    expect(tween.elapsedTime).toBe(0);
    expect(target.x).toBe(0); // Not started yet
    expect(tween.isStarted).toBe(false);

    tween.update(0.4); // Finishes delay (total delay time 0.6 > 0.5)
    expect(tween.delayTime).toBeCloseTo(delay);
    // Effective update time = (0.2 + 0.4) - 0.5 = 0.1
    expect(tween.elapsedTime).toBeCloseTo(0.1);
    expect(target.x).toBeCloseTo(10); // 100 * (0.1 / 1.0)
    expect(tween.isStarted).toBe(true);
  });

  it('should call onStart callback after delay', () => {
    const onStartMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { delay: 0.1, onStart: onStartMock });
    tween.play();
    tween.update(0.05); // Before delay finishes
    expect(onStartMock).not.toHaveBeenCalled();
    tween.update(0.06); // After delay finishes
    expect(onStartMock).toHaveBeenCalledWith(target);
    expect(onStartMock).toHaveBeenCalledTimes(1); // Ensure it's called only once
     tween.update(0.1); // Further updates
     expect(onStartMock).toHaveBeenCalledTimes(1);
  });

  it('should call onUpdate callback during updates', () => {
    const onUpdateMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { onUpdate: onUpdateMock });
    tween.play();
    tween.update(0.25);
    expect(onUpdateMock).toHaveBeenCalledWith(target, 0.25, 0.25); // target, progress, easedProgress
    tween.update(0.25);
    expect(onUpdateMock).toHaveBeenCalledWith(target, 0.5, 0.5);
    expect(onUpdateMock).toHaveBeenCalledTimes(2);
  });

  it('should call onComplete callback when finished (no loop)', () => {
    const onCompleteMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { onComplete: onCompleteMock });
    tween.play();
    tween.update(duration + 0.1); // Update past duration
    expect(onCompleteMock).toHaveBeenCalledWith(target);
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    expect(tween.isFinished).toBe(true);
  });

  it('should loop correctly', () => {
    const onCompleteMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { loop: true, onComplete: onCompleteMock });
    tween.play();
    tween.update(0.0); // Init

    tween.update(duration); // First cycle ends
    expect(target.x).toBeCloseTo(100);
    expect(tween.elapsedTime).toBeCloseTo(0); // Reset for loop
    expect(tween.isFinished).toBe(false);
    expect(tween.isPlaying).toBe(true);
    expect(onCompleteMock).toHaveBeenCalledTimes(1); // Called after first cycle

    tween.update(0.5); // Halfway through second cycle
    expect(target.x).toBeCloseTo(50);
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

  it('should yoyo correctly', () => {
    const onCompleteMock = jest.fn();
    tween = new Tween(target, { x: 100 }, duration, { loop: true, yoyo: true, onComplete: onCompleteMock });
    tween.play();
    tween.update(0.0); // Init, startProps = { x: 0 }
    const originalStartProps = { ...tween.startProperties };
    const originalEndProps = { ...tween.endProperties };

    tween.update(duration); // End of first cycle (forward)
    expect(target.x).toBeCloseTo(100);
    expect(tween.elapsedTime).toBeCloseTo(duration); // Stays at end before reversing
    expect(tween.direction).toBe(-1); // Reversed direction
    expect(tween.isFinished).toBe(false);
    expect(tween.isPlaying).toBe(true);
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
    // Check if start/end properties were swapped for reverse
    expect(tween.startProperties).toEqual(originalEndProps);
    expect(tween.endProperties).toEqual(originalStartProps);


    tween.update(0.5); // Halfway through second cycle (backward)
    // Progress = (duration - 0.5) / duration = 0.5
    // Value = end + (start - end) * progress = 0 + (100 - 0) * 0.5 = 50
    expect(target.x).toBeCloseTo(50);
    expect(tween.elapsedTime).toBeCloseTo(duration - 0.5); // Time decreases

    tween.update(0.5); // End of second cycle (backward)
    expect(target.x).toBeCloseTo(0); // Back to original start
    expect(tween.elapsedTime).toBeCloseTo(0); // Reset time
    expect(tween.direction).toBe(1); // Reversed back to forward
    expect(tween.isFinished).toBe(false);
    expect(tween.isPlaying).toBe(true);
    expect(onCompleteMock).toHaveBeenCalledTimes(2);
     // Check if start/end properties were restored
    expect(tween.startProperties).toEqual(originalStartProps);
    expect(tween.endProperties).toEqual(originalEndProps);
  });

   it('should not update if paused', () => {
       tween.play();
       tween.update(0.1);
       const xVal = target.x;
       tween.pause();
       tween.update(0.5); // Should do nothing
       expect(target.x).toBe(xVal);
       expect(tween.elapsedTime).toBeCloseTo(0.1);
   });

    it('should not restart completed non-looping tweens', () => {
        tween.play();
        tween.update(duration + 0.1); // Complete the tween
        expect(tween.isFinished).toBe(true);
        const xVal = target.x;
        tween.play(); // Try to play again
        tween.update(0.1); // Try to update
        expect(target.x).toBe(xVal); // Value should not change
        expect(tween.isPlaying).toBe(false); // Should remain not playing
    });

     it('should restart completed looping tweens', () => {
        tween = new Tween(target, { x: 100 }, duration, { loop: true });
        tween.play();
        tween.update(duration + 0.1); // Complete first loop
        expect(tween.isFinished).toBe(false); // Still playing due to loop
        // The loop logic now resets elapsedTime to 0 immediately upon completion
        expect(tween.elapsedTime).toBeCloseTo(0); // Should be 0 after loop cycle completes

        // Manually mark as finished ONLY to test the restart logic in play()
        tween.isFinished = true;
        tween.isPlaying = false; // Ensure it's not playing before calling play()

        tween.play(); // Should restart because loop=true and isFinished=true
        expect(tween.isFinished).toBe(false); // play() calls reset() which should NOT clear isFinished now
        expect(tween.isPlaying).toBe(true);
        expect(tween.elapsedTime).toBe(0); // play() calls reset() which resets time
        expect(tween._needsInitialization).toBe(true); // reset() sets this

        tween.update(0.1); // Update after restart
        expect(target.x).toBeCloseTo(10); // Starts from beginning again
    });

});
