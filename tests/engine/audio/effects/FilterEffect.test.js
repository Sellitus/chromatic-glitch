import { FilterEffect } from '../../../../src/js/engine/audio/effects/FilterEffect';

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('FilterEffect', () => {
    let audioContext;
    let filterEffect;
    let mockBiquadFilterNode;

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Get the mock node *before* instantiation if needed for clearing,
        // but clear *before* creating the effect instance.
        // Note: This assumes createBiquadFilter is called only once per instantiation.
        // If it might be called multiple times, a different approach might be needed.
        const priorMockResult = audioContext.createBiquadFilter.mock.results[0]?.value;
        if (priorMockResult) {
            priorMockResult.frequency.linearRampToValueAtTime.mockClear();
            priorMockResult.Q.linearRampToValueAtTime.mockClear();
            priorMockResult.gain.linearRampToValueAtTime.mockClear();
            priorMockResult.connect.mockClear();
        }
        // Also clear the mock function itself to reset call counts if needed
        audioContext.createBiquadFilter.mockClear();


        filterEffect = new FilterEffect(audioContext);
        mockBiquadFilterNode = audioContext.createBiquadFilter.mock.results[0]?.value;

        // Clear connect mock on the input node *after* instantiation
        filterEffect._effectInput?.connect.mockClear();
    });

    afterEach(() => {
        filterEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(filterEffect).toBeInstanceOf(FilterEffect);
        expect(mockBiquadFilterNode).toBeDefined();
        expect(filterEffect.filterNode).toBe(mockBiquadFilterNode);

        // Simplified Check: Verify the internal node connects to the effect's output node
        expect(filterEffect.filterNode?.connect).toHaveBeenCalledWith(filterEffect._output);

        // Check default parameters state by calling getParameters
        const defaultParams = filterEffect.getParameters();
        expect(defaultParams.type).toBe('lowpass');
        expect(defaultParams.frequency).toBe(350);
        expect(defaultParams.Q).toBe(1);
        expect(defaultParams.gain).toBe(0);
    });

    test('should instantiate with initial parameters', () => {
        const initialParams = { type: 'highpass', frequency: 1000, Q: 5, gain: -3 };
        filterEffect?.dispose();
        audioContext.createBiquadFilter.mockClear(); // Clear before creating new effect
        filterEffect = new FilterEffect(audioContext, initialParams);
        const newNode = audioContext.createBiquadFilter.mock.results[0]?.value;

        const params = filterEffect.getParameters();
        expect(params.type).toBe('highpass');
        expect(params.frequency).toBe(1000);
        expect(params.Q).toBe(5);
        expect(params.gain).toBe(-3);
        expect(filterEffect.filterNode).toBe(newNode);
        expect(newNode?.type).toBe('highpass');
    });

    test('setParameters should update filter properties with ramps', () => {
        if (!mockBiquadFilterNode) throw new Error("mockBiquadFilterNode not initialized in beforeEach");
        const params = { type: 'bandpass', frequency: 500, Q: 2, gain: 6 };
        const rampTime = 0.1;
        const expectedTargetTime = audioContext.currentTime + rampTime;

        mockBiquadFilterNode.frequency.linearRampToValueAtTime.mockClear();
        mockBiquadFilterNode.Q.linearRampToValueAtTime.mockClear();
        mockBiquadFilterNode.gain.linearRampToValueAtTime.mockClear();

        filterEffect.setParameters(params, rampTime);

        expect(mockBiquadFilterNode.type).toBe('bandpass');
        expect(mockBiquadFilterNode.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(500, expectedTargetTime);
        expect(mockBiquadFilterNode.Q.linearRampToValueAtTime).toHaveBeenCalledWith(2, expectedTargetTime);
        expect(mockBiquadFilterNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(6, expectedTargetTime);
    });

     test('setParameters should ignore invalid type', () => {
        if (!mockBiquadFilterNode) throw new Error("mockBiquadFilterNode not initialized in beforeEach");
        const initialType = filterEffect.getParameters().type;
        const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

        filterEffect.setParameters({ type: 'invalid-type' });

        expect(filterEffect.getParameters().type).toBe(initialType);
        expect(mockBiquadFilterNode.type).toBe(initialType);
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid filter type'));
        consoleWarnSpy.mockRestore();
    });

    test('getParameters should return current values', () => {
        if (!mockBiquadFilterNode) throw new Error("mockBiquadFilterNode not initialized in beforeEach");
        const testParams = { type: 'peaking', frequency: 1500, Q: 3, gain: -6 };
        filterEffect.setParameters(testParams, 0);
        const params = filterEffect.getParameters();
        expect(params).toEqual(testParams);
    });

    test('toJSON should return current parameters', () => {
        if (!mockBiquadFilterNode) throw new Error("mockBiquadFilterNode not initialized in beforeEach");
        const testParams = { type: 'lowshelf', frequency: 200, Q: 0.7, gain: 4 };
        filterEffect.setParameters(testParams, 0);
        const jsonParams = filterEffect.toJSON();
        expect(jsonParams).toEqual(testParams);
    });

    test('fromJSON should set parameters instantly', () => {
        if (!mockBiquadFilterNode) throw new Error("mockBiquadFilterNode not initialized in beforeEach");
        const data = { type: 'notch', frequency: 60, Q: 10, gain: 0 };

        mockBiquadFilterNode.frequency.linearRampToValueAtTime.mockClear();
        mockBiquadFilterNode.Q.linearRampToValueAtTime.mockClear();
        mockBiquadFilterNode.gain.linearRampToValueAtTime.mockClear();

        filterEffect.fromJSON(data);

        expect(mockBiquadFilterNode.type).toBe('notch');
        expect(mockBiquadFilterNode.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(60, audioContext.currentTime);
        expect(mockBiquadFilterNode.Q.linearRampToValueAtTime).toHaveBeenCalledWith(10, audioContext.currentTime);
        expect(mockBiquadFilterNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, audioContext.currentTime);
        expect(filterEffect.getParameters()).toEqual(data);
    });

    test('dispose should disconnect the internal node and nullify property', () => {
        const nodeToDispose = filterEffect.filterNode;
        expect(nodeToDispose).toBeDefined();
        const nodeDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');

        filterEffect.dispose();

        expect(nodeDisconnectSpy).toHaveBeenCalled();
        expect(filterEffect.filterNode).toBeNull();
    });
});
