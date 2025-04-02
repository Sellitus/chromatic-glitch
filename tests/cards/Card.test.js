import { Card } from '../../src/js/cards/Card.js';
import { CardType } from '../../src/js/cards/CardType.js';
import { CardRarity } from '../../src/js/cards/CardRarity.js';

describe('Card', () => {
    const validCardConfig = {
        id: 'test_card',
        name: 'Test Card',
        type: CardType.MELODY,
        cost: 1,
        rarity: CardRarity.COMMON,
        description: 'Test description',
        effectKey: 'testEffect',
    };

    it('should create a card with valid config', () => {
        const card = new Card(validCardConfig);
        expect(card.id).toBe('test_card');
        expect(card.name).toBe('Test Card');
        expect(card.type).toBe(CardType.MELODY);
        expect(card.cost).toBe(1);
        expect(card.rarity).toBe(CardRarity.COMMON);
        expect(card.description).toBe('Test description');
        expect(card.effectKey).toBe('testEffect');
    });

    it('should validate required fields', () => {
        const invalidConfigs = [
            { ...validCardConfig, id: null },
            { ...validCardConfig, name: '' },
            { ...validCardConfig, type: 'INVALID_TYPE' },
            { ...validCardConfig, cost: -1 },
            { ...validCardConfig, rarity: 'INVALID_RARITY' },
            { ...validCardConfig, description: null },
            { ...validCardConfig, effectKey: '' }
        ];

        invalidConfigs.forEach(config => {
            expect(() => new Card(config)).toThrow();
        });
    });

    it('should create immutable card instances', () => {
        const card = new Card(validCardConfig);
        expect(() => { card.id = 'new_id'; }).toThrow();
        expect(() => { card.name = 'New Name'; }).toThrow();
        expect(() => { card.cost = 2; }).toThrow();
        expect(card.id).toBe('test_card');
    });

    it('should create modified card copies', () => {
        const card = new Card(validCardConfig);
        const modified = card.modify({ cost: 2, description: 'New description' });

        expect(modified).toBeInstanceOf(Card);
        expect(modified.id).toBe(card.id);
        expect(modified.cost).toBe(2);
        expect(modified.description).toBe('New description');
        expect(card.cost).toBe(1); // Original unchanged
    });

    it('should serialize and deserialize correctly', () => {
        const card = new Card(validCardConfig);
        const serialized = card.toJSON();
        const deserialized = Card.fromJSON(serialized);

        expect(deserialized).toBeInstanceOf(Card);
        expect(deserialized).toEqual(card);
    });
});
