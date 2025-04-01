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
  // Basic stats
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
  selectPlayerDeckSize,
  
  // Spirit Strain
  selectSpiritStrain,
  selectMaxSpiritStrain,
  
  // Card Management
  selectCardCollection,
  
  // Resources
  selectResources,
  selectResource,
  
  // Progression
  selectLevel,
  selectExperience,
  selectExperienceToNext,
  
  // Reputation
  selectReputation,
  selectFactionReputation,
  
  // Statistics
  selectStatistics,
  selectStat,
  
  // Achievements
  selectAchievements,
  selectAchievementProgress,
  
  // Preferences
  selectPreferences,
  selectPreference
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

import {
  createHistoryMiddleware
} from './middleware/history';

import {
  persistenceMiddleware,
  loadPersistedState,
  clearPersistedState
} from './middleware/persistence';

export {
  createHistoryMiddleware,
  undo,
  redo,
  clearHistory
} from './middleware/history';

export {
  persistenceMiddleware,
  loadPersistedState,
  clearPersistedState
} from './middleware/persistence';

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
    // Basic attributes
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    
    // Card management
    deck: [],
    hand: [],
    cardCollection: [],
    
    // Status
    effects: [],
    spiritStrain: 0,
    maxSpiritStrain: 100,
    
    // Resources
    resources: {
      currency: 0,
      materials: 0
    },
    
    // Progression
    level: 1,
    experience: 0,
    experienceToNext: 100,
    
    // Reputation
    reputation: {
      hospital: 0,
      patients: 0,
      community: 0
    },
    
    // Statistics
    statistics: {
      patientsHealed: 0,
      cardsPlayed: 0,
      battlesWon: 0,
      totalDamageDealt: 0,
      totalHealingDone: 0
    },
    
    // Achievements
    achievements: [],
    achievementProgress: {},
    
    // User preferences
    preferences: {
      soundVolume: 1,
      musicVolume: 1,
      uiScale: 1,
      showTutorials: true
    }
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
    const savedState = loadPersistedState();
    if (Object.keys(savedState).length > 0) {
      defaultState.player = { ...defaultState.player, ...savedState };
    }
    middleware.push(persistenceMiddleware);
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
