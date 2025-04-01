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

if (!window.AudioContext && !window.webkitAudioContext) {
  window.AudioContext = class MockAudioContext {
    constructor() {
      this.state = 'suspended';
      this.destination = { connect: jest.fn() };
    }
  };
  window.webkitAudioContext = window.AudioContext;
}

// Mock ArrayBuffer if not available
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
