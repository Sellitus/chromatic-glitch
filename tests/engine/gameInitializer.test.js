import { GameInitializer } from '../../src/js/engine/gameInitializer';
import { AudioEngine } from '../../src/js/engine/AudioEngine';
import { AudioManager } from '../../src/js/engine/audioManager';
import { MusicTrack } from '../../src/js/engine/MusicTrack';
import { GameState } from '../../src/js/engine/gameState';
import { AssetManager } from '../../src/js/engine/assetManager';
import { InputHandler } from '../../src/js/engine/inputHandler';
import { DebugRenderer } from '../../src/js/engine/debugRenderer';
import { EventSystem } from '../../src/js/engine/eventSystem';
import { SceneManager } from '../../src/js/engine/sceneManager';
import { GameLoop } from '../../src/js/engine/gameLoop';

import { mockInputHandler } from './inputHandler.test.mock';
import { mockDebugRenderer } from './debugRenderer.test.mock';
import { mockEventSystem } from './eventSystem.test.mock';
import { mockSceneManager } from './sceneManager.test.mock';
import { mockGameLoop } from './gameLoop.test.mock';

// Mock createGameStore
jest.mock('../../src/js/state', () => ({
  createGameStore: jest.fn(() => ({
    dispatch: jest.fn(),
    getState: jest.fn(),
    subscribe: jest.fn()
  }))
}));

// Mock all dependencies
jest.mock('../../src/js/engine/AudioEngine');
jest.mock('../../src/js/engine/audioManager');
jest.mock('../../src/js/engine/MusicTrack');
jest.mock('../../src/js/engine/gameState');
jest.mock('../../src/js/engine/assetManager');
jest.mock('../../src/js/engine/inputHandler', () => ({
  InputHandler: jest.fn(() => mockInputHandler)
}));
jest.mock('../../src/js/engine/debugRenderer', () => ({
  DebugRenderer: jest.fn(() => mockDebugRenderer)
}));
jest.mock('../../src/js/engine/eventSystem', () => ({
  EventSystem: jest.fn(() => mockEventSystem)
}));
jest.mock('../../src/js/engine/sceneManager', () => ({
  SceneManager: jest.fn(() => mockSceneManager)
}));
jest.mock('../../src/js/engine/gameLoop', () => ({
  GameLoop: jest.fn(() => mockGameLoop)
}));

describe('GameInitializer', () => {
  let gameInitializer;
  let mockAudioEngine;
  let mockGameState;
  let mockAssetManager;
  let addEventListenerSpy;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock document.addEventListener
    addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    // Setup mock instances
    mockAudioEngine = {
      init: jest.fn().mockResolvedValue(undefined),
      suspend: jest.fn(),
      resume: jest.fn(),
      audioContext: {
        currentTime: 0,
        state: 'running'
      },
      masterGain: {
        connect: jest.fn(),
        gain: { value: 1 }
      }
    };

    mockGameState = { debug: false };
    mockAssetManager = {
      loadAudio: jest.fn()
    };

    // Setup mock implementations
    AudioEngine.mockImplementation(() => mockAudioEngine);
    AudioManager.mockImplementation(() => ({ init: jest.fn() }));
    GameState.mockImplementation(() => mockGameState);
    AssetManager.mockImplementation(() => mockAssetManager);

    gameInitializer = new GameInitializer();
  });

  describe('initialization', () => {
    it('should initialize all systems successfully', async () => {
      const success = await gameInitializer.initialize();
      
      expect(success).toBe(true);
      expect(AudioEngine).toHaveBeenCalled();
      expect(mockAudioEngine.init).toHaveBeenCalled();
      expect(AudioManager).toHaveBeenCalledWith(mockAudioEngine);
      expect(GameLoop).toHaveBeenCalled();
    });

    it('should handle initialization failures', async () => {
      mockAudioEngine.init.mockRejectedValue(new Error('Init failed'));
      
      const success = await gameInitializer.initialize();
      expect(success).toBe(false);
    });

    it('should register visibility change handler', async () => {
      await gameInitializer.initialize();
      
      expect(addEventListenerSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));

      // Test the handler
      const handler = addEventListenerSpy.mock.calls[0][1];
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      handler();
      expect(mockAudioEngine.suspend).toHaveBeenCalled();

      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      handler();
      expect(mockAudioEngine.resume).toHaveBeenCalled();
    });
  });

  describe('music track management', () => {
    beforeEach(async () => {
      await gameInitializer.initialize();
    });

    describe('createMusicTrack', () => {
      it('should create and load a music track with stems', async () => {
        const config = {
          name: 'testTrack',
          stems: {
            drums: 'drums.mp3',
            bass: 'bass.mp3'
          }
        };

        const mockTrack = {
          addStem: jest.fn().mockResolvedValue(undefined)
        };
        MusicTrack.mockImplementation(() => mockTrack);

        const track = await gameInitializer.createMusicTrack(config);

        expect(track).toBe(mockTrack);
        expect(MusicTrack).toHaveBeenCalledWith(mockAudioEngine);
        expect(mockTrack.addStem).toHaveBeenCalledTimes(2);
        expect(mockTrack.addStem).toHaveBeenCalledWith('drums', 'drums.mp3');
        expect(mockTrack.addStem).toHaveBeenCalledWith('bass', 'bass.mp3');
      });

      it('should handle stem loading failures', async () => {
        const config = {
          name: 'testTrack',
          stems: { drums: 'drums.mp3' }
        };

        const mockTrack = {
          addStem: jest.fn().mockRejectedValue(new Error('Load failed'))
        };
        MusicTrack.mockImplementation(() => mockTrack);

        await expect(gameInitializer.createMusicTrack(config)).rejects.toThrow('Load failed');
      });
    });

    describe('playMusicTrack', () => {
      it('should play a new track', async () => {
        const mockTrack = {
          setLooping: jest.fn(),
          play: jest.fn(),
          stems: new Map()
        };

        await gameInitializer.playMusicTrack(mockTrack);

        expect(mockTrack.setLooping).toHaveBeenCalledWith(true);
        expect(mockTrack.play).toHaveBeenCalled();
        expect(gameInitializer.currentMusic).toBe(mockTrack);
      });

      it('should handle track transition with fade out', async () => {
        jest.useFakeTimers();

        // Setup current track
        const currentTrack = {
          stems: new Map([
            ['drums', { setVolume: jest.fn() }],
            ['bass', { setVolume: jest.fn() }]
          ]),
          stop: jest.fn()
        };
        gameInitializer.currentMusic = currentTrack;

        // Setup new track
        const newTrack = {
          setLooping: jest.fn(),
          play: jest.fn(),
          stems: new Map()
        };

        const playPromise = gameInitializer.playMusicTrack(newTrack, { fadeOutDuration: 0.5 });
        jest.advanceTimersByTime(500);
        await playPromise;

        Array.from(currentTrack.stems.values()).forEach(stem => {
          expect(stem.setVolume).toHaveBeenCalledWith(0, 0.5);
        });
        expect(currentTrack.stop).toHaveBeenCalled();
        expect(newTrack.setLooping).toHaveBeenCalledWith(true);
        expect(newTrack.play).toHaveBeenCalled();

        jest.useRealTimers();
      });
    });

    describe('stopMusic', () => {
      it('should stop current track with fade out', async () => {
        jest.useFakeTimers();

        const mockTrack = {
          stems: new Map([
            ['drums', { setVolume: jest.fn() }]
          ]),
          stop: jest.fn()
        };
        gameInitializer.currentMusic = mockTrack;

        const stopPromise = gameInitializer.stopMusic(0.5);
        jest.advanceTimersByTime(500);
        await stopPromise;

        expect(mockTrack.stems.get('drums').setVolume).toHaveBeenCalledWith(0, 0.5);
        expect(mockTrack.stop).toHaveBeenCalled();
        expect(gameInitializer.currentMusic).toBeNull();

        jest.useRealTimers();
      });

      it('should handle no current track', async () => {
        gameInitializer.currentMusic = null;
        await gameInitializer.stopMusic();
        expect(gameInitializer.currentMusic).toBeNull();
      });
    });
  });
});
