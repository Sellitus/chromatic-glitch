import { ReverbEffect } from '../../../../src/js/engine/audio/effects/ReverbEffect';

// Ensure AudioBuffer is defined in the test scope, even if jest.setup.js provides it globally
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

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('ReverbEffect', () => {
    let audioContext;
    let reverbEffect;
    let mockConvolverNode;
    let mockWetGainNode;
    let mockDryGainNode;
    let mockAudioBuffer;

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Mock AudioBuffer needs to be defined before instantiating ReverbEffect if used in constructor
        mockAudioBuffer = {
            duration: 1.5, // Example duration
            numberOfChannels: 2,
            sampleRate: 44100,
            length: 44100 * 1.5,
            getChannelData: jest.fn().mockReturnValue(new Float32Array(44100 * 1.5)),
            copyFromChannel: jest.fn(),
            copyToChannel: jest.fn(),
        };

        // Instantiate the effect FIRST
        // Clear the mock functions *before* instantiation
        audioContext.createConvolver.mockClear();
        audioContext.createGain.mockClear();
        audioContext.createBuffer.mockClear(); // Also clear buffer creation

        // Clear any pre-existing mock node states if necessary
        const priorConvolver = audioContext.createConvolver.mock.results[0]?.value;
        if (priorConvolver) {
            priorConvolver.connect.mockClear();
        }
        const priorGains = audioContext.createGain.mock.results;
        priorGains.forEach(result => {
            const gainNode = result?.value;
            if (gainNode) {
                gainNode.gain.linearRampToValueAtTime.mockClear();
                gainNode.connect.mockClear();
            }
        });

        // Instantiate the effect
        reverbEffect = new ReverbEffect(audioContext); // Instantiates with default generated IR

        // Retrieve the mock nodes *after* instantiation
        mockConvolverNode = audioContext.createConvolver.mock.results[0]?.value;
        const allGainNodes = audioContext.createGain.mock.results;
        // Assuming EffectNode creates _input(0), _output(1), _bypassGain(2), _effectInput(3).
        // ReverbEffect creates convolver, wetGain(4), dryGain(5).
        mockWetGainNode = allGainNodes[4]?.value; // Index 4
        mockDryGainNode = allGainNodes[5]?.value; // Index 5

        // Don't clear connect mocks here for nodes created during instantiation
        // reverbEffect._effectInput?.connect.mockClear(); // Keep this if testing connections *after* setup
    });

    afterEach(() => {
        reverbEffect?.dispose();
    });

    test('should instantiate correctly and generate default IR', () => {
        expect(reverbEffect).toBeInstanceOf(ReverbEffect);
        // Check nodes were created and assigned
        expect(mockConvolverNode).toBeDefined();
        expect(mockWetGainNode).toBeDefined();
        expect(mockDryGainNode).toBeDefined();
        expect(reverbEffect.convolverNode).toBe(mockConvolverNode);
        expect(reverbEffect.wetGain).toBe(mockWetGainNode);
        expect(reverbEffect.dryGain).toBe(mockDryGainNode);

        // Simplified Check: Verify the internal nodes connect to the effect's output node (via wet/dry gains)
        expect(reverbEffect.convolverNode?.connect).toHaveBeenCalledWith(reverbEffect.wetGain);
        expect(reverbEffect.dryGain?.connect).toHaveBeenCalledWith(reverbEffect._output);
        expect(reverbEffect.wetGain?.connect).toHaveBeenCalledWith(reverbEffect._output);

        // Check default IR generation
        expect(mockConvolverNode?.buffer).toBeDefined();
        expect(mockConvolverNode?.buffer).not.toBeNull();
        expect(reverbEffect._impulseResponseInfo?.name).toBe('Generated Basic Reverb');

        // Check default mix parameter state by calling getParameters
        const defaultParams = reverbEffect.getParameters();
        expect(defaultParams.mix).toBeCloseTo(0.5);
        expect(defaultParams.impulseResponseInfo?.name).toBe('Generated Basic Reverb');
    });

    test('should instantiate with a provided impulse response', () => {
        reverbEffect?.dispose();
        audioContext.createBuffer.mockClear();
        audioContext.createConvolver.mockClear();
        audioContext.createGain.mockClear();

        reverbEffect = new ReverbEffect(audioContext, { impulseResponse: mockAudioBuffer });
        const newConvolverNode = audioContext.createConvolver.mock.results[0]?.value;

        expect(audioContext.createBuffer).not.toHaveBeenCalled();
        expect(newConvolverNode?.buffer).toBe(mockAudioBuffer);
        const params = reverbEffect.getParameters();
        expect(params.impulseResponseInfo?.name).toBe('Custom Impulse Response');
        expect(params.impulseResponseInfo?.duration).toBe(mockAudioBuffer.duration);
        expect(params.mix).toBeCloseTo(0.5);
    });

    test('setParameters should update mix with ramps', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        const params = { mix: 0.8 };
        const rampTime = 0.1;
        const expectedTargetTime = audioContext.currentTime + rampTime;

        reverbEffect.setParameters(params, rampTime);

        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.2), expectedTargetTime);
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.8), expectedTargetTime);
    });

    test('setParameters should update impulse response buffer', () => {
        if (!mockConvolverNode) throw new Error("Mock node not initialized");
        reverbEffect.setParameters({ impulseResponse: mockAudioBuffer });
        expect(mockConvolverNode.buffer).toBe(mockAudioBuffer);
        expect(reverbEffect.getParameters().impulseResponseInfo?.name).toBe('Custom Impulse Response');
    });

     test('setParameters should generate default IR if null is provided', () => {
        if (!mockConvolverNode) throw new Error("Mock node not initialized");
        reverbEffect?.dispose();
        audioContext.createConvolver.mockClear();
        audioContext.createGain.mockClear();
        audioContext.createBuffer.mockClear();
        reverbEffect = new ReverbEffect(audioContext, { impulseResponse: mockAudioBuffer });
        const customConvolverNode = audioContext.createConvolver.mock.results[0]?.value;
        expect(customConvolverNode?.buffer).toBe(mockAudioBuffer);
        audioContext.createBuffer.mockClear();

        reverbEffect.setParameters({ impulseResponse: null });
        expect(audioContext.createBuffer).toHaveBeenCalled();
        expect(reverbEffect.convolverNode?.buffer).toBeDefined();
        expect(reverbEffect.convolverNode?.buffer).not.toBe(mockAudioBuffer);
        expect(reverbEffect.getParameters().impulseResponseInfo?.name).toBe('Generated Basic Reverb');
    });

     test('setParameters should warn on invalid impulseResponse', () => {
        if (!mockConvolverNode) throw new Error("Mock node not initialized");
        const originalBuffer = mockConvolverNode.buffer;
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        reverbEffect.setParameters({ impulseResponse: "not-a-buffer" });

        expect(mockConvolverNode.buffer).toBe(originalBuffer);
        expect(consoleWarnSpy).toHaveBeenCalledWith("Invalid impulseResponse parameter. Must be an AudioBuffer or null.");
        consoleWarnSpy.mockRestore();
    });


    test('getParameters should return current mix and IR info', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testInfo = { name: 'Test IR', duration: 2.0 };
        reverbEffect.setParameters({ mix: 0.75 }, 0);
        reverbEffect._impulseResponseInfo = testInfo;

        const params = reverbEffect.getParameters();

        expect(params.mix).toBeCloseTo(0.75);
        expect(params.impulseResponseInfo).toEqual(testInfo);
    });

    test('toJSON should return serializable state (mix and IR info)', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testInfo = { name: 'Small Room IR', duration: 0.5 };
        reverbEffect.setParameters({ mix: 0.3 }, 0);
        reverbEffect._impulseResponseInfo = testInfo;

        const jsonResult = reverbEffect.toJSON();
        expect(jsonResult.mix).toBeCloseTo(0.3);
        expect(jsonResult.impulseResponseInfo).toEqual(testInfo);
    });

    test('fromJSON should set mix instantly and warn about IR', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
        const data = { mix: 0.9, impulseResponseInfo: { name: 'Hall Reverb', duration: 3.0 } };

        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.setValueAtTime.mockClear(); // Clear the correct mock

        reverbEffect.fromJSON(data);

        // Check that setValueAtTime was called for instant update
        expect(mockDryGainNode.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), audioContext.currentTime);
        expect(mockWetGainNode.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), audioContext.currentTime);
        expect(reverbEffect.getParameters().impulseResponseInfo).toEqual(data.impulseResponseInfo);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Impulse response must be set separately"));

        consoleWarnSpy.mockRestore();
    });

    test('dispose should disconnect internal nodes and clear buffer', () => {
        const nodeToDispose = reverbEffect.convolverNode;
        const wetToDispose = reverbEffect.wetGain;
        const dryToDispose = reverbEffect.dryGain;
        expect(nodeToDispose).toBeDefined();
        expect(wetToDispose).toBeDefined();
        expect(dryToDispose).toBeDefined();

        const convolverDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        const wetDisconnectSpy = jest.spyOn(wetToDispose, 'disconnect');
        const dryDisconnectSpy = jest.spyOn(dryToDispose, 'disconnect');

        reverbEffect.dispose();

        // Check disconnect calls on the mock nodes directly
        expect(convolverDisconnectSpy).toHaveBeenCalled();
        expect(wetDisconnectSpy).toHaveBeenCalled();
        expect(dryDisconnectSpy).toHaveBeenCalled();

        // Check that the instance property buffer is nulled
        expect(nodeToDispose.buffer).toBeNull(); // Check the mock node's buffer directly
        expect(reverbEffect.convolverNode).toBeNull();
        expect(reverbEffect.wetGain).toBeNull();
        expect(reverbEffect.dryGain).toBeNull();
    });
});
