import { AudioEngine } from './AudioEngine';
import { AudioManager } from './audioManager';
import { MusicTrack } from './MusicTrack';
import { SceneManager } from './sceneManager';
import { EventSystem } from './eventSystem';
import { GameLoop } from './gameLoop';
import { AssetManager } from './assetManager';
import { InputHandler } from './inputHandler';
import { DebugRenderer } from './debugRenderer';
import { createGameStore } from '../state';

export class GameInitializer {
  constructor() {
    this.store = null;
    this.sceneManager = null;
    this.audioEngine = null;
    this.audioManager = null;
    this.currentMusic = null;
  }

  async initialize() {
    try {
      // Initialize core systems
      this.audioEngine = new AudioEngine();
      await this.audioEngine.init();
      
      this.audioManager = new AudioManager(this.audioEngine);
      this.store = createGameStore({
        debug: process.env.NODE_ENV === 'development',
        persistence: true,
        history: true
      });
      this.assetManager = new AssetManager();
      this.inputHandler = new InputHandler();
      this.debugRenderer = new DebugRenderer();
      this.eventSystem = new EventSystem();
      
      // Create scene manager after other systems
      this.sceneManager = new SceneManager(
        this.store,
        this.audioManager,
        this.inputHandler,
        this.eventSystem
      );

      // Start game loop
      this.gameLoop = new GameLoop({
        update: this.update.bind(this),
        render: this.render.bind(this)
      });

      // Register audio state change handlers
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.audioEngine.suspend();
        } else {
          this.audioEngine.resume();
        }
      });

      console.log('Game initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize game:', error);
      return false;
    }
  }

  update(deltaTime) {
    this.sceneManager.update(deltaTime);
    this.inputHandler.update();
  }

  render() {
    this.sceneManager.render();
    if (process.env.NODE_ENV === 'development') {
      this.debugRenderer.render();
    }
  }

  /**
   * Creates and loads a new music track with stems
   * @param {Object} config Track configuration
   * @param {string} config.name Track identifier
   * @param {Object} config.stems Map of stem names to audio URLs
   * @returns {Promise<MusicTrack>} The loaded music track
   */
  async createMusicTrack({ name, stems }) {
    try {
      const track = new MusicTrack(this.audioEngine);
      
      // Load all stems
      const loadPromises = Object.entries(stems).map(
        ([stemName, url]) => track.addStem(stemName, url)
      );
      
      await Promise.all(loadPromises);
      
      return track;
    } catch (error) {
      console.error(`Failed to create music track ${name}:`, error);
      throw error;
    }
  }

  /**
   * Plays a music track, handling the transition from any currently playing track
   * @param {MusicTrack} track The track to play
   * @param {Object} options Playback options
   * @param {boolean} [options.loop=true] Whether to loop the track
   * @param {number} [options.fadeOutDuration=1] Duration to fade out current track
   */
  async playMusicTrack(track, { loop = true, fadeOutDuration = 1 } = {}) {
    if (this.currentMusic) {
      // Fade out and stop current track
      const stems = Array.from(this.currentMusic.stems.values());
      const fadePromises = stems.map(stem => {
        return new Promise(resolve => {
          stem.setVolume(0, fadeOutDuration);
          setTimeout(resolve, fadeOutDuration * 1000);
        });
      });
      
      await Promise.all(fadePromises);
      this.currentMusic.stop();
    }

    this.currentMusic = track;
    track.setLooping(loop);
    track.play();
  }

  /**
   * Stops the currently playing music track
   * @param {number} [fadeOutDuration=1] Duration to fade out in seconds
   */
  async stopMusic(fadeOutDuration = 1) {
    if (this.currentMusic) {
      const stems = Array.from(this.currentMusic.stems.values());
      const fadePromises = stems.map(stem => {
        return new Promise(resolve => {
          stem.setVolume(0, fadeOutDuration);
          setTimeout(resolve, fadeOutDuration * 1000);
        });
      });
      
      await Promise.all(fadePromises);
      this.currentMusic.stop();
      this.currentMusic = null;
    }
  }
}
