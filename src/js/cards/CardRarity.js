/**
 * Enum for card rarities in the game.
 * @readonly
 * @enum {string}
 */
export const CardRarity = {
    COMMON: 'COMMON',
    UNCOMMON: 'UNCOMMON',
    RARE: 'RARE',
    EPIC: 'EPIC',
    LEGENDARY: 'LEGENDARY'
};

// Numerical weights for each rarity (higher number = better card)
export const RARITY_WEIGHTS = {
    [CardRarity.COMMON]: 1,
    [CardRarity.UNCOMMON]: 2,
    [CardRarity.RARE]: 3,
    [CardRarity.EPIC]: 4,
    [CardRarity.LEGENDARY]: 5
};

/**
 * Get all available rarities
 * @returns {string[]} Array of rarity values
 */
export const getAllRarities = () => Object.values(CardRarity);

/**
 * Validate if a given value is a valid rarity
 * @param {string} rarity - The rarity to validate
 * @returns {boolean} True if valid rarity, false otherwise
 */
export const isValidRarity = (rarity) => Object.values(CardRarity).includes(rarity);

/**
 * Get the weight/power level of a rarity
 * @param {string} rarity - The rarity to get weight for
 * @returns {number} The weight value, or 0 if invalid rarity
 */
export const getRarityWeight = (rarity) => RARITY_WEIGHTS[rarity] || 0;
