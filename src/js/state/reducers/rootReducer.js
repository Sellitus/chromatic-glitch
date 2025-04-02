import { uiReducer } from './uiReducer';
import { playerReducer } from './playerReducer';
import { combatReducer } from './combatReducer';
import { patientsReducer } from './patientsReducer';
import { RESET_STATE, LOAD_STATE } from '../actions/actionTypes';

/**
 * Ensure arrays in the state are frozen
 * @param {Object} state - The state object to process
 * @returns {Object} State with frozen arrays
 */
const freezeArrays = (state) => ({
  ...state,
  combat: {
    ...state.combat,
    enemies: Object.freeze([...state.combat.enemies])
  },
  patients: {
    ...state.patients,
    waiting: Object.freeze([...state.patients.waiting]),
    treated: Object.freeze([...state.patients.treated])
  }
});

/**
 * Wraps combined reducer to handle special actions and ensure immutability
 */
export const rootReducer = (state = {}, action) => {
  // Handle global state reset
  if (action.type === RESET_STATE) {
    const resetState = {
      ui: uiReducer(undefined, action),
      player: playerReducer(undefined, action),
      combat: combatReducer(undefined, action),
      patients: patientsReducer(undefined, action)
    };
    return freezeArrays(resetState);
  }

  // Handle global state restore
  if (action.type === LOAD_STATE && action.payload) {
    return {
      ...action.payload,
      // Ensure arrays are immutable
      combat: {
        ...action.payload.combat,
        enemies: Object.freeze([...(action.payload.combat.enemies || [])])
      },
      patients: {
        ...action.payload.patients,
        waiting: Object.freeze([...(action.payload.patients.waiting || [])]),
        treated: Object.freeze([...(action.payload.patients.treated || [])])
      }
    };
  }

  // Apply individual reducers
  const nextState = {
    ui: uiReducer(state.ui, action),
    player: playerReducer(state.player, action),
    combat: combatReducer(state.combat, action),
    patients: patientsReducer(state.patients, action)
  };

  // Ensure arrays are frozen
  return freezeArrays(nextState);
};
