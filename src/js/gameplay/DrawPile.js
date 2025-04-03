import { Card } from '../cards/Card.js';

/**
 * Represents a pile of cards that can be drawn from during gameplay.
 * Includes methods for shuffling and drawing cards.
 */
export class DrawPile {
    /**
     * Create a new DrawPile
     * @param {Card[]} [cards=[]] - Initial array of cards
     */
    constructor(cards = []) {
        this._cards = [...cards];
    }

    /**
     * Shuffles the cards in the pile using Fisher-Yates algorithm
     * @returns {DrawPile} this instance for chaining
     */
    shuffle() {
        for (let i = this._cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this._cards[i], this._cards[j]] = [this._cards[j], this._cards[i]];
        }
        return this;
    }

    /**
     * Draw a specified number of cards from the top of the pile
     * @param {number} [count=1] - Number of cards to draw
     * @returns {Card[]} Array of drawn cards
     * @throws {Error} If attempting to draw more cards than available
     */
    draw(count = 1) {
        if (count > this._cards.length) {
            throw new Error(`Cannot draw ${count} cards, only ${this._cards.length} available`);
        }
        return this._cards.splice(this._cards.length - count, count);
    }

    /**
     * Draw a single card from the top of the pile
     * @returns {Card|null} The drawn card or null if pile is empty
     */
    drawOne() {
        if (this.isEmpty()) {
            return null;
        }
        return this._cards.pop();
    }

    /**
     * Add cards to the bottom of the pile
     * @param {Card[]} cards - Cards to add
     * @returns {DrawPile} this instance for chaining
     */
    addToBottom(cards) {
        this._cards.unshift(...cards);
        return this;
    }

    /**
     * Add cards to the top of the pile
     * @param {Card[]} cards - Cards to add
     * @returns {DrawPile} this instance for chaining
     */
    addToTop(cards) {
        this._cards.push(...cards);
        return this;
    }

    /**
     * Check if the pile is empty
     * @returns {boolean} True if no cards remain
     */
    isEmpty() {
        return this._cards.length === 0;
    }

    /**
     * Get the number of cards in the pile
     * @returns {number} Card count
     */
    size() {
        return this._cards.length;
    }

    /**
     * Get a copy of all cards in the pile without modifying it
     * @returns {Card[]} Array of cards
     */
    getCards() {
        return [...this._cards];
    }

    /**
     * Create a DrawPile from serialized data
     * @param {Object} data - Serialized pile data
     * @returns {DrawPile} New DrawPile instance
     */
    static fromJSON(data) {
        return new DrawPile(data.cards.map(card => Card.fromJSON(card)));
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
