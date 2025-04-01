import {
  UPDATE_PLAYER_HEALTH,
  UPDATE_PLAYER_MANA,
  ADD_CARD_TO_HAND,
  REMOVE_CARD_FROM_HAND,
  ADD_EFFECT_TO_PLAYER,
  REMOVE_EFFECT_FROM_PLAYER,
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

/**
 * Action creator for resetting player state to initial values
 * @returns {Object} Action object
 */
export const resetPlayer = () => ({
  type: RESET_PLAYER
});
