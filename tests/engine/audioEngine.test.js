describe('AudioEngine', () => {
  let audioEngine;
  
  // Mock window.AudioContext
  const mockCreateGain = jest.fn(() => ({
    connect: jest.fn(),
    gain: {
      value: 1,
      setValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      cancelScheduledValues: jest.fn()
    }
  }));

  const mockCreateBufferSource = jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    buffer: null,
    loop: false,
    onended: null
  }));

  const mockCreateAnalyser = jest.fn(() => ({
    connect: jest.fn(),
    fftSize: 2048,
    frequencyBinCount: 1024,
    getByteFrequencyData: jest.fn(),
    getByteTimeDomainData: jest.fn()
  }));

  const mockDecodeAudioData = jest.fn().mockResolvedValue('decodedBuffer');

  beforeEach(() => {
    jest.setTimeout(10000); // Increase timeout for all tests
    // Reset mocks
    jest.clearAllMocks();

    // Mock AudioContext
    window.AudioContext = jest.fn(() => ({
      createGain: mockCreateGain,
      createBufferSource: mockCreateBufferSource,
      createAnalyser: mockCreateAnalyser,
      createBiquadFilter: jest.fn(),
      createDelay: jest.fn(),
      createConvolver: jest.fn(),
      decodeAudioData: mockDecodeAudioData,
      destination: { connect: jest.fn() },
      currentTime: 0,
      state: 'running',
      suspend: jest.fn().mockResolvedValue(undefined),
      resume: jest.fn().mockResolvedValue(undefined),
      sampleRate: 44100
    }));

    // Import after setting up mocks
    const { AudioEngine } = require('../../src/js/engine/AudioEngine');
    audioEngine = new AudioEngine();
  });

  describe('Initialization', () => {
    it('should initialize with proper default values', () => {
      expect(audioEngine.audioContext).toBeNull();
      expect(audioEngine.masterGain).toBeNull();
      expect(audioEngine.isSuspended).toBe(true);
    });

    it('should initialize AudioContext on user interaction', async () => {
      const initPromise = audioEngine.init();
      // Create event using jsdom
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
      
      expect(audioEngine.audioContext).toBeTruthy();
      expect(audioEngine.masterGain).toBeTruthy();
      expect(window.AudioContext).toHaveBeenCalled();
    });
  });

  describe('Volume Control', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should set master volume with smooth transition', () => {
      audioEngine.setMasterVolume(0.5);
      expect(audioEngine.masterGain.gain.exponentialRampToValueAtTime).toHaveBeenCalled();
    });

    it('should get current master volume', () => {
      expect(audioEngine.getMasterVolume()).toBe(1);
    });
  });

  describe('Context State Management', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should suspend audio context', async () => {
      await audioEngine.suspend();
      expect(audioEngine.audioContext.suspend).toHaveBeenCalled();
      expect(audioEngine.isSuspended).toBe(true);
    });

    it('should resume audio context', async () => {
      audioEngine.isSuspended = true;
      audioEngine.audioContext.state = 'suspended';
      await audioEngine.resume();
      expect(audioEngine.audioContext.resume).toHaveBeenCalled();
      expect(audioEngine.isSuspended).toBe(false);
    });
  });

  describe('Audio Node Creation', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should create gain node', () => {
      const gainNode = audioEngine.createGainNode(0.5);
      expect(mockCreateGain).toHaveBeenCalled();
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0);
    });

    it('should create buffer source', () => {
      const buffer = {};
      const source = audioEngine.createBufferSource(buffer);
      expect(mockCreateBufferSource).toHaveBeenCalled();
      expect(source.buffer).toBe(buffer);
    });

    it('should create analyser node', () => {
      const analyser = audioEngine.createAnalyser();
      expect(mockCreateAnalyser).toHaveBeenCalled();
      expect(analyser).toBeTruthy();
    });
  });

  describe('Audio Routing', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should connect nodes in sequence', () => {
      const source = audioEngine.createBufferSource({});
      const gain = audioEngine.createGainNode();
      audioEngine.connectNodes([source, gain, audioEngine.masterGain]);
      expect(source.connect).toHaveBeenCalledWith(gain);
      expect(gain.connect).toHaveBeenCalledWith(audioEngine.masterGain);
    });

    it('should handle invalid nodes in chain', () => {
      const source = audioEngine.createBufferSource({});
      audioEngine.connectNodes([source, null, audioEngine.masterGain]);
      expect(source.connect).not.toHaveBeenCalled();
    });
  });

  describe('Sound Playback', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should play sound with effects chain', () => {
      const buffer = {};
      const analyser = audioEngine.createAnalyser();
      const result = audioEngine.playSound(buffer, { 
        volume: 0.5, 
        effectsChain: [analyser],
        loop: true 
      });
      
      expect(result.source.buffer).toBe(buffer);
      expect(result.source.loop).toBe(true);
      expect(result.source.start).toHaveBeenCalled();
    });

    it('should handle onEnded callback', () => {
      const buffer = {};
      const onEnded = jest.fn();
      const result = audioEngine.playSound(buffer, { onEnded });
      expect(result.source.onended).toBe(onEnded);
    });
  });

  describe('Crossfade', () => {
    beforeEach(async () => {
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should perform crossfade between two sources', () => {
      const sourceA = audioEngine.createBufferSource({});
      const sourceB = audioEngine.createBufferSource({});
      const gainA = audioEngine.createGainNode();
      const gainB = audioEngine.createGainNode();

      audioEngine.crossfade(
        { source: sourceA, gainNode: gainA },
        { source: sourceB, gainNode: gainB },
        1
      );

      expect(gainA.gain.linearRampToValueAtTime).toHaveBeenCalled();
      expect(gainB.gain.linearRampToValueAtTime).toHaveBeenCalled();
    });
  });

  describe('Audio Loading', () => {
    beforeEach(async () => {
      global.fetch = jest.fn(() => 
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(new ArrayBuffer(8))
        })
      );
      const initPromise = audioEngine.init();
      const clickEvent = document.createEvent('Event');
      clickEvent.initEvent('click', true, true);
      window.dispatchEvent(clickEvent);
      await initPromise;
    });

    it('should load and decode audio buffer', async () => {
      const url = 'test.mp3';
      const buffer = await audioEngine.loadAudioBuffer(url);
      
      expect(global.fetch).toHaveBeenCalledWith(url);
      expect(mockDecodeAudioData).toHaveBeenCalled();
      expect(buffer).toBe('decodedBuffer');
    });

    it('should handle loading errors', async () => {
      global.fetch = jest.fn(() => Promise.reject(new Error('Network error')));
      
      await expect(audioEngine.loadAudioBuffer('test.mp3'))
        .rejects
        .toThrow('Network error');
    });
  });
});
