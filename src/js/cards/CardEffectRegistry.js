/**
 * Registry for card effect functions.
 * Effects are registered by key and can be looked up when cards are played.
 */
class CardEffectRegistry {
    constructor() {
        this.effects = new Map();
    }

    /**
     * Register an effect function
     * @param {string} key - Unique identifier for the effect
     * @param {Function} effectFn - Function implementing the effect
     * @throws {Error} If key is invalid or already registered
     */
    register(key, effectFn) {
        if (!key || typeof key !== 'string') {
            throw new Error('Effect key must be a non-empty string');
        }
        if (typeof effectFn !== 'function') {
            throw new Error('Effect must be a function');
        }
        if (this.effects.has(key)) {
            throw new Error(`Effect ${key} is already registered`);
        }
        this.effects.set(key, effectFn);
    }

    /**
     * Get an effect function by key
     * @param {string} key - Effect identifier
     * @returns {Function} The effect function
     * @throws {Error} If effect is not found
     */
    getEffect(key) {
        const effect = this.effects.get(key);
        if (!effect) {
            throw new Error(`Effect ${key} not found`);
        }
        return effect;
    }

    /**
     * Execute an effect
     * @param {string} key - Effect identifier
     * @param {Object} context - Game state and target information
     * @param {Card} context.card - The card being played
     * @param {Object} context.source - The entity playing the card
     * @param {Object} context.target - The target of the effect (if any)
     * @param {Object} context.gameState - Current game state
     * @returns {Promise<void>} Resolves when effect completes
     */
    async executeEffect(key, context) {
        const effect = this.getEffect(key);
        return effect(context);
    }

    /**
     * Check if an effect is registered
     * @param {string} key - Effect identifier
     * @returns {boolean} True if effect exists
     */
    hasEffect(key) {
        return this.effects.has(key);
    }

    /**
     * Get all registered effect keys
     * @returns {string[]} Array of effect keys
     */
    getAllEffectKeys() {
        return Array.from(this.effects.keys());
    }

    /**
     * Remove an effect from the registry
     * @param {string} key - Effect identifier
     * @returns {boolean} True if effect was removed
     */
    unregister(key) {
        return this.effects.delete(key);
    }

    /**
     * Remove all effects from the registry
     */
    clear() {
        this.effects.clear();
    }
}

// Export a singleton instance
export const cardEffectRegistry = new CardEffectRegistry();

// Export the class for testing
export { CardEffectRegistry };
