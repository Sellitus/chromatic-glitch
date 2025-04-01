import {
  START_COMBAT,
  END_COMBAT,
  SET_ACTIVE_CARD,
  SET_SELECTED_TARGET,
  UPDATE_ENEMY,
  REMOVE_ENEMY,
  INCREMENT_TURN
} from './actionTypes';

/**
 * Action creator for starting combat with enemies
 * @param {Array} enemies - Array of enemy objects to fight
 * @returns {Object} Action object
 */
export const startCombat = (enemies) => ({
  type: START_COMBAT,
  payload: enemies
});

/**
 * Action creator for ending combat
 * @returns {Object} Action object
 */
export const endCombat = () => ({
  type: END_COMBAT
});

/**
 * Action creator for setting the currently active card
 * @param {Object|null} card - Card object or null if deselecting
 * @returns {Object} Action object
 */
export const setActiveCard = (card) => ({
  type: SET_ACTIVE_CARD,
  payload: card
});

/**
 * Action creator for setting the selected target
 * @param {Object|null} target - Target object or null if deselecting
 * @returns {Object} Action object
 */
export const setSelectedTarget = (target) => ({
  type: SET_SELECTED_TARGET,
  payload: target
});

/**
 * Action creator for updating an enemy's state
 * @param {string} enemyId - ID of enemy to update
 * @param {Object} changes - Object containing state changes to apply
 * @returns {Object} Action object
 */
export const updateEnemy = (enemyId, changes) => ({
  type: UPDATE_ENEMY,
  payload: { enemyId, changes }
});

/**
 * Action creator for removing an enemy from combat
 * @param {string} enemyId - ID of enemy to remove
 * @returns {Object} Action object
 */
export const removeEnemy = (enemyId) => ({
  type: REMOVE_ENEMY,
  payload: enemyId
});

/**
 * Action creator for incrementing the combat turn counter
 * @returns {Object} Action object
 */
export const incrementTurn = () => ({
  type: INCREMENT_TURN
});
