// Mock Event constructor for testing audio context initialization
global.Event = class {
  constructor(type) {
    this.type = type;
  }
};

// Mock window.AudioContext if not available in test environment
if (typeof window === 'undefined') {
  global.window = {};
}

// --- Enhanced AudioContext Mock ---

// Helper to create a mock AudioParam
const createMockAudioParam = (defaultValue = 0) => ({
  value: defaultValue,
  defaultValue: defaultValue,
  minValue: -3.4028234663852886e+38, // Standard min value
  maxValue: 3.4028234663852886e+38,  // Standard max value
  // Mock methods to update the value immediately for easier testing
  setValueAtTime: jest.fn(function(value, time) { this.value = value; }),
  linearRampToValueAtTime: jest.fn(function(value, time) { this.value = value; }),
  exponentialRampToValueAtTime: jest.fn(function(value, time) { this.value = value; }),
  setTargetAtTime: jest.fn(function(value, time, timeConstant) { this.value = value; }), // Simplistic mock
  setValueCurveAtTime: jest.fn(function(values, time, duration) { this.value = values[values.length - 1]; }), // Simplistic mock
  cancelScheduledValues: jest.fn(),
  cancelAndHoldAtTime: jest.fn(),
});

// Helper to create a base mock AudioNode
const createMockAudioNode = (context) => {
  const node = {
    // context: context, // Assign using Object.defineProperty instead
    numberOfInputs: 1, // Default assumptions
    numberOfOutputs: 1,
  channelCount: 2,
  channelCountMode: 'explicit',
  channelInterpretation: 'speakers',
  connect: jest.fn(),
  disconnect: jest.fn(),
  };
  // Make context non-enumerable to potentially avoid JSON serialization issues
  Object.defineProperty(node, 'context', {
    value: context,
    writable: true,
    enumerable: false, // Prevent JSON.stringify from seeing this property
    configurable: true,
  });
  return node;
};

// The Mock AudioContext Class
class MockAudioContext {
  constructor() {
    this.state = 'suspended';
    this.currentTime = 0; // Mock time
    this.sampleRate = 44100; // Common sample rate
    this.destination = { ...createMockAudioNode(this), maxChannelCount: 2 }; // Mock destination node
    this._mockNodes = []; // Track created nodes if needed
  }

  resume = jest.fn().mockResolvedValue(undefined).mockImplementation(() => {
    this.state = 'running';
    return Promise.resolve();
  });

  suspend = jest.fn().mockResolvedValue(undefined).mockImplementation(() => {
    this.state = 'suspended';
    return Promise.resolve();
  });

  close = jest.fn().mockResolvedValue(undefined).mockImplementation(() => {
    this.state = 'closed';
    return Promise.resolve();
  });

  createGain = jest.fn().mockImplementation(() => {
    const node = {
      ...createMockAudioNode(this),
      gain: createMockAudioParam(1), // Default gain is 1
    };
    this._mockNodes.push(node);
    return node;
  });

  createDelay = jest.fn().mockImplementation((maxDelayTime = 1.0) => {
     const node = {
      ...createMockAudioNode(this),
      delayTime: createMockAudioParam(0), // Default delayTime is 0
    };
    // Add maxValue property specific to DelayNode's delayTime AudioParam if needed by tests
    node.delayTime.maxValue = maxDelayTime;
    this._mockNodes.push(node);
    return node;
  });

  createBiquadFilter = jest.fn().mockImplementation(() => {
    const node = {
      ...createMockAudioNode(this),
      type: 'lowpass', // Default type
      frequency: createMockAudioParam(350),
      Q: createMockAudioParam(1),
      gain: createMockAudioParam(0), // Gain relevant for some filter types
      getFrequencyResponse: jest.fn(),
    };
    this._mockNodes.push(node);
    return node;
  });

  createConvolver = jest.fn().mockImplementation(() => {
    const node = {
      ...createMockAudioNode(this),
      buffer: null,
      normalize: true,
    };
    this._mockNodes.push(node);
    return node;
  });

   createWaveShaper = jest.fn().mockImplementation(() => {
    const node = {
      ...createMockAudioNode(this),
      curve: null,
      oversample: 'none', // Default oversample
    };
    this._mockNodes.push(node);
    return node;
  });

  createScriptProcessor = jest.fn().mockImplementation((bufferSize = 4096, numberOfInputChannels = 2, numberOfOutputChannels = 2) => {
     const node = {
        ...createMockAudioNode(this),
        bufferSize: bufferSize,
        numberOfInputChannels: numberOfInputChannels,
        numberOfOutputChannels: numberOfOutputChannels,
        onaudioprocess: null, // Event handler property
     };
     this._mockNodes.push(node);
     return node;
  });

  createBuffer = jest.fn().mockImplementation((numberOfChannels, length, sampleRate) => ({
    sampleRate: sampleRate,
    length: length,
    duration: length / sampleRate,
    numberOfChannels: numberOfChannels,
    getChannelData: jest.fn(() => new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  }));

  decodeAudioData = jest.fn().mockImplementation((audioData, successCallback, errorCallback) => {
    // Simulate successful decoding with a mock buffer
    const mockBuffer = this.createBuffer(2, 44100, this.sampleRate); // Example buffer
    if (successCallback) {
        // Call success callback asynchronously like the real API
        setTimeout(() => successCallback(mockBuffer), 0);
    }
    // Return a Promise that resolves with the mock buffer for the Promise-based syntax
    return Promise.resolve(mockBuffer);
  });

  // Add other methods as needed (createAnalyser, etc.)
}

// Assign the mock to window.AudioContext and window.webkitAudioContext
window.AudioContext = MockAudioContext;
window.webkitAudioContext = MockAudioContext;

// Mock AudioBuffer if not available
if (typeof AudioBuffer === 'undefined') {
    global.AudioBuffer = class MockAudioBuffer {
        constructor(options) {
            this.sampleRate = options?.sampleRate || 44100;
            this.length = options?.length || 0;
            this.duration = this.length / this.sampleRate;
            this.numberOfChannels = options?.numberOfChannels || 1;
        }
        getChannelData = jest.fn(() => new Float32Array(this.length));
        copyFromChannel = jest.fn();
        copyToChannel = jest.fn();
    };
}

// Mock ArrayBuffer if not available (less likely needed with modern Jest/JSDOM)
if (typeof ArrayBuffer === 'undefined') {
  global.ArrayBuffer = class MockArrayBuffer {
    constructor(length) {
      this.length = length;
    }
  };
}

// Add Jest-specific matchers if needed
expect.extend({
  toBeAudioNode(received) {
    const pass = received && typeof received.connect === 'function';
    return {
      message: () =>
        `expected ${received} to be an AudioNode (have a connect method)`,
      pass,
    };
  },
});
