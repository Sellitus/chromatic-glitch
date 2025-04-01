import { DistortionEffect } from '../../../../src/js/engine/audio/effects/DistortionEffect';

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('DistortionEffect', () => {
    let audioContext;
    let distortionEffect;
    let mockWaveShaperNode;
    let mockWetGainNode;
    let mockDryGainNode;

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Clear the mock functions *before* instantiation
        audioContext.createWaveShaper.mockClear();
        audioContext.createGain.mockClear();

        // Clear any pre-existing mock node states if necessary
        const priorShaper = audioContext.createWaveShaper.mock.results[0]?.value;
        if (priorShaper) {
            priorShaper.connect.mockClear();
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
        distortionEffect = new DistortionEffect(audioContext);

        // Retrieve the mock nodes *after* instantiation
        mockWaveShaperNode = audioContext.createWaveShaper.mock.results[0]?.value;
        const allGainNodes = audioContext.createGain.mock.results;
        // Assuming EffectNode creates _input(0), _output(1), _bypassGain(2), _effectInput(3).
        // DistortionEffect creates waveShaper, wetGain(4), dryGain(5).
        mockWetGainNode = allGainNodes[4]?.value; // Index 4
        mockDryGainNode = allGainNodes[5]?.value; // Index 5

        // Clear connect mock on the input node *after* instantiation
        distortionEffect._effectInput?.connect.mockClear();
        // Don't clear connect mocks for wet/dry gain here, as those connections
        // are made *during* instantiation and need to be tested.
    });

    afterEach(() => {
        distortionEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(distortionEffect).toBeInstanceOf(DistortionEffect);
        // Check nodes were created and assigned
        expect(mockWaveShaperNode).toBeDefined();
        expect(mockWetGainNode).toBeDefined();
        expect(mockDryGainNode).toBeDefined();
        expect(distortionEffect.waveShaperNode).toBe(mockWaveShaperNode);
        expect(distortionEffect.wetGain).toBe(mockWetGainNode);
        expect(distortionEffect.dryGain).toBe(mockDryGainNode);

        // Simplified Check: Verify the internal nodes connect to the effect's output node (via wet/dry gains)
        expect(distortionEffect.waveShaperNode?.connect).toHaveBeenCalledWith(distortionEffect.wetGain);
        expect(distortionEffect.dryGain?.connect).toHaveBeenCalledWith(distortionEffect._output);
        expect(distortionEffect.wetGain?.connect).toHaveBeenCalledWith(distortionEffect._output);

        // Check default parameters state by calling getParameters
        const defaultParams = distortionEffect.getParameters();
        expect(defaultParams.amount).toBe(50);
        expect(defaultParams.curveType).toBe('tanh');
        expect(defaultParams.mix).toBeCloseTo(0.5);
        // Check node properties directly if needed
        expect(mockWaveShaperNode?.curve).toBeDefined();
        expect(mockWaveShaperNode?.oversample).toBe('2x');
    });

    test('should instantiate with initial parameters', () => {
        const initialParams = { amount: 80, mix: 0.9, curveType: 'hard' };
        distortionEffect?.dispose();
        audioContext.createWaveShaper.mockClear();
        audioContext.createGain.mockClear();

        distortionEffect = new DistortionEffect(audioContext, initialParams);
        const newWaveShaperNode = audioContext.createWaveShaper.mock.results[0]?.value;

        // Check parameters via getParameters
        const params = distortionEffect.getParameters();
        expect(params.amount).toBe(80);
        expect(params.curveType).toBe('hard');
        expect(params.mix).toBeCloseTo(0.9);
        // Check node properties directly if needed
        expect(newWaveShaperNode?.curve).toBeDefined();
        expect(newWaveShaperNode?.oversample).toBe('4x');
    });

    test('setParameters should update amount and curve', () => {
        if (!mockWaveShaperNode) throw new Error("Mock node not initialized");
        mockDryGainNode?.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode?.gain.linearRampToValueAtTime.mockClear();

        const initialCurve = mockWaveShaperNode.curve;
        distortionEffect.setParameters({ amount: 20, curveType: 'soft' });

        const params = distortionEffect.getParameters();
        expect(params.amount).toBe(20);
        expect(params.curveType).toBe('soft');
        expect(params.mix).toBeCloseTo(0.5);

        expect(mockWaveShaperNode.curve).toBeDefined();
        expect(mockWaveShaperNode.curve).not.toBe(initialCurve);
        expect(mockWaveShaperNode.oversample).toBe('2x');
    });

     test('setParameters should update mix with ramps', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        const params = { mix: 0.2 };
        const rampTime = 0.1;
        const expectedTargetTime = audioContext.currentTime + rampTime;

        distortionEffect.setParameters(params, rampTime);

        expect(mockDryGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.8), expectedTargetTime);
        expect(mockWetGainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.2), expectedTargetTime);
        expect(distortionEffect.getParameters().mix).toBeCloseTo(0.2);
    });

    test('setParameters should only update curve if amount or type changes', () => {
         if (!mockWaveShaperNode) throw new Error("Mock node not initialized");
         const initialCurve = mockWaveShaperNode.curve;

         distortionEffect.setParameters({ mix: 0.1 });
         expect(mockWaveShaperNode.curve).toBe(initialCurve);

         distortionEffect.setParameters({ amount: 50 });
         expect(mockWaveShaperNode.curve).toBe(initialCurve);

         distortionEffect.setParameters({ amount: 51 });
         expect(mockWaveShaperNode.curve).not.toBe(initialCurve);
    });

    test('getParameters should return current values', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testParams = { amount: 75, mix: 0.8, curveType: 'hard' };
        distortionEffect.setParameters(testParams, 0);

        const params = distortionEffect.getParameters();

        expect(params.amount).toBe(testParams.amount);
        expect(params.mix).toBeCloseTo(testParams.mix);
        expect(params.curveType).toBe(testParams.curveType);
    });

    test('toJSON should return current parameters', () => {
        if (!mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const testParams = { amount: 10, mix: 0.6, curveType: 'soft' };
        distortionEffect.setParameters(testParams, 0);

        const jsonResult = distortionEffect.toJSON();
        expect(jsonResult.amount).toBe(testParams.amount);
        expect(jsonResult.mix).toBeCloseTo(testParams.mix);
        expect(jsonResult.curveType).toBe(testParams.curveType);
    });

    test('fromJSON should set parameters instantly', () => {
        if (!mockWaveShaperNode || !mockDryGainNode || !mockWetGainNode) throw new Error("Mock nodes not initialized");
        const data = { amount: 90, mix: 0.7, curveType: 'tanh' };

        mockDryGainNode.gain.linearRampToValueAtTime.mockClear();
        mockWetGainNode.gain.linearRampToValueAtTime.mockClear();

        distortionEffect.fromJSON(data);

        expect(distortionEffect._currentAmount).toBe(90);
        expect(distortionEffect._currentCurveType).toBe('tanh');
        expect(mockWaveShaperNode.curve).toBeDefined();
        expect(mockWaveShaperNode.oversample).toBe('4x');
        // Check that setValueAtTime was called for instant update
        expect(mockDryGainNode.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.3), audioContext.currentTime);
        expect(mockWetGainNode.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.7), audioContext.currentTime);

        const params = distortionEffect.getParameters();
        expect(params.amount).toBe(data.amount);
        expect(params.mix).toBeCloseTo(data.mix);
        expect(params.curveType).toBe(data.curveType);
    });

    test('dispose should disconnect internal nodes and nullify properties', () => {
        const nodeToDispose = distortionEffect.waveShaperNode;
        const wetToDispose = distortionEffect.wetGain;
        const dryToDispose = distortionEffect.dryGain;
        expect(nodeToDispose).toBeDefined();
        expect(wetToDispose).toBeDefined();
        expect(dryToDispose).toBeDefined();

        const shaperDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        const wetDisconnectSpy = jest.spyOn(wetToDispose, 'disconnect');
        const dryDisconnectSpy = jest.spyOn(dryToDispose, 'disconnect');

        distortionEffect.dispose();

        expect(shaperDisconnectSpy).toHaveBeenCalled();
        expect(wetDisconnectSpy).toHaveBeenCalled();
        expect(dryDisconnectSpy).toHaveBeenCalled();
        expect(distortionEffect.waveShaperNode).toBeNull();
        expect(distortionEffect.wetGain).toBeNull();
        expect(distortionEffect.dryGain).toBeNull();
    });
});
