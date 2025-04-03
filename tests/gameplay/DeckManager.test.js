import { DeckManager } from '../../src/js/gameplay/DeckManager.js';
import { Deck } from '../../src/js/gameplay/Deck.js';
import { Card } from '../../src/js/cards/Card.js';

// Mock card factory for testing
const createMockCard = (id) => new Card({
    id: `card-${id}`,
    name: `Test Card ${id}`,
    type: 'MELODY',
    cost: id % 3 + 1,
    rarity: 'COMMON',
    description: 'Test card description',
    effectKey: 'testEffect'
});

// Create a valid deck (40 cards) for testing
const createValidDeck = (name) => {
    const deck = new Deck({ name });
    for (let i = 0; i < 40; i++) {
        deck.addCard(createMockCard(Math.floor(i / 3) + 1)); // Up to 3 copies of each card
    }
    return deck;
};

// Mock storage implementation
class MockStorage {
    constructor() {
        this.store = new Map();
    }

    getItem(key) {
        return this.store.get(key) || null;
    }

    setItem(key, value) {
        this.store.set(key, value);
    }

    removeItem(key) {
        this.store.delete(key);
    }

    clear() {
        this.store.clear();
    }
}

describe('DeckManager', () => {
    let manager;
    let mockStorage;
    let presets;

    beforeEach(() => {
        mockStorage = new MockStorage();
        presets = [
            {
                name: 'Starter Deck',
                cards: Array(40).fill(null).map((_, i) => createMockCard(Math.floor(i / 3) + 1))
            }
        ];
        manager = new DeckManager({ 
            storage: mockStorage,
            presets
        });
    });

    describe('deck management', () => {
        it('starts with no saved decks', () => {
            expect(manager.getAllDecks()).toHaveLength(0);
        });

        it('saves valid decks', () => {
            const deck = createValidDeck('Test Deck');
            manager.saveDeck(deck);
            expect(manager.getAllDecks()).toHaveLength(1);
            expect(manager.getDeck('Test Deck')).toBeTruthy();
        });

        it('prevents saving invalid decks', () => {
            const invalidDeck = new Deck({ name: 'Invalid' }); // Empty deck
            expect(() => manager.saveDeck(invalidDeck)).toThrow();
        });

        it('deletes decks', () => {
            const deck = createValidDeck('Test Deck');
            manager.saveDeck(deck);
            expect(manager.deleteDeck('Test Deck')).toBe(true);
            expect(manager.getAllDecks()).toHaveLength(0);
        });

        it('updates existing decks', () => {
            const deck = createValidDeck('Test Deck');
            manager.saveDeck(deck);

            // Modify and save again
            const updatedDeck = createValidDeck('Test Deck'); // Different cards, same name
            manager.saveDeck(updatedDeck);
            
            expect(manager.getAllDecks()).toHaveLength(1);
            expect(manager.getDeck('Test Deck')).toEqual(updatedDeck);
        });
    });

    describe('preset management', () => {
        it('lists available presets', () => {
            const presetDecks = manager.getPresets();
            expect(presetDecks).toHaveLength(1);
            expect(presetDecks[0].getName()).toBe('Starter Deck');
        });

        it('creates new deck from preset', () => {
            const newDeck = manager.createFromPreset('Starter Deck', 'My Custom Deck');
            expect(newDeck.getName()).toBe('My Custom Deck');
            expect(newDeck.getCards()).toHaveLength(40);
        });

        it('throws error for non-existent preset', () => {
            expect(() => {
                manager.createFromPreset('Non-existent', 'New Deck');
            }).toThrow();
        });
    });

    describe('persistence', () => {
        it('loads saved decks from storage', () => {
            const deck = createValidDeck('Test Deck');
            manager.saveDeck(deck);

            // Create new manager instance with same storage
            const newManager = new DeckManager({ storage: mockStorage });
            expect(newManager.getAllDecks()).toHaveLength(1);
            expect(newManager.getDeck('Test Deck')).toBeTruthy();
        });

        it('handles storage errors gracefully', () => {
            const mockStorageWithError = {
                getItem: () => { throw new Error('Storage error'); },
                setItem: () => { throw new Error('Storage error'); }
            };
            
            // Should not throw when loading fails
            const newManager = new DeckManager({ storage: mockStorageWithError });
            expect(newManager.getAllDecks()).toHaveLength(0);

            // Should throw when saving fails
            expect(() => {
                newManager.saveDeck(createValidDeck('Test'));
            }).toThrow();
        });
    });

    describe('import/export', () => {
        it('exports decks to JSON', () => {
            const deck1 = createValidDeck('Deck 1');
            const deck2 = createValidDeck('Deck 2');
            manager.saveDeck(deck1);
            manager.saveDeck(deck2);

            const exported = manager.exportToJSON();
            expect(JSON.parse(exported)).toHaveLength(2);

            // Export specific decks
            const specific = manager.exportToJSON(['Deck 1']);
            expect(JSON.parse(specific)).toHaveLength(1);
        });

        it('imports decks from JSON', () => {
            const deck = createValidDeck('Test Deck');
            const exported = JSON.stringify([deck.toJSON()]);

            const imported = manager.importFromJSON(exported);
            expect(imported).toBe(1); // Number of decks imported
            expect(manager.getDeck('Test Deck')).toBeTruthy();
        });

        it('validates decks during import', () => {
            const invalidDeck = new Deck({ name: 'Invalid' }); // Empty deck
            const exported = JSON.stringify([invalidDeck.toJSON()]);

            expect(() => {
                manager.importFromJSON(exported);
            }).toThrow();
        });

        it('handles invalid JSON during import', () => {
            expect(() => {
                manager.importFromJSON('invalid json');
            }).toThrow();
        });
    });
});
