import { EffectNode } from './effects/EffectNode.js';
// Import specific effect classes if needed for preset loading, or use a registry
// import FilterEffect from './effects/FilterEffect.js';
// import DelayEffect from './effects/DelayEffect.js';
// ... etc.

// Placeholder for an effect registry (needed for robust preset loading)
const effectRegistry = {
    // Example:
    // FilterEffect: FilterEffect,
    // DelayEffect: DelayEffect,
};

/**
 * AudioEffectChain - Manages a sequence of audio effects (EffectNode instances).
 * Handles routing audio through the chain and provides controls for managing effects.
 */
export class AudioEffectChain {
    /**
     * @param {AudioContext} audioContext - The global AudioContext instance.
     */
    constructor(audioContext) {
        if (!audioContext) {
            throw new Error("AudioContext is required to create an AudioEffectChain.");
        }
        this.audioContext = audioContext;
        this.effects = []; // Array to hold EffectNode instances
        this.input = this.audioContext.createGain(); // Entry point to the chain
        this.output = this.audioContext.createGain(); // Exit point from the chain
        this._isBypassed = false;

        // Initially, connect input directly to output if no effects are present
        this.input.connect(this.output);
    }

    /**
     * Adds an effect to the chain at a specific index or at the end.
     * @param {EffectNode} effectNode - The effect instance to add.
     * @param {number} [index=this.effects.length] - The index at which to insert the effect.
     */
    addEffect(effectNode, index = this.effects.length) {
        // Duck-typing check for essential methods instead of strict instanceof
    if (!effectNode ||
        typeof effectNode.getInputNode !== 'function' ||
        typeof effectNode.getOutputNode !== 'function' ||
        typeof effectNode.dispose !== 'function') {
            console.error("Invalid effect node provided. Must have getInputNode, getOutputNode, and dispose methods.");
            return;
        }
        if (index < 0 || index > this.effects.length) {
            index = this.effects.length;
        }

        this.effects.splice(index, 0, effectNode);
        this._updateConnections();
    }

    /**
     * Removes a specific effect instance from the chain.
     * @param {EffectNode} effectNode - The effect instance to remove.
     */
    removeEffect(effectNode) {
        const index = this.effects.indexOf(effectNode);
        if (index > -1) {
            this.effects.splice(index, 1);
             if (effectNode && typeof effectNode.dispose === 'function') {
                try {
                    effectNode.dispose(); // Clean up the removed effect's resources
                } catch (e) {
                    console.warn(`Error disposing removed effect ${effectNode.constructor.name}: ${e.message}`);
                }
            }
            this._updateConnections();
        } else {
            console.warn("Effect node not found in the chain.");
        }
    }

    /**
     * Removes an effect at a specific index.
     * @param {number} index - The index of the effect to remove.
     */
    removeEffectAtIndex(index) {
        if (index >= 0 && index < this.effects.length) {
            const [removedEffect] = this.effects.splice(index, 1);
            if (removedEffect && typeof removedEffect.dispose === 'function') {
                 try {
                    removedEffect.dispose();
                 } catch (e) {
                    console.warn(`Error disposing removed effect at index ${index}: ${e.message}`);
                 }
            }
            this._updateConnections();
        } else {
            console.warn("Invalid index for effect removal.");
        }
    }

    /**
     * Moves an effect from one index to another.
     * @param {number} fromIndex - The current index of the effect.
     * @param {number} toIndex - The desired new index for the effect.
     */
    reorderEffect(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.effects.length || toIndex < 0 || toIndex > this.effects.length) { // Allow moving to the end
            console.error("Invalid indices for reordering effects.");
            return;
        }
        if (fromIndex === toIndex) return; // No change needed

        const [effectToMove] = this.effects.splice(fromIndex, 1);
        this.effects.splice(toIndex, 0, effectToMove);
        this._updateConnections();
    }

    /**
     * Updates the audio node connections within the chain.
     * Called internally after adding, removing, or reordering effects.
     */
    _updateConnections() {
        // Disconnect everything first to avoid complex state management
        if (this.input) {
            try { this.input.disconnect(); } catch(e) { /* Ignore errors if already disconnected */ }
        }
        this.effects.forEach(effect => {
            const inputNode = effect.getInputNode();
            const outputNode = effect.getOutputNode();
            if (inputNode) {
                try { inputNode.disconnect(); } catch(e) { /* Ignore */ }
            }
            if (outputNode) {
                try { outputNode.disconnect(); } catch(e) { /* Ignore */ }
            }
        });

        let currentNode = this.input;

        // Connect through each effect in order
        this.effects.forEach(effect => {
            const effectInput = effect.getInputNode();
            const effectOutput = effect.getOutputNode();
            if (currentNode && effectInput) {
                try {
                    currentNode.connect(effectInput);
                    currentNode = effectOutput; // Move to the output of this effect for the next connection
                } catch (e) {
                    console.error(`Error connecting nodes during chain update: ${e.message}`);
                    currentNode = null; // Stop further connections if error occurs
                }
            } else {
                 console.warn(`Skipping connection in chain update due to null node (Current: ${!!currentNode}, EffectInput: ${!!effectInput})`);
                 currentNode = null; // Stop further connections
            }
        });

        // Connect the output of the last effect (or the main input if no effects) to the chain's output
        if (currentNode && this.output) {
             try {
                currentNode.connect(this.output);
             } catch (e) {
                 console.error(`Error connecting final node to chain output: ${e.message}`);
             }
        } else if (!this.output) {
             console.error("Cannot connect final node: Chain output is null.");
        } else if (!currentNode) {
             console.warn("Cannot connect final node: Previous node in chain is null (likely due to earlier error or empty chain). Connecting input directly to output.");
             // Fallback: connect input directly to output if possible
             if (this.input && this.output) {
                 try { this.input.connect(this.output); } catch(e) { console.error(`Fallback connection failed: ${e.message}`); }
             }
        }
    }


    /**
     * Returns the main input node for the entire chain.
     * @returns {AudioNode | null}
     */
    getInputNode() {
        return this.input;
    }

    /**
     * Returns the main output node for the entire chain.
     * @returns {AudioNode | null}
     */
    getOutputNode() {
        return this.output;
    }

    /**
     * Bypasses the entire effect chain.
     * Note: This bypasses the chain itself, not individual effects within it.
     * Individual effects retain their own bypass state.
     * @param {boolean} shouldBypass - True to bypass the chain, false to activate it.
     */
    bypass(shouldBypass) {
        // This implementation simply toggles the gain of the output node.
        // A more robust implementation might involve routing around the entire chain.
        if (!this.output || !this.output.gain) {
             console.warn("Cannot bypass chain: Output node or gain property is missing.");
             return;
        }
        this._isBypassed = shouldBypass;
        const gainValue = shouldBypass ? 0 : 1;
        // Check if audioContext is available and use currentTime
        if (this.audioContext) {
            this.output.gain.linearRampToValueAtTime(gainValue, this.audioContext.currentTime + 0.02);
        } else {
            // Fallback if context is somehow lost (shouldn't happen in normal operation)
            this.output.gain.value = gainValue;
        }
        // console.warn("Chain bypass currently mutes output. Consider a full bypass route if needed."); // Keep or remove based on desired behavior
    }

    /**
     * Returns the bypass state of the entire chain.
     * @returns {boolean}
     */
    isBypassed() {
        return this._isBypassed;
    }

    /**
     * Cleans up all effects and nodes within the chain.
     */
    dispose() {
        // Dispose effects first
        this.effects.forEach(effect => {
            if (effect && typeof effect.dispose === 'function') {
                try {
                    effect.dispose();
                } catch (e) {
                    console.warn(`Error disposing effect ${effect.constructor.name}: ${e.message}`);
                }
            }
        });
        this.effects = []; // Clear the array

        // Disconnect main input and output nodes with null checks and try/catch
        if (this.input) {
            try {
                this.input.disconnect();
            } catch (e) { console.warn(`Error disconnecting chain input: ${e.message}`); }
        }
        if (this.output) {
            try {
                this.output.disconnect();
            } catch (e) { console.warn(`Error disconnecting chain output: ${e.message}`); }
        }

        // Nullify references
        this.input = null;
        this.output = null;
        // Avoid nullifying shared audioContext unless it's exclusively owned by the chain
        // this.audioContext = null;
    }


    // --- Preset Management ---

    /**
     * Saves the current state of the effect chain (including all effects' parameters)
     * to a JSON-serializable object.
     * @returns {object} Preset data.
     */
    savePreset() {
        const presetData = {
            effects: this.effects.map(effect => {
                if (effect && typeof effect.toJSON === 'function') {
                    return {
                        type: effect.constructor.name, // Store effect type for reconstruction
                        state: effect.toJSON()
                    };
                }
                return null; // Handle potential null effects in the array
            }).filter(Boolean) // Remove null entries
        };
        return presetData;
    }

    /**
     * Loads a preset, replacing the current effects and their states.
     * Requires effect classes to be registered or dynamically imported.
     * @param {object} presetData - The preset data object.
     * @param {object} registry - A map of effect type names (string) to class constructors.
     */
    loadPreset(presetData, registry = effectRegistry) {
        // 1. Dispose all current effects
        this.effects.forEach(effect => {
            if (effect && typeof effect.dispose === 'function') {
                try {
                    effect.dispose();
                } catch (e) {
                    console.warn(`Error disposing effect ${effect.constructor.name} during preset load: ${e.message}`);
                }
            }
        });
        // 2. Clear the effects array
        this.effects = [];
        // 3. Disconnect main input (will be reconnected by _updateConnections later)
        if (this.input) {
            try { this.input.disconnect(); } catch(e) { /* Ignore */ }
        }

        if (presetData && presetData.effects && Array.isArray(presetData.effects)) {
            presetData.effects.forEach(effectInfo => {
                if (!effectInfo || !effectInfo.type || !effectInfo.state) {
                    return;
                }

                const EffectClass = registry[effectInfo.type];
                if (EffectClass) {
                    try {
                        const effect = new EffectClass(this.audioContext);
                        if (typeof effect.fromJSON === 'function') {
                            effect.fromJSON(effectInfo.state);
                            // Add directly to array, connections handled later
                            this.effects.push(effect);
                        } else {
                             console.error(`Effect class ${effectInfo.type} does not implement fromJSON.`);
                        }
                    } catch (error) {
                        console.error(`Error creating/loading effect ${effectInfo.type}:`, error);
                    }
                } else {
                    console.error(`Could not find effect class for type: ${effectInfo.type} in registry.`);
                }
            });
        } else {
            console.error("Invalid preset data format.");
        }
        // 5. Update connections once after adding all new effects
        this._updateConnections();
    }

    // --- A/B Comparison (Placeholder) ---
    // TODO: Implement A/B comparison logic if needed.
}

export default AudioEffectChain;
