import { RESET_STATE, LOAD_STATE } from '../actions/actionTypes';

// Action types for history management
export const UNDO = '@@history/UNDO';
export const REDO = '@@history/REDO';
export const CLEAR_HISTORY = '@@history/CLEAR';

// Action creators
export const undo = () => ({ type: UNDO });
export const redo = () => ({ type: REDO });
export const clearHistory = () => ({ type: CLEAR_HISTORY });

/**
 * Creates middleware that maintains state history for undo/redo
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Maximum number of states to keep in history
 * @param {string[]} options.filter - Action types to track (undefined = all)
 * @returns {Function} Redux-style middleware
 */
const createHistoryMiddleware = ({ limit = 50, filter } = {}) => {
  let past = [];
  let future = [];
  
  const shouldTrack = (action) => {
    // Don't track history actions themselves
    if ([UNDO, REDO, CLEAR_HISTORY, RESET_STATE, LOAD_STATE].includes(action.type)) {
      return false;
    }
    // If filter is provided, only track specified action types
    return !filter || filter.includes(action.type);
  };

  return store => next => action => {
    switch (action.type) {
      case UNDO: {
        if (past.length === 0) return;
        // Keep current state for redo
        const currentState = store.getState();
        const previousState = past[past.length - 1];

        future = [JSON.parse(JSON.stringify(currentState)), ...future];
        past = past.slice(0, -1);
        return next({ type: LOAD_STATE, payload: JSON.parse(JSON.stringify(previousState)) });
      }

      case REDO: {
        if (future.length === 0) return;
        // Keep current state for undo
        const currentState = store.getState();
        const nextState = JSON.parse(JSON.stringify(future[0]));
        
        // Update history stacks
        past = [...past, JSON.parse(JSON.stringify(currentState))].slice(-limit);
        future = future.slice(1);  // Remove the state we're applying
        return next({ type: LOAD_STATE, payload: JSON.parse(JSON.stringify(nextState)) });
      }

      case CLEAR_HISTORY: {
        past = [];
        future = [];
        return;
      }

      default: {
        if (shouldTrack(action)) {
          const stateBefore = JSON.parse(JSON.stringify(store.getState()));
          const result = next(action);
          past = [...past, stateBefore].slice(-limit);
          future = [];
          return result;
        }
        return next(action);
      }
    }
  };
};

/**
 * Creates middleware for state persistence
 * @param {Object} options - Configuration options
 * @param {string} options.key - LocalStorage key to use
 * @param {Function} options.serialize - State serialization function
 * @param {Function} options.deserialize - State deserialization function
 * @returns {Function} Redux-style middleware
 */
const createPersistenceMiddleware = ({
  key = 'gameState',
  serialize = JSON.stringify,
  deserialize = JSON.parse
} = {}) => {
  return store => next => action => {
    const result = next(action);

    // Save state after each action (except LOAD_STATE to avoid loops)
    if (action.type !== LOAD_STATE) {
      try {
        const state = store.getState();
        localStorage.setItem(key, serialize(state));
      } catch (e) {
        console.warn('Failed to persist state:', e);
      }
    }

    return result;
  };
};

export {
  createHistoryMiddleware,
  createPersistenceMiddleware
};
