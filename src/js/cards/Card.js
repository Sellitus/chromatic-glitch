import { isValidCardType } from './CardType.js';
import { isValidRarity } from './CardRarity.js';

/**
 * Represents a card in the game.
 * Cards are immutable - modifications result in new Card instances.
 */
export class Card {
    /**
     * Create a new Card instance
     * @param {Object} config - Card configuration
     * @param {string} config.id - Unique identifier
     * @param {string} config.name - Display name
     * @param {string} config.type - Card type (from CardType enum)
     * @param {number} config.cost - Energy/resource cost to play
     * @param {string} config.rarity - Rarity level (from CardRarity enum)
     * @param {string} config.description - Card description/flavor text
     * @param {string} config.effectKey - Key to look up effect function
     * @param {string} [config.upgradeToId] - ID of upgraded version
     * @param {string} [config.artAsset] - Path to card art asset
     * @throws {Error} If required fields are missing or invalid
     */
    constructor({
        id,
        name,
        type,
        cost,
        rarity,
        description,
        effectKey,
        upgradeToId = null,
        artAsset = null
    }) {
        // Validate required fields
        if (!id || typeof id !== 'string') {
            throw new Error('Card requires valid id string');
        }
        if (!name || typeof name !== 'string') {
            throw new Error('Card requires valid name string');
        }
        if (!isValidCardType(type)) {
            throw new Error('Card requires valid type');
        }
        if (typeof cost !== 'number' || cost < 0) {
            throw new Error('Card requires valid non-negative cost');
        }
        if (!isValidRarity(rarity)) {
            throw new Error('Card requires valid rarity');
        }
        if (!description || typeof description !== 'string') {
            throw new Error('Card requires valid description string');
        }
        if (!effectKey || typeof effectKey !== 'string') {
            throw new Error('Card requires valid effectKey string');
        }

        // Store properties (all are read-only)
        Object.defineProperties(this, {
            id: { value: id, enumerable: true },
            name: { value: name, enumerable: true },
            type: { value: type, enumerable: true },
            cost: { value: cost, enumerable: true },
            rarity: { value: rarity, enumerable: true },
            description: { value: description, enumerable: true },
            effectKey: { value: effectKey, enumerable: true },
            upgradeToId: { value: upgradeToId, enumerable: true },
            artAsset: { value: artAsset, enumerable: true }
        });
    }

    /**
     * Create a copy of this card with modified properties
     * @param {Object} modifications - Properties to change in the new instance
     * @returns {Card} New Card instance with specified modifications
     */
    modify(modifications) {
        return new Card({
            id: this.id,
            name: this.name,
            type: this.type,
            cost: this.cost,
            rarity: this.rarity,
            description: this.description,
            effectKey: this.effectKey,
            upgradeToId: this.upgradeToId,
            artAsset: this.artAsset,
            ...modifications
        });
    }

    /**
     * Serialize the card to a JSON-compatible object
     * @returns {Object} Serialized card data
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            type: this.type,
            cost: this.cost,
            rarity: this.rarity,
            description: this.description,
            effectKey: this.effectKey,
            upgradeToId: this.upgradeToId,
            artAsset: this.artAsset
        };
    }

    /**
     * Create a Card instance from serialized data
     * @param {Object} data - Serialized card data
     * @returns {Card} New Card instance
     */
    static fromJSON(data) {
        return new Card(data);
    }
}
