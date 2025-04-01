import Component from "../Component.js";

/**
 * Component for managing entity audio (sound effects and music)
 */
export default class AudioComponent extends Component {
  constructor() {
    super();
    this.sounds = new Map(); // Map<string, AudioConfig>
    this.currentlyPlaying = new Set(); // Set<string> of currently playing sound IDs
    this.volume = 1;
    this.muted = false;
  }

  /**
   * Audio configuration object
   * @typedef {Object} AudioConfig
   * @property {string} assetId - Asset ID or URL of the audio file
   * @property {boolean} loop - Whether the sound should loop
   * @property {number} volume - Volume multiplier (0-1)
   * @property {number} pitch - Pitch multiplier (0.5-2)
   * @property {number} [minDistance] - Distance at which volume starts to decrease
   * @property {number} [maxDistance] - Distance at which volume reaches zero
   * @property {boolean} [spatialize] - Whether to apply 3D audio spatialization
   */

  /**
   * Register a sound that this entity can play
   * @param {string} id - Unique identifier for this sound
   * @param {string} assetId - Asset ID or URL of the audio file
   * @param {Object} options - Sound options
   * @param {boolean} [options.loop=false] - Whether the sound should loop
   * @param {number} [options.volume=1] - Volume multiplier
   * @param {number} [options.pitch=1] - Pitch multiplier
   * @param {number} [options.minDistance] - Distance for spatial audio
   * @param {number} [options.maxDistance] - Maximum distance for spatial audio
   * @param {boolean} [options.spatialize=false] - Whether to enable 3D audio
   */
  registerSound(id, assetId, options = {}) {
    this.sounds.set(id, {
      assetId,
      loop: options.loop ?? false,
      volume: options.volume ?? 1,
      pitch: options.pitch ?? 1,
      minDistance: options.minDistance,
      maxDistance: options.maxDistance,
      spatialize: options.spatialize ?? false
    });
  }

  /**
   * Play a registered sound
   * @param {string} id - ID of the sound to play
   * @param {Object} [options] - Optional overrides for this play instance
   * @returns {boolean} True if sound was started
   */
  playSound(id, options = {}) {
    const sound = this.sounds.get(id);
    if (!sound || this.muted) return false;

    // Combine default config with play options
    const config = {
      ...sound,
      ...options,
      volume: (options.volume ?? sound.volume) * this.volume
    };

    // In a real implementation, this would interact with the audio system
    // to actually play the sound. For now, we just track that it's playing.
    this.currentlyPlaying.add(id);
    return true;
  }

  /**
   * Stop a currently playing sound
   * @param {string} id - ID of sound to stop
   */
  stopSound(id) {
    if (this.currentlyPlaying.has(id)) {
      // In real implementation: stop the actual audio
      this.currentlyPlaying.delete(id);
    }
  }

  /**
   * Stop all sounds being played by this entity
   */
  stopAllSounds() {
    for (const id of this.currentlyPlaying) {
      this.stopSound(id);
    }
  }

  /**
   * Check if a sound is currently playing
   * @param {string} id - Sound ID to check
   * @returns {boolean} True if sound is playing
   */
  isPlaying(id) {
    return this.currentlyPlaying.has(id);
  }

  /**
   * Set the volume for all sounds from this entity
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    // In real implementation: update volume of all playing sounds
  }

  /**
   * Mute/unmute all sounds from this entity
   * @param {boolean} muted - Whether to mute
   */
  setMuted(muted) {
    this.muted = muted;
    if (muted) {
      this.stopAllSounds();
    }
  }

  /**
   * Update method for managing sound states
   * @param {number} deltaTime - Time elapsed since last update
   */
  onUpdate(deltaTime) {
    // In a real implementation, this would update spatial audio
    // parameters based on entity position, etc.
  }

  /**
   * Called when component is detached from entity
   */
  onDetach() {
    this.stopAllSounds();
    super.onDetach();
  }

  /**
   * Serialize the component's data
   * @returns {Object} JSON-serializable object
   */
  serialize() {
    const soundsData = {};
    for (const [id, config] of this.sounds) {
      soundsData[id] = { ...config };
    }

    return {
      ...super.serialize(),
      sounds: soundsData,
      volume: this.volume,
      muted: this.muted
    };
  }

  /**
   * Deserialize data into the component
   * @param {Object} data - Data to deserialize from
   */
  deserialize(data) {
    this.sounds.clear();
    this.currentlyPlaying.clear();
    
    if (data.sounds) {
      for (const [id, config] of Object.entries(data.sounds)) {
        this.sounds.set(id, { ...config });
      }
    }

    this.volume = data.volume ?? 1;
    this.muted = data.muted ?? false;
  }
}
