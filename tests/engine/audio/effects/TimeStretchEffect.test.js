import { TimeStretchEffect } from '../../../../src/js/engine/audio/effects/TimeStretchEffect';
import { SoundTouch } from 'soundtouchjs';

// Mock SoundTouch library
jest.mock('soundtouchjs', () => {
    return {
        SoundTouch: jest.fn().mockImplementation(() => ({
            pitchSemitones: 0,
            pitch: 1.0, // Add pitch property for completeness
            tempo: 1.0,
            putSamples: jest.fn(),
            receiveSamples: jest.fn().mockReturnValue(0), // Default: return 0 samples
        }))
    };
});

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('TimeStretchEffect', () => {
    let audioContext;
    let timeStretchEffect;
    let mockScriptProcessorNode;
    let mockSoundTouchInstance;
    let mockWetGainNode;
    let mockDryGainNode;
    const bufferSize = 4096; // Match default or specified buffer size

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Clear the mock functions *before* instantiation
        audioContext.createScriptProcessor.mockClear();
        audioContext.createGain.mockClear();
        SoundTouch.mockClear(); // Clear SoundTouch constructor calls

        // Clear any pre-existing mock node states if necessary
        const priorProcessor = audioContext.createScriptProcessor.mock.results[0]?.value;
        if (priorProcessor) {
            priorProcessor.connect.mockClear();
            priorProcessor.disconnect.mockClear();
        }
        const priorGains = audioContext.createGain.mock.results;
        priorGains.forEach(result => {
            const gainNode = result?.value;
            if (gainNode) {
                gainNode.gain.setValueAtTime.mockClear(); // Use setValueAtTime based on implementation
                gainNode.connect.mockClear();
            }
        });

        // Instantiate the effect
        timeStretchEffect = new TimeStretchEffect(audioContext, { bufferSize: bufferSize });

        // Retrieve the mock nodes *after* instantiation
        mockScriptProcessorNode = audioContext.createScriptProcessor.mock.results[0]?.value;
        const allGainNodes = audioContext.createGain.mock.results;
        // Assuming EffectNode creates 2 gains (_input, _output)
        // TimeStretchEffect creates scriptProcessor, wetGain, dryGain (1 processor, 2 gains)
        // Indices: EffectNode creates _input(0), _output(1), _bypassGain(2), _effectInput(3).
        // TimeStretchEffect creates wetGain(4), dryGain(5).
        mockWetGainNode = allGainNodes[4]?.value; // Index 4
        mockDryGainNode = allGainNodes[5]?.value; // Index 5

        // Retrieve the SoundTouch instance directly from the effect object
        mockSoundTouchInstance = timeStretchEffect.soundTouch;

        // Clear connect mock on the input node *after* instantiation
        timeStretchEffect._effectInput?.connect.mockClear();
        // Don't clear connect mocks for scriptProcessor, wetGain, dryGain here
    });

    afterEach(() => {
        timeStretchEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(timeStretchEffect).toBeInstanceOf(TimeStretchEffect);
        // Check nodes were created and assigned
        expect(mockScriptProcessorNode).toBeDefined();
        expect(mockSoundTouchInstance).toBeDefined();
        expect(mockWetGainNode).toBeDefined();
        expect(mockDryGainNode).toBeDefined();
        expect(timeStretchEffect.scriptProcessor).toBe(mockScriptProcessorNode);
        expect(timeStretchEffect.soundTouch).toBe(mockSoundTouchInstance);
        expect(timeStretchEffect.wetGain).toBe(mockWetGainNode);
        expect(timeStretchEffect.dryGain).toBe(mockDryGainNode);

        // Simplified Check: Verify the internal nodes connect to the effect's output node (via wet/dry gains)
        expect(timeStretchEffect.scriptProcessor?.connect).toHaveBeenCalledWith(timeStretchEffect.wetGain);
        expect(timeStretchEffect.dryGain?.connect).toHaveBeenCalledWith(timeStretchEffect._output);
        expect(timeStretchEffect.wetGain?.connect).toHaveBeenCalledWith(timeStretchEffect._output);

        // Check default parameters state via getParameters
        const defaultParams = timeStretchEffect.getParameters();
        expect(defaultParams.tempo).toBe(1.0);
        expect(defaultParams.mix).toBeCloseTo(1.0);
        // Check SoundTouch instance properties directly
        expect(mockSoundTouchInstance?.tempo).toBe(1.0);
        expect(mockSoundTouchInstance?.pitch).toBe(1.0);

        // Check onaudioprocess assignment
        expect(mockScriptProcessorNode?.onaudioprocess).toBeInstanceOf(Function);
    });

     test('should instantiate with initial parameters', () => {
        const initialParams = { tempo: 1.5, mix: 0.8, bufferSize: 1024 };
        timeStretchEffect?.dispose();
        audioContext.createScriptProcessor.mockClear();
        audioContext.createGain.mockClear();
        SoundTouch.mockClear();

        timeStretchEffect = new TimeStretchEffect(audioContext, initialParams);
        mockSoundTouchInstance = timeStretchEffect.soundTouch;
        const newDryGain = timeStretchEffect.dryGain;
        const newWetGain = timeStretchEffect.wetGain;

        const params = timeStretchEffect.getParameters();
        expect(params.tempo).toBe(1.5);
        expect(params.mix).toBeCloseTo(0.8);
        expect(mockSoundTouchInstance?.tempo).toBe(1.5);
        expect(newDryGain?.gain.value).toBeCloseTo(0.2);
        expect(newWetGain?.gain.value).toBe(0.8);
        expect(audioContext.createScriptProcessor).toHaveBeenCalledWith(1024, 2, 2);
    });

    test('setParameters should update tempo and mix', () => {
        if (!mockSoundTouchInstance || !timeStretchEffect.dryGain || !timeStretchEffect.wetGain) throw new Error("Mocks not initialized");
        timeStretchEffect.dryGain.gain.setValueAtTime.mockClear();
        timeStretchEffect.wetGain.gain.setValueAtTime.mockClear();

        const params = { tempo: 0.75, mix: 0.5 };
        timeStretchEffect.setParameters(params, 0.1);

        const currentParams = timeStretchEffect.getParameters();
        expect(currentParams.tempo).toBe(0.75);
        expect(currentParams.mix).toBeCloseTo(0.5);
        expect(mockSoundTouchInstance.tempo).toBe(0.75);
        expect(timeStretchEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.5), audioContext.currentTime);
        expect(timeStretchEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.5), audioContext.currentTime);
    });

    test('setParameters should clamp tempo', () => {
        if (!mockSoundTouchInstance) throw new Error("Mock not initialized");
        timeStretchEffect.setParameters({ tempo: 5.0 });
        expect(timeStretchEffect.getParameters().tempo).toBe(4.0);
        expect(mockSoundTouchInstance.tempo).toBe(4.0);

        timeStretchEffect.setParameters({ tempo: 0.1 });
        expect(timeStretchEffect.getParameters().tempo).toBe(0.25);
        expect(mockSoundTouchInstance.tempo).toBe(0.25);
    });

    test('getParameters should return current values', () => {
        timeStretchEffect.setParameters({ tempo: 2.0, mix: 0.7 }, 0);
        expect(timeStretchEffect.getParameters()).toEqual({
            tempo: 2.0,
            mix: 0.7
        });
    });

    test('toJSON should return current parameters', () => {
        timeStretchEffect.setParameters({ tempo: 0.5, mix: 0.9 }, 0);
        const jsonResult = timeStretchEffect.toJSON();
        expect(jsonResult.tempo).toBe(0.5);
        expect(jsonResult.mix).toBeCloseTo(0.9);
    });

    test('fromJSON should set parameters instantly', () => {
        if (!mockSoundTouchInstance || !timeStretchEffect.dryGain || !timeStretchEffect.wetGain) throw new Error("Mocks not initialized");
        const data = { tempo: 1.2, mix: 0.3 };
        timeStretchEffect.dryGain.gain.setValueAtTime.mockClear();
        timeStretchEffect.wetGain.gain.setValueAtTime.mockClear();

        timeStretchEffect.fromJSON(data);

        const params = timeStretchEffect.getParameters();
        expect(params.tempo).toBe(1.2);
        expect(params.mix).toBeCloseTo(0.3);
        expect(mockSoundTouchInstance.tempo).toBe(1.2);
        expect(timeStretchEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.7), audioContext.currentTime);
        expect(timeStretchEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.3), audioContext.currentTime);
    });

    test('_processAudio should call soundTouch methods', () => {
        if (!mockSoundTouchInstance || !timeStretchEffect.stBuffer) throw new Error("Mocks not initialized");
        const mockEvent = {
            inputBuffer: { getChannelData: jest.fn(() => new Float32Array(bufferSize)) },
            outputBuffer: { getChannelData: jest.fn(() => new Float32Array(bufferSize)) }
        };
        mockSoundTouchInstance.receiveSamples = jest.fn().mockReturnValue(bufferSize);

        timeStretchEffect._processAudio(mockEvent);

        expect(mockSoundTouchInstance.putSamples).toHaveBeenCalled();
        expect(mockSoundTouchInstance.receiveSamples).toHaveBeenCalled();
    });


    test('dispose should disconnect script processor and nullify properties', () => {
        const nodeToDispose = timeStretchEffect.scriptProcessor;
        const wetToDispose = timeStretchEffect.wetGain;
        const dryToDispose = timeStretchEffect.dryGain;
        expect(nodeToDispose).toBeDefined();
        expect(wetToDispose).toBeDefined();
        expect(dryToDispose).toBeDefined();

        const scriptDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        const wetDisconnectSpy = jest.spyOn(wetToDispose, 'disconnect');
        const dryDisconnectSpy = jest.spyOn(dryToDispose, 'disconnect');

        timeStretchEffect.dispose();

        expect(scriptDisconnectSpy).toHaveBeenCalled();
        expect(mockScriptProcessorNode.disconnect).toHaveBeenCalled();
        expect(timeStretchEffect.scriptProcessor).toBeNull();
        expect(timeStretchEffect.soundTouch).toBeNull();
        expect(timeStretchEffect.stBuffer).toBeNull();
        expect(timeStretchEffect.wetGain).toBeNull();
        expect(timeStretchEffect.dryGain).toBeNull();
    });
});
