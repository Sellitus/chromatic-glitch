import { MusicTrack } from '../../src/js/engine/MusicTrack';
import { AudioEngine } from '../../src/js/engine/AudioEngine';

// Mock Web Audio API
class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
  }

  createGain() {
    return {
      gain: {
        value: 1,
        exponentialRampToValueAtTime: jest.fn()
      },
      connect: jest.fn(),
      disconnect: jest.fn()
    };
  }

  createAnalyser() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      getByteFrequencyData: jest.fn(),
      getByteTimeDomainData: jest.fn()
    };
  }

  createBufferSource() {
    return {
      connect: jest.fn(),
      disconnect: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
      loop: false
    };
  }
}

// Mock AudioEngine
jest.mock('../../src/js/engine/AudioEngine');

describe('MusicTrack', () => {
  let audioEngine;
  let musicTrack;
  let mockContext;

  beforeEach(() => {
    mockContext = new MockAudioContext();
    AudioEngine.mockImplementation(() => {
      return {
        audioContext: mockContext,
        masterGain: mockContext.createGain(),
        createGainNode: () => mockContext.createGain(),
        createAnalyser: () => mockContext.createAnalyser(),
        createBufferSource: jest.fn().mockImplementation((buffer) => {
          const source = mockContext.createBufferSource();
          source.buffer = buffer;
          return source;
        }),
        loadAudioBuffer: jest.fn().mockImplementation(async (url) => {
          return { duration: 10 }; // Mock audio buffer
        }),
        getFrequencyData: jest.fn(),
        getTimeDomainData: jest.fn()
      };
    });

    audioEngine = new AudioEngine();
    musicTrack = new MusicTrack(audioEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should throw if AudioEngine not provided', () => {
      expect(() => new MusicTrack()).toThrow('AudioEngine instance is required');
    });

    it('should initialize with default values', () => {
      expect(musicTrack.stems.size).toBe(0);
      expect(musicTrack.isPlaying).toBe(false);
      expect(musicTrack.loop).toBe(false);
    });
  });

  describe('addStem', () => {
    it('should load and add a new stem', async () => {
      const stem = await musicTrack.addStem('drums', 'drums.mp3');
      expect(stem).toBeDefined();
      expect(musicTrack.stems.size).toBe(1);
      expect(musicTrack.stems.get('drums')).toBe(stem);
    });

    it('should throw on loading error', async () => {
      audioEngine.loadAudioBuffer.mockRejectedValue(new Error('Load failed'));
      await expect(musicTrack.addStem('drums', 'drums.mp3')).rejects.toThrow('Load failed');
    });
  });

  describe('playback control', () => {
    beforeEach(async () => {
      await musicTrack.addStem('drums', 'drums.mp3');
      await musicTrack.addStem('bass', 'bass.mp3');
    });

    it('should start all stems simultaneously', () => {
      musicTrack.play();
      expect(musicTrack.isPlaying).toBe(true);
      
      const stems = Array.from(musicTrack.stems.values());
      stems.forEach(stem => {
        expect(stem.sourceNode.start).toHaveBeenCalled();
      });
    });

    it('should stop all stems', async () => {
      // Setup stems
      await musicTrack.addStem('drums', 'drums.mp3');
      await musicTrack.addStem('bass', 'bass.mp3');
      
      // Play and stop
      musicTrack.play();
      
      // Get references to source nodes before stopping
      const stems = Array.from(musicTrack.stems.values());
      const sourceNodes = stems.map(stem => stem.sourceNode);
      
      // Stop playback
      musicTrack.stop();
      
      // Verify state
      expect(musicTrack.isPlaying).toBe(false);
      sourceNodes.forEach(sourceNode => {
        expect(sourceNode.stop).toHaveBeenCalled();
        expect(sourceNode.disconnect).toHaveBeenCalled();
      });
      
      // Verify source nodes were cleared
      stems.forEach(stem => {
        expect(stem.sourceNode).toBeNull();
      });
    });

    it('should handle stem volume changes', () => {
      musicTrack.setStemVolume('drums', 0.5);
      const stem = musicTrack.stems.get('drums');
      expect(stem.originalVolume).toBe(0.5);
    });

    it('should handle stem muting', () => {
      musicTrack.setStemMute('drums', true);
      const stem = musicTrack.stems.get('drums');
      expect(stem.isMuted).toBe(true);
    });

    it('should handle stem soloing', () => {
      musicTrack.setStemSolo('drums', true);
      const drumsStem = musicTrack.stems.get('drums');
      const bassStem = musicTrack.stems.get('bass');
      expect(drumsStem.isSoloed).toBe(true);
      expect(bassStem.isMuted).toBe(true);
    });
  });

  describe('looping', () => {
    beforeEach(async () => {
      await musicTrack.addStem('drums', 'drums.mp3');
    });

    it('should set loop state for all stems', () => {
      musicTrack.setLooping(true);
      expect(musicTrack.loop).toBe(true);
      
      musicTrack.play();
      const stem = musicTrack.stems.get('drums');
      expect(stem.sourceNode.loop).toBe(true);
    });
  });

  describe('cleanup', () => {
    beforeEach(async () => {
      await musicTrack.addStem('drums', 'drums.mp3');
    });

    it('should properly cleanup resources on unload', () => {
      musicTrack.play();
      musicTrack.unload();
      expect(musicTrack.stems.size).toBe(0);
    });
  });
});
