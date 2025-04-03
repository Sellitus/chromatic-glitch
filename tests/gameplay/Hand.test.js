import { Hand } from '../../src/js/gameplay/Hand.js';
import { Card } from '../../src/js/cards/Card.js';

// Mock card factory for testing
const createMockCard = (id) => new Card({
    id: `card-${id}`,
    name: `Test Card ${id}`,
    type: 'MELODY',
    cost: 1,
    rarity: 'COMMON',
    description: 'Test card description',
    effectKey: 'testEffect'
});

describe('Hand', () => {
    let hand;
    let mockCards;
    const defaultMaxSize = 10;

    beforeEach(() => {
        // Create fresh mock cards for each test
        mockCards = [1, 2, 3].map(createMockCard);
        hand = new Hand({ cards: mockCards });
    });

    describe('constructor', () => {
        it('creates an empty hand by default', () => {
            const emptyHand = new Hand();
            expect(emptyHand.size()).toBe(0);
            expect(emptyHand.maxSize()).toBe(defaultMaxSize);
        });

        it('initializes with provided cards', () => {
            expect(hand.size()).toBe(3);
            expect(hand.getCards()).toEqual(mockCards);
        });

        it('respects custom max size', () => {
            const customHand = new Hand({ maxSize: 5 });
            expect(customHand.maxSize()).toBe(5);
        });

        it('throws error if initial cards exceed max size', () => {
            expect(() => {
                new Hand({ maxSize: 2, cards: mockCards });
            }).toThrow();
        });
    });

    describe('add operations', () => {
        it('adds a single card', () => {
            const newCard = createMockCard(4);
            expect(hand.add(newCard)).toBe(true);
            expect(hand.size()).toBe(4);
            expect(hand.getCards()).toContain(newCard);
        });

        it('adds multiple cards', () => {
            const newCards = [4, 5].map(createMockCard);
            expect(hand.addMultiple(newCards)).toBe(2);
            expect(hand.size()).toBe(5);
        });

        it('throws error when adding to full hand', () => {
            const fullHand = new Hand({ maxSize: 3, cards: mockCards });
            expect(() => {
                fullHand.add(createMockCard(4));
            }).toThrow();
        });

        it('throws error when adding multiple cards that would exceed limit', () => {
            const newCards = [4, 5, 6, 7, 8, 9, 10, 11].map(createMockCard);
            expect(() => {
                hand.addMultiple(newCards);
            }).toThrow();
        });
    });

    describe('remove operations', () => {
        it('removes a specific card', () => {
            const cardToRemove = mockCards[1];
            const removed = hand.remove(cardToRemove);
            expect(removed).toBe(cardToRemove);
            expect(hand.size()).toBe(2);
            expect(hand.getCards()).not.toContain(cardToRemove);
        });

        it('returns null when removing non-existent card', () => {
            const nonExistentCard = createMockCard(99);
            expect(hand.remove(nonExistentCard)).toBeNull();
            expect(hand.size()).toBe(3);
        });

        it('removes card at specific index', () => {
            const removed = hand.removeAt(1);
            expect(removed).toBe(mockCards[1]);
            expect(hand.size()).toBe(2);
        });

        it('returns null when removing from invalid index', () => {
            expect(hand.removeAt(99)).toBeNull();
            expect(hand.removeAt(-1)).toBeNull();
            expect(hand.size()).toBe(3);
        });

        it('removes all cards', () => {
            const removed = hand.removeAll();
            expect(removed).toEqual(mockCards);
            expect(hand.isEmpty()).toBe(true);
        });
    });

    describe('utility methods', () => {
        it('checks if hand is full', () => {
            const fullHand = new Hand({ maxSize: 3, cards: mockCards });
            expect(fullHand.isFull()).toBe(true);
            expect(hand.isFull()).toBe(false);
        });

        it('calculates available space', () => {
            expect(hand.availableSpace()).toBe(defaultMaxSize - 3);
            hand.add(createMockCard(4));
            expect(hand.availableSpace()).toBe(defaultMaxSize - 4);
        });

        it('gets card at index', () => {
            expect(hand.getAt(1)).toBe(mockCards[1]);
            expect(hand.getAt(99)).toBeNull();
            expect(hand.getAt(-1)).toBeNull();
        });
    });

    describe('serialization', () => {
        it('serializes to JSON', () => {
            const json = hand.toJSON();
            expect(json).toHaveProperty('maxSize', defaultMaxSize);
            expect(json).toHaveProperty('cards');
            expect(json.cards).toHaveLength(3);
        });

        it('deserializes from JSON', () => {
            const json = hand.toJSON();
            const newHand = Hand.fromJSON(json);
            expect(newHand.size()).toBe(hand.size());
            expect(newHand.maxSize()).toBe(hand.maxSize());
            expect(newHand.getCards()).toEqual(hand.getCards());
        });
    });
});
