import { cardReducer } from '../../../src/js/state/reducers/cardReducer.js';
import { CardActionTypes } from '../../../src/js/state/actions/cardActions.js';

describe('cardReducer', () => {
    const initialState = {
        discoveredCardIds: new Set()
    };

    it('should provide initial state', () => {
        const state = cardReducer(undefined, { type: '@@INIT' });
        expect(state).toEqual(initialState);
    });

    it('should discover a card', () => {
        const state = cardReducer(initialState, {
            type: CardActionTypes.DISCOVER_CARD,
            payload: 'test_card'
        });

        expect(state.discoveredCardIds.has('test_card')).toBe(true);
        expect(state.discoveredCardIds.size).toBe(1);
    });

    it('should not duplicate discovered cards', () => {
        const stateWithCard = {
            discoveredCardIds: new Set(['test_card'])
        };

        const state = cardReducer(stateWithCard, {
            type: CardActionTypes.DISCOVER_CARD,
            payload: 'test_card'
        });

        expect(state.discoveredCardIds.size).toBe(1);
        expect(state).toBe(stateWithCard); // Should return same object if no change
    });

    it('should forget a card', () => {
        const stateWithCard = {
            discoveredCardIds: new Set(['test_card'])
        };

        const state = cardReducer(stateWithCard, {
            type: CardActionTypes.FORGET_CARD,
            payload: 'test_card'
        });

        expect(state.discoveredCardIds.has('test_card')).toBe(false);
        expect(state.discoveredCardIds.size).toBe(0);
    });

    it('should handle forgetting unknown card', () => {
        const stateWithCard = {
            discoveredCardIds: new Set(['test_card'])
        };

        const state = cardReducer(stateWithCard, {
            type: CardActionTypes.FORGET_CARD,
            payload: 'unknown_card'
        });

        expect(state).toBe(stateWithCard); // Should return same object if no change
        expect(state.discoveredCardIds.size).toBe(1);
    });

    it('should reset discoveries', () => {
        const stateWithCards = {
            discoveredCardIds: new Set(['card1', 'card2', 'card3'])
        };

        const state = cardReducer(stateWithCards, {
            type: CardActionTypes.RESET_DISCOVERIES
        });

        expect(state.discoveredCardIds.size).toBe(0);
    });

    it('should handle unknown actions', () => {
        const state = cardReducer(initialState, {
            type: 'UNKNOWN_ACTION'
        });

        expect(state).toBe(initialState);
    });

    // Test selectors
    describe('selectors', () => {
        const stateWithCards = {
            cards: {
                discoveredCardIds: new Set(['card1', 'card2'])
            }
        };

        it('should check if card is discovered', () => {
            const { isCardDiscovered } = require('../../../src/js/state/reducers/cardReducer.js');
            
            expect(isCardDiscovered(stateWithCards, 'card1')).toBe(true);
            expect(isCardDiscovered(stateWithCards, 'unknown')).toBe(false);
        });

        it('should get discovered card IDs', () => {
            const { getDiscoveredCardIds } = require('../../../src/js/state/reducers/cardReducer.js');
            
            const ids = getDiscoveredCardIds(stateWithCards);
            expect(ids).toEqual(['card1', 'card2']);
        });

        it('should get discovered card count', () => {
            const { getDiscoveredCardCount } = require('../../../src/js/state/reducers/cardReducer.js');
            
            expect(getDiscoveredCardCount(stateWithCards)).toBe(2);
        });
    });
});
