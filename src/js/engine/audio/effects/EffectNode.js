/**
 * EffectNode - Base class (Interface) for audio effects.
 * Defines the common API for all effect implementations within the AudioEffectChain.
 * Subclasses must implement the abstract methods.
 */
export class EffectNode {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     */
    constructor(audioContext) {
        if (this.constructor === EffectNode) {
            throw new Error("Abstract classes can't be instantiated.");
        }
        if (!audioContext) {
            throw new Error("AudioContext is required to create an EffectNode.");
        }
        this.audioContext = audioContext;
        this._input = this.audioContext.createGain(); // Common input node
        this._output = this.audioContext.createGain(); // Common output node
        this._bypassGain = this.audioContext.createGain(); // For routing dry signal
        this._effectInput = this.audioContext.createGain(); // Internal input to the effect core
        this._isBypassed = false;

        // Initial setup: input routes to both bypass and effect input
        this._input.connect(this._bypassGain);
        this._input.connect(this._effectInput);

        // Bypass gain initially off (effect is active)
        this._bypassGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        // Effect input initially on
        this._effectInput.gain.setValueAtTime(1, this.audioContext.currentTime);

        // The actual effect processing nodes will be connected between
        // this._effectInput and this._output by subclasses.
        // The bypass gain also connects directly to the output.
        this._bypassGain.connect(this._output);
    }

    /**
     * Connects the output of this effect node to a destination node.
     * @param {AudioNode} destinationNode - The node to connect to.
     */
    connect(destinationNode) {
        if (!destinationNode) {
            console.error("Destination node is required for connection.");
            return;
        }
        // Ensure output node exists before connecting
        if (this._output) {
            this._output.connect(destinationNode);
        } else {
            console.error(`Cannot connect: Output node for ${this.constructor.name} is null.`);
        }
    }

    /**
     * Disconnects the output of this effect node.
     */
    disconnect() {
        // Ensure output node exists before disconnecting
        if (this._output) {
            try {
                this._output.disconnect();
            } catch (e) {
                console.warn(`Error disconnecting output for ${this.constructor.name}: ${e.message}`);
            }
        } else {
             console.warn(`Cannot disconnect: Output node for ${this.constructor.name} is already null.`);
        }
    }

    /**
     * Returns the main input node for this effect. Audio should be routed into this node.
     * @returns {AudioNode | null} The input gain node, or null if disposed.
     */
    getInputNode() {
        return this._input;
    }

    /**
     * Returns the main output node for this effect. Audio routes out from this node.
     * @returns {AudioNode | null} The output gain node, or null if disposed.
     */
    getOutputNode() {
        return this._output;
    }

    /**
     * Sets the parameters for the effect. Subclasses must implement this.
     * @param {object} params - An object containing parameter key-value pairs.
     * @param {number} [rampTime=0.05] - Time in seconds for smooth parameter transitions.
     */
    setParameters(params, rampTime = 0.05) {
        throw new Error(`Method 'setParameters()' must be implemented by ${this.constructor.name}.`);
    }

    /**
     * Gets the current parameters of the effect. Subclasses must implement this.
     * @returns {object} An object containing the current parameter values.
     */
    getParameters() {
        throw new Error(`Method 'getParameters()' must be implemented by ${this.constructor.name}.`);
    }

    /**
     * Enables or disables the bypass for this effect.
     * When bypassed, the input signal routes directly to the output, skipping the effect processing.
     * @param {boolean} shouldBypass - True to bypass, false to activate the effect.
     */
    bypass(shouldBypass) {
        if (!this.audioContext || !this._bypassGain?.gain || !this._effectInput?.gain) {
            console.warn(`Cannot bypass ${this.constructor.name}: Node disposed or not initialized.`);
            return;
        }
        this._isBypassed = shouldBypass;
        const now = this.audioContext.currentTime;
        const bypassGainValue = shouldBypass ? 1 : 0;
        const effectGainValue = shouldBypass ? 0 : 1;

        // Use ramp for smooth transition
        this._bypassGain.gain.linearRampToValueAtTime(bypassGainValue, now + 0.02);
        this._effectInput.gain.linearRampToValueAtTime(effectGainValue, now + 0.02);
    }

    /**
     * Returns the current bypass state.
     * @returns {boolean} True if the effect is currently bypassed.
     */
    isBypassed() {
        return this._isBypassed;
    }

    /**
     * Provides data necessary for visualizing the effect's state or processing.
     * Subclasses should implement this based on the specific effect.
     * @returns {object|null} Data for visualization, or null if not applicable.
     */
    getVisualizationData() {
        // Optional: Subclasses can override
        return null;
    }

    /**
     * Cleans up the main input/output and bypass nodes for this effect.
     * Subclasses MUST override this, disconnect their specific internal nodes FIRST,
     * and then call super.dispose().
     */
    dispose() {
        console.log(`Disposing base EffectNode for ${this.constructor.name}...`);
        // Disconnect the common nodes managed by the base class
        if (this._input) {
            try { this._input.disconnect(); } catch (e) { console.warn(`Error disconnecting _input for ${this.constructor.name}: ${e.message}`); }
        }
        if (this._output) {
            try { this._output.disconnect(); } catch (e) { console.warn(`Error disconnecting _output for ${this.constructor.name}: ${e.message}`); }
        }
         if (this._bypassGain) {
             try { this._bypassGain.disconnect(); } catch (e) { console.warn(`Error disconnecting _bypassGain for ${this.constructor.name}: ${e.message}`); }
         }
         // Removed redundant disconnect for _effectInput, as subclasses should handle disconnecting *from* it.
         // if (this._effectInput) {
         //     try { this._effectInput.disconnect(); } catch (e) { console.warn(`Error disconnecting _effectInput for ${this.constructor.name}: ${e.message}`); }
         // }

         // Optionally nullify references if garbage collection is a concern,
         // but often just disconnecting is sufficient. Avoid nullifying audioContext.
        this._input = null;
        this._output = null;
        this._bypassGain = null;
        this._effectInput = null;
        // this.audioContext = null; // Usually not needed as it's shared

        console.log(`Base EffectNode for ${this.constructor.name} disposed.`);
    }


    /**
     * Serializes the effect's state (parameters) to a JSON object for presets.
     * Subclasses must implement this.
     * @returns {object} A JSON-serializable object representing the effect's state.
     */
    toJSON() {
        throw new Error(`Method 'toJSON()' must be implemented by ${this.constructor.name}.`);
    }

    /**
     * Restores the effect's state from a JSON object.
     * Subclasses must implement this.
     * @param {object} data - The JSON object containing the state to restore.
     */
    fromJSON(data) {
        throw new Error(`Method 'fromJSON()' must be implemented by ${this.constructor.name}.`);
    }
}

export default EffectNode;
