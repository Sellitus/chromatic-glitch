import { DelayEffect } from '../../../../src/js/engine/audio/effects/DelayEffect';

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('DelayEffect', () => {
    let audioContext;
    let delayEffect;
    let mockDelayNode;
    let mockFeedbackGainNode;
    let mockWetGainNode;
    let mockDryGainNode;

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Clear the mock functions *before* instantiation
        audioContext.createDelay.mockClear();
        audioContext.createGain.mockClear();

        // Clear any pre-existing mock node states if necessary (less common)
        // This part might be redundant if createDelay/createGain always return fresh mocks
        const priorDelay = audioContext.createDelay.mock.results[0]?.value;
        if (priorDelay) {
            priorDelay.delayTime.linearRampToValueAtTime.mockClear();
            priorDelay.connect.mockClear();
        }
        const priorGains = audioContext.createGain.mock.results;
        priorGains.forEach(result => {
            const gainNode = result?.value;
            if (gainNode) {
                gainNode.gain.linearRampToValueAtTime.mockClear();
                gainNode.connect.mockClear();
            }
        });


        delayEffect = new DelayEffect(audioContext);

        // Retrieve the mock nodes *after* instantiation
        mockDelayNode = audioContext.createDelay.mock.results[0]?.value;
        const allGainNodes = audioContext.createGain.mock.results;
        // Adjust indices based on EffectNode base class potentially creating gain nodes first
        // Assuming EffectNode creates _input, _output, dryGain, wetGain (4 total)
        // Then DelayEffect creates feedbackGain, wetGain, dryGain (3 more)
        // Let's re-evaluate based on EffectNode's constructor if needed.
        // Assuming EffectNode creates 2 gain nodes (_input, _output)
        // DelayEffect creates delay, feedbackGain, wetGain, dryGain (4 nodes total: 1 delay, 3 gain)
        // So, indices should be: delay[0], gain[2], gain[3], gain[4] relative to *this* effect's creation
        // But createGain is global, so we need absolute indices.
        // Let's assume EffectNode creates 2 gains, DelayEffect creates 3 more.
        // Indices: Delay[0], Gain[2], Gain[3], Gain[4] (relative to start of test)
        // Need to be careful with these indices if other tests affect the global mock counts.
        // EffectNode creates 4 gain nodes (_input, _output, _bypassGain, _effectInput).
        // DelayEffect creates 3 more (feedbackGain, wetGain, dryGain).
        // Indices should be 4, 5, 6 relative to the start of the mock results array.
        mockFeedbackGainNode = allGainNodes[4]?.value; // Index 4
        mockWetGainNode = allGainNodes[5]?.value;      // Index 5
        mockDryGainNode = allGainNodes[6]?.value;      // Index 6


        // Clear connect mock on the input node *after* instantiation
        delayEffect._effectInput?.connect.mockClear();
        // Don't clear output connect mock here, as it's part of EffectNode base
    });

    afterEach(() => {
        delayEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(delayEffect).toBeInstanceOf(DelayEffect);
        expect(mockDelayNode).toBeDefined();
        expect(mockFeedbackGainNode).toBeDefined();
        expect(mockWetGainNode).toBeDefined();
        expect(mockDryGainNode).toBeDefined();
        expect(delayEffect.delayNode).toBe(mockDelayNode);
        expect(delayEffect.feedbackGain).toBe(mockFeedbackGainNode);
        expect(delayEffect.wetGain).toBe(mockWetGainNode);
        expect(delayEffect.dryGain).toBe(mockDryGainNode);

        // Simplified Check: Verify the internal nodes connect correctly
        expect(delayEffect.delayNode?.connect).toHaveBeenCalledWith(delayEffect.wetGain);
        expect(delayEffect.delayNode?.connect).toHaveBeenCalledWith(delayEffect.feedbackGain);
        expect(delayEffect.feedbackGain?.connect).toHaveBeenCalledWith(delayEffect.delayNode); // Feedback loop
        expect(delayEffect.dryGain?.connect).toHaveBeenCalledWith(delayEffect._output);
        expect(delayEffect.wetGain?.connect).toHaveBeenCalledWith(delayEffect._output);

        const defaultParams = delayEffect.getParameters();
        expect(defaultParams.delayTime).toBe(0.5);
        expect(defaultParams.feedback).toBe(0.5);
        expect(defaultParams.mix).toBe(0.5);
    });

    test('should instantiate with initial parameters', () => {
        const initialParams = { delayTime: 0.2, feedback: 0.7, mix: 0.8 };
        delayEffect?.dispose();
        audioContext.createDelay.mockClear();
        audioContext.createGain.mockClear();

        delayEffect = new DelayEffect(audioContext, initialParams);

        const params = delayEffect.getParameters();
        expect(params.delayTime).toBe(0.2);
        expect(params.feedback).toBe(0.7);
        expect(params.mix).toBeCloseTo(0.8);

        expect(delayEffect.delayNode.delayTime.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.2), expect.any(Number));
        expect(delayEffect.feedbackGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.7), expect.any(Number));
        expect(delayEffect.dryGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.2), expect.any(Number));
        expect(delayEffect.wetGain.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.8), expect.any(Number));
    });

    test('setParameters should update properties with ramps', () => {
        if (!mockDelayNode || !mockFeedbackGainNode || !mockDryGainNode || !mockWetGainNode) {
            throw new Error("Mock nodes not initialized in beforeEach");
        }
        mockDelayNode.delayTime.linearRampToValueAtTime.mockClear();
        mockFeedbackGainNode.gain.linearRampToValueAtTime.mockClear();
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        const params = { delayTime: 1.0, feedback: 0.3, mix: 0.1 };
        const rampTime = 0.1;
        const expectedTargetTime = audioContext.currentTime + rampTime;

        delayEffect.setParameters(params, rampTime);

        expect(mockDelayNode.delayTime.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(1.0), expectedTargetTime);
        expect(mockFeedbackGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.3), expectedTargetTime);
        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), expectedTargetTime);
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), expectedTargetTime);
    });

     test('setParameters should clamp feedback and mix', () => {
        if (!mockFeedbackGainNode || !mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        mockFeedbackGainNode.gain.linearRampToValueAtTime.mockClear();
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        const params = { feedback: 1.5, mix: -0.5 };
        delayEffect.setParameters(params);
        expect(mockFeedbackGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.99), expect.any(Number));
        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(1.0), expect.any(Number));
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0), expect.any(Number));

        mockFeedbackGainNode.gain.linearRampToValueAtTime.mockClear();
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        const params2 = { feedback: -0.2, mix: 1.2 };
        delayEffect.setParameters(params2);
        expect(mockFeedbackGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0), expect.any(Number));
        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0), expect.any(Number));
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(1), expect.any(Number));
    });


    test('getParameters should return current values', () => {
        if (!mockDelayNode || !mockFeedbackGainNode || !mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testParams = { delayTime: 0.25, feedback: 0.6, mix: 0.7 };
        delayEffect.setParameters(testParams, 0);

        const params = delayEffect.getParameters();

        expect(params.delayTime).toBeCloseTo(testParams.delayTime);
        expect(params.feedback).toBeCloseTo(testParams.feedback);
        expect(params.mix).toBeCloseTo(testParams.mix);
    });

    test('toJSON should return current parameters', () => {
        if (!mockDelayNode || !mockFeedbackGainNode || !mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testParams = { delayTime: 0.8, feedback: 0.1, mix: 0.4 };
        delayEffect.setParameters(testParams, 0);

        const jsonParams = delayEffect.toJSON();
        expect(jsonParams.delayTime).toBeCloseTo(testParams.delayTime);
        expect(jsonParams.feedback).toBeCloseTo(testParams.feedback);
        expect(jsonParams.mix).toBeCloseTo(testParams.mix);
    });

    test('fromJSON should set parameters instantly', () => {
        if (!mockDelayNode || !mockFeedbackGainNode || !mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const data = { delayTime: 0.1, feedback: 0.9, mix: 0.2 };

        mockDelayNode.delayTime.linearRampToValueAtTime.mockClear();
        mockFeedbackGainNode.gain.linearRampToValueAtTime.mockClear();
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        delayEffect.fromJSON(data);

        expect(mockDelayNode.delayTime.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), audioContext.currentTime);
        expect(mockFeedbackGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), audioContext.currentTime);
        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.8), audioContext.currentTime);
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.2), audioContext.currentTime);

        const params = delayEffect.getParameters();
        expect(params.delayTime).toBeCloseTo(data.delayTime);
        expect(params.feedback).toBeCloseTo(data.feedback);
        expect(params.mix).toBeCloseTo(data.mix);
    });

    test('dispose should disconnect internal nodes and nullify properties', () => {
        const nodeToDispose = delayEffect.delayNode;
        const feedbackToDispose = delayEffect.feedbackGain;
        const wetToDispose = delayEffect.wetGain;
        const dryToDispose = delayEffect.dryGain;
        expect(nodeToDispose).toBeDefined();
        expect(feedbackToDispose).toBeDefined();
        expect(wetToDispose).toBeDefined();
        expect(dryToDispose).toBeDefined();

        const delayDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        const feedbackDisconnectSpy = jest.spyOn(feedbackToDispose, 'disconnect');
        const wetDisconnectSpy = jest.spyOn(wetToDispose, 'disconnect');
        const dryDisconnectSpy = jest.spyOn(dryToDispose, 'disconnect');

        delayEffect.dispose();

        expect(delayDisconnectSpy).toHaveBeenCalled();
        expect(feedbackDisconnectSpy).toHaveBeenCalled();
        expect(wetDisconnectSpy).toHaveBeenCalled();
        expect(dryDisconnectSpy).toHaveBeenCalled();
        expect(delayEffect.delayNode).toBeNull();
        expect(delayEffect.feedbackGain).toBeNull();
        expect(delayEffect.wetGain).toBeNull();
        expect(delayEffect.dryGain).toBeNull();
    });
});
