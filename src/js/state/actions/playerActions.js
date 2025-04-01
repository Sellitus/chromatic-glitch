import {
  UPDATE_PLAYER_HEALTH,
  UPDATE_PLAYER_MANA,
  ADD_CARD_TO_HAND,
  REMOVE_CARD_FROM_HAND,
  ADD_EFFECT_TO_PLAYER,
  REMOVE_EFFECT_FROM_PLAYER,
  UPDATE_SPIRIT_STRAIN,
  ADD_CARD_TO_COLLECTION,
  REMOVE_CARD_FROM_COLLECTION,
  SET_DECK,
  UPDATE_RESOURCE,
  GAIN_EXPERIENCE,
  LEVEL_UP,
  UPDATE_REPUTATION,
  UPDATE_STATISTIC,
  UNLOCK_ACHIEVEMENT,
  UPDATE_ACHIEVEMENT_PROGRESS,
  UPDATE_PREFERENCE,
  RESET_PLAYER
} from './actionTypes';

/**
 * Action creator for updating player health
 * @param {number} amount - Amount to change health by (positive or negative)
 * @returns {Object} Action object
 */
export const updatePlayerHealth = (amount) => ({
  type: UPDATE_PLAYER_HEALTH,
  payload: amount
});

/**
 * Action creator for updating player mana
 * @param {number} amount - Amount to change mana by (positive or negative)
 * @returns {Object} Action object
 */
export const updatePlayerMana = (amount) => ({
  type: UPDATE_PLAYER_MANA,
  payload: amount
});

/**
 * Action creator for adding a card to player's hand
 * @param {Object} card - Card object to add
 * @returns {Object} Action object
 */
export const addCardToHand = (card) => ({
  type: ADD_CARD_TO_HAND,
  payload: card
});

/**
 * Action creator for removing a card from player's hand
 * @param {string} cardId - ID of card to remove
 * @returns {Object} Action object
 */
export const removeCardFromHand = (cardId) => ({
  type: REMOVE_CARD_FROM_HAND,
  payload: cardId
});

/**
 * Action creator for adding an effect to the player
 * @param {Object} effect - Effect object to add
 * @returns {Object} Action object
 */
export const addEffectToPlayer = (effect) => ({
  type: ADD_EFFECT_TO_PLAYER,
  payload: effect
});

/**
 * Action creator for removing an effect from the player
 * @param {string} effectId - ID of effect to remove
 * @returns {Object} Action object
 */
export const removeEffectFromPlayer = (effectId) => ({
  type: REMOVE_EFFECT_FROM_PLAYER,
  payload: effectId
});

// Spirit Strain Management
/**
 * Update the player's spirit strain level
 * @param {number} amount - Amount to change strain by (positive or negative)
 */
export const updateSpiritStrain = (amount) => ({
  type: UPDATE_SPIRIT_STRAIN,
  payload: amount
});

// Card Collection Management
/**
 * Add a card to the player's collection
 * @param {Object} card - Card object to add
 */
export const addCardToCollection = (card) => ({
  type: ADD_CARD_TO_COLLECTION,
  payload: card
});

/**
 * Remove a card from the player's collection
 * @param {string} cardId - ID of card to remove
 */
export const removeCardFromCollection = (cardId) => ({
  type: REMOVE_CARD_FROM_COLLECTION,
  payload: cardId
});

/**
 * Set the player's current deck
 * @param {Array} cards - Array of card objects
 */
export const setDeck = (cards) => ({
  type: SET_DECK,
  payload: cards
});

// Resource Management
/**
 * Update a player resource
 * @param {string} resource - Resource type to update
 * @param {number} amount - Amount to change by
 */
export const updateResource = (resource, amount) => ({
  type: UPDATE_RESOURCE,
  payload: { resource, amount }
});

// Progression System
/**
 * Award experience points to the player
 * @param {number} amount - Amount of experience to gain
 */
export const gainExperience = (amount) => ({
  type: GAIN_EXPERIENCE,
  payload: amount
});

/**
 * Manually trigger a level up
 */
export const levelUp = () => ({
  type: LEVEL_UP
});

// Reputation System
/**
 * Update reputation with a faction
 * @param {string} faction - Faction name
 * @param {number} amount - Amount to change by
 */
export const updateReputation = (faction, amount) => ({
  type: UPDATE_REPUTATION,
  payload: { faction, amount }
});

// Statistics System
/**
 * Update a player statistic
 * @param {string} stat - Statistic to update
 * @param {number} amount - Amount to change by
 */
export const updateStatistic = (stat, amount) => ({
  type: UPDATE_STATISTIC,
  payload: { stat, amount }
});

// Achievement System
/**
 * Unlock an achievement
 * @param {Object} achievement - Achievement object
 */
export const unlockAchievement = (achievement) => ({
  type: UNLOCK_ACHIEVEMENT,
  payload: achievement
});

/**
 * Update progress towards an achievement
 * @param {string} id - Achievement ID
 * @param {number} progress - Current progress value
 */
export const updateAchievementProgress = (id, progress) => ({
  type: UPDATE_ACHIEVEMENT_PROGRESS,
  payload: { id, progress }
});

// Preferences System
/**
 * Update a player preference setting
 * @param {string} key - Preference key
 * @param {*} value - New preference value
 */
export const updatePreference = (key, value) => ({
  type: UPDATE_PREFERENCE,
  payload: { key, value }
});

/**
 * Reset player state to initial values
 * Preserves preferences, card collection, achievements, and statistics
 */
export const resetPlayer = () => ({
  type: RESET_PLAYER
});
