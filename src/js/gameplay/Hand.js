import { Card } from '../cards/Card.js';

/**
 * Represents a player's hand of cards during gameplay.
 * Manages cards currently available to play.
 */
export class Hand {
    /**
     * Create a new Hand
     * @param {Object} config - Hand configuration
     * @param {number} [config.maxSize=10] - Maximum number of cards allowed in hand
     * @param {Card[]} [config.cards=[]] - Initial array of cards
     */
    constructor({ maxSize = 10, cards = [] } = {}) {
        if (cards.length > maxSize) {
            throw new Error(`Initial cards (${cards.length}) exceeds max hand size (${maxSize})`);
        }
        this._maxSize = maxSize;
        this._cards = [...cards];
    }

    /**
     * Add a card to the hand
     * @param {Card} card - Card to add
     * @returns {boolean} True if card was added successfully
     * @throws {Error} If adding would exceed max hand size
     */
    add(card) {
        if (this.isFull()) {
            throw new Error(`Cannot add card: hand is full (max ${this._maxSize})`);
        }
        this._cards.push(card);
        return true;
    }

    /**
     * Add multiple cards to the hand
     * @param {Card[]} cards - Cards to add
     * @returns {number} Number of cards successfully added
     * @throws {Error} If adding all cards would exceed max hand size
     */
    addMultiple(cards) {
        if (this.size() + cards.length > this._maxSize) {
            throw new Error(`Cannot add ${cards.length} cards: would exceed max hand size ${this._maxSize}`);
        }
        this._cards.push(...cards);
        return cards.length;
    }

    /**
     * Remove a specific card from the hand
     * @param {Card} card - Card to remove
     * @returns {Card|null} The removed card or null if not found
     */
    remove(card) {
        const index = this._cards.indexOf(card);
        if (index === -1) {
            return null;
        }
        return this._cards.splice(index, 1)[0];
    }

    /**
     * Remove a card at a specific index
     * @param {number} index - Index of card to remove
     * @returns {Card|null} The removed card or null if index invalid
     */
    removeAt(index) {
        if (index < 0 || index >= this._cards.length) {
            return null;
        }
        return this._cards.splice(index, 1)[0];
    }

    /**
     * Get all cards and empty the hand
     * @returns {Card[]} Array of all cards that were in hand
     */
    removeAll() {
        const cards = [...this._cards];
        this._cards = [];
        return cards;
    }

    /**
     * Check if the hand is full
     * @returns {boolean} True if hand has maximum number of cards
     */
    isFull() {
        return this._cards.length >= this._maxSize;
    }

    /**
     * Get the number of available card slots
     * @returns {number} Number of additional cards that can be added
     */
    availableSpace() {
        return this._maxSize - this._cards.length;
    }

    /**
     * Get the current number of cards in hand
     * @returns {number} Card count
     */
    size() {
        return this._cards.length;
    }

    /**
     * Get the maximum allowed hand size
     * @returns {number} Maximum hand size
     */
    maxSize() {
        return this._maxSize;
    }

    /**
     * Get a copy of all cards in hand without modifying it
     * @returns {Card[]} Array of cards
     */
    getCards() {
        return [...this._cards];
    }

    /**
     * Get a card at a specific index without removing it
     * @param {number} index - Index of card to get
     * @returns {Card|null} The card at the index or null if invalid
     */
    getAt(index) {
        return (index >= 0 && index < this._cards.length) ? this._cards[index] : null;
    }

    /**
     * Check if the hand is empty
     * @returns {boolean} True if no cards in hand
     */
    isEmpty() {
        return this._cards.length === 0;
    }

    /**
     * Create a Hand from serialized data
     * @param {Object} data - Serialized hand data
     * @returns {Hand} New Hand instance
     */
    static fromJSON(data) {
        return new Hand({
            maxSize: data.maxSize,
            cards: data.cards.map(card => Card.fromJSON(card))
        });
    }

    /**
     * Serialize the hand to a JSON-compatible object
     * @returns {Object} Serialized hand data
     */
    toJSON() {
        return {
            maxSize: this._maxSize,
            cards: this._cards.map(card => card.toJSON())
        };
    }
}
