import { DrawPile } from '../../src/js/gameplay/DrawPile.js';
import { DiscardPile } from '../../src/js/gameplay/DiscardPile.js';
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

describe('Card Flow Integration', () => {
    let drawPile;
    let discardPile;
    let hand;
    let mockCards;

    beforeEach(() => {
        // Create a deck of 10 cards
        mockCards = Array.from({ length: 10 }, (_, i) => createMockCard(i + 1));
        drawPile = new DrawPile(mockCards);
        discardPile = new DiscardPile();
        hand = new Hand({ maxSize: 5 }); // Set a smaller hand size for testing
    });

    describe('Basic Game Flow', () => {
        it('draws cards from deck to hand', () => {
            // Draw 3 cards to hand
            const drawn = drawPile.draw(3);
            hand.addMultiple(drawn);

            expect(drawPile.size()).toBe(7);
            expect(hand.size()).toBe(3);
            expect(discardPile.size()).toBe(0);
        });

        it('discards cards from hand', () => {
            // Draw cards then discard some
            const drawn = drawPile.draw(3);
            hand.addMultiple(drawn);
            
            const cardToDiscard = hand.removeAt(1); // Remove middle card
            discardPile.add(cardToDiscard);

            expect(drawPile.size()).toBe(7);
            expect(hand.size()).toBe(2);
            expect(discardPile.size()).toBe(1);
        });

        it('reshuffles discard pile into draw pile', () => {
            // Draw all cards
            while (!drawPile.isEmpty()) {
                const card = drawPile.drawOne();
                if (hand.isFull()) {
                    discardPile.add(hand.removeAt(0));
                }
                hand.add(card);
            }

            // Some cards should be in discard due to hand size limit
            expect(drawPile.isEmpty()).toBe(true);
            expect(discardPile.size()).toBeGreaterThan(0);
            
            // Reshuffle discard into draw
            const shuffledCards = discardPile.shuffleAndTakeAll();
            drawPile.addToBottom(shuffledCards);

            expect(discardPile.isEmpty()).toBe(true);
            expect(drawPile.size()).toBeGreaterThan(0);
        });
    });

    describe('Complex Scenarios', () => {
        it('handles drawing more cards than available by reshuffling', () => {
            // Draw most cards to hand and discard
            const firstDraw = drawPile.draw(4);
            hand.addMultiple(firstDraw);
            
            // Discard some cards
            discardPile.add(hand.removeAt(0));
            discardPile.add(hand.removeAt(0));

            // Draw remaining cards
            while (!drawPile.isEmpty()) {
                const card = drawPile.drawOne();
                discardPile.add(card);
            }

            // Attempt to draw when deck is empty
            expect(drawPile.isEmpty()).toBe(true);
            
            // Reshuffle discard into draw
            const shuffledCards = discardPile.shuffleAndTakeAll();
            drawPile.addToBottom(shuffledCards);

            // Should be able to draw again
            expect(drawPile.size()).toBeGreaterThan(0);
            expect(() => {
                const newCards = drawPile.draw(3);
                hand.addMultiple(newCards);
            }).not.toThrow();
        });

        it('maintains correct total card count throughout operations', () => {
            const totalCards = mockCards.length;
            
            // Perform various operations
            const drawn = drawPile.draw(3);
            hand.addMultiple(drawn);
            
            discardPile.add(hand.removeAt(0));
            
            const currentTotal = drawPile.size() + hand.size() + discardPile.size();
            expect(currentTotal).toBe(totalCards);
        });

        it('prevents exceeding hand size limits during draw', () => {
            // Fill hand to max
            const maxDraw = drawPile.draw(hand.maxSize());
            hand.addMultiple(maxDraw);

            // Attempt to draw more
            const extraCard = drawPile.drawOne();
            expect(() => hand.add(extraCard)).toThrow();
            
            // Card should not be lost
            drawPile.addToTop([extraCard]);
            expect(drawPile.size() + hand.size()).toBe(mockCards.length);
        });
    });
});
