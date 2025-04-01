import { RESET_STATE, LOAD_STATE } from '../actions/actionTypes';

// State keys that should be persisted
const PERSISTED_KEYS = [
  'cardCollection',
  'preferences',
  'achievements',
  'achievementProgress',
  'statistics',
  'reputation',
  'level',
  'experience'
];

/**
 * Middleware for handling state persistence
 * Automatically saves specified parts of state to localStorage
 */
export const persistenceMiddleware = store => next => action => {
  // First pass the action through the reducers
  const result = next(action);

  // Don't save during state reset/load to avoid recursion
  if (action.type === RESET_STATE || action.type === LOAD_STATE) {
    return result;
  }

  // After state updates, save persistent data
  const state = store.getState();
  const persistentState = {};

  // Only save specified keys
  PERSISTED_KEYS.forEach(key => {
    if (state.player[key] !== undefined) {
      persistentState[key] = state.player[key];
    }
  });

  try {
    localStorage.setItem('playerState', JSON.stringify(persistentState));
  } catch (error) {
    console.error('Failed to save state:', error);
  }

  return result;
};

/**
 * Load persisted state from localStorage
 * @returns {Object} Previously saved state or empty object if none exists
 */
export const loadPersistedState = () => {
  try {
    const savedState = localStorage.getItem('playerState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load persisted state:', error);
  }
  return {};
};

/**
 * Clear all persisted state data
 */
export const clearPersistedState = () => {
  try {
    localStorage.removeItem('playerState');
  } catch (error) {
    console.error('Failed to clear persisted state:', error);
  }
};
