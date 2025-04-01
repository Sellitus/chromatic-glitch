import { TimeStretchEffect } from '../../../../src/js/engine/audio/effects/TimeStretchEffect';
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

describe('TimeStretchEffect', () => {
    let audioContext;
    let timeStretchEffect; // Keep this
    const bufferSize = 4096; // Match default or specified buffer size

    beforeEach(() => {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        // Instantiate the effect - rely on resetMocks: true for cleanup
        timeStretchEffect = new TimeStretchEffect(audioContext, { bufferSize: bufferSize });
    });

    afterEach(() => {
        timeStretchEffect?.dispose();
    });

    test('should instantiate correctly with default parameters', () => {
        expect(timeStretchEffect).toBeInstanceOf(TimeStretchEffect);
        // Check nodes were created and assigned
        // Access nodes directly from the instance
        expect(timeStretchEffect.scriptProcessor).toBeDefined();
        expect(timeStretchEffect.soundTouch).toBeDefined();
        expect(timeStretchEffect.wetGain).toBeDefined();
        expect(timeStretchEffect.dryGain).toBeDefined();
        // Check internal connections (use optional chaining)
        // Access nodes directly from the instance
        expect(timeStretchEffect._effectInput?.connect).toHaveBeenCalledWith(timeStretchEffect.scriptProcessor);
        expect(timeStretchEffect._effectInput?.connect).toHaveBeenCalledWith(timeStretchEffect.dryGain);
        expect(timeStretchEffect.scriptProcessor?.connect).toHaveBeenCalledWith(timeStretchEffect.wetGain);
        expect(timeStretchEffect.dryGain?.connect).toHaveBeenCalledWith(timeStretchEffect._output);
        expect(timeStretchEffect.wetGain?.connect).toHaveBeenCalledWith(timeStretchEffect._output);

        // Check default parameters state via getParameters
        const defaultParams = timeStretchEffect.getParameters();
        expect(defaultParams.tempo).toBe(1.0);
        expect(defaultParams.mix).toBeCloseTo(1.0);
        // Check SoundTouch instance properties directly
        expect(timeStretchEffect.soundTouch?.pitchSemitones).toBe(0); // Should remain 0
        expect(timeStretchEffect.soundTouch?.tempo).toBe(1.0);

        // Check onaudioprocess assignment
        expect(timeStretchEffect.scriptProcessor?.onaudioprocess).toBeInstanceOf(Function);
    });

     test('should instantiate with initial parameters', () => {
        const initialParams = { tempo: 1.5, mix: 0.7, bufferSize: 2048 };
        timeStretchEffect?.dispose(); // Dispose the one from beforeEach

        // Instantiate with specific params
        timeStretchEffect = new TimeStretchEffect(audioContext, initialParams);
        const mockSoundTouchInstance = timeStretchEffect.soundTouch; // Local var
        const newDryGain = timeStretchEffect.dryGain;
        const newWetGain = timeStretchEffect.wetGain;

        const params = timeStretchEffect.getParameters();
        expect(params.tempo).toBe(1.5);
        expect(params.mix).toBeCloseTo(0.7);
        expect(mockSoundTouchInstance?.tempo).toBe(1.5);
        expect(newDryGain?.gain.value).toBeCloseTo(0.3); // Check initial value set by constructor/setParameters
        expect(newWetGain?.gain.value).toBe(0.7); // Check initial value set by constructor/setParameters
        expect(audioContext.createScriptProcessor).toHaveBeenCalledWith(2048, 2, 2);
    });

    test('setParameters should update tempo and mix', () => {
        const mockSoundTouchInstance = timeStretchEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !timeStretchEffect.dryGain || !timeStretchEffect.wetGain) throw new Error("Effect not initialized properly");
        // No need to clear mocks due to resetMocks: true

        const params = { tempo: 0.8, mix: 0.6 };
        timeStretchEffect.setParameters(params, 0.1); // Use non-zero time for ramp

        const currentParams = timeStretchEffect.getParameters();
        expect(currentParams.tempo).toBe(0.8);
        expect(currentParams.mix).toBeCloseTo(0.6);
        expect(mockSoundTouchInstance.tempo).toBe(0.8);
        // Check that setValueAtTime was called (resetMocks ensures it's fresh)
        expect(timeStretchEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.4), audioContext.currentTime);
        expect(timeStretchEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.6), audioContext.currentTime);
    });

    test('setParameters should clamp tempo', () => {
        const mockSoundTouchInstance = timeStretchEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance) throw new Error("Effect not initialized properly");
        timeStretchEffect.setParameters({ tempo: 4.0 });
        expect(timeStretchEffect.getParameters().tempo).toBe(3.0);
        expect(mockSoundTouchInstance.tempo).toBe(3.0);

        timeStretchEffect.setParameters({ tempo: 0.1 });
        expect(timeStretchEffect.getParameters().tempo).toBe(0.5);
        expect(mockSoundTouchInstance.tempo).toBe(0.5);
    });

    test('getParameters should return current values', () => {
        timeStretchEffect.setParameters({ tempo: 1.2, mix: 0.25 }, 0);
        expect(timeStretchEffect.getParameters()).toEqual({
            tempo: 1.2,
            mix: 0.25
        });
    });

    test('toJSON should return current parameters', () => {
        timeStretchEffect.setParameters({ tempo: 0.9, mix: 0.9 }, 0);
        const jsonResult = timeStretchEffect.toJSON();
        expect(jsonResult.tempo).toBe(0.9);
        expect(jsonResult.mix).toBeCloseTo(0.9);
    });

    test('fromJSON should set parameters instantly', () => {
        const mockSoundTouchInstance = timeStretchEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !timeStretchEffect.dryGain || !timeStretchEffect.wetGain) throw new Error("Effect not initialized properly");
        const data = { tempo: 2.0, mix: 0.1 };
        // No need to clear mocks

        timeStretchEffect.fromJSON(data);

        const params = timeStretchEffect.getParameters();
        expect(params.tempo).toBe(2.0);
        expect(params.mix).toBeCloseTo(0.1);
        expect(mockSoundTouchInstance.tempo).toBe(2.0);
        expect(timeStretchEffect.dryGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.9), audioContext.currentTime);
        expect(timeStretchEffect.wetGain.gain.setValueAtTime).toHaveBeenCalledWith(expect.closeTo(0.1), audioContext.currentTime);
    });

    test('_processAudio should copy data from internal buffer to output', () => {
        const mockSoundTouchInstance = timeStretchEffect.soundTouch; // Local var
        if (!mockSoundTouchInstance || !timeStretchEffect.stBuffer) throw new Error("Effect not initialized properly");
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
        timeStretchEffect.stBuffer = internalBuffer; // Assign directly for test

        // Simulate SoundTouch returning samples (needed for the copy logic inside _processAudio)
        mockSoundTouchInstance.receiveSamples = jest.fn().mockReturnValue(bufferSize); // Simulate receiving a full buffer


        // Call the process function directly, bypassing gain/bypass concerns for this specific test
        timeStretchEffect._processAudio(mockEvent);

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
        const nodeToDispose = timeStretchEffect.scriptProcessor;
        const wetToDispose = timeStretchEffect.wetGain;
        const dryToDispose = timeStretchEffect.dryGain;
        // Check they exist before spying
        if (!nodeToDispose || !wetToDispose || !dryToDispose) {
            throw new Error("Nodes not initialized before dispose test");
        }

        const scriptDisconnectSpy = jest.spyOn(nodeToDispose, 'disconnect');
        // No need to spy on gain nodes, just check they are disconnected via the script processor

        timeStretchEffect.dispose();

        expect(scriptDisconnectSpy).toHaveBeenCalled();
        // Check instance properties are nulled
        expect(timeStretchEffect.scriptProcessor).toBeNull();
        expect(timeStretchEffect.soundTouch).toBeNull();
        expect(timeStretchEffect.stBuffer).toBeNull();
        expect(timeStretchEffect.wetGain).toBeNull();
        expect(timeStretchEffect.dryGain).toBeNull();
    });
});
