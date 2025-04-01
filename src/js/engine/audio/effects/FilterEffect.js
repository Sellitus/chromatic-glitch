import { EffectNode } from './EffectNode.js';

/**
 * FilterEffect - Implements various filter types (lowpass, highpass, etc.)
 * using the BiquadFilterNode.
 */
export class FilterEffect extends EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     * @param {object} [initialParams={}] - Initial parameters for the filter.
     * @param {BiquadFilterType} [initialParams.type='lowpass'] - Filter type.
     * @param {number} [initialParams.frequency=350] - Cutoff/center frequency in Hz.
     * @param {number} [initialParams.Q=1] - Quality factor (resonance).
     * @param {number} [initialParams.gain=0] - Gain in dB (only used for peaking, lowshelf, highshelf).
     */
    constructor(audioContext, initialParams = {}) {
        super(audioContext);

        this.filterNode = this.audioContext.createBiquadFilter();

        // Connect the internal effect input to the filter, and filter to the main output
        this._effectInput.connect(this.filterNode);
        this.filterNode.connect(this._output);

        // Set initial parameters
        const defaults = {
            type: 'lowpass',
            frequency: 350,
            Q: 1,
            gain: 0
        };
        this.setParameters({ ...defaults, ...initialParams }, 0); // Set instantly
    }

    /**
     * Sets the filter parameters.
     * @param {object} params - Parameter object.
     * @param {BiquadFilterType} [params.type] - Filter type.
     * @param {number} [params.frequency] - Cutoff/center frequency in Hz.
     * @param {number} [params.Q] - Quality factor (resonance).
     * @param {number} [params.gain] - Gain in dB.
     * @param {number} [rampTime=0.05] - Time for smooth transition.
     */
    setParameters(params, rampTime = 0.05) {
        const now = this.audioContext.currentTime;
        const targetTime = now + rampTime;

        if (params.type !== undefined) {
            // Ensure valid type before setting
            const validTypes = ['lowpass', 'highpass', 'bandpass', 'lowshelf', 'highshelf', 'peaking', 'notch', 'allpass'];
            if (validTypes.includes(params.type)) {
                this.filterNode.type = params.type;
            } else {
                console.warn(`Invalid filter type: ${params.type}. Using current type: ${this.filterNode.type}`);
            }
        }
        if (params.frequency !== undefined) {
            // Frequency is clamped by the browser, typically to Nyquist frequency
            this.filterNode.frequency.linearRampToValueAtTime(params.frequency, targetTime);
        }
        if (params.Q !== undefined) {
            // Q is typically positive, but exact range depends on implementation
            this.filterNode.Q.linearRampToValueAtTime(params.Q, targetTime);
        }
        if (params.gain !== undefined) {
            // Gain is relevant for peaking, lowshelf, highshelf
            this.filterNode.gain.linearRampToValueAtTime(params.gain, targetTime);
        }
    }

    /**
     * Gets the current filter parameters.
     * @returns {object} Current parameters.
     */
    getParameters() {
        return {
            type: this.filterNode.type,
            frequency: this.filterNode.frequency.value,
            Q: this.filterNode.Q.value,
            gain: this.filterNode.gain.value
        };
    }

    /**
     * Serializes the effect's state to a JSON object.
     * @returns {object}
     */
    toJSON() {
        return this.getParameters();
    }

    /**
     * Restores the effect's state from a JSON object.
     * @param {object} data - The JSON object containing the state.
     */
    fromJSON(data) {
        this.setParameters(data, 0); // Apply instantly
    }

     /**
     * Provides data for visualization (e.g., frequency response).
     * Placeholder implementation.
     * @returns {object} Visualization data.
     */
    getVisualizationData() {
        // Could calculate and return frequency/phase response if needed
        return {
            type: 'filter',
            params: this.getParameters()
            // freqResponse: this.calculateFrequencyResponse() // Example
        };
    }

    /**
     * Cleans up the internal filter node.
     */
    dispose() {
        this.filterNode?.disconnect(); // Add null check
        this.filterNode = null;
        super.dispose(); // Call parent dispose to clean up common nodes
    }
}
