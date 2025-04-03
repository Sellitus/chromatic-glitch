import { Card } from '../cards/Card.js';

/**
 * Represents a discard pile where played or discarded cards go.
 * Cards can be added here and shuffled back into the draw pile when needed.
 */
export class DiscardPile {
    /**
     * Create a new DiscardPile
     * @param {Card[]} [cards=[]] - Initial array of cards
     */
    constructor(cards = []) {
        this._cards = [...cards];
    }

    /**
     * Add a single card to the discard pile
     * @param {Card} card - Card to add
     * @returns {DiscardPile} this instance for chaining
     */
    add(card) {
        this._cards.push(card);
        return this;
    }

    /**
     * Add multiple cards to the discard pile
     * @param {Card[]} cards - Cards to add
     * @returns {DiscardPile} this instance for chaining
     */
    addMultiple(cards) {
        this._cards.push(...cards);
        return this;
    }

    /**
     * Get all cards and clear the discard pile
     * @returns {Card[]} Array of all cards that were in the discard pile
     */
    takeAll() {
        const cards = [...this._cards];
        this._cards = [];
        return cards;
    }

    /**
     * Shuffle all cards and return them, clearing the discard pile
     * @returns {Card[]} Array of shuffled cards
     */
    shuffleAndTakeAll() {
        const cards = this.takeAll();
        // Fisher-Yates shuffle
        for (let i = cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [cards[i], cards[j]] = [cards[j], cards[i]];
        }
        return cards;
    }

    /**
     * Check if the discard pile is empty
     * @returns {boolean} True if no cards remain
     */
    isEmpty() {
        return this._cards.length === 0;
    }

    /**
     * Get the number of cards in the discard pile
     * @returns {number} Card count
     */
    size() {
        return this._cards.length;
    }

    /**
     * Get a copy of all cards in the discard pile without modifying it
     * @returns {Card[]} Array of cards
     */
    getCards() {
        return [...this._cards];
    }

    /**
     * Look at the top card without removing it
     * @returns {Card|null} The top card or null if pile is empty
     */
    peekTop() {
        return this._cards.length > 0 ? this._cards[this._cards.length - 1] : null;
    }

    /**
     * Create a DiscardPile from serialized data
     * @param {Object} data - Serialized pile data
     * @returns {DiscardPile} New DiscardPile instance
     */
    static fromJSON(data) {
        return new DiscardPile(data.cards.map(card => Card.fromJSON(card)));
    }

    /**
     * Serialize the pile to a JSON-compatible object
     * @returns {Object} Serialized pile data
     */
    toJSON() {
        return {
            cards: this._cards.map(card => card.toJSON())
        };
    }
}
