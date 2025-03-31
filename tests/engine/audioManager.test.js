/**
 * Audio manager tests
 */
import { AudioManager } from '../../src/js/engine/audioManager';

describe('AudioManager', () => {
  let audioManager;
  let mockAudioContext;
  let mockBufferSource;
  let addEventListenerSpy;

  beforeEach(() => {
    // Mock AudioContext and its methods
    mockBufferSource = {
      buffer: null,
      connect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      loop: false
    };

    mockAudioContext = {
      createBufferSource: jest.fn(() => mockBufferSource),
      decodeAudioData: jest.fn((arrayBuffer) => Promise.resolve({ duration: 2.5 })),
      destination: { id: 'destination' }
    };

    // Mock constructor functions
    global.AudioContext = jest.fn(() => mockAudioContext);
    global.webkitAudioContext = jest.fn(() => mockAudioContext);

    // Mock window.addEventListener
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');

    // Create AudioManager instance
    audioManager = new AudioManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes with empty state', () => {
      expect(audioManager.sounds.size).toBe(0);
      expect(audioManager.music.size).toBe(0);
      expect(audioManager.currentMusic).toBeNull();
    });

    test('creates AudioContext on user interaction', () => {
      audioManager.init();
      expect(audioManager.audioContext).toBeUndefined();

      // Simulate click event
      const clickEvent = new MouseEvent('click');
      window.dispatchEvent(clickEvent);

      expect(global.AudioContext).toHaveBeenCalled();
      expect(audioManager.audioContext).toBeDefined();
    });

    test('handles browsers with webkitAudioContext', () => {
      const originalAudioContext = global.AudioContext;
      global.AudioContext = undefined;
      
      const newAudioManager = new AudioManager();
      newAudioManager.init();

      // Simulate click event
      const clickEvent = new MouseEvent('click');
      window.dispatchEvent(clickEvent);

      expect(global.webkitAudioContext).toHaveBeenCalled();
      expect(newAudioManager.audioContext).toBeDefined();

      global.AudioContext = originalAudioContext;
    });
  });

  describe('Sound Loading', () => {
    beforeEach(async () => {
      // Initialize AudioContext
      audioManager.init();
      const clickEvent = new MouseEvent('click');
      window.dispatchEvent(clickEvent);

      // Mock successful fetch response
      global.fetch = jest.fn().mockResolvedValue({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
      });
    });

    test('loads sound successfully', async () => {
      await audioManager.loadSound('test-sound', 'audio/test.mp3');

      expect(global.fetch).toHaveBeenCalledWith('audio/test.mp3');
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
      expect(audioManager.sounds.get('test-sound')).toBeDefined();
    });

    test('loads music successfully', async () => {
      await audioManager.loadMusic('test-music', 'audio/test.mp3');

      expect(global.fetch).toHaveBeenCalledWith('audio/test.mp3');
      expect(mockAudioContext.decodeAudioData).toHaveBeenCalled();
      expect(audioManager.music.get('test-music')).toBeDefined();
    });

    test('handles loading errors', async () => {
      const error = new Error('Failed to load audio');
      global.fetch = jest.fn().mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await audioManager.loadSound('test-sound', 'audio/test.mp3');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error loading sound test-sound:'),
        error
      );
      expect(audioManager.sounds.has('test-sound')).toBe(false);
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      // Initialize AudioContext
      audioManager.init();
      const clickEvent = new MouseEvent('click');
      window.dispatchEvent(clickEvent);

      const mockAudioBuffer = { duration: 2.5 };
      audioManager.sounds.set('test-sound', mockAudioBuffer);
      audioManager.music.set('test-music', mockAudioBuffer);
    });

    test('plays sound correctly', () => {
      audioManager.playSound('test-sound');

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockBufferSource.buffer).toBeDefined();
      expect(mockBufferSource.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockBufferSource.start).toHaveBeenCalled();
    });

    test('plays music correctly', () => {
      audioManager.playMusic('test-music', true);

      expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
      expect(mockBufferSource.buffer).toBeDefined();
      expect(mockBufferSource.loop).toBe(true);
      expect(mockBufferSource.connect).toHaveBeenCalledWith(mockAudioContext.destination);
      expect(mockBufferSource.start).toHaveBeenCalled();
      expect(audioManager.currentMusic).toBe(mockBufferSource);
    });

    test('stops current music before playing new music', () => {
      // Play first music track
      audioManager.playMusic('test-music', true);
      const firstSource = mockBufferSource;
      
      // Create new mock for second music track
      const secondSource = { ...mockBufferSource };
      mockAudioContext.createBufferSource.mockReturnValueOnce(secondSource);

      // Play second music track
      audioManager.playMusic('test-music', true);

      expect(firstSource.stop).toHaveBeenCalled();
      expect(audioManager.currentMusic).toBe(secondSource);
    });

    test('stops music correctly', () => {
      audioManager.playMusic('test-music', true);
      const source = mockBufferSource;

      audioManager.stopMusic();

      expect(source.stop).toHaveBeenCalled();
      expect(audioManager.currentMusic).toBeNull();
    });

    test('handles non-existent sound/music gracefully', () => {
      audioManager.playSound('nonexistent');
      audioManager.playMusic('nonexistent');

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    test('handles missing AudioContext gracefully', () => {
      audioManager.audioContext = undefined;

      audioManager.playSound('test-sound');
      audioManager.playMusic('test-music');

      expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });
  });
});
