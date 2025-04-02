/**
 * Action types for card-related state changes
 */
export const CardActionTypes = {
    DISCOVER_CARD: 'card/discover',
    FORGET_CARD: 'card/forget', // For testing/debugging
    RESET_DISCOVERIES: 'card/resetDiscoveries'
};

/**
 * Mark a card as discovered
 * @param {string} cardId - ID of the card to discover
 * @returns {Object} Redux action
 */
export const discoverCard = (cardId) => ({
    type: CardActionTypes.DISCOVER_CARD,
    payload: cardId
});

/**
 * Remove a card from discovered cards (debug/testing)
 * @param {string} cardId - ID of the card to forget
 * @returns {Object} Redux action
 */
export const forgetCard = (cardId) => ({
    type: CardActionTypes.FORGET_CARD,
    payload: cardId
});

/**
 * Reset all card discoveries to initial state
 * @returns {Object} Redux action
 */
export const resetDiscoveries = () => ({
    type: CardActionTypes.RESET_DISCOVERIES
});
