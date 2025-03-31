export class AudioManager {
  constructor() {
    this.sounds = new Map();
    this.music = new Map();
    this.currentMusic = null;
  }

  init() {
    // Initialize audio context when needed (on user interaction)
    window.addEventListener('click', () => {
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }
    }, { once: true });
  }

  async loadSound(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.sounds.set(name, audioBuffer);
    } catch (error) {
      console.error(`Error loading sound ${name}:`, error);
    }
  }

  async loadMusic(name, url) {
    try {
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.music.set(name, audioBuffer);
    } catch (error) {
      console.error(`Error loading music ${name}:`, error);
    }
  }

  playSound(name) {
    if (!this.audioContext) return;
    
    const sound = this.sounds.get(name);
    if (sound) {
      const source = this.audioContext.createBufferSource();
      source.buffer = sound;
      source.connect(this.audioContext.destination);
      source.start();
    }
  }

  playMusic(name, loop = true) {
    if (!this.audioContext) return;
    
    if (this.currentMusic) {
      this.stopMusic();
    }

    const music = this.music.get(name);
    if (music) {
      const source = this.audioContext.createBufferSource();
      source.buffer = music;
      source.loop = loop;
      source.connect(this.audioContext.destination);
      source.start();
      this.currentMusic = source;
    }
  }

  stopMusic() {
    if (this.currentMusic) {
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }
}
