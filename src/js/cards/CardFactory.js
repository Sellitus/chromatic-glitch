import { Card } from './Card.js';
import { cardDatabase } from './CardDatabase.js';
import { cardEffectRegistry } from './CardEffectRegistry.js';

/**
 * Factory for creating Card instances from definitions.
 */
export class CardFactory {
    /**
     * Create a card instance from a definition ID
     * @param {string} definitionId - ID of the card definition
     * @returns {Card} New Card instance
     * @throws {Error} If definition not found
     */
    static createCard(definitionId) {
        const definition = cardDatabase.getDefinition(definitionId);
        return new Card(definition);
    }

    /**
     * Create multiple card instances from definition IDs
     * @param {string[]} definitionIds - Array of definition IDs
     * @returns {Card[]} Array of new Card instances
     * @throws {Error} If any definition not found
     */
    static createCards(definitionIds) {
        return definitionIds.map(id => CardFactory.createCard(id));
    }

    /**
     * Create a card instance with a modified definition
     * @param {string} definitionId - Base card definition ID
     * @param {Object} modifications - Properties to modify
     * @returns {Card} New Card instance with modifications
     */
    static createModifiedCard(definitionId, modifications) {
        const baseCard = CardFactory.createCard(definitionId);
        return baseCard.modify(modifications);
    }

    /**
     * Create an upgraded version of a card
     * @param {Card} card - Card to upgrade
     * @returns {Card} New upgraded Card instance
     * @throws {Error} If card cannot be upgraded
     */
    static createUpgradedCard(card) {
        if (!card.upgradeToId) {
            throw new Error(`Card ${card.id} has no upgrade path`);
        }
        return CardFactory.createCard(card.upgradeToId);
    }

    /**
     * Create a random card matching criteria
     * @param {Object} criteria - Filter criteria
     * @param {string} [criteria.type] - Required card type
     * @param {string} [criteria.rarity] - Required rarity
     * @param {number} [criteria.maxCost] - Maximum cost
     * @returns {Card} Random matching Card instance
     * @throws {Error} If no matching cards found
     */
    static createRandomCard({ type, rarity, maxCost } = {}) {
        let definitions = cardDatabase.getAllDefinitions();

        // Apply filters
        if (type) {
            definitions = definitions.filter(def => def.type === type);
        }
        if (rarity) {
            definitions = definitions.filter(def => def.rarity === rarity);
        }
        if (typeof maxCost === 'number') {
            definitions = definitions.filter(def => def.cost <= maxCost);
        }

        if (definitions.length === 0) {
            throw new Error('No cards match the specified criteria');
        }

        // Select random definition
        const randomIndex = Math.floor(Math.random() * definitions.length);
        return new Card(definitions[randomIndex]);
    }

    /**
     * Create a set of random cards matching criteria
     * @param {number} count - Number of cards to create
     * @param {Object} criteria - Filter criteria (same as createRandomCard)
     * @returns {Card[]} Array of random Card instances
     */
    static createRandomCards(count, criteria = {}) {
        const cards = [];
        for (let i = 0; i < count; i++) {
            cards.push(CardFactory.createRandomCard(criteria));
        }
        return cards;
    }
}
