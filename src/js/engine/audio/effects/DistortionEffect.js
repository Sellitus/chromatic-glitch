import { EffectNode } from './EffectNode.js';

/**
 * DistortionEffect - Applies distortion using WaveShaperNode.
 */
export class DistortionEffect extends EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     * @param {object} [initialParams={}] - Initial parameters for the distortion.
     * @param {number} [initialParams.amount=50] - Distortion amount (arbitrary scale, e.g., 0-100).
     * @param {number} [initialParams.mix=0.5] - Wet/dry mix (0=dry, 1=wet).
     * @param {string} [initialParams.curveType='tanh'] - Type of distortion curve ('tanh', 'soft', 'hard').
     */
    constructor(audioContext, initialParams = {}) {
        super(audioContext);

        this.waveShaperNode = this.audioContext.createWaveShaper();
        this.wetGain = this.audioContext.createGain();
        this.dryGain = this.audioContext.createGain();
        this._currentAmount = 0; // Store internally
        this._currentCurveType = 'tanh'; // Store internally

        // Routing:
        // Input -> Dry Gain -> Output
        // Input -> WaveShaper -> Wet Gain -> Output

        this._effectInput.connect(this.waveShaperNode);
        this._effectInput.connect(this.dryGain); // Dry path

        this.waveShaperNode.connect(this.wetGain); // Wet path

        this.dryGain.connect(this._output);
        this.wetGain.connect(this._output);

        // Set initial parameters
        const defaults = {
            amount: 50,
            mix: 0.5,
            curveType: 'tanh'
        };
        this.setParameters({ ...defaults, ...initialParams }, 0); // Set instantly
    }

    /**
     * Generates a distortion curve for the WaveShaperNode.
     * @param {number} amount - Distortion amount (e.g., 0-100+). Higher values mean more distortion.
     * @param {string} type - The type of curve ('tanh', 'soft', 'hard').
     * @param {number} [n_samples=4096] - Number of samples in the curve array.
     * @returns {Float32Array} The generated curve.
     */
    _makeDistortionCurve(amount, type = 'tanh', n_samples = 4096) {
        const curve = new Float32Array(n_samples);
        const k = typeof amount === 'number' ? amount : 50; // Default amount if invalid

        // Normalize k to a useful range for the formulas, e.g., 0 to 1 or higher
        const normalizedAmount = k / 100.0; // Example normalization

        switch (type) {
            case 'soft': // Simple quadratic curve
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1; // Map i to -1 to 1 range
                    // Apply soft clipping based on amount
                    const threshold = 1.0 - normalizedAmount * 0.5; // Adjust threshold
                    if (x > threshold) {
                        curve[i] = threshold + (x - threshold) / (1 + Math.pow((x - threshold) / (1 - threshold), 2));
                    } else if (x < -threshold) {
                        curve[i] = -threshold + (x + threshold) / (1 + Math.pow((x + threshold) / (1 - threshold), 2));
                    } else {
                        curve[i] = x;
                    }
                    // Scale the output slightly based on amount to add 'drive'
                    curve[i] *= (1 + normalizedAmount * 0.5);
                }
                break;

            case 'hard': // Hard clipping
                 for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    const threshold = 1.0 - normalizedAmount * 0.8; // Lower threshold for harder clip
                    curve[i] = Math.max(-threshold, Math.min(threshold, x));
                     // Add drive
                    curve[i] *= (1 + normalizedAmount);
                }
                break;

            case 'tanh': // Hyperbolic tangent (classic)
            default:
                const degree = Math.PI * (1 + normalizedAmount * 4); // Increase curve steepness with amount
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    curve[i] = Math.tanh(x * degree);
                }
                break;
        }
        return curve;
    }

    /**
     * Sets the distortion parameters.
     * @param {object} params - Parameter object.
     * @param {number} [params.amount] - Distortion amount.
     * @param {number} [params.mix] - Wet/dry mix (0-1).
     * @param {string} [params.curveType] - Type of distortion curve.
     * @param {number} [rampTime=0.05] - Time for smooth transition (only applies to mix).
     */
    setParameters(params, rampTime = 0.05) {
        const now = this.audioContext.currentTime;
        const targetTime = now + rampTime;
        let curveNeedsUpdate = false;

        if (params.amount !== undefined && params.amount !== this._currentAmount) {
            this._currentAmount = params.amount;
            curveNeedsUpdate = true;
        }
        if (params.curveType !== undefined && params.curveType !== this._currentCurveType) {
            this._currentCurveType = params.curveType;
            curveNeedsUpdate = true;
        }

        if (curveNeedsUpdate) {
            this.waveShaperNode.curve = this._makeDistortionCurve(this._currentAmount, this._currentCurveType);
            // Oversampling can reduce aliasing, especially for harsh distortion
            // '2x' or '4x' are common values. 'none' is default.
            this.waveShaperNode.oversample = this._currentAmount > 50 ? '4x' : '2x';
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
     * Gets the current distortion parameters.
     * @returns {object} Current parameters.
     */
    getParameters() {
        const wetLevel = this.wetGain.gain.value;
        const mix = wetLevel; // Similar calculation as DelayEffect

        return {
            amount: this._currentAmount,
            mix: mix,
            curveType: this._currentCurveType
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
     * Provides data for visualization.
     * @returns {object} Visualization data.
     */
    getVisualizationData() {
        return {
            type: 'distortion',
            params: this.getParameters(),
            // Could return a subset of the curve data if needed
            // curve: this.waveShaperNode.curve ? Array.from(this.waveShaperNode.curve.slice(0, 100)) : null
        };
    }

    /**
     * Cleans up the internal distortion nodes.
     */
    dispose() {
        console.log(`Disposing DistortionEffect...`); // Add log for clarity
        // Disconnect nodes only if they exist, wrapped in try/catch
        try { this._effectInput?.disconnect(this.waveShaperNode); } catch (e) { console.warn(`Error disconnecting _effectInput from waveShaperNode: ${e.message}`); }
        try { this._effectInput?.disconnect(this.dryGain); } catch (e) { console.warn(`Error disconnecting _effectInput from dryGain: ${e.message}`); }
        try { this.waveShaperNode?.disconnect(this.wetGain); } catch (e) { console.warn(`Error disconnecting waveShaperNode from wetGain: ${e.message}`); }
        try { this.dryGain?.disconnect(this._output); } catch (e) { console.warn(`Error disconnecting dryGain from _output: ${e.message}`); }
        try { this.wetGain?.disconnect(this._output); } catch (e) { console.warn(`Error disconnecting wetGain from _output: ${e.message}`); }

        if (this.waveShaperNode) {
            try { this.waveShaperNode.curve = null; } catch (e) { console.warn(`Error clearing waveShaperNode curve: ${e.message}`); } // Clear curve reference
        }
        this.waveShaperNode = null;
        this.wetGain = null;
        this.dryGain = null;

        super.dispose(); // Call parent dispose
    }
}
