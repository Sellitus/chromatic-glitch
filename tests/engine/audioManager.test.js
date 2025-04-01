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
    // Mock AudioEngine
    mockBufferSource = {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      loop: false
    };

    mockAudioEngine = {
      audioContext: {
        currentTime: 0,
        state: 'running'
      },
      masterGain: {
        connect: jest.fn(),
        gain: { value: 1 }
      },
      loadAudioBuffer: jest.fn().mockImplementation(async (url) => {
        return { duration: 2.5 }; // Mock audio buffer
      }),
      playSound: jest.fn(),
      createBufferSource: jest.fn(() => mockBufferSource),
      suspend: jest.fn(),
      resume: jest.fn()
    };

    AudioEngine.mockImplementation(() => mockAudioEngine);

    // Create AudioManager instance with mocked AudioEngine
    audioManager = new AudioManager(mockAudioEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      mockAudioEngine.loadAudioBuffer.mockRejectedValue(error);
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
      const soundInfo = {
        source: mockBufferSource
      };
      audioManager.currentSound = soundInfo;
      audioManager.stopSound(soundInfo);
      expect(mockBufferSource.stop).toHaveBeenCalled();
    });

    test('handles stopping null/undefined sound gracefully', () => {
      expect(() => {
        audioManager.stopSound(null);
        audioManager.stopSound(undefined);
      }).not.toThrow();
    });
  });
});
