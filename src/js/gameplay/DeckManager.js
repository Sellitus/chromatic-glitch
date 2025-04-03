import { Deck } from './Deck.js';

/**
 * Manages deck persistence, presets, and loading/saving functionality.
 */
export class DeckManager {
    /**
     * Create a new DeckManager
     * @param {Object} config - Manager configuration
     * @param {Object} [config.storage=localStorage] - Storage implementation to use
     * @param {string} [config.storageKey='chromatic-glitch-decks'] - Key for storing decks
     * @param {Object[]} [config.presets=[]] - Preset deck configurations
     */
    constructor({ 
        storage = localStorage,
        storageKey = 'chromatic-glitch-decks',
        presets = []
    } = {}) {
        this._storage = storage;
        this._storageKey = storageKey;
        this._presets = [...presets];
        this._decks = this._loadDecks();
    }

    /**
     * Get all available decks
     * @returns {Deck[]} Array of decks
     */
    getAllDecks() {
        return [...this._decks];
    }

    /**
     * Get deck by name
     * @param {string} name - Deck name to find
     * @returns {Deck|null} Found deck or null
     */
    getDeck(name) {
        return this._decks.find(d => d.getName() === name) || null;
    }

    /**
     * Get all preset decks
     * @returns {Deck[]} Array of preset decks
     */
    getPresets() {
        return this._presets.map(preset => new Deck(preset));
    }

    /**
     * Save a deck
     * @param {Deck} deck - Deck to save
     * @throws {Error} If deck validation fails
     */
    saveDeck(deck) {
        // Validate deck before saving
        const validation = deck.validate();
        if (!validation.isValid) {
            throw new Error(`Cannot save invalid deck: ${validation.errors.join(', ')}`);
        }

        // Replace existing or add new
        const index = this._decks.findIndex(d => d.getName() === deck.getName());
        if (index !== -1) {
            this._decks[index] = deck;
        } else {
            this._decks.push(deck);
        }

        this._persistDecks();
    }

    /**
     * Delete a deck
     * @param {string} name - Name of deck to delete
     * @returns {boolean} True if deck was deleted
     */
    deleteDeck(name) {
        const index = this._decks.findIndex(d => d.getName() === name);
        if (index === -1) {
            return false;
        }

        this._decks.splice(index, 1);
        this._persistDecks();
        return true;
    }

    /**
     * Create a new deck from a preset
     * @param {string} presetName - Name of preset to use
     * @param {string} newName - Name for the new deck
     * @returns {Deck} New deck instance
     * @throws {Error} If preset not found
     */
    createFromPreset(presetName, newName) {
        const preset = this._presets.find(p => p.name === presetName);
        if (!preset) {
            throw new Error(`Preset not found: ${presetName}`);
        }

        // Create new deck from preset but with new name
        return new Deck({
            ...preset,
            name: newName
        });
    }

    /**
     * Load decks from storage
     * @private
     * @returns {Deck[]} Array of loaded decks
     */
    _loadDecks() {
        try {
            const data = this._storage.getItem(this._storageKey);
            if (!data) {
                return [];
            }

            const parsed = JSON.parse(data);
            return parsed.map(deckData => Deck.fromJSON(deckData));
        } catch (error) {
            console.error('Error loading decks:', error);
            return [];
        }
    }

    /**
     * Save decks to storage
     * @private
     */
    _persistDecks() {
        try {
            const data = JSON.stringify(this._decks.map(deck => deck.toJSON()));
            this._storage.setItem(this._storageKey, data);
        } catch (error) {
            console.error('Error saving decks:', error);
            throw new Error('Failed to save decks to storage');
        }
    }

    /**
     * Import decks from JSON data
     * @param {string} jsonData - JSON string containing deck data
     * @returns {number} Number of decks imported
     * @throws {Error} If JSON is invalid
     */
    importFromJSON(jsonData) {
        try {
            const decks = JSON.parse(jsonData).map(data => Deck.fromJSON(data));
            
            // Validate all decks before importing
            for (const deck of decks) {
                const validation = deck.validate();
                if (!validation.isValid) {
                    throw new Error(`Invalid deck "${deck.getName()}": ${validation.errors.join(', ')}`);
                }
            }

            // Replace existing decks with same names
            for (const deck of decks) {
                const index = this._decks.findIndex(d => d.getName() === deck.getName());
                if (index !== -1) {
                    this._decks[index] = deck;
                } else {
                    this._decks.push(deck);
                }
            }

            this._persistDecks();
            return decks.length;
        } catch (error) {
            throw new Error(`Failed to import decks: ${error.message}`);
        }
    }

    /**
     * Export decks to JSON string
     * @param {string[]} [deckNames] - Names of decks to export, or all if not specified
     * @returns {string} JSON string containing deck data
     */
    exportToJSON(deckNames) {
        const decksToExport = deckNames
            ? this._decks.filter(d => deckNames.includes(d.getName()))
            : this._decks;
        
        return JSON.stringify(decksToExport.map(deck => deck.toJSON()));
    }
}
