import { CardDatabase, cardDatabase } from '../../src/js/cards/CardDatabase.js';
import { CardType } from '../../src/js/cards/CardType.js';
import { CardRarity } from '../../src/js/cards/CardRarity.js';
import { cardEffectRegistry } from '../../src/js/cards/CardEffectRegistry.js';

describe('CardDatabase', () => {
    let database;
    const mockEffect = jest.fn();

    const testDefinitions = [
        {
            id: 'card1',
            name: 'Test Card 1',
            type: CardType.MELODY,
            cost: 1,
            rarity: CardRarity.COMMON,
            description: 'Test description 1',
            effectKey: 'testEffect',
        },
        {
            id: 'card2',
            name: 'Test Card 2',
            type: CardType.HARMONY,
            cost: 2,
            rarity: CardRarity.RARE,
            description: 'Test description 2',
            effectKey: 'testEffect',
            upgradeToId: 'card3'
        },
        {
            id: 'card3',
            name: 'Test Card 3',
            type: CardType.HARMONY,
            cost: 2,
            rarity: CardRarity.RARE,
            description: 'Test description 3',
            effectKey: 'testEffect'
        }
    ];

    beforeEach(() => {
        database = new CardDatabase();
        cardEffectRegistry.clear();
        cardEffectRegistry.register('testEffect', mockEffect);
    });

    it('should load valid definitions', () => {
        database.loadDefinitions(testDefinitions);
        expect(database.getAllDefinitions().length).toBe(3);
    });

    it('should validate card definitions', () => {
        const invalidDefinitions = [
            { ...testDefinitions[0], id: null },
            { ...testDefinitions[0], name: '' },
            { ...testDefinitions[0], type: 'INVALID' },
            { ...testDefinitions[0], cost: -1 },
            { ...testDefinitions[0], rarity: 'INVALID' },
            { ...testDefinitions[0], description: null },
            { ...testDefinitions[0], effectKey: 'nonexistent' }
        ];

        invalidDefinitions.forEach(def => {
            expect(() => {
                database.loadDefinitions([def]);
            }).toThrow();
        });
    });

    it('should validate upgrade paths', () => {
        const defsWithInvalidUpgrade = [
            {
                ...testDefinitions[0],
                upgradeToId: 'nonexistent'
            }
        ];

        expect(() => {
            database.loadDefinitions(defsWithInvalidUpgrade);
        }).toThrow();
    });

    it('should get definition by ID', () => {
        database.loadDefinitions(testDefinitions);
        const def = database.getDefinition('card1');
        expect(def).toEqual(testDefinitions[0]);
    });

    it('should throw when getting nonexistent definition', () => {
        database.loadDefinitions(testDefinitions);
        expect(() => {
            database.getDefinition('nonexistent');
        }).toThrow();
    });

    it('should filter definitions by type', () => {
        database.loadDefinitions(testDefinitions);
        const harmonyCards = database.getDefinitionsByType(CardType.HARMONY);
        expect(harmonyCards.length).toBe(2);
        expect(harmonyCards.every(def => def.type === CardType.HARMONY)).toBe(true);
    });

    it('should filter definitions by rarity', () => {
        database.loadDefinitions(testDefinitions);
        const rareCards = database.getDefinitionsByRarity(CardRarity.RARE);
        expect(rareCards.length).toBe(2);
        expect(rareCards.every(def => def.rarity === CardRarity.RARE)).toBe(true);
    });

    it('should get base cards', () => {
        database.loadDefinitions(testDefinitions);
        const baseCards = database.getBaseCards();
        expect(baseCards.length).toBe(2);
        expect(baseCards.every(def => !def.upgradeToId)).toBe(true);
    });

    it('should get upgrade path', () => {
        database.loadDefinitions(testDefinitions);
        const upgradePath = database.getUpgradePath('card2');
        expect(upgradePath.length).toBe(2);
        expect(upgradePath[0].id).toBe('card2');
        expect(upgradePath[1].id).toBe('card3');
    });

    it('should search by name', () => {
        database.loadDefinitions(testDefinitions);
        const results = database.searchByName('Card 2');
        expect(results.length).toBe(1);
        expect(results[0].id).toBe('card2');
    });

    it('should clear definitions', () => {
        database.loadDefinitions(testDefinitions);
        expect(database.getAllDefinitions().length).toBe(3);
        
        database.clear();
        expect(database.getAllDefinitions().length).toBe(0);
    });
});

describe('cardDatabase singleton', () => {
    beforeEach(() => {
        cardDatabase.clear();
        cardEffectRegistry.clear();
        cardEffectRegistry.register('testEffect', jest.fn());
    });

    it('should be an instance of CardDatabase', () => {
        expect(cardDatabase).toBeInstanceOf(CardDatabase);
    });

    it('should maintain singleton state', () => {
        const testDef = {
            id: 'test',
            name: 'Test',
            type: CardType.MELODY,
            cost: 1,
            rarity: CardRarity.COMMON,
            description: 'Test',
            effectKey: 'testEffect'
        };

        cardDatabase.loadDefinitions([testDef]);
        expect(cardDatabase.getDefinition('test')).toEqual(testDef);
    });
});
