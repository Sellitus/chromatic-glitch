import { Card } from '../cards/Card.js';
import { CardType } from '../cards/CardType.js';

/**
 * Represents a constructed deck of cards.
 * Handles deck building rules, validation, and statistics.
 */
export class Deck {
    /**
     * Create a new Deck
     * @param {Object} config - Deck configuration
     * @param {string} config.name - Deck name
     * @param {Card[]} [config.cards=[]] - Initial cards
     * @param {Object} [config.rules] - Deck building rules
     * @param {number} [config.rules.minCards=40] - Minimum cards required
     * @param {number} [config.rules.maxCards=60] - Maximum cards allowed
     * @param {number} [config.rules.maxCopies=3] - Maximum copies of a single card
     */
    constructor({ 
        name, 
        cards = [], 
        rules = { 
            minCards: 40, 
            maxCards: 60, 
            maxCopies: 3 
        } 
    }) {
        if (!name) {
            throw new Error('Deck requires a name');
        }
        this._name = name;
        this._cards = [...cards];
        this._rules = { ...rules };
    }

    /**
     * Get deck name
     * @returns {string} Deck name
     */
    getName() {
        return this._name;
    }

    /**
     * Set deck name
     * @param {string} name - New deck name
     */
    setName(name) {
        this._name = name;
    }

    /**
     * Get all cards in the deck
     * @returns {Card[]} Array of cards
     */
    getCards() {
        return [...this._cards];
    }

    /**
     * Add a card to the deck
     * @param {Card} card - Card to add
     * @returns {boolean} True if card was added successfully
     * @throws {Error} If adding would violate deck building rules
     */
    addCard(card) {
        if (!this.canAddCard(card)) {
            throw new Error('Adding card would violate deck building rules');
        }
        this._cards.push(card);
        return true;
    }

    /**
     * Remove a card from the deck
     * @param {Card} card - Card to remove
     * @returns {Card|null} The removed card or null if not found
     */
    removeCard(card) {
        const index = this._cards.indexOf(card);
        if (index === -1) {
            return null;
        }
        return this._cards.splice(index, 1)[0];
    }

    /**
     * Check if a card can be added to the deck
     * @param {Card} card - Card to check
     * @returns {boolean} True if card can be added
     */
    canAddCard(card) {
        // Check size limit
        if (this._cards.length >= this._rules.maxCards) {
            return false;
        }
        
        // Get current copies of this card
        const copies = this._cards.filter(c => c.id === card.id).length;
        
        // Check copies limit
        return copies < this._rules.maxCopies;
    }

    /**
     * Validate the entire deck against building rules
     * @returns {Object} Validation result with isValid and errors
     */
    validate() {
        const errors = [];

        // Check deck size
        const { minCards, maxCards } = this._rules;
        const currentSize = this._cards.length;

        if (currentSize < minCards) {
            errors.push(`Deck must contain at least ${minCards} cards`);
        }
        if (currentSize > maxCards) {
            errors.push(`Deck cannot contain more than ${maxCards} cards`);
        }

        // Check card copies
        const cardCounts = new Map();
        for (const card of this._cards) {
            const count = (cardCounts.get(card.id) || 0) + 1;
            cardCounts.set(card.id, count);
            if (count > this._rules.maxCopies) {
                errors.push(`Cannot have more than ${this._rules.maxCopies} copies of card ${card.name}`);
                break; // Exit after first violation found
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Calculate deck statistics
     * @returns {Object} Deck statistics
     */
    calculateStats() {
        const stats = {
            totalCards: this._cards.length,
            byType: {},
            byRarity: {},
            averageCost: 0
        };

        let totalCost = 0;

        for (const card of this._cards) {
            // Count by type
            stats.byType[card.type] = (stats.byType[card.type] || 0) + 1;

            // Count by rarity
            stats.byRarity[card.rarity] = (stats.byRarity[card.rarity] || 0) + 1;

            // Sum costs
            totalCost += card.cost;
        }

        stats.averageCost = totalCost / (stats.totalCards || 1);

        return stats;
    }

    /**
     * Create a Deck from serialized data
     * @param {Object} data - Serialized deck data
     * @returns {Deck} New Deck instance
     */
    static fromJSON(data) {
        return new Deck({
            name: data.name,
            cards: data.cards.map(card => Card.fromJSON(card)),
            rules: data.rules
        });
    }

    /**
     * Serialize the deck to a JSON-compatible object
     * @returns {Object} Serialized deck data
     */
    toJSON() {
        return {
            name: this._name,
            cards: this._cards.map(card => card.toJSON()),
            rules: this._rules
        };
    }
}
