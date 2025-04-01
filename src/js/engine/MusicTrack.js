/**
 * Represents a single stem within a music track.
 * Manages the audio nodes and state for one instrument/layer.
 */
class Stem {
  constructor(name, audioBuffer, audioEngine) {
    this.name = name;
    this.audioBuffer = audioBuffer;
    this.audioEngine = audioEngine;
    this.sourceNode = null;
    this.gainNode = audioEngine.createGainNode(1.0);
    this.analyserNode = audioEngine.createAnalyser();
    this.originalVolume = 1.0;
    this.isMuted = false;
    this.isSoloed = false;

    // Connect analyser to gain node
    this.gainNode.connect(this.analyserNode);
    // Connect analyser to master gain
    this.analyserNode.connect(audioEngine.masterGain);
  }

  play(startTime = 0, loop = false) {
    if (this.sourceNode) {
      this.stop();
    }

    this.sourceNode = this.audioEngine.createBufferSource(this.audioBuffer);
    this.sourceNode.loop = loop;
    this.sourceNode.connect(this.gainNode);
    this.sourceNode.start(startTime);
  }

  stop() {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch (e) {
        if (e.name !== 'InvalidStateError') {
          console.error(`Error stopping stem ${this.name}:`, e);
        }
      }
      this.sourceNode = null;
    }
  }

  setVolume(value, fadeDuration = 0.05) {
    this.originalVolume = value;
    if (!this.isMuted) {
      const targetValue = Math.max(0.0001, value);
      this.gainNode.gain.exponentialRampToValueAtTime(
        targetValue,
        this.audioEngine.audioContext.currentTime + fadeDuration
      );
    }
  }

  mute(isMuted) {
    this.isMuted = isMuted;
    const targetValue = isMuted ? 0.0001 : this.originalVolume;
    this.gainNode.gain.exponentialRampToValueAtTime(
      targetValue,
      this.audioEngine.audioContext.currentTime + 0.05
    );
  }

  getVisualizationData() {
    return {
      frequency: this.audioEngine.getFrequencyData(this.analyserNode),
      timeDomain: this.audioEngine.getTimeDomainData(this.analyserNode)
    };
  }

  cleanup() {
    this.stop();
    this.gainNode.disconnect();
    this.analyserNode.disconnect();
  }
}

/**
 * MusicTrack - Manages a collection of synchronized audio stems.
 * Provides control over individual stems including volume, muting, and soloing.
 */
export class MusicTrack {
  constructor(audioEngine) {
    if (!audioEngine) {
      throw new Error('AudioEngine instance is required');
    }
    this.audioEngine = audioEngine;
    this.stems = new Map(); // Map<name, Stem>
    this.isPlaying = false;
    this.startTime = 0;
    this.loop = false;
  }

  /**
   * Adds a new stem to the track
   * @param {string} name Unique identifier for the stem
   * @param {string} url URL to the audio file
   */
  async addStem(name, url) {
    if (!name || typeof name !== 'string') {
      throw new Error('Invalid stem name');
    }
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL');
    }
    if (this.stems.has(name)) {
      console.warn(`Stem "${name}" already exists, it will be replaced`);
    }

    try {
      // First try to load the audio buffer
      const buffer = await this.audioEngine.loadAudioBuffer(url).catch(error => {
        throw new Error(`Failed to load audio for stem "${name}": ${error.message}`);
      });

      if (!buffer) {
        throw new Error(`No audio data received for stem "${name}"`);
      }

      // Then create and initialize the stem
      try {
        const stem = new Stem(name, buffer, this.audioEngine);
        this.stems.set(name, stem);
        return stem;
      } catch (stemError) {
        throw new Error(`Failed to initialize stem "${name}": ${stemError.message}`);
      }
    } catch (error) {
      console.error(`Error loading stem ${name}:`, error);
      throw error;
    }
  }

  /**
   * Starts playback of all stems
   * @param {number} [startTime=0] Time offset in seconds
   */
  play(startTime = 0) {
    if (this.isPlaying) {
      this.stop();
    }

    const audioContextStart = this.audioEngine.audioContext.currentTime;
    this.startTime = audioContextStart + (startTime || 0);

    for (const stem of this.stems.values()) {
      stem.play(this.startTime, this.loop);
    }

    this.isPlaying = true;
  }

  stop() {
    for (const stem of this.stems.values()) {
      stem.stop();
    }
    this.isPlaying = false;
  }

  /**
   * Sets the volume for a specific stem
   * @param {string} name Stem identifier
   * @param {number} volume Volume level (0.0 to 1.0)
   * @param {number} [fadeDuration=0.05] Fade duration in seconds
   */
  setStemVolume(name, volume, fadeDuration = 0.05) {
    const stem = this.stems.get(name);
    if (stem) {
      stem.setVolume(volume, fadeDuration);
    }
  }

  /**
   * Mutes or unmutes a specific stem
   * @param {string} name Stem identifier
   * @param {boolean} isMuted Whether to mute the stem
   */
  setStemMute(name, isMuted) {
    const stem = this.stems.get(name);
    if (stem) {
      stem.mute(isMuted);
    }
  }

  /**
   * Solos or unsolos a specific stem
   * @param {string} name Stem identifier
   * @param {boolean} isSoloed Whether to solo the stem
   */
  setStemSolo(name, isSoloed) {
    const targetStem = this.stems.get(name);
    if (!targetStem) return;

    targetStem.isSoloed = isSoloed;
    
    // Count how many stems are soloed
    const soloedStems = Array.from(this.stems.values()).filter(stem => stem.isSoloed);

    // If no stems are soloed, unmute all. Otherwise, mute non-soloed stems
    for (const stem of this.stems.values()) {
      if (soloedStems.length === 0) {
        stem.mute(false); // Unmute all if nothing is soloed
      } else {
        stem.mute(!stem.isSoloed); // Mute if not soloed
      }
    }
  }

  /**
   * Sets looping state for all stems
   * @param {boolean} shouldLoop Whether stems should loop
   */
  setLooping(shouldLoop) {
    this.loop = shouldLoop;
    if (this.isPlaying) {
      // Update loop state for currently playing stems
      for (const stem of this.stems.values()) {
        if (stem.sourceNode) {
          stem.sourceNode.loop = shouldLoop;
        }
      }
    }
  }

  /**
   * Gets visualization data for a specific stem
   * @param {string} name Stem identifier
   * @returns {Object} Frequency and time domain data
   */
  getStemAnalyser(name) {
    const stem = this.stems.get(name);
    if (stem) {
      return stem.getVisualizationData();
    }
    return null;
  }

  /**
   * Releases all resources
   */
  unload() {
    this.stop();
    for (const stem of this.stems.values()) {
      stem.cleanup();
    }
    this.stems.clear();
  }
}
