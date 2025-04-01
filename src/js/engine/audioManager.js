/**
 * AudioManager - High-level audio management system.
 * Handles sound effects and provides an interface for music playback.
 * Delegates low-level audio operations to AudioEngine.
 */
export class AudioManager {
  constructor(audioEngine) {
    if (!audioEngine) {
      throw new Error('AudioEngine instance is required');
    }
    this.audioEngine = audioEngine;
    this.sounds = new Map(); // Map<name, AudioBuffer>
    this.activeMusic = null; // Reference to current MusicTrack
  }

  async loadSound(name, url) {
    try {
      const buffer = await this.audioEngine.loadAudioBuffer(url);
      this.sounds.set(name, buffer);
      return buffer;
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
      throw error;
    }
  }

  playSound(name, { volume = 1, loop = false } = {}) {
    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Sound not found: ${name}`);
      return null;
    }

    return this.audioEngine.playSound(buffer, {
      volume,
      loop,
      onEnded: (event) => {
        // Clean up any references if needed
      }
    });
  }

  stopSound(soundInfo) {
    if (soundInfo?.source) {
      try {
        soundInfo.source.stop();
      } catch (e) {
        if (e.name !== 'InvalidStateError') {
          console.error('Error stopping sound:', e);
        }
      }
    }
  }

  /**
   * Sets the master volume level
   * @param {number} level Volume level (0.0 to 1.0)
   */
  setMasterVolume(level) {
    this.audioEngine.setMasterVolume(level);
  }

  getMasterVolume() {
    return this.audioEngine.getMasterVolume();
  }
}
