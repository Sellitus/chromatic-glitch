import { CardFactory } from '../../src/js/cards/CardFactory.js';
import { cardDatabase } from '../../src/js/cards/CardDatabase.js';
import { cardEffectRegistry } from '../../src/js/cards/CardEffectRegistry.js';
import { CardType } from '../../src/js/cards/CardType.js';
import { CardRarity } from '../../src/js/cards/CardRarity.js';
import { Card } from '../../src/js/cards/Card.js';

describe('CardFactory', () => {
    const mockEffect = jest.fn();

    const testDefinitions = [
        {
            id: 'base_card',
            name: 'Base Card',
            type: CardType.MELODY,
            cost: 1,
            rarity: CardRarity.COMMON,
            description: 'Base card description',
            effectKey: 'testEffect',
            upgradeToId: 'upgraded_card'
        },
        {
            id: 'upgraded_card',
            name: 'Upgraded Card',
            type: CardType.MELODY,
            cost: 1,
            rarity: CardRarity.COMMON,
            description: 'Upgraded card description',
            effectKey: 'testEffect'
        },
        {
            id: 'rare_card',
            name: 'Rare Card',
            type: CardType.HARMONY,
            cost: 2,
            rarity: CardRarity.RARE,
            description: 'Rare card description',
            effectKey: 'testEffect'
        }
    ];

    beforeEach(() => {
        cardDatabase.clear();
        cardEffectRegistry.clear();
        cardEffectRegistry.register('testEffect', mockEffect);
        cardDatabase.loadDefinitions(testDefinitions);
    });

    it('should create a card from definition ID', () => {
        const card = CardFactory.createCard('base_card');
        expect(card).toBeInstanceOf(Card);
        expect(card.id).toBe('base_card');
        expect(card.name).toBe('Base Card');
    });

    it('should throw when creating card with invalid definition ID', () => {
        expect(() => {
            CardFactory.createCard('nonexistent');
        }).toThrow();
    });

    it('should create multiple cards from definition IDs', () => {
        const cards = CardFactory.createCards(['base_card', 'rare_card']);
        expect(cards.length).toBe(2);
        expect(cards[0]).toBeInstanceOf(Card);
        expect(cards[1]).toBeInstanceOf(Card);
        expect(cards[0].id).toBe('base_card');
        expect(cards[1].id).toBe('rare_card');
    });

    it('should create modified card copies', () => {
        const modifications = {
            cost: 3,
            description: 'Modified description'
        };

        const modified = CardFactory.createModifiedCard('base_card', modifications);
        expect(modified).toBeInstanceOf(Card);
        expect(modified.id).toBe('base_card');
        expect(modified.cost).toBe(3);
        expect(modified.description).toBe('Modified description');
    });

    it('should create upgraded cards', () => {
        const baseCard = CardFactory.createCard('base_card');
        const upgradedCard = CardFactory.createUpgradedCard(baseCard);

        expect(upgradedCard).toBeInstanceOf(Card);
        expect(upgradedCard.id).toBe('upgraded_card');
        expect(upgradedCard.name).toBe('Upgraded Card');
    });

    it('should throw when upgrading card with no upgrade path', () => {
        const card = CardFactory.createCard('upgraded_card');
        expect(() => {
            CardFactory.createUpgradedCard(card);
        }).toThrow();
    });

    describe('Random card creation', () => {
        it('should create random card with no criteria', () => {
            const card = CardFactory.createRandomCard();
            expect(card).toBeInstanceOf(Card);
            expect(testDefinitions.some(def => def.id === card.id)).toBe(true);
        });

        it('should create random card matching type', () => {
            const card = CardFactory.createRandomCard({ type: CardType.HARMONY });
            expect(card).toBeInstanceOf(Card);
            expect(card.type).toBe(CardType.HARMONY);
        });

        it('should create random card matching rarity', () => {
            const card = CardFactory.createRandomCard({ rarity: CardRarity.RARE });
            expect(card).toBeInstanceOf(Card);
            expect(card.rarity).toBe(CardRarity.RARE);
        });

        it('should create random card within cost limit', () => {
            const card = CardFactory.createRandomCard({ maxCost: 1 });
            expect(card).toBeInstanceOf(Card);
            expect(card.cost).toBeLessThanOrEqual(1);
        });

        it('should create multiple random cards', () => {
            const cards = CardFactory.createRandomCards(2, { type: CardType.MELODY });
            expect(cards.length).toBe(2);
            expect(cards[0]).toBeInstanceOf(Card);
            expect(cards[1]).toBeInstanceOf(Card);
            expect(cards.every(card => card.type === CardType.MELODY)).toBe(true);
        });

        it('should throw when no cards match criteria', () => {
            expect(() => {
                CardFactory.createRandomCard({ maxCost: 0 });
            }).toThrow();
        });
    });
});
