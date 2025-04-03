import { DiscardPile } from '../../src/js/gameplay/DiscardPile.js';
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

describe('DiscardPile', () => {
    let discardPile;
    let mockCards;

    beforeEach(() => {
        // Create fresh mock cards for each test
        mockCards = Array.from({ length: 10 }, (_, i) => createMockCard(i + 1));
        discardPile = new DiscardPile(mockCards);
    });

    describe('constructor', () => {
        it('creates an empty pile by default', () => {
            const emptyPile = new DiscardPile();
            expect(emptyPile.size()).toBe(0);
            expect(emptyPile.isEmpty()).toBe(true);
        });

        it('initializes with provided cards', () => {
            expect(discardPile.size()).toBe(10);
            expect(discardPile.isEmpty()).toBe(false);
        });

        it('creates a copy of the input array', () => {
            const originalCards = [...mockCards];
            discardPile.takeAll();
            expect(mockCards).toEqual(originalCards);
        });
    });

    describe('add operations', () => {
        it('adds a single card', () => {
            const newCard = createMockCard(4);
            discardPile.add(newCard);
            expect(discardPile.size()).toBe(11);
            expect(discardPile.peekTop()).toBe(newCard);
        });

        it('adds multiple cards', () => {
            const newCards = [4, 5].map(createMockCard);
            discardPile.addMultiple(newCards);
            expect(discardPile.size()).toBe(12);
            expect(discardPile.peekTop()).toBe(newCards[1]);
        });

        it('returns instance for chaining', () => {
            expect(discardPile.add(createMockCard(4))).toBe(discardPile);
            expect(discardPile.addMultiple([createMockCard(5)])).toBe(discardPile);
        });
    });

    describe('takeAll operations', () => {
        it('takes all cards and empties pile', () => {
            const cards = discardPile.takeAll();
            expect(cards).toHaveLength(10);
            expect(discardPile.isEmpty()).toBe(true);
        });

        it('returns copy of cards array', () => {
            const cards = discardPile.takeAll();
            cards.pop();
            expect(mockCards).toHaveLength(10);
        });
    });

    describe('shuffleAndTakeAll', () => {
        it('returns all cards in different order', () => {
            // Note: There's a tiny chance this test could fail if the shuffle
            // happens to return the same order
            const beforeShuffle = discardPile.getCards();
            const afterShuffle = discardPile.shuffleAndTakeAll();

            expect(afterShuffle).toHaveLength(beforeShuffle.length);
            expect(new Set(afterShuffle)).toEqual(new Set(beforeShuffle));
            
            let allSame = true;
            for (let i = 0; i < beforeShuffle.length; i++) {
                if (beforeShuffle[i] !== afterShuffle[i]) {
                    allSame = false;
                    break;
                }
            }
            // Check if at least one card changed position
            expect(allSame).toBe(false);
        });

        it('empties the pile', () => {
            discardPile.shuffleAndTakeAll();
            expect(discardPile.isEmpty()).toBe(true);
        });
    });

    describe('peek operations', () => {
        it('peeks at top card without removing it', () => {
            const topCard = discardPile.peekTop();
            expect(topCard).toBe(mockCards[9]);
            expect(discardPile.size()).toBe(10);
        });

        it('returns null when peeking empty pile', () => {
            discardPile.takeAll();
            expect(discardPile.peekTop()).toBeNull();
        });
    });

    describe('serialization', () => {
        it('serializes to JSON', () => {
            const json = discardPile.toJSON();
            expect(json).toHaveProperty('cards');
            expect(json.cards).toHaveLength(10);
        });

        it('deserializes from JSON', () => {
            const json = discardPile.toJSON();
            const newPile = DiscardPile.fromJSON(json);
            expect(newPile.size()).toBe(discardPile.size());
            expect(newPile.getCards()).toEqual(discardPile.getCards());
        });
    });
});
