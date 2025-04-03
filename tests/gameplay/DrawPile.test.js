import { DrawPile } from '../../src/js/gameplay/DrawPile.js';
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

describe('DrawPile', () => {
    let drawPile;
    let mockCards;

    beforeEach(() => {
        // Create fresh mock cards for each test
        mockCards = [1, 2, 3].map(createMockCard);
        drawPile = new DrawPile(mockCards);
    });

    describe('constructor', () => {
        it('creates an empty pile by default', () => {
            const emptyPile = new DrawPile();
            expect(emptyPile.size()).toBe(0);
            expect(emptyPile.isEmpty()).toBe(true);
        });

        it('initializes with provided cards', () => {
            expect(drawPile.size()).toBe(3);
            expect(drawPile.isEmpty()).toBe(false);
        });

        it('creates a copy of the input array', () => {
            const originalCards = [...mockCards];
            drawPile.draw();
            expect(mockCards).toEqual(originalCards);
        });
    });

    describe('draw operations', () => {
        it('draws a single card by default', () => {
            const drawn = drawPile.draw();
            expect(drawn).toHaveLength(1);
            expect(drawn[0]).toBe(mockCards[2]); // Last card in array
            expect(drawPile.size()).toBe(2);
        });

        it('draws multiple cards', () => {
            const drawn = drawPile.draw(2);
            expect(drawn).toHaveLength(2);
            expect(drawPile.size()).toBe(1);
        });

        it('throws error when drawing more cards than available', () => {
            expect(() => drawPile.draw(4)).toThrow();
        });

        it('drawOne returns null when empty', () => {
            drawPile.draw(3);
            expect(drawPile.drawOne()).toBeNull();
        });
    });

    describe('shuffle', () => {
        it('maintains the same cards after shuffle', () => {
            const beforeShuffle = drawPile.getCards();
            drawPile.shuffle();
            const afterShuffle = drawPile.getCards();

            expect(afterShuffle).toHaveLength(beforeShuffle.length);
            expect(new Set(afterShuffle)).toEqual(new Set(beforeShuffle));
        });

        it('returns the pile instance for chaining', () => {
            expect(drawPile.shuffle()).toBe(drawPile);
        });
    });

    describe('add operations', () => {
        it('adds cards to the top', () => {
            const newCard = createMockCard(4);
            drawPile.addToTop([newCard]);
            expect(drawPile.draw()[0]).toBe(newCard);
        });

        it('adds cards to the bottom', () => {
            const newCard = createMockCard(4);
            drawPile.addToBottom([newCard]);
            expect(drawPile.getCards()[0]).toBe(newCard);
        });
    });

    describe('serialization', () => {
        it('serializes to JSON', () => {
            const json = drawPile.toJSON();
            expect(json).toHaveProperty('cards');
            expect(json.cards).toHaveLength(3);
        });

        it('deserializes from JSON', () => {
            const json = drawPile.toJSON();
            const newPile = DrawPile.fromJSON(json);
            expect(newPile.size()).toBe(drawPile.size());
            expect(newPile.getCards()).toEqual(drawPile.getCards());
        });
    });
});
