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
    let pitchShiftEffect; // Keep this
    const bufferSize = 4096; // Match default or specified buffer size

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Instantiate the effect - rely on resetMocks: true for cleanup
        pitchShiftEffect = new PitchShiftEffect(audioContext, { bufferSize: bufferSize });
    });

    afterEach(() => {
        pitchShiftEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(pitchShiftEffect).toBeInstanceOf(PitchShiftEffect);
        // Check nodes were created and assigned
        // Access nodes directly from the instance
        expect(pitchShiftEffect.scriptProcessor).toBeDefined();
        expect(pitchShiftEffect.soundTouch).toBeDefined();
        expect(pitchShiftEffect.wetGain).toBeDefined();
        expect(pitchShiftEffect.dryGain).toBeDefined();
        // Check internal connections (use optional chaining)
        // Access nodes directly from the instance
        expect(pitchShiftEffect._effectInput?.connect).toHaveBeenCalledWith(pitchShiftEffect.scriptProcessor);
        expect(pitchShiftEffect._effectInput?.connect).toHaveBeenCalledWith(pitchShiftEffect.dryGain);
        expect(pitchShiftEffect.scriptProcessor?.connect).toHaveBeenCalledWith(pitchShiftEffect.wetGain);
        expect(pitchShiftEffect.dryGain?.connect).toHaveBeenCalledWith(pitchShiftEffect._output);
        expect(pitchShiftEffect.wetGain?.connect).toHaveBeenCalledWith(pitchShiftEffect._output);

        // Check default parameters state via getParameters
        const defaultParams = pitchShiftEffect.getParameters();
        expect(defaultParams.pitch).toBe(0);
        expect(defaultParams.mix).toBeCloseTo(1.0);
        // Check SoundTouch instance properties directly
        expect(pitchShiftEffect.soundTouch?.pitchSemitones).toBe(0);
        expect(pitchShiftEffect.soundTouch?.tempo).toBe(1.0);

        // Check onaudioprocess assignment
        expect(pitchShiftEffect.scriptProcessor?.onaudioprocess).toBeInstanceOf(Function);
    });

     test('should instantiate with initial parameters', () => {
        const initialParams = { pitch: 5, mix: 0.7, bufferSize: 2048 };
        pitchShiftEffect?.dispose(); // Dispose the one from beforeEach

        // Instantiate with specific params
        pitchShiftEffect = new PitchShiftEffect(audioContext, initialParams);
        const mockSoundTouchInstance = pitchShiftEffect.soundTouch; // Local var
        const newDryGain = pitchShiftEffect.dryGain;
        const newWetGain = pitchShiftEffect.wetGain;

        const params = pitchShiftEffect.getParameters();
        expect(params.pitch).toBe(5);
        expect(params.mix).toBeCloseTo(0.7);
        expect(mockSoundTouchInstance?.pitchSemitones).toBe(5);
        expect(newDryGain?.gain.value).toBeCloseTo(0.3); // Check initial value set by constructor/setParameters
        expect(newWetGain?.gain.value).toBe(0.7); // Check initial value set by constructor/setParameters
        expect(audioContext.createScriptProcessor).toHaveBeenCalledWith(2048, 2, 2);
    });

    test('setParameters should update pitch and mix', () => {
        const mockSoundTouchInstance = pitchShiftEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !pitchShiftEffect.dryGain || !pitchShiftEffect.wetGain) throw new Error("Effect not initialized properly");
        // No need to clear mocks due to resetMocks: true

        const params = { pitch: -3, mix: 0.6 };
        pitchShiftEffect.setParameters(params, 0.1); // Use non-zero time for ramp

        const currentParams = pitchShiftEffect.getParameters();
        expect(currentParams.pitch).toBe(-3);
        expect(currentParams.mix).toBeCloseTo(0.6);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(-3);
        // Check that setValueAtTime was called (resetMocks ensures it's fresh)
        expect(pitchShiftEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.4), audioContext.currentTime);
        expect(pitchShiftEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.6), audioContext.currentTime);
    });

    test('setParameters should clamp pitch', () => {
        const mockSoundTouchInstance = pitchShiftEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance) throw new Error("Effect not initialized properly");
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
        const mockSoundTouchInstance = pitchShiftEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !pitchShiftEffect.dryGain || !pitchShiftEffect.wetGain) throw new Error("Effect not initialized properly");
        const data = { pitch: 10, mix: 0.1 };
        // No need to clear mocks

        pitchShiftEffect.fromJSON(data);

        const params = pitchShiftEffect.getParameters();
        expect(params.pitch).toBe(10);
        expect(params.mix).toBeCloseTo(0.1);
        expect(mockSoundTouchInstance.pitchSemitones).toBe(10);
        expect(pitchShiftEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), audioContext.currentTime);
        expect(pitchShiftEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), audioContext.currentTime);
    });

    test('_processAudio should copy data from internal buffer to output', () => {
        const mockSoundTouchInstance = pitchShiftEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !pitchShiftEffect.stBuffer) throw new Error("Effect not initialized properly");
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
        // Check they exist before spying
        if (!nodeToDispose || !wetToDispose || !dryToDispose) {
            throw new Error("Nodes not initialized before dispose test");
        }

        const scriptDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        // No need to spy on gain nodes, just check they are disconnected via the script processor

        pitchShiftEffect.dispose();

        expect(scriptDisconnectSpy).toHaveBeenCalled();
        // Check instance properties are nulled
        expect(pitchShiftEffect.scriptProcessor).toBeNull();
        expect(pitchShiftEffect.soundTouch).toBeNull();
        expect(pitchShiftEffect.stBuffer).toBeNull();
        expect(pitchShiftEffect.wetGain).toBeNull();
        expect(pitchShiftEffect.dryGain).toBeNull();
    });
});
