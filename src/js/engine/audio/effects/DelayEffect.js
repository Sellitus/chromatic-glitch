import { EffectNode } from './EffectNode.js';

/**
 * DelayEffect - Implements a delay/echo effect with feedback.
 */
export class DelayEffect extends EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     * @param {object} [initialParams={}] - Initial parameters for the delay.
     * @param {number} [initialParams.delayTime=0.5] - Delay time in seconds. Max is typically browser-dependent (often 180s).
     * @param {number} [initialParams.feedback=0.5] - Feedback amount (0 to ~0.99). Values >= 1 can cause runaway feedback.
     * @param {number} [initialParams.mix=0.5] - Wet/dry mix (0=dry, 1=wet).
     */
    constructor(audioContext, initialParams = {}) {
        super(audioContext);

        this.delayNode = this.audioContext.createDelay(10); // Max delay time (can be adjusted)
        this.feedbackGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();

        // Routing:
        // Input -> Dry Gain -> Output
        // Input -> Delay -> Wet Gain -> Output
        // Delay -> Feedback Gain -> Delay (feedback loop)

        this._effectInput.connect(this.delayNode);
        this._effectInput.connect(this.dryGain); // Dry path

        this.delayNode.connect(this.wetGain); // Wet path
        this.delayNode.connect(this.feedbackGain);
        this.feedbackGain.connect(this.delayNode); // Feedback loop

        this.dryGain.connect(this._output);
        this.wetGain.connect(this._output);

        // Set initial parameters
        const defaults = {
            delayTime: 0.5,
            feedback: 0.5,
            mix: 0.5
        };
        this.setParameters({ ...defaults, ...initialParams }, 0); // Set instantly
    }

    /**
     * Sets the delay parameters.
     * @param {object} params - Parameter object.
     * @param {number} [params.delayTime] - Delay time in seconds.
     * @param {number} [params.feedback] - Feedback amount (0-1).
     * @param {number} [params.mix] - Wet/dry mix (0-1).
     * @param {number} [rampTime=0.05] - Time for smooth transition.
     */
    setParameters(params, rampTime = 0.05) {
        const now = this.audioContext.currentTime;
        const targetTime = now + rampTime;

        if (params.delayTime !== undefined) {
            // Clamp delayTime to reasonable bounds if necessary, e.g., 0 to maxDelay
            const maxDelay = this.delayNode.delayTime.maxValue;
            const clampedDelay = Math.max(0, Math.min(params.delayTime, maxDelay));
            this.delayNode.delayTime.linearRampToValueAtTime(clampedDelay, targetTime);
        }
        if (params.feedback !== undefined) {
            // Clamp feedback to prevent runaway levels
            const clampedFeedback = Math.max(0, Math.min(params.feedback, 0.99));
            this.feedbackGain.gain.linearRampToValueAtTime(clampedFeedback, targetTime);
        }
        if (params.mix !== undefined) {
            const clampedMix = Math.max(0, Math.min(params.mix, 1));
            const dryLevel = 1 - clampedMix;
            const wetLevel = clampedMix;
            this.dryGain.gain.linearRampToValueAtTime(dryLevel, targetTime);
            this.wetGain.gain.linearRampToValueAtTime(wetLevel, targetTime);
        }
    }

    /**
     * Gets the current delay parameters.
     * @returns {object} Current parameters.
     */
    getParameters() {
        // Mix needs to be calculated from wet/dry gains
        const wetLevel = this.wetGain.gain.value;
        const dryLevel = this.dryGain.gain.value;
        // This assumes they sum to 1, which might not be true during ramps.
        // A more accurate approach might store the target mix value.
        // For simplicity, we'll use the wet level as the mix indicator here.
        const mix = wetLevel;

        return {
            delayTime: this.delayNode.delayTime.value,
            feedback: this.feedbackGain.gain.value,
            mix: mix // Or store the intended mix value separately
        };
    }

    /**
     * Serializes the effect's state to a JSON object.
     * @returns {object}
     */
    toJSON() {
        // Store the intended mix value if it's tracked separately, otherwise calculate
        const currentParams = this.getParameters();
        // If mix calculation isn't robust, might need to store the last set mix value
        // For now, use the calculated one:
        return currentParams;
    }

    /**
     * Restores the effect's state from a JSON object.
     * @param {object} data - The JSON object containing the state.
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
            type: 'delay',
            params: this.getParameters()
        };
    }

    /**
     * Cleans up the internal delay nodes.
     */
    dispose() {
        console.log(`Disposing DelayEffect...`); // Add log for clarity
        // Disconnect nodes only if they exist, wrapped in try/catch
        try { this._effectInput?.disconnect(this.delayNode); } catch (e) { console.warn(`Error disconnecting _effectInput from delayNode: ${e.message}`); }
        try { this._effectInput?.disconnect(this.dryGain); } catch (e) { console.warn(`Error disconnecting _effectInput from dryGain: ${e.message}`); }
        try { this.delayNode?.disconnect(this.wetGain); } catch (e) { console.warn(`Error disconnecting delayNode from wetGain: ${e.message}`); }
        try { this.delayNode?.disconnect(this.feedbackGain); } catch (e) { console.warn(`Error disconnecting delayNode from feedbackGain: ${e.message}`); }
        try { this.feedbackGain?.disconnect(this.delayNode); } catch (e) { console.warn(`Error disconnecting feedbackGain from delayNode: ${e.message}`); } // Corrected: disconnect feedback loop
        try { this.dryGain?.disconnect(this._output); } catch (e) { console.warn(`Error disconnecting dryGain from _output: ${e.message}`); }
        try { this.wetGain?.disconnect(this._output); } catch (e) { console.warn(`Error disconnecting wetGain from _output: ${e.message}`); }

        this.delayNode = null;
        this.feedbackGain = null;
        this.wetGain = null;
        this.dryGain = null;

        super.dispose(); // Call parent dispose
    }
}
