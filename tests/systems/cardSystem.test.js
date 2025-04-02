import { CardSystem } from '../../src/js/systems/cardSystem.js';
import { cardDatabase } from '../../src/js/cards/CardDatabase.js';
import { cardEffectRegistry } from '../../src/js/cards/CardEffectRegistry.js';
import { CardType } from '../../src/js/cards/CardType.js';
import { CardRarity } from '../../src/js/cards/CardRarity.js';

describe('CardSystem', () => {
    let cardSystem;
    let mockEventSystem;
    let mockStore;
    let mockEffect;

    const testDefinitions = [
        {
            id: 'test_card',
            name: 'Test Card',
            type: CardType.MELODY,
            cost: 1,
            rarity: CardRarity.COMMON,
            description: 'Test description',
            effectKey: 'testEffect'
        }
    ];

    beforeEach(() => {
        // Mock event system
        mockEventSystem = {
            on: jest.fn(),
            emit: jest.fn()
        };

        // Mock Redux store
        mockStore = {
            dispatch: jest.fn(),
            getState: jest.fn().mockReturnValue({
                player: { id: 'player1' }
            })
        };

        // Mock effect
        mockEffect = jest.fn().mockResolvedValue(undefined);
        cardEffectRegistry.clear();
        cardEffectRegistry.register('testEffect', mockEffect);

        // Load test definitions
        cardDatabase.clear();
        cardDatabase.loadDefinitions(testDefinitions);

        // Create system instance
        cardSystem = new CardSystem(mockEventSystem, mockStore);

        // Mock fetch for card definitions
        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ cards: testDefinitions })
            })
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should initialize properly', () => {
        cardSystem.init();

        // Should register event handlers
        expect(mockEventSystem.on).toHaveBeenCalledWith('card:play', expect.any(Function));
        expect(mockEventSystem.on).toHaveBeenCalledWith('card:draw', expect.any(Function));
        expect(mockEventSystem.on).toHaveBeenCalledWith('card:discard', expect.any(Function));
        expect(mockEventSystem.on).toHaveBeenCalledWith('card:upgrade', expect.any(Function));
        expect(mockEventSystem.on).toHaveBeenCalledWith('card:discover', expect.any(Function));
    });

    describe('Card Creation', () => {
        it('should create a card instance', () => {
            const card = cardSystem.createCard('test_card');
            expect(card).toBeDefined();
            expect(card.id).toBe('test_card');
            expect(cardSystem.getCard(card.id)).toBe(card);
        });
    });

    describe('Card Playing', () => {
        it('should handle playing a card', async () => {
            const card = cardSystem.createCard('test_card');
            const target = { id: 'enemy1' };

            await cardSystem.handleCardPlay({
                cardId: card.id,
                target
            });

            expect(mockEffect).toHaveBeenCalled();
            expect(mockEventSystem.emit).toHaveBeenCalledWith(
                'card:played',
                expect.any(Object)
            );
        });

        it('should handle play failures', async () => {
            await cardSystem.handleCardPlay({
                cardId: 'nonexistent',
                target: {}
            });

            expect(mockEventSystem.emit).not.toHaveBeenCalledWith(
                'card:played',
                expect.any(Object)
            );
        });
    });

    describe('Card Drawing', () => {
        it('should handle drawing cards', () => {
            cardSystem.handleCardDraw({ count: 2 });

            expect(mockEventSystem.emit).toHaveBeenCalledTimes(2);
            expect(mockEventSystem.emit).toHaveBeenCalledWith(
                'card:drawn',
                expect.any(Object)
            );
        });
    });

    describe('Card Discarding', () => {
        it('should handle discarding a card', () => {
            const card = cardSystem.createCard('test_card');
            cardSystem.handleCardDiscard({ cardId: card.id });

            expect(cardSystem.getCard(card.id)).toBeUndefined();
            expect(mockEventSystem.emit).toHaveBeenCalledWith(
                'card:discarded',
                { cardId: card.id }
            );
        });
    });

    describe('Card Discovery', () => {
        it('should handle discovering a card', () => {
            cardSystem.handleCardDiscover({ cardId: 'test_card' });

            expect(mockStore.dispatch).toHaveBeenCalledWith({
                type: 'card/discover',
                payload: 'test_card'
            });

            expect(mockEventSystem.emit).toHaveBeenCalledWith(
                'card:discovered',
                { cardId: 'test_card' }
            );
        });

        it('should handle discovery failures', () => {
            cardSystem.handleCardDiscover({ cardId: 'nonexistent' });

            expect(mockEventSystem.emit).toHaveBeenCalledWith(
                'card:discoveryFailed',
                expect.any(Object)
            );
        });
    });

    describe('Cleanup', () => {
        it('should clean up resources', () => {
            const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

            cardSystem.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledTimes(3);
            expect(cardSystem.cards.size).toBe(0);

            removeEventListenerSpy.mockRestore();
        });
    });
});
