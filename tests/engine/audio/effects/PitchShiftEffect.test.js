import { PitchShiftEffect } from '../../../../src/js/engine/audio/effects/PitchShiftEffect';
// Removed EffectNode import and mock below
import { SoundTouch } from 'soundtouchjs';

// Mock SoundTouch library
jest.mock('soundtouchjs', () => {
    return {
        SoundTouch: jest.fn().mockImplementation(() => ({
            pitchSemitones: 0,
            tempo: 1.0,
            putSamples: jest.fn(),
            receiveSamples: jest.fn().mockReturnValue(0), // Default: return 0 samples
        }))
    };
});

// Mock AudioContext and its nodes
// Assuming global.AudioContext is mocked by jest.setup.js

describe('PitchShiftEffect', () => {
    let audioContext;
    let pitchShiftEffect;
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
        pitchShiftEffect = new PitchShiftEffect(audioContext, { bufferSize: bufferSize });

        // Retrieve the mock nodes *after* instantiation
        mockScriptProcessorNode = audioContext.createScriptProcessor.mock.results[0]?.value;
        const allGainNodes = audioContext.createGain.mock.results;
        // Assuming EffectNode creates 2 gains (_input, _output)
        // PitchShiftEffect creates scriptProcessor, wetGain, dryGain (1 processor, 2 gains)
        // Indices: EffectNode creates _input(0), _output(1), _bypassGain(2), _effectInput(3).
        // PitchShiftEffect creates wetGain(4), dryGain(5).
        mockWetGainNode = allGainNodes[4]?.value; // Index 4
        mockDryGainNode = allGainNodes[5]?.value; // Index 5

        // Retrieve the SoundTouch instance directly from the effect object
        mockSoundTouchInstance = pitchShiftEffect.soundTouch;

        // Clear connect mock on the input node *after* instantiation
        // but *before* the tests run their assertions.
        // We need to test the connections made *during* instantiation.
        // So, we don't clear scriptProcessor, wetGain, dryGain connects here.
        // However, the test specifically checks _effectInput.connect, so clear that one
        // if it's not meant to be part of the instantiation check.
        // Based on the failing test, it seems we *do* want to check the _effectInput connections
        // made during instantiation, so we should NOT clear it here.
        // Let's remove the clearing of _effectInput.connect.
        // pitchShiftEffect._effectInput?.connect.mockClear();
    });

    afterEach(() => {
        pitchShiftEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(pitchShiftEffect).toBeInstanceOf(PitchShiftEffect);
        // Check nodes were created and assigned
        expect(mockScriptProcessorNode).toBeDefined();
        expect(mockSoundTouchInstance).toBeDefined();
        expect(mockWetGainNode).toBeDefined();
        expect(mockDryGainNode).toBeDefined();
        expect(pitchShiftEffect.scriptProcessor).toBe(mockScriptProcessorNode);
        expect(pitchShiftEffect.soundTouch).toBeDefined();
        expect(pitchShiftEffect.wetGain).toBe(mockWetGainNode);
        expect(pitchShiftEffect.dryGain).toBe(mockDryGainNode);

        // Check internal connections (use optional chaining)
        // Reverted: Assert connections against mock nodes retrieved in beforeEach
        expect(pitchShiftEffect._effectInput?.connect).toHaveBeenCalledWith(mockScriptProcessorNode);
        expect(pitchShiftEffect._effectInput?.connect).toHaveBeenCalledWith(mockDryGainNode);
        expect(mockScriptProcessorNode?.connect).toHaveBeenCalledWith(mockWetGainNode);
        expect(mockDryGainNode?.connect).toHaveBeenCalledWith(pitchShiftEffect._output);
        expect(mockWetGainNode?.connect).toHaveBeenCalledWith(pitchShiftEffect._output);

        // Check default parameters state via getParameters
        const defaultParams = pitchShiftEffect.getParameters();
        expect(defaultParams.pitch).toBe(0);
        expect(defaultParams.mix).toBeCloseTo(1.0);
        // Check SoundTouch instance properties directly
        expect(mockSoundTouchInstance?.pitchSemitones).toBe(0);
        expect(mockSoundTouchInstance?.tempo).toBe(1.0);

        // Check onaudioprocess assignment
        expect(mockScriptProcessorNode?.onaudioprocess).toBeInstanceOf(Function);
    });

     test('should instantiate with initial parameters', () => {
        const initialParams = { pitch: 5, mix: 0.7, bufferSize: 2048 };
        pitchShiftEffect?.dispose();
        audioContext.createScriptProcessor.mockClear();
        audioContext.createGain.mockClear();
        SoundTouch.mockClear();

        pitchShiftEffect = new PitchShiftEffect(audioContext, initialParams);
        mockSoundTouchInstance = pitchShiftEffect.soundTouch;
        const newDryGain = pitchShiftEffect.dryGain;
        const newWetGain = pitchShiftEffect.wetGain;

        const params = pitchShiftEffect.getParameters();
        expect(params.pitch).toBe(5);
        expect(params.mix).toBeCloseTo(0.7);
        expect(mockSoundTouchInstance?.pitchSemitones).toBe(5);
        expect(newDryGain?.gain.value).toBeCloseTo(0.3);
        expect(newWetGain?.gain.value).toBe(0.7);
        expect(audioContext.createScriptProcessor).toHaveBeenCalledWith(2048, 2, 2);
    });

    test('setParameters should update pitch and mix', () => {
        if (!mockSoundTouchInstance || !pitchShiftEffect.dryGain || !pitchShiftEffect.wetGain) throw new Error("Mocks not initialized");
        pitchShiftEffect.dryGain.gain.setValueAtTime.mockClear();
        pitchShiftEffect.wetGain.gain.setValueAtTime.mockClear();

        const params = { pitch: -3, mix: 0.6 };
        pitchShiftEffect.setParameters(params, 0.1);

        const currentParams = pitchShiftEffect.getParameters();
        expect(currentParams.pitch).toBe(-3);
        expect(currentParams.mix).toBeCloseTo(0.6);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(-3);
        expect(pitchShiftEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.4), audioContext.currentTime);
        expect(pitchShiftEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.6), audioContext.currentTime);
    });

    test('setParameters should clamp pitch', () => {
        if (!mockSoundTouchInstance) throw new Error("Mock not initialized");
        pitchShiftEffect.setParameters({ pitch: 30 });
        expect(pitchShiftEffect.getParameters().pitch).toBe(24);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(24);

        pitchShiftEffect.setParameters({ pitch: -30 });
        expect(pitchShiftEffect.getParameters().pitch).toBe(-24);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(-24);
    });

    test('getParameters should return current values', () => {
        pitchShiftEffect.setParameters({ pitch: 7, mix: 0.25 }, 0);
        expect(pitchShiftEffect.getParameters()).toEqual({
            pitch: 7,
            mix: 0.25
        });
    });

    test('toJSON should return current parameters', () => {
        pitchShiftEffect.setParameters({ pitch: -5, mix: 0.9 }, 0);
        const jsonResult = pitchShiftEffect.toJSON();
        expect(jsonResult.pitch).toBe(-5);
        expect(jsonResult.mix).toBeCloseTo(0.9);
    });

    test('fromJSON should set parameters instantly', () => {
        if (!mockSoundTouchInstance || !pitchShiftEffect.dryGain || !pitchShiftEffect.wetGain) throw new Error("Mocks not initialized");
        const data = { pitch: 10, mix: 0.1 };
        pitchShiftEffect.dryGain.gain.setValueAtTime.mockClear();
        pitchShiftEffect.wetGain.gain.setValueAtTime.mockClear();

        pitchShiftEffect.fromJSON(data);

        const params = pitchShiftEffect.getParameters();
        expect(params.pitch).toBe(10);
        expect(params.mix).toBeCloseTo(0.1);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(10);
        expect(pitchShiftEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), audioContext.currentTime);
        expect(pitchShiftEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), audioContext.currentTime);
    });

    test('_processAudio should copy data from internal buffer to output', () => {
        if (!mockSoundTouchInstance || !pitchShiftEffect.stBuffer) throw new Error("Mocks not initialized");
        // Mock the event object
        // Ensure output buffer data is modifiable
        const mockOutputL = new Float32Array(bufferSize);
        const mockOutputR = new Float32Array(bufferSize);
        const mockEvent = {
            inputBuffer: {
                numberOfChannels: 2,
                length: bufferSize,
                getChannelData: jest.fn((channel) => new Float32Array(bufferSize).fill(channel + 0.1)) // Dummy input data
            },
            outputBuffer: {
                 numberOfChannels: 2,
                 length: bufferSize,
                 getChannelData: jest.fn((channel) => (channel === 0 ? mockOutputL : mockOutputR))
            }
        };

        // --- Simplified Test Logic ---
        // Manually prepare the internal buffer as if receiveSamples worked
        const expectedOutputValue = 0.77; // Use a distinct value
        const internalBuffer = new Float32Array(bufferSize * 2);
        for (let i = 0; i < bufferSize * 2; i++) {
            internalBuffer[i] = expectedOutputValue; // Fill with expected interleaved data
        }
        pitchShiftEffect.stBuffer = internalBuffer; // Assign directly for test

        // Simulate SoundTouch returning samples (needed for the copy logic inside _processAudio)
        if (!mockSoundTouchInstance) throw new Error("SoundTouch mock instance not available");
         mockSoundTouchInstance.receiveSamples = jest.fn().mockReturnValue(bufferSize); // Simulate receiving a full buffer


        // Call the process function directly, bypassing gain/bypass concerns for this specific test
        pitchShiftEffect._processAudio(mockEvent);

        // Check if putSamples was still called (it should be)
        expect(mockSoundTouchInstance.putSamples).toHaveBeenCalledTimes(1);
        const putSamplesArg = mockSoundTouchInstance.putSamples.mock.calls[0][0];
        expect(putSamplesArg).toBeInstanceOf(Float32Array);
        expect(putSamplesArg.length).toBe(bufferSize * 2);

        // Check if receiveSamples was called
        expect(mockSoundTouchInstance.receiveSamples).toHaveBeenCalledTimes(1);

        // Check if output buffer was populated correctly from the manually set stBuffer
        expect(mockOutputL[0]).toBeCloseTo(expectedOutputValue); // Check channel 0 data copied
        expect(mockOutputR[0]).toBeCloseTo(expectedOutputValue); // Check channel 1 data copied
        expect(mockOutputL[bufferSize - 1]).toBeCloseTo(expectedOutputValue); // Check end of buffer
        expect(mockOutputR[bufferSize - 1]).toBeCloseTo(expectedOutputValue);
    });


    test('dispose should disconnect script processor and nullify properties', () => {
        const nodeToDispose = pitchShiftEffect.scriptProcessor;
        const wetToDispose = pitchShiftEffect.wetGain;
        const dryToDispose = pitchShiftEffect.dryGain;
        expect(nodeToDispose).toBeDefined();
        expect(wetToDispose).toBeDefined();
        expect(dryToDispose).toBeDefined();

        const scriptDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        const wetDisconnectSpy = jest.spyOn(wetToDispose, 'disconnect');
        const dryDisconnectSpy = jest.spyOn(dryToDispose, 'disconnect');

        pitchShiftEffect.dispose();

        expect(scriptDisconnectSpy).toHaveBeenCalled();
        // Check disconnect calls on the mock node directly
        expect(mockScriptProcessorNode.disconnect).toHaveBeenCalled();
        // Check instance properties are nulled
        expect(pitchShiftEffect.scriptProcessor).toBeNull();
        expect(pitchShiftEffect.soundTouch).toBeNull();
        expect(pitchShiftEffect.stBuffer).toBeNull();
        expect(pitchShiftEffect.wetGain).toBeNull();
        expect(pitchShiftEffect.dryGain).toBeNull();
    });
});
