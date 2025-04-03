import { Deck } from '../../src/js/gameplay/Deck.js';
import { Card } from '../../src/js/cards/Card.js';

// Mock card factory for testing
const createMockCard = (id) => new Card({
    id: `card-${id}`,
    name: `Test Card ${id}`,
    type: 'MELODY',
    cost: id % 3 + 1, // Costs will be 1, 2, or 3
    rarity: 'COMMON',
    description: 'Test card description',
    effectKey: 'testEffect'
});

describe('Deck', () => {
    let deck;
    let mockCards;

    beforeEach(() => {
        // Create fresh mock cards for each test
        mockCards = Array.from({ length: 5 }, (_, i) => createMockCard(i + 1));
        deck = new Deck({ 
            name: 'Test Deck',
            cards: mockCards
        });
    });

    describe('constructor', () => {
        it('creates an empty deck with name', () => {
            const emptyDeck = new Deck({ name: 'Empty Deck' });
            expect(emptyDeck.getName()).toBe('Empty Deck');
            expect(emptyDeck.getCards()).toHaveLength(0);
        });

        it('initializes with provided cards', () => {
            expect(deck.getCards()).toHaveLength(5);
            expect(deck.getCards()).toEqual(mockCards);
        });

        it('accepts custom rules', () => {
            const customDeck = new Deck({ 
                name: 'Custom Rules',
                rules: {
                    minCards: 30,
                    maxCards: 50,
                    maxCopies: 2
                }
            });
            expect(customDeck.validate().isValid).toBe(false); // Empty deck < minCards
            // Add cards up to max copies limit
            const sameCard = createMockCard(1);
            customDeck.addCard(sameCard);
            customDeck.addCard(sameCard);
            expect(() => customDeck.addCard(sameCard)).toThrow(); // Third copy should throw
        });
    });

    describe('card management', () => {
        it('adds cards within limits', () => {
            const newCard = createMockCard(6);
            expect(deck.canAddCard(newCard)).toBe(true);
            expect(deck.addCard(newCard)).toBe(true);
            expect(deck.getCards()).toHaveLength(6);
        });

        it('removes cards', () => {
            const cardToRemove = mockCards[2];
            const removed = deck.removeCard(cardToRemove);
            expect(removed).toBe(cardToRemove);
            expect(deck.getCards()).toHaveLength(4);
            expect(deck.getCards()).not.toContain(cardToRemove);
        });

        it('returns null when removing non-existent card', () => {
            const nonExistentCard = createMockCard(99);
            expect(deck.removeCard(nonExistentCard)).toBeNull();
            expect(deck.getCards()).toHaveLength(5);
        });

        it('prevents exceeding max copies', () => {
            const duplicate = createMockCard(1); // Same id as first mock card
            expect(deck.addCard(duplicate)).toBe(true); // Second copy allowed
            expect(deck.addCard(duplicate)).toBe(true); // Third copy allowed
            expect(() => deck.addCard(duplicate)).toThrow(); // Fourth copy blocked
        });
    });

    describe('validation', () => {
        it('validates deck size limits', () => {
            const smallDeck = new Deck({ name: 'Small Deck' });
            expect(smallDeck.validate().isValid).toBe(false);
            expect(smallDeck.validate().errors).toContain('Deck must contain at least 40 cards');

            // Create a deck that exceeds max size
            const oversizedCards = Array.from({ length: 6 }, (_, i) => createMockCard(i));
            const bigDeck = new Deck({ 
                name: 'Big Deck', 
                cards: oversizedCards,
                rules: { 
                    minCards: 1, 
                    maxCards: 5, 
                    maxCopies: 5 
                }
            });
            
            const validation = bigDeck.validate();
            expect(validation.isValid).toBe(false);
            expect(validation.errors).toContain('Deck cannot contain more than 5 cards');
        });

        it('validates card copy limits', () => {
            const customDeck = new Deck({
                name: 'Copy Test',
                rules: {
                    minCards: 1,
                    maxCards: 60,
                    maxCopies: 2
                }
            });

            // Add more than allowed copies
            const card = createMockCard(1);
            customDeck.addCard(card);
            customDeck.addCard(card);
            expect(() => customDeck.addCard(card)).toThrow();
            
            const validation = customDeck.validate();
            expect(validation.errors).not.toContain('copies'); // Should not have copy errors
        });
    });

    describe('statistics', () => {
        it('calculates basic statistics', () => {
            const stats = deck.calculateStats();
            expect(stats.totalCards).toBe(5);
            expect(stats.byType.MELODY).toBe(5);
            expect(stats.byRarity.COMMON).toBe(5);
            expect(stats.averageCost).toBeGreaterThan(0);
        });

        it('handles empty deck statistics', () => {
            const emptyDeck = new Deck({ name: 'Empty' });
            const stats = emptyDeck.calculateStats();
            expect(stats.totalCards).toBe(0);
            expect(stats.averageCost).toBe(0);
            expect(Object.keys(stats.byType)).toHaveLength(0);
            expect(Object.keys(stats.byRarity)).toHaveLength(0);
        });
    });

    describe('serialization', () => {
        it('serializes to JSON', () => {
            const json = deck.toJSON();
            expect(json).toHaveProperty('name', 'Test Deck');
            expect(json).toHaveProperty('cards');
            expect(json.cards).toHaveLength(5);
            expect(json).toHaveProperty('rules');
        });

        it('deserializes from JSON', () => {
            const json = deck.toJSON();
            const newDeck = Deck.fromJSON(json);
            expect(newDeck.getName()).toBe(deck.getName());
            expect(newDeck.getCards()).toEqual(deck.getCards());
        });
    });
});
