import { EffectNode } from './EffectNode.js';

/**
 * ReverbEffect - Implements convolution reverb using ConvolverNode.
 * Allows loading custom impulse responses or generating a basic one.
 */
export class ReverbEffect extends EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     * @param {object} [initialParams={}] - Initial parameters for the reverb.
     * @param {AudioBuffer} [initialParams.impulseResponse=null] - The impulse response buffer. If null, a basic one is generated.
     * @param {number} [initialParams.mix=0.5] - Wet/dry mix (0=dry, 1=wet).
     */
    constructor(audioContext, initialParams = {}) {
        super(audioContext);

        this.convolverNode = this.audioContext.createConvolver();
        this.wetGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();
        this._impulseResponseInfo = null; // Store info about the loaded IR

        // Routing:
        // Input -> Dry Gain -> Output
        // Input -> Convolver -> Wet Gain -> Output

        this._effectInput.connect(this.convolverNode);
        this._effectInput.connect(this.dryGain); // Dry path

        this.convolverNode.connect(this.wetGain); // Wet path

        this.dryGain.connect(this._output);
        this.wetGain.connect(this._output);

        // Set initial parameters
        const defaults = {
            impulseResponse: null,
            mix: 0.5
        };
        const params = { ...defaults, ...initialParams };

        if (!params.impulseResponse) {
            console.log("No impulse response provided, generating a basic one.");
            params.impulseResponse = this._generateBasicImpulseResponse();
            this._impulseResponseInfo = { name: 'Generated Basic Reverb', duration: params.impulseResponse.duration };
        } else {
             // Basic check if it looks like an AudioBuffer
             if (typeof params.impulseResponse.duration === 'number' && typeof params.impulseResponse.getChannelData === 'function') {
                 this._impulseResponseInfo = { name: 'Custom Impulse Response', duration: params.impulseResponse.duration };
             } else {
                 console.warn("Provided impulseResponse doesn't look like an AudioBuffer. Generating basic one.");
                 params.impulseResponse = this._generateBasicImpulseResponse();
                 this._impulseResponseInfo = { name: 'Generated Basic Reverb', duration: params.impulseResponse.duration };
             }
        }

        this.convolverNode.buffer = params.impulseResponse;
        this.setParameters({ mix: params.mix }, 0); // Set mix instantly
    }

    /**
     * Generates a simple, synthetic impulse response.
     * @param {number} [duration=2] - Duration in seconds.
     * @param {number} [decay=2] - Decay rate.
     * @returns {AudioBuffer} The generated impulse response buffer.
     */
    _generateBasicImpulseResponse(duration = 2, decay = 2) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate); // Stereo

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Simple noise decay
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay);
            }
        }
        return impulse;
    }

    /**
     * Sets the reverb parameters.
     * @param {object} params - Parameter object.
     * @param {AudioBuffer} [params.impulseResponse] - A new impulse response buffer to load.
     * @param {number} [params.mix] - Wet/dry mix (0-1).
     * @param {number} [rampTime=0.05] - Time for smooth transition (only applies to mix).
     */
    setParameters(params, rampTime = 0.05) {
         if (!this.audioContext || !this.convolverNode || !this.dryGain?.gain || !this.wetGain?.gain) {
            console.warn("Cannot set parameters for ReverbEffect: Essential components missing.");
            return;
        }
        const now = this.audioContext.currentTime;
        const targetTime = now + rampTime;

        if (params.impulseResponse !== undefined) {
            // Duck typing check for AudioBuffer-like object
            const isAudioBufferLike = params.impulseResponse &&
                                      typeof params.impulseResponse.duration === 'number' &&
                                      typeof params.impulseResponse.getChannelData === 'function';

            if (isAudioBufferLike) {
                this.convolverNode.buffer = params.impulseResponse;
                this._impulseResponseInfo = { name: 'Custom Impulse Response', duration: params.impulseResponse.duration };
            } else if (params.impulseResponse === null) {
                 console.log("Setting impulse response to null, generating basic one.");
                 const newIR = this._generateBasicImpulseResponse();
                 this.convolverNode.buffer = newIR;
                 this._impulseResponseInfo = { name: 'Generated Basic Reverb', duration: newIR.duration };
            } else {
                console.warn("Invalid impulseResponse parameter. Must be an AudioBuffer or null.");
            }
        }

        if (params.mix !== undefined) {
            const clampedMix = Math.max(0, Math.min(params.mix, 1));
            const dryLevel = 1 - clampedMix;
            const wetLevel = clampedMix;

            // Use setValueAtTime for instant changes, ramp otherwise
            if (rampTime <= 0) {
                this.dryGain.gain.setValueAtTime(dryLevel, now);
                this.wetGain.gain.setValueAtTime(wetLevel, now);
            } else {
                this.dryGain.gain.linearRampToValueAtTime(dryLevel, targetTime);
                this.wetGain.gain.linearRampToValueAtTime(wetLevel, targetTime);
            }
        }
    }

    /**
     * Gets the current reverb parameters.
     * @returns {object} Current parameters.
     */
    getParameters() {
        // Gain values might be ramping, so reading .value gives the current value in the ramp
        const wetLevel = this.wetGain?.gain.value ?? 0;
        const dryLevel = this.dryGain?.gain.value ?? 1;
        // Approximate mix based on current gain levels. Might not be perfectly accurate during ramps.
        const mix = (wetLevel + dryLevel > 1e-6) ? wetLevel / (wetLevel + dryLevel) : wetLevel; // Avoid division by zero

        return {
            mix: mix,
            impulseResponseInfo: this._impulseResponseInfo // Return info, not the buffer itself
        };
    }

    /**
     * Serializes the effect's state to a JSON object.
     * Note: Does not serialize the actual impulse response buffer.
     * The preset system needs to handle reloading the correct IR.
     * @returns {object}
     */
    toJSON() {
        return {
            mix: this.getParameters().mix,
            impulseResponseInfo: this._impulseResponseInfo
        };
    }

    /**
     * Restores the effect's state from a JSON object.
     * Note: Does not restore the impulse response buffer itself.
     * Assumes the correct IR buffer will be set externally based on preset data.
     * @param {object} data - The JSON object containing the state.
     */
    fromJSON(data) {
        if (data.mix !== undefined) {
            this.setParameters({ mix: data.mix }, 0); // Apply instantly
        }
        console.warn("ReverbEffect.fromJSON only restores 'mix'. Impulse response must be set separately based on 'impulseResponseInfo'.");
        if (data.impulseResponseInfo) {
             this._impulseResponseInfo = data.impulseResponseInfo; // Restore info for display/debugging
        }
    }

     /**
     * Provides data for visualization.
     * @returns {object} Visualization data.
     */
    getVisualizationData() {
        return {
            type: 'reverb',
            params: this.getParameters()
            // Could potentially return waveform of IR if needed
        };
    }

    /**
     * Cleans up the internal reverb nodes.
     */
    dispose() {
        console.log(`Disposing ReverbEffect...`);
        // Disconnect internal nodes first, with null checks and try/catch
        if (this._effectInput) {
            try { if (this.convolverNode) this._effectInput.disconnect(this.convolverNode); } catch (e) { console.warn(`Error disconnecting _effectInput from convolverNode: ${e.message}`); }
            try { if (this.dryGain) this._effectInput.disconnect(this.dryGain); } catch (e) { console.warn(`Error disconnecting _effectInput from dryGain: ${e.message}`); }
        }
        if (this.convolverNode) {
            try {
                // Disconnect convolver from nodes it connects TO (wetGain)
                if (this.wetGain) this.convolverNode.disconnect(this.wetGain);
                // Disconnect convolver from all other nodes
                this.convolverNode.disconnect();
                this.convolverNode.buffer = null; // Release buffer reference
             } catch (e) { console.warn(`Error disconnecting/clearing convolverNode: ${e.message}`); }
        }
        if (this.dryGain) {
            try { this.dryGain.disconnect(); } catch (e) { console.warn(`Error disconnecting dryGain: ${e.message}`); }
        }
        if (this.wetGain) {
            try { this.wetGain.disconnect(); } catch (e) { console.warn(`Error disconnecting wetGain: ${e.message}`); }
        }

        // Nullify references to specific nodes and buffer
        this.convolverNode = null;
        this.dryGain = null;
        this.wetGain = null;
        this._impulseResponseInfo = null;

        // Call base class dispose LAST
        super.dispose();
        console.log("ReverbEffect disposed.");
    }
}

export default ReverbEffect;
