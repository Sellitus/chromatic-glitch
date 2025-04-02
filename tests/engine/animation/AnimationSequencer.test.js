import AnimationSequencer, { SequenceStepType } from '../../../src/js/engine/animation/AnimationSequencer.js';
import Tween from '../../../src/js/engine/tween/Tween.js';
import TweenManager from '../../../src/js/engine/tween/TweenManager.js';

// --- Mocks ---
jest.mock('../../../src/js/engine/tween/Tween.js');
jest.mock('../../../src/js/engine/tween/TweenManager.js');

// Mock AnimationComponent (or any object with play/stop/isFinished)
const createMockAnimationComponent = () => ({
  play: jest.fn(),
  stop: jest.fn(),
  isFinished: false, // Control this in tests
});

// Mock TweenManager instance
const mockTweenManager = {
  add: jest.fn(),
  remove: jest.fn(),
  // Add other methods if sequencer uses them
};

describe('AnimationSequencer', () => {
  let sequencer;
  let mockAnimComp;
  let mockTarget;
  let mockTweenInstance;
  let mockSubSequencer;

  beforeEach(() => {
    // Reset mocks
    Tween.mockClear();
    TweenManager.mockClear(); // Clear constructor mock if needed
    mockTweenManager.add.mockClear();
    mockTweenManager.remove.mockClear();

    // Create fresh mocks for each test
    mockAnimComp = createMockAnimationComponent();
    mockTarget = { x: 0 };
    mockSubSequencer = {
        play: jest.fn(),
        pause: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
        update: jest.fn(),
        isFinished: false,
    };


    // Mock Tween constructor to return a controllable instance
    Tween.mockImplementation(() => {
        mockTweenInstance = {
            play: jest.fn(),
            pause: jest.fn(),
            stop: jest.fn(),
            update: jest.fn(() => true), // Returns true (active) by default
            isFinished: false, // Control this in tests
            target: mockTarget, // Reference target if needed
        };
        return mockTweenInstance;
    });

    sequencer = new AnimationSequencer({ tweenManager: mockTweenManager });
  });

  it('should initialize correctly', () => {
    expect(sequencer.steps).toEqual([]);
    expect(sequencer.loop).toBe(false);
    expect(sequencer.onComplete).toBeNull();
    expect(sequencer.tweenManager).toBe(mockTweenManager);
    expect(sequencer.currentStepIndex).toBe(-1);
    expect(sequencer.isPlaying).toBe(false);
    expect(sequencer.isPaused).toBe(false);
    expect(sequencer.isFinished).toBe(false);
  });

  // --- Step Adding ---
  it('should add an animation step', () => {
    sequencer.addAnimation(mockAnimComp, 'run', true);
    expect(sequencer.steps.length).toBe(1);
    expect(sequencer.steps[0]).toEqual({
      type: SequenceStepType.ANIMATION,
      target: mockAnimComp,
      name: 'run',
      wait: true,
    });
  });

  it('should add a tween step', () => {
    sequencer.addTween(mockTarget, { x: 100 }, 1.0, { delay: 0.1 }, false);
     expect(sequencer.steps.length).toBe(1);
     expect(sequencer.steps[0]).toEqual({
       type: SequenceStepType.TWEEN,
       target: mockTarget,
       properties: { x: 100 },
       duration: 1.0,
       options: { delay: 0.1 },
       wait: false,
     });
  });

   it('should warn if adding a waiting tween step without a tweenManager', () => {
       const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
       const seqNoManager = new AnimationSequencer(); // No manager provided
       seqNoManager.addTween(mockTarget, { x: 1 }, 1, {}, true); // wait=true
       expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('TweenManager not provided'));
       expect(seqNoManager.steps[0].wait).toBe(false); // Should force wait to false
       warnSpy.mockRestore();
   });

  it('should add a wait step', () => {
    sequencer.addWait(0.5);
    expect(sequencer.steps.length).toBe(1);
    expect(sequencer.steps[0]).toEqual({ type: SequenceStepType.WAIT, duration: 0.5 });
  });

  it('should add a callback step', () => {
    const cb = jest.fn();
    sequencer.addCallback(cb, [1, 'a']);
    expect(sequencer.steps.length).toBe(1);
    expect(sequencer.steps[0]).toEqual({ type: SequenceStepType.CALLBACK, callback: cb, args: [1, 'a'] });
  });

   it('should add a parallel step', () => {
       sequencer.addParallel(p => {
           p.addWait(0.1);
           p.addTween(mockTarget, { x: 50 }, 0.2);
       });
       expect(sequencer.steps.length).toBe(1);
       expect(sequencer.steps[0].type).toBe(SequenceStepType.PARALLEL);
       expect(sequencer.steps[0].steps.length).toBe(2);
       expect(sequencer.steps[0].steps[0].type).toBe(SequenceStepType.WAIT);
       expect(sequencer.steps[0].steps[1].type).toBe(SequenceStepType.TWEEN);
   });

    it('should add a sequence step', () => {
        sequencer.addSequence(mockSubSequencer, false);
        expect(sequencer.steps.length).toBe(1);
        expect(sequencer.steps[0]).toEqual({
            type: SequenceStepType.SEQUENCE,
            sequencer: mockSubSequencer,
            wait: false,
        });
    });

  // --- Playback ---
  it('should start playing the first step', () => {
    const cb = jest.fn();
    sequencer.addCallback(cb).addWait(0.1);
    sequencer.play();
    expect(sequencer.isPlaying).toBe(true);
    expect(cb).toHaveBeenCalledTimes(1);
    // Callback is instant, _startNextStep advances index immediately
    expect(sequencer.currentStepIndex).toBe(1);
    // Check that the current step is now the WAIT step
    expect(sequencer.steps[sequencer.currentStepIndex].type).toBe(SequenceStepType.WAIT);
  });

  it('should pause playing', () => {
    sequencer.addWait(1.0).play();
    sequencer.pause();
    expect(sequencer.isPlaying).toBe(false);
    expect(sequencer.isPaused).toBe(true);
  });

   it('should resume playing after pause', () => {
       sequencer.addWait(1.0).play();
       sequencer.update(0.1); // Progress wait timer
       sequencer.pause();
       sequencer.play(); // Resume
       expect(sequencer.isPlaying).toBe(true);
       expect(sequencer.isPaused).toBe(false);
       sequencer.update(0.1);
       expect(sequencer.activeWaitTimer).toBeCloseTo(0.2); // Timer continued
   });

  it('should stop playing and reset', () => {
    sequencer.addWait(0.5).addCallback(jest.fn()).play();
    sequencer.update(0.1);
    sequencer.stop();
    expect(sequencer.isPlaying).toBe(false);
    expect(sequencer.isPaused).toBe(false);
    expect(sequencer.isFinished).toBe(true);
    expect(sequencer.currentStepIndex).toBe(-1); // Reset index
    expect(sequencer.activeWaitTimer).toBe(0);
  });

   it('should stop active tween when sequence stops', () => {
       sequencer.addTween(mockTarget, { x: 1 }, 1, {}, true).play(); // Waiting tween
       sequencer.update(0.1); // Start the tween
       expect(mockTweenInstance).toBeDefined();
       sequencer.stop();
       expect(mockTweenInstance.stop).toHaveBeenCalled();
       expect(mockTweenManager.remove).toHaveBeenCalledWith(mockTweenInstance);
   });

    it('should stop active animation when sequence stops', () => {
       sequencer.addAnimation(mockAnimComp, 'run', true).play(); // Waiting animation
       sequencer.update(0.1); // Start the animation
       sequencer.stop();
       expect(mockAnimComp.stop).toHaveBeenCalled();
   });

  it('should reset correctly', () => {
    sequencer.addWait(0.5).play();
    sequencer.update(0.1);
    sequencer.reset();
    expect(sequencer.isPlaying).toBe(false);
    expect(sequencer.isPaused).toBe(false);
    expect(sequencer.isFinished).toBe(false);
    expect(sequencer.currentStepIndex).toBe(-1);
    expect(sequencer.activeWaitTimer).toBe(0);
  });

  // --- Step Execution & Update Logic ---
  it('should execute wait step', () => {
    sequencer.addWait(0.5).addCallback(jest.fn()).play();
    sequencer.update(0.4);
    expect(sequencer.currentStepIndex).toBe(0); // Still waiting
    sequencer.update(0.11); // Finish wait
    expect(sequencer.currentStepIndex).toBe(1); // Moved to callback
  });

  it('should execute animation step (wait=true)', () => {
    sequencer.addAnimation(mockAnimComp, 'run', true).addCallback(jest.fn()).play();
    sequencer.update(0.1); // Start animation
    expect(mockAnimComp.play).toHaveBeenCalledWith('run', true);
    expect(sequencer.currentStepIndex).toBe(0); // Waiting

    mockAnimComp.isFinished = true; // Simulate animation finishing
    sequencer.update(0.1);
    expect(sequencer.currentStepIndex).toBe(1); // Moved to next step
  });

  it('should execute animation step (wait=false)', () => {
    sequencer.addAnimation(mockAnimComp, 'run', false).addCallback(jest.fn()).play();
    sequencer.update(0.1); // Start animation
    expect(mockAnimComp.play).toHaveBeenCalledWith('run', true);
    // Should move to next step immediately because wait=false
    expect(sequencer.currentStepIndex).toBe(1);
  });

  it('should execute tween step (wait=true)', () => {
    sequencer.addTween(mockTarget, { x: 1 }, 1, {}, true).addCallback(jest.fn()).play();
    sequencer.update(0.1); // Start tween
    expect(Tween).toHaveBeenCalled();
    expect(mockTweenManager.add).toHaveBeenCalledWith(mockTweenInstance);
    expect(mockTweenInstance.play).toHaveBeenCalled();
    expect(sequencer.currentStepIndex).toBe(0); // Waiting

    mockTweenInstance.isFinished = true; // Simulate tween finishing
    sequencer.update(0.1);
    expect(sequencer.currentStepIndex).toBe(1); // Moved to next step
  });

   it('should execute tween step (wait=false)', () => {
       sequencer.addTween(mockTarget, { x: 1 }, 1, {}, false).addCallback(jest.fn()).play();
       sequencer.update(0.1); // Start tween
       expect(Tween).toHaveBeenCalled();
       expect(mockTweenManager.add).toHaveBeenCalledWith(mockTweenInstance);
       expect(mockTweenInstance.play).toHaveBeenCalled();
       // Should move to next step immediately
       expect(sequencer.currentStepIndex).toBe(1);
   });

  it('should execute callback step', () => {
    const cb = jest.fn();
    const args = [1, 'a'];
    sequencer.addCallback(cb, args).addWait(0.1).play();
    sequencer.update(0.01); // Trigger start
    expect(cb).toHaveBeenCalledWith(...args);
    expect(sequencer.currentStepIndex).toBe(1); // Moved past callback
  });

   it('should execute parallel steps and wait for all', () => {
       let parallelTweenInstance;
       let parallelAnimComp = createMockAnimationComponent();
       Tween.mockImplementationOnce(() => { // Mock for the parallel tween
           parallelTweenInstance = { play: jest.fn(), update: jest.fn(), isFinished: false, stop: jest.fn() };
           return parallelTweenInstance;
       });

       sequencer.addParallel(p => {
           p.addAnimation(parallelAnimComp, 'fly', true); // wait=true inside parallel doesn't affect sequencer, only parallel block completion
           p.addTween(mockTarget, { y: 1 }, 0.5, {}, true);
       }).addCallback(jest.fn()).play();

       sequencer.update(0.1); // Start parallel steps
       expect(parallelAnimComp.play).toHaveBeenCalledWith('fly', true);
       expect(parallelTweenInstance.play).toHaveBeenCalled();
       expect(sequencer.currentStepIndex).toBe(0); // Still on parallel step

       sequencer.update(0.2);
       expect(sequencer.currentStepIndex).toBe(0); // Still waiting

       parallelAnimComp.isFinished = true; // Anim finishes
       sequencer.update(0.1);
       expect(sequencer.currentStepIndex).toBe(0); // Still waiting for tween

       parallelTweenInstance.isFinished = true; // Tween finishes
       sequencer.update(0.1);
       expect(sequencer.currentStepIndex).toBe(1); // Parallel block finished, moved on
   });

    it('should execute sequence step (wait=true)', () => {
        sequencer.addSequence(mockSubSequencer, true).addCallback(jest.fn()).play();
        sequencer.update(0.1); // Start sub-sequence
        expect(mockSubSequencer.reset).toHaveBeenCalled();
        expect(mockSubSequencer.play).toHaveBeenCalled();
        expect(sequencer.currentStepIndex).toBe(0); // Waiting

        sequencer.update(0.5);
        expect(mockSubSequencer.update).toHaveBeenCalledWith(0.5);
        expect(sequencer.currentStepIndex).toBe(0); // Still waiting

        mockSubSequencer.isFinished = true; // Sub-sequence finishes
        sequencer.update(0.1);
        expect(mockSubSequencer.update).toHaveBeenCalledWith(0.1);
        expect(sequencer.currentStepIndex).toBe(1); // Moved on
    });

     it('should execute sequence step (wait=false)', () => {
        sequencer.addSequence(mockSubSequencer, false).addCallback(jest.fn()).play();
        // Should move on immediately after play() because wait=false
        expect(sequencer.currentStepIndex).toBe(1);
        expect(mockSubSequencer.reset).toHaveBeenCalled();
        expect(mockSubSequencer.play).toHaveBeenCalled();
        // Update should not affect index further in this case
        sequencer.update(0.1);
        expect(sequencer.currentStepIndex).toBe(1);
    });

  it('should loop the entire sequence', () => {
    const cb = jest.fn();
    sequencer = new AnimationSequencer({ loop: true });
    sequencer.addWait(0.1).addCallback(cb).play();

    sequencer.update(0.15); // Finish wait and callback, sequence loops
    expect(cb).toHaveBeenCalledTimes(1);
    // After looping, index should be back at 0 (the WAIT step)
    expect(sequencer.currentStepIndex).toBe(0);

    sequencer.update(0.01); // Update for the first frame of the new loop
    expect(sequencer.isFinished).toBe(false);
    expect(sequencer.isPlaying).toBe(true);
    expect(sequencer.currentStepIndex).toBe(0); // Still at step 0 (WAIT)
    // Check that timer started accumulating correctly for the new wait step
    expect(sequencer.activeWaitTimer).toBeCloseTo(0.01);

    sequencer.update(0.1); // Finish wait and callback again
    expect(cb).toHaveBeenCalledTimes(2);
  });

  it('should call onComplete when finished (no loop)', () => {
    const onCompleteMock = jest.fn();
    sequencer = new AnimationSequencer({ onComplete: onCompleteMock });
    sequencer.addWait(0.1).play();
    sequencer.update(0.15); // Finish wait
    expect(sequencer.isFinished).toBe(true);
    expect(sequencer.isPlaying).toBe(false);
    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });

});
