import { Store } from './store';
import { rootReducer } from './reducers/rootReducer';

// Actions
export * from './actions/uiActions';
export * from './actions/playerActions';
export * from './actions/combatActions';
export * from './actions/patientActions';
export { RESET_STATE, LOAD_STATE } from './actions/actionTypes';

// Action Types (for custom actions)
export * as ActionTypes from './actions/actionTypes';

// Selectors
export {
  selectScreen
} from './reducers/uiReducer';

export {
  selectPlayerHealth,
  selectPlayerMaxHealth,
  selectPlayerMana,
  selectPlayerMaxMana,
  selectPlayerHand,
  selectPlayerDeck,
  selectPlayerEffects,
  selectPlayerHealthPercentage,
  selectPlayerManaPercentage,
  selectPlayerHandSize,
  selectPlayerDeckSize
} from './reducers/playerReducer';

export {
  selectCombatActive,
  selectCombatTurn,
  selectCombatEnemies,
  selectActiveCard,
  selectSelectedTarget,
  selectRemainingEnemies,
  selectEnemyById,
  selectLowHealthEnemies,
  selectIsTargetSelected
} from './reducers/combatReducer';

export {
  selectWaitingPatients,
  selectCurrentPatient,
  selectTreatedPatients,
  selectWaitingCount,
  selectHasCurrentPatient,
  selectPatientsHealed,
  selectCardsPlayed,
  selectDamageDealt,
  selectHealingDone,
  selectAverageHealingPerPatient,
  selectAverageCardsPerPatient
} from './reducers/patientsReducer';

// Middleware
export {
  createLogger,
  createTimingMiddleware
} from './middleware/logger';

// Import middleware creators explicitly
import {
  createHistoryMiddleware,
  createPersistenceMiddleware
} from './middleware/history';

export {
  createHistoryMiddleware,
  createPersistenceMiddleware,
  undo,
  redo,
  clearHistory
} from './middleware/history';

// Utility functions
export {
  createReducer,
  updateObject,
  updateItemInArray,
  removeItem,
  clamp
} from './reducers/utils';

// Initial state structure
const defaultState = {
  ui: { 
    screen: 'title' 
  },
  player: { 
    health: 100, 
    maxHealth: 100, 
    mana: 100, 
    maxMana: 100 
  },
  combat: { 
    active: false, 
    enemies: [], 
    turn: 0 
  },
  patients: { 
    waiting: [], 
    current: null, 
    treated: [],
    stats: {
      healed: 0,
      cardsPlayed: 0,
      damageDealt: 0,
      healingDone: 0
    }
  }
};

/**
 * Creates and configures a new store with the game's default middleware
 * @param {Object} options - Configuration options
 * @param {boolean} options.debug - Whether to enable debug middleware
 * @param {boolean} options.persistence - Whether to enable state persistence
 * @param {boolean} options.history - Whether to enable undo/redo history
 * @returns {Store} Configured store instance
 */
export const createGameStore = ({
  debug = false,
  persistence = true,
  history = true
} = {}) => {
  const middleware = [];

  // Add development middleware
  if (debug) {
    middleware.push(createLogger());
    middleware.push(createTimingMiddleware());
  }

  // Add persistence middleware
  if (persistence) {
    middleware.push(createPersistenceMiddleware({
      key: 'gameState',
      serialize: JSON.stringify,
      deserialize: JSON.parse
    }));
  }

  // Add history middleware
  if (history) {
    middleware.push(createHistoryMiddleware({
      limit: 50
    }));
  }

  // Create store with frozen initial state
  const store = new Store(rootReducer, defaultState, middleware);
  
  // Get state once to ensure everything is frozen
  store.getState();
  
  return store;
};
