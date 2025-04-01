import { SET_SCREEN } from './actionTypes';

/**
 * Action creator for changing the current screen
 * @param {string} screen - The screen to switch to ('title', 'game', 'combat', 'inventory')
 * @returns {Object} Action object
 */
export const setScreen = (screen) => ({
  type: SET_SCREEN,
  payload: screen
});
