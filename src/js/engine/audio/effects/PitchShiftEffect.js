import { EffectNode } from './EffectNode.js';
import { SoundTouch } from 'soundtouchjs'; // Assuming ES module compatibility or build setup handles it

/**
 * PitchShiftEffect - Applies pitch shifting using SoundTouch library via ScriptProcessorNode.
 * WARNING: Uses deprecated ScriptProcessorNode which runs on the main thread and can cause performance issues.
 * An AudioWorklet implementation is preferred for production use.
 */
export class PitchShiftEffect extends EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     * @param {object} [initialParams={}] - Initial parameters.
     * @param {number} [initialParams.pitch=0] - Pitch shift amount in semitones (-12 to +12).
     * @param {number} [initialParams.mix=1.0] - Wet/dry mix (0=dry, 1=wet). Defaulting to fully wet for pitch shift.
     * @param {number} [initialParams.bufferSize=4096] - Processing buffer size (powers of 2: 256, 512, ..., 16384).
     */
    constructor(audioContext, initialParams = {}) {
        super(audioContext);

        const defaults = {
            pitch: 0,
            mix: 1.0, // Pitch shift usually replaces the original signal
            bufferSize: 4096
        };
        const params = { ...defaults, ...initialParams };

        // Validate buffer size
        const validBufferSizes = [256, 512, 1024, 2048, 4096, 8192, 16384];
        if (!validBufferSizes.includes(params.bufferSize)) {
            console.warn(`Invalid bufferSize ${params.bufferSize}. Using 4096.`);
            params.bufferSize = 4096;
        }
        this.bufferSize = params.bufferSize;

        // Use try-catch for ScriptProcessorNode creation
        try {
            this.scriptProcessor = this.audioContext.createScriptProcessor(this.bufferSize, 2, 2); // Stereo input/output
        } catch (e) {
            console.error("Failed to create ScriptProcessorNode. PitchShiftEffect will not work.", e);
            this.scriptProcessor = null;
            this.soundTouch = null;
            this.wetGain = null;
            this.dryGain = null;
            this._currentPitch = params.pitch;
            this._currentMix = params.mix;
            return; // Stop constructor
        }

        this.soundTouch = new SoundTouch();
        this.soundTouch.pitchSemitones = params.pitch; // Initial pitch
        this.soundTouch.tempo = 1.0; // Ensure tempo is not affected

        // Buffer for storing processed samples from SoundTouch
        this.stBuffer = new Float32Array(this.bufferSize * 2); // Stereo

        this.wetGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();

        // Internal parameter storage
        this._currentPitch = params.pitch;
        this._currentMix = params.mix;

        // Routing:
        // Input -> Dry Gain -> Output
        // Input -> ScriptProcessor -> Wet Gain -> Output

        this._effectInput.connect(this.scriptProcessor);
        this._effectInput.connect(this.dryGain); // Dry path

        this.scriptProcessor.connect(this.wetGain); // Wet path

        this.dryGain.connect(this._output);
        this.wetGain.connect(this._output);

        // Setup ScriptProcessor callback
        this.scriptProcessor.onaudioprocess = this._processAudio.bind(this);

        // Set initial mix
        this.setParameters({ mix: this._currentMix }, 0);
    }

    _processAudio(event) {
        // Check if soundTouch is available
        if (!this.soundTouch || !this.stBuffer) return;

        const inputBuffer = event.inputBuffer;
        const outputBuffer = event.outputBuffer;
        const inputL = inputBuffer.getChannelData(0);
        const inputR = inputBuffer.getChannelData(1);
        const outputL = outputBuffer.getChannelData(0);
        const outputR = outputBuffer.getChannelData(1);

        // Feed input samples to SoundTouch
        const interleavedInput = new Float32Array(inputL.length * 2);
        for (let i = 0; i < inputL.length; i++) {
            interleavedInput[i * 2] = inputL[i];
            interleavedInput[i * 2 + 1] = inputR[i];
        }
        this.soundTouch.putSamples(interleavedInput);

        // Extract processed samples
        const samplesExtracted = this.soundTouch.receiveSamples(this.stBuffer); // Fills stBuffer

        // De-interleave and copy to output buffer
        if (samplesExtracted > 0) {
            for (let i = 0; i < samplesExtracted; i++) {
                if (i < outputL.length) {
                    outputL[i] = this.stBuffer[i * 2];
                    outputR[i] = this.stBuffer[i * 2 + 1];
                }
            }
            for (let i = samplesExtracted; i < outputL.length; i++) {
                 outputL[i] = 0;
                 outputR[i] = 0;
            }
        } else {
             for (let i = 0; i < outputL.length; i++) {
                 outputL[i] = 0;
                 outputR[i] = 0;
            }
        }
    }

    /**
     * Sets the pitch shift parameters.
     * @param {object} params - Parameter object.
     * @param {number} [params.pitch] - Pitch shift in semitones.
     * @param {number} [params.mix] - Wet/dry mix (0-1).
     * @param {number} [rampTime=0.05] - Time for smooth transition (only applies to mix).
     */
    setParameters(params, rampTime = 0.05) {
        // Check if essential nodes exist
        if (!this.audioContext || !this.soundTouch || !this.dryGain?.gain || !this.wetGain?.gain) {
            console.warn("Cannot set parameters for PitchShiftEffect: Essential components missing.");
            return;
        }

        const now = this.audioContext.currentTime;
        const targetTime = now + rampTime;

        if (params.pitch !== undefined) {
            this._currentPitch = Math.max(-24, Math.min(params.pitch, 24)); // Clamp pitch reasonably
            this.soundTouch.pitchSemitones = this._currentPitch;
        }

        if (params.mix !== undefined) {
            this._currentMix = Math.max(0, Math.min(params.mix, 1));
            const dryLevel = 1 - this._currentMix;
            const wetLevel = this._currentMix;
            // Apply instantly
            this.dryGain.gain.setValueAtTime(dryLevel, now);
            this.wetGain.gain.setValueAtTime(wetLevel, now);
            // Ramping gain with ScriptProcessor can be tricky
            // this.dryGain.gain.linearRampToValueAtTime(dryLevel, targetTime);
            // this.wetGain.gain.linearRampToValueAtTime(wetLevel, targetTime);
        }
    }

    /**
     * Gets the current pitch shift parameters.
     * @returns {object} Current parameters.
     */
    getParameters() {
        return {
            pitch: this._currentPitch,
            mix: this._currentMix
        };
    }

    /**
     * Serializes the effect's state.
     * @returns {object}
     */
    toJSON() {
        return this.getParameters();
    }

    /**
     * Restores the effect's state.
     * @param {object} data - State data.
     */
    fromJSON(data) {
        this.setParameters(data, 0); // Apply instantly
    }

    /**
     * Provides data for visualization.
     * @returns {object} Visualization data.
     */
    getVisualizationData() {
        return {
            type: 'pitchShift',
            params: this.getParameters()
        };
    }

    /**
     * Cleans up the script processor node and SoundTouch instance.
     */
    dispose() {
        console.log(`Disposing PitchShiftEffect...`);
        // Disconnect internal nodes first, with null checks and try/catch
        if (this.scriptProcessor) {
            try {
                this.scriptProcessor.onaudioprocess = null; // Remove the processor callback *before* disconnecting
                this.scriptProcessor.disconnect();
            } catch (e) {
                console.warn(`Error disconnecting scriptProcessor: ${e.message}`);
            }
        }
        // Disconnect _effectInput from internal nodes
        if (this._effectInput) {
             try { if (this.scriptProcessor) this._effectInput.disconnect(this.scriptProcessor); } catch (e) { console.warn(`Error disconnecting _effectInput from scriptProcessor: ${e.message}`); }
             try { if (this.dryGain) this._effectInput.disconnect(this.dryGain); } catch (e) { console.warn(`Error disconnecting _effectInput from dryGain: ${e.message}`); }
        }
        // Disconnect internal gains from output (and anywhere else)
        if (this.dryGain) {
            try { this.dryGain.disconnect(); } catch (e) { console.warn(`Error disconnecting dryGain: ${e.message}`); }
        }
        if (this.wetGain) {
            // The scriptProcessor connects to wetGain, so disconnect that first if scriptProcessor exists
            try { if (this.scriptProcessor) this.scriptProcessor.disconnect(this.wetGain); } catch (e) { console.warn(`Error disconnecting scriptProcessor from wetGain: ${e.message}`); }
            // Then disconnect wetGain from subsequent nodes (like _output)
            try { this.wetGain.disconnect(); } catch (e) { console.warn(`Error disconnecting wetGain: ${e.message}`); }
        }

        // Nullify references to specific nodes and objects of this effect
        this.scriptProcessor = null;
        this.soundTouch = null; // Release SoundTouch instance
        this.stBuffer = null;   // Release buffer
        this.dryGain = null;
        this.wetGain = null;

        // Call base class dispose LAST to clean up common nodes (_input, _output, _bypassGain, _effectInput)
        super.dispose();
        console.log("PitchShiftEffect disposed.");
    }
}

export default PitchShiftEffect;
