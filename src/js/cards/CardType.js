/**
 * Enum for card types in the game.
 * @readonly
 * @enum {string}
 */
export const CardType = {
    MELODY: 'MELODY',
    HARMONY: 'HARMONY',
    RHYTHM: 'RHYTHM',
    RESONANCE: 'RESONANCE'
};

/**
 * Get all available card types
 * @returns {string[]} Array of card type values
 */
export const getAllCardTypes = () => Object.values(CardType);

/**
 * Validate if a given value is a valid card type
 * @param {string} type - The type to validate
 * @returns {boolean} True if valid type, false otherwise
 */
export const isValidCardType = (type) => Object.values(CardType).includes(type);
