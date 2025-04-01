import { uiReducer } from './uiReducer';
import { playerReducer } from './playerReducer';
import { combatReducer } from './combatReducer';
import { patientsReducer } from './patientsReducer';
import { RESET_STATE, LOAD_STATE } from '../actions/actionTypes';

/**
 * Wraps combined reducer to handle special actions and ensure immutability
 */
export const rootReducer = (state = {}, action) => {
  // Handle global state reset
  if (action.type === RESET_STATE) {
    state = undefined;
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
  return {
    ...nextState,
    combat: {
      ...nextState.combat,
      enemies: Object.freeze([...nextState.combat.enemies])
    },
    patients: {
      ...nextState.patients,
      waiting: Object.freeze([...nextState.patients.waiting]),
      treated: Object.freeze([...nextState.patients.treated])
    }
  };
};
