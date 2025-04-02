import { CardActionTypes } from '../actions/cardActions.js';

/**
 * Initial state for card-related data
 */
const initialState = {
    // Track which cards have been discovered by the player
    discoveredCardIds: new Set(),
};

/**
 * Card state reducer
 * @param {Object} state - Current state
 * @param {Object} action - Redux action
 * @returns {Object} New state
 */
export function cardReducer(state = initialState, action) {
    switch (action.type) {
        case CardActionTypes.DISCOVER_CARD: {
            // Don't modify state if card is already discovered
            if (state.discoveredCardIds.has(action.payload)) {
                return state;
            }

            // Create new Set with existing items plus new card
            const newDiscoveredCards = new Set(state.discoveredCardIds);
            newDiscoveredCards.add(action.payload);

            return {
                ...state,
                discoveredCardIds: newDiscoveredCards
            };
        }

        case CardActionTypes.FORGET_CARD: {
            // Don't modify state if card wasn't discovered
            if (!state.discoveredCardIds.has(action.payload)) {
                return state;
            }

            // Create new Set without the forgotten card
            const newDiscoveredCards = new Set(state.discoveredCardIds);
            newDiscoveredCards.delete(action.payload);

            return {
                ...state,
                discoveredCardIds: newDiscoveredCards
            };
        }

        case CardActionTypes.RESET_DISCOVERIES: {
            return {
                ...state,
                discoveredCardIds: new Set()
            };
        }

        default:
            return state;
    }
}

/**
 * Selector to check if a card has been discovered
 * @param {Object} state - Redux state
 * @param {string} cardId - Card ID to check
 * @returns {boolean} True if card is discovered
 */
export const isCardDiscovered = (state, cardId) => 
    state.cards.discoveredCardIds.has(cardId);

/**
 * Get all discovered card IDs
 * @param {Object} state - Redux state
 * @returns {string[]} Array of discovered card IDs
 */
export const getDiscoveredCardIds = (state) => 
    Array.from(state.cards.discoveredCardIds);

/**
 * Get count of discovered cards
 * @param {Object} state - Redux state
 * @returns {number} Number of discovered cards
 */
export const getDiscoveredCardCount = (state) =>
    state.cards.discoveredCardIds.size;
