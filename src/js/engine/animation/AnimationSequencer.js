import Tween from '../tween/Tween.js';
import Animation from './Animation.js'; // Assuming Animation class exists

export const SequenceStepType = {
  ANIMATION: 'animation',
  TWEEN: 'tween',
  WAIT: 'wait',
  CALLBACK: 'callback',
  PARALLEL: 'parallel',
  SEQUENCE: 'sequence',
};

export default class AnimationSequencer {
  constructor(options = {}) {
    this.steps = [];
    this.loop = options.loop ?? false;
    this.onComplete = options.onComplete ?? null;
    this.tweenManager = options.tweenManager ?? null;

    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.isPaused = false;
    this.isFinished = false;

    this.activeWaitTimer = 0;
    this.activeParallelSteps = [];
    this._stepNeedsAdvance = false; // Flag to signal completion from update
  }

  addStep(stepConfig) {
    this.steps.push(stepConfig);
    return this;
  }

  addAnimation(targetComponent, animationName, waitForCompletion = true) {
    return this.addStep({ type: SequenceStepType.ANIMATION, target: targetComponent, name: animationName, wait: waitForCompletion });
  }

  addTween(target, properties, duration, options = {}, waitForCompletion = true) {
     if (!this.tweenManager && waitForCompletion) {
         console.warn("AnimationSequencer: TweenManager not provided. Cannot automatically wait for tween completion without it.");
         waitForCompletion = false;
     }
    return this.addStep({ type: SequenceStepType.TWEEN, target, properties, duration, options, wait: waitForCompletion });
  }

  addWait(duration) {
    return this.addStep({ type: SequenceStepType.WAIT, duration });
  }

  addCallback(callback, args = []) {
    return this.addStep({ type: SequenceStepType.CALLBACK, callback, args });
  }

   addParallel(builder) {
       const parallelSequencer = new AnimationSequencer({ tweenManager: this.tweenManager });
       builder(parallelSequencer);
       return this.addStep({ type: SequenceStepType.PARALLEL, steps: parallelSequencer.steps });
   }

   addSequence(sequencer, waitForCompletion = true) {
       return this.addStep({ type: SequenceStepType.SEQUENCE, sequencer, wait: waitForCompletion });
   }

  play() {
    if (this.isFinished && !this.loop) return;
    if (this.isFinished && this.loop) this.reset();

    this.isPlaying = true;
    this.isPaused = false;
    if (this.currentStepIndex === -1) {
      this._startNextStep();
    } else {
        // Resume potentially active steps
        this.activeParallelSteps.forEach(s => s.instance?.play?.());
        const currentStep = this.steps[this.currentStepIndex];
        if (currentStep?.type === SequenceStepType.SEQUENCE && currentStep._instance) {
            currentStep._instance.play();
        }
    }
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPlaying = false;
    this.isPaused = true;
    this.activeParallelSteps.forEach(s => s.instance?.pause?.());
    const currentStep = this.steps[this.currentStepIndex];
    if (currentStep?.type === SequenceStepType.SEQUENCE && currentStep._instance) {
        currentStep._instance.pause();
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.isFinished = true;
    this.activeParallelSteps.forEach(s => s.instance?.stop?.());
    const currentStep = this.steps[this.currentStepIndex];
     if (currentStep) {
         this._stopStep(currentStep);
     }
    this.reset();
  }

  reset() {
    this.currentStepIndex = -1;
    this.isPlaying = false;
    this.isPaused = false;
    // this.isFinished = false; // Don't reset finished flag here, stop() manages it
    this.activeWaitTimer = 0;
    this.activeParallelSteps = [];
     this.steps.forEach(step => {
         if (step._instance) {
             step._instance.reset?.();
             delete step._instance;
         }
     });
  }

  update(deltaTime) {
    if (!this.isPlaying || this.isPaused || this.isFinished) {
      return;
    }

    // If sequence hasn't started, do nothing
    if (this.currentStepIndex < 0 || this.currentStepIndex >= this.steps.length) {
        return;
    }

    const currentStep = this.steps[this.currentStepIndex];
    let needsAdvance = false;

    // Update logic only needs to progress time-based or parallel steps
    // and check if *waiting* steps are complete.
    switch (currentStep.type) {
      case SequenceStepType.WAIT:
        this.activeWaitTimer += deltaTime;
        if (this.activeWaitTimer >= currentStep.duration) {
          needsAdvance = true;
        }
        break;
      case SequenceStepType.ANIMATION:
        // Only check completion if waiting
        if (currentStep.wait && currentStep.target?.isFinished) {
          needsAdvance = true;
        }
        break;
      case SequenceStepType.TWEEN:
        // Only check completion if waiting
        if (currentStep.wait && currentStep._instance?.isFinished) {
            needsAdvance = true;
            delete currentStep._instance;
        }
        break;
      case SequenceStepType.PARALLEL:
        let allParallelDone = true;
        this.activeParallelSteps.forEach(stepState => {
            if (stepState.instance) {
                stepState.instance.update(deltaTime); // Update sub-sequences/tweens
                if (!stepState.instance.isFinished) allParallelDone = false;
            } else if (stepState.type === SequenceStepType.ANIMATION) {
                 if (!stepState.target?.isFinished) allParallelDone = false;
            }
            // Note: Parallel waits are not handled here yet
        });
        if (allParallelDone && this.activeParallelSteps.length > 0) { // Ensure parallel block actually ran
          needsAdvance = true;
          this.activeParallelSteps = [];
        }
        break;
       case SequenceStepType.SEQUENCE:
           // Only update/check completion if waiting
           if (currentStep.wait && currentStep._instance) {
               currentStep._instance.update(deltaTime);
               if (currentStep._instance.isFinished) {
                   needsAdvance = true;
                   delete currentStep._instance;
               }
           } else if (currentStep._instance) {
               // If not waiting, still update (it might have its own logic)
               currentStep._instance.update(deltaTime);
           }
           break;
      // CALLBACK and non-waiting steps are handled entirely in _startNextStep
      default:
        break;
    }

    if (needsAdvance) {
      this._startNextStep();
    }
  }

  _startNextStep() {
    this.currentStepIndex++;
    this.activeWaitTimer = 0;

    if (this.currentStepIndex >= this.steps.length) {
      if (this.loop) {
        this.reset();
        this.play(); // This will call _startNextStep again with index 0
      } else {
        this.isFinished = true;
        this.isPlaying = false;
        if (this.onComplete) this.onComplete();
      }
      return;
    }

    const nextStep = this.steps[this.currentStepIndex];
    let advanceImmediately = false;

    // Initiate the new step
    switch (nextStep.type) {
      case SequenceStepType.ANIMATION:
        nextStep.target?.play?.(nextStep.name, true);
        if (!nextStep.wait) advanceImmediately = true;
        break;
      case SequenceStepType.TWEEN:
        const tween = new Tween(nextStep.target, nextStep.properties, nextStep.duration, nextStep.options);
        if (this.tweenManager) {
            this.tweenManager.add(tween);
            if (nextStep.wait) nextStep._instance = tween;
        } else if (nextStep.wait) {
             console.error("AnimationSequencer: Cannot wait for Tween completion without a TweenManager.");
        }
        tween.play();
        if (!nextStep.wait) advanceImmediately = true;
        break;
      case SequenceStepType.WAIT:
        // If wait duration is 0, advance immediately
        if (nextStep.duration <= 0) advanceImmediately = true;
        // Otherwise, timer starts in update()
        break;
      case SequenceStepType.CALLBACK:
        try { nextStep.callback(...(nextStep.args ?? [])); }
        catch (e) { console.error("AnimationSequencer: Error executing callback step:", e); }
        advanceImmediately = true; // Callbacks are instant
        break;
      case SequenceStepType.PARALLEL:
        this.activeParallelSteps = [];
        let allParallelInstant = true;
        if (nextStep.steps && nextStep.steps.length > 0) {
            nextStep.steps.forEach(parallelStepConfig => {
                const stepState = this._initiateStep(parallelStepConfig);
                if (stepState) {
                    this.activeParallelSteps.push(stepState);
                    // Check if this parallel step requires waiting
                    if (stepState.wait !== false) { // Assume wait=true unless explicitly false (Wait/Callback are instant)
                       allParallelInstant = false;
                    }
                } else {
                    // If _initiateStep returns null (e.g., Callback, Wait), it's instant
                }
            });
        }
        // If the parallel block itself contained only instant steps, advance immediately
        if (allParallelInstant && this.activeParallelSteps.length === 0) {
             advanceImmediately = true;
        }
        // Otherwise, completion is checked in update()
        break;
       case SequenceStepType.SEQUENCE:
           nextStep.sequencer.reset();
           nextStep.sequencer.play();
           if (nextStep.wait) {
               nextStep._instance = nextStep.sequencer;
           } else {
               advanceImmediately = true;
           }
           break;
      default:
        console.warn("AnimationSequencer: Unknown step type encountered during start.", nextStep);
        advanceImmediately = true; // Skip
        break;
    }

    // If the step was instant or non-waiting, advance again
    if (advanceImmediately) {
        // Prevent infinite loops for zero-duration waits or empty sequences
        if (this.currentStepIndex < this.steps.length -1 || this.loop) {
             this._startNextStep();
        } else {
             // Reached end with an instant step, handle completion/looping
             this.isFinished = true;
             this.isPlaying = false;
             if (this.onComplete) this.onComplete();
             if (this.loop) { // Need to handle loop explicitly if last step is instant
                 this.reset();
                 this.play();
             }
        }
    }
  }

   _initiateStep(stepConfig) {
       // Helper for PARALLEL steps
       switch (stepConfig.type) {
           case SequenceStepType.ANIMATION:
               stepConfig.target?.play?.(stepConfig.name, true);
               // Parallel steps always wait internally for the block to finish
               return { type: stepConfig.type, target: stepConfig.target, wait: true };
           case SequenceStepType.TWEEN:
               const tween = new Tween(stepConfig.target, stepConfig.properties, stepConfig.duration, stepConfig.options);
               if (this.tweenManager) this.tweenManager.add(tween);
               tween.play();
               return { type: stepConfig.type, instance: tween, wait: true };
           case SequenceStepType.SEQUENCE:
               stepConfig.sequencer.reset();
               stepConfig.sequencer.play();
               return { type: stepConfig.type, instance: stepConfig.sequencer, wait: true };
           case SequenceStepType.CALLBACK:
                try { stepConfig.callback(...(stepConfig.args ?? [])); }
                catch (e) { console.error("AnimationSequencer: Error executing parallel callback:", e); }
                return null; // Instant, doesn't contribute to waiting
           case SequenceStepType.WAIT:
                // TODO: Handle parallel waits properly - needs individual timers
                console.warn("AnimationSequencer: Parallel waits not fully supported yet.");
                // Treat as instant for now to avoid blocking parallel completion indefinitely
                return null;
           default:
               console.warn("AnimationSequencer: Unsupported step type in parallel block:", stepConfig);
               return null;
       }
   }

    _stopStep(stepConfig) {
        const instance = stepConfig._instance;
        switch (stepConfig.type) {
            case SequenceStepType.ANIMATION:
                stepConfig.target?.stop?.();
                break;
            case SequenceStepType.TWEEN:
                if (instance) {
                    instance.stop();
                    if (this.tweenManager) this.tweenManager.remove(instance);
                    delete stepConfig._instance;
                }
                break;
            case SequenceStepType.SEQUENCE:
                instance?.stop?.();
                delete stepConfig._instance;
                break;
            case SequenceStepType.PARALLEL:
                // Stop is handled by iterating activeParallelSteps in the main stop() method
                break;
        }
    }
}
