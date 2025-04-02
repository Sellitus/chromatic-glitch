import { Card } from './Card.js';
import { CardType, isValidCardType } from './CardType.js';
import { CardRarity, isValidRarity } from './CardRarity.js';
import { cardEffectRegistry } from './CardEffectRegistry.js';

/**
 * Manages card definitions and provides methods for querying and filtering cards.
 */
export class CardDatabase {
    constructor() {
        this.definitions = new Map();
    }

    /**
     * Load card definitions from JSON data
     * @param {Object[]} definitionsData - Array of card definition objects
     * @throws {Error} If definitions are invalid
     */
    loadDefinitions(definitionsData) {
        // Clear existing definitions
        this.definitions.clear();

        // First pass: Validate and store each definition (without upgrade path check)
        for (const def of definitionsData) {
            this.validateDefinition(def);
            this.definitions.set(def.id, def);
        }

        // Second pass: Validate upgrade paths now that all definitions are loaded
        for (const def of this.definitions.values()) {
            if (def.upgradeToId && !this.definitions.has(def.upgradeToId)) {
                throw new Error(`Invalid card definition ${def.id}: upgrade target ${def.upgradeToId} not found`);
            }
        }
    }

    /**
     * Validate a card definition (excluding upgrade path)
     * @private
     * @param {Object} def - Card definition to validate
     * @throws {Error} If definition is invalid
     */
    validateDefinition(def) {
        if (!def.id || typeof def.id !== 'string') {
            throw new Error(`Invalid card definition: missing or invalid id`);
        }
        if (!def.name || typeof def.name !== 'string') {
            throw new Error(`Invalid card definition ${def.id}: missing or invalid name`);
        }
        if (!isValidCardType(def.type)) {
            throw new Error(`Invalid card definition ${def.id}: invalid type`);
        }
        if (typeof def.cost !== 'number' || def.cost < 0) {
            throw new Error(`Invalid card definition ${def.id}: invalid cost`);
        }
        if (!isValidRarity(def.rarity)) {
            throw new Error(`Invalid card definition ${def.id}: invalid rarity`);
        }
        if (!def.description || typeof def.description !== 'string') {
            throw new Error(`Invalid card definition ${def.id}: missing or invalid description`);
        }
        if (!def.effectKey || !cardEffectRegistry.hasEffect(def.effectKey)) {
            throw new Error(`Invalid card definition ${def.id}: invalid or unregistered effect key`);
        }
        // Removed upgradeToId check from here
    }

    /**
     * Get a card definition by ID
     * @param {string} id - Card definition ID
     * @returns {Object} Card definition
     * @throws {Error} If definition not found
     */
    getDefinition(id) {
        const def = this.definitions.get(id);
        if (!def) {
            throw new Error(`Card definition ${id} not found`);
        }
        return def;
    }

    /**
     * Get all card definitions
     * @returns {Object[]} Array of card definitions
     */
    getAllDefinitions() {
        return Array.from(this.definitions.values());
    }

    /**
     * Get card definitions by type
     * @param {string} type - Card type to filter by
     * @returns {Object[]} Array of matching definitions
     */
    getDefinitionsByType(type) {
        if (!isValidCardType(type)) {
            throw new Error('Invalid card type');
        }
        return this.getAllDefinitions().filter(def => def.type === type);
    }

    /**
     * Get card definitions by rarity
     * @param {string} rarity - Rarity to filter by
     * @returns {Object[]} Array of matching definitions
     */
    getDefinitionsByRarity(rarity) {
        if (!isValidRarity(rarity)) {
            throw new Error('Invalid rarity');
        }
        return this.getAllDefinitions().filter(def => def.rarity === rarity);
    }

    /**
     * Get all base cards (cards with no upgrade target)
     * @returns {Object[]} Array of base card definitions
     */
    getBaseCards() {
        return this.getAllDefinitions().filter(def => !def.upgradeToId);
    }

    /**
     * Get upgrade path for a card
     * @param {string} baseId - Starting card ID
     * @returns {Object[]} Array of definitions in upgrade path
     */
    getUpgradePath(baseId) {
        const path = [];
        let currentId = baseId;

        while (currentId) {
            const def = this.getDefinition(currentId);
            path.push(def);
            currentId = def.upgradeToId;
        }

        return path;
    }

    /**
     * Search cards by name
     * @param {string} query - Search string
     * @returns {Object[]} Array of matching definitions
     */
    searchByName(query) {
        const normalized = query.toLowerCase();
        return this.getAllDefinitions().filter(
            def => def.name.toLowerCase().includes(normalized)
        );
    }

    /**
     * Clear all definitions
     */
    clear() {
        this.definitions.clear();
    }
}

// Export singleton instance
export const cardDatabase = new CardDatabase();
