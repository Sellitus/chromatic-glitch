import Animation from '../../../src/js/engine/animation/Animation.js';

describe('Animation', () => {
  let animation;
  const name = 'test_anim';
  const spriteSheetId = 'spritesheet_1';
  const frames = [0, 1, 2, 1];
  const frameDuration = 0.1; // 100ms per frame

  beforeEach(() => {
    animation = new Animation(name, spriteSheetId, frames, frameDuration);
  });

  it('should initialize with correct properties', () => {
    expect(animation.name).toBe(name);
    expect(animation.spriteSheetId).toBe(spriteSheetId);
    expect(animation.frames).toEqual(frames);
    expect(animation.frameDuration).toBe(frameDuration);
    expect(animation.loop).toBe(true);
    expect(animation.speed).toBe(1);
    expect(animation.totalDuration).toBeCloseTo(frames.length * frameDuration);
    expect(animation.currentTime).toBe(0);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.isPlaying).toBe(false);
    expect(animation.isFinished).toBe(false);
  });

   it('should throw error for invalid constructor arguments', () => {
    expect(() => new Animation(null, spriteSheetId, frames, frameDuration)).toThrow();
    expect(() => new Animation(name, null, frames, frameDuration)).toThrow();
    expect(() => new Animation(name, spriteSheetId, null, frameDuration)).toThrow();
    expect(() => new Animation(name, spriteSheetId, [], frameDuration)).toThrow();
    expect(() => new Animation(name, spriteSheetId, frames, 0)).toThrow();
    expect(() => new Animation(name, spriteSheetId, frames, -0.1)).toThrow();
  });

  it('should start playing', () => {
    animation.play();
    expect(animation.isPlaying).toBe(true);
    expect(animation.isFinished).toBe(false);
  });

  it('should start playing from the beginning if specified', () => {
    animation.play();
    animation.update(0.15); // Advance time
    expect(animation.currentTime).toBeGreaterThan(0);
    animation.play(true); // Play from start
    expect(animation.currentTime).toBe(0);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.isPlaying).toBe(true);
  });

  it('should pause playing', () => {
    animation.play();
    animation.pause();
    expect(animation.isPlaying).toBe(false);
  });

  it('should stop playing and reset', () => {
    animation.play();
    animation.update(0.15);
    animation.stop();
    expect(animation.isPlaying).toBe(false);
    expect(animation.currentTime).toBe(0);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.isFinished).toBe(false); // Should reset finished flag too
  });

  it('should update current time and frame index when playing', () => {
    animation.play();
    animation.update(0.05); // Halfway through first frame
    expect(animation.currentTime).toBeCloseTo(0.05);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.getCurrentFrame()).toBe(frames[0]);

    animation.update(0.06); // Past first frame, into second
    expect(animation.currentTime).toBeCloseTo(0.11);
    expect(animation.currentFrameIndex).toBe(1);
    expect(animation.getCurrentFrame()).toBe(frames[1]);
  });

   it('should handle update with speed multiplier', () => {
    animation.setSpeed(2);
    animation.play();
    animation.update(0.05); // Effective time = 0.1
    expect(animation.currentTime).toBeCloseTo(0.1);
    expect(animation.currentFrameIndex).toBe(1); // Should be on the second frame
    expect(animation.getCurrentFrame()).toBe(frames[1]);

    animation.update(0.05); // Effective time = 0.1 more (total 0.2)
    expect(animation.currentTime).toBeCloseTo(0.2);
    expect(animation.currentFrameIndex).toBe(2); // Should be on the third frame
    expect(animation.getCurrentFrame()).toBe(frames[2]);
  });

  it('should not update if not playing', () => {
    const initialTime = animation.currentTime;
    animation.update(0.1);
    expect(animation.currentTime).toBe(initialTime);
  });

  it('should loop correctly', () => {
    animation.play();
    animation.update(0.35); // Past the third frame (total duration 0.4)
    expect(animation.currentTime).toBeCloseTo(0.35);
    expect(animation.currentFrameIndex).toBe(3);
    expect(animation.getCurrentFrame()).toBe(frames[3]);

    animation.update(0.1); // Should loop (total time 0.45 -> effective 0.05)
    expect(animation.currentTime).toBeCloseTo(0.05);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.getCurrentFrame()).toBe(frames[0]);
    expect(animation.isPlaying).toBe(true);
    expect(animation.isFinished).toBe(false);
  });

  it('should finish and stop playing if not looping', () => {
    animation.loop = false;
    animation.play();
    animation.update(0.35); // Before end
    expect(animation.isPlaying).toBe(true);
    expect(animation.isFinished).toBe(false);

    animation.update(0.1); // Past the end
    expect(animation.currentTime).toBeCloseTo(animation.totalDuration); // Clamped to end
    expect(animation.currentFrameIndex).toBe(frames.length - 1); // Last frame
    expect(animation.getCurrentFrame()).toBe(frames[frames.length - 1]);
    expect(animation.isPlaying).toBe(false);
    expect(animation.isFinished).toBe(true);

    // Further updates should do nothing
    const finishedTime = animation.currentTime;
    animation.update(0.1);
    expect(animation.currentTime).toBe(finishedTime);
    expect(animation.isPlaying).toBe(false);
    expect(animation.isFinished).toBe(true);
  });

  it('should reset correctly', () => {
    animation.play();
    animation.update(0.25);
    animation.reset();
    expect(animation.currentTime).toBe(0);
    expect(animation.currentFrameIndex).toBe(0);
    expect(animation.isFinished).toBe(false);
    // isPlaying state is not affected by reset directly, only by stop() or play()
    expect(animation.isPlaying).toBe(true);
  });

   it('should set speed correctly', () => {
       animation.setSpeed(0.5);
       expect(animation.speed).toBe(0.5);
       animation.setSpeed(-1); // Should clamp to 0
       expect(animation.speed).toBe(0);
   });

   it('should handle edge case of updating exactly to the end when looping', () => {
       animation.play();
       animation.update(animation.totalDuration);
       // Should wrap around to the beginning
       expect(animation.currentTime).toBeCloseTo(0);
       expect(animation.currentFrameIndex).toBe(0);
       expect(animation.isPlaying).toBe(true);
       expect(animation.isFinished).toBe(false);
   });

    it('should handle edge case of updating exactly to the end when not looping', () => {
       animation.loop = false;
       animation.play();
       animation.update(animation.totalDuration);
       // Should stop at the end
       expect(animation.currentTime).toBeCloseTo(animation.totalDuration);
       expect(animation.currentFrameIndex).toBe(frames.length - 1);
       expect(animation.isPlaying).toBe(false);
       expect(animation.isFinished).toBe(true);
   });

});
