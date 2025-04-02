/**
 * Represents a single animation sequence using frames from a sprite sheet.
 */
export default class Animation {
  /**
   * Creates an Animation instance.
   * @param {string} name - A unique name for this animation (e.g., 'player_walk_down').
   * @param {string} spriteSheetId - The ID of the sprite sheet asset containing the frames.
   * @param {number[]} frames - An array of frame indices within the sprite sheet.
   * @param {number} frameDuration - Duration each frame is displayed (in seconds).
   * @param {boolean} [loop=true] - Whether the animation should loop.
   * @param {number} [speed=1] - Playback speed multiplier.
   */
  constructor(name, spriteSheetId, frames, frameDuration, loop = true, speed = 1) {
    if (!name || !spriteSheetId || !frames || frames.length === 0 || frameDuration <= 0) {
      throw new Error('Invalid arguments for Animation constructor');
    }

    this.name = name;
    this.spriteSheetId = spriteSheetId;
    this.frames = frames; // Indices of frames in the SpriteSheet
    this.frameDuration = frameDuration; // Seconds per frame
    this.loop = loop;
    this.speed = speed;

    this.totalDuration = this.frames.length * this.frameDuration;
    this.currentTime = 0;
    this.currentFrameIndex = 0;
    this.isPlaying = false;
    this.isFinished = false;
  }

  /**
   * Starts or resumes playback.
   * @param {boolean} [fromStart=false] - If true, resets the animation to the beginning before playing.
   */
  play(fromStart = false) {
    if (fromStart) {
      this.reset();
    }
    this.isPlaying = true;
    this.isFinished = false;
  }

  /**
   * Pauses playback.
   */
  pause() {
    this.isPlaying = false;
  }

  /**
   * Stops playback and resets to the beginning.
   */
  stop() {
    this.isPlaying = false;
    this.reset();
  }

  /**
   * Resets the animation to its initial state.
   */
  reset() {
    this.currentTime = 0;
    this.currentFrameIndex = 0;
    this.isFinished = false;
  }

  /**
   * Updates the animation state based on the elapsed time.
   * @param {number} deltaTime - Time elapsed since the last update (in seconds).
   */
  update(deltaTime) {
    if (!this.isPlaying || this.frames.length === 0 || this.isFinished) {
      return;
    }

    this.currentTime += deltaTime * this.speed;

    if (this.currentTime >= this.totalDuration) {
      if (this.loop) {
        this.currentTime = this.currentTime % this.totalDuration;
        // Ensure frame index calculation is correct after looping
        this.currentFrameIndex = Math.floor(this.currentTime / this.frameDuration);
      } else {
        // Clamp to the last frame if not looping
        this.currentTime = this.totalDuration;
        this.currentFrameIndex = this.frames.length - 1;
        this.isPlaying = false;
        this.isFinished = true;
      }
    } else {
      this.currentFrameIndex = Math.floor(this.currentTime / this.frameDuration);
    }

    // Ensure frame index is within bounds (can happen with floating point inaccuracies)
    this.currentFrameIndex = Math.max(0, Math.min(this.currentFrameIndex, this.frames.length - 1));
  }

  /**
   * Gets the index of the current frame within the sprite sheet.
   * @returns {number} The index of the current frame.
   */
  getCurrentFrame() {
    return this.frames[this.currentFrameIndex];
  }

  /**
   * Sets the playback speed.
   * @param {number} speed - The new speed multiplier.
   */
  setSpeed(speed) {
    this.speed = Math.max(0, speed); // Speed cannot be negative
  }
}
