/**
 * Audio manager tests
 */
import { AudioManager } from '../../src/js/engine/audioManager';
import { AudioEngine } from '../../src/js/engine/AudioEngine';

jest.mock('../../src/js/engine/AudioEngine');

describe('AudioManager', () => {
  let audioManager;
  let mockAudioEngine;
  let mockBufferSource;

  beforeEach(() => {
    // Clear the mock state before each test
    AudioEngine.mockClear();

    // Create a fresh mock instance using the mocked constructor
    // AudioEngine is globally mocked by jest.mock at the top
    mockAudioEngine = new AudioEngine();

    // Configure the mock instance's methods and properties for this suite
    // Use the global MockAudioContext from jest.setup.js for consistency
    const mockCtx = new window.AudioContext();
    mockAudioEngine.audioContext = mockCtx;
    mockAudioEngine.masterGain = mockCtx.createGain(); // Use the mock context's createGain

    mockAudioEngine.loadAudioBuffer.mockImplementation(async (url) => {
      if (url.includes('fail')) {
        throw new Error('Failed to load audio');
      }
      // Return a buffer created by the mock context
      return mockCtx.createBuffer(2, 44100, 44100);
    });

    mockAudioEngine.playSound.mockImplementation((buffer, options) => {
      // Return a structure consistent with AudioEngine.playSound
      return {
        source: mockCtx.createBufferSource(),
        gainNode: mockCtx.createGain()
      };
    });

    // Create AudioManager instance with mocked AudioEngine
    audioManager = new AudioManager(mockAudioEngine);
  });

  afterEach(() => {
    // mockClear in beforeEach should suffice
  });

  describe('Initialization', () => {
    test('initializes with empty state', () => {
      expect(audioManager.sounds.size).toBe(0);
      expect(audioManager.activeMusic).toBeNull();
    });

    test('throws error without AudioEngine', () => {
      expect(() => new AudioManager()).toThrow('AudioEngine instance is required');
    });
  });

  describe('Sound Loading', () => {
    test('loads sound successfully', async () => {
      await audioManager.loadSound('test-sound', 'audio/test.mp3');
      expect(mockAudioEngine.loadAudioBuffer).toHaveBeenCalledWith('audio/test.mp3');
      expect(audioManager.sounds.get('test-sound')).toBeDefined();
    });

    test('handles loading errors', async () => {
      const error = new Error('Failed to load audio');
      mockAudioEngine.loadAudioBuffer.mockRejectedValueOnce(error); // Use Once for specific test
      await expect(audioManager.loadSound('test-sound', 'audio/test.mp3'))
        .rejects.toThrow('Failed to load audio');
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      await audioManager.loadSound('test-sound', 'audio/test.mp3');
    });

    test('plays sound correctly', () => {
      const options = { volume: 1, loop: false };
      audioManager.playSound('test-sound', options);

      expect(mockAudioEngine.playSound).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining(options)
      );
    });

    test('handles non-existent sound gracefully', () => {
      audioManager.playSound('nonexistent');
      expect(mockAudioEngine.playSound).not.toHaveBeenCalled();
    });

    test('handles sound with volume and loop options', () => {
      const options = {
        volume: 0.5,
        loop: true
      };

      audioManager.playSound('test-sound', options);
      expect(mockAudioEngine.playSound).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining(options)
      );
    });

    test('handles stopping sounds', () => {
      // Get the object returned by the mocked playSound
      const playedSoundInfo = audioManager.playSound('test-sound');
      expect(playedSoundInfo).toBeDefined();
      expect(playedSoundInfo.source).toBeDefined();
      expect(playedSoundInfo.gainNode).toBeDefined();

      // Pass the actual returned object to stopSound
      // The source inside is a mock from the global setup via playSound mock
      audioManager.stopSound(playedSoundInfo); // Use the correct variable
      expect(playedSoundInfo.source.stop).toHaveBeenCalled(); // Check stop on the returned source
      expect(playedSoundInfo.source.disconnect).toHaveBeenCalled(); // Check disconnect on the returned source
    });

    test('handles stopping null/undefined sound gracefully', () => {
      expect(() => {
        audioManager.stopSound(null);
        audioManager.stopSound(undefined);
      }).not.toThrow();
    });
  });
});
