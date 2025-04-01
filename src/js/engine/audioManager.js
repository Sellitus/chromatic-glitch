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
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid sound name');
    }
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL');
    }
    if (this.sounds.has(name)) {
      console.warn(`Sound "${name}" already exists, it will be replaced`);
    }

    try {
      const buffer = await this.audioEngine.loadAudioBuffer(url).catch(error => {
        throw new Error(`Failed to load sound "${name}": ${error.message}`);
      });

      if (!buffer) {
        throw new Error(`No audio data received for sound "${name}"`);
      }

      this.sounds.set(name, buffer);
      return buffer;
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
      throw error;
    }
  }

  playSound(name, { volume = 1, loop = false } = {}) {
    if (!name || typeof name !== 'string') {
      console.warn('Invalid sound name provided');
      return null;
    }
    if (typeof volume !== 'number' || volume < 0) {
      console.warn('Invalid volume value, using default');
      volume = 1;
    }
    if (typeof loop !== 'boolean') {
      console.warn('Invalid loop value, using default');
      loop = false;
    }

    const buffer = this.sounds.get(name);
    if (!buffer) {
      console.warn(`Sound not found: ${name}`);
      return null;
    }

    try {
      return this.audioEngine.playSound(buffer, {
        volume: Math.min(Math.max(0, volume), 1), // Clamp between 0 and 1
        loop,
        onEnded: () => {
          // Could add sound completion tracking here if needed
        }
      });
    } catch (error) {
      console.error(`Error playing sound ${name}:`, error);
      return null;
    }
  }

  stopSound(soundInfo) {
    if (!soundInfo) {
      console.warn('No sound info provided to stop');
      return;
    }

    if (!soundInfo.source) {
      console.warn('Invalid sound info: no source node found');
      return;
    }

    try {
      soundInfo.source.stop();
      soundInfo.source.disconnect();
    } catch (error) {
      // Only log error if it's not the expected InvalidStateError
      // (which occurs when stopping an already-stopped sound)
      if (error.name !== 'InvalidStateError') {
        console.error('Error stopping sound:', error);
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
